import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {useAccessibility} from '../context/AccessibilityContext';
import {Colors} from '../utils/Colors';

interface Caption {
  id: string;
  text: string;
  speaker?: string;
  timestamp: number;
  duration: number;
  type: 'speech' | 'narration' | 'instruction' | 'sound_effect';
  priority: 'low' | 'medium' | 'high';
}

interface ClosedCaptionsProps {
  captions: Caption[];
  visible?: boolean;
  position?: 'top' | 'bottom' | 'center';
  maxLines?: number;
}

const {width: screenWidth} = Dimensions.get('window');

const ClosedCaptions: React.FC<ClosedCaptionsProps> = ({
  captions,
  visible = true,
  position = 'bottom',
  maxLines = 3,
}) => {
  const {settings} = useAccessibility();
  const [currentCaptions, setCurrentCaptions] = useState<Caption[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const updateCurrentCaptions = useCallback(() => {
    const now = Date.now();
    const activeCaptions = captions.filter(caption => {
      const endTime = caption.timestamp + caption.duration;
      return now >= caption.timestamp && now <= endTime;
    });

    // Sort by priority and timestamp
    activeCaptions.sort((a, b) => {
      const priorityOrder = {high: 3, medium: 2, low: 1};
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.timestamp - b.timestamp;
    });

    setCurrentCaptions(activeCaptions.slice(0, isExpanded ? 10 : maxLines));
  }, [captions, isExpanded, maxLines]);

  const showCaptions = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const hideCaptions = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: position === 'bottom' ? 50 : -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, position]);

  useEffect(() => {
    if (settings.closedCaptions && visible && captions.length > 0) {
      updateCurrentCaptions();
      showCaptions();
    } else {
      hideCaptions();
    }
  }, [
    captions,
    settings.closedCaptions,
    visible,
    updateCurrentCaptions,
    showCaptions,
    hideCaptions,
  ]);

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return styles.topPosition;
      case 'center':
        return styles.centerPosition;
      case 'bottom':
      default:
        return styles.bottomPosition;
    }
  };

  const getSpeakerIcon = (speaker?: string) => {
    if (!speaker) {
      return '💬';
    }

    switch (speaker.toLowerCase()) {
      case 'narrator':
      case 'system':
        return '📢';
      case 'child':
      case 'student':
        return '👶';
      case 'teacher':
      case 'instructor':
        return '👩‍🏫';
      case 'character':
        return '🎭';
      default:
        return '💬';
    }
  };

  const getTypeColor = (type: Caption['type']) => {
    switch (type) {
      case 'instruction':
        return Colors.childPrimary;
      case 'speech':
        return Colors.childAccent;
      case 'narration':
        return Colors.parentPrimary;
      case 'sound_effect':
        return Colors.childSecondary;
      default:
        return Colors.text;
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    updateCurrentCaptions();
  };

  if (!settings.closedCaptions || !visible || currentCaptions.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={styles.captionsContainer}>
        {currentCaptions.map((caption, _index) => (
          <View key={caption.id} style={styles.captionRow}>
            <View style={styles.captionHeader}>
              <Text style={styles.speakerIcon}>
                {getSpeakerIcon(caption.speaker)}
              </Text>
              {caption.speaker && (
                <Text style={styles.speakerName}>{caption.speaker}</Text>
              )}
              <View
                style={[
                  styles.typeIndicator,
                  {backgroundColor: getTypeColor(caption.type)},
                ]}
              />
            </View>
            <Text
              style={[
                styles.captionText,
                settings.largerText && styles.largerText,
                caption.priority === 'high' && styles.highPriorityText,
              ]}>
              {caption.text}
            </Text>
          </View>
        ))}

        {captions.length > maxLines && !isExpanded && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpanded}>
            <Text style={styles.expandButtonText}>
              +{captions.length - maxLines} more
            </Text>
          </TouchableOpacity>
        )}

        {isExpanded && (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={toggleExpanded}>
            <Text style={styles.expandButtonText}>Show less</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Hook for managing captions
export const useCaptions = () => {
  const [captions, setCaptions] = useState<Caption[]>([]);

  const addCaption = (
    text: string,
    options: {
      speaker?: string;
      duration?: number;
      type?: Caption['type'];
      priority?: Caption['priority'];
    } = {},
  ) => {
    const caption: Caption = {
      id: `caption_${Date.now()}_${Math.random()}`,
      text,
      speaker: options.speaker,
      timestamp: Date.now(),
      duration: options.duration || 3000,
      type: options.type || 'speech',
      priority: options.priority || 'medium',
    };

    setCaptions(prev => [...prev, caption]);

    // Auto-remove caption after duration
    setTimeout(() => {
      setCaptions(prev => prev.filter(c => c.id !== caption.id));
    }, caption.duration);

    return caption.id;
  };

  const removeCaption = (id: string) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
  };

  const clearCaptions = () => {
    setCaptions([]);
  };

  const addInstructionCaption = (
    text: string,
    speaker: string = 'Instructor',
  ) => {
    return addCaption(text, {
      speaker,
      type: 'instruction',
      priority: 'high',
      duration: 5000,
    });
  };

  const addSoundEffectCaption = (effect: string) => {
    return addCaption(`[${effect}]`, {
      type: 'sound_effect',
      priority: 'low',
      duration: 2000,
    });
  };

  const addNarrationCaption = (text: string) => {
    return addCaption(text, {
      speaker: 'Narrator',
      type: 'narration',
      priority: 'medium',
      duration: 4000,
    });
  };

  return {
    captions,
    addCaption,
    removeCaption,
    clearCaptions,
    addInstructionCaption,
    addSoundEffectCaption,
    addNarrationCaption,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 100,
  },
  bottomPosition: {
    bottom: 100,
  },
  topPosition: {
    top: 100,
  },
  centerPosition: {
    top: '40%',
  },
  captionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 15,
    maxWidth: screenWidth - 40,
    alignSelf: 'center',
  },
  captionRow: {
    marginBottom: 8,
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  speakerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  speakerName: {
    fontSize: 12,
    color: Colors.childAccent,
    fontWeight: '600',
    marginRight: 8,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  captionText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  largerText: {
    fontSize: 18,
    lineHeight: 26,
  },
  highPriorityText: {
    fontWeight: 'bold',
    color: Colors.childAccent,
  },
  expandButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  collapseButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  expandButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ClosedCaptions;
