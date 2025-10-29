from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['hatchos_db']

# Collections
users_collection = db['users']
subjects_collection = db['subjects']
assignments_collection = db['assignments']
resources_collection = db['resources']
enrollments_collection = db['enrollments']

print("🌱 Seeding MyClass demo data...")

# Create demo users
print("Creating demo users...")
users_collection.delete_many({'email': {'$in': ['teacher@demo.com', 'student@demo.com']}})

teacher = {
    'name': 'teacher',
    'email': 'teacher@demo.com',
    'password': 'teacher123',
    'role': 'teacher',
    'grade': '',
    'section': '',
    'class': '',
    'teaching_classes': '10A, 10B',
    'phone': '',
    'avatar': '',
    'created_at': datetime.now(),
    'status': 'offline',
    'last_seen': datetime.now()
}

student = {
    'name': 'student',
    'email': 'student@demo.com',
    'password': 'student123',
    'role': 'student',
    'grade': '10',
    'section': 'A',
    'class': '10A',
    'teaching_classes': '',
    'phone': '',
    'avatar': '',
    'created_at': datetime.now(),
    'status': 'offline',
    'last_seen': datetime.now()
}

teacher_result = users_collection.insert_one(teacher)
student_result = users_collection.insert_one(student)

teacher_id = str(teacher_result.inserted_id)
student_id = str(student_result.inserted_id)

print(f"✅ Created teacher (username: teacher, password: teacher123)")
print(f"✅ Created student (username: student, password: student123)")

# Create demo subjects
print("\nCreating demo subjects...")
subjects_collection.delete_many({'teacher_id': teacher_id})

subjects = [
    {
        'name': 'Mathematics',
        'code': 'MATH101',
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    },
    {
        'name': 'Science',
        'code': 'SCI101',
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    },
    {
        'name': 'English',
        'code': 'ENG101',
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    },
    {
        'name': 'History',
        'code': 'HIST101',
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    }
]

subject_results = subjects_collection.insert_many(subjects)
subject_ids = [str(sid) for sid in subject_results.inserted_ids]

for subject in subjects:
    print(f"✅ Created subject: {subject['name']} ({subject['code']})")

# Enroll student in all subjects
print("\nEnrolling student in subjects...")
enrollments_collection.delete_many({'student_id': student_id})

for subject_id in subject_ids:
    enrollment = {
        'student_id': student_id,
        'subject_id': subject_id,
        'enrolled_at': datetime.now()
    }
    enrollments_collection.insert_one(enrollment)

print(f"✅ Enrolled student in {len(subject_ids)} subjects")

# Create demo assignments
print("\nCreating demo assignments...")
assignments_collection.delete_many({'teacher_id': teacher_id})

assignments = [
    {
        'title': 'Algebra Homework - Chapter 3',
        'description': 'Complete exercises 3.1 to 3.5 from the textbook',
        'subject_id': subject_ids[0],  # Math
        'teacher_id': teacher_id,
        'due_date': datetime.now() + timedelta(days=2),
        'created_at': datetime.now()
    },
    {
        'title': 'Quadratic Equations Quiz',
        'description': 'Prepare for quiz on quadratic equations',
        'subject_id': subject_ids[0],  # Math
        'teacher_id': teacher_id,
        'due_date': datetime.now() + timedelta(days=5),
        'created_at': datetime.now()
    },
    {
        'title': 'Physics Lab Report',
        'description': 'Submit lab report on Newton\'s laws of motion',
        'subject_id': subject_ids[1],  # Science
        'teacher_id': teacher_id,
        'due_date': datetime.now() + timedelta(days=7),
        'created_at': datetime.now()
    },
    {
        'title': 'Essay: Climate Change',
        'description': 'Write a 500-word essay on climate change impacts',
        'subject_id': subject_ids[1],  # Science
        'teacher_id': teacher_id,
        'due_date': datetime.now() + timedelta(days=10),
        'created_at': datetime.now()
    },
    {
        'title': 'Shakespeare Reading',
        'description': 'Read Act 1 & 2 of Romeo and Juliet',
        'subject_id': subject_ids[2],  # English
        'teacher_id': teacher_id,
        'due_date': datetime.now() + timedelta(days=3),
        'created_at': datetime.now()
    },
    {
        'title': 'Grammar Exercise',
        'description': 'Complete worksheet on passive voice',
        'subject_id': subject_ids[2],  # English
        'teacher_id': teacher_id,
        'due_date': datetime.now() + timedelta(days=1),
        'created_at': datetime.now()
    },
    {
        'title': 'World War II Project',
        'description': 'Prepare a presentation on any WWII battle',
        'subject_id': subject_ids[3],  # History
        'teacher_id': teacher_id,
        'due_date': datetime.now() + timedelta(days=14),
        'created_at': datetime.now()
    }
]

assignments_collection.insert_many(assignments)

for assignment in assignments:
    print(f"✅ Created assignment: {assignment['title']}")

# Create demo resources
print("\nCreating demo resources...")
resources_collection.delete_many({'teacher_id': teacher_id})

resources = [
    {
        'title': 'Math Formula Sheet',
        'description': 'Quick reference for common formulas',
        'url': 'https://example.com/math-formulas.pdf',
        'subject_id': subject_ids[0],
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    },
    {
        'title': 'Periodic Table',
        'description': 'Interactive periodic table of elements',
        'url': 'https://example.com/periodic-table',
        'subject_id': subject_ids[1],
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    },
    {
        'title': 'English Grammar Guide',
        'description': 'Comprehensive grammar rules and examples',
        'url': 'https://example.com/grammar-guide.pdf',
        'subject_id': subject_ids[2],
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    },
    {
        'title': 'WWII Timeline',
        'description': 'Interactive timeline of World War II events',
        'url': 'https://example.com/wwii-timeline',
        'subject_id': subject_ids[3],
        'teacher_id': teacher_id,
        'created_at': datetime.now()
    }
]

resources_collection.insert_many(resources)

for resource in resources:
    print(f"✅ Created resource: {resource['title']}")

print("\n🎉 Seeding complete!")
print("\n📚 Demo Accounts:")
print("   Teacher - username: teacher, password: teacher123")
print("   Student - username: student, password: student123")
print(f"\n📊 Created:")
print(f"   - {len(subjects)} subjects")
print(f"   - {len(assignments)} assignments")
print(f"   - {len(resources)} resources")
