import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { HelpdeskTicket } from '../../../types';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ListFilter,
  User,
  Building,
  Tag,
  MessageSquare,
  FileText,
  Send,
  Sparkles,
  Inbox
} from 'lucide-react';

export const HelpdeskPage: React.FC = () => {
  const {
    activeSubSection = 'my-tickets',
    setActiveSubSection,
    helpdeskTickets = [],
    addHelpdeskTicket,
    updateHelpdeskTicketStatus,
    userProfile,
    userRole
  } = useApp();

  // Tab State: 'my-tickets' (or 'queue') vs 'raise-ticket'
  const [currentTab, setCurrentTab] = useState<'my-tickets' | 'raise-ticket'>(() => {
    if (activeSubSection === 'raise-ticket') return 'raise-ticket';
    return 'my-tickets';
  });

  // Filter State: 'my-open' | 'all-system' | 'resolved'
  // GT104: Support 'all-system' filter seamlessly
  const [ticketFilter, setTicketFilter] = useState<'my-open' | 'all-system' | 'resolved'>(() => {
    if (activeSubSection === 'all-tickets') return 'all-system';
    return 'all-system';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);

  // Form State for Raise a Ticket
  const [subject, setSubject] = useState('');
  const [customerName, setCustomerName] = useState(userProfile?.name || 'Globex Corporation');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<HelpdeskTicket['priority']>('Medium');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState(userProfile?.email || 'customer@company.com');
  const [contactPhone, setContactPhone] = useState('+1 (555) 019-2834');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Sync tab with activeSubSection changes from routes / global search
  useEffect(() => {
    if (activeSubSection === 'raise-ticket') {
      setCurrentTab('raise-ticket');
    } else if (activeSubSection === 'all-tickets') {
      setCurrentTab('my-tickets');
      setTicketFilter('all-system');
    } else if (activeSubSection === 'queue' || activeSubSection === 'my-tickets') {
      setCurrentTab('my-tickets');
    }
  }, [activeSubSection]);

  const handleTabChange = (tab: 'my-tickets' | 'raise-ticket') => {
    setCurrentTab(tab);
    setSubmitSuccess(null);
    if (setActiveSubSection) {
      setActiveSubSection(tab);
    }
  };

  // Filter logic
  const filteredTickets = helpdeskTickets.filter((ticket) => {
    // 1. Tab filter
    if (ticketFilter === 'my-open') {
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') return false;
    } else if (ticketFilter === 'resolved') {
      if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') return false;
    }
    // 'all-system' shows all tickets! (Fixes GT104)

    // 2. Priority filter
    if (priorityFilter !== 'All' && ticket.priority !== priorityFilter) {
      return false;
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = ticket.ticketNo.toLowerCase().includes(q);
      const matchSubject = ticket.subject.toLowerCase().includes(q);
      const matchCustomer = ticket.customerName.toLowerCase().includes(q);
      const matchAgent = ticket.assignedAgent.toLowerCase().includes(q);
      if (!matchNo && !matchSubject && !matchCustomer && !matchAgent) {
        return false;
      }
    }

    return true;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newTck = addHelpdeskTicket({
        subject: subject.trim(),
        customerName: customerName.trim(),
        priority,
        status: 'Open',
        assignedAgent: 'Tier 1 Support',
        category,
        description: description.trim(),
        createdBy: userProfile?.name || 'Customer User',
        contactEmail,
        contactPhone
      });

      setIsSubmitting(false);
      setSubmitSuccess(`Ticket ${newTck.ticketNo} submitted successfully!`);
      setSubject('');
      setDescription('');
      
      // Auto-navigate to tickets queue after 800ms so user can verify their newly raised ticket
      setTimeout(() => {
        setCurrentTab('my-tickets');
        setTicketFilter('all-system');
        if (setActiveSubSection) setActiveSubSection('my-tickets');
        setSelectedTicket(newTck);
      }, 700);
    }, 400);
  };

  const getPriorityBadge = (p: HelpdeskTicket['priority']) => {
    switch (p) {
      case 'Urgent':
        return <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] rounded-md border border-rose-200 dark:border-rose-800">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] rounded-md border border-amber-200 dark:border-amber-800">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] rounded-md border border-blue-200 dark:border-blue-800">Medium</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px] rounded-md border border-slate-200 dark:border-slate-700">Low</span>;
    }
  };

  const getStatusBadge = (s: HelpdeskTicket['status']) => {
    switch (s) {
      case 'Open':
        return <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"><Clock size={12} /> Open</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-xs rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1"><Sparkles size={12} /> In Progress</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-extrabold text-xs rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-1"><CheckCircle2 size={12} /> Resolved</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700">Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-[#2563eb] rounded-lg">
              <Headphones size={18} />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2563eb] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900">
              Customer Support &amp; Helpdesk Portal
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Ticket Management &amp; Support Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit, monitor, and resolve customer service tickets with real-time SLA updates.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            id="tab-my-tickets"
            onClick={() => handleTabChange('my-tickets')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'my-tickets'
                ? 'bg-white dark:bg-slate-800 text-[#2563eb] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Inbox size={14} />
            <span>My Tickets &amp; Queue</span>
            <span className="ml-1 text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full">
              {helpdeskTickets.length}
            </span>
          </button>

          <button
            id="tab-raise-ticket"
            onClick={() => handleTabChange('raise-ticket')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'raise-ticket'
                ? 'bg-[#2563eb] text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus size={14} />
            <span>Raise a Ticket</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MY TICKETS & QUEUE */}
      {currentTab === 'my-tickets' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* GT104: All System Tickets & Sub-filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="filter-all-system-tickets"
                onClick={() => setTicketFilter('all-system')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  ticketFilter === 'all-system'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ListFilter size={13} />
                <span>All System Tickets</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                  {helpdeskTickets.length}
                </span>
              </button>

              <button
                id="filter-my-open-tickets"
                onClick={() => setTicketFilter('my-open')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  ticketFilter === 'my-open'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Clock size={13} />
                <span>Open Tickets</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                  {helpdeskTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length}
                </span>
              </button>

              <button
                id="filter-resolved-tickets"
                onClick={() => setTicketFilter('resolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  ticketFilter === 'resolved'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Resolved &amp; Closed</span>
              </button>
            </div>

            {/* Search & Priority Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tickets by keyword, ID..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <button
                onClick={() => handleTabChange('raise-ticket')}
                className="p-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow-sm transition-colors cursor-pointer md:hidden"
                title="Raise New Ticket"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Ticket Listing */}
          {filteredTickets.length === 0 ? (
            <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Inbox size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Tickets Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || priorityFilter !== 'All'
                  ? 'No tickets match your specific filters or search keywords. Try clearing search filters.'
                  : 'There are currently no tickets under this view. Click "Raise a Ticket" to submit your first issue.'}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {(searchQuery || priorityFilter !== 'All') && (
                  <button
                    onClick={() => { setSearchQuery(''); setPriorityFilter('All'); }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => handleTabChange('raise-ticket')}
                  className="px-4 py-1.5 text-xs font-bold bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  + Raise New Ticket
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`bg-white dark:bg-[#0B0F19] border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                    selectedTicket?.id === ticket.id
                      ? 'border-[#2563eb] ring-2 ring-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563eb] flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900">
                        {ticket.ticketNo.slice(-2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#2563eb]">
                            {ticket.ticketNo}
                          </span>
                          {getPriorityBadge(ticket.priority)}
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {ticket.createdAt}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Building size={13} className="text-slate-400" />
                            {ticket.customerName}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <User size={13} className="text-slate-400" />
                            {ticket.assignedAgent}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {getStatusBadge(ticket.status)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                        }}
                        className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        Inspect →
                      </button>
                    </div>
                  </div>

                  {ticket.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 line-clamp-2">
                      {ticket.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ticket Inspection Modal / Detail Drawer */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {selectedTicket.ticketNo}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      {selectedTicket.subject}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <div>
                      <span className="text-slate-400 block font-medium">Customer:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{selectedTicket.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Assigned Agent:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{selectedTicket.assignedAgent}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Priority:</span>
                      <div className="mt-0.5">{getPriorityBadge(selectedTicket.priority)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Current Status:</span>
                      <div className="mt-0.5">{getStatusBadge(selectedTicket.status)}</div>
                    </div>
                  </div>

                  {selectedTicket.description && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <span className="text-slate-400 block font-medium mb-1">Issue Description:</span>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                      Update Ticket Lifecycle
                    </label>
                    <div className="flex gap-2">
                      {(['Open', 'In Progress', 'Resolved', 'Closed'] as HelpdeskTicket['status'][]).map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            updateHelpdeskTicketStatus(selectedTicket.id, st);
                            setSelectedTicket(prev => prev ? { ...prev, status: st } : null);
                          }}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
                            selectedTicket.status === st
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: RAISE A TICKET */}
      {currentTab === 'raise-ticket' && (
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto">
          {/* Header with Prominent GT105 "My Tickets Queue" Switcher */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="text-[#2563eb]" size={20} />
                Create New Support Ticket
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Provide details of your inquiry or technical bug. Our response team will be assigned immediately.
              </p>
            </div>

            {/* GT105: "My Tickets Queue" option explicitly available on Raise a Ticket screen */}
            <button
              id="btn-my-tickets-queue"
              type="button"
              onClick={() => handleTabChange('my-tickets')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-[#2563eb] text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="View existing raised tickets in Queue"
            >
              <Inbox size={14} />
              <span>My Tickets Queue</span>
            </button>
          </div>

          {submitSuccess && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{submitSuccess} Returning to Queue...</span>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ticket Subject / Issue Summary <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Invoicing calculation mismatch on April statement"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Customer / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Support Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing & Invoicing">Billing &amp; Invoicing</option>
                  <option value="Account Access & Credentials">Account Access &amp; Credentials</option>
                  <option value="HRMS & Attendance Sync">HRMS &amp; Attendance Sync</option>
                  <option value="Feature Request">Feature Request</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as HelpdeskTicket['priority'])}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Low">Low (General Inquiry)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="High">High (Impacting Operations)</option>
                  <option value="Urgent">Urgent (System Blocker)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detailed Problem Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include steps to reproduce, error codes, and specific modules affected..."
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
              />
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleTabChange('my-tickets')}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Tickets Queue</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit &amp; Open Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
