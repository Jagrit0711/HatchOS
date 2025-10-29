@echo off
echo ========================================
echo  PWA with HTTPS via Tunnel
echo ========================================
echo.
echo This creates an HTTPS URL that works everywhere!
echo Your phone will be able to install the PWA.
echo.
echo Installing localtunnel if needed...
call npm install -g localtunnel
echo.
echo ========================================
echo Starting Expo server...
echo ========================================
cd /d "%~dp0"
start "Expo Server" cmd /k "npx expo start --web --port 19006"
echo.
echo Waiting for server to start...
timeout /t 10 /nobreak >nul
echo.
echo ========================================
echo Creating HTTPS tunnel...
echo ========================================
echo.
echo You'll get a URL like: https://xxx-xxx-xxx.loca.lt
echo Open that URL on your phone!
echo.
call lt --port 19006
echo.
echo Tunnel closed.
pause
