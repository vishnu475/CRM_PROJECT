import React from 'react';
import { Scale, CheckCircle2, Download, Filter } from 'lucide-react';
import { TrialBalanceRow } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const TrialBalanceView: React.FC = () => {
  const rows: TrialBalanceRow[] = [
    { accountCode: '1100', accountName: 'Trade Receivables (AR)', group: 'Asset', debitBalance: 800000, creditBalance: 0 },
    { accountCode: '1200', accountName: 'HDFC Corporate Bank Account', group: 'Asset', debitBalance: 4500000, creditBalance: 0 },
    { accountCode: '1300', accountName: 'Petty Cash Account', group: 'Asset', debitBalance: 50000, creditBalance: 0 },
    { accountCode: '2100', accountName: 'Trade Payables (AP)', group: 'Liability', debitBalance: 0, creditBalance: 375000 },
    { accountCode: '3100', accountName: 'Share Capital (Equity)', group: 'Equity', debitBalance: 0, creditBalance: 5000000 },
    { accountCode: '4100', accountName: 'Software Sales Revenue', group: 'Revenue', debitBalance: 0, creditBalance: 2775000 },
    { accountCode: '5100', accountName: 'Employee Salary Expenses', group: 'Expense', debitBalance: 2800000, creditBalance: 0 }
  ];

  const totalDebit = rows.reduce((s, r) => s + r.debitBalance, 0);
  const totalCredit = rows.reduce((s, r) => s + r.creditBalance, 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Scale className="text-emerald-600" size={18} /> Trial Balance Statement (As of August 2026)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Verification of double-entry ledger balance equality (Debit = Credit).</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isBalanced ? 'success' : 'danger'}>
            {isBalanced ? 'Balanced: Debit = Credit' : 'Unbalanced!'}
          </Badge>
          <Button variant="outline" size="sm">
            <Download size={14} /> Export Trial Balance
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Account Name</th>
              <th className="p-3.5">Group</th>
              <th className="p-3.5 text-right font-bold text-emerald-600">Debit Balance (₹)</th>
              <th className="p-3.5 text-right font-bold text-blue-600">Credit Balance (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.accountCode} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono text-indigo-600 font-bold">{r.accountCode}</td>
                <td className="p-3.5 font-bold text-slate-900">{r.accountName}</td>
                <td className="p-3.5"><Badge variant="neutral">{r.group}</Badge></td>
                <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                  {r.debitBalance > 0 ? `₹ ${r.debitBalance.toLocaleString()}` : '-'}
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-blue-600">
                  {r.creditBalance > 0 ? `₹ ${r.creditBalance.toLocaleString()}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold text-slate-900 text-xs">
            <tr>
              <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider">Total Trial Balance:</td>
              <td className="p-3.5 text-right font-black text-emerald-700 text-sm">₹ {totalDebit.toLocaleString()}</td>
              <td className="p-3.5 text-right font-black text-blue-700 text-sm">₹ {totalCredit.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
