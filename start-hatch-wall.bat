@echo off
echo.
echo ========================================
echo   Starting Hatch Wall Development
echo ========================================
echo.

cd APPS\HatchWall

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies already installed
)

echo.
echo [2/3] Starting Expo development server...
echo.
echo You can now:
echo   - Scan the QR code with Expo Go app
echo   - Press 'a' for Android emulator
echo   - Press 'i' for iOS simulator
echo   - Press 'w' for web browser
echo.

start cmd /k "cd ..\.. && python server.py"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Expo...
echo.

call npm start
