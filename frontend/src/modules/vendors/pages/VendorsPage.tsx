import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Vendor, PurchaseOrder } from '../../../types';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  User,
  Star,
  DollarSign,
  Receipt,
  FileText,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Layers,
  ArrowUpDown,
  Ban,
  Tag
} from 'lucide-react';
import { VendorModal } from '../components/VendorModal';
import { VendorDetailsModal } from '../components/VendorDetailsModal';
import { PurchaseOrderModal } from '../../purchases/components/PurchaseOrderModal';
import { PurchaseOrderDetailsModal } from '../../purchases/components/PurchaseOrderDetailsModal';

export const VendorsPage: React.FC = () => {
  const { vendors, purchaseOrders, updateVendor, deleteVendor } = useApp();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [openPoFilter, setOpenPoFilter] = useState<string>('All');
  const [balanceFilter, setBalanceFilter] = useState<string>('All');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isPoDetailsModalOpen, setIsPoDetailsModalOpen] = useState(false);

  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);

  // Derive vendor metrics map from current purchase orders
  const vendorStatsMap = useMemo(() => {
    const map = new Map<string, {
      totalPurchases: number;
      totalOrders: number;
      openOrders: number;
      amountDue: number;
    }>();

    purchaseOrders.forEach(po => {
      const vId = po.vendor_id || po.vendorId || po.vendor_name || po.vendorName || '';
      if (!vId) return;

      const amt = Number(po.total_amount || po.amount || 0);
      const paid = Number(po.paidAmount || po.paid_amount || 0);
      const invAmt = Number(po.vendorInvoiceAmount || po.vendor_invoice_amount || amt);
      const hasInvoice = Boolean(po.vendorInvoiceNumber || po.vendor_invoice_number);
      const due = hasInvoice ? Math.max(0, invAmt - paid) : 0;

      const current = map.get(vId) || {
        totalPurchases: 0,
        totalOrders: 0,
        openOrders: 0,
        amountDue: 0,
      };

      if (po.status !== 'Cancelled') {
        current.totalPurchases += amt;
        current.totalOrders += 1;
        current.amountDue += due;
        if (po.status !== 'Completed') {
          current.openOrders += 1;
        }
      }

      map.set(vId, current);
      // Also map by vendor name for robustness
      if (po.vendor_name) map.set(po.vendor_name, current);
      if (po.vendorName) map.set(po.vendorName, current);
    });

    return map;
  }, [purchaseOrders]);

  // Overall KPI Metrics
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => (v.status === 'Active' || !v.status)).length;

  const totalPurchasesAcrossAll = useMemo(() => {
    return purchaseOrders
      .filter(po => po.status !== 'Cancelled')
      .reduce((sum, po) => sum + (Number(po.total_amount || po.amount) || 0), 0);
  }, [purchaseOrders]);

  const totalAmountDueAcrossAll = useMemo(() => {
    const fromInvoicedPOs = purchaseOrders
      .filter(po => po.status !== 'Cancelled' && (po.vendorInvoiceNumber || po.vendor_invoice_number))
      .reduce((sum, po) => {
        const total = Number(po.vendorInvoiceAmount || po.vendor_invoice_amount || po.total_amount || po.amount || 0);
        const paid = Number(po.paidAmount || po.paid_amount || 0);
        return sum + Math.max(0, total - paid);
      }, 0);

    const fromVendorPayables = vendors.reduce((sum, v) => sum + (Number(v.payableBalance || v.payable_balance) || 0), 0);
    return Math.max(fromInvoicedPOs, fromVendorPayables);
  }, [purchaseOrders, vendors]);

  const averageRating = useMemo(() => {
    if (vendors.length === 0) return '5.0';
    const total = vendors.reduce((sum, v) => sum + (Number(v.rating) || 5.0), 0);
    return (total / vendors.length).toFixed(1);
  }, [vendors]);

  // Distinct Categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach(v => {
      if (v.category) set.add(v.category);
    });
    return Array.from(set);
  }, [vendors]);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const stats = vendorStatsMap.get(v.id) || vendorStatsMap.get(v.name) || {
        totalPurchases: v.totalPurchases || 0,
        totalOrders: v.totalOrders || 0,
        openOrders: v.openOrders || 0,
        amountDue: Number(v.payableBalance || v.payable_balance) || 0,
      };

      // Status Filter
      if (statusFilter !== 'All') {
        const vStatus = v.status || 'Active';
        if (vStatus !== statusFilter) return false;
      }

      // Category Filter
      if (categoryFilter !== 'All') {
        const vCat = v.category || 'General';
        if (vCat !== categoryFilter) return false;
      }

      // Open PO Filter
      if (openPoFilter === 'With Open POs' && stats.openOrders === 0) return false;
      if (openPoFilter === 'No Open POs' && stats.openOrders > 0) return false;

      // Balance Filter
      const effectiveDue = stats.amountDue > 0 ? stats.amountDue : (Number(v.payableBalance || v.payable_balance) || 0);
      if (balanceFilter === 'With Balance Due' && effectiveDue <= 0) return false;
      if (balanceFilter === 'Zero Balance' && effectiveDue > 0) return false;

      // Search Query
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = (v.code || v.id).toLowerCase().includes(term);
        const nameMatch = v.name.toLowerCase().includes(term);
        const contactMatch = (v.contactPerson || v.contact_person || '').toLowerCase().includes(term);
        const emailMatch = (v.email || '').toLowerCase().includes(term);
        const phoneMatch = (v.phone || '').toLowerCase().includes(term);
        const catMatch = (v.category || '').toLowerCase().includes(term);

        if (!codeMatch && !nameMatch && !contactMatch && !emailMatch && !phoneMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [vendors, vendorStatsMap, statusFilter, categoryFilter, openPoFilter, balanceFilter, searchTerm]);

  // Handlers
  const handleOpenDetails = (vendor: Vendor) => {
    setActiveVendor(vendor);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setActiveVendor(vendor);
    setIsEditModalOpen(true);
  };

  const handleCreatePOForVendor = (vendor: Vendor) => {
    setActiveVendor(vendor);
    setIsPoModalOpen(true);
  };

  const handleToggleStatus = async (vendor: Vendor) => {
    const current = vendor.status || 'Active';
    const nextStatus = current === 'Active' ? 'Suspended' : 'Active';
    await updateVendor(vendor.id, { status: nextStatus as any });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setOpenPoFilter('All');
    setBalanceFilter('All');
  };

  const hasActiveFilters = searchTerm !== '' || 
    statusFilter !== 'All' || 
    categoryFilter !== 'All' || 
    openPoFilter !== 'All' || 
    balanceFilter !== 'All';

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'Inactive':
        return 'bg-slate-100 text-slate-600 border-slate-300 font-medium';
      case 'Suspended':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Archived':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            Vendor & Supplier Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage suppliers, purchasing history, delivery performance, and vendor balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl text-sm font-semibold shadow-md shadow-teal-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> + Register Vendor
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Vendors */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Vendors</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalVendors}</p>
          <span className="text-[11px] text-slate-400 font-medium">All registered suppliers</span>
        </div>

        {/* Active Vendors */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Vendors</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{activeVendors}</p>
          <span className="text-[11px] text-slate-400 font-medium">Available for procurement</span>
        </div>

        {/* Total Purchases */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Purchases</span>
            <ShoppingCart className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-700 truncate font-mono">
            ₹{totalPurchasesAcrossAll.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Cumulative order spend</span>
        </div>

        {/* Amount Due (Accounts Payable) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Amount Due</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 truncate font-mono">
            ₹{totalAmountDueAcrossAll.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Vendor AP Balance</span>
        </div>

        {/* Average Supplier Rating */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Supplier Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">
            {averageRating} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Performance benchmark</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vendor code, name, contact, email, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
          </div>

          {/* Filters Selects */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Archived">Archived</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Open POs Filter */}
            <select
              value={openPoFilter}
              onChange={(e) => setOpenPoFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Purchase Orders</option>
              <option value="With Open POs">With Open POs</option>
              <option value="No Open POs">No Open POs</option>
            </select>

            {/* Payables Filter */}
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
            >
              <option value="All">All Payables</option>
              <option value="With Balance Due">With Balance Due</option>
              <option value="Zero Balance">Zero Balance</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 4. Primary Vendor Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/75">
              <tr>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Vendor Code
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Vendor Name
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Primary Contact
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Purchases
                </th>
                <th className="px-3 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Amount Due
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredVendors.length > 0 ? (
                filteredVendors.map(vendor => {
                  const stats = vendorStatsMap.get(vendor.id) || vendorStatsMap.get(vendor.name) || {
                    totalPurchases: vendor.totalPurchases || 0,
                    totalOrders: vendor.totalOrders || 0,
                    openOrders: vendor.openOrders || 0,
                    amountDue: Number(vendor.payableBalance || vendor.payable_balance) || 0,
                  };

                  const totalPurchasesVal = stats.totalPurchases > 0 ? stats.totalPurchases : (vendor.totalPurchases || 0);
                  const effectiveDue = stats.amountDue > 0 ? stats.amountDue : (Number(vendor.payableBalance || vendor.payable_balance) || 0);
                  const statusVal = vendor.status || 'Active';

                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(vendor)}
                    >
                      {/* 1. Vendor Code */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-teal-700 group-hover:underline">
                          {vendor.code || vendor.id}
                        </span>
                        {stats.openOrders > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            {stats.openOrders} open PO{stats.openOrders > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      {/* 2. Vendor Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 group-hover:text-teal-700 text-xs sm:text-sm">
                          {vendor.name}
                        </div>
                        {vendor.paymentTerms || vendor.payment_terms ? (
                          <span className="text-[10px] text-slate-400 block">
                            {vendor.paymentTerms || vendor.payment_terms}
                          </span>
                        ) : null}
                      </td>

                      {/* 3. Category */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {vendor.category || 'General'}
                        </span>
                      </td>

                      {/* 4. Primary Contact */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                        {vendor.contactPerson || vendor.contact_person || 'Procurement Rep'}
                      </td>

                      {/* 5. Email */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                        <a 
                          href={`mailto:${vendor.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-teal-700 hover:underline"
                        >
                          {vendor.email}
                        </a>
                      </td>

                      {/* 6. Phone */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                        {vendor.phone || '—'}
                      </td>

                      {/* 7. Total Purchases */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        ₹{totalPurchasesVal.toLocaleString('en-IN')}
                      </td>

                      {/* 8. Amount Due */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-right font-mono font-black text-xs sm:text-sm">
                        <span className={effectiveDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          ₹{effectiveDue.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* 9. Rating */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {vendor.rating || 5.0}
                        </span>
                      </td>

                      {/* 10. Status (Display-Only) */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getStatusBadge(statusVal)}`}>
                          {statusVal}
                        </span>
                      </td>

                      {/* 11. Actions */}
                      <td
                        className="px-4 py-3.5 whitespace-nowrap text-right text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Create PO with vendor preselected */}
                          <button
                            onClick={() => handleCreatePOForVendor(vendor)}
                            title="Create Purchase Order for this Supplier"
                            className="px-2 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3 text-teal-600" /> PO
                          </button>

                          {/* Edit Supplier */}
                          <button
                            onClick={() => handleOpenEdit(vendor)}
                            title="Edit Supplier Profile"
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* View Full Details */}
                          <button
                            onClick={() => handleOpenDetails(vendor)}
                            title="View Supplier 360 Details"
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <Truck className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        {hasActiveFilters ? 'No matching vendors found' : 'No vendors registered yet'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {hasActiveFilters
                          ? 'Try adjusting your search query or clear selected status and category filters.'
                          : 'Register your first vendor to initiate procurement, manage supplier delivery, and track payables.'}
                      </p>
                      <div className="pt-2">
                        {hasActiveFilters ? (
                          <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                          >
                            Clear All Filters
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
                          >
                            + Register First Vendor
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modals */}
      {/* Create Vendor Modal */}
      <VendorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(v) => {
          setActiveVendor(v);
          setIsDetailsModalOpen(true);
        }}
      />

      {/* Edit Vendor Modal */}
      <VendorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveVendor(null);
        }}
        vendorToEdit={activeVendor}
        onSuccess={(v) => {
          setActiveVendor(v);
        }}
      />

      {/* Supplier 360 Details Modal */}
      <VendorDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setActiveVendor(null);
        }}
        vendor={activeVendor}
        onEdit={(v) => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(v);
        }}
        onCreatePO={(v) => {
          setIsDetailsModalOpen(false);
          handleCreatePOForVendor(v);
        }}
        onOpenPO={(po) => {
          setActivePO(po);
          setIsPoDetailsModalOpen(true);
        }}
      />

      {/* Create PO with Vendor Preselected */}
      <PurchaseOrderModal
        isOpen={isPoModalOpen}
        onClose={() => {
          setIsPoModalOpen(false);
          setActiveVendor(null);
        }}
        initialVendorId={activeVendor?.id}
      />

      {/* Purchase Order Details Modal (Cross-linked from Vendor Details) */}
      <PurchaseOrderDetailsModal
        isOpen={isPoDetailsModalOpen}
        onClose={() => {
          setIsPoDetailsModalOpen(false);
          setActivePO(null);
        }}
        purchaseOrder={activePO}
        onNavigateVendor={(vId) => {
          setIsPoDetailsModalOpen(false);
          const found = vendors.find(v => v.id === vId);
          if (found) {
            handleOpenDetails(found);
          }
        }}
      />
    </div>
  );
};
export default VendorsPage;
