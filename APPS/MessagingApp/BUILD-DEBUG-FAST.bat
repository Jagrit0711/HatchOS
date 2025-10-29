@echo off
echo ========================================
echo  FASTEST BUILD - DEBUG APK (No Queue!)
echo ========================================
echo.
echo This creates a DEBUG APK in under 5 minutes
echo No signing, no optimization - just for testing!
echo.

REM Check if ANDROID_HOME is set
if "%ANDROID_HOME%"=="" (
    echo Setting ANDROID_HOME...
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
    ) else if exist "C:\Android\Sdk" (
        set ANDROID_HOME=C:\Android\Sdk
    ) else (
        echo ERROR: Android SDK not found!
        echo Install Android Studio from: https://developer.android.com/studio
        pause
        exit /b 1
    )
)

echo Android SDK: %ANDROID_HOME%
set PATH=%ANDROID_HOME%\platform-tools;%PATH%
echo.

echo Installing dependencies (if needed)...
if not exist "node_modules" (
    call npm install
)
echo.

echo Generating Android project...
call npx expo prebuild --platform android
echo.

echo Building DEBUG APK...
cd android
call gradlew assembleDebug
cd ..
echo.

echo ========================================
echo DEBUG APK READY!
echo ========================================
echo.
echo Location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Installing to connected device (if any)...
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause

explorer android\app\build\outputs\apk\debug
