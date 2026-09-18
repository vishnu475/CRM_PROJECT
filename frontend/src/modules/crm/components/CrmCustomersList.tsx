import React, { useState, useMemo, useEffect } from 'react';
import { CrmView, Customer } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR } from '../utils/crmUtils';
import { fetchAllEmployeesFromDB } from '../../../services/employeePersistence';
import { 
  Search, Filter, Plus, MoreVertical, Building2, AlertTriangle, 
  CheckCircle2, DollarSign, X, ChevronLeft, ChevronRight, User, 
  Mail, XCircle, ChevronDown
} from 'lucide-react';

interface CrmCustomersListProps {
  onViewChange: (view: CrmView) => void;
  onCustomerSelect?: (id: string) => void;
}

export const CrmCustomersList: React.FC<CrmCustomersListProps> = ({ onViewChange, onCustomerSelect }) => {
  const { customers, salesOrders, invoices, updateCustomer } = useApp();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'At Risk' | 'Inactive'>('All');
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Live Employee Map for resolving Owner names from HRMS
  const [employeeMap, setEmployeeMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchAllEmployeesFromDB().then(emps => {
      const map = new Map<string, string>();
      emps.forEach((emp: any) => {
        if (emp.empCode) map.set(emp.empCode, emp.name);
        if (emp.id) map.set(emp.id, emp.name);
      });
      setEmployeeMap(map);
    });
  }, []);

  // Filter out archived customers unless explicitly viewed
  const nonArchivedCustomers = useMemo(() => customers.filter(c => c.status !== 'Archived'), [customers]);

  // Map of Customer Commercial Value (Total Confirmed Sales / Invoices)
  const customerSalesMap = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach(cust => {
      const custOrders = salesOrders.filter(
        so => (so.customerId === cust.id || (so.customerName && so.customerName.toLowerCase() === cust.customerName.toLowerCase())) &&
              so.status !== 'Cancelled'
      );
      const ordersTotal = custOrders.reduce((sum, so) => sum + (Number(so.totalAmount) || 0), 0);

      const custInvoices = invoices.filter(
        inv => (inv.customerId === cust.id || (inv.customerName && inv.customerName.toLowerCase() === cust.customerName.toLowerCase())) &&
               inv.status !== 'Cancelled'
      );
      const invoiceTotal = custInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      const sales = ordersTotal > 0 ? ordersTotal : invoiceTotal;
      map.set(cust.id, sales);
    });
    return map;
  }, [customers, salesOrders, invoices]);

  // Overall commercial summary metrics
  const totalSalesOverall = useMemo(() => {
    let sum = 0;
    customerSalesMap.forEach((val) => { sum += val; });
    return sum;
  }, [customerSalesMap]);

  // Derived counts for tabs
  const counts = useMemo(() => ({
    All: nonArchivedCustomers.length,
    Active: nonArchivedCustomers.filter(c => c.status === 'Active').length,
    'At Risk': nonArchivedCustomers.filter(c => c.status === 'At Risk').length,
    Inactive: nonArchivedCustomers.filter(c => c.status === 'Inactive').length,
  }), [nonArchivedCustomers]);

  // Helper to get owner display name
  const getOwnerDisplayName = (ownerId?: string) => {
    if (!ownerId) return 'Unassigned';
    if (employeeMap.has(ownerId)) return employeeMap.get(ownerId)!;
    if (ownerId === 'EMP-001') return 'Sarah Jenkins';
    if (ownerId === 'EMP-002') return 'Michael Vance';
    if (ownerId === 'EMP-003') return 'Priya Sharma';
    if (ownerId === 'EMP-004') return 'Rahul Verma';
    if (ownerId.startsWith('EMP-')) return ownerId;
    return ownerId;
  };

  // Helper to format Location
  const getLocationDisplay = (cust: Customer) => {
    const city = cust.billingAddress?.city || cust.shippingAddress?.city;
    const country = cust.billingAddress?.country || cust.shippingAddress?.country;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return 'Not provided';
  };

  // Unique filter lists
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    nonArchivedCustomers.forEach(c => { if (c.industry && c.industry !== 'N/A') set.add(c.industry); });
    return Array.from(set).sort();
  }, [nonArchivedCustomers]);

  const availableOwners = useMemo(() => {
    const set = new Set<string>();
    nonArchivedCustomers.forEach(c => { 
      const ownerName = getOwnerDisplayName(c.ownerId);
      if (ownerName && ownerName !== 'Unassigned') set.add(ownerName); 
    });
    return Array.from(set).sort();
  }, [nonArchivedCustomers, employeeMap]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    nonArchivedCustomers.forEach(c => {
      const loc = getLocationDisplay(c);
      if (loc && loc !== 'Not provided') set.add(loc);
    });
    return Array.from(set).sort();
  }, [nonArchivedCustomers]);

  // Filtered and Searched list
  const filteredCustomers = useMemo(() => {
    return nonArchivedCustomers.filter(c => {
      // Tab status filter
      if (activeTab !== 'All' && c.status !== activeTab) return false;
      
      // Industry filter
      if (industryFilter !== 'All' && c.industry !== industryFilter) return false;

      // Owner filter
      if (ownerFilter !== 'All') {
        const ownerName = getOwnerDisplayName(c.ownerId);
        if (ownerName !== ownerFilter) return false;
      }

      // Location filter
      if (locationFilter !== 'All') {
        const loc = getLocationDisplay(c);
        if (loc !== locationFilter) return false;
      }

      // Search filter across customer name, code, contact, email, location, industry
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = c.customerName?.toLowerCase().includes(term);
        const matchesCode = c.customerCode?.toLowerCase().includes(term);
        const matchesContactName = c.primaryContact?.name?.toLowerCase().includes(term);
        const matchesContactEmail = c.primaryContact?.email?.toLowerCase().includes(term);
        const matchesCity = c.billingAddress?.city?.toLowerCase().includes(term);
        const matchesCountry = c.billingAddress?.country?.toLowerCase().includes(term);
        const matchesIndustry = c.industry?.toLowerCase().includes(term);

        if (!matchesName && !matchesCode && !matchesContactName && !matchesContactEmail && !matchesCity && !matchesCountry && !matchesIndustry) {
          return false;
        }
      }
      return true;
    });
  }, [nonArchivedCustomers, activeTab, industryFilter, ownerFilter, locationFilter, searchTerm, employeeMap]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const hasActiveFilters = industryFilter !== 'All' || ownerFilter !== 'All' || locationFilter !== 'All' || searchTerm !== '';

  const resetFilters = () => {
    setIndustryFilter('All');
    setOwnerFilter('All');
    setLocationFilter('All');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'At Risk':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Inactive':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer profiles, relationships and commercial activity.</p>
        </div>
        <button 
          onClick={() => onViewChange('add-customer')} 
          className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={16} /> New Customer
        </button>
      </div>

      {/* 2. BUSINESS SUMMARY CARDS */}
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
          <p className="text-[11px] text-slate-400 mt-1">Total customer records</p>
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
          <p className="text-[11px] text-emerald-600/80 mt-1">Active customer accounts</p>
        </div>

        {/* At Risk Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">At Risk</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{counts['At Risk']}</div>
          <p className="text-[11px] text-rose-600/80 mt-1">Accounts requiring attention</p>
        </div>

        {/* Inactive Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive</span>
            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-600 mt-2">{counts.Inactive}</div>
          <p className="text-[11px] text-slate-400 mt-1">Inactive customer accounts</p>
        </div>

        {/* Total Customer Value */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total Value</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-900 mt-2 truncate" title={formatINR(totalSalesOverall)}>
            {formatINR(totalSalesOverall)}
          </div>
          <p className="text-[11px] text-indigo-600/80 mt-1">Total commercial value</p>
        </div>
      </div>

      {/* 3. MAIN CONTENT CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        
        {/* TABS & SEARCH & INLINE FILTERS */}
        <div className="border-b border-slate-200 p-4 space-y-4">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
            {(['All', 'Active', 'At Risk', 'Inactive'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                {tab}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab 
                    ? (tab === 'At Risk' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-700')
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Compact Inline Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white w-full transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Compact Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Industry Filter */}
              <div className="relative">
                <select
                  value={industryFilter}
                  onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">Industry: All</option>
                  {availableIndustries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Owner Filter */}
              <div className="relative">
                <select
                  value={ownerFilter}
                  onChange={(e) => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">Owner: All</option>
                  {availableOwners.map(own => (
                    <option key={own} value={own}>{own}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Location Filter */}
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">Location: All</option>
                  {availableLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CUSTOMER TABLE (NO CHECKBOXES, STRICT SPEC COLUMNS) */}
        <div className="flex-1 overflow-auto">
          {paginatedCustomers.length > 0 ? (
            <div className="min-w-[1000px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 sticky top-0 z-10 font-semibold tracking-wider">
                  <tr>
                    <th className="p-4">CUSTOMER / COMPANY</th>
                    <th className="p-4">INDUSTRY</th>
                    <th className="p-4">PRIMARY CONTACT</th>
                    <th className="p-4">LOCATION</th>
                    <th className="p-4 text-right">CUSTOMER VALUE</th>
                    <th className="p-4">OWNER</th>
                    <th className="p-4 text-center">STATUS</th>
                    <th className="p-4 text-center w-16">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedCustomers.map(customer => {
                    const sales = customerSalesMap.get(customer.id) || 0;
                    const primaryContact = customer.primaryContact && customer.primaryContact.name && customer.primaryContact.name !== 'New Contact' 
                      ? customer.primaryContact 
                      : null;
                    const locationStr = getLocationDisplay(customer);
                    const ownerName = getOwnerDisplayName(customer.ownerId);
                    const isMenuOpen = activeActionMenuId === customer.id;

                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* 1. CUSTOMER / COMPANY */}
                        <td className="p-4">
                          <div 
                            className="font-bold text-[#0f172a] text-sm cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => onCustomerSelect && onCustomerSelect(customer.id)}
                          >
                            {customer.customerName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {customer.customerCode || customer.id}
                          </div>
                        </td>

                        {/* 2. INDUSTRY */}
                        <td className="p-4">
                          {customer.industry && customer.industry !== 'N/A' ? (
                            <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
                              {customer.industry}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* 3. PRIMARY CONTACT */}
                        <td className="p-4">
                          {primaryContact ? (
                            <div>
                              <div className="font-semibold text-slate-800 text-xs">{primaryContact.name}</div>
                              {primaryContact.email && (
                                <div className="text-xs text-slate-500 mt-0.5">{primaryContact.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-normal">No primary contact</span>
                          )}
                        </td>

                        {/* 4. LOCATION */}
                        <td className="p-4 text-xs text-slate-700">
                          {locationStr !== 'Not provided' ? (
                            <span>{locationStr}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Not provided</span>
                          )}
                        </td>

                        {/* 5. CUSTOMER VALUE */}
                        <td className="p-4 text-right font-extrabold text-[#0f172a] text-sm">
                          {sales > 0 ? formatINR(sales) : <span className="text-xs text-slate-400 font-normal">Not available</span>}
                        </td>

                        {/* 6. OWNER */}
                        <td className="p-4 text-xs font-medium text-slate-800">
                          {ownerName !== 'Unassigned' ? (
                            <span>{ownerName}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Unassigned</span>
                          )}
                        </td>

                        {/* 7. STATUS */}
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(customer.status)} select-none inline-block`}>
                            {customer.status}
                          </span>
                        </td>

                        {/* 8. ACTIONS */}
                        <td className="p-4 text-center relative">
                          <div className="relative inline-block text-left">
                            <button 
                              onClick={() => setActiveActionMenuId(isMenuOpen ? null : customer.id)}
                              className="p-1.5 text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-20" 
                                  onClick={() => setActiveActionMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-30 text-left">
                                  <button 
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      if (onCustomerSelect) onCustomerSelect(customer.id);
                                    }} 
                                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    View Details
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      if (onCustomerSelect) onCustomerSelect(customer.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    Edit Customer
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      onViewChange('contacts');
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    View Contacts
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      onViewChange('opportunities');
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >
                                    View Opportunities
                                  </button>
                                </div>
                              </>
                            )}
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
                <Building2 className="text-slate-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">
                {hasActiveFilters ? 'No matching customers found' : 'No customers found'}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                {hasActiveFilters 
                  ? 'Try clearing your search query or changing active filters to find customer accounts.' 
                  : 'Add your first customer account to start managing commercial activity, contacts and sales.'}
              </p>
              {hasActiveFilters ? (
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
                  <Plus size={16} className="mr-2" /> New Customer
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
