import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';
import {Platform, PermissionsAndroid} from 'react-native';
import {api} from './api';

export interface VoiceResponse {
  transcript: string;
  confidence: number;
  isCorrect: boolean;
  feedback: string;
  aiAnalysis?: {
    phonemeAccuracy: number;
    articulation: string;
    suggestions: string[];
    emotionalState: string;
  };
}

export interface VoicePrompt {
  id: string;
  type: 'rhyming' | 'blending' | 'segmenting' | 'manipulation';
  prompt: string;
  expectedResponse: string;
  alternatives?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  aiInstructions?: string;
}

class VoiceManager {
  private isListening = false;
  private currentPrompt: VoicePrompt | null = null;
  private sessionId: number | null = null;
  private onResult?: (response: VoiceResponse) => void;
  private onError?: (error: string) => void;
  private onListeningChange?: (listening: boolean) => void;

  constructor() {
    this.setupVoiceCallbacks();
  }

  private setupVoiceCallbacks() {
    Voice.onSpeechStart = () => {
      console.log('Voice: Speech started');
      this.isListening = true;
      this.onListeningChange?.(true);
    };

    Voice.onSpeechEnd = () => {
      console.log('Voice: Speech ended');
      this.isListening = false;
      this.onListeningChange?.(false);
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      console.log('Voice error:', event.error);
      this.isListening = false;
      this.onListeningChange?.(false);
      this.handleVoiceError(
        event.error?.message || 'Speech recognition failed',
      );
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      console.log('Voice results:', event.value);
      if (event.value && event.value.length > 0) {
        this.processVoiceResult(event.value[0]);
      }
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      console.log('Partial results:', event.value);
      // Could show real-time transcription here
    };
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message:
              'Elemental Genius needs access to your microphone for voice learning activities.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS permissions handled via Info.plist
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async initializeVoiceEngine(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      const available = await Voice.isAvailable();
      if (!available) {
        throw new Error('Speech recognition not available on this device');
      }

      return true;
    } catch (error: any) {
      console.error('Voice initialization failed:', error);
      this.onError?.(error.message || 'Failed to initialize voice recognition');
      return false;
    }
  }

  async startListening(
    prompt: VoicePrompt,
    sessionId: number,
    callbacks: {
      onResult: (response: VoiceResponse) => void;
      onError?: (error: string) => void;
      onListeningChange?: (listening: boolean) => void;
    },
  ): Promise<boolean> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      this.currentPrompt = prompt;
      this.sessionId = sessionId;
      this.onResult = callbacks.onResult;
      this.onError = callbacks.onError;
      this.onListeningChange = callbacks.onListeningChange;

      const initialized = await this.initializeVoiceEngine();
      if (!initialized) {
        return false;
      }

      await Voice.start('en-US', {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_CALLING_PACKAGE: 'com.elementalgenius',
        EXTRA_PARTIAL_RESULTS: true,
        REQUEST_PERMISSIONS_AUTO: true,
      });

      return true;
    } catch (error: any) {
      console.error('Failed to start listening:', error);
      this.handleVoiceError(
        error.message || 'Failed to start voice recognition',
      );
      return false;
    }
  }

  async stopListening(): Promise<void> {
    try {
      if (this.isListening) {
        await Voice.stop();
      }
      this.isListening = false;
      this.onListeningChange?.(false);
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }

  async destroyVoice(): Promise<void> {
    try {
      await Voice.destroy();
      this.isListening = false;
      this.currentPrompt = null;
      this.sessionId = null;
    } catch (error) {
      console.error('Failed to destroy voice:', error);
    }
  }

  private async processVoiceResult(transcript: string): Promise<void> {
    if (!this.currentPrompt || !this.sessionId) {
      console.error('No active prompt or session');
      return;
    }

    const startTime = Date.now();

    try {
      // COPPA COMPLIANCE: Voice-to-text happens locally, only TEXT sent to server
      // NO audio files transmitted - only text transcripts for AI analysis

      // Send transcript (text only) to Gemma3 27B on your servers for analysis
      const voiceResponse = await this.processAIResponseWithServer(
        transcript,
        this.currentPrompt,
      );

      // Also log anonymized analytics for system improvement
      await this.logAnonymizedAnalytics({
        interaction_type: this.currentPrompt.type,
        response_time_seconds: (Date.now() - startTime) / 1000,
        accuracy_score: voiceResponse.aiAnalysis?.phonemeAccuracy || 0,
        success_achieved: voiceResponse.isCorrect,
        session_id: this.sessionId,
        difficulty_level: this.currentPrompt.difficulty,
        // NO actual_response, NO transcript, NO voice data
      });

      this.onResult?.(voiceResponse);
    } catch (error: any) {
      console.error('Voice processing failed:', error);
      this.handleVoiceError('Failed to process voice response');
    }
  }

  private async processAIResponseWithServer(
    transcript: string,
    prompt: VoicePrompt,
  ): Promise<VoiceResponse> {
    // COPPA COMPLIANCE: Voice-to-text conversion happens on device
    // Only TEXT transcript is sent to Gemma3 27B on your servers
    // NO audio files are ever transmitted - only text for AI analysis

    try {
      // Send transcript to Gemma3 27B for advanced phonemic analysis
      const gemmaResponse = await api.logVoiceInteraction({
        interaction_type: prompt.type,
        prompt_given: prompt.prompt,
        expected_response: prompt.expectedResponse,
        actual_response: transcript, // TEXT ONLY - no audio
        recognition_confidence: 0.95,
        accuracy_score: 0, // Will be calculated by Gemma3 27B
        response_time_seconds: 0, // Will be filled by caller
        success_achieved: false, // Will be determined by Gemma3 27B
        session_id: this.sessionId || 0,
      });

      // Process Gemma3 27B response
      if (gemmaResponse && gemmaResponse.ai_analysis) {
        return this.processGemmaResponse(transcript, gemmaResponse);
      }

      // Fallback to local processing if Gemma3 27B is unavailable
      return this.processLocalFallback(transcript, prompt);
    } catch (error) {
      console.warn('Gemma3 27B unavailable, using local processing:', error);
      // Fallback to local processing
      return this.processLocalFallback(transcript, prompt);
    }
  }

  private processGemmaResponse(
    transcript: string,
    gemmaResponse: any,
  ): VoiceResponse {
    // Process the advanced AI response from Gemma3 27B
    const aiAnalysis = gemmaResponse.ai_analysis || {};

    return {
      transcript: transcript.toLowerCase().trim(),
      confidence: gemmaResponse.recognition_confidence || 0.95,
      isCorrect: gemmaResponse.success_achieved || false,
      feedback:
        aiAnalysis.feedback || this.generateEncouragingFeedback('general'),
      aiAnalysis: {
        phonemeAccuracy: aiAnalysis.phoneme_accuracy || 0,
        articulation: aiAnalysis.articulation_feedback || 'Keep practicing!',
        suggestions: aiAnalysis.improvement_suggestions || [],
        emotionalState: aiAnalysis.emotional_state || 'engaged',
      },
    };
  }

  private processLocalFallback(
    transcript: string,
    prompt: VoicePrompt,
  ): VoiceResponse {
    // Local fallback processing when Gemma3 27B is unavailable
    const cleanTranscript = transcript.toLowerCase().trim();
    const expectedResponse = prompt.expectedResponse.toLowerCase().trim();
    const alternatives =
      prompt.alternatives?.map(alt => alt.toLowerCase().trim()) || [];

    // Basic accuracy calculation
    const isDirectMatch = cleanTranscript === expectedResponse;
    const isAlternativeMatch = alternatives.some(
      alt => cleanTranscript === alt,
    );
    const isPartialMatch =
      cleanTranscript.includes(expectedResponse) ||
      expectedResponse.includes(cleanTranscript);

    let isCorrect = isDirectMatch || isAlternativeMatch;
    let accuracy = 0;
    let feedback = '';

    if (isDirectMatch) {
      accuracy = 100;
      feedback = 'Perfect! You got it exactly right! 🌟';
    } else if (isAlternativeMatch) {
      accuracy = 95;
      feedback = "Excellent! That's another correct answer! 🎉";
    } else if (isPartialMatch) {
      accuracy = 70;
      feedback = "Good try! You're on the right track. Let's practice more! 💪";
      isCorrect = true; // Partial credit
    } else {
      accuracy = 30;
      feedback = this.generateEncouragingFeedback(prompt.type);
    }

    return {
      transcript: cleanTranscript,
      confidence: 0.95,
      isCorrect,
      feedback,
      aiAnalysis: {
        phonemeAccuracy: accuracy,
        articulation: this.analyzeArticulation(transcript, expectedResponse),
        suggestions: this.generateSuggestions(prompt.type, isCorrect),
        emotionalState: this.detectEmotionalState(transcript, accuracy),
      },
    };
  }

  private analyzeArticulation(transcript: string, expected: string): string {
    // Basic articulation analysis for fallback
    if (transcript.length < expected.length) {
      return 'Try speaking a bit louder and clearer';
    }
    return 'Good articulation!';
  }

  private generateSuggestions(
    activityType: string,
    isCorrect: boolean,
  ): string[] {
    // AI-powered suggestions (will be enhanced by Gemma3 27B)
    const baseSuggestions = {
      rhyming: [
        'Listen for the ending sounds of words',
        'Try saying the words slowly',
        'Think about how the words sound alike',
      ],
      blending: [
        'Put the sounds together smoothly',
        'Start with the first sound and add each one',
        'Say it like one word, not separate sounds',
      ],
      segmenting: [
        'Break the word into its sounds',
        'Count each sound you hear',
        'Say each sound separately',
      ],
      manipulation: [
        'Change just one sound in the word',
        'Think about what sound is different',
        'Try the new sound in place of the old one',
      ],
    };

    const suggestions =
      baseSuggestions[activityType as keyof typeof baseSuggestions] || [];

    if (isCorrect) {
      return ['Great job! Keep practicing to get even better!'];
    }

    return suggestions.slice(0, 2); // Return top 2 suggestions
  }

  private detectEmotionalState(_transcript: string, accuracy: number): string {
    // Placeholder for Gemma3 27B emotional analysis
    // Will analyze tone, pace, and confidence
    if (accuracy >= 90) {
      return 'confident';
    }
    if (accuracy >= 70) {
      return 'engaged';
    }
    if (accuracy >= 50) {
      return 'trying';
    }
    return 'needs_encouragement';
  }

  private generateEncouragingFeedback(_activityType: string): string {
    const encouragingMessages = [
      "That's okay! Learning takes practice. Let's try again! 🌟",
      "You're doing great! Every try helps you learn! 💫",
      "Good effort! Let's practice this sound together! 🎵",
      "Nice try! You're getting better each time! 🚀",
      "Keep going! You're learning something new! ⭐",
    ];

    return encouragingMessages[
      Math.floor(Math.random() * encouragingMessages.length)
    ];
  }

  private handleVoiceError(error: string): void {
    console.error('Voice error:', error);
    this.isListening = false;
    this.onListeningChange?.(false);

    // Provide user-friendly error messages
    let userMessage = error;
    if (error.includes('network')) {
      userMessage = 'Please check your internet connection and try again.';
    } else if (error.includes('permission')) {
      userMessage = 'Please allow microphone access to use voice features.';
    } else if (error.includes('not available')) {
      userMessage = 'Speech recognition is not available on this device.';
    }

    this.onError?.(userMessage);
  }

  // Utility methods for activity generation
  generatePrompt(
    activityType: string,
    difficulty: 'easy' | 'medium' | 'hard',
  ): VoicePrompt {
    const prompts = {
      rhyming: {
        easy: {
          prompt: "Do 'cat' and 'hat' rhyme? Say yes or no.",
          expectedResponse: 'yes',
          alternatives: ['yeah', 'yep', 'they rhyme'],
        },
        medium: {
          prompt: "What rhymes with 'dog'?",
          expectedResponse: 'log',
          alternatives: ['log', 'fog', 'hog', 'frog'],
        },
        hard: {
          prompt: "Tell me two words that rhyme with 'night'.",
          expectedResponse: 'light and bright',
          alternatives: ['light', 'bright', 'sight', 'fight', 'right'],
        },
      },
      blending: {
        easy: {
          prompt: 'Put these sounds together: /c/ /a/ /t/',
          expectedResponse: 'cat',
          alternatives: [],
        },
        medium: {
          prompt: 'Blend these sounds: /sh/ /i/ /p/',
          expectedResponse: 'ship',
          alternatives: [],
        },
        hard: {
          prompt: 'What word do you get from: /str/ /ea/ /m/?',
          expectedResponse: 'stream',
          alternatives: [],
        },
      },
    };

    const promptData =
      prompts[activityType as keyof typeof prompts]?.[difficulty];

    return {
      id: `${activityType}_${difficulty}_${Date.now()}`,
      type: activityType as any,
      prompt: promptData?.prompt || "Let's practice together!",
      expectedResponse: promptData?.expectedResponse || '',
      alternatives: promptData?.alternatives,
      difficulty,
      aiInstructions: `Analyze ${activityType} activity response for ${difficulty} level. Focus on phonemic awareness and provide encouraging feedback.`,
    };
  }

  private async logAnonymizedAnalytics(analytics: {
    interaction_type: string;
    response_time_seconds: number;
    accuracy_score: number;
    success_achieved: boolean;
    session_id: number;
    difficulty_level: string;
  }): Promise<void> {
    try {
      // COPPA COMPLIANCE: Only send anonymized analytics - NO voice data
      // This helps improve the learning system without compromising privacy
      await api.logSystemMetric({
        metric_type: 'voice_interaction_analytics',
        metric_name: `${analytics.interaction_type}_${analytics.difficulty_level}`,
        metric_value: analytics.accuracy_score,
        server_component: 'mobile_voice_system',
        context_data: {
          response_time: analytics.response_time_seconds,
          success: analytics.success_achieved,
          session_id: analytics.session_id,
          // NO transcript, NO voice data, NO personal information
        },
      });
    } catch (error) {
      // Fail silently - analytics are optional and shouldn't break voice functionality
      console.warn('Failed to log anonymized analytics:', error);
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getCurrentPrompt(): VoicePrompt | null {
    return this.currentPrompt;
  }
}

export const voiceManager = new VoiceManager();
