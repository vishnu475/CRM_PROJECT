import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Hexagon, Mail, Lock, LogIn, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: 'landing' | 'register') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { setIsAuthenticated, setUserRole } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Executive');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUserRole(role as any);
      setIsAuthenticated(true);
      setIsLoading(false);
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new Event('popstate'));
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8faff] text-slate-600 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('landing')}
              className="text-slate-400 hover:text-[#2563eb] transition-colors text-sm font-bold hidden sm:block mr-4 flex items-center gap-1"
            >
              &larr; Back to ERP SUITE
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
              <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm">
                <Hexagon size={18} className="fill-white/20" />
              </div>
              <span className="font-extrabold text-[#1e3a8a] tracking-tight text-xl uppercase">ERP SUITE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-slate-500 hidden sm:block">Don't have an account?</span>
            <button 
              onClick={() => onNavigate('register')}
              className="text-[#2563eb] hover:text-blue-800 transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex w-full max-w-7xl mx-auto">
        
        {/* Left Side: Brand / Marketing */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 px-12 xl:px-20 relative">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <h1 className="text-4xl xl:text-5xl font-extrabold text-[#0f172a] leading-[1.1] tracking-[-0.03em] mb-6">
            Welcome back to <br/><span className="text-[#2563eb]">ERP SUITE</span>
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
            Manage your business, teams, sales, finance, and operations from one powerful platform.
          </p>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-slate-700 font-bold">
              <CheckCircle2 size={24} className="text-[#2563eb]" /> 
              <span>Unified business management</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 font-bold">
              <CheckCircle2 size={24} className="text-[#2563eb]" /> 
              <span>Secure role-based access</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 font-bold">
              <CheckCircle2 size={24} className="text-[#2563eb]" /> 
              <span>Real-time business insights</span>
            </div>
          </div>

          {/* Abstract visual inspired by landing page card */}
          <div className="mt-16 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-sm relative transform -rotate-1">
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#2563eb] rounded-full border-4 border-white shadow-sm flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <Hexagon size={20} className="fill-slate-200"/>
              </div>
              <div>
                <div className="text-sm font-extrabold text-[#0f172a]">Enterprise Workspace</div>
                <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block mt-1">Secure connection</div>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2563eb] w-3/4 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 z-10">
          <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-[24px] shadow-sm p-8 sm:p-12 relative overflow-hidden">
            
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Sign in to your account</h2>
              <p className="text-sm text-slate-500 font-medium">Enter your credentials to access your ERP workspace.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <a href="#" className="text-xs font-bold text-[#2563eb] hover:text-blue-800 transition-colors">Forgot Password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Login As</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Executive">Executive / Super Admin</option>
                    <option value="SalesManager">Sales Manager</option>
                    <option value="HRAdmin">HR Admin</option>
                    <option value="FinanceAccountant">Finance Accountant</option>
                    <option value="OperationsManager">Operations Manager</option>
                  </select>
                  <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-8 flex items-center justify-center space-x-2 py-4 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-base font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 ${
                  isLoading ? 'opacity-70 cursor-not-allowed transform-none' : ''
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In Securely</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Mobile Register Link */}
            <div className="mt-8 text-center text-sm font-bold text-slate-500 sm:hidden">
              Don't have an account?{' '}
              <button 
                onClick={() => onNavigate('register')}
                className="text-[#2563eb] hover:text-blue-800 transition-colors ml-1"
              >
                Get Started Free
              </button>
            </div>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs font-bold text-slate-400 mt-auto">
        <p>© 2026 ERP SUITE. All rights reserved.</p>
      </footer>
    </div>
  );
};
