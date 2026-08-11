import React, { useState, useMemo } from 'react';
import { CrmView } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { formatINR, getLeadScoreColor } from '../utils/crmUtils';
import { 
  ChevronRight, ArrowLeft, MoreVertical, Edit2, Calendar, User, UserPlus, FileText, 
  CheckCircle2, Plus, Phone, Mail, Clock, MapPin, Building2, Download
} from 'lucide-react';

interface CrmLeadDetailsProps {
  leadId: string;
  onViewChange: (view: CrmView) => void;
}

type TabType = 'overview' | 'activities' | 'notes' | 'documents';

const leadStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const CrmLeadDetails: React.FC<CrmLeadDetailsProps> = ({ leadId, onViewChange }) => {
  const { leads, activities, notes, documents, followUps, updateLead, addActivity, addNote, addFollowUp, addDocument } = useApp();
  
  const lead = leads.find(l => l.id === leadId);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Forms visibility state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  
  // Form States
  const [activityForm, setActivityForm] = useState({ type: 'Call' as any, title: '', date: '', outcome: '' });
  const [noteContent, setNoteContent] = useState('');
  const [followUpForm, setFollowUpForm] = useState({ type: 'Call' as any, date: '', description: '' });

  const leadActivities = useMemo(() => activities.filter(a => a.relatedTo === leadId).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()), [activities, leadId]);
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

  const handleAddActivity = () => {
    if (!activityForm.title || !activityForm.date) return;
    addActivity({
      title: activityForm.title,
      type: activityForm.type,
      relatedTo: leadId,
      assignedTo: lead.assignedTo,
      dueDate: activityForm.date,
      priority: 'Medium',
      status: 'Completed',
      outcome: activityForm.outcome
    });
    setActivityForm({ type: 'Call', title: '', date: '', outcome: '' });
    setShowActivityForm(false);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">{lead.name}</h1>
            <div className="flex items-center text-sm text-slate-500 flex-wrap gap-2">
              <span className="flex items-center"><Building2 size={14} className="mr-1" /> {lead.company}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center"><User size={14} className="mr-1" /> {lead.contactPerson || lead.email}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {lead.stage}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-[#0f172a] font-semibold text-sm rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2">
              <Edit2 size={14} /> Edit
            </button>
            <button onClick={() => setShowActivityForm(true)} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 flex items-center gap-2">
              <Plus size={14} /> Add Activity
            </button>
            <div className="relative">
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50">
                <MoreVertical size={18} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Assign Owner</button>
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
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Sales Stage</p>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 z-0 transition-all duration-500" style={{ width: `${Math.max(0, (currentStageIndex / (leadStages.length - 1)) * 100)}%` }}></div>
            
            {leadStages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isLost = stage === 'Lost' && isCurrent;
              
              let bubbleColor = 'bg-slate-200 border-white text-transparent';
              if (isPast) bubbleColor = 'bg-indigo-500 border-white text-white';
              if (isCurrent) bubbleColor = 'bg-indigo-600 border-indigo-200 shadow-md shadow-indigo-500/30 text-white';
              if (isLost) bubbleColor = 'bg-rose-500 border-rose-200 text-white';

              return (
                <div key={stage} className="relative z-10 flex flex-col items-center group">
                  <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-colors ${bubbleColor}`}>
                    {isPast && <CheckCircle2 size={12} />}
                  </div>
                  <span className={`absolute top-8 text-[10px] font-bold whitespace-nowrap ${isCurrent ? (isLost ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400'}`}>
                    {stage}
                  </span>
                </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input type="date" value={activityForm.date} onChange={(e) => setActivityForm({...activityForm, date: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                  <input type="text" placeholder="E.g. Discussed pricing" value={activityForm.title} onChange={(e) => setActivityForm({...activityForm, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="sm:col-span-2">
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
                const Icon = isCall ? Phone : (isEmail ? Mail : CheckCircle2);
                const colorClass = isCall ? 'bg-emerald-100 text-emerald-600' : (isEmail ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600');

                return (
                  <div key={activity.id} className="relative pl-6">
                    <div className={`absolute -left-[13px] top-1 p-1 rounded-full border-2 border-white ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-[#0f172a]">{activity.title}</p>
                        <span className="text-xs text-slate-500">{activity.dueDate}</span>
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
