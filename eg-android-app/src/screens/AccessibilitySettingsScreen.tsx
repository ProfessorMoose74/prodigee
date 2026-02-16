import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useAccessibility} from '../context/AccessibilityContext';
import {Colors} from '../utils/Colors';
import {HAPTIC_PATTERNS} from '../types/Accessibility';

const AccessibilitySettingsScreen = () => {
  // const navigation = useNavigation();
  const {settings, updateSettings, triggerHaptic, showSoundVisualization} =
    useAccessibility();
  const [testingHaptics, setTestingHaptics] = useState(false);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({[key]: value});

    // Provide feedback when toggling
    if (value) {
      triggerHaptic('success');
    }
  };

  const testHapticPattern = (patternId: keyof typeof HAPTIC_PATTERNS) => {
    setTestingHaptics(true);
    triggerHaptic(patternId);

    setTimeout(() => {
      setTestingHaptics(false);
    }, 1000);
  };

  const testSoundVisualization = () => {
    showSoundVisualization({
      id: `test_${Date.now()}`,
      type: 'notification',
      visual: 'pulse',
      color: '#4CAF50',
      intensity: 'high',
      duration: 2000,
      description: 'Test sound visualization',
    });
  };

  const enableHearingImpairedMode = () => {
    Alert.alert(
      'Enable Hearing Accessibility',
      'This will turn on visual indicators, haptic feedback, and closed captions to make the app accessible for hearing impaired users.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Enable',
          onPress: async () => {
            await updateSettings({
              hearingImpaired: true,
              visualSoundIndicators: true,
              hapticFeedback: true,
              closedCaptions: true,
              vibrationPatterns: true,
            });
            triggerHaptic('celebration');
          },
        },
      ],
    );
  };

  const SettingRow = ({
    title,
    description,
    value,
    onValueChange,
    testAction,
  }: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    testAction?: () => void;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingControls}>
        {testAction && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={testAction}
            disabled={!value}>
            <Text
              style={[styles.testButtonText, !value && styles.disabledText]}>
              Test
            </Text>
          </TouchableOpacity>
        )}
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{false: Colors.lighter, true: Colors.childAccent}}
          thumbColor={value ? Colors.childPrimary : Colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Accessibility Settings</Text>
        <Text style={styles.subtitle}>
          Make the app accessible for children with different needs
        </Text>
      </View>

      {/* Quick Setup Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Setup</Text>
        <TouchableOpacity
          style={styles.quickSetupButton}
          onPress={enableHearingImpairedMode}>
          <Text style={styles.quickSetupTitle}>
            🔊 Hearing Accessibility Mode
          </Text>
          <Text style={styles.quickSetupDescription}>
            Enable all features for hearing impaired children
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hearing Accessibility Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hearing Accessibility</Text>

        <SettingRow
          title="Hearing Impaired Mode"
          description="Enable comprehensive accessibility features for hearing impaired users"
          value={settings.hearingImpaired}
          onValueChange={value => handleToggle('hearingImpaired', value)}
        />

        <SettingRow
          title="Visual Sound Indicators"
          description="Show visual effects when sounds play"
          value={settings.visualSoundIndicators}
          onValueChange={value => handleToggle('visualSoundIndicators', value)}
          testAction={testSoundVisualization}
        />

        <SettingRow
          title="Haptic Feedback"
          description="Feel vibrations for different events and sounds"
          value={settings.hapticFeedback}
          onValueChange={value => handleToggle('hapticFeedback', value)}
          testAction={() => testHapticPattern('success')}
        />

        <SettingRow
          title="Closed Captions"
          description="Show text for all spoken content"
          value={settings.closedCaptions}
          onValueChange={value => handleToggle('closedCaptions', value)}
        />

        <SettingRow
          title="Sign Language Support"
          description="Avatar performs basic sign language gestures"
          value={settings.signLanguageSupport}
          onValueChange={value => handleToggle('signLanguageSupport', value)}
        />

        <SettingRow
          title="Vibration Patterns"
          description="Different vibration patterns for various events"
          value={settings.vibrationPatterns}
          onValueChange={value => handleToggle('vibrationPatterns', value)}
          testAction={() => testHapticPattern('celebration')}
        />
      </View>

      {/* Haptic Test Section */}
      {settings.hapticFeedback && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Haptic Patterns</Text>
          {Object.entries(HAPTIC_PATTERNS).map(([id, pattern]) => (
            <TouchableOpacity
              key={id}
              style={styles.hapticTestButton}
              onPress={() =>
                testHapticPattern(id as keyof typeof HAPTIC_PATTERNS)
              }
              disabled={testingHaptics}>
              <Text style={styles.hapticTestTitle}>{pattern.name}</Text>
              <Text style={styles.hapticTestDescription}>
                {pattern.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Visual Accessibility Section (Future) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visual Accessibility</Text>

        <SettingRow
          title="High Contrast"
          description="Increase contrast for better visibility"
          value={settings.highContrast}
          onValueChange={value => handleToggle('highContrast', value)}
        />

        <SettingRow
          title="Larger Text"
          description="Increase text size throughout the app"
          value={settings.largerText}
          onValueChange={value => handleToggle('largerText', value)}
        />

        <SettingRow
          title="Reduced Motion"
          description="Minimize animations and transitions"
          value={settings.reducedMotion}
          onValueChange={value => handleToggle('reducedMotion', value)}
        />
      </View>

      {/* Cognitive Accessibility Section (Future) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Support</Text>

        <SettingRow
          title="Simplified Interface"
          description="Show fewer options and simpler layouts"
          value={settings.simplifiedInterface}
          onValueChange={value => handleToggle('simplifiedInterface', value)}
        />

        <SettingRow
          title="Extended Timeouts"
          description="Give more time to respond to questions"
          value={settings.extendedTimeouts}
          onValueChange={value => handleToggle('extendedTimeouts', value)}
        />

        <SettingRow
          title="Repeat Instructions"
          description="Automatically repeat instructions multiple times"
          value={settings.repeatInstructions}
          onValueChange={value => handleToggle('repeatInstructions', value)}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          These settings help make learning accessible for all children. are
          saved automatically.
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
    padding: 20,
    backgroundColor: Colors.childPrimary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  quickSetupButton: {
    backgroundColor: Colors.childAccent,
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
  },
  quickSetupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  quickSetupDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  settingContent: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testButton: {
    backgroundColor: Colors.childSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  hapticTestButton: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.childAccent,
  },
  hapticTestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  hapticTestDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footer: {
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AccessibilitySettingsScreen;
