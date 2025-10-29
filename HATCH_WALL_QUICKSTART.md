# Hatch Wall - Quick Start Guide 🚀

## What is Hatch Wall?

Hatch Wall is an **on-device firewall app** that protects students from harmful and distracting content while they learn. It uses **AI to analyze network traffic** and blocks inappropriate websites, apps, and content - all while respecting student privacy.

## 🎯 Quick Start (3 Steps)

### Step 1: Start the System

Double-click `start-hatch-wall.bat` in the HatchOS folder.

This will:
- ✅ Start the backend server (Python)
- ✅ Install app dependencies (if needed)
- ✅ Launch Expo development server

### Step 2: Run on Your Phone

1. **Install Expo Go** on your Android/iOS device:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Open the app on your device**:
   
   **Method 1 (Easiest)**: Double-click `open-hatch-wall-android.bat`
   
   **Method 2**: Scan the QR code shown in the terminal with Expo Go
   
   **Method 3**: Open Expo Go → "Enter URL manually" → Type: `exp://192.168.29.164:8081`
   
   ⚠️ **Don't press 'a' for Android** - it requires Android SDK which you don't need!

3. **Wait for the app to load** on your device

### Step 3: Login & Setup

1. **Login** with your HatchOS credentials:
   - Email: (your existing HatchOS account)
   - Password: (your existing password)

2. **Complete onboarding** (4 screens):
   - Welcome
   - Privacy explanation
   - AI detection info
   - Grant permissions

3. **Done!** The app is now protecting your device 🛡️

## 📱 For Students

### Using the App

- **Home Screen**: See your protection stats
  - Blocked attempts today
  - Protected hours
  - Violation count

- **Settings**: Customize protection
  - Enable/disable protection
  - Toggle AI detection
  - Configure notifications
  - Test URL filter

### What Gets Blocked

🚫 **Social Media**: Facebook, Instagram, TikTok, Snapchat  
🚫 **Gaming**: Steam, Roblox, Minecraft  
🚫 **Streaming**: Netflix, YouTube, Twitch  
🚫 **Gambling**: All gambling sites  
🚫 **Harmful**: Adult content, malware, phishing  

### What's Allowed

✅ **Educational**: Google, Wikipedia, Khan Academy  
✅ **School Tools**: Google Classroom, Zoom  
✅ **Development**: GitHub, StackOverflow  

## 👨‍💼 For Administrators

### Access Admin Dashboard

1. **Open your browser**
2. **Navigate to**: `http://192.168.29.164:5000/admin/hatch-wall.html`
3. **View dashboard** with:
   - Total protected devices
   - Violation statistics
   - Active students
   - Recent violations

### Managing Violations

1. **View violations** in the dashboard
2. **Filter** by All/Pending/Resolved
3. **Click "Resolve"** to clear a violation
4. **Monitor** student safety in real-time

### Customizing Policies

Edit `APPS/HatchWall/config/firewall.config.js`:

```javascript
DEFAULT_BLOCKLIST: [
  'facebook.com',
  'instagram.com',
  // Add your domains here
]
```

Then restart the app for changes to take effect.

## 🔧 Troubleshooting

### App won't start

**Problem**: Expo shows errors  
**Solution**: 
```bash
cd APPS/HatchWall
npm install
npm start
```

### Android SDK Error

**Problem**: "Failed to resolve the Android SDK path"  
**Solution**: Don't press 'a' in Expo! Instead:
- Use `open-hatch-wall-android.bat`
- Or scan the QR code with Expo Go
- See [ANDROID_SDK_FIX.md](APPS/HatchWall/ANDROID_SDK_FIX.md) for details

### Can't login

**Problem**: "Invalid credentials"  
**Solution**: 
1. Make sure server is running (`python server.py`)
2. Use an existing HatchOS account
3. Check server IP in `config/firewall.config.js`

### Content not being blocked

**Problem**: Blocked sites still accessible  
**Solution**:
1. Check Settings → Enable Protection is ON
2. Verify VPN permissions granted
3. Restart the app
4. Check backend connection

### Admin dashboard not loading

**Problem**: Dashboard shows no data  
**Solution**:
1. Verify server is running
2. Check correct URL (use your server IP)
3. Ensure at least one device is registered
4. Refresh the page

### Background service not working

**Problem**: Protection stops when app is closed  
**Solution**:
1. Grant background permissions
2. Disable battery optimization
3. Enable "Run in background" in app settings

## 📊 Understanding the Data

### Privacy Notice

**What We Collect**:
- ✅ Violation events (URL, timestamp, type)
- ✅ Device status (online/offline)
- ✅ Protection statistics

**What We DON'T Collect**:
- ❌ Full browsing history
- ❌ Personal messages
- ❌ Passwords or credentials
- ❌ App data or files

All filtering happens **on the device**. Only violation summaries are sent to admins.

## 🧪 Testing the System

### Test 1: URL Filter

1. Open app → Settings
2. Tap "🧪 Test URL Filter"
3. Enter: `https://facebook.com`
4. Expected: "URL Blocked 🚫"

### Test 2: Violation Reporting

1. Try to access a blocked site
2. Open admin dashboard
3. Should see violation in "Recent Violations"
4. Click "Resolve"

### Test 3: AI Detection

1. Test URL: `https://example-phishing-site.tk`
2. Should be blocked by AI (suspicious TLD)
3. Check dashboard for "Phishing Attempt" violation

## 📞 Support

### Common Questions

**Q: Will this slow down my device?**  
A: No. Hatch Wall uses minimal resources and has <5% battery impact.

**Q: Can students disable the app?**  
A: Students can logout, but admins will be notified when protection stops.

**Q: Does it work on Wi-Fi and mobile data?**  
A: Yes, it monitors all network traffic regardless of connection type.

**Q: Can I allow specific sites for specific students?**  
A: Yes! Admins can customize policies per device via the API.

**Q: What if a legitimate site is blocked?**  
A: Contact your admin to add it to the allowlist.

### Get Help

1. Check the [full README](APPS/HatchWall/README.md)
2. Review server logs: `logs/console.log`
3. Contact your HatchOS administrator

## 🎓 For Developers

### Project Structure

```
HatchWall/
├── screens/          # UI screens
├── services/         # Core logic
├── config/           # Configuration
└── README.md         # Full docs
```

### Key Files

- `services/FirewallEngine.js` - Core filtering logic
- `services/AIDetectionService.js` - AI-based URL analysis
- `config/firewall.config.js` - Blocklists & settings
- `server.py` - Backend API (lines 567-720)

### Extending the System

1. **Add new blocked category**:
   - Edit `config/firewall.config.js`
   - Add domains to `DEFAULT_BLOCKLIST`

2. **Customize AI patterns**:
   - Edit `AI_CONFIG.SUSPICIOUS_PATTERNS`
   - Add regex patterns for detection

3. **Create new violation type**:
   - Add to `VIOLATION_TYPES`
   - Update `AIDetectionService.js`
   - Update admin dashboard

## 🚀 Next Steps

1. **Deploy to production**:
   ```bash
   expo build:android
   expo build:ios
   ```

2. **Scale the system**:
   - Add more devices
   - Customize policies per class
   - Set up monitoring alerts

3. **Enhance features**:
   - Add scheduling (school hours)
   - Implement Focus Mode
   - Add parent notifications

---

**Need help?** Read the [full documentation](APPS/HatchWall/README.md) or check [HATCH_WALL_COMPLETE.md](HATCH_WALL_COMPLETE.md) for implementation details.

**Ready to protect students?** Run `start-hatch-wall.bat` and get started! 🛡️
