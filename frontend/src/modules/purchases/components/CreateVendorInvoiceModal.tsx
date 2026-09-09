import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { PurchaseOrder } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface CreateVendorInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onSuccess?: (invoiceNumber: string) => void;
}

export const CreateVendorInvoiceModal: React.FC<CreateVendorInvoiceModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const { invoicePurchaseOrder } = useApp();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to compute due date from invoice date and payment terms
  const calculateDueDate = (baseDateStr: string, terms: string): string => {
    if (!baseDateStr) return '';
    const base = new Date(baseDateStr);
    if (isNaN(base.getTime())) return baseDateStr;

    let daysToAdd = 30;
    if (terms.includes('15')) daysToAdd = 15;
    else if (terms.includes('30')) daysToAdd = 30;
    else if (terms.includes('45')) daysToAdd = 45;
    else if (terms.includes('60')) daysToAdd = 60;
    else if (terms.toLowerCase().includes('immediate') || terms.toLowerCase().includes('advance')) daysToAdd = 0;

    const due = new Date(base);
    due.setDate(due.getDate() + daysToAdd);
    return due.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (purchaseOrder && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const terms = purchaseOrder.paymentTerms || purchaseOrder.payment_terms || 'Net 30 Days';
      
      const suggestedInvNum = purchaseOrder.vendorInvoiceNumber || 
        `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      setInvoiceNumber(suggestedInvNum);
      setInvoiceDate(today);
      setPaymentTerms(terms);
      setDueDate(calculateDueDate(today, terms));
      setInvoiceAmount(purchaseOrder.amount || purchaseOrder.total_amount || 0);
      setTaxAmount(purchaseOrder.taxAmount || purchaseOrder.tax_amount || 0);
      setNotes(`Vendor invoice generated from ${purchaseOrder.poNumber || purchaseOrder.po_number || purchaseOrder.id}`);
      setError(null);
    }
  }, [purchaseOrder, isOpen]);

  const handleDateOrTermsChange = (newDate: string, newTerms: string) => {
    setInvoiceDate(newDate);
    setPaymentTerms(newTerms);
    setDueDate(calculateDueDate(newDate, newTerms));
  };

  if (!isOpen || !purchaseOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required');
      return;
    }
    if (invoiceAmount <= 0) {
      setError('Invoice amount must be greater than zero');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await invoicePurchaseOrder(purchaseOrder.id, {
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        dueDate,
        paymentTerms,
        invoiceAmount: Number(invoiceAmount),
        taxAmount: Number(taxAmount),
        notes: notes.trim(),
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess(res.invoice_number || invoiceNumber.trim());
        }
        onClose();
      } else {
        setError(res.error || 'Failed to create vendor invoice');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const poNumber = purchaseOrder.poNumber || purchaseOrder.po_number || purchaseOrder.id;
  const vendorName = purchaseOrder.vendorName || purchaseOrder.vendor_name || 'Vendor';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create Vendor Invoice</h2>
              <p className="text-xs text-purple-100 font-medium">Link official billing record to {poNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PO & Vendor Context Banner */}
        <div className="bg-purple-50/70 border-b border-purple-100/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Building className="w-4 h-4 text-purple-600" />
            <span>Vendor: <strong className="text-slate-900 font-bold">{vendorName}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>PO: <strong className="text-purple-700 font-bold">{poNumber}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <span>PO Value: <strong className="text-slate-900 font-bold">₹{(purchaseOrder.amount || purchaseOrder.total_amount || 0).toLocaleString('en-IN')}</strong></span>
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
            
            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Invoice Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-0012"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">From the physical or digital invoice sent by vendor</p>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => handleDateOrTermsChange(invoiceDate, e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                <option value="Immediate / Advance">Immediate / Advance</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => handleDateOrTermsChange(e.target.value, paymentTerms)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date <span className="text-slate-400 font-normal">(Auto-calculated)</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            {/* Invoice Total Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Total (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={invoiceAmount || ''}
                  onChange={(e) => setInvoiceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            {/* Tax Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax / GST (₹)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={taxAmount || ''}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional internal comments or payment routing instructions..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-none"
            />
          </div>

          {/* Workflow Note */}
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
            <strong>Accounting Notice:</strong> Recording this Vendor Invoice recognizes the Accounts Payable liability. It will update vendor balance and enable payment recording through Banking.
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
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Creating Invoice...' : 'Create Vendor Invoice'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
