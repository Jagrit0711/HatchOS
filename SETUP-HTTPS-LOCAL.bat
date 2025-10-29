@echo off
echo ====================================
echo Setting up HTTPS for HatchOS
echo ====================================
echo.
echo Step 1: Installing pyOpenSSL...
pip install pyOpenSSL
echo.
echo Step 2: Generating SSL certificate...
python generate_ssl_cert.py
echo.
echo ====================================
echo HTTPS Setup Complete!
echo ====================================
echo.
echo NEXT STEPS:
echo.
echo 1. Trust the certificate in your browser:
echo    - Open Chrome
echo    - Visit https://192.168.29.164:5000
echo    - Click "Advanced" then "Proceed to 192.168.29.164 (unsafe)"
echo    - This is SAFE - it's your own computer!
echo.
echo 2. Start the HTTPS server:
echo    python server.py
echo.
echo 3. Start Expo (no tunnel needed):
echo    cd APPS\MessagingApp
echo    npx expo start --web --host lan --port 19006 --https --clear
echo.
echo 4. On your phone:
echo    - Open https://192.168.29.164:19006
echo    - Accept the certificate warning (one time only)
echo    - Enjoy PWA install!
echo.
pause
