@echo off
cls
echo ============================================
echo    FULL PWA SETUP - LOCALHOST HTTPS
echo ============================================
echo.
echo This will:
echo   1. Start Flask HTTPS server (backend)
echo   2. Start Expo HTTPS server (frontend)
echo   3. Guide you to install PWA
echo.
echo Make sure Flask server terminal stays open!
echo.
pause

echo.
echo [1/3] Starting Flask HTTPS Server...
echo.
start "Flask HTTPS Server" cmd /k "cd /d C:\Users\jagri\OneDrive\Documents\HatchOS && python server.py"

echo Waiting for Flask to start...
timeout /t 5 /nobreak

echo.
echo [2/3] Testing Flask server...
curl -k https://192.168.29.164:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Flask server is running!
) else (
    echo [WARNING] Flask server might not be ready yet
    echo Check the Flask terminal window
)

echo.
echo [3/3] Starting Expo HTTPS Server...
echo.
echo IMPORTANT: You need to accept TWO certificates:
echo   1. Backend: https://192.168.29.164:5000
echo   2. Frontend: https://192.168.29.164:19006
echo.
echo Instructions will appear after Expo starts!
echo.
pause

cd /d C:\Users\jagri\OneDrive\Documents\HatchOS\APPS\MessagingApp
npx expo start --web --host lan --port 19006 --https --clear
