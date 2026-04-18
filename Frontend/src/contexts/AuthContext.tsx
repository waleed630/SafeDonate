import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User, UserRole } from '../types';
import api from '../api/axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (payload: { email: string; password: string; username?: string; role?: UserRole }) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateUser: (user: User | any) => void;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('safedonate_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Proactive token refresh - refresh 5 minutes before expiration
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        // Try to refresh proactively
        const response = await fetch(`${window.location.origin}/api/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include', // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Update user data
            const updatedUser = {
              id: data.user.userId || data.user.id || data.user._id,
              email: data.user.email,
              name: data.user.username || data.user.name || '',
              role: data.user.role,
              avatar: data.user.profilePicture || undefined,
            };
            setUser(updatedUser);
            localStorage.setItem('safedonate_user', JSON.stringify(updatedUser));
          }
        }
      } catch (error) {
        // Silent fail - automatic refresh will handle it when needed
        console.debug('Proactive token refresh failed:', error);
      }
    }, 10 * 60 * 1000); // Check every 10 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = useCallback(async (email: string, password: string, role?: UserRole) => {
    try {
      const payload: any = { email, password };
      
      // Include role if provided (for role validation)
      if (role) {
        payload.role = role;
      }

      const res = await api.post('/auth/login', payload);
      const data = res.data;
      if (!data || !data.user) throw new Error(data?.message || 'Login failed');

      // Map backend user -> frontend User
      const u: User = {
        id: data.user.userId || data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.username || data.user.name || '',
        role: data.user.role,
        avatar: data.user.profilePicture || undefined,
      };

      setUser(u);
      localStorage.setItem('safedonate_user', JSON.stringify(u));
      // Tokens are automatically sent via HttpOnly cookies
    } catch (err: any) {
      console.error('[Auth] Login error:', {
        message: err?.message,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
      });
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: { email: string; password: string; username?: string; role?: UserRole }) => {
    try {
      const url = (api.defaults.baseURL || '') + '/auth/register';
      console.debug('[Auth] POST', url, payload);
      // Send allowed fields + role so backend stores correct role
      const body = {
        email: payload.email,
        password: payload.password,
        username: payload.username,
        role: payload.role,
      };
      const res = await api.post('/auth/register', body);
      const data = res.data;
      if (!data || !data.user) throw new Error(data?.message || 'Registration failed');

      const u: User = {
        id: data.user.userId || data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.username || data.user.name || '',
        role: data.user.role,
        avatar: data.user.profilePicture || undefined,
      };

      setUser(u);
      localStorage.setItem('safedonate_user', JSON.stringify(u));
      // Tokens are automatically sent via HttpOnly cookies
      return;
    } catch (err: any) {
      console.error('[Auth] register error', {
        baseURL: api.defaults.baseURL,
        url: '/auth/register',
        message: err?.message,
        status: err?.response?.status,
        body: err?.response?.data,
      });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('safedonate_user');
    setIsSessionExpired(false);
    // Cookies are cleared by the backend logout endpoint
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  const updateUser = useCallback((updatedUser: User | any) => {
    const u: User = {
      id: updatedUser.userId || updatedUser.id || updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.username || updatedUser.name || '',
      role: updatedUser.role,
      avatar: updatedUser.profilePicture || updatedUser.avatar || undefined,
    };
    setUser(u);
    localStorage.setItem('safedonate_user', JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSessionExpired,
        login,
        logout,
        setUser,
        updateUser,
        dismissSessionExpired,
        // @ts-ignore extension — register is provided for signup flows
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
