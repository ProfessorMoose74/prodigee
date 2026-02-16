import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Voice processing async thunks
export const processVoiceInput = createAsyncThunk(
  'voice/process',
  async ({ audioBlob, expectedResponse }, { rejectWithValue }) => {
    try {
      const response = await api.processVoiceInput(audioBlob, expectedResponse);
      return response;
    } catch (error) {
      console.error('Voice processing error:', error);
      return rejectWithValue(error.response?.data?.message || 'Voice processing failed');
    }
  }
);

export const speakText = createAsyncThunk(
  'voice/speak',
  async ({ text, voice = 'default' }, { rejectWithValue }) => {
    try {
      const response = await api.speakText(text, voice);
      return response;
    } catch (error) {
      console.error('Text-to-speech error:', error);
      return rejectWithValue(error.response?.data?.message || 'Text-to-speech failed');
    }
  }
);

const initialState = {
  // Recording state
  isRecording: false,
  isProcessing: false,
  recordingStartTime: null,
  recordingDuration: 0,
  
  // Media devices
  mediaRecorder: null,
  audioContext: null,
  microphone: null,
  analyser: null,
  
  // Audio data
  audioChunks: [],
  audioBlob: null,
  audioURL: null,
  
  // Voice recognition
  lastRecognitionResult: null,
  recognitionConfidence: 0,
  recognitionAccuracy: 0,
  
  // Text-to-speech
  isSpeaking: false,
  lastSpokenText: null,
  voiceSettings: {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: 'default',
  },
  
  // Audio analysis
  audioLevels: [],
  averageVolume: 0,
  backgroundNoise: 0,
  audioQuality: 'good',
  
  // Voice activity detection
  isVoiceActive: false,
  silenceThreshold: 0.01,
  voiceStartTime: null,
  voiceEndTime: null,
  
  // Expected responses (for activities)
  expectedResponse: null,
  responseMatches: [],
  partialMatches: [],
  
  // Feedback and hints
  voiceFeedback: null,
  pronunciationFeedback: null,
  suggestedPronunciation: null,
  
  // Settings
  settings: {
    micSensitivity: 0.5,
    noiseReduction: true,
    autoStop: true,
    maxRecordingTime: 10000, // 10 seconds
    language: 'en-US',
    accent: 'US',
  },
  
  // Browser support
  browserSupport: {
    mediaRecorder: false,
    webAudio: false,
    speechRecognition: false,
    speechSynthesis: false,
  },
  
  // Permissions
  microphonePermission: 'prompt', // 'granted', 'denied', 'prompt'
  permissionError: null,
  
  // Calibration
  isCalibrating: false,
  calibrationData: {
    backgroundNoise: 0,
    micSensitivity: 0.5,
    optimal: false,
  },
  
  // Performance metrics
  processingTimes: [],
  averageProcessingTime: 0,
  errorRate: 0,
  
  // Fallback mode
  fallbackMode: false,
  localRecognitionAvailable: false,
  
  // Activity integration
  currentActivity: null,
  activityPrompts: [],
  responseHistory: [],
  
  // Character voices
  availableVoices: [
    { id: 'professor', name: 'Professor Al', description: 'Wise and encouraging' },
    { id: 'ella', name: 'Ella', description: 'Friendly elementary companion' },
    { id: 'gus', name: 'Gus', description: 'Playful young buddy' },
  ],
  selectedVoice: 'professor',
  
  // Errors
  error: null,
  recordingError: null,
  processingError: null,
  playbackError: null,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    // Recording controls
    startRecording: (state) => {
      state.isRecording = true;
      state.recordingStartTime = Date.now();
      state.audioChunks = [];
      state.audioBlob = null;
      state.audioURL = null;
      state.error = null;
      state.recordingError = null;
    },

    stopRecording: (state) => {
      state.isRecording = false;
      if (state.recordingStartTime) {
        state.recordingDuration = Date.now() - state.recordingStartTime;
      }
      state.recordingStartTime = null;
    },

    pauseRecording: (state) => {
      if (state.isRecording) {
        state.isRecording = false;
        // Keep start time for resume
      }
    },

    resumeRecording: (state) => {
      if (!state.isRecording && state.recordingStartTime) {
        state.isRecording = true;
      }
    },

    // Audio data management
    addAudioChunk: (state, action) => {
      state.audioChunks.push(action.payload);
    },

    setAudioBlob: (state, action) => {
      state.audioBlob = action.payload;
      // Create URL for playback
      if (action.payload) {
        state.audioURL = URL.createObjectURL(action.payload);
      }
    },

    clearAudioData: (state) => {
      state.audioChunks = [];
      state.audioBlob = null;
      if (state.audioURL) {
        URL.revokeObjectURL(state.audioURL);
        state.audioURL = null;
      }
    },

    // Voice activity detection
    setVoiceActivity: (state, action) => {
      const { isActive, timestamp } = action.payload;
      state.isVoiceActive = isActive;
      
      if (isActive && !state.voiceStartTime) {
        state.voiceStartTime = timestamp;
        state.voiceEndTime = null;
      } else if (!isActive && state.voiceStartTime && !state.voiceEndTime) {
        state.voiceEndTime = timestamp;
      }
    },

    // Audio analysis
    updateAudioLevels: (state, action) => {
      const levels = action.payload;
      state.audioLevels = levels;
      
      // Calculate average volume
      if (levels.length > 0) {
        state.averageVolume = levels.reduce((a, b) => a + b, 0) / levels.length;
      }
      
      // Determine audio quality
      if (state.averageVolume > 0.7) {
        state.audioQuality = 'excellent';
      } else if (state.averageVolume > 0.4) {
        state.audioQuality = 'good';
      } else if (state.averageVolume > 0.2) {
        state.audioQuality = 'fair';
      } else {
        state.audioQuality = 'poor';
      }
    },

    setBackgroundNoise: (state, action) => {
      state.backgroundNoise = action.payload;
    },

    // Recognition results
    setRecognitionResult: (state, action) => {
      const { result, confidence, accuracy } = action.payload;
      state.lastRecognitionResult = result;
      state.recognitionConfidence = confidence;
      state.recognitionAccuracy = accuracy;
      
      // Add to response history
      state.responseHistory.unshift({
        result,
        confidence,
        accuracy,
        timestamp: Date.now(),
        expected: state.expectedResponse,
      });
      
      // Limit history
      if (state.responseHistory.length > 20) {
        state.responseHistory = state.responseHistory.slice(0, 20);
      }
    },

    // Expected responses for activities
    setExpectedResponse: (state, action) => {
      state.expectedResponse = action.payload;
    },

    addResponseMatch: (state, action) => {
      state.responseMatches.push(action.payload);
    },

    addPartialMatch: (state, action) => {
      state.partialMatches.push(action.payload);
    },

    clearMatches: (state) => {
      state.responseMatches = [];
      state.partialMatches = [];
    },

    // Feedback
    setVoiceFeedback: (state, action) => {
      state.voiceFeedback = {
        ...action.payload,
        timestamp: Date.now(),
      };
    },

    setPronunciationFeedback: (state, action) => {
      state.pronunciationFeedback = action.payload;
    },

    setSuggestedPronunciation: (state, action) => {
      state.suggestedPronunciation = action.payload;
    },

    clearFeedback: (state) => {
      state.voiceFeedback = null;
      state.pronunciationFeedback = null;
      state.suggestedPronunciation = null;
    },

    // Text-to-speech
    startSpeaking: (state, action) => {
      state.isSpeaking = true;
      state.lastSpokenText = action.payload;
    },

    stopSpeaking: (state) => {
      state.isSpeaking = false;
    },

    setVoiceSettings: (state, action) => {
      state.voiceSettings = {
        ...state.voiceSettings,
        ...action.payload,
      };
    },

    setSelectedVoice: (state, action) => {
      state.selectedVoice = action.payload;
    },

    // Settings
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    setSilenceThreshold: (state, action) => {
      state.silenceThreshold = action.payload;
    },

    // Browser support detection
    setBrowserSupport: (state, action) => {
      state.browserSupport = {
        ...state.browserSupport,
        ...action.payload,
      };
    },

    // Permissions
    setMicrophonePermission: (state, action) => {
      state.microphonePermission = action.payload;
      if (action.payload === 'granted') {
        state.permissionError = null;
      }
    },

    setPermissionError: (state, action) => {
      state.permissionError = action.payload;
    },

    // Calibration
    startCalibration: (state) => {
      state.isCalibrating = true;
      state.calibrationData = {
        backgroundNoise: 0,
        micSensitivity: 0.5,
        optimal: false,
      };
    },

    updateCalibration: (state, action) => {
      state.calibrationData = {
        ...state.calibrationData,
        ...action.payload,
      };
    },

    finishCalibration: (state) => {
      state.isCalibrating = false;
      
      // Apply calibration results to settings
      state.settings.micSensitivity = state.calibrationData.micSensitivity;
      state.backgroundNoise = state.calibrationData.backgroundNoise;
    },

    // Fallback mode
    setFallbackMode: (state, action) => {
      state.fallbackMode = action.payload;
    },

    setLocalRecognitionAvailable: (state, action) => {
      state.localRecognitionAvailable = action.payload;
    },

    // Activity integration
    setCurrentActivity: (state, action) => {
      state.currentActivity = action.payload;
      state.expectedResponse = null;
      state.responseMatches = [];
      state.partialMatches = [];
    },

    addActivityPrompt: (state, action) => {
      state.activityPrompts.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },

    clearActivityPrompts: (state) => {
      state.activityPrompts = [];
    },

    // Performance tracking
    addProcessingTime: (state, action) => {
      state.processingTimes.push(action.payload);
      
      // Keep only recent processing times
      if (state.processingTimes.length > 20) {
        state.processingTimes = state.processingTimes.slice(-20);
      }
      
      // Update average
      state.averageProcessingTime = 
        state.processingTimes.reduce((a, b) => a + b, 0) / state.processingTimes.length;
    },

    updateErrorRate: (state, action) => {
      state.errorRate = action.payload;
    },

    // Media device management
    setMediaRecorder: (state, action) => {
      state.mediaRecorder = action.payload;
    },

    setAudioContext: (state, action) => {
      state.audioContext = action.payload;
    },

    setMicrophone: (state, action) => {
      state.microphone = action.payload;
    },

    setAnalyser: (state, action) => {
      state.analyser = action.payload;
    },

    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setRecordingError: (state, action) => {
      state.recordingError = action.payload;
    },

    clearRecordingError: (state) => {
      state.recordingError = null;
    },

    setProcessingError: (state, action) => {
      state.processingError = action.payload;
    },

    clearProcessingError: (state) => {
      state.processingError = null;
    },

    setPlaybackError: (state, action) => {
      state.playbackError = action.payload;
    },

    clearPlaybackError: (state) => {
      state.playbackError = null;
    },

    // Reset voice state
    resetRecording: (state) => {
      state.isRecording = false;
      state.recordingStartTime = null;
      state.recordingDuration = 0;
      state.audioChunks = [];
      state.audioBlob = null;
      if (state.audioURL) {
        URL.revokeObjectURL(state.audioURL);
        state.audioURL = null;
      }
      state.isVoiceActive = false;
      state.voiceStartTime = null;
      state.voiceEndTime = null;
      state.error = null;
      state.recordingError = null;
    },

    reset: () => ({
      ...initialState,
      // Preserve certain settings that should persist
      settings: initialState.settings,
      browserSupport: initialState.browserSupport,
      microphonePermission: initialState.microphonePermission,
    }),
  },

  extraReducers: (builder) => {
    builder
      // Process voice input
      .addCase(processVoiceInput.pending, (state) => {
        state.isProcessing = true;
        state.processingError = null;
      })
      .addCase(processVoiceInput.fulfilled, (state, action) => {
        state.isProcessing = false;
        
        const result = action.payload;
        voiceSlice.caseReducers.setRecognitionResult(state, {
          payload: {
            result: result.recognized_text,
            confidence: result.confidence,
            accuracy: result.accuracy_score,
          }
        });
        
        // Add processing time
        if (result.processing_time) {
          voiceSlice.caseReducers.addProcessingTime(state, {
            payload: result.processing_time
          });
        }
        
        // Set feedback if provided
        if (result.feedback) {
          voiceSlice.caseReducers.setVoiceFeedback(state, { payload: result.feedback });
        }
      })
      .addCase(processVoiceInput.rejected, (state, action) => {
        state.isProcessing = false;
        state.processingError = action.payload;
      })

      // Text-to-speech
      .addCase(speakText.pending, (state) => {
        state.isSpeaking = true;
      })
      .addCase(speakText.fulfilled, (state, action) => {
        state.isSpeaking = false;
        // Handle any response data if needed
      })
      .addCase(speakText.rejected, (state, action) => {
        state.isSpeaking = false;
        state.playbackError = action.payload;
      });
  },
});

export const {
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  addAudioChunk,
  setAudioBlob,
  clearAudioData,
  setVoiceActivity,
  updateAudioLevels,
  setBackgroundNoise,
  setRecognitionResult,
  setExpectedResponse,
  addResponseMatch,
  addPartialMatch,
  clearMatches,
  setVoiceFeedback,
  setPronunciationFeedback,
  setSuggestedPronunciation,
  clearFeedback,
  startSpeaking,
  stopSpeaking,
  setVoiceSettings,
  setSelectedVoice,
  updateSettings,
  setSilenceThreshold,
  setBrowserSupport,
  setMicrophonePermission,
  setPermissionError,
  startCalibration,
  updateCalibration,
  finishCalibration,
  setFallbackMode,
  setLocalRecognitionAvailable,
  setCurrentActivity,
  addActivityPrompt,
  clearActivityPrompts,
  addProcessingTime,
  updateErrorRate,
  setMediaRecorder,
  setAudioContext,
  setMicrophone,
  setAnalyser,
  setError,
  clearError,
  setRecordingError,
  clearRecordingError,
  setProcessingError,
  clearProcessingError,
  setPlaybackError,
  clearPlaybackError,
  resetRecording,
  reset,
} = voiceSlice.actions;

export default voiceSlice.reducer;