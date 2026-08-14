import React, { createContext, useContext, useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (role?: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>({
    id: 'usr-1',
    name: 'John Doe',
    email: 'admin@company.com',
    role: 'Executive',
    roleTitle: 'Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    company: 'Acme Corp',
    branch: 'Headquarters (HQ)'
  });

  const login = (role: UserRole = 'Executive') => {
    setIsAuthenticated(true);
    setUser(prev => prev ? { ...prev, role } : null);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
