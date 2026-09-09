import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Building, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  FileCheck,
  Hash
} from 'lucide-react';
import { PurchaseOrder } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface RecordPurchasePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onSuccess?: () => void;
}

export const RecordPurchasePaymentModal: React.FC<RecordPurchasePaymentModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const { recordPurchasePayment, bankAccounts } = useApp();

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [bankAccountId, setBankAccountId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poTotal = purchaseOrder?.vendorInvoiceAmount || purchaseOrder?.amount || purchaseOrder?.total_amount || 0;
  const paidAmount = purchaseOrder?.paidAmount || purchaseOrder?.paid_amount || 0;
  const amountDue = purchaseOrder?.amountDue !== undefined ? purchaseOrder.amountDue : Math.max(0, poTotal - paidAmount);

  useEffect(() => {
    if (purchaseOrder && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const suggestedRef = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      setPaymentDate(today);
      setPaymentAmount(amountDue);
      setPaymentMethod('Bank Transfer');
      setReferenceNumber(suggestedRef);
      setNotes(`Payment for ${purchaseOrder.vendorInvoiceNumber || purchaseOrder.poNumber || purchaseOrder.id}`);
      setError(null);

      // Default to first bank account if available
      if (bankAccounts && bankAccounts.length > 0) {
        setBankAccountId(bankAccounts[0].id);
      } else {
        setBankAccountId('');
      }
    }
  }, [purchaseOrder, isOpen, amountDue, bankAccounts]);

  if (!isOpen || !purchaseOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }
    if (paymentAmount > amountDue + 0.01) {
      setError(`Payment cannot exceed outstanding balance of ₹${amountDue.toLocaleString('en-IN')}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await recordPurchasePayment(purchaseOrder.id, {
        amount: Number(paymentAmount),
        paymentDate,
        paymentMethod,
        bankAccountId: bankAccountId || undefined,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        setError(res.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  const poNumber = purchaseOrder.poNumber || purchaseOrder.po_number || purchaseOrder.id;
  const invoiceNumber = purchaseOrder.vendorInvoiceNumber || purchaseOrder.vendor_invoice_number || 'INV-PENDING';
  const vendorName = purchaseOrder.vendorName || purchaseOrder.vendor_name || 'Vendor';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Vendor Payment</h2>
              <p className="text-xs text-emerald-100 font-medium">Settle Accounts Payable against Invoice {invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Context Overview Cards */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Vendor</div>
            <div className="font-bold text-slate-900 truncate mt-0.5" title={vendorName}>{vendorName}</div>
            <div className="text-[10px] text-slate-400 truncate">{poNumber}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Invoice Total</div>
            <div className="font-bold text-slate-900 mt-0.5">₹{poTotal.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-purple-600 font-medium">{invoiceNumber}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Already Paid</div>
            <div className="font-bold text-emerald-700 mt-0.5">₹{paidAmount.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-400">Settled to date</div>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-xs">
            <div className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold">Amount Due</div>
            <div className="font-black text-emerald-900 text-sm mt-0.5">₹{amountDue.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-700 font-medium">Outstanding</div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Payment Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                {amountDue > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(amountDue)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold underline"
                  >
                    Pay Full (₹{amountDue.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min="0.01"
                  max={amountDue + 0.01}
                  step="any"
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Maximum payable: ₹{amountDue.toLocaleString('en-IN')}</p>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash (Petty Cash)</option>
                <option value="Credit Card">Corporate Credit Card</option>
              </select>
            </div>

            {/* Bank Account (from Banking module) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paid From (Bank / Cash Account)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">-- Select Bank / Cash Account --</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber ? `...${acc.accountNumber.slice(-4)}` : acc.accountType} (Bal: ₹{acc.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference Number */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction / UTR / Cheque Reference #
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR-881920391 or CHQ-00214"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes for finance audit..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Real movement note */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Banking & AP Sync:</strong> This payment automatically reduces vendor payable balance in Accounts and logs a debit in the selected bank account ledger.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || amountDue <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Recording Payment...' : `Record Payment (₹${paymentAmount.toLocaleString('en-IN')})`}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
