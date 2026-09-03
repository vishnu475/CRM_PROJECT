import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Product } from '../../../types';
import { Boxes, Plus, Search, Tag, DollarSign, Layers } from 'lucide-react';
import { CRMProductsAPI } from '../../../services/apiService';

export const InventoryPage: React.FC = () => {
  const { products, syncFromDatabase } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Software');
  const [price, setPrice] = useState('150000');
  const [stock, setStock] = useState('50');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStockValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    try {
      await CRMProductsAPI.create({
        name,
        sku,
        category,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0
      });
      await syncFromDatabase();
      setName('');
      setSku('');
      setShowAddModal(false);
    } catch (err: any) {
      alert(`Failed to add product: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="text-amber-600" size={24} />
            Products & Inventory Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SKUs, product pricing tiers, stock levels, and commercial deliverables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 sm:w-60 bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={16} /> + Add Product SKU
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Active SKUs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Catalog Inventory Value</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">₹ {totalStockValue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Available Stock Units</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {products.reduce((sum, p) => sum + (p.stock || 0), 0)}
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 uppercase">
                  {p.category || 'Product'}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1.5">{p.name}</h3>
              </div>
            </div>

            <p className="text-xs font-mono text-slate-400">SKU: {p.sku}</p>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-600">Stock: <strong className="text-slate-900">{p.stock} units</strong></span>
              <span className="text-sm font-extrabold text-amber-600">₹ {p.price.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Product SKU</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enterprise Analytics Suite"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PROD-EAS-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Software / License"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
