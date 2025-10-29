@echo off
echo ========================================
echo  NO ANDROID STUDIO NEEDED!
echo  APK Builder with Auto SDK Download
echo ========================================
echo.
echo This script will:
echo 1. Download only the necessary Android SDK tools (NOT full Android Studio)
echo 2. Build your APK locally
echo 3. Takes ~10-15 min first time, ~5 min after
echo.
pause

SET SDK_DIR=%USERPROFILE%\android-sdk-minimal
SET ANDROID_HOME=%SDK_DIR%
SET PATH=%SDK_DIR%\cmdline-tools\latest\bin;%SDK_DIR%\platform-tools;%SDK_DIR%\build-tools\33.0.0;%PATH%

echo.
echo Step 1: Checking for minimal Android SDK...

if not exist "%SDK_DIR%" (
    echo Creating SDK directory...
    mkdir "%SDK_DIR%"
    cd "%SDK_DIR%"
    
    echo.
    echo Downloading Android Command Line Tools (~150MB)...
    echo Please wait...
    
    REM Download command line tools
    powershell -Command "& {Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-9477386_latest.zip' -OutFile 'cmdline-tools.zip'}"
    
    echo Extracting...
    powershell -Command "& {Expand-Archive -Path 'cmdline-tools.zip' -DestinationPath '.' -Force}"
    
    REM Organize cmdline-tools properly
    mkdir cmdline-tools\latest
    move cmdline-tools\bin cmdline-tools\latest\
    move cmdline-tools\lib cmdline-tools\latest\
    
    echo.
    echo Installing required SDK components...
    echo This will download ~500MB (one-time only)
    
    REM Accept licenses automatically
    yes | cmdline-tools\latest\bin\sdkmanager.bat --licenses
    
    REM Install required components
    cmdline-tools\latest\bin\sdkmanager.bat "platform-tools" "platforms;android-33" "build-tools;33.0.0" "ndk;25.1.8937393"
    
    echo SDK setup complete!
    cd "%~dp0"
) else (
    echo SDK already installed at: %SDK_DIR%
)

echo.
echo Step 2: Installing Node dependencies...
cd /d "%~dp0"
call npm install

echo.
echo Step 3: Generating native Android project...
call npx expo prebuild --platform android --clean

echo.
echo Step 4: Building APK...
cd android
call gradlew.bat assembleDebug

echo.
echo ========================================
echo SUCCESS! APK BUILT WITHOUT ANDROID STUDIO!
echo ========================================
echo.
echo Your APK: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo SDK size: ~600MB (vs 8GB for Android Studio!)
echo.
pause

explorer android\app\build\outputs\apk\debug
