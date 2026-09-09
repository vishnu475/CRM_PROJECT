import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../types';
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  AlertTriangle,
  FileText,
  Eye,
  Edit,
  PackageCheck,
  Receipt,
  MoreVertical,
  Layers,
  Building2,
  Calendar,
  XCircle,
  ThumbsUp,
  Send,
  Ban,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';
import { ReceiveGoodsModal } from '../components/ReceiveGoodsModal';
import { PurchaseOrderDetailsModal } from '../components/PurchaseOrderDetailsModal';
import { CreateVendorInvoiceModal } from '../components/CreateVendorInvoiceModal';
import { RecordPurchasePaymentModal } from '../components/RecordPurchasePaymentModal';

export const PurchasesPage: React.FC = () => {
  const { purchaseOrders, vendors, updatePurchaseOrder } = useApp();

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [receiptFilter, setReceiptFilter] = useState<string>('All');
  const [invoiceFilter, setInvoiceFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);

  // Status Tabs
  const statusTabs: { label: string; value: string }[] = [
    { label: 'All', value: 'All' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Pending Approval', value: 'Pending Approval' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Ordered', value: 'Ordered' },
    { label: 'Partially Received', value: 'Partially Received' },
    { label: 'Received', value: 'Received' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  // Helper for status count badges
  const getStatusCount = (statusValue: string) => {
    if (statusValue === 'All') return purchaseOrders.length;
    return purchaseOrders.filter(po => po.status === statusValue).length;
  };

  // KPI Calculations
  const totalPurchaseOrders = purchaseOrders.length;
  const pendingApprovalCount = purchaseOrders.filter(po => po.status === 'Pending Approval').length;
  const pendingReceiptCount = purchaseOrders.filter(
    po => po.status === 'Ordered' || po.status === 'Partially Received'
  ).length;

  const totalCommittedSpend = useMemo(() => {
    return purchaseOrders
      .filter(po => po.status !== 'Cancelled')
      .reduce((sum, po) => sum + (Number(po.total_amount || po.amount) || 0), 0);
  }, [purchaseOrders]);

  // Outstanding Payables: Real sum of unpaid vendor invoice balances
  const outstandingPayables = useMemo(() => {
    const fromInvoicedPOs = purchaseOrders
      .filter(po => po.status !== 'Cancelled' && (po.vendorInvoiceNumber || po.vendor_invoice_number))
      .reduce((sum, po) => {
        const due = po.amountDue !== undefined ? po.amountDue : (po.amount_due !== undefined ? po.amount_due : Math.max(0, (po.amount || po.total_amount || 0) - (po.paidAmount || po.paid_amount || 0)));
        return sum + due;
      }, 0);

    const fromVendors = vendors.reduce((sum, v) => sum + (Number(v.payableBalance || v.payable_balance) || 0), 0);
    return Math.max(fromInvoicedPOs, fromVendors);
  }, [purchaseOrders, vendors]);

  // Check delayed delivery helper
  const isDelayed = (po: PurchaseOrder) => {
    const expDateStr = po.expectedDelivery || po.expected_delivery;
    if (!expDateStr) return false;
    if (po.status === 'Received' || po.status === 'Completed' || po.status === 'Cancelled') {
      return false;
    }
    const exp = new Date(expDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const receiptSt = po.receiptStatus || po.receipt_status;
    return exp < today && receiptSt !== 'Fully Received';
  };

  // Status badge styling
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

  // Receipt badge styling
  const getReceiptBadge = (receiptStatus?: string) => {
    switch (receiptStatus) {
      case 'Fully Received':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Received':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Not Received':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Payment badge styling
  const getPaymentBadge = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Partially Paid':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Overdue':
        return 'bg-rose-100 text-rose-800 border-rose-400 font-bold';
      case 'Unpaid':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Filtered List
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      // Status Tab filter
      if (selectedStatusTab !== 'All' && po.status !== selectedStatusTab) {
        return false;
      }
      // Vendor filter
      if (vendorFilter !== 'All' && (po.vendor_id !== vendorFilter && po.vendorId !== vendorFilter)) {
        return false;
      }
      // Receipt filter
      const rStatus = po.receiptStatus || po.receipt_status || 'Not Received';
      if (receiptFilter !== 'All' && rStatus !== receiptFilter) {
        return false;
      }
      // Invoice filter
      const invNum = po.vendorInvoiceNumber || po.vendor_invoice_number;
      const invStatus = po.invoiceStatus || po.invoice_status || (invNum ? 'Invoiced' : 'No Invoice');
      const pStatus = po.paymentStatus || po.payment_status || 'Unpaid';
      if (invoiceFilter !== 'All') {
        if (invoiceFilter === 'No Invoice' && invNum) return false;
        if (invoiceFilter === 'Invoiced' && !invNum) return false;
        if (invoiceFilter === 'Overdue' && pStatus !== 'Overdue') return false;
      }
      // Payment filter
      if (paymentFilter !== 'All' && pStatus !== paymentFilter) {
        return false;
      }
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const poNumMatch = (po.po_number || po.poNumber || '').toLowerCase().includes(term);
        const vendorMatch = (po.vendor_name || po.vendorName || '').toLowerCase().includes(term);
        const invMatch = (po.vendor_invoice_number || po.vendorInvoiceNumber || '').toLowerCase().includes(term);
        const notesMatch = (po.notes || '').toLowerCase().includes(term);
        const itemMatch = po.items?.some(i => (i.item_name || i.productName || '').toLowerCase().includes(term));
        if (!poNumMatch && !vendorMatch && !invMatch && !notesMatch && !itemMatch) {
          return false;
        }
      }
      return true;
    });
  }, [purchaseOrders, selectedStatusTab, vendorFilter, receiptFilter, invoiceFilter, paymentFilter, searchTerm]);

  // Quick Action Handlers
  const handleOpenDetails = (po: PurchaseOrder) => {
    setActivePO(po);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEdit = (po: PurchaseOrder) => {
    setActivePO(po);
    setIsEditModalOpen(true);
  };

  const handleOpenReceive = (po: PurchaseOrder) => {
    setActivePO(po);
    setIsReceiveModalOpen(true);
  };

  const handleOpenInvoice = (po: PurchaseOrder) => {
    setActivePO(po);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenPayment = (po: PurchaseOrder) => {
    setActivePO(po);
    setIsPaymentModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatusTab('All');
    setVendorFilter('All');
    setReceiptFilter('All');
    setInvoiceFilter('All');
    setPaymentFilter('All');
  };

  const hasActiveFilters = searchTerm !== '' || 
    selectedStatusTab !== 'All' || 
    vendorFilter !== 'All' || 
    receiptFilter !== 'All' || 
    invoiceFilter !== 'All' || 
    paymentFilter !== 'All';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl shadow-xs">
              <ShoppingCart className="w-6 h-6" />
            </div>
            Procurement & Purchase Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete procurement lifecycle: Purchase Orders • Goods Receipts • Vendor Invoices • Accounts Payable & Banking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> + New Purchase Order
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Purchase Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalPurchaseOrders}</p>
          <span className="text-[11px] text-slate-400 font-medium">All logged PO records</span>
        </div>

        {/* Pending Approval */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingApprovalCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">Awaiting manager review</span>
        </div>

        {/* Pending Receipt */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Receipt</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600">{pendingReceiptCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">In transit / partial</span>
        </div>

        {/* Total Committed Spend */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Committed Spend</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-700 truncate">
            ₹{totalCommittedSpend.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Non-cancelled POs</span>
        </div>

        {/* Outstanding Payables */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Payables</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 truncate">
            ₹{outstandingPayables.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Vendor AP Balance</span>
        </div>
      </div>

      {/* 3. Status Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {statusTabs.map(tab => {
          const count = getStatusCount(tab.value);
          const isActive = selectedStatusTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatusTab(tab.value)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search PO #, vendor, invoice #, notes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Vendor Filter */}
            <select
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Vendors</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            {/* Receipt Status Filter */}
            <select
              value={receiptFilter}
              onChange={e => setReceiptFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Receipts</option>
              <option value="Not Received">Not Received</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Fully Received">Fully Received</option>
            </select>

            {/* Invoice Filter */}
            <select
              value={invoiceFilter}
              onChange={e => setInvoiceFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Invoices</option>
              <option value="Invoiced">Invoiced</option>
              <option value="No Invoice">No Invoice</option>
              <option value="Overdue">Overdue</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Payments</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Primary View: Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/75">
              <tr>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-3 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Receipt Status
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(po => {
                  const delayed = isDelayed(po);
                  const orderDateFormatted = po.order_date || po.date
                    ? new Date(po.order_date || po.date!).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'N/A';

                  const deliveryDateFormatted = po.expected_delivery || po.expectedDelivery
                    ? new Date(po.expected_delivery || po.expectedDelivery!).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '—';

                  const totalDisplay = Number(po.total_amount || po.amount || 0);
                  const invNumber = po.vendorInvoiceNumber || po.vendor_invoice_number;
                  const pStatus = po.paymentStatus || po.payment_status || 'Unpaid';
                  const paid = Number(po.paidAmount || po.paid_amount || 0);
                  const due = po.amountDue !== undefined ? po.amountDue : (po.amount_due !== undefined ? po.amount_due : Math.max(0, totalDisplay - paid));

                  const canInvoice = !invNumber && po.status !== 'Cancelled' && po.status !== 'Draft' && po.status !== 'Pending Approval';
                  const canPay = Boolean(invNumber) && due > 0;

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(po)}
                    >
                      {/* 1. PO Number */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-purple-700 group-hover:underline">
                            {po.po_number || po.poNumber || po.id}
                          </span>
                          {delayed && (
                            <span
                              title="Delivery Overdue"
                              className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 flex items-center gap-0.5"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" /> Delay
                            </span>
                          )}
                        </div>
                        {po.items_count !== undefined && po.items_count > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            {po.items_count} {po.items_count === 1 ? 'item' : 'items'}
                          </span>
                        )}
                      </td>

                      {/* 2. Vendor */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 group-hover:text-purple-700 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px]">
                          {po.vendor_name || po.vendorName}
                        </div>
                        {po.paymentTerms || po.payment_terms ? (
                          <div className="text-[10px] text-slate-400 truncate">
                            {po.paymentTerms || po.payment_terms}
                          </div>
                        ) : null}
                      </td>

                      {/* 3. Order Date */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 text-xs font-medium">
                        {orderDateFormatted}
                      </td>

                      {/* 4. Expected Delivery */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            delayed ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {deliveryDateFormatted}
                        </span>
                      </td>

                      {/* 5. Amount */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        ₹{totalDisplay.toLocaleString('en-IN')}
                      </td>

                      {/* 6. Receipt Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getReceiptBadge(
                            po.receiptStatus || po.receipt_status
                          )}`}
                        >
                          {(po.receiptStatus === 'Fully Received' || po.receipt_status === 'Fully Received') && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          {po.receiptStatus || po.receipt_status || 'Not Received'}
                        </span>
                      </td>

                      {/* 7. Invoice Column */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        {invNumber ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(po)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs"
                            title="View Vendor Invoice Details"
                          >
                            <Receipt className="w-3 h-3 text-purple-600" />
                            <span>{invNumber}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            No Invoice
                          </span>
                        )}
                      </td>

                      {/* 8. Payment Column */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPaymentBadge(
                              pStatus
                            )}`}
                          >
                            {pStatus}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {pStatus === 'Paid' ? (
                              <span className="text-emerald-600 font-semibold">₹0 due</span>
                            ) : pStatus === 'Partially Paid' ? (
                              <span>₹{paid.toLocaleString('en-IN')} paid / ₹{due.toLocaleString('en-IN')} due</span>
                            ) : pStatus === 'Overdue' ? (
                              <span className="text-rose-600 font-bold">₹{due.toLocaleString('en-IN')} overdue</span>
                            ) : (
                              <span>₹{due.toLocaleString('en-IN')} due</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* 9. Order Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(
                            po.status
                          )}`}
                        >
                          {po.status}
                        </span>
                      </td>

                      {/* 10. Actions */}
                      <td
                        className="px-4 py-3.5 whitespace-nowrap text-right text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Receive Button if Ordered or Partially Received */}
                          {(po.status === 'Ordered' || po.status === 'Partially Received') && (
                            <button
                              onClick={() => handleOpenReceive(po)}
                              title="Receive Goods"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <PackageCheck className="w-3 h-3" /> Receive
                            </button>
                          )}

                          {/* Quick Create Invoice Button if eligible */}
                          {canInvoice && (
                            <button
                              onClick={() => handleOpenInvoice(po)}
                              title="Create Vendor Invoice"
                              className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Receipt className="w-3 h-3 text-purple-600" /> + Invoice
                            </button>
                          )}

                          {/* Quick Record Payment if invoiced & amount due > 0 */}
                          {canPay && (
                            <button
                              onClick={() => handleOpenPayment(po)}
                              title="Record Payment"
                              className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3 text-emerald-600" /> Pay
                            </button>
                          )}

                          {/* Quick Submit for Approval if Draft */}
                          {po.status === 'Draft' && (
                            <button
                              onClick={() => updatePurchaseOrder(po.id, { status: 'Pending Approval' })}
                              title="Submit for Approval"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Submit
                            </button>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(po)}
                            title="View Full Details"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        {hasActiveFilters ? 'No matching purchase orders found' : 'No purchase orders found'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {hasActiveFilters
                          ? 'Try adjusting your search query or clear selected filters.'
                          : 'Issue your first procurement purchase order to manage supplier delivery and commitments.'}
                      </p>
                      <div className="pt-2">
                        {hasActiveFilters ? (
                          <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                          >
                            Clear All Filters
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition"
                          >
                            + New Purchase Order
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modals */}
      {/* Create Modal */}
      <PurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <PurchaseOrderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActivePO(null);
        }}
        purchaseOrder={activePO}
      />

      {/* Details Modal */}
      <PurchaseOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setActivePO(null);
        }}
        purchaseOrder={activePO}
        onEdit={po => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(po);
        }}
        onOpenReceive={po => {
          setIsDetailsModalOpen(false);
          handleOpenReceive(po);
        }}
        onOpenInvoice={po => {
          setIsDetailsModalOpen(false);
          handleOpenInvoice(po);
        }}
        onOpenPayment={po => {
          setIsDetailsModalOpen(false);
          handleOpenPayment(po);
        }}
      />

      {/* Receive Goods Modal */}
      <ReceiveGoodsModal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setActivePO(null);
        }}
        purchaseOrder={activePO}
      />

      {/* Create Vendor Invoice Modal */}
      <CreateVendorInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setActivePO(null);
        }}
        purchaseOrder={activePO}
        onSuccess={(invNum) => {
          // Open details modal to view the newly created invoice
          if (activePO) {
            setActivePO({ ...activePO, vendorInvoiceNumber: invNum, vendor_invoice_number: invNum });
            setIsDetailsModalOpen(true);
          }
        }}
      />

      {/* Record Purchase Payment Modal */}
      <RecordPurchasePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setActivePO(null);
        }}
        purchaseOrder={activePO}
        onSuccess={() => {
          if (activePO) {
            setIsDetailsModalOpen(true);
          }
        }}
      />
    </div>
  );
};
export default PurchasesPage;
