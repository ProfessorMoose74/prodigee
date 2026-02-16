import React, {lazy, Suspense} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {Colors} from './Colors';

// Loading component for lazy-loaded screens
const LoadingScreen: React.FC<{message?: string}> = ({
  message = 'Loading...',
}) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Error boundary for lazy-loaded components
class LazyLoadErrorBoundary extends React.Component<
  {children: React.ReactNode; fallback?: React.ReactNode},
  {hasError: boolean}
> {
  constructor(props: any) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load component</Text>
            <Text style={styles.errorSubtext}>
              Please try restarting the app
            </Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

// HOC for creating lazy-loaded components with proper error handling
export const createLazyComponent = <T extends object>(
  importFn: () => Promise<{default: React.ComponentType<T>}>,
  loadingMessage?: string,
) => {
  const LazyComponent = lazy(importFn);

  return React.forwardRef<any, T>((props, ref) => (
    <LazyLoadErrorBoundary>
      <Suspense fallback={<LoadingScreen message={loadingMessage} />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyLoadErrorBoundary>
  ));
};

// Lazy-loaded screen components
export const LazyDashboardScreen = createLazyComponent(
  () => import('../screens/DashboardScreen'),
  'Loading Dashboard...',
);

export const LazyActivityScreen = createLazyComponent(
  () => import('../screens/ActivityScreen'),
  'Loading Activity...',
);

export const LazyParentDashboardScreen = createLazyComponent(
  () => import('../screens/ParentDashboardScreen'),
  'Loading Parent Dashboard...',
);

export const LazyAvatarCustomizationScreen = createLazyComponent(
  () => import('../screens/AvatarCustomizationScreen'),
  'Loading Avatar Customization...',
);

export const LazyAccessibilitySettingsScreen = createLazyComponent(
  () => import('../screens/AccessibilitySettingsScreen'),
  'Loading Accessibility Settings...',
);

export const LazyVoiceActivityScreen = createLazyComponent(
  () => import('../screens/VoiceActivityScreen'),
  'Loading Voice Activity...',
);

// Lazy-loaded heavy components
export const LazyAnimatedAvatar = createLazyComponent(
  () => import('../components/AnimatedAvatar'),
  'Loading Avatar...',
);

export const LazyEnhancedAvatarPreview = createLazyComponent(
  () => import('../components/EnhancedAvatarPreview'),
  'Loading Avatar Preview...',
);

export const LazyDebugPanel = createLazyComponent(
  () => import('../components/DebugPanel'),
  'Loading Debug Panel...',
);

// Preload important components during idle time
export const preloadComponents = () => {
  // React Native doesn't have window or requestIdleCallback
  // Use setTimeout as fallback
  setTimeout(() => {
    // Preload dashboard components
    import('../screens/DashboardScreen');
    import('../screens/ActivityScreen');
    import('../components/AnimatedAvatar');
  }, 2000);
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
