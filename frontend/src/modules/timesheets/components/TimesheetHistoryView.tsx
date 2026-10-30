import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Filter,
  FileText,
  User,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { timesheetApi } from '../services/timesheetApi';
import { Timesheet } from '../types';
import { TimesheetDetailModal } from './TimesheetDetailModal';

interface Props {
  isAdmin?: boolean;
}

export const TimesheetHistoryView: React.FC<Props> = ({ isAdmin = false }) => {
  const { userProfile, employees = [] } = useApp() || {};
  const activeEmpId = (userProfile as any)?.empCode || (userProfile as any)?.id || localStorage.getItem('crm_employee_id') || 'EMP-006';

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [adminEmployeeFilter, setAdminEmployeeFilter] = useState<string>('ALL');

  // Selected for View Modal
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

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
    loadHistory();
  }, [selectedMonth, statusFilter, adminEmployeeFilter, activeEmpId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Timesheet[] = [];

      if (isAdmin) {
        data = await timesheetApi.getAdminTimesheets({
          startDate: `${selectedMonth}-01`,
          endDate: `${selectedMonth}-31`,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          employeeId: adminEmployeeFilter !== 'ALL' ? adminEmployeeFilter : undefined
        });
      } else {
        data = await timesheetApi.getTimesheetHistory({
          month: selectedMonth,
          status: statusFilter !== 'ALL' ? statusFilter : undefined
        }, activeEmpId);
      }

      setTimesheets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      setModalLoading(true);
      const detail = isAdmin
        ? await timesheetApi.getAdminTimesheetDetail(id)
        : await timesheetApi.getTimesheetHistoryDetail(id, activeEmpId);
      setSelectedTimesheet(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load detail snapshot.');
    } finally {
      setModalLoading(false);
    }
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
      setActionSuccess('Timesheet updated successfully.');
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
      if (selectedTimesheet?.id === deletingTimesheet.id) setSelectedTimesheet(null);
      setDeletingTimesheet(null);
      setActionSuccess('Timesheet permanently deleted from data flow.');
      setTimeout(() => setActionSuccess(null), 4000);
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

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isAdmin ? 'System Timesheet History' : 'My Timesheet History'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable snapshots of submitted, approved, and reviewed timesheets directly from the database.
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

          {isAdmin && (
            <select
              value={adminEmployeeFilter}
              onChange={e => setAdminEmployeeFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.empCode || emp.id}>
                  {emp.name} ({emp.empCode || emp.id})
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>

          <button
            onClick={() => loadHistory()}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Reload history"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="animate-spin text-blue-600 mx-auto" size={26} />
            <p className="text-xs text-slate-500 font-semibold">Loading history...</p>
          </div>
        ) : timesheets.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Calendar className="text-slate-300 mx-auto" size={36} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Records Found</p>
            <p className="text-xs text-slate-400">No timesheet records match this month and filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isAdmin && <th className="py-4 px-6">Employee</th>}
                  <th className="py-4 px-6">Date</th>
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
                    className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {isAdmin && (
                      <td className="py-3.5 px-6">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(ts.employee_name || 'E').slice(0, 1)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {ts.employee_name || ts.employee_id}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(ts.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {ts.expected_hours}h
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {ts.duration_formatted || `${ts.total_hours}h`}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {ts.entries_count || 0}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        (ts.proofs_count || 0) > 0
                          ? 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50'
                          : 'bg-slate-100 text-slate-400 border-slate-200/60 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700/50'
                      }`}>
                        {ts.proofs_count || 0} PDFs
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(ts.status)}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(ts.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer whitespace-nowrap"
                          title="View Details"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>

                        {isAdmin && (
                          <>
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
                              title="Admin Delete Timesheet"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <Edit3 size={18} />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Admin Edit Historical Timesheet
                </h3>
              </div>
              <button onClick={() => setEditingTimesheet(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={editForm.expected_hours}
                  onChange={e => setEditForm(p => ({ ...p, expected_hours: parseFloat(e.target.value) || 8 }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Remarks</label>
                <textarea
                  value={editForm.rejection_reason}
                  onChange={e => setEditForm(p => ({ ...p, rejection_reason: e.target.value }))}
                  rows={3}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTimesheet(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save size={13} />
                <span>{actionLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {deletingTimesheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Delete Historical Timesheet?
                </h3>
                <p className="text-[11px] text-rose-500 font-semibold">
                  Complete Data Flow Cascade Purge
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-800 dark:text-rose-300">
              This will completely remove this timesheet ({deletingTimesheet.date}) along with all entries, attached PDF files, and audit records from the system.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTimesheet(null)}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>{actionLoading ? 'Deleting...' : 'Permanently Delete'}</span>
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
          canApprove={isAdmin}
          isAdmin={isAdmin}
          onDelete={async (id) => {
            await timesheetApi.adminDeleteTimesheet(id);
            setTimesheets(prev => prev.filter(t => t.id !== id));
            setSelectedTimesheet(null);
            setActionSuccess('Timesheet and all files completely deleted.');
            setTimeout(() => setActionSuccess(null), 4000);
          }}
          onRefresh={loadHistory}
        />
      )}
    </div>
  );
};
