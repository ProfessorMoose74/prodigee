import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { AnimatePresence } from 'framer-motion';

// Components
import Splash from './components/Splash/Splash';
import LoginScreen from './components/Auth/LoginScreen';
import ParentDashboard from './components/Parent/ParentDashboard';
import ChildDashboard from './components/Child/ChildDashboard';
import ActivityScreen from './components/Activities/ActivityScreen';
import AvatarCreator from './components/Avatar/AvatarCreator';
import SettingsScreen from './components/Settings/SettingsScreen';
import LoadingScreen from './components/UI/LoadingScreen';
import ErrorBoundary from './components/UI/ErrorBoundary';

// Services
import { initializeApp } from './store/slices/appSlice';
import { checkAuthStatus } from './store/slices/authSlice';
import { initializeSocket } from './services/socketService';

// Styles
import { AppContainer, MainContent } from './styles/AppStyles';

function App() {
  const dispatch = useDispatch();
  const { 
    isLoading, 
    isInitialized, 
    currentUser, 
    userType 
  } = useSelector(state => state.app);
  
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // Initialize the application
    dispatch(initializeApp());
    dispatch(checkAuthStatus());

    // Initialize socket connection for real-time features
    if (isAuthenticated && currentUser?.parent_id) {
      initializeSocket(currentUser.parent_id);
    }
  }, [dispatch, isAuthenticated, currentUser?.parent_id]);

  // Show loading screen during initialization
  if (isLoading || !isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <AppContainer>
        <MainContent>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Splash Screen */}
              <Route 
                path="/splash" 
                element={
                  !isAuthenticated ? (
                    <Splash />
                  ) : (
                    <Navigate to={userType === 'parent' ? '/parent/dashboard' : '/child/dashboard'} replace />
                  )
                } 
              />

              {/* Authentication Routes */}
              <Route 
                path="/login" 
                element={
                  !isAuthenticated ? (
                    <LoginScreen />
                  ) : (
                    <Navigate to={userType === 'parent' ? '/parent/dashboard' : '/child/dashboard'} replace />
                  )
                } 
              />

              {/* Parent Routes */}
              <Route 
                path="/parent/dashboard" 
                element={
                  isAuthenticated && userType === 'parent' ? (
                    <ParentDashboard />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />

              {/* Child Routes */}
              <Route 
                path="/child/dashboard" 
                element={
                  isAuthenticated && userType === 'child' ? (
                    <ChildDashboard />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />

              <Route 
                path="/child/activity/:activityType" 
                element={
                  isAuthenticated && userType === 'child' ? (
                    <ActivityScreen />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />

              <Route 
                path="/child/avatar" 
                element={
                  isAuthenticated && userType === 'child' ? (
                    <AvatarCreator />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />

              {/* Settings Routes */}
              <Route 
                path="/settings" 
                element={
                  isAuthenticated ? (
                    <SettingsScreen />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />

              {/* Default Route */}
              <Route 
                path="/" 
                element={
                  isAuthenticated ? (
                    <Navigate to={userType === 'parent' ? '/parent/dashboard' : '/child/dashboard'} replace />
                  ) : (
                    <Navigate to="/splash" replace />
                  )
                } 
              />

              {/* Catch All Route */}
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </AnimatePresence>
        </MainContent>
      </AppContainer>
    </ErrorBoundary>
  );
}

export default App;