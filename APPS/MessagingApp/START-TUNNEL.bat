@echo off
echo ========================================
echo  PWA Install - EXPO TUNNEL (HTTPS)
echo ========================================
echo.
echo This uses Expo's built-in tunnel for HTTPS!
echo Works on any device, anywhere.
echo.
echo NOTE: First time may be slow (setting up tunnel)
echo.
pause

cd /d "%~dp0"

echo.
echo Starting Expo with tunnel (HTTPS)...
echo.
echo You'll get a URL like:
echo https://xxx-xxx-xxx.xxx.exp.direct
echo.
echo Open that on your phone to install PWA!
echo.

npx expo start --web --tunnel

echo.
echo Tunnel closed.
pause
