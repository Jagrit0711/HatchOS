@echo off
REM Hatch Wall - Open on Android Device (No SDK Required)
REM This script opens the app on your connected Android device via ADB

echo.
echo ========================================
echo   Opening Hatch Wall on Android Device
echo ========================================
echo.

REM Check if ADB is available
where adb >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: ADB not found in PATH
    echo Please make sure Android Platform Tools are installed
    echo Download from: https://developer.android.com/studio/releases/platform-tools
    pause
    exit /b 1
)

echo [1/3] Checking for connected devices...
adb devices | findstr "device$" >nul
if %errorlevel% neq 0 (
    echo ERROR: No Android device connected
    echo.
    echo Please connect your device via:
    echo   1. USB cable (enable USB debugging)
    echo   2. Wireless ADB: adb connect YOUR_DEVICE_IP:5555
    echo.
    pause
    exit /b 1
)

echo Connected devices:
adb devices
echo.

echo [2/3] Checking if Expo Go is installed...
adb shell pm list packages | findstr "host.exp.exponent" >nul
if %errorlevel% neq 0 (
    echo ERROR: Expo Go is not installed on your device
    echo.
    echo Please install Expo Go from:
    echo   Google Play Store: https://play.google.com/store/apps/details?id=host.exp.exponent
    echo.
    pause
    exit /b 1
)

echo Expo Go is installed!
echo.

echo [3/3] Opening Hatch Wall in Expo Go...
echo.

REM Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
set IP=%IP:~1%

REM Try to connect to device if wireless
adb connect 192.168.0.6:33355 >nul 2>nul

REM Open the app in Expo Go
echo Using development server: exp://%IP%:8081
adb shell am start -a android.intent.action.VIEW -d "exp://%IP%:8081"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! App is opening on device
    echo ========================================
    echo.
    echo The app should now be loading in Expo Go.
    echo If you see any errors, check the Metro bundler output.
    echo.
) else (
    echo.
    echo ERROR: Failed to open app on device
    echo Please try manually:
    echo   1. Open Expo Go on your device
    echo   2. Enter URL: exp://%IP%:8081
    echo   3. Press "Connect"
    echo.
)

pause
