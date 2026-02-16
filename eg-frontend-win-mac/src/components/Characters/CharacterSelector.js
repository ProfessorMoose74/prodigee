import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ProfessorAl from './ProfessorAl';
import Ella from './Ella';
import Gus from './Gus';

const SelectorContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 2px solid ${({ theme }) => theme.colors.gray[100]};
  max-width: 500px;
  width: 100%;
`;

const SelectorTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin: 0;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const CharacterButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: center;
  flex-wrap: wrap;
`;

const CharacterButton = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ isActive, character, theme }) => {
    if (isActive) {
      if (character === 'professor') return theme.colors.characters.professor.primary;
      if (character === 'ella') return theme.colors.characters.ella.primary;
      if (character === 'gus') return theme.colors.characters.gus.primary;
    }
    return theme.colors.gray[100];
  }};
  border: 3px solid ${({ isActive, character, theme }) => {
    if (isActive) {
      if (character === 'professor') return theme.colors.characters.professor.secondary;
      if (character === 'ella') return theme.colors.characters.ella.secondary;
      if (character === 'gus') return theme.colors.characters.gus.secondary;
    }
    return theme.colors.gray[200];
  }};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.fast};
  min-width: 120px;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const CharacterEmoji = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const CharacterName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ isActive, theme }) => 
    isActive ? theme.colors.white : theme.colors.gray[600]
  };
  text-align: center;
`;

const CharacterAge = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ isActive, theme }) => 
    isActive ? `${theme.colors.white}CC` : theme.colors.gray[500]
  };
  text-align: center;
`;

const CharacterDisplay = styled(motion.div)`
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 300px;
  align-items: center;
`;

const AgeRecommendation = styled(motion.div)`
  background: ${({ character, theme }) => {
    if (character === 'professor') return `${theme.colors.characters.professor.primary}20`;
    if (character === 'ella') return `${theme.colors.characters.ella.primary}20`;
    if (character === 'gus') return `${theme.colors.characters.gus.primary}20`;
    return `${theme.colors.primary.blue}20`;
  }};
  border: 2px solid ${({ character, theme }) => {
    if (character === 'professor') return theme.colors.characters.professor.primary;
    if (character === 'ella') return theme.colors.characters.ella.primary;
    if (character === 'gus') return theme.colors.characters.gus.primary;
    return theme.colors.primary.blue;
  }};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const RecommendationText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const characters = {
  professor: {
    name: 'Professor Al',
    emoji: '👨‍🏫',
    ageRange: '3-13+',
    description: 'Einstein-inspired mentor who explains learning through science',
    personality: 'Wise, encouraging, scientific',
    bestFor: 'Older children who like explanations and scientific thinking'
  },
  ella: {
    name: 'Ella',
    emoji: '👧',
    ageRange: '5-8',
    description: 'Friendly elementary learning companion',
    personality: 'Supportive, social, encouraging',
    bestFor: 'Elementary age children who enjoy collaborative learning'
  },
  gus: {
    name: 'Gus',
    emoji: '🐨',
    ageRange: '3-6',
    description: 'Playful young learning buddy',
    personality: 'Fun, energetic, simple',
    bestFor: 'Younger children who learn best through play'
  }
};

const CharacterSelector = ({
  selectedCharacter = 'professor',
  onCharacterChange,
  showRecommendations = true,
  allowAutoSelect = true,
  userAge = null,
  className
}) => {
  const [currentCharacter, setCurrentCharacter] = useState(selectedCharacter);

  // Auto-select character based on age if provided
  React.useEffect(() => {
    if (allowAutoSelect && userAge && !selectedCharacter) {
      let recommendedCharacter = 'professor';
      
      if (userAge <= 4) {
        recommendedCharacter = 'gus';
      } else if (userAge <= 8) {
        recommendedCharacter = 'ella';
      }
      
      setCurrentCharacter(recommendedCharacter);
      if (onCharacterChange) {
        onCharacterChange(recommendedCharacter);
      }
    }
  }, [userAge, allowAutoSelect, selectedCharacter, onCharacterChange]);

  const handleCharacterSelect = (characterKey) => {
    setCurrentCharacter(characterKey);
    if (onCharacterChange) {
      onCharacterChange(characterKey);
    }
  };

  const renderCharacter = () => {
    const props = {
      size: 'large',
      autoSpeak: true,
      context: 'introduction'
    };

    switch (currentCharacter) {
      case 'professor':
        return <ProfessorAl {...props} />;
      case 'ella':
        return <Ella {...props} />;
      case 'gus':
        return <Gus {...props} />;
      default:
        return <ProfessorAl {...props} />;
    }
  };

  return (
    <SelectorContainer
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SelectorTitle>Choose Your Learning Companion</SelectorTitle>
      
      <CharacterButtons>
        {Object.entries(characters).map(([key, character]) => (
          <CharacterButton
            key={key}
            character={key}
            isActive={currentCharacter === key}
            onClick={() => handleCharacterSelect(key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * Object.keys(characters).indexOf(key) }}
          >
            <CharacterEmoji>{character.emoji}</CharacterEmoji>
            <CharacterName isActive={currentCharacter === key}>
              {character.name}
            </CharacterName>
            <CharacterAge isActive={currentCharacter === key}>
              Ages {character.ageRange}
            </CharacterAge>
          </CharacterButton>
        ))}
      </CharacterButtons>

      <CharacterDisplay>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCharacter}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {renderCharacter()}
          </motion.div>
        </AnimatePresence>
      </CharacterDisplay>

      {showRecommendations && (
        <AgeRecommendation
          character={currentCharacter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <RecommendationText>
            <strong>{characters[currentCharacter].name}</strong> is {characters[currentCharacter].bestFor}.
            {' '}
            {characters[currentCharacter].description}.
          </RecommendationText>
        </AgeRecommendation>
      )}
    </SelectorContainer>
  );
};

export default CharacterSelector;