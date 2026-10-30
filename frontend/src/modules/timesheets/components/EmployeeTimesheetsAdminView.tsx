import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Building,
  User,
  FileText,
  Edit3,
  Trash2,
  Save,
  ShieldAlert,
  X
} from 'lucide-react';
import { timesheetApi } from '../services/timesheetApi';
import { Timesheet } from '../types';
import { TimesheetDetailModal } from './TimesheetDetailModal';

export const EmployeeTimesheetsAdminView: React.FC = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Active Detail Modal
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Admin Control Flow: Edit & Delete States
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'SUBMITTED',
    expected_hours: 8.0,
    date: '',
    rejection_reason: ''
  });
  const [deletingTimesheet, setDeletingTimesheet] = useState<Timesheet | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTimesheets();
  }, [statusFilter, departmentFilter, dateFilter, startDateFilter, endDateFilter]);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await timesheetApi.getAdminTimesheets({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department: departmentFilter || undefined,
        date: dateFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      });
      setTimesheets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employee timesheets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTimesheets();
  };

  const handleViewDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const fullDetail = await timesheetApi.getAdminTimesheetDetail(id);
      setSelectedTimesheet(fullDetail);
    } catch (err: any) {
      alert(err.message || 'Failed to load timesheet details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    await timesheetApi.approveTimesheet(id);
    await loadTimesheets();
  };

  const handleReject = async (id: string, reason: string) => {
    await timesheetApi.rejectTimesheet(id, reason);
    await loadTimesheets();
  };

  const handleStartEdit = (ts: Timesheet) => {
    setEditingTimesheet(ts);
    setEditForm({
      status: ts.status || 'SUBMITTED',
      expected_hours: ts.expected_hours || 8.0,
      date: ts.date ? ts.date.split('T')[0] : '',
      rejection_reason: ts.rejection_reason || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTimesheet) return;
    try {
      setActionLoading(true);
      const updated = await timesheetApi.adminUpdateTimesheet(editingTimesheet.id, {
        status: editForm.status,
        expected_hours: Number(editForm.expected_hours),
        date: editForm.date,
        rejection_reason: editForm.rejection_reason
      });
      setTimesheets(prev => prev.map(t => (t.id === updated.id ? { ...t, ...updated } : t)));
      setEditingTimesheet(null);
      setActionSuccess(`Timesheet for ${editingTimesheet.employee_name || editingTimesheet.employee_id} updated.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update timesheet.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTimesheet) return;
    try {
      setActionLoading(true);
      await timesheetApi.adminDeleteTimesheet(deletingTimesheet.id);
      setTimesheets(prev => prev.filter(t => t.id !== deletingTimesheet.id));
      if (selectedTimesheet?.id === deletingTimesheet.id) {
        setSelectedTimesheet(null);
      }
      const deletedName = deletingTimesheet.employee_name || deletingTimesheet.employee_id;
      setDeletingTimesheet(null);
      setActionSuccess(`Timesheet for ${deletedName} (${deletingTimesheet.date}) completely purged from database and files.`);
      setTimeout(() => setActionSuccess(null), 4500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete timesheet.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 whitespace-nowrap">
            <CheckCircle2 size={11} /> APPROVED
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 whitespace-nowrap">
            <Clock size={11} /> SUBMITTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 whitespace-nowrap">
            <XCircle size={11} /> REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap">
            DRAFT
          </span>
        );
    }
  };

  // Distinct departments for filter
  const departments = Array.from(new Set(timesheets.map(t => t.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Employee Timesheets
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and verify submitted employee daily work logs and attached PDF evidence.
            </p>
          </div>

          <button
            onClick={() => loadTimesheets()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition self-start md:self-auto cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search employee name, ID, or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED (Ready for Review)</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d!}>{d}</option>
              ))}
            </select>
          </div>

          {/* Single Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title="Filter by specific date"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table / Card View */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="animate-spin text-blue-600 mx-auto" size={26} />
            <p className="text-xs text-slate-500 font-semibold">Loading timesheets from database...</p>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <FileText className="text-slate-300 mx-auto" size={36} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Timesheets Found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Expected Hours</th>
                  <th className="py-4 px-4">Actual Hours</th>
                  <th className="py-4 px-4">Entries</th>
                  <th className="py-4 px-4">Proofs</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {timesheets.map(ts => (
                  <tr
                    key={ts.id}
                    className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Employee Info */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#2563eb] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {(ts.employee_name || 'E').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {ts.employee_name || ts.employee_id}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {ts.emp_code || ts.employee_id} • {ts.department || 'General'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(ts.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Expected Hours */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {ts.expected_hours}h
                    </td>

                    {/* Actual Hours */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {ts.duration_formatted || `${ts.total_hours}h`}
                    </td>

                    {/* Entries Count */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        {ts.entries_count || 0} entries
                      </span>
                    </td>

                    {/* Proofs Count */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        (ts.proofs_count || 0) > 0
                          ? 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50'
                          : 'bg-slate-100 text-slate-400 border-slate-200/60 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700/50'
                      }`}>
                        {ts.proofs_count || 0} PDFs
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(ts.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(ts.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer whitespace-nowrap"
                          title="View Details"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(ts)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/60 dark:hover:text-amber-300 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer whitespace-nowrap"
                          title="Admin Edit Timesheet"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingTimesheet(ts)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer whitespace-nowrap"
                          title="Admin Cascade Delete"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-xl animate-bounce">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Admin Edit Modal */}
      {editingTimesheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2 text-amber-600">
                <Edit3 size={20} />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Admin Edit Timesheet
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingTimesheet.employee_name || editingTimesheet.employee_id} • {editingTimesheet.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTimesheet(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Timesheet Status
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="DRAFT">DRAFT (Re-open for Employee Edit)</option>
                  <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                  <option value="APPROVED">APPROVED (Authorized)</option>
                  <option value="REJECTED">REJECTED (Needs Rework)</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Timesheet Date
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Expected Hours */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Working Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={editForm.expected_hours}
                  onChange={e => setEditForm(prev => ({ ...prev, expected_hours: parseFloat(e.target.value) || 8 }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Remarks / Rejection Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Remarks / Feedback Note
                </label>
                <textarea
                  value={editForm.rejection_reason}
                  onChange={e => setEditForm(prev => ({ ...prev, rejection_reason: e.target.value }))}
                  placeholder="e.g. Approved with exceptional performance or Notes on necessary adjustments..."
                  rows={3}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTimesheet(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Save size={13} />
                <span>{actionLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Complete Delete Confirmation Modal */}
      {deletingTimesheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Delete Timesheet Completely?
                </h3>
                <p className="text-[11px] text-rose-500 font-semibold">
                  Complete Data Flow Cascade Purge
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <p className="font-bold">
                Are you sure you want to permanently delete this timesheet for {deletingTimesheet.employee_name || deletingTimesheet.employee_id} ({deletingTimesheet.date})?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700 dark:text-rose-400">
                <li>All {deletingTimesheet.entries_count || 0} work entries will be erased.</li>
                <li>All attached PDF evidence documents will be permanently unlinked and deleted from physical storage.</li>
                <li>Audit trails and database rows will be completely removed.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTimesheet(null)}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{actionLoading ? 'Purging...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTimesheet && (
        <TimesheetDetailModal
          timesheet={selectedTimesheet}
          onClose={() => setSelectedTimesheet(null)}
          canApprove={true}
          isAdmin={true}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={async (id) => {
            await timesheetApi.adminDeleteTimesheet(id);
            setTimesheets(prev => prev.filter(t => t.id !== id));
            setSelectedTimesheet(null);
            setActionSuccess('Timesheet and all files completely deleted.');
            setTimeout(() => setActionSuccess(null), 4000);
          }}
          onRefresh={async () => {
            const updated = await timesheetApi.getAdminTimesheetDetail(selectedTimesheet.id);
            setSelectedTimesheet(updated);
            await loadTimesheets();
          }}
        />
      )}
    </div>
  );
};
