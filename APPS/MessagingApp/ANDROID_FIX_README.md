# MessagingApp Android Fix - Development Build Required

## Problem
The app crashes on Android with this error:
```
Permission Denial: registerScreenCaptureObserver requires android.permission.DETECT_SCREEN_CAPTURE
```

## Why This Happens
- Expo SDK 50's `expo-modules-core` tries to register a screen capture observer
- Expo Go app doesn't have this permission (and can't request it)
- The error happens in native code BEFORE any JavaScript runs
- **This is why the web version works but Android doesn't**

## Solutions

### Option 1: Build a Development APK (RECOMMENDED)
This creates a standalone app with the correct permissions.

```bash
cd C:\Users\jagri\OneDrive\Documents\HatchOS\APPS\MessagingApp
npx expo install expo-dev-client
npx expo run:android
```

This will:
- Install the development client
- Build an APK with all required permissions
- Install it on your device
- The app will work without Expo Go

### Option 2: Downgrade expo-modules-core
```bash
npm install expo-modules-core@1.11.8
```

Then restart Metro and try again.

### Option 3: Use Web Version
The web version works perfectly! Just use:
```bash
npm run web
```

## Current Status
- ✅ Web version: **WORKING**
- ❌ Android (Expo Go): **BLOCKED BY PERMISSION**
- ⏳ Android (Dev Build): **NOT YET CREATED**

## Recommendation
For a hackathon/demo, the **web version is fastest and works great**. For a production Android app, build the development APK.
