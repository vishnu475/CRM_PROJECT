import React, { useState } from 'react';
import { FileText, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Scale, TrendingUp, Landmark, Filter, Search, Eye, RotateCcw, Calendar, Download } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { TrialBalanceView } from '../components/TrialBalanceView';
import { FinancialReportsView } from '../components/FinancialReportsView';
import { ExtendedJournalEntry, JournalEntryStatus } from '../types';

export const LedgerPage: React.FC = () => {
  const { journalEntries } = useApp();

  // Navigation Tabs for Accounting Flow: Voucher -> Journal -> Lines -> Account Ledger -> Trial Balance -> P&L / BS
  const [mainTab, setMainTab] = useState<'journals' | 'lines' | 'account_ledger' | 'trial_balance' | 'reports'>('journals');

  // Filters State
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Draft' | 'Posted' | 'Reversed'>('All');
  const [dateRange, setDateRange] = useState({ start: '2026-08-01', end: '2026-08-31' });

  // Extended Journal Entries list with multi-line items
  const [extendedJournals, setExtendedJournals] = useState<ExtendedJournalEntry[]>([
    {
      id: 'je-1',
      entryNumber: 'JRN-2026-001',
      date: '2026-08-10',
      narration: 'Customer Sales Payment Receipt against Invert-901',
      branch: 'HQ-01 (Mumbai)',
      debitTotal: 450000,
      creditTotal: 450000,
      status: 'Posted',
      lines: [
        { id: 'jl-1', accountCode: '1200', accountName: 'HDFC Corporate Bank Account', debit: 450000, credit: 0, memo: 'Inbound Bank Deposit' },
        { id: 'jl-2', accountCode: '1100', accountName: 'Trade Receivables (AR)', debit: 0, credit: 450000, memo: 'AR Account Settlement' }
      ]
    },
    {
      id: 'je-2',
      entryNumber: 'JRN-2026-002',
      date: '2026-08-09',
      narration: 'Office Rent & Utility Settlement',
      branch: 'HQ-01 (Mumbai)',
      debitTotal: 125000,
      creditTotal: 125000,
      status: 'Posted',
      lines: [
        { id: 'jl-3', accountCode: '5200', accountName: 'Rent & Premises Expense', debit: 125000, credit: 0, memo: 'Premises Rent' },
        { id: 'jl-4', accountCode: '1200', accountName: 'HDFC Corporate Bank Account', debit: 0, credit: 125000, memo: 'Outbound Bank Transfer' }
      ]
    },
    {
      id: 'je-3',
      entryNumber: 'JRN-2026-003',
      date: '2026-08-02',
      narration: 'Reversed Accrual Adjustment for Equipment Depreciation',
      branch: 'BR-02 (Bengaluru)',
      debitTotal: 32000,
      creditTotal: 32000,
      status: 'Reversed',
      reversalEntryNumber: 'REV-JRN-2026-003',
      lines: [
        { id: 'jl-5', accountCode: '5100', accountName: 'Depreciation Expense', debit: 32000, credit: 0, memo: 'Original Accrual' },
        { id: 'jl-6', accountCode: '1400', accountName: 'Accumulated Depreciation', debit: 0, credit: 32000, memo: 'Original Accrual' }
      ]
    }
  ]);

  // Modals state
  const [isPostJournalOpen, setIsPostJournalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<ExtendedJournalEntry | null>(null);

  // Post Journal Form State
  const [debitAmt, setDebitAmt] = useState(50000);
  const [creditAmt, setCreditAmt] = useState(50000);
  const isBalanced = debitAmt === creditAmt && debitAmt > 0;

  const handlePostJournal = () => {
    const created: ExtendedJournalEntry = {
      id: `je-${extendedJournals.length + 1}`,
      entryNumber: `JRN-2026-00${extendedJournals.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      narration: 'General Ledger Balancing Entry',
      branch: 'HQ-01 (Mumbai)',
      debitTotal: debitAmt,
      creditTotal: creditAmt,
      status: 'Posted',
      lines: [
        { id: 'jl-10', accountCode: '1200', accountName: 'HDFC Bank Account', debit: debitAmt, credit: 0, memo: 'Debit Line' },
        { id: 'jl-11', accountCode: '4100', accountName: 'Sales Revenue', debit: 0, credit: creditAmt, memo: 'Credit Line' }
      ]
    };
    setExtendedJournals([created, ...extendedJournals]);
    setIsPostJournalOpen(false);
  };

  const handleReverseJournal = (id: string) => {
    setExtendedJournals(extendedJournals.map(j => j.id === id ? { ...j, status: 'Reversed', reversalEntryNumber: `REV-${j.entryNumber}` } : j));
    if (selectedJournal && selectedJournal.id === id) {
      setSelectedJournal({ ...selectedJournal, status: 'Reversed', reversalEntryNumber: `REV-${selectedJournal.entryNumber}` });
    }
  };

  // Filtered Journals List
  const filteredJournals = extendedJournals.filter(j => {
    const matchesBranch = selectedBranch === 'All' || j.branch.includes(selectedBranch);
    const matchesStatus = selectedStatusFilter === 'All' || j.status === selectedStatusFilter;
    return matchesBranch && matchesStatus;
  });

  const getStatusBadgeVariant = (st: JournalEntryStatus) => {
    switch(st) {
      case 'Posted': return 'success';
      case 'Draft': return 'warning';
      case 'Reversed': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-emerald-600" size={24} />
            General Ledger & Financial Accounting Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete Double-Entry Accounting Flow: Voucher ➔ Journal ➔ Lines ➔ Account Ledger ➔ Trial Balance ➔ P&L / Balance Sheet.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsPostJournalOpen(true)}>
            <Plus size={14} /> Post Balanced Journal Entry
          </Button>
        </div>
      </div>

      {/* Main Accounting Flow Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('journals')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'journals' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} /> Journal List & Status Workflow
        </button>
        <button
          onClick={() => setMainTab('lines')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'lines' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft size={14} /> General Journal Lines
        </button>
        <button
          onClick={() => setMainTab('account_ledger')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'account_ledger' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Search size={14} /> Individual Account Ledger Timeline
        </button>
        <button
          onClick={() => setMainTab('trial_balance')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'trial_balance' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Scale size={14} /> Trial Balance (Debit = Credit)
        </button>
        <button
          onClick={() => setMainTab('reports')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'reports' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp size={14} /> Financial Statements (P&L / Balance Sheet)
        </button>
      </div>

      {/* TAB: TRIAL BALANCE */}
      {mainTab === 'trial_balance' && <TrialBalanceView />}

      {/* TAB: FINANCIAL STATEMENTS P&L / BALANCE SHEET */}
      {mainTab === 'reports' && <FinancialReportsView />}

      {/* TAB: INDIVIDUAL ACCOUNT LEDGER TIMELINE */}
      {mainTab === 'account_ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
              >
                <option value="All">All Account Ledgers</option>
                <option value="1200">1200 - HDFC Corporate Bank Account</option>
                <option value="1100">1100 - Trade Receivables (AR)</option>
                <option value="2100">2100 - Trade Payables (AP)</option>
                <option value="5200">5200 - Rent Expense</option>
              </select>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">Account Ledger Timeline & Audit Trail</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Account Ledger Postings Timeline</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">JRN-2026-001 — Customer Sales Payment Receipt</p>
                  <p className="text-[10px] text-slate-400">1200 HDFC Bank Account • 2026-08-10</p>
                </div>
                <span className="font-bold text-emerald-600 text-sm">+₹ 450,000 (Debit)</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">JRN-2026-002 — Office Rent Settlement</p>
                  <p className="text-[10px] text-slate-400">1200 HDFC Bank Account • 2026-08-09</p>
                </div>
                <span className="font-bold text-rose-600 text-sm">-₹ 125,000 (Credit)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: GENERAL JOURNAL LINES */}
      {mainTab === 'lines' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Journal #</th>
                <th className="p-3.5">Account Code</th>
                <th className="p-3.5">Account Name</th>
                <th className="p-3.5">Line Memo</th>
                <th className="p-3.5 text-right text-emerald-600">Debit (₹)</th>
                <th className="p-3.5 text-right text-blue-600">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {extendedJournals.flatMap(j => j.lines.map(line => ({ ...line, entryNumber: j.entryNumber }))).map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-indigo-600 font-bold">{l.entryNumber}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{l.accountCode}</td>
                  <td className="p-3.5 font-bold text-slate-900">{l.accountName}</td>
                  <td className="p-3.5 text-slate-500">{l.memo}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-600">{l.debit > 0 ? `₹ ${l.debit.toLocaleString()}` : '-'}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-blue-600">{l.credit > 0 ? `₹ ${l.credit.toLocaleString()}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: JOURNALS LIST & WORKFLOW */}
      {mainTab === 'journals' && (
        <div className="space-y-4">
          {/* Filters Bar: Branch, Status, Date Range */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-2.5 py-1 bg-slate-50 border rounded font-semibold text-slate-700" />
              <span className="text-slate-400">to</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-2.5 py-1 bg-slate-50 border rounded font-semibold text-slate-700" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Branches</option>
                <option value="HQ-01">HQ-01 (Mumbai)</option>
                <option value="BR-02">BR-02 (Bengaluru)</option>
                <option value="BR-03">BR-03 (Delhi)</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Posted">Posted</option>
                <option value="Draft">Draft</option>
                <option value="Reversed">Reversed</option>
              </select>

              <Button variant="outline" size="sm">
                <Download size={14} /> Export General Ledger
              </Button>
            </div>
          </div>

          {/* Journals List Cards */}
          <div className="space-y-4">
            {filteredJournals.map((je) => (
              <div key={je.id} className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-sm hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-indigo-600 font-bold text-sm mr-2">{je.entryNumber}</span>
                    <span className="text-slate-400 font-medium">• Branch: {je.branch}</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(je.status)}>Status: {je.status}</Badge>
                </div>

                <p className="text-xs text-slate-800 font-semibold">{je.narration}</p>

                <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                  <div className="flex gap-4 font-mono font-bold">
                    <span className="text-emerald-600 flex items-center gap-1"><ArrowDownLeft size={14} /> Total Debit: ₹ {je.debitTotal.toLocaleString()}</span>
                    <span className="text-blue-600 flex items-center gap-1"><ArrowUpRight size={14} /> Total Credit: ₹ {je.creditTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedJournal(je)} className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                      <Eye size={14} /> View Lines
                    </button>
                    {je.status === 'Posted' && (
                      <button onClick={() => handleReverseJournal(je.id)} className="text-rose-600 font-bold hover:underline flex items-center gap-1">
                        <RotateCcw size={14} /> Reversal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POST JOURNAL MODAL */}
      <Modal isOpen={isPostJournalOpen} onClose={() => setIsPostJournalOpen(false)} title="Post Double-Entry Journal">
        <div className="space-y-4 text-xs">
          <Input label="Narration / Reference" placeholder="e.g. Sales Invoice Adjustment" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Debit Line Amount (₹)" type="number" value={debitAmt} onChange={(e) => setDebitAmt(Number(e.target.value))} />
            <Input label="Credit Line Amount (₹)" type="number" value={creditAmt} onChange={(e) => setCreditAmt(Number(e.target.value))} />
          </div>

          <div className={`p-3 rounded-lg border text-xs font-semibold ${isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            {isBalanced ? (
              <span className="flex items-center gap-1"><CheckCircle2 size={16} /> Balanced Entry: Total Debit (₹ {debitAmt}) equals Total Credit (₹ {creditAmt})</span>
            ) : (
              <span>Unbalanced Entry! Debit and Credit totals must be equal.</span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPostJournalOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={!isBalanced} onClick={handlePostJournal}>Post Entry</Button>
          </div>
        </div>
      </Modal>

      {/* JOURNAL DETAILS & LINES MODAL */}
      {selectedJournal && (
        <Modal isOpen={!!selectedJournal} onClose={() => setSelectedJournal(null)} title={`Journal Entry: ${selectedJournal.entryNumber}`}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-200">
              <p><span className="text-slate-400">Narration:</span> <span className="font-semibold text-slate-900">{selectedJournal.narration}</span></p>
              <p><span className="text-slate-400">Branch:</span> <span className="font-semibold">{selectedJournal.branch}</span> • Date: {selectedJournal.date}</p>
              {selectedJournal.reversalEntryNumber && <p className="text-rose-600 font-bold">Reversed by: {selectedJournal.reversalEntryNumber}</p>}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 uppercase text-[9px] font-bold">
                  <tr>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Account Name</th>
                    <th className="p-2.5 text-right">Debit</th>
                    <th className="p-2.5 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedJournal.lines.map(l => (
                    <tr key={l.id}>
                      <td className="p-2.5 font-mono text-purple-600 font-bold">{l.accountCode}</td>
                      <td className="p-2.5 font-bold text-slate-900">{l.accountName}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{l.debit > 0 ? `₹ ${l.debit.toLocaleString()}` : '-'}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-blue-600">{l.credit > 0 ? `₹ ${l.credit.toLocaleString()}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedJournal(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
