HatchOS Admin GUI
==================

Quick notes for the new admin GUI (`hatchos_admin.py`):

Prerequisites
- Python 3.8+
- `requests` Python package (install with `pip install requests`)
- `adb` (Android Platform Tools) must be in your PATH (adb.exe on Windows).
- `server.py` must be running and reachable (default: http://127.0.0.1:5000).

How to run
1. Start the HatchOS server (the one in this repo):
   - Ensure MongoDB is running and `server.py` is started (e.g. `python server.py`).
2. Run the GUI client:
   - `python hatchos_admin.py`

What it does
- Authenticates with the server using `/api/auth/login`.
- Only allows users with role `teacher` to proceed.
- Fetches devices from `/api/devices` and displays them.
- Attempts to connect to device IPs via `adb connect ip:5555` if IP present.
- Uses `adb devices -l` to show connected devices and match them to server records.
- Can fetch device MAC address (via `adb shell ip addr`) and model info.
- Allows renaming a device (calls `PUT /api/devices/<id>/rename`).
- Lets you pick an APK and install it to a selected device (`adb -s <serial> install -r <apk>`).

Limitations & notes
- The GUI calls `adb` command-line; it requires a working adb installation and permissions.
- Renaming updates the device document in MongoDB via the server endpoint added.
- This is a minimal admin tool for testing and day-to-day tasks — treat it as a prototype.

Security
- Passwords are sent to the server as-is (the server currently stores plain passwords). Use in trusted networks only.
