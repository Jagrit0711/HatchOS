@echo off
echo ========================================
echo    Quick APK Build - EAS Cloud
echo ========================================
echo.
echo This will build your APK using Expo's cloud service.
echo You'll need an Expo account (sign up at expo.dev)
echo.
echo Installing/Updating EAS CLI...
call npm install -g eas-cli
echo.
echo Logging into EAS (if needed)...
call eas login
echo.
echo Building APK...
call eas build --platform android --profile preview
echo.
echo ========================================
echo Build submitted! Check your terminal for the build URL.
echo You can monitor progress at: https://expo.dev/accounts/[your-account]/projects/hatchos-messaging/builds
echo ========================================
pause
