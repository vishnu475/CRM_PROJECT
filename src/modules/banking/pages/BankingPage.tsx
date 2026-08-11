import React from 'react';
import { Landmark, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const BankingPage: React.FC = () => {
  const { bankAccounts } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="text-indigo-600" size={24} />
            Banking & Cash Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate bank accounts, cash registers, transfers, and bank statement reconciliations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw size={14} /> Bank Reconciliation
          </Button>
          <Button variant="primary" size="sm">
            <Plus size={14} /> Add Bank Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map((bnk) => (
          <div key={bnk.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{bnk.bankName}</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">₹ {bnk.balance.toLocaleString()}</p>
              <p className="text-xs font-mono text-indigo-600 mt-1">Acc #: {bnk.accountNumber}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400">Currency: <span className="font-bold text-slate-700">INR</span></span>
              <button className="text-indigo-600 font-bold hover:underline">View Statement &rarr;</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
