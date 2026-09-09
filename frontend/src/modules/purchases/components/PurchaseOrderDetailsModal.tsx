import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  DollarSign,
  Send,
  ThumbsUp,
  PackageCheck,
  Receipt,
  Ban,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Building,
  History,
  AlertCircle
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface PurchaseOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onEdit?: (po: PurchaseOrder) => void;
  onOpenReceive?: (po: PurchaseOrder) => void;
  onOpenInvoice?: (po: PurchaseOrder) => void;
  onOpenPayment?: (po: PurchaseOrder) => void;
  onNavigateVendor?: (vendorId: string) => void;
}

export const PurchaseOrderDetailsModal: React.FC<PurchaseOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onEdit,
  onOpenReceive,
  onOpenInvoice,
  onOpenPayment,
  onNavigateVendor
}) => {
  const { updatePurchaseOrder, vendors } = useApp();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !purchaseOrder) return null;

  const vendorObj = vendors.find(v => v.id === (purchaseOrder.vendor_id || purchaseOrder.vendorId));

  const poNumber = purchaseOrder.poNumber || purchaseOrder.po_number || purchaseOrder.id;
  const vendorName = purchaseOrder.vendorName || purchaseOrder.vendor_name || 'Vendor';
  const poAmount = purchaseOrder.amount || purchaseOrder.total_amount || 0;
  const invoiceNumber = purchaseOrder.vendorInvoiceNumber || purchaseOrder.vendor_invoice_number;
  const invoiceDate = purchaseOrder.vendorInvoiceDate || purchaseOrder.vendor_invoice_date;
  const invoiceDueDate = purchaseOrder.vendorInvoiceDueDate || purchaseOrder.vendor_invoice_due_date;
  const invoiceAmount = purchaseOrder.vendorInvoiceAmount || purchaseOrder.vendor_invoice_amount || poAmount;
  const paidAmount = purchaseOrder.paidAmount || purchaseOrder.paid_amount || 0;
  const amountDue = purchaseOrder.amountDue !== undefined ? purchaseOrder.amountDue : (purchaseOrder.amount_due !== undefined ? purchaseOrder.amount_due : Math.max(0, invoiceAmount - paidAmount));
  const paymentStatus = purchaseOrder.paymentStatus || purchaseOrder.payment_status || 'Unpaid';
  const invoiceStatus = purchaseOrder.invoiceStatus || purchaseOrder.invoice_status || (invoiceNumber ? 'Invoiced' : 'No Invoice');

  // Status badge style helper
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Pending Approval':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ordered':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Partially Received':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Received':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Completed':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Payment status badge helper
  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'Partially Paid':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Overdue':
        return 'bg-rose-100 text-rose-800 border-rose-400 font-black animate-pulse';
      case 'Unpaid':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    }
  };

  // Check if expected delivery is delayed
  const isDelayed = () => {
    const expDateStr = purchaseOrder.expectedDelivery || purchaseOrder.expected_delivery;
    if (!expDateStr) return false;
    if (purchaseOrder.status === 'Received' || purchaseOrder.status === 'Completed' || purchaseOrder.status === 'Cancelled') {
      return false;
    }
    const exp = new Date(expDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const receiptSt = purchaseOrder.receiptStatus || purchaseOrder.receipt_status;
    return exp < today && (receiptSt !== 'Fully Received');
  };

  const handleStatusTransition = async (newStatus: PurchaseOrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updatePurchaseOrder(purchaseOrder.id, { status: newStatus });
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Lifecycle steps for the tracker
  const steps: { label: string; status: PurchaseOrderStatus }[] = [
    { label: 'Draft', status: 'Draft' },
    { label: 'Pending Approval', status: 'Pending Approval' },
    { label: 'Approved', status: 'Approved' },
    { label: 'Ordered', status: 'Ordered' },
    { label: 'Received', status: 'Received' },
    { label: 'Completed', status: 'Completed' }
  ];

  const getStepState = (stepStatus: PurchaseOrderStatus) => {
    if (purchaseOrder.status === 'Cancelled') return 'cancelled';
    const statusOrder = ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Partially Received', 'Received', 'Completed'];
    const currentIdx = statusOrder.indexOf(purchaseOrder.status);
    const targetIdx = statusOrder.indexOf(stepStatus);

    if (purchaseOrder.status === stepStatus || (stepStatus === 'Received' && purchaseOrder.status === 'Partially Received')) {
      return 'active';
    }
    if (currentIdx >= targetIdx) {
      return 'completed';
    }
    return 'upcoming';
  };

  // Eligibility to create invoice: PO not cancelled, not draft, not pending approval (or has receipts/approved)
  const canCreateInvoice = !invoiceNumber && 
    purchaseOrder.status !== 'Cancelled' && 
    purchaseOrder.status !== 'Draft' && 
    purchaseOrder.status !== 'Pending Approval';

  const canRecordPayment = Boolean(invoiceNumber) && amountDue > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md shadow-inner">
              <FileText className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold font-mono tracking-tight text-white">
                  {poNumber}
                </h2>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(purchaseOrder.status)}`}>
                  {purchaseOrder.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getPaymentStatusBadge(paymentStatus)}`}>
                  Payment: {paymentStatus}
                </span>
                {invoiceNumber ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-900/60 text-purple-200 border border-purple-500/40">
                    {invoiceNumber}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    No Invoice
                  </span>
                )}
                {isDelayed() && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Delayed
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs mt-1">
                Vendor: <span className="font-semibold text-white">{vendorName}</span> • PO Date: {purchaseOrder.order_date || purchaseOrder.date ? new Date(purchaseOrder.order_date || purchaseOrder.date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {purchaseOrder.status === 'Draft' && onEdit && (
              <button
                onClick={() => onEdit(purchaseOrder)}
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Edit PO
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workflow Action Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Stage: <strong className="text-slate-900">{purchaseOrder.status}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Receipt: <strong className="text-slate-900">{purchaseOrder.receiptStatus || purchaseOrder.receipt_status || 'Not Received'}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Draft Actions */}
            {purchaseOrder.status === 'Draft' && (
              <>
                <button
                  onClick={() => handleStatusTransition('Pending Approval')}
                  disabled={isUpdatingStatus}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit for Approval
                </button>
                <button
                  onClick={() => handleStatusTransition('Cancelled')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" /> Cancel PO
                </button>
              </>
            )}

            {/* Pending Approval Actions */}
            {purchaseOrder.status === 'Pending Approval' && (
              <>
                <button
                  onClick={() => handleStatusTransition('Approved')}
                  disabled={isUpdatingStatus}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Approve Purchase Order
                </button>
                <button
                  onClick={() => handleStatusTransition('Draft')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Return to Draft
                </button>
                <button
                  onClick={() => handleStatusTransition('Cancelled')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  Reject & Cancel
                </button>
              </>
            )}

            {/* Approved Actions */}
            {purchaseOrder.status === 'Approved' && (
              <>
                <button
                  onClick={() => handleStatusTransition('Ordered')}
                  disabled={isUpdatingStatus}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" /> Mark as Ordered / Dispatched
                </button>
                <button
                  onClick={() => handleStatusTransition('Cancelled')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  Cancel Order
                </button>
              </>
            )}

            {/* Receiving Goods Action */}
            {(purchaseOrder.status === 'Ordered' || purchaseOrder.status === 'Partially Received') && onOpenReceive && (
              <button
                onClick={() => onOpenReceive(purchaseOrder)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                <PackageCheck className="w-3.5 h-3.5" /> Receive Goods (Stock-In)
              </button>
            )}

            {/* Vendor Invoice Action */}
            {canCreateInvoice && onOpenInvoice && (
              <button
                onClick={() => onOpenInvoice(purchaseOrder)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" /> Create Vendor Invoice
              </button>
            )}

            {/* Payment Action */}
            {canRecordPayment && onOpenPayment && (
              <button
                onClick={() => onOpenPayment(purchaseOrder)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" /> Record Payment (₹{amountDue.toLocaleString('en-IN')})
              </button>
            )}

            {/* Complete PO Action */}
            {purchaseOrder.status === 'Received' && (
              <button
                onClick={() => handleStatusTransition('Completed')}
                disabled={isUpdatingStatus}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark Completed
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          
          {/* Procurement Lifecycle Stepper */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Procurement Workflow Progress</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {steps.map((step, idx) => {
                const state = getStepState(step.status);
                let bgStyle = 'bg-white text-slate-400 border-slate-200';
                let icon = <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">{idx + 1}</span>;

                if (state === 'completed') {
                  bgStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
                  icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
                } else if (state === 'active') {
                  bgStyle = 'bg-indigo-50 text-indigo-800 border-indigo-400 ring-2 ring-indigo-500/20 font-bold';
                  icon = <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />;
                }

                return (
                  <div key={step.status} className={`p-2.5 rounded-lg border text-xs flex flex-col items-center justify-center text-center gap-1 transition-all ${bgStyle}`}>
                    <div className="flex items-center gap-1.5">{icon}</div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FINANCIAL SECTION: VENDOR INVOICE & PAYMENT TRACKING */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Financial & Settlement Summary</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Vendor Invoice & Accounts Payable payment reconciliation</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canCreateInvoice && onOpenInvoice && (
                  <button
                    onClick={() => onOpenInvoice(purchaseOrder)}
                    className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" /> [ Create Vendor Invoice ]
                  </button>
                )}
                {canRecordPayment && onOpenPayment && (
                  <button
                    onClick={() => onOpenPayment(purchaseOrder)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> [ Record Payment ]
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Invoice Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-purple-600" /> Vendor Invoice
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    invoiceNumber ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {invoiceStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {invoiceNumber || 'Not Generated'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Invoice Amount:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{invoiceAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Invoice Date:</span>
                    <span className="font-medium text-slate-800">
                      {invoiceDate ? new Date(invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Due Date:</span>
                    <span className={`font-semibold ${paymentStatus === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                      {invoiceDueDate ? new Date(invoiceDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>

                {purchaseOrder.paymentTerms || purchaseOrder.payment_terms && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Payment Terms:</span>
                    <span className="font-semibold text-slate-700">{purchaseOrder.paymentTerms || purchaseOrder.payment_terms}</span>
                  </div>
                )}
              </div>

              {/* Payment Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> Settlement & Banking
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${getPaymentStatusBadge(paymentStatus)}`}>
                    {paymentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Amount Paid:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      ₹{paidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Amount Due:</span>
                    <span className={`font-mono font-black text-sm ${amountDue > 0 ? (paymentStatus === 'Overdue' ? 'text-rose-600' : 'text-amber-700') : 'text-slate-700'}`}>
                      ₹{amountDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Last Payment Date:</span>
                    <span className="font-medium text-slate-800">
                      {purchaseOrder.lastPaymentDate || purchaseOrder.last_payment_date ? 
                        new Date(purchaseOrder.lastPaymentDate || purchaseOrder.last_payment_date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Payment Reference:</span>
                    <span className="font-mono text-slate-700 truncate block">
                      {purchaseOrder.lastPaymentReference || purchaseOrder.last_payment_reference || '—'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">AP Balance Status:</span>
                  <span className={`font-bold ${amountDue === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {amountDue === 0 ? 'Fully Settled (₹0 Due)' : `₹${amountDue.toLocaleString('en-IN')} Pending`}
                  </span>
                </div>
              </div>

            </div>

            {/* Payment History Log */}
            {purchaseOrder.payments && purchaseOrder.payments.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-600" /> Payment History & Banking Transactions
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {purchaseOrder.payments.length} transaction{purchaseOrder.payments.length > 1 ? 's' : ''} recorded
                  </span>
                </div>

                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Reference / Method</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Bank Account</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {purchaseOrder.payments.map((pay: any, pIdx: number) => (
                        <tr key={pay.id || pIdx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-slate-800 font-medium">
                            {new Date(pay.payment_date || pay.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            <span className="font-mono font-semibold text-slate-900">{pay.payment_number || pay.paymentNumber || `PAY-${pIdx + 1}`}</span>
                            <span className="text-slate-400 mx-1">•</span>
                            <span className="text-slate-600">{pay.payment_method || pay.paymentMethod}</span>
                            {(pay.reference_number || pay.referenceNumber) && (
                              <span className="text-slate-500 font-mono text-[10px] ml-1">({pay.reference_number || pay.referenceNumber})</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {pay.bank_account_name || pay.bankAccountName || 'Direct / Cash'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                            ₹{Number(pay.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* PO Details & Vendor Profile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Vendor Card */}
            <div className="md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Vendor Details
                  </span>
                  {onNavigateVendor && (purchaseOrder.vendor_id || purchaseOrder.vendorId) && (
                    <button
                      onClick={() => onNavigateVendor((purchaseOrder.vendor_id || purchaseOrder.vendorId)!)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      View Profile <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-900">{vendorName}</h4>

                {vendorObj && (
                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    {vendorObj.contact_person && (
                      <p className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Contact:</span>
                        <span className="font-semibold text-slate-800">{vendorObj.contact_person}</span>
                      </p>
                    )}
                    {vendorObj.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{vendorObj.email}</span>
                      </p>
                    )}
                    {vendorObj.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{vendorObj.phone}</span>
                      </p>
                    )}
                    {vendorObj.address && (
                      <p className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{vendorObj.address}</span>
                      </p>
                    )}
                    {vendorObj.gstin && (
                      <p className="text-[11px] text-slate-500 pt-1 font-mono">
                        GSTIN: <span className="font-semibold text-slate-700">{vendorObj.gstin}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {vendorObj?.payable_balance !== undefined && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Outstanding Payable:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{vendorObj.payable_balance.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* PO Specifications */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Order Date</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">
                  {purchaseOrder.order_date || purchaseOrder.date ? new Date(purchaseOrder.order_date || purchaseOrder.date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Expected Delivery</span>
                <span className={`text-sm font-semibold mt-1 block ${isDelayed() ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                  {purchaseOrder.expectedDelivery || purchaseOrder.expected_delivery ? new Date(purchaseOrder.expectedDelivery || purchaseOrder.expected_delivery!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not specified'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Payment Terms</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">
                  {purchaseOrder.paymentTerms || purchaseOrder.payment_terms || 'Net 30'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Receipt Status</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">
                  {purchaseOrder.receiptStatus || purchaseOrder.receipt_status || 'Not Received'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Delivery Location</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">
                  {purchaseOrder.deliveryLocation || purchaseOrder.delivery_location || 'Main Central Warehouse'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Invoice Number</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block">
                  {invoiceNumber ? (
                    <span className="text-purple-700 font-mono font-bold">{invoiceNumber}</span>
                  ) : (
                    <span className="text-slate-400 italic">No Invoice</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table with Receiving Traceability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Procurement Items & Receiving Status</h3>
              <span className="text-xs text-slate-500 font-medium">
                {purchaseOrder.items?.length || 0} line items
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Item / SKU</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Ordered</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Received</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Pending</th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Unit Price</th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Tax (GST)</th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                    purchaseOrder.items.map((item, idx) => {
                      const received = item.received_quantity || item.receivedQuantity || 0;
                      const pending = Math.max(0, item.quantity - received);
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 text-sm">{item.item_name || item.productName}</div>
                            {item.sku && (
                              <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono mt-0.5">
                                SKU: {item.sku}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center text-sm font-medium text-slate-800">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-center text-sm font-bold text-emerald-600">
                            {received}
                          </td>
                          <td className="px-3 py-3 text-center text-sm font-semibold">
                            <span className={pending > 0 ? 'text-amber-600' : 'text-slate-400'}>
                              {pending}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-medium text-slate-700 font-mono">
                            ₹{Number(item.unit_price || item.unitPrice || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-slate-600">
                            {item.tax_rate || item.taxRate || 18}%
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 font-mono">
                            ₹{Number(item.total_amount || item.total || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">
                        No line items detailed for this PO.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="w-full md:w-1/2 space-y-3">
              {purchaseOrder.notes && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Notes & Terms</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">₹{Number(purchaseOrder.subtotal || poAmount).toLocaleString('en-IN')}</span>
              </div>
              {Number(purchaseOrder.discount_amount || purchaseOrder.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-xs text-rose-600">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{Number(purchaseOrder.discount_amount || purchaseOrder.discountAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-600">
                <span>GST / Tax (18%):</span>
                <span className="font-mono font-medium">₹{Number(purchaseOrder.tax_amount || purchaseOrder.taxAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-700 text-base">₹{Number(poAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Goods Receipts (GRN) History */}
          {purchaseOrder.receipts && purchaseOrder.receipts.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-emerald-600" /> Goods Receipts & Warehouse Stock-In Log
              </h3>
              <div className="space-y-2">
                {purchaseOrder.receipts.map((grn: any) => (
                  <div key={grn.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {grn.receipt_number || grn.receiptNumber}
                      </span>
                      <span className="text-slate-600">
                        Received on {new Date(grn.received_date || grn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {(grn.delivery_note_number || grn.deliveryNoteNumber) && (
                        <span className="text-slate-500 font-mono text-[11px]">
                          (DC: {grn.delivery_note_number || grn.deliveryNoteNumber})
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600">
                      Receiver: <span className="font-semibold text-slate-800">{grn.received_by || grn.receivedBy || 'Warehouse Staff'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
