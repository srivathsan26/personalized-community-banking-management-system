import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types';
import { initializeSystemData } from '@/services/localDB';
import { AUTH_STORAGE_KEY, fetchCurrentUser, loginRequest, logoutRequest } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PROFILE_REFRESH_INTERVAL_MS = 15000;
export const AUTH_REFRESH_EVENT = 'auth:refresh-current-user';

function persistAuthState(state: AuthState) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

function clearPersistedAuthState() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function readPersistedAuthState(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthState;
    if (!parsed?.token || !parsed?.user) {
      return null;
    }

    return {
      isAuthenticated: true,
      token: parsed.token,
      user: parsed.user,
    };
  } catch (error) {
    console.error('Failed to read auth state from storage:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from storage on mount
  useEffect(() => {
    async function bootstrap() {
      try {
        await initializeSystemData();

        const persistedAuthState = readPersistedAuthState();
        if (!persistedAuthState) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            token: null,
          });
          return;
        }

        try {
          const currentUser = await fetchCurrentUser(persistedAuthState.token);
          const nextState = {
            ...persistedAuthState,
            user: currentUser,
          };
          setAuthState(nextState);
          persistAuthState(nextState);
        } catch (error) {
          console.error('Persisted session refresh failed:', error);
          clearPersistedAuthState();
          setAuthState({
            user: null,
            isAuthenticated: false,
            token: null,
          });
        }
      } catch (error) {
        console.error('Auth bootstrap failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.token) {
      return;
    }

    let cancelled = false;

    async function syncCurrentUser() {
      try {
        const currentUser = await fetchCurrentUser(authState.token as string);
        if (cancelled) {
          return;
        }

        setAuthState((prev) => {
          if (!prev.isAuthenticated || !prev.token) {
            return prev;
          }

          const nextState = {
            ...prev,
            user: currentUser,
          };
          persistAuthState(nextState);
          return nextState;
        });
      } catch (error) {
        console.error('Current user refresh failed:', error);
        clearPersistedAuthState();
        setAuthState({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      }
    }

    void syncCurrentUser();
    const intervalId = window.setInterval(() => {
      void syncCurrentUser();
    }, PROFILE_REFRESH_INTERVAL_MS);
    const handleFocus = () => {
      void syncCurrentUser();
    };
    const handleManualRefresh = () => {
      void syncCurrentUser();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener(AUTH_REFRESH_EVENT, handleManualRefresh);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener(AUTH_REFRESH_EVENT, handleManualRefresh);
    };
  }, [authState.isAuthenticated, authState.token]);

  /**
   * Login function with RBAC support
   * Returns the user object on success for role-based routing
   */
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await loginRequest(username.trim(), password);
      const newState: AuthState = {
        user: response.user,
        isAuthenticated: true,
        token: response.token,
      };

      setAuthState(newState);
      persistAuthState(newState);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed.',
      };
    }
  };
  const logout = () => {
    void logoutRequest(authState.token).catch((error) => {
      console.error('Logout request failed:', error);
    });
    setAuthState({
      user: null,
      isAuthenticated: false,
      token: null,
    });
    clearPersistedAuthState();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
