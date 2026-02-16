export interface AccessibilitySettings {
  // Hearing accessibility
  hearingImpaired: boolean;
  visualSoundIndicators: boolean;
  hapticFeedback: boolean;
  closedCaptions: boolean;
  signLanguageSupport: boolean;
  vibrationPatterns: boolean;

  // Visual accessibility (for future expansion)
  highContrast: boolean;
  largerText: boolean;
  reducedMotion: boolean;

  // Cognitive accessibility (for future expansion)
  simplifiedInterface: boolean;
  extendedTimeouts: boolean;
  repeatInstructions: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  hearingImpaired: false,
  visualSoundIndicators: false,
  hapticFeedback: false,
  closedCaptions: false,
  signLanguageSupport: false,
  vibrationPatterns: false,
  highContrast: false,
  largerText: false,
  reducedMotion: false,
  simplifiedInterface: false,
  extendedTimeouts: false,
  repeatInstructions: false,
};

export interface SoundVisualization {
  id: string;
  type: 'speech' | 'music' | 'effect' | 'notification' | 'instruction';
  visual: 'pulse' | 'wave' | 'glow' | 'bounce' | 'flash';
  color: string;
  intensity: 'low' | 'medium' | 'high';
  duration: number;
  description: string;
}

export interface HapticPattern {
  id: string;
  name: string;
  pattern: number[]; // Array of durations in milliseconds [vibrate, pause, vibrate, pause, ...]
  description: string;
}

export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  notification: {
    id: 'notification',
    name: 'Notification',
    pattern: [100],
    description: 'Single short vibration for notifications',
  },
  success: {
    id: 'success',
    name: 'Success',
    pattern: [200, 100, 200],
    description: 'Double vibration for success/completion',
  },
  error: {
    id: 'error',
    name: 'Error',
    pattern: [500],
    description: 'Long vibration for errors',
  },
  attention: {
    id: 'attention',
    name: 'Attention',
    pattern: [100, 50, 100, 50, 100],
    description: 'Multiple short vibrations for attention',
  },
  instruction: {
    id: 'instruction',
    name: 'Instruction',
    pattern: [150, 100, 150, 300, 150],
    description: 'Pattern for new instructions',
  },
  celebration: {
    id: 'celebration',
    name: 'Celebration',
    pattern: [100, 50, 100, 50, 100, 50, 300],
    description: 'Celebratory vibration pattern',
  },
};

export interface SignLanguageGesture {
  id: string;
  word: string;
  description: string;
  animationSequence: string[]; // Array of avatar bone positions/rotations
  category:
    | 'greeting'
    | 'instruction'
    | 'emotion'
    | 'number'
    | 'letter'
    | 'common';
}

export const COMMON_SIGN_LANGUAGE_GESTURES: Record<
  string,
  SignLanguageGesture
> = {
  hello: {
    id: 'hello',
    word: 'Hello',
    description: 'Greeting gesture - open hand wave',
    animationSequence: ['wave_open_hand'],
    category: 'greeting',
  },
  good: {
    id: 'good',
    word: 'Good',
    description: 'Thumbs up gesture',
    animationSequence: ['thumbs_up'],
    category: 'emotion',
  },
  yes: {
    id: 'yes',
    word: 'Yes',
    description: 'Nodding head gesture',
    animationSequence: ['nod_head'],
    category: 'common',
  },
  no: {
    id: 'no',
    word: 'No',
    description: 'Shaking head gesture',
    animationSequence: ['shake_head'],
    category: 'common',
  },
  please: {
    id: 'please',
    word: 'Please',
    description: 'Open palm circling chest',
    animationSequence: ['palm_circle_chest'],
    category: 'common',
  },
  thankyou: {
    id: 'thankyou',
    word: 'Thank You',
    description: 'Hand from chin outward',
    animationSequence: ['hand_chin_out'],
    category: 'common',
  },
  help: {
    id: 'help',
    word: 'Help',
    description: 'One hand supporting the other',
    animationSequence: ['support_hands'],
    category: 'instruction',
  },
  start: {
    id: 'start',
    word: 'Start',
    description: 'Index finger turning motion',
    animationSequence: ['finger_turn'],
    category: 'instruction',
  },
  stop: {
    id: 'stop',
    word: 'Stop',
    description: 'Open palm facing forward',
    animationSequence: ['palm_forward'],
    category: 'instruction',
  },
  listen: {
    id: 'listen',
    word: 'Listen',
    description: 'Hand cupped to ear',
    animationSequence: ['hand_to_ear'],
    category: 'instruction',
  },
};
