import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Building2, Globe, DollarSign, Calendar, FileText, CheckCircle2, Save, Sun, Moon } from 'lucide-react';
import { OrganizationSystemSettings } from '../types';

export const OrganizationRegionalSettings: React.FC = () => {
  const { companyName, setCompanyName, branchName, setBranchName, theme, setTheme } = useApp();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [orgData, setOrgData] = useState<OrganizationSystemSettings>(() => {
    const saved = localStorage.getItem('crm_org_regional_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      companyName: companyName || 'Demo Company Pvt. Ltd.',
      tradeName: 'ERP & HRMS Suite Global',
      branchName: branchName || 'Headquarters (HQ)',
      contactEmail: 'corporate@democompany.com',
      contactPhone: '+91 80 4123 4567',
      website: 'https://democompany.com',
      registeredAddress: 'Level 5, Tech Innovation Park, Bengaluru, Karnataka 560100, India',
      gstin: '29AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
      cinNumber: 'U72200KA2020PTC138842',
      baseCurrency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Kolkata (IST, UTC+05:30)',
      financialYearStart: '01-April'
    };
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyName(orgData.companyName);
    setBranchName(orgData.branchName);
    localStorage.setItem('crm_org_regional_settings', JSON.stringify(orgData));
    setSuccessToast('Organization & Regional settings saved and updated across system!');
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
              <Building2 size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Organization & Regional Configuration</h2>
          </div>
          <p className="text-xs text-slate-500 pl-10">
            Define legal entity profile, tax registrations, base accounting currency, timezone, and date format standards.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. LEGAL ENTITY & CONTACT */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Company Legal Entity & Contact Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Company Registered Name</label>
              <input
                type="text"
                value={orgData.companyName}
                onChange={(e) => setOrgData({ ...orgData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Trade / Brand Name</label>
              <input
                type="text"
                value={orgData.tradeName}
                onChange={(e) => setOrgData({ ...orgData, tradeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Default Primary Branch</label>
              <input
                type="text"
                value={orgData.branchName}
                onChange={(e) => setOrgData({ ...orgData, branchName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Corporate Contact Email</label>
              <input
                type="email"
                value={orgData.contactEmail}
                onChange={(e) => setOrgData({ ...orgData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Corporate Phone</label>
              <input
                type="text"
                value={orgData.contactPhone}
                onChange={(e) => setOrgData({ ...orgData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Official Website</label>
              <input
                type="url"
                value={orgData.website}
                onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-[11px] font-semibold text-slate-600 block">Registered Office Address</label>
              <input
                type="text"
                value={orgData.registeredAddress}
                onChange={(e) => setOrgData({ ...orgData, registeredAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 2. STATUTORY & TAX IDENTIFICATION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Tax & Statutory Compliance Identifiers</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">GSTIN Registration #</label>
              <input
                type="text"
                value={orgData.gstin}
                onChange={(e) => setOrgData({ ...orgData, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Income Tax PAN Number</label>
              <input
                type="text"
                value={orgData.panNumber}
                onChange={(e) => setOrgData({ ...orgData, panNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Corporate CIN Number</label>
              <input
                type="text"
                value={orgData.cinNumber}
                onChange={(e) => setOrgData({ ...orgData, cinNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 3. REGIONAL, CURRENCY & DATE FORMATS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Regional Accounting, Currency & Date Formats</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Base Accounting Currency</label>
              <select
                value={orgData.baseCurrency}
                onChange={(e) => {
                  const val = e.target.value as any;
                  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' };
                  setOrgData({ ...orgData, baseCurrency: val, currencySymbol: symbols[val] || '₹' });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="INR">Indian Rupee (INR ₹)</option>
                <option value="USD">US Dollar (USD $)</option>
                <option value="EUR">Euro (EUR €)</option>
                <option value="GBP">British Pound (GBP £)</option>
                <option value="AED">UAE Dirham (AED د.إ)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">System Date Format</label>
              <select
                value={orgData.dateFormat}
                onChange={(e) => setOrgData({ ...orgData, dateFormat: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 03/09/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-03)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/03/2026)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Timezone</label>
              <select
                value={orgData.timezone}
                onChange={(e) => setOrgData({ ...orgData, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Asia/Kolkata (IST, UTC+05:30)">Asia/Kolkata (IST, UTC+05:30)</option>
                <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York (EST, UTC-05:00)">America/New_York (EST, UTC-05:00)</option>
                <option value="Europe/London (GMT/BST, UTC+01:00)">Europe/London (GMT/BST, UTC+01:00)</option>
                <option value="Asia/Dubai (GST, UTC+04:00)">Asia/Dubai (GST, UTC+04:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. SYSTEM THEME PREFERENCE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sun size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Interface Display Theme</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-w-md">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-blue-50/70 border-blue-500 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-500">
                  <Sun size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold block">Light Theme</span>
                  <span className="text-[11px] text-slate-500">Clean corporate enterprise view</span>
                </div>
              </div>
              {theme === 'light' && <CheckCircle2 size={16} className="text-blue-600" />}
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                  <Moon size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold block">Dark Theme</span>
                  <span className="text-[11px] text-slate-400">Low-glare high contrast view</span>
                </div>
              </div>
              {theme === 'dark' && <CheckCircle2 size={16} className="text-emerald-400" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save size={14} /> Save Organization & Regional Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
