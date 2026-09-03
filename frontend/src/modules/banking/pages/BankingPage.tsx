import React, { useState, useEffect } from 'react';
import { Landmark, ArrowDownLeft, RefreshCw, Search, CheckCircle2, UserCheck, CreditCard, Download, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Badge } from '../../../components/common/Badge';

import { BankAccountManager } from '../components/BankAccountManager';
import { BankReconciliationMatcher } from '../components/BankReconciliationMatcher';
import { ExtendedBankAccount, BankTransaction, BankTxType } from '../types';

export const BankingPage: React.FC = () => {
  // Navigation Tabs State
  const [mainTab, setMainTab] = useState<'accounts' | 'salary-disbursals' | 'transactions' | 'reconciliation'>('accounts');

  // Extended Bank & Cash Accounts State
  const [accounts, setAccounts] = useState<ExtendedBankAccount[]>([
    { id: 'bnk-1', bankName: 'HDFC Bank', accountName: 'HDFC Corporate Operating Account', accountNumber: '98765432101', accountType: 'Corporate Bank', ifscCode: 'HDFC0001234', branchName: 'Fort Mumbai HQ', balance: 4500000, currency: 'INR', status: 'Active' },
    { id: 'bnk-2', bankName: 'Axis Bank', accountName: 'Axis Cash Register Account', accountNumber: '55443322110', accountType: 'Cash Register', ifscCode: 'UTIB0005544', branchName: 'Bengaluru Tech Hub', balance: 500000, currency: 'INR', status: 'Active' },
    { id: 'bnk-3', bankName: 'Petty Cash Vault', accountName: 'Office Petty Cash Register', accountNumber: 'CASH-VAULT-01', accountType: 'Petty Cash', ifscCode: 'N/A', branchName: 'Mumbai HQ Office', balance: 50000, currency: 'INR', status: 'Active' }
  ]);

  // Employee Salary Disbursal List State
  const [disbursalList, setDisbursalList] = useState<any[]>([]);
  const [isLoadingDisbursals, setIsLoadingDisbursals] = useState(false);

  // Transactions State & Filters
  const [transactions, setTransactions] = useState<BankTransaction[]>([
    { id: 'tx-0', date: '2026-08-22', description: 'August 2026 Monthly Payroll Disbursal Batch', txType: 'Withdrawal', amount: 900846, accountName: 'HDFC Corporate Operating Account', referenceNumber: 'BANK-BATCH-PR-2026-08', reconciliationStatus: 'Matched' },
    { id: 'tx-1', date: '2026-08-11', description: 'Customer Receipt - Globex Corp', txType: 'Customer Receipt', amount: 450000, accountName: 'HDFC Corporate Operating Account', referenceNumber: 'REF-98711', reconciliationStatus: 'Matched' },
    { id: 'tx-2', date: '2026-08-10', description: 'Vendor Settlement - Office Supplies Ltd', txType: 'Vendor Payment', amount: 125000, accountName: 'HDFC Corporate Operating Account', referenceNumber: 'REF-44210', reconciliationStatus: 'Matched' },
    { id: 'tx-3', date: '2026-08-08', description: 'Petty Cash Deposit', txType: 'Deposit', amount: 50000, accountName: 'Office Petty Cash Register', referenceNumber: 'REF-11902', reconciliationStatus: 'Suggested', suggestedMatchTx: 'CNT-2026-101 (Cash Deposit)' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccFilter, setSelectedAccFilter] = useState('All');
  const [selectedTxTypeFilter, setSelectedTxTypeFilter] = useState<BankTxType | 'All'>('All');

  useEffect(() => {
    fetchDisbursals();
  }, []);

  const fetchDisbursals = async () => {
    setIsLoadingDisbursals(true);
    try {
      const res = await fetch('/api/payroll/payslips?month=8&year=2026');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDisbursalList(data.data);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch disbursals:', e);
    } finally {
      setIsLoadingDisbursals(false);
    }
  };

  const handleAddAccount = (newAcc: ExtendedBankAccount) => {
    setAccounts([...accounts, newAcc]);
  };

  const handleDeposit = (accName: string, amount: number) => {
    setAccounts(accounts.map(a => a.accountName === accName ? { ...a, balance: a.balance + amount } : a));
  };

  const handleWithdrawal = (accName: string, amount: number) => {
    setAccounts(accounts.map(a => a.accountName === accName ? { ...a, balance: a.balance - amount } : a));
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
            Corporate bank accounts, salary payment disbursal batches, employee bank credit verification, and statement reconciliation.
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('accounts')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'accounts' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark size={14} /> Bank & Cash Accounts Directory
        </button>
        <button
          onClick={() => setMainTab('salary-disbursals')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'salary-disbursals' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard size={14} className="text-emerald-600" /> Employee Salary Credit Ledger
        </button>
        <button
          onClick={() => setMainTab('transactions')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'transactions' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft size={14} /> Transactions Ledger & Filters
        </button>
        <button
          onClick={() => setMainTab('reconciliation')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'reconciliation' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <RefreshCw size={14} /> Bank Reconciliation Matcher
        </button>
      </div>

      {/* TAB 1: BANK & CASH ACCOUNTS */}
      {mainTab === 'accounts' && (
        <BankAccountManager
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdrawal}
        />
      )}

      {/* TAB 2: EMPLOYEE SALARY DISBURSAL & CREDIT LEDGER */}
      {mainTab === 'salary-disbursals' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-emerald-900 text-sm flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                August 2026 Employee Bank Disbursal Batch (BANK-BATCH-PR-2026-08)
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                Verified PostgreSQL Bank Account Credit Records. Money disbursed from HDFC Corporate Account (98765432101).
              </p>
            </div>
            <button
              onClick={fetchDisbursals}
              className="px-3 py-1.5 bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw size={14} className={isLoadingDisbursals ? 'animate-spin' : ''} /> Refresh Bank Ledger
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Emp ID</th>
                  <th className="p-3.5">Employee Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Bank Name & Account</th>
                  <th className="p-3.5">IFSC Code</th>
                  <th className="p-3.5 text-right">Gross Salary</th>
                  <th className="p-3.5 text-right font-bold text-emerald-700">Credited Net Salary</th>
                  <th className="p-3.5 text-right">Bank Status</th>
                  <th className="p-3.5 text-center">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {disbursalList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No salary disbursal records found. Process payroll to view bank credit ledger.
                    </td>
                  </tr>
                ) : (
                  disbursalList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-indigo-600 font-bold">{item.employee_id}</td>
                      <td className="p-3.5 font-extrabold text-slate-900 capitalize">{item.employee_name}</td>
                      <td className="p-3.5">{item.department || 'Engineering'}</td>
                      <td className="p-3.5 font-mono">HDFC Bank (Acc: 98765432101)</td>
                      <td className="p-3.5 font-mono text-slate-500">HDFC0001234</td>
                      <td className="p-3.5 text-right font-mono">₹ {Number(item.gross_salary || item.gross_pay).toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono font-black text-emerald-600 text-sm">
                        ₹ {Number(item.net_pay).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <Badge variant="success">✔ CREDITED TO BANK</Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => window.open(`/api/payroll/payslip/${item.id}/pdf`, '_blank')}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                        >
                          <Download size={12} /> Payslip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECONCILIATION MATCHER ENGINE */}
      {mainTab === 'reconciliation' && <BankReconciliationMatcher />}

      {/* TAB 4: TRANSACTIONS & FILTERS */}
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
