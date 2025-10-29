@echo off
echo ========================================
echo  EASIEST METHOD - ZERO INSTALLATION!
echo  Uses Expo's Free Online Build Service
echo ========================================
echo.
echo NO Android Studio needed!
echo NO SDK download needed!
echo Just need: Node.js (which you have)
echo.
echo This will:
echo - Build your APK in the cloud (Expo servers)
echo - Wait time: 5-60 min depending on queue
echo - Download APK when ready
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Installing Expo CLI...
call npm install -g expo-cli eas-cli

echo.
echo Step 2: Login to Expo (create free account if needed)...
echo Visit: https://expo.dev/signup
echo.
call eas login

echo.
echo Step 3: Configure project...
call eas build:configure

echo.
echo Step 4: Starting cloud build (APK)...
echo.
echo NOTE: This builds in the cloud - NO Android Studio needed!
echo The build might be queued. You can:
echo - Close this window and check status later at: expo.dev
echo - Wait here for completion
echo.
call eas build --platform android --profile preview --non-interactive

echo.
echo ========================================
echo Build submitted to cloud!
echo ========================================
echo.
echo Check status at: https://expo.dev
echo APK will be downloadable when ready.
echo.
pause
