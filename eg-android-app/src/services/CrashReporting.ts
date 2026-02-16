interface ErrorReport {
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    platform: string;
    userId?: string;
    sessionId?: string;
    currentScreen?: string;
    userAgent?: string;
    deviceInfo?: any;
    componentStack?: string;
  };
  breadcrumbs: Breadcrumb[];
  tags: Record<string, string>;
}

interface Breadcrumb {
  timestamp: string;
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, any>;
}

class CrashReportingService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private sessionId: string;
  private userId?: string;
  private currentScreen?: string;
  private tags: Record<string, string> = {};

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDeviceInfo();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeDeviceInfo() {
    try {
      // In a real implementation, you would collect device info
      // using libraries like react-native-device-info
      this.addTag('platform', 'react-native');
      this.addTag('sessionId', this.sessionId);
    } catch (error) {
      console.warn('Failed to initialize device info:', error);
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.addTag('userId', userId);
  }

  setCurrentScreen(screenName: string) {
    this.currentScreen = screenName;
    this.addBreadcrumb({
      message: `Navigated to ${screenName}`,
      category: 'navigation',
      level: 'info',
    });
  }

  addTag(key: string, value: string) {
    this.tags[key] = value;
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  recordError(error: Error, context?: Record<string, any>) {
    const errorReport: ErrorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        platform: 'react-native',
        userId: this.userId,
        sessionId: this.sessionId,
        currentScreen: this.currentScreen,
        ...context,
      },
      breadcrumbs: [...this.breadcrumbs],
      tags: {...this.tags},
    };

    this.sendErrorReport(errorReport);
  }

  recordReactError(error: Error, errorInfo: any) {
    const errorReport: ErrorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        platform: 'react-native',
        userId: this.userId,
        sessionId: this.sessionId,
        currentScreen: this.currentScreen,
        componentStack: errorInfo.componentStack,
      },
      breadcrumbs: [...this.breadcrumbs],
      tags: {...this.tags},
    };

    this.sendErrorReport(errorReport);
  }

  recordAPIError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error,
  ) {
    this.addBreadcrumb({
      message: `API Error: ${method} ${endpoint}`,
      category: 'api',
      level: 'error',
      data: {
        endpoint,
        method,
        statusCode,
        errorMessage: error.message,
      },
    });

    this.recordError(error, {
      endpoint,
      method,
      statusCode,
      category: 'api_error',
    });
  }

  private async sendErrorReport(report: ErrorReport) {
    try {
      console.error('🚨 Error Report:', JSON.stringify(report, null, 2));

      // In a production app, you would send this to a crash reporting service:

      // Example: Crashlytics
      // import crashlytics from '@react-native-firebase/crashlytics';
      // crashlytics().recordError(new Error(report.error.message));
      // crashlytics().setAttributes(report.tags);

      // Example: Sentry
      // import * as Sentry from '@sentry/react-native';
      // Sentry.captureException(new Error(report.error.message), {
      //   tags: report.tags,
      //   contexts: { report: report.context },
      //   breadcrumbs: report.breadcrumbs,
      // });

      // Example: Custom API endpoint
      // await fetch('https://your-error-reporting-api.com/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });

      // For now, we'll store locally for debugging
      await this.storeErrorLocally(report);
    } catch (sendError) {
      console.error('Failed to send error report:', sendError);
    }
  }

  private async storeErrorLocally(report: ErrorReport) {
    try {
      // In a real app, you might want to store errors locally
      // and retry sending them when network is available
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const key = `error_report_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(report));
    } catch (storageError) {
      console.error('Failed to store error locally:', storageError);
    }
  }

  // Helper methods for common error scenarios
  recordNetworkError(url: string, error: Error) {
    this.addBreadcrumb({
      message: `Network error: ${url}`,
      category: 'network',
      level: 'error',
      data: {url, errorMessage: error.message},
    });
    this.recordError(error, {category: 'network_error', url});
  }

  recordAuthError(action: string, error: Error) {
    this.addBreadcrumb({
      message: `Auth error: ${action}`,
      category: 'auth',
      level: 'error',
      data: {action, errorMessage: error.message},
    });
    this.recordError(error, {category: 'auth_error', action});
  }

  recordVoiceError(action: string, error: Error) {
    this.addBreadcrumb({
      message: `Voice error: ${action}`,
      category: 'voice',
      level: 'error',
      data: {action, errorMessage: error.message},
    });
    this.recordError(error, {category: 'voice_error', action});
  }

  // Development helpers
  async getStoredErrors(): Promise<ErrorReport[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter((key: string) =>
        key.startsWith('error_report_'),
      );

      const errorReports = await AsyncStorage.multiGet(errorKeys);
      return errorReports
        .map(([_key, value]: [string, string | null]) => {
          try {
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ErrorReport[];
    } catch (error) {
      console.error('Failed to get stored errors:', error);
      return [];
    }
  }

  async clearStoredErrors() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter((key: string) =>
        key.startsWith('error_report_'),
      );
      await AsyncStorage.multiRemove(errorKeys);
    } catch (error) {
      console.error('Failed to clear stored errors:', error);
    }
  }
}

export const crashReporting = new CrashReportingService();
export type {ErrorReport, Breadcrumb};
