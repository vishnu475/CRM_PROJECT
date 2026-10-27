import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban, CheckCircle2, Clock, AlertCircle, Send, RefreshCw,
  ChevronRight, Tag, Layers, TrendingUp, ArrowRight, X, CheckCheck,
  FlaskConical, FileText, Sparkles, Building2, Calendar, Users,
  Shield, Zap, CheckSquare, Play, BarChart3, Eye
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { taskApiService } from '../services/taskService';

interface MyProjectAllocationsViewProps {
  employeeId?: string;
}

/**
 * MyProjectAllocationsView — Employee-facing "My Assigned Projects" view.
 *
 * Data source: project_allocations table (via /api/allocations/employee/:id)
 * Shows only projects the logged-in employee is ACTUALLY allocated to.
 * Task progress comes from live tasks table (no fake data).
 * "Submit for Testing" appears ONLY when progress = 100%.
 */
export const MyProjectAllocationsView: React.FC<MyProjectAllocationsViewProps> = ({ employeeId }) => {
  const { employees, userProfile } = useApp();

  // Resolve current employee ID
  const resolvedEmpId = employeeId || (() => {
    const match = employees.find(
      e => e.name === userProfile?.name ||
        e.empCode === (userProfile as any)?.empCode ||
        e.id === userProfile?.id
    );
    return match?.empCode || match?.id || (userProfile as any)?.emp_code ||
      (userProfile as any)?.empCode || (userProfile as any)?.id || 'EMP-005';
  })();

  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlloc, setExpandedAlloc] = useState<string | null>(null);
  const [allocTasks, setAllocTasks] = useState<Record<string, any[]>>({});
  const [isLoadingTasks, setIsLoadingTasks] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskApiService.getEmployeeAllocations(resolvedEmpId);
      setAllocations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load your allocated projects');
    } finally {
      setIsLoading(false);
    }
  }, [resolvedEmpId]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const fetchTasksForAllocation = async (allocId: string) => {
    if (allocTasks[allocId]) return; // Already loaded
    setIsLoadingTasks(allocId);
    try {
      const tasks = await taskApiService.getAllocationTasks(allocId);
      setAllocTasks(prev => ({ ...prev, [allocId]: tasks }));
    } catch {
      // silent
    } finally {
      setIsLoadingTasks(null);
    }
  };

  const handleExpandAllocation = async (allocId: string) => {
    if (expandedAlloc === allocId) {
      setExpandedAlloc(null);
    } else {
      setExpandedAlloc(allocId);
      await fetchTasksForAllocation(allocId);
    }
  };

  const handleUpdateTaskProgress = async (allocId: string, taskId: string, status: string, progressPercent: number) => {
    setUpdatingTaskId(taskId);
    try {
      await taskApiService.updateProgress(taskId, { progressPercent, status }, resolvedEmpId);
      // Refresh allocation tasks
      const fresh = await taskApiService.getAllocationTasks(allocId);
      setAllocTasks(prev => ({ ...prev, [allocId]: fresh }));
      // Refresh allocations list to get updated completion %
      const updated = await taskApiService.getEmployeeAllocations(resolvedEmpId);
      setAllocations(updated);
      setSuccessMsg('Task updated!');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSubmitForTesting = async (allocId: string) => {
    setSubmittingId(allocId);
    setErrorMsg(null);
    try {
      await taskApiService.submitAllocationForTesting(allocId, submitNote);
      setSuccessMsg('Module submitted for QA testing!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setShowSubmitDialog(null);
      setSubmitNote('');
      await fetchAllocations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit for testing');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusColor = (pct: number, testingStatus?: string) => {
    if (testingStatus === 'READY_FOR_TESTING' || testingStatus === 'TESTING_IN_PROGRESS') return 'from-amber-500 to-orange-500';
    if (testingStatus === 'TESTING_PASSED' || testingStatus === 'APPROVED') return 'from-emerald-500 to-green-600';
    if (testingStatus === 'TESTING_FAILED') return 'from-red-500 to-rose-600';
    if (pct === 100) return 'from-emerald-500 to-teal-600';
    if (pct >= 75) return 'from-blue-500 to-indigo-600';
    if (pct >= 40) return 'from-violet-500 to-purple-600';
    return 'from-slate-400 to-slate-500';
  };

  const getStatusLabel = (alloc: any) => {
    const status = alloc.testing_status;
    if (status === 'READY_FOR_TESTING') return { label: 'In QA Queue', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <FlaskConical size={10} /> };
    if (status === 'TESTING_IN_PROGRESS') return { label: 'Being Tested', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <FlaskConical size={10} /> };
    if (status === 'TESTING_PASSED' || status === 'APPROVED') return { label: 'QA Passed ✓', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCheck size={10} /> };
    if (status === 'TESTING_FAILED') return { label: 'QA Failed', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle size={10} /> };
    const pct = parseFloat(alloc.completion_percentage || 0);
    if (pct === 100) return { label: 'Ready to Submit', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: <CheckCircle2 size={10} /> };
    if (pct > 0) return { label: 'In Development', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Zap size={10} /> };
    return { label: 'Not Started', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Clock size={10} /> };
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />;
      case 'IN_PROGRESS': return <Play size={14} className="text-blue-500 shrink-0" />;
      case 'REVIEW': return <Eye size={14} className="text-amber-500 shrink-0" />;
      default: return <Clock size={14} className="text-slate-400 shrink-0" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <FolderKanban size={28} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
              <RefreshCw size={11} className="text-violet-600 animate-spin" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Loading your allocated projects…</p>
            <p className="text-xs text-slate-500 mt-1">Fetching live task progress from database</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <p className="font-bold text-slate-800 text-sm">{error}</p>
          <button onClick={fetchAllocations} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto">
            <FolderKanban size={28} className="text-slate-400" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">No Projects Allocated</p>
            <p className="text-sm text-slate-500 mt-1">
              You haven't been assigned to any project modules yet.
              Contact your admin or project manager to get allocated.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Global Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium shadow-sm animate-fade-in">
          <CheckCheck size={16} className="text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium shadow-sm animate-fade-in">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow">
              <FolderKanban size={14} className="text-white" />
            </div>
            My Allocated Projects
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 ml-9">
            {allocations.length} module{allocations.length !== 1 ? 's' : ''} allocated to you
          </p>
        </div>
        <button
          onClick={fetchAllocations}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Allocation Cards */}
      <div className="space-y-4">
        {allocations.map((alloc) => {
          const pct = parseFloat(alloc.completion_percentage || 0);
          const total = parseInt(alloc.total_tasks || 0, 10);
          const completed = parseInt(alloc.completed_tasks || 0, 10);
          const inprogress = parseInt(alloc.inprogress_tasks || 0, 10);
          const isExpanded = expandedAlloc === alloc.id;
          const statusInfo = getStatusLabel(alloc);
          const gradientClass = getStatusColor(pct, alloc.testing_status);
          const isInTesting = ['READY_FOR_TESTING', 'TESTING_IN_PROGRESS', 'TESTING_PASSED', 'APPROVED', 'TESTING_FAILED'].includes(alloc.testing_status);
          const canSubmitForTesting = pct === 100 && !isInTesting;
          const tasks = allocTasks[alloc.id] || [];

          return (
            <div
              key={alloc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header — Gradient Banner */}
              <div className={`bg-gradient-to-r ${gradientClass} p-4 text-white`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full tracking-wider uppercase">
                        {alloc.project_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 bg-white/90 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-white leading-tight">{alloc.project_name}</h3>
                    <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1.5">
                      <Layers size={11} />
                      <span className="font-semibold">{alloc.module_name}</span>
                      <span className="opacity-60">•</span>
                      <span>{alloc.role}</span>
                    </p>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative w-14 h-14 shrink-0 ml-3">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
                      <circle
                        cx="28" cy="28" r="22" fill="none"
                        stroke="white" strokeWidth="5"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-white font-black text-xs leading-none">{Math.round(pct)}%</span>
                      <span className="text-white/70 text-[8px] leading-none">done</span>
                    </div>
                  </div>
                </div>

                {/* Mini Stats Row */}
                <div className="flex items-center gap-3 mt-3 text-xs text-white/90">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <strong>{completed}</strong>/{total} tasks
                  </span>
                  {inprogress > 0 && (
                    <span className="flex items-center gap-1">
                      <Play size={11} />
                      <strong>{inprogress}</strong> in progress
                    </span>
                  )}
                  {alloc.testing_document_verdict && (
                    <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                      <FileText size={10} />
                      QA Doc: <strong>{alloc.testing_document_verdict}</strong>
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-3 bg-white/25 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-white transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Project Meta */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {alloc.project_manager && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      <Users size={9} />
                      PM: {alloc.project_manager}
                    </span>
                  )}
                  {alloc.start_date && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      <Calendar size={9} />
                      {new Date(alloc.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  {alloc.client && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      <Building2 size={9} />
                      {alloc.client}
                    </span>
                  )}
                  {alloc.module_description && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      <Tag size={9} />
                      {alloc.module_description}
                    </span>
                  )}
                </div>

                {/* Testing Status Banner */}
                {alloc.testing_status === 'READY_FOR_TESTING' && (
                  <div className="mb-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
                    <FlaskConical size={15} className="text-amber-600 shrink-0 animate-bounce" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-800">Module submitted for QA testing</p>
                      <p className="text-[10px] text-amber-600">Waiting for a QA engineer to be assigned.</p>
                    </div>
                  </div>
                )}
                {alloc.testing_status === 'TESTING_IN_PROGRESS' && (
                  <div className="mb-3 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5">
                    <Shield size={15} className="text-blue-600 shrink-0 animate-pulse" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-800">QA testing in progress</p>
                      <p className="text-[10px] text-blue-600">
                        {alloc.testing_document_tester ? `Tested by: ${alloc.testing_document_tester}` : 'QA engineer is running test cases'}
                      </p>
                    </div>
                  </div>
                )}
                {(alloc.testing_status === 'TESTING_PASSED' || alloc.testing_status === 'APPROVED') && (
                  <div className="mb-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                    <CheckCheck size={15} className="text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-800">Module passed QA testing! 🎉</p>
                      {alloc.testing_document_name && (
                        <p className="text-[10px] text-emerald-600">Report: {alloc.testing_document_name}</p>
                      )}
                    </div>
                  </div>
                )}
                {alloc.testing_status === 'TESTING_FAILED' && (
                  <div className="mb-3 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5">
                    <AlertCircle size={15} className="text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-red-700">QA testing failed — bugs reported</p>
                      <p className="text-[10px] text-red-500">Review the testing document for details</p>
                    </div>
                  </div>
                )}

                {/* Submit for Testing CTA */}
                {canSubmitForTesting && (
                  <button
                    onClick={() => setShowSubmitDialog(alloc.id)}
                    className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Send size={13} className="animate-pulse" />
                    Submit for QA Testing
                    <span className="ml-1 text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">All tasks done!</span>
                  </button>
                )}

                {/* Expand/Collapse Tasks */}
                <button
                  onClick={() => handleExpandAllocation(alloc.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-violet-500" />
                    {total > 0 ? `View ${total} tasks (${completed} completed)` : 'No tasks yet'}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Expanded Task List */}
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {isLoadingTasks === alloc.id ? (
                      <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                        <RefreshCw size={12} className="animate-spin" /> Loading tasks…
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No tasks assigned to this allocation yet.
                      </div>
                    ) : (
                      tasks.map((task) => {
                        const tStatus = (task.status || '').toUpperCase();
                        const isCompleted = tStatus === 'COMPLETED';
                        const isUpdating = updatingTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isCompleted
                                ? 'bg-emerald-50/80 border-emerald-200'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-blue-50/50 hover:border-blue-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {getTaskStatusIcon(task.status)}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    tStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                    tStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {task.status?.replace('_', ' ') || 'TODO'}
                                  </span>
                                  {task.priority && (
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                      task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-200' :
                                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                      'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  )}
                                  {task.progress_percent !== undefined && (
                                    <span className="text-[9px] text-slate-400 font-mono">{task.progress_percent}%</span>
                                  )}
                                </div>
                              </div>
                              {/* Quick action buttons */}
                              {!isCompleted && !isInTesting && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {tStatus === 'TODO' && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateTaskProgress(alloc.id, task.id, 'IN_PROGRESS', 10)}
                                      className="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-[9px] font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                      Start
                                    </button>
                                  )}
                                  {tStatus === 'IN_PROGRESS' && (
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => handleUpdateTaskProgress(alloc.id, task.id, 'COMPLETED', 100)}
                                      className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[9px] font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                      Done
                                    </button>
                                  )}
                                  {isUpdating && <RefreshCw size={10} className="animate-spin text-slate-400" />}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit for Testing Dialog */}
      {showSubmitDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => !submittingId && setShowSubmitDialog(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <FlaskConical size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base">Submit for QA Testing</h3>
                  <p className="text-xs text-white/80">All tasks are 100% complete. Ready to submit!</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  This will create a QA testing request for the{' '}
                  <strong>{allocations.find(a => a.id === showSubmitDialog)?.module_name}</strong> module.
                  The admin will review and assign a QA engineer to test it.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Submission Note (optional)
                </label>
                <textarea
                  value={submitNote}
                  onChange={e => setSubmitNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. All features implemented and unit tested. Edge cases handled for attendance biometric sync."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowSubmitDialog(null); setSubmitNote(''); }}
                  disabled={!!submittingId}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitForTesting(showSubmitDialog)}
                  disabled={!!submittingId}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs hover:from-teal-600 hover:to-emerald-700 transition shadow-md cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submittingId ? (
                    <><RefreshCw size={12} className="animate-spin" /> Submitting…</>
                  ) : (
                    <><Send size={12} /> Confirm Submit</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjectAllocationsView;
