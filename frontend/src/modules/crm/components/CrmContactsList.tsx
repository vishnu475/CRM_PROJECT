import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contact } from '../../../types';
import { 
  Users, Plus, Search, Mail, Phone, Building2, Briefcase, 
  Edit2, Trash2, Eye, X, CheckCircle2, AlertCircle, FileText, 
  Calendar, Shield, ChevronRight, UserCheck, PhoneCall, Sparkles
} from 'lucide-react';

interface CrmContactsListProps {
  onViewChange?: (view: any) => void;
}

const CONTACT_ROLES = [
  'Decision Maker',
  'Influencer',
  'User',
  'Technical Contact',
  'Procurement',
  'Finance',
  'Other',
];

export const CrmContactsList: React.FC<CrmContactsListProps> = ({ onViewChange }) => {
  const { contacts, customers, opportunities, activities, addContact, updateContact, deleteContact } = useApp();
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  
  // Modals & Drawers State
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [contactToView, setContactToView] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    contactRole: 'Decision Maker',
    customerId: '',
    email: '',
    phone: '',
    alternatePhone: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form when opening Add Modal
  const openAddModal = () => {
    const defaultCustId = customers.length > 0 ? customers[0].id : '';
    setFormData({
      name: '',
      designation: '',
      contactRole: 'Decision Maker',
      customerId: defaultCustId,
      email: '',
      phone: '',
      alternatePhone: '',
      notes: '',
    });
    setFormError(null);
    setShowAddModal(true);
  };

  // Initialize form when opening Edit Modal
  const openEditModal = (contact: Contact) => {
    setContactToEdit(contact);
    setFormData({
      name: contact.name || '',
      designation: contact.designation || '',
      contactRole: contact.contactRole || 'Decision Maker',
      customerId: contact.customerId || (customers.length > 0 ? customers[0].id : ''),
      email: contact.email || '',
      phone: contact.phone || '',
      alternatePhone: contact.alternatePhone || '',
      notes: contact.notes || '',
    });
    setFormError(null);
  };

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = 
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm) ||
        (c.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contactRole || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRoleFilter === 'All' || c.contactRole === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [contacts, searchTerm, selectedRoleFilter]);

  // Form Validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Contact Name is required.';
    }
    if (!formData.designation.trim()) {
      return 'Designation is required.';
    }
    if (!formData.contactRole) {
      return 'Contact Role is required.';
    }
    if (!formData.customerId) {
      return 'Company is required. Please select an existing company.';
    }
    if (!formData.email.trim()) {
      return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!formData.phone.trim()) {
      return 'Phone is required.';
    }
    return null;
  };

  // Handle Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId) || customers[0];
    const customerName = customer ? customer.customerName : 'Direct Client';

    const newContact: Omit<Contact, 'id'> = {
      name: formData.name.trim(),
      designation: formData.designation.trim(),
      contactRole: formData.contactRole,
      customerId: customer ? customer.id : formData.customerId,
      customerName: customerName,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      alternatePhone: formData.alternatePhone.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      owner: customer?.ownerId || 'Unassigned',
      lastInteraction: new Date().toISOString().split('T')[0],
      status: 'Active',
    };

    await addContact(newContact);
    setShowAddModal(false);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactToEdit) return;

    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    const customerName = customer ? customer.customerName : contactToEdit.customerName;

    const updates: Partial<Contact> = {
      name: formData.name.trim(),
      designation: formData.designation.trim(),
      contactRole: formData.contactRole,
      customerId: formData.customerId,
      customerName: customerName,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      alternatePhone: formData.alternatePhone.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await updateContact(contactToEdit.id, updates);
    if (contactToView && contactToView.id === contactToEdit.id) {
      setContactToView({ ...contactToView, ...updates });
    }
    setContactToEdit(null);
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (contactToDelete) {
      await deleteContact(contactToDelete.id);
      if (contactToView && contactToView.id === contactToDelete.id) {
        setContactToView(null);
      }
      setContactToDelete(null);
    }
  };

  // Helper for role badge colors
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'Decision Maker':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Influencer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Technical Contact':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Procurement':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Finance':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'User':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span 
              className="hover:text-indigo-600 transition-colors cursor-pointer"
              onClick={() => onViewChange && onViewChange('overview')}
            >
              CRM
            </span> 
            <ChevronRight size={12} className="mx-1" /> 
            <span className="text-[#0f172a] font-semibold">Contacts</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Users className="text-indigo-600" size={26} />
            Contacts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Key client representatives, decision makers, and stakeholders.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2"
        >
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search contacts, companies, roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Role:</span>
          {['All', ...CONTACT_ROLES].map(role => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedRoleFilter === role
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* CONTACTS GRID / CARDS */}
      {filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition group flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header: Avatar, Name, Designation & Role Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-100 shrink-0">
                      {(contact.name || 'C')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 
                        onClick={() => setContactToView(contact)}
                        className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {contact.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {contact.designation || 'Representative'}
                      </p>
                    </div>
                  </div>

                  {contact.contactRole && (
                    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${getRoleBadgeStyle(contact.contactRole)}`}>
                      {contact.contactRole}
                    </span>
                  )}
                </div>

                {/* Company, Email & Phone */}
                <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {contact.customerName || 'Direct Account'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline truncate">
                      {contact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium">{contact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setContactToView(contact)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                >
                  <Eye size={13} /> View Details
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(contact)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit Contact"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setContactToDelete(contact)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Contact"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No contacts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {searchTerm || selectedRoleFilter !== 'All'
              ? 'Try adjusting your search query or role filter.'
              : 'Add contacts linked to your customer companies to organize representatives and decision makers.'}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD CONTACT MODAL */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="text-indigo-600" size={20} />
                  Add Contact
                </h3>
                <p className="text-xs text-slate-500">Create a new key person record linked to a company.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* 1. Contact Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              {/* 2. Designation & 3. Contact Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CTO / Software Engineer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Role *</label>
                  <select
                    value={formData.contactRole}
                    onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  >
                    {CONTACT_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Company (Customer select) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                >
                  <option value="" disabled>Select Company</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.customerName} {c.customerCode ? `(${c.customerCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Email & 6. Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 7. Alternate Phone */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alternate Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              {/* 8. Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional information about communication preferences, background, or meeting takeaways..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT CONTACT MODAL */}
      {/* ========================================================= */}
      {contactToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="text-indigo-600" size={20} />
                  Edit Contact
                </h3>
                <p className="text-xs text-slate-500">Update contact profile and company association.</p>
              </div>
              <button 
                onClick={() => setContactToEdit(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* 1. Contact Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              {/* 2. Designation & 3. Contact Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Role *</label>
                  <select
                    value={formData.contactRole}
                    onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  >
                    {CONTACT_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Company (Customer select) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                >
                  <option value="" disabled>Select Company</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.customerName} {c.customerCode ? `(${c.customerCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Email & 6. Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* 7. Alternate Phone */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alternate Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              {/* 8. Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContactToEdit(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTACT DETAILS MODAL */}
      {/* ========================================================= */}
      {contactToView && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base border border-indigo-200">
                  {(contactToView.name || 'C')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {contactToView.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {contactToView.designation} • <span className="text-slate-800 font-semibold">{contactToView.customerName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(contactToView)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button 
                  onClick={() => setContactToView(null)} 
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-indigo-600" /> Key Attributes
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Name</span>
                    <span className="font-semibold text-slate-800">{contactToView.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Designation</span>
                    <span className="font-semibold text-slate-800">{contactToView.designation || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Role</span>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getRoleBadgeStyle(contactToView.contactRole)}`}>
                      {contactToView.contactRole || 'Decision Maker'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company</span>
                    <span className="font-semibold text-slate-800">{contactToView.customerName || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-indigo-600" /> Contact Info
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email</span>
                    <a href={`mailto:${contactToView.email}`} className="font-semibold text-indigo-600 hover:underline">
                      {contactToView.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone</span>
                    <span className="font-semibold text-slate-800">{contactToView.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Alternate Phone</span>
                    <span className="font-medium text-slate-700">{contactToView.alternatePhone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {contactToView.notes && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-600" /> Notes
                </h4>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {contactToView.notes}
                </p>
              </div>
            )}

            {/* Related Opportunities */}
            {opportunities.filter(o => o.customerId === contactToView.customerId).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Related Deals / Opportunities
                </h4>
                <div className="space-y-1.5">
                  {opportunities
                    .filter(o => o.customerId === contactToView.customerId)
                    .map(opp => (
                      <div key={opp.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">{opp.name}</span>
                          <span className="text-[11px] text-slate-500">Stage: {opp.stage}</span>
                        </div>
                        <span className="font-bold text-slate-800">₹{opp.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setContactToView(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Contact?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <span className="font-bold text-slate-900">{contactToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
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
