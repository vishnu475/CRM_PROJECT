import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, DollarSign } from 'lucide-react';
import { AccountingVoucher, AccountingVoucherType } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const VoucherScreensManager: React.FC = () => {
  const [activeType, setActiveType] = useState<AccountingVoucherType | 'All'>('All');
  
  const [vouchers, setVouchers] = useState<AccountingVoucher[]>([
    { id: 'vchr-1', voucherNumber: 'RCV-2026-901', voucherType: 'Receipt', partyName: 'Globex Corp (Customer)', partyType: 'Customer', date: '2026-08-10', accountCode: '1100', accountName: 'Trade Receivables (AR)', amount: 450000, narration: 'Invoice payment received via HDFC NetBanking', status: 'Posted' },
    { id: 'vchr-2', voucherNumber: 'PMT-2026-402', voucherType: 'Payment', partyName: 'Office Supplies Ltd (Vendor)', partyType: 'Vendor', date: '2026-08-09', accountCode: '2100', accountName: 'Trade Payables (AP)', amount: 125000, narration: 'Vendor bill settlement against PO-882', status: 'Posted' },
    { id: 'vchr-3', voucherNumber: 'CNT-2026-101', voucherType: 'Contra', partyName: 'HDFC Corporate Bank', partyType: 'Bank', date: '2026-08-05', accountCode: '1200', accountName: 'HDFC Bank Account', amount: 50000, narration: 'Cash deposit into HDFC Corporate Account', status: 'Posted' },
    { id: 'vchr-4', voucherNumber: 'JRN-2026-105', voucherType: 'Journal', partyName: 'General Ledger Adjustment', partyType: 'General', date: '2026-08-01', accountCode: '5100', accountName: 'Office Equipment Depreciation', amount: 32000, narration: 'Monthly equipment depreciation posting', status: 'Posted' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    voucherType: 'Receipt' as AccountingVoucherType,
    partyName: '',
    partyType: 'Customer' as const,
    amount: 50000,
    narration: ''
  });

  const handleCreateVoucher = () => {
    const prefix = newVoucher.voucherType === 'Receipt' ? 'RCV' : newVoucher.voucherType === 'Payment' ? 'PMT' : newVoucher.voucherType === 'Contra' ? 'CNT' : 'JRN';
    const created: AccountingVoucher = {
      id: `vchr-${vouchers.length + 1}`,
      voucherNumber: `${prefix}-2026-00${vouchers.length + 1}`,
      voucherType: newVoucher.voucherType,
      partyName: newVoucher.partyName || 'Globex Corp',
      partyType: newVoucher.partyType,
      date: new Date().toISOString().split('T')[0],
      accountCode: newVoucher.partyType === 'Customer' ? '1100' : newVoucher.partyType === 'Vendor' ? '2100' : '1200',
      accountName: newVoucher.partyType === 'Customer' ? 'Trade Receivables (AR)' : newVoucher.partyType === 'Vendor' ? 'Trade Payables (AP)' : 'Bank Account',
      amount: Number(newVoucher.amount),
      narration: newVoucher.narration || 'Voucher Posting',
      status: 'Posted'
    };
    setVouchers([created, ...vouchers]);
    setIsModalOpen(false);
  };

  const filteredVouchers = vouchers.filter(v => activeType === 'All' || v.voucherType === activeType);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-indigo-600" size={18} /> Financial Voucher Screens & Postings
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Receipt, Payment, Contra, and Journal voucher entry screens.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Post New Voucher
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 text-xs">
        {(['All', 'Receipt', 'Payment', 'Contra', 'Journal'] as const).map(vt => (
          <button
            key={vt}
            onClick={() => setActiveType(vt)}
            className={`px-3.5 py-1.5 font-bold border-b-2 transition-colors ${
              activeType === vt ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {vt === 'All' ? 'All Vouchers' : `${vt} Voucher`}
          </button>
        ))}
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Voucher #</th>
              <th className="p-3.5">Voucher Type</th>
              <th className="p-3.5">Party Reference</th>
              <th className="p-3.5">Ledger Account</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5 text-right font-bold">Amount</th>
              <th className="p-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVouchers.map(v => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono text-indigo-600 font-bold">{v.voucherNumber}</td>
                <td className="p-3.5 font-bold text-slate-900">{v.voucherType} Voucher</td>
                <td className="p-3.5 font-semibold text-slate-700">{v.partyName}</td>
                <td className="p-3.5 font-mono text-slate-500">{v.accountCode} - {v.accountName}</td>
                <td className="p-3.5 text-slate-400">{v.date}</td>
                <td className="p-3.5 text-right font-extrabold text-emerald-600">₹ {v.amount.toLocaleString()}</td>
                <td className="p-3.5 text-right"><Badge variant="success">{v.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Post Voucher Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Post New Financial Voucher">
        <div className="space-y-4 text-xs">
          <Select
            label="Voucher Screen Type"
            value={newVoucher.voucherType}
            onChange={(e) => setNewVoucher({ ...newVoucher, voucherType: e.target.value as AccountingVoucherType })}
            options={[
              { label: 'Receipt Voucher (Customer Inbound)', value: 'Receipt' },
              { label: 'Payment Voucher (Vendor Outbound)', value: 'Payment' },
              { label: 'Contra Voucher (Bank to Cash)', value: 'Contra' },
              { label: 'Journal Voucher (General Posting)', value: 'Journal' }
            ]}
          />
          <Input label="Party / Reference Name" placeholder="e.g. Globex Corp" value={newVoucher.partyName} onChange={(e) => setNewVoucher({ ...newVoucher, partyName: e.target.value })} />
          <Input label="Amount (₹)" type="number" value={newVoucher.amount} onChange={(e) => setNewVoucher({ ...newVoucher, amount: Number(e.target.value) })} />
          <Input label="Narration / Description" placeholder="Add transaction narration..." value={newVoucher.narration} onChange={(e) => setNewVoucher({ ...newVoucher, narration: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateVoucher}>Post Voucher Entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
