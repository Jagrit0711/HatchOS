@echo off
title Connect Device to ADB
color 0E

echo ============================================================
echo     HatchOS Core - Connect Device via ADB
echo ============================================================
echo.

echo What is your device's IP address?
echo (You can find it in Settings > About Phone > Status > IP Address)
echo.
set /p DEVICE_IP="Enter device IP: "

echo.
echo Connecting to %DEVICE_IP%:5555...
adb connect %DEVICE_IP%:5555

echo.
echo.
echo Checking connected devices...
adb devices

echo.
echo ============================================================
echo If you see your device listed above, it's connected!
echo ============================================================
echo.

pause
