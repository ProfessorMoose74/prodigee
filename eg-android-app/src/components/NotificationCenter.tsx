import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {socketService} from '../services/socket';
import {useAuth} from '../context/AuthContext';
import {Colors} from '../utils/Colors';

interface Notification {
  id: string;
  type:
    | 'child_login'
    | 'activity_started'
    | 'activity_completed'
    | 'progress_updated'
    | 'session_started';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

const NotificationCenter: React.FC = () => {
  const [_notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const {user} = useAuth();

  const screenWidth = Dimensions.get('window').width;

  const showNotification = useCallback(
    (notification: Notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
      setCurrentNotification(notification);

      // Animate in
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(4000), // Show for 4 seconds
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentNotification(null);
        slideAnim.setValue(-100);
      });
    },
    [slideAnim],
  );

  useEffect(() => {
    if (user?.type !== 'parent') {
      return;
    }

    // Subscribe to real-time notifications
    const unsubscribeChildLogin = socketService.onChildLogin(data => {
      showNotification({
        id: `child_login_${Date.now()}`,
        type: 'child_login',
        title: '🎉 Child Logged In',
        message: `${data.child_name} just started learning!`,
        timestamp: new Date(),
        data,
      });
    });

    const unsubscribeActivityStarted = socketService.onChildActivityStarted(
      data => {
        showNotification({
          id: `activity_started_${Date.now()}`,
          type: 'activity_started',
          title: '📚 Learning Started',
          message: `${data.child_name} is practicing ${data.activity_type}`,
          timestamp: new Date(),
          data,
        });
      },
    );

    const unsubscribeActivityCompleted = socketService.onChildActivityCompleted(
      data => {
        showNotification({
          id: `activity_completed_${Date.now()}`,
          type: 'activity_completed',
          title: '⭐ Activity Complete!',
          message: `${data.child_name} earned ${
            data.stars_earned
          } stars with ${data.accuracy.toFixed(0)}% accuracy`,
          timestamp: new Date(),
          data,
        });
      },
    );

    const unsubscribeProgressUpdated = socketService.onProgressUpdated(data => {
      showNotification({
        id: `progress_updated_${Date.now()}`,
        type: 'progress_updated',
        title: '📈 Progress Updated',
        message: `${data.child_name} improved in ${
          data.skill
        }: ${data.new_progress.toFixed(0)}%`,
        timestamp: new Date(),
        data,
      });
    });

    const unsubscribeSessionStarted = socketService.onLearningSessionStarted(
      data => {
        showNotification({
          id: `session_started_${Date.now()}`,
          type: 'session_started',
          title: '🚀 Learning Session',
          message: `${data.child_name} started a ${data.session_type} session`,
          timestamp: new Date(),
          data,
        });
      },
    );

    return () => {
      unsubscribeChildLogin();
      unsubscribeActivityStarted();
      unsubscribeActivityCompleted();
      unsubscribeProgressUpdated();
      unsubscribeSessionStarted();
    };
  }, [user, showNotification]);

  const dismissNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentNotification(null);
      slideAnim.setValue(-100);
    });
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'child_login':
        return {backgroundColor: Colors.childPrimary};
      case 'activity_started':
        return {backgroundColor: Colors.childAccent};
      case 'activity_completed':
        return {backgroundColor: Colors.success};
      case 'progress_updated':
        return {backgroundColor: Colors.parentSecondary};
      case 'session_started':
        return {backgroundColor: Colors.primary};
      default:
        return {backgroundColor: Colors.info};
    }
  };

  if (!currentNotification || user?.type !== 'parent') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY: slideAnim}],
          width: screenWidth - 20,
        },
        getNotificationStyle(currentNotification.type),
      ]}>
      <TouchableOpacity
        style={styles.content}
        onPress={dismissNotification}
        activeOpacity={0.9}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            {getNotificationIcon(currentNotification.type)}
          </Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentNotification.title}</Text>
          <Text style={styles.message}>{currentNotification.message}</Text>
          <Text style={styles.timestamp}>
            {currentNotification.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismissNotification}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Shared function for getting notification icons
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'child_login':
      return '🎉';
    case 'activity_started':
      return '📚';
    case 'activity_completed':
      return '⭐';
    case 'progress_updated':
      return '📈';
    case 'session_started':
      return '🚀';
    case 'achievement_unlocked':
      return '🏆';
    case 'milestone_reached':
      return '🎯';
    case 'weekly_report':
      return '📊';
    default:
      return '📱';
  }
};

export const NotificationHistory: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const {user} = useAuth();

  const addToHistory = useCallback((type: string, data: any) => {
    const notification: Notification = {
      id: `${type}_${Date.now()}`,
      type: type as any,
      title: getHistoryTitle(type, data),
      message: getHistoryMessage(type, data),
      timestamp: new Date(),
      data,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20
  }, []);

  useEffect(() => {
    if (user?.type !== 'parent') {
      return;
    }

    // This would typically come from a more persistent store
    // For now, we'll just show recent notifications
    const unsubscribeAll = [
      socketService.onChildLogin(data => addToHistory('child_login', data)),
      socketService.onChildActivityStarted(data =>
        addToHistory('activity_started', data),
      ),
      socketService.onChildActivityCompleted(data =>
        addToHistory('activity_completed', data),
      ),
      socketService.onProgressUpdated(data =>
        addToHistory('progress_updated', data),
      ),
    ];

    return () => unsubscribeAll.forEach(unsub => unsub());
  }, [user, addToHistory]);

  const getHistoryTitle = (type: string, _data: any): string => {
    switch (type) {
      case 'child_login':
        return 'Child Logged In';
      case 'activity_started':
        return 'Activity Started';
      case 'activity_completed':
        return 'Activity Completed';
      case 'progress_updated':
        return 'Progress Updated';
      default:
        return 'Notification';
    }
  };

  const getHistoryMessage = (type: string, data: any): string => {
    switch (type) {
      case 'child_login':
        return `${data.child_name} started learning`;
      case 'activity_started':
        return `${data.child_name} began ${data.activity_type}`;
      case 'activity_completed':
        return `${data.child_name} completed ${data.activity_type} with ${data.accuracy}% accuracy`;
      case 'progress_updated':
        return `${data.child_name} progressed in ${data.skill}`;
      default:
        return 'Update received';
    }
  };

  if (user?.type !== 'parent') {
    return null;
  }

  return (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Recent Activity</Text>
      {notifications.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>
            You'll see real-time updates when your child starts learning
            activities
          </Text>
        </View>
      ) : (
        notifications.map(notification => (
          <View key={notification.id} style={styles.historyItem}>
            <Text style={styles.historyIcon}>
              {getNotificationIcon(notification.type)}
            </Text>
            <View style={styles.historyContent}>
              <Text style={styles.historyItemTitle}>{notification.title}</Text>
              <Text style={styles.historyItemMessage}>
                {notification.message}
              </Text>
              <Text style={styles.historyItemTime}>
                {notification.timestamp.toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 1000,
    borderRadius: 15,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  dismissButton: {
    padding: 8,
  },
  dismissText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    margin: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  historyItemMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  historyItemTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

export default NotificationCenter;
