# MyClass - HatchOS Education

A Google Classroom-inspired educational app built with Expo SDK 50.

## 🎓 Features

### Student View
- **My Class**: View enrolled subjects with assignments and resources
- **Calendar**: See all upcoming assignments with due dates
- **Hatchy**: AI study assistant (Coming Soon)

### Teacher View
- **My Class**: Manage teaching subjects, add assignments and resources
- **Calendar**: View all assignments across all subjects
- **Hatchy**: AI assistant for teachers (Coming Soon)

## 🚀 Getting Started

### Prerequisites
- MongoDB running on localhost:27017
- HatchOS server.py running on port 5000
- Expo Go app on your phone (for testing)

### Installation

1. Install dependencies (already done):
```bash
npm install
```

2. Seed demo data:
```bash
python seed_myclass.py
```

3. Make sure server.py is running:
```bash
cd ../..
python server.py
```

4. Start the app:
```bash
# Option 1: Use batch file
start-myclass.bat

# Option 2: Use npm
npm start
```

5. Scan QR code with Expo Go app on your phone

## 🔐 Demo Accounts

### Teacher Account
- Username: `teacher`
- Password: `teacher123`

### Student Account
- Username: `student`
- Password: `student123`

## 📱 App Structure

```
MyClass/
├── App.js                      # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js     # Login page
│   │   ├── MyClassScreen.js   # Subject list with teacher actions
│   │   ├── CalendarScreen.js  # Calendar with assignments
│   │   └── HatchyScreen.js    # AI assistant (coming soon)
│   ├── services/
│   │   └── api.js             # API calls to server
│   └── components/            # Reusable components
├── seed_myclass.py            # Demo data seeder
└── start-myclass.bat          # Quick start script
```

## 🎨 UI Design

- Purple gradient theme (#667eea to #764ba2)
- Bottom tab navigation
- Card-based layouts
- Smooth animations
- Consistent with MessagingApp style

## 🔌 API Endpoints

### Authentication
- `POST /api/users/login` - Login with username/password

### Subjects
- `GET /api/subjects` - Get subjects (filtered by user role)
- `GET /api/subjects/:id` - Get subject details

### Assignments
- `GET /api/assignments` - Get assignments (filtered by user/subject)
- `POST /api/assignments` - Create assignment (teachers only)

### Resources
- `GET /api/resources` - Get resources (filtered by user/subject)
- `POST /api/resources` - Create resource (teachers only)

## 🗄️ Database Collections

- **users**: Student and teacher accounts
- **subjects**: Subject information with teacher assignments
- **assignments**: Assignment details with due dates
- **resources**: Learning resources with URLs
- **enrollments**: Student-subject relationships

## 📝 To-Do

- [ ] Add assignment submission feature
- [ ] Add grade tracking
- [ ] Add notifications for due assignments
- [ ] Implement file upload for resources
- [ ] Add Hatchy AI assistant
- [ ] Add subject creation (teachers)
- [ ] Add student enrollment management
- [ ] Add assignment editing/deletion
- [ ] Add resource editing/deletion

## 🐛 Known Issues

None at the moment! 🎉

## 💡 Tips

- Use teacher account to add assignments and resources
- Calendar shows color-coded urgency (red = overdue, orange = 2 days, green = safe)
- Pull to refresh on any screen to reload data
- Hatchy tab is a placeholder for future AI features
