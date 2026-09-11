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
  ExternalLink,
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
    userProfile,
  } = useApp();

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

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

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    relatedEntity: 'lead' as 'lead' | 'customer' | 'opportunity' | 'contact' | 'general',
    relatedId: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:00',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    assignedTo: userProfile?.name || 'Unassigned',
    reminder: '1_hour_before',
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
    const status = (f.status || 'scheduled').toLowerCase();
    const d = parseDueDate(f);
    const isCompleted = status === 'done' || status === 'completed';
    const isCancelled = status === 'cancelled';

    if (isCompleted) {
      return { key: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (isCancelled) {
      return { key: 'cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (d && isPastDate(d)) {
      return { key: 'overdue', label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (d && isTodayDate(d)) {
      return { key: 'today', label: 'Due Today', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (status === 'in_progress' || status === 'in-progress') {
      return { key: 'in_progress', label: 'In Progress', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    return { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  // Resolve related entity details
  const getEntityDetails = (f: FollowUp) => {
    const entityType = f.relatedEntity || f.related_entity || (f.leadId || f.lead_id ? 'lead' : f.customerId || f.customer_id ? 'customer' : f.opportunityId || f.opportunity_id ? 'opportunity' : f.contactId || f.contact_id ? 'contact' : 'general');
    const leadId = f.leadId || f.lead_id;
    const customerId = f.customerId || f.customer_id;
    const opportunityId = f.opportunityId || f.opportunity_id;
    const contactId = f.contactId || f.contact_id;

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
        const valStr = opp.value ? `$${Number(opp.value).toLocaleString()}` : '';
        return {
          type: 'Opportunity',
          typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          title: opp.name || 'Deal',
          subtitle: [opp.stage, valStr].filter(Boolean).join(' • ') || 'Opportunity',
          id: opp.id,
          onNavigate: onOpportunitySelect ? () => onOpportunitySelect(opp.id) : undefined,
        };
      }
    }

    if (entityType === 'contact' || contactId) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        return {
          type: 'Contact',
          typeBadge: 'bg-teal-50 text-teal-700 border-teal-200',
          title: contact.name || 'Contact',
          subtitle: contact.customerName || contact.designation || contact.email || 'Contact Record',
          id: contact.id,
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

  // Metrics computation
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

  // Assignee list for filter
  const uniqueAssignees = useMemo(() => {
    const list = new Set<string>();
    followUps.forEach((f) => {
      const a = f.assignedTo || f.assigned_to;
      if (a && a.trim()) list.add(a.trim());
    });
    return Array.from(list);
  }, [followUps]);

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
    contacts,
    opportunities,
  ]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingFollowUp(null);
    setFormData({
      title: '',
      relatedEntity: 'lead',
      relatedId: leads[0]?.id || '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '10:00',
      priority: 'Medium',
      assignedTo: userProfile?.name || 'Admin',
      reminder: '1_hour_before',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (f: FollowUp) => {
    setEditingFollowUp(f);
    const entityType = (f.relatedEntity || f.related_entity || (f.leadId ? 'lead' : f.customerId ? 'customer' : f.opportunityId ? 'opportunity' : f.contactId ? 'contact' : 'general')) as any;
    const relId = f.leadId || f.lead_id || f.customerId || f.customer_id || f.opportunityId || f.opportunity_id || f.contactId || f.contact_id || '';

    setFormData({
      title: f.title || f.action || '',
      relatedEntity: entityType,
      relatedId: relId,
      dueDate: f.dueDate ? f.dueDate.split('T')[0] : (f.due_date ? f.due_date.split('T')[0] : new Date().toISOString().split('T')[0]),
      dueTime: f.dueTime || f.due_time || '10:00',
      priority: (f.priority ? (f.priority.charAt(0).toUpperCase() + f.priority.slice(1).toLowerCase()) : 'Medium') as any,
      assignedTo: f.assignedTo || f.assigned_to || userProfile?.name || 'Admin',
      reminder: f.reminder || '1_hour_before',
      notes: f.notes || '',
    });
    setShowModal(true);
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload: Partial<FollowUp> = {
      title: formData.title.trim(),
      action: formData.title.trim(),
      relatedEntity: formData.relatedEntity,
      related_entity: formData.relatedEntity,
      dueDate: formData.dueDate,
      due_date: formData.dueDate,
      dueTime: formData.dueTime,
      due_time: formData.dueTime,
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      assigned_to: formData.assignedTo,
      reminder: formData.reminder,
      notes: formData.notes.trim(),
      leadId: formData.relatedEntity === 'lead' ? formData.relatedId : undefined,
      lead_id: formData.relatedEntity === 'lead' ? formData.relatedId : undefined,
      customerId: formData.relatedEntity === 'customer' ? formData.relatedId : undefined,
      customer_id: formData.relatedEntity === 'customer' ? formData.relatedId : undefined,
      opportunityId: formData.relatedEntity === 'opportunity' ? formData.relatedId : undefined,
      opportunity_id: formData.relatedEntity === 'opportunity' ? formData.relatedId : undefined,
      contactId: formData.relatedEntity === 'contact' ? formData.relatedId : undefined,
      contact_id: formData.relatedEntity === 'contact' ? formData.relatedId : undefined,
    };

    try {
      if (editingFollowUp) {
        await updateFollowUp(editingFollowUp.id, payload);
      } else {
        await addFollowUp({
          ...payload,
          status: 'Scheduled',
        } as any);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save follow-up:', err);
    }
  };

  const handleToggleComplete = async (f: FollowUp) => {
    const isComp = (f.status || '').toLowerCase() === 'completed' || (f.status || '').toLowerCase() === 'done';
    const nextStatus = isComp ? 'Scheduled' : 'Completed';
    try {
      await updateFollowUp(f.id, {
        status: nextStatus,
        completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
        completed_at: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
      });
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
        status: 'Scheduled',
        notes: updatedNotes,
      });

      if (selectedFollowUp && selectedFollowUp.id === rescheduleFollowUp.id) {
        setSelectedFollowUp({
          ...selectedFollowUp,
          dueDate: rescheduleDate,
          dueTime: rescheduleTime,
          status: 'Scheduled',
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
      setDeleteConfirmId(null);
      if (selectedFollowUp?.id === id) {
        setSelectedFollowUp(null);
      }
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
    }
  };

  const activeFilterCount = [
    filterPriority !== 'all',
    filterAssignee !== 'all',
    filterRelatedType !== 'all',
    filterDateRange !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilterPriority('all');
    setFilterAssignee('all');
    setFilterRelatedType('all');
    setFilterDateRange('all');
    setSearchTerm('');
  };

  const quickActionSuggestions = [
    'Follow up on quotation proposal',
    'Schedule product demonstration',
    'Call to confirm contract terms',
    'Send onboarding checklist',
    'Discuss feature requirements with decision maker',
    'Check budget approval status',
    'Quarterly check-in review meeting',
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Follow-ups</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer actions, reminders, and next steps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Follow-up</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer bg-white rounded-xl border p-4 transition-all hover:border-slate-300 ${
            activeTab === 'all' ? 'ring-2 ring-primary-500 border-primary-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Follow-ups</span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.total}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">All registered actions</span>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer bg-white rounded-xl border p-4 transition-all hover:border-slate-300 ${
            activeTab === 'pending' ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{metrics.pending}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">Awaiting execution</span>
        </div>

        <div
          onClick={() => setActiveTab('today')}
          className={`cursor-pointer bg-white rounded-xl border p-4 transition-all hover:border-slate-300 ${
            activeTab === 'today' ? 'ring-2 ring-amber-500 border-amber-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Due Today</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{metrics.dueToday}</div>
          <span className="text-xs text-amber-600 font-medium mt-0.5 block">Requires action today</span>
        </div>

        <div
          onClick={() => setActiveTab('overdue')}
          className={`cursor-pointer bg-white rounded-xl border p-4 transition-all hover:border-slate-300 ${
            activeTab === 'overdue' ? 'ring-2 ring-rose-500 border-rose-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Overdue</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{metrics.overdue}</div>
          <span className="text-xs text-rose-600 font-medium mt-0.5 block">Past scheduled date</span>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`cursor-pointer bg-white rounded-xl border p-4 transition-all hover:border-slate-300 col-span-2 sm:col-span-1 ${
            activeTab === 'completed' ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Completed</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{metrics.completed}</div>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 block">Successfully closed</span>
        </div>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs & Search/Filter Header */}
        <div className="border-b border-slate-200">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(
                [
                  { key: 'all', label: 'All', count: metrics.total },
                  { key: 'pending', label: 'Pending', count: metrics.pending },
                  { key: 'today', label: 'Due Today', count: metrics.dueToday, badgeColor: 'bg-amber-100 text-amber-800' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'overdue', label: 'Overdue', count: metrics.overdue, badgeColor: 'bg-rose-100 text-rose-800' },
                  { key: 'completed', label: 'Completed', count: metrics.completed },
                ] as { key: TabKey; label: string; count?: number; badgeColor?: string }[]
              ).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-slate-800 text-white'
                            : tab.badgeColor || 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search & Filter Controls */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search follow-ups, records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  showFilterDropdown || activeFilterCount > 0
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Secondary Filter Panel */}
          {showFilterDropdown && (
            <div className="bg-slate-50/80 px-4 sm:px-5 py-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Related Type</label>
                <select
                  value={filterRelatedType}
                  onChange={(e) => setFilterRelatedType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="all">All Entity Types</option>
                  <option value="lead">Lead</option>
                  <option value="customer">Customer</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="contact">Contact</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Assigned Owner</label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="all">All Assignees</option>
                  {uniqueAssignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Timing</label>
                <div className="flex items-center gap-2">
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Due Today</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium underline whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Action-Oriented Data Table */}
        <div className="overflow-x-auto">
          {filteredFollowUps.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <ListTodo className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No follow-ups found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeFilterCount > 0 || searchTerm
                  ? 'No actions match the selected filter criteria. Try resetting your search or filters.'
                  : 'You have no scheduled follow-ups. Stay on top of your deals and customer relationships by planning next actions.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {activeFilterCount > 0 || searchTerm ? (
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Follow-up</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-10 text-center">Done</th>
                  <th className="py-3 px-4 min-w-[220px]">Follow-up / Action</th>
                  <th className="py-3 px-4 min-w-[180px]">Related To</th>
                  <th className="py-3 px-4 min-w-[150px]">Due Date & Time</th>
                  <th className="py-3 px-4 min-w-[100px]">Priority</th>
                  <th className="py-3 px-4 min-w-[130px]">Assigned To</th>
                  <th className="py-3 px-4 min-w-[110px]">Status</th>
                  <th className="py-3 px-4 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredFollowUps.map((f) => {
                  const statusInfo = getFollowUpStatusInfo(f);
                  const isComp = statusInfo.key === 'completed';
                  const entity = getEntityDetails(f);
                  const dueDateObj = parseDueDate(f);

                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isComp ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      {/* Checkbox Quick Complete */}
                      <td className="py-3.5 px-4 text-center align-top">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(f)}
                          title={isComp ? 'Mark as Incomplete' : 'Mark as Complete'}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            isComp
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </td>

                      {/* Action Title & Notes Preview */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <span
                              onClick={() => setSelectedFollowUp(f)}
                              className={`font-semibold cursor-pointer hover:text-primary-600 transition-colors ${
                                isComp ? 'line-through text-slate-500 font-normal' : 'text-slate-900'
                              }`}
                            >
                              {f.title || f.action || 'Untitled Follow-up'}
                            </span>
                          </div>
                          {f.notes && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {f.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Related To (2-line display) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${entity.typeBadge}`}
                            >
                              {entity.type}
                            </span>
                            {entity.onNavigate ? (
                              <button
                                onClick={entity.onNavigate}
                                className="font-medium text-slate-800 hover:text-primary-600 flex items-center gap-1 group/link truncate max-w-[150px]"
                                title={`View ${entity.type} details`}
                              >
                                <span className="truncate">{entity.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-primary-600 flex-shrink-0" />
                              </button>
                            ) : (
                              <span className="font-medium text-slate-800 truncate max-w-[150px]">
                                {entity.title}
                              </span>
                            )}
                          </div>
                          {entity.subtitle && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {entity.subtitle}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Due Date & Time */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {dueDateObj
                                ? dueDateObj.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'No date'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            {(f.dueTime || f.due_time) && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {f.dueTime || f.due_time}
                              </span>
                            )}
                            {statusInfo.key === 'overdue' && !isComp && (
                              <span className="inline-block text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                Overdue
                              </span>
                            )}
                            {statusInfo.key === 'today' && !isComp && (
                              <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                                Today
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 align-top">
                        {getPriorityBadge(f.priority)}
                      </td>

                      {/* Assigned To */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {(f.assignedTo || f.assigned_to || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-700 truncate max-w-[110px]">
                            {f.assignedTo || f.assigned_to || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusInfo.color}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 px-4 align-top text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenReschedule(f)}
                            title="Reschedule Follow-up"
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedFollowUp(f)}
                            title="View Details"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenActionMenuId(openActionMenuId === f.id ? null : f.id)
                              }
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openActionMenuId === f.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-left">
                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleToggleComplete(f);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{isComp ? 'Mark Incomplete' : 'Mark Completed'}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenReschedule(f);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Reschedule</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenEditModal(f);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit Follow-up</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setDeleteConfirmId(f.id);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. ADD / EDIT FOLLOW-UP MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingFollowUp ? 'Edit Follow-up' : 'Create Next Action / Follow-up'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Schedule a proactive next step or reminder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4 text-xs">
              {/* Action Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on proposal, send contract draft, confirm demo"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900"
                />
                {/* Quick suggestions pills */}
                {!editingFollowUp && (
                  <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Quick:
                    </span>
                    {quickActionSuggestions.slice(0, 3).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setFormData({ ...formData, title: sug })}
                        className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-[10px] text-slate-600 whitespace-nowrap transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Record Type & Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Related Entity
                  </label>
                  <select
                    value={formData.relatedEntity}
                    onChange={(e) => {
                      const rel = e.target.value as any;
                      let defaultId = '';
                      if (rel === 'lead' && leads[0]) defaultId = leads[0].id;
                      if (rel === 'customer' && customers[0]) defaultId = customers[0].id;
                      if (rel === 'opportunity' && opportunities[0]) defaultId = opportunities[0].id;
                      if (rel === 'contact' && contacts[0]) defaultId = contacts[0].id;
                      setFormData({ ...formData, relatedEntity: rel, relatedId: defaultId });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-slate-900"
                  >
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="contact">Contact</option>
                    <option value="general">General / Internal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Record
                  </label>
                  {formData.relatedEntity === 'general' ? (
                    <input
                      type="text"
                      disabled
                      value="No linked record"
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-500"
                    />
                  ) : (
                    <select
                      value={formData.relatedId}
                      onChange={(e) => setFormData({ ...formData, relatedId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-slate-900"
                    >
                      <option value="">-- Select {formData.relatedEntity} --</option>
                      {formData.relatedEntity === 'lead' &&
                        leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} {l.company ? `(${l.company})` : ''}
                          </option>
                        ))}
                      {formData.relatedEntity === 'customer' &&
                        customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.customerName} {c.industry ? `(${c.industry})` : ''}
                          </option>
                        ))}
                      {formData.relatedEntity === 'opportunity' &&
                        opportunities.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      {formData.relatedEntity === 'contact' &&
                        contacts.map((ct) => (
                          <option key={ct.id} value={ct.id}>
                            {ct.name} {ct.customerName ? `(${ct.customerName})` : ''}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Priority & Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-slate-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Owner
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Reminder option */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reminder Alert
                </label>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <select
                    value={formData.reminder}
                    onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white text-slate-900"
                  >
                    <option value="at_time">At due time</option>
                    <option value="15_mins_before">15 minutes before</option>
                    <option value="1_hour_before">1 hour before</option>
                    <option value="1_day_before">1 day before</option>
                    <option value="none">No reminder</option>
                  </select>
                </div>
              </div>

              {/* Action Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Details & Context Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide context, agenda, or talking points for this next step..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all"
                >
                  {editingFollowUp ? 'Save Changes' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. RESCHEDULE MODAL */}
      {rescheduleFollowUp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reschedule Follow-up</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[240px]">
                    {rescheduleFollowUp.title || rescheduleFollowUp.action}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleFollowUp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="p-6 space-y-4 text-xs">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quick Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date();
                      setRescheduleDate(t.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-xs font-medium text-slate-700 text-center transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date();
                      t.setDate(t.getDate() + 1);
                      setRescheduleDate(t.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-xs font-medium text-slate-700 text-center transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date();
                      t.setDate(t.getDate() + 7);
                      setRescheduleDate(t.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-xs font-medium text-slate-700 text-center transition-colors"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              {/* Date & Time fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Reason note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reschedule Note / Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client requested callback on Friday after internal review"
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleFollowUp(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. FOLLOW-UP DETAILS MODAL */}
      {selectedFollowUp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                      getFollowUpStatusInfo(selectedFollowUp).color
                    }`}
                  >
                    {getFollowUpStatusInfo(selectedFollowUp).label}
                  </span>
                  {getPriorityBadge(selectedFollowUp.priority)}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedFollowUp.title || selectedFollowUp.action || 'Follow-up Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFollowUp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Linked Record Card */}
              {(() => {
                const entity = getEntityDetails(selectedFollowUp);
                return (
                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${entity.typeBadge}`}
                        >
                          {entity.type}
                        </span>
                        <span className="font-bold text-slate-900">{entity.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{entity.subtitle}</p>
                    </div>
                    {entity.onNavigate && (
                      <button
                        onClick={() => {
                          setSelectedFollowUp(null);
                          entity.onNavigate!();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-slate-700 font-medium shadow-xs transition-colors"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Schedule Info Grid */}
              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Due Date & Time</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {selectedFollowUp.dueDate || selectedFollowUp.due_date || 'Not set'}
                    </span>
                    {(selectedFollowUp.dueTime || selectedFollowUp.due_time) && (
                      <span className="text-slate-500 font-normal">
                        at {selectedFollowUp.dueTime || selectedFollowUp.due_time}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Assigned Owner</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {(selectedFollowUp.assignedTo || selectedFollowUp.assigned_to || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {selectedFollowUp.assignedTo || selectedFollowUp.assigned_to || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-1 font-semibold uppercase tracking-wider">
                  Action Context & Notes
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedFollowUp.notes || 'No additional notes provided for this action.'}
                </div>
              </div>

              {/* Reminder info */}
              {selectedFollowUp.reminder && selectedFollowUp.reminder !== 'none' && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Reminder set for: {selectedFollowUp.reminder.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const toDelete = selectedFollowUp.id;
                  setSelectedFollowUp(null);
                  setDeleteConfirmId(toDelete);
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toResched = selectedFollowUp;
                    setSelectedFollowUp(null);
                    handleOpenReschedule(toResched);
                  }}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => {
                    const toEdit = selectedFollowUp;
                    setSelectedFollowUp(null);
                    handleOpenEditModal(toEdit);
                  }}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium text-slate-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleComplete(selectedFollowUp)}
                  className={`px-4 py-1.5 rounded-lg font-medium text-white shadow-sm transition-all inline-flex items-center gap-1.5 ${
                    (selectedFollowUp.status || '').toLowerCase() === 'completed' || (selectedFollowUp.status || '').toLowerCase() === 'done'
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {(selectedFollowUp.status || '').toLowerCase() === 'completed' || (selectedFollowUp.status || '').toLowerCase() === 'done'
                      ? 'Mark Incomplete'
                      : 'Mark Completed'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4 animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
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
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-sm"
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
