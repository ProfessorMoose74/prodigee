import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const think = keyframes`
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

const ProfessorContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  max-width: 400px;
`;

const ProfessorAvatar = styled(motion.div)`
  width: ${({ size }) => size === 'large' ? '180px' : size === 'medium' ? '140px' : '100px'};
  height: ${({ size }) => size === 'large' ? '180px' : size === 'medium' ? '140px' : '100px'};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.characters.professor.primary},
    ${({ theme }) => theme.colors.characters.professor.secondary}
  );
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size === 'large' ? '6rem' : size === 'medium' ? '4.5rem' : '3rem'};
  cursor: pointer;
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 4px solid ${({ theme }) => theme.colors.white};
  
  &:hover {
    animation: ${think} 0.5s ease-in-out;
  }
  
  &::before {
    content: '✨';
    position: absolute;
    top: -10px;
    right: -10px;
    font-size: 1.5rem;
    animation: ${sparkle} 2s ease-in-out infinite;
    animation-delay: 0s;
  }
  
  &::after {
    content: '⚡';
    position: absolute;
    bottom: -5px;
    left: -5px;
    font-size: 1.2rem;
    animation: ${sparkle} 2s ease-in-out infinite;
    animation-delay: 1s;
  }
`;

const ThinkingCap = styled(motion.div)`
  position: absolute;
  top: -20px;
  font-size: 2rem;
  animation: ${think} 1s ease-in-out infinite;
`;

const SpeechBubble = styled(motion.div)`
  background: ${({ theme }) => theme.colors.characters.professor.accent};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[5]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 3px solid ${({ theme }) => theme.colors.characters.professor.primary};
  min-height: 80px;
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
    border-bottom: 15px solid ${({ theme }) => theme.colors.characters.professor.primary};
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
    border-bottom: 12px solid ${({ theme }) => theme.colors.characters.professor.accent};
  }
`;

const ProfessorText = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
`;

const ProfessorTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.characters.professor.primary};
  margin-top: ${({ theme }) => theme.spacing[3]};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const ScientificFormula = styled(motion.div)`
  position: absolute;
  top: ${({ top }) => top || '10%'};
  left: ${({ left }) => left || '10%'};
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.characters.professor.secondary};
  opacity: 0.7;
  font-family: 'Times New Roman', serif;
`;

// Professor Al's extensive knowledge base organized by context
const professorKnowledge = {
  curriculum: {
    week1to5: [
      "Let's begin our journey with rhyming! In science, patterns are everywhere - including in language.",
      "Rhyming words share similar sound patterns, just like how elements share properties in the periodic table.",
      "Think of rhyming as acoustic chemistry - sounds combining to create harmony!",
      "Every great scientist starts with observation. Let's observe how these sounds work together."
    ],
    week6to10: [
      "Now we're entering the realm of syllables - the building blocks of spoken language!",
      "Just as atoms combine to form molecules, syllables combine to form words.",
      "Let's count these syllables like we're counting elements in a compound!",
      "The rhythm of syllables is like the rhythm of heartbeats - fundamental to life and language."
    ],
    week11to20: [
      "Phoneme awareness is like having x-ray vision for sounds!",
      "We're about to isolate individual phonemes, just like isolating elements in a lab.",
      "Each phoneme is a unique sound particle - let's study their properties!",
      "Think of yourself as a sound scientist, analyzing the components of speech."
    ],
    week21to35: [
      "Advanced phoneme manipulation is like advanced chemistry - we're changing molecular structures!",
      "You're now ready for the most complex experiments in our language laboratory.",
      "We'll add, subtract, and substitute phonemes like true linguistic scientists!",
      "This is where theory meets practice - you're becoming a master of sound science!"
    ]
  },
  activities: {
    rhyming: [
      "Rhyming is our first experiment in phonological patterns!",
      "Let's discover which words create acoustic resonance together.",
      "In my lab, we call rhyming 'sound symmetry' - observe how these patterns emerge!",
      "Every rhyme is a hypothesis confirmed - you're thinking like a scientist!"
    ],
    blending: [
      "Blending phonemes is like mixing chemical compounds - precision is key!",
      "Watch as separate sound elements combine to create new meaning!",
      "This is molecular linguistics at work - individual parts forming a greater whole.",
      "Your brain is performing incredible computational work right now!"
    ],
    segmenting: [
      "Segmentation is like spectral analysis - breaking compounds into component elements!",
      "We're reverse-engineering words to understand their fundamental structure.",
      "Each phoneme we identify is like discovering a new element!",
      "This decomposition process is essential for understanding language architecture."
    ],
    manipulation: [
      "Phoneme manipulation is our most advanced experiment!",
      "You're now a linguistic alchemist, transforming one word into another!",
      "This is where creativity meets scientific method - innovation in action!",
      "Few young scientists master this level of phonological transformation!"
    ]
  },
  encouragement: {
    struggling: [
      "Every great discovery comes after multiple experiments - keep testing!",
      "In my lab, we say 'failure is data' - you're gathering valuable information!",
      "Einstein made thousands of mistakes before his breakthroughs - persistence pays off!",
      "Your brain is building new neural pathways right now - the learning is happening!"
    ],
    progressing: [
      "Excellent hypothesis testing! Your scientific method is improving!",
      "I observe significant progress in your phonological analysis skills!",
      "Your pattern recognition abilities are becoming quite sophisticated!",
      "You're developing the mind of a true language scientist!"
    ],
    mastering: [
      "Outstanding! You've achieved mastery worthy of the Scientific Hall of Fame!",
      "Your linguistic intuition rivals that of the great language researchers!",
      "This level of phoneme manipulation deserves a Nobel Prize in Learning!",
      "You've unlocked the mysteries of sound science - truly exceptional work!"
    ]
  }
};

const ProfessorAl = ({ 
  context = 'general',
  difficulty = 'medium',
  week = 1,
  activity = 'general',
  userProgress = 'progressing',
  size = 'medium',
  showThinking = false,
  autoSpeak = true,
  customMessage = null,
  onMessageComplete
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  // Scientific formulas that appear around Professor Al
  const formulas = ['E=mc²', 'φ + ω = λ', 'S∞Σn', '∆ABC', 'f(x)'];

  const getContextualMessage = useCallback(() => {
    if (customMessage) return customMessage;

    let messagePool = [];

    // Select appropriate message based on curriculum week
    if (week <= 5) {
      messagePool = professorKnowledge.curriculum.week1to5;
    } else if (week <= 10) {
      messagePool = professorKnowledge.curriculum.week6to10;
    } else if (week <= 20) {
      messagePool = professorKnowledge.curriculum.week11to20;
    } else {
      messagePool = professorKnowledge.curriculum.week21to35;
    }

    // Layer in activity-specific messages
    if (professorKnowledge.activities[activity]) {
      messagePool = [...messagePool, ...professorKnowledge.activities[activity]];
    }

    // Layer in progress-based encouragement
    if (professorKnowledge.encouragement[userProgress]) {
      messagePool = [...messagePool, ...professorKnowledge.encouragement[userProgress]];
    }

    return messagePool[Math.floor(Math.random() * messagePool.length)] || 
           "Welcome to our learning laboratory, young scientist!";
  }, [customMessage, week, activity, userProgress]);

  useEffect(() => {
    if (autoSpeak) {
      setIsThinking(true);
      setShowFormulas(true);
      
      // Simulate thinking time
      const thinkingTime = 1000 + Math.random() * 1000;
      
      setTimeout(() => {
        setCurrentMessage(getContextualMessage());
        setIsThinking(false);
        setShowFormulas(false);
        
        if (onMessageComplete) {
          onMessageComplete();
        }
      }, thinkingTime);
    }
  }, [autoSpeak, getContextualMessage, onMessageComplete]);

  const handleProfessorClick = () => {
    setIsThinking(true);
    setShowFormulas(true);
    
    setTimeout(() => {
      setCurrentMessage(getContextualMessage());
      setIsThinking(false);
      setShowFormulas(false);
    }, 800);
  };

  return (
    <ProfessorContainer>
      {showFormulas && formulas.map((formula, index) => (
        <ScientificFormula
          key={formula}
          top={`${10 + index * 15}%`}
          left={`${5 + index * 20}%`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ delay: index * 0.2 }}
        >
          {formula}
        </ScientificFormula>
      ))}

      <ProfessorAvatar
        size={size}
        onClick={handleProfessorClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.2 
        }}
      >
        👨‍🏫
        {(isThinking || showThinking) && (
          <ThinkingCap
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            🎓
          </ThinkingCap>
        )}
      </ProfessorAvatar>

      {currentMessage && (
        <SpeechBubble
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            type: "spring", 
            stiffness: 200 
          }}
        >
          <ProfessorText
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {currentMessage}
          </ProfessorText>
          <ProfessorTitle>— Professor Al, Ph.D. in Phonemic Sciences</ProfessorTitle>
        </SpeechBubble>
      )}
    </ProfessorContainer>
  );
};

export default ProfessorAl;