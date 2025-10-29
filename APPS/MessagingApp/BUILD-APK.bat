@echo off
echo ========================================
echo    HatchOS Messaging - APK Builder
echo ========================================
echo.
echo Choose build method:
echo 1. EAS Cloud Build (Recommended - No Android Studio needed)
echo 2. Local Build (Requires Android Studio setup)
echo 3. Cancel
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto eas_build
if "%choice%"=="2" goto local_build
if "%choice%"=="3" goto end

:eas_build
echo.
echo Starting EAS Cloud Build...
echo.
echo NOTE: You'll need an Expo account (free)
echo.
echo Installing EAS CLI if not already installed...
call npm install -g eas-cli
echo.
echo Building APK with EAS...
call eas build --platform android --profile preview
goto end

:local_build
echo.
echo Starting Local Build...
echo.
echo NOTE: This requires:
echo - Android Studio installed
echo - Android SDK configured
echo - ANDROID_HOME environment variable set
echo.
pause
echo.
echo Building locally...
call eas build --platform android --profile local --local
goto end

:end
echo.
echo Build process completed!
pause
