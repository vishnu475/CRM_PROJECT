import React, { useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { DetailedAttendanceRecord } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export interface OvertimeManagerViewProps {
  records: DetailedAttendanceRecord[];
}

export const OvertimeManagerView: React.FC<OvertimeManagerViewProps> = ({ records }) => {
  const otRecords = records.filter(r => r.overtimeHours > 0);
  const totalOtHours = otRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
  
  const [approvedOtIds, setApprovedOtIds] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(450);

  const toggleApprove = (id: string) => {
    if (approvedOtIds.includes(id)) {
      setApprovedOtIds(approvedOtIds.filter(i => i !== id));
    } else {
      setApprovedOtIds([...approvedOtIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={18} /> Overtime (OT) Tracking & Disbursal View
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Approved extra hours beyond standard 9-hour work shifts.</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-500 font-medium">OT Rate (₹/hr):</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
              className="w-16 bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>
          <Badge variant="info">Total OT Hours: {totalOtHours.toFixed(1)} hrs</Badge>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {otRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No overtime entries recorded for the selected filter date/period.
          </div>
        ) : (
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
              {otRecords.map((r) => {
                const isApproved = approvedOtIds.includes(r.id);
                const otAmount = r.overtimeHours * hourlyRate;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{r.empName}</td>
                    <td className="p-3.5">{r.department}</td>
                    <td className="p-3.5 text-slate-400">{r.date}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{r.shiftName}</td>
                    <td className="p-3.5">{r.workHours} hrs</td>
                    <td className="p-3.5 font-bold text-purple-600">+{r.overtimeHours} hrs OT</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600">₹ {otAmount.toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant={isApproved ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => toggleApprove(r.id)}
                      >
                        <CheckCircle2 size={12} className={isApproved ? 'text-emerald-600' : ''} />
                        {isApproved ? 'OT Approved' : 'Approve OT'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
