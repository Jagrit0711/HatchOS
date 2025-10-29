@echo off
echo ========================================
echo  Building Web App with PWA Support
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Building web version...
call npx expo export:web

echo.
echo Step 3: Copying PWA files...
if exist "web-build" (
    copy web\manifest.json web-build\manifest.json
    copy web\service-worker.js web-build\service-worker.js
    echo PWA files copied!
) else (
    echo ERROR: web-build folder not found!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Web app built successfully!
echo ========================================
echo.
echo Your web app is in: web-build\
echo.
echo To test locally:
echo 1. Install: npm install -g serve
echo 2. Run: serve -s web-build
echo 3. Open: http://localhost:3000
echo.
echo To deploy:
echo - Upload the 'web-build' folder to any web server
echo - Or use: npx vercel web-build
echo - Or use: npx netlify deploy --dir=web-build
echo.
pause
