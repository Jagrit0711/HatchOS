@echo off
title HatchOS Core - ADB Service
color 0B

echo ============================================================
echo      HatchOS Core - Wireless ADB Service
echo ============================================================
echo.
echo Starting ADB server for total device control...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo Please install Python 3.x first.
    pause
    exit /b
)

REM Check if Flask is installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Flask...
    pip install flask
)

REM Start ADB service
echo [INFO] Starting ADB service on port 5001...
echo.
python adb_service.py

pause
