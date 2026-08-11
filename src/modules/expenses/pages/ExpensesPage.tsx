import React, { useState } from 'react';
import { Receipt, Plus, CheckCircle2, FileText, Upload } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const ExpensesPage: React.FC = () => {
  const { expenseClaims, approveExpense } = useApp();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="text-amber-600" size={24} />
            Expense Claims Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Employee travel, office, client meeting reimbursement claims and approval workflows.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsSubmitModalOpen(true)}>
          <Plus size={14} /> Submit Expense Claim
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Claim #</th>
              <th className="p-3.5">Employee</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5 text-right">Amount</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenseClaims.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono text-indigo-600 font-bold">{exp.claimNumber}</td>
                <td className="p-3.5 font-bold text-slate-900">{exp.empName}</td>
                <td className="p-3.5 font-semibold text-slate-700">{exp.category}</td>
                <td className="p-3.5 text-right font-bold text-amber-600">₹ {exp.amount.toLocaleString()}</td>
                <td className="p-3.5 text-center">
                  <Badge variant={exp.status === 'Approved' ? 'success' : 'warning'}>{exp.status}</Badge>
                </td>
                <td className="p-3.5 text-right">
                  {exp.status === 'Pending' && (
                    <button
                      onClick={() => approveExpense(exp.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} /> Approve Claim
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Expense Claim Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Submit Reimbursement Claim">
        <div className="space-y-4 text-xs">
          <Select
            label="Expense Category"
            options={[
              { label: 'Travel & Transport', value: 'travel' },
              { label: 'Client Entertainment / Meals', value: 'meals' },
              { label: 'Office Supplies', value: 'supplies' },
              { label: 'Software & Tools', value: 'software' }
            ]}
          />
          <Input label="Claim Amount (₹)" type="number" defaultValue="4500" />
          <Input label="Description / Business Purpose" placeholder="Explain the expense details..." />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Attachment</label>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50 text-slate-400 hover:border-amber-400 transition-colors cursor-pointer">
              <Upload size={20} className="mx-auto mb-1" />
              <span>Click to attach receipt bill image (PNG, JPG, PDF)</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsSubmitModalOpen(false)}>Submit Claim</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
