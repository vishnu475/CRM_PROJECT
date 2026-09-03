import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Vendor } from '../../../types';
import { Truck, Plus, Search, Mail, Phone, User, Star, DollarSign } from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const { vendors, addVendor } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [payableBalance, setPayableBalance] = useState('0');

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayable = vendors.reduce((sum, v) => sum + (v.payableBalance || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newVendor: Omit<Vendor, 'id'> = {
      code: `VND-${Math.floor(Math.random() * 900) + 100}`,
      name,
      contactPerson: contactPerson || 'Procurement Rep',
      email,
      phone: phone || '+1 800-555-0100',
      payableBalance: parseFloat(payableBalance) || 0,
      rating: 4.5,
    };

    await addVendor(newVendor);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setPayableBalance('0');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="text-teal-600" size={24} />
            Vendor & Supplier Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized suppliers, procurement contracts, and trade payable balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-48 sm:w-60 bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={16} /> + Register Vendor
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Suppliers</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{vendors.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Accounts Payable</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">₹ {totalPayable.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Average Supplier Rating</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">⭐ 4.6 / 5.0</p>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((v) => (
          <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600">{v.code || v.id}</span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{v.name}</h3>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-bold">
                <Star size={12} className="fill-amber-400 text-amber-400" /> {v.rating}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <User size={13} className="text-slate-400 shrink-0" />
                <span>{v.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="text-slate-700">{v.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>{v.phone}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-medium">Payable Balance:</span>
              <span className={`text-sm font-extrabold ${v.payableBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹ {v.payableBalance.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="AWS Cloud Infrastructure Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Representative</label>
                <input
                  type="text"
                  placeholder="David Miller"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="billing@supplier.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 800-555-1212"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Opening Payable Balance (₹)</label>
                <input
                  type="number"
                  value={payableBalance}
                  onChange={(e) => setPayableBalance(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
