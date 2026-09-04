import React, { useState, useMemo } from 'react';
import { CrmView, Lead } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR, getLeadScoreColor } from '../utils/crmUtils';
import { validateLeadStageTransition } from '../utils/leadWorkflowValidation';
import { 
  ChevronRight, ArrowLeft, MoreVertical, Edit2, Calendar, User, UserPlus, FileText, 
  CheckCircle2, Plus, Phone, Mail, Clock, MapPin, Building2, Download, AlertCircle
} from 'lucide-react';

interface CrmLeadDetailsProps {
  leadId: string;
  onViewChange: (view: CrmView) => void;
}

type TabType = 'overview' | 'activities' | 'notes' | 'documents';

const leadStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const CrmLeadDetails: React.FC<CrmLeadDetailsProps> = ({ leadId, onViewChange }) => {
  const { leads, activities, notes, documents, followUps, quotations, updateLead, addActivity, updateActivity, addQuotation, updateQuotation, addNote, addFollowUp, addDocument } = useApp();
  
  const lead = leads.find(l => l.id === leadId);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  
  // Forms visibility state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  
  // Form States
  const [activityForm, setActivityForm] = useState({ type: 'Call' as any, title: '', date: '', outcome: '', status: 'Completed' as any });
  const [noteContent, setNoteContent] = useState('');
  const [followUpForm, setFollowUpForm] = useState({ type: 'Call' as any, date: '', description: '' });
  const [proposalForm, setProposalForm] = useState({
    amount: '',
    date: '',
    status: 'Draft' as 'Draft' | 'Sent',
    sentDate: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    requirement: '',
    budget: '',
    decisionMaker: '',
    expectedCloseDate: '',
    industry: '',
    source: '',
  });

  const leadQuotation = useMemo(() => {
    if (!lead) return null;
    return quotations.find(
      (q) =>
        q.customerId === lead.id ||
        q.leadId === lead.id ||
        q.customerName === lead.name ||
        (q.customerId && q.customerId.includes(lead.id)) ||
        (q.customerName && lead.name && q.customerName.toLowerCase() === lead.name.toLowerCase())
    ) || null;
  }, [quotations, lead]);

  const openProposalModal = () => {
    if (!lead) return;
    const defaultAmount = leadQuotation?.amount || lead.proposalAmount || lead.budget || lead.value || '';
    const defaultDate = leadQuotation?.date || lead.proposalDate || new Date().toISOString().split('T')[0];
    const defaultStatus: 'Draft' | 'Sent' = (leadQuotation?.status === 'Draft' || lead.proposalStatus === 'Draft') ? 'Draft' : 'Sent';
    const defaultSentDate = leadQuotation?.sentDate || lead.proposalSentDate || (defaultStatus === 'Sent' ? new Date().toISOString().split('T')[0] : '');

    setProposalForm({
      amount: defaultAmount ? defaultAmount.toString() : '',
      date: defaultDate,
      status: defaultStatus,
      sentDate: defaultSentDate,
    });
    setShowProposalModal(true);
  };

  const handleSaveProposal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lead) return;
    const numericAmount = parseFloat(proposalForm.amount) || 0;
    const computedSentDate = proposalForm.status === 'Sent' ? (proposalForm.sentDate || new Date().toISOString().split('T')[0]) : '';

    if (leadQuotation) {
      await updateQuotation(leadQuotation.id, {
        amount: numericAmount,
        date: proposalForm.date || new Date().toISOString().split('T')[0],
        status: proposalForm.status,
        sentDate: computedSentDate,
      });
    } else {
      await addQuotation({
        quoteNumber: `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        customerId: lead.id,
        leadId: lead.id,
        customerName: lead.name,
        date: proposalForm.date || new Date().toISOString().split('T')[0],
        validUntil: lead.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        amount: numericAmount,
        status: proposalForm.status,
        sentDate: computedSentDate,
        itemsCount: 1,
      });
    }

    const shouldAdvance = lead.stage === 'Qualified' && proposalForm.status === 'Sent' && numericAmount > 0;

    updateLead(lead.id, {
      proposalAmount: numericAmount,
      proposalDate: proposalForm.date || new Date().toISOString().split('T')[0],
      proposalStatus: proposalForm.status,
      proposalSentDate: computedSentDate,
      ...(shouldAdvance ? { stage: 'Proposal' } : {}),
    });

    setShowProposalModal(false);
    setValidationError(null);
  };

  const handleSendProposal = async () => {
    if (!lead) return;
    const today = new Date().toISOString().split('T')[0];
    const amount = leadQuotation?.amount || lead.proposalAmount || lead.budget || lead.value || 0;
    const date = leadQuotation?.date || lead.proposalDate || today;

    if (leadQuotation) {
      await updateQuotation(leadQuotation.id, {
        status: 'Sent',
        sentDate: today,
      });
    } else {
      await addQuotation({
        quoteNumber: `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        customerId: lead.id,
        leadId: lead.id,
        customerName: lead.name,
        date: date,
        validUntil: lead.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        amount: amount,
        status: 'Sent',
        sentDate: today,
        itemsCount: 1,
      });
    }

    const shouldAdvance = lead.stage === 'Qualified' && amount > 0;

    updateLead(lead.id, {
      proposalStatus: 'Sent',
      proposalSentDate: today,
      proposalAmount: amount,
      proposalDate: date,
      ...(shouldAdvance ? { stage: 'Proposal' } : {}),
    });

    setValidationError(null);
  };

  const openEditModal = () => {
    if (!lead) return;
    setEditForm({
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      requirement: lead.requirement || lead.notes || '',
      budget: (lead.budget !== undefined && lead.budget > 0 ? lead.budget : (lead.value || '')).toString(),
      decisionMaker: lead.decisionMaker || lead.contactPerson || '',
      expectedCloseDate: lead.expectedCloseDate || '',
      industry: lead.industry || '',
      source: lead.source || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lead) return;
    const updatedBudget = parseFloat(editForm.budget) || 0;
    const updates: Partial<Lead> = {
      name: editForm.name,
      company: editForm.company,
      email: editForm.email,
      phone: editForm.phone,
      requirement: editForm.requirement.trim(),
      budget: updatedBudget,
      value: updatedBudget,
      decisionMaker: editForm.decisionMaker.trim(),
      contactPerson: editForm.decisionMaker.trim() || lead.contactPerson,
      expectedCloseDate: editForm.expectedCloseDate,
      industry: editForm.industry,
      source: editForm.source,
    };
    updateLead(lead.id, updates);
    setShowEditModal(false);
    setValidationError(null);
  };

  const leadActivities = useMemo(() => activities.filter(a => a.relatedTo === leadId || a.relatedTo === lead?.name).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()), [activities, leadId, lead?.name]);
  const leadNotes = useMemo(() => notes.filter(n => n.relatedRecord === leadId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notes, leadId]);
  const leadDocs = useMemo(() => documents.filter(d => d.linkedEntity === leadId), [documents, leadId]);
  
  // Find next pending follow up
  const nextFollowUp = useMemo(() => {
    const pending = followUps.filter(f => f.relatedEntity === leadId && f.status !== 'Overdue');
    if (pending.length === 0) return null;
    return pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  }, [followUps, leadId]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <User className="text-slate-400" size={24} />
        </div>
        <h3 className="text-lg font-bold text-[#0f172a] mb-2">Lead not found</h3>
        <p className="text-slate-500 text-sm mb-6">The lead you're looking for does not exist or may have been archived.</p>
        <button onClick={() => onViewChange('leads')} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-500">
          Back to Leads
        </button>
      </div>
    );
  }

  const handleArchive = () => {
    updateLead(lead.id, { status: 'archived' });
    setShowArchiveModal(false);
    onViewChange('leads');
  };

  const handleStageChange = (newStage: Lead['stage']) => {
    const validation = validateLeadStageTransition(lead, newStage, activities, quotations);
    if (!validation.allowed) {
      setValidationError(validation.message || 'Stage transition not allowed.');
      return;
    }
    setValidationError(null);
    updateLead(lead.id, { stage: newStage });
  };

  const handleAddActivity = () => {
    if (!activityForm.title) return;
    const actStatus = activityForm.status || 'Completed';
    const actType = activityForm.type || 'Call';

    addActivity({
      title: activityForm.title,
      type: actType,
      relatedTo: leadId,
      assignedTo: lead.assignedTo,
      dueDate: activityForm.date || new Date().toISOString().split('T')[0],
      priority: 'Medium',
      status: actStatus,
      outcome: activityForm.outcome
    });

    // Auto-advance lead stage to 'Contacted' if in 'New' and completed interaction recorded
    if (lead.stage === 'New' && actStatus === 'Completed' && (actType === 'Call' || actType === 'Email' || actType === 'Meeting')) {
      updateLead(lead.id, { stage: 'Contacted' });
    }

    setActivityForm({ type: 'Call', title: '', date: '', outcome: '', status: 'Completed' });
    setShowActivityForm(false);
    setValidationError(null);
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addNote({
      title: 'Lead Note',
      content: noteContent,
      relatedRecord: leadId,
      createdBy: 'Current User', // Mocked user
      visibility: 'Public'
    });
    setNoteContent('');
    setShowNoteForm(false);
  };

  const handleAddFollowUp = () => {
    if (!followUpForm.description || !followUpForm.date) return;
    addFollowUp({
      relatedEntity: leadId,
      activityType: followUpForm.type,
      dueDate: followUpForm.date,
      owner: lead.assignedTo,
      status: 'Upcoming'
    });
    setFollowUpForm({ type: 'Call', date: '', description: '' });
    setShowFollowUpForm(false);
  };

  const currentStageIndex = leadStages.indexOf(lead.stage);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      
      {/* ARCHIVE MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#0f172a] mb-2">Archive Lead?</h3>
            <p className="text-sm text-slate-500 mb-6">This lead will be removed from active CRM views.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowArchiveModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleArchive} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB & BACK */}
      <div className="mb-6">
        <div className="flex items-center text-xs text-slate-500 mb-3 font-medium">
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('overview')}>CRM</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewChange('leads')}>Leads</span> 
          <ChevronRight size={12} className="mx-1" /> 
          <span className="text-[#0f172a]">Lead Details</span>
        </div>
        <button onClick={() => onViewChange('leads')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-[#0f172a] transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Leads
        </button>
      </div>

      {/* LEAD HEADER CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">{lead.name}</h1>
            <div className="flex items-center text-sm text-slate-500 flex-wrap gap-2">
              <span className="flex items-center"><Building2 size={14} className="mr-1" /> {lead.company}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center"><User size={14} className="mr-1" /> {lead.contactPerson || lead.email}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="inline-flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400">Stage:</span>
                <select
                  value={lead.stage}
                  onChange={(e) => handleStageChange(e.target.value as Lead['stage'])}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  title="Change Lead Stage"
                >
                  {leadStages.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={openEditModal}
              className="px-4 py-2 bg-white border border-slate-200 text-[#0f172a] font-semibold text-sm rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2"
              title="Edit lead details and qualification"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button onClick={() => { setShowActivityForm(true); setActiveTab('activities'); }} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 flex items-center gap-2">
              <Plus size={14} /> Add Activity
            </button>
            <div className="relative">
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50">
                <MoreVertical size={18} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={openEditModal} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit Lead & Qualification</button>
                  <button onClick={() => { setShowFollowUpForm(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Add Follow-up</button>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-400 cursor-not-allowed" title="Coming soon">Create Opportunity</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-400 cursor-not-allowed" title="Coming soon">Convert to Customer</button>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <button onClick={() => { setShowArchiveModal(true); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium">Archive Lead</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VALIDATION ERROR BANNER */}
        {validationError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-bold text-amber-900">Stage Transition Blocked</p>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed whitespace-pre-line">{validationError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {validationError.toLowerCase().includes('proposal') ? (
                <button
                  onClick={openProposalModal}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1"
                >
                  {leadQuotation?.status === 'Draft' || lead.proposalStatus === 'Draft' ? '📤 Send Proposal' : '+ Create Proposal'}
                </button>
              ) : validationError.includes('qualification') || validationError.includes('Requirement') || validationError.includes('Budget') || validationError.includes('Decision Maker') || validationError.includes('Closing Date') ? (
                <button
                  onClick={openEditModal}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  + Complete Qualification
                </button>
              ) : (
                <button
                  onClick={() => { setShowActivityForm(true); setActiveTab('activities'); }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  + Log Interaction
                </button>
              )}
              <button
                onClick={() => setValidationError(null)}
                className="text-amber-600 hover:text-amber-800 text-sm font-bold px-1"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Lead Score</p>
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border text-sm font-bold ${getLeadScoreColor(lead.score)}`}>
                {lead.score}
              </div>
              <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${getLeadScoreColor(lead.score).split(' ')[0]}`} style={{ width: `${lead.score}%` }}></div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Expected Value</p>
            <p className="text-lg font-bold text-[#0f172a]">{formatINR(lead.value)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Expected Close</p>
            <p className="text-sm font-bold text-[#0f172a]">{lead.expectedCloseDate || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Owner</p>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                {lead.assignedTo.charAt(0)}
              </div>
              <span className="text-sm font-bold text-[#0f172a]">{lead.assignedTo}</span>
            </div>
          </div>
        </div>

        {/* STAGE PROGRESSION */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Stage</p>
            <span className="text-[11px] text-slate-400">Click a stage bubble or select above to move stage</span>
          </div>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 z-0 transition-all duration-500" style={{ width: `${Math.max(0, (currentStageIndex / (leadStages.length - 1)) * 100)}%` }}></div>
            
            {leadStages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isLost = stage === 'Lost' && isCurrent;
              
              let bubbleColor = 'bg-slate-200 border-white text-transparent hover:border-indigo-200';
              if (isPast) bubbleColor = 'bg-indigo-500 border-white text-white hover:bg-indigo-600';
              if (isCurrent) bubbleColor = 'bg-indigo-600 border-indigo-200 shadow-md shadow-indigo-500/30 text-white';
              if (isLost) bubbleColor = 'bg-rose-500 border-rose-200 text-white';

              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => handleStageChange(stage as Lead['stage'])}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none transition-transform hover:scale-105"
                  title={`Click to set stage to ${stage}`}
                >
                  <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-colors ${bubbleColor}`}>
                    {isPast && <CheckCircle2 size={12} />}
                  </div>
                  <span className={`absolute top-8 text-[10px] font-bold whitespace-nowrap transition-colors ${isCurrent ? (isLost ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400 group-hover:text-slate-700'}`}>
                    {stage}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="h-8"></div> {/* spacer for absolute text */}
        </div>
      </div>

      {/* NEXT FOLLOW UP (If exists) */}
      {nextFollowUp ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg mt-0.5">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 tracking-wider uppercase mb-1">Next Follow-up • {nextFollowUp.dueDate}</p>
              <p className="text-sm text-amber-900 font-medium">{nextFollowUp.activityType} regarding lead.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors">Reschedule</button>
            <button className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm">Complete</button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 text-slate-500 rounded-lg">
              <Calendar size={18} />
            </div>
            <p className="text-sm font-medium text-slate-600">No follow-up scheduled</p>
          </div>
          <button onClick={() => setShowFollowUpForm(true)} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors">
            + Add Follow-up
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
        {(['overview', 'activities', 'notes', 'documents'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-[#0f172a] hover:border-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEAD QUALIFICATION SECTION */}
          <div className="bg-white rounded-xl border border-indigo-100 shadow-xs p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0f172a] flex items-center">
                <CheckCircle2 size={18} className="mr-2 text-indigo-600" /> Lead Qualification Details
              </h2>
              <button
                onClick={openEditModal}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Edit2 size={12} /> Edit Qualification
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Customer Requirement</span>
                  {!(lead.requirement || lead.notes) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Required for Qualified</span>
                  )}
                </div>
                <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">
                  {lead.requirement || lead.notes || <span className="text-slate-400 italic">No requirement recorded yet.</span>}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Confirmed Budget</span>
                  {!((lead.budget && lead.budget > 0) || (lead.value && lead.value > 0)) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Required</span>
                  )}
                </div>
                <p className="text-base font-bold text-[#0f172a]">
                  {(lead.budget && lead.budget > 0) || (lead.value && lead.value > 0) ? (
                    formatINR(lead.budget || lead.value)
                  ) : (
                    <span className="text-slate-400 font-normal italic text-sm">Budget not set</span>
                  )}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">3. Decision Maker</span>
                  {!(lead.decisionMaker || lead.contactPerson) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Required</span>
                  )}
                </div>
                <p className="text-base font-bold text-[#0f172a]">
                  {lead.decisionMaker || lead.contactPerson || <span className="text-slate-400 font-normal italic text-sm">Decision maker not specified</span>}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">4. Expected Closing Date</span>
                  {!lead.expectedCloseDate && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Required</span>
                  )}
                </div>
                <p className="text-sm font-bold text-[#0f172a]">
                  {lead.expectedCloseDate || <span className="text-slate-400 font-normal italic">Expected close date not set</span>}
                </p>
              </div>
            </div>
          </div>

          {/* PROPOSAL & QUOTATION DETAILS SECTION */}
          <div className="bg-white rounded-xl border border-indigo-100 shadow-xs p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0f172a] flex items-center">
                <FileText size={18} className="mr-2 text-indigo-600" /> Proposal & Quotation Details
              </h2>
              <div className="flex items-center gap-2">
                {(leadQuotation?.status === 'Draft' || lead.proposalStatus === 'Draft') && (
                  <button
                    onClick={handleSendProposal}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    title="Send proposal to customer"
                  >
                    <CheckCircle2 size={13} /> Send Proposal
                  </button>
                )}
                <button
                  onClick={openProposalModal}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit2 size={12} /> {leadQuotation || lead.proposalAmount ? 'Edit Proposal' : '+ Create Proposal'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">1. Proposal Amount</span>
                <p className="text-base font-bold text-[#0f172a]">
                  {(leadQuotation?.amount && leadQuotation.amount > 0) || (lead.proposalAmount && lead.proposalAmount > 0) ? (
                    formatINR(leadQuotation?.amount || lead.proposalAmount || 0)
                  ) : (
                    <span className="text-slate-400 font-normal italic text-sm">No amount set</span>
                  )}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">2. Proposal Date</span>
                <p className="text-sm font-bold text-[#0f172a]">
                  {leadQuotation?.date || lead.proposalDate || <span className="text-slate-400 font-normal italic text-sm">Not set</span>}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">3. Proposal Status</span>
                <div className="mt-0.5">
                  {(leadQuotation?.status === 'Sent' || lead.proposalStatus === 'Sent') ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sent
                    </span>
                  ) : (leadQuotation || lead.proposalStatus) ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                      <Clock size={12} /> Draft
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs italic">No proposal</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">4. Sent Date</span>
                <p className="text-sm font-bold text-[#0f172a]">
                  {leadQuotation?.sentDate || lead.proposalSentDate || <span className="text-slate-400 font-normal italic text-xs">Not sent yet</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><User size={18} className="mr-2 text-indigo-500" /> Lead Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Name</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Company</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.company}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Industry</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.industry || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Source</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.source || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Campaign</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.campaign || '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><Phone size={18} className="mr-2 text-indigo-500" /> Contact Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Email</span>
                <span className="text-sm font-medium text-indigo-600 col-span-2">{lead.email}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Phone</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.phone || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Alt. Phone</span>
                <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.alternatePhone || '—'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-sm font-semibold text-slate-500 col-span-1">Website</span>
                <span className="text-sm font-medium text-indigo-600 col-span-2">{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="hover:underline">{lead.website}</a> : '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2">
            <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center"><MapPin size={18} className="mr-2 text-indigo-500" /> Address</h2>
            {lead.address || lead.city || lead.state || lead.country ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Street</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.address || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">City/State</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{[lead.city, lead.state].filter(Boolean).join(', ') || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Country</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.country || '—'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-sm font-semibold text-slate-500 col-span-1">Postal Code</span>
                  <span className="text-sm font-medium text-[#0f172a] col-span-2">{lead.postalCode || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No address information available.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-[#0f172a]">Activity Timeline</h2>
            <button onClick={() => setShowActivityForm(!showActivityForm)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
              + Log Activity
            </button>
          </div>

          {showActivityForm && (
            <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in zoom-in-95">
              <h3 className="text-sm font-bold text-[#0f172a] mb-3">Log New Activity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select value={activityForm.type} onChange={(e) => setActivityForm({...activityForm, type: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Task">Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={activityForm.status} onChange={(e) => setActivityForm({...activityForm, status: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input type="date" value={activityForm.date} onChange={(e) => setActivityForm({...activityForm, date: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                  <input type="text" placeholder="E.g. Discovery Call with client" value={activityForm.title} onChange={(e) => setActivityForm({...activityForm, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Outcome / Notes</label>
                  <textarea rows={2} value={activityForm.outcome} onChange={(e) => setActivityForm({...activityForm, outcome: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowActivityForm(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddActivity} className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-semibold text-white hover:bg-indigo-500">Save Activity</button>
              </div>
            </div>
          )}

          {leadActivities.length > 0 ? (
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {leadActivities.map(activity => {
                const isCall = activity.type === 'Call';
                const isEmail = activity.type === 'Email';
                const isCompleted = activity.status === 'Completed';
                const Icon = isCall ? Phone : (isEmail ? Mail : CheckCircle2);
                const colorClass = isCompleted
                  ? (isCall ? 'bg-emerald-100 text-emerald-600' : isEmail ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600')
                  : 'bg-amber-100 text-amber-600';

                return (
                  <div key={activity.id} className="relative pl-6">
                    <div className={`absolute -left-[13px] top-1 p-1 rounded-full border-2 border-white ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[#0f172a]">{activity.title}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {activity.status || 'Completed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isCompleted && (
                            <button
                              onClick={() => {
                                updateActivity(activity.id, { status: 'Completed' });
                                if (lead.stage === 'New' && (activity.type === 'Call' || activity.type === 'Email' || activity.type === 'Meeting')) {
                                  updateLead(lead.id, { stage: 'Contacted' });
                                }
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition flex items-center gap-1"
                              title="Mark this interaction completed and advance stage"
                            >
                              <CheckCircle2 size={12} /> Mark Completed
                            </button>
                          )}
                          <span className="text-xs text-slate-500">{activity.dueDate}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{activity.outcome || 'No outcome recorded.'}</p>
                      <div className="flex items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        <span className="px-2 py-0.5 rounded bg-slate-100 mr-2">{activity.type}</span>
                        <span>{activity.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 mb-4">No activities logged yet.</p>
              {!showActivityForm && (
                <button onClick={() => setShowActivityForm(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  + Log First Activity
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: NOTES */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-[#0f172a]">Notes</h2>
            <button onClick={() => setShowNoteForm(!showNoteForm)} className="px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors">
              + Add Note
            </button>
          </div>

          {showNoteForm && (
            <div className="mb-6 animate-in fade-in zoom-in-95">
              <textarea rows={4} placeholder="Type your note here..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="w-full p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 mb-3"></textarea>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNoteForm(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddNote} className="px-4 py-2 bg-amber-500 rounded-md text-sm font-semibold text-white hover:bg-amber-400">Save Note</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {leadNotes.map(note => (
              <div key={note.id} className="bg-yellow-50/80 border border-yellow-200 p-4 rounded-xl">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-yellow-200/50 text-[10px] text-yellow-800/60 font-semibold uppercase tracking-wider">
                  <span>{note.createdBy}</span>
                  <span>{note.createdAt}</span>
                </div>
              </div>
            ))}
            {leadNotes.length === 0 && !showNoteForm && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No notes yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-[#0f172a]">Documents</h2>
            <button className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">
              + Upload Document
            </button>
          </div>

          <div className="space-y-3">
            {leadDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded border border-slate-200 text-slate-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.category} • {doc.size}</p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <Download size={16} />
                </button>
              </div>
            ))}
            {leadDocs.length === 0 && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 mb-3">
                  <Plus className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-[#0f172a]">No documents attached</p>
                <p className="text-xs text-slate-500 mt-1">Upload proposals, contracts, or NDAs here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOG ACTIVITY / INTERACTION MODAL */}
      {showActivityForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Phone size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">Log Customer Interaction</h3>
                  <p className="text-xs text-slate-500">Record a call, meeting, or email for {lead.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowActivityForm(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddActivity(); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Type *</label>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Call">📞 Phone Call</option>
                    <option value="Email">✉️ Email Exchange</option>
                    <option value="Meeting">📅 In-Person / Demo Meeting</option>
                    <option value="Task">📋 Task / Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={activityForm.status || 'Completed'}
                    onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Completed">✅ Completed (Validates Contacted Stage)</option>
                    <option value="Pending">⏳ Pending / Scheduled (Lead Remains in New)</option>
                  </select>
                </div>
              </div>

              {/* HELPER STATUS HINT */}
              {activityForm.status === 'Pending' ? (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
                  <span className="text-sm">⏳</span>
                  <div>
                    <span className="font-bold">Pending / Scheduled Activity:</span> This upcoming activity will be recorded in the timeline. The lead will <strong>remain in "New"</strong> until the interaction is marked Completed.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2 animate-in fade-in">
                  <span className="text-sm">✅</span>
                  <div>
                    <span className="font-bold">Completed Interaction:</span> This records a completed interaction and will <strong>automatically advance the lead to "Contacted"</strong>.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Discussion Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery call regarding CRM requirements"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={activityForm.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome / Discussion Notes</label>
                <textarea
                  rows={3}
                  placeholder="Summarize key takeaways, client response, agreed next steps..."
                  value={activityForm.outcome}
                  onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActivityForm(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 ${
                    activityForm.status === 'Pending'
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {activityForm.status === 'Pending'
                    ? 'Save Scheduled Activity (Keep in New)'
                    : (lead.stage === 'New' ? 'Save & Move to Contacted' : 'Save Interaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD & QUALIFICATION MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">Edit Lead & Qualification Details</h3>
                  <p className="text-xs text-slate-500">Update qualification information for {lead.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* QUALIFICATION SECTION */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <CheckCircle2 size={14} className="text-indigo-600" /> Qualification Requirements (Contacted → Qualified)
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Customer Requirement <span className="text-indigo-600 font-normal">(Required for Qualification)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Enterprise CRM solution with 50 user licenses, automated lead scoring, and SAP integration"
                    value={editForm.requirement}
                    onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Budget (₹) <span className="text-indigo-600 font-normal">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 250000"
                      value={editForm.budget}
                      onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. Decision Maker <span className="text-indigo-600 font-normal">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma (CTO)"
                      value={editForm.decisionMaker}
                      onChange={(e) => setEditForm({ ...editForm, decisionMaker: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Expected Close Date <span className="text-indigo-600 font-normal">*</span>
                    </label>
                    <input
                      type="date"
                      value={editForm.expectedCloseDate}
                      onChange={(e) => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GENERAL LEAD INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={editForm.source}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROPOSAL MODAL */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    {leadQuotation || lead.proposalAmount ? 'Edit Proposal / Quotation' : 'Create & Send Proposal'}
                  </h3>
                  <p className="text-xs text-slate-500">Proposal requirements for {lead.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProposalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProposal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposal Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 250000"
                    value={proposalForm.amount}
                    onChange={(e) => setProposalForm({ ...proposalForm, amount: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposal Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={proposalForm.date}
                    onChange={(e) => setProposalForm({ ...proposalForm, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposal Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={proposalForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'Draft' | 'Sent';
                      setProposalForm({
                        ...proposalForm,
                        status: newStatus,
                        sentDate: newStatus === 'Sent' ? (proposalForm.sentDate || new Date().toISOString().split('T')[0]) : '',
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Draft">📝 Draft (Lead Remains Qualified)</option>
                    <option value="Sent">📤 Sent to Customer (Allows Proposal Stage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sent Date {proposalForm.status === 'Sent' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="date"
                    disabled={proposalForm.status !== 'Sent'}
                    value={proposalForm.sentDate}
                    onChange={(e) => setProposalForm({ ...proposalForm, sentDate: e.target.value })}
                    className={`w-full p-2.5 border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      proposalForm.status === 'Sent' ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-200 bg-slate-100 text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* STATUS HELPER BANNER */}
              {proposalForm.status === 'Draft' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
                  <span className="text-sm">📝</span>
                  <div>
                    <span className="font-bold">Draft Proposal:</span> This proposal draft will be saved. The lead will <strong>remain in "Qualified"</strong> until the proposal status is set to "Sent".
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2 animate-in fade-in">
                  <span className="text-sm">📤</span>
                  <div>
                    <span className="font-bold">Sent Proposal:</span> The proposal has been sent to the customer, which <strong>allows the lead to advance to "Proposal"</strong>.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Save Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOW UP FORM MODAL */}
      {showFollowUpForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">Schedule Follow-up</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select value={followUpForm.type} onChange={(e) => setFollowUpForm({...followUpForm, type: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date & Time</label>
                <input type="datetime-local" value={followUpForm.date} onChange={(e) => setFollowUpForm({...followUpForm, date: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea rows={2} placeholder="What needs to be discussed?" value={followUpForm.description} onChange={(e) => setFollowUpForm({...followUpForm, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowFollowUpForm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleAddFollowUp} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors">
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
