# HatchOS Messaging - APK Build Instructions

## 🚀 Quick Start (Recommended)

Simply double-click `BUILD-NOW.bat` and follow the prompts!

## 📦 Build Methods

### Method 1: EAS Cloud Build (Easiest - Recommended)

**Advantages:**
- No Android Studio required
- No local Android SDK setup needed
- Builds in the cloud
- Works on any machine

**Steps:**
1. Create a free Expo account at https://expo.dev
2. Run `BUILD-NOW.bat` OR manually:
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android --profile preview
   ```
3. Wait for the build to complete (usually 5-15 minutes)
4. Download your APK from the provided link

**Build Profiles Available:**
- `preview` - For testing (creates APK)
- `production` - For release (creates APK)
- `development` - For development with Expo Go features

### Method 2: Local Build

**Advantages:**
- Complete control over the build
- Faster iterations (no upload time)
- No internet required after setup

**Requirements:**
- Android Studio installed
- Android SDK (API 33+)
- ANDROID_HOME environment variable set
- JDK 17 or higher

**Steps:**
1. Set up Android Studio and SDK
2. Run `BUILD-APK.bat` and choose option 2, OR manually:
   ```bash
   eas build --platform android --profile local --local
   ```

## 🔧 Configuration Files

### `eas.json`
Contains build configurations:
- `preview`: Quick APK builds for testing
- `production`: Release-ready APK builds
- `local`: Local machine builds

### `app.json`
Contains app metadata:
- App name: "HatchOS Messaging"
- Package: `com.hatchos.messaging`
- Version: 1.0.0

## 📱 Installing the APK

After building:
1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Open the APK file and install

## 🐛 Troubleshooting

### "eas: command not found"
Run: `npm install -g eas-cli`

### "Not logged in"
Run: `eas login`

### Build fails with dependency errors
Run: `npm install` in the MessagingApp directory

### Local build fails
Ensure Android Studio and SDK are properly installed:
- Check ANDROID_HOME: `echo %ANDROID_HOME%`
- Should point to your Android SDK folder

## 📊 Build Output

APK files will be:
- **Cloud builds**: Downloaded from the provided URL
- **Local builds**: Found in `android/app/build/outputs/apk/`

## 🔄 Updating the App

To build a new version:
1. Update `version` in `app.json`
2. Update `versionCode` if needed
3. Run the build command again

## 📞 Server Configuration

Make sure to update the server URL in your app before building:
- Check `src/config.js` or wherever your API endpoint is defined
- Replace `localhost` with your actual server IP/domain

## 🎯 Quick Commands Reference

```bash
# Cloud build (APK)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production

# Local build
eas build --platform android --profile local --local

# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

## ✅ Pre-Build Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] Server URL configured correctly
- [ ] App version updated in `app.json`
- [ ] Assets (icons, splash screen) are in place
- [ ] Tested on Expo Go or development build
- [ ] Logged into EAS CLI (for cloud builds)

---

**Need help?** Check the Expo documentation: https://docs.expo.dev/build/setup/
