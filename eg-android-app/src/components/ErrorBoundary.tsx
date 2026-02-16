import React, {Component, ReactNode} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Colors} from '../utils/Colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log to crash reporting service (if available)
    this.logErrorToCrashReporting(error, errorInfo);
  }

  logErrorToCrashReporting = (error: Error, errorInfo: any) => {
    try {
      // In a real app, this would integrate with services like:
      // - Crashlytics
      // - Sentry
      // - Bugsnag
      // - Custom logging service

      const errorReport = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        // Add device info, user context, etc.
        context: {
          platform: 'react-native',
          // Add user ID, session ID, etc. if available
        },
      };

      console.log('Error Report:', JSON.stringify(errorReport, null, 2));

      // TODO: Send to actual crash reporting service
      // Example: Crashlytics.recordError(error);
      // Example: Sentry.captureException(error, errorInfo);
    } catch (loggingError) {
      console.error('Failed to log error to crash reporting:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.title}>🚨 Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, we've been
              notified!
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>🔧 Debug Information</Text>
                {this.state.error && (
                  <>
                    <Text style={styles.debugLabel}>Error:</Text>
                    <Text style={styles.debugText}>
                      {this.state.error.message}
                    </Text>

                    <Text style={styles.debugLabel}>Stack Trace:</Text>
                    <Text style={styles.debugText}>
                      {this.state.error.stack}
                    </Text>
                  </>
                )}

                {this.state.errorInfo && (
                  <>
                    <Text style={styles.debugLabel}>Component Stack:</Text>
                    <Text style={styles.debugText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    maxWidth: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    marginTop: 20,
    maxHeight: 300,
    width: '100%',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.lighter,
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
  },
});
