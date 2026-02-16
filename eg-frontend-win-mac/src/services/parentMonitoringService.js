import { socketService } from './socketService';
import { api } from './api';

class ParentMonitoringService {
  constructor() {
    this.isMonitoring = false;
    this.currentSession = null;
    this.eventBuffer = [];
    this.maxBufferSize = 100;
    
    // Event callbacks
    this.onActivityStart = null;
    this.onActivityComplete = null;
    this.onProgressUpdate = null;
    this.onStruggleDetected = null;
    this.onAchievementUnlocked = null;
    this.onSessionStart = null;
    this.onSessionEnd = null;
    this.onError = null;
    
    // Monitoring settings
    this.struggleThreshold = 3; // Number of failed attempts before flagging
    this.inactivityTimeout = 5 * 60 * 1000; // 5 minutes
    this.autoReportInterval = 60 * 1000; // 1 minute
    
    this.initializeSocketListeners();
  }

  initializeSocketListeners() {
    // Listen for child activity events
    socketService.on('child_activity_start', this.handleActivityStart.bind(this));
    socketService.on('child_activity_complete', this.handleActivityComplete.bind(this));
    socketService.on('child_progress_update', this.handleProgressUpdate.bind(this));
    socketService.on('child_struggle_detected', this.handleStruggleDetected.bind(this));
    socketService.on('child_achievement_unlocked', this.handleAchievementUnlocked.bind(this));
    socketService.on('child_session_start', this.handleSessionStart.bind(this));
    socketService.on('child_session_end', this.handleSessionEnd.bind(this));
    socketService.on('monitoring_error', this.handleMonitoringError.bind(this));
    
    // Connection status
    socketService.on('connect', this.handleSocketConnect.bind(this));
    socketService.on('disconnect', this.handleSocketDisconnect.bind(this));
    socketService.on('reconnect', this.handleSocketReconnect.bind(this));
  }

  async startMonitoring(childId, parentId) {
    try {
      if (this.isMonitoring) {
        console.warn('Already monitoring');
        return;
      }

      // Establish WebSocket connection if not already connected
      if (!socketService.isConnected()) {
        await socketService.connect();
      }

      // Join monitoring room for this parent-child pair
      socketService.emit('join_monitoring_room', {
        child_id: childId,
        parent_id: parentId,
        timestamp: new Date().toISOString()
      });

      // Start monitoring session
      const response = await api.post('/monitoring/start', {
        child_id: childId,
        parent_id: parentId,
        monitoring_settings: {
          struggle_threshold: this.struggleThreshold,
          inactivity_timeout: this.inactivityTimeout,
          auto_report_interval: this.autoReportInterval
        }
      });

      this.currentSession = {
        id: response.data.session_id,
        childId,
        parentId,
        startTime: new Date(),
        activities: [],
        events: []
      };

      this.isMonitoring = true;
      
      // Start periodic reporting
      this.startPeriodicReporting();
      
      console.log('Parent monitoring started for child:', childId);
      
      if (this.onSessionStart) {
        this.onSessionStart(this.currentSession);
      }

    } catch (error) {
      console.error('Failed to start parent monitoring:', error);
      if (this.onError) {
        this.onError({
          type: 'start_monitoring_failed',
          error: error.message,
          timestamp: new Date()
        });
      }
      throw error;
    }
  }

  async stopMonitoring() {
    try {
      if (!this.isMonitoring || !this.currentSession) {
        console.warn('Not currently monitoring');
        return;
      }

      // Leave monitoring room
      socketService.emit('leave_monitoring_room', {
        child_id: this.currentSession.childId,
        parent_id: this.currentSession.parentId,
        session_id: this.currentSession.id
      });

      // End monitoring session
      await api.post('/monitoring/stop', {
        session_id: this.currentSession.id,
        end_time: new Date().toISOString(),
        summary: this.generateSessionSummary()
      });

      this.stopPeriodicReporting();
      
      const endedSession = {
        ...this.currentSession,
        endTime: new Date(),
        duration: new Date() - this.currentSession.startTime
      };

      this.isMonitoring = false;
      this.currentSession = null;
      this.eventBuffer = [];
      
      console.log('Parent monitoring stopped');
      
      if (this.onSessionEnd) {
        this.onSessionEnd(endedSession);
      }

    } catch (error) {
      console.error('Failed to stop parent monitoring:', error);
      if (this.onError) {
        this.onError({
          type: 'stop_monitoring_failed',
          error: error.message,
          timestamp: new Date()
        });
      }
    }
  }

  // Event handlers
  handleActivityStart(data) {
    const event = {
      type: 'activity_start',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    this.addEventToBuffer(event);
    
    if (this.currentSession) {
      this.currentSession.activities.push({
        id: data.activity_id,
        name: data.activity_name,
        type: data.activity_type,
        startTime: event.timestamp,
        status: 'in_progress'
      });
    }

    if (this.onActivityStart) {
      this.onActivityStart(event);
    }

    // Notify parent in real-time
    this.sendRealTimeUpdate('activity_start', {
      activity_name: data.activity_name,
      activity_type: data.activity_type,
      child_name: data.child_name,
      timestamp: event.timestamp
    });
  }

  handleActivityComplete(data) {
    const event = {
      type: 'activity_complete',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    this.addEventToBuffer(event);

    if (this.currentSession) {
      const activity = this.currentSession.activities.find(a => a.id === data.activity_id);
      if (activity) {
        activity.endTime = event.timestamp;
        activity.duration = event.timestamp - activity.startTime;
        activity.status = 'completed';
        activity.score = data.score;
        activity.accuracy = data.accuracy;
        activity.attempts = data.attempts;
      }
    }

    if (this.onActivityComplete) {
      this.onActivityComplete(event);
    }

    // Send completion notification with results
    this.sendRealTimeUpdate('activity_complete', {
      activity_name: data.activity_name,
      score: data.score,
      accuracy: data.accuracy,
      attempts: data.attempts,
      duration: data.duration,
      child_name: data.child_name,
      timestamp: event.timestamp
    });
  }

  handleProgressUpdate(data) {
    const event = {
      type: 'progress_update',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    this.addEventToBuffer(event);

    if (this.onProgressUpdate) {
      this.onProgressUpdate(event);
    }

    // Send progress updates periodically (not every single one)
    if (this.shouldSendProgressUpdate(data)) {
      this.sendRealTimeUpdate('progress_update', {
        skill: data.skill,
        progress_percentage: data.progress_percentage,
        mastery_level: data.mastery_level,
        child_name: data.child_name,
        timestamp: event.timestamp
      });
    }
  }

  handleStruggleDetected(data) {
    const event = {
      type: 'struggle_detected',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    this.addEventToBuffer(event);

    if (this.onStruggleDetected) {
      this.onStruggleDetected(event);
    }

    // Immediate notification for struggles - parents may want to help
    this.sendRealTimeUpdate('struggle_detected', {
      activity_name: data.activity_name,
      struggle_type: data.struggle_type,
      consecutive_failures: data.consecutive_failures,
      child_name: data.child_name,
      suggested_intervention: data.suggested_intervention,
      timestamp: event.timestamp,
      priority: 'high'
    });
  }

  handleAchievementUnlocked(data) {
    const event = {
      type: 'achievement_unlocked',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    this.addEventToBuffer(event);

    if (this.onAchievementUnlocked) {
      this.onAchievementUnlocked(event);
    }

    // Send achievement notifications - parents love to celebrate!
    this.sendRealTimeUpdate('achievement_unlocked', {
      achievement_name: data.achievement_name,
      achievement_type: data.achievement_type,
      description: data.description,
      reward: data.reward,
      child_name: data.child_name,
      timestamp: event.timestamp,
      priority: 'celebration'
    });
  }

  handleSessionStart(data) {
    const event = {
      type: 'session_start',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    this.addEventToBuffer(event);

    if (this.onSessionStart) {
      this.onSessionStart(event);
    }

    this.sendRealTimeUpdate('session_start', {
      child_name: data.child_name,
      session_type: data.session_type,
      planned_activities: data.planned_activities,
      timestamp: event.timestamp
    });
  }

  handleSessionEnd(data) {
    const event = {
      type: 'session_end',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    this.addEventToBuffer(event);

    if (this.onSessionEnd) {
      this.onSessionEnd(event);
    }

    this.sendRealTimeUpdate('session_end', {
      child_name: data.child_name,
      session_duration: data.session_duration,
      activities_completed: data.activities_completed,
      total_score: data.total_score,
      achievements: data.achievements,
      timestamp: event.timestamp
    });
  }

  handleMonitoringError(data) {
    const error = {
      type: 'monitoring_error',
      ...data,
      timestamp: new Date(data.timestamp)
    };

    console.error('Monitoring error received:', error);

    if (this.onError) {
      this.onError(error);
    }
  }

  // Socket connection handlers
  handleSocketConnect() {
    console.log('WebSocket connected for parent monitoring');
    
    // Rejoin monitoring room if we were monitoring
    if (this.isMonitoring && this.currentSession) {
      socketService.emit('join_monitoring_room', {
        child_id: this.currentSession.childId,
        parent_id: this.currentSession.parentId,
        session_id: this.currentSession.id
      });
    }
  }

  handleSocketDisconnect() {
    console.log('WebSocket disconnected for parent monitoring');
    
    if (this.onError) {
      this.onError({
        type: 'connection_lost',
        message: 'Real-time monitoring connection lost',
        timestamp: new Date()
      });
    }
  }

  handleSocketReconnect() {
    console.log('WebSocket reconnected for parent monitoring');
    
    // Rejoin monitoring room
    if (this.isMonitoring && this.currentSession) {
      socketService.emit('join_monitoring_room', {
        child_id: this.currentSession.childId,
        parent_id: this.currentSession.parentId,
        session_id: this.currentSession.id
      });
    }
  }

  // Utility methods
  addEventToBuffer(event) {
    this.eventBuffer.push(event);
    
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }

    if (this.currentSession) {
      this.currentSession.events.push(event);
    }
  }

  shouldSendProgressUpdate(data) {
    // Send progress updates only for significant milestones
    const significantProgress = data.progress_percentage % 10 === 0; // Every 10%
    const masteryChange = data.mastery_level_changed;
    const skillComplete = data.skill_completed;
    
    return significantProgress || masteryChange || skillComplete;
  }

  sendRealTimeUpdate(eventType, data) {
    if (!this.isMonitoring || !this.currentSession) {
      return;
    }

    const update = {
      event_type: eventType,
      session_id: this.currentSession.id,
      child_id: this.currentSession.childId,
      parent_id: this.currentSession.parentId,
      data,
      timestamp: new Date().toISOString()
    };

    // Send via WebSocket for real-time delivery
    socketService.emit('parent_notification', update);
    
    // Also store for later retrieval if parent is offline
    api.post('/monitoring/notification', update).catch(error => {
      console.error('Failed to store notification:', error);
    });
  }

  startPeriodicReporting() {
    this.periodicReportTimer = setInterval(() => {
      if (this.isMonitoring && this.currentSession) {
        this.sendPeriodicReport();
      }
    }, this.autoReportInterval);
  }

  stopPeriodicReporting() {
    if (this.periodicReportTimer) {
      clearInterval(this.periodicReportTimer);
      this.periodicReportTimer = null;
    }
  }

  async sendPeriodicReport() {
    try {
      const report = {
        session_id: this.currentSession.id,
        timestamp: new Date().toISOString(),
        summary: this.generateSessionSummary(),
        recent_events: this.eventBuffer.slice(-10) // Last 10 events
      };

      await api.post('/monitoring/periodic-report', report);
      
    } catch (error) {
      console.error('Failed to send periodic report:', error);
    }
  }

  generateSessionSummary() {
    if (!this.currentSession) {
      return null;
    }

    const activities = this.currentSession.activities;
    const events = this.currentSession.events;
    
    return {
      session_duration: new Date() - this.currentSession.startTime,
      total_activities: activities.length,
      completed_activities: activities.filter(a => a.status === 'completed').length,
      in_progress_activities: activities.filter(a => a.status === 'in_progress').length,
      average_score: this.calculateAverageScore(activities),
      total_events: events.length,
      struggle_events: events.filter(e => e.type === 'struggle_detected').length,
      achievement_events: events.filter(e => e.type === 'achievement_unlocked').length,
      last_activity: activities[activities.length - 1]?.name || null,
      session_health: this.assessSessionHealth(events)
    };
  }

  calculateAverageScore(activities) {
    const scoredActivities = activities.filter(a => a.score !== undefined);
    if (scoredActivities.length === 0) return 0;
    
    const totalScore = scoredActivities.reduce((sum, activity) => sum + activity.score, 0);
    return Math.round(totalScore / scoredActivities.length);
  }

  assessSessionHealth(events) {
    const recentEvents = events.slice(-20); // Last 20 events
    const struggleCount = recentEvents.filter(e => e.type === 'struggle_detected').length;
    const achievementCount = recentEvents.filter(e => e.type === 'achievement_unlocked').length;
    
    if (struggleCount > 3) return 'concerning';
    if (achievementCount > 2) return 'excellent';
    if (struggleCount > 1) return 'needs_attention';
    return 'good';
  }

  // Public API methods
  async getMonitoringHistory(childId, parentId, timeframe = '24h') {
    try {
      const response = await api.get('/monitoring/history', {
        params: {
          child_id: childId,
          parent_id: parentId,
          timeframe
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get monitoring history:', error);
      throw error;
    }
  }

  async getChildStatus(childId) {
    try {
      const response = await api.get(`/monitoring/child-status/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get child status:', error);
      throw error;
    }
  }

  getCurrentSession() {
    return this.currentSession;
  }

  getRecentEvents(count = 10) {
    return this.eventBuffer.slice(-count);
  }

  isCurrentlyMonitoring() {
    return this.isMonitoring;
  }

  updateSettings(newSettings) {
    this.struggleThreshold = newSettings.struggleThreshold || this.struggleThreshold;
    this.inactivityTimeout = newSettings.inactivityTimeout || this.inactivityTimeout;
    this.autoReportInterval = newSettings.autoReportInterval || this.autoReportInterval;
    
    // Update server-side settings if currently monitoring
    if (this.isMonitoring && this.currentSession) {
      api.post('/monitoring/update-settings', {
        session_id: this.currentSession.id,
        settings: {
          struggle_threshold: this.struggleThreshold,
          inactivity_timeout: this.inactivityTimeout,
          auto_report_interval: this.autoReportInterval
        }
      }).catch(error => {
        console.error('Failed to update monitoring settings:', error);
      });
    }
  }
}

export default new ParentMonitoringService();