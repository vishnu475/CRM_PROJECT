import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Building2,
  Calendar,
  Sliders,
  ChevronDown,
  UserCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Home,
  LogOut,
  User,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    userRole = 'Executive',
    setUserRole = () => {},
    userProfile,
    setUserProfile = () => {},
    companyName = 'Demo Company',
    setCompanyName = () => {},
    notifications = [],
    markNotificationRead = () => {},
    setIsAuthenticated = () => {},
    setActiveModule,
    setActiveSubSection,
  } = useApp() || {};

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);

  // Fetch Available Employees for Login Identity Switcher
  useEffect(() => {
    fetch('/api/hrms/employees')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setAvailableEmployees(json.data);
        } else {
          setAvailableEmployees([
            { id: 'EMP-006', emp_code: 'EMP-006', name: 'Ashok', department: 'Product Management', designation: 'Senior Full Stack Engineer', email: 'ashok@company.com' },
            { id: 'EMP-001', emp_code: 'EMP-001', name: 'Sarah Jenkins', department: 'Executive', designation: 'HR Director', email: 'sarah.jenkins@company.com' },
            { id: 'EMP-008', emp_code: 'EMP-008', name: 'Ramesh', department: 'Engineering', designation: 'Backend Architect', email: 'ramesh@company.com' },
          ]);
        }
      })
      .catch(() => {
        setAvailableEmployees([
          { id: 'EMP-006', emp_code: 'EMP-006', name: 'Ashok', department: 'Product Management', designation: 'Senior Full Stack Engineer', email: 'ashok@company.com' },
          { id: 'EMP-001', emp_code: 'EMP-001', name: 'Sarah Jenkins', department: 'Executive', designation: 'HR Director', email: 'sarah.jenkins@company.com' },
          { id: 'EMP-008', emp_code: 'EMP-008', name: 'Ramesh', department: 'Engineering', designation: 'Backend Architect', email: 'ramesh@company.com' },
        ]);
      });
  }, []);

  // Fetch Dynamic Admin Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/hrms/notifications?role=${userRole}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAdminNotifications(json.data);
      }
    } catch (e) {
      // Fallback
    }
  }, [userRole]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const rolesList: { id: UserRole; label: string; desc: string }[] = [
    { id: 'Executive', label: 'Executive View', desc: 'Full Enterprise Admin Dashboard' },
    { id: 'SalesManager', label: 'Sales Manager View', desc: 'Pipeline, Conversion & Deals' },
    { id: 'SalesExecutive', label: 'Sales Exec View', desc: 'My Leads, Activities & Targets' },
    { id: 'HRAdmin', label: 'HR Admin View', desc: 'Attendance, Leaves & Payroll' },
    { id: 'FinanceAccountant', label: 'Finance View', desc: 'General Ledger, P&L & COA' },
    { id: 'OperationsManager', label: 'Operations View', desc: 'Projects, POs & Stock' },
    { id: 'Employee', label: 'Employee ESS View', desc: 'Self Service, Attendance & Pay' },
    { id: 'Customer', label: 'Customer Portal', desc: 'Invoices, Quotes & Tickets' },
    { id: 'Vendor', label: 'Vendor Portal', desc: 'Purchase Orders & Bills' },
  ];

  const companiesList = [
    'Demo Company Pvt. Ltd.',
    'Global Tech Solutions Inc.',
    'Apex Logistics & Operations',
  ];

  const currentEmpId = userProfile?.empCode || userProfile?.id || 'EMP-006';
  const currentEmpName = userProfile?.name || 'Ashok';

  const isEmpRole = userRole === 'Employee';
  const displayNotifs = isEmpRole ? notifications : adminNotifications;
  const unreadCount = displayNotifs.filter((n: any) => !n.read).length;

  const handleSelectEmployeeIdentity = (emp: any) => {
    const code = emp.emp_code || emp.id;
    setUserProfile({
      id: emp.id,
      empCode: code,
      name: emp.name,
      email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      roleTitle: emp.designation || 'Staff',
      company: companyName,
      branch: emp.branch || 'HQ'
    });
    setShowEmpDropdown(false);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!isEmpRole && notif.id) {
      try {
        await fetch(`/api/hrms/notifications/${notif.id}/read`, { method: 'PATCH' });
        fetchNotifications();
      } catch (e) {}

      if (notif.employee_id) {
        setActiveModule('hrms', `employees/${notif.employee_id}`);
      }
    } else if (isEmpRole && notif.id) {
      markNotificationRead(notif.id);
    }
    setShowNotifications(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Input */}
      <div className="relative w-48 md:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anything... ⌘ K"
          className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] focus:bg-white transition-all shadow-inner"
        />
      </div>

      {/* Controls & Quick Actions */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Employee Identity Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowEmpDropdown(!showEmpDropdown)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold text-purple-900 transition-all shadow-sm"
            title="Switch Active Logged-In Employee Identity"
          >
            <User size={14} className="text-purple-600" />
            <span className="max-w-[110px] truncate">{currentEmpName}</span>
            <span className="px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded font-mono text-[10px] hidden sm:inline">
              {currentEmpId}
            </span>
            <ChevronDown size={14} className="text-purple-400" />
          </button>

          {showEmpDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 divide-y divide-slate-100">
              <div className="px-3 py-2 bg-purple-50">
                <p className="text-[11px] font-bold uppercase text-purple-700 tracking-wider flex items-center gap-1">
                  <User size={12} /> Switch Logged-in Employee Identity
                </p>
                <p className="text-[10px] text-slate-500">Employee Portal & HRMS data scope updates instantly.</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableEmployees.map((e) => (
                  <button
                    key={e.id || e.emp_code}
                    onClick={() => handleSelectEmployeeIdentity(e)}
                    className={`w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center justify-between transition-colors ${
                      currentEmpId === (e.emp_code || e.id) ? 'bg-purple-100/60 font-bold' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{e.name}</p>
                      <p className="text-[10px] text-slate-500">{e.designation || e.department}</p>
                    </div>
                    <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold">
                      {e.emp_code || e.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role View Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f172a] transition-all shadow-sm"
          >
            <UserCheck size={14} className="text-[#2563eb]" />
            <span className="hidden sm:inline">{rolesList.find((r) => r.id === userRole)?.label}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 divide-y divide-slate-100">
              <div className="px-3 py-2 bg-slate-50">
                <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Switch System View Role
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {rolesList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setUserRole(r.id);
                      setShowRoleDropdown(false);
                      if (r.id === 'Employee') {
                        setActiveModule('employee', 'dashboard');
                      }
                    }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex flex-col transition-colors ${
                      userRole === r.id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <span className={`text-xs font-bold ${userRole === r.id ? 'text-[#2563eb]' : 'text-[#0f172a]'}`}>
                      {r.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 font-medium">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Icons & Notifications */}
        <button
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-[#2563eb] text-slate-700 rounded-lg transition-all border border-slate-200"
          title="Open Landing / Home Screen UI"
        >
          <Home size={15} />
        </button>

        {/* Notifications Center Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all relative"
            title="Notifications Center"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-purple-900 text-white flex justify-between items-center">
                <div>
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <Bell size={14} className="text-purple-300" />
                    {isEmpRole ? 'My ESS Notifications' : 'Admin & HR Approvals Center'}
                  </span>
                  <p className="text-[10px] text-purple-200">
                    {isEmpRole ? `Personal updates for ${currentEmpName}` : 'Real-time employee requests & pending approvals'}
                  </p>
                </div>
                <span className="text-[10px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {displayNotifs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">No active notifications</div>
                ) : (
                  displayNotifs.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-purple-50/60 transition-colors cursor-pointer flex gap-3 ${
                        !n.read ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center border border-purple-200">
                          {n.employee_name ? n.employee_name.charAt(0) : '🔔'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          {n.employee_name && (
                            <span className="text-[11px] font-extrabold text-purple-700">
                              {n.employee_name} <span className="font-mono text-[10px] text-slate-500">({n.employee_id})</span>
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono">
                            {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                          {n.message || n.title}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (!isEmpRole) setActiveModule('hrms', 'all');
                    else setActiveModule('employee', 'notifications');
                  }}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-800"
                >
                  View All Notifications Queue &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
