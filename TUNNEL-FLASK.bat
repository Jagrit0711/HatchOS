@echo off
cls
echo ========================================
echo  STARTING LOCALTUNNEL FOR FLASK
echo ========================================
echo.
echo Creating public HTTPS URL for Flask backend...
echo Keep this window open!
echo.

lt --port 5000

pause
