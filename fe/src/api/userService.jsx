// src/api/userService.js
import api from './api';
import { jwtDecode } from 'jwt-decode';

// Key used to store the token in localStorage
const TOKEN_KEY = 'auth_token';

export const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    
    // Store token in localStorage upon successful login
    if (response.data && response.data.token) {
      const token = response.data.token;
      
      // Store the token in localStorage
      localStorage.setItem(TOKEN_KEY, token);
      
      // Set the token in the Authorization header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // For debugging
      console.log('Token stored successfully:', token.substring(0, 20) + '...');
      
      // Verify we can decode the token properly
      try {
        const decoded = jwtDecode(token);
        console.log('User ID from token:', decoded.sub);
      } catch (err) {
        console.error('Error decoding token during login:', err);
      }
    } else {
      console.error('Invalid response format - missing token');
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = (userData) => {
  return api.post('/register', userData);
};

export const getSelfAssessmentBehavioral = () => {
  return api.get('/self-assessment/question/behavioral');
};

// Function to get user ID from token
export const getUserIdFromToken = () => {
    // Try to get the token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.error('No token found in localStorage');
      // As a fallback, try to get from Authorization header
      const authHeader = api.defaults.headers.common['Authorization'] || '';
      const headerToken = authHeader.replace('Bearer ', '');
      
      if (!headerToken) {
        console.error('No token found in Authorization header either');
        return null;
      }
      
      try {
        const decoded = jwtDecode(headerToken);
        const userId = decoded.sub;
        console.log('Retrieved user ID from header token:', userId);
        return userId;
      } catch (error) {
        console.error('Error decoding token from header:', error);
        return null;
      }
    }
    
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.sub;
      console.log('Retrieved user ID from localStorage token:', userId);
      return userId;
    } catch (error) {
      console.error('Error decoding token from localStorage:', error);
      return null;
    }
  };

// Helper function to ensure we have a valid authentication setup
export const setupAuthHeadersFromStorage = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  }
  return false;
};

// Updated function for submitting behavioral assessment
export const submitBehavioralAssessment = async (answers) => {
    // Ensure the token is set in the API headers
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('No token found before submitting assessment');
      return Promise.reject(new Error('Authentication token not found. Please login again.'));
    }
    
    try {
      // Get user ID from token
      const userId = getUserIdFromToken();
      console.log('User ID for assessment submission:', userId);
      
      if (!userId) {
        return Promise.reject(new Error('User ID not found. Please login again.'));
      }
      
      // Parse the user ID to ensure it's in the right format
      // The API might expect a number, but JWT claims are often strings
      const parsedUserId = parseInt(userId, 10);
      
      if (isNaN(parsedUserId)) {
        console.error('Invalid user ID format:', userId);
        return Promise.reject(new Error('Invalid user ID format. Please login again.'));
      }
      
      // Make the API request with the user ID
      const response = await api.post('/self-assessment/submit/behavioral', {
        user_id: parsedUserId,
        answers: answers
      });
      
      return response;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      throw error;
    }
  };

// Logout function that clears token
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
};

// Get assessment completion status
export const getAssessmentStatus = () => {
    return api.get('/self-assessment/status');
  };