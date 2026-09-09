import React, { useState } from 'react';
import { X, PackageCheck, AlertCircle, CheckCircle2, Truck } from 'lucide-react';
import { PurchaseOrder } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface ReceiveGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onSuccess?: () => void;
}

export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess
}) => {
  const { receivePurchaseOrderGoods } = useApp();

  const [receivedBy, setReceivedBy] = useState('');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [itemsToReceive, setItemsToReceive] = useState<{ [itemId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize receiving quantities when PO opens
  React.useEffect(() => {
    if (purchaseOrder && purchaseOrder.items) {
      const initial: { [itemId: string]: number } = {};
      purchaseOrder.items.forEach((item, idx) => {
        const key = String(item.id !== undefined ? item.id : idx);
        const received = item.receivedQuantity !== undefined ? item.receivedQuantity : (item.received_quantity || 0);
        const pending = Math.max(0, item.quantity - received);
        initial[key] = pending; // default to remaining pending
      });
      setItemsToReceive(initial);
      setDeliveryNoteNumber(`DN-${Date.now().toString().slice(-6)}`);
      setReceivedBy('Warehouse Manager');
      setError(null);
    }
  }, [purchaseOrder]);

  if (!isOpen || !purchaseOrder) return null;

  const handleQtyChange = (key: string, maxPending: number, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setItemsToReceive(prev => ({ ...prev, [key]: 0 }));
      return;
    }
    const clamped = Math.max(0, Math.min(num, maxPending));
    setItemsToReceive(prev => ({ ...prev, [key]: clamped }));
  };

  const handleSetAllMax = () => {
    if (!purchaseOrder.items) return;
    const updated: { [itemId: string]: number } = {};
    purchaseOrder.items.forEach((item, idx) => {
      const key = String(item.id !== undefined ? item.id : idx);
      const received = item.receivedQuantity !== undefined ? item.receivedQuantity : (item.received_quantity || 0);
      const pending = Math.max(0, item.quantity - received);
      updated[key] = pending;
    });
    setItemsToReceive(updated);
  };

  const handleSetAllZero = () => {
    if (!purchaseOrder.items) return;
    const updated: { [itemId: string]: number } = {};
    purchaseOrder.items.forEach((item, idx) => {
      const key = String(item.id !== undefined ? item.id : idx);
      updated[key] = 0;
    });
    setItemsToReceive(updated);
  };

  const totalSelectedToReceive = Object.values(itemsToReceive).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalSelectedToReceive <= 0) {
      setError('Please specify at least 1 item quantity to receive.');
      return;
    }

    const payloadItems = (purchaseOrder.items || [])
      .map((item, idx) => {
        const key = String(item.id !== undefined ? item.id : idx);
        return {
          po_item_id: item.id,
          received_quantity: itemsToReceive[key] || 0
        };
      })
      .filter(item => item.received_quantity > 0);

    setIsSubmitting(true);
    try {
      const res = await receivePurchaseOrderGoods(purchaseOrder.id, {
        received_by: receivedBy,
        delivery_note_number: deliveryNoteNumber,
        notes,
        items: payloadItems
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to process goods receipt');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while receiving goods');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Goods Receipt & Stock-In</h2>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">
                PO: <span className="font-semibold text-white">{purchaseOrder.po_number || purchaseOrder.poNumber || purchaseOrder.id}</span> • Vendor: <span className="font-semibold text-white">{purchaseOrder.vendor_name || purchaseOrder.vendorName}</span>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Receipt Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Delivery Note / DC Number
              </label>
              <input
                type="text"
                value={deliveryNoteNumber}
                onChange={e => setDeliveryNoteNumber(e.target.value)}
                placeholder="e.g. DN-98421"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Received By (Warehouse Staff)
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                placeholder="Name of receiver"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Items Receipt Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Line Items to Receive</h3>
                <p className="text-xs text-slate-500">Specify incoming quantities. Inventory will be atomically increased.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetAllMax}
                  className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                >
                  Receive All Pending
                </button>
                <button
                  type="button"
                  onClick={handleSetAllZero}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Product / Item
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Ordered
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Already Received
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider w-36">
                      Receiving Now
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                    purchaseOrder.items.map((item, idx) => {
                      const key = String(item.id !== undefined ? item.id : idx);
                      const received = item.receivedQuantity !== undefined ? item.receivedQuantity : (item.received_quantity || 0);
                      const pending = Math.max(0, item.quantity - received);
                      const isComplete = pending === 0;
                      const itemName = item.productName || item.item_name || 'Item';

                      return (
                        <tr key={key} className={isComplete ? 'bg-slate-50/70' : 'hover:bg-slate-50/50'}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 text-sm">{itemName}</div>
                            {item.sku && (
                              <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono mt-0.5">
                                SKU: {item.sku}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center text-sm font-medium text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-center text-sm font-medium text-emerald-600">
                            {received}
                          </td>
                          <td className="px-3 py-3 text-center text-sm font-medium">
                            <span className={pending > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                              {pending}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Received
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={pending}
                                  value={itemsToReceive[key] !== undefined ? itemsToReceive[key] : pending}
                                  onChange={e => handleQtyChange(key, pending, e.target.value)}
                                  className="w-20 px-2.5 py-1 text-sm font-bold text-right border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/30 text-slate-900"
                                />
                                <span className="text-xs text-slate-400 font-medium">/ {pending}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">
                        No line items found for this Purchase Order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receiving Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Goods Receipt Inspection Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Package condition, batch details, barcode scanning remarks..."
              rows={2}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Audit Info Notice */}
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Automated Inventory Integration:</span> Receiving goods creates a Goods Receipt record (GRN) and increments current on-hand stock for linked products in the inventory catalog.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Total Units to Stock In: <span className="font-bold text-slate-800 text-sm">{totalSelectedToReceive}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totalSelectedToReceive <= 0}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Stock-In...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    <span>Confirm & Stock-In ({totalSelectedToReceive} units)</span>
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
