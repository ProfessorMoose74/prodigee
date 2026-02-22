"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { auth as authApi, type ParentUser, type ChildUser, type AuthResponse, type ChildAuthResponse } from "./api";

interface AuthState {
  // Parent auth
  parentToken: string | null;
  parentUser: ParentUser | null;
  // Child auth
  childToken: string | null;
  childUser: ChildUser | null;
  sessionLimitMinutes: number | null;
  // State
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  loginParent: (email: string, password: string) => Promise<void>;
  registerParent: (email: string, password: string, displayName: string) => Promise<void>;
  loginChild: (childId: string) => Promise<void>;
  logoutChild: () => void;
  logout: () => Promise<void>;
  addChild: (data: { display_name: string; age: number; grade_level?: string; avatar?: string }) => Promise<ChildUser>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const PARENT_TOKEN_KEY = "prodigee_parent_token";
const PARENT_USER_KEY = "prodigee_parent_user";
const CHILD_TOKEN_KEY = "prodigee_child_token";
const CHILD_USER_KEY = "prodigee_child_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    parentToken: null,
    parentUser: null,
    childToken: null,
    childUser: null,
    sessionLimitMinutes: null,
    isLoading: true,
  });

  // Restore from localStorage on mount
  useEffect(() => {
    const parentToken = localStorage.getItem(PARENT_TOKEN_KEY);
    const parentUser = localStorage.getItem(PARENT_USER_KEY);
    const childToken = localStorage.getItem(CHILD_TOKEN_KEY);
    const childUser = localStorage.getItem(CHILD_USER_KEY);

    setState({
      parentToken,
      parentUser: parentUser ? JSON.parse(parentUser) : null,
      childToken,
      childUser: childUser ? JSON.parse(childUser) : null,
      sessionLimitMinutes: null,
      isLoading: false,
    });
  }, []);

  const setParentAuth = useCallback((data: AuthResponse) => {
    localStorage.setItem(PARENT_TOKEN_KEY, data.token);
    localStorage.setItem(PARENT_USER_KEY, JSON.stringify(data.user));
    setState((s) => ({
      ...s,
      parentToken: data.token,
      parentUser: data.user,
    }));
  }, []);

  const loginParent = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setParentAuth(data);
  }, [setParentAuth]);

  const registerParent = useCallback(async (email: string, password: string, displayName: string) => {
    const data = await authApi.register(email, password, displayName);
    setParentAuth(data);
  }, [setParentAuth]);

  const loginChild = useCallback(async (childId: string) => {
    if (!state.parentToken) throw new Error("Parent must be logged in first");
    const data: ChildAuthResponse = await authApi.childLogin(state.parentToken, childId);

    localStorage.setItem(CHILD_TOKEN_KEY, data.token);
    localStorage.setItem(CHILD_USER_KEY, JSON.stringify(data.user));

    setState((s) => ({
      ...s,
      childToken: data.token,
      childUser: data.user,
      sessionLimitMinutes: data.session_limit_minutes,
    }));
  }, [state.parentToken]);

  const logoutChild = useCallback(() => {
    localStorage.removeItem(CHILD_TOKEN_KEY);
    localStorage.removeItem(CHILD_USER_KEY);
    setState((s) => ({
      ...s,
      childToken: null,
      childUser: null,
      sessionLimitMinutes: null,
    }));
  }, []);

  const logout = useCallback(async () => {
    if (state.parentToken) {
      try {
        await authApi.logout(state.parentToken);
      } catch {
        // Ignore — token may already be expired
      }
    }
    localStorage.removeItem(PARENT_TOKEN_KEY);
    localStorage.removeItem(PARENT_USER_KEY);
    localStorage.removeItem(CHILD_TOKEN_KEY);
    localStorage.removeItem(CHILD_USER_KEY);
    setState({
      parentToken: null,
      parentUser: null,
      childToken: null,
      childUser: null,
      sessionLimitMinutes: null,
      isLoading: false,
    });
  }, [state.parentToken]);

  const addChild = useCallback(async (data: { display_name: string; age: number; grade_level?: string; avatar?: string }) => {
    if (!state.parentToken) throw new Error("Parent must be logged in");
    const child = await authApi.addChild(state.parentToken, data);

    // Update parent's children list locally
    if (state.parentUser) {
      const updated = { ...state.parentUser, children: [...state.parentUser.children, child.id] };
      localStorage.setItem(PARENT_USER_KEY, JSON.stringify(updated));
      setState((s) => ({ ...s, parentUser: updated }));
    }

    return child;
  }, [state.parentToken, state.parentUser]);

  return (
    <AuthContext.Provider value={{
      ...state,
      loginParent,
      registerParent,
      loginChild,
      logoutChild,
      logout,
      addChild,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
