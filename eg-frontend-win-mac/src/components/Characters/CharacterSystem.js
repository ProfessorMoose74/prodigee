import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(-2deg); }
  66% { transform: translateY(5px) rotate(2deg); }
`;

const CharacterContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const CharacterAvatar = styled(motion.div)`
  width: ${({ size }) => size === 'large' ? '160px' : size === 'medium' ? '120px' : '80px'};
  height: ${({ size }) => size === 'large' ? '160px' : size === 'medium' ? '120px' : '80px'};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size === 'large' ? '5rem' : size === 'medium' ? '4rem' : '2.5rem'};
  cursor: pointer;
  position: relative;
  background: ${({ character, theme }) => {
    if (character === 'professor') return `linear-gradient(135deg, ${theme.colors.characters.professor.primary}, ${theme.colors.characters.professor.secondary})`;
    if (character === 'ella') return `linear-gradient(135deg, ${theme.colors.characters.ella.primary}, ${theme.colors.characters.ella.secondary})`;
    if (character === 'gus') return `linear-gradient(135deg, ${theme.colors.characters.gus.primary}, ${theme.colors.characters.gus.secondary})`;
    return theme.colors.primary.blue;
  }};
  
  &:hover {
    animation: ${bounce} 1s ease-in-out;
  }
  
  ${({ isActive }) => isActive && `
    animation: ${glow} 2s ease-in-out infinite;
  `}
  
  ${({ isFloating }) => isFloating && `
    animation: ${float} 3s ease-in-out infinite;
  `}
`;

const CharacterBubble = styled(motion.div)`
  background: ${({ character, theme }) => {
    if (character === 'professor') return theme.colors.characters.professor.accent;
    if (character === 'ella') return theme.colors.characters.ella.accent;
    if (character === 'gus') return theme.colors.characters.gus.accent;
    return theme.colors.white;
  }};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[3]};
  max-width: 300px;
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 2px solid ${({ character, theme }) => {
    if (character === 'professor') return theme.colors.characters.professor.primary;
    if (character === 'ella') return theme.colors.characters.ella.primary;
    if (character === 'gus') return theme.colors.characters.gus.primary;
    return theme.colors.primary.blue;
  }};
  
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
    border-bottom: 12px solid ${({ character, theme }) => {
      if (character === 'professor') return theme.colors.characters.professor.primary;
      if (character === 'ella') return theme.colors.characters.ella.primary;
      if (character === 'gus') return theme.colors.characters.gus.primary;
      return theme.colors.primary.blue;
    }};
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
    border-bottom: 10px solid ${({ character, theme }) => {
      if (character === 'professor') return theme.colors.characters.professor.accent;
      if (character === 'ella') return theme.colors.characters.ella.accent;
      if (character === 'gus') return theme.colors.characters.gus.accent;
      return theme.colors.white;
    }};
  }
`;

const CharacterText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
  text-align: center;
`;

const CharacterName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ character, theme }) => {
    if (character === 'professor') return theme.colors.characters.professor.primary;
    if (character === 'ella') return theme.colors.characters.ella.primary;
    if (character === 'gus') return theme.colors.characters.gus.primary;
    return theme.colors.primary.blue;
  }};
  margin-top: ${({ theme }) => theme.spacing[2]};
  text-align: center;
`;

const CharacterSelector = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  justify-content: center;
`;

const SelectorButton = styled(motion.button)`
  background: ${({ isActive, character, theme }) => {
    if (isActive) {
      if (character === 'professor') return theme.colors.characters.professor.primary;
      if (character === 'ella') return theme.colors.characters.ella.primary;
      if (character === 'gus') return theme.colors.characters.gus.primary;
    }
    return theme.colors.gray[200];
  }};
  color: ${({ isActive, theme }) => isActive ? theme.colors.white : theme.colors.gray[600]};
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.fast};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

// Character data with age-appropriate messages and personalities
const characters = {
  professor: {
    name: 'Professor Al',
    emoji: '👨‍🏫',
    ageRange: '3-13+',
    personality: 'Wise, encouraging Einstein-inspired mentor',
    messages: {
      greeting: [
        "Welcome to our learning laboratory!",
        "Ready for a scientific adventure with sounds?",
        "Let's discover the fascinating world of phonemes!",
        "Time to put on our thinking caps!"
      ],
      encouragement: [
        "Excellent hypothesis! You're thinking like a scientist!",
        "Your brain is making incredible connections!",
        "That's the scientific method at work!",
        "Outstanding observation, young researcher!"
      ],
      instruction: [
        "Let's experiment with these sounds together.",
        "Observe carefully and listen with your scientist ears.",
        "Every mistake is a discovery in disguise!",
        "Let's test this theory with another example."
      ],
      celebration: [
        "Eureka! You've made a breakthrough!",
        "Your scientific mind is truly impressive!",
        "That's Nobel Prize-worthy thinking!",
        "You've unlocked another language mystery!"
      ]
    }
  },
  ella: {
    name: 'Ella',
    emoji: '👧',
    ageRange: '5-8',
    personality: 'Friendly elementary learning companion',
    messages: {
      greeting: [
        "Hi there! Ready to play with sounds?",
        "Let's go on a word adventure together!",
        "I love learning new things with friends like you!",
        "Welcome to our special learning playground!"
      ],
      encouragement: [
        "You're doing such a great job!",
        "I knew you could figure that out!",
        "Your listening skills are amazing!",
        "Keep going, you're almost there!"
      ],
      instruction: [
        "Let's listen really carefully to this sound.",
        "Can you help me find the sounds in this word?",
        "Let's play a fun game with these letters!",
        "I'll say it slowly so we can hear each part."
      ],
      celebration: [
        "Yay! That was perfect!",
        "You're becoming a word detective!",
        "High five! You got it right!",
        "I'm so proud of you!"
      ]
    }
  },
  gus: {
    name: 'Gus',
    emoji: '🐨',
    ageRange: '3-6',
    personality: 'Playful young learning buddy',
    messages: {
      greeting: [
        "Hi friend! Want to play with sounds?",
        "Let's make some fun noises together!",
        "I like playing games! Do you?",
        "Sounds are so much fun!"
      ],
      encouragement: [
        "Wow! You're so smart!",
        "That was really good!",
        "You're my favorite learning buddy!",
        "I like how you listen!"
      ],
      instruction: [
        "Let's make this sound together: ",
        "Can you say it like me?",
        "Let's clap for each sound we hear!",
        "Listen with your special ears!"
      ],
      celebration: [
        "Hooray! You did it!",
        "That was super awesome!",
        "You're the best at this game!",
        "Let's do a happy dance!"
      ]
    }
  }
};

const CharacterSystem = ({ 
  selectedCharacter = 'professor',
  onCharacterChange,
  messageType = 'greeting',
  customMessage = null,
  size = 'medium',
  showSelector = false,
  isActive = false,
  isFloating = false,
  className
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const character = characters[selectedCharacter];
    if (customMessage) {
      setCurrentMessage(customMessage);
    } else if (character && character.messages[messageType]) {
      const messages = character.messages[messageType];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
    }
  }, [selectedCharacter, messageType, customMessage]);

  const handleCharacterClick = () => {
    setShowBubble(!showBubble);
    // Rotate through different message types on click
    const types = ['greeting', 'encouragement', 'instruction', 'celebration'];
    const currentIndex = types.indexOf(messageType);
    const nextType = types[(currentIndex + 1) % types.length];
    
    if (!customMessage) {
      const character = characters[selectedCharacter];
      const messages = character.messages[nextType];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
    }
  };

  const character = characters[selectedCharacter];

  return (
    <CharacterContainer className={className}>
      {showSelector && (
        <CharacterSelector>
          {Object.entries(characters).map(([key, char]) => (
            <SelectorButton
              key={key}
              character={key}
              isActive={selectedCharacter === key}
              onClick={() => onCharacterChange && onCharacterChange(key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {char.emoji} {char.name}
            </SelectorButton>
          ))}
        </CharacterSelector>
      )}

      <CharacterAvatar
        character={selectedCharacter}
        size={size}
        isActive={isActive}
        isFloating={isFloating}
        onClick={handleCharacterClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {character.emoji}
      </CharacterAvatar>

      <AnimatePresence>
        {showBubble && currentMessage && (
          <CharacterBubble
            character={selectedCharacter}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <CharacterText>{currentMessage}</CharacterText>
            <CharacterName character={selectedCharacter}>
              — {character.name}
            </CharacterName>
          </CharacterBubble>
        )}
      </AnimatePresence>
    </CharacterContainer>
  );
};

export default CharacterSystem;