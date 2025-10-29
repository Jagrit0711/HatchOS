@echo off
echo ========================================
echo ENABLING FIREWALL FOR EXPO (PORT 8081)
echo ========================================
echo.
echo This will allow Expo dev server through Windows Firewall
echo.

REM Add firewall rule for port 8081 (requires admin)
netsh advfirewall firewall add rule name="Expo Dev Server Port 8081" dir=in action=allow protocol=TCP localport=8081

echo.
echo ========================================
echo FIREWALL RULE ADDED!
echo ========================================
echo.
echo Expo server on port 8081 is now accessible from network.
echo.
pause
