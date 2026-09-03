import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List as ListIcon,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Building2,
  Tag,
  ArrowRight,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  MessageSquare,
  History,
  Send,
  UserPlus,
  Eye,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Layers,
  BarChart3,
  FolderKanban,
  Hourglass,
  PlayCircle,
  FileCheck2,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Percent,
  Award,
  CircleDot,
  Flame,
  Briefcase
} from 'lucide-react';
import { DocumentPreviewModal } from '../../../components/common/DocumentPreviewModal';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { taskApiService } from '../services/taskService';
import {
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskAnalytics,
  AIAssistantInsight
} from '../types';
import { AssignTaskView } from '../components/AssignTaskView';
import { MyTasksView } from '../components/MyTasksView';
import { AllTasksView } from '../components/AllTasksView';
import { TaskReportsView } from '../components/TaskReportsView';

// Human-friendly date formatter
function formatFriendlyDate(dateStr?: string | null): string {
  if (!dateStr) return 'No Date';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr).split('T')[0];
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(dateStr).split('T')[0];
  }
}

// Relative deadline calculator with human-like phrasing
function getRelativeDeadline(dateStr?: string | null, isCompleted = false) {
  if (!dateStr || isCompleted) return null;
  try {
    const due = new Date(dateStr);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isToday: true };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isSoon: true };
    }
    if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, isSoon: true };
    }
    return { text: formatFriendlyDate(dateStr), isNormal: true };
  } catch {
    return null;
  }
}

export const TasksPage: React.FC = () => {
  const { employees = [], activeSubSection = '', setActiveSubSection = () => {}, userProfile } = useApp();

  // Primary data states
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'workload' | 'employee_report' | 'assign_task'>(() => {
    if (activeSubSection === 'assign-task') return 'assign_task';
    if (activeSubSection === 'reports') return 'employee_report';
    return 'kanban';
  });

  // Sync with activeSubSection
  useEffect(() => {
    if (activeSubSection === 'assign-task') {
      setViewMode('assign_task');
    } else if (activeSubSection === 'reports') {
      setViewMode('employee_report');
    } else if (activeSubSection === 'my-tasks') {
      const myEmp = employees.find(e => e.name === userProfile?.name || e.empCode === (userProfile as any)?.empCode);
      if (myEmp) setSelectedEmp(myEmp.empCode || myEmp.id);
    } else if (activeSubSection === 'all-tasks') {
      if (viewMode === 'assign_task') setViewMode('kanban');
    }
  }, [activeSubSection, employees, userProfile]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedEmp, setSelectedEmp] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Employee Report specific states
  const [reportSelectedEmpId, setReportSelectedEmpId] = useState<string>('ALL');
  const [expandedEmployeeCards, setExpandedEmployeeCards] = useState<Record<string, boolean>>({});

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskItem | null>(null);
  const [reviewTaskModal, setReviewTaskModal] = useState<TaskItem | null>(null);
  const [reassignModalTask, setReassignModalTask] = useState<TaskItem | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiInsights, setAiInsights] = useState<AIAssistantInsight | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [previewDocModal, setPreviewDocModal] = useState<{
    fileName: string;
    fileUrl?: string | null;
    taskTitle?: string;
    projectName?: string;
    scopeOfWork?: string;
  } | null>(null);

  // Form States - Create Task Work Order
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    department: 'ALL',
    assignedTo: '',
    priority: 'HIGH' as TaskPriority,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    estimatedHours: 8,
    projectName: 'ERP Core Suite 2.0',
    moduleName: 'Payroll & Financial Ledger',
    deliverableType: 'Full-Stack Implementation & API',
    category: 'Feature Development',
    instructions: '',
    tags: 'Frontend, API, Core',
    pdfAttachmentName: '',
    pdfAttachmentUrl: '',
    checklist: [
      { id: '1', label: 'Review functional specifications and constraints', completed: false },
      { id: '2', label: 'Implement and test core module deliverables', completed: false },
      { id: '3', label: 'Run verification tests & submit deliverable for review', completed: false }
    ]
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);
  const [isAiPlanning, setIsAiPlanning] = useState<boolean>(false);
  const [aiRationaleText, setAiRationaleText] = useState<string | null>(null);
  const [newChecklistInput, setNewChecklistInput] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // AI Work Order Decision Copilot
  const handleAiAutoPlan = async () => {
    if (!createForm.title.trim()) {
      alert('Please enter a task title first (e.g. "Implement Banking Reconciliation") so AI can plan the work order.');
      return;
    }
    setIsAiPlanning(true);
    try {
      const plan = await taskApiService.generateAITaskPlan({
        title: createForm.title,
        department: createForm.department,
        projectName: createForm.projectName,
        moduleName: createForm.moduleName
      });

      setCreateForm(prev => ({
        ...prev,
        description: plan.description || prev.description,
        instructions: plan.instructions || prev.instructions,
        moduleName: plan.moduleName || prev.moduleName,
        deliverableType: plan.deliverableType || prev.deliverableType,
        priority: plan.priority || prev.priority,
        estimatedHours: plan.estimatedHours || prev.estimatedHours,
        dueDate: plan.dueDate || prev.dueDate,
        tags: plan.tags || prev.tags,
        assignedTo: plan.assignedTo || prev.assignedTo,
        pdfAttachmentName: plan.pdfAttachmentName || prev.pdfAttachmentName,
        pdfAttachmentUrl: plan.pdfAttachmentUrl || prev.pdfAttachmentUrl,
        checklist: plan.checklist || prev.checklist
      }));

      setAiRationaleText(plan.aiRationale);
    } catch (err: any) {
      alert(err.message || 'AI Auto-planning failed');
    } finally {
      setIsAiPlanning(false);
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistInput.trim()) return;
    setCreateForm(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: Date.now().toString(), label: newChecklistInput.trim(), completed: false }]
    }));
    setNewChecklistInput('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setCreateForm(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  // Form States - Review Task
  const [managerFeedback, setManagerFeedback] = useState<string>('');
  const [reviewActualHours, setReviewActualHours] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  // Form States - Reassign
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('Workload rebalancing');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  // Form States - Comment
  const [commentInput, setCommentInput] = useState<string>('');
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);

  // Fetch Tasks & Analytics
  const fetchTasksData = async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (selectedDept !== 'ALL') filters.department = selectedDept;
      if (selectedEmp !== 'ALL') filters.employeeId = selectedEmp;
      if (selectedPriority !== 'ALL') filters.priority = selectedPriority;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const [tasksData, analyticsData] = await Promise.all([
        taskApiService.getTasks(filters),
        taskApiService.getAnalytics(selectedDept !== 'ALL' ? selectedDept : undefined)
      ]);
      setTasks(tasksData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();

    // Dynamic Live WebSocket & Polling Sync
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TASK_EVENT' || msg.type === 'NOTIFICATION_EVENT') {
            fetchTasksData();
          }
        } catch {}
      };
    } catch (e) {
      console.log('WebSocket notice, fallback to polling.');
    }

    const interval = setInterval(() => {
      fetchTasksData();
    }, 6000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, [selectedDept, selectedEmp, selectedPriority, selectedStatus, searchQuery]);

  // Extract distinct departments from employees
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [employees]);

  // Filter employees dynamically for creation form (shows ALL employees when 'ALL' or unselected)
  const filteredEmployeesForCreation = useMemo(() => {
    if (!createForm.department || createForm.department === 'ALL') {
      return employees.filter(e => e.status !== 'Exited');
    }
    const deptMatches = employees.filter(e => e.department?.toLowerCase() === createForm.department.toLowerCase() && e.status !== 'Exited');
    return deptMatches.length > 0 ? deptMatches : employees.filter(e => e.status !== 'Exited');
  }, [employees, createForm.department]);

  // Auto-set assignedTo employee when department changes in create modal
  useEffect(() => {
    if (filteredEmployeesForCreation.length > 0) {
      const currentExists = filteredEmployeesForCreation.some(e => (e.empCode || e.id) === createForm.assignedTo);
      if (!currentExists) {
        setCreateForm(prev => ({
          ...prev,
          assignedTo: filteredEmployeesForCreation[0]?.empCode || filteredEmployeesForCreation[0]?.id || ''
        }));
      }
    } else {
      setCreateForm(prev => ({ ...prev, assignedTo: '' }));
    }
  }, [createForm.department, filteredEmployeesForCreation]);

  const handleOpenCreateModal = () => {
    const allActive = employees.filter(e => e.status !== 'Exited');
    const defaultEmp = allActive[0]?.empCode || allActive[0]?.id || '';
    const defaultDept = allActive[0]?.department || availableDepartments[0] || 'Engineering';

    setCreateForm({
      title: '',
      description: '',
      department: 'ALL',
      assignedTo: defaultEmp,
      priority: 'HIGH',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      estimatedHours: 8,
      projectName: 'ERP Core Suite 2.0',
      moduleName: 'Payroll & Financial Ledger',
      deliverableType: 'Full-Stack Implementation & API',
      category: 'Feature Development',
      instructions: '',
      tags: 'Frontend, API, Core',
      pdfAttachmentName: '',
      pdfAttachmentUrl: '',
      checklist: [
        { id: '1', label: 'Review functional specifications and constraints', completed: false },
        { id: '2', label: 'Implement and test core module deliverables', completed: false },
        { id: '3', label: 'Run verification tests & submit deliverable for review', completed: false }
      ]
    });
    setAiRationaleText(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.assignedTo) return;
    setIsSubmittingCreate(true);
    try {
      const assignedEmp = employees.find(e => (e.empCode || e.id) === createForm.assignedTo);
      const payload = {
        ...createForm,
        department: (!createForm.department || createForm.department === 'ALL') ? (assignedEmp?.department || 'Engineering') : createForm.department
      };
      await taskApiService.createTask(payload);
      setActionSuccessMsg(`Task "${createForm.title}" created & assigned successfully.`);
      setIsCreateModalOpen(false);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Review Actions
  const handleApproveTask = async () => {
    if (!reviewTaskModal) return;
    setIsReviewing(true);
    try {
      await taskApiService.approveTask(reviewTaskModal.id, {
        managerFeedback: managerFeedback || 'Approved and confirmed deliverables.',
        actualHours: reviewActualHours ? parseFloat(reviewActualHours) : undefined
      });
      setActionSuccessMsg(`Task "${reviewTaskModal.title}" marked as completed.`);
      setReviewTaskModal(null);
      setManagerFeedback('');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve task');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReopenTask = async () => {
    if (!reviewTaskModal) return;
    if (!managerFeedback.trim()) {
      alert('Please provide feedback explaining why the task is being reopened.');
      return;
    }
    setIsReviewing(true);
    try {
      await taskApiService.reopenTask(reviewTaskModal.id, { managerFeedback });
      setActionSuccessMsg(`Task "${reviewTaskModal.title}" reopened.`);
      setReviewTaskModal(null);
      setManagerFeedback('');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen task');
    } finally {
      setIsReviewing(false);
    }
  };

  // Handle Reassign Task
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalTask || !newAssigneeId) return;
    setIsReassigning(true);
    try {
      await taskApiService.reassignTask(reassignModalTask.id, {
        newAssigneeId,
        reason: reassignReason
      });
      setActionSuccessMsg(`Task reassigned successfully.`);
      setReassignModalTask(null);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign task');
    } finally {
      setIsReassigning(false);
    }
  };

  // Handle Comment Add
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskDetail || !commentInput.trim()) return;
    setIsPostingComment(true);
    try {
      await taskApiService.addComment(selectedTaskDetail.id, commentInput.trim());
      setCommentInput('');
      const updated = await taskApiService.getTaskById(selectedTaskDetail.id);
      setSelectedTaskDetail(updated);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Open AI Assistant
  const handleOpenAiAssistant = async (taskId?: string, empId?: string) => {
    setIsAiLoading(true);
    setAiModalOpen(true);
    try {
      const res = await taskApiService.getAIAssistant({ taskId, employeeId: empId });
      setAiInsights(res);
    } catch (err: any) {
      setAiInsights({
        type: 'ERROR',
        riskAnalysis: err.message || 'Could not fetch AI insights.'
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle Employee Card Expansion in Report View
  const toggleEmployeeExpanded = (empId: string) => {
    setExpandedEmployeeCards(prev => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  // Modern Clean Kanban Columns
  const kanbanColumns: {
    id: TaskStatus;
    label: string;
  }[] = [
    { id: 'ASSIGNED', label: 'To Do' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'BLOCKED', label: 'Blocked' },
    { id: 'SUBMITTED', label: 'Under Review' },
    { id: 'COMPLETED', label: 'Done' },
  ];

  const kpis = analytics?.kpis || {
    totalTasks: tasks.length,
    pending: tasks.filter(t => t.status === 'ASSIGNED' || t.status === 'ACCEPTED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REOPENED').length,
    submitted: tasks.filter(t => t.status === 'SUBMITTED').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => t.is_overdue).length,
    highPriority: tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0,
    onTimeRate: 100
  };

  // Helper: Find Employee record cleanly
  const getEmployeeProfile = (empCodeOrId?: string, fallbackName?: string) => {
    const emp = employees.find(e => (e.empCode || e.id) === empCodeOrId);
    return {
      name: emp?.name || fallbackName || empCodeOrId || 'Unassigned',
      designation: emp?.designation || 'Specialist',
      department: emp?.department || 'Operations',
      code: emp?.empCode || emp?.id || empCodeOrId || ''
    };
  };

  // Group Tasks by Employee for Employee Task Progress Report
  const employeeTaskReports = useMemo(() => {
    const map: Record<string, {
      employee: { id: string; empCode: string; name: string; department: string; designation: string; avatar?: string };
      tasks: TaskItem[];
      totalAssigned: number;
      completedCount: number;
      inProgressCount: number;
      submittedCount: number;
      overdueCount: number;
      pendingCount: number;
      averageProgress: number;
      overallCompletionRate: number;
    }> = {};

    // First populate from active employees
    employees.forEach(emp => {
      if (selectedDept !== 'ALL' && emp.department?.toLowerCase() !== selectedDept.toLowerCase()) return;
      const code = emp.empCode || emp.id;
      map[code] = {
        employee: {
          id: emp.id,
          empCode: code,
          name: emp.name,
          department: emp.department || 'General',
          designation: emp.designation || 'Specialist',
          avatar: (emp as any).avatar
        },
        tasks: [],
        totalAssigned: 0,
        completedCount: 0,
        inProgressCount: 0,
        submittedCount: 0,
        overdueCount: 0,
        pendingCount: 0,
        averageProgress: 0,
        overallCompletionRate: 0
      };
    });

    // Populate tasks
    tasks.forEach(t => {
      const empCode = t.assigned_to;
      if (!empCode) return;

      if (!map[empCode]) {
        map[empCode] = {
          employee: {
            id: empCode,
            empCode: empCode,
            name: t.employee_name || t.assigned_to_name || empCode,
            department: t.department || 'General',
            designation: 'Specialist'
          },
          tasks: [],
          totalAssigned: 0,
          completedCount: 0,
          inProgressCount: 0,
          submittedCount: 0,
          overdueCount: 0,
          pendingCount: 0,
          averageProgress: 0,
          overallCompletionRate: 0
        };
      }

      map[empCode].tasks.push(t);
      map[empCode].totalAssigned += 1;

      if (t.status === 'COMPLETED') map[empCode].completedCount += 1;
      else if (t.status === 'IN_PROGRESS' || t.status === 'REOPENED') map[empCode].inProgressCount += 1;
      else if (t.status === 'SUBMITTED') map[empCode].submittedCount += 1;
      else if (t.status === 'ASSIGNED' || t.status === 'ACCEPTED') map[empCode].pendingCount += 1;

      if (t.is_overdue) map[empCode].overdueCount += 1;
    });

    // Calculate percentages
    return Object.values(map)
      .map(entry => {
        const total = entry.totalAssigned;
        const sumProgress = entry.tasks.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0);
        entry.averageProgress = total > 0 ? Math.round(sumProgress / total) : 0;
        entry.overallCompletionRate = total > 0 ? Math.round((entry.completedCount / total) * 100) : 0;
        return entry;
      })
      .filter(entry => {
        if (reportSelectedEmpId !== 'ALL' && entry.employee.empCode !== reportSelectedEmpId && entry.employee.id !== reportSelectedEmpId) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchEmp = entry.employee.name.toLowerCase().includes(q) || entry.employee.empCode.toLowerCase().includes(q);
          const matchTask = entry.tasks.some(t => t.title.toLowerCase().includes(q) || (t.project_name || '').toLowerCase().includes(q));
          return matchEmp || matchTask;
        }
        return true;
      });
  }, [employees, tasks, selectedDept, reportSelectedEmpId, searchQuery]);

  // Sub-module Views routing matching Admin HRMS screenshot
  // Sub-section Views
  const renderSubSectionContent = () => {
    if (activeSubSection === 'assign-task' || viewMode === 'assign_task') {
      return (
        <AssignTaskView
          onBack={() => {
            setActiveSubSection('all-tasks');
            setViewMode('list');
          }}
          onSuccess={() => {
            fetchTasksData();
            setActiveSubSection('all-tasks');
            setViewMode('list');
          }}
        />
      );
    }

    if (activeSubSection === 'my-tasks') {
      return (
        <MyTasksView
          tasks={tasks}
          isLoading={isLoading}
          onRefresh={fetchTasksData}
          onSelectTask={setSelectedTaskDetail}
        />
      );
    }

    if (activeSubSection === 'reports') {
      return (
        <TaskReportsView
          tasks={tasks}
          analytics={analytics}
          onSelectTask={setSelectedTaskDetail}
          onAssignTask={() => {
            setActiveSubSection('assign-task');
            setViewMode('assign_task');
          }}
          onViewAllOverdue={() => {
            setActiveSubSection('all-tasks');
            setSelectedStatus('OVERDUE');
          }}
        />
      );
    }

    return (
      <AllTasksView
        tasks={tasks}
        isLoading={isLoading}
        onRefresh={fetchTasksData}
        onAddTask={() => {
          setActiveSubSection('assign-task');
          setViewMode('assign_task');
        }}
        onSelectTask={setSelectedTaskDetail}
        onReassignTask={setReassignModalTask}
        onReviewTask={setReviewTaskModal}
      />
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fade-in text-xs">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {renderSubSectionContent()}

      {/* REVIEW TASK MODAL */}
      <Modal isOpen={Boolean(reviewTaskModal)} onClose={() => setReviewTaskModal(null)} title="Review Deliverable">
        {reviewTaskModal && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-semibold text-slate-600">{reviewTaskModal.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">UNDER REVIEW</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{reviewTaskModal.title}</h3>
              <p className="text-slate-600 font-normal">{reviewTaskModal.description}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium block">Employee:</span>
                  <span className="font-semibold text-slate-800">{reviewTaskModal.employee_name || reviewTaskModal.assigned_to_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Submitted:</span>
                  <span className="font-mono text-slate-800">{reviewTaskModal.submitted_at ? new Date(reviewTaskModal.submitted_at).toLocaleString() : 'Recent'}</span>
                </div>
              </div>

              {reviewTaskModal.completion_note && (
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 mt-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Employee Note:</span>
                  <p className="text-slate-800 italic">{reviewTaskModal.completion_note}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Hours Spent</label>
                <input
                  type="number"
                  step="0.5"
                  value={reviewActualHours}
                  onChange={(e) => setReviewActualHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Hours</label>
                <input
                  type="number"
                  disabled
                  value={reviewTaskModal.estimated_hours || 8}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manager Feedback / Notes</label>
              <textarea
                rows={3}
                value={managerFeedback}
                onChange={(e) => setManagerFeedback(e.target.value)}
                placeholder="Provide review notes or required changes..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-normal focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReopenTask}
                disabled={isReviewing}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} /> Request Changes
              </button>
              <button
                type="button"
                onClick={handleApproveTask}
                disabled={isReviewing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check size={13} /> Approve Task
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* TASK DETAILS & AUDIT ACTIVITY MODAL */}
      <Modal isOpen={Boolean(selectedTaskDetail)} onClose={() => setSelectedTaskDetail(null)} title={`Task Details — ${selectedTaskDetail?.id || ''}`}>
        {selectedTaskDetail && (
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-semibold text-slate-600">{selectedTaskDetail.id}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-800">
                  {selectedTaskDetail.status}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">{selectedTaskDetail.title}</h2>
              <p className="text-slate-600 font-normal leading-relaxed">{selectedTaskDetail.description}</p>

              {/* Module & Deliverable Badge Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Module</span>
                  <span className="font-semibold text-blue-700">{selectedTaskDetail.module_name || 'Core Module'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deliverable Type</span>
                  <span className="font-semibold text-purple-700">{selectedTaskDetail.deliverable_type || 'Code Implementation'}</span>
                </div>
              </div>

              {/* Attachments / Spec */}
              {selectedTaskDetail.attachments && selectedTaskDetail.attachments.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Task Documents & Attachments ({selectedTaskDetail.attachments.length})</span>
                  {selectedTaskDetail.attachments.map((att: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() =>
                        setPreviewDocModal({
                          fileName: att.fileName || att.file_name,
                          fileUrl: att.fileUrl || att.file_url,
                          taskTitle: selectedTaskDetail.title,
                          projectName: selectedTaskDetail.project_name,
                          scopeOfWork: selectedTaskDetail.description
                        })
                      }
                      className="flex items-center justify-between p-2.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-xl text-rose-800 text-xs transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={15} className="text-rose-600 shrink-0 group-hover:scale-110 transition" />
                        <span className="font-bold">Required Spec:</span>
                        <span className="font-mono underline truncate">{att.fileName || att.file_name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-white border border-rose-200 rounded-md font-bold text-[10px] text-rose-700 shrink-0 flex items-center gap-1 group-hover:bg-rose-600 group-hover:text-white transition">
                        <Eye size={11} /> View Spec / PDF Doc
                      </span>
                    </div>
                  ))}
                </div>
              ) : selectedTaskDetail.pdf_attachment_name ? (
                <div
                  onClick={() =>
                    setPreviewDocModal({
                      fileName: selectedTaskDetail.pdf_attachment_name || 'Document_Specification.pdf',
                      fileUrl: selectedTaskDetail.pdf_attachment_url,
                      taskTitle: selectedTaskDetail.title,
                      projectName: selectedTaskDetail.project_name,
                      scopeOfWork: selectedTaskDetail.description
                    })
                  }
                  className="flex items-center justify-between p-2.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-xl text-rose-800 text-xs transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={15} className="text-rose-600 shrink-0 group-hover:scale-110 transition" />
                    <span className="font-bold">Required Spec:</span>
                    <span className="font-mono underline truncate">{selectedTaskDetail.pdf_attachment_name}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-rose-200 rounded-md font-bold text-[10px] text-rose-700 shrink-0 flex items-center gap-1 group-hover:bg-rose-600 group-hover:text-white transition">
                    <Eye size={11} /> View Spec / PDF Doc
                  </span>
                </div>
              ) : null}

              {/* Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Assignee</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{selectedTaskDetail.employee_name || selectedTaskDetail.assigned_to_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Assigned By</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{selectedTaskDetail.assigned_by}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Priority</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{selectedTaskDetail.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Deadline</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{formatFriendlyDate(selectedTaskDetail.due_date)}</span>
                </div>
              </div>

              {/* Checklist */}
              {selectedTaskDetail.checklist && selectedTaskDetail.checklist.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Milestone Checklist</span>
                  <div className="space-y-1">
                    {selectedTaskDetail.checklist.map((c, i) => (
                      <div key={c.id || i} className="flex items-center gap-2 text-[11px] text-slate-700 bg-white p-1.5 rounded-lg border border-slate-200">
                        <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${c.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {c.completed ? '✓' : (i + 1)}
                        </span>
                        <span className={c.completed ? 'line-through text-slate-400' : 'font-medium'}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="pt-2">
                <div className="flex justify-between items-center font-semibold text-[11px] mb-1">
                  <span className="text-slate-500 font-normal">Progress</span>
                  <span className={(selectedTaskDetail.progress_percent || 0) >= 50 ? 'text-emerald-600' : 'text-rose-600'}>
                    {selectedTaskDetail.progress_percent}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(selectedTaskDetail.progress_percent || 0) >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${selectedTaskDetail.progress_percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reassign Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setReassignModalTask(selectedTaskDetail);
                  setNewAssigneeId(employees[0]?.empCode || employees[0]?.id || '');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus size={13} /> Reassign Employee
              </button>
            </div>

            {/* Audit History */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <History size={13} className="text-slate-500" /> Activity History
              </h4>
              <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-3">
                {(selectedTaskDetail.activities || []).length === 0 ? (
                  <p className="text-slate-400 text-[11px]">No activity history logged yet.</p>
                ) : (
                  (selectedTaskDetail.activities || []).map(act => (
                    <div key={act.id} className="relative pb-2">
                      <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-slate-400 border border-white" />
                      <p className="font-semibold text-slate-800 text-[11px]">{act.action}</p>
                      <p className="text-slate-500 text-[10px]">{act.note || act.performed_by_name}</p>
                      <span className="text-slate-400 text-[9px] font-mono">{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <MessageSquare size={13} className="text-slate-500" /> Comments
              </h4>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(selectedTaskDetail.comments || []).map(cmt => (
                  <div key={cmt.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-0.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-slate-800">{cmt.author_name}</span>
                      <span className="text-slate-400 font-mono">{new Date(cmt.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700 text-xs">{cmt.comment}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Leave a comment..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
                />
                <Button variant="primary" size="sm" type="submit" disabled={isPostingComment || !commentInput.trim()}>
                  <Send size={12} />
                </Button>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* REASSIGN MODAL */}
      <Modal isOpen={Boolean(reassignModalTask)} onClose={() => setReassignModalTask(null)} title="Reassign Task">
        {reassignModalTask && (
          <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Reassign <b>{reassignModalTask.title}</b> to another employee.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Assignee *</label>
              <select
                required
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              >
                {employees.filter(e => e.status !== 'Exited').map(e => (
                  <option key={e.id} value={e.empCode || e.id}>
                    {e.name} ({e.empCode || e.id}) - {e.department} ({e.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Reassignment</label>
              <input
                type="text"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Workload rebalancing"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="outline" onClick={() => setReassignModalTask(null)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={isReassigning}>
                {isReassigning ? 'Reassigning...' : 'Confirm'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* AI INSIGHTS MODAL */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="AI Advisory Insights">
        <div className="space-y-4 text-xs">
          {isAiLoading ? (
            <div className="py-8 text-center space-y-2">
              <Sparkles className="animate-spin text-purple-600 mx-auto" size={20} />
              <p className="font-semibold text-slate-700">Analyzing workload patterns...</p>
            </div>
          ) : aiInsights ? (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Advisory Summary</span>
                <p className="text-slate-800 font-medium">{aiInsights.summary || aiInsights.progressSummary || aiInsights.workloadSummary}</p>
                {aiInsights.riskAnalysis && (
                  <p className="text-rose-700 font-medium text-xs bg-rose-50 p-2 rounded-lg border border-rose-200">
                    ⚠️ {aiInsights.riskAnalysis}
                  </p>
                )}
                {aiInsights.recommendation && (
                  <p className="text-slate-800 font-normal text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                    💡 <b>Recommendation:</b> {aiInsights.recommendation}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <Button variant="outline" onClick={() => setAiModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Interactive Document / PDF / Image Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDocModal)}
        onClose={() => setPreviewDocModal(null)}
        fileName={previewDocModal?.fileName}
        fileUrl={previewDocModal?.fileUrl}
        taskTitle={previewDocModal?.taskTitle}
        projectName={previewDocModal?.projectName}
        scopeOfWork={previewDocModal?.scopeOfWork}
      />
    </div>
  );
};
