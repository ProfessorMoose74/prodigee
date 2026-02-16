import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {api, ParentLoginResponse, ChildLoginResponse} from '../services/api';
import {socketService} from '../services/socket';

interface User {
  id: number;
  name: string;
  email?: string;
  age?: number;
  type: 'parent' | 'child';
  subscription_tier?: string;
  current_week?: number;
  avatar?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
    loginType?: string,
    childId?: number,
  ) => Promise<void>;
  childLogin: (childId: number, parentToken: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

type AuthAction =
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_AUTHENTICATED'; payload: {user: User; token: string}}
  | {type: 'SET_ERROR'; payload: string}
  | {type: 'LOGOUT'}
  | {type: 'CLEAR_ERROR'};

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {...state, isLoading: action.payload};
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthState = useCallback(async () => {
    try {
      dispatch({type: 'SET_LOADING', payload: true});

      const token = await AsyncStorage.getItem('auth_token');
      const userType = await AsyncStorage.getItem('user_type');
      const userId = await AsyncStorage.getItem(
        userType === 'parent' ? 'parent_id' : 'child_id',
      );

      if (token && userType && userId) {
        // Verify token is still valid by making a test request
        try {
          const response =
            userType === 'child'
              ? await api.getChildDashboard()
              : await api.getAnalyticsDashboard();

          if (response) {
            const user: User = {
              id: parseInt(userId, 10),
              name:
                userType === 'child'
                  ? response.child?.name || 'Child'
                  : 'Parent',
              type: userType as 'parent' | 'child',
              email: userType === 'parent' ? response.parent?.email : undefined,
              age: userType === 'child' ? response.child?.age : undefined,
              current_week:
                userType === 'child' ? response.child?.current_week : undefined,
              avatar: userType === 'child' ? response.child?.avatar : undefined,
            };

            dispatch({type: 'SET_AUTHENTICATED', payload: {user, token}});

            // Connect socket if authenticated
            await socketService.connect();
            if (userType === 'parent') {
              await socketService.joinParentRoom();
            }
          }
        } catch (error) {
          // Token is invalid, clear storage
          await clearStoredAuth();
          dispatch({type: 'LOGOUT'});
        }
      } else {
        dispatch({type: 'SET_LOADING', payload: false});
      }
    } catch (error) {
      console.error('Auth check error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to check authentication state',
      });
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const clearStoredAuth = async () => {
    await AsyncStorage.multiRemove([
      'auth_token',
      'user_type',
      'parent_id',
      'child_id',
    ]);
  };

  const login = async (
    email: string,
    password: string,
    loginType?: string,
    childId?: number,
  ) => {
    try {
      dispatch({type: 'SET_LOADING', payload: true});

      if (loginType === 'child' && childId) {
        // For child login, we need parent token first
        const parentResponse = await api.parentLogin(email, password);
        if (parentResponse.success) {
          const childResponse = await api.childLogin(
            childId,
            parentResponse.token,
          );
          if (childResponse.success) {
            const user: User = {
              id: childResponse.child.id,
              name: childResponse.child.name,
              type: 'child',
              age: childResponse.child.age,
              current_week: childResponse.child.current_week,
              avatar: childResponse.child.avatar,
            };
            dispatch({
              type: 'SET_AUTHENTICATED',
              payload: {user, token: childResponse.token},
            });
            await socketService.connect();
          }
        }
        return;
      }

      const response: ParentLoginResponse = await api.parentLogin(
        email,
        password,
      );

      if (response.success) {
        const user: User = {
          id: response.parent.id,
          name: response.parent.name,
          email: response.parent.email,
          type: 'parent',
          subscription_tier: response.parent.subscription_tier,
        };

        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: {user, token: response.token},
        });

        // Connect socket and join parent room
        await socketService.connect();
        await socketService.joinParentRoom();
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload:
          error.response?.data?.message ||
          'Login failed. Please check your credentials.',
      });
    }
  };

  const childLogin = async (childId: number, parentToken: string) => {
    try {
      dispatch({type: 'SET_LOADING', payload: true});

      const response: ChildLoginResponse = await api.childLogin(
        childId,
        parentToken,
      );

      if (response.success) {
        const user: User = {
          id: response.child.id,
          name: response.child.name,
          type: 'child',
          age: response.child.age,
          current_week: response.child.current_week,
          avatar: response.child.avatar,
        };

        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: {user, token: response.token},
        });

        // Connect socket for child
        await socketService.connect();
      } else {
        throw new Error('Child login failed');
      }
    } catch (error: any) {
      console.error('Child login error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Child login failed.',
      });
    }
  };

  const logout = async () => {
    try {
      dispatch({type: 'SET_LOADING', payload: true});

      // Disconnect socket first
      socketService.disconnect();

      // Call logout API
      await api.logout();

      // Clear local storage
      await clearStoredAuth();

      dispatch({type: 'LOGOUT'});
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      await clearStoredAuth();
      socketService.disconnect();
      dispatch({type: 'LOGOUT'});
    }
  };

  const clearError = () => {
    dispatch({type: 'CLEAR_ERROR'});
  };

  const refreshAuth = async () => {
    await checkAuthState();
  };

  const value: AuthContextType = {
    ...state,
    login,
    childLogin,
    logout,
    clearError,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
