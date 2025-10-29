import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, BackHandler } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ExamModeScreen({ route }) {
  const { examName, endTime } = route.params || {};
  const [timeLeft, setTimeLeft] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Disable back button during exam
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Exam Ended');
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }

      // Update current time
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      }));
    }, 1000);

    return () => {
      clearInterval(timer);
      backHandler.remove();
    };
  }, [endTime]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>🎓 EXAM MODE</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.examName}>{examName || 'Examination'}</Text>
        
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>Time Remaining</Text>
          <Text style={styles.timer}>{timeLeft}</Text>
        </View>

        <View style={styles.clockBox}>
          <Text style={styles.clockLabel}>Current Time</Text>
          <Text style={styles.clock}>{currentTime}</Text>
        </View>

        <Text style={styles.message}>
          Device will unlock after exam finishes
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>📵 All activities are being monitored</Text>
        <Text style={styles.footerText}>HatchOS Core - Exam Mode Active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 40,
  },
  badge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 60,
  },
  timerBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    width: '90%',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  timerLabel: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 10,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  clockBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
    width: '70%',
  },
  clockLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 5,
  },
  clock: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#444444',
    marginTop: 5,
    textAlign: 'center',
  },
});
