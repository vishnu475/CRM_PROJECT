import React, { useState, useMemo, useEffect } from 'react';
import { CrmView, Customer } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { fetchAllEmployeesFromDB } from '../../../services/employeePersistence';
import { 
  Search, Plus, MoreVertical, Building2, AlertTriangle, 
  CheckCircle2, X, ChevronLeft, ChevronRight, XCircle, 
  Trash2, ChevronDown
} from 'lucide-react';

interface CrmCustomersListProps {
  onViewChange: (view: CrmView) => void;
  onCustomerSelect?: (id: string) => void;
}

export const CrmCustomersList: React.FC<CrmCustomersListProps> = ({ onViewChange, onCustomerSelect }) => {
  const { customers, deleteCustomer } = useApp();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'At Risk' | 'Inactive'>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Customer Deletion State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Employee Name Mapping
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

  // Filter out archived customers
  const nonArchivedCustomers = useMemo(() => customers.filter(c => c.status !== 'Archived'), [customers]);

  // Derived counts for status tabs
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

  const availableOwners = useMemo(() => {
    const set = new Set<string>();
    nonArchivedCustomers.forEach(c => { 
      const ownerName = getOwnerDisplayName(c.ownerId);
      if (ownerName && ownerName !== 'Unassigned') set.add(ownerName); 
    });
    return Array.from(set).sort();
  }, [nonArchivedCustomers, employeeMap]);

  // Filtered and Searched list
  const filteredCustomers = useMemo(() => {
    return nonArchivedCustomers.filter(c => {
      // Tab status filter
      if (activeTab !== 'All' && c.status !== activeTab) return false;
      
      // Owner filter
      if (ownerFilter !== 'All') {
        const ownerName = getOwnerDisplayName(c.ownerId);
        if (ownerName !== ownerFilter) return false;
      }

      // Search filter across customer name, code, primary contact name, email
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = c.customerName?.toLowerCase().includes(term);
        const matchesCode = c.customerCode?.toLowerCase().includes(term);
        const matchesContactName = c.primaryContact?.name?.toLowerCase().includes(term);
        const matchesContactEmail = c.primaryContact?.email?.toLowerCase().includes(term);

        if (!matchesName && !matchesCode && !matchesContactName && !matchesContactEmail) {
          return false;
        }
      }
      return true;
    });
  }, [nonArchivedCustomers, activeTab, ownerFilter, searchTerm, employeeMap]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const hasActiveFilters = ownerFilter !== 'All' || searchTerm !== '';

  const resetFilters = () => {
    setOwnerFilter('All');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      setIsDeleting(true);
      await deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Failed to delete customer:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'At Risk':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Inactive':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Customers</h1>
          <p className="text-xs text-slate-500">
            Manage your established customers and relationships.
          </p>
        </div>
        <button
          onClick={() => onViewChange('add-customer')}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={16} /> New Customer
        </button>
      </div>

      {/* 2. SUMMARY CARDS (EXACTLY FOUR CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0f172a] mt-2">{counts.All}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total customer accounts</p>
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
      </div>

      {/* 3. MAIN CONTENT CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        
        {/* TABS & SEARCH & OWNER FILTER */}
        <div className="border-b border-slate-200 p-4 space-y-4">
          
          {/* Status Filter Tabs (ONLY All, Active, At Risk, Inactive) */}
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

          {/* Search & Owner Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search customers by name, code, contact..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white w-full transition-all"
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

            {/* Owner Filter Dropdown */}
            <div className="flex items-center gap-2">
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

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. CUSTOMER TABLE (EXACTLY 5 COLUMNS: Customer, Primary Contact, Owner, Status, Actions) */}
        <div className="flex-1 overflow-auto">
          {paginatedCustomers.length > 0 ? (
            <div className="min-w-[800px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 sticky top-0 z-10 font-semibold tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-4">CUSTOMER</th>
                    <th className="p-3.5">PRIMARY CONTACT</th>
                    <th className="p-3.5">OWNER</th>
                    <th className="p-3.5 text-center">STATUS</th>
                    <th className="p-3.5 text-center w-20 pr-4">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedCustomers.map(customer => {
                    const primaryContact = customer.primaryContact && customer.primaryContact.name && customer.primaryContact.name !== 'New Contact' 
                      ? customer.primaryContact 
                      : null;
                    const ownerName = getOwnerDisplayName(customer.ownerId);
                    const isMenuOpen = activeActionMenuId === customer.id;

                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* 1. CUSTOMER */}
                        <td className="p-3.5 pl-4">
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

                        {/* 2. PRIMARY CONTACT */}
                        <td className="p-3.5">
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

                        {/* 3. OWNER */}
                        <td className="p-3.5 text-xs font-medium text-slate-800">
                          {ownerName !== 'Unassigned' ? (
                            <span>{ownerName}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Unassigned</span>
                          )}
                        </td>

                        {/* 4. STATUS */}
                        <td className="p-3.5 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(customer.status)} select-none inline-block`}>
                            {customer.status || 'Active'}
                          </span>
                        </td>

                        {/* 5. ACTIONS */}
                        <td className="p-3.5 text-center pr-4 relative">
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
                                  <button 
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setCustomerToDelete(customer);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1.5 border-t border-slate-100 cursor-pointer"
                                  >
                                    <Trash2 size={12} /> Delete Customer
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

      {/* DELETE CONFIRMATION MODAL */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Delete Customer</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-bold text-[#0f172a]">{customerToDelete.customerName}</span> ({customerToDelete.customerCode || customerToDelete.id})? All associated customer data will be removed.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
