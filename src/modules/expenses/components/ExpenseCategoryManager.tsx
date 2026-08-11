import React, { useState } from 'react';
import { Receipt, Plus, ShieldCheck, CheckSquare } from 'lucide-react';
import { ExpenseCategoryConfig } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

export const ExpenseCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<ExpenseCategoryConfig[]>([
    { id: 'cat-1', name: 'Travel & Local Conveyance', maxClaimLimit: 25000, requiresReceipt: true, status: 'Active' },
    { id: 'cat-2', name: 'Client Entertainment / Meals', maxClaimLimit: 10000, requiresReceipt: true, status: 'Active' },
    { id: 'cat-3', name: 'Office Stationery & Supplies', maxClaimLimit: 5000, requiresReceipt: false, status: 'Active' },
    { id: 'cat-4', name: 'Software Subscriptions & Cloud', maxClaimLimit: 50000, requiresReceipt: true, status: 'Active' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', limit: 10000, requiresReceipt: true });

  const handleAddCategory = () => {
    const created: ExpenseCategoryConfig = {
      id: `cat-${categories.length + 1}`,
      name: newCat.name,
      maxClaimLimit: Number(newCat.limit),
      requiresReceipt: newCat.requiresReceipt,
      status: 'Active'
    };
    setCategories([...categories, created]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="text-amber-600" size={18} /> Expense Category Policy Manager
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Configure claim caps, mandatory receipt policies, and approval thresholds.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Add Expense Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-amber-200 transition-all">
            <div className="flex justify-between items-center">
              <Badge variant="info">Category Policy</Badge>
              <Badge variant={cat.status === 'Active' ? 'success' : 'danger'}>{cat.status}</Badge>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">Max Limit: ₹ {cat.maxClaimLimit.toLocaleString()} / claim</p>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
              <span>Receipt Required:</span>
              <span className={`font-bold ${cat.requiresReceipt ? 'text-emerald-600' : 'text-slate-400'}`}>{cat.requiresReceipt ? 'Yes' : 'No'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Expense Category">
        <div className="space-y-4 text-xs">
          <Input label="Category Name" placeholder="e.g. Flight & Hotel Stay" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
          <Input label="Max Claim Limit per Submission (₹)" type="number" value={newCat.limit} onChange={(e) => setNewCat({ ...newCat, limit: Number(e.target.value) })} />
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="receipt" checked={newCat.requiresReceipt} onChange={(e) => setNewCat({ ...newCat, requiresReceipt: e.target.checked })} />
            <label htmlFor="receipt" className="font-semibold text-slate-700">Require mandatory receipt attachment</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddCategory}>Save Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
