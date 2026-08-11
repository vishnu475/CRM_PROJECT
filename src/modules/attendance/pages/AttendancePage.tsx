import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle2, AlertCircle, Plus, UserCheck, Play, Square } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const AttendancePage: React.FC = () => {
  const { attendanceRecords } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'roster'>('daily');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);

  const shiftTemplates = [
    { name: 'General Shift (GS)', timing: '09:00 AM - 06:00 PM', grace: '15 mins' },
    { name: 'Morning Shift (MS)', timing: '07:00 AM - 04:00 PM', grace: '15 mins' },
    { name: 'Night Shift (NS)', timing: '09:00 PM - 06:00 AM', grace: '30 mins' }
  ];

  const handlePunchToggle = () => {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setIsCheckedIn(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={24} />
            Time & Attendance Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Biometric logs, check-in/out records, shift rosters, overtime rules, and regularization requests.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsRegularizeOpen(true)}>
            <Clock size={14} /> Regularization Request
          </Button>
          <Button variant={isCheckedIn ? 'danger' : 'primary'} size="sm" onClick={handlePunchToggle}>
            {isCheckedIn ? <Square size={14} /> : <Play size={14} />}
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </Button>
        </div>
      </div>

      {/* Live Punch Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isCheckedIn ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Current Status: {isCheckedIn ? 'Checked In' : 'Checked Out'}</h3>
            <p className="text-[11px] text-slate-500">
              {isCheckedIn ? `Punched in at ${checkInTime} • Location: HQ Office` : 'Press Check In button to record today\'s attendance.'}
            </p>
          </div>
        </div>
        {isCheckedIn && <Badge variant="success">Punched In</Badge>}
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'daily' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Daily Logs
        </button>
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'roster' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Shift & Roster Templates
        </button>
      </div>

      {activeSubTab === 'daily' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Check In</th>
                <th className="p-3.5">Check Out</th>
                <th className="p-3.5">Work Hours</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRecords.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{att.empName}</td>
                  <td className="p-3.5">{att.date}</td>
                  <td className="p-3.5 font-mono text-emerald-600">{att.checkIn}</td>
                  <td className="p-3.5 font-mono text-blue-600">{att.checkOut}</td>
                  <td className="p-3.5 font-bold">{att.workHours} hrs</td>
                  <td className="p-3.5">
                    <Badge variant={att.status === 'Present' ? 'success' : 'warning'}>
                      {att.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shiftTemplates.map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
              <p className="text-xs text-slate-500 font-mono">Timing: {s.timing}</p>
              <p className="text-xs text-slate-400">Grace period: {s.grace}</p>
            </div>
          ))}
        </div>
      )}

      {/* Regularization Modal */}
      <Modal isOpen={isRegularizeOpen} onClose={() => setIsRegularizeOpen(false)} title="Attendance Regularization Request">
        <div className="space-y-4 text-xs">
          <Input label="Date" type="date" defaultValue="2026-08-11" />
          <Select
            label="Type of Request"
            options={[
              { label: 'Missed Punch In', value: 'in' },
              { label: 'Missed Punch Out', value: 'out' },
              { label: 'On-Duty Outside Office', value: 'onduty' }
            ]}
          />
          <Input label="Reason" placeholder="Explain the reason for regularization..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsRegularizeOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsRegularizeOpen(false)}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
