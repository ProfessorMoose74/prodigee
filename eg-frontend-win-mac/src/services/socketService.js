import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000; // Start with 1 second
  }

  connect(parentId = null, childId = null) {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to socket server:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: false,
    });

    this.setupEventListeners(parentId, childId);
  }

  setupEventListeners(parentId, childId) {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Join appropriate rooms
      if (parentId) {
        this.socket.emit('join_parent_room', { parent_id: parentId });
        console.log('Joined parent room:', parentId);
      }

      if (childId) {
        this.socket.emit('join_child_room', { child_id: childId });
        console.log('Joined child room:', childId);
      }

      // Notify handlers of successful connection
      this.emit('socket_connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('socket_disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('socket_error', { 
          error: 'Connection failed after maximum attempts',
          attempts: this.reconnectAttempts 
        });
      } else {
        // Exponential backoff
        this.reconnectInterval = Math.min(
          this.reconnectInterval * 1.5,
          5000
        );
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.reconnectInterval = 1000;
      this.emit('socket_reconnected', { attempts: attemptNumber });
    });

    // Parent monitoring events
    this.socket.on('child_login', (data) => {
      console.log('Child login event:', data);
      this.emit('child_login', data);
    });

    this.socket.on('child_logout', (data) => {
      console.log('Child logout event:', data);
      this.emit('child_logout', data);
    });

    this.socket.on('child_activity_started', (data) => {
      console.log('Child activity started:', data);
      this.emit('child_activity_started', data);
    });

    this.socket.on('child_activity_completed', (data) => {
      console.log('Child activity completed:', data);
      this.emit('child_activity_completed', data);
    });

    this.socket.on('learning_session_started', (data) => {
      console.log('Learning session started:', data);
      this.emit('learning_session_started', data);
    });

    this.socket.on('learning_session_completed', (data) => {
      console.log('Learning session completed:', data);
      this.emit('learning_session_completed', data);
    });

    this.socket.on('progress_updated', (data) => {
      console.log('Progress updated:', data);
      this.emit('progress_updated', data);
    });

    this.socket.on('voice_interaction', (data) => {
      console.log('Voice interaction:', data);
      this.emit('voice_interaction', data);
    });

    // Achievement and milestone events
    this.socket.on('achievement_unlocked', (data) => {
      console.log('Achievement unlocked:', data);
      this.emit('achievement_unlocked', data);
    });

    this.socket.on('milestone_reached', (data) => {
      console.log('Milestone reached:', data);
      this.emit('milestone_reached', data);
    });

    // Struggle detection and intervention
    this.socket.on('child_struggling', (data) => {
      console.log('Child struggling detected:', data);
      this.emit('child_struggling', data);
    });

    this.socket.on('intervention_suggested', (data) => {
      console.log('Intervention suggested:', data);
      this.emit('intervention_suggested', data);
    });

    // System events
    this.socket.on('system_notification', (data) => {
      console.log('System notification:', data);
      this.emit('system_notification', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
    }
  }

  // Event handler management
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in socket event handler:', error);
        }
      });
    }
  }

  // Send events to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, unable to send event:', event);
    }
  }

  // Utility methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Parent-specific methods
  joinParentRoom(parentId) {
    this.send('join_parent_room', { parent_id: parentId });
  }

  leaveParentRoom(parentId) {
    this.send('leave_parent_room', { parent_id: parentId });
  }

  // Child-specific methods
  joinChildRoom(childId) {
    this.send('join_child_room', { child_id: childId });
  }

  leaveChildRoom(childId) {
    this.send('leave_child_room', { child_id: childId });
  }

  // Activity monitoring
  notifyActivityStart(childId, activityType) {
    this.send('activity_started', {
      child_id: childId,
      activity_type: activityType,
      timestamp: new Date().toISOString(),
    });
  }

  notifyActivityComplete(childId, activityType, results) {
    this.send('activity_completed', {
      child_id: childId,
      activity_type: activityType,
      results,
      timestamp: new Date().toISOString(),
    });
  }

  notifyProgressUpdate(childId, progressData) {
    this.send('progress_update', {
      child_id: childId,
      progress: progressData,
      timestamp: new Date().toISOString(),
    });
  }

  // Voice interaction events
  notifyVoiceInteraction(childId, interaction) {
    this.send('voice_interaction', {
      child_id: childId,
      interaction,
      timestamp: new Date().toISOString(),
    });
  }

  // Session management
  notifySessionStart(childId, sessionType) {
    this.send('session_started', {
      child_id: childId,
      session_type: sessionType,
      timestamp: new Date().toISOString(),
    });
  }

  notifySessionEnd(childId, sessionId, results) {
    this.send('session_completed', {
      child_id: childId,
      session_id: sessionId,
      results,
      timestamp: new Date().toISOString(),
    });
  }

  // Heartbeat to maintain connection
  startHeartbeat(interval = 30000) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, interval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Singleton instance
export const socketService = new SocketService();

// Convenience functions for initialization
export const initializeSocket = (parentId = null, childId = null) => {
  socketService.connect(parentId, childId);
  socketService.startHeartbeat();
  return socketService;
};

export const disconnectSocket = () => {
  socketService.stopHeartbeat();
  socketService.disconnect();
};

export default socketService;