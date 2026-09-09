import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Boxes,
  Package,
  Layers,
  MapPin,
  Truck,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  ShoppingCart,
  Plus,
  Sliders,
  Edit,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Building2,
  Calendar
} from 'lucide-react';
import { Product, StockMovement, PurchaseOrder, SalesOrder } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { CRMProductsAPI } from '../../../services/apiService';

interface InventoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit?: (product: Product) => void;
  onAdjustStock?: (product: Product) => void;
}

type TabType = 'overview' | 'movements' | 'purchases' | 'sales';

export const InventoryDetailsModal: React.FC<InventoryDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onAdjustStock,
}) => {
  const { purchaseOrders, salesOrders, vendors } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Fetch complete product details with movements when opened
  useEffect(() => {
    let isMounted = true;
    if (isOpen && product?.id) {
      setLoadingDetails(true);
      CRMProductsAPI.getById(product.id)
        .then((res: any) => {
          if (isMounted && res.success && res.data) {
            setDetailedProduct(res.data);
          }
        })
        .catch((err: any) => {
          console.warn('Failed to fetch detailed product movements:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingDetails(false);
        });
    } else {
      setDetailedProduct(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, product?.id]);

  const activeProd = detailedProduct || product;

  // Derive linked Purchase Orders for this SKU
  const linkedPOs = useMemo(() => {
    if (!activeProd) return [];
    return purchaseOrders.filter(po => {
      if (po.items && Array.isArray(po.items)) {
        return po.items.some(
          it => it.productId === activeProd.id || it.product_id === activeProd.id || it.productName === activeProd.name || it.item_name === activeProd.name
        );
      }
      return false;
    });
  }, [purchaseOrders, activeProd]);

  // Derive linked Sales Orders for this SKU
  const linkedSOs = useMemo(() => {
    if (!activeProd) return [];
    return salesOrders.filter(so => {
      if (so.items && Array.isArray(so.items)) {
        return so.items.some(
          it => it.productId === activeProd.id || it.product_id === activeProd.id || it.productName === activeProd.name
        );
      }
      return false;
    });
  }, [salesOrders, activeProd]);

  // Derive movements
  const movementsList = useMemo(() => {
    if (detailedProduct?.movements && Array.isArray(detailedProduct.movements)) {
      return detailedProduct.movements;
    }
    return [];
  }, [detailedProduct]);

  // Stock status styling helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'Low Stock':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Out of Stock':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'Purchase Receipt':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Sales Issue':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Adjustment':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Opening Stock':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Rule of hooks: Conditional return AFTER all hooks
  if (!isOpen || !activeProd) return null;

  const onHand = Number(activeProd.stock !== undefined ? activeProd.stock : activeProd.onHandStock) || 0;
  const reserved = Number(activeProd.reservedStock || activeProd.reserved_stock) || 0;
  const available = Number(activeProd.availableStock !== undefined ? activeProd.availableStock : Math.max(0, onHand - reserved));
  const reorderLvl = Number(activeProd.reorderLevel || activeProd.reorder_level) || 20;
  const cost = Number(activeProd.costPrice || activeProd.cost_price || activeProd.price * 0.7) || 0;
  const valuation = Number(activeProd.inventoryValue || activeProd.inventory_value || onHand * cost) || 0;
  const status = activeProd.stockStatus || activeProd.stock_status || (available <= 0 ? 'Out of Stock' : available <= reorderLvl ? 'Low Stock' : 'In Stock');

  const vendorObj = vendors.find(v => v.id === (activeProd.primaryVendorId || activeProd.primary_vendor_id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md shadow-inner border border-white/10">
              <Boxes className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {activeProd.name}
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-white/15 text-amber-200 border border-white/20 font-bold">
                  {activeProd.sku}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-400/30 font-medium">
                  {activeProd.category || 'General'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getStatusBadge(status)}`}>
                  {status}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1 flex items-center gap-3">
                <span>Location: <strong className="text-white">{activeProd.warehouseLocation || activeProd.warehouse_location || 'Main Warehouse - Bay A'}</strong></span>
                <span>•</span>
                <span>Unit Price: <strong className="text-white font-mono">₹{activeProd.price.toLocaleString('en-IN')}</strong></span>
                <span>•</span>
                <span>Unit Cost: <strong className="text-white font-mono">₹{cost.toLocaleString('en-IN')}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAdjustStock && (
              <button
                onClick={() => onAdjustStock(activeProd)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" /> Adjust Stock
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(activeProd)}
                className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Product
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6 Key Stock Metrics Bar */}
        <div className="bg-slate-50 border-b border-slate-200/90 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs flex-shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">On Hand Stock</span>
            <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">
              {onHand} <span className="text-xs font-normal text-slate-500">{activeProd.uom || 'units'}</span>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reserved Stock</span>
            <span className="text-sm font-black text-amber-700 font-mono block mt-0.5">
              {reserved} <span className="text-xs font-normal text-slate-500">{activeProd.uom || 'units'}</span>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Stock</span>
            <span className={`text-sm font-black font-mono block mt-0.5 ${available <= 0 ? 'text-rose-600' : available <= reorderLvl ? 'text-amber-600' : 'text-emerald-700'}`}>
              {available} <span className="text-xs font-normal text-slate-500">{activeProd.uom || 'units'}</span>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reorder Level</span>
            <span className="text-sm font-black text-indigo-900 font-mono block mt-0.5">
              {reorderLvl} <span className="text-xs font-normal text-slate-500">threshold</span>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Valuation</span>
            <span className="text-sm font-black text-emerald-700 font-mono block mt-0.5">
              ₹{valuation.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Status</span>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(status)}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 flex-shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> Stock Overview & Policies
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'movements'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Stock Movements Audit Trail
            {movementsList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-700">
                {movementsList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'purchases'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Procurement & Supply ({linkedPOs.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Sales Allocations ({linkedSOs.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs bg-slate-50/40">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Reorder Alert Notice if Low or Out of Stock */}
              {status !== 'In Stock' && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  status === 'Out of Stock'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <h4 className="font-bold text-sm">
                      {status === 'Out of Stock' ? 'Stock Depleted (Out of Stock)' : 'Low Stock Warning'}
                    </h4>
                    <p className="text-xs mt-0.5">
                      {status === 'Out of Stock'
                        ? `Available quantity is 0. Reorder at least ${activeProd.reorderQuantity || 50} units to fulfill upcoming demand.`
                        : `Available stock (${available} units) is at or below the reorder threshold of ${reorderLvl} units. Consider placing a purchase order.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Card A: Commercial Pricing & Margins */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Pricing & Profit Margins
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Sales Price (Customer List):</span>
                      <span className="font-bold font-mono text-slate-900">₹{activeProd.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Cost Price (Inventory Costing):</span>
                      <span className="font-bold font-mono text-slate-900">₹{cost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Standard PO Purchase Price:</span>
                      <span className="font-bold font-mono text-slate-900">
                        ₹{Number(activeProd.purchasePrice || activeProd.purchase_price || cost).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Gross Margin per Unit:</span>
                      <span className="font-bold font-mono text-emerald-700">
                        ₹{(activeProd.price - cost).toLocaleString('en-IN')} ({activeProd.price > 0 ? (((activeProd.price - cost) / activeProd.price) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">GST / Tax Rate:</span>
                      <span className="font-bold text-slate-800">{activeProd.taxRate || activeProd.tax_rate || 18}% GST</span>
                    </div>
                  </div>
                </div>

                {/* Card B: Storage & Supplier */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                    <MapPin className="w-4 h-4 text-indigo-600" /> Warehouse & Supplier Sourcing
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Assigned Location:</span>
                      <span className="font-semibold text-slate-900">{activeProd.warehouseLocation || activeProd.warehouse_location || 'Main Warehouse - Bay A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Primary Supplier:</span>
                      <span className="font-semibold text-slate-900">
                        {activeProd.primaryVendorName || activeProd.primary_vendor_name || vendorObj?.name || 'Unassigned / Multiple'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Default Reorder Quantity:</span>
                      <span className="font-bold font-mono text-slate-900">{activeProd.reorderQuantity || activeProd.reorder_quantity || 50} units</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Unit of Measure:</span>
                      <span className="font-semibold text-slate-900">{activeProd.uom || 'Units'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">HSN / SAC Code:</span>
                      <span className="font-mono text-slate-900">{activeProd.hsnCode || activeProd.hsn_code || '998313'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Technical Specs */}
              {activeProd.description && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                    <FileText className="w-4 h-4 text-slate-600" /> Description & Deliverables
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{activeProd.description}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOVEMENTS AUDIT TRAIL */}
          {activeTab === 'movements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Stock Movements Audit Ledger</h3>
                  <p className="text-slate-500 text-xs">Complete traceability of goods receipts, sales issues, and stock count adjustments</p>
                </div>
                {onAdjustStock && (
                  <button
                    onClick={() => onAdjustStock(activeProd)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Stock Adjustment
                  </button>
                )}
              </div>

              {loadingDetails ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
                  Loading stock audit trail...
                </div>
              ) : movementsList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                  <History className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">No stock movement entries recorded yet</p>
                  <p className="text-xs">Goods receipts and physical adjustments will automatically be logged here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Quantity</th>
                          <th className="py-3 px-4">Stock (Before → After)</th>
                          <th className="py-3 px-4">Reference No</th>
                          <th className="py-3 px-4">Reason / Notes</th>
                          <th className="py-3 px-4">Performed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {movementsList.map((m: StockMovement) => {
                          const qty = Number(m.quantity) || 0;
                          const isPositive = qty > 0;
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                                {m.createdAt || m.created_at ? new Date(m.createdAt || m.created_at || '').toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getMovementTypeBadge(m.movementType || m.movement_type || '')}`}>
                                  {m.movementType || m.movement_type}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-black text-sm whitespace-nowrap">
                                <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                                  {isPositive ? `+${qty}` : qty} {activeProd.uom || 'units'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                                {m.previousStock !== undefined ? m.previousStock : m.previous_stock} → <strong className="text-slate-900 font-bold">{m.newStock !== undefined ? m.newStock : m.new_stock}</strong>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-indigo-900 whitespace-nowrap">
                                {m.referenceNumber || m.reference_number || m.referenceId || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                                <span className="font-semibold text-slate-900">{m.reason || 'Standard Transaction'}</span>
                                {m.notes && <span className="text-slate-500 block text-[11px] truncate">{m.notes}</span>}
                              </td>
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                {m.performedBy || m.performed_by || 'System'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PURCHASES & SUPPLY */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Linked Purchase Orders & Goods Receipts</h3>
                <p className="text-slate-500 text-xs">Inward procurement orders that have supplied this product SKU</p>
              </div>

              {linkedPOs.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                  <Truck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">No Purchase Orders found for this SKU</p>
                  <p className="text-xs">Create a purchase order to order new stock from registered suppliers.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">PO Number</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Supplier / Vendor</th>
                          <th className="py-3 px-4">Ordered Qty</th>
                          <th className="py-3 px-4">Receipt Status</th>
                          <th className="py-3 px-4">Total Amount</th>
                          <th className="py-3 px-4">PO Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedPOs.map(po => {
                          const itemMatch = po.items?.find(
                            it => it.productId === activeProd.id || it.product_id === activeProd.id || it.productName === activeProd.name
                          );
                          return (
                            <tr key={po.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                {po.poNumber || po.po_number || po.id}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-mono">
                                {po.order_date || po.date || '—'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {po.vendorName || po.vendor_name || 'Supplier'}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                {itemMatch ? itemMatch.quantity : '—'} units
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  po.receiptStatus === 'Fully Received' || po.receipt_status === 'Fully Received'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : po.receiptStatus === 'Partially Received' || po.receipt_status === 'Partially Received'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {po.receiptStatus || po.receipt_status || 'Not Received'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                ₹{(Number(po.amount || po.total_amount) || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {po.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SALES ALLOCATIONS */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Sales Allocations & Commitments</h3>
                <p className="text-slate-500 text-xs">Customer orders currently reserving or fulfilled from this SKU inventory</p>
              </div>

              {linkedSOs.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                  <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">No Sales Orders currently reserving this SKU</p>
                  <p className="text-xs">When customers place orders, reserved stock allocations will appear here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">SO Number</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Reserved / Ordered Qty</th>
                          <th className="py-3 px-4">Fulfillment Status</th>
                          <th className="py-3 px-4">Order Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedSOs.map(so => {
                          const isFulfilled = (so.fulfillmentStatus || so.fulfillment_status) === 'Fulfilled';
                          const itemMatch = so.items?.find(
                            it => it.productId === activeProd.id || it.product_id === activeProd.id || it.productName === activeProd.name
                          );
                          return (
                            <tr key={so.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                {so.soNumber || so.so_number || so.id}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-mono">
                                {so.date || '—'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {so.customerName || so.customer_name || 'Customer'}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                {itemMatch ? itemMatch.quantity : '—'} units
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  isFulfilled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}>
                                  {isFulfilled ? 'Fulfilled (Stock Issued)' : 'Reserved (Pending Delivery)'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {so.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
