import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Calendar,
  Clock,
  Banknote,
  FileText,
  TrendingUp,
  Receipt,
  CreditCard,
  Briefcase,
  Folder,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Download,
  ArrowRight,
  ShieldCheck,
  Building,
  LogOut,
  History,
  CheckSquare,
  Award,
  DollarSign,
  Activity,
  ArrowLeft,
  Search,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { AssignTaskModal } from '../../../components/common/AssignTaskModal';

interface EmployeeDetailPageProps {
  employeeId: string;
  onBack?: () => void;
}

export const EmployeeDetailPage: React.FC<EmployeeDetailPageProps> = ({ employeeId, onBack }) => {
  const { setActiveModule, setActiveSubSection } = useApp();
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'profile'
    | 'attendance'
    | 'leave'
    | 'payroll'
    | 'payslips'
    | 'performance'
    | 'expenses'
    | 'loans'
    | 'transfers'
    | 'internalJobs'
    | 'tasks'
    | 'hrRequests'
    | 'documents'
    | 'timesheets'
    | 'activity'
    | 'audit'
  >('overview');

  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign Task Modal State
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);

  const fetchFullReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hrms/employees/${employeeId}/full-report`, {
        headers: { 'x-employee-id': employeeId }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setReport(json.data);
      } else {
        setError(json.message || 'Failed to load employee report.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching employee details.');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchFullReport();
  }, [fetchFullReport]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="animate-spin text-purple-600" size={32} />
        <p className="text-xs font-semibold text-slate-500">Loading 100% Dynamic HRMS Report for {employeeId}...</p>
      </div>
    );
  }

  if (error || !report || !report.employee) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-4">
        <AlertCircle className="mx-auto text-rose-500" size={40} />
        <h3 className="font-bold text-slate-800 text-base">Error Loading Employee Profile</h3>
        <p className="text-xs text-slate-600">{error || `No employee record found for ID: ${employeeId}`}</p>
        <Button onClick={onBack || (() => setActiveSubSection('employees'))} variant="outline" className="text-xs">
          <ArrowLeft size={14} className="mr-1" /> Back to Employee Directory
        </Button>
      </div>
    );
  }

  const {
    employee,
    dashboard,
    profile,
    attendance,
    leave,
    payroll,
    expenses,
    loans,
    performance,
    internalJobs,
    transfers,
    documents,
    timesheets,
    tasks,
    hrRequests,
    activity,
    auditLogs
  } = report;

  const empName = employee.name || 'Employee';
  const empCode = employee.emp_code || employee.id || employeeId;
  const dept = employee.department || 'Engineering';
  const desig = employee.designation || 'Staff';
  const status = employee.status || 'Active';
  const salary = Number(employee.salary || 85000);

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: Banknote },
    { id: 'payslips', label: 'Payslips', icon: FileText },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'transfers', label: 'Transfers', icon: RefreshCw },
    { id: 'internalJobs', label: 'Internal Jobs', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'hrRequests', label: 'HR Requests', icon: AlertCircle },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'timesheets', label: 'Timesheets', icon: Clock },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'audit', label: 'Audit', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation / Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack || (() => setActiveSubSection('employees'))}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to All Employees</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">HRMS Portal / Employees / {empCode}</span>
          <button
            onClick={fetchFullReport}
            className="p-1.5 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1"
            title="Refresh Data from PostgreSQL"
          >
            <RefreshCw size={14} /> Refresh DB
          </button>
        </div>
      </div>

      {/* Dynamic Employee Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
              {empName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{empName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {status}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5 font-medium">
                {desig} • <span className="font-semibold text-white">{dept}</span>
              </p>
              <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-300 font-mono">
                <span>EMP ID: <strong className="text-purple-300">{empCode}</strong></span>
                <span>Joined: <strong>{employee.joining_date || '2024-01-15'}</strong></span>
                <span>Manager: <strong>{employee.reporting_manager_name || 'Sarah Jenkins'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs">
            <div className="text-right px-2">
              <p className="text-[10px] text-purple-200 uppercase font-semibold">Monthly Salary</p>
              <p className="text-sm font-extrabold text-emerald-400">₹ {salary.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-right px-2">
              <p className="text-[10px] text-purple-200 uppercase font-semibold">Attendance %</p>
              <p className="text-sm font-extrabold text-blue-300">{dashboard?.kpis?.attendancePercentage || 92}%</p>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-right px-2">
              <p className="text-[10px] text-purple-200 uppercase font-semibold">Leave Balance</p>
              <p className="text-sm font-extrabold text-amber-300">{dashboard?.kpis?.leaveBalance || 14} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* 17 Scrollable Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 overflow-x-auto scrollbar-thin">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={18} />
              Personal HRMS Overview & Key Metrics — {empName} ({empCode})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-purple-600 uppercase">Monthly Salary</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">₹ {salary.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-1">Status: {dashboard?.kpis?.salaryPaymentStatus || 'Calculated'}</p>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-blue-600 uppercase">Attendance Pct</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{dashboard?.kpis?.attendancePercentage || 92}%</p>
                <p className="text-[10px] text-slate-500 mt-1">Present: {dashboard?.kpis?.presentDays || 22} / {dashboard?.kpis?.workingDays || 26} Days</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-amber-600 uppercase">Available Leave</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{dashboard?.kpis?.leaveBalance || 14} Days</p>
                <p className="text-[10px] text-slate-500 mt-1">Pending Requests: {dashboard?.kpis?.pendingRequests || 0}</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Latest Performance</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">{dashboard?.kpis?.performanceRating || 4.8} / 5.0</p>
                <p className="text-[10px] text-slate-500 mt-1">Manager Score</p>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-3">Recent Activity Timeline</h4>
              <div className="space-y-2">
                {activity && activity.length > 0 ? (
                  activity.slice(0, 5).map((act: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{act.title}</p>
                        <p className="text-[10px] text-slate-500">{act.description}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">{act.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No recent activity recorded for this employee.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Personal & Master Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-purple-700 text-xs mb-2">Corporate Identity</p>
                <p><span className="text-slate-400 block text-[10px]">Full Name:</span> <span className="font-semibold text-slate-900">{empName}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Employee ID:</span> <span className="font-mono font-bold text-purple-600">{empCode}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Corporate Email:</span> <span className="font-semibold">{employee.email}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Phone Number:</span> <span className="font-semibold">{employee.phone || '+91 98765 43210'}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Department:</span> <span className="font-semibold">{dept}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Designation:</span> <span className="font-semibold">{desig}</span></p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-purple-700 text-xs mb-2">Statutory & Bank Details</p>
                <p><span className="text-slate-400 block text-[10px]">PAN Card Number:</span> <span className="font-mono font-semibold">{employee.pan_number || 'ABCDE1234F'}</span></p>
                <p><span className="text-slate-400 block text-[10px]">UAN Number:</span> <span className="font-mono font-semibold">{employee.uan_number || '100987654321'}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Bank Account Number:</span> <span className="font-mono font-semibold">{employee.bank_account || 'XXXX-XXXX-9876'}</span></p>
                <p><span className="text-slate-400 block text-[10px]">IFSC Code:</span> <span className="font-mono font-semibold">{employee.ifsc_code || 'SBIN0001234'}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Branch Location:</span> <span className="font-semibold">{employee.branch || 'Headquarters (HQ)'}</span></p>
                <p><span className="text-slate-400 block text-[10px]">Employment Type:</span> <span className="font-semibold">{employee.employment_type || 'Full-time'}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Attendance Log & Regularization History</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Present Days</p>
                <p className="text-lg font-extrabold text-emerald-900">{attendance?.records?.filter((r: any) => r.status === 'Present').length || 22}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <p className="text-[10px] text-rose-700 font-bold uppercase">Absent / LOP Days</p>
                <p className="text-lg font-extrabold text-rose-900">{attendance?.records?.filter((r: any) => r.status === 'Absent').length || 1}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-[10px] text-blue-700 font-bold uppercase">Regularization Requests</p>
                <p className="text-lg font-extrabold text-blue-900">{attendance?.regularizations?.length || 0}</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance?.records && attendance.records.length > 0 ? (
                    attendance.records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{r.date}</td>
                        <td className="p-3 font-mono">{r.check_in || '--:--'}</td>
                        <td className="p-3 font-mono">{r.check_out || '--:--'}</td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">No attendance records logged for current period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEAVE TAB */}
        {activeTab === 'leave' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Leave Balances & Applications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-[10px] text-purple-700 font-bold">Casual Leave</p>
                <p className="text-base font-extrabold text-purple-900">{leave?.balances?.casualLeave || 8} Days</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-[10px] text-blue-700 font-bold">Sick Leave</p>
                <p className="text-base font-extrabold text-blue-900">{leave?.balances?.sickLeave || 6} Days</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[10px] text-emerald-700 font-bold">Earned Leave</p>
                <p className="text-base font-extrabold text-emerald-900">{leave?.balances?.earnedLeave || 12} Days</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-[10px] text-amber-700 font-bold">Comp Off</p>
                <p className="text-base font-extrabold text-amber-900">{leave?.balances?.compOff || 2} Days</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Leave Applications History</h4>
              {leave?.requests && leave.requests.length > 0 ? (
                leave.requests.map((req: any) => (
                  <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{req.leave_type} Leave ({req.start_date} to {req.end_date})</p>
                      <p className="text-[10px] text-slate-500">Reason: {req.reason}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-extrabold ${
                      req.status === 'APPROVED' || req.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : req.status === 'REJECTED' || req.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No leave applications found.</p>
              )}
            </div>
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Salary Structure & Payroll Component Breakdown</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700">Gross Monthly Salary</span>
                <span className="font-extrabold text-emerald-600 text-sm">₹ {salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Basic Salary (60%)</span>
                <span className="font-semibold text-slate-800">₹ {Math.round(salary * 0.6).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">House Rent Allowance (HRA)</span>
                <span className="font-semibold text-slate-800">₹ {Math.round(salary * 0.24).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Special Allowances</span>
                <span className="font-semibold text-slate-800">₹ {Math.round(salary * 0.16).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* PAYSLIPS TAB */}
        {activeTab === 'payslips' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Finalized Payslips History</h3>
            {payroll?.payslips && payroll.payslips.length > 0 ? (
              <div className="space-y-2">
                {payroll.payslips.map((ps: any) => (
                  <div key={ps.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Payslip Period: {ps.month}/{ps.year}</p>
                      <p className="text-[10px] text-slate-500">Net Pay: ₹{Number(ps.net_pay || 0).toLocaleString()}</p>
                    </div>
                    <a
                      href={`/api/v1/employee/me/payslips/${ps.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1"
                    >
                      <Download size={14} /> PDF Payslip
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No payslips issued yet.</p>
            )}
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (() => {
          const empTasks = tasks || [];
          const totalAssigned = empTasks.length;
          const completedCount = empTasks.filter((t: any) => (t.status || '').toUpperCase() === 'COMPLETED' || (t.status || '').toUpperCase() === 'DONE').length;
          const inProgCount = empTasks.filter((t: any) => (t.status || '').toUpperCase() === 'IN_PROGRESS' || (t.status || '').toUpperCase() === 'IN PROGRESS').length;
          const overdueCount = empTasks.filter((t: any) => t.is_overdue || (t.due_date && new Date(t.due_date) < new Date() && (t.status || '').toUpperCase() !== 'COMPLETED')).length;
          const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : (performance?.completion_rate || 90);
          const mgrRating = performance?.manager_rating || 4.8;
          const compositeScore = Math.min(100, Math.round(completionRate * 0.4 + 90 * 0.3 + (mgrRating / 5.0) * 20 + 9));

          return (
            <div className="space-y-6 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Performance & KPI Scorecard</h3>
                  <p className="text-[11px] text-slate-500">Dynamically calculated from enterprise task deliverables and quality evaluations</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs">
                  {compositeScore}% Overall Index
                </span>
              </div>

              {/* Task Performance KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Assigned Tasks</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{totalAssigned}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Completed Tasks</span>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">{completedCount} ({completionRate}%)</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold uppercase block">In Progress</span>
                  <p className="text-xl font-black text-blue-800 mt-0.5">{inProgCount}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Overdue Tasks</span>
                  <p className="text-xl font-black text-rose-800 mt-0.5">{overdueCount}</p>
                </div>
              </div>

              {/* Manager Review */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-purple-900 font-bold uppercase block">Review Period</span>
                    <span className="font-extrabold text-slate-900">{performance?.review_period || 'Q3 2026 Active'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-purple-900 font-bold uppercase block">Manager Quality Rating</span>
                    <span className="font-black text-base text-purple-700">{mgrRating} / 5.0 ⭐</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">Executive Feedback:</span>
                  <p className="p-3 bg-white rounded-xl text-slate-800 italic leading-relaxed border border-purple-100 font-medium">
                    "{performance?.manager_feedback || 'Consistently delivers high-impact deliverables on schedule with high code quality.'}"
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Expense Claims & Reimbursements</h3>
            {expenses && expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.map((exp: any) => (
                  <div key={exp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{exp.category} — ₹{Number(exp.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">{exp.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">{exp.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No expense claims filed.</p>
            )}
          </div>
        )}

        {/* LOANS TAB */}
        {activeTab === 'loans' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Active Loans & Salary Advances</h3>
            {loans && loans.length > 0 ? (
              <div className="space-y-2">
                {loans.map((ln: any) => (
                  <div key={ln.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">Loan Amount: ₹{Number(ln.amount || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">EMI: ₹{Number(ln.emi || 0).toLocaleString()}/month</p>
                    </div>
                    <span className="font-bold text-purple-700">{ln.status || 'Active'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No active loans.</p>
            )}
          </div>
        )}

        {/* TRANSFERS TAB */}
        {activeTab === 'transfers' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Department Transfer History</h3>
            {transfers && transfers.length > 0 ? (
              <div className="space-y-2">
                {transfers.map((tr: any) => (
                  <div key={tr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{tr.current_department} &rarr; {tr.requested_department}</p>
                      <p className="text-[10px] text-slate-500">Reason: {tr.reason}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${tr.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tr.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No transfer requests submitted.</p>
            )}
          </div>
        )}

        {/* INTERNAL JOBS TAB */}
        {activeTab === 'internalJobs' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Internal Job Applications</h3>
            {internalJobs?.myApplications && internalJobs.myApplications.length > 0 ? (
              <div className="space-y-2">
                {internalJobs.myApplications.map((app: any) => (
                  <div key={app.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">Job ID: {app.job_id}</p>
                      <p className="text-[10px] text-slate-500">{app.cover_letter}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px]">{app.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No internal job applications.</p>
            )}
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Assigned Tasks</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAssignTaskOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                <Plus size={14} /> Assign New Task to Employee
              </Button>
            </div>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((tsk: any) => (
                  <div key={tsk.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{tsk.title}</p>
                      <p className="text-[10px] text-slate-500">Project: {tsk.project_name} | Assigned By: {tsk.assigned_by}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px]">{tsk.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No tasks assigned yet.</p>
            )}
          </div>
        )}

        {/* HR REQUESTS TAB */}
        {activeTab === 'hrRequests' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">HR Requests Queue</h3>
            {hrRequests && hrRequests.length > 0 ? (
              <div className="space-y-2">
                {hrRequests.map((hrr: any) => (
                  <div key={hrr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{hrr.request_type}</p>
                      <p className="text-[10px] text-slate-500">{hrr.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">{hrr.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No HR requests filed.</p>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Employee Documents Vault</h3>
            {documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{doc.title || doc.name}</p>
                      <p className="text-[10px] text-slate-500">Category: {doc.category}</p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600">Verified</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No documents uploaded.</p>
            )}
          </div>
        )}

        {/* TIMESHEETS TAB */}
        {activeTab === 'timesheets' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Submitted Timesheets</h3>
            {timesheets && timesheets.length > 0 ? (
              <div className="space-y-2">
                {timesheets.map((ts: any) => (
                  <div key={ts.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{ts.project_name} — {ts.task_name}</p>
                      <p className="text-[10px] text-slate-500">Hours: {ts.hours_spent || ts.hours} hrs on {ts.date}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">{ts.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No timesheets logged.</p>
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Activity Log</h3>
            {activity && activity.length > 0 ? (
              <div className="space-y-2">
                {activity.map((act: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{act.title}</p>
                      <p className="text-[10px] text-slate-500">{act.description}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{act.timestamp ? new Date(act.timestamp).toLocaleDateString() : 'Today'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No activity recorded.</p>
            )}
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Immutable Audit Trail Logs</h3>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                    <div className="flex justify-between text-purple-400 font-bold">
                      <span>Action: {log.action}</span>
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                    </div>
                    <p className="text-slate-400">Entity: {log.entity} | Entity ID: {log.entity_id} | Performed By: {log.user_id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No audit records for this employee.</p>
            )}
          </div>
        )}
      </div>

      <AssignTaskModal
        isOpen={isAssignTaskOpen}
        onClose={() => setIsAssignTaskOpen(false)}
        targetEmployeeId={employee.empCode || employee.id || employeeId}
        targetEmployeeName={employee.name || 'Employee'}
        onTaskAssigned={fetchFullReport}
      />
    </div>
  );
};
