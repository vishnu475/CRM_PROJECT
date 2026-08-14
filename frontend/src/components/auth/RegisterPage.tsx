import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Zap, Mail, Lock, UserPlus, Building, User } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: 'landing' | 'login') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { setIsAuthenticated, setUserRole } = useApp();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUserRole('Executive'); // Default to Admin on new register
      setIsAuthenticated(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090D16] text-slate-100 p-4">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#121A2C] border border-slate-800/80 rounded-3xl shadow-2xl p-8 z-10 relative">
        <button 
          onClick={() => onNavigate('landing')}
          className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors text-xs flex items-center gap-1 font-semibold"
        >
          &larr; Back
        </button>
        <div className="text-center mb-10 mt-4 space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-6">
            <Zap size={28} className="fill-white/20" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-400 text-sm">Start your 14-day free trial today.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 bg-[#0B101D] border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 ml-1">Company Name</label>
            <div className="relative">
              <Building className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full pl-10 pr-4 py-3 bg-[#0B101D] border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 ml-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-3 bg-[#0B101D] border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#0B101D] border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all transform hover:scale-[1.02] active:scale-95 mt-2 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Workspace</span>
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('login')}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
