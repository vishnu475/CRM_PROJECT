import React, { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  Briefcase,
  FolderGit2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  ChevronRight,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Mail,
  UserCheck,
  Percent,
  Calendar,
  Code2,
  TrendingUp,
  Edit3,
  Sliders,
  Award,
  Activity,
  Check
} from 'lucide-react';
import { ProjectGroup, TaskItem } from '../types';
import { taskApiService } from '../services/taskService';
import { Modal } from '../../../components/common/Modal';

interface TeamsGroupsViewProps {
  onAssignTask?: (group?: ProjectGroup) => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const TeamsGroupsView: React.FC<TeamsGroupsViewProps> = ({
  onAssignTask,
  onSelectTask
}) => {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');

  // Detail Modal State
  const [selectedGroupModal, setSelectedGroupModal] = useState<ProjectGroup | null>(null);
  const [isLoadingGroupDetails, setIsLoadingGroupDetails] = useState<boolean>(false);
  const [groupDetailsData, setGroupDetailsData] = useState<any | null>(null);
  const [groupMembersModules, setGroupMembersModules] = useState<Record<string, any[]>>({});

  // Progress Report Modal State
  const [progressModalOpen, setProgressModalOpen] = useState<boolean>(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<any | null>(null);
  const [reportProgressPercent, setReportProgressPercent] = useState<number>(0);
  const [reportStatus, setReportStatus] = useState<string>('IN_PROGRESS');
  const [reportEmployeeId, setReportEmployeeId] = useState<string>('');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [isSavingProgress, setIsSavingProgress] = useState<boolean>(false);
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null);
  const [progressSaveSuccess, setProgressSaveSuccess] = useState<string | null>(null);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const data = await taskApiService.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to load project groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenGroupDetail = async (group: ProjectGroup) => {
    setSelectedGroupModal(group);
    setIsLoadingGroupDetails(true);
    setGroupDetailsData(null);
    setGroupMembersModules({});
    try {
      const [full, modMap] = await Promise.all([
        taskApiService.getGroupById(group.id),
        taskApiService.getGroupModules(group.id).catch(() => ({}))
      ]);
      setGroupDetailsData(full);
      setGroupMembersModules(modMap || {});
    } catch (err) {
      console.error('Failed to fetch single group detail:', err);
      // Fallback to existing group data
      setGroupDetailsData(group);
    } finally {
      setIsLoadingGroupDetails(false);
    }
  };

  // Distinct projects for filtering
  const distinctProjects = React.useMemo(() => {
    const s = new Set<string>();
    groups.forEach(g => {
      const p = g.project_name || g.project_id;
      if (p) s.add(p);
    });
    return Array.from(s).sort();
  }, [groups]);

  // Filter groups
  const filteredGroups = React.useMemo(() => {
    return groups.filter(g => {
      if (selectedProjectFilter !== 'ALL') {
        const p = g.project_name || g.project_id;
        if (p !== selectedProjectFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchHead = (g.team_head_name || '').toLowerCase().includes(q);
        const matchProj = (g.project_name || '').toLowerCase().includes(q);
        const matchMembers = (g.members || []).some(m =>
          (m.name || m.employeeName || '').toLowerCase().includes(q) ||
          (m.designation || '').toLowerCase().includes(q) ||
          (m.role || '').toLowerCase().includes(q)
        );
        return matchName || matchHead || matchProj || matchMembers;
      }
      return true;
    });
  }, [groups, selectedProjectFilter, searchQuery]);

  // 1. Team Overall Progress Summary ("team overr teem")
  const teamProgressSummary = React.useMemo(() => {
    const tasks: any[] = groupDetailsData?.tasks || [];
    if (!tasks.length) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        reviewTasks: 0,
        totalWeightage: 0,
        completedWeightage: 0,
        overallPercent: 0,
        health: 'PENDING_START'
      };
    }

    let completedTasks = 0;
    let inProgressTasks = 0;
    let reviewTasks = 0;
    let totalWeightage = 0;
    let completedWeightage = 0;

    tasks.forEach(t => {
      const weight = Number(t.task_weightage) || 20;
      const progress = Number(t.progress_percent) || 0;
      totalWeightage += weight;

      if (t.status === 'COMPLETED' || progress === 100) {
        completedTasks++;
        completedWeightage += weight;
      } else if (t.status === 'READY_FOR_REVIEW' || t.status === 'SUBMITTED') {
        reviewTasks++;
        completedWeightage += weight * (progress / 100);
      } else {
        inProgressTasks++;
        completedWeightage += weight * (progress / 100);
      }
    });

    const overallPercent = totalWeightage > 0 
      ? Math.min(100, Math.round((completedWeightage / totalWeightage) * 100))
      : Math.round(tasks.reduce((sum, t) => sum + (Number(t.progress_percent) || 0), 0) / tasks.length);

    let health = 'IN_PROGRESS';
    if (overallPercent === 100 || (tasks.length > 0 && completedTasks === tasks.length)) health = 'COMPLETED';
    else if (overallPercent >= 50) health = 'ON_TRACK';
    else if (overallPercent > 0) health = 'IN_PROGRESS';
    else health = 'NEEDS_ATTENTION';

    return {
      totalTasks: tasks.length,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      totalWeightage: Math.round(totalWeightage),
      completedWeightage: Math.round(completedWeightage),
      overallPercent,
      health
    };
  }, [groupDetailsData?.tasks]);

  // 2. Individual Employee Progress Breakdown ("what ever employ how much has done her progress")
  const membersProgressMap = React.useMemo(() => {
    const members: any[] = groupDetailsData?.members || [];
    const tasks: any[] = groupDetailsData?.tasks || [];
    const map: Record<string, {
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      averageProgress: number;
      assignedTasks: any[];
      status: string;
    }> = {};

    members.forEach((m, idx) => {
      const empId = m.employeeId || m.id;
      // An employee owns this task if it is directly assigned to them,
      // or if the task has an orphaned/foreign assignee, default to Team Head / first member
      const assigned = tasks.filter(t => {
        const isDirect = t.assigned_to === empId || t.assigned_to_employee_id === empId;
        if (isDirect) return true;

        const assignedToOtherMember = members.some(other => {
          const oId = other.employeeId || other.id;
          return oId !== empId && (t.assigned_to === oId || t.assigned_to_employee_id === oId);
        });
        if (assignedToOtherMember) return false;

        // If not assigned to any current team member, default to team head or first member
        const isLead = m.isTeamHead || m.role === 'Team Head' || empId === groupDetailsData?.team_head_id || idx === 0;
        return isLead;
      });

      const totalTasks = assigned.length;
      let completedTasks = 0;
      let progressSum = 0;

      assigned.forEach(t => {
        const p = Number(t.progress_percent) || 0;
        const s = t.status;
        if (s === 'COMPLETED' || p === 100) {
          completedTasks++;
        }
        progressSum += p;
      });

      const avgProgress = totalTasks > 0 ? Math.round(progressSum / totalTasks) : 0;
      let status = 'No Tasks';
      if (totalTasks > 0) {
        if (completedTasks === totalTasks) status = 'Completed';
        else if (avgProgress > 0) status = 'In Progress';
        else status = 'Pending';
      }

      map[empId] = {
        totalTasks,
        completedTasks,
        inProgressTasks: totalTasks - completedTasks,
        averageProgress: avgProgress,
        assignedTasks: assigned,
        status
      };
    });

    return map;
  }, [groupDetailsData?.members, groupDetailsData?.tasks, groupDetailsData?.team_head_id]);

  // Handlers for Progress Report & Assign
  const handleOpenProgressModal = (task: any) => {
    setSelectedTaskForProgress(task);
    setReportProgressPercent(Number(task.progress_percent) || 0);
    setReportStatus(task.status || 'IN_PROGRESS');
    const defaultEmp = task.assigned_to || (groupDetailsData?.members?.[0]?.employeeId) || '';
    setReportEmployeeId(defaultEmp);
    setReportNotes(task.completion_note || '');
    setProgressSaveError(null);
    setProgressSaveSuccess(null);
    setProgressModalOpen(true);
  };

  const handleSaveProgressReport = async () => {
    if (!selectedTaskForProgress) return;
    setIsSavingProgress(true);
    setProgressSaveError(null);
    try {
      await taskApiService.updateProgress(selectedTaskForProgress.id, {
        progressPercent: Number(reportProgressPercent),
        status: reportStatus,
        progressNote: reportNotes,
        targetEmployeeId: reportEmployeeId,
        assignedTo: reportEmployeeId
      });

      setProgressSaveSuccess('Progress report updated and assigned successfully!');

      if (selectedGroupModal) {
        const [full, modMap] = await Promise.all([
          taskApiService.getGroupById(selectedGroupModal.id),
          taskApiService.getGroupModules(selectedGroupModal.id).catch(() => ({}))
        ]);
        setGroupDetailsData(full);
        setGroupMembersModules(modMap || {});
        fetchGroups();
      }

      setTimeout(() => {
        setProgressModalOpen(false);
        setProgressSaveSuccess(null);
      }, 700);
    } catch (err: any) {
      console.error('Failed to update progress report:', err);
      setProgressSaveError(err.message || 'Failed to save progress report');
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleInlineReassign = async (taskId: string, newAssigneeId: string) => {
    try {
      const task = groupDetailsData?.tasks?.find((t: any) => t.id === taskId);
      await taskApiService.updateProgress(taskId, {
        progressPercent: task?.progress_percent || 0,
        targetEmployeeId: newAssigneeId,
        assignedTo: newAssigneeId
      });
      if (selectedGroupModal) {
        const full = await taskApiService.getGroupById(selectedGroupModal.id);
        setGroupDetailsData(full);
        fetchGroups();
      }
    } catch (err) {
      console.error('Failed to reassign deliverable:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Project Teams &amp; Work Groups</h1>
              <p className="text-xs text-slate-500">
                View all project delivery groups, designated team heads, active members, assigned modules &amp; deliverables
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchGroups}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Refresh Teams"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {onAssignTask && (
            <button
              type="button"
              onClick={() => onAssignTask()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Briefcase size={14} />
              <span>Assign Task to Group</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams, members, designations, or roles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          <select
            value={selectedProjectFilter}
            onChange={e => setSelectedProjectFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">All Master Projects ({groups.length} Groups)</option>
            {distinctProjects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading project teams and members from database...</p>
        </div>
      )}

      {/* Groups Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(group => {
            const memberList = group.members || [];
            const leadMember = memberList.find(m => m.isTeamHead || m.employeeId === group.team_head_id);

            return (
              <div
                key={group.id}
                onClick={() => handleOpenGroupDetail(group)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition duration-200 cursor-pointer flex flex-col justify-between group space-y-4"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/80">
                      <FolderGit2 size={12} />
                      <span className="truncate max-w-[170px]">{group.project_name || group.project_id}</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {memberList.length} Members
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition">
                    {group.name}
                  </h3>

                  {group.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>

                {/* Team Lead Badge */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                      {(group.team_head_name || 'L').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <Crown size={11} className="text-amber-600 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Designated Lead</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {group.team_head_name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {group.team_head_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overall Team Progress Bar */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <TrendingUp size={12} className="text-purple-600" />
                      <span>Overall Progress:</span>
                    </span>
                    <span className="font-bold text-purple-700">
                      {group.overall_progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, group.overall_progress || 0))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                    <span>{group.completed_count || 0} of {group.task_count || 0} deliverables done</span>
                    <span>{group.task_count ? `${Math.round(((group.completed_count || 0) / group.task_count) * 100)}% velocity` : 'Ready'}</span>
                  </div>
                </div>

                {/* Members Avatars & Roster Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Team Roster:</span>
                    <span className="text-purple-600 font-bold group-hover:underline flex items-center gap-1">
                      View Details <ChevronRight size={12} />
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {memberList.slice(0, 4).map(m => (
                      <div
                        key={m.employeeId || m.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-xs border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {(m.name || m.employeeName || 'E').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 text-[11px] block truncate">
                              {m.name || m.employeeName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {m.employeeId}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          m.isTeamHead || m.role === 'Team Head'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.role || 'Member'}
                        </span>
                      </div>
                    ))}

                    {memberList.length > 4 && (
                      <p className="text-[10px] text-center font-bold text-slate-400 py-1">
                        + {memberList.length - 4} more team members
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Users size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No project groups found matching criteria</p>
              <p className="text-xs text-slate-400">Try adjusting your project filter or search keywords</p>
            </div>
          )}
        </div>
      )}

      {/* ================= GROUP DETAILS MODAL ================= */}
      {selectedGroupModal && (
        <Modal
          isOpen={Boolean(selectedGroupModal)}
          onClose={() => setSelectedGroupModal(null)}
          title={selectedGroupModal.name}
          maxWidth="max-w-4xl"
        >
          {isLoadingGroupDetails ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Loading group details and active tasks...</p>
            </div>
          ) : (
            <div className="space-y-6 text-xs max-h-[82vh] overflow-y-auto pr-1">
              {/* Top Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-4 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold">
                        {groupDetailsData?.project_code || 'PROJECT'}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {groupDetailsData?.project_name || selectedGroupModal.project_name || 'Enterprise Project'}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {groupDetailsData?.name || selectedGroupModal.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold text-xs border border-white/10">
                      👥 {groupDetailsData?.members?.length || selectedGroupModal.members?.length || 0} Members
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-purple-500 text-white font-bold text-xs shadow-xs">
                      📋 {groupDetailsData?.tasks?.length || 0} Tasks Assigned
                    </span>
                  </div>
                </div>

                {groupDetailsData?.description && (
                  <p className="text-xs text-slate-300 border-t border-white/10 pt-3">
                    {groupDetailsData.description}
                  </p>
                )}
              </div>

              {/* ================= OVERALL TEAM PROGRESS REPORT ("team overr teem") ================= */}
              <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Overall Team Progress Report</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          teamProgressSummary.health === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : teamProgressSummary.health === 'ON_TRACK'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {teamProgressSummary.health === 'COMPLETED' ? '✅ FULLY DELIVERED' : teamProgressSummary.health === 'ON_TRACK' ? '⚡ ON TRACK' : '🔄 IN PROGRESS'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Cumulative delivery completion weighted across all assigned group modules and deliverables
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Overall Completion</span>
                      <span className="text-2xl font-black text-purple-700">{teamProgressSummary.overallPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Overall Animated Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Weighted Deliverables Execution:</span>
                    <span className="text-purple-700 font-bold">{teamProgressSummary.completedWeightage}% of {teamProgressSummary.totalWeightage || 100}% Total Weightage</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${teamProgressSummary.overallPercent}%` }}
                    />
                  </div>
                </div>

                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Deliverables</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-slate-900">{teamProgressSummary.totalTasks}</span>
                      <span className="text-[10px] text-slate-500">Assigned</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Completed</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-emerald-800">{teamProgressSummary.completedTasks}</span>
                      <span className="text-[10px] text-emerald-600">
                        ({teamProgressSummary.totalTasks > 0 ? Math.round((teamProgressSummary.completedTasks / teamProgressSummary.totalTasks) * 100) : 0}%)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block mb-0.5">In Progress</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-blue-800">{teamProgressSummary.inProgressTasks}</span>
                      <span className="text-[10px] text-blue-600">Active Work</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block mb-0.5">Weightage Achieved</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-purple-900">{teamProgressSummary.completedWeightage}%</span>
                      <span className="text-[10px] text-purple-600">of {teamProgressSummary.totalWeightage || 100}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Designated Team Lead Card */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    <Crown size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Designated Team Lead &amp; Approver
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {groupDetailsData?.team_head_name || selectedGroupModal.team_head_name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500">
                      {groupDetailsData?.team_head_id || selectedGroupModal.team_head_id}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                    Lead Reviewer
                  </span>
                </div>
              </div>

              {/* Roster & Role Mapping: Who does what ("everu vunnaru evru emi chestharu") */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={15} className="text-purple-600" />
                    <span>Team Roster &amp; Employee Progress Breakdown ({groupDetailsData?.members?.length || 0} Members)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Strictly Active HRMS Personnel
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Employee</th>
                        <th className="p-3">HRMS Designation</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Team Role</th>
                        <th className="p-3">Assigned Modules</th>
                        <th className="p-3">Deliverables Progress ("How Much Done")</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(groupDetailsData?.members || []).map((m: any) => {
                        const isLead = m.isTeamHead || m.role === 'Team Head' || m.employeeId === groupDetailsData?.team_head_id;
                        const memberMods = groupMembersModules[m.employeeId] || [];
                        const prog = membersProgressMap[m.employeeId || m.id] || { totalTasks: 0, completedTasks: 0, averageProgress: 0, status: 'Unassigned' };

                        return (
                          <tr key={m.employeeId || m.id} className={isLead ? 'bg-amber-50/40 font-medium' : 'hover:bg-slate-50/60'}>
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                  isLead ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {(m.name || m.employeeName || 'E').charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {m.name || m.employeeName}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400 block">
                                    {m.employeeId}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3 text-slate-700 font-medium">
                              {m.designation || 'Specialist'}
                            </td>

                            <td className="p-3 text-slate-600">
                              {m.department || 'Engineering'}
                            </td>

                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isLead
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                {isLead && <Crown size={10} />}
                                <span>{m.role || (isLead ? 'Team Head' : 'Member')}</span>
                              </span>
                            </td>

                            <td className="p-3">
                              {memberMods.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {memberMods.map((mod: any) => (
                                    <span
                                      key={mod.id || mod.name}
                                      className="inline-flex items-center text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-1.5 py-0.5 rounded"
                                    >
                                      {mod.name || mod.module_name}
                                    </span>
                                  ))}
                                </div>
                              ) : m.assigned_modules ? (
                                <span className="inline-flex items-center text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-lg">
                                  {m.assigned_modules}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No modules assigned</span>
                              )}
                            </td>

                            <td className="p-3">
                              {prog.totalTasks > 0 ? (
                                <div
                                  className="space-y-1 min-w-[130px] cursor-pointer group/cell hover:bg-purple-50/50 p-1.5 rounded-lg transition"
                                  onClick={() => prog.assignedTasks[0] && handleOpenProgressModal(prog.assignedTasks[0])}
                                  title="Click to view or update employee deliverable progress report"
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-900 group-hover/cell:text-purple-600 flex items-center gap-1">
                                      {prog.averageProgress}%
                                      <Edit3 size={10} className="text-slate-400 group-hover/cell:text-purple-600" />
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500">{prog.completedTasks}/{prog.totalTasks} Done</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        prog.averageProgress === 100 ? 'bg-emerald-500' : 'bg-purple-600'
                                      }`}
                                      style={{ width: `${prog.averageProgress}%` }}
                                    />
                                  </div>
                                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                    prog.averageProgress === 100
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-50 text-blue-700'
                                  }`}>
                                    {prog.status}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No tasks assigned</span>
                              )}
                            </td>

                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ================= ASSIGN / UPDATE PROGRESS REPORT MODAL ================= */}
      {progressModalOpen && selectedTaskForProgress && (
        <Modal
          isOpen={progressModalOpen}
          onClose={() => setProgressModalOpen(false)}
          title="Assign & Update Progress Report"
          maxWidth="max-w-xl"
        >
          <div className="space-y-5 text-xs">
            {/* Deliverable Info Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-950 text-white space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 font-bold text-[10px] border border-purple-400/20">
                  {selectedTaskForProgress.module_name || 'Core Module'}
                </span>
                <span className="font-mono text-[10px] text-purple-300 font-bold">
                  Weightage: {selectedTaskForProgress.task_weightage || 25}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {selectedTaskForProgress.title}
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                ID: {selectedTaskForProgress.id}
              </p>
            </div>

            {progressSaveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{progressSaveSuccess}</span>
              </div>
            )}

            {progressSaveError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600" />
                <span>{progressSaveError}</span>
              </div>
            )}

            {/* Field 1: Assigned Employee */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Assigned Employee ("Who Did The Progress"):
              </label>
              <select
                value={reportEmployeeId}
                onChange={(e) => setReportEmployeeId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                {(groupDetailsData?.members || []).map((m: any) => (
                  <option key={m.employeeId || m.id} value={m.employeeId || m.id}>
                    {m.name || m.employeeName} ({m.employeeId}) • {m.role || 'Member'} • {m.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Progress Percentage & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Work Progress Percentage:
                </label>
                <div className="flex items-center gap-1 font-bold text-sm text-purple-700">
                  <span>{reportProgressPercent}%</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={reportProgressPercent}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setReportProgressPercent(val);
                  if (val === 100) setReportStatus('COMPLETED');
                  else if (val > 0 && reportStatus === 'COMPLETED') setReportStatus('IN_PROGRESS');
                }}
                className="w-full accent-purple-600 cursor-pointer"
              />

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: '25% (Started)', val: 25, status: 'IN_PROGRESS' },
                  { label: '50% (Halfway)', val: 50, status: 'IN_PROGRESS' },
                  { label: '75% (Refining)', val: 75, status: 'IN_PROGRESS' },
                  { label: '100% (Done)', val: 100, status: 'COMPLETED' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => {
                      setReportProgressPercent(preset.val);
                      setReportStatus(preset.status);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      reportProgressPercent === preset.val
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Deliverable Status */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Deliverable Status:
              </label>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                <option value="IN_PROGRESS">IN_PROGRESS — Active work in progress</option>
                <option value="READY_FOR_REVIEW">READY_FOR_REVIEW — Work done, awaiting reviewer approval</option>
                <option value="COMPLETED">COMPLETED — Signed off &amp; fully verified</option>
                <option value="BLOCKED">BLOCKED — Impediment or awaiting dependency</option>
              </select>
            </div>

            {/* Field 4: Progress Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Progress Work Report / Completion Notes:
              </label>
              <textarea
                rows={3}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Briefly describe what was accomplished or milestones reached..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProgressModalOpen(false)}
                disabled={isSavingProgress}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProgressReport}
                disabled={isSavingProgress}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                {isSavingProgress ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Report...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Save Progress Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
