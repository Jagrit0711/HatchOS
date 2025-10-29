# HatchOS - Complete Apps Overview

**Last Updated:** October 16, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Apps Catalog](#apps-catalog)
3. [Backend Services](#backend-services)
4. [Quick Start Guide](#quick-start-guide)
5. [Network Configuration](#network-configuration)
6. [ADB Integration](#adb-integration)

---

## 🎯 System Overview

HatchOS is a comprehensive educational management system with multiple React Native apps and a Flask/MongoDB backend.

### **Architecture**
```
HatchOS/
├── server.py (Main Flask API - Port 5000)
├── adb_service.py (ADB Control Service - Port 5001)
├── admin/ (Web Admin Dashboard)
└── APPS/
    ├── HatchCamera/ (Content-safe camera app)
    ├── MessagingApp/ (School messaging system)
    └── MyClass/ (Class management app)
```

---

## 📱 Apps Catalog

### 1. **HatchCamera** - Content-Safe Camera App

**Purpose:** Safe photo/video capture with AI content moderation

**Key Features:**
- Real-time NSFW detection using TensorFlow.js & NSFWJS
- Blocks inappropriate content before saving
- Safe mode with parental controls
- Photo/video gallery with moderation history
- Expo SDK 50 compatible

**Tech Stack:**
- React Native (Expo SDK 50)
- TensorFlow.js
- NSFWJS model
- expo-camera, expo-media-library
- Async Storage

**Quick Start:**
```batch
cd APPS\HatchCamera
npm install
npx expo start
```

**Documentation Files (Archived):**
- ✅ CONTENT_MODERATION.md - AI moderation system
- ✅ FEATURES.md - Complete features list
- ✅ NUDE_DETECTION.md - NSFW detection implementation
- ✅ TENSORFLOW_FIX.md - TensorFlow setup issues
- ✅ UI_GUIDE.md - User interface guide

**Status:** ✅ Production Ready  
**Package:** com.hatchcamera

---

### 2. **MessagingApp** - School Messaging System

**Purpose:** Secure messaging for students, teachers, and parents

**Key Features:**
- Direct messaging between users
- Group chats for classes
- Teacher announcements
- File sharing (images, documents)
- Read receipts and typing indicators
- Push notifications

**Tech Stack:**
- React Native (Expo SDK 50)
- Socket.io for real-time messaging
- MongoDB for message storage
- expo-notifications

**Quick Start:**
```batch
cd APPS\MessagingApp
npm install
npx expo start
```

**Status:** ✅ Production Ready  
**Package:** com.hatchmessaging

---

### 3. **MyClass** - Class Management App

**Purpose:** Digital classroom management for teachers and students

**Key Features:**
- Class schedules and timetables
- Assignment submission and grading
- Attendance tracking
- Grade reporting
- Student performance analytics
- Teacher-student communication

**Tech Stack:**
- React Native (Expo SDK 50)
- MongoDB backend integration
- Chart libraries for analytics
- PDF generation for reports

**Quick Start:**
```batch
cd APPS\MyClass
npm install
npx expo start
```

**Seeding Database:**
```batch
python seed_myclass.py
```

**Documentation Files (Archived):**
- ✅ FEATURE_REQUIREMENTS.md - Requirements spec
- ✅ WHATS_WORKING.md - Working features
- ✅ UPDATES.md - Version history

**Status:** ✅ Production Ready  
**Package:** com.myclass

---

## 🖥️ Backend Services

### **Main API Server (server.py)**

**Port:** 5000  
**Database:** MongoDB  
**Framework:** Flask + Flask-CORS

**Endpoints:**
```
/api/users - User management
/api/devices - Device registration & tracking
/api/exam-sessions - Exam mode control
/api/violations - Security violation logs
/api/screenshots - Screenshot uploads
/api/messages - Messaging system
/api/classes - Class management
/api/assignments - Assignment handling
```

**Starting Server:**
```batch
python server.py
```

---

### **ADB Control Service (adb_service.py)**

**Port:** 5001  
**Purpose:** Wireless ADB device control for exam lockdown  
**Framework:** Flask + Threading

**Features:**
- Wireless ADB connection management
- Device lockdown during exams
- Forced app opening every 2 seconds
- Screenshot capture via ADB
- Running app detection
- Force-stop unauthorized apps
- AI-powered screenshot monitoring (Optional - OpenAI Vision API)

**Endpoints:**
```
POST /adb/connect - Connect to device via IP
POST /adb/disconnect - Disconnect device
POST /adb/screenshot - Capture screenshot
POST /adb/lock-device - Lock device (enforcer mode)
POST /adb/unlock-device - Unlock device
POST /adb/exam-mode/start - Start exam mode with enforcer
POST /adb/exam-mode/end - End exam mode
GET /adb/apps/running - Get running apps
POST /adb/apps/stop - Force stop app
POST /adb/analyze-screenshot - AI screenshot analysis (requires API key)
GET /adb/devices - List connected devices
```

**Starting Service:**
```batch
python adb_service.py
```

**Requirements:**
- ADB (Android Debug Bridge) installed
- Device in Developer Mode with USB Debugging enabled
- Wireless ADB enabled (port 5555)

---

## 🚀 Quick Start Guide

### **Complete System Setup:**

1. **Start Backend Services:**
```batch
# Terminal 1 - Main API Server
python server.py

# Terminal 2 - ADB Control Service
python adb_service.py

# Terminal 3 - Admin Dashboard
cd admin
start index.html
```

2. **Connect Device via ADB:**
```batch
# Connect USB first
adb tcpip 5555

# Connect wirelessly (replace with your device IP)
adb connect 192.168.29.61:5555

# Verify connection
adb devices
```

3. **Start Any App:**
```batch
# HatchCamera
cd APPS\HatchCamera
npx expo start

# MessagingApp
cd APPS\MessagingApp
npx expo start

# MyClass
cd APPS\MyClass
npx expo start
```

---

## 🌐 Network Configuration

**Current Network:** 192.168.29.x

**IP Addresses:**
- Server Host: `192.168.29.164`
- Main API: `http://192.168.29.164:5000`
- ADB Service: `http://192.168.29.164:5001`
- Device IP Example: `192.168.29.61`

**Updating IPs:**
If your network changes, update these files:
- `admin/admin.js` - Line 1: `API_URL`
- `adb_service.py` - Line 560+: Logging IP addresses
- App config files in each app's `src/config/` or similar

---

## 🔐 ADB Integration

### **How It Works:**

1. **Wireless Connection:**
   - Device must be on same WiFi network
   - Enable Developer Options → USB Debugging → Wireless ADB
   - Connect via `adb connect <DEVICE_IP>:5555`

2. **Exam Mode Lockdown:**
   - Enforcer thread runs every 2 seconds
   - Presses POWER button to wake screen (keyevent 26)
   - Forces HatchOS app to foreground
   - Presses HOME then reopens app (double enforcement)
   - Student CANNOT escape to other apps

3. **AI Monitoring (Optional):**
   - Takes screenshots every 10 seconds
   - Sends to OpenAI Vision API
   - Detects cheating/unauthorized apps
   - Auto force-stops detected apps
   - Logs violations to admin

4. **Commands Used:**
```bash
# Wake screen
adb -s <IP>:5555 shell input keyevent 26

# Force app open
adb -s <IP>:5555 shell am start -n com.hatchoscore/com.hatchoscore.MainActivity

# Get running apps
adb -s <IP>:5555 shell dumpsys activity activities

# Force stop app
adb -s <IP>:5555 shell am force-stop <package.name>

# Screenshot
adb -s <IP>:5555 shell screencap -p /sdcard/screenshot.png
adb -s <IP>:5555 pull /sdcard/screenshot.png
```

---

## 📦 Dependencies

### **Backend:**
```
Flask==3.0.0
flask-cors==6.0.1
pymongo==4.6.0
requests==2.31.0
```

### **Apps (Common):**
```
expo@~50.0.0
react-native
@react-navigation/native
@react-navigation/stack
axios
@tensorflow/tfjs
@tensorflow-models/nsfwjs
```

---

## 🎓 Use Cases

### **Exam Mode:**
1. Admin starts exam from dashboard
2. ADB service connects to student devices
3. Enforcer locks device to exam screen
4. AI monitors for cheating (optional)
5. Auto-ends after timer expires

### **Class Management:**
1. Teacher uses MyClass app
2. Posts assignments
3. Students submit via app
4. Teacher grades and gives feedback

### **Safe Media:**
1. Student uses HatchCamera
2. Takes photo/video
3. AI checks content in real-time
4. Blocks inappropriate content
5. Only safe media saved

---

## 🛠️ Troubleshooting

### **ADB Connection Issues:**
```batch
# Kill and restart ADB server
adb kill-server
adb start-server

# Reconnect device
adb connect <DEVICE_IP>:5555
```

### **App Won't Start:**
```batch
# Clear cache
npx expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

### **Server Errors:**
```batch
# Check if ports are in use
netstat -ano | findstr :5000
netstat -ano | findstr :5001

# Kill process if needed
taskkill /PID <PID> /F
```

---

## 📝 Notes

- **HatchOSCore app was deleted** - Will be rebuilt with new approach
- **Admin dashboard** - Currently being redesigned
- **All documentation consolidated** - Old .md files archived in this document
- **ADB enforcement WORKING** - Tested and confirmed on 192.168.29.61
- **AI monitoring** - Optional feature, requires OpenAI API key

---

## 🔄 Version History

**v2.0** (Oct 16, 2025):
- ✅ ADB wireless control working
- ✅ Exam mode enforcer implemented
- ✅ Power button wake fix applied
- ✅ Apps consolidated and documented
- 🔄 HatchOSCore being rebuilt
- 🔄 Admin dashboard redesign in progress

**v1.0** (Previous):
- Initial release
- Basic app functionality
- USB ADB only

---

## 🚀 Next Steps

1. Rebuild HatchOSCore with clean architecture
2. New admin dashboard design
3. Integrate AI monitoring with OpenAI
4. Add more sophisticated cheating detection
5. Parent/teacher analytics dashboard
6. Cloud deployment for backend

---

**For questions or issues, contact the development team.**
