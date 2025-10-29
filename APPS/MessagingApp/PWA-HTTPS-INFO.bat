@echo off
echo ========================================
echo  PWA Install - HTTPS Solution
echo ========================================
echo.
echo PROBLEM: PWA "Install" only works on:
echo - localhost (works)
echo - HTTPS URLs (needs certificate)
echo.
echo Your IP (http://192.168.29.164:19006) needs HTTPS!
echo.
echo ========================================
echo  SOLUTION OPTIONS:
echo ========================================
echo.
echo OPTION 1: Use Tunneling Service (Easiest)
echo   - Install: npm install -g localtunnel
echo   - Get HTTPS URL instantly
echo   - Works on any device
echo.
echo OPTION 2: Self-Signed Certificate (Advanced)
echo   - Install mkcert
echo   - Create local certificate
echo   - Browser will show warning
echo.
echo OPTION 3: Desktop Testing
echo   - Open localhost:19006 on desktop
echo   - Install works there
echo   - Test PWA features
echo.
echo ========================================
echo  QUICK FIX - Try Localhost on Phone:
echo ========================================
echo.
echo If your phone can access your PC:
echo 1. Install "Chrome Remote Desktop" or USB debugging
echo 2. Forward port from PC to phone
echo 3. Access localhost:19006 on phone
echo.
pause
echo.
echo Starting regular HTTP server...
echo (For testing UI, not PWA install)
echo.
cd /d "%~dp0"
npx expo start --web --host lan --port 19006
pause
