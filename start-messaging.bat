@echo off
echo ========================================
echo Starting HatchOS MessagingApp
echo ========================================
echo.

REM Set Android environment variables to suppress SDK warnings
set ANDROID_HOME=C:\
set ANDROID_SDK_ROOT=C:\
set PATH=%PATH%;C:\platform-tools

REM Navigate to MessagingApp directory
cd /d "%~dp0APPS\MessagingApp"

echo Environment configured:
echo - ANDROID_HOME: %ANDROID_HOME%
echo - Device: Pi_5 (192.168.0.6:33355)
echo.
echo Starting Expo development server...
echo.
echo ========================================
echo QUICK COMMANDS:
echo ========================================
echo Press 'a' - Open on Android (auto)
echo Press 'w' - Open on Web browser
echo Press 'r' - Reload app
echo Press 'j' - Open debugger
echo.
echo Note: Android SDK warnings are expected
echo The app will still work via Expo Go!
echo ========================================
echo.

REM Start Expo
npm run start

pause
