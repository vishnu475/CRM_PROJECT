import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Building,
  Briefcase,
  Edit3,
  Trash2,
  Save,
  ShieldAlert
} from 'lucide-react';
import { timesheetApi } from '../services/timesheetApi';
import { Timesheet, TimesheetProof } from '../types';
import { TimesheetPdfViewerModal } from './TimesheetPdfViewerModal';

interface Props {
  timesheet: Timesheet;
  onClose: () => void;
  canApprove?: boolean;
  isAdmin?: boolean;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const TimesheetDetailModal: React.FC<Props> = ({
  timesheet,
  onClose,
  canApprove = false,
  isAdmin = false,
  onApprove,
  onReject,
  onDelete,
  onRefresh
}) => {
  const [activeProof, setActiveProof] = useState<{
    entryId: string;
    proof: TimesheetProof;
  } | null>(null);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Admin Control Flow: Edit & Delete
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [adminEditForm, setAdminEditForm] = useState({
    status: timesheet.status || 'SUBMITTED',
    expected_hours: timesheet.expected_hours || 8.0,
    date: timesheet.date ? timesheet.date.split('T')[0] : '',
    rejection_reason: timesheet.rejection_reason || ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Admin Work Entry Editing
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryEditForm, setEntryEditForm] = useState({
    start_time: '',
    end_time: '',
    work_title: '',
    work_description: ''
  });

  const entries = timesheet.entries || [];

  const handleApprove = async () => {
    if (!onApprove) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await onApprove(timesheet.id);
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!onReject) return;
    if (!rejectReason.trim()) {
      setActionError('Please enter a rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      setActionError(null);
      await onReject(timesheet.id, rejectReason.trim());
      setShowRejectDialog(false);
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAdminTimesheetEdit = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await timesheetApi.adminUpdateTimesheet(timesheet.id, {
        status: adminEditForm.status,
        expected_hours: Number(adminEditForm.expected_hours),
        date: adminEditForm.date,
        rejection_reason: adminEditForm.rejection_reason
      });
      setShowAdminEditModal(false);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update timesheet.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTimesheet = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      if (onDelete) {
        await onDelete(timesheet.id);
      } else {
        await timesheetApi.adminDeleteTimesheet(timesheet.id);
      }
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete timesheet.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEditEntry = (entry: any) => {
    setEditingEntryId(entry.id);
    setEntryEditForm({
      start_time: entry.start_time || '09:00',
      end_time: entry.end_time || '17:00',
      work_title: entry.work_title || '',
      work_description: entry.work_description || ''
    });
  };

  const handleSaveEditEntry = async (entryId: string) => {
    try {
      setActionLoading(true);
      await timesheetApi.updateWorkEntry(timesheet.id, entryId, entryEditForm);
      setEditingEntryId(null);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update work entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this work entry?')) return;
    try {
      setActionLoading(true);
      await timesheetApi.deleteWorkEntry(timesheet.id, entryId);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete work entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={13} /> Approved
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={13} /> Submitted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle size={13} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Draft
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
          
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-[#2563eb] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {(timesheet.employee_name || 'V').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {timesheet.employee_name || timesheet.employee_id}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {timesheet.emp_code || timesheet.employee_id}
                  </span>
                  {getStatusBadge(timesheet.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {timesheet.department && (
                    <span className="flex items-center gap-1">
                      <Building size={12} /> {timesheet.department}
                    </span>
                  )}
                  {timesheet.designation && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} /> {timesheet.designation}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <Calendar size={12} /> {new Date(timesheet.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Metric KPI Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-slate-800/60 dark:to-slate-800/30 border border-blue-100/60 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {new Date(timesheet.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Hours</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {timesheet.expected_hours}h
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actual Hours Logged</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                  {timesheet.duration_formatted || `${timesheet.total_hours}h`}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entries / Proofs</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {entries.length} entries • {entries.filter(e => e.proof).length} PDFs
                </p>
              </div>
            </div>

            {/* Rejection Alert if rejected */}
            {timesheet.status === 'REJECTED' && timesheet.rejection_reason && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
                <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">Rejection Reason</h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{timesheet.rejection_reason}</p>
                  {timesheet.rejected_by && (
                    <p className="text-[10px] text-rose-500 mt-1">
                      Rejected by {timesheet.rejected_by} on {timesheet.rejected_at ? new Date(timesheet.rejected_at).toLocaleString() : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Approval Info */}
            {timesheet.status === 'APPROVED' && timesheet.approved_by && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Approved by <strong>{timesheet.approved_by}</strong> on {timesheet.approved_at ? new Date(timesheet.approved_at).toLocaleString() : ''}
                </span>
              </div>
            )}

            {/* Assignment Instructions if any */}
            {timesheet.instructions && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Admin Instructions:</span>
                <p className="text-slate-600 dark:text-slate-400">{timesheet.instructions}</p>
              </div>
            )}

            {/* Work Entries Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Work Entries ({entries.length})
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Total: {timesheet.duration_formatted || `${timesheet.total_hours}h`}
                </span>
              </div>

              {entries.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  No work entries recorded for this timesheet.
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-3 hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                            {entry.start_time} - {entry.end_time}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {entry.duration_formatted || `${(entry.duration_minutes / 60).toFixed(1)}h`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">Entry #{idx + 1}</span>
                          {isAdmin && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => handleStartEditEntry(entry)}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                title="Admin Edit Work Entry"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                title="Admin Delete Work Entry"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {editingEntryId === entry.id ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Start Time</label>
                              <input
                                type="time"
                                value={entryEditForm.start_time}
                                onChange={e => setEntryEditForm(p => ({ ...p, start_time: e.target.value }))}
                                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">End Time</label>
                              <input
                                type="time"
                                value={entryEditForm.end_time}
                                onChange={e => setEntryEditForm(p => ({ ...p, end_time: e.target.value }))}
                                className="w-full p-2 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Task Title</label>
                            <input
                              type="text"
                              value={entryEditForm.work_title}
                              onChange={e => setEntryEditForm(p => ({ ...p, work_title: e.target.value }))}
                              className="w-full p-2 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Work Description</label>
                            <textarea
                              value={entryEditForm.work_description}
                              onChange={e => setEntryEditForm(p => ({ ...p, work_description: e.target.value }))}
                              rows={2}
                              className="w-full p-2 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingEntryId(null)}
                              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded-lg font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditEntry(entry.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                            >
                              <Save size={12} />
                              <span>Save Entry</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {entry.work_title}
                          </h4>
                          {entry.work_description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                              {entry.work_description}
                            </p>
                          )}
                        </div>
                      )}

                      {/* PDF Proof Attachment */}
                      {entry.proof ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 text-xs">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <FileText size={18} className="text-rose-500 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {entry.proof.file_name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {formatFileSize(entry.proof.file_size)} • Attached PDF Evidence
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            <button
                              onClick={() => setActiveProof({ entryId: entry.id, proof: entry.proof! })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>View PDF</span>
                            </button>

                            <a
                              href={`/api/timesheets/${timesheet.id}/entries/${entry.id}/proof?download=true`}
                              download={entry.proof.file_name}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Download PDF"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle size={12} /> No supporting PDF proof attached
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                {actionError}
              </div>
            )}
          </div>

          {/* Modal Footer / Review Controls */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            {/* Left Side: Destructive Actions & Meta Info */}
            <div className="flex items-center gap-3 shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title="Permanently remove timesheet"
                >
                  <Trash2 size={13} />
                  <span>Delete Timesheet</span>
                </button>
              )}

              {timesheet.submitted_at && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Clock size={12} className="text-slate-400" />
                  <span>Submitted: {new Date(timesheet.submitted_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Right Side: Close, Edit, and Approval Workflow */}
            <div className="flex items-center gap-2.5 shrink-0 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer whitespace-nowrap"
              >
                Close
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdminEditModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <Edit3 size={13} />
                  <span>Edit Timesheet</span>
                </button>
              )}

              {/* Approve / Reject actions for Admin on SUBMITTED timesheet */}
              {canApprove && timesheet.status === 'SUBMITTED' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <XCircle size={13} />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve Timesheet</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Edit Timesheet Modal */}
      {showAdminEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <Edit3 size={18} />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Admin Edit Timesheet
                </h3>
              </div>
              <button onClick={() => setShowAdminEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={adminEditForm.status}
                  onChange={e => setAdminEditForm(p => ({ ...p, status: e.target.value as any }))}
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
                  value={adminEditForm.date}
                  onChange={e => setAdminEditForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={adminEditForm.expected_hours}
                  onChange={e => setAdminEditForm(p => ({ ...p, expected_hours: parseFloat(e.target.value) || 8 }))}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Remarks / Notes</label>
                <textarea
                  value={adminEditForm.rejection_reason}
                  onChange={e => setAdminEditForm(p => ({ ...p, rejection_reason: e.target.value }))}
                  rows={3}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  placeholder="Feedback or override notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdminEditModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdminTimesheetEdit}
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-100">
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

            <p className="text-xs text-rose-800 dark:text-rose-300">
              This will completely remove this timesheet ({timesheet.date}) along with all entries, attached PDF files, and audit records from the system.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTimesheet}
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

      {/* Reject Reason Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertCircle size={20} />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Reject Timesheet</h3>
              </div>
              <button onClick={() => setShowRejectDialog(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please provide a clear reason for rejecting this timesheet. The employee will see this feedback and be able to update their entries.
            </p>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Please provide a more detailed work description for API Development..."
              rows={4}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF In-App Viewer Modal */}
      {activeProof && (
        <TimesheetPdfViewerModal
          timesheetId={timesheet.id}
          entryId={activeProof.entryId}
          proof={activeProof.proof}
          onClose={() => setActiveProof(null)}
        />
      )}
    </>
  );
};
