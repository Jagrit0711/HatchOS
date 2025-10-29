import axios from 'axios';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.29.164:5000/api';
const CHECK_INTERVAL = 2000; // Check every 2 seconds

class DeviceStatusService {
  constructor() {
    this.intervalId = null;
    this.isListening = false;
    this.deviceId = null;
    this.navigation = null;
  }

  async startListening(navigation) {
    if (this.isListening) return;

    console.log('👂 Starting device status listener...');
    this.isListening = true;
    this.navigation = navigation;

    // Get device ID from storage
    this.deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!this.deviceId) {
      console.error('❌ No device ID found - user must login first');
      return;
    }

    console.log('📱 Using Device ID:', this.deviceId);

    // Start checking for commands
    this.intervalId = setInterval(() => {
      this.checkForCommands();
    }, CHECK_INTERVAL);

    // Check immediately
    this.checkForCommands();
  }

  stopListening() {
    if (!this.isListening) return;

    console.log('🛑 Stopping device status listener...');
    this.isListening = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async checkForCommands() {
    try {
      const response = await axios.get(`${API_URL}/devices/${this.deviceId}/status`, {
        timeout: 3000,
      });

      const { data } = response;

      // Check for violations (AI detected inappropriate activity)
      if (data.has_violation) {
        console.log('⚠️ VIOLATION DETECTED - Showing overlay');
        this.navigation.navigate('Overlay', {
          reason: data.violation_reason || 'Inappropriate activity detected'
        });
        return;
      }

      // Check for exam mode
      if (data.exam_mode) {
        console.log('🎓 EXAM MODE ACTIVATED');
        this.navigation.navigate('ExamMode', {
          examName: data.exam_name,
          endTime: data.exam_end_time
        });
        return;
      }

      // Check for lockdown
      if (data.is_locked) {
        console.log('🔒 DEVICE LOCKED');
        this.navigation.navigate('Overlay', {
          reason: data.lock_reason || 'Device has been locked by administrator'
        });
        return;
      }

      // If no commands and currently on overlay/exam, navigate back to home
      // Note: Don't try to get current route - just let navigation handle it
      // React Navigation will handle duplicate navigation attempts

    } catch (error) {
      // Silently fail - server might be down
      // Don't log to avoid console spam
    }
  }
}

export default new DeviceStatusService();
