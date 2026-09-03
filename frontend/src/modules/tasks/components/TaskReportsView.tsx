import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Download,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  PieChart as PieChartIcon,
  Layers,
  ChevronDown,
  Eye,
  Plus,
  BarChart3,
  CheckSquare,
  Search,
  UserCheck,
  User,
  Sparkles,
  Zap,
  Activity,
  FolderKanban,
  Target,
  Flame,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Database
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { TaskItem, TaskAnalytics } from '../types';

interface TaskReportsViewProps {
  tasks?: TaskItem[];
  analytics?: TaskAnalytics | null;
  onViewAllOverdue?: () => void;
  onSelectTask?: (task: TaskItem) => void;
  onAssignTask?: () => void;
}

export const TaskReportsView: React.FC<TaskReportsViewProps> = ({
  tasks = [],
  analytics,
  onViewAllOverdue,
  onSelectTask,
  onAssignTask
}) => {
  const { employees = [], projects = [] } = useApp();

  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [selectedProgressTier, setSelectedProgressTier] = useState<'ALL' | '100' | '75_99' | '50_74' | '25_49' | '0_24'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeTaskList = tasks;

  // Filter tasks based on all active criteria
  const filteredTasks = useMemo(() => {
    return activeTaskList.filter(t => {
      // Assignee Filter
      if (selectedAssigneeFilter !== 'ALL') {
        const assignedMatch =
          (t.assigned_to && t.assigned_to.toLowerCase() === selectedAssigneeFilter.toLowerCase()) ||
          (t.assigned_to_name && t.assigned_to_name.toLowerCase() === selectedAssigneeFilter.toLowerCase()) ||
          (t.employee_name && t.employee_name.toLowerCase() === selectedAssigneeFilter.toLowerCase());
        if (!assignedMatch) return false;
      }

      // Department Filter
      if (selectedDeptFilter !== 'ALL' && t.department?.toLowerCase() !== selectedDeptFilter.toLowerCase() && t.department_name?.toLowerCase() !== selectedDeptFilter.toLowerCase()) {
        return false;
      }

      // Project Filter
      if (selectedProjectFilter !== 'ALL' && t.project_name !== selectedProjectFilter) {
        return false;
      }

      // Priority Filter
      if (selectedPriorityFilter !== 'ALL' && t.priority?.toUpperCase() !== selectedPriorityFilter.toUpperCase()) {
        return false;
      }

      const progress = Number(t.progress_percent) || (t.status === 'COMPLETED' ? 100 : 0);

      // Progress Tier Filter
      if (selectedProgressTier === '100' && progress < 100) return false;
      if (selectedProgressTier === '75_99' && (progress < 75 || progress >= 100)) return false;
      if (selectedProgressTier === '50_74' && (progress < 50 || progress >= 75)) return false;
      if (selectedProgressTier === '25_49' && (progress < 25 || progress >= 50)) return false;
      if (selectedProgressTier === '0_24' && progress >= 25) return false;

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (t.title || '').toLowerCase().includes(q);
        const matchesAssignee = (t.assigned_to_name || t.assigned_to || t.employee_name || '').toLowerCase().includes(q);
        const matchesProject = (t.project_name || '').toLowerCase().includes(q);
        const matchesDept = (t.department || t.department_name || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesAssignee && !matchesProject && !matchesDept) return false;
      }

      return true;
    });
  }, [activeTaskList, selectedAssigneeFilter, selectedDeptFilter, selectedProjectFilter, selectedPriorityFilter, selectedProgressTier, searchQuery]);

  // Selected Assignee detailed profile statistics
  const selectedAssigneeStats = useMemo(() => {
    if (selectedAssigneeFilter === 'ALL') return null;

    const assigneeTasks = activeTaskList.filter(t => {
      return (
        (t.assigned_to && t.assigned_to.toLowerCase() === selectedAssigneeFilter.toLowerCase()) ||
        (t.assigned_to_name && t.assigned_to_name.toLowerCase() === selectedAssigneeFilter.toLowerCase()) ||
        (t.employee_name && t.employee_name.toLowerCase() === selectedAssigneeFilter.toLowerCase())
      );
    });

    const empObj = employees.find(
      e => (e.empCode && e.empCode.toLowerCase() === selectedAssigneeFilter.toLowerCase()) ||
           (e.id && e.id.toLowerCase() === selectedAssigneeFilter.toLowerCase()) ||
           (e.name && e.name.toLowerCase() === selectedAssigneeFilter.toLowerCase())
    );

    const total = assigneeTasks.length;
    let sumProgress = 0;
    let totalEst = 0;
    let totalAct = 0;
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;

    assigneeTasks.forEach(t => {
      const p = Number(t.progress_percent) || (t.status === 'COMPLETED' ? 100 : 0);
      sumProgress += p;
      totalEst += Number(t.estimated_hours) || 8;
      totalAct += Number(t.actual_hours) || (p > 0 ? ((Number(t.estimated_hours) || 8) * p) / 100 : 0);
      if (t.status === 'COMPLETED' || p === 100) completed++;
      else if (t.status === 'IN_PROGRESS' || p > 0) inProgress++;
      if (t.is_overdue) overdue++;
    });

    const avgPortion = total > 0 ? (sumProgress / total).toFixed(1) : '0.0';

    return {
      name: empObj?.name || selectedAssigneeFilter,
      designation: empObj?.designation || 'Specialist',
      department: empObj?.department || assigneeTasks[0]?.department || assigneeTasks[0]?.department_name || 'Engineering',
      empCode: empObj?.empCode || empObj?.id || selectedAssigneeFilter,
      avatar: (empObj as any)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(empObj?.name || selectedAssigneeFilter)}&background=3b82f6&color=fff`,
      total,
      completed,
      inProgress,
      overdue,
      avgPortion,
      totalEst: totalEst.toFixed(1),
      totalAct: totalAct.toFixed(1)
    };
  }, [selectedAssigneeFilter, activeTaskList, employees]);

  // Progress Tier Counts for Quick Filter Pills
  const tierCounts = useMemo(() => {
    let count100 = 0;
    let count75_99 = 0;
    let count50_74 = 0;
    let count25_49 = 0;
    let count0_24 = 0;

    activeTaskList.forEach(t => {
      const p = Number(t.progress_percent) || (t.status === 'COMPLETED' ? 100 : 0);
      if (p === 100) count100++;
      else if (p >= 75) count75_99++;
      else if (p >= 50) count50_74++;
      else if (p >= 25) count25_49++;
      else count0_24++;
    });

    return {
      all: activeTaskList.length,
      count100,
      count75_99,
      count50_74,
      count25_49,
      count0_24
    };
  }, [activeTaskList]);

  // Dynamic Portion & Work Completion Metrics
  const workPortionMetrics = useMemo(() => {
    const total = filteredTasks.length;
    let sumProgress = 0;
    let totalEstHours = 0;
    let totalActHours = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let urgentCount = 0;

    filteredTasks.forEach(t => {
      const p = Number(t.progress_percent) || (t.status === 'COMPLETED' ? 100 : 0);
      sumProgress += p;
      totalEstHours += Number(t.estimated_hours) || 8;
      totalActHours += Number(t.actual_hours) || (p > 0 ? ((Number(t.estimated_hours) || 8) * p) / 100 : 0);
      if (p === 100 || t.status === 'COMPLETED') completedCount++;
      else if (p > 0 || t.status === 'IN_PROGRESS') inProgressCount++;
      if (t.priority === 'URGENT' || t.priority === 'HIGH') urgentCount++;
    });

    const avgPortionCompleted = total > 0 ? (sumProgress / total).toFixed(1) : '0.0';
    const hoursExecutionPercent = totalEstHours > 0 ? ((totalActHours / totalEstHours) * 100).toFixed(1) : '0.0';

    return {
      total,
      completedCount,
      inProgressCount,
      urgentCount,
      avgPortionCompleted,
      totalEstHours: totalEstHours.toFixed(1),
      totalActHours: totalActHours.toFixed(1),
      hoursExecutionPercent
    };
  }, [filteredTasks]);

  const hasActiveFilters =
    selectedAssigneeFilter !== 'ALL' ||
    selectedDeptFilter !== 'ALL' ||
    selectedProjectFilter !== 'ALL' ||
    selectedPriorityFilter !== 'ALL' ||
    selectedProgressTier !== 'ALL' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedAssigneeFilter('ALL');
    setSelectedDeptFilter('ALL');
    setSelectedProjectFilter('ALL');
    setSelectedPriorityFilter('ALL');
    setSelectedProgressTier('ALL');
    setSearchQuery('');
  };

  // Export report to CSV
  const handleExportReport = () => {
    const headers = ['Task ID', 'Title', 'Project', 'Assigned To', 'Department', 'Priority', 'Status', 'Portion Completed (%)', 'Estimated Hours', 'Actual Hours', 'Due Date'];
    const rows = filteredTasks.map(t => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.project_name || 'HRMS General').replace(/"/g, '""')}"`,
      `"${(t.assigned_to_name || t.assigned_to || t.employee_name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(t.department || t.department_name || 'Engineering').replace(/"/g, '""')}"`,
      t.priority || 'MEDIUM',
      t.status || 'ASSIGNED',
      `${t.progress_percent || (t.status === 'COMPLETED' ? 100 : 0)}%`,
      t.estimated_hours || 8,
      t.actual_hours || 0,
      t.due_date || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Task_Work_Portion_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16">
      {/* 1. TOP HEADER BAR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Work Portion & Deliverable Progress Report
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl pl-10">
            Real-time tracking of assigned work deliverables, execution percentages, employee workloads, and live database sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium">
            <Database size={13} className="text-blue-600 shrink-0" />
            <span>Database Synced</span>
          </div>

          {onAssignTask && (
            <button
              onClick={onAssignTask}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus size={14} /> Assign Work Order
            </button>
          )}

          <button
            type="button"
            onClick={handleExportReport}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. PROGRESS TIER FILTER PILLS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto select-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0 px-2">
          <Target size={14} className="text-slate-400" />
          <span>Progress Tiers:</span>
        </div>

        {/* Pill: ALL */}
        <button
          onClick={() => setSelectedProgressTier('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            selectedProgressTier === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>All Tasks</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${selectedProgressTier === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tierCounts.all}
          </span>
        </button>

        {/* Pill: 100% Completed */}
        <button
          onClick={() => setSelectedProgressTier('100')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            selectedProgressTier === '100'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>100% Completed</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium ${selectedProgressTier === '100' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tierCounts.count100}
          </span>
        </button>

        {/* Pill: 75-99% Near Done */}
        <button
          onClick={() => setSelectedProgressTier('75_99')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            selectedProgressTier === '75_99'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>75% - 99% Near Done</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium ${selectedProgressTier === '75_99' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tierCounts.count75_99}
          </span>
        </button>

        {/* Pill: 50-74% Halfway */}
        <button
          onClick={() => setSelectedProgressTier('50_74')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            selectedProgressTier === '50_74'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>50% - 74% Halfway</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium ${selectedProgressTier === '50_74' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tierCounts.count50_74}
          </span>
        </button>

        {/* Pill: 25-49% Early Stage */}
        <button
          onClick={() => setSelectedProgressTier('25_49')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            selectedProgressTier === '25_49'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>25% - 49% Early Stage</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium ${selectedProgressTier === '25_49' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tierCounts.count25_49}
          </span>
        </button>

        {/* Pill: 0-24% Just Started */}
        <button
          onClick={() => setSelectedProgressTier('0_24')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
            selectedProgressTier === '0_24'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>0% - 24% Just Started</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium ${selectedProgressTier === '0_24' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tierCounts.count0_24}
          </span>
        </button>
      </div>

      {/* 3. ASSIGNEE SPOTLIGHT (When an employee filter is chosen) */}
      {selectedAssigneeStats ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={selectedAssigneeStats.avatar}
                alt={selectedAssigneeStats.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedAssigneeStats.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold">
                    {selectedAssigneeStats.empCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedAssigneeStats.designation} • <span className="text-slate-700 font-medium">{selectedAssigneeStats.department}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedAssigneeFilter('ALL')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> Reset Assignee Filter
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">Avg Portion Completed</span>
              <div className="text-xl font-bold text-slate-900">{selectedAssigneeStats.avgPortion}%</div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${selectedAssigneeStats.avgPortion}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">Completed Tasks</span>
              <div className="text-xl font-bold text-slate-900">
                {selectedAssigneeStats.completed} <span className="text-xs text-slate-500 font-normal">/ {selectedAssigneeStats.total}</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                {selectedAssigneeStats.total > 0 ? ((selectedAssigneeStats.completed / selectedAssigneeStats.total) * 100).toFixed(0) : 0}% tasks done
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">In Progress Deliverables</span>
              <div className="text-xl font-bold text-slate-900">{selectedAssigneeStats.inProgress}</div>
              <span className="text-[10px] text-blue-700 font-semibold block">Active work orders</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">Hours Executed</span>
              <div className="text-xl font-bold text-slate-900">
                {selectedAssigneeStats.totalAct} <span className="text-xs text-slate-500 font-normal">/ {selectedAssigneeStats.totalEst}h</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block">Logged vs budgeted</span>
            </div>
          </div>
        </div>
      ) : (
        /* 4 CLEAN CORPORATE KPI CARDS (Global Overview) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: AVG PORTION DONE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Portion Done</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{workPortionMetrics.avgPortionCompleted}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across {filteredTasks.length} work orders</div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${workPortionMetrics.avgPortionCompleted}%` }}
              />
            </div>
          </div>

          {/* Card 2: COMPLETED TASKS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{workPortionMetrics.completedCount}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {workPortionMetrics.total > 0 ? ((workPortionMetrics.completedCount / workPortionMetrics.total) * 100).toFixed(1) : '0.0'}% finalized
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${workPortionMetrics.total > 0 ? (workPortionMetrics.completedCount / workPortionMetrics.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Card 3: IN PROGRESS TASKS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress Work</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{workPortionMetrics.inProgressCount}</div>
              <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                {workPortionMetrics.total > 0 ? ((workPortionMetrics.inProgressCount / workPortionMetrics.total) * 100).toFixed(1) : '0.0'}% active
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${workPortionMetrics.total > 0 ? (workPortionMetrics.inProgressCount / workPortionMetrics.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Card 4: HOURS LOGGED */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Logged</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {workPortionMetrics.totalActHours} <span className="text-xs font-normal text-slate-400 font-mono">/ {workPortionMetrics.totalEstHours}h</span>
              </div>
              <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                {workPortionMetrics.hoursExecutionPercent}% of total budgeted
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-slate-700 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(workPortionMetrics.hoursExecutionPercent))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. FILTER TOOLBAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px] flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks, projects, employees..."
                className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Assignee Selector */}
            <div className="relative">
              <select
                value={selectedAssigneeFilter}
                onChange={e => setSelectedAssigneeFilter(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer appearance-none"
              >
                <option value="ALL">👤 All Assigned Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.empCode || emp.id}>
                    {emp.name} ({emp.empCode || emp.id}) — {emp.department || 'Staff'}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Department Selector */}
            <div className="relative">
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="QA">QA</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Project Selector */}
            <div className="relative">
              <select
                value={selectedProjectFilter}
                onChange={e => setSelectedProjectFilter(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="ALL">All Projects</option>
                <option value="ERP Core Suite 2.0">ERP Core Suite 2.0</option>
                <option value="HRMS & Payroll System">HRMS & Payroll System</option>
                <option value="Banking & Financial Ledger">Banking & Financial Ledger</option>
                <option value="Client Delivery Portal">Client Delivery Portal</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Priority Selector */}
            <div className="relative">
              <select
                value={selectedPriorityFilter}
                onChange={e => setSelectedPriorityFilter(e.target.value)}
                className="pl-3 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Results Summary & Clear All */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing <b className="text-slate-800 font-bold">{filteredTasks.length}</b> tasks
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw size={12} /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. MAIN TASK-BY-TASK PORTION COMPLETED BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Task Portion & Deliverable Progress Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live work portion executed per assigned employee and project.</p>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[260px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Task & Project</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 min-w-[220px]">Portion Completed (%)</th>
                <th className="py-3 px-4">Hours (Act / Est)</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.map(task => {
                const progress = Number(task.progress_percent) || (task.status === 'COMPLETED' ? 100 : 0);
                const estHours = Number(task.estimated_hours) || 8;
                const actHours = Number(task.actual_hours) || (progress > 0 ? ((estHours * progress) / 100).toFixed(1) : 0);
                const checklistTotal = Array.isArray(task.checklist) ? task.checklist.length : 0;
                const checklistDone = Array.isArray(task.checklist) ? task.checklist.filter(c => c.completed).length : 0;
                const assigneeName = task.employee_name || task.assigned_to_name || task.assigned_to || 'Assigned Specialist';
                const assigneeCode = task.assigned_to || (task as any).assigned_to_id || 'EMP';
                const assigneeAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(assigneeName)}&background=2563eb&color=fff`;

                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className="hover:bg-slate-50/70 transition cursor-pointer group"
                  >
                    {/* Task Title & Project */}
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {task.id} • {task.project_name || 'General Operations'}
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={assigneeAvatar}
                          alt={assigneeName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">{assigneeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {task.department || task.department_name || 'Engineering'} • {assigneeCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Portion Completed (%) Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`font-semibold ${
                              progress === 100
                                ? 'text-emerald-700'
                                : progress >= 60
                                ? 'text-blue-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {progress}% Completed
                          </span>
                          {checklistTotal > 0 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {checklistDone}/{checklistTotal} Steps Done
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress === 100
                                ? 'bg-emerald-600'
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

                    {/* Hours (Actual / Estimated) */}
                    <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{actHours}h</span> / <span className="text-slate-500">{estHours}h</span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          task.priority === 'URGENT' || task.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : task.priority === 'LOW'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {task.priority || 'MEDIUM'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'SUBMITTED'
                            ? 'bg-purple-100 text-purple-800'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.status || 'ASSIGNED'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectTask && onSelectTask(task)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto transition cursor-pointer"
                      >
                        <Eye size={12} /> View Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* EMPTY FILTER STATE */}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                        <Filter size={18} />
                      </div>
                      <h3 className="text-xs font-semibold text-slate-800">No tasks found matching your filter criteria</h3>
                      <p className="text-[11px] text-slate-400">
                        {selectedProgressTier !== 'ALL'
                          ? `Currently 0 tasks in "${selectedProgressTier === '100' ? '100% Completed' : selectedProgressTier}" tier.`
                          : 'Try adjusting your search or filters.'}
                      </p>
                      <div className="pt-1">
                        <button
                          onClick={handleResetFilters}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <RotateCcw size={12} /> View All Tasks ({tierCounts.all})
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
