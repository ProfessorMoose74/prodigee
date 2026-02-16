import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { loadParentDashboard } from '../../store/slices/parentSlice';
import LoadingScreen from '../UI/LoadingScreen';

const DashboardContainer = styled(motion.div)`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.backgrounds.parent};
  overflow: hidden;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  z-index: ${({ theme }) => theme.zIndex.docked};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled.div``;

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;
`;

const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: background-color ${({ theme }) => theme.animation.duration.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  ${({ hasNotifications, theme }) => hasNotifications && `
    &::after {
      content: '';
      position: absolute;
      top: ${theme.spacing[1]};
      right: ${theme.spacing[1]};
      width: 8px;
      height: 8px;
      background: ${theme.colors.error};
      border-radius: 50%;
    }
  `}
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[8]};
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  overflow-y: auto;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  overflow-y: auto;
`;

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const ChildGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
`;

const ChildCard = styled(motion.div)`
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.blue}10,
    ${({ theme }) => theme.colors.primary.purple}10
  );
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[5]};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animation.duration.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.primary.blue};
  }
`;

const ChildHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ChildAvatar = styled.div`
  width: 50px;
  height: 50px;
  background: ${({ theme }) => theme.colors.primary.green};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const ChildInfo = styled.div`
  flex: 1;
`;

const ChildName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ChildDetails = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ active, theme }) => 
    active ? theme.colors.success : theme.colors.gray[400]};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
`;

const StatItem = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.blue};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ActivityFeed = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ActivityItem = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ type, theme }) => {
    switch (type) {
      case 'login': return theme.colors.primary.green + '20';
      case 'activity': return theme.colors.primary.blue + '20';
      case 'achievement': return theme.colors.primary.purple + '20';
      default: return theme.colors.gray[200];
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ActivityTime = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

// Demo data (replace with real data from store)
const demoChildren = [
  {
    id: 1,
    name: 'Emma',
    age: 5,
    avatar: '👧',
    currentWeek: 12,
    totalStars: 145,
    isActive: true,
    lastActivity: '5 minutes ago'
  },
  {
    id: 2,
    name: 'Marcus',
    age: 7,
    avatar: '👦',
    currentWeek: 18,
    totalStars: 267,
    isActive: false,
    lastActivity: '2 hours ago'
  }
];

const demoActivities = [
  {
    id: 1,
    type: 'login',
    icon: '🔐',
    text: 'Emma logged in and started learning',
    time: '5 minutes ago'
  },
  {
    id: 2,
    type: 'activity',
    icon: '🎵',
    text: 'Marcus completed Rhyming Activity with 95% accuracy',
    time: '2 hours ago'
  },
  {
    id: 3,
    type: 'achievement',
    icon: '🏆',
    text: 'Emma unlocked the "Rhyme Master" achievement',
    time: '1 day ago'
  }
];

const ParentDashboard = () => {
  const dispatch = useDispatch();
  const { 
    isLoadingDashboard, 
    dashboard, 
    notifications, 
    unreadCount 
  } = useSelector(state => state.parent);
  
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(loadParentDashboard());
  }, [dispatch]);

  if (isLoadingDashboard) {
    return (
      <LoadingScreen 
        message="Loading your dashboard..."
        subtext="Gathering your children's progress data"
      />
    );
  }

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Header>
        <HeaderContent>
          <WelcomeSection>
            <WelcomeTitle>Welcome back, {user?.name || 'Parent'}!</WelcomeTitle>
            <WelcomeSubtitle>Here's how your children are progressing</WelcomeSubtitle>
          </WelcomeSection>
          
          <HeaderActions>
            <NotificationBadge hasNotifications={unreadCount > 0}>
              🔔
            </NotificationBadge>
            <div style={{ fontSize: '2rem', cursor: 'pointer' }}>⚙️</div>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <MainContent>
        <LeftPanel>
          {/* Children Overview */}
          <Card
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <CardHeader>
              <CardTitle>Your Children</CardTitle>
            </CardHeader>
            
            <ChildGrid>
              {demoChildren.map((child, index) => (
                <ChildCard
                  key={child.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChildHeader>
                    <ChildAvatar>{child.avatar}</ChildAvatar>
                    <ChildInfo>
                      <ChildName>{child.name}</ChildName>
                      <ChildDetails>Age {child.age} • Week {child.currentWeek}</ChildDetails>
                    </ChildInfo>
                    <StatusIndicator active={child.isActive} />
                  </ChildHeader>
                  
                  <StatsGrid>
                    <StatItem>
                      <StatValue>{child.totalStars}</StatValue>
                      <StatLabel>Stars Earned</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>{child.currentWeek}</StatValue>
                      <StatLabel>Current Week</StatLabel>
                    </StatItem>
                  </StatsGrid>
                </ChildCard>
              ))}
            </ChildGrid>
          </Card>

          {/* Summary Stats */}
          <Card
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CardHeader>
              <CardTitle>Learning Summary</CardTitle>
            </CardHeader>
            
            <StatsGrid>
              <StatItem>
                <StatValue>87%</StatValue>
                <StatLabel>Average Accuracy</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>42</StatValue>
                <StatLabel>Sessions This Week</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>8.5/10</StatValue>
                <StatLabel>Engagement Score</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>12</StatValue>
                <StatLabel>Days Active Streak</StatLabel>
              </StatItem>
            </StatsGrid>
          </Card>
        </LeftPanel>

        <RightPanel>
          {/* Recent Activity */}
          <Card
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            
            <ActivityFeed>
              {demoActivities.length > 0 ? (
                demoActivities.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <ActivityIcon type={activity.type}>
                      {activity.icon}
                    </ActivityIcon>
                    <ActivityContent>
                      <ActivityText>{activity.text}</ActivityText>
                      <ActivityTime>{activity.time}</ActivityTime>
                    </ActivityContent>
                  </ActivityItem>
                ))
              ) : (
                <EmptyState>
                  No recent activity to display
                </EmptyState>
              )}
            </ActivityFeed>
          </Card>

          {/* Quick Actions */}
          <Card
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                style={{
                  padding: '1rem',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                📊 View Detailed Reports
              </button>
              <button 
                style={{
                  padding: '1rem',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                👶 Add New Child
              </button>
              <button 
                style={{
                  padding: '1rem',
                  background: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ⚙️ Manage Settings
              </button>
            </div>
          </Card>
        </RightPanel>
      </MainContent>
    </DashboardContainer>
  );
};

export default ParentDashboard;