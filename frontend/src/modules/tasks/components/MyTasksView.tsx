import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  MoreVertical,
  ChevronRight,
  Sparkles,
  Search,
  Eye,
  FileText
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../types';

interface MyTasksViewProps {
  tasks: TaskItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  tasks = [],
  isLoading = false,
  onRefresh,
  onSelectTask
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  const displayTasks = tasks;

  // KPI calculations
  const kpis = useMemo(() => {
    const total = displayTasks.length;
    const inProgress = displayTasks.filter(
      t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'ACCEPTED'
    ).length;
    const completed = displayTasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = displayTasks.filter(t => t.is_overdue || t.status === 'BLOCKED').length;

    return { total, inProgress, completed, overdue };
  }, [displayTasks]);

  // Filter tasks based on active pill
  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'IN_PROGRESS':
        return displayTasks.filter(
          t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'ACCEPTED'
        );
      case 'COMPLETED':
        return displayTasks.filter(t => t.status === 'COMPLETED');
      case 'OVERDUE':
        return displayTasks.filter(t => t.is_overdue || t.status === 'BLOCKED');
      default:
        return displayTasks;
    }
  }, [displayTasks, activeFilter]);

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
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          My Tasks
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Tasks assigned to you
        </p>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Tasks</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {String(kpis.total).padStart(2, '0')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">In Progress</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {String(kpis.inProgress).padStart(2, '0')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Completed</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {String(kpis.completed).padStart(2, '0')}
            </span>
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

      {/* Filter Tabs & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === 'COMPLETED'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveFilter('OVERDUE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === 'OVERDUE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overdue
          </button>
        </div>

        {/* Right Filter Button */}
        <div>
          <button
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
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
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 min-w-[150px]">Progress</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.map(task => {
                const progress = Number(task.progress_percent) || (task.status === 'COMPLETED' ? 100 : 0);
                return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask && onSelectTask(task)}
                  className="hover:bg-slate-50/70 transition cursor-pointer group"
                >
                  {/* Task Title & Description */}
                  <td className="py-3.5 px-4 min-w-[240px]">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {task.description || 'No description provided'}
                    </p>
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {task.project_name || 'HRMS General'}
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

                  {/* More Action */}
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
                        className="absolute right-2 top-10 w-52 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-left space-y-1"
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
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No tasks found in this section.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30">
          <span>
            Showing 1 to {filteredTasks.length} of {filteredTasks.length} tasks
          </span>
        </div>
      </div>
    </div>
  );
};
