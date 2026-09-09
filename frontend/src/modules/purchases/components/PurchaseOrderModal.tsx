import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { PurchaseOrder, PurchaseOrderItem, Vendor, Product } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { X, Plus, Trash2, ShoppingCart, Calendar, MapPin, Building2, AlertCircle } from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  poToEdit?: PurchaseOrder | null;
  purchaseOrder?: PurchaseOrder | null;
  initialVendorId?: string;
  onSuccess?: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  poToEdit,
  purchaseOrder,
  initialVendorId,
  onSuccess
}) => {
  const { vendors, products, addPurchaseOrder, updatePurchaseOrder } = useApp();
  const activePO = poToEdit || purchaseOrder;

  const [vendorId, setVendorId] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Default delivery date to +7 days
  const defaultDelivery = new Date();
  defaultDelivery.setDate(defaultDelivery.getDate() + 7);
  const [expectedDelivery, setExpectedDelivery] = useState<string>(defaultDelivery.toISOString().split('T')[0]);
  
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Main Warehouse & Headquarters, Bengaluru');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [notes, setNotes] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [initialStatus, setInitialStatus] = useState<'Draft' | 'Pending Approval'>('Draft');

  const [items, setItems] = useState<Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }>>([
    { productName: '', quantity: 1, unitPrice: 0, taxRate: 18, total: 0 }
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize on open or when editing
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (activePO) {
        setVendorId(activePO.vendorId || activePO.vendor_id || '');
        setVendorName(activePO.vendorName || activePO.vendor_name || '');
        setDate(activePO.date || activePO.order_date || new Date().toISOString().split('T')[0]);
        setExpectedDelivery(activePO.expectedDelivery || activePO.expected_delivery || '');
        setDeliveryLocation(activePO.deliveryLocation || activePO.delivery_location || 'Main Warehouse & Headquarters, Bengaluru');
        setPaymentTerms(activePO.paymentTerms || activePO.payment_terms || 'Net 30 Days');
        setNotes(activePO.notes || '');
        setDiscountAmount(String(activePO.discountAmount || activePO.discount_amount || 0));
        setInitialStatus(activePO.status === 'Pending Approval' ? 'Pending Approval' : 'Draft');
        if (activePO.items && activePO.items.length > 0) {
          setItems(activePO.items.map(it => ({
            productId: it.productId || it.product_id,
            productName: it.productName || it.item_name || 'Procurement Item',
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || it.unit_price || 0,
            taxRate: it.taxRate || it.tax_rate || 18,
            total: it.total || it.total_amount || 0,
          })));
        }
      } else {
        const targetVendor = (initialVendorId ? vendors.find(v => v.id === initialVendorId) : null) || (vendors.length > 0 ? vendors[0] : null);
        setVendorId(targetVendor?.id || '');
        setVendorName(targetVendor?.name || '');
        setDate(new Date().toISOString().split('T')[0]);
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setExpectedDelivery(d.toISOString().split('T')[0]);
        setDeliveryLocation('Main Warehouse & Headquarters, Bengaluru');
        setPaymentTerms(targetVendor?.paymentTerms || targetVendor?.payment_terms || 'Net 30 Days');
        setNotes('');
        setDiscountAmount('0');
        setInitialStatus('Draft');

        // Initialize with default product if available
        if (products.length > 0) {
          const firstProd = products[0];
          const sub = firstProd.price;
          const tax = sub * (firstProd.taxRate / 100);
          setItems([{
            productId: firstProd.id,
            productName: firstProd.name,
            quantity: 1,
            unitPrice: firstProd.price,
            taxRate: firstProd.taxRate || 18,
            total: sub + tax
          }]);
        } else {
          setItems([{ productName: 'Office Hardware & IT Equipment', quantity: 1, unitPrice: 50000, taxRate: 18, total: 59000 }]);
        }
      }
    }
  }, [isOpen, poToEdit, purchaseOrder, initialVendorId, vendors, products]);

  if (!isOpen) return null;

  const handleVendorSelect = (vId: string) => {
    setVendorId(vId);
    const selected = vendors.find(v => v.id === vId);
    if (selected) {
      setVendorName(selected.name);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        current.productName = prod.name;
        current.unitPrice = prod.price || 0;
        current.taxRate = prod.taxRate || 18;
      }
    }

    const qty = Math.max(1, parseInt(String(current.quantity), 10) || 1);
    const price = Math.max(0, parseFloat(String(current.unitPrice)) || 0);
    const taxRate = parseFloat(String(current.taxRate)) || 18;
    const lineSubtotal = qty * price;
    const lineTax = lineSubtotal * (taxRate / 100);

    current.quantity = qty;
    current.unitPrice = price;
    current.taxRate = taxRate;
    current.total = lineSubtotal + lineTax;

    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productName: '', quantity: 1, unitPrice: 0, taxRate: 18, total: 0 }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Computations
  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
  const taxAmount = items.reduce((sum, it) => sum + ((it.quantity * it.unitPrice) * (it.taxRate / 100)), 0);
  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorName && !vendorId) {
      setError('Please select an authorized supplier.');
      return;
    }

    if (items.length === 0 || items.some(it => !it.productName.trim() || it.unitPrice <= 0)) {
      setError('Please provide at least one valid line item with product name and unit price.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: Omit<PurchaseOrder, 'id'> = {
        poNumber: poToEdit?.poNumber || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        vendorId: vendorId || undefined,
        vendorName: vendorName || 'Office Supplies Ltd',
        date,
        expectedDelivery: expectedDelivery || undefined,
        deliveryLocation,
        paymentTerms,
        notes,
        subtotal,
        taxAmount,
        discountAmount: discount,
        amount: grandTotal,
        status: poToEdit ? poToEdit.status : initialStatus,
        receiptStatus: poToEdit?.receiptStatus || 'Not Received',
        paymentStatus: poToEdit?.paymentStatus || 'Unpaid',
        itemsCount: items.length,
        items: items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          receivedQuantity: 0,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
          total: it.total,
        })),
      };

      if (poToEdit) {
        await updatePurchaseOrder(poToEdit.id, payload);
      } else {
        await addPurchaseOrder(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {poToEdit ? `Edit Purchase Order • ${poToEdit.poNumber}` : 'Create New Purchase Order'}
              </h2>
              <p className="text-xs text-slate-500">
                Issue procurement commitment and link vendor line items with delivery terms
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Vendor & Key Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Vendor Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Supplier *
              </label>
              <select
                value={vendorId}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code || v.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Order Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Expected Delivery */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expected Delivery Date *
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Terms & Delivery Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Location
              </label>
              <input
                type="text"
                placeholder="e.g. Main Warehouse, Floor 3, Bengaluru"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Section 3: Line Items Builder */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Purchase Order Line Items
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1 border border-purple-200 transition"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 w-72">Product / Service *</th>
                    <th className="p-3 w-20 text-center">Qty</th>
                    <th className="p-3 w-28 text-right">Unit Price (₹)</th>
                    <th className="p-3 w-20 text-center">GST %</th>
                    <th className="p-3 w-28 text-right">Total (₹)</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {/* Product Selector / Text */}
                      <td className="p-2.5">
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-white text-slate-800 mb-1"
                        >
                          <option value="">-- Select Catalog SKU or Custom --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{p.price.toLocaleString()} • {p.sku})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Item Description"
                          value={item.productName}
                          onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-purple-500"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-16 text-center text-xs border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-purple-500"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-24 text-right text-xs border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-purple-500"
                        />
                      </td>

                      {/* Tax Rate */}
                      <td className="p-2.5 text-center">
                        <select
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                          className="w-16 text-center text-xs border border-slate-200 rounded-lg p-1.5 bg-white"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>

                      {/* Line Total */}
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatINR(item.total)}
                      </td>

                      {/* Delete Action */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Commercial Totals & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Notes & Lifecycle Selection */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Procurement Notes / Scope of Deliverables
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify warranty terms, delivery timelines, or packaging requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {!poToEdit && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Workflow Status
                  </label>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="initialStatus"
                        checked={initialStatus === 'Draft'}
                        onChange={() => setInitialStatus('Draft')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      Save as Draft
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="initialStatus"
                        checked={initialStatus === 'Pending Approval'}
                        onChange={() => setInitialStatus('Pending Approval')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      Submit for Approval
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary Calculation Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.length} items):</span>
                <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (GST 18%):</span>
                <span className="font-semibold text-slate-900">{formatINR(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-1">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-24 text-right text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white"
                />
              </div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">Committed Grand Total:</span>
                <span className="font-extrabold text-purple-700 text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Saving...' : (poToEdit ? 'Save Changes' : (initialStatus === 'Pending Approval' ? 'Submit for Approval' : 'Create Draft PO'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
