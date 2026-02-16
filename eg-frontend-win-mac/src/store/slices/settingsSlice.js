import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks for settings management
export const loadUserSettings = createAsyncThunk(
  'settings/load',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const userType = auth.userType;
      
      if (userType === 'child') {
        // Load child-specific settings
        const response = await api.getChildSettings();
        return { userType, settings: response };
      } else if (userType === 'parent') {
        // Load parent settings (may include dashboard preferences)
        const response = await api.getParentSettings();
        return { userType, settings: response };
      }
      
      return { userType, settings: {} };
    } catch (error) {
      console.error('Load settings error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to load settings');
    }
  }
);

export const saveUserSettings = createAsyncThunk(
  'settings/save',
  async (settingsData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const userType = auth.userType;
      
      let response;
      if (userType === 'child') {
        response = await api.updateSettings(settingsData);
      } else if (userType === 'parent') {
        response = await api.updateParentSettings(settingsData);
      }
      
      return { userType, settings: settingsData, response };
    } catch (error) {
      console.error('Save settings error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to save settings');
    }
  }
);

const initialState = {
  // Loading states
  isLoading: false,
  isSaving: false,
  
  // General app settings
  app: {
    theme: 'auto', // 'light', 'dark', 'auto'
    language: 'en-US',
    region: 'US',
    autoSave: true,
    notifications: true,
    sounds: true,
    animations: true,
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium', // 'small', 'medium', 'large', 'extra-large'
  },
  
  // Child-specific settings
  child: {
    // Learning preferences
    learningStyle: 'balanced', // 'visual', 'auditory', 'kinesthetic', 'balanced'
    difficultyPreference: 'auto', // 'easy', 'moderate', 'challenging', 'auto'
    pacePreference: 'moderate', // 'slow', 'moderate', 'fast'
    attentionSpan: 15, // minutes
    
    // Character preferences
    favoriteCharacter: 'professor', // 'professor', 'ella', 'gus'
    characterVoice: 'auto', // 'auto', 'professor', 'ella', 'gus'
    
    // Activity settings
    showHints: true,
    allowSkipping: false,
    celebrationLevel: 'normal', // 'minimal', 'normal', 'enthusiastic'
    progressVisible: true,
    timerVisible: false,
    
    // Voice settings
    voiceEnabled: true,
    micSensitivity: 0.5,
    noiseReduction: true,
    voiceFeedback: true,
    pronunciationHelp: true,
    
    // Avatar settings
    avatarAnimations: true,
    avatarExpressions: true,
    backgroundMusic: false,
    backgroundMusicVolume: 0.3,
    
    // Safety and parental controls
    sessionTimeLimit: 60, // minutes
    breakReminders: true,
    breakInterval: 20, // minutes
    offlineMode: false,
    
    // Accessibility
    subtitles: false,
    visualCues: true,
    audioDescriptions: false,
    buttonSize: 'normal', // 'small', 'normal', 'large'
    clickToSelect: false,
  },
  
  // Parent-specific settings
  parent: {
    // Dashboard preferences
    dashboardView: 'overview', // 'overview', 'detailed', 'analytics'
    defaultChildView: 'progress', // 'progress', 'activities', 'sessions'
    showLiveUpdates: true,
    refreshInterval: 30, // seconds
    
    // Monitoring settings
    realTimeAlerts: true,
    activityNotifications: true,
    progressNotifications: true,
    strugglingAlerts: true,
    achievementNotifications: true,
    sessionTimeouts: true,
    
    // Communication preferences
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    dailySummary: true,
    weeklyReport: true,
    monthlyReport: true,
    
    // Notification timing
    quietHours: {
      enabled: true,
      start: '20:00',
      end: '08:00',
    },
    
    // Privacy settings
    dataSharing: false,
    analytics: true,
    childDataCollection: 'minimal', // 'minimal', 'standard', 'comprehensive'
    
    // Family settings
    multipleChildren: true,
    sharedProgress: false,
    familyGoals: true,
    
    // Advanced settings
    exportData: true,
    backupSettings: true,
    debugMode: false,
  },
  
  // Voice and audio settings
  audio: {
    masterVolume: 1.0,
    effectsVolume: 0.8,
    voiceVolume: 1.0,
    musicVolume: 0.5,
    
    // Voice processing
    voiceProcessing: 'cloud', // 'cloud', 'local', 'hybrid'
    voiceLanguage: 'en-US',
    voiceAccent: 'US',
    speechRate: 1.0,
    speechPitch: 1.0,
    
    // Audio quality
    audioQuality: 'high', // 'low', 'medium', 'high'
    compressionEnabled: false,
    echoCancellation: true,
    noiseSupression: true,
  },
  
  // Privacy and security settings
  privacy: {
    // Data collection
    analytics: true,
    crashReporting: true,
    usageStatistics: true,
    voiceDataCollection: false,
    
    // COPPA compliance
    parentalConsent: null,
    dataRetentionPeriod: 90, // days
    automaticDeletion: true,
    
    // Sharing and social
    shareProgress: false,
    publicProfile: false,
    friendsEnabled: false,
    
    // Security
    sessionTimeout: 30, // minutes
    automaticLogout: true,
    biometricAuth: false,
    twoFactorAuth: false,
  },
  
  // Performance settings
  performance: {
    // Graphics and rendering
    animationQuality: 'high', // 'low', 'medium', 'high'
    particleEffects: true,
    shadowEffects: true,
    antiAliasing: true,
    
    // Network
    offlineCaching: true,
    preloadContent: true,
    compressionEnabled: true,
    bandwidthOptimization: 'auto', // 'none', 'auto', 'aggressive'
    
    // Memory management
    autoCleanup: true,
    cacheLimit: 500, // MB
    backgroundProcessing: true,
  },
  
  // Experimental features
  experimental: {
    betaFeatures: false,
    aiTutoring: false,
    advancedAnalytics: false,
    voiceCloning: false,
    customCurriculum: false,
  },
  
  // Platform-specific settings
  platform: {
    // Electron-specific
    autoUpdates: true,
    startWithSystem: false,
    minimizeToTray: true,
    closeToTray: false,
    
    // Window preferences
    fullscreen: false,
    windowSize: 'default', // 'small', 'default', 'large', 'maximized'
    windowPosition: 'center',
    multiMonitor: 'primary',
    
    // System integration
    systemNotifications: true,
    taskbarProgress: true,
    jumpListEnabled: true,
    
    // Hardware acceleration
    hardwareAcceleration: true,
    gpuAcceleration: true,
    
    // Platform features
    touchSupport: 'auto',
    gestureSupport: true,
    voiceCommands: false,
  },
  
  // Backup and sync
  sync: {
    enabled: false,
    provider: null, // 'cloud', 'local'
    syncInterval: 'daily', // 'realtime', 'hourly', 'daily', 'weekly'
    syncData: {
      settings: true,
      progress: true,
      avatars: true,
      preferences: true,
    },
    lastSync: null,
    autoBackup: true,
  },
  
  // Error states
  error: null,
  saveError: null,
  
  // Validation
  hasUnsavedChanges: false,
  validationErrors: {},
  
  // Reset confirmation
  showResetConfirmation: false,
  resetType: null, // 'all', 'child', 'parent', 'privacy', 'performance'
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // General app settings
    setTheme: (state, action) => {
      state.app.theme = action.payload;
      state.hasUnsavedChanges = true;
    },

    setLanguage: (state, action) => {
      state.app.language = action.payload;
      state.hasUnsavedChanges = true;
    },

    toggleSetting: (state, action) => {
      const { category, setting } = action.payload;
      if (state[category] && setting in state[category]) {
        state[category][setting] = !state[category][setting];
        state.hasUnsavedChanges = true;
      }
    },

    updateSetting: (state, action) => {
      const { category, setting, value } = action.payload;
      if (state[category] && setting in state[category]) {
        state[category][setting] = value;
        state.hasUnsavedChanges = true;
      }
    },

    updateNestedSetting: (state, action) => {
      const { category, subcategory, setting, value } = action.payload;
      if (state[category] && state[category][subcategory] && setting in state[category][subcategory]) {
        state[category][subcategory][setting] = value;
        state.hasUnsavedChanges = true;
      }
    },

    // Bulk updates
    updateCategorySettings: (state, action) => {
      const { category, settings } = action.payload;
      if (state[category]) {
        state[category] = {
          ...state[category],
          ...settings,
        };
        state.hasUnsavedChanges = true;
      }
    },

    updateAllSettings: (state, action) => {
      const newSettings = action.payload;
      Object.keys(newSettings).forEach(category => {
        if (state[category]) {
          state[category] = {
            ...state[category],
            ...newSettings[category],
          };
        }
      });
      state.hasUnsavedChanges = true;
    },

    // Child-specific actions
    setLearningPreferences: (state, action) => {
      const { learningStyle, difficultyPreference, pacePreference } = action.payload;
      state.child.learningStyle = learningStyle || state.child.learningStyle;
      state.child.difficultyPreference = difficultyPreference || state.child.difficultyPreference;
      state.child.pacePreference = pacePreference || state.child.pacePreference;
      state.hasUnsavedChanges = true;
    },

    setFavoriteCharacter: (state, action) => {
      state.child.favoriteCharacter = action.payload;
      state.child.characterVoice = action.payload; // Auto-sync voice
      state.hasUnsavedChanges = true;
    },

    updateSessionSettings: (state, action) => {
      const { timeLimit, breakInterval, breakReminders } = action.payload;
      state.child.sessionTimeLimit = timeLimit || state.child.sessionTimeLimit;
      state.child.breakInterval = breakInterval || state.child.breakInterval;
      state.child.breakReminders = breakReminders !== undefined ? breakReminders : state.child.breakReminders;
      state.hasUnsavedChanges = true;
    },

    // Parent-specific actions
    setDashboardPreferences: (state, action) => {
      const { view, defaultChildView, refreshInterval } = action.payload;
      state.parent.dashboardView = view || state.parent.dashboardView;
      state.parent.defaultChildView = defaultChildView || state.parent.defaultChildView;
      state.parent.refreshInterval = refreshInterval || state.parent.refreshInterval;
      state.hasUnsavedChanges = true;
    },

    updateNotificationSettings: (state, action) => {
      state.parent = {
        ...state.parent,
        ...action.payload,
      };
      state.hasUnsavedChanges = true;
    },

    setQuietHours: (state, action) => {
      state.parent.quietHours = {
        ...state.parent.quietHours,
        ...action.payload,
      };
      state.hasUnsavedChanges = true;
    },

    // Audio settings
    setVolume: (state, action) => {
      const { type, level } = action.payload;
      const volumeKey = `${type}Volume`;
      if (volumeKey in state.audio) {
        state.audio[volumeKey] = Math.max(0, Math.min(1, level));
        state.hasUnsavedChanges = true;
      }
    },

    setVoiceSettings: (state, action) => {
      state.audio = {
        ...state.audio,
        ...action.payload,
      };
      state.hasUnsavedChanges = true;
    },

    // Privacy settings
    updatePrivacySettings: (state, action) => {
      state.privacy = {
        ...state.privacy,
        ...action.payload,
      };
      state.hasUnsavedChanges = true;
    },

    setParentalConsent: (state, action) => {
      state.privacy.parentalConsent = action.payload;
      state.hasUnsavedChanges = true;
    },

    // Performance settings
    setGraphicsQuality: (state, action) => {
      const quality = action.payload; // 'low', 'medium', 'high'
      
      const qualitySettings = {
        low: {
          animationQuality: 'low',
          particleEffects: false,
          shadowEffects: false,
          antiAliasing: false,
        },
        medium: {
          animationQuality: 'medium',
          particleEffects: true,
          shadowEffects: false,
          antiAliasing: true,
        },
        high: {
          animationQuality: 'high',
          particleEffects: true,
          shadowEffects: true,
          antiAliasing: true,
        },
      };
      
      state.performance = {
        ...state.performance,
        ...qualitySettings[quality],
      };
      state.hasUnsavedChanges = true;
    },

    // Platform settings
    updatePlatformSettings: (state, action) => {
      state.platform = {
        ...state.platform,
        ...action.payload,
      };
      state.hasUnsavedChanges = true;
    },

    // Sync settings
    updateSyncSettings: (state, action) => {
      state.sync = {
        ...state.sync,
        ...action.payload,
      };
      state.hasUnsavedChanges = true;
    },

    setSyncStatus: (state, action) => {
      const { lastSync, enabled } = action.payload;
      state.sync.lastSync = lastSync || state.sync.lastSync;
      state.sync.enabled = enabled !== undefined ? enabled : state.sync.enabled;
    },

    // Validation
    setValidationError: (state, action) => {
      const { field, error } = action.payload;
      state.validationErrors[field] = error;
    },

    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },

    // Reset functionality
    showResetDialog: (state, action) => {
      state.showResetConfirmation = true;
      state.resetType = action.payload || 'all';
    },

    hideResetDialog: (state) => {
      state.showResetConfirmation = false;
      state.resetType = null;
    },

    resetToDefaults: (state, action) => {
      const resetType = action.payload || state.resetType;
      
      if (resetType === 'all') {
        return {
          ...initialState,
          isLoading: state.isLoading,
          isSaving: state.isSaving,
        };
      } else if (resetType in initialState) {
        state[resetType] = { ...initialState[resetType] };
        state.hasUnsavedChanges = true;
      }
      
      state.showResetConfirmation = false;
      state.resetType = null;
    },

    // Save state management
    markSaved: (state) => {
      state.hasUnsavedChanges = false;
    },

    // Auto-apply settings based on detected capabilities
    applyAutoSettings: (state, action) => {
      const { platform, capabilities } = action.payload;
      
      // Auto-configure based on platform
      if (platform === 'low-end') {
        settingsSlice.caseReducers.setGraphicsQuality(state, { payload: 'low' });
      } else if (platform === 'high-end') {
        settingsSlice.caseReducers.setGraphicsQuality(state, { payload: 'high' });
      }
      
      // Configure accessibility based on system settings
      if (capabilities.reducedMotion) {
        state.app.reducedMotion = true;
        state.app.animations = false;
      }
      
      if (capabilities.highContrast) {
        state.app.highContrast = true;
      }
      
      state.hasUnsavedChanges = true;
    },

    // Import/Export
    exportSettings: (state) => {
      // This would trigger an export action in middleware
      return state;
    },

    importSettings: (state, action) => {
      const importedSettings = action.payload;
      
      // Validate and merge imported settings
      Object.keys(importedSettings).forEach(category => {
        if (state[category] && typeof state[category] === 'object') {
          state[category] = {
            ...state[category],
            ...importedSettings[category],
          };
        }
      });
      
      state.hasUnsavedChanges = true;
    },

    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
      state.saveError = null;
    },

    // Reset slice
    reset: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Load settings
      .addCase(loadUserSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        const { userType, settings } = action.payload;
        
        // Merge loaded settings with defaults
        if (userType === 'child' && settings.child) {
          state.child = { ...state.child, ...settings.child };
        } else if (userType === 'parent' && settings.parent) {
          state.parent = { ...state.parent, ...settings.parent };
        }
        
        // Apply general settings if present
        if (settings.app) {
          state.app = { ...state.app, ...settings.app };
        }
        
        state.hasUnsavedChanges = false;
      })
      .addCase(loadUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Save settings
      .addCase(saveUserSettings.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(saveUserSettings.fulfilled, (state) => {
        state.isSaving = false;
        state.hasUnsavedChanges = false;
      })
      .addCase(saveUserSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload;
      });
  },
});

export const {
  setTheme,
  setLanguage,
  toggleSetting,
  updateSetting,
  updateNestedSetting,
  updateCategorySettings,
  updateAllSettings,
  setLearningPreferences,
  setFavoriteCharacter,
  updateSessionSettings,
  setDashboardPreferences,
  updateNotificationSettings,
  setQuietHours,
  setVolume,
  setVoiceSettings,
  updatePrivacySettings,
  setParentalConsent,
  setGraphicsQuality,
  updatePlatformSettings,
  updateSyncSettings,
  setSyncStatus,
  setValidationError,
  clearValidationErrors,
  showResetDialog,
  hideResetDialog,
  resetToDefaults,
  markSaved,
  applyAutoSettings,
  exportSettings,
  importSettings,
  setError,
  clearError,
  reset,
} = settingsSlice.actions;

export default settingsSlice.reducer;