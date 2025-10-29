@echo off
echo Starting Messaging App with Android environment...

REM Set Android SDK environment variables
set ANDROID_HOME=C:\
set ANDROID_SDK_ROOT=C:\
set PATH=%PATH%;C:\platform-tools

echo.
echo Environment variables set:
echo ANDROID_HOME=%ANDROID_HOME%
echo ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%
echo.

REM Navigate to MessagingApp directory
cd /d "%~dp0APPS\MessagingApp"

REM Start Expo
echo Starting Expo development server...
npm run start

pause
