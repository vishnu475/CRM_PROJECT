import React, { useState } from 'react';
import { BookOpen, Plus, Filter, FolderTree, List } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const AccountsPage: React.FC = () => {
  const { accounts } = useApp();
  const [selectedType, setSelectedType] = useState('All');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [viewStyle, setViewStyle] = useState<'tree' | 'flat'>('flat');

  const filteredAccounts = accounts.filter(acc => selectedType === 'All' || acc.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={24} />
            Chart of Accounts (COA)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master double-entry account ledger tree across Assets, Liabilities, Equity, Revenue, and Expenses.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewStyle('flat')}
              className={`p-1.5 rounded-md text-xs font-semibold ${viewStyle === 'flat' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewStyle('tree')}
              className={`p-1.5 rounded-md text-xs font-semibold ${viewStyle === 'tree' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              <FolderTree size={14} />
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddAccountOpen(true)}>
            <Plus size={14} /> Add Account
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Filter size={14} className="text-slate-400" />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="All">All Account Groups</option>
          <option value="Asset">Assets</option>
          <option value="Liability">Liabilities</option>
          <option value="Equity">Equity</option>
          <option value="Revenue">Revenue</option>
          <option value="Expense">Expenses</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Account Code</th>
              <th className="p-3.5">Account Name</th>
              <th className="p-3.5">Type Group</th>
              <th className="p-3.5 text-right">Current Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAccounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono text-indigo-600 font-bold">{acc.code}</td>
                <td className="p-3.5 font-bold text-slate-900">{acc.name}</td>
                <td className="p-3.5"><Badge variant="info">{acc.type}</Badge></td>
                <td className="p-3.5 text-right font-bold text-emerald-600">₹ {acc.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Account Modal */}
      <Modal isOpen={isAddAccountOpen} onClose={() => setIsAddAccountOpen(false)} title="Add COA Account Ledger">
        <div className="space-y-4 text-xs">
          <Input label="Account Code" placeholder="e.g. 1300" />
          <Input label="Account Name" placeholder="e.g. Petty Cash Account" />
          <Select
            label="Account Group"
            options={[
              { label: 'Asset', value: 'Asset' },
              { label: 'Liability', value: 'Liability' },
              { label: 'Equity', value: 'Equity' },
              { label: 'Revenue', value: 'Revenue' },
              { label: 'Expense', value: 'Expense' }
            ]}
          />
          <Input label="Opening Balance (₹)" type="number" defaultValue="0" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsAddAccountOpen(false)}>Save Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
