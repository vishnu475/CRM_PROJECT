import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { SalesOrder, Invoice } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import {
  FileText,
  CheckCircle2,
  Building2,
  Calendar,
  X,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  MapPin,
  Landmark,
  BadgePercent,
  Check
} from 'lucide-react';
import {
  INDIAN_STATES_GST,
  SELLER_COMPANY_INFO,
  validateGSTIN,
  calculateGstTaxBreakdown
} from '../utils/gstUtils';
import { CRMInvoicesAPI } from '../../../services/apiService';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder: SalesOrder | null;
  onInvoiceCreated?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
  onInvoiceCreated,
}) => {
  const { addInvoice, invoices, bankAccounts, customers } = useApp();

  // Preview number state
  const [invoiceNumberPreview, setInvoiceNumberPreview] = useState('INV-2026-0001');

  // Form states
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 15 days of invoice date');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');

  // Customer & GST States
  const [billingAddress, setBillingAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState('29'); // Karnataka default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Customer matching
  const matchedCustomer = useMemo(() => {
    if (!salesOrder) return null;
    return customers.find(c => c.id === salesOrder.customerId || ((c as any).companyName || (c as any).name || "").toLowerCase() === salesOrder.customerName.toLowerCase());
  }, [salesOrder, customers]);

  // Fetch sequential number preview
  useEffect(() => {
    if (isOpen) {
      CRMInvoicesAPI.getNextNumberPreview()
        .then(res => {
          if (res?.success && res?.data?.previewNumber) {
            setInvoiceNumberPreview(res.data.previewNumber);
          }
        })
        .catch(() => {
          // fallback preview
          setInvoiceNumberPreview(`INV-${new Date().getFullYear()}-0001`);
        });
    }
  }, [isOpen]);

  // Initial population when order opens
  useEffect(() => {
    if (salesOrder && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const due = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      setDate(today);
      setDueDate(due);
      setPaymentTerms(salesOrder.paymentTerms || 'Payment due within 15 days of invoice delivery');
      setNotes(`Tax Invoice issued against Sales Order ${salesOrder.soNumber}${salesOrder.customerPoNumber ? ` (PO Ref: ${salesOrder.customerPoNumber})` : ''}.`);
      setError('');

      // Auto-populate customer billing address
      let addr = '';
      if (matchedCustomer?.billingAddress) {
        const b = matchedCustomer.billingAddress;
        addr = [b.address, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ');
      }
      if (!addr && salesOrder.deliveryAddress) {
        addr = salesOrder.deliveryAddress;
      }
      if (!addr) {
        addr = `${salesOrder.customerName}, Corporate Headquarters`;
      }
      setBillingAddress(addr);

      // Customer GSTIN
      const gst = matchedCustomer?.taxId || (matchedCustomer as any)?.gstVatNumber || '';
      setCustomerGstin(gst);

      // Derive Place of supply from GSTIN or customer state
      if (gst && gst.length >= 2) {
        const gstCode = gst.substring(0, 2);
        if (INDIAN_STATES_GST.some(s => s.code === gstCode)) {
          setPlaceOfSupplyCode(gstCode);
        }
      } else if (matchedCustomer?.billingAddress?.state) {
        const stateName = matchedCustomer.billingAddress.state.toLowerCase();
        const found = INDIAN_STATES_GST.find(s => s.name.toLowerCase() === stateName);
        if (found) setPlaceOfSupplyCode(found.code);
      } else {
        setPlaceOfSupplyCode('29'); // Karnataka
      }

      // Default Bank Account
      if (bankAccounts.length > 0 && !selectedBankAccountId) {
        setSelectedBankAccountId(bankAccounts[0].id);
      }
    }
  }, [salesOrder, isOpen, matchedCustomer, bankAccounts]);

  // Validate GSTIN live
  const gstinValidation = useMemo(() => {
    return validateGSTIN(customerGstin);
  }, [customerGstin]);

  // Dynamic GST tax calculation based on selected Place of Supply
  const taxBreakdown = useMemo(() => {
    if (!salesOrder) {
      return {
        taxType: 'INTRA_STATE' as 'INTRA_STATE' | 'INTER_STATE',
        isInterState: false,
        taxableAmount: 0,
        totalTax: 0,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        grandTotal: 0,
      };
    }

    const subtotal = salesOrder.subtotal || salesOrder.totalAmount;
    const discount = salesOrder.discountAmount || 0;
    const taxAmt = salesOrder.taxAmount || 0;

    return calculateGstTaxBreakdown({
      subtotal,
      discountAmount: discount,
      taxAmount: taxAmt,
      placeOfSupplyCode,
      sellerStateCode: SELLER_COMPANY_INFO.stateCode, // '29' Karnataka
      taxRatePercent: 18,
    });
  }, [salesOrder, placeOfSupplyCode]);

  const selectedStateObj = INDIAN_STATES_GST.find(s => s.code === placeOfSupplyCode) || {
    code: '29',
    name: 'Karnataka'
  };

  const selectedBank = bankAccounts.find(b => b.id === selectedBankAccountId);

  if (!isOpen || !salesOrder) return null;

  // Duplicate check
  const existingInvoice = invoices.find(inv => inv.salesOrderId === salesOrder.id);
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

    if (!billingAddress.trim()) {
      setError('Customer Billing Address is required.');
      return;
    }

    if (customerGstin.trim() && !gstinValidation.valid) {
      setError(`Invalid GSTIN: ${gstinValidation.message}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: Omit<Invoice, 'id'> = {
        invoiceNumber: invoiceNumberPreview, // Backend locks row and issues canonical sequential number
        salesOrderId: salesOrder.id,
        salesOrderNumber: salesOrder.soNumber,
        quotationId: salesOrder.quotationId,
        quoteNumber: salesOrder.quoteNumber,
        opportunityId: salesOrder.opportunityId,
        customerId: salesOrder.customerId || 'CUST-001',
        customerName: salesOrder.customerName,
        date: date || new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        amount: taxBreakdown.grandTotal,
        subtotal: taxBreakdown.taxableAmount,
        taxAmount: taxBreakdown.totalTax,
        discountAmount: salesOrder.discountAmount || 0,
        paidAmount: 0,
        status: 'Issued',
        paymentTerms,
        notes,
        placeOfSupply: `${selectedStateObj.name} (${selectedStateObj.code})`,
        placeOfSupplyCode: selectedStateObj.code,
        billingAddress: billingAddress.trim(),
        customerGstin: customerGstin.trim().toUpperCase() || 'UNREGISTERED',
        sellerGstin: SELLER_COMPANY_INFO.gstin,
        taxType: taxBreakdown.taxType as 'INTRA_STATE' | 'INTER_STATE',
        cgstAmount: taxBreakdown.cgstAmount,
        sgstAmount: taxBreakdown.sgstAmount,
        igstAmount: taxBreakdown.igstAmount,
        bankAccountId: selectedBankAccountId || undefined,
        bankDetails: selectedBank ? {
          bankName: selectedBank.bankName,
          accountNumber: selectedBank.accountNumber,
          accountType: selectedBank.accountType,
          ifscCode: (selectedBank as any).ifscCode || 'HDFC0001234',
          branch: (selectedBank as any).branch || 'Koramangala, Bengaluru',
          upiId: (selectedBank as any).upiId || 'democompany@hdfcbank'
        } : undefined,
        paymentMethod,
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
        if (onInvoiceCreated) onInvoiceCreated(res);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to issue tax invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-150 border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <FileText size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  Issue Commercial Tax Invoice
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {invoiceNumberPreview}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate Indian GST compliant tax invoice from confirmed sales order with automatic accounting entries.
                </p>
              </div>
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

        {existingInvoice && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>An Invoice (<strong>{existingInvoice.invoiceNumber}</strong>) already exists for this Sales Order. Duplicate creation is blocked.</span>
          </div>
        )}

        {/* Source Sales Order Summary Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <div className="font-bold text-[#0f172a] flex items-center gap-2">
              <span className="font-mono text-blue-700 font-bold">{salesOrder.soNumber}</span>
              <span>— {salesOrder.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200 text-[11px]">
                {salesOrder.status || 'Confirmed'}
              </span>
              {salesOrder.customerPoNumber && (
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-slate-200 text-slate-700">
                  PO: {salesOrder.customerPoNumber}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block">Order Date</span>
              <span className="font-semibold text-slate-800">{salesOrder.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Source Quote</span>
              <span className="font-semibold text-slate-800">{salesOrder.quoteNumber || 'Direct Order'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Taxable Subtotal</span>
              <span className="font-semibold text-slate-800">{formatINR(taxBreakdown.taxableAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Grand Total</span>
              <span className="font-extrabold text-blue-700">{formatINR(taxBreakdown.grandTotal)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* SECTION 1: INVOICE DETAILS */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <FileText size={15} className="text-blue-600" />
                Section 1: Invoice Details & Numbering
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                Auto-Sequential Series
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Generated Invoice #</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={invoiceNumberPreview}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-700 cursor-not-allowed"
                    title="Invoice numbers are automatically generated and sequentially locked upon creation."
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    LOCKED
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Invoice Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Due Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  min={date}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CUSTOMER & BILLING DETAILS */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Building2 size={15} className="text-indigo-600" />
                Section 2: Customer & Billing Address
              </h3>
              <span className="text-[10px] text-slate-500">
                Permanent GST Address Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Account</label>
                <input
                  type="text"
                  readOnly
                  value={salesOrder.customerName}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold bg-slate-100 text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Customer GSTIN</label>
                  <span className={`text-[10px] font-semibold ${customerGstin.trim() && !gstinValidation.valid ? 'text-rose-600' : 'text-slate-500'}`}>
                    {customerGstin.trim() ? (gstinValidation.valid ? '✓ Valid Format' : '⚠ Invalid') : '(Optional / B2C)'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 29AABCU9603R1ZM (Leave blank for unregistered)"
                  value={customerGstin}
                  maxLength={15}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase();
                    setCustomerGstin(clean);
                    if (clean.length >= 2) {
                      const prefix = clean.substring(0, 2);
                      if (INDIAN_STATES_GST.some(s => s.code === prefix)) {
                        setPlaceOfSupplyCode(prefix);
                      }
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:outline-none ${
                    customerGstin.trim() && !gstinValidation.valid 
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-500' 
                      : 'border-slate-300 bg-white focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Customer Billing Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Enter complete legal billing address with city, state, and pin code..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 3: GST & TAX DETAILS */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <BadgePercent size={15} className="text-emerald-600" />
                Section 3: GST Tax & Place of Supply Rules
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">
                  Seller State: <strong>Karnataka (29)</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  taxBreakdown.isInterState 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {taxBreakdown.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Place of Supply (State / UT) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={placeOfSupplyCode}
                  onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {INDIAN_STATES_GST.map((state) => (
                    <option key={state.code} value={state.code}>
                      [{state.code}] {state.name} {state.code === '29' ? '★ (Intra-State)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {taxBreakdown.isInterState 
                    ? '• Place of supply is outside Karnataka: 18% Integrated GST (IGST) applies.' 
                    : '• Place of supply is within Karnataka: 9% Central GST (CGST) + 9% State GST (SGST) apply.'}
                </p>
              </div>

              {/* Tax breakdown summary box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatINR(taxBreakdown.taxableAmount)}</span>
                </div>
                {!taxBreakdown.isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (9.0%):</span>
                      <span className="font-mono font-semibold text-slate-800">{formatINR(taxBreakdown.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (9.0%):</span>
                      <span className="font-mono font-semibold text-slate-800">{formatINR(taxBreakdown.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-purple-700">
                    <span>IGST (18.0%):</span>
                    <span className="font-mono font-semibold">{formatINR(taxBreakdown.igstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                  <span>Grand Total (Invoice Amount):</span>
                  <span className="text-blue-700 text-xs">{formatINR(taxBreakdown.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: PAYMENT DETAILS & BANK SELECTION */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Landmark size={15} className="text-amber-600" />
                Section 4: Payment Terms & Remittance Bank Account
              </h3>
              <span className="text-[10px] text-slate-500">
                Printed on Tax Invoice Document
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI">UPI Instant Remittance</option>
                  <option value="Cheque">Account Payee Cheque</option>
                  <option value="Cash">Cash Receipt</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Remittance Bank Account</label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {bankAccounts.length === 0 ? (
                    <option value="">Default Corporate Account (HDFC Bank - 50200012345678)</option>
                  ) : (
                    bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} ({b.accountType || 'Current'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Commercial Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Invoice Notes & Instructions</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              Posting status will be set to <strong className="text-blue-700">Issued</strong> with an active receivable balance.
            </span>
            <div className="flex gap-2">
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
                disabled={Boolean(existingInvoice) || !isEligible || isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                {isSubmitting ? 'Issuing Tax Invoice...' : 'Confirm & Issue Tax Invoice'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
