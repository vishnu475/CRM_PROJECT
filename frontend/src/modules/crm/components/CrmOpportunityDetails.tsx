import React, { useState, useMemo } from 'react';
import { CrmView, Opportunity } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR } from '../utils/crmUtils';
import { 
  ChevronRight, ArrowLeft, TrendingUp, Building2, Calendar, User, 
  DollarSign, Percent, CheckCircle2, XCircle, Clock, FileText, 
  MoreVertical, Edit2, Plus, ArrowRight, ShieldCheck, Activity as ActivityIcon,
  Tag, AlertCircle, Phone, Mail
} from 'lucide-react';

interface CrmOpportunityDetailsProps {
  opportunityId: string;
  onViewChange: (view: CrmView) => void;
  onCustomerSelect?: (id: string) => void;
}

const STAGES: { id: Opportunity['stage']; label: string; description: string }[] = [
  { id: 'New', label: 'New', description: 'Initial deal discovery and inquiry' },
  { id: 'Qualified', label: 'Qualified', description: 'Budget, authority & timeline confirmed' },
  { id: 'Proposal', label: 'Proposal', description: 'Formal quotation/proposal sent to client' },
  { id: 'Negotiation', label: 'Negotiation', description: 'Contract terms and pricing in discussion' },
  { id: 'Won', label: 'Won', description: 'Deal closed successfully and contract signed' },
  { id: 'Lost', label: 'Lost', description: 'Opportunity closed without deal' },
];

export const CrmOpportunityDetails: React.FC<CrmOpportunityDetailsProps> = ({ 
  opportunityId, 
  onViewChange,
  onCustomerSelect
}) => {
  const { 
    opportunities, 
    updateOpportunity, 
    deleteOpportunity, 
    customers, 
    leads, 
    activities, 
    followUps,
    quotations
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'follow-ups' | 'quotations' | 'notes'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const opportunity = opportunities.find(o => o.id === opportunityId);

  // Edit form state
  const [editName, setEditName] = useState(opportunity?.name || '');
  const [editValue, setEditValue] = useState(opportunity?.value?.toString() || '0');
  const [editProbability, setEditProbability] = useState(opportunity?.probability?.toString() || '50');
  const [editExpectedClose, setEditExpectedClose] = useState(opportunity?.expectedClose || '');
  const [editOwner, setEditOwner] = useState(opportunity?.owner || '');

  // Related data
  const customer = useMemo(() => {
    if (!opportunity) return null;
    return customers.find(c => c.id === opportunity.customerId || c.customerName.toLowerCase() === opportunity.customerName.toLowerCase());
  }, [customers, opportunity]);

  const originatingLead = useMemo(() => {
    if (!opportunity) return null;
    return leads.find(l => l.convertedToOpportunityId === opportunity.id || (opportunity.name && opportunity.name.includes(l.company)));
  }, [leads, opportunity]);

  const relatedActivities = useMemo(() => {
    if (!opportunity) return [];
    return activities.filter(a => 
      a.opportunityId === opportunity.id || 
      (opportunity.customerName && a.relatedTo === opportunity.customerName)
    );
  }, [activities, opportunity]);

  const relatedFollowUps = useMemo(() => {
    if (!opportunity) return [];
    return followUps.filter(f => 
      f.opportunityId === opportunity.id || 
      (opportunity.customerName && f.relatedEntity === opportunity.customerName)
    );
  }, [followUps, opportunity]);

  const relatedQuotations = useMemo(() => {
    if (!opportunity) return [];
    return quotations.filter(q => 
      q.customerId === opportunity.customerId || 
      (opportunity.customerName && q.customerName === opportunity.customerName)
    );
  }, [quotations, opportunity]);

  if (!opportunity) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <TrendingUp className="text-slate-400" size={24} />
        </div>
        <h3 className="text-lg font-bold text-[#0f172a] mb-2">Opportunity not found</h3>
        <p className="text-slate-500 text-sm mb-6">The opportunity you are looking for does not exist or has been removed.</p>
        <button onClick={() => onViewChange('opportunities')} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-500">
          Back to Opportunities
        </button>
      </div>
    );
  }

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

  const handleStageTransition = async (targetStage: Opportunity['stage']) => {
    if (opportunity.stage === targetStage) return;
    setIsUpdatingStage(true);
    let updatedProbability = opportunity.probability;
    if (targetStage === 'Won') updatedProbability = 100;
    if (targetStage === 'Lost') updatedProbability = 0;
    if (targetStage === 'Proposal' && updatedProbability < 60) updatedProbability = 70;
    if (targetStage === 'Negotiation' && updatedProbability < 70) updatedProbability = 80;

    await updateOpportunity(opportunity.id, {
      stage: targetStage,
      probability: updatedProbability
    });
    setIsUpdatingStage(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOpportunity(opportunity.id, {
      name: editName,
      value: parseFloat(editValue) || 0,
      probability: parseInt(editProbability, 10) || 50,
      expectedClose: editExpectedClose,
      owner: editOwner
    });
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    if (deleteOpportunity) {
      await deleteOpportunity(opportunity.id);
    }
    setShowDeleteModal(false);
    onViewChange('opportunities');
  };

  const weightedValue = (opportunity.value || 0) * (opportunity.probability || 50) / 100;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* BREADCRUMB & BACK */}
      <div className="mb-6">
        <div className="flex items-center text-xs text-slate-500 mb-3 font-medium">
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('opportunities')}>Opportunities</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="text-[#0f172a] font-semibold">{opportunity.name}</span>
        </div>
        <button onClick={() => onViewChange('opportunities')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-[#0f172a] transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Opportunities
        </button>
      </div>

      {/* OPPORTUNITY HEADER CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[#0f172a]">{opportunity.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStageBadge(opportunity.stage)}`}>
                {opportunity.stage}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-slate-500 flex-wrap gap-2 mt-1">
              <span 
                className="flex items-center text-indigo-600 font-semibold cursor-pointer hover:underline"
                onClick={() => {
                  if (opportunity.customerId && onCustomerSelect) {
                    onCustomerSelect(opportunity.customerId);
                  }
                }}
              >
                <Building2 size={14} className="mr-1 text-slate-400" /> 
                {opportunity.customerName}
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center text-slate-500">
                <Calendar size={14} className="mr-1 text-slate-400" /> 
                Expected Close: <strong className="ml-1 text-slate-700">{opportunity.expectedClose || '—'}</strong>
              </span>
              {originatingLead && (
                <>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    From Lead: <strong>{originatingLead.name}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setEditName(opportunity.name);
                setEditValue(opportunity.value?.toString() || '0');
                setEditProbability(opportunity.probability?.toString() || '50');
                setEditExpectedClose(opportunity.expectedClose || '');
                setEditOwner(opportunity.owner || '');
                setShowEditModal(true);
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Edit2 size={13} /> Edit Deal
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 bg-white border border-rose-200 text-rose-600 font-semibold text-xs rounded-lg shadow-sm hover:bg-rose-50 flex items-center gap-1.5"
            >
              Delete
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Deal Value</p>
            <p className="text-xl font-extrabold text-[#0f172a]">{formatINR(opportunity.value || 0)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Win Probability</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-indigo-600">{opportunity.probability || 0}%</span>
              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${opportunity.probability || 0}%` }} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Weighted Forecast</p>
            <p className="text-xl font-extrabold text-emerald-600">{formatINR(Math.round(weightedValue))}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Deal Owner</p>
            <div className="flex items-center mt-1">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                {opportunity.owner?.charAt(0) || '?'}
              </div>
              <span className="text-sm font-bold text-slate-800">{opportunity.owner || 'Unassigned'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLLED STAGE PROGRESSION PIPELINE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0f172a]">Deal Stage Progression</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage and advance the sales lifecycle through controlled milestones</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Current Stage: <strong className="text-indigo-600">{opportunity.stage}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STAGES.map((s) => {
            const isCurrent = opportunity.stage === s.id;
            const isWon = opportunity.stage === 'Won';
            const isLost = opportunity.stage === 'Lost';

            return (
              <button
                key={s.id}
                disabled={isUpdatingStage}
                onClick={() => handleStageTransition(s.id)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isCurrent 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20' 
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {s.label}
                  </span>
                  {isCurrent && <CheckCircle2 size={14} className="text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
        {(['overview', 'activities', 'follow-ups', 'quotations', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-[#0f172a] hover:border-slate-300'
            }`}
          >
            {tab.replace('-', ' ')}
            {tab === 'activities' && relatedActivities.length > 0 && ` (${relatedActivities.length})`}
            {tab === 'follow-ups' && relatedFollowUps.length > 0 && ` (${relatedFollowUps.length})`}
            {tab === 'quotations' && relatedQuotations.length > 0 && ` (${relatedQuotations.length})`}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deal Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-[#0f172a] mb-4 flex items-center">
              <TrendingUp size={16} className="mr-2 text-indigo-500" /> Deal Information
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Title</span>
                <span className="font-medium text-[#0f172a] col-span-2">{opportunity.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Deal Value</span>
                <span className="font-extrabold text-[#0f172a] col-span-2">{formatINR(opportunity.value || 0)}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Win Probability</span>
                <span className="font-medium text-indigo-600 col-span-2">{opportunity.probability || 50}%</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Expected Close</span>
                <span className="font-medium text-slate-800 col-span-2">{opportunity.expectedClose || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Stage</span>
                <span className="col-span-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStageBadge(opportunity.stage)}`}>
                    {opportunity.stage}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-slate-500">Owner</span>
                <span className="font-medium text-slate-800 col-span-2">{opportunity.owner || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Customer & Account Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-[#0f172a] mb-4 flex items-center">
              <Building2 size={16} className="mr-2 text-indigo-500" /> Customer Account
            </h3>
            {customer ? (
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-500">Account Name</span>
                  <span 
                    className="font-bold text-indigo-600 col-span-2 cursor-pointer hover:underline"
                    onClick={() => onCustomerSelect && onCustomerSelect(customer.id)}
                  >
                    {customer.customerName}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-500">Account Code</span>
                  <span className="font-mono text-slate-700 col-span-2">{customer.customerCode || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-500">Primary Contact</span>
                  <span className="font-medium text-slate-800 col-span-2">{customer.primaryContact?.name || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-500">Contact Email</span>
                  <span className="font-medium text-slate-800 col-span-2">{customer.primaryContact?.email || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-500">Contact Phone</span>
                  <span className="font-medium text-slate-800 col-span-2">{customer.primaryContact?.phone || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-500">Account Status</span>
                  <span className="col-span-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {customer.status}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                <p className="mb-2">Customer Name: <strong className="text-slate-700">{opportunity.customerName}</strong></p>
                <p className="italic">Detailed customer record not directly linked.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0f172a]">Opportunity Activities</h3>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1">
              <Plus size={13} /> Add Activity
            </button>
          </div>
          {relatedActivities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {relatedActivities.map(act => (
                <div key={act.id} className="py-3 flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Type: {act.type} • Due: {act.dueDate} • Status: {act.status}</p>
                    {act.outcome && <p className="text-[11px] text-slate-600 mt-1 italic">Outcome: {act.outcome}</p>}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{act.priority}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No activities logged for this opportunity yet.</p>
          )}
        </div>
      )}

      {/* FOLLOW-UPS TAB */}
      {activeTab === 'follow-ups' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0f172a]">Follow-up Tasks</h3>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1">
              <Plus size={13} /> Add Follow-up
            </button>
          </div>
          {relatedFollowUps.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {relatedFollowUps.map(fu => (
                <div key={fu.id} className="py-3 flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{fu.activityType} with client</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Due: {fu.dueDate} • Owner: {fu.owner}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${fu.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {fu.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No pending follow-ups for this opportunity.</p>
          )}
        </div>
      )}

      {/* QUOTATIONS TAB */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0f172a]">Quotations</h3>
          </div>
          {relatedQuotations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {relatedQuotations.map(q => (
                <div key={q.id} className="py-3 flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{q.quoteNumber}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Date: {q.date} • Valid Until: {q.validUntil}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{formatINR(q.amount)}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No quotations created for this customer account yet.</p>
          )}
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-[#0f172a] mb-3">Deal Notes</h3>
          <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {originatingLead?.notes || originatingLead?.requirement || 'No notes currently recorded for this opportunity.'}
          </p>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Opportunity</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editProbability}
                    onChange={(e) => setEditProbability(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={editExpectedClose}
                    onChange={(e) => setEditExpectedClose(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Owner</label>
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Opportunity?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong className="text-slate-700">{opportunity.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Delete Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
