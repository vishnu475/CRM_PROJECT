import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  Tag,
  DollarSign,
  Package,
  Layers,
  MapPin,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Percent,
  Plus
} from 'lucide-react';
import { Product, Vendor } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess?: (product: Product) => void;
}

const CATEGORIES = [
  'General',
  'Software / License',
  'Cloud Services',
  'Hardware & Equipment',
  'Office Supplies',
  'Raw Materials',
  'Networking & Telecom',
  'Consulting & Professional Services',
  'Maintenance & Support'
];

const UOM_OPTIONS = [
  'Units',
  'Licenses',
  'Hours',
  'Months',
  'Users',
  'Boxes',
  'Sets',
  'Kg',
  'Meters'
];

const WAREHOUSE_LOCATIONS = [
  'Main Warehouse - Bay A',
  'Main Warehouse - Bay B',
  'Central Distribution Center, Hyderabad',
  'Bengaluru Regional Hub',
  'Mumbai Depot - Rack 4',
  'Digital Delivery / Cloud Inventory'
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const { addProduct, updateProduct, vendors } = useApp();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Software / License');
  const [price, setPrice] = useState('150000');
  const [costPrice, setCostPrice] = useState('105000');
  const [purchasePrice, setPurchasePrice] = useState('112500');
  const [stock, setStock] = useState('50');
  const [reorderLevel, setReorderLevel] = useState('20');
  const [reorderQuantity, setReorderQuantity] = useState('50');
  const [uom, setUom] = useState('Units');
  const [hsnCode, setHsnCode] = useState('998313');
  const [taxRate, setTaxRate] = useState('18');
  const [warehouseLocation, setWarehouseLocation] = useState('Main Warehouse - Bay A');
  const [primaryVendorId, setPrimaryVendorId] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setSku(productToEdit.sku || productToEdit.id);
        setName(productToEdit.name || '');
        setCategory(productToEdit.category || 'General');
        setPrice(String(productToEdit.price || 0));
        setCostPrice(String(productToEdit.costPrice || productToEdit.cost_price || Math.round((productToEdit.price || 0) * 0.7)));
        setPurchasePrice(String(productToEdit.purchasePrice || productToEdit.purchase_price || Math.round((productToEdit.price || 0) * 0.75)));
        setStock(String(productToEdit.stock !== undefined ? productToEdit.stock : (productToEdit.onHandStock || 0)));
        setReorderLevel(String(productToEdit.reorderLevel || productToEdit.reorder_level || 20));
        setReorderQuantity(String(productToEdit.reorderQuantity || productToEdit.reorder_quantity || 50));
        setUom(productToEdit.uom || 'Units');
        setHsnCode(productToEdit.hsnCode || productToEdit.hsn_code || '');
        setTaxRate(String(productToEdit.taxRate || productToEdit.tax_rate || 18));
        setWarehouseLocation(productToEdit.warehouseLocation || productToEdit.warehouse_location || 'Main Warehouse - Bay A');
        setPrimaryVendorId(productToEdit.primaryVendorId || productToEdit.primary_vendor_id || '');
        setDescription(productToEdit.description || '');
      } else {
        const randCode = `SKU-PRD-${Math.floor(100 + Math.random() * 900)}`;
        setSku(randCode);
        setName('');
        setCategory('Software / License');
        setPrice('150000');
        setCostPrice('105000');
        setPurchasePrice('112500');
        setStock('50');
        setReorderLevel('20');
        setReorderQuantity('50');
        setUom('Units');
        setHsnCode('998313');
        setTaxRate('18');
        setWarehouseLocation('Main Warehouse - Bay A');
        setPrimaryVendorId('');
        setDescription('');
      }
      setError(null);
    }
  }, [isOpen, productToEdit]);

  // Auto-calculate default cost and purchase price when sales price changes (for new product)
  const handlePriceChange = (val: string) => {
    setPrice(val);
    if (!productToEdit) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        setCostPrice(String(Math.round(num * 0.70)));
        setPurchasePrice(String(Math.round(num * 0.75)));
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name.');
      return;
    }
    if (!sku.trim()) {
      setError('Please enter a valid SKU code.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedVendor = vendors.find(v => v.id === primaryVendorId);
      const payload = {
        sku: sku.trim(),
        name: name.trim(),
        category,
        price: parseFloat(price) || 0,
        costPrice: parseFloat(costPrice) || 0,
        cost_price: parseFloat(costPrice) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        purchase_price: parseFloat(purchasePrice) || 0,
        stock: parseInt(stock, 10) || 0,
        initialStock: parseInt(stock, 10) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 20,
        reorder_level: parseInt(reorderLevel, 10) || 20,
        reorderQuantity: parseInt(reorderQuantity, 10) || 50,
        reorder_quantity: parseInt(reorderQuantity, 10) || 50,
        uom,
        hsnCode: hsnCode.trim(),
        hsn_code: hsnCode.trim(),
        taxRate: parseFloat(taxRate) || 18,
        tax_rate: parseFloat(taxRate) || 18,
        warehouseLocation,
        warehouse_location: warehouseLocation,
        primaryVendorId: primaryVendorId || undefined,
        primary_vendor_id: primaryVendorId || undefined,
        primaryVendorName: selectedVendor?.name || undefined,
        primary_vendor_name: selectedVendor?.name || undefined,
        description: description.trim(),
      };

      if (productToEdit) {
        await updateProduct(productToEdit.id, payload);
        if (onSuccess) onSuccess({ ...productToEdit, ...payload });
      } else {
        const created = await addProduct(payload);
        if (created && onSuccess) onSuccess(created);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product SKU.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl backdrop-blur-md border border-amber-500/30">
              <Boxes className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {productToEdit ? 'Edit Product & Stock SKU' : 'Register New Product / SKU'}
              </h2>
              <p className="text-slate-300 text-xs mt-0.5">
                {productToEdit
                  ? `Update specifications and inventory policies for ${productToEdit.sku}`
                  : 'Define SKU details, pricing tiers, reorder levels, and warehouse location'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Product Master Identification */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-amber-600" /> 1. Product & Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Analytics Cloud License"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  SKU Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="SKU-ENT-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Unit of Measure (UOM)</label>
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  {UOM_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">HSN / SAC Code</label>
                <input
                  type="text"
                  placeholder="e.g. 998313"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Valuation */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> 2. Pricing & Cost Valuation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Sales Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full px-3.5 py-2 font-mono font-bold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cost Price (Valuation) (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Used for Inventory Valuation</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Purchase Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standard PO vendor price</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">GST Tax Rate (%)</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST (Standard)</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Stock Policy & Warehouse Location */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-indigo-600" /> 3. Stock Policy & Warehouse Management
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {productToEdit ? 'Current On-Hand Stock' : 'Initial Opening Stock'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2 font-mono font-bold text-indigo-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/30"
                />
                {!productToEdit && (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Logged as Opening Stock movement</span>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reorder Level (Alert Threshold)
                </label>
                <input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Triggers "Low Stock" warning</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Default Reorder Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(e.target.value)}
                  className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Warehouse / Storage Location</label>
                <select
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  {WAREHOUSE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Primary Supplier / Vendor</label>
                <select
                  value={primaryVendorId}
                  onChange={(e) => setPrimaryVendorId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="">-- Select Supplier --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.code || v.id})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Specifications & Notes */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-slate-700 font-semibold mb-1">Description & Deliverables</label>
            <textarea
              rows={2}
              placeholder="Technical specifications, software edition, packaging details, and warranty terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Total Valuation: <strong className="text-slate-800 font-mono">₹{((parseInt(stock, 10) || 0) * (parseFloat(costPrice) || 0)).toLocaleString('en-IN')}</strong>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold shadow-md shadow-amber-600/20 transition flex items-center gap-2"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{productToEdit ? 'Save Changes' : 'Register Product SKU'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
