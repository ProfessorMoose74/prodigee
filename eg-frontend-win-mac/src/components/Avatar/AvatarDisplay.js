import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

const AvatarContainer = styled(motion.div)`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const AvatarBase = styled(motion.div)`
  width: ${({ size }) => {
    switch (size) {
      case 'xs': return '32px';
      case 'sm': return '48px';
      case 'md': return '64px';
      case 'lg': return '96px';
      case 'xl': return '128px';
      default: return '64px';
    }
  }};
  height: ${({ size }) => {
    switch (size) {
      case 'xs': return '32px';
      case 'sm': return '48px';
      case 'md': return '64px';
      case 'lg': return '96px';
      case 'xl': return '128px';
      default: return '64px';
    }
  }};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ skinColor, backgroundGradient }) => 
    backgroundGradient || skinColor || '#FFD1A9'
  };
  position: relative;
  box-shadow: ${({ theme, size }) => 
    size === 'xs' ? theme.shadows.sm : 
    size === 'sm' ? theme.shadows.md : 
    theme.shadows.lg
  };
  border: ${({ size, theme }) => 
    size === 'xs' ? `2px solid ${theme.colors.white}` : 
    `3px solid ${theme.colors.white}`
  };
  overflow: hidden;
  cursor: ${({ onClick }) => onClick ? 'pointer' : 'default'};
  
  ${({ isAnimated }) => isAnimated && `
    animation: ${float} 3s ease-in-out infinite;
  `}
  
  &:hover {
    ${({ onClick }) => onClick && `
      transform: scale(1.05);
    `}
  }
`;

const AvatarLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size, fontSize }) => {
    if (fontSize) return fontSize;
    switch (size) {
      case 'xs': return '1rem';
      case 'sm': return '1.5rem';
      case 'md': return '2rem';
      case 'lg': return '3rem';
      case 'xl': return '4rem';
      default: return '2rem';
    }
  }};
  z-index: ${({ zIndex }) => zIndex || 1};
`;

const SparkleEffect = styled.div`
  position: absolute;
  top: ${({ top }) => top || '10%'};
  left: ${({ left }) => left || '10%'};
  font-size: ${({ size }) => {
    switch (size) {
      case 'xs': return '0.5rem';
      case 'sm': return '0.7rem';
      case 'md': return '0.8rem';
      case 'lg': return '1rem';
      case 'xl': return '1.2rem';
      default: return '0.8rem';
    }
  }};
  animation: ${sparkle} 2s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay || '0s'};
  z-index: 10;
`;

const AchievementBadge = styled(motion.div)`
  position: absolute;
  top: -8px;
  right: -8px;
  width: ${({ size }) => 
    size === 'xs' ? '16px' : 
    size === 'sm' ? '20px' : '24px'
  };
  height: ${({ size }) => 
    size === 'xs' ? '16px' : 
    size === 'sm' ? '20px' : '24px'
  };
  background: ${({ theme }) => theme.colors.primary.green};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 2px solid ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => 
    size === 'xs' ? '0.5rem' : 
    size === 'sm' ? '0.7rem' : '0.8rem'
  };
  z-index: 20;
`;

const LevelIndicator = styled.div`
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.primary.purple};
  color: ${({ theme }) => theme.colors.white};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ size }) => 
    size === 'xs' ? '0.6rem' : 
    size === 'sm' ? '0.7rem' : '0.8rem'
  };
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  border: 2px solid ${({ theme }) => theme.colors.white};
  z-index: 20;
`;

// Avatar options mapping (same as in AvatarCustomizer)
const avatarOptions = {
  skinTones: {
    'light': { color: '#FFD1A9', emoji: '👶🏻' },
    'medium-light': { color: '#F0C89F', emoji: '👶🏼' },
    'medium': { color: '#D4A574', emoji: '👶🏽' },
    'medium-dark': { color: '#B8956B', emoji: '👶🏾' },
    'dark': { color: '#8B6914', emoji: '👶🏿' }
  },
  hair: {
    'none': { emoji: '👦' },
    'short-brown': { emoji: '👦' },
    'long-blonde': { emoji: '👧' },
    'curly-black': { emoji: '👦🏿' },
    'pigtails': { emoji: '👧' },
    'mohawk': { emoji: '🤵' }
  },
  accessories: {
    'none': { emoji: '' },
    'glasses': { emoji: '🤓' },
    'hat': { emoji: '👒' },
    'crown': { emoji: '👑' },
    'superhero-mask': { emoji: '🦸' },
    'wizard-hat': { emoji: '🧙' }
  },
  expressions: {
    'happy': { emoji: '😊' },
    'excited': { emoji: '😃' },
    'cool': { emoji: '😎' },
    'wink': { emoji: '😉' },
    'star-eyes': { emoji: '🤩' },
    'genius': { emoji: '🧠' }
  },
  backgrounds: {
    'default': { color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    'forest': { color: 'linear-gradient(135deg, #4ade80 0%, #059669 100%)' },
    'ocean': { color: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
    'space': { color: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)' },
    'magical': { color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }
  }
};

const AvatarDisplay = ({
  avatarConfig = {
    skinTone: 'light',
    hair: 'short-brown',
    accessory: 'none',
    expression: 'happy',
    background: 'default'
  },
  size = 'md',
  showSparkles = false,
  isAnimated = false,
  showLevel = false,
  level = null,
  showAchievementBadge = false,
  achievementType = 'star',
  onClick = null,
  className = '',
  ...motionProps
}) => {
  // Get avatar parts
  const skinTone = avatarOptions.skinTones[avatarConfig.skinTone];
  const hair = avatarOptions.hair[avatarConfig.hair];
  const accessory = avatarOptions.accessories[avatarConfig.accessory];
  const expression = avatarOptions.expressions[avatarConfig.expression];
  const background = avatarOptions.backgrounds[avatarConfig.background];

  const sparklePositions = [
    { top: '5%', left: '15%', delay: '0s' },
    { top: '20%', left: '85%', delay: '0.7s' },
    { top: '80%', left: '10%', delay: '1.4s' },
    { top: '70%', left: '80%', delay: '2.1s' }
  ];

  return (
    <AvatarContainer className={className} onClick={onClick} {...motionProps}>
      {/* Sparkle effects */}
      {showSparkles && sparklePositions.map((pos, index) => (
        <SparkleEffect
          key={index}
          top={pos.top}
          left={pos.left}
          delay={pos.delay}
          size={size}
        >
          ✨
        </SparkleEffect>
      ))}

      {/* Main avatar */}
      <AvatarBase
        size={size}
        skinColor={skinTone?.color}
        backgroundGradient={background?.color}
        isAnimated={isAnimated}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        {/* Base expression */}
        <AvatarLayer size={size} zIndex={1}>
          {expression?.emoji || '😊'}
        </AvatarLayer>
        
        {/* Hair layer */}
        {hair?.id !== 'none' && (
          <AvatarLayer 
            size={size} 
            zIndex={2} 
            fontSize={size === 'xs' ? '0.7rem' : size === 'sm' ? '1rem' : undefined}
            style={{ top: size === 'xs' ? '-2px' : size === 'sm' ? '-4px' : '-8px' }}
          >
            {hair?.emoji}
          </AvatarLayer>
        )}
        
        {/* Accessory layer */}
        {accessory?.id !== 'none' && (
          <AvatarLayer 
            size={size} 
            zIndex={3}
            fontSize={size === 'xs' ? '0.6rem' : size === 'sm' ? '0.8rem' : undefined}
          >
            {accessory?.emoji}
          </AvatarLayer>
        )}
      </AvatarBase>

      {/* Achievement badge */}
      {showAchievementBadge && (
        <AchievementBadge
          size={size}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {achievementType === 'star' && '⭐'}
          {achievementType === 'crown' && '👑'}
          {achievementType === 'fire' && '🔥'}
          {achievementType === 'gem' && '💎'}
        </AchievementBadge>
      )}

      {/* Level indicator */}
      {showLevel && level && (
        <LevelIndicator size={size}>
          L{level}
        </LevelIndicator>
      )}
    </AvatarContainer>
  );
};

export default AvatarDisplay;