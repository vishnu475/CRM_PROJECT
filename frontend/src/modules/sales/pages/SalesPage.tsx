import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, SalesOrder, Invoice } from '../../../types';
import { TrendingUp, Plus, Search, FileText, ShoppingCart, CheckCircle2, Clock } from 'lucide-react';

export const SalesPage: React.FC = () => {
  const { quotations, salesOrders, invoices, addQuotation, addSalesOrder, addInvoice, customers } = useApp();
  const [activeTab, setActiveTab] = useState<'quotes' | 'orders' | 'invoices'>('quotes');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('450000');
  const [description, setDescription] = useState('Enterprise ERP Software & Implementation');

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId) || customers[0];
    const quoteNum = `QT-2025-${Math.floor(Math.random() * 900) + 100}`;
    const quoteData: Omit<Quotation, 'id'> = {
      quoteNumber: quoteNum,
      customerName: cust?.customerName || 'Globex Corporation',
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount) || 100000,
      status: 'Sent',
      customerId: cust?.id || 'CUST-001',
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      itemsCount: 1,
    };
    await addQuotation(quoteData);
    setShowQuoteModal(false);
  };

  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId) || customers[0];
    const soNum = `SO-2025-${Math.floor(Math.random() * 900) + 100}`;
    const soData: Omit<SalesOrder, 'id'> = {
      soNumber: soNum,
      customerName: cust?.customerName || 'Initech LLC',
      date: new Date().toISOString().split('T')[0],
      totalAmount: parseFloat(amount) || 250000,
      fulfillmentStatus: 'Pending',
    };
    await addSalesOrder(soData);
    setShowOrderModal(false);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId) || customers[0];
    const invNum = `INV-2025-${Math.floor(Math.random() * 900) + 100}`;
    const invData: Omit<Invoice, 'id'> = {
      invoiceNumber: invNum,
      customerName: cust?.customerName || 'Acme Corp',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      amount: parseFloat(amount) || 350000,
      paidAmount: 0,
      status: 'Issued'
    };
    await addInvoice(invData);
    setShowInvoiceModal(false);
  };

  const totalQuotesValue = quotations.reduce((sum, q) => sum + (q.amount || 0), 0);
  const totalOrdersValue = salesOrders.reduce((sum, so) => sum + (so.totalAmount || 0), 0);
  const totalInvoicedValue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={24} />
            Sales & Revenue Management Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage quotations, confirmed sales orders, and commercial tax invoices
          </p>
        </div>

        {/* Action Button depending on tab */}
        <div>
          {activeTab === 'quotes' && (
            <button
              onClick={() => setShowQuoteModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={16} /> + New Quotation
            </button>
          )}
          {activeTab === 'orders' && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={16} /> + New Sales Order
            </button>
          )}
          {activeTab === 'invoices' && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={16} /> + Post Tax Invoice
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Quotes Pipeline</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹ {totalQuotesValue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">{quotations.length} Active Quotations</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Confirmed Sales Orders</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">₹ {totalOrdersValue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">{salesOrders.length} Confirmed Orders</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Billed Invoices</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹ {totalInvoicedValue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">{invoices.length} Invoices Issued</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'quotes' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quotations ({quotations.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales Orders ({salesOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tax Invoices ({invoices.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'quotes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotations.map((q) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-600">{q.quoteNumber}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{q.customerName}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  q.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                }`}>
                  {q.status}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400">Valid: {q.validUntil || q.date}</span>
                <span className="text-sm font-extrabold text-slate-900">₹ {q.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesOrders.map((so) => (
            <div key={so.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600">{so.soNumber}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{so.customerName}</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                  {so.fulfillmentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400">Order Date: {so.date}</span>
                <span className="text-sm font-extrabold text-slate-900">₹ {so.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600">{inv.invoiceNumber}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{inv.customerName}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {inv.status}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400">Due: {inv.dueDate}</span>
                <span className="text-sm font-extrabold text-slate-900">₹ {inv.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals for Quotation, Order, Invoice */}
      {(showQuoteModal || showOrderModal || showInvoiceModal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {showQuoteModal && 'Create New Quotation'}
                {showOrderModal && 'Issue Sales Order'}
                {showInvoiceModal && 'Post Tax Invoice'}
              </h3>
              <button
                onClick={() => { setShowQuoteModal(false); setShowOrderModal(false); setShowInvoiceModal(false); }}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >✕</button>
            </div>

            <form
              onSubmit={showQuoteModal ? handleCreateQuotation : showOrderModal ? handleCreateSalesOrder : handleCreateInvoice}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Account *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Total Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Item / Scope Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowQuoteModal(false); setShowOrderModal(false); setShowInvoiceModal(false); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
