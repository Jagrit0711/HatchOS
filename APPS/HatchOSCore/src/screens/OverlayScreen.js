import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function OverlayScreen({ route }) {
  const { reason } = route.params || { reason: 'Inappropriate activity detected' };
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.alertBox}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>AI Detected Inappropriate Activity</Text>
        <Text style={styles.message}>{reason}</Text>
        <Text style={styles.instruction}>Visit admin for details</Text>
        
        <View style={styles.countdown}>
          <Text style={styles.countdownText}>
            This screen will remain for {countdown}s
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>HatchOS Core - Security Alert</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  countdown: {
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 14,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
