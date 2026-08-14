import React, { useState, useMemo } from 'react';
import { CrmView, Customer } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR, getLeadScoreColor } from '../utils/crmUtils';
import { 
  Search, Filter, Plus, MoreVertical, Edit2, Archive, Phone, Mail, 
  ChevronLeft, ChevronRight, User, Building2, AlertCircle, Calendar
} from 'lucide-react';

interface CrmCustomersListProps {
  onViewChange: (view: CrmView) => void;
  onCustomerSelect?: (id: string) => void;
}

export const CrmCustomersList: React.FC<CrmCustomersListProps> = ({ onViewChange, onCustomerSelect }) => {
  const { customers, updateCustomer } = useApp();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'At Risk' | 'Inactive'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

  // Filter out archived
  const activeCustomers = useMemo(() => customers.filter(c => c.status !== 'Archived'), [customers]);

  // Derived counts
  const counts = useMemo(() => ({
    All: activeCustomers.length,
    Active: activeCustomers.filter(c => c.status === 'Active').length,
    'At Risk': activeCustomers.filter(c => c.status === 'At Risk').length,
    Inactive: activeCustomers.filter(c => c.status === 'Inactive').length,
  }), [activeCustomers]);

  // Filtered and Searched list
  const filteredCustomers = useMemo(() => {
    return activeCustomers.filter(c => {
      // Tab filter
      if (activeTab !== 'All' && c.status !== activeTab) return false;
      
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          c.customerName?.toLowerCase().includes(term) ||
          c.customerCode?.toLowerCase().includes(term) ||
          c.primaryContact?.name?.toLowerCase().includes(term) ||
          c.primaryContact?.email?.toLowerCase().includes(term) ||
          c.primaryContact?.phone?.includes(term)
        );
      }
      return true;
    });
  }, [activeCustomers, activeTab, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCustomers(new Set(paginatedCustomers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedCustomers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCustomers(newSet);
  };

  const handleArchive = (id: string) => {
    if (window.confirm("Archive Customer?\nThis customer will be removed from active customer views.")) {
      updateCustomer(id, { status: 'Archived' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'At Risk': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a]">Customers</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage established customer relationships, accounts and contacts.</p>
        </div>
        <button onClick={() => onViewChange('add-customer')} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        
        {/* TABS & ACTIONS ROW */}
        <div className="border-b border-slate-200 p-4 sm:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex overflow-x-auto no-scrollbar sm:px-4">
              {(['All', 'Active', 'At Risk', 'Inactive'] as const).map(tab => (
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
                    activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 sm:pr-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                />
              </div>
              <button className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center justify-center">
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="flex-1 overflow-auto">
          {paginatedCustomers.length > 0 ? (
            <div className="min-w-[1000px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedCustomers.size > 0 && selectedCustomers.size === paginatedCustomers.length} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /></th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Primary Contact</th>
                    <th className="p-4 font-semibold">Owner</th>
                    <th className="p-4 font-semibold text-right">Customer Value</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4"><input type="checkbox" checked={selectedCustomers.has(customer.id)} onChange={() => handleSelectOne(customer.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /></td>
                      <td className="p-4">
                        <div 
                          className="font-bold text-[#0f172a] cursor-pointer hover:text-indigo-600"
                          onClick={() => onCustomerSelect && onCustomerSelect(customer.id)}
                        >
                          {customer.customerName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{customer.customerCode || '—'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[#0f172a] flex items-center">
                          <User size={12} className="mr-1.5 text-slate-400" />
                          {customer.primaryContact?.name || '—'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center mt-0.5">
                          <Mail size={12} className="mr-1.5 text-slate-400" />
                          {customer.primaryContact?.email || '—'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                            {customer.ownerId?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-slate-700">{customer.ownerId || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bold text-[#0f172a]">
                          {formatINR(customer.creditLimit || 0)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Limit</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(customer.status)}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center relative group/menu">
                          <button className="p-1.5 text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical size={16} />
                          </button>
                          {/* Dropdown Menu (Hover based for simplicity in list) */}
                          <div className="absolute right-6 top-0 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover/menu:block z-20">
                            <button onClick={() => onCustomerSelect && onCustomerSelect(customer.id)} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">View Details</button>
                            <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">Edit Customer</button>
                            <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium">Add Activity</button>
                            <div className="h-px bg-slate-200 my-1"></div>
                            <button onClick={() => handleArchive(customer.id)} className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium">Archive</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                {searchTerm ? <Search className="text-slate-400" size={24} /> : <Building2 className="text-slate-400" size={24} />}
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                {searchTerm ? 'Try changing your search or filters to find what you are looking for.' : 'Add your first established customer account to start managing your business relationships.'}
              </p>
              {searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50">
                  Clear Filters
                </button>
              ) : (
                <button onClick={() => onViewChange('add-customer')} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-500 flex items-center">
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
              <span>Showing <span className="font-bold text-[#0f172a]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-bold text-[#0f172a]">{filteredCustomers.length}</span></span>
              <span className="mx-4 h-4 w-px bg-slate-300 hidden sm:block"></span>
              <div className="hidden sm:flex items-center">
                <span className="mr-2">Rows per page:</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-300 rounded p-1 text-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white">
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
