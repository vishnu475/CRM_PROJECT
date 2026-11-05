import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Bell,
  Home,
  X,
  Loader2,
  Users,
  Target,
  CheckSquare,
  Briefcase,
  FileText,
  Headphones,
  ShoppingCart,
  UserCheck,
  ArrowRight,
  Menu,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePermission } from '../../hooks/usePermission';
import { ModuleId } from '../../types';

export interface GlobalSearchResult {
  id: string;
  category: 'Customer' | 'Lead' | 'Opportunity' | 'Task' | 'Project' | 'Employee' | 'Product' | 'Quotation' | 'Document' | 'Helpdesk';
  title: string;
  subtitle: string;
  moduleId: ModuleId;
  subSection?: string;
  badgeClass: string;
}

const renderCategoryIcon = (category: GlobalSearchResult['category']) => {
  switch (category) {
    case 'Customer':
      return <Users size={14} className="text-emerald-600" />;
    case 'Lead':
      return <UserCheck size={14} className="text-blue-600" />;
    case 'Opportunity':
      return <Target size={14} className="text-violet-600" />;
    case 'Task':
      return <CheckSquare size={14} className="text-amber-600" />;
    case 'Project':
      return <Briefcase size={14} className="text-indigo-600" />;
    case 'Employee':
      return <Users size={14} className="text-purple-600" />;
    case 'Product':
      return <ShoppingCart size={14} className="text-cyan-600" />;
    case 'Quotation':
      return <FileText size={14} className="text-rose-600" />;
    case 'Document':
      return <FileText size={14} className="text-slate-600" />;
    case 'Helpdesk':
      return <Headphones size={14} className="text-orange-600" />;
    default:
      return <Search size={14} className="text-slate-500" />;
  }
};

export const Header: React.FC = () => {
  const {
    userRole = 'Executive',
    userProfile,
    notifications = [],
    markNotificationRead = () => {},
    setActiveModule,
    customers = [],
    leads = [],
    opportunities = [],
    tasks = [],
    projects = [],
    employees = [],
    products = [],
    quotations = [],
    documents = [],
    helpdeskTickets = [],
    isMobileSidebarOpen = false,
    setIsMobileSidebarOpen = () => {},
    setIsAuthenticated,
  } = useApp() || {};

  const { canAccessModule } = usePermission();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input to avoid excessive computation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedQuery('');
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global keyboard shortcut (⌘K / Ctrl+K) and outside click handling
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        if (searchQuery.trim().length > 0) {
          setIsDropdownOpen(true);
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  // Compute matching results filtered strictly by user authorization and safety rules
  const searchResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const matches: GlobalSearchResult[] = [];

    // 1. Customers
    if (canAccessModule('customers') || canAccessModule('crm')) {
      for (const c of customers) {
        if (
          c.customerName?.toLowerCase().includes(q) ||
          c.customerCode?.toLowerCase().includes(q) ||
          c.primaryContact?.name?.toLowerCase().includes(q) ||
          c.primaryContact?.email?.toLowerCase().includes(q) ||
          c.industry?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `customer-${c.id}`,
            category: 'Customer',
            title: c.customerName,
            subtitle: c.primaryContact?.email || c.primaryContact?.name || c.industry || 'Customer Record',
            moduleId: 'customers',
            subSection: 'customer-details',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          });
        }
      }
    }

    // 2. Leads
    if (canAccessModule('crm')) {
      for (const l of leads) {
        if (
          l.name?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.stage?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `lead-${l.id}`,
            category: 'Lead',
            title: l.name,
            subtitle: `${l.company ? l.company + ' • ' : ''}${l.stage || 'Lead'}`,
            moduleId: 'crm',
            subSection: 'leads',
            badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          });
        }
      }
    }

    // 3. Opportunities
    if (canAccessModule('crm')) {
      for (const o of opportunities) {
        if (
          o.name?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.stage?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `opportunity-${o.id}`,
            category: 'Opportunity',
            title: o.name,
            subtitle: `${o.customerName ? o.customerName + ' • ' : ''}${o.stage || 'Opportunity'}`,
            moduleId: 'crm',
            subSection: 'opportunities',
            badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
          });
        }
      }
    }

    // 4. Tasks
    if (canAccessModule('tasks')) {
      for (const t of tasks) {
        if (
          t.title?.toLowerCase().includes(q) ||
          t.project?.toLowerCase().includes(q) ||
          t.assignee?.toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `task-${t.id}`,
            category: 'Task',
            title: t.title,
            subtitle: `${t.project ? t.project + ' • ' : ''}${t.status || 'Task'}`,
            moduleId: 'tasks',
            subSection: 'all-tasks',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          });
        }
      }
    }

    // 5. Projects
    if (canAccessModule('projects')) {
      for (const p of projects) {
        if (
          p.name?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.client?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `project-${p.id}`,
            category: 'Project',
            title: p.name,
            subtitle: `${p.code ? p.code + ' • ' : ''}${p.client || 'Project'}`,
            moduleId: 'projects',
            badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          });
        }
      }
    }

    // 6. Employees (STRICT SECURITY: Safe public directory info only; NO PIN, salary, or banking)
    if (canAccessModule('hrms')) {
      for (const emp of employees) {
        if (
          emp.name?.toLowerCase().includes(q) ||
          emp.empCode?.toLowerCase().includes(q) ||
          emp.department?.toLowerCase().includes(q) ||
          emp.designation?.toLowerCase().includes(q) ||
          emp.email?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `employee-${emp.id}`,
            category: 'Employee',
            title: emp.name,
            subtitle: `${emp.empCode ? emp.empCode + ' • ' : ''}${emp.designation || emp.department || 'Employee'}`,
            moduleId: 'hrms',
            subSection: 'employees',
            badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          });
        }
      }
    }

    // 7. Products
    if (canAccessModule('sales')) {
      for (const prod of products) {
        if (
          prod.name?.toLowerCase().includes(q) ||
          prod.sku?.toLowerCase().includes(q) ||
          prod.category?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `product-${prod.id}`,
            category: 'Product',
            title: prod.name,
            subtitle: `${prod.sku ? prod.sku + ' • ' : ''}${prod.category || 'Product'}`,
            moduleId: 'sales',
            badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          });
        }
      }
    }

    // 8. Quotations
    if (canAccessModule('sales')) {
      for (const qItem of quotations) {
        if (
          qItem.quoteNumber?.toLowerCase().includes(q) ||
          qItem.customerName?.toLowerCase().includes(q) ||
          qItem.status?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `quotation-${qItem.id}`,
            category: 'Quotation',
            title: qItem.quoteNumber,
            subtitle: `${qItem.customerName ? qItem.customerName + ' • ' : ''}${qItem.status || 'Quotation'}`,
            moduleId: 'sales',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          });
        }
      }
    }

    // 9. Documents
    if (canAccessModule('documents')) {
      for (const d of documents) {
        if (
          d.name?.toLowerCase().includes(q) ||
          d.category?.toLowerCase().includes(q) ||
          d.linkedEntity?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `document-${d.id}`,
            category: 'Document',
            title: d.name,
            subtitle: `${d.category || 'Document'}${d.linkedEntity ? ' • ' + d.linkedEntity : ''}`,
            moduleId: 'documents',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
          });
        }
      }
    }

    // 10. Helpdesk Tickets
    if (canAccessModule('helpdesk')) {
      for (const h of helpdeskTickets) {
        if (
          h.ticketNo?.toLowerCase().includes(q) ||
          h.subject?.toLowerCase().includes(q) ||
          h.customerName?.toLowerCase().includes(q)
        ) {
          matches.push({
            id: `helpdesk-${h.id}`,
            category: 'Helpdesk',
            title: `${h.ticketNo}: ${h.subject}`,
            subtitle: `${h.customerName || 'Ticket'} • ${h.status || ''}`,
            moduleId: 'helpdesk',
            badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
          });
        }
      }
    }

    return matches.slice(0, 15);
  }, [
    debouncedQuery,
    canAccessModule,
    customers,
    leads,
    opportunities,
    tasks,
    projects,
    employees,
    products,
    quotations,
    documents,
    helpdeskTickets,
  ]);

  const handleSelectResult = (result: GlobalSearchResult) => {
    if (setActiveModule) {
      setActiveModule(result.moduleId, result.subSection);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedIndex(-1);
    searchInputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isDropdownOpen && searchResults.length > 0) {
        setIsDropdownOpen(true);
      }
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const item = selectedIndex >= 0 && selectedIndex < searchResults.length ? searchResults[selectedIndex] : searchResults[0];
        handleSelectResult(item);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      } else {
        handleClear();
      }
    }
  };

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

  const currentEmpName =
    userProfile?.name && userProfile.name.trim() ? userProfile.name.trim() : 'User';

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

  return (
    <header className="h-16 bg-white dark:bg-[#0B0F19]/90 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm gap-2">
      {/* Left side: Mobile Menu Button & Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          id="mobile-menu-toggle-btn"
          type="button"
          onClick={() => setIsMobileSidebarOpen((prev: boolean) => !prev)}
          className="p-2 -ml-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg md:hidden shrink-0 cursor-pointer transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileSidebarOpen}
          aria-controls="app-navigation-sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Search Input Container */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {isSearching ? (
              <Loader2 size={16} className="animate-spin text-blue-600" />
            ) : (
              <Search size={16} />
            )}
          </div>
          <input
            ref={searchInputRef}
            id="global-search-input"
            type="text"
            role="combobox"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            aria-controls="global-search-dropdown"
            aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
            aria-label="Global search across all modules"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search anything... ⌘ K"
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              id="global-search-clear-btn"
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div
            id="global-search-dropdown"
            role="listbox"
            aria-label="Global Search Results"
            className="absolute left-0 mt-2 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header with counter */}
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>
                {isSearching
                  ? 'Searching records...'
                  : `Matching records (${searchResults.length})`}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">⌘K</span>
            </div>

            {/* List Content */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {isSearching ? (
                <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span>Searching CRM, Tasks, Employees & Records...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div id="global-search-empty" className="p-6 text-center">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <Search size={16} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No matching records found</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    No results for &ldquo;{debouncedQuery}&rdquo; in authorized modules.
                  </p>
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <div
                    key={item.id}
                    id={`search-item-${idx}`}
                    role="option"
                    aria-selected={selectedIndex === idx}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      selectedIndex === idx
                        ? 'bg-blue-50/80 text-blue-900 border-l-2 border-blue-600 pl-[12px]'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                        {renderCategoryIcon(item.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.badgeClass}`}>
                        {item.category}
                      </span>
                      <ArrowRight size={12} className={`text-slate-400 ${selectedIndex === idx ? 'text-blue-600' : 'opacity-0'}`} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Keyboard Hints */}
            <div className="px-3 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>↑ ↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Controls & Quick Actions */}
      <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
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
            onClick={() => {
              const nextState = !showNotifications;
              setShowNotifications(nextState);
            }}
            className="p-1.5 text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all relative"
            title="Notifications Center"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
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

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {displayNotifs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">No active notifications</div>
                ) : (
                  displayNotifs.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-purple-50/60 transition-colors cursor-pointer flex gap-3 ${
                        (!n.read && !n.is_read) ? 'bg-purple-50/30' : 'opacity-85'
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
                        <p className={`text-xs mt-0.5 ${(!n.read && !n.is_read) ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                          {n.message || n.title}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    ✓ Mark all as read
                  </button>
                ) : <span className="text-[11px] text-emerald-600 font-bold">✓ All caught up</span>}
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (!isEmpRole) setActiveModule('hrms', 'all');
                    else setActiveModule('employee', 'notifications');
                  }}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-800"
                >
                  View All &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          id="header-signout-btn"
          type="button"
          onClick={() => {
            if (setIsAuthenticated) setIsAuthenticated(false);
            localStorage.removeItem("crm_user_profile");
            localStorage.removeItem("crm_token");
            localStorage.removeItem("crm_auth");
            localStorage.removeItem("crm_user_role");
            window.history.pushState({}, "", "/login");
            window.dispatchEvent(new Event("popstate"));
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-all cursor-pointer font-bold text-xs shadow-sm hover:shadow"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
