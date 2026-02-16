import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import AnimatedAvatar from './AnimatedAvatar';
import {AvatarCustomization} from '../types/Avatar';
import {AnimationState} from '../types/AnimatedAvatar';
import {Colors} from '../utils/Colors';

interface EnhancedAvatarPreviewProps {
  avatar: AvatarCustomization;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  showEdit?: boolean;
  triggerAnimation?: string | null; // Animation to trigger
  interactive?: boolean;
  autoAnimate?: boolean; // Automatically cycle through animations
}

const EnhancedAvatarPreview: React.FC<EnhancedAvatarPreviewProps> = ({
  avatar,
  size = 'medium',
  onPress,
  showEdit = false,
  triggerAnimation = null,
  interactive = true,
  autoAnimate = false,
}) => {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>({
    type: 'idle',
    duration: 3000,
    loop: true,
    intensity: 'medium',
  });

  const [animationQueue, setAnimationQueue] = useState<string[]>([]);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Auto-animation cycle
  const autoAnimations = useMemo(
    () => ['idle', 'waving', 'idle', 'clapping', 'idle'],
    [],
  );
  const [autoIndex, setAutoIndex] = useState(0);

  useEffect(() => {
    if (triggerAnimation) {
      playAnimation(triggerAnimation);
    }
  }, [triggerAnimation]);

  useEffect(() => {
    if (autoAnimate && !isUserInteracting) {
      const interval = setInterval(() => {
        const nextAnimation = autoAnimations[autoIndex];
        setCurrentAnimation({
          type: nextAnimation as any,
          duration: nextAnimation === 'idle' ? 3000 : 2000,
          loop: nextAnimation === 'idle',
          intensity: 'medium',
        });
        setAutoIndex(prev => (prev + 1) % autoAnimations.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoAnimate, autoIndex, isUserInteracting, autoAnimations]);

  const playAnimation = (animationType: string) => {
    setIsUserInteracting(true);

    const animationConfig = {
      waving: {duration: 2000, loop: true},
      clapping: {duration: 1500, loop: true},
      cheering: {duration: 2500, loop: false},
      jumping: {duration: 1200, loop: false},
      celebrating: {duration: 3000, loop: false},
      idle: {duration: 3000, loop: true},
    };

    const config =
      animationConfig[animationType as keyof typeof animationConfig] ||
      animationConfig.idle;

    setCurrentAnimation({
      type: animationType as any,
      duration: config.duration,
      loop: config.loop,
      intensity: 'high',
    });

    // Reset to idle after non-looping animations
    if (!config.loop) {
      setTimeout(() => {
        setCurrentAnimation({
          type: 'idle',
          duration: 3000,
          loop: true,
          intensity: 'medium',
        });
        setIsUserInteracting(false);
      }, config.duration + 500);
    } else {
      // For looping animations, stop after a few cycles
      setTimeout(() => {
        setCurrentAnimation({
          type: 'idle',
          duration: 3000,
          loop: true,
          intensity: 'medium',
        });
        setIsUserInteracting(false);
      }, config.duration * 3);
    }
  };

  const handlePress = () => {
    if (interactive && !isUserInteracting) {
      // Cycle through interactive animations on tap
      const quickAnimations = ['waving', 'clapping', 'jumping'];
      const randomAnimation =
        quickAnimations[Math.floor(Math.random() * quickAnimations.length)];
      playAnimation(randomAnimation);
    }

    onPress?.();
  };

  const handleAnimationComplete = () => {
    // Process animation queue if any
    if (animationQueue.length > 0) {
      const nextAnimation = animationQueue[0];
      setAnimationQueue(prev => prev.slice(1));
      playAnimation(nextAnimation);
    }
  };

  const renderAvatar = () => (
    <View style={[styles.avatarContainer, getContainerStyle()]}>
      <AnimatedAvatar
        avatar={avatar}
        animation={currentAnimation}
        size={size}
        onAnimationComplete={handleAnimationComplete}
        interactive={interactive}
        showEmotions={true}
      />

      {/* Animation indicator */}
      {isUserInteracting && (
        <View style={styles.animationIndicator}>
          <Text style={styles.animationText}>
            {getAnimationEmoji(currentAnimation.type)}
          </Text>
        </View>
      )}

      {/* Edit overlay */}
      {showEdit && (
        <View style={styles.editOverlay}>
          <Text style={styles.editText}>✏️ Customize</Text>
        </View>
      )}

      {/* Interactive hint */}
      {interactive && !isUserInteracting && size !== 'small' && (
        <View style={styles.interactiveHint}>
          <Text style={styles.hintText}>Tap me! 👆</Text>
        </View>
      )}
    </View>
  );

  const getContainerStyle = () => {
    let dynamicStyles = {};

    if (interactive) {
      dynamicStyles = {...dynamicStyles, ...styles.interactive};
    }

    if (isUserInteracting) {
      dynamicStyles = {...dynamicStyles, ...styles.animating};
    }

    return [styles.container, dynamicStyles];
  };

  const getAnimationEmoji = (animationType: string): string => {
    const emojis = {
      waving: '👋',
      clapping: '👏',
      cheering: '🎉',
      jumping: '🦘',
      celebrating: '🎊',
      dancing: '💃',
      thinking: '🤔',
      idle: '😊',
    };
    return emojis[animationType as keyof typeof emojis] || '😊';
  };

  if (onPress || interactive) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        {renderAvatar()}
      </TouchableOpacity>
    );
  }

  return renderAvatar();
};

// Export animation trigger methods for external use
export const createAvatarRef = () => {
  const ref = React.createRef<{
    celebrate: () => void;
    cheer: () => void;
    wave: () => void;
    clap: () => void;
    jump: () => void;
    playAnimation: (type: string) => void;
  }>();

  return ref;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.childAccent,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interactive: {
    borderColor: Colors.childSecondary,
    shadowColor: Colors.childSecondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  animating: {
    borderColor: Colors.childPrimary,
    shadowColor: Colors.childPrimary,
    shadowOpacity: 0.5,
    transform: [{scale: 1.02}],
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  animationText: {
    fontSize: 12,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
  },
  editText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  interactiveHint: {
    position: 'absolute',
    bottom: -30,
    alignSelf: 'center',
    backgroundColor: Colors.childAccent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default EnhancedAvatarPreview;
