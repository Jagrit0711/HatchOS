import axios from 'axios';
import { Platform } from 'react-native';

// Use IP address for all platforms (web and mobile)
// HTTP for simple setup - works immediately!
const SERVER_URL = 'http://192.168.0.4:5000';
const API_URL = `${SERVER_URL}/api`;

// Export SERVER_URL for use in other files (for loading images, audio, etc.)
export { SERVER_URL };

// Create axios instance with error handling
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Add request interceptor to set auth headers if token exists
api.interceptors.request.use(
  async (config) => {
    try {
      // Try to get token from AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      // Ignore errors in getting token - storage might not be available
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

// User APIs
export const userAPI = {
  getUsers: (role) => api.get('/users', { params: { role } }),
  getUser: (userId) => api.get(`/users/${userId}`),
  updateStatus: (userId, status) => api.put(`/users/${userId}/status`, { status }),
};

// Message APIs
export const messageAPI = {
  sendMessage: (messageData) => api.post('/messages/send', messageData),
  getDirectMessages: (user1Id, user2Id) => api.get(`/messages/direct/${user1Id}/${user2Id}`),
  getGroupMessages: (groupId) => api.get(`/groups/${groupId}/messages`),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  getConversations: (userId) => api.get(`/conversations/${userId}`),
};

// Group APIs
export const groupAPI = {
  createGroup: (groupData) => api.post('/groups/create', groupData),
  getGroup: (groupId) => api.get(`/groups/${groupId}`),
  getUserGroups: (userId) => api.get(`/groups/user/${userId}`),
  getGroupMessages: (groupId) => api.get(`/groups/${groupId}/messages`),
  addMember: (groupId, userId) => api.post(`/groups/${groupId}/members`, { user_id: userId }),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  updateGroup: (groupId, data) => api.put(`/groups/${groupId}`, data),
  updateMemberRole: (groupId, userId, isAdmin) => api.put(`/groups/${groupId}/members/${userId}/role`, { is_admin: isAdmin }),
};

// File Upload API
export const uploadFile = async (fileUri, userId) => {
  const formData = new FormData();
  
  // Handle web vs mobile file upload differently
  if (Platform.OS === 'web') {
    // For web: fileUri is actually a File object
    if (fileUri instanceof File) {
      formData.append('file', fileUri);
    } else {
      throw new Error('Invalid file format for web - expected File object');
    }
  } else {
    // For mobile: fileUri is a local file path
    const fileType = fileUri.split('.').pop();
    const fileName = fileUri.split('/').pop();
    
    formData.append('file', {
      uri: fileUri,
      type: `application/${fileType}`,
      name: fileName,
    });
  }
  
  formData.append('user_id', userId);

  const response = await axios.post(`${API_URL.replace('/api', '')}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 second timeout for large files
  });

  return response.data;
};

export default api;
