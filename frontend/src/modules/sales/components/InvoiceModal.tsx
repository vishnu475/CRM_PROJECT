import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { SalesOrder, Invoice } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { FileText, CheckCircle2, Building2, Calendar, X, AlertCircle } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder: SalesOrder | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
}) => {
  const { addInvoice, invoices } = useApp();

  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 15 days');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (salesOrder) {
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
      setPaymentTerms(salesOrder.paymentTerms || 'Payment due within 15 days of invoice date');
      setNotes(`Commercial Tax Invoice for Sales Order ${salesOrder.soNumber}`);
      setError('');
    }
  }, [salesOrder, isOpen]);

  if (!isOpen || !salesOrder) return null;

  // Duplicate check
  const existingInvoice = invoices.find(inv => inv.salesOrderId === salesOrder.id);

  // Status validation: must be Confirmed / Processing / Delivered (not Draft or Cancelled)
  const isEligible = salesOrder.status !== 'Draft' && salesOrder.status !== 'Cancelled' && salesOrder.fulfillmentStatus !== 'Cancelled';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) {
      setError(`Cannot issue invoice for Sales Order in "${salesOrder.status || salesOrder.fulfillmentStatus}" status. Order must be Confirmed.`);
      return;
    }

    if (existingInvoice) {
      setError(`Invoice ${existingInvoice.invoiceNumber} already exists for this Sales Order.`);
      return;
    }

    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
    const payload: Omit<Invoice, 'id'> = {
      invoiceNumber: invNum,
      salesOrderId: salesOrder.id,
      salesOrderNumber: salesOrder.soNumber,
      quotationId: salesOrder.quotationId,
      quoteNumber: salesOrder.quoteNumber,
      opportunityId: salesOrder.opportunityId,
      customerId: salesOrder.customerId || 'CUST-001',
      customerName: salesOrder.customerName,
      date: date || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      amount: salesOrder.totalAmount,
      subtotal: salesOrder.subtotal || salesOrder.totalAmount,
      taxAmount: salesOrder.taxAmount || 0,
      discountAmount: salesOrder.discountAmount || 0,
      paidAmount: 0,
      status: 'Issued',
      paymentTerms,
      notes,
      items: salesOrder.items?.map(soi => ({
        productId: soi.productId,
        productName: soi.productName,
        quantity: soi.quantity,
        unitPrice: soi.unitPrice,
        taxRate: soi.taxRate,
        total: soi.total
      }))
    };

    const res = await addInvoice(payload);
    if (res) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Post Commercial Tax Invoice
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate customer tax invoice from confirmed sales order and register accounts payable/receivable balance.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {existingInvoice && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>An Invoice (<strong>{existingInvoice.invoiceNumber}</strong>) already exists for this Sales Order. Duplicate creation is blocked.</span>
          </div>
        )}

        {/* Source Sales Order Summary Card */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <div className="font-bold text-[#0f172a] flex items-center gap-2">
              <span className="font-mono text-blue-700">{salesOrder.soNumber}</span>
              <span>— {salesOrder.customerName}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {salesOrder.status || 'Confirmed'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-100/80 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block">Order Date</span>
              <span className="font-semibold text-slate-800">{salesOrder.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Source Quote</span>
              <span className="font-semibold text-slate-800">{salesOrder.quoteNumber || 'Direct Order'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Fulfillment</span>
              <span className="font-semibold text-slate-800">{salesOrder.fulfillmentStatus || 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Invoice Amount</span>
              <span className="font-extrabold text-blue-700">{formatINR(salesOrder.totalAmount)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment & Banking Terms</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Invoice Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(existingInvoice) || !isEligible}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Issue Tax Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
