import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Note } from '../../../types';
import {
  FileText,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  Building2,
  TrendingUp,
  Tag,
  Clock,
  Calendar,
} from 'lucide-react';

interface CrmNotesListProps {
  onViewChange?: (view: any) => void;
  onLeadSelect?: (leadId: string) => void;
  onCustomerSelect?: (customerId: string) => void;
  onOpportunitySelect?: (opportunityId: string) => void;
}

export const CrmNotesList: React.FC<CrmNotesListProps> = ({
  onLeadSelect,
  onCustomerSelect,
  onOpportunitySelect,
}) => {
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    leads,
    customers,
    opportunities,
    employees,
    userProfile,
  } = useApp();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRelatedType, setFilterRelatedType] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form state
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'General' as 'General' | 'Customer Requirements' | 'Internal' | 'Technical' | 'Commercial',
    relatedType: 'none' as 'none' | 'lead' | 'customer' | 'opportunity',
    relatedId: '',
    content: '',
    createdBy: '',
  });

  // Available Authors for filter
  const availableAuthors = useMemo(() => {
    const set = new Set<string>();
    if (userProfile?.name) set.add(userProfile.name);
    if (employees && employees.length > 0) employees.forEach((e) => set.add(e.name));
    notes.forEach((n) => {
      const a = n.createdBy || n.created_by || n.author;
      if (a && a.trim()) set.add(a.trim());
    });
    return Array.from(set);
  }, [userProfile, employees, notes]);

  // Helper to resolve related record details
  const getRelatedRecordDetails = (note: Note) => {
    const relType = (note.relatedType || note.related_type || note.entityType || note.entity_type || '').toLowerCase();
    const relId = note.relatedId || note.related_id || note.entityId || note.entity_id || note.relatedRecord || '';

    if (relType === 'lead' || (relId && leads.some((l) => l.id === relId))) {
      const lead = leads.find((l) => l.id === relId);
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

    if (relType === 'customer' || (relId && customers.some((c) => c.id === relId))) {
      const cust = customers.find((c) => c.id === relId);
      if (cust) {
        return {
          type: 'Customer',
          typeBadge: 'bg-purple-50 text-purple-700 border-purple-200',
          title: cust.customerName || 'Unnamed Customer',
          subtitle: cust.industry || cust.primaryContact?.email || 'Account',
          id: cust.id,
          onNavigate: onCustomerSelect ? () => onCustomerSelect(cust.id) : undefined,
        };
      }
    }

    if (relType === 'opportunity' || (relId && opportunities.some((o) => o.id === relId))) {
      const opp = opportunities.find((o) => o.id === relId);
      if (opp) {
        return {
          type: 'Opportunity',
          typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          title: opp.name || 'Deal',
          subtitle: opp.customerName || 'Opportunity Record',
          id: opp.id,
          onNavigate: onOpportunitySelect ? () => onOpportunitySelect(opp.id) : undefined,
        };
      }
    }

    return {
      type: 'General',
      typeBadge: 'bg-slate-100 text-slate-600 border-slate-200',
      title: note.relatedRecord || 'General Note',
      subtitle: 'No linked record',
    };
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let total = notes.length;
    let leadNotes = 0;
    let customerNotes = 0;
    let opportunityNotes = 0;

    notes.forEach((n) => {
      const details = getRelatedRecordDetails(n);
      if (details.type === 'Lead') leadNotes++;
      else if (details.type === 'Customer') customerNotes++;
      else if (details.type === 'Opportunity') opportunityNotes++;
    });

    return { total, leadNotes, customerNotes, opportunityNotes };
  }, [notes, leads, customers, opportunities]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const details = getRelatedRecordDetails(n);

        // Type filter
        if (filterType !== 'all') {
          const t = (n.type || 'General').toLowerCase();
          if (t !== filterType.toLowerCase()) return false;
        }

        // Related Type filter
        if (filterRelatedType !== 'all') {
          if (details.type.toLowerCase() !== filterRelatedType.toLowerCase()) return false;
        }

        // Author filter
        if (filterAuthor !== 'all') {
          const a = (n.createdBy || n.created_by || n.author || 'Sarah Jenkins').toLowerCase();
          if (a !== filterAuthor.toLowerCase()) return false;
        }

        // Search Term filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const title = (n.title || '').toLowerCase();
          const content = (n.content || '').toLowerCase();
          const author = (n.createdBy || n.created_by || n.author || '').toLowerCase();
          const relTitle = details.title.toLowerCase();

          return (
            title.includes(term) ||
            content.includes(term) ||
            author.includes(term) ||
            relTitle.includes(term)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt || a.created_at || 0).getTime();
        const db = new Date(b.createdAt || b.created_at || 0).getTime();
        return db - da;
      });
  }, [notes, filterType, filterRelatedType, filterAuthor, searchTerm, leads, customers, opportunities]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingNote(null);
    setFormError(null);
    setFormData({
      title: '',
      type: 'General',
      relatedType: 'none',
      relatedId: '',
      content: '',
      createdBy: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (n: Note) => {
    setEditingNote(n);
    setFormError(null);
    const details = getRelatedRecordDetails(n);
    let relType: 'none' | 'lead' | 'customer' | 'opportunity' = 'none';
    if (details.type === 'Lead') relType = 'lead';
    if (details.type === 'Customer') relType = 'customer';
    if (details.type === 'Opportunity') relType = 'opportunity';

    setFormData({
      title: n.title || '',
      type: (n.type as any) || 'General',
      relatedType: relType,
      relatedId: details.id || '',
      content: n.content || '',
      createdBy: n.createdBy || n.created_by || n.author || userProfile?.name || 'Sarah Jenkins',
    });
    setShowModal(true);
  };

  const handleRelatedTypeChange = (newRel: 'none' | 'lead' | 'customer' | 'opportunity') => {
    let newRelId = '';
    if (newRel === 'lead') newRelId = leads[0]?.id || '';
    if (newRel === 'customer') newRelId = customers[0]?.id || '';
    if (newRel === 'opportunity') newRelId = opportunities[0]?.id || '';

    setFormData((prev) => ({
      ...prev,
      relatedType: newRel,
      relatedId: newRelId,
    }));
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Note Title is required.');
      return;
    }
    if (!formData.type) {
      setFormError('Note Type is required.');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Note Content is required.');
      return;
    }

    const authorName = formData.createdBy.trim() || userProfile?.name || 'Sarah Jenkins';
    const payload: Partial<Note> = {
      title: formData.title.trim(),
      type: formData.type,
      content: formData.content.trim(),
      relatedType: formData.relatedType === 'none' ? undefined : (formData.relatedType.charAt(0).toUpperCase() + formData.relatedType.slice(1)),
      related_type: formData.relatedType === 'none' ? undefined : (formData.relatedType.charAt(0).toUpperCase() + formData.relatedType.slice(1)),
      relatedId: formData.relatedType === 'none' ? undefined : formData.relatedId,
      related_id: formData.relatedType === 'none' ? undefined : formData.relatedId,
      createdBy: authorName,
      created_by: authorName,
      author: authorName,
    };

    try {
      if (editingNote) {
        if (updateNote) await updateNote(editingNote.id, payload);
        showToast('Note updated successfully');
      } else {
        await addNote(payload);
        showToast('Note created successfully');
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Failed to save note:', err);
      setFormError(err?.message || 'Failed to save note. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (deleteNote) await deleteNote(id);
      showToast('Note deleted successfully');
      setDeleteConfirmId(null);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const getTypeBadge = (type?: string) => {
    const t = (type || 'General').toLowerCase();
    switch (t) {
      case 'customer requirements':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Customer Requirements</span>;
      case 'internal':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Internal</span>;
      case 'technical':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Technical</span>;
      case 'commercial':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Commercial</span>;
      case 'general':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">General</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '01 Oct 2026';
    if (dateStr === 'Just now') return 'Just now';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <FileText className="text-indigo-600" size={24} />
            CRM Notes &amp; Documentation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store and manage important customer, lead and opportunity information.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} />
          <span>+ Add Note</span>
        </button>
      </div>

      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Notes</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
          <span className="text-[10px] text-slate-400 mt-1">Stored internal records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Lead Notes</span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">{metrics.leadNotes}</p>
          <span className="text-[10px] text-slate-400 mt-1">Linked to sales leads</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Customer Notes</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{metrics.customerNotes}</p>
          <span className="text-[10px] text-slate-400 mt-1">Linked to accounts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Opportunity Notes</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{metrics.opportunityNotes}</p>
          <span className="text-[10px] text-slate-400 mt-1">Linked to active deals</span>
        </div>
      </div>

      {/* 2. SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Notes */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes by title, content, record, author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900"
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
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              showFilterDropdown || filterType !== 'all' || filterRelatedType !== 'all' || filterAuthor !== 'all'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Notes</span>
          </button>
        </div>

        {/* Filter dropdown panel */}
        {showFilterDropdown && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Note Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-medium"
              >
                <option value="all">All Note Types</option>
                <option value="General">General</option>
                <option value="Customer Requirements">Customer Requirements</option>
                <option value="Internal">Internal</option>
                <option value="Technical">Technical</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Related Type</label>
              <select
                value={filterRelatedType}
                onChange={(e) => setFilterRelatedType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-medium"
              >
                <option value="all">All Entities</option>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="opportunity">Opportunity</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Created By</label>
              <select
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-medium"
              >
                <option value="all">All Authors</option>
                {availableAuthors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterRelatedType('all');
                  setFilterAuthor('all');
                  setSearchTerm('');
                }}
                className="w-full px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* 3. NOTES TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-3 w-8">#</th>
                <th className="p-3">Note Title</th>
                <th className="p-3">Related To</th>
                <th className="p-3">Type</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Created Date</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((n, idx) => {
                  const details = getRelatedRecordDetails(n);

                  return (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                      {/* Note Title */}
                      <td className="p-3">
                        <div
                          className="font-bold text-[#0f172a] hover:text-indigo-600 cursor-pointer"
                          onClick={() => setSelectedNote(n)}
                        >
                          {n.title || 'Untitled Note'}
                        </div>
                        {n.content && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{n.content}</div>
                        )}
                      </td>

                      {/* Related To */}
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${details.typeBadge}`}
                          >
                            {details.type}
                          </span>
                          <div
                            className={`font-semibold text-slate-800 ${
                              details.onNavigate ? 'hover:text-indigo-600 cursor-pointer underline decoration-dotted' : ''
                            }`}
                            onClick={() => details.onNavigate && details.onNavigate()}
                          >
                            {details.title}
                          </div>
                          {details.subtitle && (
                            <div className="text-[10px] text-slate-400">{details.subtitle}</div>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-3">{getTypeBadge(n.type)}</td>

                      {/* Created By */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {(n.createdBy || n.created_by || n.author || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700">
                            {n.createdBy || n.created_by || n.author || 'Sarah Jenkins'}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="p-3 text-slate-600 font-medium">
                        {formatDate(n.createdAt || n.created_at)}
                      </td>

                      {/* Last Updated */}
                      <td className="p-3 text-slate-500 font-medium">
                        {formatDate(n.updatedAt || n.updated_at || n.createdAt || n.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View Note"
                            onClick={() => setSelectedNote(n)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            title="Edit Note"
                            onClick={() => handleOpenEditModal(n)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            title="Delete Note"
                            onClick={() => setDeleteConfirmId(n.id)}
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
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No notes found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search criteria or click "+ Add Note" to create a new record.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ADD / EDIT NOTE MODAL */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <span>{editingNote ? 'Edit Note' : 'Add Note'}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNote} className="p-6 space-y-4">
              {/* Note Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Requirements – ABC Corp"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              {/* Note Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-semibold"
                >
                  <option value="General">General</option>
                  <option value="Customer Requirements">Customer Requirements</option>
                  <option value="Internal">Internal</option>
                  <option value="Technical">Technical</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              {/* Related Type & Select Record */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Related To</label>
                  <select
                    value={formData.relatedType}
                    onChange={(e) => handleRelatedTypeChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-semibold"
                  >
                    <option value="none">None (General Note)</option>
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                    <option value="opportunity">Opportunity</option>
                  </select>
                </div>

                {formData.relatedType !== 'none' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Record</label>
                    <select
                      value={formData.relatedId}
                      onChange={(e) => setFormData({ ...formData, relatedId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 font-medium"
                    >
                      <option value="">-- Select Record --</option>
                      {formData.relatedType === 'lead' &&
                        leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} {l.company ? `- ${l.company}` : ''}
                          </option>
                        ))}
                      {formData.relatedType === 'customer' &&
                        customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.customerName} {c.industry ? `- ${c.industry}` : ''}
                          </option>
                        ))}
                      {formData.relatedType === 'opportunity' &&
                        opportunities.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} {o.customerName ? `- ${o.customerName}` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Note Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Customer requires ERP implementation with HRMS, Payroll and Inventory..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 resize-none font-sans"
                />
              </div>

              {/* Created By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Created By</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {editingNote ? 'Save Changes' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. VIEW NOTE DETAILS MODAL */}
      {/* ============================================================ */}
      {selectedNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedNote.type)}
                <span className="text-xs font-mono text-slate-400">{selectedNote.id}</span>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedNote.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Created by <strong className="text-slate-700">{selectedNote.createdBy || selectedNote.created_by || selectedNote.author || 'Sarah Jenkins'}</strong> on {formatDate(selectedNote.createdAt || selectedNote.created_at)}
                </p>
              </div>

              {/* Related Entity */}
              {(() => {
                const details = getRelatedRecordDetails(selectedNote);
                return (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${details.typeBadge}`}>
                          {details.type}
                        </span>
                        <span className="font-bold text-slate-900">{details.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{details.subtitle}</p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Content &amp; Information</span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedNote.content}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const toDelete = selectedNote.id;
                  setSelectedNote(null);
                  setDeleteConfirmId(toDelete);
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Note</span>
              </button>

              <button
                onClick={() => {
                  const toEdit = selectedNote;
                  setSelectedNote(null);
                  handleOpenEditModal(toEdit);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 size={14} />
                <span>Edit Note</span>
              </button>
            </div>
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
              <h3 className="text-base font-bold text-slate-900">Delete Note?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
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
