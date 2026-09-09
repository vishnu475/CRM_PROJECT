import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Star,
  CreditCard,
  Globe,
  Truck,
  DollarSign,
  PackageCheck,
  Receipt,
  History,
  ShoppingCart,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Edit,
  Layers,
  Box
} from 'lucide-react';
import { Vendor, PurchaseOrder, PurchasePayment } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface VendorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onEdit?: (vendor: Vendor) => void;
  onCreatePO?: (vendor: Vendor) => void;
  onOpenPO?: (po: PurchaseOrder) => void;
}

type TabType = 'overview' | 'orders' | 'receipts' | 'invoices' | 'payments' | 'products';

export const VendorDetailsModal: React.FC<VendorDetailsModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onEdit,
  onCreatePO,
  onOpenPO,
}) => {
  const { purchaseOrders } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filter Purchase Orders for this vendor
  const vendorPOs = useMemo(() => {
    if (!vendor) return [];
    return purchaseOrders.filter(
      po => (
        (vendor.id && (po.vendor_id === vendor.id || po.vendorId === vendor.id)) ||
        (vendor.name && (po.vendor_name === vendor.name || po.vendorName === vendor.name))
      )
    );
  }, [purchaseOrders, vendor]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    if (!vendor) {
      return {
        totalPurchases: 0,
        totalOrders: 0,
        openOrders: 0,
        pendingReceipts: 0,
        totalPaid: 0,
        amountDue: 0,
        overdueAmount: 0,
        onTimeDeliveries: 0,
        delayedDeliveries: 0,
      };
    }

    let totalPurchases = 0;
    let openOrders = 0;
    let pendingReceipts = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalOverdue = 0;
    let onTimeDeliveries = 0;
    let delayedDeliveries = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    vendorPOs.forEach(po => {
      const amt = Number(po.total_amount || po.amount || 0);
      const paid = Number(po.paidAmount || po.paid_amount || 0);
      const invAmt = Number(po.vendorInvoiceAmount || po.vendor_invoice_amount || amt);
      const hasInvoice = Boolean(po.vendorInvoiceNumber || po.vendor_invoice_number);
      const due = hasInvoice ? Math.max(0, invAmt - paid) : 0;
      
      const dueDateStr = po.vendorInvoiceDueDate || po.vendor_invoice_due_date;
      const isOverdue = Boolean(
        hasInvoice && 
        dueDateStr && 
        new Date(dueDateStr) < today && 
        due > 0
      );

      if (po.status !== 'Cancelled') {
        totalPurchases += amt;
        totalPaid += paid;
        totalDue += due;
        if (isOverdue) totalOverdue += due;

        if (po.status !== 'Completed') {
          openOrders++;
        }

        const rStatus = po.receiptStatus || po.receipt_status;
        if (['Ordered', 'Partially Received'].includes(po.status) && rStatus !== 'Fully Received') {
          pendingReceipts++;
        }

        // Delivery timeliness
        const expDelivery = po.expectedDelivery || po.expected_delivery;
        if (expDelivery) {
          const expDate = new Date(expDelivery);
          if (rStatus === 'Fully Received') {
            onTimeDeliveries++;
          } else if (expDate < today) {
            delayedDeliveries++;
          }
        }
      }
    });

    const finalPayable = totalDue > 0 ? totalDue : (Number(vendor.payableBalance || vendor.payable_balance) || 0);

    return {
      totalPurchases: totalPurchases > 0 ? totalPurchases : (vendor.totalPurchases || 0),
      totalOrders: vendorPOs.length,
      openOrders,
      pendingReceipts,
      totalPaid,
      amountDue: finalPayable,
      overdueAmount: totalOverdue,
      onTimeDeliveries,
      delayedDeliveries,
    };
  }, [vendorPOs, vendor]);

  // Aggregate Goods Receipts from all vendor POs
  const allReceipts = useMemo(() => {
    const receiptsList: any[] = [];
    vendorPOs.forEach(po => {
      if (po.receipts && Array.isArray(po.receipts)) {
        po.receipts.forEach(r => {
          receiptsList.push({
            ...r,
            po_number: po.po_number || po.poNumber || po.id,
            po_id: po.id,
            po_date: po.order_date || po.date,
          });
        });
      }
    });
    return receiptsList.sort((a, b) => new Date(b.received_date || b.date || 0).getTime() - new Date(a.received_date || a.date || 0).getTime());
  }, [vendorPOs]);

  // Aggregate Invoices from all vendor POs
  const allInvoices = useMemo(() => {
    return vendorPOs
      .filter(po => Boolean(po.vendorInvoiceNumber || po.vendor_invoice_number))
      .map(po => {
        const total = Number(po.vendorInvoiceAmount || po.vendor_invoice_amount || po.total_amount || po.amount || 0);
        const paid = Number(po.paidAmount || po.paid_amount || 0);
        const due = po.amountDue !== undefined ? po.amountDue : (po.amount_due !== undefined ? po.amount_due : Math.max(0, total - paid));
        return {
          invoiceNumber: po.vendorInvoiceNumber || po.vendor_invoice_number,
          invoiceDate: po.vendorInvoiceDate || po.vendor_invoice_date || po.order_date || po.date,
          dueDate: po.vendorInvoiceDueDate || po.vendor_invoice_due_date,
          totalAmount: total,
          paidAmount: paid,
          amountDue: due,
          paymentStatus: po.paymentStatus || po.payment_status || 'Unpaid',
          poNumber: po.po_number || po.poNumber || po.id,
          poId: po.id,
        };
      });
  }, [vendorPOs]);

  // Aggregate Payments from all vendor POs
  const allPayments = useMemo(() => {
    const payList: any[] = [];
    vendorPOs.forEach(po => {
      if (po.payments && Array.isArray(po.payments)) {
        po.payments.forEach(p => {
          payList.push({
            ...p,
            poNumber: po.po_number || po.poNumber || po.id,
            poId: po.id,
          });
        });
      }
    });
    return payList.sort((a, b) => new Date(b.payment_date || b.paymentDate || 0).getTime() - new Date(a.payment_date || a.paymentDate || 0).getTime());
  }, [vendorPOs]);

  // Aggregate Products Supplied from PO Line Items
  const productsSupplied = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      sku: string;
      unitPrice: number;
      quantityOrdered: number;
      quantityReceived: number;
      totalSpend: number;
      ordersCount: number;
    }>();

    vendorPOs.forEach(po => {
      if (po.items && Array.isArray(po.items)) {
        po.items.forEach(item => {
          const key = item.productId || item.product_id || item.item_name || item.productName || 'Unknown';
          const existing = map.get(key) || {
            id: key,
            name: item.item_name || item.productName || 'Product',
            sku: item.sku || 'N/A',
            unitPrice: Number(item.unit_price || item.unitPrice || 0),
            quantityOrdered: 0,
            quantityReceived: 0,
            totalSpend: 0,
            ordersCount: 0,
          };

          existing.quantityOrdered += Number(item.quantity || 0);
          existing.quantityReceived += Number(item.received_quantity || item.receivedQuantity || 0);
          existing.totalSpend += Number(item.total_amount || item.total || 0);
          existing.ordersCount += 1;

          map.set(key, existing);
        });
      }
    });

    return Array.from(map.values());
  }, [vendorPOs]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'Inactive':
        return 'bg-slate-100 text-slate-600 border-slate-300 font-medium';
      case 'Suspended':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Archived':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getPoStatusBadge = (status: string) => {
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

  const getPaymentBadge = (status?: string) => {
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

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        
        {/* Top Supplier Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md shadow-inner">
              <Building2 className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {vendor.name}
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-white/15 text-teal-200 border border-white/20 font-bold">
                  {vendor.code || vendor.id}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-200 border border-teal-400/30 font-medium">
                  {vendor.category || 'General'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getStatusBadge(vendor.status)}`}>
                  {vendor.status || 'Active'}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 text-xs font-bold border border-amber-400/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {vendor.rating || 5.0}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1">
                Contact: <span className="font-semibold text-white">{vendor.contactPerson || vendor.contact_person || 'Procurement Rep'}</span> • {vendor.email} • {vendor.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCreatePO && (
              <button
                onClick={() => onCreatePO(vendor)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Purchase Order
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(vendor)}
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
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

        {/* 6 Key Financial & Procurement Metrics */}
        <div className="bg-slate-50 border-b border-slate-200/90 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs flex-shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Purchases</span>
            <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">
              ₹{metrics.totalPurchases.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500">{metrics.totalOrders} total order{metrics.totalOrders === 1 ? '' : 's'}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Open Orders</span>
            <span className="text-sm font-black text-indigo-700 block mt-0.5">
              {metrics.openOrders}
            </span>
            <span className="text-[10px] text-slate-500">In process</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Receipts</span>
            <span className="text-sm font-black text-amber-700 block mt-0.5">
              {metrics.pendingReceipts}
            </span>
            <span className="text-[10px] text-slate-500">In transit</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Due</span>
            <span className={`text-sm font-black font-mono block mt-0.5 ${metrics.amountDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              ₹{metrics.amountDue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500">Accounts Payable</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Amount</span>
            <span className="text-sm font-black text-emerald-700 font-mono block mt-0.5">
              ₹{metrics.totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500">Settled to date</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Payables</span>
            <span className={`text-sm font-black font-mono block mt-0.5 ${metrics.overdueAmount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
              ₹{metrics.overdueAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500">Past due date</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white flex-shrink-0 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Overview & Profile
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Purchase Orders ({vendorPOs.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'receipts'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" /> Goods Receipts ({allReceipts.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices ({allInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Payment History ({allPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Products Supplied ({productsSupplied.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          
          {/* TAB 1: OVERVIEW & PROFILE */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Contact & Company Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" /> Supplier Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Primary Contact Person:</span>
                      <span className="font-semibold text-slate-800">{vendor.contactPerson || vendor.contact_person || 'Procurement Rep'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email Address:</span>
                      <a href={`mailto:${vendor.email}`} className="font-semibold text-teal-700 hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {vendor.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phone Number:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {vendor.phone || 'N/A'}
                      </span>
                    </div>
                    {vendor.website && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Website:</span>
                        <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noreferrer" className="text-teal-700 font-medium hover:underline flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" /> {vendor.website} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax & Commercial Terms */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Commercial & Tax Terms
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Default Payment Terms:</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                        {vendor.paymentTerms || vendor.payment_terms || 'Net 30 Days'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">GSTIN / Tax Registration:</span>
                      <span className="font-mono font-semibold text-slate-800">{vendor.gstin || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Supplier Rating:</span>
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {vendor.rating || 5.0} / 5.0
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Registered Address:</span>
                      <span className="text-slate-700 leading-relaxed block">{vendor.address || 'No physical address recorded'}</span>
                    </div>
                  </div>
                </div>

                {/* Performance & Fulfillment */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-600" /> Delivery Performance
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Total Purchase Orders:</span>
                      <span className="font-bold text-slate-900">{metrics.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">On-Time Deliveries:</span>
                      <span className="font-bold text-emerald-700">{metrics.onTimeDeliveries}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Delayed Deliveries:</span>
                      <span className={`font-bold ${metrics.delayedDeliveries > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {metrics.delayedDeliveries}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Fulfillment Ratio:</span>
                      <span className="font-bold text-teal-700">
                        {metrics.totalOrders > 0 ? Math.round((metrics.onTimeDeliveries / metrics.totalOrders) * 100) : 100}%
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Vendor Notes */}
              {vendor.notes && (
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-800 uppercase tracking-wider block mb-1">Procurement Notes & Agreements</span>
                  <p className="text-slate-700 whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PURCHASE ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Purchase Orders Issued to {vendor.name}</h3>
                {onCreatePO && (
                  <button
                    onClick={() => onCreatePO(vendor)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> + New PO
                  </button>
                )}
              </div>

              {vendorPOs.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600 uppercase">PO Number</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Order Date</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Expected Delivery</th>
                        <th className="px-3 py-2.5 text-right font-bold text-slate-600 uppercase">Amount</th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-600 uppercase">Receipt</th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-600 uppercase">Invoice</th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-600 uppercase">Payment</th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-600 uppercase">Status</th>
                        <th className="px-3 py-2.5 text-right font-bold text-slate-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {vendorPOs.map(po => {
                        const total = Number(po.total_amount || po.amount || 0);
                        const invNum = po.vendorInvoiceNumber || po.vendor_invoice_number;
                        const pStatus = po.paymentStatus || po.payment_status || 'Unpaid';
                        return (
                          <tr key={po.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-bold text-purple-700">
                              {po.po_number || po.poNumber || po.id}
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              {po.order_date || po.date ? new Date(po.order_date || po.date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              {po.expectedDelivery || po.expected_delivery ? new Date(po.expectedDelivery || po.expected_delivery!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                              ₹{total.toLocaleString('en-IN')}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {po.receiptStatus || po.receipt_status || 'Not Received'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {invNum ? (
                                <span className="font-mono font-bold text-purple-700 text-[11px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  {invNum}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">No Invoice</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getPaymentBadge(pStatus)}`}>
                                {pStatus}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPoStatusBadge(po.status)}`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              {onOpenPO && (
                                <button
                                  onClick={() => onOpenPO(po)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                                >
                                  View PO <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
                  <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No purchase orders have been created for {vendor.name} yet.</p>
                  {onCreatePO && (
                    <button
                      onClick={() => onCreatePO(vendor)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      + Create First Purchase Order
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GOODS RECEIPTS (STOCK-IN LOG) */}
          {activeTab === 'receipts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" /> Warehouse Goods Receipts (Stock-In History)
              </h3>

              {allReceipts.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600 uppercase">GRN Number</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">PO Reference</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Receipt Date</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Delivery Note (DC)</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Received By</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {allReceipts.map((grn, idx) => (
                        <tr key={grn.id || idx} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                            {grn.receipt_number || grn.receiptNumber || `GRN-${idx + 1}`}
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-purple-700">
                            {grn.po_number}
                          </td>
                          <td className="px-3 py-3 text-slate-700 font-medium">
                            {new Date(grn.received_date || grn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-600">
                            {grn.delivery_note_number || grn.deliveryNoteNumber || '—'}
                          </td>
                          <td className="px-3 py-3 text-slate-800 font-semibold">
                            {grn.received_by || grn.receivedBy || 'Warehouse Staff'}
                          </td>
                          <td className="px-3 py-3 text-slate-500 italic max-w-xs truncate">
                            {grn.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No warehouse goods receipts recorded for this vendor.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVOICES & PAYABLES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" /> Vendor Invoices & Accounts Payable
              </h3>

              {allInvoices.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600 uppercase">Invoice Number</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">PO Reference</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Invoice Date</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Due Date</th>
                        <th className="px-3 py-2.5 text-right font-bold text-slate-600 uppercase">Total</th>
                        <th className="px-3 py-2.5 text-right font-bold text-slate-600 uppercase">Paid</th>
                        <th className="px-3 py-2.5 text-right font-bold text-slate-600 uppercase">Amount Due</th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {allInvoices.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-purple-800">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-slate-700">
                            {inv.poNumber}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className={`px-3 py-3 ${inv.paymentStatus === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                            ₹{inv.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className={`px-3 py-3 text-right font-mono font-black ${inv.amountDue > 0 ? (inv.paymentStatus === 'Overdue' ? 'text-rose-600' : 'text-amber-800') : 'text-slate-500'}`}>
                            ₹{inv.amountDue.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getPaymentBadge(inv.paymentStatus)}`}>
                              {inv.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No vendor invoices recorded for {vendor.name} yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" /> Banking Settlement & Payment Disbursements
              </h3>

              {allPayments.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600 uppercase">Payment #</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Payment Date</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">PO Reference</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Method & UTR</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">Bank Account</th>
                        <th className="px-4 py-2.5 text-right font-bold text-slate-600 uppercase">Disbursed Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {allPayments.map((pay, idx) => (
                        <tr key={pay.id || idx} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {pay.payment_number || pay.paymentNumber || `PAY-${idx + 1}`}
                          </td>
                          <td className="px-3 py-3 text-slate-700 font-medium">
                            {new Date(pay.payment_date || pay.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-purple-700">
                            {pay.poNumber}
                          </td>
                          <td className="px-3 py-3 text-slate-800">
                            <span className="font-semibold">{pay.payment_method || pay.paymentMethod}</span>
                            {(pay.reference_number || pay.referenceNumber) && (
                              <span className="font-mono text-slate-500 text-[10px] ml-1.5">
                                ({pay.reference_number || pay.referenceNumber})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {pay.bank_account_name || pay.bankAccountName || 'Direct / Cash'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            ₹{Number(pay.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No payment disbursements recorded for {vendor.name} yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PRODUCTS SUPPLIED */}
          {activeTab === 'products' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Box className="w-4 h-4 text-teal-600" /> Products & Catalog Items Supplied by {vendor.name}
              </h3>

              {productsSupplied.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600 uppercase">Product Name / Item</th>
                        <th className="px-3 py-2.5 text-left font-bold text-slate-600 uppercase">SKU</th>
                        <th className="px-3 py-2.5 text-right font-bold text-slate-600 uppercase">Unit Price</th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-600 uppercase">Total Ordered</th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-600 uppercase">Total Received</th>
                        <th className="px-4 py-2.5 text-right font-bold text-slate-600 uppercase">Cumulative Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {productsSupplied.map((prod, idx) => (
                        <tr key={prod.id || idx} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {prod.name}
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-600 text-[11px]">
                            {prod.sku}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-medium text-slate-700">
                            ₹{prod.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-800">
                            {prod.quantityOrdered}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-emerald-700">
                            {prod.quantityReceived}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            ₹{prod.totalSpend.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  No products catalogued from purchases with this vendor yet.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Supplier ID: <span className="font-mono font-bold text-slate-700">{vendor.id}</span>
          </div>
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
