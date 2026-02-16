import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../store/store';
import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/HomeScreen';
import LearningScreen from '../screens/LearningScreen';
import AvatarScreen from '../screens/AvatarScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ParentDashboard from '../screens/ParentDashboard';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator: React.FC = () => {
  const { userType } = useSelector((state: RootState) => state.auth);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          switch (route.name) {
            case 'Home': iconName = 'home'; break;
            case 'Learning': iconName = 'school'; break;
            case 'Avatar': iconName = 'person'; break;
            case 'Progress': iconName = 'trending-up'; break;
            case 'Parent': iconName = 'dashboard'; break;
            case 'Settings': iconName = 'settings'; break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { height: 80, paddingBottom: 10, paddingTop: 10 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learning" component={LearningScreen} />
      <Tab.Screen name="Avatar" component={AvatarScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      {userType === 'parent' && (
        <Tab.Screen name="Parent" component={ParentDashboard} />
      )}
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;