import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const {
    userRole = 'Executive',
    setUserRole = () => {},
    userProfile,
    companyName = 'Demo Company',
    setCompanyName = () => {},
    notifications = [],
    markNotificationRead = () => {},
  } = useApp() || {};

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Input */}
      <div className="relative w-64 md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anything... ⌘ K"
          className="w-full pl-9 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] focus:bg-white transition-all shadow-inner"
        />
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
          <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ⌘ K
          </kbd>
        </div>
      </div>

      {/* Controls & Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Role View Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f172a] transition-all shadow-sm"
          >
            <UserCheck size={15} className="text-[#2563eb]" />
            <span>{rolesList.find((r) => r.id === userRole)?.label}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 divide-y divide-slate-100">
              <div className="px-3 py-2 bg-slate-50">
                <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Switch Dashboard Login Role
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {rolesList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setUserRole(r.id);
                      setShowRoleDropdown(false);
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

        {/* Company Switcher */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f172a] transition-all shadow-sm"
          >
            <Building2 size={15} className="text-purple-500" />
            <span className="max-w-[120px] truncate">{companyName}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showCompanyDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 divide-y divide-slate-100">
              <div className="px-3 py-2 bg-slate-50">
                <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Switch Active Company
                </p>
              </div>
              <div>
                {companiesList.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCompanyName(c);
                      setShowCompanyDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center space-x-2 transition-colors ${
                      companyName === c ? 'bg-purple-50/50' : ''
                    }`}
                  >
                    <Building2 size={14} className={companyName === c ? 'text-purple-600' : 'text-slate-400'} />
                    <span className={`text-xs font-bold truncate ${companyName === c ? 'text-purple-700' : 'text-[#0f172a]'}`}>
                      {c}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block mx-1"></div>

        {/* Action Icons */}
        <button className="p-1.5 text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all hidden sm:block">
          <Calendar size={18} />
        </button>

        <button className="p-1.5 text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all hidden sm:block">
          <MessageSquare size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-[#0f172a]">Notifications</span>
                <span className="text-[10px] bg-blue-100 text-[#2563eb] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs font-medium">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-slate-50 transition-colors flex gap-3 ${
                        !n.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {n.type === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
                        {n.type === 'info' && <Info size={16} className="text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.read ? 'font-bold text-[#0f172a]' : 'font-medium text-slate-600'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="shrink-0 p-1 text-slate-400 hover:text-[#2563eb] rounded-full hover:bg-blue-50 transition-colors self-start"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-center">
                <button className="text-[11px] font-bold text-[#2563eb] hover:text-blue-800">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
