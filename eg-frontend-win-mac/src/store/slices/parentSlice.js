import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks for parent management
export const loadParentDashboard = createAsyncThunk(
  'parent/loadDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getAnalyticsDashboard();
      return response;
    } catch (error) {
      console.error('Load parent dashboard error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

export const addChild = createAsyncThunk(
  'parent/addChild',
  async (childData, { rejectWithValue }) => {
    try {
      const response = await api.addChild(childData);
      return response;
    } catch (error) {
      console.error('Add child error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add child');
    }
  }
);

export const loadChildSessions = createAsyncThunk(
  'parent/loadChildSessions',
  async ({ childId, page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.getLearningSessionsForChild(childId, page, perPage);
      return { childId, sessions: response };
    } catch (error) {
      console.error('Load child sessions error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load sessions');
    }
  }
);

const initialState = {
  // Parent profile
  profile: null,
  isLoadingProfile: false,
  
  // Dashboard data
  dashboard: null,
  isLoadingDashboard: false,
  
  // Children management
  children: [],
  selectedChildId: null,
  isAddingChild: false,
  
  // Real-time monitoring
  activeChildren: new Set(), // Children currently logged in
  liveActivities: {}, // childId -> current activity
  liveProgress: {}, // childId -> recent progress updates
  
  // Session monitoring
  childSessions: {}, // childId -> sessions array
  isLoadingSessions: false,
  
  // Analytics
  summaryStats: {
    totalSessions: 0,
    completionRate: 0,
    averageEngagement: 0,
  },
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // Reports
  weeklyReports: {},
  monthlyReports: {},
  
  // Subscription & settings
  subscription: {
    tier: 'basic',
    features: [],
    expirationDate: null,
  },
  
  // Communication preferences
  communicationSettings: {
    emailNotifications: true,
    pushNotifications: true,
    dailySummary: true,
    weeklyReport: true,
    milestoneAlerts: true,
    realTimeAlerts: true,
  },
  
  // Monitoring settings
  monitoringSettings: {
    realTimeAlerts: true,
    sessionStartNotify: true,
    strugglingAlerts: true,
    achievementNotifications: true,
    sessionTimeouts: true,
  },
  
  // Errors
  error: null,
  childError: null,
  
  // UI state
  selectedView: 'overview', // 'overview', 'progress', 'sessions', 'settings'
  filterBy: 'all', // 'all', 'today', 'week', 'month'
};

const parentSlice = createSlice({
  name: 'parent',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      if (action.payload.subscription_tier) {
        state.subscription.tier = action.payload.subscription_tier;
      }
      if (action.payload.communication_preferences) {
        state.communicationSettings = {
          ...state.communicationSettings,
          ...action.payload.communication_preferences,
        };
      }
    },

    addChildToList: (state, action) => {
      state.children.push(action.payload);
    },

    setSelectedChild: (state, action) => {
      state.selectedChildId = action.payload;
    },

    // Real-time monitoring
    childLoggedIn: (state, action) => {
      const { childId, timestamp } = action.payload;
      state.activeChildren.add(childId);
      state.notifications.unshift({
        id: Date.now(),
        type: 'child_login',
        childId,
        message: `Child logged in`,
        timestamp,
        read: false,
      });
      state.unreadCount += 1;
    },

    childLoggedOut: (state, action) => {
      const { childId } = action.payload;
      state.activeChildren.delete(childId);
      delete state.liveActivities[childId];
    },

    childActivityStarted: (state, action) => {
      const { childId, activityType, timestamp } = action.payload;
      state.liveActivities[childId] = {
        type: activityType,
        startTime: timestamp,
      };
      
      if (state.monitoringSettings.realTimeAlerts) {
        state.notifications.unshift({
          id: Date.now(),
          type: 'activity_started',
          childId,
          message: `Started ${activityType} activity`,
          timestamp,
          read: false,
        });
        state.unreadCount += 1;
      }
    },

    childActivityCompleted: (state, action) => {
      const { childId, activityType, results, timestamp } = action.payload;
      delete state.liveActivities[childId];
      
      // Update progress tracking
      if (!state.liveProgress[childId]) {
        state.liveProgress[childId] = [];
      }
      state.liveProgress[childId].unshift({
        activity: activityType,
        results,
        timestamp,
      });
      
      // Limit progress history
      if (state.liveProgress[childId].length > 20) {
        state.liveProgress[childId] = state.liveProgress[childId].slice(0, 20);
      }
      
      state.notifications.unshift({
        id: Date.now(),
        type: 'activity_completed',
        childId,
        message: `Completed ${activityType} with ${results.accuracy}% accuracy`,
        timestamp,
        read: false,
      });
      state.unreadCount += 1;
    },

    childStruggling: (state, action) => {
      const { childId, skill, details, timestamp } = action.payload;
      
      if (state.monitoringSettings.strugglingAlerts) {
        state.notifications.unshift({
          id: Date.now(),
          type: 'struggling_alert',
          childId,
          message: `May need help with ${skill}`,
          details,
          timestamp,
          read: false,
          priority: 'high',
        });
        state.unreadCount += 1;
      }
    },

    achievementUnlocked: (state, action) => {
      const { childId, achievement, timestamp } = action.payload;
      
      if (state.monitoringSettings.achievementNotifications) {
        state.notifications.unshift({
          id: Date.now(),
          type: 'achievement',
          childId,
          message: `Unlocked achievement: ${achievement.title}`,
          achievement,
          timestamp,
          read: false,
          priority: 'celebration',
        });
        state.unreadCount += 1;
      }
    },

    // Notification management
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadCount = 0;
    },

    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    // Settings management
    updateCommunicationSettings: (state, action) => {
      state.communicationSettings = {
        ...state.communicationSettings,
        ...action.payload,
      };
    },

    updateMonitoringSettings: (state, action) => {
      state.monitoringSettings = {
        ...state.monitoringSettings,
        ...action.payload,
      };
    },

    // UI state
    setSelectedView: (state, action) => {
      state.selectedView = action.payload;
    },

    setFilterBy: (state, action) => {
      state.filterBy = action.payload;
    },

    // Progress updates
    updateSummaryStats: (state, action) => {
      state.summaryStats = {
        ...state.summaryStats,
        ...action.payload,
      };
    },

    addWeeklyReport: (state, action) => {
      const { week, report } = action.payload;
      state.weeklyReports[week] = report;
    },

    addMonthlyReport: (state, action) => {
      const { month, report } = action.payload;
      state.monthlyReports[month] = report;
    },

    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setChildError: (state, action) => {
      state.childError = action.payload;
    },

    clearChildError: (state) => {
      state.childError = null;
    },

    // Reset state
    reset: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Load dashboard
      .addCase(loadParentDashboard.pending, (state) => {
        state.isLoadingDashboard = true;
        state.error = null;
      })
      .addCase(loadParentDashboard.fulfilled, (state, action) => {
        state.isLoadingDashboard = false;
        state.dashboard = action.payload;
        
        if (action.payload.summary) {
          state.summaryStats = {
            totalSessions: action.payload.summary.total_learning_sessions,
            completionRate: action.payload.summary.completion_rate,
            averageEngagement: action.payload.summary.average_engagement_score,
          };
        }
      })
      .addCase(loadParentDashboard.rejected, (state, action) => {
        state.isLoadingDashboard = false;
        state.error = action.payload;
      })

      // Add child
      .addCase(addChild.pending, (state) => {
        state.isAddingChild = true;
        state.childError = null;
      })
      .addCase(addChild.fulfilled, (state, action) => {
        state.isAddingChild = false;
        if (action.payload.child) {
          parentSlice.caseReducers.addChildToList(state, { payload: action.payload.child });
        }
      })
      .addCase(addChild.rejected, (state, action) => {
        state.isAddingChild = false;
        state.childError = action.payload;
      })

      // Load child sessions
      .addCase(loadChildSessions.pending, (state) => {
        state.isLoadingSessions = true;
      })
      .addCase(loadChildSessions.fulfilled, (state, action) => {
        state.isLoadingSessions = false;
        const { childId, sessions } = action.payload;
        state.childSessions[childId] = sessions.sessions || [];
      })
      .addCase(loadChildSessions.rejected, (state, action) => {
        state.isLoadingSessions = false;
        state.error = action.payload;
      });
  },
});

export const {
  setProfile,
  addChildToList,
  setSelectedChild,
  childLoggedIn,
  childLoggedOut,
  childActivityStarted,
  childActivityCompleted,
  childStruggling,
  achievementUnlocked,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  updateCommunicationSettings,
  updateMonitoringSettings,
  setSelectedView,
  setFilterBy,
  updateSummaryStats,
  addWeeklyReport,
  addMonthlyReport,
  setError,
  clearError,
  setChildError,
  clearChildError,
  reset,
} = parentSlice.actions;

export default parentSlice.reducer;