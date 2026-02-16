import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks for child management
export const loadChildDashboard = createAsyncThunk(
  'child/loadDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getChildDashboard();
      return response;
    } catch (error) {
      console.error('Load child dashboard error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

export const updateChildProgress = createAsyncThunk(
  'child/updateProgress',
  async (progressData, { rejectWithValue }) => {
    try {
      const response = await api.createPhonememicProgress(progressData);
      return response;
    } catch (error) {
      console.error('Update child progress error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update progress');
    }
  }
);

const initialState = {
  // Child profile
  profile: null,
  isLoadingProfile: false,
  
  // Dashboard data
  dashboard: null,
  isLoadingDashboard: false,
  
  // Progress tracking
  currentWeek: 1,
  totalStars: 0,
  streakDays: 0,
  skillProgress: {},
  
  // Current session
  activeSession: null,
  sessionStartTime: null,
  timeSpentToday: 0,
  
  // Recommendations
  recommendedActivities: [],
  nextActivity: null,
  
  // Errors
  error: null,
  profileError: null,
  
  // UI state
  celebrationMode: false,
  lastAchievement: null,
};

const childSlice = createSlice({
  name: 'child',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.currentWeek = action.payload.current_week || 1;
      state.totalStars = action.payload.total_stars || 0;
      state.streakDays = action.payload.streak_days || 0;
    },

    updateSkillProgress: (state, action) => {
      const { skill, progress } = action.payload;
      state.skillProgress[skill] = progress;
    },

    addStars: (state, action) => {
      state.totalStars += action.payload;
    },

    updateStreak: (state, action) => {
      state.streakDays = action.payload;
    },

    startSession: (state, action) => {
      state.activeSession = action.payload;
      state.sessionStartTime = Date.now();
    },

    endSession: (state) => {
      if (state.sessionStartTime) {
        const sessionTime = Date.now() - state.sessionStartTime;
        state.timeSpentToday += sessionTime;
      }
      state.activeSession = null;
      state.sessionStartTime = null;
    },

    setCelebrationMode: (state, action) => {
      state.celebrationMode = action.payload;
    },

    setLastAchievement: (state, action) => {
      state.lastAchievement = action.payload;
      state.celebrationMode = true;
    },

    setRecommendedActivities: (state, action) => {
      state.recommendedActivities = action.payload;
      if (action.payload.length > 0) {
        state.nextActivity = action.payload[0];
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    reset: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadChildDashboard.pending, (state) => {
        state.isLoadingDashboard = true;
        state.error = null;
      })
      .addCase(loadChildDashboard.fulfilled, (state, action) => {
        state.isLoadingDashboard = false;
        state.dashboard = action.payload;
        
        // Update profile data from dashboard
        if (action.payload.child) {
          childSlice.caseReducers.setProfile(state, { payload: action.payload.child });
        }
        
        // Update skill progress
        if (action.payload.progress) {
          state.skillProgress = action.payload.progress;
        }
        
        // Update recommendations
        if (action.payload.recommendation) {
          state.recommendedActivities = [action.payload.recommendation];
          state.nextActivity = action.payload.recommendation;
        }
      })
      .addCase(loadChildDashboard.rejected, (state, action) => {
        state.isLoadingDashboard = false;
        state.error = action.payload;
      })

      .addCase(updateChildProgress.fulfilled, (state, action) => {
        // Handle progress update response
        if (action.payload.progress_gained) {
          const skill = action.payload.skill_type;
          if (skill && state.skillProgress[skill] !== undefined) {
            state.skillProgress[skill] += action.payload.progress_gained;
          }
        }
      });
  },
});

export const {
  setProfile,
  updateSkillProgress,
  addStars,
  updateStreak,
  startSession,
  endSession,
  setCelebrationMode,
  setLastAchievement,
  setRecommendedActivities,
  clearError,
  reset,
} = childSlice.actions;

export default childSlice.reducer;