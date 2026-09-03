import React, { useState } from 'react';
import { Shield, Bell, Key, CheckCircle2, Save, Lock, AlertTriangle, Smartphone } from 'lucide-react';
import { SecurityAndAccessSettings, NotificationSettingsConfig } from '../types';

export const SecurityNotificationsSettings: React.FC = () => {
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [security, setSecurity] = useState<SecurityAndAccessSettings>(() => {
    const saved = localStorage.getItem('crm_security_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      twoFactorAuth: true,
      sessionTimeoutMinutes: 45,
      enforceStrongPasswords: true,
      allowSelfRegistration: false,
      ipRestrictionEnabled: false,
      allowedIpRanges: '192.168.1.0/24, 10.0.0.0/16'
    };
  });

  const [notifications, setNotifications] = useState<NotificationSettingsConfig>(() => {
    const saved = localStorage.getItem('crm_notification_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      emailAlerts: true,
      pushNotifications: true,
      taskAssignmentAlerts: true,
      leaveApprovalAlerts: true,
      attendanceReminders: true,
      weeklyPerformanceDigest: false
    };
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('crm_security_settings', JSON.stringify(security));
    localStorage.setItem('crm_notification_settings', JSON.stringify(notifications));
    setSuccessToast('Security and notification preferences saved successfully!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Security, Access & Notification Preferences</h2>
          </div>
          <p className="text-xs text-slate-500 pl-10">
            Configure Two-Factor Authentication (2FA), inactivity session timeout, password policies, and employee event alerts.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. AUTHENTICATION & SECURITY CONTROLS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Authentication & System Security</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 2FA Toggle */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Smartphone size={14} className="text-blue-600" /> Two-Factor Authentication (2FA)
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block">
                  Enforces email/SMS OTP verification upon login from unrecognized devices.
                </span>
              </div>
              <input
                type="checkbox"
                checked={security.twoFactorAuth}
                onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                className="mt-1 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Password Policy */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Key size={14} className="text-blue-600" /> Enforce Strong Password Policy
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block">
                  Requires minimum 8 characters with numbers, symbols, and uppercase letters.
                </span>
              </div>
              <input
                type="checkbox"
                checked={security.enforceStrongPasswords}
                onChange={(e) => setSecurity({ ...security, enforceStrongPasswords: e.target.checked })}
                className="mt-1 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Session Timeout */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Inactivity Session Timeout (Minutes)</label>
              <input
                type="number"
                min="5"
                max="240"
                value={security.sessionTimeoutMinutes}
                onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">Auto logout idle user sessions after specified duration</span>
            </div>
          </div>
        </div>

        {/* 2. REAL-TIME EVENT & TASK NOTIFICATIONS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Task & Employee Real-Time Notifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Task Assignment Alerts</span>
                <span className="text-[11px] text-slate-500">Notify employee when a task is assigned</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.taskAssignmentAlerts}
                onChange={(e) => setNotifications({ ...notifications, taskAssignmentAlerts: e.target.checked })}
                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Leave & Regularization Alerts</span>
                <span className="text-[11px] text-slate-500">Alert managers on pending leave requests</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.leaveApprovalAlerts}
                onChange={(e) => setNotifications({ ...notifications, leaveApprovalAlerts: e.target.checked })}
                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Biometric Attendance Reminders</span>
                <span className="text-[11px] text-slate-500">Send reminder at shift start/end punch times</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.attendanceReminders}
                onChange={(e) => setNotifications({ ...notifications, attendanceReminders: e.target.checked })}
                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Weekly Performance Digest</span>
                <span className="text-[11px] text-slate-500">Email summary of weekly work deliverables</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyPerformanceDigest}
                onChange={(e) => setNotifications({ ...notifications, weeklyPerformanceDigest: e.target.checked })}
                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save size={14} /> Save Security & Notification Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
