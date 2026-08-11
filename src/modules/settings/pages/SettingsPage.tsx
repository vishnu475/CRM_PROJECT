import React, { useState } from 'react';
import { Settings, Save, Globe, Hash, Percent, Bell } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

export const SettingsPage: React.FC = () => {
  const { companyName, setCompanyName, branchName, setBranchName } = useApp();
  const [localCompany, setLocalCompany] = useState(companyName);
  const [localBranch, setLocalBranch] = useState(branchName);
  const [currency, setCurrency] = useState('INR (₹)');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setCompanyName(localCompany);
    setBranchName(localBranch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-slate-600" size={24} />
            System Global Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure company branding, branch prefixes, tax codes, currencies, and numbering sequences.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave}>
          <Save size={14} /> {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Globe size={16} className="text-slate-500" /> Organization Branding
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={localCompany}
              onChange={(e) => setLocalCompany(e.target.value)}
            />
            <Input
              label="Active Branch"
              value={localBranch}
              onChange={(e) => setLocalBranch(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Hash size={16} className="text-slate-500" /> Numbering Sequences & Localization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Prefix</label>
              <input
                type="text"
                value="VCHR-2026-"
                disabled
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
