import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { loadChildDashboard } from '../../store/slices/childSlice';
import LoadingScreen from '../UI/LoadingScreen';
import { ProfessorAl, Ella, Gus, getRecommendedCharacter } from '../Characters';
import AvatarDisplay from '../Avatar/AvatarDisplay';

const DashboardContainer = styled(motion.div)`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.backgrounds.child};
  overflow: hidden;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WelcomeSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const ChildAvatarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
    transition: transform ${({ theme }) => theme.animation.duration.fast};
  }
`;

const WelcomeText = styled.div``;

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StatsBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  align-items: center;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ color, theme }) => color || theme.colors.primary.green}20;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const StatContent = styled.div``;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const MainContent = styled.div`
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: ${({ theme }) => theme.spacing[8]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[8]};
  overflow-y: auto;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const ActivitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const ActivityCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 3px solid ${({ color, theme }) => color || theme.colors.primary.blue};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.normal};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${({ color, theme }) => color || theme.colors.primary.blue};
  }
`;

const ActivityIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto ${({ theme }) => theme.spacing[4]};
  background: ${({ color, theme }) => color || theme.colors.primary.blue}20;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
`;

const ActivityTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const ActivityDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ActivityProgress = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${({ color, theme }) => color || theme.colors.primary.blue};
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const StartButton = styled(motion.button)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ color, theme }) => color || theme.colors.primary.blue};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.fast};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.green};
    outline-offset: 2px;
  }
`;

const CharacterSection = styled(motion.div)`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius['3xl']};
  padding: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  text-align: center;
  position: relative;
  border: 3px solid ${({ character, theme }) => {
    if (character === 'professor') return theme.colors.characters.professor.primary;
    if (character === 'ella') return theme.colors.characters.ella.primary;
    if (character === 'gus') return theme.colors.characters.gus.primary;
    return theme.colors.primary.blue;
  }};
`;

const CharacterSwitcher = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const CharacterButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 2px solid ${({ isActive, character, theme }) => {
    if (isActive) {
      if (character === 'professor') return theme.colors.characters.professor.primary;
      if (character === 'ella') return theme.colors.characters.ella.primary;
      if (character === 'gus') return theme.colors.characters.gus.primary;
    }
    return theme.colors.gray[300];
  }};
  background: ${({ isActive, character, theme }) => {
    if (isActive) {
      if (character === 'professor') return theme.colors.characters.professor.accent;
      if (character === 'ella') return theme.colors.characters.ella.accent;
      if (character === 'gus') return theme.colors.characters.gus.accent;
    }
    return theme.colors.white;
  }};
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.1);
  }
`;

// Demo activities data
const activities = [
  {
    id: 'rhyming',
    title: 'Rhyming Fun',
    description: 'Find words that sound alike! Listen and match rhyming pairs.',
    icon: '🎵',
    color: '#EC4899',
    progress: 75,
    difficulty: 'Easy'
  },
  {
    id: 'blending',
    title: 'Sound Blending',
    description: 'Put sounds together to make words! Blend phonemes like a pro.',
    icon: '🔗',
    color: '#3B82F6',
    progress: 45,
    difficulty: 'Medium'
  },
  {
    id: 'segmenting',
    title: 'Sound Breaking',
    description: 'Break words into their sounds! Separate each phoneme.',
    icon: '✂️',
    color: '#10B981',
    progress: 20,
    difficulty: 'Hard'
  },
  {
    id: 'phoneme-manipulation',
    title: 'Sound Magic',
    description: 'Change, add, or remove sounds to create new words!',
    icon: '🎩',
    color: '#8B5CF6',
    progress: 5,
    difficulty: 'Expert'
  }
];

const professorMessages = [
  "Great work on your phonemic awareness journey!",
  "You're becoming a true sound detective!",
  "Ready for your next learning adventure?",
  "I'm so proud of your progress!"
];

const ChildDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoadingDashboard, profile } = useSelector(state => state.child);
  const { user } = useSelector(state => state.auth);
  const { currentAvatar } = useSelector(state => state.avatar);
  
  // Character management state
  const [currentCharacter, setCurrentCharacter] = useState('professor');
  const [characterKey, setCharacterKey] = useState(0); // Force re-render

  useEffect(() => {
    dispatch(loadChildDashboard());
    
    // Auto-select character based on user age or preferences
    const userAge = user?.age || profile?.age;
    if (userAge) {
      const recommendedCharacter = getRecommendedCharacter(userAge);
      setCurrentCharacter(recommendedCharacter);
    }
  }, [dispatch, user?.age, profile?.age]);

  const handleActivityStart = (activityId) => {
    navigate(`/child/activity/${activityId}`);
  };

  const handleCharacterChange = (character) => {
    setCurrentCharacter(character);
    setCharacterKey(prev => prev + 1); // Force character to re-render with new message
  };

  const handleAvatarClick = () => {
    navigate('/child/avatar');
  };

  if (isLoadingDashboard) {
    return (
      <LoadingScreen 
        message="Loading your learning adventure..."
        subtext="Getting your activities ready!"
      />
    );
  }

  const childName = user?.name || 'Young Learner';
  const totalStars = profile?.total_stars || 0;
  const streakDays = profile?.streak_days || 0;
  const currentWeek = profile?.current_week || 1;
  const userAge = user?.age || profile?.age || 7;

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Header>
        <WelcomeSection>
          <ChildAvatarContainer onClick={handleAvatarClick}>
            <AvatarDisplay
              avatarConfig={{
                skinTone: currentAvatar?.skinTone || 'light',
                hair: currentAvatar?.hairStyle || 'short-brown',
                accessory: currentAvatar?.glasses || 'none',
                expression: currentAvatar?.currentExpression || 'happy',
                background: 'default'
              }}
              size="md"
              showSparkles={streakDays > 0}
              isAnimated={true}
              showLevel={true}
              level={profile?.level || 1}
              showAchievementBadge={totalStars >= 10}
              achievementType="star"
            />
          </ChildAvatarContainer>
          <WelcomeText>
            <WelcomeTitle>Hi there, {childName}!</WelcomeTitle>
            <WelcomeSubtitle>Ready to learn and have fun?</WelcomeSubtitle>
          </WelcomeText>
        </WelcomeSection>

        <StatsBar>
          <StatItem>
            <StatIcon color="#F59E0B">⭐</StatIcon>
            <StatContent>
              <StatValue>{totalStars}</StatValue>
              <StatLabel>Stars</StatLabel>
            </StatContent>
          </StatItem>
          
          <StatItem>
            <StatIcon color="#EF4444">🔥</StatIcon>
            <StatContent>
              <StatValue>{streakDays}</StatValue>
              <StatLabel>Day Streak</StatLabel>
            </StatContent>
          </StatItem>
          
          <StatItem>
            <StatIcon color="#8B5CF6">📚</StatIcon>
            <StatContent>
              <StatValue>{currentWeek}</StatValue>
              <StatLabel>Week</StatLabel>
            </StatContent>
          </StatItem>
        </StatsBar>
      </Header>

      <MainContent>
        {/* Dynamic Character Section */}
        <CharacterSection
          character={currentCharacter}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CharacterSwitcher>
            <CharacterButton
              character="professor"
              isActive={currentCharacter === 'professor'}
              onClick={() => handleCharacterChange('professor')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              👨‍🏫
            </CharacterButton>
            <CharacterButton
              character="ella"
              isActive={currentCharacter === 'ella'}
              onClick={() => handleCharacterChange('ella')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              👧
            </CharacterButton>
            <CharacterButton
              character="gus"
              isActive={currentCharacter === 'gus'}
              onClick={() => handleCharacterChange('gus')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              🐨
            </CharacterButton>
          </CharacterSwitcher>
          
          {currentCharacter === 'professor' && (
            <ProfessorAl
              key={`professor-${characterKey}`}
              size="large"
              week={currentWeek}
              context="dashboard"
              userProgress="progressing"
              autoSpeak={true}
            />
          )}
          
          {currentCharacter === 'ella' && (
            <Ella
              key={`ella-${characterKey}`}
              size="large"
              context="dashboard"
              gamePhase="start"
              userMood="neutral"
              autoSpeak={true}
            />
          )}
          
          {currentCharacter === 'gus' && (
            <Gus
              key={`gus-${characterKey}`}
              size="large"
              context="dashboard"
              activity="simple"
              energy="medium"
              autoSpeak={true}
            />
          )}
        </CharacterSection>

        {/* Activities Section */}
        <div>
          <SectionTitle>Choose Your Learning Activity</SectionTitle>
          
          <ActivitiesGrid>
            {activities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                color={activity.color}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleActivityStart(activity.id)}
              >
                <ActivityIcon color={activity.color}>
                  {activity.icon}
                </ActivityIcon>
                
                <ActivityTitle>{activity.title}</ActivityTitle>
                <ActivityDescription>{activity.description}</ActivityDescription>
                
                <ActivityProgress>
                  <ProgressLabel>
                    <span>Progress</span>
                    <span>{activity.progress}%</span>
                  </ProgressLabel>
                  <ProgressBar>
                    <ProgressFill
                      color={activity.color}
                      initial={{ width: '0%' }}
                      animate={{ width: `${activity.progress}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                    />
                  </ProgressBar>
                </ActivityProgress>
                
                <StartButton
                  color={activity.color}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Learning! 🚀
                </StartButton>
              </ActivityCard>
            ))}
          </ActivitiesGrid>
        </div>
      </MainContent>
    </DashboardContainer>
  );
};

export default ChildDashboard;