import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Product } from '../../../types';
import {
  Boxes,
  Plus,
  Search,
  Tag,
  DollarSign,
  Layers,
  Filter,
  Eye,
  Sliders,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  TrendingDown,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  PackageCheck,
  PackageX,
  Truck
} from 'lucide-react';
import { ProductModal } from '../components/ProductModal';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { InventoryDetailsModal } from '../components/InventoryDetailsModal';

export const InventoryPage: React.FC = () => {
  const { products, deleteProduct, syncFromDatabase } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Active action menu row
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Derive categories & locations
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const locationsList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      const loc = p.warehouseLocation || p.warehouse_location;
      if (loc) set.add(loc);
    });
    return Array.from(set);
  }, [products]);

  // Overall KPI Metrics based on actual data
  const totalProductsCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stock !== undefined ? p.stock : p.onHandStock) || 0), 0);

  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const onHand = Number(p.stock !== undefined ? p.stock : p.onHandStock) || 0;
      const res = Number(p.reservedStock || p.reserved_stock) || 0;
      const avail = p.availableStock !== undefined ? p.availableStock : Math.max(0, onHand - res);
      const reorder = Number(p.reorderLevel || p.reorder_level) || 20;
      return avail > 0 && avail <= reorder;
    }).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => {
      const onHand = Number(p.stock !== undefined ? p.stock : p.onHandStock) || 0;
      const res = Number(p.reservedStock || p.reserved_stock) || 0;
      const avail = p.availableStock !== undefined ? p.availableStock : Math.max(0, onHand - res);
      return avail <= 0;
    }).length;
  }, [products]);

  const totalInventoryValuation = useMemo(() => {
    return products.reduce((sum, p) => {
      const onHand = Number(p.stock !== undefined ? p.stock : p.onHandStock) || 0;
      const cost = Number(p.costPrice || p.cost_price || p.purchasePrice || p.purchase_price || (p.price * 0.7)) || 0;
      return sum + (onHand * cost);
    }, 0);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const onHand = Number(p.stock !== undefined ? p.stock : p.onHandStock) || 0;
      const res = Number(p.reservedStock || p.reserved_stock) || 0;
      const avail = p.availableStock !== undefined ? p.availableStock : Math.max(0, onHand - res);
      const reorder = Number(p.reorderLevel || p.reorder_level) || 20;

      let status = 'In Stock';
      if (avail <= 0) {
        status = 'Out of Stock';
      } else if (avail <= reorder) {
        status = 'Low Stock';
      }

      // 1. Search filter
      const searchMatch = !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Category filter
      const categoryMatch = categoryFilter === 'All' || p.category === categoryFilter;

      // 3. Status filter
      const statusMatch = statusFilter === 'All' || status === statusFilter || p.stockStatus === statusFilter || p.stock_status === statusFilter;

      // 4. Location filter
      const loc = p.warehouseLocation || p.warehouse_location || 'Main Warehouse - Bay A';
      const locationMatch = locationFilter === 'All' || loc === locationFilter;

      return searchMatch && categoryMatch && statusMatch && locationMatch;
    });
  }, [products, searchTerm, categoryFilter, statusFilter, locationFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setActiveProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setActiveProduct(p);
    setIsProductModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenAdjust = (p: Product) => {
    setActiveProduct(p);
    setIsAdjustmentModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDetails = (p: Product) => {
    setActiveProduct(p);
    setIsDetailsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = async (p: Product) => {
    setActiveMenuId(null);
    if (window.confirm(`Are you sure you want to delete product SKU "${p.sku}" (${p.name})?`)) {
      try {
        await deleteProduct(p.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete product.');
      }
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'Low Stock':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Out of Stock':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Boxes className="text-amber-600 w-6 h-6" />
            Inventory & Stock Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage products, stock levels, receipts, and inventory movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Catalog
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition"
          >
            <Plus className="w-4 h-4" /> + Add Product
          </button>
        </div>
      </div>

      {/* 2. 5 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
        {/* Card 1: Total Products */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="font-semibold">Total Products</span>
            <Tag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {totalProductsCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active SKU catalog</span>
        </div>

        {/* Card 2: Total Stock Units */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="font-semibold">Total Stock Units</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-900 font-mono tracking-tight">
            {totalStockUnits}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Physical on-hand items</span>
        </div>

        {/* Card 3: Low Stock Items */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="font-semibold">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono tracking-tight">
            {lowStockCount}
          </p>
          <span className="text-[11px] text-amber-600/80 mt-1 block font-medium">At or below reorder level</span>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-1.5">
            <span className="font-semibold">Out of Stock</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono tracking-tight">
            {outOfStockCount}
          </p>
          <span className="text-[11px] text-rose-500 mt-1 block font-medium">0 available units</span>
        </div>

        {/* Card 5: Inventory Value */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="font-semibold">Inventory Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-700 font-mono tracking-tight">
            ₹{totalInventoryValuation.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Total cost valuation</span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, SKU, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/40"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-semibold">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="All">All Categories</option>
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-semibold">Location:</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="All">All Locations</option>
                {locationsList.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || locationFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                  setLocationFilter('All');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-semibold transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Inventory View (Table by default or Grid) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Inventory Products Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'All' || categoryFilter !== 'All'
              ? 'No products match your current search or filter criteria. Try clearing filters.'
              : 'Start by adding your first product SKU to manage stock and inventory levels.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            + Add Product SKU
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE / LIST VIEW */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">On Hand</th>
                  <th className="py-3 px-4 text-right">Reserved</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-right">Reorder Level</th>
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-right">Inventory Value</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const onHand = Number(p.stock !== undefined ? p.stock : p.onHandStock) || 0;
                  const reserved = Number(p.reservedStock || p.reserved_stock) || 0;
                  const avail = p.availableStock !== undefined ? p.availableStock : Math.max(0, onHand - reserved);
                  const reorderLvl = Number(p.reorderLevel || p.reorder_level) || 20;
                  const cost = Number(p.costPrice || p.cost_price || p.purchasePrice || (p.price * 0.7)) || 0;
                  const val = Number(p.inventoryValue || p.inventory_value || onHand * cost) || 0;
                  const status = p.stockStatus || p.stock_status || (avail <= 0 ? 'Out of Stock' : avail <= reorderLvl ? 'Low Stock' : 'In Stock');

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenDetails(p)}
                      className="hover:bg-slate-50/70 cursor-pointer transition group"
                    >
                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.sku}
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 group-hover:text-amber-700 transition">
                          {p.name}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {p.warehouseLocation || p.warehouse_location || 'Main Warehouse - Bay A'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.category || 'General'}
                        </span>
                      </td>

                      {/* On Hand */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {onHand} <span className="text-[10px] text-slate-400 font-normal">{p.uom || 'units'}</span>
                      </td>

                      {/* Reserved */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700 whitespace-nowrap">
                        {reserved > 0 ? reserved : '0'}
                      </td>

                      {/* Available */}
                      <td className="py-3 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                        <span className={avail <= 0 ? 'text-rose-600 font-black' : avail <= reorderLvl ? 'text-amber-600 font-black' : 'text-emerald-700'}>
                          {avail}
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                        {reorderLvl}
                      </td>

                      {/* Stock Status (Display Only Badge) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block select-none ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>

                      {/* Inventory Value */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                        ₹{val.toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === p.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                onClick={() => handleOpenDetails(p)}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" /> View Stock 360°
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(p)}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-indigo-700"
                              >
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Adjust Stock
                              </button>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Product
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => handleDelete(p)}
                                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Product
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
        </div>
      ) : (
        /* GRID / CATALOG VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const onHand = Number(p.stock !== undefined ? p.stock : p.onHandStock) || 0;
            const reserved = Number(p.reservedStock || p.reserved_stock) || 0;
            const avail = p.availableStock !== undefined ? p.availableStock : Math.max(0, onHand - reserved);
            const reorderLvl = Number(p.reorderLevel || p.reorder_level) || 20;
            const cost = Number(p.costPrice || p.cost_price || (p.price * 0.7)) || 0;
            const val = Number(p.inventoryValue || p.inventory_value || onHand * cost) || 0;
            const status = p.stockStatus || p.stock_status || (avail <= 0 ? 'Out of Stock' : avail <= reorderLvl ? 'Low Stock' : 'In Stock');

            return (
              <div
                key={p.id}
                onClick={() => handleOpenDetails(p)}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition cursor-pointer space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 uppercase">
                      {p.category || 'General'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(status)}`}>
                      {status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">{p.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">SKU: {p.sku}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>On Hand:</span>
                    <span className="font-mono font-bold text-slate-900">{onHand} {p.uom || 'units'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Available:</span>
                    <span className={`font-mono font-black ${avail <= 0 ? 'text-rose-600' : avail <= reorderLvl ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {avail} {p.uom || 'units'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Valuation:</span>
                    <span className="font-mono font-bold text-slate-900">₹{val.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-sm font-extrabold text-amber-600 font-mono">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenAdjust(p)}
                      title="Adjust Stock"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      title="Edit Product"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modals Wiring */}
      
      {/* Product Register / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setActiveProduct(null);
        }}
        productToEdit={activeProduct}
        onSuccess={() => {
          syncFromDatabase();
        }}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setActiveProduct(null);
        }}
        product={activeProduct}
        onSuccess={() => {
          syncFromDatabase();
        }}
      />

      {/* Stock 360 Details Modal */}
      <InventoryDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setActiveProduct(null);
        }}
        product={activeProduct}
        onEdit={(p) => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(p);
        }}
        onAdjustStock={(p) => {
          setIsDetailsModalOpen(false);
          handleOpenAdjust(p);
        }}
      />
    </div>
  );
};

export default InventoryPage;
