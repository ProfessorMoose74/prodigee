import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import {offlineAPI} from '../services/OfflineAPI';
import {Colors} from '../utils/Colors';

interface SyncStatus {
  unsyncedCount: number;
  lastSyncTime: number;
  isOnline: boolean;
  syncInProgress: boolean;
}

const OfflineStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    unsyncedCount: 0,
    lastSyncTime: 0,
    isOnline: true,
    syncInProgress: false,
  });

  const [showStatus, setShowStatus] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-60));

  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await offlineAPI.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  }, []);

  const hideStatusBar = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    updateSyncStatus();

    // Update status every 30 seconds
    const interval = setInterval(updateSyncStatus, 30000);

    // Subscribe to sync completion
    const unsubscribe = offlineAPI.onSyncComplete(success => {
      updateSyncStatus();
      if (success && syncStatus.unsyncedCount > 0) {
        hideStatusBar();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [updateSyncStatus, hideStatusBar, syncStatus.unsyncedCount]);

  const showStatusBar = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    // Show status bar if offline or has unsynced data
    const shouldShow =
      !syncStatus.isOnline ||
      syncStatus.unsyncedCount > 0 ||
      syncStatus.syncInProgress;

    if (shouldShow !== showStatus) {
      setShowStatus(shouldShow);

      if (shouldShow) {
        showStatusBar();
      } else {
        hideStatusBar();
      }
    }
  }, [syncStatus, showStatus, showStatusBar, hideStatusBar]);

  const handleStatusPress = () => {
    if (syncStatus.isOnline && syncStatus.unsyncedCount > 0) {
      Alert.alert(
        'Sync Offline Data',
        `You have ${syncStatus.unsyncedCount} activities saved offline. Would you like to sync them now?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Sync Now', onPress: forceSyncData},
        ],
      );
    } else if (!syncStatus.isOnline) {
      showOfflineInfo();
    }
  };

  const forceSyncData = async () => {
    try {
      const success = await offlineAPI.forceSyncOfflineData();
      if (success) {
        updateSyncStatus();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const showOfflineInfo = () => {
    Alert.alert(
      '📱 Offline Mode',
      "You're currently offline. The app will continue to work and your progress will be saved locally. Everything will sync automatically when you're back online.",
      [{text: 'OK', style: 'default'}],
    );
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) {
      return Colors.warning;
    }
    if (syncStatus.unsyncedCount > 0) {
      return Colors.info;
    }
    if (syncStatus.syncInProgress) {
      return Colors.primary;
    }
    return Colors.success;
  };

  const getStatusText = () => {
    if (syncStatus.syncInProgress) {
      return '🔄 Syncing...';
    }

    if (!syncStatus.isOnline) {
      if (syncStatus.unsyncedCount > 0) {
        return `📱 Offline (${syncStatus.unsyncedCount} saved)`;
      }
      return '📱 Offline Mode';
    }

    if (syncStatus.unsyncedCount > 0) {
      return `☁️ ${syncStatus.unsyncedCount} to sync`;
    }

    return '✅ All synced';
  };

  const getLastSyncText = () => {
    if (syncStatus.lastSyncTime === 0) {
      return '';
    }

    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) {
      return 'Just synced';
    }
    if (minutes < 60) {
      return `Synced ${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Synced ${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `Synced ${days}d ago`;
  };

  if (!showStatus) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getStatusColor(),
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <TouchableOpacity
        style={styles.content}
        onPress={handleStatusPress}
        activeOpacity={0.8}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {syncStatus.lastSyncTime > 0 && (
            <Text style={styles.lastSyncText}>{getLastSyncText()}</Text>
          )}
        </View>

        {syncStatus.unsyncedCount > 0 && syncStatus.isOnline && (
          <View style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Tap to sync</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Enhanced offline banner for full-screen scenarios
export const OfflineBanner: React.FC<{
  onRetry?: () => void;
  message?: string;
}> = ({onRetry, message}) => {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerIcon}>📱</Text>
      <Text style={styles.bannerTitle}>You're Offline</Text>
      <Text style={styles.bannerMessage}>
        {message ||
          'Some features may be limited while offline. Your progress is being saved locally.'}
      </Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Sync progress indicator
export const SyncProgress: React.FC<{
  visible: boolean;
  progress?: number;
  total?: number;
}> = ({visible, progress = 0, total = 0}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.syncProgress}>
      <Text style={styles.syncProgressText}>
        Syncing activities... {progress}/{total}
      </Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {width: total > 0 ? `${(progress / total) * 100}%` : '0%'},
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    minHeight: 60,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 40, // Account for status bar
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  lastSyncText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  banner: {
    backgroundColor: Colors.warning,
    padding: 30,
    alignItems: 'center',
    margin: 20,
    borderRadius: 15,
  },
  bannerIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  bannerMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: Colors.warning,
    fontWeight: 'bold',
  },
  syncProgress: {
    backgroundColor: Colors.surface,
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  syncProgressText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.lighter,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

export default OfflineStatus;
