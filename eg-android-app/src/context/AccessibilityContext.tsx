import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {Vibration} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccessibilitySettings,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  HAPTIC_PATTERNS,
  SoundVisualization,
} from '../types/Accessibility';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (
    newSettings: Partial<AccessibilitySettings>,
  ) => Promise<void>;

  // Haptic feedback methods
  triggerHaptic: (patternId: keyof typeof HAPTIC_PATTERNS) => void;
  customHaptic: (pattern: number[]) => void;

  // Visual sound indicators
  showSoundVisualization: (sound: SoundVisualization) => void;

  // Sign language support
  showSignLanguageGesture: (gestureId: string) => void;

  // Accessibility helpers
  isHearingAccessibilityEnabled: () => boolean;
  announceToScreen: (text: string) => void;
}

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider',
    );
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    DEFAULT_ACCESSIBILITY_SETTINGS,
  );
  const [soundVisualizationQueue, setSoundVisualizationQueue] = useState<
    SoundVisualization[]
  >([]);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        'accessibility_settings',
      );
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsed});
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (
    newSettings: Partial<AccessibilitySettings>,
  ) => {
    try {
      const updatedSettings = {...settings, ...newSettings};
      setSettings(updatedSettings);
      await AsyncStorage.setItem(
        'accessibility_settings',
        JSON.stringify(updatedSettings),
      );

      // Show confirmation if hearing impaired mode is enabled
      if (newSettings.hearingImpaired) {
        triggerHaptic('success');
        showSoundVisualization({
          id: 'settings_saved',
          type: 'notification',
          visual: 'glow',
          color: '#4CAF50',
          intensity: 'medium',
          duration: 2000,
          description: 'Accessibility settings saved',
        });
      }
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  };

  const triggerHaptic = (patternId: keyof typeof HAPTIC_PATTERNS) => {
    if (!settings.hapticFeedback && !settings.vibrationPatterns) {
      return;
    }

    const pattern = HAPTIC_PATTERNS[patternId];
    if (pattern) {
      Vibration.vibrate(pattern.pattern);
    }
  };

  const customHaptic = (pattern: number[]) => {
    if (!settings.hapticFeedback && !settings.vibrationPatterns) {
      return;
    }
    Vibration.vibrate(pattern);
  };

  const showSoundVisualization = (sound: SoundVisualization) => {
    if (!settings.visualSoundIndicators) {
      return;
    }

    setSoundVisualizationQueue(prev => [...prev, sound]);

    // Remove visualization after duration
    setTimeout(() => {
      setSoundVisualizationQueue(prev => prev.filter(s => s.id !== sound.id));
    }, sound.duration);
  };

  const showSignLanguageGesture = (gestureId: string) => {
    if (!settings.signLanguageSupport) {
      return;
    }

    // This would trigger the avatar to perform sign language animation
    // For now, we'll emit an event that the avatar system can listen to
    console.log(`Sign language gesture requested: ${gestureId}`);
  };

  const isHearingAccessibilityEnabled = (): boolean => {
    return (
      settings.hearingImpaired ||
      settings.visualSoundIndicators ||
      settings.hapticFeedback ||
      settings.closedCaptions ||
      settings.signLanguageSupport
    );
  };

  const announceToScreen = (text: string) => {
    // For screen readers and accessibility announcements
    if (settings.hearingImpaired) {
      // Show visual announcement instead of relying on screen reader audio
      showSoundVisualization({
        id: `announcement_${Date.now()}`,
        type: 'notification',
        visual: 'pulse',
        color: '#2196F3',
        intensity: 'medium',
        duration: 3000,
        description: text,
      });

      triggerHaptic('attention');
    }
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    triggerHaptic,
    customHaptic,
    showSoundVisualization,
    showSignLanguageGesture,
    isHearingAccessibilityEnabled,
    announceToScreen,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}

      {/* Visual Sound Indicators Overlay */}
      {soundVisualizationQueue.length > 0 && (
        <SoundVisualizationOverlay visualizations={soundVisualizationQueue} />
      )}
    </AccessibilityContext.Provider>
  );
};

// Component to show visual sound indicators
interface SoundVisualizationOverlayProps {
  visualizations: SoundVisualization[];
}

const SoundVisualizationOverlay: React.FC<SoundVisualizationOverlayProps> = ({
  visualizations: _visualizations,
}) => {
  // This would render visual indicators for sounds
  // Implementation would depend on the specific visual effects desired
  return null; // Placeholder for now
};
