import React, { useState } from 'react';
import { BookOpen, Plus, Filter, FolderTree, List, Search, Edit, Eye, UserCheck, UserX, FileText, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { VoucherScreensManager } from '../components/VoucherScreensManager';
import { ReceivablesPayablesView } from '../components/ReceivablesPayablesView';
import { ExtendedAccountLedger, AccountGroupType } from '../types';

export const AccountsPage: React.FC = () => {
  const { accounts } = useApp();

  // Navigation Tabs
  const [mainTab, setMainTab] = useState<'coa' | 'vouchers' | 'ar_ap'>('coa');
  const [viewStyle, setViewStyle] = useState<'tree' | 'flat'>('flat');

  // Extended Account Ledgers State with control accounts & activation status
  const [extendedAccounts, setExtendedAccounts] = useState<ExtendedAccountLedger[]>([
    { id: 'acc-1100', code: '1100', name: 'Trade Receivables (AR)', group: 'Asset', openingBalance: 500000, balance: 800000, currency: 'INR', isControlAccount: true, status: 'Active' },
    { id: 'acc-1200', code: '1200', name: 'HDFC Corporate Bank Account', group: 'Asset', openingBalance: 4000000, balance: 4500000, currency: 'INR', isControlAccount: false, status: 'Active' },
    { id: 'acc-1300', code: '1300', name: 'Petty Cash Account', group: 'Asset', openingBalance: 25000, balance: 50000, currency: 'INR', isControlAccount: false, status: 'Active' },
    { id: 'acc-2100', code: '2100', name: 'Trade Payables (AP)', group: 'Liability', openingBalance: 200000, balance: 375000, currency: 'INR', isControlAccount: true, status: 'Active' },
    { id: 'acc-3100', code: '3100', name: 'Share Capital (Equity)', group: 'Equity', openingBalance: 5000000, balance: 5000000, currency: 'INR', isControlAccount: false, status: 'Active' },
    { id: 'acc-4100', code: '4100', name: 'Software Sales Revenue', group: 'Revenue', openingBalance: 0, balance: 6500000, currency: 'INR', isControlAccount: false, status: 'Active' },
    { id: 'acc-5100', code: '5100', name: 'Employee Salary Expenses', group: 'Expense', openingBalance: 0, balance: 2800000, currency: 'INR', isControlAccount: false, status: 'Active' }
  ]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ExtendedAccountLedger | null>(null);
  const [editingAccount, setEditingAccount] = useState<ExtendedAccountLedger | null>(null);

  // Form State
  const [accForm, setAccForm] = useState({
    code: '',
    name: '',
    group: 'Asset' as AccountGroupType,
    openingBalance: 0
  });

  const handleAddAccount = () => {
    const created: ExtendedAccountLedger = {
      id: `acc-${accForm.code}`,
      code: accForm.code,
      name: accForm.name,
      group: accForm.group,
      openingBalance: Number(accForm.openingBalance),
      balance: Number(accForm.openingBalance),
      currency: 'INR',
      status: 'Active'
    };
    setExtendedAccounts([...extendedAccounts, created]);
    setIsAddAccountOpen(false);
  };

  const handleSaveEdit = () => {
    if (editingAccount) {
      setExtendedAccounts(extendedAccounts.map(a => a.id === editingAccount.id ? editingAccount : a));
      setEditingAccount(null);
    }
  };

  const toggleAccountStatus = (id: string) => {
    setExtendedAccounts(extendedAccounts.map(a => a.id === id ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' } : a));
  };

  const filteredAccounts = extendedAccounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.code.includes(searchTerm);
    const matchesGroup = selectedGroupFilter === 'All' || acc.group === selectedGroupFilter;
    const matchesStatus = selectedStatusFilter === 'All' || acc.status === selectedStatusFilter;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={24} />
            Chart of Accounts & General Ledger Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master double-entry Chart of Accounts, voucher screens, Accounts Receivable (Customer AR) & Accounts Payable (Vendor AP).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsAddAccountOpen(true)}>
            <Plus size={14} /> Add Account Ledger
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('coa')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'coa' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={14} /> Chart of Accounts (COA) Tree
        </button>
        <button
          onClick={() => setMainTab('vouchers')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'vouchers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} /> Voucher Screens (Receipt/Payment/Contra/Journal)
        </button>
        <button
          onClick={() => setMainTab('ar_ap')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'ar_ap' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft size={14} /> Receivables (AR) & Payables (AP) Ledgers
        </button>
      </div>

      {/* TAB: VOUCHERS */}
      {mainTab === 'vouchers' && <VoucherScreensManager />}

      {/* TAB: AR & AP LEDGERS */}
      {mainTab === 'ar_ap' && <ReceivablesPayablesView />}

      {/* TAB: CHART OF ACCOUNTS */}
      {mainTab === 'coa' && (
        <div className="space-y-4">
          {/* Filters Bar & View Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search account name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Account Groups</option>
                <option value="Asset">Assets</option>
                <option value="Liability">Liabilities</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expenses</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Accounts</option>
                <option value="Inactive">Inactive Accounts</option>
              </select>

              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto">
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
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Account Code</th>
                  <th className="p-3.5">Account Name</th>
                  <th className="p-3.5">Group</th>
                  <th className="p-3.5 font-bold text-right">Opening Balance</th>
                  <th className="p-3.5 font-bold text-right">Current Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-indigo-600 font-bold">{acc.code}</td>
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      {acc.name}
                      {acc.isControlAccount && <Badge variant="info">Control Acc</Badge>}
                    </td>
                    <td className="p-3.5"><Badge variant="neutral">{acc.group}</Badge></td>
                    <td className="p-3.5 text-right font-mono">₹ {acc.openingBalance.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600">₹ {acc.balance.toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge variant={acc.status === 'Active' ? 'success' : 'danger'}>{acc.status}</Badge>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button onClick={() => toggleAccountStatus(acc.id)} className="p-1 hover:bg-slate-100 rounded text-slate-600 font-bold" title={acc.status === 'Active' ? 'Deactivate' : 'Activate'}>
                        {acc.status === 'Active' ? <UserX size={14} className="text-rose-600" /> : <UserCheck size={14} className="text-emerald-600" />}
                      </button>
                      <button onClick={() => setEditingAccount(acc)} className="p-1 hover:bg-slate-100 rounded text-indigo-600 font-bold" title="Edit Account">
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      <Modal isOpen={isAddAccountOpen} onClose={() => setIsAddAccountOpen(false)} title="Add COA Account Ledger">
        <div className="space-y-4 text-xs">
          <Input label="Account Code" placeholder="e.g. 1400" value={accForm.code} onChange={(e) => setAccForm({ ...accForm, code: e.target.value })} />
          <Input label="Account Name" placeholder="e.g. Bank Overdraft Account" value={accForm.name} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} />
          <Select
            label="Account Group"
            value={accForm.group}
            onChange={(e) => setAccForm({ ...accForm, group: e.target.value as AccountGroupType })}
            options={[
              { label: 'Asset', value: 'Asset' },
              { label: 'Liability', value: 'Liability' },
              { label: 'Equity', value: 'Equity' },
              { label: 'Revenue', value: 'Revenue' },
              { label: 'Expense', value: 'Expense' }
            ]}
          />
          <Input label="Opening Balance (₹)" type="number" value={accForm.openingBalance} onChange={(e) => setAccForm({ ...accForm, openingBalance: Number(e.target.value) })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddAccount}>Save Account</Button>
          </div>
        </div>
      </Modal>

      {/* EDIT ACCOUNT MODAL */}
      {editingAccount && (
        <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title={`Edit Account: ${editingAccount.name}`}>
          <div className="space-y-4 text-xs">
            <Input label="Account Name" value={editingAccount.name} onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })} />
            <Select
              label="Account Group"
              value={editingAccount.group}
              onChange={(e) => setEditingAccount({ ...editingAccount, group: e.target.value as AccountGroupType })}
              options={[
                { label: 'Asset', value: 'Asset' },
                { label: 'Liability', value: 'Liability' },
                { label: 'Equity', value: 'Equity' },
                { label: 'Revenue', value: 'Revenue' },
                { label: 'Expense', value: 'Expense' }
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingAccount(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
