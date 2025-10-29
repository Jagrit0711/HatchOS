@echo off
echo Opening Expo app on connected Android device...
echo.

REM Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr "192.168"') do (
    set LOCAL_IP=%%a
)

REM Remove leading spaces
set LOCAL_IP=%LOCAL_IP: =%

echo Detected IP: %LOCAL_IP%
echo Device: 192.168.0.6:33355

REM Try with localhost first (if device is on same network)
echo.
echo Opening Expo Go with exp://%LOCAL_IP%:8081
adb -s 192.168.0.6:33355 shell am start -a android.intent.action.VIEW -d "exp://%LOCAL_IP%:8081"

echo.
echo If the app doesn't open, try:
echo 1. Make sure Expo dev server is running (npm run start)
echo 2. Check that both devices are on the same network
echo 3. Open Expo Go manually and scan the QR code

pause
