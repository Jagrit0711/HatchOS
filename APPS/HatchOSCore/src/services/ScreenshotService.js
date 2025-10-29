import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.29.164:5000/api';
const SCREENSHOT_INTERVAL = 5000; // 5 seconds

class ScreenshotService {
  constructor() {
    this.intervalId = null;
    this.isMonitoring = false;
    this.deviceId = null;
    this.lastScreenshotId = null;
  }

  async startMonitoring() {
    if (this.isMonitoring) return;

    console.log('📸 Starting screenshot monitoring...');
    this.isMonitoring = true;

    // Get device ID from storage
    this.deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!this.deviceId) {
      console.error('❌ No device ID found - user must login first');
      return;
    }

    // Request media library permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      console.error('❌ Media library permission denied');
      console.log('⚠️ Falling back to test mode');
    } else {
      console.log('✅ Media library permission granted');
    }

    console.log('📱 Using Device ID:', this.deviceId);

    // Start taking screenshots
    this.intervalId = setInterval(() => {
      this.captureAndSend();
    }, SCREENSHOT_INTERVAL);

    // Take first screenshot immediately
    this.captureAndSend();
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping screenshot monitoring...');
    this.isMonitoring = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async captureAndSend() {
    try {
      console.log('📸 Capturing screenshot...');

      let base64Image = null;

      // Try to get actual screenshot from device
      try {
        const { status } = await MediaLibrary.getPermissionsAsync();
        
        if (status === 'granted') {
          // Get most recent photo from Screenshots folder
          const album = await MediaLibrary.getAlbumAsync('Screenshots');
          
          if (album) {
            const assets = await MediaLibrary.getAssetsAsync({
              album: album,
              first: 1,
              sortBy: 'creationTime',
              mediaType: 'photo',
            });
            
            if (assets.assets.length > 0) {
              const latestScreenshot = assets.assets[0];
              
              // Only process if it's a NEW screenshot (not already sent)
              if (this.lastScreenshotId !== latestScreenshot.id) {
                console.log('📷 Found new screenshot:', latestScreenshot.filename);
                
                // Read the file as base64
                const fileUri = latestScreenshot.uri;
                const base64Data = await FileSystem.readAsStringAsync(fileUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                base64Image = base64Data;
                this.lastScreenshotId = latestScreenshot.id;
                
                console.log('✅ Real screenshot captured (', base64Data.length, 'bytes)');
              } else {
                console.log('⏭️ No new screenshot detected - using test image');
              }
            }
          }
        }
      } catch (permError) {
        console.log('⚠️ Screenshot access failed:', permError.message);
      }

      // Fallback to test image if no real screenshot available
      if (!base64Image) {
        // 1x1 red pixel PNG for testing
        base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        console.log('🧪 Using test image');
      }
      
      const timestamp = Date.now();

      // Get device IP
      let ipAddress = 'unknown';
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (networkState.type !== 'NONE') {
          ipAddress = await this.getLocalIP();
        }
      } catch (e) {
        // Network check failed, continue with unknown
      }

      // Send to server for AI analysis
      await this.sendToServer({
        deviceId: this.deviceId,
        timestamp,
        ipAddress,
        base64Image,
      });

    } catch (error) {
      console.error('❌ Screenshot error:', error.message);
    }
  }

  async getLocalIP() {
    try {
      const ipAddress = await Network.getIpAddressAsync();
      return ipAddress;
    } catch (error) {
      return 'unknown';
    }
  }

  async sendToServer(screenshotData) {
    try {
      console.log('📤 Sending screenshot to server...');

      const response = await axios.post(`${API_URL}/screenshots/analyze`, {
        device_id: screenshotData.deviceId,
        timestamp: screenshotData.timestamp,
        ip_address: screenshotData.ipAddress,
        screenshot: screenshotData.base64Image, // Properly formatted base64 PNG
      }, {
        timeout: 10000,
      });

      console.log('✅ AI Response:', response.data.action);

      if (response.data.show_overlay) {
        console.log('⚠️ VIOLATION DETECTED by AI!');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Server error:', error.response?.status || error.message);
      return null;
    }
  }
}

export default new ScreenshotService();
