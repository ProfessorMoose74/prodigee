import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ActivityContainer = styled(motion.div)`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgrounds.activity};
  padding: ${({ theme }) => theme.spacing[8]};
`;

const ComingSoon = styled.div`
  text-align: center;
  max-width: 600px;
`;

const Icon = styled.div`
  font-size: 6rem;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const BackButton = styled.button`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary.blue};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.purple};
    transform: translateY(-2px);
  }
`;

const ActivityScreen = () => {
  const { activityType } = useParams();

  const getActivityInfo = (type) => {
    const activities = {
      'rhyming': { icon: '🎵', name: 'Rhyming Fun', description: 'Find words that sound alike!' },
      'blending': { icon: '🔗', name: 'Sound Blending', description: 'Put sounds together to make words!' },
      'segmenting': { icon: '✂️', name: 'Sound Breaking', description: 'Break words into their sounds!' },
      'phoneme-manipulation': { icon: '🎩', name: 'Sound Magic', description: 'Change sounds to create new words!' }
    };
    
    return activities[type] || { icon: '🎮', name: 'Learning Activity', description: 'An exciting learning adventure!' };
  };

  const activity = getActivityInfo(activityType);

  return (
    <ActivityContainer
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <ComingSoon>
        <Icon>{activity.icon}</Icon>
        <Title>{activity.name}</Title>
        <Description>
          {activity.description}
          <br /><br />
          This interactive learning activity is coming soon! 
          It will include voice recognition, character guidance, 
          and adaptive difficulty based on your progress.
        </Description>
        <BackButton onClick={() => window.history.back()}>
          ← Back to Dashboard
        </BackButton>
      </ComingSoon>
    </ActivityContainer>
  );
};

export default ActivityScreen;