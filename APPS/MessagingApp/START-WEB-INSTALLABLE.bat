@echo off
echo ========================================
echo  START WEB APP (Installable Version)
echo ========================================
echo.
echo This will start the web version with PWA support
echo Users can install it as an app from the browser!
echo.

cd /d "%~dp0"

echo Starting Expo web server...
echo.
echo Once it starts:
echo - Open the URL in Chrome or Edge
echo - Click "Install App" button in the header
echo - Or use browser's install option
echo.
echo Press Ctrl+C to stop the server
echo.

start npx expo start --web

echo.
echo Server starting...
echo The app will open in your browser automatically.
echo.
pause
