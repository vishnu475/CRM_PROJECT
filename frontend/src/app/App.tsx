import React, { useState } from 'react';
import { AppProviders } from './providers';
import { useApp } from '../context/AppContext';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { RoleDashboardContainer } from '../components/dashboard/RoleDashboardContainer';
import { ModuleViews } from '../components/modules/ModuleViews';
import { LoginPage } from '../components/auth/LoginPage';
import { LandingPage } from '../components/auth/LandingPage';
import { RegisterPage } from '../components/auth/RegisterPage';

const MainLayout: React.FC = () => {
  const { activeModule } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8faff] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Sidebar */}
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
  const [path, setPath] = useState(() => window.location.pathname.toLowerCase());

  React.useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isExplicitAuthPath = path === '/landing' || path === '/login' || path === '/register';

  if (!isAuthenticated || isExplicitAuthPath) {
    let view = currentView;
    if (path === '/login') view = 'login';
    else if (path === '/register') view = 'register';
    else if (path === '/landing') view = 'landing';

    const handleNavigate = (v: 'landing' | 'login' | 'register') => {
      setCurrentView(v);
      const targetPath = v === 'landing' ? '/landing' : v === 'login' ? '/login' : '/register';
      window.history.pushState({}, '', targetPath);
      setPath(targetPath);
    };

    if (view === 'landing') {
      return <LandingPage onNavigate={handleNavigate} />;
    }
    if (view === 'register') {
      return <RegisterPage onNavigate={handleNavigate} />;
    }
    return <LoginPage onNavigate={handleNavigate} />;
  }

  return <MainLayout />;
};


export default function App() {
  return (
    <AppProviders>
      <AuthWrapper />
    </AppProviders>
  );
}
