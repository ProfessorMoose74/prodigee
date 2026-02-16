import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { socketService } from '../../services/socketService';

// Async thunks for authentication
export const parentLogin = createAsyncThunk(
  'auth/parentLogin',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.parentLogin(email, password);
      
      if (response.success) {
        // Initialize socket connection for parent
        socketService.connect(response.parent.id);
        
        // Update app state
        dispatch({
          type: 'app/switchUser',
          payload: {
            userType: 'parent',
            userData: response.parent,
          },
        });

        return {
          token: response.token,
          user: response.parent,
          userType: 'parent',
          expiresIn: response.expires_in_hours,
        };
      } else {
        return rejectWithValue('Login failed');
      }
    } catch (error) {
      console.error('Parent login error:', error);
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const childLogin = createAsyncThunk(
  'auth/childLogin',
  async ({ childId, parentToken }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.childLogin(childId, parentToken);
      
      if (response.success) {
        // Initialize socket connection for child
        socketService.connect(null, response.child.id);
        
        // Update app state
        dispatch({
          type: 'app/switchUser',
          payload: {
            userType: 'child',
            userData: response.child,
          },
        });

        return {
          token: response.token,
          user: response.child,
          userType: 'child',
          sessionDuration: response.session_duration_hours,
        };
      } else {
        return rejectWithValue('Child login failed');
      }
    } catch (error) {
      console.error('Child login error:', error);
      return rejectWithValue(error.response?.data?.message || 'Child login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      // Call logout API
      await api.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    
    // Disconnect socket
    socketService.disconnect();
    
    // Reset all app state
    dispatch({ type: 'app/resetAppState' });
    dispatch({ type: 'child/reset' });
    dispatch({ type: 'parent/reset' });
    dispatch({ type: 'activity/reset' });
    dispatch({ type: 'avatar/reset' });
    dispatch({ type: 'voice/reset' });
    
    return true;
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      // For now, we'll just check if the current token is still valid
      const currentToken = localStorage.getItem('auth_token');
      if (!currentToken) {
        return rejectWithValue('No token found');
      }

      // Verify token with health check
      await api.healthCheck();
      
      return {
        token: currentToken,
        isValid: true,
      };
    } catch (error) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

export const demoLogin = createAsyncThunk(
  'auth/demoLogin',
  async (_, { dispatch }) => {
    try {
      const demoEmail = process.env.REACT_APP_DEMO_EMAIL || 'demo@elementalgenius.com';
      const demoPassword = process.env.REACT_APP_DEMO_PASSWORD || 'demo123';
      
      return await dispatch(parentLogin({ 
        email: demoEmail, 
        password: demoPassword 
      })).unwrap();
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    }
  }
);

const initialState = {
  // Authentication status
  isAuthenticated: false,
  isLoading: false,
  
  // Token management
  token: null,
  tokenExpiry: null,
  refreshToken: null,
  
  // User info
  user: null,
  userType: null, // 'parent' | 'child'
  
  // Session management
  sessionDuration: null,
  sessionStartTime: null,
  sessionWarningShown: false,
  
  // Login attempts and security
  loginAttempts: 0,
  lastLoginAttempt: null,
  isLocked: false,
  lockoutUntil: null,
  
  // COPPA compliance for child accounts
  parentalApproval: null,
  childSessionLimited: false,
  
  // Errors
  error: null,
  lastError: null,
  
  // Demo mode
  isDemoMode: process.env.REACT_APP_DEMO_MODE === 'true',
  
  // Offline auth support
  offlineMode: false,
  lastOnlineAuth: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Token management
    setToken: (state, action) => {
      state.token = action.payload.token;
      state.tokenExpiry = action.payload.expiry;
      
      if (action.payload.token) {
        localStorage.setItem('auth_token', action.payload.token);
      } else {
        localStorage.removeItem('auth_token');
      }
    },

    // Session management
    startSession: (state, action) => {
      state.sessionStartTime = Date.now();
      state.sessionDuration = action.payload.duration;
      state.sessionWarningShown = false;
    },

    showSessionWarning: (state) => {
      state.sessionWarningShown = true;
    },

    extendSession: (state, action) => {
      state.sessionDuration = action.payload.newDuration;
      state.sessionWarningShown = false;
    },

    // Security and lockout
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = Date.now();
      
      // Lock account after 5 failed attempts
      if (state.loginAttempts >= 5) {
        state.isLocked = true;
        state.lockoutUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
      }
    },

    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
      state.isLocked = false;
      state.lockoutUntil = null;
    },

    checkLockout: (state) => {
      if (state.isLocked && state.lockoutUntil && Date.now() > state.lockoutUntil) {
        state.isLocked = false;
        state.lockoutUntil = null;
        state.loginAttempts = 0;
      }
    },

    // COPPA compliance
    setParentalApproval: (state, action) => {
      state.parentalApproval = action.payload;
    },

    setChildSessionLimit: (state, action) => {
      state.childSessionLimited = action.payload;
    },

    // Error handling
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.lastError = {
        message: action.payload,
        timestamp: Date.now(),
      };
    },

    clearAuthError: (state) => {
      state.error = null;
    },

    // Demo mode
    setDemoMode: (state, action) => {
      state.isDemoMode = action.payload;
    },

    // Offline mode
    setOfflineMode: (state, action) => {
      state.offlineMode = action.payload;
      if (!action.payload) {
        state.lastOnlineAuth = Date.now();
      }
    },

    // User switching (for parent/child toggle)
    switchToChild: (state, action) => {
      if (state.userType === 'parent') {
        state.user = action.payload.child;
        state.userType = 'child';
        state.parentalApproval = action.payload.parentId;
      }
    },

    switchToParent: (state) => {
      if (state.userType === 'child' && state.parentalApproval) {
        // This would require re-authentication in practice
        state.userType = 'parent';
        state.parentalApproval = null;
      }
    },

    // Reset auth state
    resetAuth: (state) => {
      return {
        ...initialState,
        isDemoMode: state.isDemoMode,
      };
    },
  },

  extraReducers: (builder) => {
    builder
      // Parent login
      .addCase(parentLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(parentLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.userType = action.payload.userType;
        state.tokenExpiry = Date.now() + (action.payload.expiresIn * 60 * 60 * 1000);
        state.sessionStartTime = Date.now();
        state.error = null;
        
        // Reset security state on successful login
        authSlice.caseReducers.resetLoginAttempts(state);
      })
      .addCase(parentLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        authSlice.caseReducers.incrementLoginAttempts(state);
      })

      // Child login
      .addCase(childLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(childLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.userType = action.payload.userType;
        state.sessionDuration = action.payload.sessionDuration * 60 * 60 * 1000; // Convert to ms
        state.sessionStartTime = Date.now();
        state.childSessionLimited = true;
        state.error = null;
      })
      .addCase(childLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        return {
          ...initialState,
          isDemoMode: state.isDemoMode,
        };
      })

      // Token refresh
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.lastOnlineAuth = Date.now();
      })
      .addCase(refreshToken.rejected, (state) => {
        // Token is invalid, logout
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.userType = null;
      })

      // Demo login
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.userType = action.payload.userType;
        state.isDemoMode = true;
        state.error = null;
      });
  },
});

export const {
  setToken,
  startSession,
  showSessionWarning,
  extendSession,
  incrementLoginAttempts,
  resetLoginAttempts,
  checkLockout,
  setParentalApproval,
  setChildSessionLimit,
  setAuthError,
  clearAuthError,
  setDemoMode,
  setOfflineMode,
  switchToChild,
  switchToParent,
  resetAuth,
} = authSlice.actions;

export default authSlice.reducer;