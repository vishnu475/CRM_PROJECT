import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Plus, Calendar as CalendarIcon, Umbrella, ShieldAlert } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const LeavePage: React.FC = () => {
  const { leaveRequests, approveLeave, rejectLeave } = useApp();
  const [activeTab, setActiveTab] = useState<'requests' | 'holidays'>('requests');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const leaveBalances = [
    { type: 'Casual Leave (CL)', remaining: 10, total: 12, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { type: 'Sick Leave (SL)', remaining: 8, total: 10, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { type: 'Earned Leave (EL)', remaining: 12, total: 15, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { type: 'Comp-Off', remaining: 2, total: 2, color: 'text-purple-600 bg-purple-50 border-purple-100' }
  ];

  const holidays = [
    { name: 'Independence Day', date: '15 Aug 2026', day: 'Saturday', type: 'Gazetted' },
    { name: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', type: 'Gazetted' },
    { name: 'Diwali', date: '08 Nov 2026', day: 'Sunday', type: 'Gazetted' }
  ];

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
        <Button variant="primary" size="sm" onClick={() => setIsApplyModalOpen(true)}>
          <Plus size={14} /> Apply for Leave
        </Button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {leaveBalances.map((b, i) => (
          <div key={i} className={`p-4 rounded-xl border ${b.color} flex justify-between items-center`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block">{b.type}</span>
              <span className="text-xl font-bold text-slate-900">{b.remaining} <span className="text-xs font-normal text-slate-400">/ {b.total} days</span></span>
            </div>
            <Umbrella size={24} className="opacity-80" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'requests' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarDays size={14} /> Leave Requests
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'holidays' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarIcon size={14} /> Public Holidays 2026
        </button>
      </div>

      {activeTab === 'requests' ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {holidays.map((h, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">{h.name}</span>
                <Badge variant="neutral">{h.type}</Badge>
              </div>
              <p className="text-xs text-amber-600 font-bold">{h.date} ({h.day})</p>
            </div>
          ))}
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Apply for Leave">
        <div className="space-y-4 text-xs">
          <Select
            label="Leave Type"
            options={[
              { label: 'Casual Leave (CL)', value: 'cl' },
              { label: 'Sick Leave (SL)', value: 'sl' },
              { label: 'Earned Leave (EL)', value: 'el' }
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Date" type="date" defaultValue="2026-08-15" />
            <Input label="End Date" type="date" defaultValue="2026-08-16" />
          </div>
          <Input label="Reason for Leave" placeholder="Enter reason for leave..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsApplyModalOpen(false)}>Submit Application</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
