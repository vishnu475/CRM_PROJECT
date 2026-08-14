import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles, History, FileText } from 'lucide-react';
import { BankTransaction, ReconciliationHistoryLog } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const BankReconciliationMatcher: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'Matched' | 'Unmatched' | 'Suggested' | 'All'>('All');

  const [statementTxs, setStatementTxs] = useState<BankTransaction[]>([
    { id: 'tx-1', date: '2026-08-10', description: 'HDFC NEFT Customer Inbound - Globex Corp', txType: 'Deposit', amount: 450000, accountName: 'HDFC Corporate Bank Account', referenceNumber: 'REF-98711', reconciliationStatus: 'Matched' },
    { id: 'tx-2', date: '2026-08-09', description: 'Vendor Outbound Settlement - Office Supplies Ltd', txType: 'Withdrawal', amount: 125000, accountName: 'HDFC Corporate Bank Account', referenceNumber: 'REF-44210', reconciliationStatus: 'Matched' },
    { id: 'tx-3', date: '2026-08-08', description: 'Online Gateway Settlement - RazorPay Inbound', txType: 'Deposit', amount: 85000, accountName: 'HDFC Corporate Bank Account', referenceNumber: 'REF-11902', reconciliationStatus: 'Suggested', suggestedMatchTx: 'INV-2026-088 (RazorPay Batch Settlement)' },
    { id: 'tx-4', date: '2026-08-07', description: 'Unmatched Bank Charge / Service Fee', txType: 'Withdrawal', amount: 1500, accountName: 'HDFC Corporate Bank Account', referenceNumber: 'REF-99011', reconciliationStatus: 'Unmatched' }
  ]);

  const historyLogs: ReconciliationHistoryLog[] = [
    { id: 'rec-1', accountName: 'HDFC Corporate Bank Account', statementDate: '2026-07-31', statementBalance: 4500000, glBalance: 4500000, matchedCount: 42, status: 'Reconciled', reconciledBy: 'Michael Brown (Finance Head)' },
    { id: 'rec-2', accountName: 'Axis Cash Account', statementDate: '2026-07-31', statementBalance: 50000, glBalance: 50000, matchedCount: 12, status: 'Reconciled', reconciledBy: 'John Doe (CEO)' }
  ];

  const handleConfirmMatch = (id: string) => {
    setStatementTxs(statementTxs.map(t => t.id === id ? { ...t, reconciliationStatus: 'Matched' } : t));
  };

  const filteredTxs = statementTxs.filter(t => activeFilter === 'All' || t.reconciliationStatus === activeFilter);

  const matchedCount = statementTxs.filter(t => t.reconciliationStatus === 'Matched').length;
  const unmatchedCount = statementTxs.filter(t => t.reconciliationStatus === 'Unmatched').length;
  const suggestedCount = statementTxs.filter(t => t.reconciliationStatus === 'Suggested').length;

  return (
    <div className="space-y-6">
      {/* Visual Matching Flow Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="text-indigo-600" size={18} /> Automated Bank Statement Matcher Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Bank Statement Import ➔ General Ledger Matcher (Matched | Unmatched | AI Suggested).</p>
          </div>
          <Button variant="primary" size="sm">
            <Sparkles size={14} /> Run Auto-Matcher
          </Button>
        </div>

        {/* 3 State Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div
            onClick={() => setActiveFilter('Matched')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${activeFilter === 'Matched' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200'}`}
          >
            <div className="flex justify-between items-center font-bold text-emerald-800">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} /> Matched Transactions</span>
              <span className="text-xl">{matchedCount}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Bank statement entries perfectly reconciled with GL entries.</p>
          </div>

          <div
            onClick={() => setActiveFilter('Suggested')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${activeFilter === 'Suggested' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200'}`}
          >
            <div className="flex justify-between items-center font-bold text-amber-800">
              <span className="flex items-center gap-1.5"><Sparkles size={16} /> AI Suggested Matches</span>
              <span className="text-xl">{suggestedCount}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Potential matches identified based on amount and reference code.</p>
          </div>

          <div
            onClick={() => setActiveFilter('Unmatched')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${activeFilter === 'Unmatched' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20' : 'bg-slate-50 border-slate-200'}`}
          >
            <div className="flex justify-between items-center font-bold text-rose-800">
              <span className="flex items-center gap-1.5"><AlertCircle size={16} /> Unmatched Entries</span>
              <span className="text-xl">{unmatchedCount}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Bank entries requiring manual voucher posting or investigation.</p>
          </div>
        </div>
      </div>

      {/* Statement Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800">Statement Transactions (Filter: {activeFilter})</span>
          <button onClick={() => setActiveFilter('All')} className="text-indigo-600 font-semibold hover:underline">Reset Filter</button>
        </div>

        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Ref #</th>
              <th className="p-3.5">Statement Description</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5 font-bold">Amount</th>
              <th className="p-3.5">Reconciliation Match Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTxs.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono text-indigo-600 font-bold">{t.referenceNumber}</td>
                <td className="p-3.5 font-bold text-slate-900">{t.description}</td>
                <td className="p-3.5 font-semibold">{t.txType}</td>
                <td className={`p-3.5 font-extrabold ${t.txType === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.txType === 'Deposit' ? '+' : '-'} ₹ {t.amount.toLocaleString()}
                </td>
                <td className="p-3.5">
                  <Badge variant={t.reconciliationStatus === 'Matched' ? 'success' : t.reconciliationStatus === 'Suggested' ? 'warning' : 'danger'}>
                    {t.reconciliationStatus}
                  </Badge>
                  {t.suggestedMatchTx && <span className="block text-[10px] text-amber-700 font-mono mt-0.5">Match: {t.suggestedMatchTx}</span>}
                </td>
                <td className="p-3.5 text-right">
                  {t.reconciliationStatus === 'Suggested' && (
                    <Button variant="primary" size="sm" onClick={() => handleConfirmMatch(t.id)}>
                      <CheckCircle2 size={12} /> Confirm Match
                    </Button>
                  )}
                  {t.reconciliationStatus === 'Unmatched' && (
                    <Button variant="outline" size="sm">
                      Create Voucher &rarr;
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reconciliation History Log */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <History size={16} className="text-indigo-600" /> Statement Reconciliation Audit History
        </h3>

        <div className="space-y-2 text-xs">
          {historyLogs.map(log => (
            <div key={log.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">{log.accountName} — Statement as of {log.statementDate}</p>
                <p className="text-[10px] text-slate-500">Reconciled by {log.reconciledBy} • {log.matchedCount} line items matched</p>
              </div>
              <Badge variant="success">{log.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
