@echo off
echo ========================================
echo  Setting up Android Build Environment
echo ========================================
echo.

REM Set JAVA_HOME to Android Studio's bundled JDK
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr

REM Find Android SDK
if exist "%LOCALAPPDATA%\Android\Sdk" (
    set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
) else if exist "C:\Android\Sdk" (
    set ANDROID_HOME=C:\Android\Sdk
) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
    set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
) else (
    echo WARNING: Android SDK not found at default locations.
    echo Please open Android Studio and check SDK location in Settings.
    set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
)

REM Set environment variables permanently
echo Setting JAVA_HOME permanently...
setx JAVA_HOME "%JAVA_HOME%"

echo Setting ANDROID_HOME permanently...
setx ANDROID_HOME "%ANDROID_HOME%"

echo.
echo ========================================
echo Environment setup complete!
echo ========================================
echo.
echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.
echo Please CLOSE and REOPEN your terminal/command prompt
echo for the changes to take effect.
echo.
echo After reopening, you can build with:
echo   cd APPS\MessagingApp
echo   npx expo run:android
echo.
pause
