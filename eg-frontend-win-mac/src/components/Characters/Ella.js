import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
`;

const sparkleHeart = keyframes`
  0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(360deg); }
`;

const wiggle = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
`;

const EllaContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  max-width: 380px;
`;

const EllaAvatar = styled(motion.div)`
  width: ${({ size }) => size === 'large' ? '160px' : size === 'medium' ? '130px' : '90px'};
  height: ${({ size }) => size === 'large' ? '160px' : size === 'medium' ? '130px' : '90px'};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.characters.ella.primary},
    ${({ theme }) => theme.colors.characters.ella.secondary}
  );
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size === 'large' ? '5rem' : size === 'medium' ? '4rem' : '2.8rem'};
  cursor: pointer;
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 3px solid ${({ theme }) => theme.colors.white};
  
  &:hover {
    animation: ${bounce} 0.8s ease-in-out;
  }
  
  &::before {
    content: '💖';
    position: absolute;
    top: -8px;
    right: -8px;
    font-size: 1.2rem;
    animation: ${sparkleHeart} 2s ease-in-out infinite;
    animation-delay: 0s;
  }
  
  &::after {
    content: '✨';
    position: absolute;
    bottom: -5px;
    left: -5px;
    font-size: 1rem;
    animation: ${sparkleHeart} 2s ease-in-out infinite;
    animation-delay: 1s;
  }
`;

const FriendshipBadge = styled(motion.div)`
  position: absolute;
  top: -15px;
  left: -15px;
  background: ${({ theme }) => theme.colors.characters.ella.accent};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 2px solid ${({ theme }) => theme.colors.characters.ella.primary};
  animation: ${wiggle} 2s ease-in-out infinite;
`;

const SpeechBubble = styled(motion.div)`
  background: ${({ theme }) => theme.colors.characters.ella.accent};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 2px solid ${({ theme }) => theme.colors.characters.ella.primary};
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid ${({ theme }) => theme.colors.characters.ella.primary};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid ${({ theme }) => theme.colors.characters.ella.accent};
  }
`;

const EllaText = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const EllaName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.characters.ella.primary};
  margin-top: ${({ theme }) => theme.spacing[2]};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const EncouragementStars = styled(motion.div)`
  position: absolute;
  top: ${({ top }) => top || '20%'};
  left: ${({ left }) => left || '20%'};
  font-size: 1.5rem;
  animation: ${sparkleHeart} 3s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay || '0s'};
`;

// Ella's friendly and encouraging knowledge base
const ellaKnowledge = {
  curriculum: {
    rhyming: [
      "Rhyming words are like best friends - they sound so much alike!",
      "Let's find words that like to play together because they rhyme!",
      "I love how some words sound like they're singing the same song!",
      "When words rhyme, it's like they're wearing matching outfits!"
    ],
    syllables: [
      "Syllables are like the beats in our favorite songs!",
      "Let's clap along with each part of the word - it's so much fun!",
      "Every syllable is like a step we take when we say a word!",
      "I like to think of syllables as word puzzles we can solve together!"
    ],
    phonemes: [
      "Each sound in a word is special - like each friend in our class!",
      "Let's listen really carefully to hear all the sounds hiding in words!",
      "Every phoneme is like a secret ingredient in our word recipe!",
      "I'm so excited to go sound hunting with you!"
    ],
    blending: [
      "Blending sounds is like mixing colors to make beautiful pictures!",
      "Watch how these sounds come together to make amazing words!",
      "It's like we're word chefs, mixing ingredients to make something yummy!",
      "You're getting so good at putting sounds together - I'm proud of you!"
    ],
    segmenting: [
      "Let's take words apart like we're opening a surprise gift!",
      "Each sound we find is like discovering a hidden treasure!",
      "Breaking words into sounds is like solving a fun mystery!",
      "You have such good listening ears for finding all these sounds!"
    ]
  },
  encouragement: {
    trying: [
      "I can see you're thinking really hard - that's awesome!",
      "You're such a good listener, and I know you can figure this out!",
      "It's okay to take your time - learning is not a race!",
      "Every try gets you closer to the answer - keep going!"
    ],
    improving: [
      "Wow! You're getting so much better at this!",
      "I love watching you learn new things - you're amazing!",
      "Your brain is working so well today!",
      "You should feel proud of how hard you're working!"
    ],
    succeeding: [
      "Yes! That was perfect! I'm so happy for you!",
      "You did it! I knew you were smart enough to figure it out!",
      "That was incredible! You're becoming such a good reader!",
      "I'm bursting with pride watching you learn so well!"
    ]
  },
  activities: {
    gameStart: [
      "Are you ready to play our learning game? I am!",
      "This is going to be so much fun - I love playing with you!",
      "Let's see what exciting words we'll discover today!",
      "I have a good feeling about this game - you're going to do great!"
    ],
    gameMiddle: [
      "You're doing such a good job! Let's keep playing!",
      "This is my favorite part - when we're learning together!",
      "I can tell you're really understanding this now!",
      "We make such a good learning team, don't we?"
    ],
    gameEnd: [
      "What a fantastic game! You played so well!",
      "I had the best time learning with you today!",
      "You should be super proud of what you accomplished!",
      "I can't wait to play and learn with you again soon!"
    ]
  },
  social: [
    "Learning is always more fun when we do it together!",
    "I think you're one of the nicest learning friends I've ever had!",
    "It makes me happy when I see you trying your best!",
    "You know what? You're not just smart - you're also really kind!"
  ]
};

const Ella = ({ 
  context = 'general',
  activity = 'general',
  gamePhase = 'start',
  userMood = 'neutral',
  size = 'medium',
  showEncouragement = false,
  autoSpeak = true,
  customMessage = null,
  onMessageComplete
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isExcited, setIsExcited] = useState(false);
  const [showStars, setShowStars] = useState(false);

  const getContextualMessage = useCallback(() => {
    if (customMessage) return customMessage;

    let messagePool = [];

    // Select appropriate messages based on context and activity
    if (ellaKnowledge.curriculum[activity]) {
      messagePool = [...messagePool, ...ellaKnowledge.curriculum[activity]];
    }

    if (ellaKnowledge.activities[gamePhase]) {
      messagePool = [...messagePool, ...ellaKnowledge.activities[gamePhase]];
    }

    // Add encouragement based on user's apparent progress
    if (userMood === 'struggling') {
      messagePool = [...messagePool, ...ellaKnowledge.encouragement.trying];
    } else if (userMood === 'improving') {
      messagePool = [...messagePool, ...ellaKnowledge.encouragement.improving];
    } else if (userMood === 'succeeding') {
      messagePool = [...messagePool, ...ellaKnowledge.encouragement.succeeding];
    }

    // Add some social connection messages
    messagePool = [...messagePool, ...ellaKnowledge.social];

    return messagePool[Math.floor(Math.random() * messagePool.length)] || 
           "Hi there! I'm so excited to learn with you today!";
  }, [customMessage, activity, gamePhase, userMood]);

  useEffect(() => {
    if (autoSpeak) {
      setIsExcited(true);
      setShowStars(true);
      
      // Shorter thinking time than Professor Al - Ella is more spontaneous
      const excitementTime = 500 + Math.random() * 500;
      
      setTimeout(() => {
        setCurrentMessage(getContextualMessage());
        setIsExcited(false);
        
        if (onMessageComplete) {
          onMessageComplete();
        }
      }, excitementTime);

      // Keep stars showing a bit longer for visual appeal
      setTimeout(() => {
        setShowStars(false);
      }, excitementTime + 2000);
    }
  }, [autoSpeak, getContextualMessage, onMessageComplete]);

  const handleEllaClick = () => {
    setIsExcited(true);
    setShowStars(true);
    
    setTimeout(() => {
      setCurrentMessage(getContextualMessage());
      setIsExcited(false);
    }, 400);

    setTimeout(() => {
      setShowStars(false);
    }, 2000);
  };

  const stars = ['⭐', '✨', '💫', '🌟', '💖'];

  return (
    <EllaContainer>
      {showStars && stars.map((star, index) => (
        <EncouragementStars
          key={`${star}-${index}`}
          top={`${10 + index * 20}%`}
          left={`${15 + index * 15}%`}
          delay={`${index * 0.3}s`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {star}
        </EncouragementStars>
      ))}

      <EllaAvatar
        size={size}
        onClick={handleEllaClick}
        whileHover={{ scale: 1.08, rotate: 5 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          delay: 0.1 
        }}
      >
        👧
        {(isExcited || showEncouragement) && (
          <FriendshipBadge
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            🎨
          </FriendshipBadge>
        )}
      </EllaAvatar>

      {currentMessage && (
        <SpeechBubble
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.4, 
            type: "spring", 
            stiffness: 250 
          }}
        >
          <EllaText
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {currentMessage}
          </EllaText>
          <EllaName>— Ella, Your Learning Friend</EllaName>
        </SpeechBubble>
      )}
    </EllaContainer>
  );
};

export default Ella;