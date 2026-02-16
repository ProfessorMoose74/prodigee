import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {offlineAPI} from '../services/OfflineAPI';
import {socketService} from '../services/socket';
import {Colors} from '../utils/Colors';

type ActivityScreenRouteProp = RouteProp<RootStackParamList, 'Activity'>;
type ActivityScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Activity'
>;

const ActivityScreen = () => {
  const route = useRoute<ActivityScreenRouteProp>();
  const navigation = useNavigation<ActivityScreenNavigationProp>();
  const {activityType} = route.params;

  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && startTime) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const startActivity = async () => {
    setIsActive(true);
    setStartTime(new Date());
    setTimeElapsed(0);
    setScore(0);
    setAttempts(0);

    // Notify parents in real-time that child started activity
    try {
      await socketService.notifyActivityStart(activityType);
    } catch (error) {
      console.warn('Failed to send activity start notification:', error);
    }
  };

  const endActivity = async () => {
    if (!startTime) {
      return;
    }

    setIsActive(false);
    const duration = (Date.now() - startTime.getTime()) / 1000; // seconds
    const accuracy = attempts > 0 ? (score / attempts) * 100 : 0;
    const starsEarned = Math.min(3, Math.floor(accuracy / 25) + 1);

    try {
      const activityResults = {
        accuracy,
        duration,
        stars_earned: starsEarned,
        engagement: Math.min(100, 50 + score * 10), // Mock engagement score
      };

      // Save to backend (with offline support)
      const result = await offlineAPI.completeActivity(
        activityType,
        activityResults,
      );

      // Notify parents in real-time about completion
      try {
        await socketService.notifyActivityComplete(
          activityType,
          activityResults,
        );
      } catch (socketError) {
        console.warn('Failed to send completion notification:', socketError);
      }

      // Show success message (different for offline vs online)
      const isOffline = result.offline;
      Alert.alert(
        'Great Job! 🌟',
        `You earned ${starsEarned} stars!\nAccuracy: ${accuracy.toFixed(
          1,
        )}%\nTime: ${duration.toFixed(0)}s` +
          (isOffline ? '\n\n📱 Saved offline - will sync when online!' : ''),
        [
          {
            text: 'Continue Learning',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save activity results');
      console.error('Activity completion error:', error);
    }
  };

  const handleCorrectAnswer = () => {
    setScore(score + 1);
    setAttempts(attempts + 1);
  };

  const handleIncorrectAnswer = () => {
    setAttempts(attempts + 1);
  };

  const getActivityColor = () => {
    switch (activityType) {
      case 'rhyming':
        return Colors.rhyming;
      case 'blending':
        return Colors.blending;
      case 'segmenting':
        return Colors.segmenting;
      case 'manipulation':
        return Colors.manipulation;
      default:
        return Colors.childPrimary;
    }
  };

  const getActivityIcon = () => {
    switch (activityType) {
      case 'rhyming':
        return '🎵';
      case 'blending':
        return '🔗';
      case 'segmenting':
        return '✂️';
      case 'manipulation':
        return '🎯';
      default:
        return '📚';
    }
  };

  const getActivityDescription = () => {
    switch (activityType) {
      case 'rhyming':
        return 'Listen carefully and find words that sound alike!';
      case 'blending':
        return 'Put sounds together to make words!';
      case 'segmenting':
        return 'Break words into their individual sounds!';
      case 'manipulation':
        return 'Change sounds to make new words!';
      default:
        return "Let's practice together!";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: getActivityColor()}]}>
        <Text style={styles.activityIcon}>{getActivityIcon()}</Text>
        <Text style={styles.activityTitle}>
          {activityType.charAt(0).toUpperCase() + activityType.slice(1)}{' '}
          Practice
        </Text>
        <Text style={styles.activityDescription}>
          {getActivityDescription()}
        </Text>

        {isActive && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attempts}</Text>
              <Text style={styles.statLabel}>Attempts</Text>
            </View>
          </View>
        )}
      </View>

      {/* Activity Content */}
      <View style={styles.content}>
        {!isActive ? (
          <View style={styles.startContainer}>
            <Text style={styles.readyText}>Ready to start learning?</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={startActivity}>
              <Text style={styles.startButtonText}>Start Activity</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activityContainer}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>Do these words rhyme?</Text>
              <View style={styles.wordsContainer}>
                <Text style={styles.word}>CAT</Text>
                <Text style={styles.word}>HAT</Text>
              </View>
            </View>

            <View style={styles.answersContainer}>
              <TouchableOpacity
                style={[styles.answerButton, styles.correctButton]}
                onPress={handleCorrectAnswer}>
                <Text style={styles.answerButtonText}>✓ Yes, they rhyme!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.answerButton, styles.incorrectButton]}
                onPress={handleIncorrectAnswer}>
                <Text style={styles.answerButtonText}>
                  ✗ No, they don't rhyme
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.endButton} onPress={endActivity}>
              <Text style={styles.endButtonText}>Finish Activity</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to Play:</Text>
        <Text style={styles.instructionText}>
          • Listen to the words carefully{'\n'}• Decide if they sound similar
          {'\n'}• Tap your answer{'\n'}• Have fun learning!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyText: {
    fontSize: 20,
    color: Colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: Colors.childPrimary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityContainer: {
    flex: 1,
  },
  questionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  wordsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.childPrimary,
    backgroundColor: Colors.lighter,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
  },
  answersContainer: {
    gap: 15,
    marginBottom: 30,
  },
  answerButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  correctButton: {
    backgroundColor: Colors.childSuccess,
  },
  incorrectButton: {
    backgroundColor: Colors.childWarning,
  },
  answerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: Colors.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 15,
    borderRadius: 15,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default ActivityScreen;
