import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Eye,
  Check,
  RotateCcw,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  Link2,
  Video,
  FolderGit2,
  ExternalLink,
  Users,
  User,
  Crown,
  Calendar,
  Clock,
  FileText,
  Percent
} from 'lucide-react';
import { TaskItem } from '../types';
import { Modal } from '../../../components/common/Modal';
import { taskApiService } from '../services/taskService';
import { DocumentPreviewModal } from '../../../components/common/DocumentPreviewModal';

interface ReviewTasksViewProps {
  tasks?: TaskItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const ReviewTasksView: React.FC<ReviewTasksViewProps> = ({
  onRefresh,
  onSelectTask
}) => {
  // Self-managed data state — fetches from /api/tasks/review directly
  const [reviewTasks, setReviewTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewTask, setReviewTask] = useState<TaskItem | null>(null);
  const [managerFeedback, setManagerFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState<{ fileName: string; fileUrl?: string } | null>(null);

  const fetchReviewTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskApiService.getReviewTasks();
      setReviewTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks for review');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewTasks();
  }, [fetchReviewTasks]);

  const filteredTasks = useMemo(() => {
    let tasks = reviewTasks;

    if (filterPriority !== 'ALL') {
      tasks = tasks.filter(t => (t.priority || '').toUpperCase() === filterPriority);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(
        t =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.project_name || t.projectName || '').toLowerCase().includes(q) ||
          (t.employee_name || t.employeeName || '').toLowerCase().includes(q) ||
          (t.group_name || '').toLowerCase().includes(q) ||
          (t.assigned_to || t.employeeId || '').toLowerCase().includes(q)
      );
    }

    return tasks;
  }, [reviewTasks, searchQuery, filterPriority]);

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
        managerFeedback: managerFeedback.trim() || 'Approved and signed off.'
      });
      setActionSuccessMsg(`Task "${reviewTask.title}" approved and moved to Completed.`);
      setReviewTask(null);
      setManagerFeedback('');
      if (onRefresh) onRefresh();
      await fetchReviewTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to approve task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewTask) return;
    if (!managerFeedback.trim()) {
      alert('Please enter change request feedback for the employee/group.');
      return;
    }
    setIsProcessing(true);
    try {
      await taskApiService.reopenTask(reviewTask.id, {
        managerFeedback: managerFeedback.trim()
      });
      setActionSuccessMsg(`Changes requested on "${reviewTask.title}". Returned to team with directives.`);
      setReviewTask(null);
      setManagerFeedback('');
      if (onRefresh) onRefresh();
      await fetchReviewTasks();
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 bg-slate-900 text-white border border-slate-700 text-xs animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Review Tasks Queue</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {reviewTasks.length} Pending Sign-Off
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Review completed work deliverables, PR code, video demos, and sign off or request revisions
          </p>
        </div>

        {/* Search & Priority Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, groups, repos..."
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs w-48 sm:w-60"
            />
          </div>

          <div className="relative">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <button
            onClick={fetchReviewTasks}
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-purple-600 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Refresh review queue"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="text-purple-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading review queue...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={28} className="text-rose-400" />
          <p className="text-sm font-semibold text-slate-800">{error}</p>
          <button
            onClick={fetchReviewTasks}
            className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Review Tasks Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Task Title</th>
                  <th className="py-3.5 px-4">Project & Repository</th>
                  <th className="py-3.5 px-4">Scope & Assignee</th>
                  <th className="py-3.5 px-4">Weightage</th>
                  <th className="py-3.5 px-4">Artifacts</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map(task => {
                  const isGroup = task.assignment_type === 'GROUP' || Boolean(task.group_id);
                  const empName = task.employeeName || task.employee_name || task.assigned_to_name || 'Assigned Team';
                  const projName = task.projectName || task.project_name || 'Master Project';

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-purple-50/30 transition cursor-pointer group"
                      onClick={() => setReviewTask(task)}
                    >
                      {/* Task Title */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <p className="font-bold text-slate-900 group-hover:text-purple-700 transition">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {task.completion_note || task.description || 'Deliverable ready for review'}
                        </p>
                      </td>

                      {/* Project & Repository */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">{projName}</span>
                          {task.repository_url && (
                            <a
                              href={task.repository_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-600 hover:underline"
                            >
                              <FolderGit2 size={10} />
                              <span className="max-w-[120px] truncate">{task.repository_url.replace('https://', '')}</span>
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Scope & Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {isGroup ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Users size={11} />
                              <span>{task.group_name || empName} ({task.memberCount || task.members?.length || 0} members)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <User size={11} />
                              <span>{empName}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Weightage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {task.task_weightage || 25}% weight
                        </span>
                      </td>

                      {/* Artifacts (Video / Reference) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {task.video_url && (
                            <span className="p-1 rounded bg-purple-50 text-purple-600 border border-purple-200" title="Video Demo Attached">
                              <Video size={13} />
                            </span>
                          )}
                          {(task.reference_link || task.deliverable_link) && (
                            <span className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200" title="Deliverable Link Attached">
                              <Link2 size={13} />
                            </span>
                          )}
                          {(!task.video_url && !task.reference_link && !task.deliverable_link) && (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </div>
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
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer ml-auto"
                        >
                          <Eye size={13} />
                          <span>Inspect &amp; Sign Off</span>
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
                      <p className="text-xs mt-1">When employees or teams submit deliverables for review, they will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW & ARTIFACT INSPECTION MODAL */}
      <Modal
        isOpen={Boolean(reviewTask)}
        onClose={() => { setReviewTask(null); setManagerFeedback(''); }}
        title="Inspect & Sign Off Deliverables"
        maxWidth="max-w-2xl"
      >
        {reviewTask && (
          <div className="space-y-4 text-xs">
            {/* Header Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-slate-500">{reviewTask.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  READY FOR REVIEW
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900">{reviewTask.title}</h3>
              <p className="text-slate-600 font-normal leading-relaxed">{reviewTask.description}</p>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-[11px] border-t border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">Project:</span>
                  <span className="font-bold text-slate-900">{reviewTask.projectName || reviewTask.project_name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Task Weightage:</span>
                  <span className="font-bold text-blue-600">{reviewTask.task_weightage || 25}% of Project</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Scope Type:</span>
                  <span className="font-bold text-purple-700">
                    {reviewTask.assignment_type === 'GROUP' ? `Group: ${reviewTask.group_name || 'Team'}` : 'Individual'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Priority:</span>
                  <span className="font-bold text-slate-900">{reviewTask.priority}</span>
                </div>
              </div>

              {/* Group Roster if Group Task */}
              {reviewTask.assignment_type === 'GROUP' && reviewTask.members && reviewTask.members.length > 0 && (
                <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100 space-y-1.5 mt-2">
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                    Group Team Roster ({reviewTask.members.length} Members)
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {reviewTask.members.map((m: any) => (
                      <div key={m.employeeId || m.employee_id} className="flex items-center gap-1.5 text-slate-700">
                        {m.isTeamHead || m.is_team_head ? (
                          <span title="Team Head"><Crown size={11} className="text-amber-500 shrink-0" /></span>
                        ) : (
                          <User size={10} className="text-slate-400 shrink-0" />
                        )}
                        <span className="font-semibold">{m.employeeName || m.employee_name || m.name}</span>
                        <span className="font-mono text-[9px] text-slate-400">({m.employeeId || m.employee_id})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Artifacts Inspection Box */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 rounded-xl border border-indigo-100 space-y-3">
              <h4 className="font-bold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 size={15} className="text-indigo-600" />
                <span>Submitted Deliverables &amp; Artifacts</span>
              </h4>

              {/* Reference / PR Link */}
              {(reviewTask.reference_link || reviewTask.deliverable_link) ? (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Link2 size={15} className="text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Deliverable / Code Link:</span>
                      <span className="font-mono text-xs text-blue-700 truncate max-w-sm block">
                        {reviewTask.reference_link || reviewTask.deliverable_link}
                      </span>
                    </div>
                  </div>
                  <a
                    href={reviewTask.reference_link || reviewTask.deliverable_link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <span>Open Link</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              ) : (
                <div className="p-2.5 bg-white/70 rounded-lg border border-slate-200 text-slate-500 text-[11px]">
                  No external pull request link provided.
                </div>
              )}

              {/* Video Demo Link */}
              {reviewTask.video_url ? (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2">
                    <Video size={15} className="text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Demonstration Video:</span>
                      <span className="font-mono text-xs text-purple-700 truncate max-w-sm block">
                        {reviewTask.video_url}
                      </span>
                    </div>
                  </div>
                  <a
                    href={reviewTask.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <span>Watch Video Demo</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              ) : (
                <div className="p-2.5 bg-white/70 rounded-lg border border-slate-200 text-slate-500 text-[11px]">
                  No video demo URL submitted.
                </div>
              )}

              {/* Completion Note */}
              {reviewTask.completion_note && (
                <div className="p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Employee / Team Notes:</span>
                  <p className="text-slate-800 mt-1 font-medium">{reviewTask.completion_note}</p>
                </div>
              )}
            </div>

            {/* Manager Feedback Directives */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Review Feedback / Sign-Off Directives <span className="text-slate-400 font-normal">(Required for Change Requests)</span>
              </label>
              <textarea
                value={managerFeedback}
                onChange={e => setManagerFeedback(e.target.value)}
                placeholder="Enter feedback on deliverables, test verification results, or required code fixes..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition resize-y"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setReviewTask(null); setManagerFeedback(''); }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRequestChanges}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer text-xs"
              >
                <RotateCcw size={14} />
                <span>Request Changes</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer text-xs"
              >
                <Check size={14} />
                <span>Approve &amp; Complete Task</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          fileName={previewDoc.fileName}
          fileUrl={previewDoc.fileUrl}
        />
      )}
    </div>
  );
};
