import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Invoice } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import {
  DollarSign,
  Calendar,
  CreditCard,
  Landmark,
  X,
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileCheck2
} from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const { recordInvoicePayment, bankAccounts } = useApp();

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const outstandingBalance = invoice 
    ? Math.max(0, invoice.amount - (invoice.paidAmount || 0))
    : 0;

  useEffect(() => {
    if (invoice && isOpen) {
      const bal = Math.max(0, invoice.amount - (invoice.paidAmount || 0));
      setPaymentAmount(bal);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(invoice.paymentMethod || 'Bank Transfer');
      setReferenceNumber('');
      setNotes(`Payment received against invoice ${invoice.invoiceNumber}`);
      setError('');

      if (invoice.bankAccountId) {
        setBankAccountId(invoice.bankAccountId);
      } else if (bankAccounts.length > 0) {
        setBankAccountId(bankAccounts[0].id);
      }
    }
  }, [invoice, isOpen, bankAccounts]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentAmount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (paymentAmount > outstandingBalance + 0.01) {
      setError(`Payment amount cannot exceed outstanding balance of ${formatINR(outstandingBalance)}.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await recordInvoicePayment(invoice.id, {
        amount: Number(paymentAmount),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod,
        bankAccountId: bankAccountId || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record invoice payment. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingAfterPayment = Math.max(0, outstandingBalance - (paymentAmount || 0));
  const willBeFullyPaid = remainingAfterPayment < 0.01;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-150 border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Record Customer Payment
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {invoice.invoiceNumber} — {invoice.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Balance Summary Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 block">Total Amount</span>
              <span className="font-bold text-slate-800 text-xs">{formatINR(invoice.amount)}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 block">Already Paid</span>
              <span className="font-semibold text-slate-600 text-xs">{formatINR(invoice.paidAmount || 0)}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <span className="text-[10px] text-amber-700 block font-semibold">Balance Due</span>
              <span className="font-extrabold text-amber-800 text-xs">{formatINR(outstandingBalance)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Payment Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={outstandingBalance}
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(outstandingBalance)}
                  className="text-[10px] text-emerald-700 font-semibold hover:underline"
                >
                  Pay Full Balance
                </button>
                <span className="text-[10px] text-slate-500">
                  {willBeFullyPaid ? 'Status: Paid' : 'Status: Partially Paid'}
                </span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="UPI">UPI Instant Remittance</option>
                <option value="Cheque">Account Payee Cheque</option>
                <option value="Cash">Cash Receipt</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Deposit To Bank Account</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {bankAccounts.length === 0 ? (
                  <option value="">Default Corporate Account</option>
                ) : (
                  bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} ({b.accountNumber.slice(-4)}) - {b.accountType || 'Current'}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Reference # & Notes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Transaction / Cheque / UTR Ref #
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-9823419082 or CHQ-002341"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment Notes / Narration</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Result preview */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 flex items-center justify-between">
            <span>Remaining balance after this payment:</span>
            <span className="font-bold font-mono text-xs">
              {formatINR(remainingAfterPayment)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || paymentAmount <= 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              {isSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

