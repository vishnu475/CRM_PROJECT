import React from 'react';
import { AppProvider } from '../context/AppContext';
import { AuthProvider } from '../context/AuthContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AppProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AppProvider>
  );
};
