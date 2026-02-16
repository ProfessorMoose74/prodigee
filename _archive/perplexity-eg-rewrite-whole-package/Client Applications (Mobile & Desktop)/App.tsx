import React, { useEffect } from 'react';
import { StatusBar, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import SplashScreen from 'react-native-splash-screen';
import { store, persistor } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { requestPermissions } from './src/utils/permissions';
import { initializeAudio } from './src/utils/audioManager';
import { setupPushNotifications } from './src/utils/pushNotifications';
import LoadingScreen from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const App: React.FC = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await requestPermissions();
        await initializeAudio();
        await setupPushNotifications();
        SplashScreen.hide();
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert('Initialization Error', 'Failed to initialize the app properly.');
      }
    };
    initializeApp();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <ErrorBoundary>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" />
            <AppNavigator />
          </NavigationContainer>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
};

export default App;