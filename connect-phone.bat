@echo off
echo ======================================
echo Connect Phone via ADB Wireless
echo ======================================
echo.
echo Make sure:
echo 1. Phone is on same WiFi as PC
echo 2. Developer Options enabled
echo 3. Wireless debugging enabled
echo.
set /p PHONE_IP="Enter your phone's IP address: "
echo.
echo Connecting to %PHONE_IP%:5555...
adb connect %PHONE_IP%:5555
echo.
echo Testing connection...
adb devices
echo.
pause
