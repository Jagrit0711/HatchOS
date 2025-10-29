import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import FirewallEngine from '../services/FirewallEngine';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    protectionEnabled: true,
    notifications: true,
    aiDetection: true,
    blockSocialMedia: true,
    blockGaming: true,
    blockStreaming: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await SecureStore.setItemAsync('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);

    if (key === 'protectionEnabled') {
      if (newSettings.protectionEnabled) {
        FirewallEngine.initialize();
      } else {
        FirewallEngine.stopMonitoring();
      }
    }
  };

  const handleTestUrl = () => {
    Alert.prompt(
      'Test URL Filter',
      'Enter a URL to test the firewall:',
      async (url) => {
        if (url) {
          const result = await FirewallEngine.analyzeUrl(url);
          Alert.alert(
            result.allowed ? 'URL Allowed ✅' : 'URL Blocked 🚫',
            result.reason
          );
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protection</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Protection</Text>
              <Text style={styles.settingDescription}>
                Turn firewall protection on or off
              </Text>
            </View>
            <Switch
              value={settings.protectionEnabled}
              onValueChange={() => toggleSetting('protectionEnabled')}
              trackColor={{ false: '#404060', true: '#6c5ce7' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>AI Detection</Text>
              <Text style={styles.settingDescription}>
                Use AI to detect threats and inappropriate content
              </Text>
            </View>
            <Switch
              value={settings.aiDetection}
              onValueChange={() => toggleSetting('aiDetection')}
              trackColor={{ false: '#404060', true: '#6c5ce7' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Show alerts when content is blocked
              </Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
              trackColor={{ false: '#404060', true: '#6c5ce7' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Filtering</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Block Social Media</Text>
              <Text style={styles.settingDescription}>
                Facebook, Instagram, TikTok, Twitter
              </Text>
            </View>
            <Switch
              value={settings.blockSocialMedia}
              onValueChange={() => toggleSetting('blockSocialMedia')}
              trackColor={{ false: '#404060', true: '#6c5ce7' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Block Gaming Sites</Text>
              <Text style={styles.settingDescription}>
                Gaming websites and platforms
              </Text>
            </View>
            <Switch
              value={settings.blockGaming}
              onValueChange={() => toggleSetting('blockGaming')}
              trackColor={{ false: '#404060', true: '#6c5ce7' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Block Streaming</Text>
              <Text style={styles.settingDescription}>
                Netflix, YouTube, Twitch, Hulu
              </Text>
            </View>
            <Switch
              value={settings.blockStreaming}
              onValueChange={() => toggleSetting('blockStreaming')}
              trackColor={{ false: '#404060', true: '#6c5ce7' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>

          <TouchableOpacity style={styles.button} onPress={handleTestUrl}>
            <Text style={styles.buttonText}>🧪 Test URL Filter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => Alert.alert('Info', 'Viewing firewall logs...')}
          >
            <Text style={styles.buttonText}>📋 View Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Hatch Wall</Text>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoText}>
            On-device AI firewall for student safety
          </Text>
          <Text style={styles.infoText}>© 2025 HatchOS</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 30,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#252540',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  button: {
    backgroundColor: '#252540',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 5,
  },
});
