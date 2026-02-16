import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const WITH_CREDENTIALS = process.env.REACT_APP_WITH_CREDENTIALS === 'true';

class ElementalGeniusAPI {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: WITH_CREDENTIALS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle auth expiration
          await this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints matching Flask routes exactly
  async parentLogin(email, password) {
    try {
      const response = await this.client.post('/parent/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('user_type', 'parent');
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('parent_id', response.data.parent.id.toString());
        localStorage.setItem('user_data', JSON.stringify(response.data.parent));
      }
      return response.data;
    } catch (error) {
      console.error('Parent login error:', error);
      throw error;
    }
  }

  async childLogin(childId, parentToken) {
    try {
      const response = await this.client.post('/child/login', {
        child_id: childId,
        parent_token: parentToken,
      });
      if (response.data.success) {
        localStorage.setItem('user_type', 'child');
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('child_id', childId.toString());
        localStorage.setItem('user_data', JSON.stringify(response.data.child));
      }
      return response.data;
    } catch (error) {
      console.error('Child login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.client.post('/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    
    // Clear all local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('parent_id');
    localStorage.removeItem('child_id');
    localStorage.removeItem('user_data');
  }

  // Child endpoints matching Flask API exactly
  async getChildDashboard() {
    try {
      const response = await this.client.get('/child/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get child dashboard error:', error);
      throw error;
    }
  }

  async getActivityDetails(activityType) {
    try {
      const response = await this.client.get(`/child/activity/${activityType}`);
      return response.data;
    } catch (error) {
      console.error('Get activity details error:', error);
      throw error;
    }
  }

  async completeActivity(activityType, results) {
    try {
      const response = await this.client.post(
        `/child/activity/${activityType}/complete`,
        results
      );
      return response.data;
    } catch (error) {
      console.error('Complete activity error:', error);
      throw error;
    }
  }

  // Learning session management
  async startLearningSession(session) {
    try {
      const response = await this.client.post('/child/learning-sessions', session);
      return response.data;
    } catch (error) {
      console.error('Start learning session error:', error);
      throw error;
    }
  }

  async completeLearningSession(sessionId, results) {
    try {
      const response = await this.client.put(
        `/child/learning-sessions/${sessionId}/complete`,
        results
      );
      return response.data;
    } catch (error) {
      console.error('Complete learning session error:', error);
      throw error;
    }
  }

  // Progress tracking
  async getPhonememicProgress(childId) {
    try {
      const response = await this.client.get(
        `/child/phonemic-progress?child_id=${childId}`
      );
      return response.data;
    } catch (error) {
      console.error('Get phonemic progress error:', error);
      throw error;
    }
  }

  async createPhonememicProgress(progress) {
    try {
      const response = await this.client.post('/child/phonemic-progress', progress);
      return response.data;
    } catch (error) {
      console.error('Create phonemic progress error:', error);
      throw error;
    }
  }

  // Voice interactions
  async logVoiceInteraction(interaction) {
    try {
      const response = await this.client.post('/child/voice-interactions', interaction);
      return response.data;
    } catch (error) {
      console.error('Log voice interaction error:', error);
      throw error;
    }
  }

  async getVoiceInteractions(childId, sessionId = null) {
    try {
      const params = sessionId 
        ? `?child_id=${childId}&session_id=${sessionId}`
        : `?child_id=${childId}`;
      const response = await this.client.get(`/child/voice-interactions${params}`);
      return response.data;
    } catch (error) {
      console.error('Get voice interactions error:', error);
      throw error;
    }
  }

  // Assessment system
  async getAssessments(childId, assessmentType = null) {
    try {
      const params = assessmentType 
        ? `?child_id=${childId}&assessment_type=${assessmentType}`
        : `?child_id=${childId}`;
      const response = await this.client.get(`/child/assessments${params}`);
      return response.data;
    } catch (error) {
      console.error('Get assessments error:', error);
      throw error;
    }
  }

  async getChildAssessmentReport() {
    try {
      const response = await this.client.get('/child/assessment');
      return response.data;
    } catch (error) {
      console.error('Get child assessment report error:', error);
      throw error;
    }
  }

  // Curriculum
  async getWeekCurriculum(weekNumber) {
    try {
      const response = await this.client.get(`/curriculum/week/${weekNumber}`);
      return response.data;
    } catch (error) {
      console.error('Get week curriculum error:', error);
      throw error;
    }
  }

  // Content library
  async getEducationalContent(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.subject_area) params.append('subject_area', filters.subject_area);
      if (filters.age_range) params.append('age_range', filters.age_range);
      if (filters.page) params.append('page', filters.page.toString());

      const response = await this.client.get(`/content?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Get educational content error:', error);
      throw error;
    }
  }

  // Parent endpoints
  async addChild(child) {
    try {
      const response = await this.client.post('/parent/add_child', child);
      return response.data;
    } catch (error) {
      console.error('Add child error:', error);
      throw error;
    }
  }

  async getAnalyticsDashboard() {
    try {
      const response = await this.client.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get analytics dashboard error:', error);
      throw error;
    }
  }

  async getLearningSessionsForChild(childId, page = 1, perPage = 10) {
    try {
      const response = await this.client.get(
        `/child/learning-sessions?child_id=${childId}&page=${page}&per_page=${perPage}`
      );
      return response.data;
    } catch (error) {
      console.error('Get learning sessions for child error:', error);
      throw error;
    }
  }

  // System analytics
  async logSystemMetric(metric) {
    try {
      const response = await this.client.post('/analytics/system', metric);
      return response.data;
    } catch (error) {
      console.error('Log system metric error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('Backend is not accessible');
    }
  }

  // Voice processing with audio file upload
  async processVoiceInput(audioBlob, expectedResponse = null) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-input.webm');
      if (expectedResponse) {
        formData.append('expected_response', expectedResponse);
      }

      const response = await this.client.post('/api/voice/listen', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Process voice input error:', error);
      throw error;
    }
  }

  // Text-to-speech
  async speakText(text, voice = 'default') {
    try {
      const response = await this.client.post('/api/speak', { 
        text, 
        voice 
      });
      return response.data;
    } catch (error) {
      console.error('Speak text error:', error);
      throw error;
    }
  }

  // Avatar management
  async updateAvatar(avatarData) {
    try {
      const response = await this.client.put('/child/avatar', avatarData);
      return response.data;
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  }

  // Settings management
  async updateSettings(settingsData) {
    try {
      const response = await this.client.put('/child/settings', settingsData);
      return response.data;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  getUserType() {
    return localStorage.getItem('user_type');
  }

  getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  getParentId() {
    return localStorage.getItem('parent_id');
  }

  getChildId() {
    return localStorage.getItem('child_id');
  }
}

export const api = new ElementalGeniusAPI();
export default api;