import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, QuotationItem, Product, Opportunity } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { Plus, Trash2, Calendar, User, Building2, Tag, X, Send, Save, AlertCircle, Loader2 } from 'lucide-react';

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
  const { customers, opportunities, contacts, products, addQuotation, updateQuotation, userProfile } = useApp();

  const [customerId, setCustomerId] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [contactId, setContactId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [date, setDate] = useState('');
  const [owner, setOwner] = useState('');
  const [terms, setTerms] = useState('Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
  const [notes, setNotes] = useState('');
  
  // Line items state
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState<number>(0);

  // Form submission and validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Default sales rep from userProfile
  const defaultOwnerName = useMemo(() => {
    return userProfile?.name || 'Sales Executive';
  }, [userProfile]);

  // Initialize form state
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');
    setIsSubmitting(false);

    if (quotationToEdit) {
      setCustomerId(quotationToEdit.customerId || '');
      setOpportunityId(quotationToEdit.opportunityId || '');
      setContactId(quotationToEdit.contactId || '');
      setDate(quotationToEdit.date || new Date().toISOString().split('T')[0]);
      setValidUntil(quotationToEdit.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setOwner(quotationToEdit.owner || defaultOwnerName);
      setTerms(quotationToEdit.terms || 'Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
      setNotes(quotationToEdit.notes || '');

      if (quotationToEdit.subtotal && quotationToEdit.discountAmount && quotationToEdit.subtotal > 0) {
        const discPct = Math.round((quotationToEdit.discountAmount / quotationToEdit.subtotal) * 100);
        setOverallDiscountPercent(Math.min(100, Math.max(0, discPct)));
      } else {
        setOverallDiscountPercent(0);
      }

      if (quotationToEdit.items && quotationToEdit.items.length > 0) {
        setItems(quotationToEdit.items.map(it => ({ ...it })));
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
      setOwner(defaultOwnerName);
      setTerms('Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
      setNotes('');
      setOverallDiscountPercent(0);

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
  }, [quotationToEdit, isOpen, customers, products, defaultOwnerName]);

  // Filtered contacts for selected customer
  const availableContacts = useMemo(() => {
    if (!customerId) return contacts;
    return contacts.filter(c => c.customerId === customerId);
  }, [contacts, customerId]);

  // Filtered opportunities for selected customer
  const availableOpportunities = useMemo(() => {
    if (!customerId) return opportunities;
    return opportunities.filter(o => o.customerId === customerId);
  }, [opportunities, customerId]);

  // Reset contact or opportunity if they no longer belong to selected customer
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    
    // Check contact validity
    const validCons = contacts.filter(c => c.customerId === newCustId);
    if (!validCons.some(c => c.id === contactId)) {
      setContactId('');
    }

    // Check opportunity validity
    const validOpps = opportunities.filter(o => o.customerId === newCustId);
    if (!validOpps.some(o => o.id === opportunityId)) {
      setOpportunityId('');
    }
  };

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
          productName: 'Custom Solution / Service Item',
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
        if (val) {
          const prod = products.find(p => p.id === val);
          if (prod) {
            item.productName = prod.name;
            item.unitPrice = prod.price;
            item.taxRate = prod.taxRate || 18;
          }
        }
      }

      const qty = Math.max(0, parseFloat(item.quantity as any) || 0);
      const price = Math.max(0, parseFloat(item.unitPrice as any) || 0);
      const tax = Math.min(100, Math.max(0, parseFloat(item.taxRate as any) || 0));
      
      item.quantity = qty;
      item.unitPrice = price;
      item.taxRate = tax;

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

  // Form Validation
  const validateForm = (): string | null => {
    if (!customerId) return 'Please select a Customer Account.';
    if (!date) return 'Please select a Quotation Date.';
    if (!validUntil) return 'Please select a Valid Until date.';

    if (validUntil < date) {
      return 'Valid Until date cannot be earlier than the Quotation Date.';
    }

    if (!items || items.length === 0) {
      return 'Quotation must have at least one line item.';
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productName || !it.productName.trim()) {
        return `Line item #${i + 1} requires a product/service name or description.`;
      }
      if (!it.quantity || it.quantity <= 0) {
        return `Line item #${i + 1} must have a quantity greater than zero.`;
      }
      if (it.unitPrice < 0) {
        return `Line item #${i + 1} unit price cannot be negative.`;
      }
      if (it.taxRate < 0 || it.taxRate > 100) {
        return `Line item #${i + 1} GST tax rate must be between 0% and 100%.`;
      }
    }

    if (overallDiscountPercent < 0 || overallDiscountPercent > 100) {
      return 'Special Discount percentage must be between 0% and 100%.';
    }

    return null;
  };

  // Submit Handler supporting Save Draft & Send Quotation
  const executeSubmit = async (targetStatus?: 'Draft' | 'Sent') => {
    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const cust = customers.find(c => c.id === customerId);
      const customerName = cust ? cust.customerName : 'Direct Corporate Account';

      if (isRevisionMode && quotationToEdit) {
        // Revision workflow: mark previous version as 'Revised' and create NEW revision
        if (quotationToEdit.status === 'Sent') {
          await updateQuotation(quotationToEdit.id, { status: 'Revised' });
        }

        const nextRev = (quotationToEdit.revisionNumber || 1) + 1;
        const todayStr = new Date().toISOString().split('T')[0];
        const statusToUse = targetStatus || 'Sent';

        await addQuotation({
          quoteNumber: quotationToEdit.quoteNumber || `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
          customerId: customerId || quotationToEdit.customerId || 'CUST-001',
          customerName: customerName || quotationToEdit.customerName || 'Direct Corporate Account',
          leadId: quotationToEdit.leadId,
          opportunityId: opportunityId || quotationToEdit.opportunityId,
          contactId: contactId || quotationToEdit.contactId,
          date: date || todayStr,
          validUntil: validUntil || quotationToEdit.validUntil,
          amount: financialTotals.grandTotal,
          subtotal: financialTotals.subtotal,
          taxAmount: financialTotals.taxAmount,
          discountAmount: financialTotals.discountAmount,
          status: statusToUse,
          sentDate: statusToUse === 'Sent' ? todayStr : undefined,
          revisionNumber: nextRev,
          revisionGroupId: quotationToEdit.revisionGroupId || quotationToEdit.id,
          terms,
          notes,
          owner: owner || defaultOwnerName,
          items,
          itemsCount: items.length,
        });
      } else if (quotationToEdit) {
        // Direct edit
        const statusToUse = targetStatus || quotationToEdit.status || 'Draft';
        await updateQuotation(quotationToEdit.id, {
          customerId,
          customerName,
          opportunityId: opportunityId || undefined,
          contactId: contactId || undefined,
          date,
          validUntil,
          amount: financialTotals.grandTotal,
          subtotal: financialTotals.subtotal,
          taxAmount: financialTotals.taxAmount,
          discountAmount: financialTotals.discountAmount,
          status: statusToUse,
          sentDate: statusToUse === 'Sent' ? new Date().toISOString().split('T')[0] : quotationToEdit.sentDate,
          terms,
          notes,
          owner: owner || defaultOwnerName,
          items,
          itemsCount: items.length,
        });
      } else {
        // New creation
        const statusToUse = targetStatus || 'Draft';
        const quoteNo = `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
        const todayStr = new Date().toISOString().split('T')[0];
        
        const payload: Omit<Quotation, 'id'> = {
          quoteNumber: quoteNo,
          customerId: customerId || 'CUST-001',
          customerName,
          opportunityId: opportunityId || undefined,
          contactId: contactId || undefined,
          date: date || todayStr,
          validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          amount: financialTotals.grandTotal,
          subtotal: financialTotals.subtotal,
          taxAmount: financialTotals.taxAmount,
          discountAmount: financialTotals.discountAmount,
          status: statusToUse,
          sentDate: statusToUse === 'Sent' ? todayStr : undefined,
          itemsCount: items.length,
          revisionNumber: 1,
          terms,
          notes,
          owner: owner || defaultOwnerName,
          items,
        };
        await addQuotation(payload);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save quotation. Please verify input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-start shrink-0 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isRevisionMode ? `Revise Quotation (${quotationToEdit?.quoteNumber})` : quotationToEdit ? `Edit Quotation (${quotationToEdit.quoteNumber})` : 'Create Commercial Quotation'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {isRevisionMode ? `Revision #${(quotationToEdit?.revisionNumber || 1) + 1}` : quotationToEdit?.status || 'Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify products, services, GST pricing, payment terms, and validity for the customer proposal.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto grow">
          
          {/* Error Alert Display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Customer Account, Linked Opportunity, Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" /> Customer Account <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                disabled={Boolean(quotationToEdit) || isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
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
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="">— Primary Customer Contact —</option>
                {availableContacts.map(con => (
                  <option key={con.id} value={con.id}>{con.name} ({con.designation || con.contactRole})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Quotation Date, Valid Until, Sales Representative */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" /> Quotation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" /> Valid Until <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                disabled={isSubmitting}
                placeholder="Assigned Sales Representative"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Products & Services Line Items ({items.length}) <span className="text-rose-500">*</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isSubmitting}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-[11px] font-semibold uppercase">
                    <th className="py-2.5 px-3 min-w-[260px]">Product / Service & Scope</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-28 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-2 w-20 text-center">GST (%)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="bg-white hover:bg-slate-50/50 transition">
                      <td className="p-2.5">
                        <div className="space-y-1.5">
                          <select
                            value={item.productId || ''}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">— Select Catalog Product / Custom Item —</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.sku ? `(${p.sku})` : ''} - {formatINR(p.price)}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Line item description / custom scope..."
                            value={item.productName}
                            onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                          disabled={isSubmitting}
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-right font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 text-xs">
                        {formatINR(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1 || isSubmitting}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition p-1 rounded hover:bg-slate-100"
                          title="Remove Line Item"
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

          {/* Row 3: Commercial Terms & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Commercial Terms & Conditions (Customer-facing)</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Specify payment terms, validity, delivery timelines..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Notes & Remarks <span className="font-normal text-slate-400">(Internal use only)</span></label>
                <input
                  type="text"
                  placeholder="Special client requirements or revision reason"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal (Base Price):</span>
                <span className="font-semibold text-slate-900">{formatINR(financialTotals.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Special Discount (Applied before GST):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overallDiscountPercent}
                    onChange={(e) => setOverallDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    disabled={isSubmitting}
                    className="w-12 border border-slate-200 rounded px-1 py-0.5 text-center text-xs bg-white font-medium text-slate-800"
                  />
                  <span>%</span>
                </div>
                <span className="font-semibold text-rose-600">- {formatINR(financialTotals.discountAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Estimated Taxes (GST):</span>
                <span className="font-semibold text-slate-900">{formatINR(financialTotals.taxAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Grand Total (Payable):</span>
                <span className="text-base font-bold text-blue-600">{formatINR(financialTotals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!isRevisionMode && !quotationToEdit && (
              <button
                type="button"
                onClick={() => executeSubmit('Draft')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="text-slate-500" />}
                Save as Draft
              </button>
            )}

            <button
              type="button"
              onClick={() => executeSubmit(quotationToEdit ? (quotationToEdit.status === 'Sent' ? 'Sent' : undefined) : 'Sent')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : isRevisionMode ? (
                'Confirm & Save Revision'
              ) : quotationToEdit ? (
                'Save Changes'
              ) : (
                <>
                  <Send size={14} />
                  Send Quotation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
