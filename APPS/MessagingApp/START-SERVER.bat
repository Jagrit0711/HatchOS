@echo off
title HatchOS MessagingApp Server
echo ==========================================
echo   HatchOS MessagingApp Development Server
echo ==========================================
echo.
echo Starting Metro Bundler...
echo Server URL: http://192.168.0.5:8082
echo.
echo IMPORTANT: KEEP THIS WINDOW OPEN!
echo.
echo After the QR code appears, manually scan it
echo with Expo Go, or run this command:
echo.
echo adb -s 192.168.0.6:33355 shell am start -a android.intent.action.VIEW -d "exp://192.168.0.5:8082"
echo.
echo ==========================================

cd /d "%~dp0"
npx expo start --port 8082 --lan --no-dev-client

pause
