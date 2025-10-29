"""
HatchOS Core - Wireless ADB Service
Controls student devices via ADB for total lockdown and monitoring
"""

import subprocess
import os
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify
from threading import Thread
import base64

# Store active lockdown/exam sessions
active_sessions = {}

class ADBController:
    def __init__(self):
        self.connected_devices = {}
        # Store ADB path - will use platform tools
        self.adb_path = self.find_adb()
    
    def find_adb(self):
        """Find ADB executable in system"""
        # Common ADB locations
        paths = [
            r"C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe",
            r"C:\Android\platform-tools\adb.exe",
            "adb"  # Try system PATH
        ]
        
        for path in paths:
            try:
                expanded = os.path.expandvars(path)
                result = subprocess.run([expanded, 'version'], 
                                       capture_output=True, 
                                       timeout=5)
                if result.returncode == 0:
                    print(f"✅ Found ADB at: {expanded}")
                    return expanded
            except:
                continue
        
        print("⚠️ ADB not found. Install Android SDK Platform Tools")
        return "adb"
    
    def run_adb_command(self, device_ip, command):
        """Execute ADB command on specific device"""
        try:
            device_addr = f"{device_ip}:5555"
            cmd = [self.adb_path] + command.split()
            
            # Add device specifier
            if '-s' not in cmd:
                cmd.insert(1, '-s')
                cmd.insert(2, device_addr)
            
            result = subprocess.run(cmd, 
                                   capture_output=True, 
                                   text=True, 
                                   timeout=30)
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def connect_device(self, device_ip):
        """Connect to device via wireless ADB"""
        print(f"📱 Connecting to device: {device_ip}")
        
        try:
            # Connect to device
            result = subprocess.run(
                [self.adb_path, 'connect', f"{device_ip}:5555"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if 'connected' in result.stdout.lower():
                self.connected_devices[device_ip] = {
                    'connected_at': datetime.now().isoformat(),
                    'status': 'connected'
                }
                print(f"✅ Connected to {device_ip}")
                return {'success': True, 'message': 'Device connected'}
            else:
                return {'success': False, 'error': result.stdout + result.stderr}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def disconnect_device(self, device_ip):
        """Disconnect from device"""
        try:
            result = subprocess.run(
                [self.adb_path, 'disconnect', f"{device_ip}:5555"],
                capture_output=True,
                text=True
            )
            
            if device_ip in self.connected_devices:
                del self.connected_devices[device_ip]
            
            return {'success': True, 'message': 'Device disconnected'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def capture_screenshot(self, device_ip):
        """Capture screenshot from device via ADB"""
        print(f"📸 Capturing screenshot from {device_ip}")
        
        try:
            device_addr = f"{device_ip}:5555"
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Screenshot path on device
            device_path = "/sdcard/hatchos_screenshot.png"
            local_path = f"uploads/{timestamp}_screenshot_{device_ip.replace('.', '_')}.png"
            
            # Take screenshot on device
            capture_result = subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell', 'screencap', '-p', device_path],
                capture_output=True,
                timeout=10
            )
            
            if capture_result.returncode != 0:
                return {'success': False, 'error': 'Screenshot capture failed'}
            
            # Pull screenshot to server
            pull_result = subprocess.run(
                [self.adb_path, '-s', device_addr, 'pull', device_path, local_path],
                capture_output=True,
                timeout=15
            )
            
            if pull_result.returncode == 0:
                # Delete from device
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell', 'rm', device_path],
                    capture_output=True
                )
                
                return {
                    'success': True,
                    'screenshot_path': local_path,
                    'timestamp': timestamp
                }
            else:
                return {'success': False, 'error': 'Screenshot pull failed'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def lock_device(self, device_ip, reason="Device locked by administrator"):
        """Lock device screen completely via ADB"""
        print(f"🔒 Locking device: {device_ip}")
        
        try:
            device_addr = f"{device_ip}:5555"
            
            # Start lockdown enforcer thread
            if device_ip in active_sessions:
                active_sessions[device_ip]['stop'] = True
                time.sleep(0.5)
            
            active_sessions[device_ip] = {
                'mode': 'lockdown',
                'reason': reason,
                'stop': False
            }
            
            # Start thread to keep app in foreground
            thread = Thread(target=self._enforce_lockdown, args=(device_ip,))
            thread.daemon = True
            thread.start()
            
            print(f"✅ Lockdown enforcer started for {device_ip}")
            return {'success': True, 'message': 'Device lockdown initiated'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _enforce_lockdown(self, device_ip):
        """Keep bringing app to foreground every 2 seconds during lockdown"""
        device_addr = f"{device_ip}:5555"
        session = active_sessions[device_ip]
        
        print(f"🔄 Lockdown enforcer running for {device_ip}")
        
        while not session['stop']:
            try:
                # Press power button to wake screen (keyevent 26)
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'input', 'keyevent', '26'],  # POWER
                    capture_output=True,
                    timeout=5
                )
                
                time.sleep(0.2)  # Small delay
                
                # Force HatchOS Core to foreground
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'am', 'start', '-n',
                     'com.hatchoscore/com.hatchoscore.MainActivity'],
                    capture_output=True,
                    timeout=5
                )
                
                # Press home to ensure we're on home screen first
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'input', 'keyevent', '3'],  # HOME
                    capture_output=True,
                    timeout=5
                )
                
                time.sleep(0.2)  # Small delay
                
                # Then force app again
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'am', 'start', '-n',
                     'com.hatchoscore/com.hatchoscore.MainActivity'],
                    capture_output=True,
                    timeout=5
                )
                
                # Wait 2 seconds before next enforcement
                time.sleep(2)
                
            except Exception as e:
                print(f"⚠️ Lockdown enforcer error on {device_ip}: {e}")
                time.sleep(2)
        
        print(f"✅ Lockdown enforcer stopped for {device_ip}")
    
    def unlock_device(self, device_ip):
        """Unlock device"""
        print(f"🔓 Unlocking device: {device_ip}")
        
        try:
            # Stop lockdown/exam enforcer
            if device_ip in active_sessions:
                active_sessions[device_ip]['stop'] = True
                del active_sessions[device_ip]
            
            device_addr = f"{device_ip}:5555"
            
            # Wake screen
            subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'input', 'keyevent', '224'],  # KEYCODE_WAKEUP
                capture_output=True
            )
            
            # Bring app to foreground one last time
            subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'am', 'start', '-n',
                 'com.hatchoscore/com.hatchoscore.MainActivity'],
                capture_output=True,
                timeout=10
            )
            
            print(f"✅ Device unlocked: {device_ip}")
            return {'success': True, 'message': 'Device unlocked'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def start_exam_mode(self, device_ip, exam_name, duration_minutes):
        """Start exam mode on device via ADB"""
        print(f"📝 Starting exam mode on {device_ip}: {exam_name}")
        
        try:
            device_addr = f"{device_ip}:5555"
            
            # Stop any existing session
            if device_ip in active_sessions:
                active_sessions[device_ip]['stop'] = True
                time.sleep(0.5)
            
            # Start exam session
            active_sessions[device_ip] = {
                'mode': 'exam',
                'exam_name': exam_name,
                'duration': duration_minutes,
                'stop': False
            }
            
            # Set device to stay awake during exam
            subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'settings', 'put', 'system', 'screen_off_timeout', '2147483647'],
                capture_output=True
            )
            
            # Start thread to keep app in foreground
            thread = Thread(target=self._enforce_exam_mode, args=(device_ip,))
            thread.daemon = True
            thread.start()
            
            print(f"✅ Exam mode enforcer started for {device_ip}")
            return {'success': True, 'message': 'Exam mode started'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _enforce_exam_mode(self, device_ip):
        """Keep bringing app to foreground every 2 seconds during exam"""
        device_addr = f"{device_ip}:5555"
        session = active_sessions[device_ip]
        
        print(f"🔄 Exam mode enforcer running for {device_ip}")
        
        while not session['stop']:
            try:
                # Press power button to wake screen (keyevent 26)
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'input', 'keyevent', '26'],  # POWER
                    capture_output=True,
                    timeout=5
                )
                
                time.sleep(0.2)  # Small delay
                
                # Force HatchOS Core to foreground
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'am', 'start', '-n',
                     'com.hatchoscore/com.hatchoscore.MainActivity'],
                    capture_output=True,
                    timeout=5
                )
                
                # Press home to ensure we're on home screen first
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'input', 'keyevent', '3'],  # HOME
                    capture_output=True,
                    timeout=5
                )
                
                time.sleep(0.2)  # Small delay
                
                # Then force app again
                subprocess.run(
                    [self.adb_path, '-s', device_addr, 'shell',
                     'am', 'start', '-n',
                     'com.hatchoscore/com.hatchoscore.MainActivity'],
                    capture_output=True,
                    timeout=5
                )
                
                # Wait 2 seconds before next enforcement
                time.sleep(2)
                
            except Exception as e:
                print(f"⚠️ Exam enforcer error on {device_ip}: {e}")
                time.sleep(2)
        
        print(f"✅ Exam mode enforcer stopped for {device_ip}")
    
    def end_exam_mode(self, device_ip):
        """End exam mode"""
        print(f"✅ Ending exam mode on {device_ip}")
        
        try:
            # Stop exam enforcer
            if device_ip in active_sessions:
                active_sessions[device_ip]['stop'] = True
                del active_sessions[device_ip]
            
            device_addr = f"{device_ip}:5555"
            
            # Reset screen timeout to normal (2 minutes)
            subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'settings', 'put', 'system', 'screen_off_timeout', '120000'],
                capture_output=True
            )
            
            # Wake screen
            subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'input', 'keyevent', '224'],  # WAKEUP
                capture_output=True
            )
            
            # Bring app to foreground one last time
            subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'am', 'start', '-n',
                 'com.hatchoscore/com.hatchoscore.MainActivity'],
                capture_output=True,
                timeout=10
            )
            
            print(f"✅ Exam mode ended on {device_ip}")
            return {'success': True, 'message': 'Exam mode ended'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_running_apps(self, device_ip):
        """Get list of running apps on device"""
        try:
            device_addr = f"{device_ip}:5555"
            
            result = subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'dumpsys', 'activity', 'activities', '|', 'grep', 'mResumedActivity'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            return {
                'success': True,
                'apps': result.stdout
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def force_stop_app(self, device_ip, package_name):
        """Force stop specific app"""
        print(f"⛔ Force stopping {package_name} on {device_ip}")
        
        try:
            device_addr = f"{device_ip}:5555"
            
            result = subprocess.run(
                [self.adb_path, '-s', device_addr, 'shell',
                 'am', 'force-stop', package_name],
                capture_output=True,
                timeout=10
            )
            
            return {'success': True, 'message': f'{package_name} stopped'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Initialize ADB controller
adb = ADBController()

# Flask app for ADB API
app = Flask(__name__)

# Enable CORS for all routes
from flask_cors import CORS
CORS(app, resources={r"/adb/*": {"origins": "*"}})

@app.route('/adb/connect', methods=['POST', 'OPTIONS'])
def connect_device():
    """Connect to device"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    result = adb.connect_device(device_ip)
    return jsonify(result)

@app.route('/adb/disconnect', methods=['POST', 'OPTIONS'])
def disconnect_device():
    """Disconnect from device"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    result = adb.disconnect_device(device_ip)
    return jsonify(result)

@app.route('/adb/screenshot', methods=['POST', 'OPTIONS'])
def capture_screenshot():
    """Capture screenshot"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    result = adb.capture_screenshot(device_ip)
    return jsonify(result)

@app.route('/adb/lock', methods=['POST', 'OPTIONS'])
def lock_device():
    """Lock device"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    reason = data.get('reason', 'Device locked by administrator')
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    result = adb.lock_device(device_ip, reason)
    return jsonify(result)

@app.route('/adb/unlock', methods=['POST', 'OPTIONS'])
def unlock_device():
    """Unlock device"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    result = adb.unlock_device(device_ip)
    return jsonify(result)

@app.route('/adb/exam-mode/start', methods=['POST', 'OPTIONS'])
def start_exam_mode():
    """Start exam mode"""
    if request.method == 'OPTIONS':
        return '', 200
    
    print("=" * 60)
    print("🚨 EXAM MODE START ENDPOINT HIT!")
    print("=" * 60)
    
    data = request.json
    device_ip = data.get('device_ip')
    exam_name = data.get('exam_name', 'Examination')
    duration = data.get('duration_minutes', 60)
    
    print(f"📱 Device IP: {device_ip}")
    print(f"📝 Exam Name: {exam_name}")
    print(f"⏱️ Duration: {duration} minutes")
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    print("🔥 Calling adb.start_exam_mode()...")
    result = adb.start_exam_mode(device_ip, exam_name, duration)
    print(f"✅ Result: {result}")
    
    return jsonify(result)

@app.route('/adb/exam-mode/end', methods=['POST', 'OPTIONS'])
def end_exam_mode():
    """End exam mode"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    result = adb.end_exam_mode(device_ip)
    return jsonify(result)

@app.route('/adb/apps/running', methods=['POST', 'OPTIONS'])
def get_running_apps():
    """Get running apps"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    
    if not device_ip:
        return jsonify({'error': 'device_ip required'}), 400
    
    result = adb.get_running_apps(device_ip)
    return jsonify(result)

@app.route('/adb/apps/stop', methods=['POST', 'OPTIONS'])
def force_stop_app():
    """Force stop app"""
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    device_ip = data.get('device_ip')
    package_name = data.get('package_name')
    
    if not device_ip or not package_name:
        return jsonify({'error': 'device_ip and package_name required'}), 400
    
    result = adb.force_stop_app(device_ip, package_name)
    return jsonify(result)

@app.route('/adb/devices', methods=['GET'])
def list_devices():
    """List connected devices"""
    return jsonify({
        'devices': adb.connected_devices,
        'count': len(adb.connected_devices)
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 HatchOS Core - ADB Service Starting")
    print("=" * 60)
    print(f"📱 ADB Path: {adb.adb_path}")
    print("🌐 Server: http://192.168.29.164:5001")
    print("=" * 60)
    
    # Debug mode OFF to prevent thread issues with reloader
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
