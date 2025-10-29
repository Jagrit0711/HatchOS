import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform-based URL detection
const SERVER_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000'
  : 'http://192.168.29.164:5000';

// Export the server URL for use in other modules
export const API_URL = SERVER_URL;

const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth methods
export const login = async (username, password) => {
  try {
    const response = await api.post('/api/users/login', { username, password });
    if (response.data.user) {
      await AsyncStorage.setItem('userId', response.data.user._id);
      await AsyncStorage.setItem('userRole', response.data.user.role);
      await AsyncStorage.setItem('userName', response.data.user.name);
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const userRole = await AsyncStorage.getItem('userRole');
    const userName = await AsyncStorage.getItem('userName');
    
    if (!userId) return null;
    
    return {
      _id: userId,
      role: userRole,
      name: userName,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const getUserDetails = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user details error:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userName');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Subject methods
export const getMySubjects = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const response = await api.get('/api/subjects', {
      params: {
        userId: user._id,
        role: user.role,
      },
    });
    return response.data.subjects || [];
  } catch (error) {
    console.error('Get subjects error:', error);
    return [];
  }
};

export const getSubjectDetails = async (subjectId) => {
  try {
    const response = await api.get(`/api/subjects/${subjectId}`);
    return response.data.subject || null;
  } catch (error) {
    console.error('Get subject details error:', error);
    return null;
  }
};

// Assignment methods
export const getAssignments = async (subjectId = null) => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const params = {
      userId: user._id,
      role: user.role,
    };
    
    if (subjectId) {
      params.subjectId = subjectId;
    }
    
    const response = await api.get('/api/assignments', { params });
    return response.data.assignments || [];
  } catch (error) {
    console.error('Get assignments error:', error);
    return [];
  }
};

export const createAssignment = async (assignmentData) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can create assignments');
    }
    
    const response = await api.post('/api/assignments', {
      ...assignmentData,
      teacherId: user._id,
    });
    return response.data.assignment || null;
  } catch (error) {
    console.error('Create assignment error:', error);
    throw error;
  }
};

// Resource methods
export const getResources = async (subjectId = null) => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const params = {
      userId: user._id,
      role: user.role,
    };
    
    if (subjectId) {
      params.subjectId = subjectId;
    }
    
    const response = await api.get('/api/resources', { params });
    return response.data.resources || [];
  } catch (error) {
    console.error('Get resources error:', error);
    return [];
  }
};

export const createResource = async (resourceData) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can create resources');
    }
    
    const response = await api.post('/api/resources', {
      ...resourceData,
      teacherId: user._id,
    });
    return response.data.resource || null;
  } catch (error) {
    console.error('Create resource error:', error);
    throw error;
  }
};

// Update Assignment
export const updateAssignment = async (assignmentId, data) => {
  try {
    const response = await api.put(`/api/assignments/${assignmentId}`, data);
    return response.data.assignment || null;
  } catch (error) {
    console.error('Update assignment error:', error);
    throw error;
  }
};

// Delete Assignment
export const deleteAssignment = async (assignmentId) => {
  try {
    const response = await api.delete(`/api/assignments/${assignmentId}`);
    return response.data;
  } catch (error) {
    console.error('Delete assignment error:', error);
    throw error;
  }
};

// Update Resource
export const updateResource = async (resourceId, data) => {
  try {
    console.log('updateResource API call:', { resourceId, data });
    const response = await api.put(`/api/resources/${resourceId}`, data);
    console.log('updateResource response:', response.data);
    return response.data.resource || null;
  } catch (error) {
    console.error('Update resource error:', error);
    throw error;
  }
};

// Delete Resource
export const deleteResource = async (resourceId) => {
  try {
    const response = await api.delete(`/api/resources/${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('Delete resource error:', error);
    throw error;
  }
};

// Submit Assignment
export const submitAssignment = async (assignmentId, data) => {
  try {
    const user = await getCurrentUser();
    const response = await api.post('/api/submissions', {
      assignmentId,
      studentId: user._id,
      studentName: user.name,
      ...data,
    });
    return response.data.submission || null;
  } catch (error) {
    console.error('Submit assignment error:', error);
    throw error;
  }
};

// Get Submissions
export const getSubmissions = async (assignmentId) => {
  try {
    const response = await api.get(`/api/submissions/${assignmentId}`);
    return response.data.submissions || [];
  } catch (error) {
    console.error('Get submissions error:', error);
    return [];
  }
};

// Grade Submission
export const gradeSubmission = async (submissionId, data) => {
  try {
    const response = await api.put(`/api/submissions/${submissionId}/grade`, data);
    return response.data.submission || null;
  } catch (error) {
    console.error('Grade submission error:', error);
    throw error;
  }
};

export default {
  login,
  getCurrentUser,
  getUserDetails,
  logout,
  getMySubjects,
  getSubjectDetails,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getResources,
  createResource,
  updateResource,
  deleteResource,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
};
