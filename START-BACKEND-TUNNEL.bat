@echo off
echo ====================================
echo Starting Flask Server with Tunnel
echo ====================================
echo.
echo This will expose your Flask server via HTTPS tunnel
echo You'll get a URL like: https://xxx.ngrok.io
echo.
echo Installing ngrok if needed...
npm install -g ngrok
echo.
echo Starting Flask server on port 5000...
start "Flask Server" cmd /k "cd /d C:\Users\jagri\OneDrive\Documents\HatchOS && python server.py"
echo.
echo Waiting for Flask to start...
timeout /t 5 /nobreak
echo.
echo Starting ngrok tunnel...
ngrok http 5000
