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
import { CareersPage } from '../components/auth/CareersPage';
import { ESSPage } from '../modules/ess/pages/ESSPage';

const MainLayout: React.FC = () => {
  const { activeModule, userRole } = useApp();

  const path = window.location.pathname.toLowerCase();
  const isEssPath = (path === '/employee' || path.startsWith('/employee/')) &&
    !path.startsWith('/employee/emp-') &&
    !/^\/employee\/\d+$/.test(path);

  // STRICT EMPLOYEE ROUTE: Only open ESSPage when logged in as Employee or on an ESS route with Employee role
  const isEmployeeMode = 
    userRole === 'Employee' ||
    (isEssPath && localStorage.getItem('crm_user_role') === 'Employee') ||
    path === '/portal' || path.startsWith('/portal/');
  
  if (isEmployeeMode) {
    return <ESSPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8faff] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Search, Role Switcher & Controls */}
        <Header />

        {/* View Surface */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
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
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'careers'>('landing');
  const [path, setPath] = useState(() => window.location.pathname.toLowerCase());

  React.useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (v: 'landing' | 'login' | 'register' | 'careers') => {
    setCurrentView(v);
    const targetPath = v === 'landing' ? '/' : v === 'login' ? '/login' : v === 'register' ? '/register' : '/careers';
    window.history.pushState({}, '', targetPath);
    setPath(targetPath);
  };

  const normalizedPath = (path.endsWith('/') && path.length > 1) ? path.slice(0, -1) : path;

  // 1. Root & Public Marketing Pages (Landing / Home Page)
  if (normalizedPath === '/' || normalizedPath === '' || normalizedPath === '/landing' || normalizedPath === '/home') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (normalizedPath === '/login' || normalizedPath === '/signin') {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (normalizedPath === '/register' || normalizedPath === '/signup') {
    return <RegisterPage onNavigate={handleNavigate} />;
  }

  if (normalizedPath === '/careers') {
    return <CareersPage onNavigate={handleNavigate} />;
  }

  // 2. Protected Internal ERP Application Routes
  if (!isAuthenticated) {
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
