import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DeviceStatusService from '../services/DeviceStatusService';

const API_URL = 'http://192.168.29.164:5000/api';

export default function HomeScreen({ navigation }) {
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    // Start listening for server commands
    DeviceStatusService.startListening(navigation);
    
    return () => {
      DeviceStatusService.stopListening();
    };
  }, [navigation]);

  const pickAndUploadScreenshot = async () => {
    try {
      setUploading(true);
      
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Need access to photos');
        setUploading(false);
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, // Compress to reduce size
        base64: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const base64Image = result.assets[0].base64;
      const deviceId = await AsyncStorage.getItem('deviceId');

      console.log('📤 Uploading screenshot...', base64Image.length, 'bytes');

      // Send to server
      const response = await axios.post(`${API_URL}/screenshots/analyze`, {
        device_id: deviceId,
        screenshot: base64Image,
        ip_address: 'manual_upload',
        timestamp: Date.now(),
      });

      console.log('✅ Server response:', response.data);
      
      if (response.data.show_overlay) {
        Alert.alert('⚠️ Violation Detected!', 'AI detected inappropriate content');
      } else {
        Alert.alert('✅ All Clear', 'Content is appropriate');
      }

      setUploading(false);
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', error.message);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚</Text>
      <Text style={styles.message}>Nothing for you here</Text>
      <Text style={styles.subtitle}>Sit back and study</Text>
      
      {/* Manual upload button for testing */}
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={pickAndUploadScreenshot}
        disabled={uploading}
      >
        <Text style={styles.testButtonText}>
          {uploading ? '⏳ Uploading...' : '📸 Test Screenshot Upload'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>HatchOS Core v2.0</Text>
        <Text style={styles.footerText}>Monitoring Active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 80,
    marginBottom: 30,
  },
  message: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#888888',
    textAlign: 'center',
  },
  testButton: {
    marginTop: 40,
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#FF6B00',
    borderRadius: 25,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#444444',
    marginTop: 5,
  },
});
