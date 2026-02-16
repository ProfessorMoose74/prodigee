import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks for activity management
export const loadActivity = createAsyncThunk(
  'activity/load',
  async ({ activityType, childAge, weekNumber }, { rejectWithValue }) => {
    try {
      const response = await api.getActivityDetails(activityType);
      return {
        activityType,
        content: response,
        adaptedForAge: childAge,
        weekNumber,
      };
    } catch (error) {
      console.error('Load activity error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load activity');
    }
  }
);

export const completeActivity = createAsyncThunk(
  'activity/complete',
  async ({ activityType, results }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.completeActivity(activityType, results);
      
      // Update child progress
      dispatch({
        type: 'child/updateSkillProgress',
        payload: {
          skill: activityType,
          progress: results.accuracy,
        },
      });
      
      // Add stars to child
      dispatch({
        type: 'child/addStars',
        payload: results.stars_earned || 0,
      });
      
      return {
        activityType,
        results,
        response,
      };
    } catch (error) {
      console.error('Complete activity error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to complete activity');
    }
  }
);

export const startLearningSession = createAsyncThunk(
  'activity/startSession',
  async (sessionData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.startLearningSession(sessionData);
      
      // Update child session state
      dispatch({
        type: 'child/startSession',
        payload: {
          sessionId: response.session_id,
          type: sessionData.session_type,
          startTime: Date.now(),
        },
      });
      
      return response;
    } catch (error) {
      console.error('Start learning session error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to start session');
    }
  }
);

const initialState = {
  // Current activity
  currentActivity: null,
  activityContent: null,
  isLoadingActivity: false,
  
  // Activity state
  isActive: false,
  startTime: null,
  timeElapsed: 0,
  
  // Progress tracking
  currentStep: 0,
  totalSteps: 0,
  stepsCompleted: [],
  
  // Performance metrics
  attempts: 0,
  correctAttempts: 0,
  accuracy: 0,
  responseTime: [],
  
  // Voice interaction
  voiceAttempts: 0,
  voiceAccuracy: 0,
  lastVoiceResponse: null,
  
  // Engagement tracking
  engagementScore: 0,
  attentionEvents: [], // timestamps of attention checks
  helpRequests: 0,
  
  // Adaptive difficulty
  difficultyLevel: 'auto',
  adaptations: [],
  hintsProvided: 0,
  
  // Feedback and celebration
  lastFeedback: null,
  celebrationTrigger: false,
  achievements: [],
  
  // Learning session
  currentSession: null,
  sessionProgress: 0,
  
  // Activity queue
  upcomingActivities: [],
  completedActivities: [],
  
  // Errors
  error: null,
  voiceError: null,
  
  // Activity types and content
  availableActivities: {
    rhyming: {
      name: 'Rhyming Recognition',
      description: 'Identify words that rhyme',
      icon: '🎵',
      estimatedTime: 5,
    },
    blending: {
      name: 'Sound Blending',
      description: 'Blend sounds to make words',
      icon: '🔗',
      estimatedTime: 7,
    },
    segmenting: {
      name: 'Sound Segmentation',
      description: 'Break words into sounds',
      icon: '✂️',
      estimatedTime: 8,
    },
    // Add more activity types as needed
  },
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // Activity lifecycle
    setCurrentActivity: (state, action) => {
      state.currentActivity = action.payload;
      state.isActive = false;
      state.currentStep = 0;
      state.attempts = 0;
      state.correctAttempts = 0;
      state.voiceAttempts = 0;
      state.responseTime = [];
      state.startTime = null;
      state.timeElapsed = 0;
    },

    startActivity: (state) => {
      state.isActive = true;
      state.startTime = Date.now();
      state.engagementScore = 10; // Start with full engagement
    },

    pauseActivity: (state) => {
      state.isActive = false;
      if (state.startTime) {
        state.timeElapsed += Date.now() - state.startTime;
      }
    },

    resumeActivity: (state) => {
      state.isActive = true;
      state.startTime = Date.now();
    },

    endActivity: (state) => {
      state.isActive = false;
      if (state.startTime) {
        state.timeElapsed += Date.now() - state.startTime;
      }
      state.startTime = null;
      
      // Calculate final accuracy
      if (state.attempts > 0) {
        state.accuracy = (state.correctAttempts / state.attempts) * 100;
      }
      
      // Calculate voice accuracy
      if (state.voiceAttempts > 0) {
        state.voiceAccuracy = state.voiceAccuracy / state.voiceAttempts;
      }
    },

    // Progress tracking
    nextStep: (state) => {
      if (state.currentStep < state.totalSteps - 1) {
        state.currentStep += 1;
      }
    },

    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },

    completeStep: (state, action) => {
      const stepData = action.payload;
      state.stepsCompleted.push({
        step: state.currentStep,
        ...stepData,
        timestamp: Date.now(),
      });
    },

    setTotalSteps: (state, action) => {
      state.totalSteps = action.payload;
    },

    // Performance tracking
    recordAttempt: (state, action) => {
      const { correct, responseTime, voiceUsed } = action.payload;
      state.attempts += 1;
      
      if (correct) {
        state.correctAttempts += 1;
      }
      
      if (responseTime) {
        state.responseTime.push(responseTime);
      }
      
      if (voiceUsed) {
        state.voiceAttempts += 1;
      }
      
      // Update accuracy in real-time
      state.accuracy = (state.correctAttempts / state.attempts) * 100;
    },

    recordVoiceResponse: (state, action) => {
      const { accuracy, confidence, response } = action.payload;
      state.lastVoiceResponse = {
        accuracy,
        confidence,
        response,
        timestamp: Date.now(),
      };
      
      // Update voice accuracy (running average)
      if (state.voiceAttempts === 0) {
        state.voiceAccuracy = accuracy;
      } else {
        state.voiceAccuracy = (state.voiceAccuracy + accuracy) / 2;
      }
    },

    // Engagement tracking
    recordAttentionEvent: (state, action) => {
      state.attentionEvents.push({
        type: action.payload.type, // 'focus', 'blur', 'idle', 'active'
        timestamp: Date.now(),
      });
      
      // Adjust engagement score based on attention
      if (action.payload.type === 'idle') {
        state.engagementScore = Math.max(0, state.engagementScore - 1);
      } else if (action.payload.type === 'active') {
        state.engagementScore = Math.min(10, state.engagementScore + 0.5);
      }
    },

    requestHelp: (state) => {
      state.helpRequests += 1;
      state.engagementScore = Math.max(0, state.engagementScore - 0.5);
    },

    // Adaptive difficulty
    adjustDifficulty: (state, action) => {
      const { level, reason } = action.payload;
      state.difficultyLevel = level;
      state.adaptations.push({
        from: state.difficultyLevel,
        to: level,
        reason,
        timestamp: Date.now(),
      });
    },

    provideHint: (state, action) => {
      state.hintsProvided += 1;
      state.lastFeedback = {
        type: 'hint',
        content: action.payload,
        timestamp: Date.now(),
      };
    },

    // Feedback and celebration
    setFeedback: (state, action) => {
      state.lastFeedback = {
        type: action.payload.type, // 'positive', 'corrective', 'encouraging'
        content: action.payload.content,
        timestamp: Date.now(),
      };
    },

    triggerCelebration: (state, action) => {
      state.celebrationTrigger = true;
      if (action.payload) {
        state.achievements.push({
          ...action.payload,
          timestamp: Date.now(),
        });
      }
    },

    clearCelebration: (state) => {
      state.celebrationTrigger = false;
    },

    // Activity queue management
    addToQueue: (state, action) => {
      state.upcomingActivities.push(action.payload);
    },

    removeFromQueue: (state, action) => {
      const index = state.upcomingActivities.findIndex(
        a => a.id === action.payload
      );
      if (index !== -1) {
        state.upcomingActivities.splice(index, 1);
      }
    },

    markActivityCompleted: (state, action) => {
      const activity = {
        ...action.payload,
        completedAt: Date.now(),
        accuracy: state.accuracy,
        timeSpent: state.timeElapsed,
        attempts: state.attempts,
        engagementScore: state.engagementScore,
      };
      
      state.completedActivities.unshift(activity);
      
      // Limit completed activities history
      if (state.completedActivities.length > 50) {
        state.completedActivities = state.completedActivities.slice(0, 50);
      }
    },

    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setVoiceError: (state, action) => {
      state.voiceError = action.payload;
    },

    clearVoiceError: (state) => {
      state.voiceError = null;
    },

    // Reset activity state
    resetActivity: (state) => {
      return {
        ...initialState,
        availableActivities: state.availableActivities,
      };
    },

    reset: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Load activity
      .addCase(loadActivity.pending, (state) => {
        state.isLoadingActivity = true;
        state.error = null;
      })
      .addCase(loadActivity.fulfilled, (state, action) => {
        state.isLoadingActivity = false;
        const { activityType, content, weekNumber } = action.payload;
        state.activityContent = content;
        
        // Set up activity based on content
        if (content.activities) {
          state.totalSteps = Object.keys(content.activities).length;
        }
      })
      .addCase(loadActivity.rejected, (state, action) => {
        state.isLoadingActivity = false;
        state.error = action.payload;
      })

      // Complete activity
      .addCase(completeActivity.fulfilled, (state, action) => {
        const { activityType, results, response } = action.payload;
        
        // Mark activity as completed
        activitySlice.caseReducers.markActivityCompleted(state, {
          payload: {
            type: activityType,
            results,
            response,
          },
        });
        
        // Trigger celebration if warranted
        if (results.stars_earned > 0) {
          activitySlice.caseReducers.triggerCelebration(state, {
            payload: {
              type: 'activity_completion',
              stars: results.stars_earned,
              accuracy: results.accuracy,
            },
          });
        }
      })
      .addCase(completeActivity.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Start learning session
      .addCase(startLearningSession.fulfilled, (state, action) => {
        state.currentSession = {
          id: action.payload.session_id,
          type: action.payload.session_type,
          startTime: Date.now(),
          plannedActivities: action.payload.activities_planned || 0,
        };
        state.sessionProgress = 0;
      });
  },
});

export const {
  setCurrentActivity,
  startActivity,
  pauseActivity,
  resumeActivity,
  endActivity,
  nextStep,
  previousStep,
  completeStep,
  setTotalSteps,
  recordAttempt,
  recordVoiceResponse,
  recordAttentionEvent,
  requestHelp,
  adjustDifficulty,
  provideHint,
  setFeedback,
  triggerCelebration,
  clearCelebration,
  addToQueue,
  removeFromQueue,
  markActivityCompleted,
  setError,
  clearError,
  setVoiceError,
  clearVoiceError,
  resetActivity,
  reset,
} = activitySlice.actions;

export default activitySlice.reducer;