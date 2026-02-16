import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import LoginScreen from './screens/LoginScreen';
import ParentDashboard from './screens/ParentDashboard';
import ChildDashboard from './screens/ChildDashboard';
import LearningActivityScreen from './screens/LearningActivityScreen';

const App: React.FC = () => {
  const { isAuthenticated, userType } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      {userType === 'parent' ? (
        <Route path="/" element={<ParentDashboard />} />
      ) : (
        <Route path="/" element={<ChildDashboard />} />
      )}
      <Route path="/activity/:type" element={<LearningActivityScreen />} />
      {/* Add other routes for avatar creation, settings, etc. */}
    </Routes>
  );
};

export default App;