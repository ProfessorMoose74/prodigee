import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const LoadingContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgrounds.primary};
  z-index: ${({ theme }) => theme.zIndex.modal};
  animation: ${fadeIn} 0.3s ease-out;
`;

const LogoContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  animation: ${pulse} 2s infinite;
`;

const Logo = styled.div`
  width: 120px;
  height: 120px;
  background: ${({ theme }) => theme.colors.primary.purple};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  color: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const SpinnerContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.gray[300]};
  border-top: 4px solid ${({ theme }) => theme.colors.primary.blue};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.h2`
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  text-align: center;
`;

const LoadingSubtext = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  text-align: center;
  max-width: 400px;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const ProgressBar = styled.div`
  width: 300px;
  height: 8px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  margin: ${({ theme }) => theme.spacing[6]} 0;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, 
    ${({ theme }) => theme.colors.primary.blue}, 
    ${({ theme }) => theme.colors.primary.purple}
  );
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const LoadingScreen = ({ 
  message = "Loading Elemental Genius...", 
  subtext = "Preparing your learning adventure",
  showProgress = false,
  progress = 0,
  showLogo = true 
}) => {
  return (
    <LoadingContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showLogo && (
        <LogoContainer>
          <Logo>
            🧠
          </Logo>
        </LogoContainer>
      )}
      
      <SpinnerContainer>
        <Spinner />
      </SpinnerContainer>
      
      <LoadingText>{message}</LoadingText>
      
      {subtext && (
        <LoadingSubtext>{subtext}</LoadingSubtext>
      )}
      
      {showProgress && (
        <ProgressBar>
          <ProgressFill
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </ProgressBar>
      )}
    </LoadingContainer>
  );
};

export default LoadingScreen;