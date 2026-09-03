import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Contact } from '../../../types';
import { Users, Plus, Search, Mail, Phone, Building, Briefcase } from 'lucide-react';

interface CrmContactsListProps {
  onViewChange?: (view: any) => void;
}

export const CrmContactsList: React.FC<CrmContactsListProps> = () => {
  const { contacts, addContact, customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDesignation, setNewDesignation] = useState('Procurement Director');
  const [newCustomerId, setNewCustomerId] = useState('');

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const customer = customers.find(c => c.id === newCustomerId) || customers[0];
    const contactData: Omit<Contact, 'id'> = {
      name: newName,
      email: newEmail,
      phone: newPhone || '+1 555-0100',
      customerId: customer?.id || 'CUST-001',
      customerName: customer?.customerName || 'Direct Client',
      designation: newDesignation,
      owner: 'Sarah Jenkins',
      lastInteraction: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    await addContact(contactData);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            Contact Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key client representatives & decision makers synced with PostgreSQL CRM DB
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60 bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={16} /> + Add Contact
          </button>
        </div>
      </div>

      {/* Grid of Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                {(contact.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{contact.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Briefcase size={12} className="text-slate-400" />
                  {contact.designation || 'Executive'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Building size={13} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-800">{contact.customerName || 'Direct Account'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">{contact.email}</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>{contact.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company Account *</label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Job Title / Designation</label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. Chief Technology Officer"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
