import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const hop = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-12px) rotate(-5deg); }
  50% { transform: translateY(-8px) rotate(0deg); }
  75% { transform: translateY(-12px) rotate(5deg); }
`;

const giggle = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-2deg); }
  50% { transform: scale(1.05) rotate(2deg); }
  75% { transform: scale(1.08) rotate(-1deg); }
`;

const playfulSpin = keyframes`
  from { transform: rotate(0deg) scale(0.8); opacity: 0; }
  to { transform: rotate(360deg) scale(1); opacity: 1; }
`;

const GusContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  max-width: 350px;
`;

const GusAvatar = styled(motion.div)`
  width: ${({ size }) => size === 'large' ? '150px' : size === 'medium' ? '120px' : '85px'};
  height: ${({ size }) => size === 'large' ? '150px' : size === 'medium' ? '120px' : '85px'};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.characters.gus.primary},
    ${({ theme }) => theme.colors.characters.gus.secondary}
  );
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size === 'large' ? '4.5rem' : size === 'medium' ? '3.5rem' : '2.5rem'};
  cursor: pointer;
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 3px solid ${({ theme }) => theme.colors.white};
  
  &:hover {
    animation: ${hop} 1s ease-in-out;
  }
  
  &::before {
    content: '🎈';
    position: absolute;
    top: -12px;
    right: -8px;
    font-size: 1.8rem;
    animation: ${playfulSpin} 2s linear infinite;
    animation-delay: 0s;
  }
  
  &::after {
    content: '🌈';
    position: absolute;
    bottom: -8px;
    left: -12px;
    font-size: 1.2rem;
    animation: ${playfulSpin} 2s linear infinite;
    animation-delay: 1s;
  }
`;

const PlayfulAccessory = styled(motion.div)`
  position: absolute;
  top: -10px;
  font-size: 2rem;
  animation: ${giggle} 2s ease-in-out infinite;
  z-index: 2;
`;

const SpeechBubble = styled(motion.div)`
  background: ${({ theme }) => theme.colors.characters.gus.accent};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[3]};
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 3px solid ${({ theme }) => theme.colors.characters.gus.primary};
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-bottom: 15px solid ${({ theme }) => theme.colors.characters.gus.primary};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid ${({ theme }) => theme.colors.characters.gus.accent};
  }
`;

const GusText = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const GusName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.characters.gus.primary};
  margin-top: ${({ theme }) => theme.spacing[2]};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const PlayfulIcon = styled(motion.div)`
  position: absolute;
  top: ${({ top }) => top || '15%'};
  left: ${({ left }) => left || '15%'};
  font-size: 1.8rem;
  animation: ${hop} 3s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay || '0s'};
`;

// Gus's simple, playful, and age-appropriate knowledge base
const gusKnowledge = {
  curriculum: {
    rhyming: [
      "Rhyming is like a fun song! Let's sing together!",
      "Some words sound the same at the end - that's so cool!",
      "I like words that rhyme because they sound silly!",
      "Let's find words that like to play together!"
    ],
    sounds: [
      "Every word has special sounds hiding inside!",
      "Let's go on a sound hunt - this is my favorite game!",
      "I hear sounds everywhere! Can you hear them too?",
      "Making sounds is so much fun! Let's try together!"
    ],
    simple: [
      "Let's play with sounds! I love this game!",
      "Can you make this sound with me?",
      "Wow! You're so good at listening!",
      "This is the best game ever!"
    ]
  },
  encouragement: {
    trying: [
      "You're trying so hard! That makes me happy!",
      "It's okay! Let's try again together!",
      "I like how you listen so carefully!",
      "Don't worry, I'm here to help!"
    ],
    playing: [
      "This is so much fun! I love playing with you!",
      "You're getting it! Keep going!",
      "I can see you're learning! That's awesome!",
      "You make learning so much fun!"
    ],
    celebrating: [
      "Yay! You did it! Let's dance!",
      "That was amazing! I'm so proud!",
      "You're the best at this game!",
      "Hooray! You're so smart!"
    ]
  },
  playful: [
    "Want to play another game?",
    "I have so many fun games we can play!",
    "Learning with you is my favorite thing!",
    "You're my best friend for learning!",
    "I love how you smile when we play!",
    "Can we play this game again? Please?"
  ],
  reactions: {
    excited: [
      "This is the BEST game!",
      "I'm so excited! Are you excited too?",
      "Wow wow wow! This is amazing!",
      "I can't wait to play more!"
    ],
    gentle: [
      "It's okay, we can take our time.",
      "Let's go slow and have fun.",
      "No rush! We have lots of time to play.",
      "Every try makes you better!"
    ],
    silly: [
      "That was so silly! I love silly!",
      "Hehe! That made me giggle!",
      "You're funny! I like funny friends!",
      "Let's be silly together!"
    ]
  }
};

const Gus = ({ 
  context = 'general',
  activity = 'simple',
  energy = 'medium',
  userResponse = 'playing',
  size = 'medium',
  showPlayfulness = false,
  autoSpeak = true,
  customMessage = null,
  onMessageComplete
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isPlayful, setIsPlayful] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  const getContextualMessage = useCallback(() => {
    if (customMessage) return customMessage;

    let messagePool = [];

    // Simple activity-based messages
    if (gusKnowledge.curriculum[activity]) {
      messagePool = [...messagePool, ...gusKnowledge.curriculum[activity]];
    }

    // Add encouragement based on user response
    if (gusKnowledge.encouragement[userResponse]) {
      messagePool = [...messagePool, ...gusKnowledge.encouragement[userResponse]];
    }

    // Add reaction based on energy level
    if (energy === 'high' && gusKnowledge.reactions.excited) {
      messagePool = [...messagePool, ...gusKnowledge.reactions.excited];
    } else if (energy === 'low' && gusKnowledge.reactions.gentle) {
      messagePool = [...messagePool, ...gusKnowledge.reactions.gentle];
    } else if (energy === 'silly' && gusKnowledge.reactions.silly) {
      messagePool = [...messagePool, ...gusKnowledge.reactions.silly];
    }

    // Always include some playful messages - that's Gus's nature!
    messagePool = [...messagePool, ...gusKnowledge.playful];

    return messagePool[Math.floor(Math.random() * messagePool.length)] || 
           "Hi friend! Let's play and learn together!";
  }, [customMessage, activity, energy, userResponse]);

  useEffect(() => {
    if (autoSpeak) {
      setIsPlayful(true);
      setShowIcons(true);
      
      // Very quick response time - Gus is spontaneous and eager
      const playTime = 300 + Math.random() * 300;
      
      setTimeout(() => {
        setCurrentMessage(getContextualMessage());
        setIsPlayful(false);
        
        if (onMessageComplete) {
          onMessageComplete();
        }
      }, playTime);

      // Keep icons showing longer for playful effect
      setTimeout(() => {
        setShowIcons(false);
      }, playTime + 3000);
    }
  }, [autoSpeak, getContextualMessage, onMessageComplete]);

  const handleGusClick = () => {
    setIsPlayful(true);
    setShowIcons(true);
    
    setTimeout(() => {
      setCurrentMessage(getContextualMessage());
      setIsPlayful(false);
    }, 200);

    setTimeout(() => {
      setShowIcons(false);
    }, 2500);
  };

  const playfulIcons = ['🎮', '🎨', '🎵', '🌟', '🎈', '🦋', '🌈'];

  return (
    <GusContainer>
      {showIcons && playfulIcons.map((icon, index) => (
        <PlayfulIcon
          key={`${icon}-${index}`}
          top={`${5 + index * 12}%`}
          left={`${10 + (index % 2) * 70}%`}
          delay={`${index * 0.2}s`}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 0.8, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 180 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          {icon}
        </PlayfulIcon>
      ))}

      <GusAvatar
        size={size}
        onClick={handleGusClick}
        whileHover={{ 
          scale: 1.15, 
          rotate: [0, -10, 10, -10, 0],
          transition: { duration: 0.5 }
        }}
        whileTap={{ scale: 0.9, rotate: -15 }}
        initial={{ scale: 0, rotate: -45, y: 50 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 15,
          delay: 0.3 
        }}
      >
        🐨
        {(isPlayful || showPlayfulness) && (
          <PlayfulAccessory
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            🎉
          </PlayfulAccessory>
        )}
      </GusAvatar>

      {currentMessage && (
        <SpeechBubble
          initial={{ opacity: 0, y: 30, scale: 0.7, rotate: -10 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.6, 
            type: "spring", 
            stiffness: 300,
            damping: 15
          }}
        >
          <GusText
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {currentMessage}
          </GusText>
          <GusName>— Gus, Your Play Buddy</GusName>
        </SpeechBubble>
      )}
    </GusContainer>
  );
};

export default Gus;