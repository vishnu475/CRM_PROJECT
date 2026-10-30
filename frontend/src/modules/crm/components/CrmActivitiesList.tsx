import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Activity } from '../../../types';
import {
  PhoneCall,
  Calendar,
  Mail,
  CheckSquare,
  Clock,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  MoreVertical,
  Check,
  User,
  ChevronDown,
} from 'lucide-react';

interface CrmActivitiesListProps {
  onViewChange?: (view: any) => void;
  onLeadSelect?: (leadId: string) => void;
  onCustomerSelect?: (customerId: string) => void;
  onOpportunitySelect?: (opportunityId: string) => void;
}

type FilterTab = 'all' | 'today' | 'upcoming' | 'overdue';

export const CrmActivitiesList: React.FC<CrmActivitiesListProps> = ({
  onViewChange,
  onLeadSelect,
  onCustomerSelect,
  onOpportunitySelect,
}) => {
  const {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    leads,
    customers,
    contacts,
    opportunities,
    userProfile,
  } = useApp();

  // Primary State
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Multi-criteria filter dropdown state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterRelationType, setFilterRelationType] = useState<string>('all');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<Activity['type']>('Call');
  const [formPurpose, setFormPurpose] = useState<NonNullable<Activity['purpose']>>('General');
  const [formRelationType, setFormRelationType] = useState<'lead' | 'customer' | 'opportunity' | 'contact' | 'general'>('lead');
  const [formSelectedEntityId, setFormSelectedEntityId] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('Sarah Jenkins');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('10:00');
  const [formPriority, setFormPriority] = useState<Activity['priority']>('Medium');
  const [formStatus, setFormStatus] = useState<Activity['status']>('Pending');
  const [formOutcome, setFormOutcome] = useState('');

  // Today ISO date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute status helper
  const getComputedStatus = (act: Activity): 'Completed' | 'Cancelled' | 'Overdue' | 'Upcoming' => {
    if (act.status === 'Completed') return 'Completed';
    if (act.status === 'Cancelled') return 'Cancelled';

    if (act.dueDate) {
      const actDate = act.dueDate.split('T')[0];
      if (actDate < todayStr) return 'Overdue';
      if (actDate > todayStr) return 'Upcoming';
      return 'Upcoming';
    }

    return act.status === 'Overdue' ? 'Overdue' : 'Upcoming';
  };

  // Helper: clean related entity resolution
  const getRelatedEntityInfo = (act: Activity) => {
    if (act.customerId) {
      const cust = customers.find((c) => c.id === act.customerId);
      if (cust) return { type: 'Customer' as const, id: cust.id, name: cust.customerName };
    }
    if (act.opportunityId) {
      const opp = opportunities.find((o) => o.id === act.opportunityId);
      if (opp) return { type: 'Opportunity' as const, id: opp.id, name: opp.name };
    }
    if (act.leadId) {
      const lead = leads.find((l) => l.id === act.leadId);
      if (lead) return { type: 'Lead' as const, id: lead.id, name: lead.name };
    }
    if (act.contactId) {
      const contact = contacts.find((c) => c.id === act.contactId);
      if (contact) return { type: 'Contact' as const, id: contact.id, name: contact.name };
    }

    if (act.relatedTo) {
      const raw = act.relatedTo.trim();
      if (/^lead\s*:\s*/i.test(raw)) {
        const cleanName = raw.replace(/^lead\s*:\s*/i, '').trim();
        const matchedLead = leads.find((l) => l.name === cleanName || l.id === cleanName);
        return { type: 'Lead' as const, id: matchedLead ? matchedLead.id : '', name: cleanName };
      }
      if (/^customer\s*:\s*/i.test(raw)) {
        const cleanName = raw.replace(/^customer\s*:\s*/i, '').trim();
        const matchedCust = customers.find((c) => c.customerName === cleanName || c.id === cleanName);
        return { type: 'Customer' as const, id: matchedCust ? matchedCust.id : '', name: cleanName };
      }
      if (/^opportunity\s*:\s*/i.test(raw)) {
        const cleanName = raw.replace(/^opportunity\s*:\s*/i, '').trim();
        const matchedOpp = opportunities.find((o) => o.name === cleanName || o.id === cleanName);
        return { type: 'Opportunity' as const, id: matchedOpp ? matchedOpp.id : '', name: cleanName };
      }

      const matchedLead = leads.find(
        (l) => raw === l.id || raw === l.name || raw.startsWith(`${l.name} `) || raw.includes(l.name)
      );
      if (matchedLead) return { type: 'Lead' as const, id: matchedLead.id, name: matchedLead.name };

      const matchedCust = customers.find(
        (c) => raw === c.id || raw === c.customerName || raw.includes(c.customerName)
      );
      if (matchedCust) return { type: 'Customer' as const, id: matchedCust.id, name: matchedCust.customerName };

      const matchedOpp = opportunities.find(
        (o) => raw === o.id || raw === o.name || raw.includes(o.name)
      );
      if (matchedOpp) return { type: 'Opportunity' as const, id: matchedOpp.id, name: matchedOpp.name };

      return { type: 'Customer' as const, id: '', name: raw };
    }

    return { type: 'General' as const, id: '', name: 'General Account' };
  };

  // 4 Summary Metrics Cards
  const metrics = useMemo(() => {
    let total = activities.length;
    let completed = 0;
    let upcoming = 0;
    let overdue = 0;

    activities.forEach((act) => {
      const computed = getComputedStatus(act);
      if (computed === 'Completed') completed++;
      else if (computed === 'Overdue') overdue++;
      else upcoming++;
    });

    return { total, completed, upcoming, overdue };
  }, [activities, todayStr]);

  // Unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.assignedTo) set.add(a.assignedTo);
    });
    return Array.from(set);
  }, [activities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const computedStatus = getComputedStatus(act);
      const actDate = act.dueDate ? act.dueDate.split('T')[0] : '';
      const entityInfo = getRelatedEntityInfo(act);

      // 1. Primary Tab Filter
      if (activeTab === 'today' && actDate !== todayStr) return false;
      if (activeTab === 'upcoming' && computedStatus !== 'Upcoming') return false;
      if (activeTab === 'overdue' && computedStatus !== 'Overdue') return false;

      // 2. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = (act.title || '').toLowerCase().includes(query);
        const matchesOutcome = (act.outcome || '').toLowerCase().includes(query);
        const matchesPurpose = (act.purpose || '').toLowerCase().includes(query);
        const matchesType = (act.type || '').toLowerCase().includes(query);
        const matchesAssignee = (act.assignedTo || '').toLowerCase().includes(query);
        const matchesRelated = (act.relatedTo || '').toLowerCase().includes(query);
        const matchesEntity = entityInfo.name.toLowerCase().includes(query);

        if (
          !matchesTitle &&
          !matchesOutcome &&
          !matchesPurpose &&
          !matchesType &&
          !matchesAssignee &&
          !matchesRelated &&
          !matchesEntity
        ) {
          return false;
        }
      }

      // 3. Multi-criteria Dropdown Filters
      if (filterType !== 'all' && act.type !== filterType) return false;
      if (filterPurpose !== 'all' && act.purpose !== filterPurpose) return false;
      if (filterStatus !== 'all' && computedStatus.toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (filterAssignee !== 'all' && act.assignedTo !== filterAssignee) return false;
      if (filterRelationType !== 'all' && entityInfo.type.toLowerCase() !== filterRelationType.toLowerCase()) return false;

      return true;
    });
  }, [
    activities,
    activeTab,
    searchTerm,
    filterType,
    filterPurpose,
    filterStatus,
    filterAssignee,
    filterRelationType,
    todayStr,
  ]);

  // Open Log Activity Modal
  const handleOpenAddModal = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormType('Call');
    setFormPurpose('General');
    setFormRelationType('lead');
    setFormSelectedEntityId(leads.length > 0 ? leads[0].id : '');
    setFormAssignedTo(userProfile?.name || 'Sarah Jenkins');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormDueTime('10:00');
    setFormPriority('Medium');
    setFormStatus('Pending');
    setFormOutcome('');
    setShowModal(true);
  };

  // Open Edit Activity Modal
  const handleOpenEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormTitle(act.title || '');
    setFormType(act.type || 'Call');
    setFormPurpose(act.purpose || 'General');

    if (act.customerId) {
      setFormRelationType('customer');
      setFormSelectedEntityId(act.customerId);
    } else if (act.opportunityId) {
      setFormRelationType('opportunity');
      setFormSelectedEntityId(act.opportunityId);
    } else if (act.leadId) {
      setFormRelationType('lead');
      setFormSelectedEntityId(act.leadId);
    } else if (act.contactId) {
      setFormRelationType('contact');
      setFormSelectedEntityId(act.contactId);
    } else {
      setFormRelationType('general');
      setFormSelectedEntityId('');
    }

    setFormAssignedTo(act.assignedTo || 'Sarah Jenkins');
    if (act.dueDate && act.dueDate.includes('T')) {
      const parts = act.dueDate.split('T');
      setFormDueDate(parts[0]);
      setFormDueTime(parts[1]?.substring(0, 5) || '10:00');
    } else {
      setFormDueDate(act.dueDate || '');
      setFormDueTime('10:00');
    }
    setFormPriority(act.priority || 'Medium');
    setFormStatus(act.status || 'Pending');
    setFormOutcome(act.outcome || '');
    setShowModal(true);
    setOpenActionMenuId(null);
  };

  // Save Activity Form
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let relatedToStr = 'General Account';
    let customerId: string | undefined = undefined;
    let opportunityId: string | undefined = undefined;
    let leadId: string | undefined = undefined;
    let contactId: string | undefined = undefined;

    if (formRelationType === 'lead' && formSelectedEntityId) {
      const lead = leads.find((l) => l.id === formSelectedEntityId);
      if (lead) {
        relatedToStr = lead.name;
        leadId = lead.id;
      }
    } else if (formRelationType === 'customer' && formSelectedEntityId) {
      const cust = customers.find((c) => c.id === formSelectedEntityId);
      if (cust) {
        relatedToStr = cust.customerName;
        customerId = cust.id;
      }
    } else if (formRelationType === 'opportunity' && formSelectedEntityId) {
      const opp = opportunities.find((o) => o.id === formSelectedEntityId);
      if (opp) {
        relatedToStr = opp.name;
        opportunityId = opp.id;
        customerId = opp.customerId;
      }
    } else if (formRelationType === 'contact' && formSelectedEntityId) {
      const contact = contacts.find((c) => c.id === formSelectedEntityId);
      if (contact) {
        relatedToStr = contact.name;
        contactId = contact.id;
        customerId = contact.customerId;
      }
    }

    const combinedDue = formDueTime ? `${formDueDate}T${formDueTime}:00` : formDueDate;

    if (editingActivity) {
      updateActivity(editingActivity.id, {
        title: formTitle.trim(),
        type: formType,
        purpose: formPurpose,
        relatedTo: relatedToStr,
        customerId,
        opportunityId,
        leadId,
        contactId,
        assignedTo: formAssignedTo,
        dueDate: combinedDue,
        priority: formPriority,
        status: formStatus,
        outcome: formOutcome,
      });
    } else {
      addActivity({
        title: formTitle.trim(),
        type: formType,
        purpose: formPurpose,
        relatedTo: relatedToStr,
        customerId,
        opportunityId,
        leadId,
        contactId,
        assignedTo: formAssignedTo,
        dueDate: combinedDue,
        priority: formPriority,
        status: formStatus,
        outcome: formOutcome,
      });
    }

    setShowModal(false);
  };

  const handleMarkCompleted = (act: Activity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateActivity(act.id, { status: 'Completed' });
    if (selectedActivity && selectedActivity.id === act.id) {
      setSelectedActivity({ ...selectedActivity, status: 'Completed' });
    }
    setOpenActionMenuId(null);
  };

  const handleDeleteActivity = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (deleteActivity) {
      await deleteActivity(id);
    }
    if (selectedActivity?.id === id) {
      setSelectedActivity(null);
    }
    setDeleteConfirmId(null);
    setOpenActionMenuId(null);
  };

  // Navigate to Related Entity Details
  const handleNavigateToEntity = (entityInfo: ReturnType<typeof getRelatedEntityInfo>, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (entityInfo.type === 'Lead' && entityInfo.id && onLeadSelect) {
      onLeadSelect(entityInfo.id);
    } else if (entityInfo.type === 'Customer' && entityInfo.id && onCustomerSelect) {
      onCustomerSelect(entityInfo.id);
    } else if (entityInfo.type === 'Opportunity' && entityInfo.id && onOpportunitySelect) {
      onOpportunitySelect(entityInfo.id);
    } else if (entityInfo.type === 'Contact' && onCustomerSelect) {
      const contact = contacts.find((c) => c.id === entityInfo.id);
      if (contact?.customerId) {
        onCustomerSelect(contact.customerId);
      }
    }
  };

  // Date & Time display helper
  const formatDateTimeDisplay = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '' };
    try {
      const hasTime = dateStr.includes('T') && dateStr.split('T')[1]?.length > 2;
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T10:00:00`);
      if (isNaN(d.getTime())) return { date: dateStr, time: '' };

      const formattedDate = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const formattedTime = hasTime
        ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '10:00 AM';

      return { date: formattedDate, time: formattedTime };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  // Type cell icon
  const renderTypeCell = (type: Activity['type']) => {
    let icon = <Clock size={13} className="text-slate-500" />;
    if (type === 'Call') icon = <PhoneCall size={13} className="text-blue-600" />;
    else if (type === 'Meeting') icon = <Calendar size={13} className="text-purple-600" />;
    else if (type === 'Email') icon = <Mail size={13} className="text-amber-600" />;
    else if (type === 'Task') icon = <CheckSquare size={13} className="text-emerald-600" />;

    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <span className="p-1 rounded bg-slate-100">{icon}</span>
        <span>{type}</span>
      </div>
    );
  };

  // Status badge
  const renderStatusBadge = (act: Activity) => {
    const computed = getComputedStatus(act);
    switch (computed) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Overdue
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Cancelled
          </span>
        );
      case 'Upcoming':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Upcoming
          </span>
        );
    }
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    filterPurpose !== 'all' ||
    filterStatus !== 'all' ||
    filterAssignee !== 'all' ||
    filterRelationType !== 'all';

  const resetFilters = () => {
    setFilterType('all');
    setFilterPurpose('all');
    setFilterStatus('all');
    setFilterAssignee('all');
    setFilterRelationType('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Activities</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track customer interactions, meetings, calls, emails, and follow-up activities.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Log Activity
        </button>
      </div>

      {/* 2. Simple Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL ACTIVITIES</div>
          <div className="text-2xl font-bold text-[#0f172a] mt-2">{metrics.total}</div>
          <div className="text-xs text-slate-400 mt-1">All activities</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">COMPLETED</div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{metrics.completed}</div>
          <div className="text-xs text-emerald-600/80 mt-1">Completed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">UPCOMING</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{metrics.upcoming}</div>
          <div className="text-xs text-blue-600/80 mt-1">Scheduled</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">OVERDUE</div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{metrics.overdue}</div>
          <div className="text-xs text-rose-600/80 mt-1">Needs attention</div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'overdue', label: 'Overdue' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Extra Filters Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                hasActiveFilters
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              <ChevronDown size={12} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilterDropdown && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Activity Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="all">All Types</option>
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Task">Task</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Purpose</label>
              <select
                value={filterPurpose}
                onChange={(e) => setFilterPurpose(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="all">All Purposes</option>
                <option value="General">General</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Customer Acceptance">Customer Acceptance</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Record Type</label>
              <select
                value={filterRelationType}
                onChange={(e) => setFilterRelationType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="all">All Records</option>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="opportunity">Opportunity</option>
                <option value="contact">Contact</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Assignee</label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="all">All Assignees</option>
                {uniqueAssignees.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Filter tags bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
            <span className="font-semibold text-slate-700">Active filters:</span>
            {filterType !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Type: {filterType}</span>}
            {filterPurpose !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Purpose: {filterPurpose}</span>}
            {filterStatus !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Status: {filterStatus}</span>}
            {filterRelationType !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Record: {filterRelationType}</span>}
            {filterAssignee !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Assignee: {filterAssignee}</span>}
            <button onClick={resetFilters} className="text-indigo-600 hover:underline font-semibold ml-auto">Clear filters</button>
          </div>
        )}
      </div>

      {/* 4. Simplified Activity Table */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
            <Clock size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activities.length === 0 ? 'No activities recorded' : 'No matching activities'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {activities.length === 0
              ? 'Log client calls, demo meetings, and follow-ups to track your customer relationship pipeline.'
              : 'Try clearing your search term or active filters to view all recorded activities.'}
          </p>
          {activities.length === 0 ? (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-indigo-700"
            >
              <Plus size={14} className="inline mr-1" /> Log Activity
            </button>
          ) : (
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-4">ACTIVITY</th>
                  <th className="p-3.5">RELATED TO</th>
                  <th className="p-3.5">TYPE</th>
                  <th className="p-3.5">DATE & TIME</th>
                  <th className="p-3.5">ASSIGNED TO</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5 pr-4 text-right">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredActivities.map((act) => {
                  const entityInfo = getRelatedEntityInfo(act);
                  const dateTime = formatDateTimeDisplay(act.dueDate);

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* 1. ACTIVITY Column */}
                      <td className="p-3.5 pl-4">
                        <div
                          onClick={() => setSelectedActivity(act)}
                          className="font-bold text-[#0f172a] hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {act.title}
                        </div>
                        {act.outcome && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                            {act.outcome}
                          </div>
                        )}
                      </td>

                      {/* 2. RELATED TO Column */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {entityInfo.type}
                          </span>
                          <span className="text-slate-300">•</span>
                          {entityInfo.id ? (
                            <button
                              onClick={(e) => handleNavigateToEntity(entityInfo, e)}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                            >
                              {entityInfo.name}
                            </button>
                          ) : (
                            <span className="font-medium text-slate-800">{entityInfo.name}</span>
                          )}
                        </div>
                      </td>

                      {/* 3. TYPE Column */}
                      <td className="p-3.5">{renderTypeCell(act.type)}</td>

                      {/* 4. DATE & TIME Column */}
                      <td className="p-3.5">
                        {dateTime.date !== '—' ? (
                          <div>
                            <div className="font-medium text-slate-900">{dateTime.date}</div>
                            {dateTime.time && <div className="text-[11px] text-slate-400">{dateTime.time}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 5. ASSIGNED TO Column */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                            {(act.assignedTo || 'SJ').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{act.assignedTo || 'Sarah Jenkins'}</span>
                        </div>
                      </td>

                      {/* 6. STATUS Column */}
                      <td className="p-3.5">{renderStatusBadge(act)}</td>

                      {/* 7. ACTIONS Column */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setOpenActionMenuId(openActionMenuId === act.id ? null : act.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openActionMenuId === act.id && (
                            <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-left">
                              <button
                                onClick={() => {
                                  setSelectedActivity(act);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                              >
                                <Eye size={13} /> View Details
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(act)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                              >
                                <Edit3 size={13} /> Edit Activity
                              </button>
                              {act.status !== 'Completed' && (
                                <button
                                  onClick={(e) => handleMarkCompleted(act, e)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-emerald-700 hover:bg-emerald-50 font-medium cursor-pointer"
                                >
                                  <Check size={13} /> Mark Completed
                                </button>
                              )}
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(act.id);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium cursor-pointer"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong>{filteredActivities.length}</strong> of <strong>{activities.length}</strong> activities</span>
          </div>
        </div>
      )}

      {/* 5. Activity Details Modal (Includes PURPOSE) */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Activity Details</span>
                <h3 className="text-lg font-bold text-[#0f172a] mt-0.5 leading-snug">{selectedActivity.title}</h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Type</span>
                  <div className="mt-1">{renderTypeCell(selectedActivity.type)}</div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Purpose</span>
                  <div className="mt-1 font-semibold text-slate-800">
                    {selectedActivity.purpose || 'General'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <div className="mt-1 font-medium text-slate-800">
                    {formatDateTimeDisplay(selectedActivity.dueDate).date !== '—'
                      ? `${formatDateTimeDisplay(selectedActivity.dueDate).date}, ${formatDateTimeDisplay(selectedActivity.dueDate).time}`
                      : '—'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned To</span>
                  <div className="mt-1 font-medium text-slate-800">
                    {selectedActivity.assignedTo || 'Sarah Jenkins'}
                  </div>
                </div>
              </div>

              {/* Related Record Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {(() => {
                  const entityInfo = getRelatedEntityInfo(selectedActivity);
                  return (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Related Record: </span>
                        <span className="font-bold text-slate-900 text-xs ml-1">{entityInfo.type} — {entityInfo.name}</span>
                      </div>
                      {entityInfo.id && (
                        <button
                          onClick={(e) => {
                            setSelectedActivity(null);
                            handleNavigateToEntity(entityInfo, e);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          View Details <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold">Current Status:</span>
                <div>{renderStatusBadge(selectedActivity)}</div>
              </div>

              {/* Description Notes */}
              <div>
                <span className="font-bold text-slate-800 block mb-1">Description</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {selectedActivity.outcome || <span className="text-slate-400 italic">No detailed description recorded.</span>}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(selectedActivity.id)}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold text-xs transition cursor-pointer"
              >
                Delete
              </button>

              <div className="flex items-center gap-2">
                {selectedActivity.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleMarkCompleted(selectedActivity)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs transition cursor-pointer"
                  >
                    Mark Completed
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const actToEdit = selectedActivity;
                    setSelectedActivity(null);
                    handleOpenEditModal(actToEdit);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Log / Edit Activity Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">
                  {editingActivity ? 'Edit Activity' : 'Log Activity'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record call logs, meeting discussions, email interactions, or tasks.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5 text-xs">
              {/* Title */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Requirement verification"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                />
              </div>

              {/* Type buttons */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Call', 'Meeting', 'Email', 'Task'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`p-2 rounded-xl border text-center font-semibold transition cursor-pointer ${
                        formType === t
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose</label>
                <select
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                >
                  <option value="General">General</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Customer Acceptance">Closing / Acceptance</option>
                </select>
              </div>

              {/* Related Record */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">Related To *</label>
                  <select
                    value={formRelationType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setFormRelationType(type);
                      if (type === 'lead') setFormSelectedEntityId(leads[0]?.id || '');
                      else if (type === 'customer') setFormSelectedEntityId(customers[0]?.id || '');
                      else if (type === 'opportunity') setFormSelectedEntityId(opportunities[0]?.id || '');
                      else if (type === 'contact') setFormSelectedEntityId(contacts[0]?.id || '');
                      else setFormSelectedEntityId('');
                    }}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="contact">Contact</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Select Entity</label>
                  {formRelationType === 'lead' ? (
                    <select
                      value={formSelectedEntityId}
                      onChange={(e) => setFormSelectedEntityId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                    >
                      {leads.length === 0 && <option value="">No Leads Available</option>}
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.company || 'Lead'})
                        </option>
                      ))}
                    </select>
                  ) : formRelationType === 'customer' ? (
                    <select
                      value={formSelectedEntityId}
                      onChange={(e) => setFormSelectedEntityId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                    >
                      {customers.length === 0 && <option value="">No Customers Available</option>}
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customerName}
                        </option>
                      ))}
                    </select>
                  ) : formRelationType === 'opportunity' ? (
                    <select
                      value={formSelectedEntityId}
                      onChange={(e) => setFormSelectedEntityId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                    >
                      {opportunities.length === 0 && <option value="">No Opportunities Available</option>}
                      {opportunities.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : formRelationType === 'contact' ? (
                    <select
                      value={formSelectedEntityId}
                      onChange={(e) => setFormSelectedEntityId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                    >
                      {contacts.length === 0 && <option value="">No Contacts Available</option>}
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="General Account"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date & Time *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Assignee & Status */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned To *</label>
                  <input
                    type="text"
                    required
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder="Employee name"
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="Pending">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Customer requirement discussion, key meeting notes..."
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
                >
                  {editingActivity ? 'Save Changes' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-3 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Delete Activity</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this activity record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteActivity(deleteConfirmId)}
                className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Delete Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
