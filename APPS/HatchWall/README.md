# Hatch Wall 🛡️

> Next-generation, on-device firewall application for students built with Expo

## Overview

Hatch Wall is an intelligent firewall app that creates a safer and more focused digital environment for learning. By leveraging on-device AI, it monitors network activity to identify and block distracting or harmful content in real-time.

## Features

### ✨ Core Functionality

- **🔒 On-Device Protection**: All monitoring happens locally on the device
- **🤖 AI-Powered Detection**: Advanced ML models analyze URLs and behavior patterns
- **🛡️ Real-Time Filtering**: Instant blocking of harmful and distracting content
- **📊 Admin Dashboard**: Comprehensive violation tracking and device management
- **🔄 Policy Sync**: Automatic policy updates from central admin
- **⚡ Silent Operation**: Runs in background with minimal battery impact

### 🎯 Content Categories Blocked

- Adult & Inappropriate Content
- Social Media (Instagram, TikTok, Snapchat, etc.)
- Gaming Sites & Platforms
- Streaming Services (Netflix, YouTube)
- Gambling Sites
- Malware & Phishing Attempts

### ✅ Allowed Content

- Educational Resources (Khan Academy, Coursera, edX)
- School Tools (Google Classroom, Zoom)
- Research Sites (Wikipedia, Google, StackOverflow)
- Productivity Apps

## Architecture

### Mobile App (React Native/Expo)

```
HatchWall/
├── App.js                      # Main app entry
├── screens/
│   ├── LoginScreen.js          # Authentication
│   ├── OnboardingScreen.js     # Setup wizard
│   ├── HomeScreen.js           # Dashboard
│   └── SettingsScreen.js       # Configuration
├── services/
│   ├── AuthService.js          # Authentication logic
│   ├── FirewallEngine.js       # Core filtering engine
│   ├── AIDetectionService.js   # ML-based URL analysis
│   └── BackgroundService.js    # Background monitoring
└── config/
    └── firewall.config.js      # Blocklists & settings
```

### Backend API

The app integrates with the existing HatchOS server (`server.py`) with these endpoints:

- `POST /api/firewall/register-device` - Register new device
- `GET /api/firewall/policies/:deviceId` - Get filtering policies
- `POST /api/firewall/heartbeat` - Device heartbeat
- `POST /api/firewall/violations` - Report violations
- `GET /api/firewall/violations` - Get violation history
- `GET /api/firewall/devices` - Get all protected devices

## Installation

### Prerequisites

- Node.js 16+
- Expo CLI
- MongoDB (running on localhost:27017)
- Python 3.8+ (for backend)

### Setup

1. **Navigate to the app directory**:
   ```bash
   cd APPS/HatchWall
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the backend server** (if not already running):
   ```bash
   cd ../..
   python server.py
   ```

4. **Start the Expo dev server**:
   ```bash
   npm start
   ```

5. **Run on device**:
   - Scan QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator

## Configuration

### Update Server URL

Edit `config/firewall.config.js`:

```javascript
export const API_BASE_URL = 'http://YOUR_SERVER_IP:5000/api';
```

### Customize Blocklists

Edit `config/firewall.config.js` to add or remove blocked domains:

```javascript
DEFAULT_BLOCKLIST: [
  'facebook.com',
  'instagram.com',
  // Add your domains here
]
```

## Usage

### For Students

1. **Login** with your HatchOS credentials
2. **Complete onboarding** - Grant necessary permissions
3. **Stay protected** - App runs silently in background
4. **View stats** - Check your protection dashboard

### For Administrators

1. **Access Admin Dashboard**:
   ```
   http://YOUR_SERVER_IP:5000/admin/hatch-wall.html
   ```

2. **Monitor violations** - View all policy violations in real-time
3. **Manage devices** - See all protected devices and their status
4. **Resolve violations** - Review and resolve flagged content
5. **Update policies** - Customize blocklists per device

## How It Works

### 1. Traffic Monitoring

The app uses a local VPN profile to route all device traffic through the firewall engine. This allows it to:

- Intercept all network requests
- Analyze URLs before they're accessed
- Block harmful content instantly
- Log policy violations

### 2. AI Detection

The on-device AI analyzes URLs using:

- **Heuristic Pattern Matching**: Detects known malicious patterns
- **Behavioral Analysis**: Analyzes URL structure and characteristics
- **Category Classification**: Categorizes websites in real-time
- **Phishing Detection**: Identifies potential phishing attempts

### 3. Violation Reporting

When a policy violation occurs:

1. The event is logged locally
2. A summary is sent to the backend (NOT full browsing history)
3. Admins are notified via the dashboard
4. The request is blocked before reaching the browser

## Privacy & Security

### What We Collect

- ✅ Policy violation events (URL, timestamp, type)
- ✅ Device heartbeat (online status)
- ✅ Violation statistics

### What We DON'T Collect

- ❌ Full browsing history
- ❌ Personal conversations
- ❌ App data or files
- ❌ Passwords or credentials

### Security Features

- 🔐 Secure token storage (expo-secure-store)
- 🔒 Encrypted API communication
- 🛡️ On-device AI processing
- 📱 Local-first architecture

## API Reference

### Firewall Engine

```javascript
import FirewallEngine from './services/FirewallEngine';

// Initialize
await FirewallEngine.initialize();

// Analyze URL
const result = await FirewallEngine.analyzeUrl('https://example.com');
// Returns: { allowed: boolean, reason: string }

// Get status
const status = await FirewallEngine.getStatus();
// Returns: { isRunning: boolean, blocklistSize: number, ... }
```

### AI Detection Service

```javascript
import AIDetectionService from './services/AIDetectionService';

// Analyze URL
const result = await AIDetectionService.analyzeUrl(url);
// Returns: { safe: boolean, reason: string, confidence: number, category: string }

// Categorize website
const category = await AIDetectionService.categorizeWebsite(url);
// Returns: { category: string, confidence: number }
```

## Troubleshooting

### App not blocking content

1. Check if protection is enabled in Settings
2. Verify VPN profile is active
3. Ensure backend server is running
4. Check network connectivity

### Violations not showing in admin dashboard

1. Verify device is registered
2. Check heartbeat is being sent
3. Confirm backend URL is correct
4. Check MongoDB connection

### Background service not running

1. Grant background permissions
2. Disable battery optimization for the app
3. Check Background Fetch status
4. Restart the app

## Development

### Run Tests

```bash
npm test
```

### Build APK (Android)

```bash
expo build:android
```

### Build IPA (iOS)

```bash
expo build:ios
```

## Roadmap

### v1.1 (Future)
- [ ] Scheduled filtering (school hours vs. evening)
- [ ] Student self-regulation dashboard
- [ ] YouTube category-based filtering
- [ ] Student-initiated "Focus Mode"
- [ ] Parent notifications
- [ ] Whitelist requests from students

### v1.2 (Future)
- [ ] Advanced ML models for content classification
- [ ] Multiple admin roles
- [ ] Custom policy templates
- [ ] Export violation reports
- [ ] Screen time tracking

## Contributing

This is part of the HatchOS ecosystem. For contributions:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit a pull request

## License

© 2025 HatchOS. All rights reserved.

## Support

For issues or questions:
- Check the troubleshooting section
- Review server logs: `logs/console.log`
- Contact your HatchOS administrator

---

**Built with ❤️ using Expo, React Native, and AI**
