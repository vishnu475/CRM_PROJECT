import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { RoleDashboardContainer } from './components/dashboard/RoleDashboardContainer';
import { ModuleViews } from './components/modules/ModuleViews';
import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/auth/LandingPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { useState } from 'react';

const MainLayout: React.FC = () => {
  const { activeModule } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8faff] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 25-module Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Search, Role Switcher & Controls */}
        <Header />

        {/* View Surface */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {activeModule === 'dashboard' ? (
            <RoleDashboardContainer />
          ) : (
            <ModuleViews />
          )}
        </main>
      </div>
    </div>
  );
};

const AuthWrapper: React.FC = () => {
  const { isAuthenticated } = useApp();
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register'>('landing');
  
  if (!isAuthenticated) {
    if (currentView === 'landing') {
      return <LandingPage onNavigate={setCurrentView} />;
    }
    if (currentView === 'register') {
      return <RegisterPage onNavigate={setCurrentView} />;
    }
    return <LoginPage onNavigate={setCurrentView} />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AuthWrapper />
    </AppProvider>
  );
}
