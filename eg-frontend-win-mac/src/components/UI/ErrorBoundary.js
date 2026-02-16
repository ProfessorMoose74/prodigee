import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ErrorContainer = styled(motion.div)`
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
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  z-index: ${({ theme }) => theme.zIndex.modal};
`;

const ErrorIcon = styled.div`
  width: 100px;
  height: 100px;
  background: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const ErrorTitle = styled.h1`
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  max-width: 600px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  background: ${({ primary, theme }) => 
    primary ? theme.colors.primary.blue : theme.colors.gray[200]};
  color: ${({ primary, theme }) => 
    primary ? theme.colors.white : theme.colors.gray[700]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.fast} 
              ${({ theme }) => theme.animation.easing.easeOut};

  &:hover {
    background: ${({ primary, theme }) => 
      primary ? theme.colors.primary.purple : theme.colors.gray[300]};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.green};
    outline-offset: 2px;
  }
`;

const ErrorDetails = styled.details`
  margin-top: ${({ theme }) => theme.spacing[8]};
  max-width: 800px;
  text-align: left;
`;

const ErrorDetailsSummary = styled.summary`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[800]};
  }
`;

const ErrorDetailsContent = styled.pre`
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.code};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  overflow: auto;
  max-height: 200px;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Report error to monitoring service
    if (window.electronAPI?.reportError) {
      window.electronAPI.reportError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRestart = () => {
    if (window.electronAPI?.quitApp) {
      window.electronAPI.quitApp();
    } else {
      this.handleReload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <ErrorContainer
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorIcon>⚠️</ErrorIcon>
          
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          
          <ErrorMessage>
            Don't worry! This happens sometimes. We've recorded the error and 
            our team will work on fixing it. You can try reloading the page 
            or restarting the app.
          </ErrorMessage>
          
          <ButtonGroup>
            <Button primary onClick={this.handleReload}>
              Reload Page
            </Button>
            <Button onClick={this.handleGoHome}>
              Go to Home
            </Button>
            <Button onClick={this.handleRestart}>
              Restart App
            </Button>
          </ButtonGroup>

          {isDevelopment && this.state.error && (
            <ErrorDetails>
              <ErrorDetailsSummary>
                Technical Details (Development Mode)
              </ErrorDetailsSummary>
              <ErrorDetailsContent>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <>
                    <br /><br />
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </ErrorDetailsContent>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;