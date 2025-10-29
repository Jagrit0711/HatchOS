@echo off
echo Starting MessagingApp with network access for Pi_5...
echo.

REM Set Android environment to bypass SDK check
set ANDROID_HOME=C:\
set ANDROID_SDK_ROOT=C:\
set PATH=%PATH%;C:\platform-tools

REM Navigate to MessagingApp
cd /d "%~dp0APPS\MessagingApp"

echo Starting Expo in LAN mode...
echo.
echo After server starts:
echo 1. Look for the QR code or LAN URL
echo 2. App will auto-open on Pi_5 via ADB
echo 3. Or manually open Expo Go on your device
echo.

REM Start expo
call npm run start -- --lan

pause
