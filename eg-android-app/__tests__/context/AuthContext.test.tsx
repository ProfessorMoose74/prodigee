import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import {AuthProvider, useAuth} from '../../src/context/AuthContext';
import {Text, TouchableOpacity} from 'react-native';

// Mock the API module
jest.mock('../../src/services/api', () => ({
  api: {
    parentLogin: jest.fn(),
    childLogin: jest.fn(),
    logout: jest.fn(),
    getChildDashboard: jest.fn(),
    getAnalyticsDashboard: jest.fn(),
  },
}));

// Mock socket service
jest.mock('../../src/services/socket', () => ({
  socketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinParentRoom: jest.fn(),
  },
}));

// Test component that uses auth context
const TestComponent: React.FC = () => {
  const {isAuthenticated, isLoading, user, login, logout, error} = useAuth();

  return (
    <>
      <Text testID="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </Text>
      <Text testID="loading-status">
        {isLoading ? 'loading' : 'not-loading'}
      </Text>
      <Text testID="user-info">
        {user ? `${user.name} (${user.type})` : 'no-user'}
      </Text>
      <Text testID="error-message">{error || 'no-error'}</Text>
      <TouchableOpacity
        testID="login-button"
        onPress={() => login('test@example.com', 'password')}>
        <Text>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout-button" onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial auth state', async () => {
    const {getByTestId} = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Wait for async auth check to complete
    await waitFor(() => {
      expect(getByTestId('loading-status')).toHaveTextContent('not-loading');
    });

    expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(getByTestId('user-info')).toHaveTextContent('no-user');
    expect(getByTestId('error-message')).toHaveTextContent('no-error');
  });

  it('handles successful parent login', async () => {
    const mockApi = require('../../src/services/api').api;
    mockApi.parentLogin.mockResolvedValue({
      success: true,
      parent: {
        id: 1,
        name: 'Test Parent',
        email: 'test@example.com',
        subscription_tier: 'premium',
      },
      token: 'mock-token',
    });

    const {getByTestId} = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = getByTestId('login-button');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(getByTestId('user-info')).toHaveTextContent(
        'Test Parent (parent)',
      );
    });

    expect(mockApi.parentLogin).toHaveBeenCalledWith(
      'test@example.com',
      'password',
    );
  });

  it('handles failed login', async () => {
    const mockApi = require('../../src/services/api').api;
    mockApi.parentLogin.mockRejectedValue(new Error('Invalid credentials'));

    const {getByTestId} = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = getByTestId('login-button');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(getByTestId('error-message')).toHaveTextContent(
        'Login failed. Please check your credentials.',
      );
    });
  });

  it('handles logout', async () => {
    const mockApi = require('../../src/services/api').api;
    const mockSocket = require('../../src/services/socket').socketService;

    // First login
    mockApi.parentLogin.mockResolvedValue({
      success: true,
      parent: {
        id: 1,
        name: 'Test Parent',
        email: 'test@example.com',
        subscription_tier: 'premium',
      },
      token: 'mock-token',
    });

    mockApi.logout.mockResolvedValue({});

    const {getByTestId} = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Login first
    const loginButton = getByTestId('login-button');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Then logout
    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(getByTestId('user-info')).toHaveTextContent('no-user');
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });
});
