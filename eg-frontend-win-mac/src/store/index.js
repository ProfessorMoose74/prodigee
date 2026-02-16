import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import slice reducers
import appSlice from './slices/appSlice';
import authSlice from './slices/authSlice';
import childSlice from './slices/childSlice';
import parentSlice from './slices/parentSlice';
import activitySlice from './slices/activitySlice';
import avatarSlice from './slices/avatarSlice';
import voiceSlice from './slices/voiceSlice';
import socketSlice from './slices/socketSlice';
import curriculumSlice from './slices/curriculumSlice';
import settingsSlice from './slices/settingsSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    app: appSlice,
    auth: authSlice,
    child: childSlice,
    parent: parentSlice,
    activity: activitySlice,
    avatar: avatarSlice,
    voice: voiceSlice,
    socket: socketSlice,
    curriculum: curriculumSlice,
    settings: settingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'socket/connect',
          'socket/disconnect',
          'voice/startRecording',
          'voice/stopRecording',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp', 'payload.socket'],
        // Ignore these paths in the state
        ignoredPaths: [
          'voice.mediaRecorder',
          'voice.audioContext',
          'socket.socketInstance',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
  preloadedState: undefined,
});

// Setup listeners for RTK Query (if we add it later)
setupListeners(store.dispatch);

// Export types for TypeScript (if we convert later)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;