import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import {logger, LogEntry} from '../services/Logger';
import {offlineSync, SyncStatus} from '../services/OfflineSync';
import {crashReporting} from '../services/CrashReporting';
import {cacheManager} from '../services/CacheManager';
import {Colors} from '../utils/Colors';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({visible, onClose}) => {
  const [activeTab, setActiveTab] = useState<
    'logs' | 'sync' | 'cache' | 'settings'
  >('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cacheStats, setCacheStats] = useState<{
    totalCacheSize: number;
    itemCount: number;
    oldestItem: number;
    newestItem: number;
  } | null>(null);
  const [offlineActivities, setOfflineActivities] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadLogs();
      loadSyncStatus();
      loadCacheData();
    }
  }, [visible]);

  const loadLogs = async () => {
    try {
      const recentLogs = await logger.getRecentLogs(24);
      setLogs(recentLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await offlineSync.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadCacheData = async () => {
    try {
      const stats = await cacheManager.getCacheStats();
      setCacheStats(stats);

      const activities = await cacheManager.getOfflineActivities();
      setOfflineActivities(activities);
    } catch (error) {
      console.error('Failed to load cache data:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) {
      return false;
    }
    if (filterCategory !== 'all' && log.category !== filterCategory) {
      return false;
    }
    if (
      searchQuery &&
      !log.message.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getUniqueCategories = () => {
    const categories = [...new Set(logs.map(log => log.category))];
    return categories.sort();
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return '#6c757d';
      case 'info':
        return '#17a2b8';
      case 'warn':
        return '#ffc107';
      case 'error':
        return '#dc3545';
      case 'fatal':
        return '#721c24';
      default:
        return '#6c757d';
    }
  };

  const renderLogsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Level:</Text>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterLevel === 'all' && styles.activeFilter,
          ]}
          onPress={() => setFilterLevel('all')}>
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        {['debug', 'info', 'warn', 'error', 'fatal'].map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterButton,
              filterLevel === level && styles.activeFilter,
            ]}
            onPress={() => setFilterLevel(level)}>
            <Text style={styles.filterButtonText}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Category:</Text>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterCategory === 'all' && styles.activeFilter,
          ]}
          onPress={() => setFilterCategory('all')}>
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        {getUniqueCategories().map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              filterCategory === category && styles.activeFilter,
            ]}
            onPress={() => setFilterCategory(category)}>
            <Text style={styles.filterButtonText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search logs..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView style={styles.logsList}>
        {filteredLogs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <View style={styles.logHeader}>
              <Text
                style={[styles.logLevel, {color: getLogLevelColor(log.level)}]}>
                {log.level.toUpperCase()}
              </Text>
              <Text style={styles.logCategory}>{log.category}</Text>
              <Text style={styles.logTimestamp}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.logMessage}>{log.message}</Text>
            {log.data && (
              <Text style={styles.logData}>
                {JSON.stringify(log.data, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={loadLogs}>
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => logger.clearLogs().then(loadLogs)}>
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={async () => {
            const exported = await logger.exportLogs();
            Alert.alert(
              'Logs Exported',
              `${exported.length} characters exported to console`,
            );
            console.log('Exported Logs:', exported);
          }}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSyncTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Sync Status</Text>
      {syncStatus && (
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Online:</Text>
            <Text
              style={[
                styles.statusValue,
                {color: syncStatus.isOnline ? Colors.success : Colors.error},
              ]}>
              {syncStatus.isOnline ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Items:</Text>
            <Text style={styles.statusValue}>{syncStatus.pendingItems}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Failed Items:</Text>
            <Text style={styles.statusValue}>{syncStatus.failedItems}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Sync in Progress:</Text>
            <Text style={styles.statusValue}>
              {syncStatus.syncInProgress ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Sync:</Text>
            <Text style={styles.statusValue}>
              {syncStatus.lastSyncTime
                ? new Date(syncStatus.lastSyncTime).toLocaleString()
                : 'Never'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={loadSyncStatus}>
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => offlineSync.syncPendingItems().then(loadSyncStatus)}>
          <Text style={styles.actionButtonText}>Force Sync</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => offlineSync.retryFailedItems().then(loadSyncStatus)}>
          <Text style={styles.actionButtonText}>Retry Failed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Clear Sync Queue',
              'Are you sure you want to clear all pending sync items?',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () =>
                    offlineSync.clearSyncQueue().then(loadSyncStatus),
                },
              ],
            );
          }}>
          <Text style={styles.actionButtonText}>Clear Queue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCacheTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Cache Management</Text>
      {cacheStats && (
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total Items:</Text>
            <Text style={styles.statusValue}>{cacheStats.itemCount}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total Size:</Text>
            <Text style={styles.statusValue}>
              {(cacheStats.totalCacheSize / 1024).toFixed(1)} KB
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Oldest Item:</Text>
            <Text style={styles.statusValue}>
              {cacheStats.oldestItem > 0
                ? new Date(cacheStats.oldestItem).toLocaleString()
                : 'None'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Newest Item:</Text>
            <Text style={styles.statusValue}>
              {cacheStats.newestItem > 0
                ? new Date(cacheStats.newestItem).toLocaleString()
                : 'None'}
            </Text>
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
        Offline Activities ({offlineActivities.length})
      </Text>
      {offlineActivities.length > 0 ? (
        <ScrollView style={styles.activitiesList}>
          {offlineActivities.slice(0, 10).map((activity, index) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityType}>{activity.activityType}</Text>
                <Text
                  style={[
                    styles.activityStatus,
                    {
                      color: activity.synced
                        ? Colors.success
                        : Colors.warning,
                    },
                  ]}>
                  {activity.synced ? 'Synced' : 'Pending'}
                </Text>
              </View>
              <Text style={styles.activityDetail}>
                Accuracy: {activity.results.accuracy}% | Duration: {activity.results.duration}s
              </Text>
              <Text style={styles.activityTimestamp}>
                {new Date(activity.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
          {offlineActivities.length > 10 && (
            <Text style={styles.moreActivities}>
              ... and {offlineActivities.length - 10} more
            </Text>
          )}
        </ScrollView>
      ) : (
        <Text style={styles.emptyState}>No offline activities stored</Text>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={loadCacheData}>
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={async () => {
            await cacheManager.removeOldSyncedActivities();
            loadCacheData();
            Alert.alert('Success', 'Old synced activities cleaned up');
          }}>
          <Text style={styles.actionButtonText}>Clean Old</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: Colors.warning}]}
          onPress={() => {
            Alert.alert(
              'Clear All Cache',
              'Are you sure you want to clear all cached data? This will require re-downloading content.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Clear All',
                  style: 'destructive',
                  onPress: async () => {
                    await cacheManager.clearAllCache();
                    loadCacheData();
                    Alert.alert('Success', 'All cache data cleared');
                  },
                },
              ],
            );
          }}>
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={async () => {
            const unsyncedCount = await cacheManager.getUnsyncedActivities();
            Alert.alert(
              'Cache Details',
              `Unsynced activities: ${unsyncedCount.length}\n` +
                `Total cache size: ${(cacheStats?.totalCacheSize || 0) / 1024} KB\n` +
                `Items cached: ${cacheStats?.itemCount || 0}`,
            );
          }}>
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Debug Settings</Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Console Logging:</Text>
        <Switch
          value={true}
          onValueChange={value => {
            logger.setConfig({enableConsoleOutput: value});
          }}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Remote Logging:</Text>
        <Switch
          value={false}
          onValueChange={value => {
            logger.setConfig({enableRemoteLogging: value});
          }}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={async () => {
            const errors = await crashReporting.getStoredErrors();
            Alert.alert(
              'Stored Errors',
              `Found ${errors.length} stored error reports`,
            );
            console.log('Stored Error Reports:', errors);
          }}>
          <Text style={styles.actionButtonText}>View Error Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            crashReporting.clearStoredErrors();
            Alert.alert('Success', 'Error reports cleared');
          }}>
          <Text style={styles.actionButtonText}>Clear Error Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return renderLogsTab();
      case 'sync':
        return renderSyncTab();
      case 'cache':
        return renderCacheTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderLogsTab();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Panel</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {[
            {key: 'logs', label: 'Logs'},
            {key: 'sync', label: 'Sync'},
            {key: 'cache', label: 'Cache'},
            {key: 'settings', label: 'Settings'},
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderTabContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.text,
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.lighter,
    marginRight: 4,
    marginBottom: 4,
  },
  activeFilter: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: Colors.text,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  logsList: {
    flex: 1,
    marginBottom: 16,
  },
  logEntry: {
    backgroundColor: Colors.surface,
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  logHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  logCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  logTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: Colors.lighter,
    padding: 4,
    borderRadius: 2,
  },
  statusContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  comingSoon: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  activitiesList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  activityItem: {
    backgroundColor: Colors.surface,
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  activityStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityTimestamp: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  moreActivities: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});

export default DebugPanel;
