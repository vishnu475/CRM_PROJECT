import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, SalesOrder, Invoice, QuotationStatus, SalesOrderStatus, InvoiceStatus } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { 
  TrendingUp, Plus, Search, FileText, ShoppingCart, CheckCircle2, 
  ChevronRight, RefreshCw, Send, Check, Eye, MoreVertical,
  Receipt, DollarSign, ArrowRight, Tag, Loader2, User,
  UserCheck, History, Phone, Mail, Sparkles, AlertCircle, Building2, Calendar, FileCheck,
  Truck, Hash, Lock, MapPin, X
} from 'lucide-react';
import { QuotationModal } from '../components/QuotationModal';
import { SalesOrderModal } from '../components/SalesOrderModal';
import { InvoiceModal } from '../components/InvoiceModal';
import { TaxInvoiceDocumentModal } from '../components/TaxInvoiceDocumentModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { CRMInvoicesAPI } from '../../../services/apiService';
import { CRM_LOST_REASONS } from '../../crm/utils/leadWorkflowValidation';

export const SalesPage: React.FC = () => {
  const { 
    leads,
    quotations, 
    salesOrders, 
    invoices, 
    updateQuotation, 
    deleteQuotation,
    sendQuotation,
    updateSalesOrder,
    deleteSalesOrder,
    updateInvoice,
    deleteInvoice
  } = useApp();

  const [activeTab, setActiveTab] = useState<'qualified' | 'quotes' | 'orders' | 'invoices'>('qualified');
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-filters per tab
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('All');

  // Modals state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [initialLeadIdForQuote, setInitialLeadIdForQuote] = useState<string | undefined>(undefined);
  const [isDefinitiveLoss, setIsDefinitiveLoss] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedQuoteForOrder, setSelectedQuoteForOrder] = useState<Quotation | null>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrder | null>(null);
  const [selectedInvoiceForDoc, setSelectedInvoiceForDoc] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  // Sales Order Details Modal state
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<SalesOrder | null>(null);

  // Revision History Modal state
  const [selectedQuoteForHistory, setSelectedQuoteForHistory] = useState<Quotation | null>(null);

  // Rejection Modal state
  const [rejectionModalQuote, setRejectionModalQuote] = useState<Quotation | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Price / Budget Constraints');
  const [rejectReasonDetails, setRejectReasonDetails] = useState<string>('');
  const [rejectNotes, setRejectNotes] = useState<string>('');

  // 1. Qualified Leads from CRM (Single source of truth)
  const qualifiedLeads = useMemo(() => {
    return leads.filter(l => l.stage === 'Qualified');
  }, [leads]);

  const filteredQualifiedLeads = useMemo(() => {
    return qualifiedLeads.filter(l => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = (l.name || '').toLowerCase().includes(term);
        const matchesCompany = (l.company || '').toLowerCase().includes(term);
        const matchesContact = (l.contactPerson || '').toLowerCase().includes(term);
        const matchesEmail = (l.email || '').toLowerCase().includes(term);
        const matchesPhone = (l.phone || '').toLowerCase().includes(term);
        const matchesReq = (l.requirement || '').toLowerCase().includes(term);
        const matchesOwner = (l.assignedTo || '').toLowerCase().includes(term);
        if (!matchesName && !matchesCompany && !matchesContact && !matchesEmail && !matchesPhone && !matchesReq && !matchesOwner) {
          return false;
        }
      }
      return true;
    });
  }, [qualifiedLeads, searchTerm]);

  // 2. Comprehensive KPI Stats Computations from live data
  const metrics = useMemo(() => {
    const qualifiedLeadsCount = leads.filter(l => l.stage === 'Qualified').length;
    const sentQuotesCount = quotations.filter(q => q.status === 'Sent').length;
    const revisionRequestedCount = quotations.filter(q => q.status === 'Revision Requested').length;
    const acceptedQuotesCount = quotations.filter(q => q.status === 'Accepted' || q.status === 'Approved').length;
    const rejectedQuotesCount = quotations.filter(q => q.status === 'Rejected').length;

    const totalQuoteValue = quotations.reduce((sum, q) => sum + (parseFloat(q.amount as any) || 0), 0);
    const activeQuotes = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent' || q.status === 'Revised' || q.status === 'Accepted');
    const activeQuoteValue = activeQuotes.reduce((sum, q) => sum + (parseFloat(q.amount as any) || 0), 0);

    const confirmedOrders = salesOrders.filter(so => so.status !== 'Cancelled');
    const confirmedOrdersValue = confirmedOrders.reduce((sum, so) => sum + (parseFloat(so.totalAmount as any) || 0), 0);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount as any) || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paidAmount as any) || 0), 0);
    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

    return {
      qualifiedLeadsCount,
      totalQuoteValue,
      activeQuoteValue,
      sentQuotesCount,
      revisionRequestedCount,
      acceptedQuotesCount,
      rejectedQuotesCount,
      confirmedOrdersCount: confirmedOrders.length,
      confirmedOrdersValue,
      totalInvoiced,
      outstandingBalance,
      totalQuotesCount: quotations.length,
    };
  }, [leads, quotations, salesOrders, invoices]);

  // Quotation History List for Modal
  const quotationHistory = useMemo(() => {
    if (!selectedQuoteForHistory) return [];
    const groupId = selectedQuoteForHistory.revisionGroupId || selectedQuoteForHistory.id;
    const lId = selectedQuoteForHistory.leadId;
    return quotations.filter(q =>
      (q.revisionGroupId && q.revisionGroupId === groupId) ||
      (groupId && q.id === groupId) ||
      (lId && q.leadId === lId) ||
      q.id === selectedQuoteForHistory.id
    ).sort((a, b) => (Number(a.revisionNumber) || 1) - (Number(b.revisionNumber) || 1));
  }, [selectedQuoteForHistory, quotations]);

  const handleCreateQuoteFromLead = (lead: any) => {
    setInitialLeadIdForQuote(lead.id);
    setEditingQuotation(null);
    setIsRevisionMode(false);
    setShowQuoteModal(true);
  };

  // 2. Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      if (quoteStatusFilter !== 'All' && q.status !== quoteStatusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = (q.quoteNumber || '').toLowerCase().includes(term);
        const matchesCust = (q.customerName || '').toLowerCase().includes(term);
        const matchesOwner = (q.owner || '').toLowerCase().includes(term);
        if (!matchesNum && !matchesCust && !matchesOwner) return false;
      }
      return true;
    });
  }, [quotations, quoteStatusFilter, searchTerm]);

  // 3. Filtered Sales Orders
  const filteredOrders = useMemo(() => {
    return salesOrders.filter(so => {
      if (orderStatusFilter !== 'All') {
        if (so.status !== orderStatusFilter && so.fulfillmentStatus !== orderStatusFilter) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = (so.soNumber || '').toLowerCase().includes(term);
        const matchesCust = (so.customerName || '').toLowerCase().includes(term);
        const matchesQuote = (so.quoteNumber || '').toLowerCase().includes(term);
        if (!matchesNum && !matchesCust && !matchesQuote) return false;
      }
      return true;
    });
  }, [salesOrders, orderStatusFilter, searchTerm]);

  // 4. Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (invoiceStatusFilter !== 'All' && inv.status !== invoiceStatusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = (inv.invoiceNumber || '').toLowerCase().includes(term);
        const matchesCust = (inv.customerName || '').toLowerCase().includes(term);
        const matchesOrder = (inv.salesOrderNumber || '').toLowerCase().includes(term);
        if (!matchesNum && !matchesCust && !matchesOrder) return false;
      }
      return true;
    });
  }, [invoices, invoiceStatusFilter, searchTerm]);

  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null);

  // Quotation Workflow Action Handlers
  const handleSendQuote = async (quote: Quotation) => {
    if (sendingQuoteId) return;
    setSendingQuoteId(quote.id);
    try {
      await sendQuotation(quote.id);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch quotation email.');
    } finally {
      setSendingQuoteId(null);
    }
  };

  const handleAcceptQuote = async (quote: Quotation) => {
    await updateQuotation(quote.id, {
      status: 'Accepted',
      acceptedDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleRequestRevision = async (quote: Quotation) => {
    await updateQuotation(quote.id, {
      status: 'Revision Requested',
    });
  };

  const handleOpenReviseModal = (quote: Quotation) => {
    setEditingQuotation(quote);
    setIsRevisionMode(true);
    setShowQuoteModal(true);
  };

  const handleRejectQuote = async (quote: Quotation) => {
    setRejectionModalQuote(quote);
    setIsDefinitiveLoss(false);
    setRejectReason('Customer chose competitor');
    setRejectReasonDetails('');
    setRejectNotes('');
  };

  const handleConfirmRejectQuote = async () => {
    if (!rejectionModalQuote) return;

    if (isDefinitiveLoss) {
      const reason = rejectReason.trim();
      if (!reason) {
        alert('Please select a Lost Reason.');
        return;
      }
      if (reason === 'Other' && !rejectReasonDetails.trim() && !rejectNotes.trim()) {
        alert('Please provide a custom explanation when selecting "Other" as the Lost Reason.');
        return;
      }
      if (!rejectNotes.trim()) {
        alert('Please provide Lost Notes/Comments explaining why this deal was lost.');
        return;
      }

      try {
        await updateQuotation(rejectionModalQuote.id, {
          status: 'Rejected',
          isDefinitiveLoss: true,
          lostReason: reason,
          lostReasonDetails: rejectReasonDetails.trim(),
          lostNotes: rejectNotes.trim(),
        } as any);
        setRejectionModalQuote(null);
      } catch (err: any) {
        // Handled inside AppContext
      }
    } else {
      // Non-definitive quotation rejection: lead remains open in Qualified stage
      try {
        await updateQuotation(rejectionModalQuote.id, {
          status: 'Rejected',
          isDefinitiveLoss: false,
        } as any);
        setRejectionModalQuote(null);
      } catch (err: any) {
        // Handled inside AppContext
      }
    }
  };

  const handleOpenCreateOrder = (quote: Quotation) => {
    setSelectedQuoteForOrder(quote);
    setShowOrderModal(true);
  };

  const handleOpenCreateInvoice = (so: SalesOrder) => {
    setSelectedOrderForInvoice(so);
    setShowInvoiceModal(true);
  };

  const handleRecordPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
  };

  const getQuotationBadgeClass = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Revision Requested': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Revised': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Accepted':
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Expired': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getOrderBadgeClass = (status?: string) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Delivered':
      case 'Fulfilled':
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getInvoiceBadgeClass = (status: InvoiceStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Issued': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-8 bg-slate-50 min-h-screen">
      {/* 1. CLEAN PAGE HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span>ERP Commercial</span> 
            <ChevronRight size={13} className="mx-1 text-slate-400" /> 
            <span className="text-slate-800 font-semibold">Sales & Revenue</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={22} />
            Sales & Revenue Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quotations, Sales Orders, Tax Invoices, and Revenue Tracking
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'qualified' && (
            <button
              onClick={() => { setEditingQuotation(null); setIsRevisionMode(false); setInitialLeadIdForQuote(undefined); setShowQuoteModal(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Plus size={15} /> New Quotation
            </button>
          )}
          {activeTab === 'quotes' && (
            <button
              onClick={() => { setEditingQuotation(null); setIsRevisionMode(false); setShowQuoteModal(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Plus size={15} /> New Quotation
            </button>
          )}
          {activeTab === 'orders' && (
            <button
              onClick={() => setActiveTab('quotes')}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <ArrowRight size={14} className="text-blue-600" /> Convert Accepted Quote
            </button>
          )}
          {activeTab === 'invoices' && (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <ArrowRight size={14} className="text-blue-600" /> Bill Confirmed Order
            </button>
          )}
        </div>
      </div>

      {/* 2. RESTRAINED KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Quotes Pipeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Quotes Pipeline</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatINR(metrics.activeQuoteValue)}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Pending Review</span>
              <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                {quotations.length} Quotes
              </span>
            </div>
          </div>
        </div>

        {/* Confirmed Sales Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Sales Orders</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatINR(metrics.confirmedOrdersValue)}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Accepted Contracts</span>
              <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                {metrics.confirmedOrdersCount} Orders
              </span>
            </div>
          </div>
        </div>

        {/* Total Invoiced Value */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced Value</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatINR(metrics.totalInvoiced)}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Billed Revenue</span>
              <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                {invoices.length} Invoices
              </span>
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-amber-700 tracking-tight">{formatINR(metrics.outstandingBalance)}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Receivables Due</span>
              <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Accounts A/R
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2b. DETAILED SALES PIPELINE METRICS STRIP */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold"><UserCheck size={14} /></span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Qualified Leads</span>
            <span className="font-bold text-slate-900">{metrics.qualifiedLeadsCount} Leads</span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold"><Send size={14} /></span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sent Quotes</span>
            <span className="font-bold text-slate-900">{metrics.sentQuotesCount} Quotes</span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 font-bold"><RefreshCw size={14} /></span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Revision Requested</span>
            <span className="font-bold text-amber-700">{metrics.revisionRequestedCount} Quotes</span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold"><CheckCircle2 size={14} /></span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Accepted Quotes</span>
            <span className="font-bold text-emerald-700">{metrics.acceptedQuotesCount} Quotes</span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold"><AlertCircle size={14} /></span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rejected Quotes</span>
            <span className="font-bold text-rose-700">{metrics.rejectedQuotesCount} Quotes</span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold"><ShoppingCart size={14} /></span>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Confirmed Orders</span>
            <span className="font-bold text-slate-900">{metrics.confirmedOrdersCount} Orders</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Navigation Tabs */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setActiveTab('qualified'); setSearchTerm(''); }}
                className={`flex items-center py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'qualified'
                    ? 'border-indigo-600 text-indigo-600 bg-transparent'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck size={15} className="mr-2 text-indigo-600" />
                Qualified Leads
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  activeTab === 'qualified' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {qualifiedLeads.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('quotes'); setSearchTerm(''); }}
                className={`flex items-center py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'quotes' 
                    ? 'border-blue-600 text-blue-600 bg-transparent' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText size={15} className="mr-2" />
                Quotations
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  activeTab === 'quotes' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {quotations.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
                className={`flex items-center py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                  activeTab === 'orders' 
                    ? 'border-blue-600 text-blue-600 bg-transparent' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingCart size={15} className="mr-2" />
                Sales Orders
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {salesOrders.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('invoices'); setSearchTerm(''); }}
                className={`flex items-center py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                  activeTab === 'invoices' 
                    ? 'border-blue-600 text-blue-600 bg-transparent' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Receipt size={15} className="mr-2" />
                Tax Invoices
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  activeTab === 'invoices' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {invoices.length}
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative py-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'qualified' ? 'qualified leads' : activeTab === 'quotes' ? 'quotes' : activeTab === 'orders' ? 'orders' : 'invoices'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* 4. TAB CONTENT 0: QUALIFIED LEADS (CRM TO SALES AUTOMATION) */}
        {activeTab === 'qualified' && (
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50/70 border border-indigo-200/80 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600 shrink-0" />
                <span className="text-xs text-indigo-950 font-medium">
                  Showing <strong>{filteredQualifiedLeads.length}</strong> Qualified Leads from CRM ready for Commercial Quotations.
                </span>
              </div>
              <span className="text-[11px] text-indigo-700 bg-white/90 border border-indigo-200 px-2.5 py-0.5 rounded-full font-semibold shadow-2xs self-start sm:self-auto">
                Lead ID Reference Linked • Zero Duplication
              </span>
            </div>

            {filteredQualifiedLeads.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse min-w-[980px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3">Lead / Company</th>
                      <th className="py-3 px-3">Contact Person</th>
                      <th className="py-3 px-3">Contact Channels</th>
                      <th className="py-3 px-3">Customer Requirements</th>
                      <th className="py-3 px-3 text-right">Target Budget</th>
                      <th className="py-3 px-3">Expected Close</th>
                      <th className="py-3 px-3 text-center">Quotation Status</th>
                      <th className="py-3 px-3 text-center w-40">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredQualifiedLeads.map(lead => {
                      const linkedQuotes = quotations.filter(q => q.leadId === lead.id);
                      const latestQuote = linkedQuotes.length > 0 ? linkedQuotes[linkedQuotes.length - 1] : null;

                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{lead.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-normal">
                                {lead.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Building2 size={11} className="text-slate-400 shrink-0" />
                              <span>{lead.company || 'Direct Corporate Account'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">
                              {lead.contactPerson || lead.decisionMaker || lead.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Decision Maker
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {lead.email && (
                              <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                                <Mail size={11} className="text-slate-400 shrink-0" />
                                <span>{lead.email}</span>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone size={11} className="text-slate-400 shrink-0" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 max-w-xs">
                            <div className="text-slate-800 line-clamp-2" title={lead.requirement || 'No specific requirement recorded.'}>
                              {lead.requirement || <span className="text-slate-400 italic">No specific requirement recorded</span>}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-slate-900 text-xs">
                              {formatINR(lead.budget || lead.value || 0)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Owner: {lead.assignedTo || 'Unassigned'}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600 text-xs">
                            <div>{lead.expectedCloseDate || '—'}</div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {latestQuote ? (
                              <div className="inline-flex flex-col items-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] border ${getQuotationBadgeClass(latestQuote.status)}`}>
                                  {latestQuote.quoteNumber} ({latestQuote.status})
                                </span>
                                {linkedQuotes.length > 1 && (
                                  <span className="text-[9px] text-slate-400 mt-0.5">{linkedQuotes.length} quotes drafted</span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full font-medium text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                Awaiting Quotation
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleCreateQuoteFromLead(lead)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-1.5 w-full shadow-xs cursor-pointer"
                            >
                              <Plus size={13} /> Create Quotation
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-slate-50/50 border border-slate-200 rounded-lg">
                <UserCheck size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No qualified leads found</p>
                <p className="text-xs mt-0.5 text-slate-500">
                  Leads in CRM that satisfy all 4 qualification criteria will appear here automatically.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB CONTENT 1: QUOTATIONS */}
        {activeTab === 'quotes' && (
          <div className="p-4 space-y-4">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {(['All', 'Draft', 'Sent', 'Revision Requested', 'Revised', 'Accepted', 'Rejected', 'Expired'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setQuoteStatusFilter(st)}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition border ${
                    quoteStatusFilter === st
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Quotations Table */}
            {filteredQuotations.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3">Quote Number</th>
                      <th className="py-3 px-3">Customer / Account</th>
                      <th className="py-3 px-3 text-right">Grand Total</th>
                      <th className="py-3 px-3">Date & Validity</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center w-64">Workflow Action</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredQuotations.map(quote => {
                      const hasLinkedOrder = Boolean(quote.salesOrderId || salesOrders.some(so => so.quotationId === quote.id));
                      const linkedSO = salesOrders.find(so => so.quotationId === quote.id);

                      return (
                        <tr key={quote.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-semibold text-slate-900">{quote.quoteNumber}</span>
                              {quote.revisionNumber && quote.revisionNumber > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuoteForHistory(quote)}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition"
                                  title="Click to view Revision History"
                                >
                                  <History size={10} /> Rev #{quote.revisionNumber}
                                </button>
                              ) : (
                                quotations.some(q => (q.revisionGroupId && q.revisionGroupId === (quote.revisionGroupId || quote.id)) && q.id !== quote.id) && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedQuoteForHistory(quote)}
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1 cursor-pointer transition"
                                    title="Click to view Revision History"
                                  >
                                    <History size={10} /> History
                                  </button>
                                )
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{quote.customerName}</div>
                            {quote.leadId && (
                              <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                                <User size={11} className="text-indigo-500 shrink-0" />
                                <span>Lead: {leads.find(l => l.id === quote.leadId)?.name || quote.leadId}</span>
                              </div>
                            )}
                            {quote.opportunityId && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Tag size={10} className="text-slate-400 shrink-0" /> Opp: {quote.opportunityId}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-slate-900 text-xs">
                              {formatINR(quote.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {quote.itemsCount || 1} line item{quote.itemsCount === 1 ? '' : 's'}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            <div>Issued: {quote.date}</div>
                            <div className="text-[11px] text-slate-400">Valid: {quote.validUntil || '—'}</div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-medium border text-[11px] ${getQuotationBadgeClass(quote.status)}`}>
                              {quote.status}
                            </span>
                          </td>

                          {/* Controlled Workflow Actions */}
                          <td className="py-3 px-3 text-center">
                            {quote.status === 'Draft' && (
                              <button
                                onClick={() => handleSendQuote(quote)}
                                disabled={sendingQuoteId === quote.id}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-1.5 w-full shadow-xs disabled:opacity-60"
                              >
                                {sendingQuoteId === quote.id ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" /> Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send size={13} /> Send Quotation
                                  </>
                                )}
                              </button>
                            )}

                            {(quote.status === 'Sent' || quote.status === 'Revised') && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleAcceptQuote(quote)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-[11px] transition flex items-center gap-1 shadow-xs"
                                  title="Customer Accepted Quotation"
                                >
                                  <Check size={13} /> Accept
                                </button>
                                <button
                                  onClick={() => handleRequestRevision(quote)}
                                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-[11px] transition"
                                  title="Customer Requested Revision"
                                >
                                  Req Rev
                                </button>
                                <button
                                  onClick={() => handleRejectQuote(quote)}
                                  className="px-2 py-1.5 text-rose-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 rounded-md font-semibold text-[11px] transition"
                                  title="Mark as Rejected"
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            {quote.status === 'Revision Requested' && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenReviseModal(quote)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-1.5 w-full shadow-xs"
                                >
                                  <RefreshCw size={12} /> Revise & Update Quote
                                </button>
                              </div>
                            )}

                            {(quote.status === 'Accepted' || quote.status === 'Approved') && (
                              <div>
                                {hasLinkedOrder ? (
                                  <button
                                    onClick={() => {
                                      setActiveTab('orders');
                                      setSearchTerm(linkedSO?.soNumber || quote.salesOrderNumber || '');
                                    }}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-md font-medium text-xs transition flex items-center justify-center gap-1 w-full"
                                  >
                                    <Eye size={13} /> View Order ({linkedSO?.soNumber || quote.salesOrderNumber || 'Linked'})
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenCreateOrder(quote)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-1.5 w-full shadow-xs"
                                  >
                                    <ShoppingCart size={13} /> Create Sales Order
                                  </button>
                                )}
                              </div>
                            )}

                            {(quote.status === 'Rejected' || quote.status === 'Expired') && (
                              <span className="text-slate-400 italic text-[11px]">No actions available</span>
                            )}
                          </td>

                          {/* Options Menu */}
                          <td className="py-3 px-2 text-center">
                            <div className="relative group/menu inline-block">
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
                                <MoreVertical size={15} />
                              </button>
                              <div className="absolute right-0 top-0 w-32 bg-white rounded-md shadow-md border border-slate-200 py-1 hidden group-hover/menu:block z-20 text-xs">
                                <button
                                  onClick={() => { setEditingQuotation(quote); setIsRevisionMode(false); setShowQuoteModal(true); }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                                >
                                  Edit Details
                                </button>
                                <button
                                  onClick={() => setSelectedQuoteForHistory(quote)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5"
                                >
                                  <History size={12} className="text-slate-400" /> Revision History
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this quotation record?')) {
                                      deleteQuotation(quote.id);
                                    }
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold"
                                >
                                  Delete Quote
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-slate-50/50 border border-slate-200 rounded-lg">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No quotations found</p>
                <p className="text-xs mt-0.5 text-slate-500">Try adjusting your filter or create a new commercial quotation.</p>
              </div>
            )}
          </div>
        )}

        {/* 5. TAB CONTENT 2: SALES ORDERS */}
        {activeTab === 'orders' && (
          <div className="p-4 space-y-4">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {(['All', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition border ${
                    orderStatusFilter === st
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sales Orders Table */}
            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3">SO Number</th>
                      <th className="py-3 px-3">Customer Account</th>
                      <th className="py-3 px-3">Source Quotation</th>
                      <th className="py-3 px-3 text-right">Order Amount</th>
                      <th className="py-3 px-3">Order Date</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center w-56">Billing Action</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredOrders.map(so => {
                      const hasLinkedInvoice = Boolean(so.invoiceId || invoices.some(inv => inv.salesOrderId === so.id));
                      const linkedInv = invoices.find(inv => inv.salesOrderId === so.id);

                      return (
                        <tr key={so.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForDetails(so)}
                              className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer text-left"
                              title="Click to view full Sales Order details"
                            >
                              {so.soNumber}
                            </button>
                            {so.customerPoNumber && (
                              <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                                <span className="text-slate-400 font-medium">PO:</span>
                                <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1 py-0.2 rounded">{so.customerPoNumber}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{so.customerName}</div>
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            {so.quoteNumber ? (
                              <button
                                onClick={() => {
                                  setActiveTab('quotes');
                                  setSearchTerm(so.quoteNumber || '');
                                }}
                                className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                <FileText size={12} /> {so.quoteNumber}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">Direct Order</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-slate-900 text-xs">
                              {formatINR(so.totalAmount)}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            <div>{so.date}</div>
                            {so.expectedDeliveryDate && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5" title="Expected Delivery Date">
                                <Truck size={10} className="text-indigo-500 shrink-0" />
                                <span className="text-slate-400 font-medium">Due:</span>
                                <span className="font-medium text-slate-700">{so.expectedDeliveryDate}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-medium border text-[11px] ${getOrderBadgeClass(so.status || so.fulfillmentStatus)}`}>
                              {so.status || so.fulfillmentStatus || 'Confirmed'}
                            </span>
                          </td>

                          {/* Billing Action */}
                          <td className="py-3 px-3 text-center">
                            {hasLinkedInvoice ? (
                              <button
                                onClick={() => {
                                  setActiveTab('invoices');
                                  setSearchTerm(linkedInv?.invoiceNumber || so.invoiceNumber || '');
                                }}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-md font-medium text-xs transition flex items-center justify-center gap-1 w-full"
                              >
                                <Eye size={13} /> View Invoice ({linkedInv?.invoiceNumber || so.invoiceNumber || 'Linked'})
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenCreateInvoice(so)}
                                disabled={so.status === 'Cancelled' || so.fulfillmentStatus === 'Cancelled'}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-1.5 w-full shadow-xs"
                              >
                                <Receipt size={13} /> Issue Tax Invoice
                              </button>
                            )}
                          </td>

                          {/* Menu */}
                          <td className="py-3 px-2 text-center">
                            <div className="relative group/menu inline-block">
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
                                <MoreVertical size={15} />
                              </button>
                              <div className="absolute right-0 top-0 w-44 bg-white rounded-md shadow-md border border-slate-200 py-1 hidden group-hover/menu:block z-20 text-xs">
                                <button
                                  onClick={() => setSelectedOrderForDetails(so)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye size={12} className="text-indigo-600" /> View Order Details
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  onClick={() => updateSalesOrder(so.id, { status: 'Delivered', fulfillmentStatus: 'Fulfilled' })}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                                >
                                  Mark Delivered
                                </button>
                                <button
                                  onClick={() => updateSalesOrder(so.id, { status: 'Cancelled', fulfillmentStatus: 'Cancelled' })}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-medium"
                                >
                                  Cancel Order
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this Sales Order?')) {
                                      deleteSalesOrder(so.id);
                                    }
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold"
                                >
                                  Delete Order
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-slate-50/50 border border-slate-200 rounded-lg">
                <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No sales orders found</p>
                <p className="text-xs mt-0.5 text-slate-500">Accept an active quotation to generate its corresponding sales order.</p>
              </div>
            )}
          </div>
        )}

        {/* 6. TAB CONTENT 3: TAX INVOICES */}
        {activeTab === 'invoices' && (
          <div className="p-4 space-y-4">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {(['All', 'Issued', 'Paid', 'Partially Paid', 'Overdue'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setInvoiceStatusFilter(st)}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition border ${
                    invoiceStatusFilter === st
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Invoices Table */}
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3">Invoice Number</th>
                      <th className="py-3 px-3">Customer Account</th>
                      <th className="py-3 px-3">Source Order / Quote</th>
                      <th className="py-3 px-3 text-right">Invoice Amount</th>
                      <th className="py-3 px-3 text-right">Balance Due</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center w-48">Accounts Action</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredInvoices.map(inv => {
                      const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setSelectedInvoiceForDoc(inv)}
                              className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1.5 text-left group"
                              title="View official GST Tax Invoice document"
                            >
                              <FileText size={13} className="text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                              <span>{inv.invoiceNumber}</span>
                            </button>
                            <div className="text-[10px] text-slate-400 mt-0.5">Date: {inv.date}</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{inv.customerName}</div>
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            {inv.salesOrderNumber ? (
                              <button
                                onClick={() => {
                                  setActiveTab('orders');
                                  setSearchTerm(inv.salesOrderNumber || '');
                                }}
                                className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                <ShoppingCart size={11} /> {inv.salesOrderNumber}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">Direct Invoice</span>
                            )}
                            {inv.quoteNumber && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Ref: {inv.quoteNumber}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-slate-900 text-xs">
                              {formatINR(inv.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Paid: {formatINR(inv.paidAmount || 0)}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className={`font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {formatINR(balance)}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            <div>{inv.dueDate}</div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-medium border text-[11px] ${getInvoiceBadgeClass(inv.status)}`}>
                              {inv.status}
                            </span>
                          </td>

                          {/* Accounts / Payment Action */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedInvoiceForDoc(inv)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md font-semibold text-xs transition flex items-center gap-1 border border-slate-200"
                                title="View GST Tax Invoice Document"
                              >
                                <Eye size={13} /> View
                              </button>
                              {inv.status === 'Paid' ? (
                                <span className="text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-50 rounded-md border border-emerald-200">
                                  <CheckCircle2 size={13} /> Paid
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRecordPayment(inv)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-1 shadow-xs"
                                >
                                  <DollarSign size={13} /> Record Payment
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Menu */}
                          <td className="py-3 px-2 text-center">
                            <div className="relative group/menu inline-block">
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
                                <MoreVertical size={15} />
                              </button>
                              <div className="absolute right-0 top-0 w-44 bg-white rounded-md shadow-md border border-slate-200 py-1 hidden group-hover/menu:block z-20 text-xs">
                                <button
                                  onClick={() => setSelectedInvoiceForDoc(inv)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5"
                                >
                                  <Eye size={13} className="text-blue-600" /> View Tax Invoice
                                </button>
                                {balance > 0 && (
                                  <button
                                    onClick={() => handleRecordPayment(inv)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-emerald-700 font-semibold flex items-center gap-1.5"
                                  >
                                    <DollarSign size={13} /> Record Payment
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await CRMInvoicesAPI.sendEmail(inv.id);
                                      alert(res?.message || 'Invoice sent to customer email.');
                                    } catch (err: any) {
                                      alert(err?.message || 'Failed to email invoice');
                                    }
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5"
                                >
                                  <Mail size={13} className="text-indigo-600" /> Email Customer
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this invoice?')) {
                                      deleteInvoice(inv.id);
                                    }
                                  }}
                                  disabled={inv.status === 'Paid'}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold disabled:opacity-30 flex items-center gap-1.5"
                                >
                                  <X size={13} /> Delete Invoice
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-slate-50/50 border border-slate-200 rounded-lg">
                <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No tax invoices found</p>
                <p className="text-xs mt-0.5 text-slate-500">Issue an invoice from a confirmed sales order to begin receivables tracking.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <QuotationModal
        isOpen={showQuoteModal}
        onClose={() => { setShowQuoteModal(false); setEditingQuotation(null); setIsRevisionMode(false); setInitialLeadIdForQuote(undefined); }}
        quotationToEdit={editingQuotation}
        isRevisionMode={isRevisionMode}
        initialLeadId={initialLeadIdForQuote}
      />

      <SalesOrderModal
        isOpen={showOrderModal}
        onClose={() => { setShowOrderModal(false); setSelectedQuoteForOrder(null); }}
        quotation={selectedQuoteForOrder}
      />

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => { setShowInvoiceModal(false); setSelectedOrderForInvoice(null); }}
        salesOrder={selectedOrderForInvoice}
        onInvoiceCreated={(newInv) => setSelectedInvoiceForDoc(newInv)}
      />

      <TaxInvoiceDocumentModal
        isOpen={Boolean(selectedInvoiceForDoc)}
        onClose={() => setSelectedInvoiceForDoc(null)}
        invoice={selectedInvoiceForDoc}
        onOpenRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
      />

      <RecordPaymentModal
        isOpen={Boolean(selectedInvoiceForPayment)}
        onClose={() => setSelectedInvoiceForPayment(null)}
        invoice={selectedInvoiceForPayment}
      />

      {/* Rejection Modal for Quotations with CRM Sync Options */}
      {rejectionModalQuote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reject Quotation ({rejectionModalQuote.quoteNumber})</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select how this quotation rejection affects the sales workflow and linked CRM lead.
            </p>

            {/* Workflow Mode Selector */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3 mb-4">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="lossType"
                  checked={!isDefinitiveLoss}
                  onChange={() => setIsDefinitiveLoss(false)}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 text-xs block">Reject Quotation Only (Negotiation Continues)</span>
                  <span className="text-[11px] text-slate-500 block leading-relaxed">
                    Customer declined these specific commercial terms or pricing. Linked CRM Lead remains <strong>Qualified</strong> so a revised quotation can be created.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-3 border-t border-slate-200">
                <input
                  type="radio"
                  name="lossType"
                  checked={isDefinitiveLoss}
                  onChange={() => setIsDefinitiveLoss(true)}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-semibold text-rose-800 text-xs block">Close Deal as Lost (Definitive Loss)</span>
                  <span className="text-[11px] text-slate-500 block leading-relaxed">
                    Customer definitively declined the offer or chose a competitor. Automatically marks linked CRM Lead as <strong>Lost</strong> with mandatory reason & notes.
                  </span>
                </div>
              </label>
            </div>

            {isDefinitiveLoss && (
              <div className="space-y-3.5 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lost Reason <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none bg-white"
                  >
                    {CRM_LOST_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {rejectReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Custom Reason Explanation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Specify custom reason..."
                      value={rejectReasonDetails}
                      onChange={(e) => setRejectReasonDetails(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lost Notes / Comments <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details explaining why the deal was lost..."
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalQuote(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectQuote}
                className={`px-4 py-1.5 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
                  isDefinitiveLoss ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {isDefinitiveLoss ? 'Confirm Deal as Lost' : 'Reject Quotation (Keep Lead Open)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. QUOTATION REVISION HISTORY MODAL */}
      {selectedQuoteForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Quotation Revision History</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {quotationHistory.length} Version{quotationHistory.length === 1 ? '' : 's'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Account: <strong className="text-slate-800">{selectedQuoteForHistory.customerName}</strong>
                    {selectedQuoteForHistory.leadId && (
                      <span className="ml-2 text-indigo-600 font-semibold">• CRM Lead Linked</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteForHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-xs text-amber-900 bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl flex items-start gap-2">
                <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Version Integrity:</strong> All prior quotation versions are permanently preserved. Creating revisions preserves historical records and records sequential numbering (Rev #1, Rev #2, Rev #3).
                </span>
              </div>

              <div className="space-y-3">
                {quotationHistory.map((q, idx) => {
                  const isCurrentSelected = q.id === selectedQuoteForHistory.id;
                  const revNum = q.revisionNumber || (idx + 1);

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border transition ${
                        isCurrentSelected
                          ? 'border-blue-400 bg-blue-50/20 shadow-xs ring-2 ring-blue-500/10'
                          : 'border-slate-200 bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            revNum === 1 ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            Revision #{revNum} {revNum === 1 ? '(Original)' : ''}
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900">{q.quoteNumber}</span>
                          <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${getQuotationBadgeClass(q.status)}`}>
                            {q.status}
                          </span>
                          {isCurrentSelected && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.2 rounded-full">
                              Active View
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {formatINR(q.amount)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date Issued</span>
                          <span className="font-medium text-slate-700">{q.date || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valid Until</span>
                          <span className="font-medium text-slate-700">{q.validUntil || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sent Date</span>
                          <span className="font-medium text-slate-700">{q.sentDate || 'Not Sent'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Decision Date</span>
                          <span className="font-medium text-slate-700">{q.acceptedDate ? `Accepted: ${q.acceptedDate}` : 'Pending'}</span>
                        </div>
                      </div>

                      {q.notes && (
                        <div className="mt-2.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <strong className="text-slate-700">Proposal Scope / Notes:</strong> {q.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedQuoteForHistory(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Order Details Modal */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-indigo-600" />
                    Sales Order Details
                  </h3>
                  <span className="font-mono font-bold text-xs bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-800">
                    {selectedOrderForDetails.soNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${getOrderBadgeClass(selectedOrderForDetails.status || selectedOrderForDetails.fulfillmentStatus)}`}>
                    {selectedOrderForDetails.status || selectedOrderForDetails.fulfillmentStatus || 'Confirmed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Binding commercial sales order converted from accepted quotation.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedOrderForDetails(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer</span>
                <span className="font-semibold text-slate-900 block truncate">{selectedOrderForDetails.customerName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Source Quote</span>
                <span className="font-mono font-semibold text-indigo-700 block">{selectedOrderForDetails.quoteNumber || 'Direct Order'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Date</span>
                <span className="font-medium text-slate-700 block">{selectedOrderForDetails.date}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expected Delivery</span>
                <span className="font-bold text-slate-900 block">{selectedOrderForDetails.expectedDeliveryDate || 'Standard Schedule'}</span>
              </div>
            </div>

            {/* PO & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Customer PO Number</span>
                <div className="font-mono text-sm font-bold text-indigo-950">
                  {selectedOrderForDetails.customerPoNumber || <span className="font-sans text-xs text-slate-400 font-normal italic">None provided</span>}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Payment Terms</span>
                <div className="text-xs font-medium text-slate-800">
                  {selectedOrderForDetails.paymentTerms || 'Standard 30 days net upon invoice'}
                </div>
              </div>
            </div>

            {/* Delivery Details Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delivery Address & Instructions</span>
              <div className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Delivery Address:</span>
                <p className="text-slate-600">{selectedOrderForDetails.deliveryAddress || 'Standard customer registered address / digital fulfillment.'}</p>
              </div>
              {selectedOrderForDetails.deliveryNotes && (
                <div className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-0.5">Scope & Delivery Instructions:</span>
                  <p className="text-slate-600">{selectedOrderForDetails.deliveryNotes}</p>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex justify-between items-center text-xs">
              <div>
                <span className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Order Value</span>
                <span className="font-extrabold text-indigo-950 text-base">{formatINR(selectedOrderForDetails.totalAmount)}</span>
              </div>
              {selectedOrderForDetails.invoiceNumber ? (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <Receipt size={14} /> Invoiced ({selectedOrderForDetails.invoiceNumber})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const so = selectedOrderForDetails;
                    setSelectedOrderForDetails(null);
                    handleOpenCreateInvoice(so);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Receipt size={13} /> Issue Tax Invoice
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
