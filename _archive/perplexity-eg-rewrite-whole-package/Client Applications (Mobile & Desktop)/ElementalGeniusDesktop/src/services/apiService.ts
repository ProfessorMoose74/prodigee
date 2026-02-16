import axios from 'axios';

// Configure with your Flask backend URL
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for session-based authentication
});

export const authApi = {
  loginParent: (data: any) => apiClient.post('/parent/login', data),
  registerParent: (data: any) => apiClient.post('/parent/register', data),
  loginChild: (data: any) => apiClient.post('/child/login', data),
  logout: () => apiClient.post('/logout'),
};

export const childApi = {
  getDashboard: () => apiClient.get('/child/dashboard'),
  getActivity: (type: string) => apiClient.get(`/child/activity/${type}`),
  completeActivity: (type: string, data: any) => apiClient.post(`/child/activity/${type}/complete`, data),
};

export const parentApi = {
  getDashboard: () => apiClient.get('/parent/dashboard'),
  addChild: (data: any) => apiClient.post('/parent/add_child', data),
  getChildReport: (id: string) => apiClient.get(`/parent/reports/${id}`),
};

export const voiceApi = {
  // Sends audio data for recognition
  recognize: (audioFormData: FormData) => apiClient.post('/api/voice/listen', audioFormData),
};