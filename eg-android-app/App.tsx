import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AuthProvider} from './src/context/AuthContext';
import {AccessibilityProvider} from './src/context/AccessibilityContext';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {crashReporting} from './src/services/CrashReporting';
import {Colors} from './src/utils/Colors';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import ParentDashboardScreen from './src/screens/ParentDashboardScreen';
import AvatarCustomizationScreen from './src/screens/AvatarCustomizationScreen';
import AccessibilitySettingsScreen from './src/screens/AccessibilitySettingsScreen';
import NotificationCenter from './src/components/NotificationCenter';
import OfflineStatus from './src/components/OfflineStatus';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Activity: {activityType: string};
  ParentDashboard: undefined;
  AvatarCustomization: undefined;
  AccessibilitySettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) =>
        crashReporting.recordReactError(error, errorInfo)
      }>
      <SafeAreaProvider>
        <GestureHandlerRootView style={backgroundStyle}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          <AuthProvider>
            <AccessibilityProvider>
              <NavigationContainer>
                <OfflineStatus />
                <NotificationCenter />
                <Stack.Navigator
                  initialRouteName="Login"
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: Colors.primary,
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                    },
                  }}>
                  <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{headerShown: false}}
                  />
                  <Stack.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{title: 'Learning Dashboard'}}
                  />
                  <Stack.Screen
                    name="Activity"
                    component={ActivityScreen}
                    options={{title: 'Activity'}}
                  />
                  <Stack.Screen
                    name="ParentDashboard"
                    component={ParentDashboardScreen}
                    options={{title: 'Parent Dashboard'}}
                  />
                  <Stack.Screen
                    name="AvatarCustomization"
                    component={AvatarCustomizationScreen}
                    options={{headerShown: false}}
                  />
                  <Stack.Screen
                    name="AccessibilitySettings"
                    component={AccessibilitySettingsScreen}
                    options={{title: 'Accessibility Settings'}}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </AccessibilityProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
