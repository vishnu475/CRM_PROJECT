import React, { useState } from 'react';
import { User, Bell, Settings as SettingsIcon, Shield, DollarSign, Calendar, Mail, Key } from 'lucide-react';
import { UserProfileSettings, NotificationSettingsConfig, ApplicationSystemSettings } from '../types';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';

export const GeneralSystemSettings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileSettings>({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    designation: 'Chief Technology Officer (CTO)',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    timezone: 'Asia/Kolkata (IST)'
  });

  const [notifications, setNotifications] = useState<NotificationSettingsConfig>({
    emailAlerts: true,
    pushNotifications: true,
    approvalReminders: true,
    weeklyReports: false
  });

  const [appSettings, setAppSettings] = useState<ApplicationSystemSettings>({
    themeMode: 'Light',
    baseCurrency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'DD/MM/YYYY',
    gstin: '27AABCU9603R1ZM',
    panNumber: 'AABCU9603R',
    twoFactorAuth: true,
    sessionTimeoutMinutes: 30
  });

  return (
    <div className="space-y-6">
      {/* PROFILE SETTINGS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
          <User className="text-indigo-600" size={18} /> User Profile & Contact Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <Input label="Full Name" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
          <Input label="Email Address" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Input label="Phone Number" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <Input label="Corporate Designation" value={profile.designation} onChange={(e) => setProfile({ ...profile, designation: e.target.value })} />
        </div>
      </div>

      {/* REGIONAL, CURRENCY & DATE FORMAT SETTINGS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
          <DollarSign className="text-emerald-600" size={18} /> Currency, Date Format & GSTIN Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <Select
            label="Base Accounting Currency"
            value={appSettings.baseCurrency}
            onChange={(e) => setAppSettings({ ...appSettings, baseCurrency: e.target.value as any })}
            options={[
              { label: 'Indian Rupee (INR ₹)', value: 'INR' },
              { label: 'US Dollar (USD $)', value: 'USD' },
              { label: 'Euro (EUR €)', value: 'EUR' }
            ]}
          />
          <Select
            label="System Date Format"
            value={appSettings.dateFormat}
            onChange={(e) => setAppSettings({ ...appSettings, dateFormat: e.target.value as any })}
            options={[
              { label: 'DD/MM/YYYY (e.g. 11/08/2026)', value: 'DD/MM/YYYY' },
              { label: 'YYYY-MM-DD (e.g. 2026-08-11)', value: 'YYYY-MM-DD' },
              { label: 'MM/DD/YYYY (e.g. 08/11/2026)', value: 'MM/DD/YYYY' }
            ]}
          />
          <Input label="Company GSTIN Registration" value={appSettings.gstin} onChange={(e) => setAppSettings({ ...appSettings, gstin: e.target.value })} />
        </div>
      </div>

      {/* SECURITY & SESSION TIMEOUT */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
          <Shield className="text-rose-600" size={18} /> Security & Session Timeout Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
            <div>
              <span className="font-bold text-slate-900 block">Two-Factor Authentication (2FA)</span>
              <span className="text-[10px] text-slate-400">Require OTP code on new browser logins</span>
            </div>
            <input type="checkbox" checked={appSettings.twoFactorAuth} onChange={(e) => setAppSettings({ ...appSettings, twoFactorAuth: e.target.checked })} />
          </div>
          <Input label="Inactivity Session Timeout (Minutes)" type="number" value={appSettings.sessionTimeoutMinutes} onChange={(e) => setAppSettings({ ...appSettings, sessionTimeoutMinutes: Number(e.target.value) })} />
        </div>
      </div>

      {/* NOTIFICATIONS & EMAIL PREFERENCES */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
          <Bell className="text-purple-600" size={18} /> Email & Push Notification Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
            <span className="font-semibold text-slate-800">Email System Alerts</span>
            <input type="checkbox" checked={notifications.emailAlerts} onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
            <span className="font-semibold text-slate-800">Browser Push Notifications</span>
            <input type="checkbox" checked={notifications.pushNotifications} onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary">Save System Settings</Button>
      </div>
    </div>
  );
};
