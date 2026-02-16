import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {api} from '../services/api';
import {Colors} from '../utils/Colors';
import {NotificationHistory} from '../components/NotificationCenter';

interface AnalyticsDashboard {
  parent_id: number;
  summary: {
    total_children: number;
    total_learning_sessions: number;
    completed_sessions: number;
    completion_rate: number;
    average_engagement_score: number;
  };
  recent_assessments: Array<{
    assessment_id: number;
    child_name: string;
    assessment_type: string;
    overall_score: number;
    administered_at: string;
  }>;
}

const ParentDashboardScreen = () => {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboard | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {logout, user} = useAuth();

  const loadDashboard = async () => {
    try {
      const data = await api.getAnalyticsDashboard();
      setDashboardData(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load parent dashboard data');
      console.error('Parent dashboard error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: logout, style: 'destructive'},
    ]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading parent dashboard...</Text>
      </View>
    );
  }

  const summary = dashboardData?.summary;
  const assessments = dashboardData?.recent_assessments || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Parent Dashboard</Text>
          <Text style={styles.parentName}>
            Welcome, {user?.name || 'Parent'}!
          </Text>
          <Text style={styles.headerSubtitle}>
            Monitor your child's learning progress
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      {summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Summary 📊</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{summary.total_children}</Text>
              <Text style={styles.statLabel}>Children</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {summary.total_learning_sessions}
              </Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {summary.completed_sessions}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {summary.completion_rate.toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
          </View>

          <View style={styles.engagementCard}>
            <Text style={styles.engagementTitle}>Average Engagement Score</Text>
            <Text style={styles.engagementScore}>
              {summary.average_engagement_score.toFixed(1)}/10
            </Text>
            <View style={styles.engagementBar}>
              <View
                style={[
                  styles.engagementFill,
                  {width: `${(summary.average_engagement_score / 10) * 100}%`},
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* Recent Assessments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Assessments 📝</Text>
        {assessments.length > 0 ? (
          <View style={styles.assessmentsContainer}>
            {assessments.map(assessment => (
              <View
                key={assessment.assessment_id}
                style={styles.assessmentCard}>
                <View style={styles.assessmentHeader}>
                  <Text style={styles.assessmentChildName}>
                    {assessment.child_name}
                  </Text>
                  <Text style={styles.assessmentScore}>
                    {assessment.overall_score.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.assessmentType}>
                  {assessment.assessment_type.charAt(0).toUpperCase() +
                    assessment.assessment_type.slice(1)}{' '}
                  Assessment
                </Text>
                <Text style={styles.assessmentDate}>
                  {formatDate(assessment.administered_at)}
                </Text>
                <View style={styles.scoreBar}>
                  <View
                    style={[
                      styles.scoreFill,
                      {
                        width: `${assessment.overall_score}%`,
                        backgroundColor:
                          assessment.overall_score >= 80
                            ? Colors.success
                            : assessment.overall_score >= 60
                            ? Colors.warning
                            : Colors.error,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noAssessmentsContainer}>
            <Text style={styles.noAssessmentsText}>No recent assessments</Text>
            <Text style={styles.noAssessmentsSubtext}>
              Your child's assessments will appear here once they complete
              learning activities.
            </Text>
          </View>
        )}
      </View>

      {/* Real-time Notifications */}
      <NotificationHistory />

      {/* Learning Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Insights 💡</Text>
        <View style={styles.insightsContainer}>
          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>🎯</Text>
            <Text style={styles.insightTitle}>Progress Tracking</Text>
            <Text style={styles.insightDescription}>
              Your child's learning progress is automatically tracked and
              analyzed to provide personalized recommendations.
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>📱</Text>
            <Text style={styles.insightTitle}>Real-time Monitoring</Text>
            <Text style={styles.insightDescription}>
              Receive instant notifications when your child starts or completes
              learning activities.
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>📈</Text>
            <Text style={styles.insightTitle}>Detailed Analytics</Text>
            <Text style={styles.insightDescription}>
              Access comprehensive reports on learning patterns, strengths, and
              areas for improvement.
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions ⚡</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              📊 View Detailed Reports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>👶 Add Another Child</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              ⚙️ Settings & Preferences
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: Colors.parentPrimary,
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
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  parentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.parentSecondary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  engagementCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  engagementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  engagementScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.parentSecondary,
    marginBottom: 10,
  },
  engagementBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.lighter,
    borderRadius: 4,
  },
  engagementFill: {
    height: '100%',
    backgroundColor: Colors.parentSecondary,
    borderRadius: 4,
  },
  assessmentsContainer: {
    gap: 15,
  },
  assessmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.parentSecondary,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  assessmentChildName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  assessmentScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.parentSecondary,
  },
  assessmentType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  assessmentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  scoreBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.lighter,
    borderRadius: 3,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  noAssessmentsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
  },
  noAssessmentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  noAssessmentsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsContainer: {
    gap: 15,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  insightIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: Colors.parentSecondary,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParentDashboardScreen;
