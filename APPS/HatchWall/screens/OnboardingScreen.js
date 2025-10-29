import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_STEPS = [
  {
    id: 1,
    icon: '🛡️',
    title: 'Welcome to Hatch Wall',
    description: 'Your intelligent firewall that keeps you safe and focused while learning.',
    action: null,
  },
  {
    id: 2,
    icon: '🔒',
    title: 'On-Device Protection',
    description: 'All monitoring happens on your device. Your privacy is protected - we only report policy violations, not your browsing history.',
    action: null,
  },
  {
    id: 3,
    icon: '🤖',
    title: 'AI-Powered Detection',
    description: 'Advanced AI analyzes network activity to identify and block distracting or harmful content in real-time.',
    action: null,
  },
  {
    id: 4,
    icon: '⚙️',
    title: 'Grant Permissions',
    description: 'Hatch Wall needs permission to monitor network traffic. This allows us to protect you from harmful content.',
    action: 'permissions',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = async () => {
    if (step.action === 'permissions') {
      // Request permissions
      await requestPermissions();
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Onboarding?',
      'We recommend completing the setup for full protection.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: completeOnboarding,
        },
      ]
    );
  };

  const requestPermissions = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would request VPN profile permissions here
      // For Android, this would involve creating a VPN service
      // For iOS, this would use NEVPNManager
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Permissions Granted',
        'Hatch Wall is now protecting your device!'
      );
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to grant permissions. Please try again.');
    }
  };

  const completeOnboarding = async () => {
    try {
      await SecureStore.setItemAsync('onboardingComplete', 'true');
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {currentStep > 0 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.icon}>{step.icon}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {step.action === 'permissions' && (
          <View style={styles.permissionsInfo}>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>✅</Text>
              <Text style={styles.permissionText}>Monitor network traffic</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>✅</Text>
              <Text style={styles.permissionText}>Block harmful content</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>✅</Text>
              <Text style={styles.permissionText}>Run in background</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === ONBOARDING_STEPS.length - 1
              ? 'Get Started'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#404060',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#6c5ce7',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#00d2d3',
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  skipButtonText: {
    color: '#a0a0a0',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionsInfo: {
    marginTop: 40,
    width: '100%',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#252540',
    padding: 15,
    borderRadius: 10,
  },
  permissionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
  },
  footer: {
    padding: 20,
  },
  nextButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
