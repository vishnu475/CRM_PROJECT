import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Activity } from '../../../types';
import { PhoneCall, Calendar, Mail, CheckCircle2, Clock, Plus, Search, Building, User } from 'lucide-react';

interface CrmActivitiesListProps {
  onViewChange?: (view: any) => void;
}

export const CrmActivitiesList: React.FC<CrmActivitiesListProps> = () => {
  const { activities, addActivity, leads } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newType, setNewType] = useState<Activity['type']>('Call');
  const [newTitle, setNewTitle] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newRelatedTo, setNewRelatedTo] = useState('');

  const filteredActivities = activities.filter(a =>
    (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.outcome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const actData: Omit<Activity, 'id'> = {
      type: newType,
      title: newTitle,
      relatedTo: newRelatedTo || 'General CRM Account',
      assignedTo: 'Sarah Jenkins',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      status: 'Completed',
      outcome: newOutcome,
    };

    await addActivity(actData);
    setNewTitle('');
    setNewOutcome('');
    setShowAddModal(false);
  };

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'Call': return <PhoneCall size={16} className="text-blue-500" />;
      case 'Meeting': return <Calendar size={16} className="text-purple-500" />;
      case 'Email': return <Mail size={16} className="text-amber-500" />;
      case 'Task': return <CheckCircle2 size={16} className="text-emerald-500" />;
      default: return <Clock size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-indigo-600" size={24} />
            CRM Activity Timeline & Follow-ups
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer interactions, calls, demo meetings, and scheduled follow-ups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60 bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={16} /> + Log Activity
          </button>
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No activity logs found. Log your first call or meeting!
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredActivities.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100">
                        {getTypeIcon(act.type)}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{act.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/60 text-slate-700 uppercase">
                        {act.type}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400">
                      {act.dueDate || 'Today'}
                    </span>
                  </div>

                  {act.outcome && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                      {act.outcome}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <User size={12} /> Assigned: {act.assignedTo || 'Sarah Jenkins'}
                    </span>
                    <span>Related to: <strong className="text-slate-700">{act.relatedTo}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Log Interaction / Follow-up</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Interaction Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Call', 'Meeting', 'Email', 'Task'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`p-2 rounded-xl border text-center font-semibold transition ${
                        newType === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discussed proposal pricing & timeline"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Associated Lead / Customer</label>
                <select
                  value={newRelatedTo}
                  onChange={(e) => setNewRelatedTo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="">-- Direct Account / General --</option>
                  {leads.map(l => (
                    <option key={l.id} value={`${l.name} (${l.company})`}>{l.name} ({l.company})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Meeting Notes / Discussion Summary</label>
                <textarea
                  rows={3}
                  placeholder="Key takeaways, action items, next scheduled touchpoint..."
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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
                  Log Interaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
