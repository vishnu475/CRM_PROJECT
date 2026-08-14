import React, { useState } from 'react';
import { Landmark, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, ArrowRightLeft, Search, Filter, Calendar, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

import { BankAccountManager } from '../components/BankAccountManager';
import { BankReconciliationMatcher } from '../components/BankReconciliationMatcher';
import { ExtendedBankAccount, BankTransaction, BankTxType } from '../types';

export const BankingPage: React.FC = () => {
  const { bankAccounts, activeSubSection, setActiveSubSection } = useApp();

  // Navigation Tabs
  const validBankingTabs = ['accounts', 'transactions', 'reconciliation'];
  const mainTab = (validBankingTabs.includes(activeSubSection) ? activeSubSection : 'accounts') as 'accounts' | 'transactions' | 'reconciliation';
  const setMainTab = (tab: 'accounts' | 'transactions' | 'reconciliation') => setActiveSubSection(tab);

  // Extended Bank & Cash Accounts State
  const [accounts, setAccounts] = useState<ExtendedBankAccount[]>([
    { id: 'bnk-1', bankName: 'HDFC Bank', accountName: 'HDFC Corporate Operating Account', accountNumber: '98765432101', accountType: 'Corporate Bank', ifscCode: 'HDFC0001234', branchName: 'Fort Mumbai HQ', balance: 4500000, currency: 'INR', status: 'Active' },
    { id: 'bnk-2', bankName: 'Axis Bank', accountName: 'Axis Cash Register Account', accountNumber: '55443322110', accountType: 'Cash Register', ifscCode: 'UTIB0005544', branchName: 'Bengaluru Tech Hub', balance: 500000, currency: 'INR', status: 'Active' },
    { id: 'bnk-3', bankName: 'Petty Cash Vault', accountName: 'Office Petty Cash Register', accountNumber: 'CASH-VAULT-01', accountType: 'Petty Cash', ifscCode: 'N/A', branchName: 'Mumbai HQ Office', balance: 50000, currency: 'INR', status: 'Active' }
  ]);

  // Transactions State & Filters
  const [transactions, setTransactions] = useState<BankTransaction[]>([
    { id: 'tx-1', date: '2026-08-11', description: 'Customer Receipt - Globex Corp', txType: 'Customer Receipt', amount: 450000, accountName: 'HDFC Corporate Operating Account', referenceNumber: 'REF-98711', reconciliationStatus: 'Matched' },
    { id: 'tx-2', date: '2026-08-10', description: 'Vendor Settlement - Office Supplies Ltd', txType: 'Vendor Payment', amount: 125000, accountName: 'HDFC Corporate Operating Account', referenceNumber: 'REF-44210', reconciliationStatus: 'Matched' },
    { id: 'tx-3', date: '2026-08-08', description: 'Petty Cash Deposit', txType: 'Deposit', amount: 50000, accountName: 'Office Petty Cash Register', referenceNumber: 'REF-11902', reconciliationStatus: 'Suggested', suggestedMatchTx: 'CNT-2026-101 (Cash Deposit)' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccFilter, setSelectedAccFilter] = useState('All');
  const [selectedTxTypeFilter, setSelectedTxTypeFilter] = useState<BankTxType | 'All'>('All');

  const handleAddAccount = (newAcc: ExtendedBankAccount) => {
    setAccounts([...accounts, newAcc]);
  };

  const handleDeposit = (accName: string, amount: number) => {
    setAccounts(accounts.map(a => a.accountName === accName ? { ...a, balance: a.balance + amount } : a));
    const newTx: BankTransaction = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      description: `Direct Cash/Bank Deposit into ${accName}`,
      txType: 'Deposit',
      amount,
      accountName: accName,
      referenceNumber: `DEP-${Date.now().toString().slice(-4)}`,
      reconciliationStatus: 'Unmatched'
    };
    setTransactions([newTx, ...transactions]);
  };

  const handleWithdrawal = (accName: string, amount: number) => {
    setAccounts(accounts.map(a => a.accountName === accName ? { ...a, balance: a.balance - amount } : a));
    const newTx: BankTransaction = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      description: `Direct Cash/Bank Withdrawal from ${accName}`,
      txType: 'Withdrawal',
      amount,
      accountName: accName,
      referenceNumber: `WTH-${Date.now().toString().slice(-4)}`,
      reconciliationStatus: 'Unmatched'
    };
    setTransactions([newTx, ...transactions]);
  };

  // Filtered Transactions
  const filteredTxs = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAcc = selectedAccFilter === 'All' || t.accountName === selectedAccFilter;
    const matchesType = selectedTxTypeFilter === 'All' || t.txType === selectedTxTypeFilter;
    return matchesSearch && matchesAcc && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="text-indigo-600" size={24} />
            Banking & Cash Management Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Corporate bank accounts, cash registers, petty cash, deposits, withdrawals, and 3-state statement reconciliation (Matched | Unmatched | Suggested).
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('accounts')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'accounts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark size={14} /> Bank & Cash Accounts Directory
        </button>
        <button
          onClick={() => setMainTab('transactions')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'transactions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft size={14} /> Transactions Ledger & Filters
        </button>
        <button
          onClick={() => setMainTab('reconciliation')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'reconciliation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RefreshCw size={14} /> Bank Reconciliation Matcher
        </button>
      </div>

      {/* TAB: BANK & CASH ACCOUNTS */}
      {mainTab === 'accounts' && (
        <BankAccountManager
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdrawal}
        />
      )}

      {/* TAB: RECONCILIATION MATCHER ENGINE */}
      {mainTab === 'reconciliation' && <BankReconciliationMatcher />}

      {/* TAB: TRANSACTIONS & FILTERS */}
      {mainTab === 'transactions' && (
        <div className="space-y-4">
          {/* Multi-Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search description or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Account Filter */}
              <select
                value={selectedAccFilter}
                onChange={(e) => setSelectedAccFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Bank / Cash Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.accountName}>{a.accountName}</option>)}
              </select>

              {/* Transaction Type Filter */}
              <select
                value={selectedTxTypeFilter}
                onChange={(e) => setSelectedTxTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Transaction Types</option>
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="Customer Receipt">Customer Receipt</option>
                <option value="Vendor Payment">Vendor Payment</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Ref #</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Account</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right font-bold">Amount</th>
                  <th className="p-3.5 text-right">Reconciled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-indigo-600 font-bold">{t.referenceNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{t.description}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{t.accountName}</td>
                    <td className="p-3.5"><Badge variant="neutral">{t.txType}</Badge></td>
                    <td className="p-3.5 text-slate-400">{t.date}</td>
                    <td className={`p-3.5 text-right font-extrabold ${t.txType === 'Deposit' || t.txType === 'Customer Receipt' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.txType === 'Deposit' || t.txType === 'Customer Receipt' ? '+' : '-'} ₹ {t.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <Badge variant={t.reconciliationStatus === 'Matched' ? 'success' : t.reconciliationStatus === 'Suggested' ? 'warning' : 'danger'}>
                        {t.reconciliationStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
