import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  RefreshCw,
  Building
} from 'lucide-react';
import { timesheetApi } from '../services/timesheetApi';
import { TimesheetSummaryReport, TimesheetEmployeeReport } from '../types';

export const TimesheetReportsView: React.FC = () => {
  const [summary, setSummary] = useState<TimesheetSummaryReport | null>(null);
  const [employeeReports, setEmployeeReports] = useState<TimesheetEmployeeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadReports();
  }, [selectedMonth, statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sumData, empData] = await Promise.all([
        timesheetApi.getReportsSummary({
          month: selectedMonth,
          status: statusFilter !== 'ALL' ? statusFilter : undefined
        }),
        timesheetApi.getEmployeeReports({
          month: selectedMonth
        })
      ]);

      setSummary(sumData);
      setEmployeeReports(empData);
    } catch (err: any) {
      setError(err.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-2 border border-blue-100 dark:border-blue-900">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Timesheet Intelligence &amp; Audit</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Timesheet Reports &amp; Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics calculated dynamically from PostgreSQL database records.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="SUBMITTED">Submitted Only</option>
            <option value="REJECTED">Rejected Only</option>
            <option value="DRAFT">Pending (Draft)</option>
          </select>

          <button
            onClick={() => loadReports()}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Reload reports"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 8 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        
        {/* Total Assigned */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assigned</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {summary?.totalAssigned || 0}
          </p>
          <p className="text-[10px] text-slate-400">Total days allocated</p>
        </div>

        {/* Submitted */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {summary?.submitted || 0}
          </p>
          <p className="text-[10px] text-slate-400">Awaiting admin review</p>
        </div>

        {/* Approved */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {summary?.approved || 0}
          </p>
          <p className="text-[10px] text-slate-400">Verified &amp; accepted</p>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {summary?.rejected || 0}
          </p>
          <p className="text-[10px] text-slate-400">Sent back for changes</p>
        </div>

        {/* Pending (Draft) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending (Draft)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {summary?.pending || 0}
          </p>
          <p className="text-[10px] text-slate-400">In draft mode</p>
        </div>

        {/* Total Hours */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hours</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {summary?.totalHours || 0}h
          </p>
          <p className="text-[10px] text-slate-400">Logged duration</p>
        </div>

        {/* Avg Daily Hours */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Daily Hours</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {summary?.averageDailyHours || 0}h
          </p>
          <p className="text-[10px] text-slate-400">Across active days</p>
        </div>

        {/* Missing Timesheets */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missing Timesheets</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
            {summary?.missingTimesheets || 0}
          </p>
          <p className="text-[10px] text-slate-400">Assigned with 0 hours</p>
        </div>

      </div>

      {/* Employee-wise Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Employee Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500">Summary aggregated per employee for the selected period.</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {employeeReports.length} Employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-4">Department</th>
                <th className="py-4 px-4">Working Days</th>
                <th className="py-4 px-4">Submitted</th>
                <th className="py-4 px-4">Approved</th>
                <th className="py-4 px-4">Rejected</th>
                <th className="py-4 px-4">Pending</th>
                <th className="py-4 px-6 text-right">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employeeReports.map((emp, idx) => (
                <tr
                  key={emp.employee_id || idx}
                  className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#2563eb] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {emp.employee_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{emp.employee_name}</p>
                        <p className="text-[10px] text-slate-400">{emp.employee_id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">
                    {emp.department}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {emp.working_days}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{emp.submitted}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{emp.approved}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{emp.rejected}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{emp.pending}</span>
                  </td>

                  <td className="py-3.5 px-6 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    {emp.total_hours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
