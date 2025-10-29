@echo off
echo ====================================
echo MessagingApp - Simple HTTP Start
echo ====================================
echo.
echo Starting Expo on HTTP (no tunnel)
echo Access via: http://192.168.29.164:19006
echo.
echo NOTE: This works immediately with your Flask server
echo PWA install won't work (needs HTTPS) but app will function
echo.
cd /d C:\Users\jagri\OneDrive\Documents\HatchOS\APPS\MessagingApp
npx expo start --web --host lan --port 19006 --clear
