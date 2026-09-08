import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { CrmView, Opportunity } from '../../../types';
import { formatINR } from '../utils/crmUtils';
import { 
  Plus, TrendingUp, Building2, Calendar, User, Search, Filter,
  ChevronRight, ChevronLeft, MoreVertical, Edit2, CheckCircle2,
  DollarSign, ArrowUpDown, X, Kanban
} from 'lucide-react';

interface CrmOpportunitiesProps {
  onViewChange?: (view: CrmView) => void;
  onOpportunitySelect?: (id: string) => void;
  onCustomerSelect?: (id: string) => void;
}

const STAGES: { id: Opportunity['stage']; label: string; badgeBg: string }[] = [
  { id: 'New', label: 'New', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Qualified', label: 'Qualified', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Proposal', label: 'Proposal', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'Negotiation', label: 'Negotiation', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Won', label: 'Won', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Lost', label: 'Lost', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const CrmOpportunities: React.FC<CrmOpportunitiesProps> = ({ 
  onViewChange, 
  onOpportunitySelect,
  onCustomerSelect
}) => {
  const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity, customers } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | Opportunity['stage']>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters state
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterMinValue, setFilterMinValue] = useState('');
  const [filterMaxValue, setFilterMaxValue] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedOpps, setSelectedOpps] = useState<Set<string>>(new Set());

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formValue, setFormValue] = useState('250000');
  const [formProbability, setFormProbability] = useState('60');
  const [formExpectedClose, setFormExpectedClose] = useState('');
  const [formStage, setFormStage] = useState<Opportunity['stage']>('Qualified');
  const [formOwner, setFormOwner] = useState('Sarah Jenkins');

  // Owners list for filter
  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    opportunities.forEach(o => { if (o.owner) owners.add(o.owner); });
    return Array.from(owners);
  }, [opportunities]);

  // Stage counts for tabs
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: opportunities.length,
      New: 0,
      Qualified: 0,
      Proposal: 0,
      Negotiation: 0,
      Won: 0,
      Lost: 0,
    };
    opportunities.forEach(o => {
      if (counts[o.stage] !== undefined) {
        counts[o.stage] += 1;
      }
    });
    return counts;
  }, [opportunities]);

  // Summary Metrics calculations (from real data)
  const metrics = useMemo(() => {
    const openOpps = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
    const openCount = openOpps.length;
    const pipelineValue = openOpps.reduce((sum, o) => sum + (parseFloat(o.value as any) || 0), 0);
    const weightedPipeline = openOpps.reduce((sum, o) => {
      const val = parseFloat(o.value as any) || 0;
      const prob = (parseFloat(o.probability as any) || 50) / 100;
      return sum + (val * prob);
    }, 0);
    const wonOpps = opportunities.filter(o => o.stage === 'Won');
    const wonValue = wonOpps.reduce((sum, o) => sum + (parseFloat(o.value as any) || 0), 0);

    return {
      openCount,
      pipelineValue,
      weightedPipeline,
      wonValue,
    };
  }, [opportunities]);

  // Filtered list
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(o => {
      // Tab filter
      if (activeTab !== 'All' && o.stage !== activeTab) return false;

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = (o.name || '').toLowerCase().includes(term);
        const matchesCustomer = (o.customerName || '').toLowerCase().includes(term);
        const matchesOwner = (o.owner || '').toLowerCase().includes(term);
        if (!matchesName && !matchesCustomer && !matchesOwner) return false;
      }

      // Advanced filters
      if (filterOwner !== 'All' && o.owner !== filterOwner) return false;
      if (filterCustomer !== 'All' && o.customerId !== filterCustomer && o.customerName !== filterCustomer) return false;
      if (filterMinValue && (o.value || 0) < parseFloat(filterMinValue)) return false;
      if (filterMaxValue && (o.value || 0) > parseFloat(filterMaxValue)) return false;

      return true;
    });
  }, [opportunities, activeTab, searchTerm, filterOwner, filterCustomer, filterMinValue, filterMaxValue]);

  // Pagination
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const paginatedOpportunities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOpportunities.slice(start, start + itemsPerPage);
  }, [filteredOpportunities, currentPage, itemsPerPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOpps(new Set(paginatedOpportunities.map(o => o.id)));
    } else {
      setSelectedOpps(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedOpps);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedOpps(newSet);
  };

  const handleOpenAddModal = () => {
    setEditingOpp(null);
    setFormName('');
    setFormCustomerId(customers[0]?.id || '');
    setFormValue('250000');
    setFormProbability('60');
    setFormExpectedClose(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setFormStage('Qualified');
    setFormOwner('Sarah Jenkins');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setFormName(opp.name);
    setFormCustomerId(opp.customerId);
    setFormValue(opp.value?.toString() || '0');
    setFormProbability(opp.probability?.toString() || '50');
    setFormExpectedClose(opp.expectedClose || '');
    setFormStage(opp.stage);
    setFormOwner(opp.owner || '');
    setShowAddModal(true);
  };

  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const matchedCustomer = customers.find(c => c.id === formCustomerId) || customers[0];
    const customerName = matchedCustomer ? matchedCustomer.customerName : 'Direct Account';

    if (editingOpp) {
      await updateOpportunity(editingOpp.id, {
        name: formName,
        customerId: formCustomerId || editingOpp.customerId,
        customerName: customerName,
        value: parseFloat(formValue) || 0,
        probability: parseInt(formProbability, 10) || 50,
        expectedClose: formExpectedClose,
        stage: formStage,
        owner: formOwner,
      });
    } else {
      const newOppData: Omit<Opportunity, 'id'> = {
        name: formName,
        customerId: formCustomerId || matchedCustomer?.id || 'CUST-001',
        customerName: customerName,
        value: parseFloat(formValue) || 100000,
        stage: formStage,
        probability: parseInt(formProbability, 10) || 50,
        expectedClose: formExpectedClose || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        owner: formOwner || 'Sarah Jenkins',
      };
      await addOpportunity(newOppData);
    }

    setShowAddModal(false);
  };

  const handleDeleteOpp = async (id: string) => {
    if (window.confirm('Delete Opportunity?\nThis action cannot be undone.')) {
      if (deleteOpportunity) {
        await deleteOpportunity(id);
      }
    }
  };

  const handleViewDetails = (id: string) => {
    if (onOpportunitySelect) {
      onOpportunitySelect(id);
    } else if (onViewChange) {
      onViewChange('opportunity-details');
    }
  };

  const getStageBadge = (stage: Opportunity['stage']) => {
    switch (stage) {
      case 'New': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Qualified': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Proposal': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Negotiation': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Won': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Lost': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveTab('All');
    setFilterOwner('All');
    setFilterCustomer('All');
    setFilterMinValue('');
    setFilterMaxValue('');
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span 
              className="cursor-pointer hover:text-indigo-600 transition-colors" 
              onClick={() => onViewChange && onViewChange('overview')}
            >
              CRM
            </span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a] font-semibold">Opportunities</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            Opportunities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage potential sales deals through the sales pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onViewChange && onViewChange('pipeline')}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Kanban size={14} /> Open Pipeline View
          </button>
          <button 
            onClick={handleOpenAddModal} 
            className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> Add Opportunity
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Opportunities</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-[#0f172a]">{metrics.openCount}</p>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              In Pipeline
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active deals excluding Won/Lost</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pipeline Value</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-[#0f172a]">{formatINR(metrics.pipelineValue)}</p>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Gross Value
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unweighted potential deal revenue</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weighted Pipeline</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-emerald-600">{formatINR(Math.round(metrics.weightedPipeline))}</p>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Probability Adj.
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calculated by Win Probability %</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Won Value</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-bold text-[#0f172a]">{formatINR(metrics.wonValue)}</p>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Closed Deals
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Successfully completed contracts</p>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        
        {/* TABS & SEARCH ROW */}
        <div className="border-b border-slate-200 p-4 sm:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* 3. STAGE FILTER TABS */}
            <div className="flex overflow-x-auto no-scrollbar sm:px-4">
              {(['All', 'New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const).map(tab => (
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
                    {stageCounts[tab] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* 4. SEARCH & FILTER CONTROLS */}
            <div className="flex items-center gap-2 sm:pr-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 bg-white"
                />
              </div>

              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded-lg flex items-center justify-center transition-colors ${
                  showFilters || filterOwner !== 'All' || filterCustomer !== 'All' || filterMinValue || filterMaxValue
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
                title="Toggle Filters"
              >
                <Filter size={16} />
              </button>
            </div>
          </div>

          {/* 5. ADVANCED FILTERS PANEL */}
          {showFilters && (
            <div className="bg-slate-50/80 p-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Owner</label>
                <select 
                  value={filterOwner} 
                  onChange={(e) => { setFilterOwner(e.target.value); setCurrentPage(1); }}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                >
                  <option value="All">All Owners</option>
                  {uniqueOwners.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Customer Account</label>
                <select 
                  value={filterCustomer} 
                  onChange={(e) => { setFilterCustomer(e.target.value); setCurrentPage(1); }}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                >
                  <option value="All">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Min Value (₹)</label>
                <input 
                  type="number"
                  placeholder="Min amount"
                  value={filterMinValue}
                  onChange={(e) => { setFilterMinValue(e.target.value); setCurrentPage(1); }}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="font-semibold text-slate-600 block mb-1">Max Value (₹)</label>
                  <input 
                    type="number"
                    placeholder="Max amount"
                    value={filterMaxValue}
                    onChange={(e) => { setFilterMaxValue(e.target.value); setCurrentPage(1); }}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                  />
                </div>
                <button 
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. OPPORTUNITY TABLE */}
        <div className="flex-1 overflow-auto">
          {paginatedOpportunities.length > 0 ? (
            <div className="min-w-[1000px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={selectedOpps.size > 0 && selectedOpps.size === paginatedOpportunities.length} 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                    </th>
                    <th className="p-4 font-semibold">Opportunity</th>
                    <th className="p-4 font-semibold">Customer / Company</th>
                    <th className="p-4 font-semibold text-right">Value</th>
                    <th className="p-4 font-semibold text-center">Probability</th>
                    <th className="p-4 font-semibold">Expected Close</th>
                    <th className="p-4 font-semibold">Owner</th>
                    <th className="p-4 font-semibold text-center">Stage</th>
                    <th className="p-4 font-semibold text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedOpportunities.map(opp => (
                    <tr key={opp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedOpps.has(opp.id)} 
                          onChange={() => handleSelectOne(opp.id)} 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                      </td>
                      
                      {/* Opportunity Name */}
                      <td className="p-4">
                        <div 
                          className="font-bold text-[#0f172a] cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => handleViewDetails(opp.id)}
                        >
                          {opp.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{opp.id}</div>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div 
                          className="font-medium text-[#0f172a] flex items-center cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => {
                            if (opp.customerId && onCustomerSelect) {
                              onCustomerSelect(opp.customerId);
                            }
                          }}
                        >
                          <Building2 size={13} className="mr-1.5 text-slate-400" />
                          {opp.customerName || '—'}
                        </div>
                      </td>

                      {/* Value */}
                      <td className="p-4 text-right">
                        <div className="font-extrabold text-[#0f172a]">
                          {formatINR(opp.value || 0)}
                        </div>
                      </td>

                      {/* Probability */}
                      <td className="p-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {opp.probability || 50}%
                        </span>
                      </td>

                      {/* Expected Close */}
                      <td className="p-4">
                        <div className="text-xs font-medium text-slate-700 flex items-center">
                          <Calendar size={12} className="mr-1.5 text-slate-400" />
                          {opp.expectedClose || '—'}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                            {opp.owner?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-slate-700 text-xs">{opp.owner || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* 7. DISPLAY-ONLY STAGE BADGE (NO DROPDOWN, NO SELECT, NO CHEVRON) */}
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStageBadge(opp.stage)} cursor-default`}>
                          {opp.stage}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td className="p-4">
                        <div className="flex justify-center items-center relative group/menu">
                          <button className="p-1.5 text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical size={16} />
                          </button>
                          <div className="absolute right-6 top-0 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover/menu:block z-20">
                            <button 
                              onClick={() => handleViewDetails(opp.id)} 
                              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleOpenEditModal(opp)} 
                              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                            >
                              Edit Deal
                            </button>
                            <div className="h-px bg-slate-200 my-1" />
                            <button 
                              onClick={() => handleDeleteOpp(opp.id)} 
                              className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* 20. EMPTY STATE */
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                {searchTerm ? <Search className="text-slate-400" size={24} /> : <TrendingUp className="text-slate-400" size={24} />}
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-1">
                {searchTerm || activeTab !== 'All' ? 'No opportunities found' : 'No opportunities yet'}
              </h3>
              <p className="text-slate-500 text-xs max-w-sm mb-6">
                {searchTerm || activeTab !== 'All' 
                  ? 'No sales opportunities matched your search or filters. Try adjusting your criteria.' 
                  : 'Create your first sales deal to start tracking potential deals across the pipeline.'}
              </p>
              {searchTerm || activeTab !== 'All' || filterOwner !== 'All' || filterCustomer !== 'All' ? (
                <button 
                  onClick={clearAllFilters} 
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 shadow-xs"
                >
                  Clear Filters
                </button>
              ) : (
                <button 
                  onClick={handleOpenAddModal} 
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-500 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={15} /> Add Opportunity
                </button>
              )}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {paginatedOpportunities.length > 0 && (
          <div className="border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center text-xs text-slate-500">
              <span>
                Showing <span className="font-bold text-[#0f172a]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(currentPage * itemsPerPage, filteredOpportunities.length)}</span> of <span className="font-bold text-[#0f172a]">{filteredOpportunities.length}</span>
              </span>
              <span className="mx-4 h-4 w-px bg-slate-300 hidden sm:block" />
              <div className="hidden sm:flex items-center">
                <span className="mr-2">Rows per page:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                  className="border border-slate-300 rounded px-2 py-1 text-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
                <ChevronLeft size={15} />
              </button>
              <div className="text-xs font-semibold text-slate-700 px-2">
                {currentPage} / {totalPages || 1}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT OPPORTUNITY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0f172a]">
                {editingOpp ? 'Edit Opportunity' : 'Create New Opportunity'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveOpportunity} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enterprise CRM Suite Implementation"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Account *</label>
                <select
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProbability}
                    onChange={(e) => setFormProbability(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Stage</label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as Opportunity['stage'])}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected Close</label>
                  <input
                    type="date"
                    value={formExpectedClose}
                    onChange={(e) => setFormExpectedClose(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Owner</label>
                <input
                  type="text"
                  value={formOwner}
                  onChange={(e) => setFormOwner(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-sm"
                >
                  {editingOpp ? 'Save Changes' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
