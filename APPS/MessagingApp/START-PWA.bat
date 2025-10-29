@echo off
echo ========================================
echo  HatchOS Messaging - REAL PWA MODE
echo ========================================
echo.
echo This starts your app as a REAL Progressive Web App
echo NOT a Chrome shortcut - it will open standalone!
echo.

cd /d "%~dp0"

REM Get IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)

:found
set IP=%IP: =%

echo ========================================
echo   OPEN THIS URL ON YOUR PHONE:
echo.
echo   http://%IP%:19006
echo.
echo ========================================
echo.
echo After opening in Chrome:
echo 1. Tap the menu (3 dots) 
echo 2. Select "Install app" or "Add to Home Screen"
echo 3. Tap "Install"
echo.
echo THE KEY: It will now open as a STANDALONE APP
echo - NO browser address bar
echo - Full screen
echo - Looks like native app
echo.
echo ========================================
echo Starting server...
echo.
pause

REM Ensure icons are in public folder
if not exist "public\icon-192.png" (
    echo Copying icons...
    copy /Y "assets\icon.png" "public\icon-192.png" >nul 2>&1
    copy /Y "assets\icon.png" "public\icon-512.png" >nul 2>&1
)

REM Clear Expo cache for fresh start
echo Clearing cache for fresh PWA build...
call npx expo start --web --host lan --port 19006 --clear

echo.
echo Server stopped.
pause
