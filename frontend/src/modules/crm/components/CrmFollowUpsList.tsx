import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { FollowUp } from '../../../types';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  Edit3,
  Trash2,
  Check,
  MoreVertical,
  CheckCircle2,
  CalendarDays,
  ListTodo,
  AlertTriangle,
  Timer,
  Bell,
  Sparkles,
  ArrowUpRight,
  User,
  CheckCircle,
} from 'lucide-react';

interface CrmFollowUpsListProps {
  onViewChange?: (view: any) => void;
  onLeadSelect?: (leadId: string) => void;
  onCustomerSelect?: (customerId: string) => void;
  onOpportunitySelect?: (opportunityId: string) => void;
}

type TabKey = 'all' | 'pending' | 'today' | 'upcoming' | 'overdue' | 'completed';

export const CrmFollowUpsList: React.FC<CrmFollowUpsListProps> = ({
  onLeadSelect,
  onCustomerSelect,
  onOpportunitySelect,
}) => {
  const {
    followUps,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    leads,
    customers,
    contacts,
    opportunities,
    employees,
    userProfile,
  } = useApp();

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter criteria
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterRelatedType, setFilterRelatedType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [rescheduleFollowUp, setRescheduleFollowUp] = useState<FollowUp | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  // Form State & Error
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    relatedEntity: 'lead' as 'lead' | 'customer' | 'opportunity',
    relatedId: '',
    activityType: 'Call' as 'Call' | 'Email' | 'Meeting' | 'Task',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:00',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    assignedTo: userProfile?.name || (employees && employees.length > 0 ? employees[0].name : 'Sarah Jenkins'),
    notes: '',
  });

  // Date helper utilities
  const parseDueDate = (f: FollowUp): Date | null => {
    const dStr = f.dueDate || f.due_date;
    const tStr = f.dueTime || f.due_time;
    if (!dStr) return null;
    if (dStr.includes('T')) return new Date(dStr);
    if (tStr) return new Date(`${dStr}T${tStr}:00`);
    return new Date(`${dStr}T00:00:00`);
  };

  const isTodayDate = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  const isFutureDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date.getTime() > today.getTime();
  };

  // Status and Overdue resolver
  const getFollowUpStatusInfo = (f: FollowUp) => {
    const status = (f.status || 'pending').toLowerCase();
    const isCompleted = status === 'completed' || status === 'done';
    const isCancelled = status === 'cancelled';

    if (isCompleted) {
      return { key: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (isCancelled) {
      return { key: 'cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }

    const d = parseDueDate(f);
    if (d && isPastDate(d)) {
      return { key: 'overdue', label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (d && isTodayDate(d)) {
      return { key: 'today', label: 'Due Today', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { key: 'pending', label: 'Pending', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  // Resolve related entity details
  const getEntityDetails = (f: FollowUp) => {
    const entityType = (f.relatedEntity || f.related_entity || (f.leadId || f.lead_id ? 'lead' : f.customerId || f.customer_id ? 'customer' : f.opportunityId || f.opportunity_id ? 'opportunity' : 'general')).toLowerCase();
    const leadId = f.leadId || f.lead_id;
    const customerId = f.customerId || f.customer_id;
    const opportunityId = f.opportunityId || f.opportunity_id;

    if (entityType === 'lead' || leadId) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        return {
          type: 'Lead',
          typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
          title: lead.name || 'Unnamed Lead',
          subtitle: lead.company || lead.email || 'Lead Record',
          id: lead.id,
          onNavigate: onLeadSelect ? () => onLeadSelect(lead.id) : undefined,
        };
      }
    }

    if (entityType === 'customer' || customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        return {
          type: 'Customer',
          typeBadge: 'bg-purple-50 text-purple-700 border-purple-200',
          title: customer.customerName || 'Unnamed Customer',
          subtitle: customer.industry || customer.primaryContact?.email || 'Account',
          id: customer.id,
          onNavigate: onCustomerSelect ? () => onCustomerSelect(customer.id) : undefined,
        };
      }
    }

    if (entityType === 'opportunity' || opportunityId) {
      const opp = opportunities.find((o) => o.id === opportunityId);
      if (opp) {
        const valStr = opp.value ? `₹${Number(opp.value).toLocaleString('en-IN')}` : '';
        return {
          type: 'Opportunity',
          typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          title: opp.name || 'Deal',
          subtitle: [opp.customerName, valStr].filter(Boolean).join(' • ') || 'Opportunity',
          id: opp.id,
          onNavigate: onOpportunitySelect ? () => onOpportunitySelect(opp.id) : undefined,
        };
      }
    }

    return {
      type: 'General',
      typeBadge: 'bg-slate-100 text-slate-600 border-slate-200',
      title: f.relatedEntity || 'General Follow-up',
      subtitle: 'No linked record',
    };
  };

  // Metrics computation from persisted records
  const metrics = useMemo(() => {
    let total = followUps.length;
    let pending = 0;
    let dueToday = 0;
    let overdue = 0;
    let completed = 0;

    followUps.forEach((f) => {
      const statusInfo = getFollowUpStatusInfo(f);
      if (statusInfo.key === 'completed') {
        completed++;
      } else if (statusInfo.key === 'cancelled') {
        // counted in total
      } else {
        pending++;
        if (statusInfo.key === 'today') {
          dueToday++;
        } else if (statusInfo.key === 'overdue') {
          overdue++;
        }
      }
    });

    return { total, pending, dueToday, overdue, completed };
  }, [followUps]);

  // Priority styling
  const getPriorityBadge = (priority?: string) => {
    const p = (priority || 'medium').toLowerCase();
    switch (p) {
      case 'urgent':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Urgent</span>;
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">High</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">Low</span>;
      case 'medium':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Medium</span>;
    }
  };

  // Assignees list for filter and form
  const availableAssignees = useMemo(() => {
    const set = new Set<string>();
    if (employees && employees.length > 0) {
      employees.forEach(e => set.add(e.name));
    }
    if (userProfile?.name) set.add(userProfile.name);
    set.add('Sarah Jenkins');
    set.add('John Doe');
    set.add('Admin');

    followUps.forEach(f => {
      const a = f.assignedTo || f.assigned_to;
      if (a && a.trim()) set.add(a.trim());
    });

    return Array.from(set);
  }, [employees, userProfile, followUps]);

  // Filter and Search logic
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      const statusInfo = getFollowUpStatusInfo(f);
      const isCompleted = statusInfo.key === 'completed';
      const d = parseDueDate(f);

      // Tab filtering
      if (activeTab === 'pending') {
        if (isCompleted || statusInfo.key === 'cancelled') return false;
      } else if (activeTab === 'today') {
        if (statusInfo.key !== 'today' || isCompleted) return false;
      } else if (activeTab === 'upcoming') {
        if (!d || !isFutureDate(d) || isCompleted) return false;
      } else if (activeTab === 'overdue') {
        if (statusInfo.key !== 'overdue' || isCompleted) return false;
      } else if (activeTab === 'completed') {
        if (!isCompleted) return false;
      }

      // Priority filter
      if (filterPriority !== 'all') {
        const p = (f.priority || 'medium').toLowerCase();
        if (p !== filterPriority.toLowerCase()) return false;
      }

      // Assignee filter
      if (filterAssignee !== 'all') {
        const a = f.assignedTo || f.assigned_to || 'Unassigned';
        if (a !== filterAssignee) return false;
      }

      // Related Entity Type filter
      if (filterRelatedType !== 'all') {
        const entityDetails = getEntityDetails(f);
        if (entityDetails.type.toLowerCase() !== filterRelatedType.toLowerCase()) return false;
      }

      // Date Range filter
      if (filterDateRange !== 'all' && d) {
        if (filterDateRange === 'today' && !isTodayDate(d)) return false;
        if (filterDateRange === 'overdue' && !isPastDate(d)) return false;
        if (filterDateRange === 'upcoming' && !isFutureDate(d)) return false;
      }

      // Search Term filtering
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const title = (f.title || f.action || '').toLowerCase();
        const notes = (f.notes || '').toLowerCase();
        const assignee = (f.assignedTo || f.assigned_to || '').toLowerCase();
        const entityDetails = getEntityDetails(f);
        const entityTitle = entityDetails.title.toLowerCase();
        const entitySub = entityDetails.subtitle.toLowerCase();

        return (
          title.includes(term) ||
          notes.includes(term) ||
          assignee.includes(term) ||
          entityTitle.includes(term) ||
          entitySub.includes(term)
        );
      }

      return true;
    }).sort((a, b) => {
      const da = parseDueDate(a)?.getTime() || 0;
      const db = parseDueDate(b)?.getTime() || 0;
      return da - db;
    });
  }, [
    followUps,
    activeTab,
    filterPriority,
    filterAssignee,
    filterRelatedType,
    filterDateRange,
    searchTerm,
    leads,
    customers,
    opportunities,
  ]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingFollowUp(null);
    setFormError(null);
    const defaultRel = 'lead';
    const defaultRelId = leads[0]?.id || '';

    setFormData({
      title: '',
      relatedEntity: defaultRel,
      relatedId: defaultRelId,
      activityType: 'Call',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '10:00',
      priority: 'Medium',
      assignedTo: userProfile?.name || availableAssignees[0] || 'Sarah Jenkins',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (f: FollowUp) => {
    setEditingFollowUp(f);
    setFormError(null);
    const entityType = (f.relatedEntity || f.related_entity || (f.leadId ? 'lead' : f.customerId ? 'customer' : f.opportunityId ? 'opportunity' : 'lead')) as 'lead' | 'customer' | 'opportunity';
    const relId = f.leadId || f.lead_id || f.customerId || f.customer_id || f.opportunityId || f.opportunity_id || '';

    setFormData({
      title: f.title || f.action || '',
      relatedEntity: entityType,
      relatedId: relId,
      activityType: (f.activityType || f.action || 'Call') as any,
      dueDate: f.dueDate ? f.dueDate.split('T')[0] : (f.due_date ? f.due_date.split('T')[0] : new Date().toISOString().split('T')[0]),
      dueTime: f.dueTime || f.due_time || '10:00',
      priority: (f.priority ? (f.priority.charAt(0).toUpperCase() + f.priority.slice(1).toLowerCase()) : 'Medium') as any,
      assignedTo: f.assignedTo || f.assigned_to || userProfile?.name || 'Sarah Jenkins',
      notes: f.notes || '',
    });
    setShowModal(true);
  };

  const handleRelatedEntityChange = (newRel: 'lead' | 'customer' | 'opportunity') => {
    let newRelId = '';
    if (newRel === 'lead') newRelId = leads[0]?.id || '';
    if (newRel === 'customer') newRelId = customers[0]?.id || '';
    if (newRel === 'opportunity') newRelId = opportunities[0]?.id || '';

    setFormData((prev) => ({
      ...prev,
      relatedEntity: newRel,
      relatedId: newRelId,
    }));
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.title.trim()) {
      setFormError('Follow-up / Action title is required.');
      return;
    }
    if (!formData.relatedEntity) {
      setFormError('Related To category is required.');
      return;
    }
    if (!formData.relatedId) {
      setFormError('Please select a valid record.');
      return;
    }
    if (!formData.activityType) {
      setFormError('Follow-up Type is required.');
      return;
    }
    if (!formData.dueDate) {
      setFormError('Due Date is required.');
      return;
    }
    if (!formData.priority) {
      setFormError('Priority is required.');
      return;
    }
    if (!formData.assignedTo) {
      setFormError('Assigned Owner is required.');
      return;
    }

    const payload: Partial<FollowUp> = {
      title: formData.title.trim(),
      action: formData.title.trim(),
      relatedEntity: formData.relatedEntity,
      related_entity: formData.relatedEntity,
      activityType: formData.activityType,
      dueDate: formData.dueDate,
      due_date: formData.dueDate,
      dueTime: formData.dueTime,
      due_time: formData.dueTime,
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      assigned_to: formData.assignedTo,
      notes: formData.notes.trim(),
      leadId: formData.relatedEntity === 'lead' ? formData.relatedId : undefined,
      lead_id: formData.relatedEntity === 'lead' ? formData.relatedId : undefined,
      customerId: formData.relatedEntity === 'customer' ? formData.relatedId : undefined,
      customer_id: formData.relatedEntity === 'customer' ? formData.relatedId : undefined,
      opportunityId: formData.relatedEntity === 'opportunity' ? formData.relatedId : undefined,
      opportunity_id: formData.relatedEntity === 'opportunity' ? formData.relatedId : undefined,
    };

    try {
      if (editingFollowUp) {
        await updateFollowUp(editingFollowUp.id, payload);
        showToast('Follow-up updated successfully');
      } else {
        await addFollowUp({
          ...payload,
          status: 'Pending',
        } as any);
        showToast('Follow-up created successfully');
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Failed to save follow-up:', err);
      setFormError(err?.message || 'Failed to save follow-up. Please check your data and try again.');
    }
  };

  const handleToggleComplete = async (f: FollowUp) => {
    const isComp = (f.status || '').toLowerCase() === 'completed' || (f.status || '').toLowerCase() === 'done';
    const nextStatus = isComp ? 'Pending' : 'Completed';
    try {
      await updateFollowUp(f.id, {
        status: nextStatus,
        completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
        completed_at: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
      });
      showToast(nextStatus === 'Completed' ? 'Follow-up marked as completed' : 'Follow-up marked as pending');
      if (selectedFollowUp && selectedFollowUp.id === f.id) {
        setSelectedFollowUp({ ...selectedFollowUp, status: nextStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleOpenReschedule = (f: FollowUp) => {
    setRescheduleFollowUp(f);
    const existingDate = f.dueDate ? f.dueDate.split('T')[0] : (f.due_date ? f.due_date.split('T')[0] : '');
    setRescheduleDate(existingDate || new Date().toISOString().split('T')[0]);
    setRescheduleTime(f.dueTime || f.due_time || '10:00');
    setRescheduleNote('');
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleFollowUp || !rescheduleDate) return;

    try {
      const updatedNotes = rescheduleNote.trim()
        ? `${rescheduleFollowUp.notes || ''}\n[Rescheduled on ${new Date().toLocaleDateString()}]: ${rescheduleNote.trim()}`.trim()
        : rescheduleFollowUp.notes;

      await updateFollowUp(rescheduleFollowUp.id, {
        dueDate: rescheduleDate,
        due_date: rescheduleDate,
        dueTime: rescheduleTime,
        due_time: rescheduleTime,
        status: 'Pending',
        notes: updatedNotes,
      });

      showToast('Follow-up rescheduled successfully');

      if (selectedFollowUp && selectedFollowUp.id === rescheduleFollowUp.id) {
        setSelectedFollowUp({
          ...selectedFollowUp,
          dueDate: rescheduleDate,
          dueTime: rescheduleTime,
          status: 'Pending',
          notes: updatedNotes,
        });
      }
      setRescheduleFollowUp(null);
    } catch (err) {
      console.error('Failed to reschedule follow-up:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFollowUp(id);
      showToast('Follow-up deleted successfully');
      setDeleteConfirmId(null);
      if (selectedFollowUp?.id === id) {
        setSelectedFollowUp(null);
      }
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <ListTodo className="text-indigo-600" size={24} />
            Follow-ups &amp; Next Actions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track, schedule, and complete sales follow-up activities across your pipeline.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} />
          <span>+ Add Follow-up</span>
        </button>
      </div>

      {/* 1. METRICS / KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Follow-ups</span>
            <ListTodo className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
          <span className="text-[10px] text-slate-400 mt-1">All recorded actions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">{metrics.pending}</p>
          <span className="text-[10px] text-slate-400 mt-1">Open next steps</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Due Today</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{metrics.dueToday}</p>
          <span className="text-[10px] text-slate-400 mt-1">Action needed today</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{metrics.overdue}</p>
          <span className="text-[10px] text-slate-400 mt-1">Past due date</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{metrics.completed}</p>
          <span className="text-[10px] text-slate-400 mt-1">Successfully closed</span>
        </div>
      </div>

      {/* 2. FILTER TABS & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl">
            {(
              [
                { key: 'all', label: 'All', count: metrics.total },
                { key: 'pending', label: 'Pending', count: metrics.pending },
                { key: 'today', label: 'Due Today', count: metrics.dueToday },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'overdue', label: 'Overdue', count: metrics.overdue },
                { key: 'completed', label: 'Completed', count: metrics.completed },
              ] as { key: TabKey; label: string; count?: number }[]
            ).map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Filter Trigger */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search action, title, lead, owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                showFilterDropdown || filterPriority !== 'all' || filterAssignee !== 'all' || filterRelatedType !== 'all'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilterDropdown && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assignee</label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800"
              >
                <option value="all">All Owners</option>
                {availableAssignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Related Type</label>
              <select
                value={filterRelatedType}
                onChange={(e) => setFilterRelatedType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800"
              >
                <option value="all">All Entities</option>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="opportunity">Opportunity</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterPriority('all');
                  setFilterAssignee('all');
                  setFilterRelatedType('all');
                  setFilterDateRange('all');
                }}
                className="w-full px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* TABLE DISPLAY */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-3 w-8">#</th>
                <th className="p-3">Follow-up / Action</th>
                <th className="p-3">Related To</th>
                <th className="p-3">Type</th>
                <th className="p-3">Due Date &amp; Time</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFollowUps.length > 0 ? (
                filteredFollowUps.map((f, idx) => {
                  const statusInfo = getFollowUpStatusInfo(f);
                  const entity = getEntityDetails(f);
                  const dueDateObj = parseDueDate(f);
                  const displayDate = dueDateObj
                    ? dueDateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                    : f.dueDate || f.due_date || 'No Date';
                  const displayTime = f.dueTime || f.due_time || '10:00';
                  const actionText = f.title || f.action || 'Follow up with client';

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                      {/* Follow-up / Action */}
                      <td className="p-3">
                        <div className="font-bold text-[#0f172a] hover:text-indigo-600 cursor-pointer" onClick={() => setSelectedFollowUp(f)}>
                          {actionText}
                        </div>
                        {f.notes && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{f.notes}</div>
                        )}
                      </td>

                      {/* Related To */}
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${entity.typeBadge}`}
                          >
                            {entity.type}
                          </span>
                          <div
                            className={`font-semibold text-slate-800 ${
                              entity.onNavigate ? 'hover:text-indigo-600 cursor-pointer underline decoration-dotted' : ''
                            }`}
                            onClick={() => entity.onNavigate && entity.onNavigate()}
                          >
                            {entity.title}
                          </div>
                          {entity.subtitle && (
                            <div className="text-[10px] text-slate-400">{entity.subtitle}</div>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          {f.activityType || f.action || 'Call'}
                        </span>
                      </td>

                      {/* Due Date & Time */}
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {displayDate}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-slate-400" />
                            {displayTime}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="p-3">{getPriorityBadge(f.priority)}</td>

                      {/* Assigned Owner */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {(f.assignedTo || f.assigned_to || f.owner || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700">{f.assignedTo || f.assigned_to || f.owner || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Mark Complete"
                            onClick={() => handleToggleComplete(f)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              statusInfo.key === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                            }`}
                          >
                            <Check size={14} className="stroke-[2.5]" />
                          </button>

                          <button
                            title="View Details"
                            onClick={() => setSelectedFollowUp(f)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            title="Edit Follow-up"
                            onClick={() => handleOpenEditModal(f)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            title="Reschedule"
                            onClick={() => handleOpenReschedule(f)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
                          >
                            <CalendarDays size={14} />
                          </button>

                          <button
                            title="Delete"
                            onClick={() => setDeleteConfirmId(f.id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <ListTodo className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No follow-ups found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search criteria or click "+ Add Follow-up" to schedule a new action.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CREATE / EDIT FOLLOW-UP MODAL */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="text-indigo-600" size={18} />
                <span>{editingFollowUp ? 'Edit Follow-up' : 'Create Follow-up'}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4">
              {/* A. Follow-up / Action */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Follow-up / Action <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call customer for proposal feedback"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              {/* B & C. Related To & Select Record */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Related To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.relatedEntity}
                    onChange={(e) => handleRelatedEntityChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-semibold"
                  >
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="opportunity">Opportunity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Record <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.relatedId}
                    onChange={(e) => setFormData({ ...formData, relatedId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-medium"
                  >
                    <option value="">-- Select Record --</option>
                    {formData.relatedEntity === 'lead' &&
                      leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.company ? `- ${l.company}` : ''}
                        </option>
                      ))}
                    {formData.relatedEntity === 'customer' &&
                      customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customerName} {c.industry ? `- ${c.industry}` : ''}
                        </option>
                      ))}
                    {formData.relatedEntity === 'opportunity' &&
                      opportunities.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} {o.customerName ? `- ${o.customerName}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* D & G. Follow-up Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Follow-up Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.activityType}
                    onChange={(e) => setFormData({ ...formData, activityType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-semibold"
                  >
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Task">Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* E & F. Due Date & Due Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* H. Assigned To */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned To <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-medium"
                >
                  {availableAssignees.map((ownerName) => (
                    <option key={ownerName} value={ownerName}>
                      {ownerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* I. Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Ask whether the customer has reviewed the proposal..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
                >
                  {editingFollowUp ? 'Save Changes' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. DETAILS VIEW MODAL */}
      {/* ============================================================ */}
      {selectedFollowUp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    getFollowUpStatusInfo(selectedFollowUp).color
                  }`}
                >
                  {getFollowUpStatusInfo(selectedFollowUp).label}
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedFollowUp.id}</span>
              </div>
              <button
                onClick={() => setSelectedFollowUp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedFollowUp.title || selectedFollowUp.action}</h3>
                <p className="text-xs text-slate-500 mt-1">Type: {selectedFollowUp.activityType || 'Call'}</p>
              </div>

              {/* Related Entity */}
              {(() => {
                const entity = getEntityDetails(selectedFollowUp);
                return (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${entity.typeBadge}`}>
                          {entity.type}
                        </span>
                        <span className="font-bold text-slate-900">{entity.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{entity.subtitle}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Due Date &amp; Time</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{selectedFollowUp.dueDate || selectedFollowUp.due_date || 'Not set'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">at {selectedFollowUp.dueTime || selectedFollowUp.due_time || '10:00'}</div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Assigned Owner</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <User size={12} className="text-slate-400" />
                    <span>{selectedFollowUp.assignedTo || selectedFollowUp.assigned_to || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Action Context &amp; Notes</span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-wrap">
                  {selectedFollowUp.notes || 'No notes provided.'}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const toDelete = selectedFollowUp.id;
                  setSelectedFollowUp(null);
                  setDeleteConfirmId(toDelete);
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toResched = selectedFollowUp;
                    setSelectedFollowUp(null);
                    handleOpenReschedule(toResched);
                  }}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleToggleComplete(selectedFollowUp)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>
                    {(selectedFollowUp.status || '').toLowerCase() === 'completed' ? 'Mark Pending' : 'Mark Completed'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. RESCHEDULE MODAL */}
      {/* ============================================================ */}
      {rescheduleFollowUp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="text-amber-500" size={18} />
                <span>Reschedule Follow-up</span>
              </h3>
              <button onClick={() => setRescheduleFollowUp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Date *</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rescheduling</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client requested to connect next week..."
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleFollowUp(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4 animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Follow-up?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this scheduled follow-up action? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
