"""
ADB Screen Capture Server
Captures ENTIRE system screen (Chrome, all apps) via ADB
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import requests
from datetime import datetime
import subprocess

app = Flask(__name__)
CORS(app)

# Main server URL
MAIN_SERVER = 'http://192.168.29.164:5000'

# Screenshot storage
SCREENSHOT_DIR = 'adb_screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

@app.route('/capture-screen', methods=['POST'])
def capture_screen():
    """Capture entire system screen via ADB"""
    try:
        data = request.json
        device_ip = data.get('device_ip')
        device_id = data.get('device_id')
        
        print(f"📸 Capturing screen for device: {device_ip}")
        
        # Connect to device via ADB wireless
        connect_cmd = f'adb connect {device_ip}:5555'
        print(f"🔌 Connecting: {connect_cmd}")
        os.system(connect_cmd)
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        screenshot_path = os.path.join(SCREENSHOT_DIR, f'screen_{device_id}_{timestamp}.png')
        
        # Capture screen using ADB
        # This captures THE ENTIRE SYSTEM SCREEN - Chrome, all apps, everything!
        capture_cmd = f'adb -s {device_ip}:5555 exec-out screencap -p > {screenshot_path}'
        print(f"📷 Capturing: {capture_cmd}")
        
        result = os.system(capture_cmd)
        
        if result != 0:
            print(f"❌ Capture failed with code: {result}")
            return jsonify({'success': False, 'error': 'ADB capture failed'}), 500
        
        # Check if file was created
        if not os.path.exists(screenshot_path):
            print(f"❌ Screenshot file not created: {screenshot_path}")
            return jsonify({'success': False, 'error': 'Screenshot file not created'}), 500
        
        # Read screenshot and convert to base64
        with open(screenshot_path, 'rb') as f:
            image_data = f.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')
        
        print(f"✅ Screenshot captured: {len(image_data)} bytes")
        
        # Send to main server for AI analysis
        print(f"🤖 Sending to main server for AI analysis...")
        response = requests.post(
            f'{MAIN_SERVER}/api/screenshots/analyze',
            json={
                'device_id': device_id,
                'screenshot': base64_image,
                'ip_address': device_ip,
            },
            timeout=30
        )
        
        print(f"📥 Server response: {response.status_code}")
        
        return jsonify({
            'success': True,
            'screenshot_size': len(image_data),
            'server_response': response.json() if response.status_code == 200 else None
        })
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'running', 'service': 'ADB Screen Capture Server'})

if __name__ == '__main__':
    print("🚀 Starting ADB Screen Capture Server...")
    print(f"📁 Screenshots will be saved to: {os.path.abspath(SCREENSHOT_DIR)}")
    print(f"🎯 Main server: {MAIN_SERVER}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5037, debug=True)
