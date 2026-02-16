import io, {Socket} from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {EventEmitter} from 'events';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _SocketEventMap {
  child_login: (data: {child_name: string; login_time: string}) => void;
  child_activity_started: (data: {
    child_name: string;
    activity_type: string;
  }) => void;
  child_activity_completed: (data: {
    child_name: string;
    accuracy: number;
    stars_earned: number;
  }) => void;
  learning_session_started: (data: {
    session_type: string;
    child_name: string;
  }) => void;
  learning_session_completed: (data: {
    engagement_score: number;
    child_name: string;
    session_duration: number;
  }) => void;
  progress_updated: (data: {
    child_name: string;
    skill: string;
    new_progress: number;
  }) => void;
  assessment_completed: (data: {
    child_name: string;
    assessment_type: string;
    score: number;
  }) => void;
}

class SocketService extends EventEmitter {
  private socket: Socket | null = null;
  private baseURL = __DEV__
    ? 'http://localhost:5000'
    : 'https://api.elementalgenius.com';
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      this.socket = io(this.baseURL, {
        transports: ['websocket'],
        autoConnect: false,
        auth: {
          token: token,
        },
      });

      this.setupEventListeners();
      this.socket.connect();
    } catch (error) {
      console.error('Socket connection failed:', error);
      this.emit('connection_error', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) {
      return;
    }

    this.socket.on('connect', () => {
      console.log('Connected to Elemental Genius server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', reason => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }

      this.handleReconnection();
    });

    this.socket.on('connect_error', error => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.emit('connection_error', error);
      this.handleReconnection();
    });

    // Parent monitoring events
    this.socket.on('child_login', data => {
      console.log('Child login notification:', data);
      this.emit('child_login', data);
    });

    this.socket.on('child_activity_started', data => {
      console.log('Child activity started:', data);
      this.emit('child_activity_started', data);
    });

    this.socket.on('child_activity_completed', data => {
      console.log('Child activity completed:', data);
      this.emit('child_activity_completed', data);
    });

    this.socket.on('learning_session_started', data => {
      console.log('Learning session started:', data);
      this.emit('learning_session_started', data);
    });

    this.socket.on('learning_session_completed', data => {
      console.log('Learning session completed:', data);
      this.emit('learning_session_completed', data);
    });

    this.socket.on('progress_updated', data => {
      console.log('Progress updated:', data);
      this.emit('progress_updated', data);
    });

    this.socket.on('assessment_completed', data => {
      console.log('Assessment completed:', data);
      this.emit('assessment_completed', data);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    setTimeout(() => {
      if (!this.isConnected) {
        console.log(
          `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
        );
        this.socket?.connect();
      }
    }, delay);
  }

  // Parent-specific methods
  async joinParentRoom() {
    try {
      const parentId = await AsyncStorage.getItem('parent_id');
      if (parentId && this.socket?.connected) {
        this.socket.emit('join_parent_room', {
          parent_id: parseInt(parentId, 10),
        });
        console.log('Joined parent room:', parentId);
      }
    } catch (error) {
      console.error('Failed to join parent room:', error);
    }
  }

  async startParentMonitoring(childId: number) {
    if (this.socket?.connected) {
      this.socket.emit('start_monitoring', {child_id: childId});
      console.log('Started monitoring child:', childId);
    }
  }

  async stopParentMonitoring(childId: number) {
    if (this.socket?.connected) {
      this.socket.emit('stop_monitoring', {child_id: childId});
      console.log('Stopped monitoring child:', childId);
    }
  }

  // Child-specific methods
  async joinChildSession(sessionId: number) {
    if (this.socket?.connected) {
      this.socket.emit('join_child_session', {session_id: sessionId});
      console.log('Joined child session:', sessionId);
    }
  }

  async notifyActivityStart(activityType: string) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (childId && this.socket?.connected) {
        this.socket.emit('child_activity_start', {
          child_id: parseInt(childId, 10),
          activity_type: activityType,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to notify activity start:', error);
    }
  }

  async notifyActivityComplete(
    activityType: string,
    results: {
      accuracy: number;
      stars_earned: number;
      duration: number;
    },
  ) {
    try {
      const childId = await AsyncStorage.getItem('child_id');
      if (childId && this.socket?.connected) {
        this.socket.emit('child_activity_complete', {
          child_id: parseInt(childId, 10),
          activity_type: activityType,
          ...results,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to notify activity completion:', error);
    }
  }

  // General methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected manually');
    }
  }

  // Event subscription helpers for React components
  onChildLogin(callback: (data: any) => void) {
    this.on('child_login', callback);
    return () => this.off('child_login', callback);
  }

  onChildActivityStarted(callback: (data: any) => void) {
    this.on('child_activity_started', callback);
    return () => this.off('child_activity_started', callback);
  }

  onChildActivityCompleted(callback: (data: any) => void) {
    this.on('child_activity_completed', callback);
    return () => this.off('child_activity_completed', callback);
  }

  onLearningSessionStarted(callback: (data: any) => void) {
    this.on('learning_session_started', callback);
    return () => this.off('learning_session_started', callback);
  }

  onLearningSessionCompleted(callback: (data: any) => void) {
    this.on('learning_session_completed', callback);
    return () => this.off('learning_session_completed', callback);
  }

  onProgressUpdated(callback: (data: any) => void) {
    this.on('progress_updated', callback);
    return () => this.off('progress_updated', callback);
  }

  onConnectionError(callback: (error: any) => void) {
    this.on('connection_error', callback);
    return () => this.off('connection_error', callback);
  }
}

export const socketService = new SocketService();
