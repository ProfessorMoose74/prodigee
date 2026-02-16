import React, {useEffect, useRef, useCallback} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {SoundVisualization} from '../types/Accessibility';

interface VisualSoundIndicatorProps {
  visualization: SoundVisualization;
  onComplete?: () => void;
}

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const VisualSoundIndicator: React.FC<VisualSoundIndicatorProps> = ({
  visualization,
  onComplete,
}) => {
  const animationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  const createPulseAnimation = useCallback(
    (duration: number, _intensity: string) => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        {iterations: Math.floor(duration / 1200)},
      );

      animation.start();
    },
    [animationValue],
  );

  const createWaveAnimation = useCallback(
    (duration: number, _intensity: string) => {
      const animation = Animated.loop(
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        {iterations: Math.floor(duration / 1000)},
      );

      animation.start();
    },
    [animationValue],
  );

  const createGlowAnimation = useCallback(
    (duration: number, _intensity: string) => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        {iterations: Math.floor(duration / 1600)},
      );

      animation.start();
    },
    [animationValue],
  );

  const createBounceAnimation = useCallback(
    (duration: number, _intensity: string) => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        {iterations: Math.floor(duration / 1000)},
      );

      animation.start();
    },
    [animationValue],
  );

  const createFlashAnimation = useCallback(
    (duration: number, _intensity: string) => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        {iterations: Math.floor(duration / 200)},
      );

      animation.start();
    },
    [animationValue],
  );

  const startAnimation = useCallback(() => {
    const {visual, duration, intensity} = visualization;

    // Start with fade in
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Main animation based on visual type
    switch (visual) {
      case 'pulse':
        createPulseAnimation(duration, intensity);
        break;
      case 'wave':
        createWaveAnimation(duration, intensity);
        break;
      case 'glow':
        createGlowAnimation(duration, intensity);
        break;
      case 'bounce':
        createBounceAnimation(duration, intensity);
        break;
      case 'flash':
        createFlashAnimation(duration, intensity);
        break;
      default:
        createPulseAnimation(duration, intensity);
    }

    // Fade out and complete
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.();
      });
    }, duration - 300);
  }, [
    visualization,
    opacityValue,
    scaleValue,
    onComplete,
    createPulseAnimation,
    createWaveAnimation,
    createGlowAnimation,
    createBounceAnimation,
    createFlashAnimation,
  ]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  const getAnimatedStyle = () => {
    const {visual, intensity} = visualization;

    const baseStyle = {
      opacity: opacityValue,
      transform: [{scale: scaleValue}],
    };

    switch (visual) {
      case 'pulse':
        return {
          ...baseStyle,
          transform: [
            {scale: scaleValue},
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  1,
                  intensity === 'high'
                    ? 1.3
                    : intensity === 'medium'
                    ? 1.2
                    : 1.1,
                ],
              }),
            },
          ],
        };

      case 'wave':
        return {
          ...baseStyle,
          transform: [
            {scale: scaleValue},
            {
              rotate: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        };

      case 'glow':
        return {
          ...baseStyle,
          shadowOpacity: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
          shadowRadius: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [5, 20],
          }),
        };

      case 'bounce':
        return {
          ...baseStyle,
          transform: [
            {scale: scaleValue},
            {
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -20],
              }),
            },
          ],
        };

      case 'flash':
        return {
          ...baseStyle,
          opacity: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        };

      default:
        return baseStyle;
    }
  };

  const getIconForSoundType = () => {
    const {type} = visualization;
    switch (type) {
      case 'speech':
        return '💬';
      case 'music':
        return '🎵';
      case 'effect':
        return '✨';
      case 'notification':
        return '🔔';
      case 'instruction':
        return '📢';
      default:
        return '🔊';
    }
  };

  const getPositionStyle = () => {
    const {type} = visualization;

    // Position based on sound type
    switch (type) {
      case 'speech':
      case 'instruction':
        return styles.topCenter;
      case 'notification':
        return styles.topRight;
      case 'music':
        return styles.bottomCenter;
      case 'effect':
        return styles.center;
      default:
        return styles.center;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        getAnimatedStyle(),
        {
          backgroundColor: visualization.color,
          shadowColor: visualization.color,
        },
      ]}
      pointerEvents="none">
      <Text style={styles.icon}>{getIconForSoundType()}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {visualization.description}
      </Text>
    </Animated.View>
  );
};

// Overlay component to manage multiple visual indicators
interface VisualSoundOverlayProps {
  visualizations: SoundVisualization[];
  onVisualizationComplete: (id: string) => void;
}

export const VisualSoundOverlay: React.FC<VisualSoundOverlayProps> = ({
  visualizations,
  onVisualizationComplete,
}) => {
  if (visualizations.length === 0) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      {visualizations.map(viz => (
        <VisualSoundIndicator
          key={viz.id}
          visualization={viz}
          onComplete={() => onVisualizationComplete(viz.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    maxWidth: 200,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    elevation: 8,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  // Position styles
  topCenter: {
    top: 100,
    left: screenWidth / 2 - 100,
  },
  topRight: {
    top: 80,
    right: 20,
  },
  center: {
    top: screenHeight / 2 - 50,
    left: screenWidth / 2 - 100,
  },
  bottomCenter: {
    bottom: 150,
    left: screenWidth / 2 - 100,
  },
});

export default VisualSoundIndicator;
