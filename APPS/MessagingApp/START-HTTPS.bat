@echo off
echo ====================================
echo Starting MessagingApp with HTTPS
echo ====================================
echo.
echo Access via: https://192.168.29.164:19006
echo PWA Install: Available after accepting certificate!
echo.
cd /d C:\Users\jagri\OneDrive\Documents\HatchOS\APPS\MessagingApp
npx expo start --web --host lan --port 19006 --https --clear
