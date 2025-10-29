@echo off
echo ========================================
echo  Starting HatchOS Messaging PWA (LAN)
echo ========================================
echo.

REM Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)

:found
REM Trim spaces
set IP=%IP: =%

echo Your Local IP: %IP%
echo.
echo ========================================
echo Access the PWA from ANY device on your network:
echo.
echo   http://%IP%:8081
echo.
echo ========================================
echo.
echo IMPORTANT: 
echo - Keep this window open!
echo - The app will work as a REAL PWA (not just a shortcut)
echo - You can install it on your phone!
echo - Press Ctrl+C to stop the server.
echo.
pause

cd /d "%~dp0"

REM Copy icons to public if not already there
if not exist "public\icon-192.png" (
    echo Copying icons...
    if exist "assets\icon.png" (
        copy /Y "assets\icon.png" "public\icon-192.png" >nul
        copy /Y "assets\icon.png" "public\icon-512.png" >nul
    )
)

echo Starting Expo with PWA support...
echo.
npx expo start --web --host lan

echo.
echo Server stopped.
pause
