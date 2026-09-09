import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, QuotationItem, Product, Opportunity } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { Plus, Trash2, Calculator, Calendar, FileText, User, Building2, Tag, X } from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
  isRevisionMode?: boolean;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  isRevisionMode = false,
}) => {
  const { customers, opportunities, contacts, products, addQuotation, updateQuotation } = useApp();

  const [customerId, setCustomerId] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [contactId, setContactId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [date, setDate] = useState('');
  const [owner, setOwner] = useState('Sales Executive');
  const [terms, setTerms] = useState('Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
  const [notes, setNotes] = useState('');
  
  // Line items state
  const [items, setItems] = useState<QuotationItem[]>([
    {
      productId: 'PROD-A',
      productName: 'Product A - Enterprise CRM Suite',
      quantity: 1,
      unitPrice: 650000,
      taxRate: 18,
      total: 767000,
    }
  ]);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState<number>(0);

  // Initialize form state
  useEffect(() => {
    if (quotationToEdit) {
      setCustomerId(quotationToEdit.customerId || '');
      setOpportunityId(quotationToEdit.opportunityId || '');
      setContactId(quotationToEdit.contactId || '');
      setDate(quotationToEdit.date || new Date().toISOString().split('T')[0]);
      setValidUntil(quotationToEdit.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setOwner(quotationToEdit.owner || 'Sales Executive');
      setTerms(quotationToEdit.terms || 'Standard payment terms: 30 days from invoice date.');
      setNotes(quotationToEdit.notes || '');

      if (quotationToEdit.items && quotationToEdit.items.length > 0) {
        setItems(quotationToEdit.items);
      } else if (quotationToEdit.amount) {
        setItems([
          {
            productName: 'Quoted Solution & Services',
            quantity: 1,
            unitPrice: Math.round(quotationToEdit.amount / 1.18),
            taxRate: 18,
            total: quotationToEdit.amount,
          }
        ]);
      }
    } else {
      const defaultCust = customers[0]?.id || '';
      setCustomerId(defaultCust);
      setOpportunityId('');
      setContactId('');
      setDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setOwner('Sales Executive');
      setTerms('Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
      setNotes('');
      if (products.length > 0) {
        const p = products[0];
        setItems([
          {
            productId: p.id,
            productName: p.name,
            quantity: 1,
            unitPrice: p.price,
            taxRate: p.taxRate || 18,
            total: Math.round(p.price * (1 + (p.taxRate || 18) / 100)),
          }
        ]);
      } else {
        setItems([
          {
            productName: 'Enterprise Cloud Deployment & Implementation',
            quantity: 1,
            unitPrice: 500000,
            taxRate: 18,
            total: 590000,
          }
        ]);
      }
    }
  }, [quotationToEdit, isOpen, customers, products]);

  // Filtered contacts & opportunities for selected customer
  const availableContacts = useMemo(() => {
    if (!customerId) return contacts;
    return contacts.filter(c => c.customerId === customerId);
  }, [contacts, customerId]);

  const availableOpportunities = useMemo(() => {
    if (!customerId) return opportunities;
    return opportunities.filter(o => o.customerId === customerId);
  }, [opportunities, customerId]);

  // Handle adding a new line item
  const handleAddItem = () => {
    const defaultProd = products[0];
    const newItem: QuotationItem = defaultProd
      ? {
          productId: defaultProd.id,
          productName: defaultProd.name,
          quantity: 1,
          unitPrice: defaultProd.price,
          taxRate: defaultProd.taxRate || 18,
          total: Math.round(defaultProd.price * (1 + (defaultProd.taxRate || 18) / 100)),
        }
      : {
          productName: 'Service / Software Custom Item',
          quantity: 1,
          unitPrice: 100000,
          taxRate: 18,
          total: 118000,
        };
    setItems(prev => [...prev, newItem]);
  };

  // Handle removing a line item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle updating line item field
  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      if (field === 'productId') {
        const prod = products.find(p => p.id === val);
        if (prod) {
          item.productName = prod.name;
          item.unitPrice = prod.price;
          item.taxRate = prod.taxRate || 18;
        }
      }

      const qty = parseFloat(item.quantity as any) || 0;
      const price = parseFloat(item.unitPrice as any) || 0;
      const tax = parseFloat(item.taxRate as any) || 0;
      const lineSubtotal = qty * price;
      const lineTax = lineSubtotal * (tax / 100);
      item.total = Math.round(lineSubtotal + lineTax);

      updated[index] = item;
      return updated;
    });
  };

  // Compute subtotal, tax, discount, grand total
  const financialTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity as any) || 0;
      const price = parseFloat(item.unitPrice as any) || 0;
      return sum + (qty * price);
    }, 0);

    const discountAmount = Math.round(subtotal * (overallDiscountPercent / 100));
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);

    const taxAmount = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity as any) || 0;
      const price = parseFloat(item.unitPrice as any) || 0;
      const itemRatio = subtotal > 0 ? (qty * price) / subtotal : 0;
      const discountedItemBase = taxableSubtotal * itemRatio;
      const taxRate = parseFloat(item.taxRate as any) || 0;
      return sum + (discountedItemBase * (taxRate / 100));
    }, 0);

    const grandTotal = Math.round(taxableSubtotal + taxAmount);

    return {
      subtotal,
      discountAmount,
      taxAmount: Math.round(taxAmount),
      grandTotal,
    };
  }, [items, overallDiscountPercent]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === customerId);
    const customerName = cust ? cust.customerName : 'Direct Corporate Account';

    if (isRevisionMode && quotationToEdit) {
      // Revision workflow
      const nextRev = (quotationToEdit.revisionNumber || 1) + 1;
      await updateQuotation(quotationToEdit.id, {
        status: 'Revised',
        revisionNumber: nextRev,
        amount: financialTotals.grandTotal,
        subtotal: financialTotals.subtotal,
        taxAmount: financialTotals.taxAmount,
        discountAmount: financialTotals.discountAmount,
        validUntil,
        terms,
        notes,
        items,
      });
    } else if (quotationToEdit) {
      // Direct edit
      await updateQuotation(quotationToEdit.id, {
        amount: financialTotals.grandTotal,
        subtotal: financialTotals.subtotal,
        taxAmount: financialTotals.taxAmount,
        discountAmount: financialTotals.discountAmount,
        validUntil,
        terms,
        notes,
        items,
      });
    } else {
      // New Draft creation
      const quoteNo = `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
      const payload: Omit<Quotation, 'id'> = {
        quoteNumber: quoteNo,
        customerId: customerId || 'CUST-001',
        customerName,
        opportunityId: opportunityId || undefined,
        contactId: contactId || undefined,
        date: date || new Date().toISOString().split('T')[0],
        validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        amount: financialTotals.grandTotal,
        subtotal: financialTotals.subtotal,
        taxAmount: financialTotals.taxAmount,
        discountAmount: financialTotals.discountAmount,
        status: 'Draft',
        itemsCount: items.length,
        revisionNumber: 1,
        terms,
        notes,
        owner,
        items,
      };
      await addQuotation(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#0f172a]">
                {isRevisionMode ? `Revise Quotation (${quotationToEdit?.quoteNumber})` : quotationToEdit ? `Edit Quotation (${quotationToEdit.quoteNumber})` : 'Create Commercial Quotation'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {isRevisionMode ? `Revision #${(quotationToEdit?.revisionNumber || 1) + 1}` : quotationToEdit?.status || 'Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify products, services, GST pricing, payment terms, and validity for the customer proposal.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Row 1: Customer, Opportunity, Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" /> Customer Account *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={Boolean(quotationToEdit)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customerName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Tag size={13} className="text-slate-400" /> Linked Opportunity
              </label>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">— None / Direct Quote —</option>
                {availableOpportunities.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({formatINR(o.value)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <User size={13} className="text-slate-400" /> Contact Person
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">— Primary Customer Contact —</option>
                {availableContacts.map(con => (
                  <option key={con.id} value={con.id}>{con.name} ({con.designation || con.contactRole})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date, Valid Until, Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" /> Quotation Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" /> Valid Until *
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <User size={13} className="text-slate-400" /> Sales Representative
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                Products & Services Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                    <th className="py-2 px-2 font-semibold">Product / Item</th>
                    <th className="py-2 px-2 font-semibold w-20 text-center">Qty</th>
                    <th className="py-2 px-2 font-semibold w-28 text-right">Unit Price (₹)</th>
                    <th className="py-2 px-2 font-semibold w-20 text-center">GST (%)</th>
                    <th className="py-2 px-2 font-semibold w-28 text-right">Line Total (₹)</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2">
                        <div className="space-y-1">
                          <select
                            value={item.productId || ''}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">— Custom Line Item —</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({formatINR(p.price)})</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Description / Scope"
                            value={item.productName}
                            onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-right focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-800">
                        {formatINR(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Terms & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Commercial Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Notes & Remarks</label>
                <input
                  type="text"
                  placeholder="Special client requirements or revision reason"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal (Base Value):</span>
                <span className="font-semibold text-slate-900">{formatINR(financialTotals.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Special Discount:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overallDiscountPercent}
                    onChange={(e) => setOverallDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-12 border border-slate-200 rounded px-1 py-0.5 text-center text-xs bg-white"
                  />
                  <span>%</span>
                </div>
                <span className="font-semibold text-rose-600">- {formatINR(financialTotals.discountAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Estimated Taxes (GST 18%):</span>
                <span className="font-semibold text-slate-900">{formatINR(financialTotals.taxAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-extrabold text-[#0f172a]">Grand Total (Payable):</span>
                <span className="text-base font-extrabold text-indigo-600">{formatINR(financialTotals.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-sm transition"
            >
              {isRevisionMode ? 'Confirm & Save Revision' : quotationToEdit ? 'Save Changes' : 'Save Draft Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
