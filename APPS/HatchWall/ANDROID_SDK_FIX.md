# Fixing Android SDK Errors in Expo

## The Problem

When you press 'a' in Expo to open on Android, you see:
```
Failed to resolve the Android SDK path. Default install location not found: C:\Users\jagri\AppData\Local\Android\Sdk
```

## Why It Happens

Expo's Android emulator feature requires Android SDK to be installed. However, **you don't need the SDK if you're using a physical device**!

## Solution 1: Use Physical Device Directly (Recommended)

Instead of pressing 'a' in Expo, use this command to open on your connected device:

### Quick Method
```bash
adb shell am start -a android.intent.action.VIEW -d "exp://192.168.29.164:8081"
```

### Or Use Our Helper Script
Double-click: `open-hatch-wall-android.bat`

This script will:
- ✅ Check if device is connected
- ✅ Verify Expo Go is installed
- ✅ Open the app automatically
- ✅ No Android SDK required!

## Solution 2: Use QR Code (Easiest)

1. Keep the Expo development server running
2. Open **Expo Go** app on your phone
3. Tap **"Scan QR code"**
4. Scan the QR code shown in the terminal
5. Done! App loads automatically

## Solution 3: Manual URL Entry

If QR doesn't work:

1. Open **Expo Go** on your phone
2. Tap **"Enter URL manually"**
3. Type: `exp://192.168.29.164:8081`
4. Tap **"Connect"**

## Solution 4: Install Android SDK (Not Recommended)

Only do this if you want to use the Android Emulator:

1. Download [Android Studio](https://developer.android.com/studio)
2. Install Android SDK
3. Set environment variable:
   ```bash
   setx ANDROID_HOME "C:\Users\jagri\AppData\Local\Android\Sdk"
   ```
4. Restart terminal
5. Run emulator setup: `npx expo install android`

**Note**: This is unnecessary for physical device testing.

## Best Practice for Hatch Wall

Since Hatch Wall is a **device protection app**, you should always test on a **real physical device**, not an emulator. This ensures:

- ✅ Real network traffic routing
- ✅ Accurate battery impact testing
- ✅ True device permissions
- ✅ Realistic performance
- ✅ VPN profile testing

## Quick Reference

### Your Device Info
- **IP**: 192.168.0.6
- **ADB Port**: 33355
- **Connection**: `adb -s 192.168.0.6:33355`

### Open App Commands
```bash
# Connect to device (if wireless)
adb connect 192.168.0.6:33355

# Open Hatch Wall
adb shell am start -a android.intent.action.VIEW -d "exp://192.168.29.164:8081"

# Or use our script
open-hatch-wall-android.bat
```

### Check Device Status
```bash
# List connected devices
adb devices

# Check if Expo Go is installed
adb shell pm list packages | findstr expo

# View device logs
adb logcat | findstr -i expo
```

## Summary

**Don't press 'a' in Expo!** Instead:

1. **Best**: Use `open-hatch-wall-android.bat`
2. **Good**: Scan QR code with Expo Go
3. **Okay**: Manually enter URL in Expo Go
4. **Avoid**: Installing Android SDK (unnecessary)

Your app is already running and accessible on your device. The SDK error is just about the emulator feature you don't need! 🎉
