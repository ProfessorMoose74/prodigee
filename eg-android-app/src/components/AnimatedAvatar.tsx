import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {
  AnimatedAvatarProps,
  AnimationSequence,
  AnimationKeyframe,
  AVATAR_ANIMATIONS,
} from '../types/AnimatedAvatar';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedG = Animated.createAnimatedComponent(G);

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  avatar,
  animation,
  size = 'medium',
  onAnimationComplete,
  onAnimationStart,
}) => {
  const animationRef = useRef<Animated.Value>(new Animated.Value(0)).current;
  const [_currentKeyframe, _setCurrentKeyframe] =
    useState<AnimationKeyframe | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: {width: 80, height: 120, scale: 0.6},
    medium: {width: 120, height: 180, scale: 1},
    large: {width: 160, height: 240, scale: 1.4},
    xlarge: {width: 200, height: 300, scale: 1.8},
  };

  const config = sizeConfig[size];

  useEffect(() => {
    const startAnimation = () => {
      const sequence = AVATAR_ANIMATIONS[animation.type];
      if (!sequence) {
        return;
      }

      setIsAnimating(true);
      onAnimationStart?.();

      const animateSequence = () => {
        animationRef.setValue(0);

        Animated.timing(animationRef, {
          toValue: 1,
          duration: animation.duration || sequence.duration,
          easing: getEasingFunction(sequence.easing),
          useNativeDriver: false,
        }).start(({finished}) => {
          if (finished) {
            if (animation.loop && sequence.loop) {
              // Loop the animation
              animateSequence();
            } else {
              setIsAnimating(false);
              onAnimationComplete?.();
            }
          }
        });
      };

      animateSequence();
    };

    if (animation) {
      startAnimation();
    }
  }, [animation, animationRef, onAnimationStart, onAnimationComplete]);

  const getEasingFunction = (easingType: AnimationSequence['easing']) => {
    switch (easingType) {
      case 'ease-in':
        return Easing.in(Easing.quad);
      case 'ease-out':
        return Easing.out(Easing.quad);
      case 'ease-in-out':
        return Easing.inOut(Easing.quad);
      case 'bounce':
        return Easing.bounce;
      default:
        return Easing.linear;
    }
  };

  // Get skin tone color
  const getSkinToneColor = (): string => {
    const skinTones = {
      light: '#FDBCB4',
      'medium-light': '#F1C27D',
      medium: '#E0AC69',
      'medium-dark': '#C68642',
      dark: '#8D5524',
    };
    return (
      skinTones[avatar.skinTone as keyof typeof skinTones] || skinTones.medium
    );
  };

  // Get hair color from avatar
  const getHairColor = (): string => {
    return avatar.hairColor || '#8B4513';
  };

  // Get current animation transforms
  const getAnimatedTransforms = () => {
    const sequence = AVATAR_ANIMATIONS[animation.type];
    if (!sequence || !isAnimating) {
      return {
        headRotate: '0deg',
        torsoY: 0,
        torsoRotate: '0deg',
        leftArmRotate: '0deg',
        rightArmRotate: '0deg',
        leftLegRotate: '0deg',
        rightLegRotate: '0deg',
      };
    }

    // For this demo, we'll create simple transform interpolations
    // In a full implementation, you'd interpolate through all keyframes
    const progress = animationRef;

    switch (animation.type) {
      case 'waving':
        return {
          headRotate: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['0deg', '5deg', '0deg'],
          }),
          torsoY: 0,
          torsoRotate: '0deg',
          leftArmRotate: '0deg',
          rightArmRotate: progress.interpolate({
            inputRange: [0, 0.25, 0.5, 0.75, 1],
            outputRange: ['-20deg', '10deg', '-20deg', '-50deg', '-20deg'],
          }),
          leftLegRotate: '0deg',
          rightLegRotate: '0deg',
        };

      case 'clapping':
        return {
          headRotate: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['0deg', '3deg', '0deg'],
          }),
          torsoY: 0,
          torsoRotate: '0deg',
          leftArmRotate: progress.interpolate({
            inputRange: [0, 0.3, 0.5, 0.8, 1],
            outputRange: ['15deg', '5deg', '15deg', '5deg', '15deg'],
          }),
          rightArmRotate: progress.interpolate({
            inputRange: [0, 0.3, 0.5, 0.8, 1],
            outputRange: ['-15deg', '-5deg', '-15deg', '-5deg', '-15deg'],
          }),
          leftLegRotate: '0deg',
          rightLegRotate: '0deg',
        };

      case 'jumping':
        return {
          headRotate: '0deg',
          torsoY: progress.interpolate({
            inputRange: [0, 0.4, 0.7, 1],
            outputRange: [0, -20, -10, 0],
          }),
          torsoRotate: '0deg',
          leftArmRotate: progress.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: ['-30deg', '-60deg', '0deg'],
          }),
          rightArmRotate: progress.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: ['30deg', '60deg', '0deg'],
          }),
          leftLegRotate: progress.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: ['10deg', '-5deg', '5deg'],
          }),
          rightLegRotate: progress.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: ['10deg', '-5deg', '5deg'],
          }),
        };

      case 'cheering':
        return {
          headRotate: progress.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: ['0deg', '5deg', '-3deg', '0deg'],
          }),
          torsoY: progress.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: [0, -10, 0, 0],
          }),
          torsoRotate: progress.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: ['0deg', '3deg', '-2deg', '0deg'],
          }),
          leftArmRotate: progress.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: ['-45deg', '-60deg', '-30deg', '-45deg'],
          }),
          rightArmRotate: progress.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: ['-45deg', '-60deg', '-30deg', '-45deg'],
          }),
          leftLegRotate: '0deg',
          rightLegRotate: '0deg',
        };

      default:
        return {
          headRotate: '0deg',
          torsoY: 0,
          torsoRotate: '0deg',
          leftArmRotate: '0deg',
          rightArmRotate: '0deg',
          leftLegRotate: '0deg',
          rightLegRotate: '0deg',
        };
    }
  };

  const getEyeColor = (): string => {
    const eyeColors = {
      brown: '#8B4513',
      blue: '#4169E1',
      green: '#228B22',
      hazel: '#BDB76B',
      gray: '#708090',
      purple: '#9370DB',
      rainbow: '#FF1493', // Simplified for SVG
    };
    return (
      eyeColors[avatar.eyeColor as keyof typeof eyeColors] || eyeColors.brown
    );
  };

  const renderHeadwear = (
    config: any,
    headwear: string,
    color: string,
  ) => {
    switch (headwear) {
      case 'cap':
        return (
          <Path
            d={`M ${config.width * 0.38} ${config.height * 0.15}
                Q ${config.width * 0.5} ${config.height * 0.1}
                ${config.width * 0.62} ${config.height * 0.15}
                L ${config.width * 0.65} ${config.height * 0.18}
                L ${config.width * 0.35} ${
              config.height * 0.18
            } Z`}
            fill={color}
          />
        );
      case 'crown':
        return (
          <G>
            <Rect
              x={config.width * 0.4}
              y={config.height * 0.12}
              width={config.width * 0.2}
              height={config.width * 0.03}
              fill={color}
            />
            <Path
              d={`M ${config.width * 0.4} ${
                config.height * 0.12
              }
                  L ${config.width * 0.42} ${
                config.height * 0.08
              }
                  L ${config.width * 0.46} ${
                config.height * 0.1
              }
                  L ${config.width * 0.5} ${
                config.height * 0.06
              }
                  L ${config.width * 0.54} ${
                config.height * 0.1
              }
                  L ${config.width * 0.58} ${
                config.height * 0.08
              }
                  L ${config.width * 0.6} ${
                config.height * 0.12
              }`}
              fill={color}
            />
          </G>
        );
      default:
        return null;
    }
  };

  const transforms = getAnimatedTransforms();
  const skinColor = getSkinToneColor();
  const hairColor = getHairColor();

  return (
    <View
      testID="animated-avatar"
      style={[
        styles.container,
        {width: config.width, height: config.height},
      ]}>
      <AnimatedSvg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        style={{transform: [{scale: config.scale}]}}>
        <Defs>
          {/* Skin tone gradient */}
          <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={skinColor} />
            <Stop offset="100%" stopColor={skinColor} stopOpacity="0.8" />
          </LinearGradient>

          {/* Hair gradient */}
          <LinearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={hairColor} />
            <Stop offset="100%" stopColor={hairColor} stopOpacity="0.9" />
          </LinearGradient>

          {/* Clothing gradients */}
          <LinearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={avatar.topColor} />
            <Stop offset="100%" stopColor={avatar.topColor} stopOpacity="0.8" />
          </LinearGradient>

          <LinearGradient
            id="bottomGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%">
            <Stop offset="0%" stopColor={avatar.bottomColor} />
            <Stop
              offset="100%"
              stopColor={avatar.bottomColor}
              stopOpacity="0.8"
            />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect
          width={config.width}
          height={config.height}
          fill="#E6F3FF"
          opacity="0.3"
        />

        {/* Character Body */}
        <AnimatedG
          translateY={transforms.torsoY}
          rotation={transforms.torsoRotate}>
          {/* Legs */}
          <AnimatedG rotation={transforms.leftLegRotate}>
            {/* Left Leg */}
            <Rect
              x={config.width * 0.35}
              y={config.height * 0.65}
              width={config.width * 0.08}
              height={config.height * 0.25}
              fill="url(#bottomGradient)"
              rx="4"
            />
            {/* Left Foot */}
            <Ellipse
              cx={config.width * 0.39}
              cy={config.height * 0.92}
              rx={config.width * 0.06}
              ry={config.height * 0.03}
              fill={avatar.footwearColor}
            />
          </AnimatedG>

          <AnimatedG rotation={transforms.rightLegRotate}>
            {/* Right Leg */}
            <Rect
              x={config.width * 0.57}
              y={config.height * 0.65}
              width={config.width * 0.08}
              height={config.height * 0.25}
              fill="url(#bottomGradient)"
              rx="4"
            />
            {/* Right Foot */}
            <Ellipse
              cx={config.width * 0.61}
              cy={config.height * 0.92}
              rx={config.width * 0.06}
              ry={config.height * 0.03}
              fill={avatar.footwearColor}
            />
          </AnimatedG>

          {/* Torso */}
          <Rect
            x={config.width * 0.3}
            y={config.height * 0.35}
            width={config.width * 0.4}
            height={config.height * 0.35}
            fill="url(#topGradient)"
            rx="8"
          />

          {/* Arms */}
          <AnimatedG rotation={transforms.leftArmRotate}>
            {/* Left Arm */}
            <Rect
              x={config.width * 0.22}
              y={config.height * 0.38}
              width={config.width * 0.06}
              height={config.height * 0.25}
              fill="url(#skinGradient)"
              rx="3"
            />
            {/* Left Hand */}
            <Circle
              cx={config.width * 0.25}
              cy={config.height * 0.65}
              r={config.width * 0.04}
              fill="url(#skinGradient)"
            />
          </AnimatedG>

          <AnimatedG rotation={transforms.rightArmRotate}>
            {/* Right Arm */}
            <Rect
              x={config.width * 0.72}
              y={config.height * 0.38}
              width={config.width * 0.06}
              height={config.height * 0.25}
              fill="url(#skinGradient)"
              rx="3"
            />
            {/* Right Hand */}
            <Circle
              cx={config.width * 0.75}
              cy={config.height * 0.65}
              r={config.width * 0.04}
              fill="url(#skinGradient)"
            />
          </AnimatedG>

          {/* Neck */}
          <Rect
            x={config.width * 0.47}
            y={config.height * 0.3}
            width={config.width * 0.06}
            height={config.height * 0.08}
            fill="url(#skinGradient)"
          />

          {/* Head */}
          <AnimatedG rotation={transforms.headRotate}>
            {/* Head Shape */}
            <Circle
              cx={config.width * 0.5}
              cy={config.height * 0.22}
              r={config.width * 0.12}
              fill="url(#skinGradient)"
            />

            {/* Hair */}
            <Path
              d={`M ${config.width * 0.38} ${config.height * 0.15} 
                  Q ${config.width * 0.5} ${config.height * 0.08} 
                  ${config.width * 0.62} ${config.height * 0.15}
                  Q ${config.width * 0.65} ${config.height * 0.2}
                  ${config.width * 0.6} ${config.height * 0.25}
                  Q ${config.width * 0.5} ${config.height * 0.28}
                  ${config.width * 0.4} ${config.height * 0.25}
                  Q ${config.width * 0.35} ${config.height * 0.2}
                  ${config.width * 0.38} ${config.height * 0.15} Z`}
              fill="url(#hairGradient)"
            />

            {/* Eyes */}
            <Circle
              cx={config.width * 0.45}
              cy={config.height * 0.2}
              r={config.width * 0.02}
              fill="#FFFFFF"
            />
            <Circle
              cx={config.width * 0.55}
              cy={config.height * 0.2}
              r={config.width * 0.02}
              fill="#FFFFFF"
            />

            {/* Eye Pupils */}
            <Circle
              cx={config.width * 0.45}
              cy={config.height * 0.2}
              r={config.width * 0.015}
              fill={getEyeColor()}
            />
            <Circle
              cx={config.width * 0.55}
              cy={config.height * 0.2}
              r={config.width * 0.015}
              fill={getEyeColor()}
            />

            {/* Mouth */}
            <Path
              d={`M ${config.width * 0.46} ${config.height * 0.26} 
                  Q ${config.width * 0.5} ${config.height * 0.28} 
                  ${config.width * 0.54} ${config.height * 0.26}`}
              stroke="#FF6B6B"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Glasses if equipped */}
            {avatar.glasses && avatar.glasses !== 'none' && (
              <G>
                <Circle
                  cx={config.width * 0.45}
                  cy={config.height * 0.2}
                  r={config.width * 0.035}
                  fill="none"
                  stroke={avatar.glassesColor}
                  strokeWidth="2"
                />
                <Circle
                  cx={config.width * 0.55}
                  cy={config.height * 0.2}
                  r={config.width * 0.035}
                  fill="none"
                  stroke={avatar.glassesColor}
                  strokeWidth="2"
                />
                <Path
                  d={`M ${config.width * 0.485} ${config.height * 0.2} 
                      L ${config.width * 0.515} ${config.height * 0.2}`}
                  stroke={avatar.glassesColor}
                  strokeWidth="2"
                />
              </G>
            )}

            {/* Headwear if equipped */}
            {avatar.headwear && avatar.headwear !== 'none' && (
              <G>
                {renderHeadwear(config, avatar.headwear, avatar.headwearColor)}
              </G>
            )}
          </AnimatedG>
        </AnimatedG>

        {/* Animation effects */}
        {isAnimating && animation.type === 'celebrating' && (
          <G>
            {/* Confetti or sparkles */}
            <Circle
              cx={config.width * 0.2}
              cy={config.height * 0.3}
              r="2"
              fill="#FFD700"
              opacity="0.8"
            />
            <Circle
              cx={config.width * 0.8}
              cy={config.height * 0.4}
              r="2"
              fill="#FF6B6B"
              opacity="0.8"
            />
            <Circle
              cx={config.width * 0.7}
              cy={config.height * 0.2}
              r="2"
              fill="#4ECDC4"
              opacity="0.8"
            />
            <Circle
              cx={config.width * 0.3}
              cy={config.height * 0.5}
              r="2"
              fill="#96CEB4"
              opacity="0.8"
            />
          </G>
        )}
      </AnimatedSvg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedAvatar;
