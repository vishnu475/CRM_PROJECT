import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Plus,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  FileText,
  UserCheck
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../types';

interface AllTasksViewProps {
  tasks: TaskItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddTask?: () => void;
  onSelectTask?: (task: TaskItem) => void;
  onReassignTask?: (task: TaskItem) => void;
  onReviewTask?: (task: TaskItem) => void;
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({
  tasks = [],
  isLoading = false,
  onRefresh,
  onAddTask,
  onSelectTask,
  onReassignTask,
  onReviewTask
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(8);

  const fullList = tasks;

  // Extract distinct projects
  const availableProjects = useMemo(() => {
    const s = new Set<string>();
    fullList.forEach(t => {
      if (t.project_name) s.add(t.project_name);
    });
    return Array.from(s);
  }, [fullList]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const total = fullList.length;
    const inProgress = fullList.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
    const completed = fullList.filter(t => t.status === 'COMPLETED').length;
    const overdue = fullList.filter(t => t.is_overdue || t.status === 'BLOCKED').length;

    return { total, inProgress, completed, overdue };
  }, [fullList]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return fullList.filter(t => {
      if (selectedProject !== 'ALL' && t.project_name !== selectedProject) return false;
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OVERDUE') {
          if (!t.is_overdue && t.status !== 'BLOCKED') return false;
        } else if (t.status !== selectedStatus) {
          return false;
        }
      }
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
      return true;
    });
  }, [fullList, selectedProject, selectedStatus, selectedPriority]);

  // Paginated slice
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));

  // Priority badge styling
  const renderPriorityBadge = (p?: string) => {
    const priority = (p || 'MEDIUM').toUpperCase();
    if (priority === 'HIGH' || priority === 'URGENT') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
          High
        </span>
      );
    }
    if (priority === 'LOW') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
          Low
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
        Medium
      </span>
    );
  };

  // Status badge styling
  const renderStatusBadge = (status?: string, isOverdue?: boolean) => {
    if (isOverdue || status === 'BLOCKED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
          Overdue
        </span>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
          Completed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
        In Progress
      </span>
    );
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            All Tasks
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            View and manage all tasks in the organization
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            onClick={onAddTask}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Tasks</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">In Progress</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.inProgress}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Completed</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.completed}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Overdue</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {String(kpis.overdue).padStart(2, '0')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Project Filter */}
          <div className="relative">
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer pr-8"
            >
              <option value="ALL">All Projects</option>
              <option value="HRMS Mobile App">HRMS Mobile App</option>
              <option value="HRMS Backend">HRMS Backend</option>
              <option value="HRMS Web">HRMS Web</option>
              <option value="HRMS DevOps">HRMS DevOps</option>
              {availableProjects.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer pr-8"
            >
              <option value="ALL">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer pr-8"
            >
              <option value="ALL">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Right Filter Button */}
        <div>
          <button
            type="button"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Filter size={13} /> Filter
          </button>
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[260px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Task</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 min-w-[150px]">Progress</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedTasks.map(task => {
                const progress = Number(task.progress_percent) || (task.status === 'COMPLETED' ? 100 : 0);
                return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask && onSelectTask(task)}
                  className="hover:bg-slate-50/70 transition cursor-pointer group"
                >
                  {/* Task Title */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition min-w-[200px]">
                    {task.title}
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {task.project_name || 'HRMS General'}
                  </td>

                  {/* Assigned To */}
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {task.assigned_to_name || task.employee_name || 'Rohit Sharma'}
                  </td>

                  {/* Progress UI */}
                  <td className="py-3.5 px-4 min-w-[150px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Progress</span>
                        <span className={`font-bold ${progress === 100 ? 'text-emerald-600' : progress >= 50 ? 'text-blue-600' : 'text-slate-700'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            progress === 100
                              ? 'bg-emerald-500'
                              : progress >= 60
                              ? 'bg-blue-600'
                              : progress >= 25
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {formatDate(task.due_date)}
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderPriorityBadge(task.priority)}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderStatusBadge(task.status, task.is_overdue)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuTaskId === task.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-2 top-10 w-56 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-left space-y-1"
                      >
                        <button
                          onClick={() => {
                            if (onSelectTask) onSelectTask(task);
                            setActiveMenuTaskId(null);
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Eye size={15} className="text-blue-600 shrink-0" />
                          <span>View Details</span>
                        </button>

                        {(task.pdf_attachment_name || (task.attachments && task.attachments.length > 0)) && (
                          <button
                            onClick={() => {
                              if (onSelectTask) onSelectTask(task);
                              setActiveMenuTaskId(null);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <FileText size={15} className="text-rose-600 shrink-0" />
                            <span className="truncate">View PDF Spec</span>
                          </button>
                        )}

                        {onReassignTask && (
                          <button
                            onClick={() => {
                              onReassignTask(task);
                              setActiveMenuTaskId(null);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-600 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <UserCheck size={15} className="text-purple-600 shrink-0" />
                            <span>Reassign Task</span>
                          </button>
                        )}

                        {onReviewTask && task.status === 'SUBMITTED' && (
                          <button
                            onClick={() => {
                              onReviewTask(task);
                              setActiveMenuTaskId(null);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            <span>Review & Sign-off</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}

              {paginatedTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <ClipboardList size={20} />
                      </div>
                      <p className="font-semibold text-slate-700">No tasks found</p>
                      <p className="text-slate-400 text-[11px]">There are currently no tasks in this view.</p>
                      {onAddTask && (
                        <button
                          type="button"
                          onClick={onAddTask}
                          className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                        >
                          + Assign First Task
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/30">
          <span>
            {kpis.total > 0
              ? `Showing 1 to ${Math.min(pageSize, filteredTasks.length)} of ${kpis.total} tasks`
              : 'Showing 0 to 0 of 0 tasks'}
          </span>

          {kpis.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 4).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
                      currentPage === p
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 1 && (
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="w-7 h-7 rounded-lg text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  >
                    ›
                  </button>
                )}
              </div>

              <span className="text-slate-400 text-xs">{pageSize} / page</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
