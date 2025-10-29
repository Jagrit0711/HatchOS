@echo off
echo ========================================
echo  Building APK with Android Studio
echo ========================================
echo.

REM Find Android SDK
echo Looking for Android SDK...

set SDK_FOUND=0

if exist "%LOCALAPPDATA%\Android\Sdk" (
    set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
    set SDK_FOUND=1
    echo Found SDK at: %LOCALAPPDATA%\Android\Sdk
)

if %SDK_FOUND%==0 if exist "C:\Android\Sdk" (
    set ANDROID_HOME=C:\Android\Sdk
    set SDK_FOUND=1
    echo Found SDK at: C:\Android\Sdk
)

if %SDK_FOUND%==0 if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
    set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
    set SDK_FOUND=1
    echo Found SDK at: %USERPROFILE%\AppData\Local\Android\Sdk
)

if %SDK_FOUND%==0 (
    echo.
    echo ERROR: Android SDK not found!
    echo.
    echo Please open Android Studio and:
    echo 1. Go to: Tools ^> SDK Manager
    echo 2. Note the "Android SDK Location" path
    echo 3. Then run this script again
    echo.
    echo OR manually set ANDROID_HOME:
    echo setx ANDROID_HOME "C:\path\to\your\sdk"
    echo.
    pause
    exit /b 1
)

echo Android SDK: %ANDROID_HOME%
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%

echo.
echo ========================================
echo Step 1: Installing dependencies
echo ========================================
call npm install

echo.
echo ========================================
echo Step 2: Generating Android project
echo ========================================
echo This creates the android folder with native code...
call npx expo prebuild --platform android --clean

if errorlevel 1 (
    echo.
    echo ERROR: Failed to generate Android project!
    echo Try: npx expo-doctor
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Building APK (This takes 5-10 min)
echo ========================================
cd android

echo Building debug APK...
call gradlew.bat assembleDebug

if errorlevel 1 (
    echo.
    echo Build failed! Common fixes:
    echo 1. Open Android Studio
    echo 2. File ^> Settings ^> Build, Execution, Deployment ^> Build Tools ^> Gradle
    echo 3. Make sure Gradle JDK is set to version 17 or higher
    echo.
    pause
    cd ..
    exit /b 1
)

cd ..

echo.
echo ========================================
echo ✅ SUCCESS! APK BUILT!
echo ========================================
echo.
echo Your APK location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo File size:
dir android\app\build\outputs\apk\debug\app-debug.apk | find "app-debug.apk"
echo.
echo Opening APK folder...
explorer android\app\build\outputs\apk\debug
echo.
echo ========================================
echo To install on your phone:
echo 1. Transfer app-debug.apk to your phone
echo 2. Enable "Install from Unknown Sources"
echo 3. Tap the APK to install
echo ========================================
pause
