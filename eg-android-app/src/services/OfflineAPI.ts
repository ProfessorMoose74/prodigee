import NetInfo from '@react-native-community/netinfo';
import {api, ChildDashboard, ActivityCompletion} from './api';
import {cacheManager} from './CacheManager';
import {Alert} from 'react-native';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
}

class OfflineAPI {
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
  };

  private syncInProgress = false;
  private syncCallbacks: Array<(success: boolean) => void> = [];

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private initializeNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.networkState.isConnected;

      this.networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
      };

      // If we just came back online, sync offline data
      if (wasOffline && this.isOnline()) {
        this.syncOfflineData();
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      this.networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
      };
    });
  }

  isOnline(): boolean {
    return (
      this.networkState.isConnected && this.networkState.isInternetReachable
    );
  }

  // Enhanced API methods with offline support
  async getChildDashboard(childId?: number): Promise<ChildDashboard> {
    try {
      if (this.isOnline()) {
        // Online: fetch fresh data and cache it
        const dashboard = await api.getChildDashboard();
        if (childId) {
          await cacheManager.cacheDashboard(childId, dashboard);
        }
        return dashboard;
      } else {
        // Offline: return cached data
        if (childId) {
          const cached = await cacheManager.getCachedDashboard(childId);
          if (cached) {
            return cached;
          }
        }
        throw new Error('No cached dashboard data available offline');
      }
    } catch (error: any) {
      // Fallback to cache if network request fails
      if (childId) {
        const cached = await cacheManager.getCachedDashboard(childId);
        if (cached) {
          console.warn(
            'Using cached dashboard due to network error:',
            error.message,
          );
          return cached;
        }
      }
      throw error;
    }
  }

  async getAnalyticsDashboard(parentId?: number): Promise<any> {
    try {
      if (this.isOnline()) {
        const analytics = await api.getAnalyticsDashboard();
        if (parentId) {
          await cacheManager.cacheAnalytics(parentId, analytics);
        }
        return analytics;
      } else {
        if (parentId) {
          const cached = await cacheManager.getCachedAnalytics(parentId);
          if (cached) {
            return cached;
          }
        }
        throw new Error('No cached analytics data available offline');
      }
    } catch (error: any) {
      if (parentId) {
        const cached = await cacheManager.getCachedAnalytics(parentId);
        if (cached) {
          console.warn(
            'Using cached analytics due to network error:',
            error.message,
          );
          return cached;
        }
      }
      throw error;
    }
  }

  async completeActivity(
    activityType: string,
    results: ActivityCompletion,
    showOfflineMessage: boolean = true,
  ): Promise<any> {
    try {
      if (this.isOnline()) {
        // Online: send to server immediately
        const response = await api.completeActivity(activityType, results);

        // Also cache locally for backup
        await cacheManager.storeOfflineActivity({
          activityType,
          results,
          timestamp: Date.now(),
        });

        return response;
      } else {
        // Offline: store locally for later sync
        await cacheManager.storeOfflineActivity({
          activityType,
          results,
          timestamp: Date.now(),
        });

        if (showOfflineMessage) {
          Alert.alert(
            '📱 Offline Mode',
            "Your progress has been saved locally and will sync when you're back online!",
            [{text: 'Got it!', style: 'default'}],
          );
        }

        return {
          message: 'Activity saved offline',
          offline: true,
          progress_gained: 5.0, // Mock response
          stars_earned: results.stars_earned,
        };
      }
    } catch (error: any) {
      // Network error: save offline
      await cacheManager.storeOfflineActivity({
        activityType,
        results,
        timestamp: Date.now(),
      });

      if (showOfflineMessage) {
        Alert.alert(
          '⚠️ Connection Issue',
          'Your progress has been saved locally and will sync when connection is restored.',
          [{text: 'OK', style: 'default'}],
        );
      }

      return {
        message: 'Activity saved offline',
        offline: true,
        error: error.message,
        progress_gained: 5.0,
        stars_earned: results.stars_earned,
      };
    }
  }

  async getWeekCurriculum(weekNumber: number): Promise<any> {
    try {
      if (this.isOnline()) {
        // Try to fetch fresh curriculum
        const curriculum = await api.getWeekCurriculum(weekNumber);
        await cacheManager.cacheCurriculumWeek(weekNumber, curriculum);
        return curriculum;
      } else {
        // Check cache for offline access
        const cached = await cacheManager.getCachedCurriculumWeek(weekNumber);
        if (cached) {
          return cached;
        }
        throw new Error(`Week ${weekNumber} curriculum not available offline`);
      }
    } catch (error: any) {
      // Fallback to cache
      const cached = await cacheManager.getCachedCurriculumWeek(weekNumber);
      if (cached) {
        console.warn(
          'Using cached curriculum due to network error:',
          error.message,
        );
        return cached;
      }
      throw error;
    }
  }

  // Sync offline data when back online
  async syncOfflineData(): Promise<boolean> {
    if (this.syncInProgress || !this.isOnline()) {
      return false;
    }

    this.syncInProgress = true;

    try {
      console.log('Starting offline data sync...');

      const unsyncedActivities = await cacheManager.getUnsyncedActivities();

      if (unsyncedActivities.length === 0) {
        console.log('No offline activities to sync');
        this.syncInProgress = false;
        return true;
      }

      console.log(`Syncing ${unsyncedActivities.length} offline activities...`);

      let successCount = 0;
      let failCount = 0;

      for (const activity of unsyncedActivities) {
        try {
          await api.completeActivity(activity.activityType, activity.results);
          await cacheManager.markActivitySynced(activity.id);
          successCount++;
        } catch (error) {
          console.error('Failed to sync activity:', activity.id, error);
          failCount++;
        }
      }

      // Clean up old synced activities
      await cacheManager.removeOldSyncedActivities();
      await cacheManager.setLastSyncTime();

      console.log(
        `Sync completed: ${successCount} success, ${failCount} failed`,
      );

      // Notify callbacks
      this.syncCallbacks.forEach(callback => callback(failCount === 0));
      this.syncCallbacks = [];

      if (successCount > 0) {
        Alert.alert(
          '✅ Sync Complete',
          `Successfully synced ${successCount} activities from offline mode!`,
          [{text: 'Great!', style: 'default'}],
        );
      }

      this.syncInProgress = false;
      return failCount === 0;
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncInProgress = false;

      Alert.alert(
        '⚠️ Sync Failed',
        "Some offline data couldn't be synced. We'll try again later.",
        [{text: 'OK', style: 'default'}],
      );

      return false;
    }
  }

  // Manual sync trigger
  async forceSyncOfflineData(): Promise<boolean> {
    if (!this.isOnline()) {
      Alert.alert(
        '📱 No Internet',
        'Please check your internet connection and try again.',
        [{text: 'OK', style: 'default'}],
      );
      return false;
    }

    return this.syncOfflineData();
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    unsyncedCount: number;
    lastSyncTime: number;
    isOnline: boolean;
    syncInProgress: boolean;
  }> {
    const unsyncedActivities = await cacheManager.getUnsyncedActivities();
    const lastSyncTime = await cacheManager.getLastSyncTime();

    return {
      unsyncedCount: unsyncedActivities.length,
      lastSyncTime,
      isOnline: this.isOnline(),
      syncInProgress: this.syncInProgress,
    };
  }

  // Subscribe to sync completion
  onSyncComplete(callback: (success: boolean) => void): () => void {
    this.syncCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncCallbacks.splice(index, 1);
      }
    };
  }

  // Preload data for offline use
  async preloadForOfflineUse(childId: number): Promise<void> {
    if (!this.isOnline()) {
      console.warn('Cannot preload data while offline');
      return;
    }

    try {
      console.log('Preloading data for offline use...');

      // Preload curriculum for current and next few weeks
      const currentWeek = 3; // This would come from dashboard
      for (let week = currentWeek; week <= currentWeek + 2; week++) {
        try {
          await this.getWeekCurriculum(week);
        } catch (error) {
          console.warn(`Failed to preload week ${week}:`, error);
        }
      }

      // Cache dashboard
      await this.getChildDashboard(childId);

      console.log('Offline preload completed');
    } catch (error) {
      console.error('Failed to preload for offline use:', error);
    }
  }

  // Health check that works offline
  async healthCheck(): Promise<{
    online: boolean;
    serverReachable: boolean;
    cacheAvailable: boolean;
  }> {
    const cacheStats = await cacheManager.getCacheStats();

    let serverReachable = false;
    if (this.isOnline()) {
      try {
        await api.healthCheck();
        serverReachable = true;
      } catch (error) {
        console.warn('Server health check failed:', error);
      }
    }

    return {
      online: this.isOnline(),
      serverReachable,
      cacheAvailable: cacheStats.itemCount > 0,
    };
  }
}

export const offlineAPI = new OfflineAPI();
