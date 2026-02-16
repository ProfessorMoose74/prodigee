import {api} from '../services/api';
import {socketService} from '../services/socket';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export interface FullConnectionTest {
  api: ConnectionTestResult;
  socket: ConnectionTestResult;
  overall: ConnectionTestResult;
}

export class ConnectionTester {
  private static instance: ConnectionTester;

  static getInstance(): ConnectionTester {
    if (!ConnectionTester.instance) {
      ConnectionTester.instance = new ConnectionTester();
    }
    return ConnectionTester.instance;
  }

  async testAPIConnection(): Promise<ConnectionTestResult> {
    const timestamp = new Date().toISOString();

    try {
      console.log('Testing API connection...');

      // Test basic connectivity
      await api.healthCheck();

      return {
        success: true,
        message: 'API connection successful',
        details: {
          baseURL: __DEV__
            ? 'http://localhost:5000'
            : 'https://api.elementalgenius.com',
          environment: __DEV__ ? 'development' : 'production',
        },
        timestamp,
      };
    } catch (error: any) {
      console.error('API connection test failed:', error);

      return {
        success: false,
        message: 'API connection failed',
        details: {
          error: error.message,
          code: error.code,
          response: error.response?.status,
        },
        timestamp,
      };
    }
  }

  async testSocketConnection(): Promise<ConnectionTestResult> {
    const timestamp = new Date().toISOString();

    return new Promise(resolve => {
      try {
        console.log('Testing Socket.IO connection...');

        // Set up timeout
        const timeout = setTimeout(() => {
          resolve({
            success: false,
            message: 'Socket connection timeout',
            details: {
              timeout: '10 seconds',
              baseURL: __DEV__
                ? 'http://localhost:5000'
                : 'https://api.elementalgenius.com',
            },
            timestamp,
          });
        }, 10000);

        // Set up success handler
        const cleanup = socketService.onConnectionError(error => {
          clearTimeout(timeout);
          cleanup();

          resolve({
            success: false,
            message: 'Socket connection failed',
            details: {
              error: error.message || error,
              baseURL: __DEV__
                ? 'http://localhost:5000'
                : 'https://api.elementalgenius.com',
            },
            timestamp,
          });
        });

        // Set up success handler
        const onConnected = () => {
          clearTimeout(timeout);
          cleanup();
          socketService.off('connected', onConnected);

          resolve({
            success: true,
            message: 'Socket connection successful',
            details: {
              connected: true,
              baseURL: __DEV__
                ? 'http://localhost:5000'
                : 'https://api.elementalgenius.com',
            },
            timestamp,
          });
        };

        socketService.on('connected', onConnected);

        // Attempt connection
        socketService.connect();
      } catch (error: any) {
        console.error('Socket connection test failed:', error);

        resolve({
          success: false,
          message: 'Socket connection failed',
          details: {
            error: error.message,
            baseURL: __DEV__
              ? 'http://localhost:5000'
              : 'https://api.elementalgenius.com',
          },
          timestamp,
        });
      }
    });
  }

  async testAuthentication(
    email: string = 'demo@elementalgenius.com',
    password: string = 'demo123',
  ): Promise<ConnectionTestResult> {
    const timestamp = new Date().toISOString();

    try {
      console.log('Testing authentication...');

      const response = await api.parentLogin(email, password);

      if (response.success) {
        // Test authenticated endpoint
        const dashboard = await api.getAnalyticsDashboard();

        return {
          success: true,
          message: 'Authentication test successful',
          details: {
            parentId: response.parent.id,
            parentName: response.parent.name,
            subscriptionTier: response.parent.subscription_tier,
            tokenReceived: !!response.token,
            dashboardData: !!dashboard,
          },
          timestamp,
        };
      } else {
        return {
          success: false,
          message: 'Authentication failed - invalid credentials',
          details: {
            response: response,
          },
          timestamp,
        };
      }
    } catch (error: any) {
      console.error('Authentication test failed:', error);

      return {
        success: false,
        message: 'Authentication test failed',
        details: {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
        timestamp,
      };
    }
  }

  async runFullConnectionTest(): Promise<FullConnectionTest> {
    console.log('Running full connection test...');

    const apiTest = await this.testAPIConnection();
    const socketTest = await this.testSocketConnection();

    const overallSuccess = apiTest.success && socketTest.success;
    const overall: ConnectionTestResult = {
      success: overallSuccess,
      message: overallSuccess
        ? 'All connection tests passed'
        : 'Some connection tests failed',
      details: {
        apiPassed: apiTest.success,
        socketPassed: socketTest.success,
        failedTests: [
          !apiTest.success ? 'API' : null,
          !socketTest.success ? 'Socket' : null,
        ].filter(Boolean),
      },
      timestamp: new Date().toISOString(),
    };

    const result: FullConnectionTest = {
      api: apiTest,
      socket: socketTest,
      overall,
    };

    console.log('Connection test results:', result);
    return result;
  }

  async runDemoAuthentication(): Promise<ConnectionTestResult> {
    console.log('Testing demo authentication...');
    return await this.testAuthentication();
  }

  // Helper method to test specific endpoints
  async testEndpoint(endpoint: string): Promise<ConnectionTestResult> {
    const timestamp = new Date().toISOString();

    try {
      console.log(`Testing endpoint: ${endpoint}`);

      // This is a generic test - specific endpoint tests would need their own methods
      const response = await fetch(
        `${
          __DEV__ ? 'http://localhost:5000' : 'https://api.elementalgenius.com'
        }${endpoint}`,
      );

      return {
        success: response.ok,
        message: response.ok
          ? `Endpoint ${endpoint} is accessible`
          : `Endpoint ${endpoint} failed`,
        details: {
          status: response.status,
          statusText: response.statusText,
          endpoint: endpoint,
        },
        timestamp,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Endpoint ${endpoint} test failed`,
        details: {
          error: error.message,
          endpoint: endpoint,
        },
        timestamp,
      };
    }
  }

  // Generate a connection test report
  formatTestReport(results: FullConnectionTest): string {
    const {api: apiResult, socket: socketResult, overall} = results;

    return `
=== Elemental Genius Mobile App Connection Test Report ===

Overall Status: ${overall.success ? '✅ PASS' : '❌ FAIL'}
Test Time: ${overall.timestamp}

API Connection: ${apiResult.success ? '✅ PASS' : '❌ FAIL'}
- Message: ${apiResult.message}
- Details: ${JSON.stringify(apiResult.details, null, 2)}

Socket Connection: ${socketResult.success ? '✅ PASS' : '❌ FAIL'}
- Message: ${socketResult.message}
- Details: ${JSON.stringify(socketResult.details, null, 2)}

${
  !overall.success
    ? `
Failed Tests: ${overall.details.failedTests.join(', ')}

Troubleshooting:
- Ensure backend server is running on ${
        __DEV__ ? 'localhost:5000' : 'production server'
      }
- Check network connectivity
- Verify API endpoints are accessible
- Confirm Socket.IO server is running
`
    : `
All systems operational! 🎉
Mobile app is ready to connect to the backend.
`
}
========================================================
    `;
  }
}

// Export singleton instance
export const connectionTester = ConnectionTester.getInstance();
