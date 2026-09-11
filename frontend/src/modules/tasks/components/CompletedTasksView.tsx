import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Search,
  Eye,
  RefreshCw,
  AlertCircle,
  Filter,
  Calendar
} from 'lucide-react';
import { TaskItem } from '../types';
import { taskApiService } from '../services/taskService';

interface CompletedTasksViewProps {
  tasks?: TaskItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({
  onRefresh,
  onSelectTask
}) => {
  // Self-managed state — fetches from /api/tasks/completed directly
  const [completedTasks, setCompletedTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  const fetchCompletedTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskApiService.getCompletedTasks();
      setCompletedTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load completed tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedTasks();
  }, [fetchCompletedTasks]);

  const distinctProjects = useMemo(() => {
    const s = new Set<string>();
    completedTasks.forEach(t => {
      const p = t.projectName || t.project_name;
      if (p && p.trim()) s.add(p.trim());
    });
    return Array.from(s).sort();
  }, [completedTasks]);

  const filteredTasks = useMemo(() => {
    return completedTasks.filter(t => {
      const proj = t.projectName || t.project_name || '';
      if (selectedProject !== 'ALL' && proj !== selectedProject) return false;

      const priority = (t.priority || '').toUpperCase();
      if (selectedPriority !== 'ALL' && priority !== selectedPriority) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchProj = proj.toLowerCase().includes(q);
        const matchEmp = (t.employeeName || t.employee_name || '').toLowerCase().includes(q);
        const matchId = (t.employeeId || t.assigned_to || '').toLowerCase().includes(q);
        return matchTitle || matchProj || matchEmp || matchId;
      }
      return true;
    });
  }, [completedTasks, selectedProject, selectedPriority, searchQuery]);

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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Completed Tasks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              {completedTasks.length} Signed Off
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Archived record of successfully reviewed, approved, and completed deliverables
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {distinctProjects.length > 0 && (
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {distinctProjects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}

          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search completed tasks..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
            />
          </div>

          <button
            onClick={fetchCompletedTasks}
            disabled={isLoading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition shadow-sm disabled:opacity-50 cursor-pointer"
            title="Refresh completed tasks"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="text-emerald-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading completed tasks...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-10 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={28} className="text-rose-400" />
          <p className="text-sm font-semibold text-slate-800">{error}</p>
          <button
            onClick={fetchCompletedTasks}
            className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Completed Tasks Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Task</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Assigned Employee</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Completed On</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTasks.map(task => {
                  const empName = task.employeeName || task.employee_name || task.assigned_to_name || 'Employee';
                  const empId = task.employeeId || task.employee_code || task.assigned_to || '-';
                  const projName = task.projectName || task.project_name || 'General Project';
                  const completedDate = task.completed_at || task.updated_at || task.created_at;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/70 transition cursor-pointer group"
                      onClick={() => onSelectTask && onSelectTask(task)}
                    >
                      {/* Task Title */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {task.description || 'Completed work deliverable'}
                        </p>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-semibold border border-slate-200/80">
                          {projName}
                        </span>
                      </td>

                      {/* Employee Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {empName}
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {empId}
                        </span>
                      </td>

                      {/* Completed Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {formatDate(completedDate)}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderPriorityBadge(task.priority)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} />
                          <span>Completed</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (onSelectTask) onSelectTask(task);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <Eye size={12} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <CheckCircle2 size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600 text-sm">No completed tasks found</p>
                      <p className="text-xs mt-1">Tasks approved by Admin will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
