import React, { useState, useMemo, useEffect } from 'react';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Eye,
  AlertCircle,
  Inbox,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { HelpdeskTicket } from '../../../types';
import { TicketSummaryCards } from '../components/TicketSummaryCards';
import { CreateTicketModal } from '../components/CreateTicketModal';
import { TicketDetailsModal } from '../components/TicketDetailsModal';

export const HelpdeskPage: React.FC = () => {
  const {
    helpdeskTickets = [],
    refreshHelpdeskTickets,
  } = useApp() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleRefresh = async () => {
    if (refreshHelpdeskTickets) {
      setIsRefreshing(true);
      try {
        await refreshHelpdeskTickets();
        setToastMessage({ type: 'success', text: 'Helpdesk tickets refreshed successfully.' });
      } catch (e) {
        setToastMessage({ type: 'error', text: 'Failed to refresh tickets.' });
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let result = [...helpdeskTickets];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t =>
          (t.ticketNo && t.ticketNo.toLowerCase().includes(q)) ||
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          (t.assignedAgent && t.assignedAgent.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(t => t.status === statusFilter);
    }

    // 3. Priority Filter
    if (priorityFilter !== 'All') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // 4. Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(t => (t.category || 'General') === categoryFilter);
    }

    // 5. Sorting
    const priorityWeights: Record<string, number> = {
      Urgent: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (a.id || '').localeCompare(b.id || '');
        case 'priority':
          return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'ticketNo':
          return (a.ticketNo || '').localeCompare(b.ticketNo || '');
        case 'newest':
        default:
          return (b.id || '').localeCompare(a.id || '');
      }
    });

    return result;
  }, [helpdeskTickets, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy]);

  // Pagination calculation
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setSortBy('newest');
  };

  const getPriorityBadgeClass = (priority: HelpdeskTicket['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getStatusBadgeClass = (status: HelpdeskTicket['status']) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
      case 'Closed':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'Open':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-xs font-bold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-900/40">
              <Headphones size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Helpdesk &amp; Support Tickets
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track, manage, and resolve customer service requests, technical issues, and support SLA tickets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs hover:shadow-sm transition-all cursor-pointer"
            title="Refresh tickets data"
            aria-label="Refresh tickets data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            id="create-ticket-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus size={16} />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <TicketSummaryCards
        tickets={helpdeskTickets}
        activeStatusFilter={statusFilter}
        onFilterChange={(st) => setStatusFilter(st === statusFilter ? 'All' : st)}
      />

      {/* 3. Search & Filter Controls Toolbar */}
      <div className="bg-white dark:bg-[#0B0F19] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input
              id="ticket-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, subject, customer, or agent..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Status:</span>
              <select
                id="ticket-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Statuses ({helpdeskTickets.length})</option>
                <option value="Open">Open ({helpdeskTickets.filter(t => t.status === 'Open').length})</option>
                <option value="In Progress">In Progress ({helpdeskTickets.filter(t => t.status === 'In Progress').length})</option>
                <option value="Resolved">Resolved ({helpdeskTickets.filter(t => t.status === 'Resolved').length})</option>
                <option value="Closed">Closed ({helpdeskTickets.filter(t => t.status === 'Closed').length})</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Priority:</span>
              <select
                id="ticket-priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Sort:</span>
              <select
                id="ticket-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority (High to Low)</option>
                <option value="status">Status</option>
                <option value="ticketNo">Ticket ID</option>
              </select>
            </div>

            {(searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All') && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Ticket List Table Surface */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Ticket ID</th>
                <th className="py-3.5 px-4">Subject &amp; Category</th>
                <th className="py-3.5 px-4">Customer / Requester</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Assignee</th>
                <th className="py-3.5 px-4">Created / Updated</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                        <Inbox size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
                          ? 'No matching tickets found'
                          : 'No support tickets recorded yet'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 text-center">
                        {searchQuery || statusFilter !== 'All' || priorityFilter !== 'All'
                          ? 'Try adjusting your search criteria or resetting applied filters.'
                          : 'Create your first support ticket to track customer issues and SLA resolutions.'}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        {(searchQuery || statusFilter !== 'All' || priorityFilter !== 'All') ? (
                          <button
                            onClick={clearFilters}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Create First Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                    data-testid={`ticket-row-${ticket.id}`}
                  >
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {ticket.ticketNo}
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                        {ticket.subject}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {ticket.category || 'General'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {ticket.customerName}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                      {ticket.assignedAgent || 'Support Desk'}
                    </td>

                    {/* Created / Updated */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {ticket.createdAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getStatusBadgeClass(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200/60 dark:border-blue-900/40"
                        title="View & Edit Ticket Details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar */}
        {totalItems > 0 && (
          <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p className="text-[11px] font-medium text-slate-500">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalItems}</span> {totalItems === 1 ? 'ticket' : 'tickets'}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-bold px-2 py-0.5">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTicketCreated={(newTicket) => {
          setToastMessage({ type: 'success', text: `Ticket ${newTicket.ticketNo} created successfully!` });
        }}
      />

      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updated) => {
          setSelectedTicket(updated);
          setToastMessage({ type: 'success', text: `Ticket ${updated.ticketNo} updated.` });
        }}
      />
    </div>
  );
};
