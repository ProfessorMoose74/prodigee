import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../context/AuthContext';
import {ChildDashboard} from '../services/api';
import {offlineAPI} from '../services/OfflineAPI';
import {Colors} from '../utils/Colors';
import EnhancedAvatarPreview from '../components/EnhancedAvatarPreview';
import {DEFAULT_AVATAR} from '../types/Avatar';
import {
  activityCompletionService,
  AvatarAnimationEvent,
} from '../services/ActivityCompletionService';

type DashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

const DashboardScreen = () => {
  const [dashboardData, setDashboardData] = useState<ChildDashboard | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarAnimation, setAvatarAnimation] = useState<string | null>(null);

  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const {logout, user} = useAuth();

  const loadDashboard = useCallback(async () => {
    try {
      const childId = user?.id;
      const data = await offlineAPI.getChildDashboard(childId);
      setDashboardData(data);

      // Check for milestone achievements and trigger animations
      if (data?.child) {
        const child = data.child;

        // Check for star milestones
        if (
          child.total_stars &&
          [10, 25, 50, 100, 200].includes(child.total_stars)
        ) {
          activityCompletionService.onStarMilestone(child.total_stars);
        }

        // Check for streak milestones
        if (child.streak_days >= 7) {
          activityCompletionService.onStreakAchieved(child.streak_days);
        }
      }

      // Preload curriculum for offline use
      if (childId) {
        offlineAPI.preloadForOfflineUse(childId).catch(error => {
          console.warn('Failed to preload offline data:', error);
        });
      }
    } catch (error: any) {
      const isOfflineError =
        error.message.includes('cached') || error.message.includes('offline');
      Alert.alert(
        isOfflineError ? 'Offline Mode' : 'Error',
        isOfflineError
          ? 'Using cached data. Some information may be outdated.'
          : 'Failed to load dashboard data',
      );
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();

    // Listen for avatar animation events
    const handleAvatarAnimation = (event: AvatarAnimationEvent) => {
      setAvatarAnimation(event.animation);
      setTimeout(() => setAvatarAnimation(null), event.duration || 2000);
    };

    activityCompletionService.on('avatarAnimation', handleAvatarAnimation);

    // Trigger welcome animation on load
    setTimeout(() => {
      setAvatarAnimation('waving');
      setTimeout(() => setAvatarAnimation(null), 2000);
    }, 1000);

    return () => {
      activityCompletionService.off('avatarAnimation', handleAvatarAnimation);
    };
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    // Trigger a cheering animation on refresh
    setAvatarAnimation('cheering');
    setTimeout(() => setAvatarAnimation(null), 3000);
    loadDashboard();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: logout, style: 'destructive'},
    ]);
  };

  const startActivity = (activityType: string) => {
    // Trigger a waving animation when starting an activity
    setAvatarAnimation('waving');
    setTimeout(() => setAvatarAnimation(null), 3000);
    navigation.navigate('Activity', {activityType});
  };

  const openAvatarCustomization = () => {
    navigation.navigate('AvatarCustomization');
  };

  const openAccessibilitySettings = () => {
    navigation.navigate('AccessibilitySettings');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading your learning adventure...
        </Text>
      </View>
    );
  }

  const child = dashboardData?.child;
  const activities = dashboardData?.week_activities;
  const progress = dashboardData?.progress;
  const recommendation = dashboardData?.recommendation;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <View style={styles.avatarSection}>
              <EnhancedAvatarPreview
                avatar={DEFAULT_AVATAR}
                size="medium"
                onPress={openAvatarCustomization}
                showEdit={true}
                triggerAnimation={avatarAnimation}
                interactive={true}
                autoAnimate={false}
              />
            </View>
            <View style={styles.greetingSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.childName}>
                {child?.name || 'Young Learner'}! 🌟
              </Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{child?.total_stars || 0}</Text>
              <Text style={styles.statLabel}>Stars</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{child?.streak_days || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{child?.current_week || 0}</Text>
              <Text style={styles.statLabel}>Week</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.accessibilityButton}
            onPress={openAccessibilitySettings}>
            <Text style={styles.headerButtonText}>♿</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Section */}
      {progress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress 📊</Text>
          <View style={styles.progressContainer}>
            {Object.entries(progress).map(([skill, value]) => (
              <View key={skill} style={styles.progressItem}>
                <Text style={styles.progressSkill}>
                  {skill.replace('_', ' ')}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, {width: `${value}%`}]} />
                </View>
                <Text style={styles.progressValue}>{value.toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Activities Section */}
      {activities && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Activities 🎯</Text>
          <View style={styles.activitiesContainer}>
            {Object.entries(activities).map(([activityType, activityData]) => (
              <TouchableOpacity
                key={activityType}
                style={styles.activityCard}
                onPress={() => startActivity(activityType)}>
                <Text style={styles.activityTitle}>
                  {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
                </Text>
                <Text style={styles.activityDescription}>
                  {(activityData as any)?.listen_identify?.instruction ||
                    "Let's practice!"}
                </Text>
                <View style={styles.activityFooter}>
                  <Text style={styles.activityProgress}>
                    Progress:{' '}
                    {((activityData as any)?.listen_identify
                      ?.difficulty_progression || 0) * 100}
                    %
                  </Text>
                  <Text style={styles.activityArrow}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recommendation Section */}
      {recommendation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You 💡</Text>
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationSkill}>
              {recommendation.recommended_skill.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.recommendationReason}>
              {recommendation.reason}
            </Text>
            <TouchableOpacity
              style={styles.recommendationButton}
              onPress={() => startActivity(recommendation.recommended_skill)}>
              <Text style={styles.recommendationButtonText}>
                Start Learning!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Nursery Rhyme Section */}
      {dashboardData?.nursery_rhyme && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Rhyme 🎵</Text>
          <View style={styles.rhymeCard}>
            <Text style={styles.rhymeTitle}>
              {dashboardData.nursery_rhyme.title}
            </Text>
            <Text style={styles.rhymeLyrics}>
              {dashboardData.nursery_rhyme.lyrics}
            </Text>
            <Text style={styles.rhymeMotions}>
              Motions: {dashboardData.nursery_rhyme.motions}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.childPrimary,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarSection: {
    marginRight: 15,
  },
  greetingSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  headerButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  accessibilityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  progressContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 15,
  },
  progressItem: {
    marginBottom: 15,
  },
  progressSkill: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lighter,
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.childSecondary,
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  activitiesContainer: {
    gap: 15,
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.childAccent,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityProgress: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activityArrow: {
    fontSize: 16,
    color: Colors.childAccent,
  },
  recommendationCard: {
    backgroundColor: Colors.childAccent,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  recommendationSkill: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
  },
  recommendationButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  recommendationButtonText: {
    color: Colors.childAccent,
    fontWeight: 'bold',
  },
  rhymeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  rhymeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  rhymeLyrics: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  rhymeMotions: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default DashboardScreen;
