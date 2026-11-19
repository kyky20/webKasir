import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Store } from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  store: Store | null;
  token: string | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isOwner: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kasirku_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [store, setStore] = useState<Store | null>(() => {
    const saved = localStorage.getItem('kasirku_store');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('kasirku_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('kasirku_token');
      if (storedToken) {
        try {
          const data = await authService.me();
          setUser(data.user);
          setStore(data.store);
          localStorage.setItem('kasirku_user', JSON.stringify(data.user));
          localStorage.setItem('kasirku_store', JSON.stringify(data.store));
        } catch {
          setUser(null);
          setStore(null);
          setToken(null);
          localStorage.removeItem('kasirku_token');
          localStorage.removeItem('kasirku_user');
          localStorage.removeItem('kasirku_store');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (loginInput: string, passwordInput: string): Promise<User> => {
    const data = await authService.login(loginInput, passwordInput);
    setUser(data.user);
    setStore(data.store);
    setToken(data.token);
    localStorage.setItem('kasirku_token', data.token);
    localStorage.setItem('kasirku_user', JSON.stringify(data.user));
    localStorage.setItem('kasirku_store', JSON.stringify(data.store));
    return data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStore(null);
      setToken(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const data = await authService.me();
      setUser(data.user);
      setStore(data.store);
      localStorage.setItem('kasirku_user', JSON.stringify(data.user));
      localStorage.setItem('kasirku_store', JSON.stringify(data.store));
    } catch {
      // Ignored
    }
  };

  const isOwner = user?.role === 'owner';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        token,
        isLoading,
        login,
        logout,
        refreshAuth,
        isOwner,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
