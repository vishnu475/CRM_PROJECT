import React from 'react';
import { CalendarDays, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const LeavePage: React.FC = () => {
  const { leaveRequests, approveLeave, rejectLeave } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="text-amber-600" size={24} />
            Leave Management Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track employee leave requests, balances, multi-level approvals, and holiday calendars.
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Apply for Leave
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Employee</th>
              <th className="p-3.5">Leave Type</th>
              <th className="p-3.5">Dates</th>
              <th className="p-3.5">Days</th>
              <th className="p-3.5">Reason</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaveRequests.map((lv) => (
              <tr key={lv.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">{lv.empName}</td>
                <td className="p-3.5 font-semibold text-slate-700">{lv.leaveType}</td>
                <td className="p-3.5 text-slate-500">{lv.startDate} to {lv.endDate}</td>
                <td className="p-3.5 font-bold text-slate-900">{lv.days}</td>
                <td className="p-3.5 max-w-xs truncate">{lv.reason}</td>
                <td className="p-3.5">
                  <Badge variant={lv.status === 'Approved' ? 'success' : lv.status === 'Rejected' ? 'danger' : 'warning'}>
                    {lv.status}
                  </Badge>
                </td>
                <td className="p-3.5 text-right">
                  {lv.status === 'Pending' && (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => approveLeave(lv.id)}
                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        onClick={() => rejectLeave(lv.id)}
                        className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
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
