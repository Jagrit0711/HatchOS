from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient('localhost', 27017)
db = client['hatchos_db']
users_collection = db['users']

# Update teacher with profile photo (PNG format)
users_collection.update_one(
    {'email': 'teacher@demo.com'},
    {'$set': {
        'profile_photo': 'https://api.dicebear.com/7.x/avataaars/png?seed=teacher&backgroundColor=b6e3f4',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/png?seed=teacher&backgroundColor=b6e3f4'
    }}
)

# Update student with profile photo (PNG format)
users_collection.update_one(
    {'email': 'student@demo.com'},
    {'$set': {
        'profile_photo': 'https://api.dicebear.com/7.x/avataaars/png?seed=student&backgroundColor=ffd5dc',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/png?seed=student&backgroundColor=ffd5dc'
    }}
)

# Update any other users
users_collection.update_one(
    {'email': '405620@rh.balbharati.org'},
    {'$set': {
        'profile_photo': 'https://api.dicebear.com/7.x/avataaars/png?seed=jagrit&backgroundColor=c0aede',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/png?seed=jagrit&backgroundColor=c0aede'
    }}
)

print("✅ Updated users with profile photos (PNG format)!")
print("\nUsers updated:")
for user in users_collection.find({}, {'name': 1, 'email': 1, 'profile_photo': 1}):
    print(f"  - {user['name']} ({user['email']})")
    print(f"    Photo: {user.get('profile_photo', 'None')}")

client.close()
