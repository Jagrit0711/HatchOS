@echo off
cls
echo ================================================
echo   FULL PWA SETUP - HTTPS (Accept Certificates)
echo ================================================
echo.
echo STEP 1: Accept Backend Certificate
echo ----------------------------------
echo.
echo A Chrome tab will open with:
echo   https://192.168.29.164:5000
echo.
echo When you see "Your connection is not private":
echo.
echo METHOD 1 (EASIEST):
echo   - Just type: thisisunsafe
echo   - (Type it on the page, don't click anything)
echo   - Page loads automatically!
echo.
echo METHOD 2:
echo   - Click "Advanced" (bottom left)
echo   - Click "Proceed to 192.168.29.164 (unsafe)"
echo.
echo You should see JSON data like: [{"id":"..."}]
echo.
echo ================================================
pause

start chrome https://192.168.29.164:5000

echo.
echo Waiting for you to accept certificate...
timeout /t 10

echo.
echo ================================================
echo   STEP 2: Reload App with New Settings
echo ================================================
echo.
echo Now reloading your app at: http://192.168.29.164:19006
echo.
echo The app will now connect to HTTPS backend!
echo.
pause

start chrome http://192.168.29.164:19006

echo.
echo ================================================
echo   FINAL STEP: Clear Cache & Test
echo ================================================
echo.
echo In the Chrome tab that just opened:
echo.
echo 1. Press F12 (DevTools)
echo 2. Application tab
echo 3. Clear storage -^> Clear site data
echo 4. Close DevTools (F12)
echo 5. Hard refresh: Ctrl+Shift+R
echo.
echo 6. Try to login!
echo.
echo If login works:
echo   - Chrome menu -^> "Install HatchOS Messaging"
echo   - OR look for install icon in address bar
echo.
echo ================================================
echo.
echo SERVERS RUNNING:
echo   Backend:  https://192.168.29.164:5000 (HTTPS) ✅
echo   Frontend: http://192.168.29.164:19006 (HTTP)
echo.
echo NOTE: Frontend is HTTP but connects to HTTPS backend.
echo       PWA install will work but with limited features.
echo       For FULL PWA, both need HTTPS (complex setup).
echo.
pause
