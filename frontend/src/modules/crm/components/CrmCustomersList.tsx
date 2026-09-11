import React, { useState, useMemo } from 'react';
import { CrmView, Customer } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR, getCustomerStatusColor } from '../utils/crmUtils';
import { 
  Search, Filter, Plus, MoreVertical, Edit2, Archive, Phone, Mail, 
  ChevronLeft, ChevronRight, User, Building2, AlertCircle, Calendar,
  CheckCircle2, AlertTriangle, Clock, CreditCard, DollarSign, X,
  Briefcase, FolderGit2, FileText, ChevronDown, RefreshCw
} from 'lucide-react';

interface CrmCustomersListProps {
  onViewChange: (view: CrmView) => void;
  onCustomerSelect?: (id: string) => void;
}

export const CrmCustomersList: React.FC<CrmCustomersListProps> = ({ onViewChange, onCustomerSelect }) => {
  const { customers, salesOrders, invoices, opportunities, projects, updateCustomer } = useApp();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'At Risk' | 'Inactive' | 'Archived'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Advanced Filters State
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [hasOpenOppFilter, setHasOpenOppFilter] = useState<boolean>(false);
  const [hasActiveProjectFilter, setHasActiveProjectFilter] = useState<boolean>(false);
  const [hasOutstandingInvoiceFilter, setHasOutstandingInvoiceFilter] = useState<boolean>(false);

  // Active (non-archived) vs all
  const activeCustomers = useMemo(() => customers.filter(c => c.status !== 'Archived'), [customers]);
  const archivedCustomers = useMemo(() => customers.filter(c => c.status === 'Archived'), [customers]);

  // Pre-calculate per-customer commercial metrics for accuracy
  const customerSalesMap = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach(cust => {
      // 1. Sum Sales Orders
      const custOrders = salesOrders.filter(
        so => (so.customerId === cust.id || (so.customerName && so.customerName.toLowerCase() === cust.customerName.toLowerCase())) &&
              so.status !== 'Cancelled'
      );
      const ordersTotal = custOrders.reduce((sum, so) => sum + (Number(so.totalAmount) || 0), 0);

      // 2. Sum Invoices (if orders not present or supplementary)
      const custInvoices = invoices.filter(
        inv => (inv.customerId === cust.id || (inv.customerName && inv.customerName.toLowerCase() === cust.customerName.toLowerCase())) &&
               inv.status !== 'Cancelled'
      );
      const invoiceTotal = custInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      // Total sales is confirmed sales orders or invoices
      const sales = ordersTotal > 0 ? ordersTotal : invoiceTotal;
      map.set(cust.id, sales);
    });
    return map;
  }, [customers, salesOrders, invoices]);

  // Per-customer outstanding invoice balance
  const customerOutstandingMap = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach(cust => {
      const custInvoices = invoices.filter(
        inv => (inv.customerId === cust.id || (inv.customerName && inv.customerName.toLowerCase() === cust.customerName.toLowerCase())) &&
               inv.status !== 'Paid' && inv.status !== 'Cancelled'
      );
      const outstanding = custInvoices.reduce((sum, inv) => {
        const total = Number(inv.amount) || 0;
        const paid = Number(inv.paidAmount) || 0;
        return sum + Math.max(0, total - paid);
      }, 0);
      map.set(cust.id, outstanding);
    });
    return map;
  }, [customers, invoices]);

  // Overall commercial summary metrics
  const totalSalesOverall = useMemo(() => {
    let sum = 0;
    customerSalesMap.forEach((val) => { sum += val; });
    return sum;
  }, [customerSalesMap]);

  const totalOutstandingOverall = useMemo(() => {
    let sum = 0;
    customerOutstandingMap.forEach((val) => { sum += val; });
    return sum;
  }, [customerOutstandingMap]);

  // Derived counts for tabs
  const counts = useMemo(() => ({
    All: activeCustomers.length,
    Active: activeCustomers.filter(c => c.status === 'Active').length,
    'At Risk': activeCustomers.filter(c => c.status === 'At Risk').length,
    Inactive: activeCustomers.filter(c => c.status === 'Inactive').length,
    Archived: archivedCustomers.length,
  }), [activeCustomers, archivedCustomers]);

  // Unique filter lists
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => { if (c.industry) set.add(c.industry); });
    return Array.from(set).sort();
  }, [customers]);

  const availableOwners = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => { if (c.ownerId) set.add(c.ownerId); });
    return Array.from(set).sort();
  }, [customers]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (industryFilter !== 'All') count++;
    if (ownerFilter !== 'All') count++;
    if (typeFilter !== 'All') count++;
    if (hasOpenOppFilter) count++;
    if (hasActiveProjectFilter) count++;
    if (hasOutstandingInvoiceFilter) count++;
    return count;
  }, [industryFilter, ownerFilter, typeFilter, hasOpenOppFilter, hasActiveProjectFilter, hasOutstandingInvoiceFilter]);

  const resetFilters = () => {
    setIndustryFilter('All');
    setOwnerFilter('All');
    setTypeFilter('All');
    setHasOpenOppFilter(false);
    setHasActiveProjectFilter(false);
    setHasOutstandingInvoiceFilter(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Filtered and Searched list
  const filteredCustomers = useMemo(() => {
    const baseList = activeTab === 'Archived' ? archivedCustomers : activeCustomers;
    
    return baseList.filter(c => {
      // Tab filter
      if (activeTab !== 'All' && activeTab !== 'Archived' && c.status !== activeTab) return false;
      
      // Industry filter
      if (industryFilter !== 'All' && c.industry !== industryFilter) return false;

      // Owner filter
      if (ownerFilter !== 'All' && c.ownerId !== ownerFilter) return false;

      // Customer Type filter
      if (typeFilter !== 'All' && c.customerType !== typeFilter) return false;

      // Has Open Opportunity
      if (hasOpenOppFilter) {
        const hasOpp = opportunities.some(o => (o.customerId === c.id || o.customerName === c.customerName) && o.stage !== 'Won' && o.stage !== 'Lost');
        if (!hasOpp) return false;
      }

      // Has Active Project
      if (hasActiveProjectFilter) {
        const hasProj = projects.some(p => (p.customerId === c.id || p.client === c.customerName) && p.status !== 'Completed');
        if (!hasProj) return false;
      }

      // Has Outstanding Invoice
      if (hasOutstandingInvoiceFilter) {
        const outstanding = customerOutstandingMap.get(c.id) || 0;
        if (outstanding <= 0) return false;
      }

      // Search filter across multiple fields
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = c.customerName?.toLowerCase().includes(term);
        const matchesCode = c.customerCode?.toLowerCase().includes(term);
        const matchesContactName = c.primaryContact?.name?.toLowerCase().includes(term);
        const matchesContactEmail = c.primaryContact?.email?.toLowerCase().includes(term);
        const matchesContactPhone = c.primaryContact?.phone?.includes(term);
        const matchesCity = c.billingAddress?.city?.toLowerCase().includes(term);
        const matchesCountry = c.billingAddress?.country?.toLowerCase().includes(term);
        const matchesIndustry = c.industry?.toLowerCase().includes(term);

        if (!matchesName && !matchesCode && !matchesContactName && !matchesContactEmail && !matchesContactPhone && !matchesCity && !matchesCountry && !matchesIndustry) {
          return false;
        }
      }
      return true;
    });
  }, [
    activeCustomers, archivedCustomers, activeTab, industryFilter, ownerFilter, typeFilter, 
    hasOpenOppFilter, hasActiveProjectFilter, hasOutstandingInvoiceFilter, searchTerm,
    opportunities, projects, customerOutstandingMap
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const handleArchive = (id: string) => {
    if (window.confirm("Archive Customer?\nThis customer will be moved to archived customers.")) {
      updateCustomer(id, { status: 'Archived' });
    }
  };

  const handleRestore = (id: string) => {
    updateCustomer(id, { status: 'Active' });
  };

  const getStatusBadge = (status: string) => {
    return getCustomerStatusColor(status);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a] font-semibold">Customers</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Customer Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer relationships, accounts, contacts, and commercial activity.</p>
        </div>
        <button 
          onClick={() => onViewChange('add-customer')} 
          className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={16} /> New Customer
        </button>
      </div>

      {/* 2. SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0f172a] mt-2">{counts.All}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active customer accounts</p>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{counts.Active}</div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Healthy activity & deals</p>
        </div>

        {/* At Risk Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">At Risk</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{counts['At Risk']}</div>
          <p className="text-[11px] text-amber-600/80 mt-1">Needs timely attention</p>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-900 mt-2 truncate" title={formatINR(totalSalesOverall)}>
            {formatINR(totalSalesOverall)}
          </div>
          <p className="text-[11px] text-indigo-600/80 mt-1">From orders & invoices</p>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Outstanding</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-700 mt-2 truncate" title={formatINR(totalOutstandingOverall)}>
            {formatINR(totalOutstandingOverall)}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1">Unpaid invoice balances</p>
        </div>
      </div>

      {/* 3. MAIN TABLE CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        
        {/* TABS & SEARCH & FILTER CONTROLS */}
        <div className="border-b border-slate-200 p-4 sm:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Status Filter Tabs */}
            <div className="flex overflow-x-auto no-scrollbar sm:px-4">
              {(['All', 'Active', 'At Risk', 'Inactive', ...(counts.Archived > 0 ? ['Archived' as const] : [])] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={`flex items-center px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-[#0f172a] hover:border-slate-300'
                  }`}
                >
                  {tab}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab 
                      ? (tab === 'At Risk' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700')
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Filter Actions */}
            <div className="flex items-center gap-2 sm:pr-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search customers, contacts, city..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-72"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button 
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`px-3 py-2 border rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  showFilterDrawer || activeFiltersCount > 0 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter size={15} />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ADVANCED FILTER PANEL */}
          {showFilterDrawer && (
            <div className="p-4 bg-slate-50/90 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Industry Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Industry</label>
                  <select 
                    value={industryFilter} 
                    onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Industries</option>
                    {availableIndustries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Owner Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Owner</label>
                  <select 
                    value={ownerFilter} 
                    onChange={(e) => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Owners</option>
                    {availableOwners.map(own => (
                      <option key={own} value={own}>{own}</option>
                    ))}
                  </select>
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Type</label>
                  <select 
                    value={typeFilter} 
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Types</option>
                    <option value="Company">Company</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>

                {/* Quick Relationship Toggles */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationships</label>
                  <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasOpenOppFilter} 
                      onChange={(e) => { setHasOpenOppFilter(e.target.checked); setCurrentPage(1); }}
                      className="rounded border-slate-300 text-indigo-600 mr-2 focus:ring-indigo-500" 
                    />
                    Has Open Opportunities
                  </label>
                  <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasActiveProjectFilter} 
                      onChange={(e) => { setHasActiveProjectFilter(e.target.checked); setCurrentPage(1); }}
                      className="rounded border-slate-300 text-indigo-600 mr-2 focus:ring-indigo-500" 
                    />
                    Has Active Projects
                  </label>
                  <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasOutstandingInvoiceFilter} 
                      onChange={(e) => { setHasOutstandingInvoiceFilter(e.target.checked); setCurrentPage(1); }}
                      className="rounded border-slate-300 text-indigo-600 mr-2 focus:ring-indigo-500" 
                    />
                    Has Outstanding Invoices
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80">
                <button 
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0f172a] bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Reset Filters
                </button>
                <button 
                  onClick={() => setShowFilterDrawer(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CUSTOMER TABLE */}
        <div className="flex-1 overflow-auto">
          {paginatedCustomers.length > 0 ? (
            <div className="min-w-[1100px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-semibold w-28">Code</th>
                    <th className="p-4 font-semibold">Company</th>
                    <th className="p-4 font-semibold">Industry</th>
                    <th className="p-4 font-semibold">Primary Contact</th>
                    <th className="p-4 font-semibold">Location</th>
                    <th className="p-4 font-semibold text-right">Total Sales</th>
                    <th className="p-4 font-semibold text-right">Credit Limit</th>
                    <th className="p-4 font-semibold text-center w-28">Status</th>
                    <th className="p-4 font-semibold text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedCustomers.map(customer => {
                    const sales = customerSalesMap.get(customer.id) || 0;
                    const outstanding = customerOutstandingMap.get(customer.id) || 0;

                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Customer Code */}
                        <td className="p-4 font-mono text-xs font-semibold text-indigo-600">
                          {customer.customerCode || '—'}
                        </td>

                        {/* Company Name */}
                        <td className="p-4">
                          <div 
                            className="font-bold text-[#0f172a] cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => onCustomerSelect && onCustomerSelect(customer.id)}
                          >
                            {customer.customerName}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span>{customer.customerType || 'Company'}</span>
                            {customer.convertedFromLeadId && (
                              <span className="inline-block px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                From Lead
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="p-4 text-slate-700 text-xs font-medium">
                          {customer.industry || '—'}
                        </td>

                        {/* Primary Contact */}
                        <td className="p-4">
                          <div className="font-medium text-[#0f172a] flex items-center text-xs">
                            <User size={12} className="mr-1.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[140px]">{customer.primaryContact?.name || '—'}</span>
                          </div>
                          {customer.primaryContact?.email ? (
                            <a 
                              href={`mailto:${customer.primaryContact.email}`} 
                              className="text-xs text-slate-500 hover:text-indigo-600 flex items-center mt-0.5 truncate max-w-[170px]"
                            >
                              <Mail size={11} className="mr-1 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{customer.primaryContact.email}</span>
                            </a>
                          ) : (
                            <div className="text-xs text-slate-400 mt-0.5">—</div>
                          )}
                        </td>

                        {/* Location */}
                        <td className="p-4 text-xs text-slate-600">
                          <div>{customer.billingAddress?.city || '—'}</div>
                          {customer.billingAddress?.country && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{customer.billingAddress.country}</div>
                          )}
                        </td>

                        {/* Total Sales */}
                        <td className="p-4 text-right">
                          <div className="font-bold text-[#0f172a]">
                            {sales > 0 ? formatINR(sales) : '₹0'}
                          </div>
                          {outstanding > 0 && (
                            <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                              Due: {formatINR(outstanding)}
                            </div>
                          )}
                        </td>

                        {/* Credit Limit */}
                        <td className="p-4 text-right">
                          <div className="font-bold text-slate-700">
                            {formatINR(customer.creditLimit || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Limit</div>
                        </td>

                        {/* Status (Display-Only Badge with Health Reason Tooltip) */}
                        <td className="p-4 text-center">
                          <div className="relative group/status inline-block">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(customer.status)} cursor-default select-none`}>
                              {customer.status}
                            </span>
                            
                            {/* Health Signals / Reason Popover */}
                            {customer.healthSummary?.reasons && customer.healthSummary.reasons.length > 0 && (
                              <div className="absolute right-0 bottom-full mb-2 hidden group-hover/status:block z-30 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-slate-700 pointer-events-none text-left">
                                <p className="font-bold text-slate-200 text-[11px] mb-1.5 flex items-center justify-between">
                                  <span>Health Classification</span>
                                  <span className="text-indigo-400 font-semibold">{customer.status}</span>
                                </p>
                                <ul className="space-y-1 text-[11px] text-slate-300">
                                  {customer.healthSummary.reasons.map((r, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span className="text-indigo-400 font-bold">•</span>
                                      <span>{r}</span>
                                    </li>
                                  ))}
                                </ul>
                                {customer.healthSummary.daysSinceLastActivity !== null && (
                                  <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                                    Last activity: {customer.healthSummary.daysSinceLastActivity} days ago
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions Menu */}
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center relative group/menu">
                            <button className="p-1.5 text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 rounded-lg transition-colors">
                              <MoreVertical size={16} />
                            </button>
                            <div className="absolute right-6 top-0 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover/menu:block z-20 text-left">
                              <button 
                                onClick={() => onCustomerSelect && onCustomerSelect(customer.id)} 
                                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => onCustomerSelect && onCustomerSelect(customer.id)}
                                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                              >
                                Edit Customer
                              </button>
                              <button 
                                onClick={() => onViewChange('contacts')}
                                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                              >
                                View Contacts
                              </button>
                              <button 
                                onClick={() => onViewChange('opportunities')}
                                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                              >
                                View Deals
                              </button>
                              <div className="h-px bg-slate-200 my-1"></div>
                              {customer.status === 'Archived' ? (
                                <button 
                                  onClick={() => handleRestore(customer.id)} 
                                  className="w-full text-left px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 font-medium"
                                >
                                  Restore Customer
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleArchive(customer.id)} 
                                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium"
                                >
                                  Archive
                                </button>
                              )}
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
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                {searchTerm || activeFiltersCount > 0 ? <Search className="text-slate-400" size={24} /> : <Building2 className="text-slate-400" size={24} />}
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">
                {searchTerm || activeFiltersCount > 0 ? 'No matching customers found' : 'No customers found'}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                {searchTerm || activeFiltersCount > 0 
                  ? 'Try clearing your search query or changing active filter criteria to find customer accounts.' 
                  : 'Add your first customer account to start managing commercial activity, contacts and sales.'}
              </p>
              {searchTerm || activeFiltersCount > 0 ? (
                <button 
                  onClick={resetFilters} 
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              ) : (
                <button 
                  onClick={() => onViewChange('add-customer')} 
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-500 flex items-center"
                >
                  <Plus size={16} className="mr-2" /> Add Customer
                </button>
              )}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {paginatedCustomers.length > 0 && (
          <div className="border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center text-sm text-slate-500">
              <span>Showing <span className="font-bold text-[#0f172a]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-bold text-[#0f172a]">{filteredCustomers.length}</span> customers</span>
              <span className="mx-4 h-4 w-px bg-slate-300 hidden sm:block"></span>
              <div className="hidden sm:flex items-center">
                <span className="mr-2 text-xs text-slate-500">Rows per page:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                  className="border border-slate-300 rounded p-1 text-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm font-medium text-slate-700 px-2">
                {currentPage} / {totalPages || 1}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
