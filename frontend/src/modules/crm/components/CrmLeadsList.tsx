import React, { useState, useMemo } from 'react';
import { CrmView, Lead } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR, getLeadScoreColor, getLeadStageColor } from '../utils/crmUtils';
import { 
  Plus, Search, Filter, MoreVertical, ChevronLeft, ChevronRight, 
  Building2, User, Mail, X, RotateCcw, ArrowRight, FileText
} from 'lucide-react';
import { ConvertLeadModal } from './ConvertLeadModal';

interface CrmLeadsListProps {
  onViewChange: (view: CrmView) => void;
  onLeadSelect?: (id: string) => void;
}

export const LEAD_STAGE_TABS = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'] as const;
export type LeadStageTab = typeof LEAD_STAGE_TABS[number];

export const CrmLeadsList: React.FC<CrmLeadsListProps> = ({ onViewChange, onLeadSelect }) => {
  const { leads, employees, updateLead, quotations, setActiveModule } = useApp();

  const getQuotationStatusBadge = (status?: string) => {
    switch (status) {
      case 'Accepted':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Revision Requested':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Revised':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLeadQuotationInfo = (lead: Lead) => {
    const qMatch = quotations.find(q => q.leadId === lead.id || (q.customerId && q.customerId === lead.id));
    if (qMatch) {
      return {
        id: qMatch.id,
        quoteNumber: qMatch.quoteNumber,
        status: qMatch.status,
        amount: qMatch.amount,
        revisionNumber: qMatch.revisionNumber || 1,
        sentDate: qMatch.sentDate || null,
      };
    }
    if (lead.latestQuotationNumber) {
      return {
        id: lead.latestQuotationId,
        quoteNumber: lead.latestQuotationNumber,
        status: lead.latestQuotationStatus,
        amount: lead.latestQuotationAmount,
        revisionNumber: lead.latestQuotationRevision || 1,
        sentDate: lead.latestQuotationSentDate || null,
      };
    }
    return null;
  };

  const getLeadOwnerDisplay = (lead: Lead) => {
    const emp = employees.find(e =>
      (lead.assignedToEmployeeId && (e.id === lead.assignedToEmployeeId || e.empCode === lead.assignedToEmployeeId)) ||
      (lead.assignedTo && e.name.toLowerCase() === lead.assignedTo.toLowerCase())
    );
    return emp ? `${emp.name} (${emp.empCode || emp.id})` : (lead.assignedTo || 'Unassigned');
  };
  
  // Filtering and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageTab, setActiveStageTab] = useState<LeadStageTab>('New');
  const [stageFilter, setStageFilter] = useState<string>('Default');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [minValueFilter, setMinValueFilter] = useState('');
  const [maxValueFilter, setMaxValueFilter] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Archive & Convert Modal State
  const [leadToArchive, setLeadToArchive] = useState<string | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  // Derive Active Leads (exclude archived)
  const activeLeads = useMemo(() => leads.filter(l => l.status !== 'archived'), [leads]);

  // Derive Unique Sources from current active leads
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    activeLeads.forEach(l => {
      const s = (l.source || '').trim();
      if (s) sources.add(s);
    });
    return Array.from(sources).sort((a, b) => a.localeCompare(b));
  }, [activeLeads]);

  // Derive Unique Owners from current active leads & employees
  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    activeLeads.forEach(l => {
      const owner = getLeadOwnerDisplay(l);
      if (owner && owner !== 'Unassigned') owners.add(owner);
    });
    return Array.from(owners).sort((a, b) => a.localeCompare(b));
  }, [activeLeads, employees]);

  // Derive Stage Counts for the 5 Tabs (case-insensitive & trimmed)
  const stageCounts = useMemo(() => {
    const counts: Record<LeadStageTab, number> = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Won: 0,
      Lost: 0,
    };
    activeLeads.forEach(l => {
      const rawStage = (l.stage || 'New').trim();
      const matched = LEAD_STAGE_TABS.find(s => s.toLowerCase() === rawStage.toLowerCase());
      if (matched) {
        counts[matched] = (counts[matched] || 0) + 1;
      }
    });
    return counts;
  }, [activeLeads]);

  // Derive count of active leads currently in other lifecycle stages (Proposal, Negotiation)
  const opportunityPipelineLeadsCount = useMemo(() => {
    return activeLeads.filter(l => {
      const stageLower = (l.stage || '').toLowerCase().trim();
      return stageLower === 'proposal' || stageLower === 'negotiation';
    }).length;
  }, [activeLeads]);

  // Active filter count (excluding stage tab and search bar)
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (stageFilter !== 'Default') count++;
    if (sourceFilter !== 'All') count++;
    if (ownerFilter !== 'All') count++;
    if (scoreFilter !== 'All') count++;
    if (minValueFilter.trim() !== '') count++;
    if (maxValueFilter.trim() !== '') count++;
    return count;
  }, [stageFilter, sourceFilter, ownerFilter, scoreFilter, minValueFilter, maxValueFilter]);

  const hasAnyFilterActive = useMemo(() => {
    return activeStageTab !== 'New' || 
      stageFilter !== 'Default' ||
      searchQuery.trim() !== '' || 
      activeAdvancedFilterCount > 0;
  }, [activeStageTab, stageFilter, searchQuery, activeAdvancedFilterCount]);

  // Reset / Clear all filters
  const handleClearAllFilters = () => {
    setActiveStageTab('New');
    setStageFilter('Default');
    setSearchQuery('');
    setSourceFilter('All');
    setOwnerFilter('All');
    setScoreFilter('All');
    setMinValueFilter('');
    setMaxValueFilter('');
    setCurrentPage(1);
  };

  // Apply Search, Filter, Sort
  const filteredLeads = useMemo(() => {
    let result = activeLeads;
    
    // 1. Stage Tab Filter or Advanced Stage Filter (case-insensitive & whitespace-trimmed)
    if (stageFilter !== 'Default') {
      if (stageFilter !== 'All') {
        const targetLower = stageFilter.toLowerCase().trim();
        result = result.filter(l => {
          const stageLower = (l.stage || 'New').toLowerCase().trim();
          return stageLower === targetLower;
        });
      }
      // If stageFilter === 'All', do not restrict by stage (shows all leads)
    } else if (activeStageTab) {
      const targetLower = activeStageTab.toLowerCase().trim();
      result = result.filter(l => {
        const stageLower = (l.stage || 'New').toLowerCase().trim();
        return stageLower === targetLower;
      });
    }

    // 2. Lead Source Filter
    if (sourceFilter !== 'All') {
      const targetSourceLower = sourceFilter.toLowerCase().trim();
      result = result.filter(l => {
        const sourceLower = (l.source || '').toLowerCase().trim();
        return sourceLower === targetSourceLower;
      });
    }

    // 3. Lead Owner Filter
    if (ownerFilter !== 'All') {
      result = result.filter(l => {
        const ownerDisplay = getLeadOwnerDisplay(l);
        return ownerDisplay === ownerFilter;
      });
    }

    // 4. Lead Score Filter
    if (scoreFilter !== 'All') {
      result = result.filter(l => {
        const score = typeof l.score === 'number' ? l.score : parseInt(l.score as any, 10) || 0;
        if (scoreFilter === 'High') return score > 70;
        if (scoreFilter === 'Medium') return score >= 31 && score <= 70;
        if (scoreFilter === 'Low') return score <= 30;
        return true;
      });
    }

    // 5. Deal Value Range Filter
    const minVal = parseFloat(minValueFilter);
    if (!isNaN(minVal)) {
      result = result.filter(l => (parseFloat(l.value as any) || 0) >= minVal);
    }
    const maxVal = parseFloat(maxValueFilter);
    if (!isNaN(maxVal)) {
      result = result.filter(l => (parseFloat(l.value as any) || 0) <= maxVal);
    }
    
    // 6. Search Query (multi-field, null-safe, case-insensitive, trimmed)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(l => {
        const name = (l.name || '').toLowerCase();
        const company = (l.company || '').toLowerCase();
        const email = (l.email || '').toLowerCase();
        const phone = (l.phone || '').toString().toLowerCase();
        const contactPerson = (l.contactPerson || '').toLowerCase();
        const source = (l.source || '').toLowerCase();
        const assignedTo = (l.assignedTo || '').toLowerCase();
        const ownerName = getLeadOwnerDisplay(l).toLowerCase();
        const requirement = (l.requirement || '').toLowerCase();

        return (
          name.includes(q) ||
          company.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          contactPerson.includes(q) ||
          source.includes(q) ||
          assignedTo.includes(q) ||
          ownerName.includes(q) ||
          requirement.includes(q)
        );
      });
    }

    // 7. Sort (Default by ID descending)
    result = [...result].sort((a, b) => (b.id || '').localeCompare(a.id || ''));

    return result;
  }, [
    activeLeads, 
    activeStageTab, 
    sourceFilter, 
    ownerFilter, 
    scoreFilter, 
    minValueFilter, 
    maxValueFilter, 
    searchQuery, 
    employees
  ]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLeads = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, safeCurrentPage, itemsPerPage]);

  const handleArchive = () => {
    if (leadToArchive) {
      updateLead(leadToArchive, { status: 'archived' });
      setLeadToArchive(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* ARCHIVE MODAL */}
      {leadToArchive && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#0f172a] mb-2">Archive Lead?</h3>
            <p className="text-sm text-slate-500 mb-6">This lead will be removed from active CRM views but not permanently deleted.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setLeadToArchive(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleArchive} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium cursor-pointer" onClick={() => onViewChange('overview')}>
            <span className="hover:text-indigo-600 transition-colors">CRM</span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a]">Leads</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, qualify and track potential customers.</p>
        </div>
        <button onClick={() => onViewChange('add-lead')} className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* STAGE TABS: Five Required Tabs: New, Contacted, Qualified, Won, Lost */}
      <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-hide space-x-2" role="tablist" aria-label="Lead Stage Navigation">
        {LEAD_STAGE_TABS.map(stage => {
          const isActive = activeStageTab === stage && stageFilter === 'Default';
          return (
            <button
              key={stage}
              id={`lead-stage-tab-${stage.toLowerCase()}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => { 
                setActiveStageTab(stage); 
                setStageFilter('Default');
                setCurrentPage(1); 
              }}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                isActive 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {stage}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {stageCounts[stage] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Opportunity Stage Context / Accessibility Banner */}
      {stageFilter !== 'Default' && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-2.5 mb-3 flex items-center justify-between text-xs text-indigo-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filter View:</span>
            <span>
              {stageFilter === 'All' 
                ? `Showing all ${filteredLeads.length} leads across all stages (including Proposal & Negotiation).` 
                : `Showing leads in stage "${stageFilter}".`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setStageFilter('Default'); setCurrentPage(1); }}
            className="text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer text-xs"
          >
            Return to {activeStageTab} tab
          </button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            id="lead-search-input"
            type="text" 
            placeholder="Search leads by name, company, email..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
          />
          {searchQuery && (
            <button
              id="btn-clear-lead-search"
              type="button"
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {hasAnyFilterActive && (
            <button
              id="btn-clear-lead-filters-toolbar"
              type="button"
              onClick={handleClearAllFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset all active filters"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          )}

          <button 
            id="btn-lead-filters-toggle"
            type="button"
            onClick={() => setIsFilterPanelOpen(prev => !prev)}
            className={`w-full sm:w-auto px-4 py-2 border font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              isFilterPanelOpen || activeAdvancedFilterCount > 0
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                : 'bg-white border-slate-200 text-[#0f172a] hover:bg-slate-50'
            }`}
          >
            <Filter size={16} /> 
            <span>Filters</span>
            {activeAdvancedFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-indigo-600 text-white font-bold leading-none">
                {activeAdvancedFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* EXPANDABLE FILTER PANEL */}
      {isFilterPanelOpen && (
        <div 
          id="lead-advanced-filters-panel"
          className="bg-slate-50/90 border-x border-b border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs animate-in slide-in-from-top-2 duration-150"
        >
          {/* Stage Filter */}
          <div>
            <label htmlFor="lead-stage-filter" className="font-semibold text-slate-600 block mb-1">Stage</label>
            <select
              id="lead-stage-filter"
              value={stageFilter}
              onChange={(e) => { 
                const val = e.target.value;
                setStageFilter(val);
                if (LEAD_STAGE_TABS.includes(val as any)) {
                  setActiveStageTab(val as LeadStageTab);
                  setStageFilter('Default');
                }
                setCurrentPage(1); 
              }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Default">Active Tab ({activeStageTab})</option>
              <option value="All">All Leads (All Stages)</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Proposal">Proposal (Opportunity)</option>
              <option value="Negotiation">Negotiation (Opportunity)</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label htmlFor="lead-source-filter" className="font-semibold text-slate-600 block mb-1">Source</label>
            <select
              id="lead-source-filter"
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Sources</option>
              {uniqueSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Owner Filter */}
          <div>
            <label htmlFor="lead-owner-filter" className="font-semibold text-slate-600 block mb-1">Owner</label>
            <select
              id="lead-owner-filter"
              value={ownerFilter}
              onChange={(e) => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Owners</option>
              {uniqueOwners.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Lead Score Filter */}
          <div>
            <label htmlFor="lead-score-filter" className="font-semibold text-slate-600 block mb-1">Lead Score</label>
            <select
              id="lead-score-filter"
              value={scoreFilter}
              onChange={(e) => { setScoreFilter(e.target.value); setCurrentPage(1); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Scores</option>
              <option value="High">High (71 - 100)</option>
              <option value="Medium">Medium (31 - 70)</option>
              <option value="Low">Low (0 - 30)</option>
            </select>
          </div>

          {/* Min Value */}
          <div>
            <label htmlFor="lead-min-value-filter" className="font-semibold text-slate-600 block mb-1">Min Value (₹)</label>
            <input
              id="lead-min-value-filter"
              type="number"
              placeholder="Min amount"
              value={minValueFilter}
              onChange={(e) => { setMinValueFilter(e.target.value); setCurrentPage(1); }}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Max Value & Reset */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="lead-max-value-filter" className="font-semibold text-slate-600 block mb-1">Max Value (₹)</label>
              <input
                id="lead-max-value-filter"
                type="number"
                placeholder="Max amount"
                value={maxValueFilter}
                onChange={(e) => { setMaxValueFilter(e.target.value); setCurrentPage(1); }}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            {activeAdvancedFilterCount > 0 && (
              <button
                id="btn-clear-lead-filters"
                type="button"
                onClick={handleClearAllFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer"
                title="Reset filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* DATA TABLE (Desktop) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-b-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotation & Sales</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Value</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4">
                  <div 
                    className="font-semibold text-[#0f172a] cursor-pointer hover:text-indigo-600"
                    onClick={() => onLeadSelect && onLeadSelect(lead.id)}
                  >
                    {lead.name}
                  </div>
                  <div className="text-xs text-slate-500">{lead.email}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Building2 size={14} className="mr-2 text-slate-400" />
                    {lead.company}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getLeadStageColor(lead.stage)}`}
                  >
                    {lead.stage || 'New'}
                  </span>
                </td>
                <td className="p-4">
                  {(() => {
                    const quoteInfo = getLeadQuotationInfo(lead);
                    if (quoteInfo) {
                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-slate-800">{quoteInfo.quoteNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getQuotationStatusBadge(quoteInfo.status)}`}>
                              {quoteInfo.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>Rev #{quoteInfo.revisionNumber}</span>
                            {quoteInfo.sentDate && <span>• Sent {quoteInfo.sentDate}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModule('sales');
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1 mt-1 cursor-pointer w-fit"
                          >
                            <span>Open in Sales</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      );
                    }
                    if (['Qualified', 'Proposal', 'Negotiation'].includes(lead.stage)) {
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-400 italic">No Quotation Yet</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModule('sales');
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-semibold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer w-fit"
                            title="Create quotation in Sales module"
                          >
                            <Plus size={12} />
                            <span>Create Quote</span>
                          </button>
                        </div>
                      );
                    }
                    if (lead.stage === 'Won') {
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                            Deal Won
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModule('sales');
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer mt-0.5 w-fit"
                          >
                            <span>Sales Orders</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      );
                    }
                    if (lead.stage === 'Lost') {
                      return (
                        <span className="text-[11px] text-rose-600 font-medium truncate max-w-[140px] block" title={lead.lostReason}>
                          {lead.lostReason || 'Closed Lost'}
                        </span>
                      );
                    }
                    return <span className="text-[11px] text-slate-400 italic">Lead in progress</span>;
                  })()}
                </td>
                <td className="p-4">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${getLeadScoreColor(lead.score)}`}>
                    {lead.score}
                  </div>
                </td>
                <td className="p-4 text-sm font-semibold text-slate-700 text-right">
                  {formatINR(lead.value)}
                </td>
                <td className="p-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <User size={14} className="mr-2 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px]" title={getLeadOwnerDisplay(lead)}>
                      {getLeadOwnerDisplay(lead)}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button 
                      onClick={() => setLeadToArchive(lead.id)} 
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Archive Lead"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedLeads.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Search size={24} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0f172a] mb-1">No leads found</h3>
                    <p className="text-slate-500 text-sm mb-4">
                      {hasAnyFilterActive 
                        ? 'No leads match your active filters or search query.' 
                        : 'There are no active leads available.'}
                    </p>
                    {hasAnyFilterActive && (
                      <button
                        id="btn-reset-empty-leads"
                        type="button"
                        onClick={handleClearAllFilters}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw size={14} /> Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST (Visible on < lg) */}
      <div className="lg:hidden bg-white border border-slate-200 rounded-b-xl divide-y divide-slate-100">
        {paginatedLeads.map(lead => (
          <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div 
                  className="font-bold text-[#0f172a] cursor-pointer hover:text-indigo-600"
                  onClick={() => onLeadSelect && onLeadSelect(lead.id)}
                >
                  {lead.name}
                </div>
                <div className="text-sm text-slate-500">{lead.company}</div>
              </div>
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${getLeadScoreColor(lead.score)}`}>
                {lead.score}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getLeadStageColor(lead.stage)}`}
              >
                {lead.stage || 'New'}
              </span>
              <span className="text-sm font-bold text-slate-700">{formatINR(lead.value)}</span>
            </div>

            {/* Mobile Quotation / Action Info */}
            <div className="mt-3 pt-2.5 border-t border-slate-100/80">
              {(() => {
                const quoteInfo = getLeadQuotationInfo(lead);
                if (quoteInfo) {
                  return (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{quoteInfo.quoteNumber}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${getQuotationStatusBadge(quoteInfo.status)}`}>
                          {quoteInfo.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModule('sales');
                        }}
                        className="text-blue-600 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>Sales</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  );
                }
                if (['Qualified', 'Proposal', 'Negotiation'].includes(lead.stage)) {
                  return (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 italic text-[11px]">No quote yet</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModule('sales');
                        }}
                        className="px-2 py-1 bg-blue-50 text-blue-700 font-semibold rounded text-[11px] border border-blue-200"
                      >
                        + Create Quote
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center"><User size={12} className="mr-1" /> {getLeadOwnerDisplay(lead)}</div>
              <div className="flex items-center"><Mail size={12} className="mr-1" /> Email</div>
            </div>
          </div>
        ))}
        {paginatedLeads.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                <Search size={20} className="text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-[#0f172a] mb-1">No leads found</h3>
              <p className="text-slate-500 text-xs mb-3">
                {hasAnyFilterActive ? 'No leads match your active filters.' : 'There are no active leads.'}
              </p>
              {hasAnyFilterActive && (
                <button
                  id="btn-reset-empty-leads-mobile"
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={12} /> Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {filteredLeads.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-2 gap-4">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-[#0f172a]">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(safeCurrentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-bold text-[#0f172a]">{filteredLeads.length}</span> leads
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-[#0f172a] px-3 border border-slate-200 rounded-md py-1">{safeCurrentPage}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CONVERT LEAD MODAL */}
      <ConvertLeadModal
        isOpen={!!leadToConvert}
        lead={leadToConvert}
        onClose={() => setLeadToConvert(null)}
      />

    </div>
  );
};
