import React, { useState } from 'react';
import { FileText, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const LedgerPage: React.FC = () => {
  const { journalEntries } = useApp();
  const [activeTab, setActiveTab] = useState<'journals' | 'vouchers'>('journals');
  const [isPostJournalOpen, setIsPostJournalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Journal form state
  const [debitAmount, setDebitAmount] = useState(50000);
  const [creditAmount, setCreditAmount] = useState(50000);
  const isBalanced = debitAmount === creditAmount && debitAmount > 0;

  const vouchers = [
    { no: 'RCV-901', type: 'Receipt Voucher', party: 'Globex Corp', amount: 450000, date: '2026-08-10', status: 'Posted' },
    { no: 'PMT-402', type: 'Payment Voucher', party: 'Office Supplies Ltd', amount: 125000, date: '2026-08-09', status: 'Posted' },
    { no: 'JRN-105', type: 'Journal Voucher', party: 'Salary Depreciation', amount: 320000, date: '2026-08-01', status: 'Posted' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-emerald-600" size={24} />
            General Ledger & Double-Entry Postings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable double-entry journal postings, receipt/payment vouchers, and debit/credit line balances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsVoucherModalOpen(true)}>
            <Plus size={14} /> New Voucher
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsPostJournalOpen(true)}>
            <Plus size={14} /> Post Journal Entry
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('journals')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'journals' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          General Journal Entries
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'vouchers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Accounting Vouchers
        </button>
      </div>

      {activeTab === 'journals' ? (
        <div className="space-y-4">
          {journalEntries.map((je) => (
            <div key={je.id} className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-indigo-600 font-bold text-sm">{je.entryNumber}</span>
                <span className="text-slate-400 font-medium">{je.date}</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">{je.narration}</p>
              <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                <div className="flex gap-4">
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><ArrowDownLeft size={14} /> Total Debit: ₹ {je.debitTotal.toLocaleString()}</span>
                  <span className="text-blue-600 font-bold flex items-center gap-1"><ArrowUpRight size={14} /> Total Credit: ₹ {je.creditTotal.toLocaleString()}</span>
                </div>
                <Badge variant="success">{je.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Voucher #</th>
                <th className="p-3.5">Voucher Type</th>
                <th className="p-3.5">Party / Reference</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map(v => (
                <tr key={v.no} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-indigo-600 font-bold">{v.no}</td>
                  <td className="p-3.5 font-bold text-slate-900">{v.type}</td>
                  <td className="p-3.5">{v.party}</td>
                  <td className="p-3.5 text-slate-400">{v.date}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-600">₹ {v.amount.toLocaleString()}</td>
                  <td className="p-3.5 text-right"><Badge variant="success">{v.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Journal Modal with Balanced Line Validation */}
      <Modal isOpen={isPostJournalOpen} onClose={() => setIsPostJournalOpen(false)} title="Post Double-Entry Journal">
        <div className="space-y-4 text-xs">
          <Input label="Narration / Reference" placeholder="e.g. Sales Invoice Adjustment" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Debit Line Amount (₹)" type="number" value={debitAmount} onChange={(e) => setDebitAmount(Number(e.target.value))} />
            <Input label="Credit Line Amount (₹)" type="number" value={creditAmount} onChange={(e) => setCreditAmount(Number(e.target.value))} />
          </div>

          <div className={`p-3 rounded-lg border text-xs font-semibold ${isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            {isBalanced ? (
              <span className="flex items-center gap-1"><CheckCircle2 size={16} /> Balanced Entry: Total Debit (₹ {debitAmount}) equals Total Credit (₹ {creditAmount})</span>
            ) : (
              <span className="flex items-center gap-1"><AlertCircle size={16} /> Unbalanced Entry: Debit and Credit totals must be equal to post!</span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPostJournalOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={!isBalanced} onClick={() => setIsPostJournalOpen(false)}>Post Balanced Entry</Button>
          </div>
        </div>
      </Modal>

      {/* Voucher Modal */}
      <Modal isOpen={isVoucherModalOpen} onClose={() => setIsVoucherModalOpen(false)} title="Create Accounting Voucher">
        <div className="space-y-4 text-xs">
          <Select
            label="Voucher Type"
            options={[
              { label: 'Receipt Voucher', value: 'rcv' },
              { label: 'Payment Voucher', value: 'pmt' },
              { label: 'Contra Voucher', value: 'cnt' },
              { label: 'Journal Voucher', value: 'jrn' }
            ]}
          />
          <Input label="Party / Reference Name" placeholder="e.g. Globex Corp" />
          <Input label="Voucher Amount (₹)" type="number" defaultValue="50000" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsVoucherModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsVoucherModalOpen(false)}>Create Voucher</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
