# 🎉 Building APK with Android Studio - Quick Guide

## ✅ Step-by-Step Instructions

### 1️⃣ First: Find Your Android SDK Location

Open Android Studio and:
1. Click on **"More Actions"** or **"Configure"** on welcome screen
2. Select **"SDK Manager"**
3. Look at the top for **"Android SDK Location"**
4. Copy that path (e.g., `C:\Users\YourName\AppData\Local\Android\Sdk`)

**OR** just run the build script - it will auto-detect!

---

### 2️⃣ Run the Build Script

Simply double-click: **`BUILD-WITH-STUDIO.bat`**

The script will:
- ✅ Auto-find your Android SDK
- ✅ Install dependencies
- ✅ Generate Android project
- ✅ Build the APK (takes 5-10 min)
- ✅ Open the folder with your APK

---

### 3️⃣ If Auto-Detection Fails

Manually set ANDROID_HOME (one-time setup):

```powershell
# Replace with YOUR SDK path from Android Studio
setx ANDROID_HOME "C:\Users\jagri\AppData\Local\Android\Sdk"
```

Common SDK locations:
- `C:\Users\YourName\AppData\Local\Android\Sdk`
- `C:\Android\Sdk`
- `C:\Users\YourName\Android\Sdk`

---

## 🚀 Quick Commands (If you prefer terminal)

```powershell
# Set SDK path (replace with your path)
$env:ANDROID_HOME = "C:\Users\jagri\AppData\Local\Android\Sdk"

# Install dependencies
npm install

# Generate Android project
npx expo prebuild --platform android --clean

# Build APK
cd android
.\gradlew.bat assembleDebug
cd ..

# Your APK is at:
# android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 🐛 Common Issues & Fixes

### Issue: "SDK not found"
**Fix**: Open Android Studio > SDK Manager, note the SDK location, then:
```powershell
setx ANDROID_HOME "YOUR_SDK_PATH_HERE"
```

### Issue: "Gradle build failed"
**Fix**: 
1. Open Android Studio
2. Tools > SDK Manager > SDK Tools tab
3. Install: "Android SDK Build-Tools 33" and "Android SDK Platform 33"

### Issue: "Java version error"
**Fix**: In Android Studio
1. File > Settings > Build Tools > Gradle
2. Set "Gradle JDK" to version 17 or higher
3. Download JDK 17 if needed

### Issue: "gradlew.bat not found"
**Fix**: First run `npx expo prebuild --platform android` to generate the android folder

---

## 📁 Where is my APK?

After successful build:
```
APPS/MessagingApp/android/app/build/outputs/apk/debug/app-debug.apk
```

This is your APK file! Transfer it to your Android phone and install.

---

## 📱 Installing on Phone

1. Transfer `app-debug.apk` to your phone (USB, email, cloud)
2. On phone: Settings > Security > Enable "Install Unknown Apps"
3. Open the APK file on your phone
4. Tap "Install"

---

## ⏱️ Build Times

- First build: **10-15 minutes** (downloading dependencies)
- Subsequent builds: **3-5 minutes**

---

## 🎯 What to Do NOW

**Option 1: Use the auto-script (Recommended)**
```
Double-click: BUILD-WITH-STUDIO.bat
```

**Option 2: Manual build**
```powershell
cd APPS\MessagingApp
npm install
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
```

The APK will be ready in 10 minutes! 🚀

---

## 💡 Pro Tips

- **Clean build** if errors: `cd android && .\gradlew.bat clean`
- **Release APK** (smaller, optimized): `.\gradlew.bat assembleRelease`
- **Check Gradle tasks**: `.\gradlew.bat tasks`
- **Debug on device**: `npx expo run:android`

---

## 📞 Need Help?

If the build fails, check:
1. Android Studio is fully set up (opened at least once)
2. SDK is installed (check in SDK Manager)
3. ANDROID_HOME is set correctly
4. Java/JDK 17+ is installed

Run: `npx expo-doctor` to diagnose issues.
