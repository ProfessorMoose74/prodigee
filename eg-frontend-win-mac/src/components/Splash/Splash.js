import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { demoLogin } from '../../store/slices/authSlice';

const SplashContainer = styled(motion.div)`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgrounds.primary};
  position: relative;
  overflow: hidden;
`;

const BackgroundElements = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.1;
  z-index: 0;
`;

const FloatingElement = styled(motion.div)`
  position: absolute;
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary.purple};
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  padding: ${({ theme }) => theme.spacing[8]};
`;

const LogoContainer = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Logo = styled.div`
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.purple},
    ${({ theme }) => theme.colors.primary.blue}
  );
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: linear-gradient(135deg, 
      ${({ theme }) => theme.colors.primary.purple}20,
      ${({ theme }) => theme.colors.primary.blue}20
    );
    border-radius: ${({ theme }) => theme.borderRadius.full};
    z-index: -1;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
`;

const Title = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Subtitle = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled(motion.button)`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[8]};
  background: ${({ primary, theme }) => 
    primary 
      ? `linear-gradient(135deg, ${theme.colors.primary.blue}, ${theme.colors.primary.purple})`
      : theme.colors.white
  };
  color: ${({ primary, theme }) => 
    primary ? theme.colors.white : theme.colors.gray[700]};
  border: ${({ primary, theme }) => 
    primary ? 'none' : `2px solid ${theme.colors.gray[300]}`};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: all ${({ theme }) => theme.animation.duration.normal} 
              ${({ theme }) => theme.animation.easing.easeOut};
  min-width: 140px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
    ${({ primary, theme }) => 
      !primary && `border-color: ${theme.colors.primary.blue};`}
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.green};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FeatureList = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing[8]};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  max-width: 800px;
`;

const FeatureItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing[4]};
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${({ theme }) => theme.colors.primary.green}20;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.primary.green};
`;

const FeatureTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const FeatureDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const DemoModeIndicator = styled(motion.div)`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.warning};
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  z-index: 2;
`;

const features = [
  {
    icon: '🎵',
    title: 'Phonemic Awareness',
    description: 'Dr. Heggerty\'s proven curriculum for reading success'
  },
  {
    icon: '🎤',
    title: 'Voice Recognition',
    description: 'Advanced speech processing for natural learning'
  },
  {
    icon: '👨‍🏫',
    title: 'AI Characters',
    description: 'Professor Al, Ella, and Gus guide every lesson'
  },
  {
    icon: '📊',
    title: 'Real-time Monitoring',
    description: 'Parents see progress and engagement live'
  }
];

const Splash = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isDemoMode } = useSelector(state => state.auth);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFeatures(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleTryDemo = async () => {
    try {
      await dispatch(demoLogin()).unwrap();
    } catch (error) {
      console.error('Demo login failed:', error);
      // Still navigate to login on demo failure
      navigate('/login');
    }
  };

  const floatingElements = ['🧠', '📚', '🎯', '⭐', '🎨', '🔬', '🌟', '💡'];

  return (
    <SplashContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BackgroundElements>
        {floatingElements.map((element, index) => (
          <FloatingElement
            key={index}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.1
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
              delay: index * 0.5
            }}
          >
            {element}
          </FloatingElement>
        ))}
      </BackgroundElements>

      {isDemoMode && (
        <DemoModeIndicator
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
        >
          Demo Mode
        </DemoModeIndicator>
      )}

      <ContentContainer>
        <LogoContainer
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 100, 
            damping: 15,
            delay: 0.2 
          }}
        >
          <Logo>🧠</Logo>
        </LogoContainer>

        <Title
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Elemental Genius
        </Title>

        <Subtitle
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Unlock Your Child's Reading Potential
        </Subtitle>

        <ButtonGroup
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Button
            primary
            onClick={handleGetStarted}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </Button>
          <Button
            onClick={handleTryDemo}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Demo
          </Button>
        </ButtonGroup>

        <AnimatePresence>
          {showFeatures && (
            <FeatureList
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {features.map((feature, index) => (
                <FeatureItem
                  key={index}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                >
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                </FeatureItem>
              ))}
            </FeatureList>
          )}
        </AnimatePresence>
      </ContentContainer>
    </SplashContainer>
  );
};

export default Splash;