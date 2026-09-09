import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, SalesOrder, SalesOrderItem } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { ShoppingCart, CheckCircle2, Building2, Calendar, FileText, X, AlertCircle } from 'lucide-react';

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export const SalesOrderModal: React.FC<SalesOrderModalProps> = ({
  isOpen,
  onClose,
  quotation,
}) => {
  const { addSalesOrder, salesOrders } = useApp();

  const [date, setDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Standard 30 days net upon invoice');
  const [deliveryNotes, setDeliveryNotes] = useState('Standard delivery within 14 business days');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (quotation) {
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentTerms(quotation.terms || 'Standard 30 days net upon invoice');
      setDeliveryNotes('Standard delivery within 14 business days');
      setNotes(`Generated from Accepted Quotation ${quotation.quoteNumber}`);
      setError('');
    }
  }, [quotation, isOpen]);

  if (!isOpen || !quotation) return null;

  // Validation: Check if quotation is accepted
  const isAccepted = quotation.status === 'Accepted' || quotation.status === 'Approved';

  // Duplicate Check
  const existingOrder = salesOrders.find(so => so.quotationId === quotation.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAccepted) {
      setError(`Cannot create Sales Order from quotation in "${quotation.status}" status. Quotation must be Accepted.`);
      return;
    }

    if (existingOrder) {
      setError(`Sales Order ${existingOrder.soNumber} already exists for this quotation.`);
      return;
    }

    const soNum = `SO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
    const payload: Omit<SalesOrder, 'id'> = {
      soNumber: soNum,
      quotationId: quotation.id,
      quoteNumber: quotation.quoteNumber,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      opportunityId: quotation.opportunityId,
      contactId: quotation.contactId,
      date: date || new Date().toISOString().split('T')[0],
      totalAmount: quotation.amount,
      subtotal: quotation.subtotal || quotation.amount,
      taxAmount: quotation.taxAmount || 0,
      discountAmount: quotation.discountAmount || 0,
      fulfillmentStatus: 'Pending',
      status: 'Confirmed',
      paymentTerms,
      deliveryNotes,
      notes,
      items: quotation.items?.map(qi => ({
        productId: qi.productId,
        productName: qi.productName,
        quantity: qi.quantity,
        unitPrice: qi.unitPrice,
        taxRate: qi.taxRate,
        total: qi.total
      }))
    };

    const res = await addSalesOrder(payload);
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
                <ShoppingCart size={20} className="text-indigo-600" />
                Issue Sales Order from Quotation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm contract fulfillment details and convert accepted commercial quote into a binding Sales Order.
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

        {existingOrder && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>This quotation already has an active Sales Order: <strong>{existingOrder.soNumber}</strong>. Duplicate creation is blocked.</span>
          </div>
        )}

        {/* Source Quotation Summary Card */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <div className="font-bold text-[#0f172a] flex items-center gap-2">
              <span className="font-mono text-indigo-700">{quotation.quoteNumber}</span>
              <span>— {quotation.customerName}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {quotation.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-100/80 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block">Quote Date</span>
              <span className="font-semibold text-slate-800">{quotation.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Accepted Date</span>
              <span className="font-semibold text-slate-800">{quotation.acceptedDate || 'Recently Accepted'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Line Items</span>
              <span className="font-semibold text-slate-800">{quotation.itemsCount || quotation.items?.length || 1} items</span>
            </div>
            <div>
              <span className="text-slate-400 block">Grand Total</span>
              <span className="font-extrabold text-indigo-700">{formatINR(quotation.amount)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Order Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Initial Order Status</label>
              <input
                type="text"
                disabled
                value="Confirmed"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment Terms</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Delivery Instructions & Scope Notes</label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              disabled={Boolean(existingOrder) || !isAccepted}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Confirm & Issue Sales Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
