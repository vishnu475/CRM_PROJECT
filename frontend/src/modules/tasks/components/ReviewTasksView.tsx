import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Eye,
  Check,
  RotateCcw,
  MessageSquare,
  Search,
  Calendar
} from 'lucide-react';
import { TaskItem, TaskPriority } from '../types';
import { Modal } from '../../../components/common/Modal';
import { taskApiService } from '../services/taskService';

interface ReviewTasksViewProps {
  tasks: TaskItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const ReviewTasksView: React.FC<ReviewTasksViewProps> = ({
  tasks = [],
  isLoading = false,
  onRefresh,
  onSelectTask
}) => {
  const [reviewTask, setReviewTask] = useState<TaskItem | null>(null);
  const [managerFeedback, setManagerFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Strictly filter tasks that are READY_FOR_REVIEW
  const readyTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'READY_FOR_REVIEW' || t.status === 'SUBMITTED');
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return readyTasks;
    const q = searchQuery.toLowerCase();
    return readyTasks.filter(
      t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.project_name || t.projectName || '').toLowerCase().includes(q) ||
        (t.employee_name || t.employeeName || '').toLowerCase().includes(q) ||
        (t.assigned_to || t.employeeId || '').toLowerCase().includes(q)
    );
  }, [readyTasks, searchQuery]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const handleApprove = async () => {
    if (!reviewTask) return;
    setIsProcessing(true);
    try {
      await taskApiService.approveTask(reviewTask.id, {
        managerFeedback: managerFeedback.trim() || 'Approved and completed.'
      });
      setActionSuccessMsg(`Task "${reviewTask.title}" has been approved and moved to Completed.`);
      setReviewTask(null);
      setManagerFeedback('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to approve task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewTask) return;
    if (!managerFeedback.trim()) {
      alert('Please enter change request feedback for the employee.');
      return;
    }
    setIsProcessing(true);
    try {
      await taskApiService.reopenTask(reviewTask.id, {
        managerFeedback: managerFeedback.trim()
      });
      setActionSuccessMsg(`Changes requested on task "${reviewTask.title}". Returned to employee.`);
      setReviewTask(null);
      setManagerFeedback('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to request changes');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPriorityBadge = (p?: string) => {
    const priority = (p || 'MEDIUM').toUpperCase();
    if (priority === 'URGENT') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">Urgent</span>;
    }
    if (priority === 'HIGH') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">High</span>;
    }
    if (priority === 'LOW') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">Low</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Medium</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Toast */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Ready for Review
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
              {readyTasks.length} Pending
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Deliverables submitted by employees requiring Manager or Admin review & approval
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search pending reviews..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
          />
        </div>
      </div>

      {/* Review Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Task</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Submitted By</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Submitted On</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.map(task => {
                const empName = task.employeeName || task.employee_name || task.assigned_to_name || 'Assigned Employee';
                const empId = task.employeeId || task.employee_code || task.assigned_to || '-';
                const projName = task.projectName || task.project_name || 'General Project';
                const submittedDate = task.submitted_at || task.updated_at || task.created_at;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-purple-50/30 transition cursor-pointer group"
                    onClick={() => setReviewTask(task)}
                  >
                    {/* Task Title & Snippet */}
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <p className="font-bold text-slate-900 group-hover:text-purple-700 transition">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {task.completion_note || task.description || 'Deliverable ready for review'}
                      </p>
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-semibold border border-slate-200/80">
                        {projName}
                      </span>
                    </td>

                    {/* Submitted By */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {empName}
                    </td>

                    {/* Employee ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {empId}
                      </span>
                    </td>

                    {/* Submitted On */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatDate(submittedDate)}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderPriorityBadge(task.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                        Ready for Review
                      </span>
                    </td>

                    {/* Action: Review */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setReviewTask(task);
                        }}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer ml-auto"
                      >
                        <Eye size={13} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileCheck2 size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No tasks pending review</p>
                    <p className="text-xs mt-1">When employees complete and submit tasks, they will appear here for Admin review.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW & APPROVAL MODAL */}
      <Modal
        isOpen={Boolean(reviewTask)}
        onClose={() => setReviewTask(null)}
        title="Review Employee Deliverable"
      >
        {reviewTask && (
          <div className="space-y-4 text-xs">
            {/* Task Card Header */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-slate-500">{reviewTask.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  READY FOR REVIEW
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{reviewTask.title}</h3>
              <p className="text-slate-600 font-normal">{reviewTask.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] border-t border-slate-200 mt-2">
                <div>
                  <span className="text-slate-400 font-medium block">Project:</span>
                  <span className="font-bold text-slate-800">{reviewTask.projectName || reviewTask.project_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Submitted By:</span>
                  <span className="font-bold text-slate-800">{reviewTask.employeeName || reviewTask.assigned_to_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Employee ID:</span>
                  <span className="font-mono font-bold text-blue-600">{reviewTask.employeeId || reviewTask.assigned_to}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Priority:</span>
                  <span className="font-bold text-slate-800">{reviewTask.priority}</span>
                </div>
              </div>

              {reviewTask.completion_note && (
                <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-lg mt-3">
                  <span className="text-purple-700 font-bold block text-[11px]">Employee Completion Note:</span>
                  <p className="text-slate-700 mt-0.5">{reviewTask.completion_note}</p>
                </div>
              )}
            </div>

            {/* Manager Feedback Input */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Review Feedback / Directives <span className="text-slate-400 font-normal">(Required if requesting changes)</span>
              </label>
              <textarea
                value={managerFeedback}
                onChange={e => setManagerFeedback(e.target.value)}
                placeholder="Enter feedback for the employee, comments on deliverable, or required revisions..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition resize-y"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewTask(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleRequestChanges}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Request Changes</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check size={14} />
                <span>Approve & Complete</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
