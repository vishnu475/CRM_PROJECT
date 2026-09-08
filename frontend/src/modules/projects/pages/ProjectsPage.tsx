import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  Filter,
  Calendar,
  Clock,
  UserCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Eye,
  Plus,
  SlidersHorizontal,
  X,
  FileText,
  Building2,
  CheckSquare
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).split('T')[0];
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(dateStr).split('T')[0];
  }
}

interface ProjectTaskRow {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  title: string;
  description?: string;
  assignedTo: string;
  employeeName: string;
  employeeDesignation?: string;
  department?: string;
  priority: string;
  status: string;
  progressPercent: number;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  isOverdue?: boolean;
}

export const ProjectsPage: React.FC = () => {
  const { employees: contextEmployees = [] } = useApp() || {};

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Selected item for Details Modal
  const [selectedTask, setSelectedTask] = useState<ProjectTaskRow | null>(null);

  // Assign Task Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectName, setTaskProjectName] = useState('ERP Suite Enterprise Rollout');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskStartDate, setTaskStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, empRes] = await Promise.all([
        fetch('/api/tasks').catch(() => null),
        fetch('/api/hrms/employees').catch(() => null)
      ]);

      if (tasksRes) {
        const tasksJson = await tasksRes.json();
        if (tasksJson.success && Array.isArray(tasksJson.data)) {
          setTasks(tasksJson.data);
        }
      }

      if (empRes) {
        const empJson = await empRes.json();
        if (empJson.success && Array.isArray(empJson.data)) {
          setEmployeesList(empJson.data);
        } else if (contextEmployees.length > 0) {
          setEmployeesList(contextEmployees);
        }
      }
    } catch (err) {
      console.warn('Error fetching projects data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Build project task rows strictly from real assigned tasks from backend
  const allProjectTaskRows: ProjectTaskRow[] = useMemo(() => {
    const list: ProjectTaskRow[] = [];

    tasks.forEach((t) => {
      const pName = (t.project_name || t.projectName || 'General Operations').trim();
      const empId = t.assigned_to || t.employee_code || t.employeeId || 'Unassigned';
      const empName = t.employee_name || t.assigned_to_name || t.assignedToName || empId;
      const empDesignation = t.employee_designation || t.designation || 'Staff';
      const empDept = t.department || t.department_name || 'Operations';

      const hash = Math.abs(pName.split('').reduce((acc: number, ch: string) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0));
      const projId = `PRJ-${hash.toString().slice(0, 3)}`;

      const row: ProjectTaskRow = {
        id: t.id,
        projectId: projId,
        projectName: pName,
        client: t.client || t.client_name || (pName.includes('HRMS') ? 'Internal HR' : 'Enterprise Client'),
        title: t.title,
        description: t.description,
        assignedTo: empId,
        employeeName: empName,
        employeeDesignation: empDesignation,
        department: empDept,
        priority: t.priority || 'MEDIUM',
        status: t.status || 'PENDING',
        progressPercent: t.progress_percent ?? (t.status === 'COMPLETED' ? 100 : 0),
        startDate: t.start_date || t.created_at,
        dueDate: t.due_date,
        createdAt: t.created_at,
        isOverdue: t.is_overdue || false
      };

      list.push(row);
    });

    return list;
  }, [tasks]);

  // Unique Projects from assigned tasks
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    allProjectTaskRows.forEach((r) => set.add(r.projectName));
    return Array.from(set);
  }, [allProjectTaskRows]);

  // Unique Employees from assigned tasks or company employee directory
  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, { id: string; name: string; designation?: string }>();
    allProjectTaskRows.forEach((r) => {
      if (r.assignedTo && r.assignedTo !== 'Unassigned' && !map.has(r.assignedTo)) {
        map.set(r.assignedTo, { id: r.assignedTo, name: r.employeeName, designation: r.employeeDesignation });
      }
    });
    employeesList.forEach((e) => {
      const code = e.emp_code || e.id;
      if (code && !map.has(code)) {
        map.set(code, { id: code, name: e.name, designation: e.designation });
      }
    });
    return Array.from(map.values());
  }, [allProjectTaskRows, employeesList]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return allProjectTaskRows.filter((row) => {
      // Search Filter
      const matchesSearch =
        !searchQuery.trim() ||
        row.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.description && row.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Employee Filter (Who Worked On It)
      const matchesEmployee =
        employeeFilter === 'ALL' ||
        row.assignedTo.toLowerCase() === employeeFilter.toLowerCase() ||
        row.employeeName.toLowerCase() === employeeFilter.toLowerCase();

      // Status Filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        row.status.toUpperCase() === statusFilter.toUpperCase();

      // Project Filter
      const matchesProject =
        projectFilter === 'ALL' ||
        row.projectName.toLowerCase() === projectFilter.toLowerCase();

      return matchesSearch && matchesEmployee && matchesStatus && matchesProject;
    });
  }, [allProjectTaskRows, searchQuery, employeeFilter, statusFilter, projectFilter]);

  const handleOpenAssignModal = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskProjectName(uniqueProjects[0] || 'ERP Suite Enterprise Rollout');
    setTaskAssignedTo(uniqueEmployees[0]?.id || 'EMP-006');
    setTaskPriority('MEDIUM');
    setTaskStartDate(new Date().toISOString().split('T')[0]);
    setTaskDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setFeedbackMsg(null);
    setIsAssignModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssignedTo) {
      setFeedbackMsg({ type: 'error', text: 'Please fill in title and assigned employee.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const targetEmp = uniqueEmployees.find((e) => e.id === taskAssignedTo);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim() || `Assigned deliverable under ${taskProjectName}`,
          projectName: taskProjectName,
          assignedTo: taskAssignedTo,
          assignedToName: targetEmp?.name || 'Assigned Staff',
          priority: taskPriority,
          startDate: taskStartDate,
          dueDate: taskDueDate,
          category: 'Project Execution',
          status: 'PENDING'
        })
      });

      const json = await res.json();
      if (json.success) {
        setFeedbackMsg({ type: 'success', text: `Task successfully assigned to ${targetEmp?.name || taskAssignedTo}!` });
        setTimeout(() => {
          setIsAssignModalOpen(false);
          fetchData();
        }, 1000);
      } else {
        setFeedbackMsg({ type: 'error', text: json.message || 'Failed to assign task' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error assigning task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <FolderKanban className="text-[#2563eb]" size={22} />
            Projects & Task Delivery List
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full data list of assigned project deliverables, start & due dates, and employees who worked on them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAssignModal}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            Assign Task
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project, task, client, employee name or ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Assigned Employee (Who worked on it) */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-lg">
              <UserCheck size={13} className="text-purple-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-600">Employee:</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-900 py-0.5 px-1.5 rounded focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Employees ({uniqueEmployees.length})</option>
                {uniqueEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Project */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-lg">
              <FolderKanban size={13} className="text-blue-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-600">Project:</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-900 py-0.5 px-1.5 rounded focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="ALL">All Projects ({uniqueProjects.length})</option>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 border border-slate-200 rounded-lg">
              <Filter size={13} className="text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-900 py-0.5 px-1.5 rounded focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {(searchQuery || employeeFilter !== 'ALL' || statusFilter !== 'ALL' || projectFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setEmployeeFilter('ALL');
                  setStatusFilter('ALL');
                  setProjectFilter('ALL');
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-blue-600" />
            Project Deliverables & Assignments ({filteredRows.length} Items)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Click any row or "View" button to see complete assignment details
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500">Loading project data and employee assignments...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">No project tasks found matching the criteria</p>
            <p className="text-xs text-slate-400">Try clearing your filters or selecting "All Employees".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Project Name</th>
                  <th className="py-2.5 px-3.5">Task / Deliverable</th>
                  <th className="py-2.5 px-3.5">Assigned Employee (Who Worked)</th>
                  <th className="py-2.5 px-3.5">Start Date</th>
                  <th className="py-2.5 px-3.5">Due Date</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5">Priority</th>
                  <th className="py-2.5 px-3.5">Progress</th>
                  <th className="py-2.5 px-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedTask(row)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    {/* Project */}
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-slate-900">{row.projectName}</p>
                      <p className="text-[10px] text-slate-500">{row.client}</p>
                    </td>

                    {/* Task Title */}
                    <td className="py-3 px-3.5 max-w-[220px]">
                      <p className="font-semibold text-slate-800 truncate" title={row.title}>
                        {row.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{row.id}</p>
                    </td>

                    {/* Assigned Employee */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-purple-200">
                          {row.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{row.employeeName}</p>
                          <p className="text-[10px] text-purple-700 font-mono font-bold">
                            {row.assignedTo} {row.employeeDesignation ? `• ${row.employeeDesignation}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Start Date */}
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                      {formatDate(row.startDate)}
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-3.5">
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          row.isOverdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-slate-700'
                        }`}
                      >
                        {formatDate(row.dueDate)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5">
                      <Badge
                        variant={
                          row.status === 'COMPLETED'
                            ? 'success'
                            : row.status === 'IN_PROGRESS'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {row.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                          row.priority === 'CRITICAL' || row.priority === 'HIGH'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : row.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.priority}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-3.5">
                      <div className="w-20 space-y-0.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>{row.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.progressPercent === 100
                                ? 'bg-emerald-500'
                                : row.progressPercent > 50
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${row.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(row);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-bold rounded transition cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          title="Project Deliverable Details"
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {selectedTask.id} • {selectedTask.projectId}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">{selectedTask.title}</h3>
              <p className="text-xs text-slate-600">
                Project: <strong>{selectedTask.projectName}</strong> • Client: <strong>{selectedTask.client}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Assigned Employee (Who Worked):</p>
                <p className="font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-purple-600" />
                  {selectedTask.employeeName} ({selectedTask.assignedTo})
                </p>
                <p className="text-[11px] text-slate-500">{selectedTask.employeeDesignation} • {selectedTask.department}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Current Status & Priority:</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedTask.status === 'COMPLETED' ? 'success' : 'info'}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Start Date:</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{formatDate(selectedTask.startDate)}</p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Due Date / Deadline:</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{formatDate(selectedTask.dueDate)}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Scope & Instructions:</p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                {selectedTask.description || 'No detailed instructions recorded.'}
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600">Completion Progress</span>
                <span className="text-blue-700">{selectedTask.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${selectedTask.progressPercent}%` }} />
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <Button variant="primary" size="sm" onClick={() => setSelectedTask(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Task Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Project Deliverable Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedbackMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="project-names-list"
              value={taskProjectName}
              onChange={(e) => setTaskProjectName(e.target.value)}
              placeholder="e.g. ERP Suite Enterprise Rollout or HRMS Cloud Migration"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            <datalist id="project-names-list">
              {uniqueProjects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deliverable / Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 Gateway & Auth Endpoints"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign to Employee (Who Will Work On It) <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={taskAssignedTo}
              onChange={(e) => setTaskAssignedTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="">Select Employee...</option>
              {uniqueEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id}) {emp.designation ? `• ${emp.designation}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={taskStartDate}
                onChange={(e) => setTaskStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date / Deadline</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
            <textarea
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Provide technical requirements, endpoints, or delivery expectations..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
