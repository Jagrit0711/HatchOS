from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
import base64
from werkzeug.utils import secure_filename
import re
import logging
from logging.handlers import RotatingFileHandler
import sys
import requests
import json
import threading
import time

# Gemini AI Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', "AIzaSyBKGyLawL7t7xEcEHIDwzaG2hFSsDDAmyM")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Setup logging to capture EVERYTHING
if not os.path.exists('logs'):
    os.makedirs('logs')

# Custom handler that writes to file
class ConsoleAndFileHandler(logging.Handler):
    def __init__(self, filename):
        super().__init__()
        self.filename = filename
        self.file = open(filename, 'a', encoding='utf-8')
    
    def emit(self, record):
        try:
            msg = self.format(record)
            self.file.write(msg + '\n')
            self.file.flush()
        except:
            pass

# Clear old console log
console_log = 'logs/console.log'
with open(console_log, 'w', encoding='utf-8') as f:
    f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] HatchOS Server Starting...\n")

# Setup logging for werkzeug (Flask's built-in server)
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_handler = ConsoleAndFileHandler(console_log)
werkzeug_handler.setFormatter(logging.Formatter('%(message)s'))
werkzeug_logger.addHandler(werkzeug_handler)

# Setup app logger
app_handler = ConsoleAndFileHandler(console_log)
app_handler.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s'))
app.logger.addHandler(app_handler)
app.logger.setLevel(logging.INFO)

# MongoDB Configuration
client = MongoClient('mongodb://localhost:27017/')
db = client['hatchos_db']

# Collections
users_collection = db['users']
messages_collection = db['messages']
groups_collection = db['groups']
files_collection = db['files']
subjects_collection = db['subjects']
assignments_collection = db['assignments']
resources_collection = db['resources']
enrollments_collection = db['enrollments']

# Upload folder for files
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

# AI-based content moderation (rule-based, no LLM)
RESTRICTED_KEYWORDS = [
    'password', 'otp', 'pin', 'passcode', 'fuck', 'shit', 'bitch', 'ass',
    'damn', 'hell', 'dick', 'porn', 'nude', 'nudes', 'sex', 'sexy'
]

def moderate_content(text):
    """AI-powered content moderation system"""
    if not text:
        return True, ""
    
    text_lower = text.lower()
    
    # Check for restricted keywords
    for keyword in RESTRICTED_KEYWORDS:
        if keyword in text_lower:
            return False, f"Message blocked: Contains restricted content"
    
    # Check for patterns (OTP detection)
    otp_pattern = r'\b\d{4,6}\b'
    if re.search(otp_pattern, text):
        if any(word in text_lower for word in ['otp', 'code', 'verification', 'verify']):
            return False, "Message blocked: Sharing OTPs is not allowed"
    
    return True, ""

# User Management
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if user exists
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'error': 'User already exists'}), 400
    
    user = {
        'name': data['name'],
        'email': data['email'],
        'password': data['password'],  # In production, hash this!
        'role': data.get('role', 'student'),  # student, teacher, admin
        'grade': data.get('grade', ''),
        'section': data.get('section', ''),
        'class': data.get('class', ''),
        'teaching_classes': data.get('teaching_classes', ''),
        'phone': data.get('phone', ''),
        'avatar': data.get('avatar', ''),
        'created_at': datetime.now(),
        'status': 'offline',
        'last_seen': datetime.now()
    }
    
    result = users_collection.insert_one(user)
    user['_id'] = str(result.inserted_id)
    
    return jsonify({'message': 'User registered successfully', 'user': serialize_user(user)}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    app.logger.info(f"Login attempt for email: {data.get('email', 'unknown')}")
    user = users_collection.find_one({'email': data['email'], 'password': data['password']})
    
    if not user:
        app.logger.warning(f"Failed login attempt for: {data.get('email', 'unknown')}")
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Update status
    users_collection.update_one(
        {'_id': user['_id']},
        {'$set': {'status': 'online', 'last_seen': datetime.now()}}
    )
    
    app.logger.info(f"Successful login: {user['name']} ({user['email']})")
    return jsonify({'message': 'Login successful', 'user': serialize_user(user)}), 200

@app.route('/api/users/<user_id>/status', methods=['PUT'])
def update_status(user_id):
    data = request.json
    users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {'status': data['status'], 'last_seen': datetime.now()}}
    )
    return jsonify({'message': 'Status updated'}), 200

@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Update allowed fields
    update_data = {}
    if 'phone' in data:
        update_data['phone'] = data['phone']
    if 'profile_photo' in data:
        update_data['profile_photo'] = data['profile_photo']
    if 'name' in data:
        update_data['name'] = data['name']
    if 'email' in data:
        update_data['email'] = data['email']
    if 'grade' in data:
        update_data['grade'] = data['grade']
    if 'class' in data:
        update_data['class'] = data['class']
    if 'section' in data:
        update_data['section'] = data['section']
    if 'teaching_classes' in data:
        update_data['teaching_classes'] = data['teaching_classes']
    
    if update_data:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        user = users_collection.find_one({'_id': ObjectId(user_id)})
    
    return jsonify({'message': 'User updated successfully', 'user': serialize_user(user)}), 200

@app.route('/api/users', methods=['GET'])
def get_users():
    role = request.args.get('role')
    query = {'role': role} if role else {}
    users = list(users_collection.find(query))
    return jsonify([serialize_user(user) for user in users]), 200

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(serialize_user(user)), 200

# Direct Messages
@app.route('/api/messages/send', methods=['POST'])
def send_message():
    data = request.json
    
    # AI content moderation
    if data['type'] == 'text':
        is_safe, reason = moderate_content(data['content'])
        if not is_safe:
            return jsonify({'error': reason}), 400
    
    message = {
        'sender_id': data['sender_id'],
        'receiver_id': data.get('receiver_id'),
        'group_id': data.get('group_id'),
        'type': data['type'],  # text, file, audio, video, image
        'content': data.get('content', ''),
        'file_url': data.get('file_url', ''),
        'file_name': data.get('file_name', ''),
        'file_size': data.get('file_size', 0),
        'timestamp': datetime.now(),
        'read': False,
        'delivered': True
    }
    
    result = messages_collection.insert_one(message)
    message['_id'] = str(result.inserted_id)
    
    return jsonify({'message': 'Message sent', 'data': serialize_message(message)}), 201

@app.route('/api/messages/direct/<user1_id>/<user2_id>', methods=['GET'])
def get_direct_messages(user1_id, user2_id):
    messages = list(messages_collection.find({
        '$or': [
            {'sender_id': user1_id, 'receiver_id': user2_id},
            {'sender_id': user2_id, 'receiver_id': user1_id}
        ]
    }).sort('timestamp', 1))
    
    return jsonify([serialize_message(msg) for msg in messages]), 200

@app.route('/api/messages/<message_id>/read', methods=['PUT'])
def mark_as_read(message_id):
    messages_collection.update_one(
        {'_id': ObjectId(message_id)},
        {'$set': {'read': True}}
    )
    return jsonify({'message': 'Marked as read'}), 200

# Groups
@app.route('/api/groups/create', methods=['POST'])
def create_group():
    data = request.json
    
    group = {
        'name': data['name'],
        'description': data.get('description', ''),
        'avatar': data.get('avatar', ''),
        'created_by': data['created_by'],
        'members': data['members'],  # List of user IDs
        'admins': data.get('admins', [data['created_by']]),
        'type': data.get('type', 'class'),  # class, subject, club, etc.
        'created_at': datetime.now()
    }
    
    result = groups_collection.insert_one(group)
    group['_id'] = str(result.inserted_id)
    
    return jsonify({'message': 'Group created', 'group': serialize_group(group)}), 201

@app.route('/api/groups/<group_id>', methods=['GET'])
def get_group(group_id):
    group = groups_collection.find_one({'_id': ObjectId(group_id)})
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    return jsonify(serialize_group(group)), 200

@app.route('/api/groups/<group_id>', methods=['PUT'])
def update_group(group_id):
    data = request.json
    group = groups_collection.find_one({'_id': ObjectId(group_id)})
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    # Update allowed fields
    update_data = {}
    if 'name' in data:
        update_data['name'] = data['name']
    if 'description' in data:
        update_data['description'] = data['description']
    
    if update_data:
        groups_collection.update_one(
            {'_id': ObjectId(group_id)},
            {'$set': update_data}
        )
        group = groups_collection.find_one({'_id': ObjectId(group_id)})
    
    return jsonify({'message': 'Group updated successfully', 'group': serialize_group(group)}), 200

@app.route('/api/groups/<group_id>/members/<user_id>/role', methods=['PUT'])
def update_member_role(group_id, user_id):
    data = request.json
    is_admin = data.get('is_admin', False)
    
    group = groups_collection.find_one({'_id': ObjectId(group_id)})
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    if is_admin:
        # Add to admins
        groups_collection.update_one(
            {'_id': ObjectId(group_id)},
            {'$addToSet': {'admins': user_id}}
        )
    else:
        # Remove from admins
        groups_collection.update_one(
            {'_id': ObjectId(group_id)},
            {'$pull': {'admins': user_id}}
        )
    
    return jsonify({'message': 'Member role updated'}), 200

@app.route('/api/groups/user/<user_id>', methods=['GET'])
def get_user_groups(user_id):
    groups = list(groups_collection.find({'members': user_id}))
    return jsonify([serialize_group(group) for group in groups]), 200

@app.route('/api/groups/<group_id>/messages', methods=['GET'])
def get_group_messages(group_id):
    messages = list(messages_collection.find({'group_id': group_id}).sort('timestamp', 1))
    return jsonify([serialize_message(msg) for msg in messages]), 200

@app.route('/api/groups/<group_id>/members', methods=['POST'])
def add_group_member(group_id):
    data = request.json
    groups_collection.update_one(
        {'_id': ObjectId(group_id)},
        {'$addToSet': {'members': data['user_id']}}
    )
    return jsonify({'message': 'Member added'}), 200

@app.route('/api/groups/<group_id>/members/<user_id>', methods=['DELETE'])
def remove_group_member(group_id, user_id):
    groups_collection.update_one(
        {'_id': ObjectId(group_id)},
        {'$pull': {'members': user_id}}
    )
    return jsonify({'message': 'Member removed'}), 200

# File Upload
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    
    # Check for offensive content in filename
    is_safe, reason = moderate_content(filename)
    if not is_safe:
        return jsonify({'error': 'File blocked: Filename contains inappropriate content'}), 400
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{timestamp}_{filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    file.save(file_path)
    
    file_doc = {
        'original_name': filename,
        'stored_name': unique_filename,
        'path': file_path,
        'size': os.path.getsize(file_path),
        'uploaded_by': request.form.get('user_id'),
        'uploaded_at': datetime.now()
    }
    
    result = files_collection.insert_one(file_doc)
    
    return jsonify({
        'message': 'File uploaded',
        'file_url': f'/uploads/{unique_filename}',
        'file_name': filename,
        'file_size': file_doc['size']
    }), 201

@app.route('/uploads/<filename>', methods=['GET'])
def get_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Conversations List
@app.route('/api/conversations/<user_id>', methods=['GET'])
def get_conversations(user_id):
    # Get all direct messages
    direct_messages = list(messages_collection.find({
        '$or': [{'sender_id': user_id}, {'receiver_id': user_id}]
    }))
    
    # Get unique conversation partners
    conversation_partners = set()
    for msg in direct_messages:
        if msg['sender_id'] == user_id and msg.get('receiver_id'):
            conversation_partners.add(msg['receiver_id'])
        elif msg.get('receiver_id') == user_id:
            conversation_partners.add(msg['sender_id'])
    
    conversations = []
    for partner_id in conversation_partners:
        partner = users_collection.find_one({'_id': ObjectId(partner_id)})
        last_message = messages_collection.find_one(
            {
                '$or': [
                    {'sender_id': user_id, 'receiver_id': partner_id},
                    {'sender_id': partner_id, 'receiver_id': user_id}
                ]
            },
            sort=[('timestamp', -1)]
        )
        
        if partner and last_message:
            conversations.append({
                'type': 'direct',
                'partner': serialize_user(partner),
                'last_message': serialize_message(last_message),
                'unread_count': messages_collection.count_documents({
                    'sender_id': partner_id,
                    'receiver_id': user_id,
                    'read': False
                })
            })
    
    # Get group conversations
    user_groups = list(groups_collection.find({'members': user_id}))
    for group in user_groups:
        last_message = messages_collection.find_one(
            {'group_id': str(group['_id'])},
            sort=[('timestamp', -1)]
        )
        
        conversations.append({
            'type': 'group',
            'group': serialize_group(group),
            'last_message': serialize_message(last_message) if last_message else None,
            'unread_count': 0  # Implement if needed
        })
    
    # Sort by last message timestamp
    def get_sort_key(conv):
        if conv['last_message'] and 'timestamp' in conv['last_message']:
            try:
                if isinstance(conv['last_message']['timestamp'], str):
                    return conv['last_message']['timestamp']
                return conv['last_message']['timestamp'].isoformat()
            except:
                return ''
        return ''
    
    conversations.sort(key=get_sort_key, reverse=True)
    
    return jsonify(conversations), 200

# MyClass Endpoints

# User login (simplified for MyClass - email/password)
@app.route('/api/users/login', methods=['POST'])
def myclass_login():
    data = request.json
    app.logger.info(f"MyClass login attempt for email: {data.get('username', 'unknown')}")
    # Try both email and username for backward compatibility
    user = users_collection.find_one({'email': data['username'], 'password': data['password']})
    if not user:
        # Fallback to username field
        user = users_collection.find_one({'name': data['username'], 'password': data['password']})
    
    if not user:
        app.logger.warning(f"Failed login attempt for: {data.get('username', 'unknown')}")
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Update status
    users_collection.update_one(
        {'_id': user['_id']},
        {'$set': {'status': 'online', 'last_seen': datetime.now()}}
    )
    
    app.logger.info(f"Successful login: {user['name']} ({user.get('role', 'student')})")
    return jsonify({'message': 'Login successful', 'user': serialize_user(user)}), 200

# Subjects
@app.route('/api/subjects', methods=['GET', 'POST'])
def subjects():
    if request.method == 'GET':
        user_id = request.args.get('userId')
        role = request.args.get('role')
        
        # Admin can see all subjects
        if role == 'admin':
            subjects_list = list(subjects_collection.find({}))
            # Add enrollment counts
            for subject in subjects_list:
                subject_id = str(subject['_id'])
                subject['enrolledCount'] = enrollments_collection.count_documents({'subject_id': subject_id})
                subject['assignmentCount'] = assignments_collection.count_documents({'subject_id': subject_id})
                subject['resourceCount'] = resources_collection.count_documents({'subject_id': subject_id})
            return jsonify({'subjects': [serialize_subject(s) for s in subjects_list]}), 200
        
        if not user_id or not role:
            return jsonify({'error': 'userId and role required'}), 400
        
        if role == 'teacher':
            # Get subjects taught by teacher
            subjects_list = list(subjects_collection.find({'teacher_id': user_id}))
        else:
            # Get subjects student is enrolled in
            enrollments = list(enrollments_collection.find({'student_id': user_id}))
            subject_ids = [e['subject_id'] for e in enrollments]
            subjects_list = list(subjects_collection.find({'_id': {'$in': [ObjectId(sid) for sid in subject_ids]}}))
        
        # Add assignment and resource counts
        for subject in subjects_list:
            subject_id = str(subject['_id'])
            subject['assignmentCount'] = assignments_collection.count_documents({'subject_id': subject_id})
            subject['resourceCount'] = resources_collection.count_documents({'subject_id': subject_id})
        
        return jsonify({'subjects': [serialize_subject(s) for s in subjects_list]}), 200
    
    elif request.method == 'POST':
        data = request.json
        
        subject = {
            'name': data['name'],
            'code': data.get('code', ''),
            'teacher_id': data.get('teacherId', ''),
            'created_at': datetime.now(),
        }
        
        result = subjects_collection.insert_one(subject)
        subject['_id'] = str(result.inserted_id)
        
        return jsonify({'message': 'Subject created', 'subject': serialize_subject(subject)}), 201

@app.route('/api/subjects/<subject_id>', methods=['GET'])
def get_subject(subject_id):
    subject = subjects_collection.find_one({'_id': ObjectId(subject_id)})
    if not subject:
        return jsonify({'error': 'Subject not found'}), 404
    return jsonify({'subject': serialize_subject(subject)}), 200

@app.route('/api/subjects/<subject_id>', methods=['PUT'])
def update_subject(subject_id):
    data = request.json
    
    update_data = {}
    if 'name' in data:
        update_data['name'] = data['name']
    if 'code' in data:
        update_data['code'] = data['code']
    if 'teacherId' in data:
        update_data['teacher_id'] = data['teacherId']
    
    if update_data:
        subjects_collection.update_one(
            {'_id': ObjectId(subject_id)},
            {'$set': update_data}
        )
    
    subject = subjects_collection.find_one({'_id': ObjectId(subject_id)})
    return jsonify({'message': 'Subject updated', 'subject': serialize_subject(subject)}), 200

@app.route('/api/subjects/<subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    # Delete subject and all related enrollments
    subjects_collection.delete_one({'_id': ObjectId(subject_id)})
    enrollments_collection.delete_many({'subject_id': subject_id})
    
    return jsonify({'message': 'Subject deleted'}), 200

# Enrollments
@app.route('/api/enrollments', methods=['GET'])
def get_enrollments():
    subject_id = request.args.get('subjectId')
    
    if subject_id:
        enrollments = list(enrollments_collection.find({'subject_id': subject_id}))
    else:
        enrollments = list(enrollments_collection.find({}))
    
    return jsonify({'enrollments': [{'student_id': e['student_id'], 'subject_id': e['subject_id']} for e in enrollments]}), 200

@app.route('/api/enrollments/<subject_id>', methods=['PUT'])
def update_enrollments(subject_id):
    data = request.json
    student_ids = data.get('studentIds', [])
    
    # Remove all existing enrollments for this subject
    enrollments_collection.delete_many({'subject_id': subject_id})
    
    # Add new enrollments
    if student_ids:
        enrollments = [
            {
                'subject_id': subject_id,
                'student_id': student_id,
                'enrolled_at': datetime.now()
            }
            for student_id in student_ids
        ]
        enrollments_collection.insert_many(enrollments)
    
    return jsonify({'message': 'Enrollments updated'}), 200

# Assignments
@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    user_id = request.args.get('userId')
    role = request.args.get('role')
    subject_id = request.args.get('subjectId')
    
    if not user_id or not role:
        return jsonify({'error': 'userId and role required'}), 400
    
    query = {}
    
    if subject_id:
        query['subject_id'] = subject_id
    else:
        if role == 'teacher':
            query['teacher_id'] = user_id
        else:
            # Get student's enrolled subjects
            enrollments = list(enrollments_collection.find({'student_id': user_id}))
            subject_ids = [e['subject_id'] for e in enrollments]
            query['subject_id'] = {'$in': subject_ids}
    
    assignments = list(assignments_collection.find(query).sort('due_date', 1))
    
    # Add subject name to each assignment
    for assignment in assignments:
        subject = subjects_collection.find_one({'_id': ObjectId(assignment['subject_id'])})
        if subject:
            assignment['subjectName'] = subject['name']
    
    return jsonify({'assignments': [serialize_assignment(a) for a in assignments]}), 200

@app.route('/api/assignments', methods=['POST'])
def create_assignment():
    data = request.json
    
    assignment = {
        'title': data['title'],
        'description': data.get('description', ''),
        'subject_id': data['subjectId'],
        'teacher_id': data['teacherId'],
        'due_date': datetime.fromisoformat(data['dueDate'].replace('Z', '+00:00')) if data.get('dueDate') else None,
        'max_grade': data.get('maxGrade', 100),
        'attachment_name': data.get('attachmentName', ''),
        'attachment_uri': data.get('attachmentUri', ''),
        'attachment_size': data.get('attachmentSize', 0),
        'created_at': datetime.now(),
    }
    
    result = assignments_collection.insert_one(assignment)
    assignment['_id'] = str(result.inserted_id)
    
    return jsonify({'message': 'Assignment created', 'assignment': serialize_assignment(assignment)}), 201

# Resources
@app.route('/api/resources', methods=['GET'])
def get_resources():
    user_id = request.args.get('userId')
    role = request.args.get('role')
    subject_id = request.args.get('subjectId')
    
    if not user_id or not role:
        return jsonify({'error': 'userId and role required'}), 400
    
    query = {}
    
    if subject_id:
        query['subject_id'] = subject_id
    else:
        if role == 'teacher':
            query['teacher_id'] = user_id
        else:
            # Get student's enrolled subjects
            enrollments = list(enrollments_collection.find({'student_id': user_id}))
            subject_ids = [e['subject_id'] for e in enrollments]
            query['subject_id'] = {'$in': subject_ids}
    
    resources = list(resources_collection.find(query).sort('created_at', -1))
    
    return jsonify({'resources': [serialize_resource(r) for r in resources]}), 200

@app.route('/api/resources', methods=['POST'])
def create_resource():
    data = request.json
    
    resource = {
        'title': data['title'],
        'description': data.get('description', ''),
        'url': data.get('url', ''),
        'file_name': data.get('fileName', ''),
        'file_uri': data.get('fileUri', ''),
        'file_size': data.get('fileSize', 0),
        'subject_id': data['subjectId'],
        'teacher_id': data['teacherId'],
        'created_at': datetime.now(),
    }
    
    result = resources_collection.insert_one(resource)
    resource['_id'] = str(result.inserted_id)
    
    return jsonify({'message': 'Resource created', 'resource': serialize_resource(resource)}), 201

# Update Assignment
@app.route('/api/assignments/<assignment_id>', methods=['PUT'])
def update_assignment(assignment_id):
    data = request.json
    
    update_data = {}
    if 'title' in data:
        update_data['title'] = data['title']
    if 'description' in data:
        update_data['description'] = data['description']
    if 'dueDate' in data:
        update_data['due_date'] = datetime.fromisoformat(data['dueDate'].replace('Z', '+00:00'))
    if 'maxGrade' in data:
        update_data['max_grade'] = data['maxGrade']
    if 'attachmentName' in data:
        update_data['attachment_name'] = data['attachmentName']
    if 'attachmentUri' in data:
        update_data['attachment_uri'] = data['attachmentUri']
    if 'attachmentSize' in data:
        update_data['attachment_size'] = data['attachmentSize']
    
    assignments_collection.update_one(
        {'_id': ObjectId(assignment_id)},
        {'$set': update_data}
    )
    
    assignment = assignments_collection.find_one({'_id': ObjectId(assignment_id)})
    return jsonify({'message': 'Assignment updated', 'assignment': serialize_assignment(assignment)}), 200

# Delete Assignment
@app.route('/api/assignments/<assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    assignments_collection.delete_one({'_id': ObjectId(assignment_id)})
    return jsonify({'message': 'Assignment deleted'}), 200

# Update Resource
@app.route('/api/resources/<resource_id>', methods=['PUT'])
def update_resource(resource_id):
    data = request.json
    app.logger.info(f"Updating resource {resource_id} with data: {data}")
    
    update_data = {}
    if 'title' in data:
        update_data['title'] = data['title']
    if 'description' in data:
        update_data['description'] = data['description']
    if 'url' in data:
        update_data['url'] = data['url']
    if 'fileName' in data:
        update_data['file_name'] = data['fileName']
    if 'fileUri' in data:
        update_data['file_uri'] = data['fileUri']
    if 'fileSize' in data:
        update_data['file_size'] = data['fileSize']
    
    app.logger.info(f"Update data to be saved: {update_data}")
    
    resources_collection.update_one(
        {'_id': ObjectId(resource_id)},
        {'$set': update_data}
    )
    
    resource = resources_collection.find_one({'_id': ObjectId(resource_id)})
    return jsonify({'message': 'Resource updated', 'resource': serialize_resource(resource)}), 200

# Delete Resource
@app.route('/api/resources/<resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    resources_collection.delete_one({'_id': ObjectId(resource_id)})
    return jsonify({'message': 'Resource deleted'}), 200

# Submissions Collection
submissions_collection = db['submissions']

# Devices Collection (for HatchOS Core)
devices_collection = db['devices']
violations_collection = db['violations']
exam_sessions_collection = db['exam_sessions']
screenshots_collection = db['screenshots']
activity_logs_collection = db['activity_logs']

# Submit Assignment
@app.route('/api/submissions', methods=['POST'])
def submit_assignment():
    data = request.json
    
    submission = {
        'assignment_id': data['assignmentId'],
        'student_id': data['studentId'],
        'student_name': data.get('studentName', ''),
        'url': data.get('url', ''),
        'file_name': data.get('fileName', ''),
        'file_uri': data.get('fileUri', ''),
        'file_size': data.get('fileSize', 0),
        'notes': data.get('notes', ''),
        'submitted_at': datetime.now(),
        'grade': None,
        'feedback': None,
        'graded_at': None,
    }
    
    # Check if already submitted
    existing = submissions_collection.find_one({
        'assignment_id': data['assignmentId'],
        'student_id': data['studentId']
    })
    
    if existing:
        submissions_collection.update_one(
            {'_id': existing['_id']},
            {'$set': submission}
        )
        submission['_id'] = existing['_id']
    else:
        result = submissions_collection.insert_one(submission)
        submission['_id'] = result.inserted_id
    
    return jsonify({'message': 'Assignment submitted', 'submission': serialize_submission(submission)}), 201

# Get Submissions for Assignment
@app.route('/api/submissions/<assignment_id>', methods=['GET'])
def get_submissions(assignment_id):
    submissions = list(submissions_collection.find({'assignment_id': assignment_id}))
    return jsonify({'submissions': [serialize_submission(s) for s in submissions]}), 200

# Grade Submission
@app.route('/api/submissions/<submission_id>/grade', methods=['PUT'])
def grade_submission(submission_id):
    data = request.json
    
    update_data = {
        'grade': data.get('grade', ''),
        'feedback': data.get('feedback', ''),
        'graded_at': datetime.now(),
    }
    
    submissions_collection.update_one(
        {'_id': ObjectId(submission_id)},
        {'$set': update_data}
    )
    
    submission = submissions_collection.find_one({'_id': ObjectId(submission_id)})
    return jsonify({'message': 'Submission graded', 'submission': serialize_submission(submission)}), 200

def serialize_submission(submission):
    return {
        '_id': str(submission['_id']),
        'assignmentId': submission.get('assignment_id', ''),
        'assignment_id': submission.get('assignment_id', ''),  # Keep for backward compatibility
        'studentId': submission.get('student_id', ''),
        'student_id': submission.get('student_id', ''),  # Keep for backward compatibility
        'studentName': submission.get('student_name', ''),
        'url': submission.get('url', ''),
        'fileName': submission.get('file_name', ''),
        'fileUri': submission.get('file_uri', ''),
        'fileSize': submission.get('file_size', 0),
        'notes': submission.get('notes', ''),
        'submittedAt': submission.get('submitted_at').isoformat() if submission.get('submitted_at') else None,
        'grade': submission.get('grade'),
        'feedback': submission.get('feedback'),
        'gradedAt': submission.get('graded_at').isoformat() if submission.get('graded_at') else None,
    }

# Helper functions
def serialize_user(user):
    user_id = str(user['_id'])
    return {
        'id': user_id,
        '_id': user_id,  # For MyClass compatibility
        'name': user['name'],
        'email': user['email'],
        'role': user['role'],
        'grade': user.get('grade', ''),
        'section': user.get('section', ''),
        'class': user.get('class', ''),
        'teaching_classes': user.get('teaching_classes', ''),
        'avatar': user.get('avatar', ''),
        'profile_photo': user.get('profile_photo', ''),
        'phone': user.get('phone', ''),
        'status': user.get('status', 'offline'),
        'last_seen': user.get('last_seen').isoformat() if user.get('last_seen') else None
    }

def serialize_message(message):
    return {
        'id': str(message['_id']),
        'sender_id': message['sender_id'],
        'receiver_id': message.get('receiver_id'),
        'group_id': message.get('group_id'),
        'type': message['type'],
        'content': message.get('content', ''),
        'file_url': message.get('file_url', ''),
        'file_name': message.get('file_name', ''),
        'file_size': message.get('file_size', 0),
        'timestamp': message['timestamp'].isoformat(),
        'read': message.get('read', False),
        'delivered': message.get('delivered', True)
    }

def serialize_group(group):
    return {
        'id': str(group['_id']),
        'name': group['name'],
        'description': group.get('description', ''),
        'avatar': group.get('avatar', ''),
        'created_by': group['created_by'],
        'members': group['members'],
        'admins': group.get('admins', []),
        'type': group.get('type', 'class'),
        'created_at': group['created_at'].isoformat()
    }

def serialize_subject(subject):
    return {
        '_id': str(subject['_id']),
        'name': subject['name'],
        'code': subject.get('code', ''),
        'teacher_id': subject.get('teacher_id', ''),
        'assignmentCount': subject.get('assignmentCount', 0),
        'resourceCount': subject.get('resourceCount', 0),
        'enrolledCount': subject.get('enrolledCount', 0),
    }

def serialize_assignment(assignment):
    return {
        '_id': str(assignment['_id']),
        'title': assignment['title'],
        'description': assignment.get('description', ''),
        'subject_id': assignment.get('subject_id', ''),
        'subjectName': assignment.get('subjectName', ''),
        'teacher_id': assignment.get('teacher_id', ''),
        'dueDate': assignment.get('due_date').isoformat() if assignment.get('due_date') else None,
        'maxGrade': assignment.get('max_grade', 100),
        'attachmentName': assignment.get('attachment_name', ''),
        'attachmentUri': assignment.get('attachment_uri', ''),
        'attachmentSize': assignment.get('attachment_size', 0),
        'createdAt': assignment.get('created_at').isoformat() if assignment.get('created_at') else None,
    }

def serialize_resource(resource):
    return {
        '_id': str(resource['_id']),
        'title': resource['title'],
        'description': resource.get('description', ''),
        'url': resource.get('url', ''),
        'fileName': resource.get('file_name', ''),
        'fileUri': resource.get('file_uri', ''),
        'fileSize': resource.get('file_size', 0),
        'subject_id': resource.get('subject_id', ''),
        'teacher_id': resource.get('teacher_id', ''),
        'createdAt': resource.get('created_at').isoformat() if resource.get('created_at') else None,
    }

# Endpoint to get server logs
@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        lines = int(request.args.get('lines', 100))
        log_file = 'logs/server.log'
        
        if not os.path.exists(log_file):
            return jsonify({'logs': []})
        
        with open(log_file, 'r') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            return jsonify({'logs': [line.strip() for line in recent_lines]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint to get console output (stdout/stderr)
@app.route('/api/console-logs', methods=['GET'])
def get_console_logs():
    try:
        lines = int(request.args.get('lines', 100))
        log_file = 'logs/console.log'
        
        if not os.path.exists(log_file):
            return jsonify({'logs': ['[INFO] No console logs available yet. Start server with run_server.py']})
        
        with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
            return jsonify({'logs': [line.rstrip('\n') for line in recent_lines]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# HatchOS Core - Device Management Endpoints

@app.route('/api/devices/register', methods=['POST'])
def register_device():
    data = request.json
    app.logger.info(f"Device registration request: {data.get('deviceName')}")
    
    device = {
        'user_id': data['userId'],
        'device_name': data['deviceName'],
        'device_info': data.get('deviceInfo', {}),
        'is_locked': False,
        'lock_reason': '',
        'exam_mode': False,
        'exam_data': None,
        'last_heartbeat': datetime.now(),
        'registered_at': datetime.now(),
        'status': 'active',
    }
    
    # Check if device already exists for this user
    existing = devices_collection.find_one({
        'user_id': data['userId'],
        'device_info.ipAddress': data.get('deviceInfo', {}).get('ipAddress')
    })
    
    if existing:
        device_id = str(existing['_id'])
        devices_collection.update_one(
            {'_id': existing['_id']},
            {'$set': {
                'device_name': data['deviceName'],
                'device_info': data.get('deviceInfo', {}),
                'last_heartbeat': datetime.now()
            }}
        )
    else:
        result = devices_collection.insert_one(device)
        device_id = str(result.inserted_id)
    
    app.logger.info(f"Device registered: {device_id}")
    return jsonify({'message': 'Device registered', 'deviceId': device_id}), 201

@app.route('/api/devices/<device_id>/status', methods=['GET'])
def get_device_status(device_id):
    device = devices_collection.find_one({'_id': ObjectId(device_id)})
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    return jsonify({
        'isLocked': device.get('is_locked', False),
        'lockReason': device.get('lock_reason', ''),
        'examMode': device.get('exam_mode', False),
        'examData': device.get('exam_data'),
        'has_violation': device.get('has_violation', False),
        'violation_reason': device.get('violation_reason', ''),
        'lastHeartbeat': device.get('last_heartbeat').isoformat() if device.get('last_heartbeat') else None,
    }), 200

@app.route('/api/devices/<device_id>/heartbeat', methods=['POST'])
def device_heartbeat(device_id):
    data = request.json
    
    devices_collection.update_one(
        {'_id': ObjectId(device_id)},
        {'$set': {
            'last_heartbeat': datetime.now(),
            'device_info': data.get('deviceInfo', {}),
            'app_state': data.get('appState', 'unknown')
        }}
    )
    
    return jsonify({'message': 'Heartbeat received'}), 200

@app.route('/api/devices/<device_id>/lock', methods=['PUT'])
def lock_device(device_id):
    data = request.json
    
    devices_collection.update_one(
        {'_id': ObjectId(device_id)},
        {'$set': {
            'is_locked': True,
            'lock_reason': data.get('reason', 'Device locked by administrator'),
            'locked_at': datetime.now(),
            'locked_by': data.get('adminId')
        }}
    )
    
    app.logger.info(f"Device locked: {device_id}")
    return jsonify({'message': 'Device locked'}), 200

@app.route('/api/devices/<device_id>/unlock', methods=['PUT'])
def unlock_device(device_id):
    devices_collection.update_one(
        {'_id': ObjectId(device_id)},
        {'$set': {
            'is_locked': False,
            'lock_reason': '',
            'unlocked_at': datetime.now()
        }}
    )
    
    app.logger.info(f"Device unlocked: {device_id}")
    return jsonify({'message': 'Device unlocked'}), 200

@app.route('/api/devices/<device_id>/exam-mode', methods=['PUT'])
def set_exam_mode(device_id):
    data = request.json
    
    exam_data = {
        'name': data.get('examName', 'Examination'),
        'className': data.get('className', ''),
        'startTime': datetime.now().isoformat(),
        'endTime': data.get('endTime'),
        'allowedApps': data.get('allowedApps', []),
    }
    
    devices_collection.update_one(
        {'_id': ObjectId(device_id)},
        {'$set': {
            'exam_mode': data.get('enabled', True),
            'exam_data': exam_data if data.get('enabled', True) else None,
        }}
    )
    
    # Create exam session record
    if data.get('enabled', True):
        exam_sessions_collection.insert_one({
            'device_id': device_id,
            'exam_data': exam_data,
            'started_at': datetime.now(),
            'violations': []
        })
    
    action = 'enabled' if data.get('enabled', True) else 'disabled'
    app.logger.info(f"Exam mode {action} for device: {device_id}")
    return jsonify({'message': f'Exam mode {action}'}), 200

@app.route('/api/devices/<device_id>/violation', methods=['POST'])
def report_violation(device_id):
    data = request.json
    
    violation = {
        'device_id': device_id,
        'user_id': data.get('userId'),
        'violation_type': data.get('violationType'),
        'details': data.get('details', {}),
        'timestamp': datetime.now(),
        'resolved': False,
    }
    
    result = violations_collection.insert_one(violation)
    
    app.logger.warning(f"Violation reported for device {device_id}: {data.get('violationType')}")
    return jsonify({'message': 'Violation reported', 'violationId': str(result.inserted_id)}), 201

@app.route('/api/devices/<device_id>/analyze-screen', methods=['POST'])
def analyze_screen(device_id):
    data = request.json
    
    app.logger.info(f"Screen analysis requested for device: {device_id}")
    
    # Store screenshot for admin viewing
    screenshot_data = {
        'device_id': device_id,
        'timestamp': datetime.now(),
        'running_apps': data.get('runningApps', []),
        'screenshot_base64': data.get('screenshot_base64', ''),
    }
    
    # Save to database for admin dashboard
    screenshots_collection = db['screenshots']
    screenshots_collection.insert_one(screenshot_data)
    
    # AI Analysis - Check if running apps are appropriate
    running_apps = data.get('runningApps', [])
    
    # List of blocked apps (games, social media, etc.)
    BLOCKED_APPS = [
        'com.instagram.android',
        'com.snapchat.android',
        'com.facebook.katana',
        'com.tiktok',
        'com.pubg.imobile',
        'com.rovio.angrybirds',
        'com.supercell.clashofclans',
        'com.king.candycrushsaga',
        'com.netflix.mediaclient',
        'com.spotify.music',
        # Add more as needed
    ]
    
    # Educational/allowed apps
    ALLOWED_APPS = [
        'com.whatsapp',  # Communication
        'com.google.android.apps.docs',
        'com.microsoft.office',
        'com.google.android.calculator',
        'com.android.chrome',  # Browser for research
    ]
    
    should_close = False
    app_to_close = None
    reason = ''
    
    for app in running_apps:
        if app in BLOCKED_APPS:
            should_close = True
            app_to_close = app
            reason = 'Inappropriate app detected during class time'
            
            # Create violation
            violation = {
                'device_id': device_id,
                'violation_type': 'blocked_app_usage',
                'details': {
                    'app_package': app,
                    'timestamp': data.get('timestamp'),
                    'auto_closed': True
                },
                'timestamp': datetime.now(),
                'resolved': False,
            }
            violations_collection.insert_one(violation)
            
            app.logger.warning(f"Blocked app detected on device {device_id}: {app}")
            break
    
    # For production: Call free AI API for more sophisticated analysis
    # Example: Hugging Face, Replicate, or Claude API
    # ai_result = call_ai_api(screenshot_base64)
    
    return jsonify({
        'message': 'Screen analyzed',
        'shouldClose': should_close,
        'appToClose': app_to_close,
        'reason': reason,
        'appropriate': not should_close
    }), 200

@app.route('/api/devices/<device_id>/app-closed', methods=['POST'])
def app_closed_notification(device_id):
    data = request.json
    
    app.logger.info(f"App force-closed on device {device_id}: {data.get('appPackageName')}")
    
    # Log the auto-close action
    activity_log = {
        'device_id': device_id,
        'action': 'app_force_closed',
        'app_package': data.get('appPackageName'),
        'timestamp': datetime.now(),
    }
    
    activity_logs_collection = db['activity_logs']
    activity_logs_collection.insert_one(activity_log)
    
    return jsonify({'message': 'App close logged'}), 200

@app.route('/api/devices/<device_id>/screenshots', methods=['GET'])
def get_device_screenshots(device_id):
    """Get recent screenshots from a device for admin viewing"""
    limit = int(request.args.get('limit', 10))
    
    screenshots_collection = db['screenshots']
    screenshots = list(screenshots_collection.find(
        {'device_id': device_id}
    ).sort('timestamp', -1).limit(limit))
    
    return jsonify({
        'screenshots': [
            {
                '_id': str(s['_id']),
                'timestamp': s['timestamp'].isoformat(),
                'running_apps': s.get('running_apps', []),
                'screenshot_url': f'/api/screenshot/{str(s["_id"])}'
            }
            for s in screenshots
        ]
    }), 200

@app.route('/api/devices', methods=['GET'])
def get_all_devices():
    user_id = request.args.get('userId')
    
    query = {}
    if user_id:
        query['user_id'] = user_id
    
    devices = list(devices_collection.find(query))
    
    # Enrich with user data
    for device in devices:
        user = users_collection.find_one({'_id': ObjectId(device['user_id'])})
        if user:
            device['user_name'] = user['name']
            device['user_email'] = user['email']
    
    return jsonify({'devices': [serialize_device(d) for d in devices]}), 200


@app.route('/api/devices/<device_id>/rename', methods=['PUT'])
def rename_device(device_id):
    """Rename a device record in the database. Expects JSON: { "deviceName": "New Name" }
    This is a small helper endpoint used by the admin GUI client.
    """
    try:
        data = request.json or {}
        new_name = data.get('deviceName') or data.get('device_name')
        if not new_name:
            return jsonify({'error': 'deviceName required'}), 400

        result = devices_collection.update_one(
            {'_id': ObjectId(device_id)},
            {'$set': {'device_name': new_name}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Device not found'}), 404

        # Return updated device for convenience
        device = devices_collection.find_one({'_id': ObjectId(device_id)})
        return jsonify({'message': 'Device renamed', 'device': serialize_device(device)}), 200
    except Exception as e:
        app.logger.error(f"Failed to rename device {device_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/violations', methods=['GET'])
def get_violations():
    device_id = request.args.get('deviceId')
    resolved = request.args.get('resolved')
    
    query = {}
    if device_id:
        query['device_id'] = device_id
    if resolved is not None:
        query['resolved'] = resolved.lower() == 'true'
    
    violations = list(violations_collection.find(query).sort('timestamp', -1))
    
    # Enrich with device and user data
    for violation in violations:
        device = devices_collection.find_one({'_id': ObjectId(violation['device_id'])})
        if device:
            violation['device_name'] = device.get('device_name', 'Unknown')
            user = users_collection.find_one({'_id': ObjectId(device['user_id'])})
            if user:
                violation['user_name'] = user['name']
    
    return jsonify({'violations': [serialize_violation(v) for v in violations]}), 200

@app.route('/api/violations/<violation_id>/resolve', methods=['PUT'])
def resolve_violation(violation_id):
    data = request.json
    
    violations_collection.update_one(
        {'_id': ObjectId(violation_id)},
        {'$set': {
            'resolved': True,
            'resolved_at': datetime.now(),
            'resolved_by': data.get('adminId'),
            'resolution_notes': data.get('notes', '')
        }}
    )
    
    return jsonify({'message': 'Violation resolved'}), 200

@app.route('/api/exam-sessions/class/<class_name>', methods=['POST'])
def start_class_exam(class_name):
    data = request.json
    
    # Get all students in the class
    students = list(users_collection.find({'class': class_name, 'role': 'student'}))
    student_ids = [str(s['_id']) for s in students]
    
    # Get all devices for these students
    devices = list(devices_collection.find({'user_id': {'$in': student_ids}}))
    
    # Enable exam mode on all devices
    exam_data = {
        'name': data.get('examName', 'Examination'),
        'className': class_name,
        'startTime': datetime.now().isoformat(),
        'endTime': data.get('endTime'),
        'allowedApps': data.get('allowedApps', []),
    }
    
    devices_collection.update_many(
        {'user_id': {'$in': student_ids}},
        {'$set': {
            'exam_mode': True,
            'exam_data': exam_data
        }}
    )
    
    app.logger.info(f"Exam mode started for class {class_name}: {len(devices)} devices")
    return jsonify({
        'message': f'Exam mode enabled for {len(devices)} devices',
        'devicesAffected': len(devices)
    }), 200

@app.route('/api/exam-sessions/class/<class_name>', methods=['DELETE'])
def end_class_exam(class_name):
    # Get all students in the class
    students = list(users_collection.find({'class': class_name, 'role': 'student'}))
    student_ids = [str(s['_id']) for s in students]
    
    # Disable exam mode on all devices
    result = devices_collection.update_many(
        {'user_id': {'$in': student_ids}},
        {'$set': {
            'exam_mode': False,
            'exam_data': None
        }}
    )
    
    app.logger.info(f"Exam mode ended for class {class_name}: {result.modified_count} devices")
    return jsonify({
        'message': f'Exam mode disabled for {result.modified_count} devices',
        'devicesAffected': result.modified_count
    }), 200

def serialize_device(device):
    return {
        '_id': str(device['_id']),
        'userId': device.get('user_id', ''),
        'userName': device.get('user_name', ''),
        'userEmail': device.get('user_email', ''),
        'deviceName': device.get('device_name', ''),
        'deviceInfo': device.get('device_info', {}),
        'isLocked': device.get('is_locked', False),
        'lockReason': device.get('lock_reason', ''),
        'examMode': device.get('exam_mode', False),
        'examData': device.get('exam_data'),
        'lastHeartbeat': device.get('last_heartbeat').isoformat() if device.get('last_heartbeat') else None,
        'registeredAt': device.get('registered_at').isoformat() if device.get('registered_at') else None,
        'status': device.get('status', 'unknown'),
    }

def serialize_violation(violation):
    return {
        '_id': str(violation['_id']),
        'deviceId': violation.get('device_id', ''),
        'deviceName': violation.get('device_name', ''),
        'userId': violation.get('user_id', ''),
        'userName': violation.get('user_name', ''),
        'violationType': violation.get('violation_type', ''),
        'details': violation.get('details', {}),
        'timestamp': violation.get('timestamp').isoformat() if violation.get('timestamp') else None,
        'resolved': violation.get('resolved', False),
        'resolvedAt': violation.get('resolved_at').isoformat() if violation.get('resolved_at') else None,
        'resolutionNotes': violation.get('resolution_notes', ''),
    }

# ============================================================
# Hatch Wall - Firewall API Endpoints
# ============================================================

# Collections for Hatch Wall
firewall_devices_collection = db['firewall_devices']
firewall_policies_collection = db['firewall_policies']
firewall_violations_collection = db['firewall_violations']

@app.route('/api/firewall/register-device', methods=['POST'])
def register_firewall_device():
    data = request.json
    
    device = {
        'userId': data['userId'],
        'deviceInfo': data.get('deviceInfo', {}),
        'registeredAt': datetime.now(),
        'lastHeartbeat': datetime.now(),
        'status': 'active',
        'protectionEnabled': True,
    }
    
    # Check if device already exists
    existing = firewall_devices_collection.find_one({
        'userId': data['userId'],
        'deviceInfo.ipAddress': data.get('deviceInfo', {}).get('ipAddress')
    })
    
    if existing:
        device_id = str(existing['_id'])
        firewall_devices_collection.update_one(
            {'_id': existing['_id']},
            {'$set': {'lastHeartbeat': datetime.now()}}
        )
    else:
        result = firewall_devices_collection.insert_one(device)
        device_id = str(result.inserted_id)
    
    app.logger.info(f"Firewall device registered: {device_id}")
    return jsonify({'deviceId': device_id}), 201

@app.route('/api/firewall/policies/<device_id>', methods=['GET'])
def get_firewall_policies(device_id):
    # Get custom policies for this device or default policies
    policy = firewall_policies_collection.find_one({'deviceId': device_id})
    
    if not policy:
        # Return default policies
        policy = {
            'blocklist': [
                # Social Media
                'facebook.com', 'instagram.com', 'tiktok.com', 'snapchat.com',
                'twitter.com', 'x.com',
                # Gaming
                'steam.com', 'roblox.com', 'minecraft.net', 'epicgames.com',
                # Streaming
                'netflix.com', 'youtube.com', 'twitch.tv', 'hulu.com',
                # Gambling
                'bet365.com', 'pokerstars.com',
            ],
            'allowlist': [
                # Educational
                'google.com', 'wikipedia.org', 'khanacademy.org',
                'coursera.org', 'edx.org', 'stackoverflow.com',
                'github.com', 'classroom.google.com',
            ]
        }
    
    return jsonify({'policies': policy}), 200

@app.route('/api/firewall/policies/<device_id>', methods=['PUT'])
def update_firewall_policies(device_id):
    data = request.json
    
    policy = {
        'deviceId': device_id,
        'blocklist': data.get('blocklist', []),
        'allowlist': data.get('allowlist', []),
        'updatedAt': datetime.now(),
    }
    
    firewall_policies_collection.update_one(
        {'deviceId': device_id},
        {'$set': policy},
        upsert=True
    )
    
    return jsonify({'message': 'Policies updated'}), 200

@app.route('/api/firewall/heartbeat', methods=['POST'])
def firewall_heartbeat():
    data = request.json
    
    firewall_devices_collection.update_one(
        {'_id': ObjectId(data['deviceId'])},
        {'$set': {
            'lastHeartbeat': datetime.now(),
            'isOnline': data.get('isOnline', True),
            'engineStatus': data.get('engineStatus', 'active')
        }}
    )
    
    return jsonify({'message': 'Heartbeat received'}), 200

@app.route('/api/firewall/violations', methods=['POST'])
def report_firewall_violation():
    data = request.json
    
    violation = {
        'deviceId': data['deviceId'],
        'userId': data['userId'],
        'type': data['type'],
        'details': data.get('details', {}),
        'timestamp': datetime.now(),
        'resolved': False,
    }
    
    result = firewall_violations_collection.insert_one(violation)
    
    app.logger.warning(f"Firewall violation: {data['type']} - Device: {data['deviceId']}")
    return jsonify({'violationId': str(result.inserted_id)}), 201

@app.route('/api/firewall/violations', methods=['GET'])
def get_firewall_violations():
    device_id = request.args.get('deviceId')
    user_id = request.args.get('userId')
    resolved = request.args.get('resolved')
    
    query = {}
    if device_id:
        query['deviceId'] = device_id
    if user_id:
        query['userId'] = user_id
    if resolved is not None:
        query['resolved'] = resolved.lower() == 'true'
    
    violations = list(firewall_violations_collection.find(query).sort('timestamp', -1))
    
    # Enrich with user data
    for violation in violations:
        user = users_collection.find_one({'_id': ObjectId(violation['userId'])})
        if user:
            violation['userName'] = user['name']
            violation['userEmail'] = user['email']
    
    return jsonify({
        'violations': [serialize_firewall_violation(v) for v in violations]
    }), 200

@app.route('/api/firewall/violations/<violation_id>/resolve', methods=['PUT'])
def resolve_firewall_violation(violation_id):
    data = request.json
    
    firewall_violations_collection.update_one(
        {'_id': ObjectId(violation_id)},
        {'$set': {
            'resolved': True,
            'resolvedAt': datetime.now(),
            'resolvedBy': data.get('adminId'),
            'resolutionNotes': data.get('notes', '')
        }}
    )
    
    return jsonify({'message': 'Violation resolved'}), 200

@app.route('/api/firewall/devices', methods=['GET'])
def get_firewall_devices():
    user_id = request.args.get('userId')
    
    query = {}
    if user_id:
        query['userId'] = user_id
    
    devices = list(firewall_devices_collection.find(query))
    
    # Enrich with user data
    for device in devices:
        user = users_collection.find_one({'_id': ObjectId(device['userId'])})
        if user:
            device['userName'] = user['name']
            device['userEmail'] = user['email']
        
        # Count violations
        device['violationCount'] = firewall_violations_collection.count_documents({
            'deviceId': str(device['_id']),
            'resolved': False
        })
    
    return jsonify({
        'devices': [serialize_firewall_device(d) for d in devices]
    }), 200

def serialize_firewall_device(device):
    return {
        '_id': str(device['_id']),
        'userId': device.get('userId', ''),
        'userName': device.get('userName', ''),
        'userEmail': device.get('userEmail', ''),
        'deviceInfo': device.get('deviceInfo', {}),
        'registeredAt': device.get('registeredAt').isoformat() if device.get('registeredAt') else None,
        'lastHeartbeat': device.get('lastHeartbeat').isoformat() if device.get('lastHeartbeat') else None,
        'status': device.get('status', 'unknown'),
        'protectionEnabled': device.get('protectionEnabled', True),
        'violationCount': device.get('violationCount', 0),
    }

def serialize_firewall_violation(violation):
    return {
        '_id': str(violation['_id']),
        'deviceId': violation.get('deviceId', ''),
        'userId': violation.get('userId', ''),
        'userName': violation.get('userName', ''),
        'userEmail': violation.get('userEmail', ''),
        'type': violation.get('type', ''),
        'details': violation.get('details', {}),
        'timestamp': violation.get('timestamp').isoformat() if violation.get('timestamp') else None,
        'resolved': violation.get('resolved', False),
        'resolvedAt': violation.get('resolvedAt').isoformat() if violation.get('resolvedAt') else None,
        'resolutionNotes': violation.get('resolutionNotes', ''),
    }

# ============================================================
# AI Screenshot Analysis with Gemini
# ============================================================

def analyze_screenshot_with_gemini(base64_image):
    """
    Send screenshot to Gemini AI for analysis
    Returns: "YES" if inappropriate (should close), "NO" if appropriate
    """
    try:
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{
                "parts": [
                    {
                        "text": """You are a content monitor for a student device during school hours.

Analyze this screenshot carefully and determine if it shows INAPPROPRIATE content:

🚨 DEFINITELY BLOCK (respond YES):
- Pornography, nudity, explicit sexual content
- Dating apps (Tinder, Bumble, etc.)
- Social media apps being actively used (Instagram feed, TikTok videos, Snapchat chats)
- Gaming apps/games being played
- Entertainment actively being watched (Netflix shows, movies, YouTube non-educational videos)
- Gambling sites

✅ ALLOW (respond NO):
- Educational websites (Wikipedia, Khan Academy, educational YouTube)
- School tools (Google Classroom, Zoom, educational apps)
- Productivity apps (calculators, note-taking, office apps)
- Search engines showing search results
- General Android UI (home screen, settings, app drawer)
- Browser tabs without obvious inappropriate content
- Text/documents being read or written

⚠️ IMPORTANT RULES:
1. If you see ACTUAL pornography or nudity → respond YES
2. If it's just a home screen or app drawer → respond NO
3. If it's educational content → respond NO
4. If someone is actively using social media/games → respond YES
5. When unclear or just UI elements → respond NO (don't block unnecessarily)

Respond with EXACTLY ONE WORD:
- "YES" = BLOCK (clear inappropriate activity)
- "NO" = ALLOW (educational or unclear)"""
                    },
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": base64_image
                        }
                    }
                ]
            }],
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                }
            ]
        }
        
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            app.logger.info(f"Gemini API Response: {json.dumps(result, indent=2)}")
            
            ai_response = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'NO').strip().upper()
            
            app.logger.info(f"AI Raw Response: {ai_response}")
            
            # Extract YES or NO from response
            if 'YES' in ai_response:
                return {'decision': 'YES', 'confidence': 'high', 'response': ai_response}
            else:
                return {'decision': 'NO', 'confidence': 'high', 'response': ai_response}
        else:
            app.logger.error(f"Gemini API error: {response.status_code} - {response.text}")
            return {'decision': 'NO', 'confidence': 'low', 'error': 'API error'}
            
    except Exception as e:
        app.logger.error(f"Gemini AI analysis failed: {e}")
        return {'decision': 'NO', 'confidence': 'low', 'error': str(e)}


def review_url_with_gemini(text_or_url):
    """
    Use Gemini to review a search query or URL.
    Returns dict: { 'allow': True/False, 'reason': 'text' }
    """
    try:
        prompt = (
            "You are Hatchy, a web content moderator for school devices.\n"
            "Given the following input (either a search query or a URL), decide if it should be ALLOWED for a student to access during school hours.\n"
            "Respond with a short answer that begins with either ALLOW or BLOCK, followed by a brief reason.\n\n"
            f"INPUT: {text_or_url}\n\n"
            "BLOCK if the content is: pornography/nudity, explicit sexual content, dating apps, social media being actively used, gambling, online games, or adult entertainment.\n"
            "ALLOW for educational content, general searches, or unclear UI/screens.\n"
        )

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}
                ]
            }],
            "safetySettings": [
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            ]
        }

        response = requests.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            data = response.json()
            # Try a few common response shapes
            text = None
            if isinstance(data, dict):
                # new API uses 'candidates' with 'content' parts
                try:
                    candidates = data.get('candidates') or data.get('outputs') or []
                    if candidates:
                        first = candidates[0]
                        # candidate may contain 'content' -> list of parts with 'text'
                        content = first.get('content') or first.get('response') or []
                        if isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict):
                            text = content[0].get('text')
                        elif isinstance(first.get('content'), str):
                            text = first.get('content')
                except Exception:
                    text = None

            # fallback: try to read top-level 'output' or 'text'
            if not text:
                text = data.get('output') if isinstance(data, dict) else None
            if not text:
                # try naive string
                text = str(data)

            # Normalize
            text_upper = (text or '').strip().upper()
            allow = True
            reason = text or ''
            if text_upper.startswith('BLOCK') or 'BLOCK' in text_upper or 'NO' in text_upper:
                allow = False
            return {'allow': allow, 'reason': reason}
        else:
            app.logger.error(f"Gemini review failed: {response.status_code} {response.text}")
            return {'allow': True, 'reason': 'Gemini unavailable, default allow'}
    except Exception as e:
        app.logger.error(f"Gemini review exception: {e}")
        return {'allow': True, 'reason': f'Error during review: {e}'}


@app.route('/api/url/review', methods=['POST'])
def url_review():
    """Endpoint used by Hatch Browser app to check a URL or search query before loading.
    Expects JSON: { userId: '...', url: '...' }
    Returns: { allow: true/false, reason: '...' }
    Also logs blocked attempts to firewall_violations_collection and records all checks to 'url_checks'.
    """
    data = request.json or {}
    user_id = data.get('userId')
    url = data.get('url', '')

    # run Gemini review
    result = review_url_with_gemini(url)

    # Log every check
    try:
        db['url_checks'].insert_one({
            'user_id': user_id,
            'url': url,
            'allow': result.get('allow', True),
            'reason': result.get('reason', ''),
            'timestamp': datetime.now()
        })
    except Exception as e:
        app.logger.warning(f"Failed to log url_check: {e}")

    # If blocked, create a firewall violation record for admin dashboard
    if not result.get('allow', True):
        try:
            firewall_violations_collection.insert_one({
                'deviceId': 'app',
                'userId': user_id,
                'type': 'url_block',
                'details': {'url': url, 'reason': result.get('reason', '')},
                'timestamp': datetime.now(),
                'resolved': False
            })
        except Exception as e:
            app.logger.warning(f"Failed to insert firewall violation: {e}")

    return jsonify({'allow': bool(result.get('allow', True)), 'reason': result.get('reason', '')}), 200

def manage_screenshot_storage():
    """Keep only last 20 screenshots, delete older ones"""
    try:
        screenshots_collection = db['screenshots']
        
        # Count total screenshots
        total = screenshots_collection.count_documents({})
        
        if total > 20:
            # Find oldest screenshots to delete
            old_screenshots = list(screenshots_collection.find().sort('timestamp', 1).limit(total - 20))
            
            for screenshot in old_screenshots:
                # Delete file if exists
                if 'file_path' in screenshot:
                    try:
                        if os.path.exists(screenshot['file_path']):
                            os.remove(screenshot['file_path'])
                    except Exception as e:
                        app.logger.error(f"Failed to delete screenshot file: {e}")
                
                # Delete from database
                screenshots_collection.delete_one({'_id': screenshot['_id']})
            
            app.logger.info(f"🗑️ Deleted {len(old_screenshots)} old screenshots")
            
    except Exception as e:
        app.logger.error(f"Screenshot cleanup failed: {e}")

@app.route('/api/screenshots/analyze', methods=['POST'])
def analyze_screenshot():
    """
    Receive screenshot from device, analyze with AI, take action if needed
    """
    try:
        data = request.json
        device_id = data.get('device_id')
        base64_screenshot = data.get('screenshot')  # Base64 encoded image
        ip_address = data.get('ip_address', 'unknown')
        
        if not device_id or not base64_screenshot:
            return jsonify({'error': 'device_id and screenshot required'}), 400
        
        app.logger.info(f"📸 Analyzing screenshot from device {device_id}")
        
        # Save screenshot temporarily
        timestamp = datetime.now()
        filename = f"screenshot_{device_id}_{timestamp.strftime('%Y%m%d_%H%M%S')}.png"
        filepath = os.path.join('uploads', filename)
        
        # Decode and save
        try:
            image_data = base64.b64decode(base64_screenshot)
            with open(filepath, 'wb') as f:
                f.write(image_data)
            app.logger.info(f"💾 Screenshot saved: {filepath} ({len(image_data)} bytes)")
        except Exception as e:
            app.logger.error(f"Failed to save screenshot: {e}")
            return jsonify({'error': 'Failed to save screenshot'}), 500
        
        # Analyze with Gemini AI
        ai_result = analyze_screenshot_with_gemini(base64_screenshot)
        decision = ai_result['decision']
        
        app.logger.info(f"🤖 AI Decision: {decision}")
        
        # Get device info
        devices_collection = db['devices']
        device = devices_collection.find_one({'_id': ObjectId(device_id)}) if ObjectId.is_valid(device_id) else devices_collection.find_one({'deviceName': device_id})
        
        if decision == 'YES':
            # INAPPROPRIATE - Take action
            app.logger.warning(f"⚠️ INAPPROPRIATE ACTIVITY DETECTED on {device_id}")
            
            # Save screenshot to database
            screenshots_collection = db['screenshots']
            screenshot_doc = {
                'device_id': device_id,
                'device_name': device.get('deviceName', 'Unknown') if device else 'Unknown',
                'file_path': filepath,
                'timestamp': timestamp,
                'ai_decision': 'BLOCKED',
                'ip_address': ip_address,
            }
            screenshots_collection.insert_one(screenshot_doc)
            
            # Create violation record
            violations_collection = db['violations']
            violation_doc = {
                'device_id': device_id,
                'device_name': device.get('deviceName', 'Unknown') if device else 'Unknown',
                'user_id': device.get('userId', '') if device else '',
                'user_name': device.get('userName', 'Unknown') if device else 'Unknown',
                'violation_type': 'inappropriate_activity',
                'details': {
                    'ai_decision': decision,
                    'screenshot_path': filepath,
                    'ip_address': ip_address,
                },
                'timestamp': timestamp,
                'resolved': False,
            }
            violations_collection.insert_one(violation_doc)
            
            # Set device violation flag
            if device:
                devices_collection.update_one(
                    {'_id': device['_id']},
                    {'$set': {
                        'has_violation': True,
                        'violation_reason': 'AI detected inappropriate activity',
                        'violation_time': timestamp,
                    }}
                )
            
            # Cleanup old screenshots
            manage_screenshot_storage()
            
            return jsonify({
                'success': True,
                'action': 'BLOCK',
                'message': 'Inappropriate activity detected - device blocked',
                'show_overlay': True,
            })
        
        else:
            # APPROPRIATE - Just delete screenshot
            app.logger.info(f"✅ Activity appropriate on {device_id}")
            
            try:
                os.remove(filepath)
            except:
                pass
            
            return jsonify({
                'success': True,
                'action': 'ALLOW',
                'message': 'Activity is appropriate',
                'show_overlay': False,
            })
        
    except Exception as e:
        app.logger.error(f"Screenshot analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/violations/clear/<device_id>', methods=['POST'])
def clear_device_violation(device_id):
    """Clear violation flag from device after admin review"""
    try:
        devices_collection = db['devices']
        
        result = devices_collection.update_one(
            {'_id': ObjectId(device_id)} if ObjectId.is_valid(device_id) else {'deviceName': device_id},
            {'$set': {
                'has_violation': False,
                'violation_reason': None,
                'violation_time': None,
            }}
        )
        
        if result.modified_count > 0:
            app.logger.info(f"✅ Cleared violation for device {device_id}")
            return jsonify({'success': True, 'message': 'Violation cleared'})
        else:
            return jsonify({'error': 'Device not found'}), 404
            
    except Exception as e:
        app.logger.error(f"Clear violation error: {e}")
        return jsonify({'error': str(e)}), 500

def capture_screenshots_loop():
    """
    Background thread that captures screenshots from all active devices
    via ADB server every 5 seconds
    """
    ADB_SERVER_URL = 'http://localhost:5037'
    
    print("🎬 Starting background screenshot capture loop...")
    time.sleep(10)  # Wait for server to fully start
    
    while True:
        try:
            # Get all active devices that have IP addresses
            devices = devices_collection.find({
                'status': 'active',
                'deviceInfo.ipAddress': {'$exists': True}
            })
            
            for device in devices:
                device_id = str(device['_id'])
                device_ip = device.get('deviceInfo', {}).get('ipAddress')
                
                if device_ip:
                    try:
                        print(f"📸 Requesting screen capture for {device_id} ({device_ip})")
                        
                        # Call ADB server to capture screen
                        response = requests.post(
                            f'{ADB_SERVER_URL}/capture-screen',
                            json={
                                'device_id': device_id,
                                'device_ip': device_ip,
                            },
                            timeout=10
                        )
                        
                        if response.status_code == 200:
                            print(f"✅ Screen captured for {device_id}")
                        else:
                            print(f"⚠️ Capture failed for {device_id}: {response.status_code}")
                            
                    except requests.exceptions.ConnectionError:
                        print(f"❌ ADB server not running! Start it with: python adb_server.py")
                        break
                    except Exception as e:
                        print(f"❌ Capture error for {device_id}: {e}")
            
            # Wait 5 seconds before next round
            time.sleep(5)
            
        except Exception as e:
            print(f"❌ Screenshot loop error: {e}")
            time.sleep(5)

if __name__ == '__main__':
    print("🚀 HatchOS Server Starting...")
    print("📱 Messaging API Ready")
    print("🤖 AI Content Moderation Active")
    print("📡 Device Management System Online")
    print("📸 Background Screen Capture via ADB")
    
    # Check if SSL certificates exist
    ssl_cert = 'ssl_certs/cert.pem'
    ssl_key = 'ssl_certs/key.pem'
    
    if os.path.exists(ssl_cert) and os.path.exists(ssl_key):
        print(f"🔒 Server running on https://192.168.29.164:5000 (HTTPS)")
        use_ssl = True
    else:
        print(f"🌐 Server running on http://192.168.29.164:5000 (HTTP)")
        print("💡 To enable HTTPS: run 'python generate_ssl_cert.py'")
        use_ssl = False
    
    print("=" * 60)
    print("⚠️  IMPORTANT: Start ADB server with: python adb_server.py")
    print("=" * 60)
    
    # Start background capture thread
    capture_thread = threading.Thread(target=capture_screenshots_loop, daemon=True)
    capture_thread.start()
    
    if use_ssl:
        app.run(debug=True, host='0.0.0.0', port=5000, 
                ssl_context=(ssl_cert, ssl_key), use_reloader=False)
    else:
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
