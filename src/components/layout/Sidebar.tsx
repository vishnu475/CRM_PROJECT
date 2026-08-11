import React from 'react';
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Users,
  UserCheck,
  Clock,
  CalendarDays,
  Banknote,
  Briefcase,
  BookOpen,
  FileText,
  Landmark,
  Receipt,
  ShoppingCart,
  Truck,
  Boxes,
  FolderKanban,
  CheckSquare,
  Headphones,
  Folder,
  BarChart3,
  Zap,
  ShieldCheck,
  Settings,
  ChevronRight,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    userProfile,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    theme,
    setTheme,
  } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crm', label: 'CRM', icon: Target },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'hrms', label: 'HRMS', icon: UserCheck },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'payroll', label: 'Payroll', icon: Banknote },
    { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
    { id: 'accounts', label: 'Accounts', icon: BookOpen },
    { id: 'ledger', label: 'Ledger', icon: FileText },
    { id: 'banking', label: 'Banking', icon: Landmark },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'helpdesk', label: 'Helpdesk', icon: Headphones },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'administration', label: 'Administration', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm shrink-0">
            <Zap size={20} className="fill-white/20" />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-[#0f172a] flex items-center space-x-1">
                <span>ERP SUITE</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight truncate">
                Business Management Platform
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-50 text-[#2563eb] shadow-sm border border-blue-100'
                  : 'text-slate-500 hover:text-[#0f172a] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Icon
                  size={18}
                  className={`shrink-0 ${
                    isActive ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-[#2563eb]'
                  }`}
                />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isSidebarCollapsed && (
                <ChevronRight
                  size={14}
                  className={`shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${
                    isActive ? 'text-[#2563eb] opacity-80' : 'text-slate-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card & Controls */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        {/* User Card */}
        <div
          className={`flex items-center space-x-3 p-2 rounded-xl bg-white border border-slate-200 shadow-sm ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-100 shrink-0"
          />
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#0f172a] truncate">{userProfile.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{userProfile.roleTitle}</p>
            </div>
          )}
        </div>

        {/* Bottom Bar Tools */}
        <div className="mt-2.5 flex items-center justify-between px-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>

          {!isSidebarCollapsed && (
            <button
              onClick={() => setActiveModule('settings')}
              className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm"
              title="System Settings"
            >
              <SlidersHorizontal size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
