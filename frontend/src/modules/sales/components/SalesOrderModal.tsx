import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, SalesOrder, SalesOrderItem } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { 
  ShoppingCart, CheckCircle2, Building2, Calendar, FileText, X, 
  AlertCircle, Lock, Truck, CreditCard, Hash, MapPin, Info
} from 'lucide-react';

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

/**
 * Format date string safely to DD-MM-YYYY
 * If date is unavailable or empty, returns 'Not Available'
 */
const formatDateToDDMMYYYY = (dateString?: string | null): string => {
  if (!dateString || typeof dateString !== 'string' || !dateString.trim()) {
    return 'Not Available';
  }
  const clean = dateString.trim().split('T')[0];
  if (clean === 'Recently Accepted' || clean.toLowerCase() === 'not available') {
    return 'Not Available';
  }
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) {
    return 'Not Available';
  }
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

export const SalesOrderModal: React.FC<SalesOrderModalProps> = ({
  isOpen,
  onClose,
  quotation,
}) => {
  const { addSalesOrder, salesOrders } = useApp();

  // Order Details
  const [date, setDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [customerPoNumber, setCustomerPoNumber] = useState('');

  // Payment Details
  const [paymentTerms, setPaymentTerms] = useState('Standard 30 days net upon invoice');

  // Delivery Details
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('Standard delivery within 14 business days');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (quotation) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      // Default expected delivery date: 14 business days after order date
      const deliveryDefault = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      setExpectedDeliveryDate(deliveryDefault);
      setCustomerPoNumber('');
      setPaymentTerms(quotation.terms || 'Standard 30 days net upon invoice');
      setDeliveryAddress('');
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
    setError('');

    if (!isAccepted) {
      setError(`Cannot create Sales Order from quotation in "${quotation.status}" status. Quotation must be Accepted.`);
      return;
    }

    if (existingOrder) {
      setError(`Sales Order ${existingOrder.soNumber} already exists for this quotation. Duplicate creation is blocked.`);
      return;
    }

    if (!date) {
      setError('Order Date is required.');
      return;
    }

    if (!paymentTerms || !paymentTerms.trim()) {
      setError('Payment Terms are required.');
      return;
    }

    if (expectedDeliveryDate && expectedDeliveryDate < date) {
      setError('Expected Delivery Date cannot be earlier than Order Date.');
      return;
    }

    if (customerPoNumber && customerPoNumber.trim().length > 100) {
      setError('Customer PO Number must be 100 characters or less.');
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
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      deliveryAddress: deliveryAddress?.trim() || undefined,
      customerPoNumber: customerPoNumber?.trim() || undefined,
      totalAmount: quotation.amount,
      subtotal: quotation.subtotal || quotation.amount,
      taxAmount: quotation.taxAmount || 0,
      discountAmount: quotation.discountAmount || 0,
      fulfillmentStatus: 'Pending',
      status: 'Confirmed',
      paymentTerms: paymentTerms.trim(),
      deliveryNotes: deliveryNotes?.trim() || '',
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
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
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
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

        {existingOrder && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>This quotation already has an active Sales Order: <strong>{existingOrder.soNumber}</strong>. Duplicate creation is blocked.</span>
          </div>
        )}

        {/* 1. QUOTATION SUMMARY */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <div className="font-bold text-[#0f172a] flex items-center gap-2">
              <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">{quotation.quoteNumber}</span>
              <span className="text-slate-900 font-semibold">{quotation.customerName}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} /> {quotation.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-indigo-100/90 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block font-medium">Quote Date</span>
              <span className="font-semibold text-slate-800">{formatDateToDDMMYYYY(quotation.date)}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Accepted Date</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 inline-block">
                {formatDateToDDMMYYYY(quotation.acceptedDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Line Items</span>
              <span className="font-semibold text-slate-800">{quotation.itemsCount || quotation.items?.length || 1} items</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Grand Total</span>
              <span className="font-extrabold text-indigo-700 text-xs">{formatINR(quotation.amount)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* 2. ORDER DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              <Calendar size={14} className="text-indigo-600" />
              <span>Order Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Order Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setDate(newDate);
                    if (expectedDeliveryDate && expectedDeliveryDate < newDate) {
                      setExpectedDeliveryDate(newDate);
                    }
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Expected Delivery Date
                  <span className="text-slate-400 font-normal ml-1">(On or after Order Date)</span>
                </label>
                <input
                  type="date"
                  min={date || undefined}
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Initial Order Status
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Confirmed"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-100/90 text-slate-700 font-semibold cursor-not-allowed select-none pl-8"
                  />
                  <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded">
                    Confirmed
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Orders commence in Confirmed status. Subsequent status updates are managed from the Sales Order dashboard.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Customer PO Number
                  <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-9812 or Client PO #"
                    maxLength={100}
                    value={customerPoNumber}
                    onChange={(e) => setCustomerPoNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
                  />
                  <Hash size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. PAYMENT DETAILS */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              <CreditCard size={14} className="text-indigo-600" />
              <span>Payment Details</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Payment Terms <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Standard 30 days net upon invoice receipt"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          {/* 4. DELIVERY DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              <Truck size={14} className="text-indigo-600" />
              <span>Delivery Details</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Delivery Address
                <span className="text-slate-400 font-normal ml-1">(Optional for service or digital deliveries)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Enter complete physical shipping address, site location, receiving dock, or dispatch facility..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Delivery Instructions & Scope Notes
              </label>
              <textarea
                rows={2}
                placeholder="Special delivery instructions, site contact person, warehouse timing, gate pass notes..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(existingOrder) || !isAccepted}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={15} /> Confirm & Issue Sales Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
