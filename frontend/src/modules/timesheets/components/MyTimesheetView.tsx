import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Save,
  Download,
  History,
  User,
  X,
  FileCheck
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { timesheetApi } from '../services/timesheetApi';
import { Timesheet, TimesheetWorkEntry, TimesheetProof } from '../types';
import { TimesheetPdfViewerModal } from './TimesheetPdfViewerModal';

interface Props {
  onNavigateToHistory?: () => void;
}

export const MyTimesheetView: React.FC<Props> = ({ onNavigateToHistory }) => {
  const { userProfile, employees = [], setUserProfile } = useApp() || {};

  // Active employee ID resolution
  const profileEmpId = (userProfile as any)?.empCode || (userProfile as any)?.id || localStorage.getItem('crm_employee_id') || 'EMP-005';
  const [activeEmpId, setActiveEmpId] = useState<string>(profileEmpId);

  // Current OPEN / DRAFT timesheet state
  const [currentTimesheet, setCurrentTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Success / action messages
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Active in-app PDF viewer
  const [activePdfModal, setActivePdfModal] = useState<{ entryId: string; proof: TimesheetProof } | null>(null);

  // Add Work Entry Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [addingEntry, setAddingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Sync activeEmpId when top header user profile changes
  useEffect(() => {
    const nextId = (userProfile as any)?.empCode || (userProfile as any)?.id;
    if (nextId && nextId !== activeEmpId) {
      setActiveEmpId(nextId);
    }
  }, [userProfile]);

  // Load current DRAFT/OPEN timesheet whenever activeEmpId changes
  useEffect(() => {
    if (activeEmpId) {
      localStorage.setItem('crm_employee_id', activeEmpId);
      loadCurrentTimesheet();
    }
  }, [activeEmpId]);

  /**
   * Load only the CURRENT OPEN/DRAFT timesheet for this employee.
   * If there is no draft, currentTimesheet will be null and the page renders an empty form.
   */
  const loadCurrentTimesheet = async (targetDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await timesheetApi.getCurrentTimesheet(activeEmpId, targetDate);
      setCurrentTimesheet(data);
      if (data?.date) {
        setNewDate(data.date);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load current timesheet.');
      setCurrentTimesheet(null);
    } finally {
      setLoading(false);
    }
  };

  // Time conversion & calculation helpers
  const parseTimeToMins = (t: string): number | null => {
    if (!t) return null;
    const parts = t.trim().split(':');
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const calculateHoursLabel = (start: string, end: string): string => {
    const s = parseTimeToMins(start);
    const e = parseTimeToMins(end);
    if (s === null || e === null || e <= s) return '0h';
    const diff = e - s;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  };

  const checkOverlap = (
    startM: number,
    endM: number,
    existingEntries: TimesheetWorkEntry[]
  ): boolean => {
    for (const ex of existingEntries) {
      const exS = parseTimeToMins(ex.start_time);
      const exE = parseTimeToMins(ex.end_time);
      if (exS !== null && exE !== null) {
        if (Math.max(startM, exS) < Math.min(endM, exE)) {
          return true; // Overlap detected
        }
      }
    }
    return false;
  };

  // Add Work Entry Flow: creates draft if needed, adds entry, uploads proof
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const sM = parseTimeToMins(newStartTime);
    const eM = parseTimeToMins(newEndTime);

    if (sM === null || eM === null) {
      setEntryError('Please specify valid start and end times.');
      return;
    }
    if (eM <= sM) {
      setEntryError('End time must be after start time.');
      return;
    }

    if (currentTimesheet?.entries && checkOverlap(sM, eM, currentTimesheet.entries)) {
      setEntryError('Work entries cannot overlap.');
      return;
    }

    if (!newTitle.trim()) {
      setEntryError('Work title / task name is required.');
      return;
    }

    if (!newPdfFile && (currentTimesheet?.proof_required ?? true)) {
      setEntryError('Supporting PDF evidence document is required.');
      return;
    }

    try {
      setAddingEntry(true);
      setEntryError(null);

      // 1. Ensure a DRAFT timesheet exists for the selected date
      let tsId = currentTimesheet?.id;
      if (!tsId || (currentTimesheet && currentTimesheet.date !== newDate)) {
        const draft = await timesheetApi.getOrCreateDraftTimesheet(newDate, activeEmpId);
        tsId = draft.id;
      }

      // 2. Add work entry
      const createdEntry = await timesheetApi.addWorkEntry(tsId, {
        start_time: newStartTime,
        end_time: newEndTime,
        work_title: newTitle.trim(),
        work_description: newDesc.trim()
      }, activeEmpId);

      // 3. Upload PDF proof if provided
      if (newPdfFile && createdEntry?.id) {
        await timesheetApi.uploadProof(tsId, createdEntry.id, newPdfFile, activeEmpId);
      }

      // 4. Reload the current draft timesheet directly from database
      await loadCurrentTimesheet(newDate);

      // 5. Reset form inputs
      setNewTitle('');
      setNewDesc('');
      setNewPdfFile(null);
      setShowAddForm(false);
      setSubmitSuccess(null);
    } catch (err: any) {
      setEntryError(err.message || 'Failed to add work entry.');
    } finally {
      setAddingEntry(false);
    }
  };

  // Delete Entry (only in draft mode)
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentTimesheet) return;
    if (!confirm('Are you sure you want to remove this work entry?')) return;

    try {
      await timesheetApi.deleteWorkEntry(currentTimesheet.id, entryId, activeEmpId);
      await loadCurrentTimesheet(currentTimesheet.date);
    } catch (err: any) {
      alert(err.message || 'Failed to delete work entry.');
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!currentTimesheet) return;
    setSaveStatus('saving');
    try {
      await timesheetApi.saveDraft(currentTimesheet.id, activeEmpId);
      await loadCurrentTimesheet(currentTimesheet.date);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      alert(err.message || 'Failed to save draft.');
    }
  };

  // Submit Timesheet: validates, transitions to SUBMITTED, and immediately resets current entry page
  const handleSubmitTimesheet = async () => {
    if (!currentTimesheet) return;

    const entries = currentTimesheet.entries || [];
    if (entries.length === 0) {
      alert('At least one work entry is required to submit a timesheet.');
      return;
    }

    if (currentTimesheet.proof_required ?? true) {
      const missingProof = entries.some((e: any) => !e.proof);
      if (missingProof) {
        alert('All work entries must have supporting PDF evidence attached before submitting.');
        return;
      }
    }

    if (!confirm(`Are you sure you want to submit your timesheet for ${currentTimesheet.date}? Once submitted, it will be permanently saved in Timesheet History and cannot be modified.`)) {
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitSuccess(null);
      const res = await timesheetApi.submitTimesheet(currentTimesheet.id, activeEmpId);

      // Immediately reset the current employee page state
      setCurrentTimesheet(null);

      // Re-fetch current timesheet from backend:
      // Since backend identifies this timesheet is SUBMITTED, GET /api/timesheets/current returns null!
      await loadCurrentTimesheet();

      setSubmitSuccess(res.message || 'Timesheet submitted successfully and moved to Timesheet History.');
    } catch (err: any) {
      alert(err.message || 'Timesheet submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const activeEmpObj = (employees || []).find(
    e => (e.empCode || e.id) === activeEmpId
  );

  const entriesList = currentTimesheet?.entries || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      


      {/* Submission Success Banner */}
      {submitSuccess && (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {submitSuccess}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                The submitted timesheet is permanently recorded and viewable under Timesheet History.
              </p>
            </div>
          </div>
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
            >
              <History size={13} />
              <span>Open History</span>
            </button>
          )}
        </div>
      )}

      {/* Current Draft Overview (Shown only when an active DRAFT exists) */}
      {currentTimesheet && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Open Draft</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  DRAFT
                </span>
              </div>
              <p className="font-black text-sm text-slate-900 dark:text-slate-100">
                {new Date(currentTimesheet.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged / Expected</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                <span className="text-blue-600 dark:text-blue-400">
                  {currentTimesheet.duration_formatted || `${currentTimesheet.total_hours}h`}
                </span>
                {' '}/ {currentTimesheet.expected_hours}h
              </p>
            </div>
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 animate-pulse">
                <RefreshCw size={12} className="animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 size={12} /> Saved
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DAILY WORK ENTRIES SECTION */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Daily Work Entries ({entriesList.length})
            </h2>
            <p className="text-xs text-slate-500">
              Record your scheduled tasks, time spent, and attach supporting PDF evidence.
            </p>
          </div>

          {/* Add Work Entry Button */}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEntryError(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] hover:from-[#1d4ed8] hover:to-[#3b82f6] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>Add Work Entry</span>
          </button>
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddEntry}
            className="p-6 rounded-3xl bg-blue-50/40 dark:bg-slate-800/80 border-2 border-blue-200 dark:border-blue-900 shadow-sm space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                New Work Entry
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {entryError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{entryError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Timesheet Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={e => setNewStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={e => setNewEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Calculated Duration
                </label>
                <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-blue-400 border border-transparent">
                  {calculateHoursLabel(newStartTime, newEndTime)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Task Name / Work Title *
              </label>
              <input
                type="text"
                placeholder="e.g. API, Database, Frontend UI, Bug Fixes..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Description (Optional)
              </label>
              <textarea
                placeholder="Detail the work carried out, milestones, or bugs fixed..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Attach PDF Supporting Evidence */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                PDF Proof / Supporting Document *
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs transition">
                  <UploadCloud size={15} className="text-blue-600" />
                  <span>{newPdfFile ? newPdfFile.name : 'Select PDF Proof Document'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setNewPdfFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                {newPdfFile && (
                  <button
                    type="button"
                    onClick={() => setNewPdfFile(null)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Remove File
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/60">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingEntry}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {addingEntry ? 'Saving Entry...' : 'Save Work Entry'}
              </button>
            </div>
          </form>
        )}

        {/* Empty State: Shown when no current draft entries exist */}
        {entriesList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
              <Calendar size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No current timesheet entries.
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No open draft timesheet is currently active for this employee. Click "+ Add Work Entry" to log scheduled tasks, record hours, and upload PDF proof.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-400 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Work Entry</span>
            </button>
          </div>
        ) : (
          /* Cards list representing the CURRENT OPEN/DRAFT work entries */
          <div className="space-y-4">
            {entriesList.map((entry: any, idx: number) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-200 transition-all"
              >
                {/* Entry Header: Time slot + duration + delete button */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {entry.start_time} - {entry.end_time}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                      Duration: {entry.duration_formatted || `${(entry.duration_minutes / 60).toFixed(1)}h`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Remove entry"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Task: {entry.work_title}
                  </h4>
                  {entry.work_description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                      {entry.work_description}
                    </p>
                  )}
                </div>

                {/* PDF Proof */}
                {entry.proof ? (
                  <div className="pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {entry.proof.file_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(entry.proof.file_size)} • Supporting PDF Evidence
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActivePdfModal({ entryId: entry.id, proof: entry.proof! })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300 transition cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        <a
                          href={`/api/timesheets/proofs/${entry.proof.id}/download`}
                          download={entry.proof.file_name}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 flex items-center gap-1.5 pt-1">
                    <AlertCircle size={14} />
                    <span>No supporting PDF proof attached.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer: Save Draft & Submit Timesheet (Shown only when in active draft with entries) */}
      {currentTimesheet && entriesList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Total Actual Hours: <span className="text-blue-600 font-mono font-bold">{currentTimesheet.duration_formatted || `${currentTimesheet.total_hours}h`}</span>
              {' '}• Expected: <span className="font-mono font-semibold">{currentTimesheet.expected_hours}h</span>
            </p>
            <p className="text-[11px] text-slate-400">Save draft to continue later or submit for manager approval.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              <Save size={14} />
              <span>Save Draft</span>
            </button>

            <button
              onClick={handleSubmitTimesheet}
              disabled={submitLoading || entriesList.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] hover:from-[#1d4ed8] hover:to-[#3b82f6] text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              <span>{submitLoading ? 'Submitting...' : 'Submit Timesheet'}</span>
            </button>
          </div>
        </div>
      )}

      {/* In-app PDF Viewer Modal */}
      {activePdfModal && currentTimesheet && (
        <TimesheetPdfViewerModal
          timesheetId={currentTimesheet.id}
          entryId={activePdfModal.entryId}
          proof={activePdfModal.proof}
          onClose={() => setActivePdfModal(null)}
        />
      )}
    </div>
  );
};
