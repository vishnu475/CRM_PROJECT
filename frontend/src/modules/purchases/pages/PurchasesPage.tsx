import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { PurchaseOrder } from '../../../types';
import { ShoppingCart, Plus, Search, Truck, CheckCircle2, Clock } from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  const { purchaseOrders, addPurchaseOrder, vendors } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [amount, setAmount] = useState('180000');
  const [description, setDescription] = useState('Server Infrastructure & Cloud Hosting');

  const filteredOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPurchaseValue = purchaseOrders.reduce((sum, po) => sum + (po.amount || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = vendors.find(vend => vend.id === selectedVendorId) || vendors[0];
    const poNum = `PO-2025-${Math.floor(Math.random() * 900) + 100}`;
    const newPO: Omit<PurchaseOrder, 'id'> = {
      poNumber: poNum,
      vendorName: v?.name || 'Office Supplies Ltd',
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount) || 50000,
      status: 'Sent',
    };

    await addPurchaseOrder(newPO);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="text-purple-600" size={24} />
            Procurement & Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue purchase orders, track vendor deliveries, and manage trade commitments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 w-48 sm:w-60 bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={16} /> + New Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Purchase Orders</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{purchaseOrders.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Committed Spend</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">₹ {totalPurchaseValue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Completed Orders</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {purchaseOrders.filter(p => p.status === 'Completed' || p.status === 'Received').length}
          </p>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((po) => (
          <div key={po.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold text-purple-600">{po.poNumber}</span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{po.vendorName}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                po.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {po.status}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Order Date: {po.date}</span>
              <span className="text-sm font-extrabold text-slate-900">₹ {po.amount.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Issue New Purchase Order</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Supplier *</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purchase Amount (₹) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Order Description / Scope</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
