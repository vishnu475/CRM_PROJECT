import React, { useState, useMemo } from 'react';
import { CrmView, Lead } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR, getLeadScoreColor } from '../utils/crmUtils';
import { 
  Plus, Search, Filter, MoreVertical, ChevronLeft, ChevronRight, 
  CheckCircle2, AlertCircle, Building2, User, Phone, Mail, Calendar
} from 'lucide-react';

interface CrmLeadsListProps {
  onViewChange: (view: CrmView) => void;
  onLeadSelect?: (id: string) => void;
}

export const CrmLeadsList: React.FC<CrmLeadsListProps> = ({ onViewChange, onLeadSelect }) => {
  const { leads, updateLead } = useApp();
  
  // Filtering and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageTab, setActiveStageTab] = useState<string>('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Selection State
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  
  // Archive Modal State
  const [leadToArchive, setLeadToArchive] = useState<string | null>(null);

  // Derive Active Leads
  const activeLeads = useMemo(() => leads.filter(l => l.status !== 'archived'), [leads]);

  // Derive Stage Counts for Tabs
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: activeLeads.length };
    const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    stages.forEach(s => counts[s] = 0);
    activeLeads.forEach(l => {
      if (counts[l.stage] !== undefined) counts[l.stage]++;
    });
    return counts;
  }, [activeLeads]);

  // Apply Search, Filter, Sort
  const filteredLeads = useMemo(() => {
    let result = activeLeads;
    
    // 1. Stage Tab Filter
    if (activeStageTab !== 'All') {
      result = result.filter(l => l.stage === activeStageTab);
    }
    
    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q)
      );
    }

    // 3. Sort (Default by creation date descending)
    // Note: Since mock doesn't have real dates, we'll sort by ID assuming higher ID = newer
    result = [...result].sort((a, b) => b.id.localeCompare(a.id));

    return result;
  }, [activeLeads, activeStageTab, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  // Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeads(new Set(paginatedLeads.map(l => l.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeads(newSet);
  };

  const handleArchive = () => {
    if (leadToArchive) {
      updateLead(leadToArchive, { status: 'archived' });
      setLeadToArchive(null);
      setSelectedLeads(prev => {
        const next = new Set(prev);
        next.delete(leadToArchive);
        return next;
      });
    }
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-indigo-100 text-indigo-700';
      case 'Qualified': return 'bg-violet-100 text-violet-700';
      case 'Proposal': return 'bg-amber-100 text-amber-700';
      case 'Negotiation': return 'bg-orange-100 text-orange-700';
      case 'Won': return 'bg-emerald-100 text-emerald-700';
      case 'Lost': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
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

      {/* STAGE TABS */}
      <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-hide space-x-2">
        {['All', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(stage => (
          <button
            key={stage}
            onClick={() => { setActiveStageTab(stage); setCurrentPage(1); }}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${activeStageTab === stage ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {stage}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeStageTab === stage ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
              {stageCounts[stage] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {selectedLeads.size > 0 ? (
          <div className="flex items-center gap-4 w-full sm:w-auto bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm animate-in fade-in duration-200">
            <span>{selectedLeads.size} selected</span>
            <div className="h-4 w-px bg-indigo-200"></div>
            <button className="hover:text-indigo-900 transition-colors">Assign</button>
            <button className="hover:text-indigo-900 transition-colors">Export</button>
          </div>
        ) : (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
            />
          </div>
        )}

        <button className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-[#0f172a] font-semibold text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* DATA TABLE (Desktop) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-b-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={paginatedLeads.length > 0 && selectedLeads.size === paginatedLeads.length} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /></th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Value</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4"><input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => handleSelectOne(lead.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /></td>
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
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStageBadgeColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
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
                    <User size={14} className="mr-2 text-slate-400" />
                    {lead.assignedTo}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setLeadToArchive(lead.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={16} />
                  </button>
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
                    <p className="text-slate-500 text-sm">Try adjusting your search or stage filters.</p>
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStageBadgeColor(lead.stage)}`}>
                {lead.stage}
              </span>
              <span className="text-sm font-bold text-slate-700">{formatINR(lead.value)}</span>
            </div>
            
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center"><User size={12} className="mr-1" /> {lead.assignedTo}</div>
              <div className="flex items-center"><Mail size={12} className="mr-1" /> Email</div>
            </div>
          </div>
        ))}
        {paginatedLeads.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">No leads found.</div>
        )}
      </div>

      {/* PAGINATION */}
      {filteredLeads.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-2 gap-4">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-[#0f172a]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-bold text-[#0f172a]">{filteredLeads.length}</span> leads
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-[#0f172a] px-3 border border-slate-200 rounded-md py-1">{currentPage}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
