import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { DetailedAttendanceRecord } from '../types';
import { useAttendance } from '../hooks/useAttendance';
import { isPublicHoliday, isScheduledWorkDay } from '../utils/attendanceCalculator';

export interface AttendanceCalendarViewProps {
  records: DetailedAttendanceRecord[];
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({ records }) => {
  const { employees, leaveRequests } = useAttendance();
  const [selectedMonth] = useState('August 2026');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');

  // Days in month grid (31 days for August 2026)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const activeEmployees = employees.filter(e => {
    if (e.status === 'Exited') return false;
    if (selectedDeptFilter !== 'All' && e.department !== selectedDeptFilter) return false;
    return true;
  });

  const getStatusForEmpAndDay = (empCodeOrId: string, dayNum: number) => {
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `2026-08-${formattedDay}`;

    const emp = employees.find(e => e.id === empCodeOrId || e.empCode === empCodeOrId);
    const empId = emp ? (emp.empCode || emp.id) : empCodeOrId;

    // Filter matching attendance records
    const dayRecords = records.filter(r => (r.employeeId === empId || r.empId === empId || r.employeeId === empCodeOrId || r.empId === empCodeOrId) && r.date === dateStr);

    if (dayRecords.length > 0) {
      return dayRecords[0].status || 'Present';
    }

    // Default calculations if no explicit record exists
    const holidayInfo = isPublicHoliday(dateStr);
    if (holidayInfo.isHoliday) return 'Holiday';

    const isWorkDay = isScheduledWorkDay(dateStr);
    if (!isWorkDay) return 'Weekly Off';

    if (emp) {
      const matchingLeave = leaveRequests.find(lr => {
        const safeLrName = (lr.empName || '').toLowerCase();
        const safeEmpName = (emp.name || '').toLowerCase();
        const isEmp = (lr.empId && lr.empId === emp.id) || (Boolean(safeLrName) && Boolean(safeEmpName) && safeLrName === safeEmpName);
        if (!isEmp || lr.status !== 'Approved') return false;
        const start = new Date(lr.startDate).getTime();
        const end = new Date(lr.endDate).getTime();
        const target = new Date(dateStr).getTime();
        return target >= start && target <= end;
      });

      if (matchingLeave) {
        return matchingLeave.days <= 0.5 ? 'Half Day' : 'On Leave';
      }
    }

    return 'Absent';
  };

  const getStatusAbbr = (status: string) => {
    switch (status) {
      case 'Present': case 'PRESENT': return 'P';
      case 'Late In': case 'LATE_IN': return 'L';
      case 'Early Out': case 'EARLY_OUT': return 'EO';
      case 'Absent': case 'ABSENT': return 'A';
      case 'On Leave': case 'ON_LEAVE': return 'OL';
      case 'Half Day': case 'HALF_DAY': return 'HD';
      case 'Holiday': case 'HOLIDAY': return 'H';
      case 'Weekly Off': case 'WEEKLY_OFF': return 'WO';
      default: return 'P';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Present': case 'PRESENT':
        return 'bg-emerald-100 text-emerald-800 font-bold border-emerald-200';
      case 'Late In': case 'LATE_IN':
        return 'bg-amber-100 text-amber-800 font-bold border-amber-200';
      case 'Early Out': case 'EARLY_OUT':
        return 'bg-orange-100 text-orange-800 font-bold border-orange-200';
      case 'Absent': case 'ABSENT':
        return 'bg-rose-100 text-rose-800 font-bold border-rose-200';
      case 'On Leave': case 'ON_LEAVE': case 'Half Day': case 'HALF_DAY':
        return 'bg-indigo-100 text-indigo-800 font-bold border-indigo-200';
      case 'Holiday': case 'HOLIDAY':
        return 'bg-purple-100 text-purple-800 font-bold border-purple-200';
      case 'Weekly Off': case 'WEEKLY_OFF':
        return 'bg-slate-100 text-slate-400 font-medium border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="text-blue-600" size={18} /> Employee Attendance Calendar Matrix ({selectedMonth})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Arranged by employee with daily 31-day attendance roster mapping.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
          </select>

          {/* Employee Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <User size={13} className="text-slate-400" />
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              <option value="All">All Employees Matrix View ({activeEmployees.length})</option>
              {activeEmployees.map((e) => (
                <option key={e.id} value={e.empCode || e.id}>
                  {e.name} ({e.empCode || e.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold bg-slate-100 rounded-lg px-2 py-1">
            <button className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={14} /></button>
            <span>{selectedMonth}</span>
            <button className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> P: Present</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> L: Late In</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" /> EO: Early Out</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" /> OL/HD: Leave / Half-Day</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block" /> H: Holiday</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block" /> WO: Weekly Off</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> A: Absent</span>
      </div>

      {/* VIEW 1: ALL EMPLOYEES MATRIX TABLE */}
      {selectedEmpId === 'All' ? (
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-white uppercase text-[10px] font-bold sticky top-0">
              <tr>
                <th className="p-2.5 min-w-[140px] sticky left-0 bg-slate-800 z-10">Employee</th>
                <th className="p-2.5 min-w-[80px]">ID</th>
                <th className="p-2.5 min-w-[100px]">Department</th>
                {daysInMonth.map(day => (
                  <th key={day} className="p-1.5 text-center min-w-[28px] border-l border-slate-700">
                    {day}
                  </th>
                ))}
                <th className="p-2.5 text-center border-l border-slate-700 bg-emerald-900/60">P</th>
                <th className="p-2.5 text-center bg-rose-900/60">A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeEmployees.map((emp) => {
                const empCode = emp.empCode || emp.id;
                let presentTotal = 0;
                let absentTotal = 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 sticky left-0 bg-white shadow-sm border-r border-slate-200 truncate">
                      {emp.name}
                    </td>
                    <td className="p-2.5 font-mono text-slate-500 text-[11px]">{empCode}</td>
                    <td className="p-2.5 text-slate-600 font-semibold text-[11px]">{emp.department || 'Engineering'}</td>
                    
                    {daysInMonth.map(day => {
                      const status = getStatusForEmpAndDay(empCode, day);
                      if (status === 'Present' || status === 'Late In' || status === 'Early Out' || status === 'PRESENT') presentTotal++;
                      if (status === 'Absent' || status === 'ABSENT') absentTotal++;

                      const abbr = getStatusAbbr(status);
                      const style = getStatusStyle(status);

                      return (
                        <td key={day} className="p-1 text-center border-l border-slate-100">
                          <span
                            title={`Day ${day}: ${status}`}
                            className={`inline-block w-6 h-6 leading-6 text-[10px] rounded-md border text-center transition-all ${style}`}
                          >
                            {abbr}
                          </span>
                        </td>
                      );
                    })}

                    <td className="p-2.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-l border-slate-200">
                      {presentTotal}
                    </td>
                    <td className="p-2.5 text-center font-bold text-rose-700 bg-rose-50/50">
                      {absentTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW 2: INDIVIDUAL EMPLOYEE CALENDAR GRID */
        <div className="space-y-4">
          {(() => {
            const emp = activeEmployees.find(e => (e.empCode || e.id) === selectedEmpId || e.id === selectedEmpId);
            if (!emp) return null;
            return (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                    <p className="text-xs text-slate-500">
                      ID: <span className="font-mono font-semibold">{emp.empCode || emp.id}</span> • Dept: <span className="font-semibold">{emp.department}</span> • Position: <span className="font-semibold">{emp.designation}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmpId('All')}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-sm"
                >
                  ← Back to All Staff Matrix
                </button>
              </div>
            );
          })()}

          <div className="grid grid-cols-7 gap-2 pt-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
            ))}

            {daysInMonth.map((day) => {
              const status = getStatusForEmpAndDay(selectedEmpId, day);
              const style = getStatusStyle(status);
              return (
                <div key={day} className={`p-3 rounded-xl border text-xs font-bold transition-all ${style}`}>
                  <div className="text-sm">{day}</div>
                  <div className="text-[10px] font-normal opacity-90 mt-1 truncate">{status}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

