import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Device from 'expo-device';

const API_URL = 'http://192.168.29.164:5000/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);

    try {
      // 1. Login using existing /api/auth/login endpoint (expects email, password)
      console.log('🔐 Logging in with:', username);
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: username, // Server expects 'email' field
        password: password,
      });

      const user = loginRes.data.user;
      console.log('✅ User authenticated:', user.name, '(', user.role, ')');

      // 2. Get device info
      const deviceName = `${user.name}'s ${Device.modelName || 'Device'}`;
      const deviceInfo = {
        model: Device.modelName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        manufacturer: Device.manufacturer || 'Unknown',
        deviceId: Device.osBuildId || Device.modelId || 'unknown',
        isDevice: Device.isDevice,
      };

      console.log('📱 Registering device:', deviceName);

      // 3. Register device (returns deviceId directly, not device object)
      const deviceRes = await axios.post(`${API_URL}/devices/register`, {
        userId: user.id, // Use user.id (matches serialize_user in server.py)
        deviceName: deviceName,
        deviceInfo: deviceInfo,
      });

      const deviceId = deviceRes.data.deviceId; // Server returns { deviceId: "..." }
      console.log('📲 Device registered with ID:', deviceId);

      // 4. Save to AsyncStorage
      await AsyncStorage.setItem('userId', user.id);
      await AsyncStorage.setItem('deviceId', deviceId);
      await AsyncStorage.setItem('userName', user.name);
      await AsyncStorage.setItem('userEmail', user.email);
      await AsyncStorage.setItem('userRole', user.role);
      await AsyncStorage.setItem('deviceName', deviceName);

      console.log('💾 Credentials saved to storage');
      console.log('✅ Login complete!');
      console.log('   User:', user.name, '(', user.email, ')');
      console.log('   Device ID:', deviceId);

      // Navigate to home screen
      navigation.replace('Home');

    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message.includes('Network')) {
        errorMessage = 'Cannot connect to server. Check your connection.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎓</Text>
      <Text style={styles.title}>HatchOS Core</Text>
      <Text style={styles.subtitle}>Student Device Management</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email (e.g., student1@school.com)"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Contact your teacher for login credentials
      </Text>
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
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 50,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  button: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
