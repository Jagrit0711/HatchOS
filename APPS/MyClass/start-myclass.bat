@echo off
cd /d "%~dp0"
echo ========================================
echo    Starting MyClass - HatchOS Education
echo ========================================
echo.
echo Make sure server.py is running on port 5000
echo.
npx expo start
cmd /k
