import React from 'react';
import { Receipt, CheckCircle2, Clock, DollarSign, Award, ShieldAlert } from 'lucide-react';
import { ExtendedExpenseClaim } from '../types';

export interface ExpenseDashboardProps {
  claims: ExtendedExpenseClaim[];
}

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ claims }) => {
  const totalAmount = claims.reduce((s, c) => s + c.amount, 0);
  const reimbursedAmount = claims.filter(c => c.stage === 'Reimbursed').reduce((s, c) => s + c.amount, 0);
  const pendingCount = claims.filter(c => c.stage === 'Submitted' || c.stage === 'Manager Approved').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Claims Filed</span>
            <div className="text-xl font-bold text-slate-900">{claims.length}</div>
            <span className="text-[10px] text-slate-400">Total: ₹ {totalAmount.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Receipt size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="text-xl font-bold text-amber-600">{pendingCount}</div>
            <span className="text-[10px] text-amber-600 font-medium">Manager & Finance Stage</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reimbursed Disbursed</span>
            <div className="text-xl font-bold text-emerald-600">₹ {reimbursedAmount.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600 font-medium">Paid out to staff</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approval Funnel</span>
            <div className="text-xl font-bold text-purple-600">Multi-Level</div>
            <span className="text-[10px] text-purple-600 font-medium">Mgr ➔ Finance ➔ Disbursal</span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Award size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
