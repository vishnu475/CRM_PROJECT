import React from 'react';
import { Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { DetailedAttendanceRecord } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export interface OvertimeManagerViewProps {
  records: DetailedAttendanceRecord[];
}

export const OvertimeManagerView: React.FC<OvertimeManagerViewProps> = ({ records }) => {
  const otRecords = records.filter(r => r.overtimeHours > 0);

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={18} /> Overtime (OT) Tracking & Disbursal View
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Approved extra hours beyond standard 9-hour work shifts.</p>
        </div>
        <Badge variant="info">Total OT Hours: 14.5 hrs</Badge>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Employee</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Shift</th>
              <th className="p-3.5">Standard Hours</th>
              <th className="p-3.5 font-bold text-purple-600">OT Extra Hours</th>
              <th className="p-3.5 text-right font-bold text-emerald-600">OT Pay Rate</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {otRecords.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">{r.empName}</td>
                <td className="p-3.5">{r.department}</td>
                <td className="p-3.5 text-slate-400">{r.date}</td>
                <td className="p-3.5 font-semibold text-slate-700">{r.shiftName}</td>
                <td className="p-3.5">{r.workHours} hrs</td>
                <td className="p-3.5 font-bold text-purple-600">+{r.overtimeHours} hrs OT</td>
                <td className="p-3.5 text-right font-bold text-emerald-600">₹ {(r.overtimeHours * 450).toLocaleString()}</td>
                <td className="p-3.5 text-right">
                  <Button variant="outline" size="sm">
                    <CheckCircle2 size={12} /> Approve OT
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
