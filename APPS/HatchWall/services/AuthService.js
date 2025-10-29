import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/firewall.config';

class AuthService {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.user) {
        // Store authentication token
        await SecureStore.setItemAsync('authToken', response.data.user.id);
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('userId', response.data.user.id);
        await SecureStore.setItemAsync('userRole', response.data.user.role);
        
        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: 'Invalid response from server',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please try again.',
      };
    }
  }

  async logout() {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userEmail');
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('userRole');
      await SecureStore.deleteItemAsync('onboardingComplete');
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getStoredUser() {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      const userEmail = await SecureStore.getItemAsync('userEmail');
      const userRole = await SecureStore.getItemAsync('userRole');

      if (userId && userEmail) {
        return {
          id: userId,
          email: userEmail,
          role: userRole,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();
