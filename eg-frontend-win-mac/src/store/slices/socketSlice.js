import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Connection state
  isConnected: false,
  isConnecting: false,
  connectionAttempts: 0,
  lastConnectionTime: null,
  
  // Socket instance (not serializable, handled in middleware)
  socketId: null,
  
  // Real-time events
  recentEvents: [],
  eventHistory: [],
  
  // Room management
  joinedRooms: [],
  currentRoom: null,
  
  // Parent monitoring
  parentNotifications: [],
  childActivities: {},
  liveProgress: {},
  
  // Message queuing for offline
  queuedMessages: [],
  failedMessages: [],
  
  // Connection settings
  settings: {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 1000,
    heartbeatInterval: 30000,
  },
  
  // Performance metrics
  latency: 0,
  messagesSent: 0,
  messagesReceived: 0,
  
  // Error tracking
  connectionError: null,
  lastError: null,
  errorHistory: [],
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Connection management
    connecting: (state) => {
      state.isConnecting = true;
      state.connectionError = null;
    },

    connected: (state, action) => {
      state.isConnected = true;
      state.isConnecting = false;
      state.socketId = action.payload.socketId;
      state.lastConnectionTime = Date.now();
      state.connectionAttempts = 0;
      state.connectionError = null;
      
      // Process queued messages
      state.queuedMessages = [];
    },

    disconnected: (state, action) => {
      state.isConnected = false;
      state.isConnecting = false;
      state.socketId = null;
      
      const reason = action.payload?.reason || 'Unknown';
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'disconnect',
          data: { reason },
          timestamp: Date.now(),
        }
      });
    },

    connectionFailed: (state, action) => {
      state.isConnecting = false;
      state.connectionAttempts += 1;
      state.connectionError = action.payload;
      
      socketSlice.caseReducers.addError(state, {
        payload: {
          type: 'connection',
          message: action.payload,
          timestamp: Date.now(),
        }
      });
    },

    reconnecting: (state, action) => {
      state.isConnecting = true;
      state.connectionAttempts = action.payload?.attempt || state.connectionAttempts + 1;
    },

    // Room management
    joinedRoom: (state, action) => {
      const room = action.payload;
      if (!state.joinedRooms.includes(room)) {
        state.joinedRooms.push(room);
      }
      state.currentRoom = room;
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'room_joined',
          data: { room },
          timestamp: Date.now(),
        }
      });
    },

    leftRoom: (state, action) => {
      const room = action.payload;
      const index = state.joinedRooms.indexOf(room);
      if (index !== -1) {
        state.joinedRooms.splice(index, 1);
      }
      
      if (state.currentRoom === room) {
        state.currentRoom = state.joinedRooms[0] || null;
      }
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'room_left',
          data: { room },
          timestamp: Date.now(),
        }
      });
    },

    // Event handling
    addEvent: (state, action) => {
      const event = {
        id: Date.now().toString(),
        ...action.payload,
      };
      
      state.recentEvents.unshift(event);
      state.eventHistory.unshift(event);
      
      // Limit recent events
      if (state.recentEvents.length > 10) {
        state.recentEvents = state.recentEvents.slice(0, 10);
      }
      
      // Limit event history
      if (state.eventHistory.length > 100) {
        state.eventHistory = state.eventHistory.slice(0, 100);
      }
    },

    clearRecentEvents: (state) => {
      state.recentEvents = [];
    },

    // Parent monitoring events
    childLoginEvent: (state, action) => {
      const { childId, childName, timestamp } = action.payload;
      
      // Add to parent notifications
      state.parentNotifications.unshift({
        id: Date.now().toString(),
        type: 'child_login',
        childId,
        message: `${childName} logged in`,
        timestamp: timestamp || Date.now(),
        read: false,
      });
      
      // Track child activity
      state.childActivities[childId] = {
        status: 'online',
        lastSeen: timestamp || Date.now(),
        currentActivity: null,
      };
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'child_login',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    childLogoutEvent: (state, action) => {
      const { childId, childName, timestamp } = action.payload;
      
      // Update child activity status
      if (state.childActivities[childId]) {
        state.childActivities[childId].status = 'offline';
        state.childActivities[childId].lastSeen = timestamp || Date.now();
        state.childActivities[childId].currentActivity = null;
      }
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'child_logout',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    childActivityStartedEvent: (state, action) => {
      const { childId, childName, activityType, timestamp } = action.payload;
      
      // Add notification
      state.parentNotifications.unshift({
        id: Date.now().toString(),
        type: 'activity_started',
        childId,
        message: `${childName} started ${activityType} activity`,
        timestamp: timestamp || Date.now(),
        read: false,
      });
      
      // Update child activity
      if (state.childActivities[childId]) {
        state.childActivities[childId].currentActivity = {
          type: activityType,
          startTime: timestamp || Date.now(),
        };
      }
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'activity_started',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    childActivityCompletedEvent: (state, action) => {
      const { childId, childName, activityType, results, timestamp } = action.payload;
      
      // Add notification
      state.parentNotifications.unshift({
        id: Date.now().toString(),
        type: 'activity_completed',
        childId,
        message: `${childName} completed ${activityType} with ${results?.accuracy || 0}% accuracy`,
        timestamp: timestamp || Date.now(),
        read: false,
      });
      
      // Update progress tracking
      if (!state.liveProgress[childId]) {
        state.liveProgress[childId] = [];
      }
      
      state.liveProgress[childId].unshift({
        activity: activityType,
        results,
        timestamp: timestamp || Date.now(),
      });
      
      // Limit progress history
      if (state.liveProgress[childId].length > 20) {
        state.liveProgress[childId] = state.liveProgress[childId].slice(0, 20);
      }
      
      // Clear current activity
      if (state.childActivities[childId]) {
        state.childActivities[childId].currentActivity = null;
      }
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'activity_completed',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    progressUpdatedEvent: (state, action) => {
      const { childId, progressData, timestamp } = action.payload;
      
      // Update live progress
      if (!state.liveProgress[childId]) {
        state.liveProgress[childId] = [];
      }
      
      state.liveProgress[childId].unshift({
        type: 'progress_update',
        data: progressData,
        timestamp: timestamp || Date.now(),
      });
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'progress_updated',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    achievementUnlockedEvent: (state, action) => {
      const { childId, childName, achievement, timestamp } = action.payload;
      
      // Add celebration notification
      state.parentNotifications.unshift({
        id: Date.now().toString(),
        type: 'achievement',
        childId,
        message: `🎉 ${childName} unlocked: ${achievement.title}`,
        timestamp: timestamp || Date.now(),
        read: false,
        priority: 'high',
      });
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'achievement_unlocked',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    childStrugglingEvent: (state, action) => {
      const { childId, childName, skill, details, timestamp } = action.payload;
      
      // Add intervention notification
      state.parentNotifications.unshift({
        id: Date.now().toString(),
        type: 'struggling_alert',
        childId,
        message: `${childName} may need help with ${skill}`,
        details,
        timestamp: timestamp || Date.now(),
        read: false,
        priority: 'urgent',
      });
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'child_struggling',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    // Notification management
    markNotificationRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.parentNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    },

    clearNotification: (state, action) => {
      const notificationId = action.payload;
      state.parentNotifications = state.parentNotifications.filter(
        n => n.id !== notificationId
      );
    },

    clearAllNotifications: (state) => {
      state.parentNotifications = [];
    },

    // Message queuing
    queueMessage: (state, action) => {
      state.queuedMessages.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },

    messageFailedToSend: (state, action) => {
      state.failedMessages.push({
        ...action.payload,
        failedAt: Date.now(),
      });
    },

    retryFailedMessage: (state, action) => {
      const messageId = action.payload;
      const messageIndex = state.failedMessages.findIndex(m => m.id === messageId);
      
      if (messageIndex !== -1) {
        const message = state.failedMessages[messageIndex];
        state.queuedMessages.push(message);
        state.failedMessages.splice(messageIndex, 1);
      }
    },

    clearQueuedMessages: (state) => {
      state.queuedMessages = [];
    },

    clearFailedMessages: (state) => {
      state.failedMessages = [];
    },

    // Performance metrics
    updateLatency: (state, action) => {
      state.latency = action.payload;
    },

    incrementMessagesSent: (state) => {
      state.messagesSent += 1;
    },

    incrementMessagesReceived: (state) => {
      state.messagesReceived += 1;
    },

    // Settings
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    // Error handling
    addError: (state, action) => {
      const error = {
        id: Date.now().toString(),
        ...action.payload,
      };
      
      state.lastError = error;
      state.errorHistory.unshift(error);
      
      // Limit error history
      if (state.errorHistory.length > 50) {
        state.errorHistory = state.errorHistory.slice(0, 50);
      }
    },

    clearError: (state) => {
      state.lastError = null;
      state.connectionError = null;
    },

    clearErrorHistory: (state) => {
      state.errorHistory = [];
    },

    // System events
    systemNotificationEvent: (state, action) => {
      const { message, type, timestamp } = action.payload;
      
      // Add to notifications if it's important
      if (type === 'maintenance' || type === 'update' || type === 'alert') {
        state.parentNotifications.unshift({
          id: Date.now().toString(),
          type: 'system',
          message,
          timestamp: timestamp || Date.now(),
          read: false,
          priority: type === 'alert' ? 'high' : 'normal',
        });
      }
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'system_notification',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    // Voice interaction events
    voiceInteractionEvent: (state, action) => {
      const { childId, interaction, timestamp } = action.payload;
      
      // Track voice interactions for real-time monitoring
      if (!state.liveProgress[childId]) {
        state.liveProgress[childId] = [];
      }
      
      state.liveProgress[childId].unshift({
        type: 'voice_interaction',
        data: interaction,
        timestamp: timestamp || Date.now(),
      });
      
      socketSlice.caseReducers.addEvent(state, {
        payload: {
          type: 'voice_interaction',
          data: action.payload,
          timestamp: timestamp || Date.now(),
        }
      });
    },

    // Heartbeat
    heartbeatReceived: (state, action) => {
      state.lastConnectionTime = Date.now();
      if (action.payload?.latency) {
        state.latency = action.payload.latency;
      }
    },

    // Reset socket state
    resetSocket: (state) => {
      return {
        ...initialState,
        settings: state.settings, // Preserve settings
      };
    },

    reset: () => initialState,
  },
});

export const {
  connecting,
  connected,
  disconnected,
  connectionFailed,
  reconnecting,
  joinedRoom,
  leftRoom,
  addEvent,
  clearRecentEvents,
  childLoginEvent,
  childLogoutEvent,
  childActivityStartedEvent,
  childActivityCompletedEvent,
  progressUpdatedEvent,
  achievementUnlockedEvent,
  childStrugglingEvent,
  markNotificationRead,
  clearNotification,
  clearAllNotifications,
  queueMessage,
  messageFailedToSend,
  retryFailedMessage,
  clearQueuedMessages,
  clearFailedMessages,
  updateLatency,
  incrementMessagesSent,
  incrementMessagesReceived,
  updateSettings,
  addError,
  clearError,
  clearErrorHistory,
  systemNotificationEvent,
  voiceInteractionEvent,
  heartbeatReceived,
  resetSocket,
  reset,
} = socketSlice.actions;

export default socketSlice.reducer;