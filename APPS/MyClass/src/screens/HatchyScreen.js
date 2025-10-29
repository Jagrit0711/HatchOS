import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HatchyScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in and scale up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated background circles */}
      <Animated.View 
        style={[
          styles.backgroundCircle, 
          styles.circle1,
          { opacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.3]
          }) }
        ]} 
      />
      <Animated.View 
        style={[
          styles.backgroundCircle, 
          styles.circle2,
          { opacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.4]
          }) }
        ]} 
      />

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.headerTitle}>Hatchy</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Learning Revolution</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.comingSoonContainer}>
          {/* Animated main icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={80} color="#fff" />
            </LinearGradient>
            
            {/* Glow effect */}
            <Animated.View 
              style={[
                styles.glowRing,
                {
                  opacity: glowAnim,
                  transform: [{ 
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3]
                    })
                  }]
                }
              ]}
            />
          </Animated.View>
          
          <Text style={styles.title}>Something Crazy</Text>
          <Text style={styles.title2}>Is Coming...</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.description}>
            Get ready for the future of learning
          </Text>

          {/* Feature cards with icons */}
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#667eea20', '#764ba220']}
                style={styles.featureIconBg}
              >
                <Ionicons name="rocket-outline" size={32} color="#667eea" />
              </LinearGradient>
              <Text style={styles.featureTitle}>AI Assistant</Text>
              <Text style={styles.featureSubtext}>Smart help 24/7</Text>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#f093fb20', '#f5576c20']}
                style={styles.featureIconBg}
              >
                <Ionicons name="bulb-outline" size={32} color="#f093fb" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Smart Tips</Text>
              <Text style={styles.featureSubtext}>Personalized learning</Text>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#4facfe20', '#00f2fe20']}
                style={styles.featureIconBg}
              >
                <Ionicons name="school-outline" size={32} color="#4facfe" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Study Buddy</Text>
              <Text style={styles.featureSubtext}>Always there for you</Text>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#43e97b20', '#38f9d720']}
                style={styles.featureIconBg}
              >
                <Ionicons name="trending-up-outline" size={32} color="#43e97b" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Level Up</Text>
              <Text style={styles.featureSubtext}>Track your progress</Text>
            </View>
          </View>

          {/* Powered by badge */}
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.badge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.badgeText}>Powered by Advanced AI</Text>
            </LinearGradient>
          </View>

          {/* Coming soon text */}
          <Animated.View 
            style={[
              styles.comingSoonBadge,
              { opacity: glowAnim }
            ]}
          >
            <Text style={styles.comingSoonText}>LAUNCHING SOON</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  circle1: {
    width: 400,
    height: 400,
    backgroundColor: '#667eea',
    top: -200,
    right: -150,
  },
  circle2: {
    width: 300,
    height: 300,
    backgroundColor: '#764ba2',
    bottom: -100,
    left: -100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#667eea',
    top: 0,
    left: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 5,
  },
  title2: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#667eea',
    borderRadius: 2,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 35,
    fontWeight: '500',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureSubtext: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
  badgeContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  comingSoonBadge: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  comingSoonText: {
    color: '#667eea',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

export default HatchyScreen;
