import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Plus,
  MoreVertical,
  ChevronDown,
  Search,
  Eye,
  FileText,
  UserCheck,
  MessageSquare,
  Users,
  User,
  FolderGit2,
  ExternalLink,
  Calendar,
  Percent,
  Crown,
  Info,
  Layers,
  X
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../types';
import { Modal } from '../../../components/common/Modal';
import { taskApiService } from '../services/taskService';

interface AllTasksViewProps {
  tasks: TaskItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddTask?: () => void;
  onSelectTask?: (task: TaskItem) => void;
  onReassignTask?: (task: TaskItem) => void;
  onReviewTask?: (task: TaskItem) => void;
  onOpenComments?: (task: TaskItem) => void;
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({
  tasks = [],
  isLoading = false,
  onRefresh,
  onAddTask,
  onSelectTask,
  onReassignTask,
  onReviewTask,
  onOpenComments
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  // Project Workspace Modal state
  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(null);
  const [workspaceData, setWorkspaceData] = useState<any | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  // Group Details Modal state
  const [selectedGroupModal, setSelectedGroupModal] = useState<any | null>(null);
  const [isLoadingGroupModal, setIsLoadingGroupModal] = useState(false);

  const handleOpenGroupDetails = async (e: React.MouseEvent, groupIdOrName: string) => {
    e.stopPropagation();
    setIsLoadingGroupModal(true);
    setSelectedGroupModal({ name: groupIdOrName });
    try {
      // Fetch all groups to find the matching one
      const allGroups = await taskApiService.getGroups();
      const match = allGroups.find(
        g => g.id === groupIdOrName || g.name.toLowerCase() === groupIdOrName.toLowerCase()
      );
      if (match) {
        const full = await taskApiService.getGroupById(match.id);
        setSelectedGroupModal(full);
      } else {
        setSelectedGroupModal({ name: groupIdOrName, members: [] });
      }
    } catch (err) {
      console.warn('Failed to load group details:', err);
    } finally {
      setIsLoadingGroupModal(false);
    }
  };

  const fullList = tasks;

  // Extract distinct projects
  const availableProjects = useMemo(() => {
    const s = new Set<string>();
    fullList.forEach(t => {
      const p = t.projectName || t.project_name;
      if (p && p.trim() && p !== 'DEFAULT' && p !== 'null') s.add(p.trim());
    });
    return Array.from(s).sort();
  }, [fullList]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const total = fullList.length;
    const inProgress = fullList.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'CHANGES_REQUESTED').length;
    const completed = fullList.filter(t => t.status === 'COMPLETED').length;
    const overdue = fullList.filter(t => t.is_overdue || t.status === 'BLOCKED').length;

    return { total, inProgress, completed, overdue };
  }, [fullList]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return fullList.filter(t => {
      const proj = t.projectName || t.project_name;
      if (selectedProject !== 'ALL' && proj !== selectedProject) return false;
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OVERDUE') {
          if (!t.is_overdue && t.status !== 'BLOCKED') return false;
        } else if (selectedStatus === 'READY_FOR_REVIEW') {
          if (t.status !== 'READY_FOR_REVIEW' && t.status !== 'SUBMITTED') return false;
        } else if (selectedStatus === 'CHANGES_REQUESTED') {
          if (t.status !== 'CHANGES_REQUESTED' && t.status !== 'REOPENED') return false;
        } else if (t.status !== selectedStatus) {
          return false;
        }
      }
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const empMatch = (t.employeeName || t.assigned_to_name || '').toLowerCase().includes(q);
        const grpMatch = (t.group_name || '').toLowerCase().includes(q);
        const projMatch = (t.projectName || t.project_name || '').toLowerCase().includes(q);
        if (!titleMatch && !empMatch && !grpMatch && !projMatch) return false;
      }
      return true;
    });
  }, [fullList, selectedProject, selectedStatus, selectedPriority, searchQuery]);

  // Paginated slice
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));

  // Open Project Workspace
  const handleOpenProjectWorkspace = async (e: React.MouseEvent, projectIdOrName: string) => {
    e.stopPropagation();
    setWorkspaceProjectId(projectIdOrName);
    setIsLoadingWorkspace(true);
    try {
      const data = await taskApiService.getProjectWorkspace(projectIdOrName);
      setWorkspaceData(data);
    } catch (err) {
      console.warn('Failed to load project workspace:', err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

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
    if (status === 'READY_FOR_REVIEW' || status === 'SUBMITTED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
          In Review
        </span>
      );
    }
    if (status === 'CHANGES_REQUESTED' || status === 'REOPENED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Changes Req
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
        In Progress
      </span>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>All Tasks &amp; Work Orders</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Project Master
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Dynamic Project → Group/Employee → Task → Review Workflow
          </p>
        </div>

        <button
          type="button"
          onClick={onAddTask}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} /> Assign New Task
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Tasks</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">In Progress</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.inProgress}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Completed</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{kpis.completed}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

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
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
          {/* Search Query */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, teams, repos..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project Filter */}
          <div className="relative">
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {availableProjects.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="READY_FOR_REVIEW">In Review</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Task & Scope</th>
                <th className="py-3.5 px-4">Project (Master Workspace)</th>
                <th className="py-3.5 px-4">Assignment Scope</th>
                <th className="py-3.5 px-4 min-w-[140px]">Progress & Weight</th>
                <th className="py-3.5 px-4">Deadlines (5-Day Rule)</th>
                <th className="py-3.5 px-4">Priority & Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedTasks.map(task => {
                const progress = Number(task.progress_percent) || (task.status === 'COMPLETED' ? 100 : 0);
                const isGroup = task.assignment_type === 'GROUP' || Boolean(task.group_id);
                const projName = task.projectName || task.project_name || 'Master Project';
                const projId = task.projectId || task.project_id || projName;

                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className="hover:bg-slate-50/70 transition cursor-pointer group"
                  >
                    {/* Task Title */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {task.description || 'No description'}
                      </p>
                    </td>

                    {/* Project Chip -> Clickable opens Project Workspace */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={e => handleOpenProjectWorkspace(e, projId)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200/80 transition cursor-pointer"
                        title="Click to view full project workspace, calculated progress & tasks"
                      >
                        <FolderGit2 size={13} className="text-blue-600" />
                        <span>{projName}</span>
                        <ExternalLink size={10} className="text-blue-400" />
                      </button>
                    </td>

                    {/* Assignment Scope */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isGroup ? (
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={e => handleOpenGroupDetails(e, task.group_id || task.group_name || task.assigned_to_name || '')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200 transition cursor-pointer shadow-2xs group/grp"
                            title="Click to view full team details, members, roles & modules"
                          >
                            <Users size={12} className="text-purple-600" />
                            <span>{task.group_name || task.assigned_to_name}</span>
                            <ExternalLink size={10} className="text-purple-400 group-hover/grp:text-purple-600" />
                          </button>
                          <span className="text-[10px] text-slate-500 block font-medium pl-1">
                            {task.memberCount || task.members?.length || 'Team'} members
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <User size={11} />
                            <span>{task.employeeName || task.assigned_to_name}</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block">
                            {task.employeeId || task.assigned_to}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Progress UI & Weightage */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-600">{progress}%</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {task.task_weightage || 25}% weight
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progress === 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Deadlines with 5-Day Review Rule */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1 text-slate-800 font-semibold">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Due: {formatDate(task.due_date)}</span>
                        </div>
                        {task.review_target_date && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200/60">
                            <Clock size={10} className="text-amber-600" />
                            <span>Review: {formatDate(task.review_target_date)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Priority & Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {renderStatusBadge(task.status, task.is_overdue)}
                        {renderPriorityBadge(task.priority)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          if (onSelectTask) onSelectTask(task);
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        <Eye size={12} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No tasks found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROJECT WORKSPACE MODAL */}
      {workspaceProjectId && (
        <Modal
          isOpen={Boolean(workspaceProjectId)}
          onClose={() => { setWorkspaceProjectId(null); setWorkspaceData(null); }}
          title={`Project Workspace: ${workspaceData?.project?.name || workspaceProjectId}`}
          maxWidth="max-w-4xl"
        >
          {isLoadingWorkspace ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Loading project workspace and aggregated progress...
            </div>
          ) : workspaceData?.project ? (
            <div className="space-y-5 text-xs">
              {/* Project Master Metadata Card */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Master Project Record</span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{workspaceData.project.name}</span>
                      <span className="text-xs font-mono font-bold bg-blue-500/30 px-2 py-0.5 rounded text-blue-300">
                        {workspaceData.project.code || workspaceData.project.id}
                      </span>
                    </h3>
                  </div>

                  {workspaceData.project.repository_url && (
                    <a
                      href={workspaceData.project.repository_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/10"
                    >
                      <FolderGit2 size={13} />
                      <span>{workspaceData.project.repository_url.replace('https://', '')}</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Client</span>
                    <span className="font-semibold text-slate-200">{workspaceData.project.client || 'Enterprise'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Manager</span>
                    <span className="font-semibold text-slate-200">{workspaceData.project.project_manager || 'Sarah Jenkins'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Timeline</span>
                    <span className="font-semibold text-slate-200">
                      {formatDate(workspaceData.project.start_date)} → {formatDate(workspaceData.project.end_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Calculated Progress</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {workspaceData.calculatedProgress}% Overall
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 pt-2 border-t border-white/10">
                  <strong className="text-white">Requirements: </strong>
                  {workspaceData.project.project_requirement || 'Full architectural design and delivery.'}
                </p>
              </div>

              {/* Progress Formula Breakdown */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                  <span>Dynamic Overall Project Progress:</span>
                  <span className="text-base text-blue-700">{workspaceData.calculatedProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${workspaceData.calculatedProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-800 font-mono">
                  Formula: sum(Task_Progress × Task_Weightage) / sum(Total_Weightage)
                </p>
              </div>

              {/* Project Groups & Rosters */}
              {workspaceData.groups && workspaceData.groups.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-purple-600" />
                    <span>Assigned Project Teams &amp; Groups ({workspaceData.groups.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {workspaceData.groups.map((g: any) => (
                      <div key={g.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{g.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {g.memberCount} Members
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                          <Crown size={12} className="text-amber-600 shrink-0" />
                          <span>Team Head: <strong>{g.team_head_name}</strong> ({g.team_head_id})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Tasks List */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-blue-600" />
                  <span>Tasks in Project ({workspaceData.tasks?.length || 0})</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Task</th>
                        <th className="p-2.5">Assignee / Group</th>
                        <th className="p-2.5">Weightage</th>
                        <th className="p-2.5">Progress</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {workspaceData.tasks?.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{t.title}</td>
                          <td className="p-2.5">
                            {t.assignment_type === 'GROUP' ? (
                              <span className="text-purple-700 font-semibold">👥 {t.group_name}</span>
                            ) : (
                              <span className="text-slate-700">{t.assigned_to_name}</span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-blue-600">{t.task_weightage || 25}%</td>
                          <td className="p-2.5 font-bold">{t.progress_percent || 0}%</td>
                          <td className="p-2.5">{renderStatusBadge(t.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Project record not found.
            </div>
          )}
        </Modal>
      )}

      {/* ================= GROUP DETAILS MODAL ================= */}
      {selectedGroupModal && (
        <Modal
          isOpen={Boolean(selectedGroupModal)}
          onClose={() => setSelectedGroupModal(null)}
          title={selectedGroupModal.name || 'Team Details'}
          maxWidth="max-w-3xl"
        >
          {isLoadingGroupModal ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Loading team details and responsibilities...</p>
            </div>
          ) : (
            <div className="space-y-5 text-xs max-h-[80vh] overflow-y-auto pr-1">
              {/* Top Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold">
                      {selectedGroupModal.project_code || 'PROJECT'}
                    </span>
                    <span className="text-slate-300 text-xs">
                      {selectedGroupModal.project_name || 'Enterprise Project'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white font-bold text-xs">
                    👥 {selectedGroupModal.members?.length || 0} Members
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedGroupModal.name}</h3>
                {selectedGroupModal.description && (
                  <p className="text-xs text-slate-300 border-t border-white/10 pt-2">
                    {selectedGroupModal.description}
                  </p>
                )}
              </div>

              {/* Designated Lead Card */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    <Crown size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Designated Team Lead &amp; Approver
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {selectedGroupModal.team_head_name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500">
                      {selectedGroupModal.team_head_id}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Lead Reviewer
                </span>
              </div>

              {/* Members & Roles ("Everu vunnaru, evru emi chestharu") */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-purple-600" />
                  <span>Team Members &amp; Roles ({selectedGroupModal.members?.length || 0})</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Employee</th>
                        <th className="p-2.5">HRMS Designation</th>
                        <th className="p-2.5">Department</th>
                        <th className="p-2.5">Role / Responsibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedGroupModal.members || []).map((m: any) => {
                        const isLead = m.isTeamHead || m.role === 'Team Head' || m.employeeId === selectedGroupModal.team_head_id;
                        return (
                          <tr key={m.employeeId || m.id} className={isLead ? 'bg-amber-50/40 font-medium' : 'hover:bg-slate-50/50'}>
                            <td className="p-2.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${
                                  isLead ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {(m.name || m.employeeName || 'E').charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{m.name || m.employeeName}</span>
                                  <span className="font-mono text-[10px] text-slate-400">{m.employeeId}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-2.5 text-slate-700">{m.designation || 'Specialist'}</td>
                            <td className="p-2.5 text-slate-600">{m.department || 'Engineering'}</td>
                            <td className="p-2.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isLead
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                {isLead && <Crown size={9} />}
                                <span>{m.role || (isLead ? 'Team Head' : 'Member')}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tasks / Modules assigned to group ("aa module ani") */}
              {selectedGroupModal.tasks && selectedGroupModal.tasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList size={14} className="text-blue-600" />
                    <span>Modules &amp; Tasks Assigned ({selectedGroupModal.tasks.length})</span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Task</th>
                          <th className="p-2.5">Target Module</th>
                          <th className="p-2.5">Deliverable</th>
                          <th className="p-2.5">Weight</th>
                          <th className="p-2.5">Progress</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedGroupModal.tasks.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-900">{t.title}</td>
                            <td className="p-2.5 text-blue-700 font-semibold">{t.module_name || 'Core Module'}</td>
                            <td className="p-2.5 text-slate-600">{t.deliverable_type || 'Code Implementation'}</td>
                            <td className="p-2.5 font-bold text-blue-600">{t.task_weightage || 25}%</td>
                            <td className="p-2.5 font-bold">{t.progress_percent || 0}%</td>
                            <td className="p-2.5">{renderStatusBadge(t.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
