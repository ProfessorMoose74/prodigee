import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

const CustomizerContainer = styled(motion.div)`
  width: 100%;
  height: 100vh;
  display: flex;
  background: ${({ theme }) => theme.colors.backgrounds.primary};
  overflow: hidden;
`;

const PreviewSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.blue}20,
    ${({ theme }) => theme.colors.primary.purple}20
  );
  position: relative;
  padding: ${({ theme }) => theme.spacing[8]};
`;

const AvatarPreview = styled(motion.div)`
  width: 300px;
  height: 300px;
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const AvatarBase = styled(motion.div)`
  width: 100%;
  height: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ skinColor }) => skinColor || '#FFD1A9'};
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 4px solid ${({ theme }) => theme.colors.white};
  overflow: hidden;
`;

const AvatarLayer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size || '4rem'};
  z-index: ${({ zIndex }) => zIndex || 1};
`;

const CustomizationPanel = styled.div`
  width: 400px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
`;

const PanelHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary.purple};
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
`;

const PanelTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const CategoryList = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing[4]};
`;

const CategorySection = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const CategoryTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const CategoryIcon = styled.span`
  font-size: 1.5rem;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
`;

const OptionButton = styled(motion.button)`
  aspect-ratio: 1;
  border: 3px solid ${({ isSelected, theme }) => 
    isSelected ? theme.colors.primary.purple : theme.colors.gray[300]
  };
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ isSelected, isLocked, theme }) => {
    if (isLocked) return theme.colors.gray[100];
    if (isSelected) return theme.colors.primary.purple + '20';
    return theme.colors.white;
  }};
  cursor: ${({ isLocked }) => isLocked ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  position: relative;
  transition: all ${({ theme }) => theme.animation.duration.fast};
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  ${({ isLocked }) => isLocked && `
    opacity: 0.5;
    &::after {
      content: '🔒';
      position: absolute;
      bottom: -8px;
      right: -8px;
      background: #FFF;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  `}
`;

const UnlockInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: ${({ theme }) => theme.spacing[1]};
  text-align: center;
`;

const SaveButton = styled(motion.button)`
  margin: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.primary.green};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary.blue};
    transform: translateY(-2px);
  }
`;

const AchievementNotification = styled(motion.div)`
  position: absolute;
  top: ${({ theme }) => theme.spacing[6]};
  right: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary.green};
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 1000;
`;

// Avatar customization options
const avatarOptions = {
  skinTones: [
    { id: 'light', color: '#FFD1A9', emoji: '👶🏻', unlocked: true },
    { id: 'medium-light', color: '#F0C89F', emoji: '👶🏼', unlocked: true },
    { id: 'medium', color: '#D4A574', emoji: '👶🏽', unlocked: true },
    { id: 'medium-dark', color: '#B8956B', emoji: '👶🏾', unlocked: true },
    { id: 'dark', color: '#8B6914', emoji: '👶🏿', unlocked: true }
  ],
  hair: [
    { id: 'none', emoji: '👦', unlocked: true, requirement: null },
    { id: 'short-brown', emoji: '👦', unlocked: true, requirement: null },
    { id: 'long-blonde', emoji: '👧', unlocked: false, requirement: '10 activities completed' },
    { id: 'curly-black', emoji: '👦🏿', unlocked: false, requirement: '25 activities completed' },
    { id: 'pigtails', emoji: '👧', unlocked: false, requirement: '50 activities completed' },
    { id: 'mohawk', emoji: '🤵', unlocked: false, requirement: '100 activities completed' }
  ],
  accessories: [
    { id: 'none', emoji: '', unlocked: true, requirement: null },
    { id: 'glasses', emoji: '🤓', unlocked: false, requirement: '5 perfect scores' },
    { id: 'hat', emoji: '👒', unlocked: false, requirement: '10 perfect scores' },
    { id: 'crown', emoji: '👑', unlocked: false, requirement: '25 perfect scores' },
    { id: 'superhero-mask', emoji: '🦸', unlocked: false, requirement: '50 perfect scores' },
    { id: 'wizard-hat', emoji: '🧙', unlocked: false, requirement: '100 perfect scores' }
  ],
  expressions: [
    { id: 'happy', emoji: '😊', unlocked: true, requirement: null },
    { id: 'excited', emoji: '😃', unlocked: true, requirement: null },
    { id: 'cool', emoji: '😎', unlocked: false, requirement: '20 activities completed' },
    { id: 'wink', emoji: '😉', unlocked: false, requirement: '1 week streak' },
    { id: 'star-eyes', emoji: '🤩', unlocked: false, requirement: '2 week streak' },
    { id: 'genius', emoji: '🧠', unlocked: false, requirement: '1 month streak' }
  ],
  backgrounds: [
    { id: 'default', emoji: '🌈', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', unlocked: true },
    { id: 'forest', emoji: '🌲', color: 'linear-gradient(135deg, #4ade80 0%, #059669 100%)', unlocked: false, requirement: 'Complete forest activities' },
    { id: 'ocean', emoji: '🌊', color: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', unlocked: false, requirement: 'Complete ocean activities' },
    { id: 'space', emoji: '🚀', color: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)', unlocked: false, requirement: 'Complete space activities' },
    { id: 'magical', emoji: '✨', color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', unlocked: false, requirement: 'Complete magical activities' }
  ]
};

const AvatarCustomizer = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.child);
  
  // Avatar state
  const [avatarConfig, setAvatarConfig] = useState({
    skinTone: 'light',
    hair: 'short-brown',
    accessory: 'none',
    expression: 'happy',
    background: 'default'
  });
  
  const [showAchievement, setShowAchievement] = useState(null);

  // Load saved avatar configuration
  useEffect(() => {
    if (profile?.avatar_config) {
      setAvatarConfig(profile.avatar_config);
    }
  }, [profile]);

  // Check unlock conditions
  const checkUnlockConditions = (userProfile) => {
    const conditions = {
      activitiesCompleted: userProfile?.activities_completed || 0,
      perfectScores: userProfile?.perfect_scores || 0,
      streakDays: userProfile?.streak_days || 0,
      completedThemes: userProfile?.completed_themes || []
    };

    // Update unlock status based on user progress
    Object.keys(avatarOptions).forEach(category => {
      avatarOptions[category].forEach(option => {
        if (!option.unlocked && option.requirement) {
          const req = option.requirement.toLowerCase();
          
          if (req.includes('activities completed')) {
            const requiredCount = parseInt(req.match(/\d+/)[0]);
            option.unlocked = conditions.activitiesCompleted >= requiredCount;
          } else if (req.includes('perfect scores')) {
            const requiredCount = parseInt(req.match(/\d+/)[0]);
            option.unlocked = conditions.perfectScores >= requiredCount;
          } else if (req.includes('week streak')) {
            const requiredWeeks = parseInt(req.match(/\d+/)[0]) * 7;
            option.unlocked = conditions.streakDays >= requiredWeeks;
          } else if (req.includes('complete') && req.includes('activities')) {
            const theme = req.split(' ')[1]; // extract theme name
            option.unlocked = conditions.completedThemes.includes(theme);
          }
        }
      });
    });
  };

  useEffect(() => {
    if (profile) {
      checkUnlockConditions(profile);
    }
  }, [profile]);

  const handleOptionSelect = (category, optionId) => {
    const option = avatarOptions[category].find(opt => opt.id === optionId);
    
    if (!option.unlocked) {
      return; // Don't allow selection of locked items
    }

    // Check if this is a newly unlocked item
    const wasLocked = !avatarConfig[category] || 
      !avatarOptions[category].find(opt => opt.id === avatarConfig[category])?.unlocked;
    
    if (wasLocked && option.unlocked) {
      setShowAchievement({
        type: 'unlock',
        item: option,
        category
      });
      
      setTimeout(() => setShowAchievement(null), 3000);
    }

    setAvatarConfig(prev => ({
      ...prev,
      [category]: optionId
    }));
  };

  const handleSaveAvatar = () => {
    // Save avatar configuration to backend/state
    dispatch({
      type: 'child/updateAvatarConfig',
      payload: avatarConfig
    });

    setShowAchievement({
      type: 'save',
      message: 'Avatar saved successfully!'
    });
    
    setTimeout(() => setShowAchievement(null), 2000);
  };

  const renderAvatarPreview = () => {
    const skinTone = avatarOptions.skinTones.find(s => s.id === avatarConfig.skinTone);
    const hair = avatarOptions.hair.find(h => h.id === avatarConfig.hair);
    const accessory = avatarOptions.accessories.find(a => a.id === avatarConfig.accessory);
    const expression = avatarOptions.expressions.find(e => e.id === avatarConfig.expression);
    const background = avatarOptions.backgrounds.find(b => b.id === avatarConfig.background);

    return (
      <AvatarPreview
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <AvatarBase
          skinColor={skinTone?.color}
          style={{ background: background?.color }}
          whileHover={{ scale: 1.05 }}
        >
          {/* Base expression */}
          <AvatarLayer zIndex={1}>
            {expression?.emoji || '😊'}
          </AvatarLayer>
          
          {/* Hair layer */}
          {hair?.id !== 'none' && (
            <AvatarLayer zIndex={2} size="2rem" style={{ top: '-10px' }}>
              {hair?.emoji}
            </AvatarLayer>
          )}
          
          {/* Accessory layer */}
          {accessory?.id !== 'none' && (
            <AvatarLayer zIndex={3} size="1.5rem">
              {accessory?.emoji}
            </AvatarLayer>
          )}
        </AvatarBase>
      </AvatarPreview>
    );
  };

  const renderCategory = (categoryKey, categoryData) => {
    const categoryInfo = {
      skinTones: { title: 'Skin Tone', icon: '👤' },
      hair: { title: 'Hair Style', icon: '💇' },
      accessories: { title: 'Accessories', icon: '👓' },
      expressions: { title: 'Expression', icon: '😊' },
      backgrounds: { title: 'Background', icon: '🎨' }
    };

    const info = categoryInfo[categoryKey];
    
    return (
      <CategorySection
        key={categoryKey}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Object.keys(avatarOptions).indexOf(categoryKey) * 0.1 }}
      >
        <CategoryTitle>
          <CategoryIcon>{info.icon}</CategoryIcon>
          {info.title}
        </CategoryTitle>
        
        <OptionGrid>
          {categoryData.map((option) => (
            <div key={option.id}>
              <OptionButton
                isSelected={avatarConfig[categoryKey] === option.id}
                isLocked={!option.unlocked}
                onClick={() => handleOptionSelect(categoryKey, option.id)}
                disabled={!option.unlocked}
                whileHover={{ scale: option.unlocked ? 1.05 : 1 }}
                whileTap={{ scale: option.unlocked ? 0.95 : 1 }}
              >
                {option.emoji || option.id}
              </OptionButton>
              
              {!option.unlocked && option.requirement && (
                <UnlockInfo>{option.requirement}</UnlockInfo>
              )}
            </div>
          ))}
        </OptionGrid>
      </CategorySection>
    );
  };

  return (
    <CustomizerContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Achievement Notification */}
      <AnimatePresence>
        {showAchievement && (
          <AchievementNotification
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
          >
            {showAchievement.type === 'unlock' 
              ? `🎉 New ${showAchievement.category} unlocked!`
              : showAchievement.message
            }
          </AchievementNotification>
        )}
      </AnimatePresence>

      {/* Preview Section */}
      <PreviewSection>
        {renderAvatarPreview()}
        
        <SaveButton
          onClick={handleSaveAvatar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Save My Avatar! 🎨
        </SaveButton>
      </PreviewSection>

      {/* Customization Panel */}
      <CustomizationPanel>
        <PanelHeader>
          <PanelTitle>Customize Your Avatar</PanelTitle>
        </PanelHeader>
        
        <CategoryList>
          {Object.entries(avatarOptions).map(([categoryKey, categoryData]) =>
            renderCategory(categoryKey, categoryData)
          )}
        </CategoryList>
      </CustomizationPanel>
    </CustomizerContainer>
  );
};

export default AvatarCustomizer;