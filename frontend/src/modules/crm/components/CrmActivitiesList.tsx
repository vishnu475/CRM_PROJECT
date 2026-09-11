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
  ChevronDown,
  List,
  GitCommit,
  AlertCircle,
  User,
  Check,
  RotateCcw,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';

interface CrmActivitiesListProps {
  onViewChange?: (view: any) => void;
  onLeadSelect?: (leadId: string) => void;
  onCustomerSelect?: (customerId: string) => void;
  onOpportunitySelect?: (opportunityId: string) => void;
}

type FilterTab = 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';
type ViewMode = 'list' | 'timeline';

export const CrmActivitiesList: React.FC<CrmActivitiesListProps> = ({
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

  // State
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Multi-criteria filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterRelationType, setFilterRelationType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');

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

  // Today normalized
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Helper: compute status based on due date and actual status
  const getComputedStatus = (act: Activity): 'Completed' | 'Cancelled' | 'Overdue' | 'Upcoming' | 'Scheduled' => {
    if (act.status === 'Completed') return 'Completed';
    if (act.status === 'Cancelled') return 'Cancelled';

    if (act.dueDate) {
      const actDate = act.dueDate.split('T')[0];
      if (actDate < todayStr) return 'Overdue';
      if (actDate > todayStr) return 'Upcoming';
      return 'Scheduled';
    }

    return act.status === 'Overdue' ? 'Overdue' : 'Scheduled';
  };

  // Helper: clean related entity resolution
  const getRelatedEntityInfo = (act: Activity) => {
    // 1. Direct relational foreign keys
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

    // 2. String parsing / matching
    if (act.relatedTo) {
      const raw = act.relatedTo.trim();

      // Check if raw starts with LEAD / CUSTOMER / OPPORTUNITY / CONTACT
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

      // Exact match with Leads
      const matchedLead = leads.find(
        (l) => raw === l.id || raw === l.name || raw.startsWith(`${l.name} `) || raw.includes(l.name)
      );
      if (matchedLead) return { type: 'Lead' as const, id: matchedLead.id, name: matchedLead.name };

      // Exact match with Customers
      const matchedCust = customers.find(
        (c) => raw === c.id || raw === c.customerName || raw.includes(c.customerName)
      );
      if (matchedCust) return { type: 'Customer' as const, id: matchedCust.id, name: matchedCust.customerName };

      // Exact match with Opportunities
      const matchedOpp = opportunities.find(
        (o) => raw === o.id || raw === o.name || raw.includes(o.name)
      );
      if (matchedOpp) return { type: 'Opportunity' as const, id: matchedOpp.id, name: matchedOpp.name };

      // Exact match with Contacts
      const matchedContact = contacts.find(
        (c) => raw === c.id || raw === c.name || raw.includes(c.name)
      );
      if (matchedContact) return { type: 'Contact' as const, id: matchedContact.id, name: matchedContact.name };

      // Default fallback
      return { type: 'Customer' as const, id: '', name: raw };
    }

    return { type: 'General' as const, id: '', name: 'General Account' };
  };

  // Metrics summary
  const metrics = useMemo(() => {
    let total = activities.length;
    let completed = 0;
    let upcoming = 0;
    let overdue = 0;
    let todayCount = 0;

    activities.forEach((act) => {
      const computed = getComputedStatus(act);
      if (computed === 'Completed') completed++;
      else if (computed === 'Overdue') overdue++;
      else if (computed === 'Upcoming' || computed === 'Scheduled') upcoming++;

      if (act.dueDate && act.dueDate.split('T')[0] === todayStr) {
        todayCount++;
      }
    });

    return { total, completed, upcoming, overdue, todayCount };
  }, [activities, todayStr]);

  // Unique assignees
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.assignedTo) set.add(a.assignedTo);
    });
    return Array.from(set);
  }, [activities]);

  // Filtering Logic
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const computedStatus = getComputedStatus(act);
      const actDate = act.dueDate ? act.dueDate.split('T')[0] : '';
      const entityInfo = getRelatedEntityInfo(act);

      // 1. Tab filter
      if (activeTab === 'today' && actDate !== todayStr) return false;
      if (activeTab === 'upcoming' && computedStatus !== 'Upcoming' && computedStatus !== 'Scheduled') return false;
      if (activeTab === 'completed' && computedStatus !== 'Completed') return false;
      if (activeTab === 'overdue' && computedStatus !== 'Overdue') return false;

      // 2. Search query
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

      // 3. Dropdown filters
      if (filterType !== 'all' && act.type !== filterType) return false;
      if (filterPurpose !== 'all' && act.purpose !== filterPurpose) return false;
      if (filterStatus !== 'all' && computedStatus.toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (filterAssignee !== 'all' && act.assignedTo !== filterAssignee) return false;
      if (filterRelationType !== 'all' && entityInfo.type.toLowerCase() !== filterRelationType.toLowerCase()) return false;

      // Date range filter
      if (filterDateRange !== 'all') {
        if (!actDate) return false;
        if (filterDateRange === 'today' && actDate !== todayStr) return false;
        if (filterDateRange === 'tomorrow') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (actDate !== tomorrow.toISOString().split('T')[0]) return false;
        }
        if (filterDateRange === 'thisweek') {
          const now = new Date();
          const next7 = new Date();
          next7.setDate(now.getDate() + 7);
          const next7Str = next7.toISOString().split('T')[0];
          if (actDate < todayStr || actDate > next7Str) return false;
        }
        if (filterDateRange === 'overdue' && computedStatus !== 'Overdue') return false;
      }

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
    filterDateRange,
    todayStr,
  ]);

  // Open Add Modal
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

  // Open Edit Modal
  const handleOpenEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormTitle(act.title || '');
    setFormType(act.type || 'Call');
    setFormPurpose(act.purpose || 'General');

    // Detect relation
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

  // Save Activity
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
        outcome: formOutcome.trim(),
      });

      if (selectedActivity && selectedActivity.id === editingActivity.id) {
        setSelectedActivity({
          ...selectedActivity,
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
          outcome: formOutcome.trim(),
        });
      }
    } else {
      const newAct: Omit<Activity, 'id'> = {
        title: formTitle.trim(),
        type: formType,
        purpose: formPurpose,
        relatedTo: relatedToStr,
        customerId,
        opportunityId,
        leadId,
        contactId,
        assignedTo: formAssignedTo,
        dueDate: combinedDue || todayStr,
        priority: formPriority,
        status: formStatus,
        outcome: formOutcome.trim(),
      };
      await addActivity(newAct);
    }

    setShowModal(false);
  };

  // Mark Completed
  const handleMarkCompleted = (act: Activity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateActivity(act.id, { status: 'Completed' });
    if (selectedActivity && selectedActivity.id === act.id) {
      setSelectedActivity({ ...selectedActivity, status: 'Completed' });
    }
    setOpenActionMenuId(null);
  };

  // Cancel Activity
  const handleCancelActivity = (act: Activity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateActivity(act.id, { status: 'Cancelled' });
    if (selectedActivity && selectedActivity.id === act.id) {
      setSelectedActivity({ ...selectedActivity, status: 'Cancelled' });
    }
    setOpenActionMenuId(null);
  };

  // Delete Activity
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

  // Open related record
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

  // Date formatter with time
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

  // Clean Type icon & text
  const renderTypeCell = (type: Activity['type']) => {
    let icon = <Clock size={13} className="text-slate-500" />;
    if (type === 'Call') icon = <PhoneCall size={13} className="text-blue-600" />;
    else if (type === 'Meeting') icon = <Calendar size={13} className="text-purple-600" />;
    else if (type === 'Email') icon = <Mail size={13} className="text-amber-600" />;
    else if (type === 'Task') icon = <CheckSquare size={13} className="text-emerald-600" />;

    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <span className="p-1 rounded bg-slate-100/80">{icon}</span>
        <span>{type}</span>
      </div>
    );
  };

  // Purpose cell
  const renderPurposeCell = (purpose?: Activity['purpose']) => {
    if (purpose === 'Negotiation') {
      return <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">Negotiation</span>;
    }
    if (purpose === 'Customer Acceptance' || purpose === 'Deal Closed') {
      return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">Accepted</span>;
    }
    if (purpose === 'Follow-up') {
      return <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60">Follow-up</span>;
    }
    return <span className="text-xs text-slate-600 font-medium">{purpose || 'General'}</span>;
  };

  // Status cell
  const renderStatusBadge = (act: Activity) => {
    const computed = getComputedStatus(act);
    switch (computed) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Overdue
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Cancelled
          </span>
        );
      case 'Upcoming':
      case 'Scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {computed === 'Upcoming' ? 'Upcoming' : 'Scheduled'}
          </span>
        );
    }
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    filterPurpose !== 'all' ||
    filterStatus !== 'all' ||
    filterAssignee !== 'all' ||
    filterRelationType !== 'all' ||
    filterDateRange !== 'all';

  const resetFilters = () => {
    setFilterType('all');
    setFilterPurpose('all');
    setFilterStatus('all');
    setFilterAssignee('all');
    setFilterRelationType('all');
    setFilterDateRange('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Formal Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activities</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer interactions, meetings, calls, emails, and follow-up activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition active:scale-[0.98]"
          >
            <Plus size={16} /> Log Activity
          </button>
        </div>
      </div>

      {/* 2. Professional Compact Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Activities</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.completed}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Upcoming</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{metrics.upcoming}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Overdue</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{metrics.overdue}</div>
        </div>
      </div>

      {/* 3. Primary Navigation / Clean Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: metrics.total },
              { id: 'today', label: 'Today', count: metrics.todayCount },
              { id: 'upcoming', label: 'Upcoming', count: metrics.upcoming },
              { id: 'completed', label: 'Completed', count: metrics.completed },
              { id: 'overdue', label: 'Overdue', count: metrics.overdue },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Filter Popover & View Mode */}
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 hover:bg-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick dropdown filters */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition ${
                  hasActiveFilters || showFilterDropdown
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter size={13} />
                <span>Filters</span>
                {hasActiveFilters && !showFilterDropdown && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                )}
                <ChevronDown size={13} />
              </button>

              {/* Filters Panel Popover */}
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-40 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">Activity Filters</span>
                    <button
                      onClick={resetFilters}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1">Type</label>
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
                        <option value="Reminder">Reminder</option>
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
                      <label className="font-semibold text-slate-600 block mb-1">Date Range</label>
                      <select
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-slate-900 bg-white"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                        <option value="thisweek">This Week</option>
                        <option value="overdue">Overdue</option>
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
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List size={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Timeline View"
              >
                <GitCommit size={14} />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter tags bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
            <span className="font-semibold text-slate-700">Active filters:</span>
            {filterType !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Type: {filterType}</span>}
            {filterPurpose !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Purpose: {filterPurpose}</span>}
            {filterStatus !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Status: {filterStatus}</span>}
            {filterRelationType !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Record: {filterRelationType}</span>}
            {filterAssignee !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Assignee: {filterAssignee}</span>}
            {filterDateRange !== 'all' && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">Date: {filterDateRange}</span>}
            <button onClick={resetFilters} className="text-indigo-600 hover:underline font-semibold ml-auto">Clear filters</button>
          </div>
        )}
      </div>

      {/* 4. Main Enterprise Table / List */}
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
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 min-w-[220px]">Activity</th>
                  <th className="py-3.5 px-3 w-28">Type</th>
                  <th className="py-3.5 px-3 w-28">Purpose</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Related Record</th>
                  <th className="py-3.5 px-3 w-36">Date & Time</th>
                  <th className="py-3.5 px-3 w-36">Assigned To</th>
                  <th className="py-3.5 px-3 w-28">Status</th>
                  <th className="py-3.5 px-4 w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredActivities.map((act) => {
                  const entityInfo = getRelatedEntityInfo(act);
                  const dateTime = formatDateTimeDisplay(act.dueDate);
                  const isCompleted = act.status === 'Completed';

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      {/* Activity Title + Description Preview */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col">
                          <button
                            onClick={() => setSelectedActivity(act)}
                            className="font-semibold text-slate-900 hover:text-indigo-600 text-left transition text-sm line-clamp-1"
                          >
                            {act.title || 'Untitled Activity'}
                          </button>
                          {act.outcome && (
                            <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              "{act.outcome}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        {renderTypeCell(act.type)}
                      </td>

                      {/* Purpose */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        {renderPurposeCell(act.purpose)}
                      </td>

                      {/* Related Record (2-line: Type on top, Record name below) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {entityInfo.type}
                          </span>
                          {entityInfo.id ? (
                            <button
                              onClick={(e) => handleNavigateToEntity(entityInfo, e)}
                              className="font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1 text-left transition truncate mt-0.5"
                              title={`Open ${entityInfo.type} Details`}
                            >
                              <span className="truncate">{entityInfo.name}</span>
                              <ExternalLink size={11} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                            </button>
                          ) : (
                            <span className="text-slate-800 font-semibold truncate mt-0.5">
                              {entityInfo.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{dateTime.date}</span>
                          <span className="text-[11px] text-slate-400">{dateTime.time}</span>
                        </div>
                      </td>

                      {/* Assigned To */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                            {(act.assignedTo || 'U').charAt(0)}
                          </div>
                          <span className="text-slate-800 font-medium">{act.assignedTo || 'Sarah Jenkins'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        {renderStatusBadge(act)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1">
                          {!isCompleted && act.status !== 'Cancelled' && (
                            <button
                              onClick={(e) => handleMarkCompleted(act, e)}
                              title="Mark as Completed"
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === act.id ? null : act.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                              title="More Options"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {openActionMenuId === act.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-30 space-y-0.5 text-left"
                              >
                                <button
                                  onClick={() => {
                                    setSelectedActivity(act);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                                >
                                  <Eye size={13} /> View Details
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(act)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                                >
                                  <Edit3 size={13} /> Edit Activity
                                </button>
                                {!isCompleted && (
                                  <button
                                    onClick={(e) => handleMarkCompleted(act, e)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg font-medium"
                                  >
                                    <Check size={13} /> Mark Completed
                                  </button>
                                )}
                                {act.status !== 'Cancelled' && !isCompleted && (
                                  <button
                                    onClick={(e) => handleCancelActivity(act, e)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                                  >
                                    <X size={13} /> Cancel Activity
                                  </button>
                                )}
                                <div className="border-t border-slate-100 my-0.5"></div>
                                <button
                                  onClick={() => {
                                    setDeleteConfirmId(act.id);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
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
      ) : (
        /* COMPACT TIMELINE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredActivities.map((act) => {
              const entityInfo = getRelatedEntityInfo(act);
              const dateTime = formatDateTimeDisplay(act.dueDate);
              const isCompleted = act.status === 'Completed';

              return (
                <div key={act.id} className="relative group">
                  <div
                    className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center ${
                      isCompleted ? 'border-emerald-500' : 'border-indigo-500'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
                      }`}
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-slate-300 hover:bg-white transition space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {renderTypeCell(act.type)}
                        {renderPurposeCell(act.purpose)}
                        <h4
                          onClick={() => setSelectedActivity(act)}
                          className="font-bold text-slate-900 text-xs hover:text-indigo-600 cursor-pointer"
                        >
                          {act.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{dateTime.date}, {dateTime.time}</span>
                        {renderStatusBadge(act)}
                      </div>
                    </div>

                    {act.outcome && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                        {act.outcome}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-slate-400" /> {act.assignedTo || 'Sarah Jenkins'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>{entityInfo.type}:</span>
                          <strong className="text-slate-800">{entityInfo.name}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCompleted && act.status !== 'Cancelled' && (
                          <button
                            onClick={(e) => handleMarkCompleted(act, e)}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold border border-emerald-200 transition"
                          >
                            Mark Complete
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedActivity(act)}
                          className="px-2 py-0.5 text-indigo-600 hover:bg-indigo-50 rounded text-xs font-semibold transition"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(act)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Formal Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Activity Details</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5 leading-snug">{selectedActivity.title}</h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Type</span>
                  <div className="mt-1">{renderTypeCell(selectedActivity.type)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Purpose</span>
                  <div className="mt-1">{renderPurposeCell(selectedActivity.purpose)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {formatDateTimeDisplay(selectedActivity.dueDate).date} • {formatDateTimeDisplay(selectedActivity.dueDate).time}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <div className="mt-1">{renderStatusBadge(selectedActivity)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned To</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {selectedActivity.assignedTo || 'Sarah Jenkins'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Priority</span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {selectedActivity.priority || 'Medium'}
                  </span>
                </div>
              </div>

              {/* Related Record Section */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Related Record</span>
                {(() => {
                  const entityInfo = getRelatedEntityInfo(selectedActivity);
                  return (
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{entityInfo.type}: </span>
                        <span className="font-bold text-slate-900 text-sm ml-1">{entityInfo.name}</span>
                      </div>
                      {entityInfo.id && (
                        <button
                          onClick={(e) => {
                            setSelectedActivity(null);
                            handleNavigateToEntity(entityInfo, e);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                        >
                          View {entityInfo.type} Details <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Description */}
              <div>
                <span className="font-bold text-slate-800 block mb-1">Description / Discussion Notes</span>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {selectedActivity.outcome || <span className="text-slate-400 italic">No notes recorded for this interaction.</span>}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(selectedActivity.id)}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold text-xs transition"
              >
                Delete
              </button>

              <div className="flex items-center gap-2">
                {selectedActivity.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleMarkCompleted(selectedActivity)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-xs transition"
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
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Formal Log / Edit Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingActivity ? 'Edit Activity' : 'Log Activity'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record call logs, meeting discussions, email interactions, or tasks.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5 text-xs">
              {/* Type buttons */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Activity Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Call', 'Meeting', 'Email', 'Task'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        formType === t
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose dropdown */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose / Category</label>
                <select
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                >
                  <option value="General">General Interaction</option>
                  <option value="Follow-up">Follow-up Touchpoint</option>
                  <option value="Negotiation">🤝 Negotiation / Customer Response</option>
                  <option value="Customer Acceptance">🎉 Customer Acceptance / Deal Closed</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Proposal Discussion"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                />
              </div>

              {/* Relation Selector */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">Related Record</label>
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
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="contact">Contact</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Select Record</label>
                  {formRelationType === 'lead' ? (
                    <select
                      value={formSelectedEntityId}
                      onChange={(e) => setFormSelectedEntityId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                    >
                      {leads.length === 0 && <option value="">No Leads Available</option>}
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.company || 'Direct'})
                        </option>
                      ))}
                    </select>
                  ) : formRelationType === 'customer' ? (
                    <select
                      value={formSelectedEntityId}
                      onChange={(e) => setFormSelectedEntityId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
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
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
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
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
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
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Assignee & Status */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder="Employee name"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium"
                  >
                    <option value="Pending">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Key discussion points, customer feedback, action items..."
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  {editingActivity ? 'Save Changes' : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Delete Activity</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this activity record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteActivity(deleteConfirmId)}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
