// src/api/userService.js
import api from './api';

export const login = (credentials) => {
  return api.post('/login', credentials);
};

export const register = (userData) => {
  return api.post('/register', userData);
};

export const getSelfAssessmentBehavioral = () => {
    return api.get('/self-assessment/question/behavioral');
};