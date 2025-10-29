# Android SDK Path Fix for HatchOS

## Problem
Expo cannot find the Android SDK because it expects a full SDK installation at the default location.

## Current Setup
- ADB installed at: `C:\platform-tools\adb.exe`
- Device connected wirelessly: `192.168.0.6:33355` (Pi_5)
- Missing full Android SDK structure (build-tools, platforms, etc.)

## Solutions

### Option 1: Use Expo Go App (Recommended for Development)
1. Install Expo Go on your Android device from Play Store
2. Start the development server with: `npm run start`
3. Scan the QR code with Expo Go app
4. Your app will load without needing the full Android SDK

### Option 2: Set Environment Variables (Temporary Fix)
Run these commands before starting Expo:
\`\`\`powershell
$env:ANDROID_HOME = "C:\"
$env:ANDROID_SDK_ROOT = "C:\"
$env:PATH += ";C:\platform-tools"
\`\`\`

Or use the provided batch file:
\`\`\`batch
set-android-env.bat
\`\`\`

### Option 3: Install Full Android SDK
1. Download Android Studio from: https://developer.android.com/studio
2. Install Android SDK to default location: `C:\Users\jagri\AppData\Local\Android\Sdk`
3. Or set custom location with ANDROID_HOME environment variable

### Option 4: Use Web Version
The web version is already working! Just press `w` in the Expo dev server menu.

## Quick Start Scripts Created

### start-messaging-app.bat
Starts the messaging app with Android environment variables set.

### set-android-env.bat  
Sets Android environment variables for the current session.

## Recommended Workflow
1. Use `npm run web` for quick web testing
2. Use Expo Go app for on-device testing (no SDK needed)
3. Install full Android SDK only if you need to build APKs
