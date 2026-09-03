import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Customer } from '../../../types';
import { Users, Plus, Search, Building, Mail, Phone, MapPin, DollarSign } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal Form State
  const [customerName, setCustomerName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [creditLimit, setCreditLimit] = useState('5000000');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [country, setCountry] = useState('India');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = (c.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.primaryContact?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCredit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const activeCount = customers.filter(c => c.status === 'Active').length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    const newCustomer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
      customerCode: customerCode || `C-${Math.floor(Math.random() * 900) + 100}`,
      customerName,
      customerType: 'Company',
      industry,
      ownerId: 'EMP-001',
      status: 'Active',
      creditLimit: parseFloat(creditLimit) || 1000000,
      primaryContact: {
        name: contactName || 'Primary Contact',
        email: contactEmail || `contact@${customerName.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: contactPhone || '+1 555-0100',
      },
      billingAddress: {
        address: 'Commercial Business District',
        city: city || 'Bengaluru',
        country: country || 'India',
        state: 'Karnataka',
        postalCode: '560001'
      },
      tags: [industry]
    };

    await addCustomer(newCustomer);
    setCustomerName('');
    setCustomerCode('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            Customer Directory & Accounts Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client profiles, credit limits, account status, and commercial engagements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60 bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={16} /> + New Customer
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Key Accounts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Clients</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Approved Credit</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">₹ {totalCredit.toLocaleString()}</p>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Customer / Company</th>
              <th className="p-3.5">Industry</th>
              <th className="p-3.5">Primary Contact</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5 text-right">Credit Limit</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No customers found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono text-indigo-600 font-bold">{c.customerCode || c.id}</td>
                  <td className="p-3.5 font-bold text-slate-900">{c.customerName}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {c.industry || 'Enterprise'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-800">{c.primaryContact?.name || 'Contact Person'}</p>
                    <p className="text-[11px] text-slate-400">{c.primaryContact?.email || ''}</p>
                  </td>
                  <td className="p-3.5 text-slate-500">{c.billingAddress?.city || 'Bengaluru'}, {c.billingAddress?.country || 'India'}</td>
                  <td className="p-3.5 text-right font-extrabold text-slate-900">₹ {(c.creditLimit || 0).toLocaleString()}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Corporation"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Code</label>
                  <input
                    type="text"
                    placeholder="C-101"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="George Miller"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="george@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0100"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
