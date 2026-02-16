import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {api} from './api';
import {crashReporting} from './CrashReporting';

interface SyncQueueItem {
  id: string;
  type: 'activity' | 'progress' | 'avatar' | 'settings';
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingItems: number;
  syncInProgress: boolean;
  failedItems: number;
}

class OfflineSyncService {
  private readonly SYNC_QUEUE_KEY = 'eg_sync_queue';
  private readonly SYNC_STATUS_KEY = 'eg_sync_status';
  private readonly MAX_RETRY_COUNT = 3;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds

  private syncInterval?: NodeJS.Timeout;
  private isConnected = false;
  private syncInProgress = false;

  constructor() {
    this.initializeNetworkListener();
    this.startPeriodicSync();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = !!state.isConnected;

      if (!wasConnected && this.isConnected) {
        // Device came back online
        crashReporting.addBreadcrumb({
          message: 'Device came back online',
          category: 'network',
          level: 'info',
        });
        this.syncPendingItems();
      } else if (wasConnected && !this.isConnected) {
        // Device went offline
        crashReporting.addBreadcrumb({
          message: 'Device went offline',
          category: 'network',
          level: 'warning',
        });
      }
    });
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.isConnected && !this.syncInProgress) {
        this.syncPendingItems();
      }
    }, this.SYNC_INTERVAL);
  }

  async addToSyncQueue(
    type: SyncQueueItem['type'],
    data: any,
    priority: SyncQueueItem['priority'] = 'medium',
  ): Promise<void> {
    try {
      const item: SyncQueueItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        priority,
      };

      const queue = await this.getSyncQueue();
      queue.push(item);

      // Sort by priority and timestamp
      queue.sort((a, b) => {
        const priorityOrder = {high: 3, medium: 2, low: 1};
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.timestamp - b.timestamp;
      });

      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
      await this.updateSyncStatus();

      // Try to sync immediately if online
      if (this.isConnected && !this.syncInProgress) {
        this.syncPendingItems();
      }
    } catch (error) {
      console.error('Failed to add item to sync queue:', error);
      crashReporting.recordError(error as Error, {
        context: 'offline_sync',
        action: 'add_to_queue',
      });
    }
  }

  async syncPendingItems(): Promise<boolean> {
    if (this.syncInProgress || !this.isConnected) {
      return false;
    }

    this.syncInProgress = true;

    try {
      const queue = await this.getSyncQueue();
      if (queue.length === 0) {
        this.syncInProgress = false;
        return true;
      }

      crashReporting.addBreadcrumb({
        message: `Starting sync of ${queue.length} items`,
        category: 'sync',
        level: 'info',
        data: {itemCount: queue.length},
      });

      const syncResults = await Promise.allSettled(
        queue.map(item => this.syncItem(item)),
      );

      const successfulItems = syncResults
        .map((result, index) => ({result, item: queue[index]}))
        .filter(({result}) => result.status === 'fulfilled')
        .map(({item}) => item);

      const failedItems = syncResults
        .map((result, index) => ({result, item: queue[index]}))
        .filter(({result}) => result.status === 'rejected')
        .map(({item, result}) => {
          item.retryCount++;
          console.error(
            `Sync failed for item ${item.id}:`,
            (result as PromiseRejectedResult).reason,
          );
          return item;
        });

      // Remove successful items and items that exceeded retry limit
      const remainingItems = failedItems.filter(
        item => item.retryCount < this.MAX_RETRY_COUNT,
      );

      await AsyncStorage.setItem(
        this.SYNC_QUEUE_KEY,
        JSON.stringify(remainingItems),
      );
      await this.updateSyncStatus();

      crashReporting.addBreadcrumb({
        message: `Sync completed: ${successfulItems.length} successful, ${failedItems.length} failed`,
        category: 'sync',
        level: failedItems.length > 0 ? 'warning' : 'info',
        data: {
          successful: successfulItems.length,
          failed: failedItems.length,
          remaining: remainingItems.length,
        },
      });

      this.syncInProgress = false;
      return failedItems.length === 0;
    } catch (error) {
      console.error('Sync process failed:', error);
      crashReporting.recordError(error as Error, {
        context: 'offline_sync',
        action: 'sync_pending_items',
      });
      this.syncInProgress = false;
      return false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'activity':
        await api.submitActivityResult(item.data);
        break;
      case 'progress':
        await api.updateUserProgress(item.data);
        break;
      case 'avatar':
        await api.updateAvatar(item.data);
        break;
      case 'settings':
        await api.updateSettings(item.data);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const statusData = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      const queue = await this.getSyncQueue();
      const failedItems = queue.filter(
        item => item.retryCount >= this.MAX_RETRY_COUNT,
      );

      const defaultStatus: SyncStatus = {
        isOnline: this.isConnected,
        lastSyncTime: 0,
        pendingItems: queue.length,
        syncInProgress: this.syncInProgress,
        failedItems: failedItems.length,
      };

      return statusData
        ? {...defaultStatus, ...JSON.parse(statusData)}
        : defaultStatus;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        isOnline: this.isConnected,
        lastSyncTime: 0,
        pendingItems: 0,
        syncInProgress: false,
        failedItems: 0,
      };
    }
  }

  private async updateSyncStatus(): Promise<void> {
    try {
      const status: Partial<SyncStatus> = {
        lastSyncTime: Date.now(),
        syncInProgress: this.syncInProgress,
      };
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
      await this.updateSyncStatus();
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  async retryFailedItems(): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      // Reset retry count for failed items
      queue.forEach(item => {
        if (item.retryCount >= this.MAX_RETRY_COUNT) {
          item.retryCount = 0;
        }
      });
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));

      if (this.isConnected) {
        this.syncPendingItems();
      }
    } catch (error) {
      console.error('Failed to retry failed items:', error);
      crashReporting.recordError(error as Error, {
        context: 'offline_sync',
        action: 'retry_failed_items',
      });
    }
  }

  // Convenience methods for common operations
  async syncActivityResult(activityData: any): Promise<void> {
    await this.addToSyncQueue('activity', activityData, 'high');
  }

  async syncAvatarUpdate(avatarData: any): Promise<void> {
    await this.addToSyncQueue('avatar', avatarData, 'medium');
  }

  async syncProgressUpdate(progressData: any): Promise<void> {
    await this.addToSyncQueue('progress', progressData, 'high');
  }

  async syncSettingsUpdate(settingsData: any): Promise<void> {
    await this.addToSyncQueue('settings', settingsData, 'low');
  }

  // Cleanup on app termination
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const offlineSync = new OfflineSyncService();
export type {SyncStatus, SyncQueueItem};
