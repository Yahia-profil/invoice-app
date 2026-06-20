import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  currentUser: { email: string; id: string; nom: string } | null;
  userRole: 'admin' | 'user' | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nom: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string; nom: string } | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setCurrentUser(data.user);
    setUserRole(data.user.role);
  };

  const register = async (email: string, password: string, nom: string) => {
    const data = await authApi.register(email, password, nom);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setCurrentUser(data.user);
    setUserRole(data.user.role);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserRole(null);
  };

  const isAdmin = useCallback(() => userRole === 'admin', [userRole]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const user = await authApi.me();
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        setUserRole(user.role);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const value = { currentUser, userRole, login, register, logout, loading, isAdmin };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
