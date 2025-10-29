import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import FirewallEngine from '../services/FirewallEngine';
import AuthService from '../services/AuthService';

export default function HomeScreen({ navigation }) {
  const [status, setStatus] = useState({
    isRunning: false,
    blocklistSize: 0,
    allowlistSize: 0,
  });
  const [stats, setStats] = useState({
    blockedToday: 0,
    protectedHours: 0,
    violationsToday: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userInfo = await AuthService.getStoredUser();
      setUser(userInfo);

      const engineStatus = await FirewallEngine.getStatus();
      setStatus(engineStatus);

      // In a real app, you would fetch stats from the server
      setStats({
        blockedToday: 23,
        protectedHours: 6.5,
        violationsToday: 2,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Protection will be disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            FirewallEngine.stopMonitoring();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'Student'}</Text>
          <Text style={styles.subGreeting}>Your protection is active 🛡️</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Protection Status</Text>
            <View
              style={[
                styles.statusIndicator,
                status.isRunning && styles.statusIndicatorActive,
              ]}
            >
              <Text style={styles.statusIndicatorText}>
                {status.isRunning ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.statusDetails}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Blocked Domains</Text>
              <Text style={styles.statusValue}>{status.blocklistSize}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Allowed Domains</Text>
              <Text style={styles.statusValue}>{status.allowlistSize}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚫</Text>
            <Text style={styles.statValue}>{stats.blockedToday}</Text>
            <Text style={styles.statLabel}>Blocked Today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏰</Text>
            <Text style={styles.statValue}>{stats.protectedHours}h</Text>
            <Text style={styles.statLabel}>Protected Hours</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚠️</Text>
            <Text style={styles.statValue}>{stats.violationsToday}</Text>
            <Text style={styles.statLabel}>Violations</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🤖</Text>
          <Text style={styles.infoTitle}>AI Protection Active</Text>
          <Text style={styles.infoText}>
            Our AI is continuously analyzing network activity to keep you safe
            from harmful and distracting content.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What We Protect You From</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔞</Text>
            <Text style={styles.featureText}>Inappropriate Content</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎮</Text>
            <Text style={styles.featureText}>Gaming & Distractions</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎣</Text>
            <Text style={styles.featureText}>Phishing & Scams</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🦠</Text>
            <Text style={styles.featureText}>Malware & Viruses</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 5,
  },
  settingsIcon: {
    fontSize: 28,
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#252540',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusIndicator: {
    backgroundColor: '#404060',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIndicatorActive: {
    backgroundColor: '#00d2d3',
  },
  statusIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 5,
  },
  statusValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#252540',
    borderRadius: 15,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#6c5ce7',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
  featuresCard: {
    backgroundColor: '#252540',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#404060',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
