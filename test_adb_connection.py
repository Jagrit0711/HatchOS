"""
Quick ADB Connection Test
Run this to verify your phone is properly connected
"""

import subprocess
import sys

def run_command(cmd):
    """Run command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()
    except Exception as e:
        return f"Error: {e}"

print("=" * 60)
print("🔍 ADB CONNECTION TEST")
print("=" * 60)

# Test 1: Check if ADB is installed
print("\n1️⃣ Checking if ADB is installed...")
adb_version = run_command("adb version")
if "Android Debug Bridge" in adb_version:
    print("✅ ADB is installed")
    version_line = adb_version.split('Version')[1].split('\n')[0] if 'Version' in adb_version else 'unknown'
    print(f"   Version: {version_line}")
else:
    print("❌ ADB is not installed or not in PATH")
    sys.exit(1)

# Test 2: Check connected devices
print("\n2️⃣ Checking connected devices...")
devices = run_command("adb devices")
print(devices)

if "5555" in devices and "device" in devices:
    print("✅ Phone is connected via wireless ADB")
else:
    print("⚠️  No wireless device connected")
    print("\n📱 TO CONNECT:")
    print("   1. Enable Developer Options on phone")
    print("   2. Enable 'Wireless debugging'")
    print("   3. Get IP address (e.g., 192.168.29.164)")
    print("   4. Run: adb connect 192.168.29.164:5555")

# Test 3: Try to capture screenshot
print("\n3️⃣ Testing screen capture...")
test_output = run_command("adb exec-out screencap -p > test_capture.png")

import os
if os.path.exists("test_capture.png"):
    size = os.path.getsize("test_capture.png")
    print(f"✅ Screen capture works! ({size:,} bytes)")
    print(f"   Saved to: test_capture.png")
    os.remove("test_capture.png")
else:
    print("❌ Screen capture failed")

print("\n" + "=" * 60)
print("🎯 NEXT STEPS:")
print("=" * 60)
print("1. Start ADB server: python adb_server.py")
print("2. Start main server: python server.py")
print("3. Start app: cd APPS/HatchOSCore && npx expo start")
print("4. Open Chrome on phone and test!")
print("=" * 60)
