import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

interface EmployeeAttendanceViewProps {
  currentEmpId: string;
  onRefresh?: () => void;
}

export const EmployeeAttendanceView: React.FC<EmployeeAttendanceViewProps> = ({
  currentEmpId,
  onRefresh
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Regularization Modal
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    reason: 'Biometric Scanner Failure'
  });

  const fetchAttendance = async (m = selectedMonth, y = selectedYear) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/employee/me/attendance?month=${m}&year=${y}`, {
        headers: { 'x-employee-id': currentEmpId }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedMonth, selectedYear);
  }, [currentEmpId, selectedMonth, selectedYear]);

  const handleRegularizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/employee/me/regularize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-employee-id': currentEmpId },
        body: JSON.stringify(regForm)
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message || 'Regularization request submitted!' });
        setIsRegModalOpen(false);
        await fetchAttendance();
      } else {
        setFeedback({ type: 'error', message: json.message || 'Failed to submit regularization.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Server error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [viewMode, setViewMode] = useState<'records' | 'calendar'>('records');

  const parseMinutes = (t: string) => {
    if (!t || t === '-' || t === 'OFF') return null;
    const str = t.trim().toUpperCase();
    const isPM = str.includes('PM');
    const isAM = str.includes('AM');
    const clean = str.replace(/(AM|PM)/g, '').trim();
    const parts = clean.split(':');
    if (parts.length < 2) return null;
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  const renderStatusBadge = (r: any) => {
    const status = r.status;
    const checkIn = r.check_in;

    if (status === 'Weekly Off' || status === 'WEEKLY_OFF') {
      return <Badge variant="neutral">Weekly Off</Badge>;
    }
    if (status === 'On Leave' || status === 'ON_LEAVE') {
      return <Badge variant="info">On Leave</Badge>;
    }
    if (status === 'Holiday' || status === 'HOLIDAY') {
      return <Badge variant="info">Holiday</Badge>;
    }

    if (checkIn && checkIn !== '-' && checkIn !== 'OFF') {
      const inMins = parseMinutes(checkIn);
      const shiftStartMins = 10 * 60; // Assigned Shift Start: 10:00 AM (600 mins)
      const lateMins = inMins !== null ? Math.max(0, inMins - shiftStartMins) : 0;

      if (lateMins > 0) {
        const lateStr = lateMins >= 60 ? `${Math.floor(lateMins / 60)}h ${lateMins % 60}m` : `${lateMins}m`;
        return <Badge variant="warning">Late In ({lateStr} late)</Badge>;
      }
      return <Badge variant="success">On Time</Badge>;
    }

    return <Badge variant="danger">Absent</Badge>;
  };

  if (isLoading && !data) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="animate-spin text-blue-600" size={20} />
        <span className="text-xs font-semibold">Loading Attendance Records from PostgreSQL...</span>
      </div>
    );
  }

  const header = data?.header || {
    employeeName: 'Ashok',
    employeeId: currentEmpId,
    designation: 'Senior Full Stack Engineer',
    department: 'Product Management',
    reportingManager: 'Priya Sharma',
    shift: 'General Shift (10:00 AM - 05:00 PM)'
  };

  const records = data?.records || [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar Grid Calculation
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sun

  return (
    <div className="space-y-6">
      {/* FEEDBACK TOAST BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* MAIN ATTENDANCE SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        {/* SECTION HEADER WITH INLINE VIEW SWITCHER, MONTH/YEAR SELECTORS & REGULARIZATION BUTTON */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="text-purple-600" size={20} />
              {viewMode === 'records' ? `Attendance Records (${monthNames[selectedMonth - 1]} ${selectedYear})` : `Employee Attendance Calendar Matrix (${monthNames[selectedMonth - 1]} ${selectedYear})`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative PostgreSQL attendance logs for <span className="font-bold text-slate-900">{header.employeeName}</span> ({header.employeeId}). Shift: <span className="font-bold text-indigo-600">10:00 AM - 05:00 PM</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* VIEW MODE TOGGLE (DEFAULT: RECORDS TABLE) */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('records')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'records'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText size={14} /> Records Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'calendar'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <CalendarIcon size={14} /> Calendar Matrix
              </button>
            </div>

            {/* INLINE MONTH & YEAR SELECTORS */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm"
            >
              <Plus size={14} /> Request Regularization
            </Button>
          </div>
        </div>

        {/* VIEW 1: ATTENDANCE RECORDS TABLE (DEFAULT) */}
        {viewMode === 'records' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Check In</th>
                  <th className="p-3.5">Check Out</th>
                  <th className="p-3.5">Working Hours</th>
                  <th className="p-3.5">OT Hours</th>
                  <th className="p-3.5">Attendance Status</th>
                  <th className="p-3.5">Regularization Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No attendance records found for {monthNames[selectedMonth - 1]} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  records.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{r.date ? r.date.split('T')[0] : '-'}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600">{r.check_in || '-'}</td>
                      <td className="p-3.5 font-mono font-bold text-blue-600">{r.check_out || '-'}</td>
                      <td className="p-3.5 text-slate-900 font-bold">{r.worked_hours || 0} hrs</td>
                      <td className="p-3.5 text-purple-600 font-bold">{r.overtime_hours || 0} hrs</td>
                      <td className="p-3.5 font-bold">
                        {renderStatusBadge(r)}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {r.regularization_status || 'NONE'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: ATTENDANCE CALENDAR MATRIX GRID */}
        {viewMode === 'calendar' && (
          <div className="space-y-2.5">
            {/* STATUS LEGEND BAR - SINGLE CRISP COLOR DOT */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> P: Present</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> L: Late In</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> EO: Early Out</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> OL/HD: Leave / Half-Day</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> H: Holiday</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span> WO: Weekly Off</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> A: Absent</div>
            </div>

            {/* CALENDAR MATRIX GRID - BALANCED COMFORTABLE TILES */}
            <div className="grid grid-cols-7 gap-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <div key={day} className="text-center py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {day}
                </div>
              ))}

              {/* EMPTY OFFSET BOXES BEFORE DAY 1 */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[58px] bg-slate-50/40 border border-slate-100 rounded-xl opacity-40"></div>
              ))}

              {/* MONTH DAY BOXES */}
              {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const matchedRecord = records.find((r: any) => r.date && r.date.split('T')[0] === dayStr);

                const dayDate = new Date(selectedYear, selectedMonth - 1, dayNum);
                const isSunday = dayDate.getDay() === 0;

                let status = matchedRecord?.status || (isSunday ? 'Weekly Off' : 'Absent');
                let checkIn = matchedRecord?.check_in || '-';
                let checkOut = matchedRecord?.check_out || '-';

                // Color styling matching user screenshot
                let bgStyle = 'bg-rose-50/75 border-rose-200/80 text-rose-900';
                let labelColor = 'text-rose-700';

                if (status === 'Present' || status === 'PRESENT' || (checkIn && checkIn !== '-')) {
                  bgStyle = 'bg-emerald-50/90 border-emerald-200 text-emerald-950';
                  labelColor = 'text-emerald-700 font-bold';
                  status = 'Present';
                } else if (status === 'Late In' || status === 'LATE_IN') {
                  bgStyle = 'bg-amber-50/90 border-amber-200 text-amber-950';
                  labelColor = 'text-amber-700 font-bold';
                } else if (status === 'Early Out' || status === 'EARLY_OUT') {
                  bgStyle = 'bg-orange-50/90 border-orange-200 text-orange-950';
                  labelColor = 'text-orange-700 font-bold';
                } else if (status === 'Weekly Off' || status === 'WEEKLY_OFF' || isSunday) {
                  bgStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                  labelColor = 'text-slate-500 font-medium';
                  status = 'Weekly Off';
                } else if (status === 'On Leave' || status === 'ON_LEAVE') {
                  bgStyle = 'bg-blue-50/90 border-blue-200 text-blue-950';
                  labelColor = 'text-blue-700 font-bold';
                } else if (status === 'Holiday' || status === 'HOLIDAY') {
                  bgStyle = 'bg-purple-50/90 border-purple-200 text-purple-950';
                  labelColor = 'text-purple-700 font-bold';
                }

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[58px] p-2 px-2.5 rounded-xl border transition-all flex flex-col justify-between ${bgStyle} hover:shadow-md cursor-pointer`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs">{dayNum}</span>
                      {checkIn !== '-' && (
                        <span className="text-[9px] font-mono font-bold bg-white/90 px-1.5 py-0.5 rounded text-slate-800 shadow-2xs">
                          {checkIn}
                        </span>
                      )}
                    </div>
                    <div className="text-center py-0.5">
                      <span className={`text-[11px] block leading-tight truncate ${labelColor}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* REGULARIZATION MODAL */}
      <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="Submit Attendance Regularization Request">
        <form onSubmit={handleRegularizeSubmit} className="space-y-4 text-xs">
          <Input
            label="Date to Regularize"
            type="date"
            value={regForm.date}
            onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Requested Check In Time"
              type="text"
              placeholder="09:00 AM"
              value={regForm.checkIn}
              onChange={(e) => setRegForm({ ...regForm, checkIn: e.target.value })}
              required
            />
            <Input
              label="Requested Check Out Time"
              type="text"
              placeholder="06:00 PM"
              value={regForm.checkOut}
              onChange={(e) => setRegForm({ ...regForm, checkOut: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Adjustment</label>
            <textarea
              value={regForm.reason}
              onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
              rows={3}
              placeholder="Explain biometric failure, field visit, or missed punch..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRegModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
