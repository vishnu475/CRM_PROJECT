import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Hexagon, Mail, Lock, LogIn, CheckCircle2, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: 'landing' | 'login' | 'register' | 'careers') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { setIsAuthenticated, setUserRole, setUserProfile, setActiveModule } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('crm_user_role');
    if (saved === 'Employee') return 'Employee';
    if (saved === 'Super Admin') return 'Super Admin';
    if (saved === 'HRAdmin') return 'HRAdmin';
    return 'Executive';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss restarting error when backend server comes back online
  React.useEffect(() => {
    if (error && (error.includes('restarting') || error.includes('Unable to connect'))) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/health');
          if (res.ok) {
            setError(null);
            clearInterval(interval);
          }
        } catch (_) {}
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [error]);

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const inputKey = (email || '').trim();
    const pinKey = (password || '').trim();

    if (!inputKey || !pinKey) {
      setError(role === 'Employee' ? 'Please enter your Employee ID and PIN.' : 'Please enter your credentials.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Strict Backend API Authentication against PostgreSQL employees table with selected role
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: inputKey, pin: pinKey, role })
      });
      const data = await apiRes.json();

      if (data.success && data.employee) {
        const emp = data.employee;

        // Security check: Guard against frontend role tampering / privilege escalation
        const isExecRequested = role === 'Executive' || role === 'Super Admin';
        if (isExecRequested && emp.role !== 'Executive' && emp.role !== 'HRAdmin') {
          setError('This account does not have Executive / Super Admin privileges. Please select Employee Self-Service (ESS).');
          setIsLoading(false);
          return;
        }

        if (data.token) {
          localStorage.setItem('crm_token', data.token);
        }

        const effectiveRole = emp.role || (role === 'Employee' ? 'Employee' : role === 'HRAdmin' ? 'HRAdmin' : 'Executive');

        if (setUserProfile) {
          setUserProfile({
            id: emp.empCode || emp.id,
            empCode: emp.empCode || emp.id,
            name: emp.name,
            email: emp.email,
            role: effectiveRole,
            roleTitle: emp.designation || (role === 'Super Admin' ? 'Super Administrator' : (effectiveRole === 'Executive' ? 'Administrator' : effectiveRole === 'HRAdmin' ? 'HR Operations Lead' : 'Employee')),
            department: emp.department || 'General'
          });
        }

        if (effectiveRole === 'Employee') {
          setUserRole('Employee');
          if (setActiveModule) setActiveModule('employee', 'dashboard');
          window.history.pushState({}, '', '/employee/dashboard');
        } else if (effectiveRole === 'HRAdmin') {
          setUserRole('HRAdmin');
          if (setActiveModule) setActiveModule('dashboard');
          window.history.pushState({}, '', '/dashboard');
        } else {
          setUserRole(effectiveRole);
          if (setActiveModule) setActiveModule('dashboard');
          window.history.pushState({}, '', '/dashboard');
        }
        setIsAuthenticated(true);
        window.dispatchEvent(new Event('popstate'));
      } else {
        // Display clear error from backend (e.g. "This account does not have Executive / Super Admin privileges." or "Invalid credentials")
        setError(data.message || 'Employee ID does not exist. Please enter a valid Employee ID.');
      }
    } catch (err: any) {
      setError('Unable to connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          
          <div className="flex items-center gap-2 text-sm font-bold">
            <a 
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('register');
              }}
              className="text-slate-500 hover:text-[#2563eb] transition-colors hidden sm:inline-block cursor-pointer"
            >
              Don't have an account?
            </a>
            <a 
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('register');
              }}
              className="text-[#2563eb] hover:text-blue-800 transition-colors cursor-pointer"
            >
              Get Started Free
            </a>
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

            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {role === 'Employee' ? 'Employee ID' : 'Email Address or Employee ID'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      if (error) setError(null);
                      if (val.trim().toUpperCase() === 'EMP-003' || val.toLowerCase().includes('priya')) {
                        setRole('HRAdmin');
                      }
                    }}
                    placeholder={role === 'Employee' ? 'Enter Employee ID (e.g. EMP-008 or 8)' : 'you@company.com or EMP-001'}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">
                    {role === 'Employee' ? 'Employee PIN / Password' : 'Password'}
                  </label>
                  <a href="#" className="text-xs font-bold text-[#2563eb] hover:text-blue-800 transition-colors">Forgot Password?</a>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
                  <input
                    id="password-input"
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={role === 'Employee' ? 'Enter your PIN' : 'Enter your password'}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm"
                  />
                  <button 
                    type="button"
                    id="password-toggle-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    aria-controls="password-input"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 rounded-lg transition-colors flex items-center justify-center min-w-[36px] min-h-[36px] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="role-select" className="text-sm font-bold text-slate-700 ml-1">Login As</label>
                <div className="relative">
                  <select
                    id="role-select"
                    data-testid="role-select"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="HRAdmin">HR Lead / HR Admin</option>
                    <option value="Employee">Employee Self-Service (ESS)</option>
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

            {/* Quick Demo Credentials Assistant */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Quick Access / Demo Accounts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@company.com');
                    setPassword('admin@123');
                    setRole('Super Admin');
                    setError(null);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Executive Admin</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">Super Admin</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">admin@company.com • 1234</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('EMP-008');
                    setPassword('1234');
                    setRole('Employee');
                    setError(null);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Ramesh (ESS)</span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100/60 px-1.5 py-0.5 rounded">Engineer</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">EMP-008 / 8 • PIN 1234</div>
                </button>
              </div>
            </div>

            {/* Register Link (Mobile and Desktop) */}
            <div className="mt-8 text-center text-sm font-bold text-slate-500 flex items-center justify-center gap-1.5 flex-wrap">
              <a
                href="/register"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('register');
                }}
                className="text-slate-500 hover:text-[#2563eb] transition-colors cursor-pointer"
              >
                Don't have an account?
              </a>
              <a 
                href="/register"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('register');
                }}
                className="text-[#2563eb] hover:text-blue-800 transition-colors cursor-pointer"
              >
                Get Started Free
              </a>
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
