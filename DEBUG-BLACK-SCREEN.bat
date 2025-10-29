@echo off
echo =============================================
echo   EMERGENCY FIX - Browser Console Check
echo =============================================
echo.
echo Your app is loading but showing black screen.
echo This means server connection issue.
echo.
echo DO THIS NOW:
echo.
echo 1. In the Chrome tab with your app:
echo    Press F12 (opens console)
echo.
echo 2. Click "Console" tab at top
echo.
echo 3. Look for RED errors
echo.
echo 4. You'll likely see one of these:
echo.
echo    - "Mixed Content" error
echo      FIX: Backend uses HTTPS, frontend HTTP
echo           Browser blocks this!
echo.
echo    - "ERR_CERT_AUTHORITY_INVALID"
echo      FIX: You didn't accept certificate yet!
echo           Open: https://192.168.29.164:5000
echo           Type: thisisunsafe
echo.
echo    - "Network Error" or "Failed to fetch"
echo      FIX: Flask server not running
echo           Check Flask terminal window
echo.
echo 5. Tell me what error you see!
echo.
echo =============================================
pause

echo.
echo Opening backend to test certificate...
start chrome https://192.168.29.164:5000

echo.
echo If you see JSON data, certificate is accepted!
echo If you see red warning, type: thisisunsafe
echo.
pause
