import React, { useState } from 'react';
import {
  X,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Product } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: () => void;
}

const ADJUSTMENT_REASONS = [
  { label: 'Physical Count Audit / Inventory Reconciliation', defaultDelta: 0 },
  { label: 'Damaged Goods / Scrap Write-off', defaultDelta: -1 },
  { label: 'Loss / Theft / Missing Stock', defaultDelta: -1 },
  { label: 'Customer Return / Restock to Inventory', defaultDelta: 1 },
  { label: 'Supplier Inward / Delivery Discrepancy Correction', defaultDelta: 1 },
  { label: 'Internal Demo / Testing Usage', defaultDelta: -1 },
  { label: 'Other Stock Correction', defaultDelta: 0 }
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const { adjustProductStock } = useApp();

  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>('0');
  const [reason, setReason] = useState(ADJUSTMENT_REASONS[0].label);
  const [performedBy, setPerformedBy] = useState('Warehouse Supervisor (Ashok)');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = parseInt(String(product.stock !== undefined ? product.stock : product.onHandStock), 10) || 0;
  const adjQty = parseInt(adjustmentQuantity, 10) || 0;
  const newStock = currentStock + adjQty;
  const isNegative = newStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjQty === 0) {
      setError('Please specify a non-zero adjustment quantity (+ or -).');
      return;
    }

    if (isNegative) {
      setError(`Adjustment cannot result in negative stock. Minimum allowable adjustment is -${currentStock}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await adjustProductStock(product.id, {
        adjustmentQuantity: adjQty,
        reason,
        performedBy,
        notes: notes.trim(),
        location: product.warehouseLocation || product.warehouse_location || 'Main Warehouse - Bay A'
      });

      if (result.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to apply stock adjustment.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while adjusting stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <Sliders className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Adjust Physical Stock
              </h2>
              <p className="text-slate-300 text-xs mt-0.5">
                Record audited count adjustments, damaged write-offs, or returns
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

        {/* Product Snapshot */}
        <div className="bg-slate-50 border-b border-slate-200/90 px-6 py-3 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900">{product.name}</span>
            <span className="font-mono text-slate-500 ml-2 font-semibold">({product.sku})</span>
          </div>
          <div className="text-slate-600">
            Current On-Hand: <strong className="font-mono text-slate-900 text-sm font-black">{currentStock}</strong> {product.uom || 'units'}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Adjustment Reason */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Adjustment Type / Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r.label} value={r.label}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity Adjustment Input */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Adjustment Quantity (+ Increase / - Decrease) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                placeholder="e.g. -5 for damaged or +10 for inward"
                className={`w-full px-3.5 py-2.5 font-mono text-base font-bold border rounded-xl focus:ring-2 focus:outline-none ${
                  isNegative
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/40 text-rose-900'
                    : adjQty < 0
                    ? 'border-amber-300 focus:ring-amber-500 bg-amber-50/20 text-amber-900'
                    : 'border-slate-200 focus:ring-indigo-500 text-slate-900'
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Positive values add stock (e.g., <strong>+10</strong>). Negative values reduce stock (e.g., <strong>-5</strong>).
            </p>
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span>Current On-Hand Stock:</span>
              <span className="font-mono font-bold text-slate-900">{currentStock} {product.uom || 'units'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Adjustment Value:</span>
              <span className={`font-mono font-bold ${adjQty < 0 ? 'text-rose-600' : adjQty > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                {adjQty > 0 ? `+${adjQty}` : adjQty} {product.uom || 'units'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold">
              <span>New Resulting Stock:</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-base font-black ${isNegative ? 'text-rose-600' : 'text-indigo-950'}`}>
                  {newStock} {product.uom || 'units'}
                </span>
                {adjQty > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : adjQty < 0 ? (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                ) : null}
              </div>
            </div>

            {isNegative && (
              <div className="pt-2 text-[11px] text-rose-600 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Error: Stock cannot become negative ({newStock}).</span>
              </div>
            )}
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Authorized Staff / Performed By
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Audit Notes & Justification</label>
            <textarea
              rows={2}
              placeholder="e.g. Discovered 3 broken units during Q3 physical count reconciliation in Bay A..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
              disabled={submitting || isNegative || adjQty === 0}
              className={`px-5 py-2 text-white rounded-xl font-bold shadow-md transition flex items-center gap-2 ${
                isNegative || adjQty === 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-600/20'
              }`}
            >
              {submitting ? (
                <span>Adjusting Stock...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Adjustment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
