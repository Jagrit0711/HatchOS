@echo off
echo ========================================
echo  FAST LOCAL APK BUILD (No Queue!)
echo ========================================
echo.
echo This builds APK locally using Expo prebuild + Gradle
echo Requirement: Android Studio installed (or Android SDK)
echo.
echo Checking requirements...
echo.

REM Check if ANDROID_HOME is set
if "%ANDROID_HOME%"=="" (
    echo WARNING: ANDROID_HOME not set!
    echo.
    echo Trying common Android SDK locations...
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
        echo Found SDK at: %ANDROID_HOME%
    ) else if exist "C:\Android\Sdk" (
        set ANDROID_HOME=C:\Android\Sdk
        echo Found SDK at: %ANDROID_HOME%
    ) else (
        echo ERROR: Android SDK not found!
        echo Please install Android Studio or set ANDROID_HOME
        echo.
        pause
        exit /b 1
    )
)

echo Android SDK: %ANDROID_HOME%
echo.
echo Installing dependencies...
call npm install
echo.

echo Step 1: Generating native Android project...
call npx expo prebuild --platform android --clean
echo.

echo Step 2: Building APK with Gradle...
cd android
call gradlew assembleRelease
cd ..
echo.

echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Your APK is located at:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo You can install this on your Android device!
echo.
pause

REM Open the folder
explorer android\app\build\outputs\apk\release
