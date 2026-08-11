import React from 'react';
import { Receipt, Plus, CheckCircle2, FileText } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const ExpensesPage: React.FC = () => {
  const { expenseClaims, approveExpense } = useApp();

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
        <Button variant="primary" size="sm">
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
    </div>
  );
};
