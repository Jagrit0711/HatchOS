@echo off
echo ========================================
echo ENABLING WINDOWS FIREWALL FOR FLASK
echo ========================================
echo.
echo This will allow Flask (port 5000) through Windows Firewall
echo.

REM Add firewall rule for port 5000 (requires admin)
netsh advfirewall firewall add rule name="Flask Server Port 5000" dir=in action=allow protocol=TCP localport=5000

echo.
echo ========================================
echo FIREWALL RULE ADDED!
echo ========================================
echo.
echo Flask server on port 5000 is now accessible from network.
echo.
pause
