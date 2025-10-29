@echo off
echo ========================================
echo HatchOS MessagingApp - Quick Start
echo ========================================
echo.
echo Starting Expo Metro Server...
echo Server will run on: http://192.168.0.5:8081
echo.
echo KEEP THIS WINDOW OPEN!
echo.

cd /d "%~dp0"
npm run start

pause
