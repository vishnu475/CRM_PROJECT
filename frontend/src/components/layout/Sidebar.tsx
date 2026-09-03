import React, { useState, useEffect } from 'react';
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
  Settings,
  ChevronRight,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Activity,
  GripVertical,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', icon: Target },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'hrms', label: 'HRMS', icon: UserCheck },
  { id: 'employee', label: 'Employee Work & Reports', icon: Activity },
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
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const {
    activeModule = 'dashboard',
    activeSubSection = '',
    setActiveModule = () => {},
    setActiveSubSection = () => {},
    userProfile = { name: 'John Doe', avatar: '', roleTitle: 'Administrator' },
    isSidebarCollapsed = false,
    setIsSidebarCollapsed = () => {},
    theme = 'dark',
    setTheme = () => {},
  } = useApp() || {};

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    tasks: true,
  });

  // Dynamic order of nav items with localStorage persistence
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const savedOrder = localStorage.getItem('crm_sidebar_nav_order');
    if (savedOrder) {
      try {
        const orderIds: string[] = JSON.parse(savedOrder);
        const itemMap = new Map(DEFAULT_NAV_ITEMS.map(item => [item.id, item]));
        const ordered: NavItem[] = [];
        
        // Add items in saved order
        for (const id of orderIds) {
          const item = itemMap.get(id as ModuleId);
          if (item) {
            ordered.push(item);
            itemMap.delete(id as ModuleId);
          }
        }
        
        // Append any new or unranked items
        itemMap.forEach(item => ordered.push(item));
        return ordered;
      } catch (e) {
        console.warn('Failed to parse saved sidebar order:', e);
      }
    }
    return DEFAULT_NAV_ITEMS;
  });

  // Drag-and-Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const taskSubItems = [
    { id: 'my-tasks', label: 'My Tasks' },
    { id: 'all-tasks', label: 'All Tasks' },
    { id: 'assign-task', label: 'Assign Task' },
    { id: 'reports', label: 'Task Reports' },
  ];

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set a clean drag preview
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...navItems];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setNavItems(updated);
    localStorage.setItem('crm_sidebar_nav_order', JSON.stringify(updated.map(item => item.id)));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNavItems(DEFAULT_NAV_ITEMS);
    localStorage.removeItem('crm_sidebar_nav_order');
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
        <div 
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="flex items-center space-x-3 overflow-hidden cursor-pointer"
          title="Go to Home Page"
        >
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

      {/* Navigation Links with Drag & Drop */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isTasks = item.id === 'tasks';
          const isExpanded = expandedModules[item.id] !== false;
          const isBeingDragged = draggedIndex === index;
          const isTargetedOver = dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={item.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`space-y-0.5 relative transition-all duration-150 rounded-xl ${
                isBeingDragged ? 'opacity-40 scale-98' : 'opacity-100'
              } ${
                isTargetedOver ? 'border-t-2 border-blue-500 pt-0.5' : ''
              }`}
            >
              <button
                onClick={() => {
                  if (isTasks) {
                    setActiveModule('tasks', activeSubSection || 'all-tasks');
                    setExpandedModules(prev => ({ ...prev, tasks: true }));
                  } else {
                    setActiveModule(item.id);
                  }
                }}
                title={isSidebarCollapsed ? `${item.label} (Drag to reorder)` : 'Drag to reorder'}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                  isActive && !isTasks
                    ? 'bg-blue-50 text-[#2563eb] shadow-sm border border-blue-100'
                    : isActive && isTasks
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-[#0f172a] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                  {/* Drag Handle Grip */}
                  {!isSidebarCollapsed && (
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-0.5 -ml-1 transition shrink-0"
                      title="Drag to reorder"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical size={13} />
                    </div>
                  )}

                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      isActive && isTasks
                        ? 'text-white'
                        : isActive
                        ? 'text-[#2563eb]'
                        : 'text-slate-400 group-hover:text-[#2563eb]'
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isSidebarCollapsed && (
                  isTasks ? (
                    <div
                      onClick={(e) => toggleExpand('tasks', e)}
                      className="p-1 hover:bg-white/20 rounded-md transition"
                    >
                      <ChevronRight
                        size={14}
                        className={`shrink-0 transition-transform ${
                          isExpanded ? 'rotate-90 text-white' : 'text-white/80'
                        }`}
                      />
                    </div>
                  ) : (
                    <ChevronRight
                      size={14}
                      className={`shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${
                        isActive ? 'text-[#2563eb] opacity-80' : 'text-slate-400'
                      }`}
                    />
                  )
                )}
              </button>

              {/* Tasks Submenu Items */}
              {isTasks && !isSidebarCollapsed && isExpanded && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  {taskSubItems.map(subItem => {
                    const isSubActive =
                      isActive &&
                      (activeSubSection === subItem.id ||
                        (!activeSubSection && subItem.id === 'all-tasks') ||
                        (activeSubSection === 'all' && subItem.id === 'all-tasks'));
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveModule('tasks', subItem.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isSubActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                        }`}
                      >
                        {subItem.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile Card & Controls */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
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
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {!isSidebarCollapsed && (
              <button
                onClick={handleResetOrder}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
                title="Reset Sidebar Menu Order to Default"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!isSidebarCollapsed && (
              <button
                onClick={() => setActiveModule('settings')}
                className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
                title="System Settings"
              >
                <SlidersHorizontal size={15} />
              </button>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
