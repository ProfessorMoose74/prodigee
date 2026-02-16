import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {
  voiceManager,
  VoicePrompt,
  VoiceResponse,
} from '../services/VoiceManager';
import {socketService} from '../services/socket';
import VoiceRecorder from '../components/VoiceRecorder';
import {Colors} from '../utils/Colors';

type VoiceActivityScreenRouteProp = RouteProp<RootStackParamList, 'Activity'>;
type VoiceActivityScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Activity'
>;

const VoiceActivityScreen = () => {
  const route = useRoute<VoiceActivityScreenRouteProp>();
  const navigation = useNavigation<VoiceActivityScreenNavigationProp>();
  const {activityType} = route.params;

  const [currentPrompt, setCurrentPrompt] = useState<VoicePrompt | null>(null);
  const [sessionId] = useState(Date.now()); // Simple session ID
  const [completedPrompts, setCompletedPrompts] = useState<VoiceResponse[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);

  const promptsPerActivity = 5; // Number of prompts per session

  const completeActivity = useCallback(async () => {
    const averageAccuracy =
      completedPrompts.length > 0 ? totalScore / completedPrompts.length : 0;

    const correctAnswers = completedPrompts.filter(r => r.isCorrect).length;
    const starsEarned = Math.min(
      3,
      Math.floor((correctAnswers / promptsPerActivity) * 3) + 1,
    );

    // Notify parents of completion
    try {
      await socketService.notifyActivityComplete(`voice_${activityType}`, {
        accuracy: averageAccuracy,
        stars_earned: starsEarned,
        duration: 0, // Could track total session time
      });
    } catch (error) {
      console.warn('Failed to notify activity completion:', error);
    }

    Alert.alert(
      'Activity Complete! 🌟',
      `Great job practicing ${activityType}!\n\n` +
        `Correct answers: ${correctAnswers}/${promptsPerActivity}\n` +
        `Average accuracy: ${averageAccuracy.toFixed(1)}%\n` +
        `Stars earned: ${starsEarned}`,
      [
        {
          text: 'Continue Learning',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [
    completedPrompts,
    totalScore,
    activityType,
    promptsPerActivity,
    navigation,
  ]);

  const generateNextPrompt = useCallback(() => {
    if (currentPromptIndex >= promptsPerActivity) {
      completeActivity();
      return;
    }

    const difficulties: ('easy' | 'medium' | 'hard')[] = [
      'easy',
      'easy',
      'medium',
      'medium',
      'hard',
    ];
    const difficulty = difficulties[currentPromptIndex] || 'easy';

    const prompt = voiceManager.generatePrompt(activityType, difficulty);
    setCurrentPrompt(prompt);
  }, [currentPromptIndex, activityType, promptsPerActivity, completeActivity]);

  useEffect(() => {
    if (!showPrivacyNotice) {
      generateNextPrompt();

      // Notify parents that voice activity started (only on first prompt)
      if (currentPromptIndex === 0) {
        socketService
          .notifyActivityStart(`voice_${activityType}`)
          .catch(error => {
            console.warn('Failed to notify activity start:', error);
          });
      }
    }
  }, [showPrivacyNotice, currentPromptIndex, generateNextPrompt, activityType]);

  const handleVoiceResult = (response: VoiceResponse) => {
    const updatedResponses = [...completedPrompts, response];
    setCompletedPrompts(updatedResponses);

    // Calculate score (only accuracy is stored, not voice data)
    if (response.isCorrect) {
      setTotalScore(totalScore + (response.aiAnalysis?.phonemeAccuracy || 0));
    }

    // Progress to next prompt after a delay
    setTimeout(() => {
      setCurrentPromptIndex(currentPromptIndex + 1);
    }, 2000);
  };

  const handleVoiceError = (error: string) => {
    Alert.alert(
      'Voice Recognition Error',
      `${error}\n\nDon't worry, you can try again or skip this question.`,
      [
        {text: 'Try Again', style: 'default'},
        {
          text: 'Skip Question',
          onPress: () => setCurrentPromptIndex(currentPromptIndex + 1),
        },
      ],
    );
  };

  const dismissPrivacyNotice = () => {
    setShowPrivacyNotice(false);
  };

  if (showPrivacyNotice) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.privacyContainer}>
          <Text style={styles.privacyTitle}>🔒 Voice Privacy Protection</Text>

          <View style={styles.privacySection}>
            <Text style={styles.privacyHeader}>Your Voice Stays Private</Text>
            <Text style={styles.privacyText}>
              • Voice-to-text conversion happens on YOUR device only{'\n'}• No
              voice recordings are ever sent to servers{'\n'}• Only text
              transcripts are sent for AI analysis{'\n'}• No audio files stored
              or transmitted anywhere
            </Text>
          </View>

          <View style={styles.privacySection}>
            <Text style={styles.privacyHeader}>COPPA Compliant</Text>
            <Text style={styles.privacyText}>
              This app follows strict children's privacy laws. Your voice
              becomes text on your device, then our AI (Gemma3 27B) analyzes the
              text to help you learn better.
            </Text>
          </View>

          <View style={styles.privacySection}>
            <Text style={styles.privacyHeader}>What We Do Track</Text>
            <Text style={styles.privacyText}>
              • How many questions you answer correctly{'\n'}• How long
              activities take{'\n'}• Which skills you're improving{'\n'}•
              Learning progress over time{'\n'}
              {'\n'}
              This helps make the app better without compromising your privacy!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={dismissPrivacyNotice}>
            <Text style={styles.continueButtonText}>
              I Understand - Start Learning!
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressContainer}>
        <Text style={styles.activityTitle}>
          {activityType.charAt(0).toUpperCase() + activityType.slice(1)}{' '}
          Practice
        </Text>
        <Text style={styles.progressText}>
          Question {currentPromptIndex + 1} of {promptsPerActivity}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {width: `${(currentPromptIndex / promptsPerActivity) * 100}%`},
            ]}
          />
        </View>
      </View>

      {/* Voice Recorder */}
      {currentPrompt && (
        <VoiceRecorder
          prompt={currentPrompt}
          sessionId={sessionId}
          onResult={handleVoiceResult}
          onError={handleVoiceError}
          autoStart={false}
        />
      )}

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreTitle}>Your Progress</Text>
        <View style={styles.scoreStats}>
          <View style={styles.scoreStat}>
            <Text style={styles.scoreValue}>
              {completedPrompts.filter(r => r.isCorrect).length}
            </Text>
            <Text style={styles.scoreLabel}>Correct</Text>
          </View>
          <View style={styles.scoreStat}>
            <Text style={styles.scoreValue}>{completedPrompts.length}</Text>
            <Text style={styles.scoreLabel}>Completed</Text>
          </View>
          <View style={styles.scoreStat}>
            <Text style={styles.scoreValue}>
              {completedPrompts.length > 0
                ? Math.round(totalScore / completedPrompts.length)
                : 0}
              %
            </Text>
            <Text style={styles.scoreLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      {/* Privacy Reminder */}
      <View style={styles.privacyReminder}>
        <Text style={styles.privacyReminderText}>
          🔒 Voice-to-text on device only - No audio transmitted to servers
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
  privacyContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  privacyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  privacySection: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  privacyHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  privacyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: Colors.childPrimary,
    padding: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  scoreContainer: {
    backgroundColor: Colors.surface,
    margin: 20,
    borderRadius: 15,
    padding: 20,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  scoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreStat: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.childSecondary,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  privacyReminder: {
    backgroundColor: Colors.lighter,
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  privacyReminderText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VoiceActivityScreen;
