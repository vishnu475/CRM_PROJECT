import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Settings as SettingsIcon, Hash, User, Shield, Bell, DollarSign, Calendar } from 'lucide-react';
import { NumberingSettingsManager } from '../components/NumberingSettingsManager';
import { GeneralSystemSettings } from '../components/GeneralSystemSettings';

export const SettingsPage: React.FC = () => {
  const { activeSubSection, setActiveSubSection } = useApp();
  const validSettingsTabs = ['numbering', 'general'];
  const mainTab = (validSettingsTabs.includes(activeSubSection) ? activeSubSection : 'numbering') as 'numbering' | 'general';
  const setMainTab = (tab: 'numbering' | 'general') => setActiveSubSection(tab);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="text-indigo-600" size={24} />
            System Administration & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Auto-numbering sequences (INV-000001, VCHR-000001, PO-000001, EMP-000001), user profiles, currency symbols, date formats, and 2FA security.
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('numbering')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'numbering' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Hash size={14} /> Document Auto-Numbering Sequences
        </button>
        <button
          onClick={() => setMainTab('general')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={14} /> Profile, Currency, Security & Notifications
        </button>
      </div>

      {/* TAB: NUMBERING */}
      {mainTab === 'numbering' && <NumberingSettingsManager />}

      {/* TAB: GENERAL SETTINGS */}
      {mainTab === 'general' && <GeneralSystemSettings />}
    </div>
  );
};
