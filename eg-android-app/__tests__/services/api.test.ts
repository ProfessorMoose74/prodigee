// Mock AsyncStorage first
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock axios with proper interceptors
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

import {api} from '../../src/services/api';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAxiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxiosInstance);
    // Reset the mocked instance methods
    mockedAxiosInstance.get.mockClear();
    mockedAxiosInstance.post.mockClear();
    mockedAxiosInstance.put.mockClear();
    mockedAxiosInstance.delete.mockClear();
  });

  describe('parentLogin', () => {
    it('successfully logs in parent', async () => {
      const mockResponse = {
        data: {
          success: true,
          parent: {
            id: 1,
            name: 'Test Parent',
            email: 'test@example.com',
            subscription_tier: 'premium',
          },
          token: 'mock-jwt-token',
        },
      };

      mockedAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await api.parentLogin('test@example.com', 'password');

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/parent/login', {
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('handles login failure', async () => {
      const mockError = new Error('Invalid credentials');
      mockError.response = {
        data: {
          success: false,
          message: 'Invalid credentials',
        },
      };

      mockedAxiosInstance.post.mockRejectedValue(mockError);

      await expect(
        api.parentLogin('wrong@example.com', 'wrongpass'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('childLogin', () => {
    it('successfully logs in child', async () => {
      const mockResponse = {
        data: {
          success: true,
          child: {
            id: 1,
            name: 'Test Child',
            age: 8,
            current_week: 5,
            avatar: 'child-avatar-data',
          },
          token: 'child-jwt-token',
        },
      };

      mockedAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await api.childLogin(1, 'parent-token');

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/child/login', {
        child_id: 1,
        parent_token: 'parent-token',
      });

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getChildDashboard', () => {
    it('fetches child dashboard data', async () => {
      const mockResponse = {
        data: {
          child: {
            id: 1,
            name: 'Test Child',
            age: 8,
            current_week: 5,
            avatar: 'avatar-data',
          },
          progress: {
            totalStars: 45,
            weeklyProgress: 80,
            currentStreak: 5,
          },
          activities: [
            {id: 1, name: 'Math Practice', type: 'calculation'},
            {id: 2, name: 'Word Recognition', type: 'vocabulary'},
          ],
        },
      };

      mockedAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await api.getChildDashboard();

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/child/dashboard');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAnalyticsDashboard', () => {
    it('fetches parent analytics dashboard', async () => {
      const mockResponse = {
        data: {
          parent: {
            id: 1,
            name: 'Test Parent',
            email: 'test@example.com',
          },
          children: [
            {
              id: 1,
              name: 'Child 1',
              progress: {totalStars: 45, weeklyProgress: 80},
            },
            {
              id: 2,
              name: 'Child 2',
              progress: {totalStars: 32, weeklyProgress: 65},
            },
          ],
          weeklyReport: {
            totalActivities: 24,
            averageAccuracy: 85,
            improvementAreas: ['multiplication', 'reading-comprehension'],
          },
        },
      };

      mockedAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await api.getAnalyticsDashboard();

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/analytics/dashboard');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('submitActivityResult', () => {
    it('submits activity results successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          starsEarned: 3,
          newAchievements: ['math-master'],
        },
      };

      const activityData = {
        activityType: 'calculation',
        score: 85,
        duration: 120,
        accuracy: 90,
        starsEarned: 3,
      };

      mockedAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await api.submitActivityResult(activityData);

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(
        '/activities/submit',
        activityData,
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      mockedAxiosInstance.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        api.parentLogin('test@example.com', 'password'),
      ).rejects.toThrow('Network Error');
    });

    it('handles timeout errors', async () => {
      mockedAxiosInstance.post.mockRejectedValue({code: 'ECONNABORTED'});

      await expect(
        api.parentLogin('test@example.com', 'password'),
      ).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });
  });
});
