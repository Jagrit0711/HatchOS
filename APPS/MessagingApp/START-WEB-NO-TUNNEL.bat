@echo off
echo ====================================
echo Starting MessagingApp (HTTP - No Tunnel)
echo ====================================
echo.
echo This will start on HTTP (no PWA install but no mixed content errors)
echo Access via: http://192.168.29.164:19006
echo.
cd /d C:\Users\jagri\OneDrive\Documents\HatchOS\APPS\MessagingApp
npx expo start --web --host lan --port 19006 --clear
