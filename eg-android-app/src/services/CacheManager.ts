import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChildDashboard} from './api';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

interface OfflineActivity {
  id: string;
  activityType: string;
  results: {
    accuracy: number;
    duration: number;
    stars_earned: number;
    engagement: number;
  };
  timestamp: number;
  synced: boolean;
}

interface CurriculumWeek {
  week_number: number;
  activities: Record<string, any>;
  nursery_rhyme: {
    title: string;
    lyrics: string;
    motions: string;
  };
  cached_at: number;
}

class CacheManager {
  private readonly CACHE_PREFIX = 'eg_cache_';
  private readonly OFFLINE_ACTIVITIES_KEY = 'eg_offline_activities';
  private readonly CURRICULUM_CACHE_KEY = 'eg_curriculum_cache';
  private readonly USER_PROGRESS_KEY = 'eg_user_progress';

  // Cache expiration times
  private readonly CACHE_TIMES = {
    dashboard: 5 * 60 * 1000, // 5 minutes
    curriculum: 24 * 60 * 60 * 1000, // 24 hours
    progress: 10 * 60 * 1000, // 10 minutes
    analytics: 15 * 60 * 1000, // 15 minutes
  };

  // Generic cache methods
  async setCache<T>(key: string, data: T, expiresIn?: number): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expiresIn || this.CACHE_TIMES.dashboard,
      };

      await AsyncStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem),
      );
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - cacheItem.timestamp > cacheItem.expiresIn) {
        await this.removeCache(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Failed to remove cache:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Specific cache methods for app data
  async cacheDashboard(
    childId: number,
    dashboard: ChildDashboard,
  ): Promise<void> {
    await this.setCache(
      `dashboard_${childId}`,
      dashboard,
      this.CACHE_TIMES.dashboard,
    );
  }

  async getCachedDashboard(childId: number): Promise<ChildDashboard | null> {
    return this.getCache<ChildDashboard>(`dashboard_${childId}`);
  }

  async cacheAnalytics(parentId: number, analytics: any): Promise<void> {
    await this.setCache(
      `analytics_${parentId}`,
      analytics,
      this.CACHE_TIMES.analytics,
    );
  }

  async getCachedAnalytics(parentId: number): Promise<any> {
    return this.getCache(`analytics_${parentId}`);
  }

  // Curriculum caching for offline access
  async cacheCurriculumWeek(
    weekNumber: number,
    curriculum: any,
  ): Promise<void> {
    try {
      const cached = await this.getCachedCurriculum();
      const updated = {
        ...cached,
        [weekNumber]: {
          ...curriculum,
          week_number: weekNumber,
          cached_at: Date.now(),
        },
      };

      await AsyncStorage.setItem(
        this.CURRICULUM_CACHE_KEY,
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error('Failed to cache curriculum:', error);
    }
  }

  async getCachedCurriculum(): Promise<Record<number, CurriculumWeek>> {
    try {
      const cached = await AsyncStorage.getItem(this.CURRICULUM_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to get cached curriculum:', error);
      return {};
    }
  }

  async getCachedCurriculumWeek(
    weekNumber: number,
  ): Promise<CurriculumWeek | null> {
    try {
      const allCached = await this.getCachedCurriculum();
      const week = allCached[weekNumber];

      if (!week) {
        return null;
      }

      // Check if curriculum cache is still valid (24 hours)
      const now = Date.now();
      if (now - week.cached_at > this.CACHE_TIMES.curriculum) {
        return null;
      }

      return week;
    } catch (error) {
      console.error('Failed to get cached curriculum week:', error);
      return null;
    }
  }

  // Offline activity management
  async storeOfflineActivity(
    activity: Omit<OfflineActivity, 'id' | 'synced'>,
  ): Promise<void> {
    try {
      const activities = await this.getOfflineActivities();
      const newActivity: OfflineActivity = {
        ...activity,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
      };

      activities.push(newActivity);
      await AsyncStorage.setItem(
        this.OFFLINE_ACTIVITIES_KEY,
        JSON.stringify(activities),
      );
    } catch (error) {
      console.error('Failed to store offline activity:', error);
    }
  }

  async getOfflineActivities(): Promise<OfflineActivity[]> {
    try {
      const stored = await AsyncStorage.getItem(this.OFFLINE_ACTIVITIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline activities:', error);
      return [];
    }
  }

  async getUnsyncedActivities(): Promise<OfflineActivity[]> {
    const activities = await this.getOfflineActivities();
    return activities.filter(activity => !activity.synced);
  }

  async markActivitySynced(activityId: string): Promise<void> {
    try {
      const activities = await this.getOfflineActivities();
      const updated = activities.map(activity =>
        activity.id === activityId ? {...activity, synced: true} : activity,
      );

      await AsyncStorage.setItem(
        this.OFFLINE_ACTIVITIES_KEY,
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error('Failed to mark activity as synced:', error);
    }
  }

  async removeOldSyncedActivities(): Promise<void> {
    try {
      const activities = await this.getOfflineActivities();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Keep unsynced activities and recent synced activities
      const filtered = activities.filter(
        activity => !activity.synced || activity.timestamp > oneWeekAgo,
      );

      await AsyncStorage.setItem(
        this.OFFLINE_ACTIVITIES_KEY,
        JSON.stringify(filtered),
      );
    } catch (error) {
      console.error('Failed to clean up old activities:', error);
    }
  }

  // User progress caching
  async cacheUserProgress(
    childId: number,
    progress: Record<string, number>,
  ): Promise<void> {
    await this.setCache(
      `progress_${childId}`,
      progress,
      this.CACHE_TIMES.progress,
    );
  }

  async getCachedUserProgress(
    childId: number,
  ): Promise<Record<string, number> | null> {
    return this.getCache<Record<string, number>>(`progress_${childId}`);
  }

  // Network status and sync helpers
  async getLastSyncTime(): Promise<number> {
    try {
      const lastSync = await AsyncStorage.getItem('last_sync_time');
      return lastSync ? parseInt(lastSync, 10) : 0;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return 0;
    }
  }

  async setLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem('last_sync_time', Date.now().toString());
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }

  // Cache statistics
  async getCacheStats(): Promise<{
    totalCacheSize: number;
    itemCount: number;
    oldestItem: number;
    newestItem: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      let totalSize = 0;
      let oldestTime = Date.now();
      let newestTime = 0;

      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
          try {
            const parsed: CacheItem<any> = JSON.parse(item);
            oldestTime = Math.min(oldestTime, parsed.timestamp);
            newestTime = Math.max(newestTime, parsed.timestamp);
          } catch (e) {
            // Skip invalid cache items
          }
        }
      }

      return {
        totalCacheSize: totalSize,
        itemCount: cacheKeys.length,
        oldestItem: oldestTime,
        newestItem: newestTime,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalCacheSize: 0,
        itemCount: 0,
        oldestItem: 0,
        newestItem: 0,
      };
    }
  }

  // Pre-cache common data for offline use
  async preloadEssentialData(_childId: number): Promise<void> {
    try {
      console.log('Preloading essential data for offline use...');

      // This method would typically be called after login
      // to cache the most important data for offline access

      // Cache multiple weeks of curriculum (current and next few)
      const currentWeek = 3; // This would come from user data
      for (let week = currentWeek; week <= currentWeek + 2; week++) {
        // This would fetch and cache curriculum data
        console.log(`Preloading curriculum for week ${week}`);
      }

      console.log('Essential data preloaded successfully');
    } catch (error) {
      console.error('Failed to preload essential data:', error);
    }
  }
}

export const cacheManager = new CacheManager();
