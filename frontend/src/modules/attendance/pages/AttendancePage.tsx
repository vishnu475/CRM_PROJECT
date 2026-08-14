import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  X,
  FileCheck,
  Radio,
  Sparkles,
  Monitor,
  LayoutDashboard,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { ShiftMasterManager } from '../components/ShiftMasterManager';
import { AttendanceCalendarView } from '../components/AttendanceCalendarView';
import { OvertimeManagerView } from '../components/OvertimeManagerView';
import { AttendanceKiosk } from '../components/AttendanceKiosk';
import { LiveAttendanceFeed } from '../components/LiveAttendanceFeed';
import { AttendanceLogStatus, DetailedAttendanceRecord } from '../types';
import { useAttendance } from '../hooks/useAttendance';

export const AttendancePage: React.FC = () => {
  const { userProfile } = useApp();
  const {
    employees,
    attendanceRecords = [],
    regularizationRequests,
    submitRegularization,
    approveRegularization,
    rejectRegularization,
    getDailyAttendanceRecords,
    getSummaryMetrics
  } = useAttendance();

  const { activeSubSection, setActiveSubSection } = useApp();
  const validAttendanceTabs = ['daily', 'live', 'regularizations', 'shifts', 'calendar', 'overtime'];
  const mainTab = (validAttendanceTabs.includes(activeSubSection) ? activeSubSection : 'daily') as 'daily' | 'live' | 'regularizations' | 'shifts' | 'calendar' | 'overtime';
  const setMainTab = (tab: 'daily' | 'live' | 'regularizations' | 'shifts' | 'calendar' | 'overtime') => setActiveSubSection(tab);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/employees');
      await fetch('/api/attendance/today');
    } catch (_) {}
    setIsRefreshing(false);
    setRefreshMessage('PostgreSQL Attendance & Employee Master Refreshed!');
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  const { attendanceEvents = [] } = useApp() as any;

  // Mode switcher: 'kiosk' vs 'dashboard' — defaults to 'dashboard' when viewing daily logs or admin tabs
  const [viewMode, setViewMode] = useState<'kiosk' | 'dashboard'>(() => {
    return activeSubSection === 'kiosk' ? 'kiosk' : 'dashboard';
  });

  // Dates & Filters
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<AttendanceLogStatus | 'All'>('All');

  // Selected Punch Detail Modal Record State
  const [selectedPunchDetailRecord, setSelectedPunchDetailRecord] = useState<DetailedAttendanceRecord | null>(null);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Regularization Modal State
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    employeeId: employees[0]?.empCode || employees[0]?.id || 'EMP-001',
    date: selectedDate,
    requestType: 'in' as 'in' | 'out' | 'onduty' | 'both',
    requestedCheckIn: '09:00 AM',
    requestedCheckOut: '06:00 PM',
    reason: ''
  });

  const handleRegularizationSubmit = () => {
    const targetEmp = employees.find(e => e.id === regForm.employeeId || e.empCode === regForm.employeeId);
    const res = submitRegularization({
      employeeId: regForm.employeeId,
      empName: targetEmp ? targetEmp.name : regForm.employeeId,
      date: regForm.date,
      requestType: regForm.requestType,
      requestedCheckIn: regForm.requestedCheckIn,
      requestedCheckOut: regForm.requestedCheckOut,
      reason: regForm.reason || 'Missed Punch Regularization'
    });

    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    setIsRegularizeOpen(false);
    setTimeout(() => setFeedback(null), 5000);
  };

  const [isAllDates, setIsAllDates] = useState(false);

  // Calculated daily records for selected date or overall history
  const detailedRecords = React.useMemo(() => {
    if (!isAllDates) {
      return getDailyAttendanceRecords(selectedDate);
    }
    // Overall History Mode: return all attendance records across all dates
    if (attendanceRecords && attendanceRecords.length > 0) {
      return attendanceRecords;
    }
    return getDailyAttendanceRecords(selectedDate);
  }, [isAllDates, selectedDate, attendanceRecords, employees]);

  // Filtered List
  const filteredRecords = detailedRecords.filter((r: DetailedAttendanceRecord) => {
    const empNameStr = String(r.empName || '');
    const matchesEmp = selectedEmpFilter === 'All' || empNameStr.toLowerCase().includes((selectedEmpFilter || '').toLowerCase());
    const matchesDept = selectedDeptFilter === 'All' || r.department === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'All' || r.status === selectedStatusFilter;
    return matchesEmp && matchesDept && matchesStatus;
  });

  // Manager-Scoped Regularization List Filter
  const isManagerRole = userProfile?.role === 'SalesManager' || userProfile?.role === 'OperationsManager';
  const managerScopedRegularizations = regularizationRequests.filter(req => {
    if (!isManagerRole) return true; // HR/Exec sees all
    const emp = employees.find(e => e.id === req.employeeId || e.empCode === req.employeeId);
    return emp?.manager === userProfile.name || emp?.reportingManagerName === userProfile.name;
  });

  // KPI Metrics for selected date
  const summaryMetrics = getSummaryMetrics(selectedDate);

  return (
    <div className="space-y-6">
      {/* Top Header with Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={24} />
            Time & Attendance Kiosk & Management Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Biometric-ready kiosk, live attendance activity stream, shift master, late/early indicators, overtime tracking, and monthly calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Kiosk Mode vs Dashboard View */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('kiosk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kiosk'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor size={14} /> Attendance Kiosk
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={14} /> HR Dashboard
            </button>
          </div>

          <div className="flex items-center gap-2">
            {refreshMessage && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold animate-pulse">
                <CheckCircle2 size={14} /> {refreshMessage}
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-purple-600' : 'text-purple-600'} />
              {isRefreshing ? 'Refreshing DB...' : 'Refresh DB Data'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsRegularizeOpen(true)}>
              <Clock size={14} /> Regularization Request
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* MODE 1: ATTENDANCE KIOSK */}
      {viewMode === 'kiosk' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Production Self-Service Attendance Kiosk</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Employees enter Employee ID + PIN to mark check-in or check-out. Identity is verified directly against HRMS.
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode('dashboard')}
              className="text-xs font-bold text-blue-200 hover:text-white underline shrink-0"
            >
              Switch to HR Admin Dashboard &rarr;
            </button>
          </div>

          <AttendanceKiosk />
        </div>
      )}

      {/* MODE 2: HR MANAGEMENT DASHBOARD */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
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
              onClick={() => setMainTab('live')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                mainTab === 'live' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Radio size={14} className="text-emerald-500" /> Live Feed ({attendanceEvents.length})
            </button>
            <button
              onClick={() => setMainTab('regularizations')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                mainTab === 'regularizations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Regularization Desk ({managerScopedRegularizations.filter(r => r.status === 'PENDING').length})
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

          {/* TAB: LIVE ACTIVITY STREAM */}
          {mainTab === 'live' && <LiveAttendanceFeed events={attendanceEvents} />}

          {/* TAB: SHIFT MASTER */}
          {mainTab === 'shifts' && <ShiftMasterManager />}

          {/* TAB: CALENDAR */}
          {mainTab === 'calendar' && <AttendanceCalendarView records={detailedRecords} />}

          {/* TAB: OVERTIME */}
          {mainTab === 'overtime' && <OvertimeManagerView records={detailedRecords} />}

          {/* TAB: REGULARIZATION REQUESTS (MANAGER REVIEW) */}
          {mainTab === 'regularizations' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="text-blue-600" size={18} /> Regularization Requests Approval Desk
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isManagerRole
                      ? `Viewing regularization requests for team reporting to ${userProfile.name}.`
                      : 'Review and approve missed punch adjustments for all company employees.'}
                  </p>
                </div>
                <Badge variant="info">{managerScopedRegularizations.length} Total Requests</Badge>
              </div>

              {managerScopedRegularizations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No regularization requests pending review for your team scope.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Employee</th>
                        <th className="p-3">ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Requested In</th>
                        <th className="p-3">Requested Out</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {managerScopedRegularizations.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{req.empName}</td>
                          <td className="p-3 font-mono text-slate-500">{req.employeeId}</td>
                          <td className="p-3 text-slate-500">{req.date}</td>
                          <td className="p-3 font-medium uppercase text-[10px] text-blue-600">{req.requestType}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{req.requestedCheckIn}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">{req.requestedCheckOut}</td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{req.reason}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'
                              }
                            >
                              {req.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            {req.status === 'PENDING' ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    const res = approveRegularization(req.id, userProfile.name);
                                    setFeedback({ type: 'success', message: res.message });
                                    setTimeout(() => setFeedback(null), 4000);
                                  }}
                                >
                                  <Check size={12} /> Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const res = rejectRegularization(req.id, userProfile.name);
                                    setFeedback({ type: 'error', message: res.message });
                                    setTimeout(() => setFeedback(null), 4000);
                                  }}
                                >
                                  <X size={12} /> Reject
                                </Button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Reviewed by {req.reviewedBy || 'Manager'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: DAILY LOGS & FILTERS */}
          {mainTab === 'daily' && (
            <div className="space-y-4">
              {/* Multi-Filter Bar: Date, Employee, Department, Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Calendar size={14} className="text-blue-600" />
                  <span className="text-slate-500 font-semibold">Scope:</span>
                  <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
                    <button
                      type="button"
                      onClick={() => setIsAllDates(false)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        !isAllDates ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Single Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAllDates(true)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isAllDates ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📊 All Dates (Overall Employee History)
                    </button>
                  </div>
                  {!isAllDates && (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Employee Filter */}
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Filter by employee..."
                      value={selectedEmpFilter === 'All' ? '' : selectedEmpFilter}
                      onChange={(e) => setSelectedEmpFilter(e.target.value || 'All')}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  {/* Department Filter */}
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="All">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Late In">Late In</option>
                    <option value="Early Out">Early Out</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Weekly Off">Weekly Off</option>
                  </select>
                </div>
              </div>

              {/* Detailed Attendance Records Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Emp ID</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Shift</th>
                      <th className="p-3.5">Check In</th>
                      <th className="p-3.5">Check Out</th>
                      <th className="p-3.5">Work Hours</th>
                      <th className="p-3.5">Late / Early Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-xs text-slate-400">
                          No attendance records matching filter criteria for {selectedDate}.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((att: DetailedAttendanceRecord) => (
                        <tr key={att.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-slate-900">{att.empName}</td>
                          <td className="p-3.5 font-mono text-slate-500">{att.employeeId || att.empId}</td>
                          <td className="p-3.5 font-semibold text-slate-700">{att.department}</td>
                          <td className="p-3.5 text-slate-400">{att.date}</td>
                          <td className="p-3.5 font-semibold text-slate-600">{att.shiftName}</td>
                          <td className="p-3.5 font-mono text-emerald-600 font-bold">{att.checkIn}</td>
                          <td className="p-3.5 font-mono text-blue-600 font-bold">{att.checkOut}</td>
                          <td className="p-3.5 font-bold">{att.workHours} hrs</td>
                          <td className="p-3.5 space-x-1">
                            {att.status === 'Absent' && <Badge variant="danger">Absent</Badge>}
                            {att.status === 'On Leave' && <Badge variant="info">On Leave</Badge>}
                            {att.status === 'Half Day' && <Badge variant="warning">Half Day</Badge>}
                            {att.status === 'Holiday' && <Badge variant="info">Holiday</Badge>}
                            {att.status === 'Weekly Off' && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded text-[10px]">Weekly Off</span>}
                            {att.isLateIn && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded text-[10px]">Late In (+{att.lateMinutes}m)</span>}
                            {att.isEarlyOut && <span className="px-2 py-0.5 bg-orange-50 text-orange-700 font-bold rounded text-[10px]">Early Out</span>}
                            {!att.isLateIn && !att.isEarlyOut && (att.status === 'Present' || att.status === 'PRESENT') && <Badge variant="success">On Time</Badge>}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setSelectedPunchDetailRecord(att)}
                              className="text-blue-600 font-bold hover:underline"
                            >
                              Punch Details &rarr;
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Regularization Request Modal */}
      <Modal isOpen={isRegularizeOpen} onClose={() => setIsRegularizeOpen(false)} title="Attendance Regularization Request">
        <div className="space-y-4 text-xs">
          <Select
            label="Select Employee"
            value={regForm.employeeId}
            onChange={(e) => setRegForm({ ...regForm, employeeId: e.target.value })}
            options={employees.filter(e => e.status !== 'Exited').map(e => ({ label: `${e.name} (${e.empCode || e.id})`, value: e.empCode || e.id }))}
          />
          <Input
            label="Date"
            type="date"
            value={regForm.date}
            onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
          />
          <Select
            label="Type of Request"
            value={regForm.requestType}
            onChange={(e) => setRegForm({ ...regForm, requestType: e.target.value as any })}
            options={[
              { label: 'Missed Punch In', value: 'in' },
              { label: 'Missed Punch Out', value: 'out' },
              { label: 'Both Punch In & Out', value: 'both' },
              { label: 'On-Duty Outside Office', value: 'onduty' }
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Requested Check-In"
              placeholder="09:00 AM"
              value={regForm.requestedCheckIn}
              onChange={(e) => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
            />
            <Input
              label="Requested Check-Out"
              placeholder="06:00 PM"
              value={regForm.requestedCheckOut}
              onChange={(e) => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
            />
          </div>
          <Input
            label="Reason"
            placeholder="Explain the reason for regularization..."
            value={regForm.reason}
            onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsRegularizeOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRegularizationSubmit}>Submit Request</Button>
          </div>
        </div>
      </Modal>

      {/* Detailed Punch Details Modal */}
      {selectedPunchDetailRecord && (
        <Modal
          isOpen={!!selectedPunchDetailRecord}
          onClose={() => setSelectedPunchDetailRecord(null)}
          title={`Punch Logs & Biometric Verification - ${selectedPunchDetailRecord.empName}`}
        >
          <div className="space-y-4 text-xs">
            {/* Employee Profile Header Summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 font-bold text-white flex items-center justify-center text-sm">
                  {selectedPunchDetailRecord.empName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedPunchDetailRecord.empName}</h4>
                  <p className="text-[11px] text-slate-500">
                    ID: <span className="font-mono font-semibold text-slate-700">{selectedPunchDetailRecord.employeeId || selectedPunchDetailRecord.empId}</span> • Dept: <span className="font-semibold text-slate-700">{selectedPunchDetailRecord.department}</span>
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  selectedPunchDetailRecord.status === 'Present' || selectedPunchDetailRecord.status === 'PRESENT'
                    ? 'success'
                    : selectedPunchDetailRecord.status === 'Late In' || selectedPunchDetailRecord.status === 'LATE_IN'
                    ? 'warning'
                    : selectedPunchDetailRecord.status === 'Absent' || selectedPunchDetailRecord.status === 'ABSENT'
                    ? 'danger'
                    : 'info'
                }
              >
                {selectedPunchDetailRecord.status}
              </Badge>
            </div>

            {/* Shift & Date Info */}
            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Log Date</span>
                <span className="font-semibold text-slate-800 text-xs">{selectedPunchDetailRecord.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Shift</span>
                <span className="font-semibold text-slate-800 text-xs">{selectedPunchDetailRecord.shiftName || 'General Shift (GS)'}</span>
              </div>
            </div>

            {/* Punch In / Out Detailed Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Check In Log Card */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wide">Check In Log</span>
                  <span className="font-mono text-emerald-700 font-bold">{selectedPunchDetailRecord.checkIn}</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-emerald-100 pt-1.5">
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-semibold">{selectedPunchDetailRecord.location || 'HQ Office'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IP Address:</span>
                    <span className="font-mono font-semibold">{selectedPunchDetailRecord.ipAddress || '192.168.1.50'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late Status:</span>
                    <span className="font-semibold text-amber-700">
                      {selectedPunchDetailRecord.isLateIn ? `Late In (+${selectedPunchDetailRecord.lateMinutes}m)` : 'On Time'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Check Out Log Card */}
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800 text-[11px] uppercase tracking-wide">Check Out Log</span>
                  <span className="font-mono text-blue-700 font-bold">{selectedPunchDetailRecord.checkOut}</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 border-t border-blue-100 pt-1.5">
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-semibold">{selectedPunchDetailRecord.location || 'HQ Office'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IP Address:</span>
                    <span className="font-mono font-semibold">{selectedPunchDetailRecord.ipAddress || '192.168.1.50'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Early Out:</span>
                    <span className="font-semibold text-orange-700">
                      {selectedPunchDetailRecord.isEarlyOut ? 'Yes (Early Departure)' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours & Overtime Breakdown */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Worked Hours</span>
                <span className="font-bold text-slate-900">{selectedPunchDetailRecord.workHours} hrs</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Standard Hours</span>
                <span className="font-bold text-slate-700">9.0 hrs</span>
              </div>
              <div>
                <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">Overtime Hours</span>
                <span className="font-bold text-purple-600">+{selectedPunchDetailRecord.overtimeHours} hrs OT</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRegForm({
                    employeeId: selectedPunchDetailRecord.employeeId || selectedPunchDetailRecord.empId,
                    date: selectedPunchDetailRecord.date,
                    requestType: 'both',
                    requestedCheckIn: '09:00 AM',
                    requestedCheckOut: '06:00 PM',
                    reason: `Regularization for ${selectedPunchDetailRecord.empName}`
                  });
                  setSelectedPunchDetailRecord(null);
                  setIsRegularizeOpen(true);
                }}
              >
                Request Regularization
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedPunchDetailRecord(null)}>
                Close Punch Details
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
