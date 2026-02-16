// Elemental Genius Mobile App - React Native Implementation
// This is a comprehensive mobile application structure for iOS and Android

// package.json
{
  "name": "elemental-genius-mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:ios": "cd ios && xcodebuild -workspace ElementalGenius.xcworkspace -scheme ElementalGenius -configuration Release -archivePath build/ElementalGenius.xcarchive archive"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.2",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.0.4",
    "react-native-sound": "^0.11.2",
    "react-native-voice": "^3.2.4",
    "react-native-audio-recorder-player": "^3.6.2",
    "react-native-camera": "^4.2.1",
    "react-native-push-notification": "^8.1.1",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-reanimated": "^3.6.1",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-svg": "^14.1.0",
    "react-native-linear-gradient": "^2.8.3",
    "axios": "^1.6.2",
    "socket.io-client": "^4.7.4",
    "react-hook-form": "^7.48.2",
    "react-native-haptic-feedback": "^2.2.0",
    "react-native-permissions": "^4.1.4",
    "react-native-device-info": "^10.12.0",
    "react-native-orientation-locker": "^1.6.0",
    "react-native-splash-screen": "^3.3.0",
    "react-native-vector-icons": "^10.0.3",
    "react-native-keychain": "^8.1.3",
    "react-native-biometrics": "^3.0.1",
    "react-native-share": "^10.0.2",
    "react-native-image-picker": "^7.1.0",
    "react-native-webview": "^13.6.4",
    "react-native-modal": "^13.0.1",
    "react-native-confetti-cannon": "^1.5.2",
    "lottie-react-native": "^6.4.1",
    "react-native-slider": "^2.5.0",
    "react-native-progress": "^5.0.1",
    "react-native-charts-wrapper": "^0.5.9",
    "react-native-calendar-events": "^2.2.0",
    "react-native-contacts": "^7.0.8",
    "react-native-code-push": "^8.2.1",
    "react-native-firebase": "^18.6.2",
    "react-native-in-app-purchase": "^12.0.1"
  },
  "devDependencies": {
    "@babel/core": "^7.23.6",
    "@babel/preset-env": "^7.23.6",
    "@babel/runtime": "^7.23.6",
    "@react-native/eslint-config": "^0.73.1",
    "@react-native/metro-config": "^0.73.2",
    "@react-native/typescript-config": "^0.73.1",
    "@types/react": "^18.2.45",
    "@types/react-test-renderer": "^18.0.7",
    "babel-jest": "^29.7.0",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "metro-react-native-babel-preset": "0.77.0",
    "prettier": "^3.1.1",
    "react-test-renderer": "18.2.0",
    "typescript": "^5.3.3",
    "detox": "^20.13.5"
  },
  "engines": {
    "node": ">=18"
  }
}

// App.tsx - Main Application Entry Point
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
        // Request necessary permissions
        await requestPermissions();
        
        // Initialize audio system
        await initializeAudio();
        
        // Setup push notifications
        await setupPushNotifications();
        
        // Hide splash screen
        SplashScreen.hide();
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert('Initialization Error', 'Failed to initialize the app properly.');
      }
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <NavigationContainer>
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              backgroundColor="#4A90E2"
            />
            <AppNavigator />
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;

// src/navigation/AppNavigator.tsx - Main Navigation Structure
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
            case 'Home':
              iconName = 'home';
              break;
            case 'Learning':
              iconName = 'school';
              break;
            case 'Avatar':
              iconName = 'person';
              break;
            case 'Progress':
              iconName = 'trending-up';
              break;
            case 'Parent':
              iconName = 'dashboard';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
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

// src/store/store.ts - Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import learningSlice from './slices/learningSlice';
import avatarSlice from './slices/avatarSlice';
import progressSlice from './slices/progressSlice';
import settingsSlice from './slices/settingsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'avatar', 'settings'],
};

const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  learning: learningSlice,
  avatar: avatarSlice,
  progress: progressSlice,
  settings: settingsSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// src/store/slices/authSlice.ts - Authentication State Management (Flask Backend Compatible)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    uuid: string;
    email: string;
    name: string;
    userType: 'child' | 'parent';
    age?: number;
    parentId?: number;
    avatar?: string;
    currentWeek?: number;
    totalStars?: number;
    streakDays?: number;
  } | null;
  sessionCookie: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  sessionCookie: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginParent: (state, action: PayloadAction<{
      user: {
        id: number;
        uuid: string;
        name: string;
        email: string;
        userType: 'parent';
      };
      sessionCookie: string;
    }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.sessionCookie = action.payload.sessionCookie;
    },
    loginChild: (state, action: PayloadAction<{
      user: {
        id: number;
        uuid: string;
        name: string;
        userType: 'child';
        age: number;
        parentId: number;
        avatar: string;
        currentWeek: number;
        totalStars: number;
        streakDays: number;
      };
      sessionCookie: string;
    }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.sessionCookie = action.payload.sessionCookie;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.sessionCookie = null;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthState['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateChildProgress: (state, action: PayloadAction<{
      totalStars: number;
      streakDays: number;
      currentWeek: number;
    }>) => {
      if (state.user && state.user.userType === 'child') {
        state.user.totalStars = action.payload.totalStars;
        state.user.streakDays = action.payload.streakDays;
        state.user.currentWeek = action.payload.currentWeek;
      }
    },
  },
});

export const { loginParent, loginChild, logout, updateUser, updateChildProgress } = authSlice.actions;
export default authSlice.reducer;

// src/store/slices/learningSlice.ts - Learning Activities State (Flask Compatible)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LearningSession {
  id: number;
  uuid: string;
  sessionType: string;
  plannedDuration: number;
  actualDuration: number;
  completionStatus: 'in_progress' | 'completed' | 'abandoned';
  activitiesPlanned: number;
  activitiesCompleted: number;
  overallAccuracy: number;
  engagementScore: number;
  starsEarned: number;
  sessionStarted: string;
  sessionEnded?: string;
}

interface PhonemicProgress {
  skillType: string;
  skillCategory: string;
  weekNumber: number;
  masteryLevel: number;
  accuracyPercentage: number;
  attemptsTotal: number;
  attemptsCorrect: number;
  voiceRecognitionAccuracy: number;
  lastPracticed: string;
}

interface LearningState {
  currentSession: LearningSession | null;
  currentWeek: number;
  weeklyProgress: number;
  phonemicProgress: PhonemicProgress[];
  recentSessions: LearningSession[];
  availableActivities: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LearningState = {
  currentSession: null,
  currentWeek: 1,
  weeklyProgress: 0,
  phonemicProgress: [],
  recentSessions: [],
  availableActivities: [],
  isLoading: false,
  error: null,
};

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    startActivity: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    sessionCreated: (state, action: PayloadAction<LearningSession>) => {
      state.currentSession = action.payload;
      state.isLoading = false;
    },
    completeActivity: (state, action: PayloadAction<{
      activityId: string;
      score: number;
      duration: number;
      engagement: number;
    }>) => {
      if (state.currentSession) {
        state.currentSession.overallAccuracy = action.payload.score;
        state.currentSession.actualDuration = action.payload.duration;
        state.currentSession.engagementScore = action.payload.engagement;
        state.currentSession.completionStatus = 'completed';
        state.currentSession.sessionEnded = new Date().toISOString();
      }
    },
    updateProgress: (state, action: PayloadAction<{
      weeklyProgress: number;
      currentWeek: number;
      phonemicProgress: PhonemicProgress[];
    }>) => {
      state.weeklyProgress = action.payload.weeklyProgress;
      state.currentWeek = action.payload.currentWeek;
      state.phonemicProgress = action.payload.phonemicProgress;
    },
    setAvailableActivities: (state, action: PayloadAction<any[]>) => {
      state.availableActivities = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  startActivity,
  sessionCreated,
  completeActivity,
  updateProgress,
  setAvailableActivities,
  setError,
} = learningSlice.actions;
export default learningSlice.reducer;

// src/screens/HomeScreen.tsx - Main Home Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import CharacterDisplay from '../components/CharacterDisplay';
import AvatarPreview from '../components/AvatarPreview';
import QuickActivity from '../components/QuickActivity';
import ProgressRing from '../components/ProgressRing';
import WeatherWidget from '../components/WeatherWidget';
import { playWelcomeSound } from '../utils/audioManager';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentAvatar } = useSelector((state: RootState) => state.avatar);
  const { weeklyProgress, todayStreak } = useSelector((state: RootState) => state.progress);
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Play welcome sound
    playWelcomeSound();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getAgeAppropriateCharacter = () => {
    if (!user?.age) return 'professor';
    if (user.age <= 4) return 'gus';
    if (user.age <= 8) return 'ella';
    return 'professor';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Little Learner'}!</Text>
          <WeatherWidget />
        </View>
        
        <View style={styles.avatarContainer}>
          <AvatarPreview 
            avatar={currentAvatar}
            size={80}
            animated={true}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.characterSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <CharacterDisplay
          character={getAgeAppropriateCharacter()}
          message="Ready for some learning fun today?"
          animated={true}
        />
      </Animated.View>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressCards}>
          <View style={styles.progressCard}>
            <ProgressRing
              progress={weeklyProgress}
              size={80}
              strokeWidth={8}
              color="#4A90E2"
            />
            <Text style={styles.progressLabel}>This Week</Text>
            <Text style={styles.progressValue}>{weeklyProgress}%</Text>
          </View>
          
          <View style={styles.progressCard}>
            <View style={styles.streakContainer}>
              <Text style={styles.streakNumber}>{todayStreak}</Text>
              <Text style={styles.streakDays}>days</Text>
            </View>
            <Text style={styles.progressLabel}>Learning Streak</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActivitiesSection}>
        <Text style={styles.sectionTitle}>Quick Activities</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <QuickActivity
            title="Rhyme Time"
            icon="music-note"
            color="#FF6B6B"
            duration="5 min"
            onPress={() => {/* Navigate to rhyme activity */}}
          />
          <QuickActivity
            title="Sound Blending"
            icon="hearing"
            color="#4ECDC4"
            duration="8 min"
            onPress={() => {/* Navigate to blending activity */}}
          />
          <QuickActivity
            title="Word Puzzle"
            icon="extension"
            color="#45B7D1"
            duration="10 min"
            onPress={() => {/* Navigate to puzzle activity */}}
          />
          <QuickActivity
            title="Voice Practice"
            icon="record-voice-over"
            color="#96CEB4"
            duration="6 min"
            onPress={() => {/* Navigate to voice activity */}}
          />
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.startLearningButton}>
        <Text style={styles.startLearningText}>Start Learning Adventure</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  childSelector: {
    padding: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  childTab: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedChildTab: {
    backgroundColor: '#4A90E2',
  },
  childTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedChildTabText: {
    color: '#FFFFFF',
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 10,
  },
  monitoringContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monitoringTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  strugglingContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  strugglingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  strugglingText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  helpButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  achievementsContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  achievementText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  celebrateButton: {
    padding: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ParentDashboard;

// src/components/LiveActivityFeed.tsx - Real-time Activity Monitoring
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'start' | 'complete' | 'struggle' | 'achievement';
  activity: string;
  score?: number;
  message: string;
}

interface LiveActivityFeedProps {
  childId: string;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ childId }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Mock real-time events - in real app, this would use WebSocket
    const mockEvents: ActivityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        type: 'start',
        activity: 'Rhyme Time Adventure',
        message: 'Started learning activity',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 240000), // 4 minutes ago
        type: 'struggle',
        activity: 'Rhyme Time Adventure',
        message: 'Having difficulty with blending sounds',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        type: 'complete',
        activity: 'Rhyme Time Adventure',
        score: 85,
        message: 'Completed activity with 85% accuracy',
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        type: 'achievement',
        activity: 'General',
        message: 'Unlocked "Rhyme Master" achievement!',
      },
    ];

    setEvents(mockEvents);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Add new mock event occasionally
      if (Math.random() > 0.8) {
        const newEvent: ActivityEvent = {
          id: `${Date.now()}`,
          timestamp: new Date(),
          type: 'start',
          activity: 'Sound Safari',
          message: 'Started new learning activity',
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep only 10 recent events
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [childId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return { name: 'play-arrow', color: '#4A90E2' };
      case 'complete':
        return { name: 'check-circle', color: '#4CAF50' };
      case 'struggle':
        return { name: 'warning', color: '#FF9800' };
      case 'achievement':
        return { name: 'star', color: '#FFD700' };
      default:
        return { name: 'info', color: '#666' };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Live Activity Feed</Text>
      
      <ScrollView style={styles.eventList} showsVerticalScrollIndicator={false}>
        {events.map((event) => {
          const icon = getEventIcon(event.type);
          return (
            <View key={event.id} style={styles.eventItem}>
              <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
                <Icon name={icon.name} size={20} color={icon.color} />
              </View>
              
              <View style={styles.eventContent}>
                <Text style={styles.eventMessage}>{event.message}</Text>
                <Text style={styles.eventActivity}>{event.activity}</Text>
                {event.score && (
                  <Text style={styles.eventScore}>Score: {event.score}%</Text>
                )}
              </View>
              
              <Text style={styles.eventTime}>{formatTime(event.timestamp)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  eventList: {
    maxHeight: 200,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventMessage: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  eventActivity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  eventScore: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  eventTime: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
});

export default LiveActivityFeed;

// src/utils/audioManager.ts - Audio Management Utilities
import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

interface SoundPool {
  [key: string]: Sound;
}

class AudioManager {
  private sounds: SoundPool = {};
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Preload common sounds
      await this.loadSound('welcome', require('../assets/sounds/welcome.mp3'));
      await this.loadSound('success', require('../assets/sounds/success.mp3'));
      await this.loadSound('error', require('../assets/sounds/error.mp3'));
      await this.loadSound('click', require('../assets/sounds/click.mp3'));
      await this.loadSound('character_professor', require('../assets/sounds/professor_hello.mp3'));
      await this.loadSound('character_ella', require('../assets/sounds/ella_hello.mp3'));
      await this.loadSound('character_gus', require('../assets/sounds/gus_hello.mp3'));
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  private loadSound(key: string, soundFile: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(soundFile, (error) => {
        if (error) {
          console.error(`Failed to load sound ${key}:`, error);
          reject(error);
        } else {
          this.sounds[key] = sound;
          resolve();
        }
      });
    });
  }

  playSound(key: string, callback?: (success: boolean) => void) {
    const sound = this.sounds[key];
    if (sound) {
      sound.play((success) => {
        callback?.(success);
        if (!success) {
          console.error(`Failed to play sound: ${key}`);
        }
      });
    } else {
      console.warn(`Sound not found: ${key}`);
      callback?.(false);
    }
  }

  stopSound(key: string) {
    const sound = this.sounds[key];
    if (sound) {
      sound.stop();
    }
  }

  setVolume(key: string, volume: number) {
    const sound = this.sounds[key];
    if (sound) {
      sound.setVolume(Math.max(0, Math.min(1, volume)));
    }
  }

  release() {
    Object.values(this.sounds).forEach(sound => {
      sound.release();
    });
    this.sounds = {};
    this.isInitialized = false;
  }
}

const audioManager = new AudioManager();

export const initializeAudio = () => audioManager.initialize();
export const playWelcomeSound = () => audioManager.playSound('welcome');
export const playSuccessSound = () => audioManager.playSound('success');
export const playErrorSound = () => audioManager.playSound('error');
export const playClickSound = () => audioManager.playSound('click');
export const playCharacterSound = (character: 'professor' | 'ella' | 'gus') => {
  audioManager.playSound(`character_${character}`);
};

export default audioManager;

// src/utils/permissions.ts - Permission Management
import { Platform, Alert, Linking } from 'react-native';
import { PERMISSIONS, request, check, RESULTS, openSettings } from 'react-native-permissions';

export const requestPermissions = async () => {
  try {
    // Request microphone permission for voice activities
    const microphonePermission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.MICROPHONE 
      : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const micResult = await request(microphonePermission);
    
    if (micResult !== RESULTS.GRANTED) {
      Alert.alert(
        'Microphone Permission',
        'Elemental Genius needs microphone access for voice learning activities. Please enable it in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ]
      );
    }

    // Request camera permission for avatar photos and progress documentation
    const cameraPermission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.CAMERA 
      : PERMISSIONS.ANDROID.CAMERA;

    const cameraResult = await request(cameraPermission);
    
    if (cameraResult !== RESULTS.GRANTED) {
      Alert.alert(
        'Camera Permission',
        'Camera access is optional but allows you to take photos for your learning portfolio.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }

    // Request notification permission
    if (Platform.OS === 'ios') {
      const notificationResult = await request(PERMISSIONS.IOS.NOTIFICATIONS);
      if (notificationResult !== RESULTS.GRANTED) {
        Alert.alert(
          'Notification Permission',
          'Enable notifications to receive learning reminders and progress updates.',
          [{ text: 'OK', onPress: () => {} }]
        );
      }
    }

    return {
      microphone: micResult === RESULTS.GRANTED,
      camera: cameraResult === RESULTS.GRANTED,
      notifications: Platform.OS === 'android' || micResult === RESULTS.GRANTED,
    };

  } catch (error) {
    console.error('Error requesting permissions:', error);
    return {
      microphone: false,
      camera: false,
      notifications: false,
    };
  }
};

export const checkPermissions = async () => {
  try {
    const microphonePermission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.MICROPHONE 
      : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const cameraPermission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.CAMERA 
      : PERMISSIONS.ANDROID.CAMERA;

    const [micResult, cameraResult] = await Promise.all([
      check(microphonePermission),
      check(cameraPermission),
    ]);

    return {
      microphone: micResult === RESULTS.GRANTED,
      camera: cameraResult === RESULTS.GRANTED,
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      microphone: false,
      camera: false,
    };
  }
};

// src/utils/pushNotifications.ts - Push Notification Setup
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

export const setupPushNotifications = () => {
  PushNotification.configure({
    onRegister: function (token) {
      console.log('Push notification token:', token);
      // Send token to backend for parent notifications
    },

    onNotification: function (notification) {
      console.log('Notification received:', notification);
      
      // Handle notification tap
      if (notification.userInteraction) {
        // Navigate to appropriate screen based on notification type
        console.log('User tapped notification');
      }
    },

    onRegistrationError: function(err) {
      console.error('Push notification registration error:', err);
    },

    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  // Create notification channels for Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'learning-reminders',
        channelName: 'Learning Reminders',
        channelDescription: 'Notifications to remind about learning sessions',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Learning reminders channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'achievements',
        channelName: 'Achievements',
        channelDescription: 'Notifications for new achievements and milestones',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Achievements channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'parent-alerts',
        channelName: 'Parent Alerts',
        channelDescription: 'Important alerts for parents about child progress',
        playSound: true,
        soundName: 'default',
        importance: 5,
        vibrate: true,
      },
      (created) => console.log(`Parent alerts channel created: ${created}`)
    );
  }
};

export const scheduleLearningReminder = (time: Date, message: string) => {
  PushNotification.localNotificationSchedule({
    channelId: 'learning-reminders',
    title: 'Time to Learn! 📚',
    message,
    date: time,
    playSound: true,
    soundName: 'default',
    repeatType: 'day', // Daily reminder
  });
};

export const showAchievementNotification = (achievement: string) => {
  PushNotification.localNotification({
    channelId: 'achievements',
    title: 'New Achievement Unlocked! 🎉',
    message: `Congratulations! You earned "${achievement}"`,
    playSound: true,
    soundName: 'default',
    largeIcon: 'ic_achievement',
    smallIcon: 'ic_notification',
  });
};

export const sendParentAlert = (childName: string, message: string) => {
  PushNotification.localNotification({
    channelId: 'parent-alerts',
    title: `${childName} Update`,
    message,
    playSound: true,
    soundName: 'default',
    priority: 'high',
  });
};

// metro.config.js - Metro bundler configuration
const {getDefaultConfig} = require('metro-config');

module.exports = (async () => {
  const {
    resolver: {sourceExts, assetExts},
  } = await getDefaultConfig();
  
  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
  };
})();

// babel.config.js - Babel configuration
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 4,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  characterSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  progressSection: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  progressCards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 5,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  streakDays: {
    fontSize: 14,
    color: '#666',
    marginTop: -5,
  },
  quickActivitiesSection: {
    margin: 20,
    marginTop: 10,
  },
  startLearningButton: {
    backgroundColor: '#4A90E2',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startLearningText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

// src/components/CharacterDisplay.tsx - Character Display Component
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { playCharacterSound } from '../utils/audioManager';

const { width } = Dimensions.get('window');

interface CharacterDisplayProps {
  character: 'professor' | 'ella' | 'gus';
  message: string;
  animated?: boolean;
  onTap?: () => void;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  character,
  message,
  animated = false,
  onTap,
}) => {
  const [bounceAnim] = useState(new Animated.Value(1));
  const [messageAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (animated) {
      // Character bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Message fade in
      Animated.timing(messageAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [animated]);

  const handleCharacterTap = () => {
    playCharacterSound(character);
    
    // Tap animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onTap?.();
  };

  const getCharacterAnimation = () => {
    switch (character) {
      case 'professor':
        return require('../assets/animations/professor_idle.json');
      case 'ella':
        return require('../assets/animations/ella_wave.json');
      case 'gus':
        return require('../assets/animations/gus_bounce.json');
      default:
        return require('../assets/animations/professor_idle.json');
    }
  };

  const getCharacterStyle = () => {
    switch (character) {
      case 'professor':
        return styles.professor;
      case 'ella':
        return styles.ella;
      case 'gus':
        return styles.gus;
      default:
        return styles.professor;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.characterContainer}
        onPress={handleCharacterTap}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.character,
            getCharacterStyle(),
            {
              transform: [{ scale: bounceAnim }],
            },
          ]}
        >
          <LottieView
            source={getCharacterAnimation()}
            autoPlay
            loop
            style={styles.characterAnimation}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.speechBubble,
          {
            opacity: messageAnim,
          },
        ]}
      >
        <Text style={styles.messageText}>{message}</Text>
        <View style={styles.speechBubbleArrow} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  characterContainer: {
    marginBottom: 15,
  },
  character: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  professor: {
    backgroundColor: '#E3F2FD',
  },
  ella: {
    backgroundColor: '#FFF3E0',
  },
  gus: {
    backgroundColor: '#E8F5E8',
  },
  characterAnimation: {
    width: 100,
    height: 100,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 20,
    maxWidth: width * 0.8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  speechBubbleArrow: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default CharacterDisplay;

// src/components/AvatarPreview.tsx - Avatar Preview Component
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface Avatar {
  id: string;
  hairColor: string;
  hairStyle: string;
  skinColor: string;
  eyeColor: string;
  clothing: {
    top: string;
    bottom: string;
    colors: string[];
  };
  accessories: string[];
}

interface AvatarPreviewProps {
  avatar: Avatar | null;
  size: number;
  animated?: boolean;
  onPress?: () => void;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  avatar,
  size,
  animated = false,
  onPress,
}) => {
  const [rotateAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (animated) {
      // Gentle rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [animated]);

  const handlePress = () => {
    if (onPress) {
      // Press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onPress();
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!avatar) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={styles.placeholder}>
          <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill="#E0E0E0" stroke="#CCC" strokeWidth="2" />
            <Circle cx="40" cy="40" r="3" fill="#999" />
            <Circle cx="60" cy="40" r="3" fill="#999" />
            <Path d="M 35 55 Q 50 65 65 55" stroke="#999" strokeWidth="2" fill="none" />
          </Svg>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            transform: [
              { rotate: animated ? rotation : '0deg' },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Avatar Head */}
          <Circle
            cx="50"
            cy="45"
            r="25"
            fill={avatar.skinColor}
            stroke="#DDD"
            strokeWidth="1"
          />
          
          {/* Hair */}
          <Path
            d={getHairPath(avatar.hairStyle)}
            fill={avatar.hairColor}
          />
          
          {/* Eyes */}
          <Circle cx="43" cy="40" r="2" fill={avatar.eyeColor} />
          <Circle cx="57" cy="40" r="2" fill={avatar.eyeColor} />
          
          {/* Mouth */}
          <Path d="M 45 50 Q 50 55 55 50" stroke="#FF6B9D" strokeWidth="1.5" fill="none" />
          
          {/* Body */}
          <Rect
            x="35"
            y="65"
            width="30"
            height="25"
            rx="5"
            fill={avatar.clothing.colors[0]}
          />
          
          {/* Clothing Details */}
          {avatar.clothing.top === 'striped' && (
            <>
              <Rect x="35" y="70" width="30" height="2" fill={avatar.clothing.colors[1]} />
              <Rect x="35" y="75" width="30" height="2" fill={avatar.clothing.colors[1]} />
              <Rect x="35" y="80" width="30" height="2" fill={avatar.clothing.colors[1]} />
            </>
          )}
          
          {/* Accessories */}
          {avatar.accessories.includes('hat') && (
            <Rect x="40" y="15" width="20" height="8" rx="4" fill="#4A90E2" />
          )}
          
          {avatar.accessories.includes('glasses') && (
            <>
              <Circle cx="43" cy="40" r="4" fill="none" stroke="#333" strokeWidth="1" />
              <Circle cx="57" cy="40" r="4" fill="none" stroke="#333" strokeWidth="1" />
              <Path d="M 47 40 L 53 40" stroke="#333" strokeWidth="1" />
            </>
          )}
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
};

const getHairPath = (hairStyle: string): string => {
  switch (hairStyle) {
    case 'short':
      return 'M 30 35 Q 50 15 70 35 Q 65 25 50 20 Q 35 25 30 35';
    case 'long':
      return 'M 25 30 Q 50 10 75 30 Q 75 45 70 55 Q 50 50 30 55 Q 25 45 25 30';
    case 'curly':
      return 'M 28 32 Q 35 18 42 25 Q 50 15 58 25 Q 65 18 72 32 Q 68 28 62 30 Q 55 25 50 28 Q 45 25 38 30 Q 32 28 28 32';
    case 'pigtails':
      return 'M 25 35 Q 30 25 35 30 M 65 30 Q 70 25 75 35 M 30 30 Q 50 15 70 30 Q 65 25 50 20 Q 35 25 30 30';
    default:
      return 'M 30 35 Q 50 15 70 35 Q 65 25 50 20 Q 35 25 30 35';
  }
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 5,
  },
  placeholder: {
    backgroundColor: '#F0F0F0',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});

export default AvatarPreview;

// src/screens/LearningScreen.tsx - Learning Activities Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../store/store';
import CharacterDisplay from '../components/CharacterDisplay';
import ActivityCard from '../components/ActivityCard';
import ProgressTracker from '../components/ProgressTracker';
import VoiceActivity from '../components/VoiceActivity';
import { startActivity, completeActivity } from '../store/slices/learningSlice';

const { width, height } = Dimensions.get('window');

interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'phoneme' | 'rhyme' | 'blending' | 'segmentation' | 'voice';
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: number;
  ageRange: [number, number];
  icon: string;
  color: string;
  completed: boolean;
}

const LearningScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentWeek, weeklyProgress } = useSelector((state: RootState) => state.learning);
  
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showVoiceActivity, setShowVoiceActivity] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const activities: Activity[] = [
    {
      id: 'rhyme-1',
      title: 'Rhyme Time Adventure',
      description: 'Find words that sound alike and create magical rhymes!',
      type: 'rhyme',
      difficulty: 1,
      duration: 5,
      ageRange: [3, 6],
      icon: 'music-note',
      color: '#FF6B6B',
      completed: false,
    },
    {
      id: 'phoneme-1',
      title: 'Sound Safari',
      description: 'Explore the jungle of sounds and discover phonemes!',
      type: 'phoneme',
      difficulty: 2,
      duration: 8,
      ageRange: [4, 7],
      icon: 'hearing',
      color: '#4ECDC4',
      completed: false,
    },
    {
      id: 'blending-1',
      title: 'Magic Word Builder',
      description: 'Blend sounds together to create amazing words!',
      type: 'blending',
      difficulty: 2,
      duration: 10,
      ageRange: [5, 8],
      icon: 'extension',
      color: '#45B7D1',
      completed: false,
    },
    {
      id: 'voice-1',
      title: 'Voice Hero Challenge',
      description: 'Use your voice to save the day with perfect pronunciation!',
      type: 'voice',
      difficulty: 3,
      duration: 6,
      ageRange: [4, 8],
      icon: 'record-voice-over',
      color: '#96CEB4',
      completed: false,
    },
    {
      id: 'segmentation-1',
      title: 'Word Detective',
      description: 'Break words apart and solve the phonemic mystery!',
      type: 'segmentation',
      difficulty: 3,
      duration: 12,
      ageRange: [6, 9],
      icon: 'search',
      color: '#F7DC6F',
      completed: false,
    },
  ];

  const getAgeAppropriateActivities = () => {
    if (!user?.age) return activities;
    return activities.filter(activity => 
      activity.ageRange[0] <= user.age && activity.ageRange[1] >= user.age
    );
  };

  const getCharacterForAge = () => {
    if (!user?.age) return 'professor';
    if (user.age <= 4) return 'gus';
    if (user.age <= 8) return 'ella';
    return 'professor';
  };

  const getCharacterMessage = () => {
    const character = getCharacterForAge();
    const messages = {
      gus: [
        "Let's play and learn together! 🌈",
        "Which fun activity should we try?",
        "You're doing great, little friend!",
      ],
      ella: [
        "Ready for some school-level challenges?",
        "Pick an activity to boost your skills!",
        "Learning is the best adventure!",
      ],
      professor: [
        "Excellent! Let's expand your knowledge.",
        "Choose wisely, young scholar.",
        "Every activity builds your foundation.",
      ],
    };
    
    const characterMessages = messages[character];
    return characterMessages[Math.floor(Math.random() * characterMessages.length)];
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    dispatch(startActivity(activity.id));
    
    if (activity.type === 'voice') {
      setShowVoiceActivity(true);
    } else {
      Alert.alert(
        activity.title,
        `Starting ${activity.title}! This will take about ${activity.duration} minutes.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Learning!', onPress: () => startLearningActivity(activity) },
        ]
      );
    }
  };

  const startLearningActivity = (activity: Activity) => {
    // Navigate to specific activity screen based on type
    // This would integrate with the actual learning modules
    console.log(`Starting activity: ${activity.title}`);
  };

  const handleActivityComplete = (activityId: string, score: number) => {
    dispatch(completeActivity({ activityId, score }));
    setSelectedActivity(null);
    setShowVoiceActivity(false);
    
    Alert.alert(
      'Congratulations! 🎉',
      `You completed the activity with a score of ${score}%!`,
      [{ text: 'Continue Learning', onPress: () => {} }]
    );
  };

  if (showVoiceActivity && selectedActivity) {
    return (
      <VoiceActivity
        activity={selectedActivity}
        onComplete={(score) => handleActivityComplete(selectedActivity.id, score)}
        onClose={() => setShowVoiceActivity(false)}
      />
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Learning Adventures</Text>
          <Text style={styles.headerSubtitle}>Week {currentWeek} • Progress: {weeklyProgress}%</Text>
        </View>

        <ProgressTracker 
          currentWeek={currentWeek}
          weeklyProgress={weeklyProgress}
          totalWeeks={35}
        />

        <CharacterDisplay
          character={getCharacterForAge()}
          message={getCharacterMessage()}
          animated={true}
        />

        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>Choose Your Adventure</Text>
          
          {getAgeAppropriateActivities().map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => handleActivitySelect(activity)}
            />
          ))}
        </View>

        <View style={styles.helpSection}>
          <TouchableOpacity style={styles.helpButton}>
            <Icon name="help-outline" size={24} color="#4A90E2" />
            <Text style={styles.helpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  activitiesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  helpSection: {
    padding: 20,
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  helpText: {
    fontSize: 16,
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default LearningScreen;

// src/components/ActivityCard.tsx - Individual Activity Card Component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HapticFeedback from 'react-native-haptic-feedback';

const { width } = Dimensions.get('window');

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: number;
  duration: number;
  icon: string;
  color: string;
  completed: boolean;
}

interface ActivityCardProps {
  activity: Activity;
  onPress: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
    HapticFeedback.trigger('impactLight');
    
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const getDifficultyStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="star"
        size={16}
        color={index < activity.difficulty ? '#FFD700' : '#E0E0E0'}
      />
    ));
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: activity.color,
            transform: [{ scale: scaleAnim }],
          },
          pressed && styles.cardPressed,
        ]}
      >
        {activity.completed && (
          <View style={styles.completedBadge}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
          </View>
        )}

        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <Icon name={activity.icon} size={32} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.description}>{activity.description}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Icon name="schedule" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaText}>{activity.duration} min</Text>
            </View>
            
            <View style={styles.metaItem}>
              <View style={styles.difficultyContainer}>
                {getDifficultyStars()}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Icon name="arrow-forward-ios" size={20} color="rgba(255,255,255,0.8)" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    minHeight: 120,
  },
  cardPressed: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 2,
  },
  iconContainer: {
    marginRight: 15,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
  },
  arrowContainer: {
    marginLeft: 10,
  },
});

export default ActivityCard;

// src/components/VoiceActivity.tsx - Voice-Based Learning Activity
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Voice from '@react-native-voice/voice';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import HapticFeedback from 'react-native-haptic-feedback';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: number;
}

interface VoiceActivityProps {
  activity: Activity;
  onComplete: (score: number) => void;
  onClose: () => void;
}

const VoiceActivity: React.FC<VoiceActivityProps> = ({
  activity,
  onComplete,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [userSpeech, setUserSpeech] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  const words = ['cat', 'dog', 'sun', 'tree', 'book', 'happy', 'jump', 'sing'];

  useEffect(() => {
    setCurrentWord(words[Math.floor(Math.random() * words.length)]);
    
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const onSpeechStart = () => {
    setIsListening(true);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechResults = (event: any) => {
    const results = event.value;
    if (results && results.length > 0) {
      const spokenText = results[0].toLowerCase().trim();
      setUserSpeech(spokenText);
      checkPronunciation(spokenText);
    }
  };

  const onSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    Alert.alert('Voice Recognition', 'Could not recognize speech. Please try again.');
  };

  const startListening = async () => {
    try {
      HapticFeedback.trigger('impactLight');
      setUserSpeech('');
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Error', 'Could not start voice recognition.');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const checkPronunciation = (spokenText: string) => {
    const similarity = calculateSimilarity(spokenText, currentWord);
    const currentScore = Math.round(similarity * 100);
    
    setScore(currentScore);
    setAttempts(prev => prev + 1);

    HapticFeedback.trigger(currentScore >= 80 ? 'notificationSuccess' : 'notificationWarning');

    if (currentScore >= 80) {
      setTimeout(() => {
        onComplete(currentScore);
      }, 1500);
    } else if (attempts >= maxAttempts - 1) {
      setTimeout(() => {
        onComplete(Math.max(score, currentScore));
      }, 1500);
    } else {
      // Give another chance
      setTimeout(() => {
        setCurrentWord(words[Math.floor(Math.random() * words.length)]);
        setUserSpeech('');
      }, 2000);
    }
  };

  const calculateSimilarity = (text1: string, text2: string): number => {
    // Simple similarity calculation - in a real app, use more sophisticated phonetic matching
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const getScoreColor = () => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreMessage = () => {
    if (score >= 80) return 'Excellent pronunciation! 🌟';
    if (score >= 60) return 'Good job! Keep practicing! 👍';
    return 'Try again, you can do it! 💪';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activity.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.wordContainer}>
          <Text style={styles.instructionText}>Say this word:</Text>
          <Text style={styles.targetWord}>{currentWord}</Text>
        </View>

        <View style={styles.micContainer}>
          <TouchableOpacity
            style={[
              styles.micButton,
              { backgroundColor: isListening ? '#F44336' : '#4A90E2' },
            ]}
            onPress={isListening ? stopListening : startListening}
            disabled={attempts >= maxAttempts && score < 80}
          >
            <Animated.View
              style={[
                styles.micInner,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Icon
                name={isListening ? 'mic' : 'mic-none'}
                size={40}
                color="#FFFFFF"
              />
            </Animated.View>
          </TouchableOpacity>
          
          {isListening && (
            <Animated.View
              style={[
                styles.waveContainer,
                {
                  opacity: waveAnim,
                },
              ]}
            >
              <LottieView
                source={require('../assets/animations/voice_wave.json')}
                autoPlay
                loop
                style={styles.waveAnimation}
              />
            </Animated.View>
          )}
        </View>

        {userSpeech !== '' && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>You said:</Text>
            <Text style={styles.userSpeechText}>"{userSpeech}"</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreText, { color: getScoreColor() }]}>
                {score}%
              </Text>
              <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>
            </View>
          </View>
        )}

        <View style={styles.attemptsContainer}>
          <Text style={styles.attemptsText}>
            Attempt {attempts} of {maxAttempts}
          </Text>
          <View style={styles.progressDots}>
            {Array.from({ length: maxAttempts }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index < attempts ? '#4A90E2' : '#E0E0E0',
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.instructionBottom}>
          {isListening
            ? 'Listening... Speak clearly!'
            : 'Tap the microphone and say the word'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  instructionText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 15,
  },
  targetWord: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  micInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveAnimation: {
    width: 200,
    height: 200,
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userSpeechText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  attemptsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  attemptsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressDots: {
    flexDirection: 'row',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  instructionBottom: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default VoiceActivity;

// src/screens/AvatarScreen.tsx - Avatar Creation and Customization
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../store/store';
import { updateAvatar, saveAvatar } from '../store/slices/avatarSlice';
import AvatarPreview from '../components/AvatarPreview';
import CustomizationPanel from '../components/CustomizationPanel';
import HapticFeedback from 'react-native-haptic-feedback';

const { width, height } = Dimensions.get('window');

interface AvatarCustomization {
  hairColor: string;
  hairStyle: string;
  skinColor: string;
  eyeColor: string;
  clothing: {
    top: string;
    bottom: string;
    colors: string[];
  };
  accessories: string[];
}

const AvatarScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { currentAvatar } = useSelector((state: RootState) => state.avatar);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [customization, setCustomization] = useState<AvatarCustomization>({
    hairColor: '#8B4513',
    hairStyle: 'short',
    skinColor: '#FDBCB4',
    eyeColor: '#4A90E2',
    clothing: {
      top: 'tshirt',
      bottom: 'pants',
      colors: ['#4A90E2', '#FFFFFF'],
    },
    accessories: [],
  });
  
  const [activeTab, setActiveTab] = useState<'hair' | 'face' | 'clothing' | 'accessories'>('hair');
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (currentAvatar) {
      setCustomization({
        hairColor: currentAvatar.hairColor,
        hairStyle: currentAvatar.hairStyle,
        skinColor: currentAvatar.skinColor,
        eyeColor: currentAvatar.eyeColor,
        clothing: currentAvatar.clothing,
        accessories: currentAvatar.accessories,
      });
    }
    
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentAvatar]);

  const handleCustomizationChange = (category: string, value: any) => {
    HapticFeedback.trigger('impactLight');
    
    setCustomization(prev => ({
      ...prev,
      [category]: value,
    }));

    // Preview animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSaveAvatar = () => {
    const newAvatar = {
      id: currentAvatar?.id || `avatar_${Date.now()}`,
      ...customization,
    };

    dispatch(updateAvatar(newAvatar));
    dispatch(saveAvatar(newAvatar));
    
    HapticFeedback.trigger('notificationSuccess');
    
    Alert.alert(
      'Avatar Saved! 🎉',
      'Your awesome avatar has been saved and is ready for learning adventures!',
      [{ text: 'Great!', onPress: () => {} }]
    );
  };

  const handleRandomize = () => {
    const hairColors = ['#8B4513', '#FFD700', '#000000', '#FF6B35', '#4A90E2'];
    const hairStyles = ['short', 'long', 'curly', 'pigtails'];
    const skinColors = ['#FDBCB4', '#F1C27D', '#E0AC69', '#C68642', '#8D5524'];
    const eyeColors = ['#4A90E2', '#4CAF50', '#8B4513', '#9C27B0', '#FF5722'];
    const clothingColors = [
      ['#4A90E2', '#FFFFFF'],
      ['#4CAF50', '#FFEB3B'],
      ['#E91E63', '#FFFFFF'],
      ['#FF9800', '#000000'],
      ['#9C27B0', '#FFFFFF'],
    ];

    const randomCustomization = {
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      skinColor: skinColors[Math.floor(Math.random() * skinColors.length)],
      eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
      clothing: {
        top: Math.random() > 0.5 ? 'tshirt' : 'striped',
        bottom: 'pants',
        colors: clothingColors[Math.floor(Math.random() * clothingColors.length)],
      },
      accessories: Math.random() > 0.7 ? ['hat'] : Math.random() > 0.5 ? ['glasses'] : [],
    };

    setCustomization(randomCustomization);
    HapticFeedback.trigger('impactMedium');
  };

  const customizationTabs = [
    { id: 'hair', label: 'Hair', icon: 'face' },
    { id: 'face', label: 'Face', icon: 'visibility' },
    { id: 'clothing', label: 'Clothes', icon: 'checkroom' },
    { id: 'accessories', label: 'Extras', icon: 'star' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Your Avatar</Text>
        <Text style={styles.headerSubtitle}>Design your learning companion!</Text>
      </View>

      <Animated.View
        style={[
          styles.previewContainer,
          {
            opacity: slideAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <AvatarPreview
          avatar={{
            id: 'preview',
            ...customization,
          }}
          size={200}
          animated={true}
        />
      </Animated.View>

      <View style={styles.tabContainer}>
        {customizationTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={activeTab === tab.id ? '#FFFFFF' : '#666'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customizationContainer}>
        <CustomizationPanel
          activeTab={activeTab}
          customization={customization}
          onChange={handleCustomizationChange}
        />
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.randomButton} onPress={handleRandomize}>
          <Icon name="shuffle" size={20} color="#666" />
          <Text style={styles.randomText}>Random</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAvatar}>
          <Icon name="save" size={20} color="#FFFFFF" />
          <Text style={styles.saveText}>Save Avatar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#FFFFFF',
  },
  customizationContainer: {
    flex: 1,
    margin: 20,
    marginTop: 15,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
  },
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  randomText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default AvatarScreen;

// src/components/CustomizationPanel.tsx - Avatar Customization Controls
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomizationProps {
  activeTab: 'hair' | 'face' | 'clothing' | 'accessories';
  customization: any;
  onChange: (category: string, value: any) => void;
}

const CustomizationPanel: React.FC<CustomizationProps> = ({
  activeTab,
  customization,
  onChange,
}) => {
  const hairColors = [
    { color: '#8B4513', name: 'Brown' },
    { color: '#FFD700', name: 'Blonde' },
    { color: '#000000', name: 'Black' },
    { color: '#FF6B35', name: 'Red' },
    { color: '#4A90E2', name: 'Blue' },
    { color: '#E91E63', name: 'Pink' },
    { color: '#4CAF50', name: 'Green' },
    { color: '#9C27B0', name: 'Purple' },
  ];

  const hairStyles = [
    { id: 'short', name: 'Short', icon: 'face' },
    { id: 'long', name: 'Long', icon: 'face' },
    { id: 'curly', name: 'Curly', icon: 'face' },
    { id: 'pigtails', name: 'Pigtails', icon: 'face' },
  ];

  const skinColors = [
    { color: '#FDBCB4', name: 'Light' },
    { color: '#F1C27D', name: 'Fair' },
    { color: '#E0AC69', name: 'Medium' },
    { color: '#C68642', name: 'Olive' },
    { color: '#8D5524', name: 'Dark' },
  ];

  const eyeColors = [
    { color: '#4A90E2', name: 'Blue' },
    { color: '#4CAF50', name: 'Green' },
    { color: '#8B4513', name: 'Brown' },
    { color: '#9C27B0', name: 'Purple' },
    { color: '#FF5722', name: 'Hazel' },
  ];

  const clothingOptions = [
    { id: 'tshirt', name: 'T-Shirt', icon: 'checkroom' },
    { id: 'striped', name: 'Striped', icon: 'checkroom' },
    { id: 'hoodie', name: 'Hoodie', icon: 'checkroom' },
  ];

  const clothingColors = [
    { colors: ['#4A90E2', '#FFFFFF'], name: 'Blue & White' },
    { colors: ['#4CAF50', '#FFEB3B'], name: 'Green & Yellow' },
    { colors: ['#E91E63', '#FFFFFF'], name: 'Pink & White' },
    { colors: ['#FF9800', '#000000'], name: 'Orange & Black' },
    { colors: ['#9C27B0', '#FFFFFF'], name: 'Purple & White' },
  ];

  const accessories = [
    { id: 'hat', name: 'Hat', icon: 'face' },
    { id: 'glasses', name: 'Glasses', icon: 'visibility' },
    { id: 'bow', name: 'Bow', icon: 'star' },
  ];

  const ColorOption = ({ color, name, isSelected, onPress }: any) => (
    <TouchableOpacity
      style={[
        styles.colorOption,
        { backgroundColor: color },
        isSelected && styles.selectedOption,
      ]}
      onPress={onPress}
    >
      {isSelected && <Icon name="check" size={16} color="#FFFFFF" />}
    </TouchableOpacity>
  );

  const StyleOption = ({ item, isSelected, onPress, icon }: any) => (
    <TouchableOpacity
      style={[styles.styleOption, isSelected && styles.selectedStyleOption]}
      onPress={onPress}
    >
      <Icon name={icon || 'face'} size={24} color={isSelected ? '#FFFFFF' : '#666'} />
      <Text style={[styles.styleText, isSelected && styles.selectedStyleText]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderHairCustomization = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Hair Color</Text>
      <View style={styles.colorGrid}>
        {hairColors.map((color) => (
          <ColorOption
            key={color.color}
            color={color.color}
            name={color.name}
            isSelected={customization.hairColor === color.color}
            onPress={() => onChange('hairColor', color.color)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Hair Style</Text>
      <View style={styles.styleGrid}>
        {hairStyles.map((style) => (
          <StyleOption
            key={style.id}
            item={style}
            icon={style.icon}
            isSelected={customization.hairStyle === style.id}
            onPress={() => onChange('hairStyle', style.id)}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderFaceCustomization = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Skin Color</Text>
      <View style={styles.colorGrid}>
        {skinColors.map((color) => (
          <ColorOption
            key={color.color}
            color={color.color}
            name={color.name}
            isSelected={customization.skinColor === color.color}
            onPress={() => onChange('skinColor', color.color)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Eye Color</Text>
      <View style={styles.colorGrid}>
        {eyeColors.map((color) => (
          <ColorOption
            key={color.color}
            color={color.color}
            name={color.name}
            isSelected={customization.eyeColor === color.color}
            onPress={() => onChange('eyeColor', color.color)}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderClothingCustomization = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Clothing Style</Text>
      <View style={styles.styleGrid}>
        {clothingOptions.map((option) => (
          <StyleOption
            key={option.id}
            item={option}
            icon={option.icon}
            isSelected={customization.clothing.top === option.id}
            onPress={() => onChange('clothing', {
              ...customization.clothing,
              top: option.id,
            })}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Clothing Colors</Text>
      <View style={styles.colorCombinations}>
        {clothingColors.map((combo, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorCombo,
              JSON.stringify(customization.clothing.colors) === JSON.stringify(combo.colors) && 
              styles.selectedCombo,
            ]}
            onPress={() => onChange('clothing', {
              ...customization.clothing,
              colors: combo.colors,
            })}
          >
            <View style={styles.colorPreview}>
              <View style={[styles.colorBlock, { backgroundColor: combo.colors[0] }]} />
              <View style={[styles.colorBlock, { backgroundColor: combo.colors[1] }]} />
            </View>
            <Text style={styles.comboName}>{combo.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderAccessoriesCustomization = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Accessories</Text>
      <View style={styles.styleGrid}>
        {accessories.map((accessory) => (
          <StyleOption
            key={accessory.id}
            item={accessory}
            icon={accessory.icon}
            isSelected={customization.accessories.includes(accessory.id)}
            onPress={() => {
              const newAccessories = customization.accessories.includes(accessory.id)
                ? customization.accessories.filter((a: string) => a !== accessory.id)
                : [...customization.accessories, accessory.id];
              onChange('accessories', newAccessories);
            }}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'hair':
        return renderHairCustomization();
      case 'face':
        return renderFaceCustomization();
      case 'clothing':
        return renderClothingCustomization();
      case 'accessories':
        return renderAccessoriesCustomization();
      default:
        return renderHairCustomization();
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedOption: {
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  styleOption: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedStyleOption: {
    backgroundColor: '#4A90E2',
  },
  styleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontWeight: '600',
  },
  selectedStyleText: {
    color: '#FFFFFF',
  },
  colorCombinations: {
    marginBottom: 20,
  },
  colorCombo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedCombo: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  colorPreview: {
    flexDirection: 'row',
    marginRight: 15,
  },
  colorBlock: {
    width: 20,
    height: 20,
    marginRight: 5,
    borderRadius: 10,
  },
  comboName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default CustomizationPanel;

// src/screens/ProgressScreen.tsx - Progress Tracking and Analytics
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { RootState } from '../store/store';
import ProgressRing from '../components/ProgressRing';
import AchievementBadge from '../components/AchievementBadge';

const { width, height } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedDate?: string;
}

const ProgressScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { weeklyProgress, totalActivities, completedActivities, streakDays } = useSelector(
    (state: RootState) => state.progress
  );
  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Mock data - in real app, this would come from API
  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [65, 78, 90, 81, 56, 85, 92],
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const skillsData = {
    labels: ['Phonemes', 'Rhyming', 'Blending', 'Segmentation'],
    datasets: [
      {
        data: [85, 92, 78, 88],
      },
    ],
  };

  const achievements: Achievement[] = [
    {
      id: 'first_word',
      title: 'First Word!',
      description: 'Completed your first pronunciation activity',
      icon: 'record-voice-over',
      color: '#4CAF50',
      unlocked: true,
      unlockedDate: '2024-01-15',
    },
    {
      id: 'rhyme_master',
      title: 'Rhyme Master',
      description: 'Completed 10 rhyming activities',
      icon: 'music-note',
      color: '#FF6B6B',
      unlocked: true,
      unlockedDate: '2024-01-20',
    },
    {
      id: 'week_streak',
      title: 'Week Warrior',
      description: 'Completed activities for 7 days straight',
      icon: 'local-fire-department',
      color: '#FF9800',
      unlocked: false,
    },
    {
      id: 'sound_explorer',
      title: 'Sound Explorer',
      description: 'Mastered all phoneme categories',
      icon: 'explore',
      color: '#9C27B0',
      unlocked: false,
    },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4A90E2',
    },
  };

  const periodOptions = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>
            Amazing work, {user?.name}! 🌟
          </Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewContainer}>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <ProgressRing
                progress={weeklyProgress}
                size={60}
                strokeWidth={6}
                color="#4A90E2"
              />
              <Text style={styles.overviewValue}>{weeklyProgress}%</Text>
              <Text style={styles.overviewLabel}>Weekly Goal</Text>
            </View>

            <View style={styles.overviewCard}>
              <Icon name="local-fire-department" size={40} color="#FF6B6B" />
              <Text style={styles.overviewValue}>{streakDays}</Text>
              <Text style={styles.overviewLabel}>Day Streak</Text>
            </View>

            <View style={styles.overviewCard}>
              <Icon name="school" size={40} color="#4CAF50" />
              <Text style={styles.overviewValue}>{completedActivities}</Text>
              <Text style={styles.overviewLabel}>Activities Done</Text>
            </View>

            <View style={styles.overviewCard}>
              <Icon name="star" size={40} color="#FFD700" />
              <Text style={styles.overviewValue}>
                {achievements.filter(a => a.unlocked).length}
              </Text>
              <Text style={styles.overviewLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Period Selection */}
        <View style={styles.periodContainer}>
          {periodOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.periodButton,
                selectedPeriod === option.id && styles.selectedPeriodButton,
              ]}
              onPress={() => setSelectedPeriod(option.id as any)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === option.id && styles.selectedPeriodText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Progress Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Progress</Text>
          <LineChart
            data={weeklyData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Skills Breakdown */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Skills Mastery</Text>
          <BarChart
            data={skillsData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisSuffix="%"
          />
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                onPress={() => {
                  // Show achievement details
                }}
              />
            ))}
          </View>
        </View>

        {/* Learning Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Learning Insights</Text>
          
          <View style={styles.insightCard}>
            <Icon name="trending-up" size={24} color="#4CAF50" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Great Improvement!</Text>
              <Text style={styles.insightText}>
                Your pronunciation accuracy improved by 15% this week!
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Icon name="schedule" size={24} color="#FF9800" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Best Learning Time</Text>
              <Text style={styles.insightText}>
                You learn best in the morning around 9 AM.
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Icon name="favorite" size={24} color="#E91E63" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Favorite Activity</Text>
              <Text style={styles.insightText}>
                Rhyme Time Adventure is your most completed activity!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  overviewContainer: {
    padding: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  selectedPeriodButton: {
    backgroundColor: '#4A90E2',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  chartContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 10,
  },
  achievementsContainer: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightsContainer: {
    margin: 20,
    marginTop: 0,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  insightContent: {
    flex: 1,
    marginLeft: 15,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ProgressScreen;

// src/components/AchievementBadge.tsx - Achievement Badge Component
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedDate?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  onPress,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setShowModal(true);
    onPress();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: achievement.unlocked ? achievement.color : '#E0E0E0',
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Icon
            name={achievement.icon}
            size={32}
            color={achievement.unlocked ? '#FFFFFF' : '#999'}
          />
          
          {achievement.unlocked && (
            <View style={styles.checkmark}>
              <Icon name="check" size={16} color="#4CAF50" />
            </View>
          )}
        </Animated.View>
        
        <Text
          style={[
            styles.title,
            { color: achievement.unlocked ? '#333' : '#999' },
          ]}
          numberOfLines={2}
        >
          {achievement.title}
        </Text>
      </TouchableOpacity>

      <Modal
        isVisible={showModal}
        onBackdropPress={() => setShowModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View
            style={[
              styles.modalIcon,
              { backgroundColor: achievement.unlocked ? achievement.color : '#E0E0E0' },
            ]}
          >
            <Icon
              name={achievement.icon}
              size={48}
              color={achievement.unlocked ? '#FFFFFF' : '#999'}
            />
          </View>
          
          <Text style={styles.modalTitle}>{achievement.title}</Text>
          <Text style={styles.modalDescription}>{achievement.description}</Text>
          
          {achievement.unlocked && achievement.unlockedDate && (
            <Text style={styles.unlockedDate}>
              Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
            </Text>
          )}
          
          {!achievement.unlocked && (
            <Text style={styles.lockedText}>Keep learning to unlock this achievement!</Text>
          )}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
  },
  unlockedDate: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 20,
  },
  lockedText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AchievementBadge;

// src/screens/ParentDashboard.tsx - Parent Monitoring Interface
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Switch,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { RootState } from '../store/store';
import LiveActivityFeed from '../components/LiveActivityFeed';
import NotificationSettings from '../components/NotificationSettings';

const { width } = Dimensions.get('window');

interface ChildProgress {
  childId: string;
  childName: string;
  weeklyProgress: number;
  todayMinutes: number;
  strugglingAreas: string[];
  recentAchievements: string[];
}

const ParentDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [liveMonitoring, setLiveMonitoring] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Mock data - in real app, this would come from API
  const children: ChildProgress[] = [
    {
      childId: '1',
      childName: 'Emma',
      weeklyProgress: 85,
      todayMinutes: 23,
      strugglingAreas: ['Blending'],
      recentAchievements: ['Rhyme Master', 'First Word!'],
    },
    {
      childId: '2',
      childName: 'Lucas',
      weeklyProgress: 72,
      todayMinutes: 15,
      strugglingAreas: ['Segmentation', 'Phonemes'],
      recentAchievements: ['Week Warrior'],
    },
  ];

  const progressData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [20, 25, 30, 15, 35, 28, 23],
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  useEffect(() => {
    if (children.length > 0) {
      setSelectedChild(children[0].childId);
    }
  }, []);

  const selectedChildData = children.find(child => child.childId === selectedChild);

  const handleEmergencyAlert = () => {
    Alert.alert(
      'Send Encouragement',
      'Would you like to send an encouraging message to your child?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Message', onPress: () => {} },
      ]
    );
  };

  const generateWeeklyReport = () => {
    Alert.alert(
      'Weekly Report',
      'Generating your detailed weekly progress report...',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Dashboard</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Icon name="settings" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Child Selection */}
      <View style={styles.childSelector}>
        <Text style={styles.selectorLabel}>Select Child:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.childId}
              style={[
                styles.childTab,
                selectedChild === child.childId && styles.selectedChildTab,
              ]}
              onPress={() => setSelectedChild(child.childId)}
            >
              <Text
                style={[
                  styles.childTabText,
                  selectedChild === child.childId && styles.selectedChildTabText,
                ]}
              >
                {child.childName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedChildData && (
        <>
          {/* Quick Overview */}
          <View style={styles.overviewContainer}>
            <View style={styles.overviewCard}>
              <Icon name="trending-up" size={32} color="#4CAF50" />
              <Text style={styles.overviewValue}>{selectedChildData.weeklyProgress}%</Text>
              <Text style={styles.overviewLabel}>Weekly Progress</Text>
            </View>

            <View style={styles.overviewCard}>
              <Icon name="schedule" size={32} color="#FF9800" />
              <Text style={styles.overviewValue}>{selectedChildData.todayMinutes}</Text>
              <Text style={styles.overviewLabel}>Minutes Today</Text>
            </View>

            <View style={styles.overviewCard}>
              <Icon name="star" size={32} color="#FFD700" />
              <Text style={styles.overviewValue}>
                {selectedChildData.recentAchievements.length}
              </Text>
              <Text style={styles.overviewLabel}>New Achievements</Text>
            </View>
          </View>

          {/* Learning Time Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Daily Learning Time (minutes)</Text>
            <LineChart
              data={progressData}
              width={width - 40}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Live Monitoring Toggle */}
          <View style={styles.monitoringContainer}>
            <View style={styles.monitoringHeader}>
              <Text style={styles.monitoringTitle}>Live Activity Monitoring</Text>
              <Switch
                value={liveMonitoring}
                onValueChange={setLiveMonitoring}
                thumbColor={liveMonitoring ? '#4A90E2' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
              />
            </View>

            {liveMonitoring && (
              <LiveActivityFeed childId={selectedChild} />
            )}
          </View>

          {/* Struggling Areas */}
          {selectedChildData.strugglingAreas.length > 0 && (
            <View style={styles.strugglingContainer}>
              <Text style={styles.sectionTitle}>Areas for Extra Support</Text>
              {selectedChildData.strugglingAreas.map((area, index) => (
                <View key={index} style={styles.strugglingItem}>
                  <Icon name="flag" size={20} color="#FF6B6B" />
                  <Text style={styles.strugglingText}>{area}</Text>
                  <TouchableOpacity style={styles.helpButton}>
                    <Text style={styles.helpButtonText}>Help</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Recent Achievements */}
          <View style={styles.achievementsContainer}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            {selectedChildData.recentAchievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Icon name="emoji-events" size={24} color="#FFD700" />
                <Text style={styles.achievementText}>{achievement}</Text>
                <TouchableOpacity
                  style={styles.celebrateButton}
                  onPress={() => Alert.alert('Celebrate!', 'Celebration message sent!')}
                >
                  <Icon name="celebration" size={16} color="#4A90E2" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEmergencyAlert}>
              <Icon name="favorite" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Send Encouragement</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={generateWeeklyReport}>
              <Icon name="assessment" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Weekly Report</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {showSettings && (
        <NotificationSettings
          visible={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 3,
    shadowColor: '#000',