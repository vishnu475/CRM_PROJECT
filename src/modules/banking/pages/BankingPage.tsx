import React, { useState } from 'react';
import { Landmark, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const BankingPage: React.FC = () => {
  const { bankAccounts } = useApp();
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const transactions = [
    { date: '2026-08-11', desc: 'Customer Receipt - Globex Corp', type: 'Credit', amount: 450000, acc: 'HDFC Bank' },
    { date: '2026-08-10', desc: 'Vendor Payment - Office Supplies Ltd', type: 'Debit', amount: 125000, acc: 'HDFC Bank' },
    { date: '2026-08-08', desc: 'Petty Cash Deposit', type: 'Credit', amount: 50000, acc: 'Axis Cash Account' }
  ];

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
          <Button variant="outline" size="sm" onClick={() => setIsTransferOpen(true)}>
            <ArrowRightLeft size={14} /> Fund Transfer
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsReconcileOpen(true)}>
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

      {/* Transactions History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Bank & Cash Transactions</h3>
        <div className="divide-y divide-slate-100 text-xs">
          {transactions.map((tx, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{tx.desc}</p>
                <p className="text-[10px] text-slate-400">{tx.acc} • {tx.date}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'Credit' ? '+' : '-'} ₹ {tx.amount.toLocaleString()}
                </p>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{tx.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reconciliation Modal */}
      <Modal isOpen={isReconcileOpen} onClose={() => setIsReconcileOpen(false)} title="Bank Statement Reconciliation">
        <div className="space-y-4 text-xs">
          <Select
            label="Select Bank Account"
            options={[
              { label: 'HDFC Corporate Account', value: 'hdfc' },
              { label: 'Axis Cash Account', value: 'axis' }
            ]}
          />
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 space-y-1">
            <p>• Ledger Cash Book Balance: ₹ 4,500,000</p>
            <p>• Statement Import Balance: ₹ 4,500,000</p>
            <p className="font-bold text-emerald-600">Status: Perfectly Reconciled (Diff: ₹ 0)</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsReconcileOpen(false)}>Close</Button>
            <Button variant="primary" onClick={() => setIsReconcileOpen(false)}>Run Automated Matcher</Button>
          </div>
        </div>
      </Modal>

      {/* Inter-Account Transfer Modal */}
      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Inter-Account Fund Transfer">
        <div className="space-y-4 text-xs">
          <Select
            label="From Account"
            options={[
              { label: 'HDFC Corporate Account', value: 'hdfc' }
            ]}
          />
          <Select
            label="To Account"
            options={[
              { label: 'Axis Cash Account', value: 'axis' }
            ]}
          />
          <Input label="Transfer Amount (₹)" type="number" defaultValue="50000" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsTransferOpen(false)}>Confirm Transfer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
