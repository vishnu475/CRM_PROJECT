import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Hexagon, Mail, Lock, LogIn, CheckCircle2, ArrowRight, Eye, EyeOff, AlertCircle, KeyRound, X, ShieldCheck, Check } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: 'landing' | 'register') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { setIsAuthenticated, setUserRole, setUserProfile, setActiveModule } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SuperAdmin' | 'Employee'>('SuperAdmin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // GT102: Remember Me state initialized from localStorage
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('crm_remember_me') === 'true';
  });

  // GT101: Forgot Password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // GT102: Auto-populate remembered user credentials upon mount / return
  React.useEffect(() => {
    const saved = localStorage.getItem('crm_remembered_login');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.role === 'Employee') setRole('Employee');
        else setRole('SuperAdmin');
        setRememberMe(true);
      } catch (_) {}
    }
  }, []);

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

  // Ensure login portal renders in crisp light branding
  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    return () => {
      const saved = localStorage.getItem('crm_theme') || 'dark';
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    };
  }, []);

  const handleRoleChange = (selectedRole: 'SuperAdmin' | 'Employee') => {
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
      // 1. Strict Backend API Authentication against PostgreSQL
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: inputKey, pin: pinKey })
      });
      const data = await apiRes.json();

      if (!data.success || !data.employee) {
        setError('Invalid credentials.');
        setIsLoading(false);
        return;
      }

      const emp = data.employee;
      const actualRole = emp.role || 'Employee';
      const isEmpAdmin = actualRole === 'Executive' || 
        emp.designation?.toLowerCase().includes('admin') || 
        emp.designation?.toLowerCase().includes('director') || 
        emp.designation?.toLowerCase().includes('vp') ||
        emp.id === 'ADMIN-001' || emp.id === 'EMP-000' ||
        emp.email?.toLowerCase().includes('admin');

      // STRICT RBAC CHECK:
      // 1. If Admin role is selected, user MUST be an Administrator.
      if (role === 'SuperAdmin') {
        if (!isEmpAdmin) {
          setError('Access denied: These credentials belong to an Employee account. Please select the Employee role.');
          setIsLoading(false);
          return;
        }
      }

      // 2. If Employee role is selected, Admin credentials must NOT open the employee portal.
      if (role === 'Employee') {
        if (isEmpAdmin) {
          setError('Access denied: Admin credentials cannot be used on the Employee login. Please select the Admin role.');
          setIsLoading(false);
          return;
        }
      }

      if (data.token) {
        localStorage.setItem('crm_token', data.token);
      }

      // GT102: Persist or clear Remember Me credentials
      if (rememberMe) {
        localStorage.setItem('crm_remember_me', 'true');
        localStorage.setItem('crm_remembered_login', JSON.stringify({ email: inputKey, role }));
      } else {
        localStorage.removeItem('crm_remember_me');
        localStorage.removeItem('crm_remembered_login');
      }

      const effectiveRole = role === 'SuperAdmin' ? 'Executive' : 'Employee';

      if (setUserProfile) {
        setUserProfile({
          id: emp.empCode || emp.id,
          empCode: emp.empCode || emp.id,
          name: emp.name,
          email: emp.email,
          role: effectiveRole,
          roleTitle: emp.designation || (effectiveRole === 'Executive' ? 'Administrator' : 'Employee'),
          department: emp.department || 'General'
        });
      }

      if (effectiveRole === 'Employee') {
        setUserRole('Employee');
        if (setActiveModule) setActiveModule('employee', 'dashboard');
        window.history.pushState({}, '', '/employee/dashboard');
      } else {
        setUserRole(effectiveRole);
        if (setActiveModule) setActiveModule('dashboard');
        window.history.pushState({}, '', '/dashboard');
      }
      setIsAuthenticated(true);
      window.dispatchEvent(new Event('popstate'));
    } catch (err: any) {
      setError('Unable to connect to authentication server. Please ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#f8faff] text-slate-600 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
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
          
          <div className="flex items-center gap-2 text-sm">
            <button 
              type="button"
              onClick={() => onNavigate('register')}
              className="text-slate-500 hover:text-[#2563eb] transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-blue-50/50"
            >
              <span>Don't have an account?</span>
              <span className="text-[#2563eb] font-bold underline underline-offset-2">Get Started Free</span>
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

            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} autoComplete="off" data-lpignore="true" className="space-y-5">
              
              {/* Role Selection Dropdown (Only Admin & Employee) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Login Role</label>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Active: {role === 'Employee' ? 'Employee' : 'Admin'}
                  </span>
                </div>
                <div className="relative">
                  <select
                    id="login-role-select"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as 'SuperAdmin' | 'Employee')}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="SuperAdmin">Admin</option>
                    <option value="Employee">Employee</option>
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {role === 'Employee' ? 'Employee ID' : 'Admin Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={role === 'Employee' ? 'EMP-001' : 'admin@company.com'}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">
                    {role === 'Employee' ? 'Employee PIN / Password' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotInput(email);
                      setForgotStatus('idle');
                      setForgotError(null);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-[#2563eb] hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={role === 'Employee' ? 'Enter 4-digit PIN' : 'Enter your password'}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all shadow-sm"
                  />
                  <button 
                    type="button" 
                    id="toggle-password-visibility"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* GT102: Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]/20 cursor-pointer accent-[#2563eb]"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                    Remember me on this device
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-6 flex items-center justify-center space-x-2 py-3.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-base font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer ${
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
                    setRole('SuperAdmin');
                    setError(null);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Admin Account</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">Admin Portal</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">admin@company.com • admin@123</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('EMP-008');
                    setPassword('1234');
                    setRole('Employee');
                    setError(null);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Employee Account</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded">ESS Portal</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">EMP-008 • PIN 1234</div>
                </button>
              </div>
            </div>

            {/* Universal Register Link (Desktop & Mobile) */}
            <div className="mt-8 text-center text-sm font-medium text-slate-500">
              <button 
                type="button"
                onClick={() => onNavigate('register')}
                className="hover:text-blue-700 transition-colors cursor-pointer"
              >
                Don't have an account?{' '}
                <span className="text-[#2563eb] font-bold hover:underline ml-1">
                  Sign up & Get Started Free
                </span>
              </button>
            </div>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs font-bold text-slate-400 mt-auto">
        <p>© 2026 ERP SUITE. All rights reserved.</p>
      </footer>

      {/* GT101: Interactive Forgot Password & Account Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-2xl max-w-[480px] w-full p-6 sm:p-8 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#2563eb] flex items-center justify-center shadow-inner">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Forgot Password</h3>
                <p className="text-xs text-slate-500 font-medium">Account recovery &amp; verification assistance</p>
              </div>
            </div>

            {forgotStatus === 'success' ? (
              <div className="space-y-5">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-900">Recovery Instructions Dispatched</h4>
                      <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                        {forgotSuccessMsg}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Target Identity:</span>
                    <span className="font-mono font-bold text-slate-800">{forgotInput}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Security One-Time PIN:</span>
                    <span className="font-mono font-extrabold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded">739210</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Recovery Status:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Check size={14} /> Ready for Sign In
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEmail(forgotInput);
                    setShowForgotModal(false);
                    setError(null);
                  }}
                  className="w-full py-3.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = forgotInput.trim();
                  if (!target) {
                    setForgotError('Please enter your Email Address or Employee ID.');
                    return;
                  }
                  setForgotStatus('sending');
                  setForgotError(null);
                  setTimeout(() => {
                    setForgotSuccessMsg(`A password reset link and temporary security PIN have been successfully generated for ${target}. You can now proceed to login or use default demo credentials.`);
                    setForgotStatus('success');
                  }, 600);
                }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered <strong className="text-slate-900">Email Address</strong> or <strong className="text-slate-900">Employee ID</strong> (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">EMP-001</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">admin@company.com</code>). We will dispatch immediate recovery instructions and a temporary access PIN.
                </p>

                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email or Employee ID</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={forgotInput}
                      onChange={(e) => {
                        setForgotInput(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="e.g. EMP-001 or admin@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/3 py-2.5 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotStatus === 'sending'}
                    className="w-2/3 py-2.5 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotStatus === 'sending' ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Recovery Instructions</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
