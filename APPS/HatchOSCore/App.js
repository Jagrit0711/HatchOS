import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import OverlayScreen from './src/screens/OverlayScreen';
import ExamModeScreen from './src/screens/ExamModeScreen';
import ScreenshotService from './src/services/ScreenshotService';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // TEMPORARY: Uncomment to force fresh login (for testing only)
      // await AsyncStorage.clear();
      // console.log('🧹 Storage cleared - forcing login screen');
      
      const userId = await AsyncStorage.getItem('userId');
      const deviceId = await AsyncStorage.getItem('deviceId');

      console.log('📱 Checking login...');
      console.log('User ID:', userId);
      console.log('Device ID:', deviceId);

      if (userId && deviceId) {
        console.log('✅ User already logged in');
        setInitialRoute('Home');
        
        // Start monitoring
        ScreenshotService.startMonitoring();
      } else {
        console.log('❌ No login found - showing login screen');
        setInitialRoute('Login');
      }
    } catch (error) {
      console.error('Error checking login:', error);
      setInitialRoute('Login');
    }
  };

  if (!initialRoute) {
    return null; // Loading
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#000000' }
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen 
            name="Overlay" 
            component={OverlayScreen}
            options={{
              presentation: 'transparentModal',
              cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                  opacity: progress,
                },
              }),
            }}
          />
          <Stack.Screen 
            name="ExamMode" 
            component={ExamModeScreen}
            options={{
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
