@echo off@echo off

echo Starting HatchOS Server...echo Starting HatchOS Messaging Platform...

echo Output will be logged to logs\console.logecho.

echo.

echo [1/2] Starting MongoDB...

if not exist logs mkdir logsnet start MongoDB

if %errorlevel% neq 0 (

@echo off
echo ========================================
echo   HatchOS Server Launcher
echo ========================================
echo.
echo Starting server with live console logging...
echo Console output will be captured to logs\console.log
echo View logs in Admin Console at http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python run_server.py    echo MongoDB service not found or already running

)
echo.

echo [2/2] Starting Python Backend Server...
cd /d "%~dp0"
python server.py

pause
