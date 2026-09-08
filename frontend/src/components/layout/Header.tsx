import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  Home
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const {
    userRole = 'Executive',
    userProfile,
    notifications = [],
    markNotificationRead = () => {},
    setActiveModule,
  } = useApp() || {};

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);

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
      </div>
    </header>
  );
};
