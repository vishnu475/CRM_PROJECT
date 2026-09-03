import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Opportunity } from '../../../types';
import { Plus, TrendingUp, DollarSign, Building, Calendar, User, Search } from 'lucide-react';

interface CrmOpportunitiesProps {
  onViewChange?: (view: any) => void;
}

const STAGES: { id: Opportunity['stage']; label: string; badgeBg: string }[] = [
  { id: 'New', label: 'New Inquiry', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: 'Qualified', label: 'Qualified Deal', badgeBg: 'bg-blue-50 text-blue-700' },
  { id: 'Proposal', label: 'Proposal Sent', badgeBg: 'bg-amber-50 text-amber-700' },
  { id: 'Negotiation', label: 'Negotiation', badgeBg: 'bg-purple-50 text-purple-700' },
  { id: 'Won', label: 'Closed Won', badgeBg: 'bg-emerald-50 text-emerald-700' },
  { id: 'Lost', label: 'Closed Lost', badgeBg: 'bg-rose-50 text-rose-700' },
];

export const CrmOpportunities: React.FC<CrmOpportunitiesProps> = () => {
  const { opportunities, addOpportunity, updateOpportunity, customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newValue, setNewValue] = useState('250000');
  const [newStage, setNewStage] = useState<Opportunity['stage']>('Qualified');
  const [newProbability, setNewProbability] = useState('60');

  const filteredOpportunities = opportunities.filter(o =>
    (o.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPipelineValue = filteredOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);
  const totalWeightedValue = filteredOpportunities.reduce((sum, o) => sum + ((o.value || 0) * (o.probability || 50) / 100), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const customer = customers.find(c => c.id === newCustomerId) || customers[0];
    const oppData: Omit<Opportunity, 'id'> = {
      name: newName,
      customerId: customer?.id || 'CUST-001',
      customerName: customer?.customerName || 'Direct Account',
      value: parseFloat(newValue) || 100000,
      stage: newStage,
      probability: parseInt(newProbability, 10) || 50,
      expectedClose: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      owner: 'Sarah Jenkins',
    };

    await addOpportunity(oppData);
    setNewName('');
    setShowAddModal(false);
  };

  const handleStageChange = async (oppId: string, targetStage: Opportunity['stage']) => {
    await updateOpportunity(oppId, { stage: targetStage });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={24} />
            Deals & Opportunities Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline tracking persisted to PostgreSQL CRM Database
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60 bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={16} /> + New Deal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Deals</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{filteredOpportunities.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Pipeline Value</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">₹ {totalPipelineValue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Weighted Pipeline</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹ {Math.round(totalWeightedValue).toLocaleString()}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageOpps = filteredOpportunities.filter(o => o.stage === stage.id);
          const stageTotal = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);

          return (
            <div key={stage.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col min-h-[460px]">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                  {stageOpps.length}
                </span>
              </div>

              <p className="text-[10px] font-semibold text-slate-500 mb-2.5">
                ₹ {stageTotal.toLocaleString()}
              </p>

              <div className="space-y-2.5 flex-1">
                {stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:shadow transition space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{opp.name}</h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stage.badgeBg}`}>
                        {opp.probability || 50}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate">{opp.customerName}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                      <span className="text-xs font-extrabold text-indigo-600">
                        ₹ {(opp.value || 0).toLocaleString()}
                      </span>
                      
                      <select
                        value={opp.stage}
                        onChange={(e) => handleStageChange(opp.id, e.target.value as Opportunity['stage'])}
                        className="text-[9px] border border-slate-200 rounded bg-slate-50 px-1 py-0.5 text-slate-600 focus:outline-none"
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Opportunity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enterprise Cloud Infrastructure"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Account *</label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Value (₹) *</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newProbability}
                    onChange={(e) => setNewProbability(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as Opportunity['stage'])}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
