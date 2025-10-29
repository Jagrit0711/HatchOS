@echo off
cd /d "%~dp0"
echo ========================================
echo    Starting HatchOS Admin Console
echo ========================================
echo.
echo Make sure MongoDB is running on localhost:27017
echo Make sure server.py is running on port 5000
echo.
echo Opening Admin Console on http://localhost:3000
echo.
start "" "http://localhost:3000"
npm start
