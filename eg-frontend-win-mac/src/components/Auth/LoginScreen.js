import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { parentLogin, demoLogin, clearAuthError } from '../../store/slices/authSlice';

const LoginContainer = styled(motion.div)`
  width: 100vw;
  height: 100vh;
  display: flex;
  background: ${({ theme }) => theme.colors.backgrounds.primary};
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.purple}10,
    ${({ theme }) => theme.colors.primary.blue}10
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(30deg); }
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  background: ${({ theme }) => theme.colors.white};
`;

const LogoSection = styled(motion.div)`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Logo = styled.div`
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.purple},
    ${({ theme }) => theme.colors.primary.blue}
  );
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  margin: 0 auto ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const BrandTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const BrandSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 400px;
`;

const FeatureItem = styled(motion.li)`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const FeatureIcon = styled.span`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.primary.green}20;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing[3]};
  font-size: 1.2rem;
`;

const LoginForm = styled(motion.form)`
  width: 100%;
  max-width: 400px;
`;

const FormTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  text-align: center;
`;

const FormSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const InputGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ theme, error }) => 
    error ? theme.colors.error : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray[800]};
  transition: all ${({ theme }) => theme.animation.duration.fast} 
              ${({ theme }) => theme.animation.easing.easeOut};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.blue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary.blue}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const ErrorMessage = styled(motion.div)`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing[2]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.blue},
    ${({ theme }) => theme.colors.primary.purple}
  );
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: all ${({ theme }) => theme.animation.duration.normal} 
              ${({ theme }) => theme.animation.easing.easeOut};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
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

const DemoButton = styled(motion.button)`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border: 2px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.fast} 
              ${({ theme }) => theme.animation.easing.easeOut};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
    border-color: ${({ theme }) => theme.colors.primary.blue};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.green};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing[6]} 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.gray[300]};
  }
  
  span {
    padding: 0 ${({ theme }) => theme.spacing[4]};
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const BackToSplash = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  left: ${({ theme }) => theme.spacing[4]};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  transition: color ${({ theme }) => theme.animation.duration.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.blue};
  }
`;

const features = [
  { icon: '📚', text: 'Dr. Heggerty\'s proven phonemic awareness curriculum' },
  { icon: '🎤', text: 'Advanced voice recognition technology' },
  { icon: '👨‍🏫', text: 'AI-powered educational characters' },
  { icon: '📊', text: 'Real-time progress monitoring for parents' }
];

const LoginScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isDemoMode } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await dispatch(parentLogin(formData)).unwrap();
    } catch (error) {
      // Error is handled by Redux state
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await dispatch(demoLogin()).unwrap();
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  const handleBackToSplash = () => {
    navigate('/splash');
  };

  return (
    <LoginContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BackToSplash onClick={handleBackToSplash}>
        ← Back
      </BackToSplash>

      <LeftPanel>
        <LogoSection
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Logo>🧠</Logo>
          <BrandTitle>Elemental Genius</BrandTitle>
          <BrandSubtitle>Educational Excellence</BrandSubtitle>
        </LogoSection>

        <FeaturesList>
          {features.map((feature, index) => (
            <FeatureItem
              key={index}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            >
              <FeatureIcon>{feature.icon}</FeatureIcon>
              {feature.text}
            </FeatureItem>
          ))}
        </FeaturesList>
      </LeftPanel>

      <RightPanel>
        <LoginForm
          onSubmit={handleSubmit}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <FormTitle>Welcome Back</FormTitle>
          <FormSubtitle>
            Sign in to access your Elemental Genius dashboard
          </FormSubtitle>

          <InputGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="parent@example.com"
              error={formErrors.email || error}
              autoComplete="email"
            />
            <AnimatePresence>
              {formErrors.email && (
                <ErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  ⚠️ {formErrors.email}
                </ErrorMessage>
              )}
            </AnimatePresence>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              error={formErrors.password || error}
              autoComplete="current-password"
            />
            <AnimatePresence>
              {formErrors.password && (
                <ErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  ⚠️ {formErrors.password}
                </ErrorMessage>
              )}
            </AnimatePresence>
          </InputGroup>

          <AnimatePresence>
            {error && !formErrors.email && !formErrors.password && (
              <ErrorMessage
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ marginBottom: '1.5rem' }}
              >
                ⚠️ {error}
              </ErrorMessage>
            )}
          </AnimatePresence>

          <SubmitButton
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </SubmitButton>

          <Divider>
            <span>or</span>
          </Divider>

          <DemoButton
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🎮 Try Demo Mode
          </DemoButton>

          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#FEF3C7',
                borderRadius: '0.5rem',
                color: '#92400E',
                fontSize: '0.875rem'
              }}
            >
              📚 Demo credentials: demo@elementalgenius.com / demo123
            </motion.div>
          )}
        </LoginForm>
      </RightPanel>
    </LoginContainer>
  );
};

export default LoginScreen;