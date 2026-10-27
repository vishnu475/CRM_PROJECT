import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Bell,
  Home,
  Sun,
  Moon,
  Headphones,
  Plus,
  Users,
  Building,
  CheckSquare,
  FolderKanban,
  FileText,
  Clock,
  FlaskConical,
  Bug,
  LayoutDashboard,
  ArrowRight,
  X,
  Sparkles,
  Command,
  Menu,
  ShoppingCart,
  Calendar,
  DollarSign,
  Settings as SettingsIcon,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation & Actions' | 'Tickets' | 'Customers & Users' | 'Employees' | 'Tasks & Projects' | 'Vendors & Procurement' | 'CRM & Sales' | 'HR & Leaves' | 'Settings';
  icon: React.ElementType;
  onSelect: () => void;
  keywords?: string[];
}

export const Header: React.FC = () => {
  const {
    userRole = 'Executive',
    userProfile,
    notifications = [],
    markNotificationRead = () => {},
    setActiveModule,
    setActiveSubSection,
    theme = 'dark',
    setTheme = () => {},
    helpdeskTickets = [],
    customers = [],
    employees = [],
    tasks = [],
    projects = [],
    vendors = [],
    isSidebarCollapsed = false,
    setIsSidebarCollapsed = () => {}
  } = useApp() || {};

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        if (!isSearchOpen) {
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

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

  const currentEmpName = userProfile?.name || 'Ashok';
  const isEmpRole = userRole === 'Employee';
  const displayNotifs = isEmpRole ? notifications : adminNotifications;
  const unreadCount = displayNotifs.filter((n: any) => !n.read && !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (!isEmpRole) {
      setAdminNotifications(prev => prev.map((n: any) => ({ ...n, read: true, is_read: true })));
      try {
        await fetch('/api/hrms/notifications/read-all', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: userRole })
        });
      } catch (e) {}
    } else {
      displayNotifs.forEach((n: any) => markNotificationRead(n.id));
      try {
        await fetch('/api/v1/employee/me/notifications/read-all', { method: 'PATCH' });
      } catch (e) {}
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!isEmpRole && notif.id) {
      setAdminNotifications(prev => prev.map(item => item.id === notif.id ? { ...item, read: true, is_read: true } : item));
      try {
        await fetch(`/api/hrms/notifications/${notif.id}/read`, { method: 'PATCH' });
      } catch (e) {}

      if (notif.employee_id) {
        setActiveModule('hrms', `employees/${notif.employee_id}`);
      }
    } else if (isEmpRole && notif.id) {
      markNotificationRead(notif.id);
      try {
        await fetch(`/api/v1/employee/me/notifications/${notif.id}/read`, { method: 'PATCH' });
      } catch (e) {}
    }
    setShowNotifications(false);
  };

  const navigateTo = (mod: ModuleId, sub?: string) => {
    setActiveModule(mod, sub);
    if (sub && setActiveSubSection) setActiveSubSection(sub);
    const targetUrl = sub ? `/${mod}/${sub}` : `/${mod}`;
    window.history.pushState({}, '', targetUrl);
    window.dispatchEvent(new Event('popstate'));
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Build searchable index
  const allSearchableItems: SearchItem[] = [
    // GT103: Raise a Ticket must redirect to Raise a Ticket page!
    {
      id: 'act-raise-ticket',
      title: 'Raise a Ticket',
      subtitle: 'Create and submit a new customer support ticket',
      category: 'Navigation & Actions',
      icon: Plus,
      keywords: ['raise', 'ticket', 'support', 'issue', 'complaint', 'new ticket', 'helpdesk'],
      onSelect: () => navigateTo('helpdesk', 'raise-ticket')
    },
    {
      id: 'act-my-tickets',
      title: 'My Tickets',
      subtitle: 'Review tickets submitted by you or your department',
      category: 'Navigation & Actions',
      icon: Headphones,
      keywords: ['my tickets', 'tickets', 'open tickets', 'helpdesk'],
      onSelect: () => navigateTo('helpdesk', 'my-tickets')
    },
    // GT104: All System Tickets direct navigation
    {
      id: 'act-all-system-tickets',
      title: 'All System Tickets',
      subtitle: 'Filter and inspect complete tickets across all clients',
      category: 'Navigation & Actions',
      icon: Headphones,
      keywords: ['all system tickets', 'all tickets', 'system tickets', 'tickets queue'],
      onSelect: () => navigateTo('helpdesk', 'all-tickets')
    },
    {
      id: 'act-tickets-queue',
      title: 'My Tickets Queue',
      subtitle: 'Live ticket processing and status queue',
      category: 'Navigation & Actions',
      icon: Clock,
      keywords: ['queue', 'ticket queue', 'my tickets queue'],
      onSelect: () => navigateTo('helpdesk', 'queue')
    },
    // GT106: Admin Navigation items (so search does not default to All Tickets Queue)
    {
      id: 'nav-dashboard',
      title: 'Executive Dashboard',
      subtitle: 'System KPIs, revenue, active projects & company overview',
      category: 'Navigation & Actions',
      icon: LayoutDashboard,
      keywords: ['dashboard', 'executive', 'kpi', 'home'],
      onSelect: () => navigateTo('dashboard')
    },
    {
      id: 'nav-customers',
      title: 'Customers Directory',
      subtitle: 'Manage client accounts, contracts & ledger balances',
      category: 'Navigation & Actions',
      icon: Building,
      keywords: ['customer', 'customers', 'client', 'accounts'],
      onSelect: () => navigateTo('customers')
    },
    {
      id: 'nav-employees',
      title: 'Employee Directory & HRMS',
      subtitle: 'Staff profiles, departments, statutory records & designations',
      category: 'Navigation & Actions',
      icon: Users,
      keywords: ['employee', 'employees', 'hrms', 'staff', 'users'],
      onSelect: () => navigateTo('hrms', 'employees')
    },
    {
      id: 'nav-testing-queue',
      title: 'Testing Queue',
      subtitle: 'QA test suite runs, acceptance test cases and validation',
      category: 'Navigation & Actions',
      icon: FlaskConical,
      keywords: ['testing', 'qa', 'testing queue', 'test cases', 'verdict'],
      onSelect: () => navigateTo('testing', 'queue')
    },
    {
      id: 'nav-bug-management',
      title: 'Bug Management',
      subtitle: 'Defect logging, severity assignments & resolution logs',
      category: 'Navigation & Actions',
      icon: Bug,
      keywords: ['bugs', 'defects', 'bug management', 'failures', 'qa bugs'],
      onSelect: () => navigateTo('testing', 'bugs')
    },
    {
      id: 'nav-tasks',
      title: 'Tasks & Deliverables',
      subtitle: 'Work orders, project milestones & deliverable tracking',
      category: 'Navigation & Actions',
      icon: CheckSquare,
      keywords: ['task', 'tasks', 'milestones', 'deliverables'],
      onSelect: () => navigateTo('tasks', 'all-tasks')
    },
    {
      id: 'nav-projects',
      title: 'Projects Hub',
      subtitle: 'Active projects, allocation schedules & delivery timeline',
      category: 'Navigation & Actions',
      icon: FolderKanban,
      keywords: ['project', 'projects', 'delivery'],
      onSelect: () => navigateTo('projects')
    },
    {
      id: 'nav-payroll',
      title: 'Payroll Processing',
      subtitle: 'Salary registers, statutory deductions & monthly payslips',
      category: 'Navigation & Actions',
      icon: FileText,
      keywords: ['payroll', 'salary', 'payslip', 'deductions'],
      onSelect: () => navigateTo('payroll', 'register')
    },
    {
      id: 'nav-attendance',
      title: 'Attendance & Clock-In',
      subtitle: 'Biometric records, live check-ins and regularization',
      category: 'Navigation & Actions',
      icon: Clock,
      keywords: ['attendance', 'clock in', 'timesheet', 'check in'],
      onSelect: () => navigateTo('attendance', 'daily')
    },
    {
      id: 'nav-crm-leads',
      title: 'CRM Leads & Pipeline',
      subtitle: 'Lead conversion tracking, scores and stages',
      category: 'CRM & Sales',
      icon: Users,
      keywords: ['crm', 'lead', 'leads', 'pipeline', 'deals', 'sales'],
      onSelect: () => navigateTo('crm', 'leads')
    },
    {
      id: 'nav-crm-opportunities',
      title: 'CRM Sales Opportunities',
      subtitle: 'Revenue deals, stages and weighted forecast',
      category: 'CRM & Sales',
      icon: DollarSign,
      keywords: ['opportunities', 'pipeline', 'sales deals', 'forecast'],
      onSelect: () => navigateTo('crm', 'opportunities')
    },
    {
      id: 'nav-vendors-master',
      title: 'Vendors Master Directory',
      subtitle: 'Procurement suppliers, payable balances & contracts',
      category: 'Vendors & Procurement',
      icon: ShoppingCart,
      keywords: ['vendor', 'vendors', 'supplier', 'suppliers', 'procurement'],
      onSelect: () => navigateTo('vendors')
    },
    {
      id: 'nav-purchases-orders',
      title: 'Procurement & Purchase Orders',
      subtitle: 'Purchase orders, goods receipts, and vendor invoices',
      category: 'Vendors & Procurement',
      icon: ShoppingCart,
      keywords: ['purchase', 'purchase orders', 'po', 'procurement', 'receipts'],
      onSelect: () => navigateTo('purchases')
    },
    {
      id: 'nav-leave-management',
      title: 'Leave & Absence Management',
      subtitle: 'Employee leave requests, balances and approvals',
      category: 'HR & Leaves',
      icon: Calendar,
      keywords: ['leave', 'leaves', 'absence', 'sick leave', 'vacation', 'casual leave'],
      onSelect: () => navigateTo('leave', 'requests')
    },
    {
      id: 'nav-public-holidays',
      title: 'Public Holidays 2026',
      subtitle: 'Approved company holidays calendar for 2026',
      category: 'HR & Leaves',
      icon: Calendar,
      keywords: ['holiday', 'holidays', 'calendar', 'public holidays', 'festival', '2026'],
      onSelect: () => navigateTo('leave', 'holidays')
    },
    {
      id: 'nav-settings-profile',
      title: 'Profile Settings & Preferences',
      subtitle: 'Theme customization, security credentials & account info',
      category: 'Settings',
      icon: SettingsIcon,
      keywords: ['settings', 'profile', 'theme', 'password', 'appearance', 'preferences'],
      onSelect: () => navigateTo('settings')
    },
    {
      id: 'nav-completed-tasks',
      title: 'Completed Tasks',
      subtitle: 'Delivered tasks signed off and verified',
      category: 'Tasks & Projects',
      icon: CheckSquare,
      keywords: ['completed tasks', 'done tasks', 'finished tasks', 'delivered'],
      onSelect: () => navigateTo('tasks', 'completed')
    },

    // Dynamic Tickets
    ...helpdeskTickets.map(t => ({
      id: `tck-${t.id}`,
      title: `${t.ticketNo} - ${t.subject}`,
      subtitle: `${t.customerName} • Status: ${t.status} • Priority: ${t.priority}`,
      category: 'Tickets' as const,
      icon: Headphones,
      keywords: [t.ticketNo.toLowerCase(), t.subject.toLowerCase(), t.customerName.toLowerCase(), t.status.toLowerCase()],
      onSelect: () => navigateTo('helpdesk', 'my-tickets')
    })),

    // Dynamic Customers & System Users
    ...customers.map(c => ({
      id: `cust-${c.id}`,
      title: c.customerName,
      subtitle: `Customer System User • ${c.primaryContact?.name || c.primaryContact?.email || 'Account Contact'} • ${c.billingAddress?.city || 'Active'}`,
      category: 'Customers & Users' as const,
      icon: Building,
      keywords: [c.customerName.toLowerCase(), (c.primaryContact?.name || '').toLowerCase(), (c.primaryContact?.email || '').toLowerCase(), 'customer user'],
      onSelect: () => navigateTo('customers')
    })),

    // Dynamic Employees
    ...employees.map(e => ({
      id: `emp-${e.id}`,
      title: `${e.name} (${e.empCode})`,
      subtitle: `${e.designation || 'Staff'} • ${e.department || 'General'}`,
      category: 'Employees' as const,
      icon: Users,
      keywords: [e.name.toLowerCase(), e.empCode.toLowerCase(), (e.designation || '').toLowerCase(), (e.department || '').toLowerCase()],
      onSelect: () => navigateTo('hrms', `employees/${e.empCode || e.id}`)
    })),

    // Dynamic Tasks
    ...tasks.map((t: any) => ({
      id: `task-${t.id}`,
      title: t.title || t.name || `Task #${t.id}`,
      subtitle: `Task • Status: ${t.status || 'Active'} • ${t.assignedToName || t.assignedTo || t.assignee || 'Unassigned'}`,
      category: 'Tasks & Projects' as const,
      icon: CheckSquare,
      keywords: [(t.title || '').toLowerCase(), (t.name || '').toLowerCase(), (t.id || '').toLowerCase(), (t.status || '').toLowerCase()],
      onSelect: () => navigateTo('tasks', 'all-tasks')
    })),

    // Dynamic Projects
    ...projects.map(p => ({
      id: `prj-${p.id}`,
      title: p.name,
      subtitle: `Project • Code: ${p.code || p.id} • ${p.client || 'Internal Project'}`,
      category: 'Tasks & Projects' as const,
      icon: FolderKanban,
      keywords: [p.name.toLowerCase(), (p.code || '').toLowerCase(), (p.client || '').toLowerCase()],
      onSelect: () => navigateTo('projects')
    })),

    // Dynamic Vendors
    ...vendors.map(v => ({
      id: `vnd-${v.id}`,
      title: v.name,
      subtitle: `Vendor • ${v.category || 'Supplier'} • ${v.code || v.id}`,
      category: 'Vendors & Procurement' as const,
      icon: ShoppingCart,
      keywords: [v.name.toLowerCase(), (v.code || '').toLowerCase(), (v.category || '').toLowerCase()],
      onSelect: () => navigateTo('vendors')
    }))
  ];

  // Filtering search results
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery === ''
    ? allSearchableItems.slice(0, 8) // Show top quick actions when query is empty
    : allSearchableItems.filter(item => {
        if (item.title.toLowerCase().includes(trimmedQuery)) return true;
        if (item.subtitle.toLowerCase().includes(trimmedQuery)) return true;
        if (item.keywords?.some(k => k.toLowerCase().includes(trimmedQuery))) return true;
        return false;
      });

  return (
    <header className="h-16 bg-white dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800/80 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
      
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Global Search Input & Palette Container */}
        <div ref={searchContainerRef} className="relative w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search size={15} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              placeholder="Search anything (modules, leads, employees, tasks)... ⌘ K"
              className="w-full pl-9 pr-14 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-[#0f172a] dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded">
                ⌘ K
              </kbd>
            </div>
          </div>

          {/* Global Search Results Dropdown Palette */}
          {isSearchOpen && (
          <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] max-w-[92vw] sm:w-[460px] md:w-[520px] bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold flex items-center gap-1.5">
                <Command size={13} className="text-[#2563eb]" />
                {trimmedQuery ? `Search Results for "${searchQuery}"` : 'Quick Navigation & Actions'}
              </span>
              <span className="text-[11px] text-slate-400">
                {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-1">
              {/* GT107: Dedicated "No Results Found" State */}
              {trimmedQuery && searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Search size={20} />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    No results found for "{searchQuery}"
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    No pages, tickets, customers, or employees matched your search. Try adjusting your query or use the quick actions below.
                  </p>
                  
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => navigateTo('helpdesk', 'raise-ticket')}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-[#2563eb] rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      + Raise a Ticket
                    </button>
                    <button
                      onClick={() => navigateTo('helpdesk', 'my-tickets')}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
                    >
                      My Tickets
                    </button>
                    <button
                      onClick={() => navigateTo('customers')}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
                    >
                      Customers
                    </button>
                  </div>
                </div>
              ) : (
                searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={item.onSelect}
                      className="p-3 hover:bg-blue-50/70 dark:hover:bg-blue-950/20 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60 group-hover:scale-105 transition-transform">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 truncate">
                              {item.title}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Press <kbd className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800">ESC</kbd> to close</span>
              <span>Direct navigation enabled</span>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Controls & Quick Actions */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Action Icons & Notifications */}
        <button
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#2563eb] text-slate-700 dark:text-slate-300 rounded-lg transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          title="Open Landing / Home Screen UI"
        >
          <Home size={15} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 text-slate-700 dark:text-slate-300 rounded-lg transition-all border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon size={15} className="text-slate-600" />
          )}
        </button>

        {/* Notifications Center Bell */}
        <div className="relative">
          <button
            onClick={() => {
              const nextState = !showNotifications;
              setShowNotifications(nextState);
            }}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border border-transparent hover:border-blue-100 dark:hover:border-slate-700 rounded-lg transition-all relative cursor-pointer"
            title="Notifications Center"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
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
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title="Mark all notifications as read"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-[10px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {displayNotifs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">No active notifications</div>
                ) : (
                  displayNotifs.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-colors cursor-pointer flex gap-3 ${
                        (!n.read && !n.is_read) ? 'bg-purple-50/30 dark:bg-purple-950/20' : 'opacity-85'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center justify-center border border-purple-200 dark:border-purple-800">
                          {n.employee_name ? n.employee_name.charAt(0) : '🔔'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          {n.employee_name && (
                            <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300">
                              {n.employee_name} <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">({n.employee_id})</span>
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${(!n.read && !n.is_read) ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                          {n.message || n.title}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    ✓ Mark all as read
                  </button>
                ) : <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">✓ All caught up</span>}
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (!isEmpRole) setActiveModule('hrms', 'all');
                    else setActiveModule('employee', 'notifications');
                  }}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                  View All &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
