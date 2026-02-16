import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks for app initialization
export const initializeApp = createAsyncThunk(
  'app/initialize',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Check if we have stored auth data
      const userType = localStorage.getItem('user_type');
      const userData = localStorage.getItem('user_data');
      const authToken = localStorage.getItem('auth_token');

      if (authToken && userType && userData) {
        // Verify the token is still valid
        try {
          await api.healthCheck();
          return {
            isAuthenticated: true,
            userType,
            currentUser: JSON.parse(userData),
          };
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.clear();
          return {
            isAuthenticated: false,
            userType: null,
            currentUser: null,
          };
        }
      }

      return {
        isAuthenticated: false,
        userType: null,
        currentUser: null,
      };
    } catch (error) {
      console.error('App initialization error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'app/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { isAuthenticated: false };
      }

      // Verify token with backend
      await api.healthCheck();
      return { isAuthenticated: true };
    } catch (error) {
      // Clear invalid token
      localStorage.clear();
      return { isAuthenticated: false };
    }
  }
);

export const switchUser = createAsyncThunk(
  'app/switchUser',
  async ({ userType, userData }, { dispatch }) => {
    try {
      // Update local storage
      localStorage.setItem('user_type', userType);
      localStorage.setItem('user_data', JSON.stringify(userData));

      // Initialize appropriate services based on user type
      if (userType === 'parent') {
        // Parent-specific initialization
        dispatch({ type: 'parent/initialize', payload: userData });
      } else if (userType === 'child') {
        // Child-specific initialization
        dispatch({ type: 'child/initialize', payload: userData });
      }

      return {
        userType,
        currentUser: userData,
      };
    } catch (error) {
      console.error('Switch user error:', error);
      throw error;
    }
  }
);

const initialState = {
  // App initialization
  isLoading: true,
  isInitialized: false,
  initializationError: null,

  // Authentication state
  isAuthenticated: false,
  userType: null, // 'parent' | 'child'
  currentUser: null,

  // Connection state
  isOnline: navigator.onLine,
  backendConnected: false,
  lastConnectionCheck: null,

  // App settings
  debugMode: process.env.NODE_ENV === 'development',
  demoMode: process.env.REACT_APP_DEMO_MODE === 'true',
  
  // UI state
  sidebarCollapsed: false,
  activeScreen: null,
  modalStack: [],
  notifications: [],

  // Performance metrics
  performanceMetrics: {
    appStartTime: Date.now(),
    initialLoadTime: null,
    lastActivityTime: Date.now(),
  },

  // Feature flags
  features: {
    voiceProcessing: true,
    realTimeMonitoring: true,
    avatarCustomization: true,
    offlineMode: false,
    experimentalFeatures: false,
  },

  // Error handling
  lastError: null,
  errorHistory: [],
  
  // Platform info
  platform: null,
  version: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Connection management
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    setBackendConnection: (state, action) => {
      state.backendConnected = action.payload;
      state.lastConnectionCheck = Date.now();
    },

    // UI state management
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },

    setActiveScreen: (state, action) => {
      state.activeScreen = action.payload;
    },

    // Modal management
    openModal: (state, action) => {
      state.modalStack.push(action.payload);
    },

    closeModal: (state) => {
      state.modalStack.pop();
    },

    closeAllModals: (state) => {
      state.modalStack = [];
    },

    // Notification management
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.notifications.unshift(notification);
      
      // Limit to 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },

    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },

    // Error handling
    setError: (state, action) => {
      state.lastError = {
        message: action.payload.message,
        timestamp: Date.now(),
        source: action.payload.source,
      };
      
      // Add to error history
      state.errorHistory.unshift(state.lastError);
      
      // Limit error history
      if (state.errorHistory.length > 20) {
        state.errorHistory = state.errorHistory.slice(0, 20);
      }
    },

    clearError: (state) => {
      state.lastError = null;
    },

    // Performance tracking
    updatePerformanceMetric: (state, action) => {
      const { metric, value } = action.payload;
      state.performanceMetrics[metric] = value;
    },

    recordActivity: (state) => {
      state.performanceMetrics.lastActivityTime = Date.now();
    },

    // Feature flags
    toggleFeature: (state, action) => {
      const { feature, enabled } = action.payload;
      if (feature in state.features) {
        state.features[feature] = enabled;
      }
    },

    // Platform info
    setPlatformInfo: (state, action) => {
      state.platform = action.payload.platform;
      state.version = action.payload.version;
    },

    // Demo mode helpers
    setDemoMode: (state, action) => {
      state.demoMode = action.payload;
    },

    // Debug mode
    setDebugMode: (state, action) => {
      state.debugMode = action.payload;
    },

    // Reset app state (for logout)
    resetAppState: (state) => {
      return {
        ...initialState,
        isLoading: false,
        isInitialized: true,
        isOnline: state.isOnline,
        platform: state.platform,
        version: state.version,
      };
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Initialize app
      .addCase(initializeApp.pending, (state) => {
        state.isLoading = true;
        state.initializationError = null;
      })
      .addCase(initializeApp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.userType = action.payload.userType;
        state.currentUser = action.payload.currentUser;
        state.performanceMetrics.initialLoadTime = Date.now() - state.performanceMetrics.appStartTime;
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.initializationError = action.payload;
        state.isAuthenticated = false;
        state.userType = null;
        state.currentUser = null;
      })

      // Check auth status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload.isAuthenticated;
        if (!action.payload.isAuthenticated) {
          state.userType = null;
          state.currentUser = null;
        }
      })

      // Switch user
      .addCase(switchUser.fulfilled, (state, action) => {
        state.userType = action.payload.userType;
        state.currentUser = action.payload.currentUser;
      });
  },
});

export const {
  setOnlineStatus,
  setBackendConnection,
  setSidebarCollapsed,
  setActiveScreen,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  markNotificationRead,
  setError,
  clearError,
  updatePerformanceMetric,
  recordActivity,
  toggleFeature,
  setPlatformInfo,
  setDemoMode,
  setDebugMode,
  resetAppState,
} = appSlice.actions;

export default appSlice.reducer;