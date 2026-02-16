import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Vibration,
} from 'react-native';
import {
  voiceManager,
  VoicePrompt,
  VoiceResponse,
} from '../services/VoiceManager';
import {Colors} from '../utils/Colors';

interface VoiceRecorderProps {
  prompt: VoicePrompt;
  sessionId: number;
  onResult: (response: VoiceResponse) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  autoStart?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  prompt,
  sessionId,
  onResult,
  onError,
  disabled = false,
  autoStart = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceResponse | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const startGlowAnimation = useCallback(
    (_success: boolean) => {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [glowAnim],
  );

  const handleVoiceResult = useCallback(
    (response: VoiceResponse) => {
      setLastResult(response);
      setIsListening(false);
      setIsProcessing(false);

      // Visual feedback
      startGlowAnimation(response.isCorrect);

      // Haptic feedback
      if (response.isCorrect) {
        Vibration.vibrate([100, 50, 100]); // Success pattern
      } else {
        Vibration.vibrate(200); // Try again pattern
      }

      onResult(response);
    },
    [onResult, startGlowAnimation],
  );

  const handleVoiceError = useCallback(
    (error: string) => {
      setIsListening(false);
      setIsProcessing(false);

      console.error('Voice error:', error);
      onError?.(error);

      // Show user-friendly error - we'll define startListening reference later
      Alert.alert('Voice Recognition Error', error, [
        {text: 'Try Again', onPress: () => {}}, // Placeholder, will be handled by retry button
        {text: 'Cancel', style: 'cancel'},
      ]);
    },
    [onError],
  );

  const startListening = useCallback(async () => {
    if (disabled || isListening || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      const success = await voiceManager.startListening(prompt, sessionId, {
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        onListeningChange: setIsListening,
      });

      if (!success) {
        setIsProcessing(false);
        return;
      }

      // Haptic feedback
      Vibration.vibrate(50);
      setIsProcessing(false);
    } catch (error: any) {
      console.error('Failed to start listening:', error);
      setIsProcessing(false);
      handleVoiceError(error.message || 'Failed to start voice recognition');
    }
  }, [
    disabled,
    isListening,
    isProcessing,
    prompt,
    sessionId,
    handleVoiceError,
    handleVoiceResult,
  ]);

  const startPulseAnimation = useCallback(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    const ripple = Animated.loop(
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    );

    pulse.start();
    ripple.start();
  }, [pulseAnim, rippleAnim]);

  const stopPulseAnimation = useCallback(() => {
    pulseAnim.setValue(1);
    rippleAnim.setValue(0);
  }, [pulseAnim, rippleAnim]);

  useEffect(() => {
    if (autoStart && !disabled) {
      startListening();
    }

    return () => {
      voiceManager.destroyVoice();
    };
  }, [autoStart, disabled, startListening]);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening, startPulseAnimation, stopPulseAnimation]);

  const stopListening = async () => {
    if (!isListening) {
      return;
    }

    await voiceManager.stopListening();
    setIsListening(false);
  };

  const getMicrophoneIcon = () => {
    if (isProcessing) {
      return '⏳';
    }
    if (isListening) {
      return '🎤';
    }
    return '🎙️';
  };

  const getStatusText = () => {
    if (isProcessing) {
      return 'Getting ready...';
    }
    if (isListening) {
      return 'Listening... Speak now!';
    }
    if (lastResult) {
      return lastResult.isCorrect ? 'Great job! 🌟' : 'Try again! 💪';
    }
    return 'Tap to speak';
  };

  const getButtonStyle = () => {
    if (disabled) {
      return [styles.micButton, styles.micButtonDisabled];
    }
    if (isListening) {
      return [styles.micButton, styles.micButtonListening];
    }
    if (lastResult?.isCorrect) {
      return [styles.micButton, styles.micButtonSuccess];
    }
    return styles.micButton;
  };

  return (
    <View style={styles.container}>
      {/* Prompt Display */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>{prompt.prompt}</Text>
        <Text style={styles.difficultyBadge}>
          {prompt.difficulty.toUpperCase()}
        </Text>
      </View>

      {/* Voice Recorder Button */}
      <View style={styles.micContainer}>
        {/* Ripple Effect */}
        {isListening && (
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{scale: rippleAnim}],
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 0],
                }),
              },
            ]}
          />
        )}

        {/* Glow Effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowAnim,
              backgroundColor: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  'transparent',
                  lastResult?.isCorrect ? Colors.success : Colors.warning,
                ],
              }),
            },
          ]}
        />

        {/* Main Button */}
        <Animated.View style={{transform: [{scale: pulseAnim}]}}>
          <TouchableOpacity
            style={getButtonStyle()}
            onPress={isListening ? stopListening : startListening}
            disabled={disabled || isProcessing}
            activeOpacity={0.8}>
            <Text style={styles.micIcon}>{getMicrophoneIcon()}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Status Text */}
      <Text style={styles.statusText}>{getStatusText()}</Text>

      {/* Last Result Display */}
      {lastResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.transcriptLabel}>You said:</Text>
          <Text style={styles.transcriptText}>"{lastResult.transcript}"</Text>

          {lastResult.aiAnalysis && (
            <View style={styles.aiAnalysisContainer}>
              <Text style={styles.aiAnalysisTitle}>AI Analysis:</Text>
              <Text style={styles.aiAnalysisText}>
                Accuracy: {lastResult.aiAnalysis.phonemeAccuracy}%
              </Text>
              <Text style={styles.aiAnalysisText}>
                {lastResult.aiAnalysis.articulation}
              </Text>

              {lastResult.aiAnalysis.suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Tips:</Text>
                  {lastResult.aiAnalysis.suggestions.map(
                    (suggestion, index) => (
                      <Text key={index} style={styles.suggestionText}>
                        • {suggestion}
                      </Text>
                    ),
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          💡 Hold the button and speak clearly. The AI will analyze your
          response!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  promptContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  difficultyBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.lighter,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  micContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  micButtonListening: {
    backgroundColor: Colors.error,
  },
  micButtonSuccess: {
    backgroundColor: Colors.success,
  },
  micButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  micIcon: {
    fontSize: 32,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  resultContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  transcriptText: {
    fontSize: 16,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: 15,
  },
  aiAnalysisContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 15,
  },
  aiAnalysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  aiAnalysisText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  suggestionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 10,
    marginBottom: 3,
  },
  instructionsContainer: {
    backgroundColor: Colors.lighter,
    borderRadius: 10,
    padding: 15,
    width: '100%',
  },
  instructionsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default VoiceRecorder;
