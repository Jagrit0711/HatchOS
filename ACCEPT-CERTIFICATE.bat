@echo off
cls
echo ============================================
echo    CERTIFICATE ACCEPTANCE GUIDE
echo ============================================
echo.
echo The Flask HTTPS server is running on:
echo   https://192.168.29.164:5000
echo.
echo ============================================
echo    STEP-BY-STEP INSTRUCTIONS
echo ============================================
echo.
echo 1. Open Chrome browser
echo.
echo 2. Visit: https://192.168.29.164:5000
echo    (Copy and paste this URL)
echo.
echo 3. You will see a RED warning screen:
echo    "Your connection is not private"
echo.
echo 4. OPTION A - Quick Method:
echo    - Just type on your keyboard: thisisunsafe
echo    - Don't type in a box, just type it on the page
echo    - Page will load automatically!
echo.
echo 5. OPTION B - Click Method:
echo    - Look at BOTTOM LEFT of the screen
echo    - Click "Advanced" (small gray text)
echo    - Click "Proceed to 192.168.29.164 (unsafe)"
echo.
echo 6. You should see JSON data like:
echo    [{"id":"...","name":"...","email":"..."}]
echo.
echo 7. DONE! Certificate accepted for backend!
echo.
echo ============================================
echo.
echo Now open your app at: https://192.168.29.164:19006
echo (Accept certificate there too using same method)
echo.
echo Then Chrome menu -^> "Install HatchOS Messaging"
echo.
pause

echo.
echo Opening backend URL in browser...
start https://192.168.29.164:5000
