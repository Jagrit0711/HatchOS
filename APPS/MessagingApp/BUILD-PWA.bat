@echo off
echo ========================================
echo  Building PWA (Progressive Web App)
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Installing dependencies...
call npm install
echo.

echo Step 2: Building for web with PWA support...
set EXPO_PWA=true
call npx expo export:web
echo.

echo Step 3: Copying PWA files...
if not exist "web-build\public" mkdir "web-build\public"
copy /Y "public\manifest.json" "web-build\manifest.json"
copy /Y "public\service-worker.js" "web-build\service-worker.js"
copy /Y "public\index.html" "web-build\index.html"
echo.

echo ========================================
echo PWA Build Complete!
echo ========================================
echo.
echo Your PWA is in: web-build\
echo.
echo To test locally:
echo   npx serve web-build
echo.
echo To deploy:
echo - Upload web-build folder to your web server
echo - Or use: Netlify, Vercel, GitHub Pages
echo.
pause
