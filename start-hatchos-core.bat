@echo off
echo ========================================
echo HatchOS Core - Starting App
echo ========================================
echo.

cd APPS\HatchOSCore

echo Installing dependencies...
call npm install

echo.
echo Starting Expo...
echo.
npx expo start

pause
