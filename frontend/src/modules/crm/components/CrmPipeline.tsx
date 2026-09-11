import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { CrmView, Opportunity } from '../../../types';
import { formatINR } from '../utils/crmUtils';
import { 
  Plus, TrendingUp, Building2, Calendar, User, Search, Filter,
  ChevronRight, MoreVertical, Edit2, CheckCircle2, DollarSign,
  Layers, Percent, Kanban, X, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';

interface CrmPipelineProps {
  onViewChange?: (view: CrmView) => void;
  onOpportunitySelect?: (id: string) => void;
  onCustomerSelect?: (id: string) => void;
}

const STAGES: { 
  id: Opportunity['stage']; 
  label: string; 
  badgeBg: string;
  headerBg: string;
  columnBg: string;
  accentBorder: string;
}[] = [
  { 
    id: 'New', 
    label: 'New', 
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'border-blue-200 bg-blue-50/50',
    columnBg: 'bg-slate-50/80',
    accentBorder: 'border-blue-300'
  },
  { 
    id: 'Qualified', 
    label: 'Qualified', 
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'border-blue-200 bg-blue-50/50',
    columnBg: 'bg-slate-50/80',
    accentBorder: 'border-blue-300'
  },
  { 
    id: 'Proposal', 
    label: 'Proposal', 
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'border-blue-200 bg-blue-50/50',
    columnBg: 'bg-slate-50/80',
    accentBorder: 'border-blue-300'
  },
  { 
    id: 'Negotiation', 
    label: 'Negotiation', 
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'border-blue-200 bg-blue-50/50',
    columnBg: 'bg-slate-50/80',
    accentBorder: 'border-blue-300'
  },
  { 
    id: 'Won', 
    label: 'Won', 
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headerBg: 'border-emerald-200 bg-emerald-50/60',
    columnBg: 'bg-emerald-50/30',
    accentBorder: 'border-emerald-400'
  },
  { 
    id: 'Lost', 
    label: 'Lost', 
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    headerBg: 'border-rose-200 bg-rose-50/60',
    columnBg: 'bg-rose-50/20',
    accentBorder: 'border-rose-300'
  },
];

export const CrmPipeline: React.FC<CrmPipelineProps> = ({
  onViewChange,
  onOpportunitySelect,
  onCustomerSelect,
}) => {
  const { opportunities, addOpportunity, updateOpportunity, customers } = useApp();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterMinValue, setFilterMinValue] = useState('');
  const [filterMaxValue, setFilterMaxValue] = useState('');
  const [filterStage, setFilterStage] = useState('All');

  // Add Deal modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formValue, setFormValue] = useState('350000');
  const [formProbability, setFormProbability] = useState('70');
  const [formExpectedClose, setFormExpectedClose] = useState('');
  const [formStage, setFormStage] = useState<Opportunity['stage']>('Qualified');
  const [formOwner, setFormOwner] = useState('Sarah Jenkins');

  // Unique owners list for filters
  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    opportunities.forEach(o => { if (o.owner) owners.add(o.owner); });
    return Array.from(owners);
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

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(o => {
      // Stage filter
      if (filterStage !== 'All' && o.stage !== filterStage) return false;

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
  }, [opportunities, filterStage, searchTerm, filterOwner, filterCustomer, filterMinValue, filterMaxValue]);

  const handleOpenAddModal = () => {
    setFormName('');
    setFormCustomerId(customers[0]?.id || '');
    setFormValue('350000');
    setFormProbability('70');
    setFormExpectedClose(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setFormStage('Qualified');
    setFormOwner('Sarah Jenkins');
    setShowAddModal(true);
  };

  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const matchedCustomer = customers.find(c => c.id === formCustomerId) || customers[0];
    const customerName = matchedCustomer ? matchedCustomer.customerName : 'Direct Account';

    const newOppData: Omit<Opportunity, 'id'> = {
      name: formName,
      customerId: formCustomerId || matchedCustomer?.id || 'CUST-001',
      customerName: customerName,
      value: parseFloat(formValue) || 100000,
      stage: formStage,
      probability: parseInt(formProbability, 10) || (formStage === 'Won' ? 100 : formStage === 'Lost' ? 0 : 50),
      expectedClose: formExpectedClose || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      owner: formOwner || 'Sarah Jenkins',
    };

    await addOpportunity(newOppData);
    setShowAddModal(false);
  };

  const handleCardClick = (id: string) => {
    if (onOpportunitySelect) {
      onOpportunitySelect(id);
    } else if (onViewChange) {
      onViewChange('opportunity-details');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStage('All');
    setFilterOwner('All');
    setFilterCustomer('All');
    setFilterMinValue('');
    setFilterMaxValue('');
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
            <span className="text-[#0f172a] font-semibold">Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            Sales Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual stage-by-stage Kanban tracking of deals and opportunity pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onViewChange && onViewChange('opportunities')}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
          >
            Switch to Table View
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

      {/* 3. PIPELINE FILTERS ROW */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search pipeline deals, accounts, owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700"
            >
              <option value="All">All Stages</option>
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700"
            >
              <option value="All">All Owners</option>
              {uniqueOwners.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 border rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                showFilters || filterCustomer !== 'All' || filterMinValue || filterMaxValue
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} /> More Filters
            </button>

            {(searchTerm || filterStage !== 'All' || filterOwner !== 'All' || filterCustomer !== 'All' || filterMinValue || filterMaxValue) && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Customer Account</label>
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
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
                placeholder="Min deal amount"
                value={filterMinValue}
                onChange={(e) => setFilterMinValue(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Max Value (₹)</label>
              <input
                type="number"
                placeholder="Max deal amount"
                value={filterMaxValue}
                onChange={(e) => setFilterMaxValue(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. VISUAL KANBAN PIPELINE BOARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 flex flex-col overflow-hidden">
        {filteredOpportunities.length > 0 ? (
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 min-w-[1200px] h-full pb-4">
              {STAGES.map((stage) => {
                const stageOpps = filteredOpportunities.filter(o => o.stage === stage.id);
                const stageTotal = stageOpps.reduce((sum, o) => sum + (parseFloat(o.value as any) || 0), 0);

                return (
                  <div 
                    key={stage.id} 
                    className={`flex-1 rounded-xl border border-slate-200 p-3.5 flex flex-col min-w-[210px] ${stage.columnBg}`}
                  >
                    {/* Column Header */}
                    <div className={`p-3 rounded-lg border mb-3 ${stage.headerBg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#0f172a]">{stage.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                          {stageOpps.length} {stageOpps.length === 1 ? 'deal' : 'deals'}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-[#0f172a]">
                        {formatINR(stageTotal)}
                      </p>
                    </div>

                    {/* Column Cards Container */}
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {stageOpps.length > 0 ? (
                        stageOpps.map((opp) => (
                          <div
                            key={opp.id}
                            onClick={() => handleCardClick(opp.id)}
                            className={`bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer space-y-2.5 group relative`}
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {opp.name}
                              </h4>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                stage.id === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                                stage.id === 'Lost' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {stage.id === 'Won' ? '100%' : stage.id === 'Lost' ? '0%' : `${opp.probability || 50}%`}
                              </span>
                            </div>

                            {/* Customer */}
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Building2 size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate font-medium text-slate-700">{opp.customerName || 'Direct Account'}</span>
                            </div>

                            {/* Value & Close Date */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="font-extrabold text-[#0f172a]">
                                {formatINR(opp.value || 0)}
                              </span>
                              <div className="text-[10px] text-slate-400 flex items-center">
                                <Calendar size={10} className="mr-1" />
                                {opp.expectedClose || '—'}
                              </div>
                            </div>

                            {/* Card Footer / Owner & Stage Badge (Display Only) */}
                            <div className="flex items-center justify-between pt-1 text-[10px]">
                              <div className="flex items-center text-slate-600">
                                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold mr-1">
                                  {opp.owner?.charAt(0) || '?'}
                                </div>
                                <span className="truncate max-w-[90px]">{opp.owner || 'Unassigned'}</span>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full font-bold border ${stage.badgeBg}`}>
                                {stage.label}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        /* Empty Column Placeholder */
                        <div className="h-32 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center bg-white/40">
                          <p className="text-[11px] font-medium text-slate-400">No opportunities</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">₹0</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Entire Pipeline Empty State */
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Kanban className="text-slate-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a] mb-1">
              No opportunities in the pipeline
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mb-6">
              {searchTerm || filterOwner !== 'All' || filterCustomer !== 'All' || filterStage !== 'All'
                ? 'No deals matched your current filters. Try resetting the criteria.'
                : 'Add a new sales opportunity to begin tracking deals across your sales stages.'}
            </p>
            {searchTerm || filterOwner !== 'All' || filterCustomer !== 'All' || filterStage !== 'All' ? (
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

      {/* ADD OPPORTUNITY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0f172a]">Create New Opportunity</h3>
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
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
