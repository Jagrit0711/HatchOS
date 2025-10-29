@echo off
REM Set Android SDK path for Expo/React Native development
REM This creates a minimal SDK structure pointing to your platform-tools

REM Set ANDROID_HOME to C:\ (where platform-tools is located)
set ANDROID_HOME=C:\
set ANDROID_SDK_ROOT=C:\

REM Add platform-tools to PATH
set PATH=%PATH%;C:\platform-tools

echo Android SDK environment variables set:
echo ANDROID_HOME=%ANDROID_HOME%
echo ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%
echo.
echo Platform-tools added to PATH
