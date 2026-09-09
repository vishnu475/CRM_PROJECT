import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, SalesOrder, Invoice, QuotationStatus, SalesOrderStatus, InvoiceStatus } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { 
  TrendingUp, Plus, Search, FileText, ShoppingCart, CheckCircle2, 
  Clock, ArrowRight, Building2, Calendar, Tag, AlertCircle, 
  ChevronRight, RefreshCw, Send, XCircle, Check, Eye, MoreVertical,
  Layers, ShieldAlert, Sparkles, Receipt, DollarSign
} from 'lucide-react';
import { QuotationModal } from '../components/QuotationModal';
import { SalesOrderModal } from '../components/SalesOrderModal';
import { InvoiceModal } from '../components/InvoiceModal';

export const SalesPage: React.FC = () => {
  const { 
    quotations, 
    salesOrders, 
    invoices, 
    updateQuotation, 
    deleteQuotation,
    updateSalesOrder,
    deleteSalesOrder,
    updateInvoice,
    deleteInvoice,
    customers,
    opportunities 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quotes' | 'orders' | 'invoices'>('quotes');
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-filters per tab
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('All');

  // Modals state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isRevisionMode, setIsRevisionMode] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedQuoteForOrder, setSelectedQuoteForOrder] = useState<Quotation | null>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrder | null>(null);

  // 1. KPI Stats Computations from live data
  const metrics = useMemo(() => {
    const totalQuoteValue = quotations.reduce((sum, q) => sum + (parseFloat(q.amount as any) || 0), 0);
    const activeQuotes = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent' || q.status === 'Revised' || q.status === 'Accepted');
    const activeQuoteValue = activeQuotes.reduce((sum, q) => sum + (parseFloat(q.amount as any) || 0), 0);

    const confirmedOrders = salesOrders.filter(so => so.status !== 'Cancelled');
    const confirmedOrdersValue = confirmedOrders.reduce((sum, so) => sum + (parseFloat(so.totalAmount as any) || 0), 0);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount as any) || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.paidAmount as any) || 0), 0);
    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

    return {
      totalQuoteValue,
      activeQuoteValue,
      confirmedOrdersCount: confirmedOrders.length,
      confirmedOrdersValue,
      totalInvoiced,
      outstandingBalance,
    };
  }, [quotations, salesOrders, invoices]);

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

  // Quotation Workflow Action Handlers
  const handleSendQuote = async (quote: Quotation) => {
    await updateQuotation(quote.id, {
      status: 'Sent',
      sentDate: new Date().toISOString().split('T')[0],
    });
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
    if (window.confirm(`Mark quotation ${quote.quoteNumber} as Rejected?`)) {
      await updateQuotation(quote.id, {
        status: 'Rejected',
      });
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

  const handleRecordPayment = async (inv: Invoice) => {
    const amountToPay = inv.amount - (inv.paidAmount || 0);
    if (amountToPay <= 0) return;
    await updateInvoice(inv.id, {
      paidAmount: inv.amount,
      status: 'Paid',
    });
  };

  const getQuotationBadgeClass = (status: QuotationStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Revision Requested': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Revised': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Accepted':
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Expired': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getOrderBadgeClass = (status?: string) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Confirmed': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Processing': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Delivered':
      case 'Fulfilled':
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const getInvoiceBadgeClass = (status: InvoiceStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Issued': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Cancelled': return 'bg-slate-200 text-slate-700 border-slate-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span>ERP Commercial</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a] font-semibold">Sales Workflow</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={24} />
            Sales & Revenue Management Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connected commercial transactions: Quotations → Customer Review → Accepted → Sales Orders → Tax Invoices.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {activeTab === 'quotes' && (
            <button
              onClick={() => { setEditingQuotation(null); setIsRevisionMode(false); setShowQuoteModal(true); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus size={15} /> New Quotation
            </button>
          )}
          {activeTab === 'orders' && (
            <button
              onClick={() => setActiveTab('quotes')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ArrowRight size={14} /> Convert Accepted Quote
            </button>
          )}
          {activeTab === 'invoices' && (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ArrowRight size={14} /> Bill Confirmed Order
            </button>
          )}
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Quotes Pipeline</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-emerald-600">{formatINR(metrics.activeQuoteValue)}</p>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {quotations.length} Quotes
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending customer approval & revisions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Sales Orders</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-indigo-600">{formatINR(metrics.confirmedOrdersValue)}</p>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {metrics.confirmedOrdersCount} Orders
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Accepted contracts ready for billing</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced Value</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-[#0f172a]">{formatINR(metrics.totalInvoiced)}</p>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total revenue billed through tax invoices</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-amber-600">{formatINR(metrics.outstandingBalance)}</p>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Accounts A/R
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Receivables awaiting payment in Banking</p>
        </div>
      </div>

      {/* 3. MAIN SECTION WITH TABS AND WORKSPACE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 p-4 sm:p-0 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:px-4">
            
            {/* Main Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setActiveTab('quotes'); setSearchTerm(''); }}
                className={`flex items-center px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                  activeTab === 'quotes' 
                    ? 'border-emerald-600 text-emerald-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-[#0f172a]'
                }`}
              >
                <FileText size={16} className="mr-2" />
                Quotations
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'quotes' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {quotations.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
                className={`flex items-center px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                  activeTab === 'orders' 
                    ? 'border-indigo-600 text-indigo-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-[#0f172a]'
                }`}
              >
                <ShoppingCart size={16} className="mr-2" />
                Sales Orders
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'orders' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {salesOrders.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('invoices'); setSearchTerm(''); }}
                className={`flex items-center px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                  activeTab === 'invoices' 
                    ? 'border-blue-600 text-blue-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-[#0f172a]'
                }`}
              >
                <Receipt size={16} className="mr-2" />
                Tax Invoices
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'invoices' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {invoices.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative py-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'quotes' ? 'quotes' : activeTab === 'orders' ? 'orders' : 'invoices'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* 4. TAB CONTENT 1: QUOTATIONS */}
        {activeTab === 'quotes' && (
          <div className="p-4 space-y-4">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {(['All', 'Draft', 'Sent', 'Revision Requested', 'Revised', 'Accepted', 'Rejected', 'Expired'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setQuoteStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                    quoteStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Quotations Table */}
            {filteredQuotations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase border-y border-slate-200">
                      <th className="py-3 px-3 font-semibold">Quote Number</th>
                      <th className="py-3 px-3 font-semibold">Customer / Account</th>
                      <th className="py-3 px-3 font-semibold text-right">Grand Total</th>
                      <th className="py-3 px-3 font-semibold">Date & Validity</th>
                      <th className="py-3 px-3 font-semibold text-center">Status</th>
                      <th className="py-3 px-3 font-semibold text-center w-64">Workflow Action</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredQuotations.map(quote => {
                      const hasLinkedOrder = Boolean(quote.salesOrderId || salesOrders.some(so => so.quotationId === quote.id));
                      const linkedSO = salesOrders.find(so => so.quotationId === quote.id);

                      return (
                        <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-mono font-bold text-slate-900">{quote.quoteNumber}</div>
                            {quote.revisionNumber && quote.revisionNumber > 1 && (
                              <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                                Rev #{quote.revisionNumber}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-900">{quote.customerName}</div>
                            {quote.opportunityId && (
                              <div className="text-[11px] text-indigo-600 flex items-center gap-1 mt-0.5 font-medium">
                                <Tag size={10} /> Linked Opp: {quote.opportunityId}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="font-extrabold text-[#0f172a] text-sm">
                              {formatINR(quote.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {quote.itemsCount || 1} line item{quote.itemsCount === 1 ? '' : 's'}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-slate-600">
                            <div>Issued: {quote.date}</div>
                            <div className="text-[11px] text-slate-400">Valid: {quote.validUntil || '—'}</div>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${getQuotationBadgeClass(quote.status)}`}>
                              {quote.status}
                            </span>
                          </td>

                          {/* Controlled Workflow Actions */}
                          <td className="py-3.5 px-3 text-center">
                            {quote.status === 'Draft' && (
                              <button
                                onClick={() => handleSendQuote(quote)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5 w-full"
                              >
                                <Send size={13} /> Send Quotation
                              </button>
                            )}

                            {(quote.status === 'Sent' || quote.status === 'Revised') && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleAcceptQuote(quote)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shadow-xs transition flex items-center gap-1"
                                  title="Customer Accepted Quotation"
                                >
                                  <Check size={13} /> Accept
                                </button>
                                <button
                                  onClick={() => handleRequestRevision(quote)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-semibold text-[11px] transition"
                                  title="Customer Requested Revision"
                                >
                                  Req Rev
                                </button>
                                <button
                                  onClick={() => handleRejectQuote(quote)}
                                  className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold text-[11px] transition"
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
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5 w-full"
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
                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1 w-full"
                                  >
                                    <Eye size={13} /> View Order ({linkedSO?.soNumber || quote.salesOrderNumber || 'Linked'})
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenCreateOrder(quote)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5 w-full"
                                  >
                                    <ShoppingCart size={13} /> Create Sales Order
                                  </button>
                                )}
                              </div>
                            )}

                            {(quote.status === 'Rejected' || quote.status === 'Expired') && (
                              <span className="text-slate-400 italic text-[11px]">No further actions available</span>
                            )}
                          </td>

                          {/* Options Menu */}
                          <td className="py-3.5 px-2 text-center">
                            <div className="relative group/menu inline-block">
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                                <MoreVertical size={15} />
                              </button>
                              <div className="absolute right-0 top-0 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 hidden group-hover/menu:block z-20 text-xs">
                                <button
                                  onClick={() => { setEditingQuotation(quote); setIsRevisionMode(false); setShowQuoteModal(true); }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                                >
                                  Edit Details
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
              <div className="p-12 text-center text-slate-400">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No quotations found</p>
                <p className="text-xs mt-0.5">Try adjusting your filter or create a new commercial quotation.</p>
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
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sales Orders Table */}
            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase border-y border-slate-200">
                      <th className="py-3 px-3 font-semibold">SO Number</th>
                      <th className="py-3 px-3 font-semibold">Customer Account</th>
                      <th className="py-3 px-3 font-semibold">Source Quotation</th>
                      <th className="py-3 px-3 font-semibold text-right">Order Amount</th>
                      <th className="py-3 px-3 font-semibold">Order Date</th>
                      <th className="py-3 px-3 font-semibold text-center">Status</th>
                      <th className="py-3 px-3 font-semibold text-center w-56">Billing Action</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredOrders.map(so => {
                      const hasLinkedInvoice = Boolean(so.invoiceId || invoices.some(inv => inv.salesOrderId === so.id));
                      const linkedInv = invoices.find(inv => inv.salesOrderId === so.id);

                      return (
                        <tr key={so.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-mono font-bold text-indigo-700">{so.soNumber}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-900">{so.customerName}</div>
                          </td>

                          <td className="py-3.5 px-3 text-slate-600">
                            {so.quoteNumber ? (
                              <button
                                onClick={() => {
                                  setActiveTab('quotes');
                                  setSearchTerm(so.quoteNumber || '');
                                }}
                                className="font-mono text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <FileText size={12} /> {so.quoteNumber}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">Direct Order</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="font-extrabold text-[#0f172a] text-sm">
                              {formatINR(so.totalAmount)}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-slate-600">
                            {so.date}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${getOrderBadgeClass(so.status || so.fulfillmentStatus)}`}>
                              {so.status || so.fulfillmentStatus || 'Confirmed'}
                            </span>
                          </td>

                          {/* Billing Action */}
                          <td className="py-3.5 px-3 text-center">
                            {hasLinkedInvoice ? (
                              <button
                                onClick={() => {
                                  setActiveTab('invoices');
                                  setSearchTerm(linkedInv?.invoiceNumber || so.invoiceNumber || '');
                                }}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1 w-full"
                              >
                                <Eye size={13} /> View Invoice ({linkedInv?.invoiceNumber || so.invoiceNumber || 'Linked'})
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenCreateInvoice(so)}
                                disabled={so.status === 'Cancelled' || so.fulfillmentStatus === 'Cancelled'}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1.5 w-full"
                              >
                                <Receipt size={13} /> Issue Tax Invoice
                              </button>
                            )}
                          </td>

                          {/* Menu */}
                          <td className="py-3.5 px-2 text-center">
                            <div className="relative group/menu inline-block">
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                                <MoreVertical size={15} />
                              </button>
                              <div className="absolute right-0 top-0 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 hidden group-hover/menu:block z-20 text-xs">
                                <button
                                  onClick={() => updateSalesOrder(so.id, { status: 'Delivered', fulfillmentStatus: 'Fulfilled' })}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                                >
                                  Mark Delivered
                                </button>
                                <button
                                  onClick={() => updateSalesOrder(so.id, { status: 'Cancelled', fulfillmentStatus: 'Cancelled' })}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600"
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
              <div className="p-12 text-center text-slate-400">
                <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No sales orders found</p>
                <p className="text-xs mt-0.5">Accept an active quotation to generate its corresponding sales order.</p>
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
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                    invoiceStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Invoices Table */}
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase border-y border-slate-200">
                      <th className="py-3 px-3 font-semibold">Invoice Number</th>
                      <th className="py-3 px-3 font-semibold">Customer Account</th>
                      <th className="py-3 px-3 font-semibold">Source Order / Quote</th>
                      <th className="py-3 px-3 font-semibold text-right">Invoice Amount</th>
                      <th className="py-3 px-3 font-semibold text-right">Balance Due</th>
                      <th className="py-3 px-3 font-semibold">Due Date</th>
                      <th className="py-3 px-3 font-semibold text-center">Status</th>
                      <th className="py-3 px-3 font-semibold text-center w-48">Accounts Action</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredInvoices.map(inv => {
                      const balance = Math.max(0, inv.amount - (inv.paidAmount || 0));

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-mono font-bold text-blue-700">{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-400">Date: {inv.date}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-900">{inv.customerName}</div>
                          </td>

                          <td className="py-3.5 px-3 text-slate-600">
                            {inv.salesOrderNumber ? (
                              <button
                                onClick={() => {
                                  setActiveTab('orders');
                                  setSearchTerm(inv.salesOrderNumber || '');
                                }}
                                className="font-mono text-indigo-700 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <ShoppingCart size={11} /> {inv.salesOrderNumber}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">Direct Invoice</span>
                            )}
                            {inv.quoteNumber && (
                              <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                                Ref: {inv.quoteNumber}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="font-extrabold text-[#0f172a] text-sm">
                              {formatINR(inv.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Paid: {formatINR(inv.paidAmount || 0)}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className={`font-bold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {formatINR(balance)}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-slate-600">
                            <div>{inv.dueDate}</div>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${getInvoiceBadgeClass(inv.status)}`}>
                              {inv.status}
                            </span>
                          </td>

                          {/* Accounts / Payment Action */}
                          <td className="py-3.5 px-3 text-center">
                            {inv.status === 'Paid' ? (
                              <span className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1">
                                <CheckCircle2 size={14} /> Settlement Complete
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRecordPayment(inv)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1 w-full"
                              >
                                <DollarSign size={13} /> Record Payment
                              </button>
                            )}
                          </td>

                          {/* Menu */}
                          <td className="py-3.5 px-2 text-center">
                            <div className="relative group/menu inline-block">
                              <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                                <MoreVertical size={15} />
                              </button>
                              <div className="absolute right-0 top-0 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 hidden group-hover/menu:block z-20 text-xs">
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this invoice?')) {
                                      deleteInvoice(inv.id);
                                    }
                                  }}
                                  disabled={inv.status === 'Paid'}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold disabled:opacity-30"
                                >
                                  Delete Invoice
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
              <div className="p-12 text-center text-slate-400">
                <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">No tax invoices found</p>
                <p className="text-xs mt-0.5">Issue an invoice from a confirmed sales order to begin receivables tracking.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <QuotationModal
        isOpen={showQuoteModal}
        onClose={() => { setShowQuoteModal(false); setEditingQuotation(null); setIsRevisionMode(false); }}
        quotationToEdit={editingQuotation}
        isRevisionMode={isRevisionMode}
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
      />
    </div>
  );
};
