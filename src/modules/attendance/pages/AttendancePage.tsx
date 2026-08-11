import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle2, AlertCircle, Plus, UserCheck, Play, Square, Filter, Search, Calendar as CalendarIcon, Sun, Moon, TrendingUp, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { ShiftMasterManager } from '../components/ShiftMasterManager';
import { AttendanceCalendarView } from '../components/AttendanceCalendarView';
import { OvertimeManagerView } from '../components/OvertimeManagerView';
import { DetailedAttendanceRecord, AttendanceLogStatus } from '../types';

export const AttendancePage: React.FC = () => {
  const { attendanceRecords, employees } = useApp();
  const [mainTab, setMainTab] = useState<'daily' | 'shifts' | 'calendar' | 'overtime'>('daily');

  // Punch widget state
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);

  // Filters State
  const [selectedDate, setSelectedDate] = useState('2026-08-11');
  const [selectedEmp, setSelectedEmp] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<AttendanceLogStatus | 'All'>('All');

  // Map AppContext attendance records to DetailedAttendanceRecord with Late In, Early Out & Overtime data
  const detailedRecords: DetailedAttendanceRecord[] = attendanceRecords.map((att, idx) => {
    const isLateIn = idx % 2 === 1;
    const isEarlyOut = idx % 3 === 2;
    const overtimeHours = idx % 2 === 0 ? 2.5 : 0;
    const status: AttendanceLogStatus = isLateIn ? 'Late In' : isEarlyOut ? 'Early Out' : 'Present';
    return {
      ...att,
      empId: `EMP-00${idx + 1}`,
      department: idx % 2 === 0 ? 'Engineering' : 'Sales',
      shiftName: 'General Shift (GS)',
      overtimeHours,
      isLateIn,
      isEarlyOut,
      status,
      location: 'HQ Mumbai Office'
    };
  });

  // Filtered List
  const filteredRecords = detailedRecords.filter(r => {
    const matchesEmp = selectedEmp === 'All' || r.empName.toLowerCase().includes(selectedEmp.toLowerCase());
    const matchesDept = selectedDept === 'All' || r.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
    return matchesEmp && matchesDept && matchesStatus;
  });

  // Summary KPI Metrics
  const summaryMetrics = {
    totalEmployees: employees.length || 8,
    presentCount: detailedRecords.filter(r => r.status === 'Present' || r.status === 'Late In' || r.status === 'Early Out').length,
    lateInCount: detailedRecords.filter(r => r.isLateIn).length,
    earlyOutCount: detailedRecords.filter(r => r.isEarlyOut).length,
    absentCount: 1,
    totalOvertimeHours: detailedRecords.reduce((sum, r) => sum + r.overtimeHours, 0)
  };

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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={24} />
            Time & Attendance Management Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Biometric logs, check-in/out records, shift master, late in/early out indicators, overtime tracking, and monthly calendars.
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isCheckedIn ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Current Punch Status: {isCheckedIn ? 'Checked In' : 'Checked Out'}</h3>
            <p className="text-[11px] text-slate-500">
              {isCheckedIn ? `Punched in at ${checkInTime} • Location: HQ Office (IP: 192.168.1.50)` : 'Press Check In button to record today\'s attendance log.'}
            </p>
          </div>
        </div>
        {isCheckedIn && <Badge variant="success">Punched In</Badge>}
      </div>

      {/* Summary KPI Cards / Report */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Staff</span>
          <span className="text-lg font-bold text-slate-900">{summaryMetrics.totalEmployees}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present</span>
          <span className="text-lg font-bold text-emerald-600">{summaryMetrics.presentCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Late In</span>
          <span className="text-lg font-bold text-amber-600">{summaryMetrics.lateInCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Early Out</span>
          <span className="text-lg font-bold text-orange-600">{summaryMetrics.earlyOutCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent</span>
          <span className="text-lg font-bold text-rose-600">{summaryMetrics.absentCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">OT Extra Hours</span>
          <span className="text-lg font-bold text-purple-600">+{summaryMetrics.totalOvertimeHours} hrs</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('daily')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'daily' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Daily Logs & Employee History
        </button>
        <button
          onClick={() => setMainTab('shifts')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'shifts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Shift Master & Roster
        </button>
        <button
          onClick={() => setMainTab('calendar')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Attendance Calendar View
        </button>
        <button
          onClick={() => setMainTab('overtime')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'overtime' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overtime (OT) View
        </button>
      </div>

      {/* TAB: SHIFT MASTER */}
      {mainTab === 'shifts' && <ShiftMasterManager />}

      {/* TAB: CALENDAR */}
      {mainTab === 'calendar' && <AttendanceCalendarView records={detailedRecords} />}

      {/* TAB: OVERTIME */}
      {mainTab === 'overtime' && <OvertimeManagerView records={detailedRecords} />}

      {/* TAB: DAILY LOGS & FILTERS */}
      {mainTab === 'daily' && (
        <div className="space-y-4">
          {/* Multi-Filter Bar: Date, Employee, Department, Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Employee Filter */}
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Filter by employee..."
                  value={selectedEmp === 'All' ? '' : selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value || 'All')}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late In">Late In</option>
                <option value="Early Out">Early Out</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Detailed Attendance Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Check In</th>
                  <th className="p-3.5">Check Out</th>
                  <th className="p-3.5">Work Hours</th>
                  <th className="p-3.5">Late / Early Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{att.empName}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{att.department}</td>
                    <td className="p-3.5 text-slate-400">{att.date}</td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">{att.checkIn}</td>
                    <td className="p-3.5 font-mono text-blue-600 font-bold">{att.checkOut}</td>
                    <td className="p-3.5 font-bold">{att.workHours} hrs</td>
                    <td className="p-3.5 space-x-1">
                      {att.isLateIn && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded text-[10px]">Late In (+18m)</span>}
                      {att.isEarlyOut && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 font-bold rounded text-[10px]">Early Out</span>}
                      {!att.isLateIn && !att.isEarlyOut && <Badge variant="success">On Time</Badge>}
                    </td>
                    <td className="p-3.5 text-right">
                      <button className="text-blue-600 font-bold hover:underline">Punch Details &rarr;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Regularization Modal */}
      <Modal isOpen={isRegularizeOpen} onClose={() => setIsRegularizeOpen(false)} title="Attendance Regularization Request">
        <div className="space-y-4 text-xs">
          <Input label="Date" type="date" defaultValue={selectedDate} />
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
