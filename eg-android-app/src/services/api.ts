import axios, {AxiosInstance} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ParentLoginResponse {
  success: boolean;
  token: string;
  parent: {
    id: number;
    name: string;
    email: string;
    subscription_tier: string;
  };
  expires_in_hours: number;
}

export interface ChildLoginResponse {
  success: boolean;
  token: string;
  child: {
    id: number;
    name: string;
    age: number;
    current_week: number;
    avatar: string;
  };
  session_duration_hours: number;
}

export interface ChildDashboard {
  child: {
    id: number;
    name: string;
    current_week: number;
    total_stars: number;
    streak_days: number;
  };
  week_activities: Record<string, any>;
  nursery_rhyme: {
    title: string;
    lyrics: string;
    motions: string;
  };
  progress: Record<string, number>;
  recommendation: {
    recommended_skill: string;
    reason: string;
    motivation_level: string;
  };
}

export interface ActivityCompletion {
  accuracy: number;
  duration: number;
  stars_earned: number;
  engagement: number;
}

export interface LearningSession {
  session_type: string;
  planned_duration: number;
  activities_planned: number;
}

export interface VoiceInteraction {
  interaction_type: string;
  prompt_given: string;
  expected_response: string;
  actual_response: string;
  recognition_confidence: number;
  accuracy_score: number;
  response_time_seconds: number;
  success_achieved: boolean;
  session_id?: number;
}

class ElementalGeniusAPI {
  private client: AxiosInstance;
  private baseURL = __DEV__
    ? 'http://localhost:5000'
    : 'https://api.elementalgenius.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use(async config => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Handle auth expiration
          await this.logout();
        }
        return Promise.reject(error);
      },
    );
  }

  // Authentication endpoints matching Flask routes exactly
  async parentLogin(
    email: string,
    password: string,
  ): Promise<ParentLoginResponse> {
    const response = await this.client.post('/parent/login', {email, password});
    if (response.data.success) {
      await AsyncStorage.setItem('user_type', 'parent');
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem(
        'parent_id',
        response.data.parent.id.toString(),
      );
    }
    return response.data;
  }

  async childLogin(
    childId: number,
    parentToken: string,
  ): Promise<ChildLoginResponse> {
    const response = await this.client.post('/child/login', {
      child_id: childId,
      parent_token: parentToken,
    });
    if (response.data.success) {
      await AsyncStorage.setItem('user_type', 'child');
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('child_id', childId.toString());
    }
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    await AsyncStorage.multiRemove([
      'auth_token',
      'user_type',
      'parent_id',
      'child_id',
    ]);
  }

  // Child endpoints matching Flask API exactly
  async getChildDashboard(): Promise<ChildDashboard> {
    const response = await this.client.get('/child/dashboard');
    return response.data;
  }

  async getActivityDetails(activityType: string) {
    const response = await this.client.get(`/child/activity/${activityType}`);
    return response.data;
  }

  async completeActivity(activityType: string, results: ActivityCompletion) {
    const response = await this.client.post(
      `/child/activity/${activityType}/complete`,
      results,
    );
    return response.data;
  }

  // Learning session management
  async startLearningSession(session: LearningSession) {
    const response = await this.client.post(
      '/child/learning-sessions',
      session,
    );
    return response.data;
  }

  async completeLearningSession(
    sessionId: number,
    results: {
      actual_duration: number;
      completion_status: string;
      activities_completed: number;
      overall_accuracy: number;
      engagement_score: number;
      stars_earned: number;
    },
  ) {
    const response = await this.client.put(
      `/child/learning-sessions/${sessionId}/complete`,
      results,
    );
    return response.data;
  }

  // Progress tracking
  async getPhonememicProgress(childId: number) {
    const response = await this.client.get(
      `/child/phonemic-progress?child_id=${childId}`,
    );
    return response.data;
  }

  async createPhonememicProgress(progress: {
    skill_type: string;
    skill_category: string;
    week_number: number;
    mastery_level: number;
    accuracy_percentage: number;
    attempts_total: number;
    attempts_correct: number;
  }) {
    const response = await this.client.post(
      '/child/phonemic-progress',
      progress,
    );
    return response.data;
  }

  // Voice interactions
  async logVoiceInteraction(interaction: VoiceInteraction) {
    const response = await this.client.post(
      '/child/voice-interactions',
      interaction,
    );
    return response.data;
  }

  async getVoiceInteractions(childId: number, sessionId?: number) {
    const params = sessionId
      ? `?child_id=${childId}&session_id=${sessionId}`
      : `?child_id=${childId}`;
    const response = await this.client.get(
      `/child/voice-interactions${params}`,
    );
    return response.data;
  }

  // Assessment system
  async getAssessments(childId: number, assessmentType?: string) {
    const params = assessmentType
      ? `?child_id=${childId}&assessment_type=${assessmentType}`
      : `?child_id=${childId}`;
    const response = await this.client.get(`/child/assessments${params}`);
    return response.data;
  }

  async getChildAssessmentReport() {
    const response = await this.client.get('/child/assessment');
    return response.data;
  }

  // Curriculum
  async getWeekCurriculum(weekNumber: number) {
    const response = await this.client.get(`/curriculum/week/${weekNumber}`);
    return response.data;
  }

  // Content library
  async getEducationalContent(
    filters: {
      subject_area?: string;
      age_range?: string;
      page?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (filters.subject_area) {
      params.append('subject_area', filters.subject_area);
    }
    if (filters.age_range) {
      params.append('age_range', filters.age_range);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }

    const response = await this.client.get(`/content?${params.toString()}`);
    return response.data;
  }

  // Parent endpoints
  async addChild(child: {
    name: string;
    age: number;
    grade_level: string;
    learning_style: string;
  }) {
    const response = await this.client.post('/parent/add_child', child);
    return response.data;
  }

  async getAnalyticsDashboard() {
    const response = await this.client.get('/analytics/dashboard');
    return response.data;
  }

  async getLearningSessionsForChild(
    childId: number,
    page: number = 1,
    perPage: number = 10,
  ) {
    const response = await this.client.get(
      `/child/learning-sessions?child_id=${childId}&page=${page}&per_page=${perPage}`,
    );
    return response.data;
  }

  // System analytics
  async logSystemMetric(metric: {
    metric_type: string;
    metric_name: string;
    metric_value: number;
    server_component: string;
    context_data?: Record<string, any>;
  }) {
    const response = await this.client.post('/analytics/system', metric);
    return response.data;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend is not accessible');
    }
  }

  // Offline sync support methods
  async submitActivityResult(activityData: any) {
    const response = await this.client.post('/activities/submit', activityData);
    return response.data;
  }

  async updateUserProgress(progressData: any) {
    const response = await this.client.put('/child/progress', progressData);
    return response.data;
  }

  async updateAvatar(avatarData: any) {
    const response = await this.client.put('/child/avatar', avatarData);
    return response.data;
  }

  async updateSettings(settingsData: any) {
    const response = await this.client.put('/child/settings', settingsData);
    return response.data;
  }
}

export const api = new ElementalGeniusAPI();
