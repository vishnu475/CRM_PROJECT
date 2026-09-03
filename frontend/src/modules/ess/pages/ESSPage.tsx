import React, { useState, useEffect } from 'react';
import {
  User,
  CalendarDays,
  Clock,
  Banknote,
  FileText,
  TrendingUp,
  Receipt,
  CreditCard,
  Briefcase,
  Folder,
  Bell,
  CheckCircle2,
  CheckSquare,
  AlertCircle,
  Plus,
  RefreshCw,
  Download,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Building2,
  ChevronRight,
  Hexagon,
  LogOut,
  ExternalLink,
  Search,
  ChevronDown,
  LayoutDashboard,
  Headphones,
  Settings,
  Megaphone,
  Plane,
  HeartHandshake,
  Check,
  X,
  FileCheck,
  Award,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  CheckCircle,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Home,
  MessageSquare,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Shield,
  Laptop,
  Key,
  Eye,
  EyeOff,
  Printer,
  Share2,
  Camera,
  QrCode,
  Heart,
  Copy,
  FileSpreadsheet,
  BookOpen,
  Pencil,
  Edit3,
  Filter,
  UploadCloud,
  DollarSign,
  Paperclip,
  Coffee,
  Car,
  Wifi,
  ShoppingBag,
  Utensils,
  Trash2,
  Tag,
  ArrowUpRight,
  UserCheck,
  UserCheck as UserCheckIcon,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { EmployeeAttendanceView } from '../components/EmployeeAttendanceView';
import { DocumentPreviewModal } from '../../../components/common/DocumentPreviewModal';

export const ESSPage: React.FC = () => {
  const {
    activeSubSection,
    setActiveSubSection,
    setActiveModule,
    setIsAuthenticated,
    userRole,
    userProfile,
    setUserProfile,
    updateEmployee,
    employees = [],
    companyName = 'Demo Company Pvt. Ltd.',
    theme = 'dark',
    setTheme = () => {}
  } = useApp() || {};

  const [localSubSection, setLocalSubSection] = useState<string>(activeSubSection || 'dashboard');
  
  useEffect(() => {
    if (activeSubSection) {
      setLocalSubSection(activeSubSection);
    }
  }, [activeSubSection]);

  const subSection = localSubSection || activeSubSection || 'dashboard';
  const handleNavClick = (id: string) => {
    setLocalSubSection(id);
    if (setActiveSubSection) {
      setActiveSubSection(id);
    }
  };

  const currentEmpId = (userProfile?.empCode && userProfile.empCode !== 'usr_1') ? userProfile.empCode : ((userProfile?.id && userProfile.id !== 'usr_1') ? userProfile.id : 'EMP-006');

  // Sidebar Collapse state matching Admin Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [dashData, setDashData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [leaveData, setLeaveData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [loansData, setLoansData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [internalJobsData, setInternalJobsData] = useState<any>({ openings: [], myApplications: [] });
  const [transfersData, setTransfersData] = useState<any[]>([]);
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [timesheetsData, setTimesheetsData] = useState<any[]>([]);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [hrRequestsData, setHrRequestsData] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Dynamic Expense Claim & Filter States
  const [expCategory, setExpCategory] = useState('Travel & Conveyance');
  const [expAmount, setExpAmount] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expPaymentMode, setExpPaymentMode] = useState('Personal Credit Card');
  const [expReceiptName, setExpReceiptName] = useState<string | null>(null);
  const [expReceiptUrl, setExpReceiptUrl] = useState<string>('');
  const [isSubmittingExp, setIsSubmittingExp] = useState(false);
  const [expSuccessMsg, setExpSuccessMsg] = useState<string | null>(null);
  const [expFilterStatus, setExpFilterStatus] = useState<string>('ALL');
  const [expFilterCategory, setExpFilterCategory] = useState<string>('ALL');
  const [expSearchQuery, setExpSearchQuery] = useState<string>('');
  const [selectedExpenseForModal, setSelectedExpenseForModal] = useState<any | null>(null);

  const [transDept, setTransDept] = useState('Product Management');
  const [transBranch, setTransBranch] = useState('Bengaluru Tech Hub');
  const [transReason, setTransReason] = useState('');

  const [hrReqType, setHrReqType] = useState('Employment Verification Letter');
  const [hrReqDesc, setHrReqDesc] = useState('');

  const [tsProject, setTsProject] = useState('ERP Suite 2.0');
  const [tsTask, setTsTask] = useState('Module Development');
  const [tsHours, setTsHours] = useState('8');
  const [tsDesc, setTsDesc] = useState('');

  // Profile View Interactive States
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'organization' | 'statutory' | 'skills' | 'assets'>('overview');
  const [showMaskedBank, setShowMaskedBank] = useState<boolean>(true);
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEditReqModal, setShowEditReqModal] = useState<boolean>(false);
  const [editReqNotes, setEditReqNotes] = useState<string>('');
  const [editReqField, setEditReqField] = useState<string>('Personal Contact / Address Details');
  const [editReqSuccess, setEditReqSuccess] = useState<boolean>(false);
  const [selectedPayslipModal, setSelectedPayslipModal] = useState<any | null>(null);
  const [historyYear, setHistoryYear] = useState<number>(2026);
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'ALL' | 'CREDITED' | 'PENDING'>('ALL');
  const [selectedHistoryMonthNum, setSelectedHistoryMonthNum] = useState<number>(8);

  // Profile Direct Editing Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editModalTab, setEditModalTab] = useState<'personal' | 'contact' | 'organization' | 'bank'>('personal');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileEditForm, setProfileEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    avatar: '',
    department: '',
    designation: '',
    personalEmail: '',
    address: '#402, Skyline Residency, Cyber Gateway Road, Bengaluru - 560100',
    emergencyContactName: 'Family Member',
    emergencyContactPhone: '+91 98450 11223',
    bankName: 'HDFC Bank Ltd.',
    bankAccount: '5020008892101',
    ifscCode: 'HDFC0001234',
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '5489-1234-8921',
    uanNumber: '101234567890',
  });

  // Task Management States
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('ALL');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('ALL');
  const [showAssignTaskModal, setShowAssignTaskModal] = useState<boolean>(false);
  const [selectedTaskDetailModal, setSelectedTaskDetailModal] = useState<any | null>(null);
  const [previewDocModal, setPreviewDocModal] = useState<{
    fileName: string;
    fileUrl?: string | null;
    taskTitle?: string;
    projectName?: string;
    scopeOfWork?: string;
  } | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  // New Progress & Submit for Review states
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [progressUpdateTask, setProgressUpdateTask] = useState<any | null>(null);
  const [newProgressValue, setNewProgressValue] = useState<number>(0);
  const [newProgressNote, setNewProgressNote] = useState<string>('');
  const [showSubmitReviewModal, setShowSubmitReviewModal] = useState<boolean>(false);
  const [submitReviewTask, setSubmitReviewTask] = useState<any | null>(null);
  const [completionNoteInput, setCompletionNoteInput] = useState<string>('');
  const [actualHoursInput, setActualHoursInput] = useState<string>('8');
  const [taskCommentInput, setTaskCommentInput] = useState<string>('');
  const [isSavingTaskProgress, setIsSavingTaskProgress] = useState<boolean>(false);

  const [assignTaskForm, setAssignTaskForm] = useState({
    title: '',
    projectName: 'Payroll Automation',
    assignedTo: 'EMP-009',
    priority: 'High',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    description: '',
    category: 'Feature Development',
    estimatedHours: 8,
    tags: 'Frontend, Core'
  });

  const handleOpenEditProfile = (
    currentName: string,
    currentEmail: string,
    currentPhone: string,
    currentGender: string,
    currentAvatar: string,
    currentDept: string,
    currentDesignation: string,
    currentPersonalEmail: string,
    currentBankAccount?: string,
    currentIfsc?: string,
    currentPan?: string,
    currentUan?: string
  ) => {
    setProfileEditForm({
      name: currentName || '',
      email: currentEmail || '',
      phone: currentPhone || '',
      gender: currentGender || 'Male',
      avatar: currentAvatar || '',
      department: currentDept || '',
      designation: currentDesignation || '',
      personalEmail: currentPersonalEmail || '',
      address: profileEditForm.address || '#402, Skyline Residency, Cyber Gateway Road, Bengaluru - 560100',
      emergencyContactName: profileEditForm.emergencyContactName || `${currentName}'s Family Member`,
      emergencyContactPhone: profileEditForm.emergencyContactPhone || '+91 98450 11223',
      bankName: 'HDFC Bank Ltd.',
      bankAccount: currentBankAccount ? currentBankAccount.replace(/X/g, '9') : '5020008892101',
      ifscCode: currentIfsc || 'HDFC0001234',
      panNumber: currentPan ? currentPan.replace(/X/g, 'A') : 'ABCDE1234F',
      aadhaarNumber: profileEditForm.aadhaarNumber || '5489-1234-8921',
      uanNumber: currentUan ? currentUan.replace(/X/g, '1') : '101234567890',
    });
    setEditModalTab('personal');
    setProfileSuccessMsg(null);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      // 1. Update Backend API
      await fetch('/api/v1/employee/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentEmpId
        },
        body: JSON.stringify({
          name: profileEditForm.name,
          email: profileEditForm.email,
          phone: profileEditForm.phone,
          gender: profileEditForm.gender,
          department: profileEditForm.department,
          designation: profileEditForm.designation,
          bankAccount: profileEditForm.bankAccount,
          ifscCode: profileEditForm.ifscCode,
          panNumber: profileEditForm.panNumber,
          uanNumber: profileEditForm.uanNumber,
          avatar: profileEditForm.avatar
        })
      }).catch(err => console.warn('Backend ESS profile update notice:', err));

      // 2. Update Global Context userProfile
      if (setUserProfile) {
        setUserProfile({
          name: profileEditForm.name,
          email: profileEditForm.email,
          department: profileEditForm.department,
          roleTitle: profileEditForm.designation,
          avatar: profileEditForm.avatar || userProfile?.avatar
        });
      }

      // 3. Update Global Context employees list
      if (updateEmployee) {
        updateEmployee(currentEmpId, {
          name: profileEditForm.name,
          email: profileEditForm.email,
          phone: profileEditForm.phone,
          department: profileEditForm.department,
          designation: profileEditForm.designation
        });
      }

      // 4. Update Local State
      setProfileData((prev: any) => ({
        ...prev,
        personal: {
          ...prev?.personal,
          name: profileEditForm.name,
          email: profileEditForm.email,
          phone: profileEditForm.phone,
          gender: profileEditForm.gender,
        },
        organization: {
          ...prev?.organization,
          department: profileEditForm.department,
          designation: profileEditForm.designation,
        },
        bankAndStatutory: {
          ...prev?.bankAndStatutory,
          bankAccount: profileEditForm.bankAccount,
          ifscCode: profileEditForm.ifscCode,
          panNumber: profileEditForm.panNumber,
          uanNumber: profileEditForm.uanNumber
        }
      }));

      setProfileSuccessMsg('Profile changes saved successfully!');
      setTimeout(() => {
        setProfileSuccessMsg(null);
        setShowEditProfileModal(false);
      }, 1200);
    } catch (err) {
      console.error('Error saving profile changes:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    fetchAllESSData();

    // Dynamic Live WebSocket & Polling Sync
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TASK_EVENT' || msg.type === 'NOTIFICATION_EVENT') {
            fetchAllESSData();
          }
        } catch {}
      };
    } catch (e) {
      console.log('WebSocket notice, fallback to polling.');
    }

    const interval = setInterval(() => {
      fetchAllESSData();
    }, 6000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, [subSection, currentEmpId]);

  const fetchAllESSData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'x-employee-id': currentEmpId };
      const [
        dashRes,
        profRes,
        attRes,
        lvRes,
        payRes,
        expRes,
        loanRes,
        perfRes,
        jobRes,
        transRes,
        docRes,
        tsRes,
        tskRes,
        hrRes,
        actRes
      ] = await Promise.all([
        fetch('/api/v1/employee/me/dashboard', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/profile', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/attendance', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/leave', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/payroll', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/expenses', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/loans', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/performance', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/internal-jobs', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/transfers', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/documents', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/timesheets', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/tasks', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/hr-requests', { headers }).then(r => r.json()),
        fetch('/api/v1/employee/me/activity-feed', { headers }).then(r => r.json()),
      ]);

      if (dashRes.success) setDashData(dashRes.data);
      if (profRes.success) setProfileData(profRes.data);
      if (attRes.success) setAttendanceData(attRes.data);
      if (lvRes.success) setLeaveData(lvRes.data);
      if (payRes.success) setPayrollData(payRes.data);
      if (expRes.success) setExpensesData(expRes.data);
      if (loanRes.success) setLoansData(loanRes.data);
      if (perfRes.success) setPerformanceData(perfRes.data);
      if (jobRes.success) setInternalJobsData(jobRes.data);
      if (transRes.success) setTransfersData(transRes.data);
      if (docRes.success) setDocumentsData(docRes.data);
      if (tsRes.success) setTimesheetsData(tsRes.data);
      if (tskRes.success) setTasksData(tskRes.data);
      if (hrRes.success) setHrRequestsData(hrRes.data);
      if (actRes.success) setActivityFeed(actRes.data);
    } catch (e) {
      console.warn('ESS Data Fetch Warning:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getPostHeaders = () => ({
    'Content-Type': 'application/json',
    'x-employee-id': currentEmpId
  });

  // Action Handlers
  const handleCheckIn = async () => {
    try {
      const res = await fetch('/api/v1/employee/me/check-in', { method: 'POST', headers: getPostHeaders() });
      const json = await res.json();
      alert(json.message);
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  const handleCheckOut = async () => {
    try {
      const res = await fetch('/api/v1/employee/me/check-out', { method: 'POST', headers: getPostHeaders() });
      const json = await res.json();
      alert(json.message);
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/employee/me/leave', {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify({ leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason })
      });
      const json = await res.json();
      alert(json.message);
      setLeaveReason('');
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  const handleApplyExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) return;
    setIsSubmittingExp(true);
    try {
      const claimPayload = {
        category: expCategory,
        amount: Number(expAmount),
        description: expDescription || `${expCategory} claim for ${expVendor || 'office purpose'}`,
        vendor: expVendor || 'Direct Vendor',
        paymentMode: expPaymentMode,
        receiptUrl: expReceiptUrl || (expReceiptName ? 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80' : ''),
        claimDate: expDate
      };

      const res = await fetch('/api/v1/employee/me/expenses', {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify(claimPayload)
      });
      const json = await res.json();

      // Instantly prepend new claim to local state
      const newClaim = json.data || {
        id: `EXP-${currentEmpId}-${Date.now().toString().slice(-6)}`,
        category: expCategory,
        amount: Number(expAmount),
        description: expDescription || `${expCategory} claim`,
        vendor: expVendor || 'Direct Vendor',
        payment_mode: expPaymentMode,
        claim_date: expDate,
        status: 'PENDING_APPROVAL',
        created_at: new Date().toISOString()
      };

      setExpensesData(prev => [newClaim, ...(prev || [])]);
      setExpSuccessMsg(`Expense claim of ₹${Number(expAmount).toLocaleString()} submitted successfully!`);
      setExpAmount('');
      setExpDescription('');
      setExpVendor('');
      setExpReceiptName(null);
      setExpReceiptUrl('');

      setTimeout(() => {
        setExpSuccessMsg(null);
      }, 4000);

      fetchAllESSData();
    } catch (e: any) {
      console.error('Expense Submission Error:', e);
      alert(e.message || 'Error submitting expense claim');
    } finally {
      setIsSubmittingExp(false);
    }
  };

  const handleApplyTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/employee/me/transfers', {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify({ requestedDepartment: transDept, requestedBranch: transBranch, preferredEffectiveDate: '2026-09-01', reason: transReason })
      });
      const json = await res.json();
      alert(json.message);
      setTransReason('');
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  const handleHRRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/employee/me/hr-requests', {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify({ requestType: hrReqType, description: hrReqDesc })
      });
      const json = await res.json();
      alert(json.message);
      setHrReqDesc('');
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTaskForm.title.trim()) return;
    setIsSubmittingTask(true);
    try {
      const res = await fetch('/api/v1/employee/me/tasks', {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify(assignTaskForm)
      });
      const json = await res.json();
      if (json.success) {
        setTasksData(prev => [json.data, ...(prev || [])]);
        setTaskSuccessMsg(`Task "${assignTaskForm.title}" assigned successfully!`);
        setShowAssignTaskModal(false);
        setAssignTaskForm({
          title: '',
          projectName: 'Payroll Automation',
          assignedTo: currentEmpId || 'EMP-009',
          priority: 'High',
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          description: '',
          category: 'Feature Development',
          estimatedHours: 8,
          tags: 'Frontend, Core'
        });
        setTimeout(() => setTaskSuccessMsg(null), 4000);
        fetchAllESSData();
      } else {
        alert(json.message || 'Failed to create task');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/start`, {
        method: 'POST',
        headers: getPostHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setTaskSuccessMsg('Task started! Status is now IN PROGRESS.');
        setTimeout(() => setTaskSuccessMsg(null), 3000);
        fetchAllESSData();
      } else {
        alert(json.message || 'Failed to start task');
      }
    } catch (e: any) {
      alert(e.message || 'Error starting task');
    }
  };

  const handleOpenProgressModal = (task: any) => {
    setProgressUpdateTask(task);
    setNewProgressValue(task.progress_percent || 10);
    setNewProgressNote('');
    setShowProgressModal(true);
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressUpdateTask) return;
    setIsSavingTaskProgress(true);
    try {
      const res = await fetch(`/api/tasks/${progressUpdateTask.id}/progress`, {
        method: 'PATCH',
        headers: getPostHeaders(),
        body: JSON.stringify({
          progressPercent: newProgressValue,
          progressNote: newProgressNote,
          status: newProgressValue >= 100 ? 'IN_PROGRESS' : 'IN_PROGRESS'
        })
      });
      const json = await res.json();
      if (json.success) {
        setTaskSuccessMsg(`Progress updated to ${newProgressValue}%!`);
        setShowProgressModal(false);
        setTimeout(() => setTaskSuccessMsg(null), 3000);
        fetchAllESSData();
      } else {
        alert(json.message || 'Failed to update progress');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving progress');
    } finally {
      setIsSavingTaskProgress(false);
    }
  };

  const handleOpenSubmitReviewModal = (task: any) => {
    setSubmitReviewTask(task);
    setCompletionNoteInput('');
    setActualHoursInput(String(task.actual_hours || task.estimated_hours || 8));
    setShowSubmitReviewModal(true);
  };

  const handleConfirmSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitReviewTask) return;
    setIsSavingTaskProgress(true);
    try {
      const res = await fetch(`/api/tasks/${submitReviewTask.id}/submit`, {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify({
          completionNote: completionNoteInput || 'Task completed and submitted for manager approval.',
          actualHours: actualHoursInput ? parseFloat(actualHoursInput) : undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        setTaskSuccessMsg('Task submitted for review! Admin/Manager has been notified.');
        setShowSubmitReviewModal(false);
        setTimeout(() => setTaskSuccessMsg(null), 3500);
        fetchAllESSData();
      } else {
        alert(json.message || 'Failed to submit task');
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting task for review');
    } finally {
      setIsSavingTaskProgress(false);
    }
  };

  const handleAddTaskComment = async (taskId: string) => {
    if (!taskCommentInput.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify({ comment: taskCommentInput.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setTaskCommentInput('');
        // Update modal details
        if (selectedTaskDetailModal && selectedTaskDetailModal.id === taskId) {
          setSelectedTaskDetailModal((prev: any) => ({
            ...prev,
            comments: [...(prev.comments || []), json.data]
          }));
        }
        fetchAllESSData();
      }
    } catch (e: any) {
      alert(e.message || 'Error adding comment');
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string, progressPercent?: number) => {
    try {
      const res = await fetch(`/api/v1/employee/me/tasks/${taskId}/status`, {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify({ status: newStatus, progressPercent })
      });
      const json = await res.json();
      if (json.success) {
        setTasksData(prev => (prev || []).map((t: any) => t.id === taskId ? { ...t, status: newStatus, progress_percent: progressPercent !== undefined ? progressPercent : (newStatus === 'Completed' ? 100 : (newStatus === 'In Progress' ? 50 : t.progress_percent)) } : t));
        if (selectedTaskDetailModal && selectedTaskDetailModal.id === taskId) {
          setSelectedTaskDetailModal((prev: any) => ({ ...prev, status: newStatus, progress_percent: progressPercent !== undefined ? progressPercent : (newStatus === 'Completed' ? 100 : 50) }));
        }
      }
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/v1/employee/me/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getPostHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setTasksData(prev => (prev || []).filter((t: any) => t.id !== taskId));
        setSelectedTaskDetailModal(null);
        setTaskSuccessMsg('Task deleted successfully.');
        setTimeout(() => setTaskSuccessMsg(null), 3000);
      }
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  const handleTimesheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/employee/me/timesheets', {
        method: 'POST',
        headers: getPostHeaders(),
        body: JSON.stringify({ projectName: tsProject, taskName: tsTask, hoursSpent: Number(tsHours), description: tsDesc, date: new Date().toISOString().split('T')[0] })
      });
      const json = await res.json();
      alert(json.message);
      setTsDesc('');
      fetchAllESSData();
    } catch (e: any) { alert(e.message); }
  };

  // DYNAMIC EMPLOYEE RECORD
  const emp = dashData?.employee || {
    name: userProfile?.name || 'Employee Account',
    empCode: userProfile?.empCode || currentEmpId,
    department: userProfile?.department || 'Department',
    designation: userProfile?.roleTitle || 'Employee',
    reportingManager: 'Reporting Manager'
  };

  const kpis = dashData?.kpis || {
    latestNetSalary: 0,
    attendancePercentage: 0,
    presentDays: 0,
    workingDays: 26,
    leaveBalance: 18,
    pendingRequests: 0,
    performanceRating: 0
  };

  const upcomingLeaves = (leaveData?.requests || []).filter((r: any) => r.status === 'Pending' || r.status === 'APPROVED' || r.status === 'Approved');

  // Sidebar Items matching Admin Sidebar structure 1:1
  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'payroll', label: 'Payroll & Payslips', icon: Banknote },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'loans', label: 'Loans & EMI', icon: CreditCard },
    { id: 'transfers', label: 'Transfers', icon: Building },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'hr-requests', label: 'HR Requests', icon: HelpCircle },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'timesheets', label: 'Timesheets', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: String(dashData?.notifications?.length || 0) },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8faff] text-slate-900 selection:bg-blue-100 selection:text-blue-900 select-none">
      
      {/* 1. ADMIN-MATCHING SIDEBAR STRUCTURE */}
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3 overflow-hidden cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm shrink-0">
              <Zap size={20} className="fill-white/20" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="font-extrabold text-sm tracking-wide text-[#0f172a] flex items-center space-x-1">
                  <span>ERP SUITE</span>
                </h1>
                <p className="text-[10px] text-blue-600 font-bold tracking-tight truncate">
                  Employee Portal (ESS)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = subSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-[#2563eb] shadow-sm border border-blue-100'
                    : 'text-slate-500 hover:text-[#0f172a] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      isActive ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-[#2563eb]'
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isSidebarCollapsed && (
                  <div className="flex items-center gap-1">
                    {item.badge && item.badge !== '0' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      size={14}
                      className={`shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${
                        isActive ? 'text-[#2563eb] opacity-80' : 'text-slate-400'
                      }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Card & Control Tools */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div
            className={`flex items-center space-x-3 p-2 rounded-xl bg-white border border-slate-200 shadow-sm ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs">
              {emp.name?.slice(0, 2).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0f172a] truncate">{emp.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{emp.designation}</p>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between px-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>

            {!isSidebarCollapsed && (
              <button
                onClick={() => setActiveSubSection && setActiveSubSection('settings')}
                className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer"
                title="Portal Settings"
              >
                <SlidersHorizontal size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Glassmorphic Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
          {/* Search Bar */}
          <div className="flex items-center relative w-72 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search documents, requests, payslips..."
              className="w-full pl-9 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300/40">⌘K</kbd>
          </div>

          {/* Right Control Actions */}
          <div className="flex items-center space-x-3 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer shadow-2xs">
              <User size={14} className="text-blue-600" />
              <span>{emp.name} ({emp.empCode})</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            <button
              onClick={() => {
                if (setIsAuthenticated) setIsAuthenticated(false);
                localStorage.removeItem('crm_user_profile');
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl cursor-pointer shadow-2xs font-extrabold transition-all"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>

            <button
              onClick={() => setActiveSubSection && setActiveSubSection('notifications')}
              className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Bell size={18} />
              {dashData?.notifications?.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white shadow-2xs animate-pulse">
                  {dashData.notifications.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable View Surface */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* VIEW: DASHBOARD */}
          {subSection === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Dynamic Slate-to-Indigo Hero Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-5 z-10">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg border-2 border-white/20">
                    {emp.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black tracking-tight">Good Morning, {emp.name?.split(' ')[0]}! 👋</h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {emp.empCode}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-1 flex items-center gap-2 font-medium">
                      <span>{emp.designation}</span> • <span>{emp.department}</span> • <span>Manager: {emp.reportingManager}</span>
                    </p>
                  </div>
                </div>

                {/* Real-Time Clock In / Clock Out Action Widget */}
                <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 z-10">
                  <div className="text-left text-xs">
                    <p className="text-indigo-200 font-medium">Today's Punch Status</p>
                    <p className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                      {attendanceData?.today?.checkIn ? `Checked In: ${attendanceData.today.checkIn}` : 'Not Checked In'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCheckIn}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
                    >
                      Clock In
                    </button>
                    <button
                      onClick={handleCheckOut}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
                    >
                      Clock Out
                    </button>
                  </div>
                </div>
              </div>

              {/* 5 DYNAMIC KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* KPI 1: NET SALARY */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-emerald-200 transition-all duration-300 space-y-3 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs border border-emerald-100">
                      <Banknote size={22} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {kpis.salaryPaymentStatus || 'Processing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">NET SALARY (AUG 2025)</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">₹{Number(kpis.latestNetSalary || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">From PostgreSQL Payroll</p>
                  </div>
                </div>

                {/* KPI 2: ATTENDANCE */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-200 transition-all duration-300 space-y-3 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs border border-blue-100">
                      <Clock size={22} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 font-mono bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {kpis.attendancePercentage || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">ATTENDANCE (AUG)</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{kpis.presentDays || 0} / {kpis.workingDays || 26}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Days Present</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${kpis.attendancePercentage || 0}%` }}></div>
                  </div>
                </div>

                {/* KPI 3: LEAVE BALANCE */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-purple-200 transition-all duration-300 space-y-3 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs border border-purple-100">
                      <CalendarDays size={22} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">LEAVE BALANCE</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{kpis.leaveBalance} Days</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Available Annual Paid Leaves</p>
                  </div>
                </div>

                {/* KPI 4: PENDING REQUESTS */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-amber-200 transition-all duration-300 space-y-3 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs border border-amber-100">
                      <AlertCircle size={22} />
                    </div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Awaiting Action
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">PENDING REQUESTS</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{kpis.pendingRequests}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Awaiting Manager Sign-off</p>
                  </div>
                </div>

                {/* KPI 5: PERFORMANCE RATING */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-teal-200 transition-all duration-300 space-y-3 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs border border-teal-100">
                      <TrendingUp size={22} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">PERFORMANCE RATING</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{kpis.performanceRating ? `${kpis.performanceRating} / 5.0` : 'Not Reviewed'}</p>
                    <p className="text-[10px] text-teal-600 font-medium mt-1">Latest Evaluation Score</p>
                  </div>
                </div>
              </div>

              {/* 6 FLOATING QUICK ACTION PILLS */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Apply Leave', target: 'leave', icon: CalendarDays, bg: 'bg-blue-50/80 hover:bg-blue-100 text-blue-600 border-blue-200/60' },
                    { label: 'Regularize Time', target: 'attendance', icon: Clock, bg: 'bg-purple-50/80 hover:bg-purple-100 text-purple-600 border-purple-200/60' },
                    { label: 'Submit Expense', target: 'expenses', icon: Receipt, bg: 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-600 border-emerald-200/60' },
                    { label: 'View Payslip', target: 'payroll', icon: Banknote, bg: 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 border-indigo-200/60' },
                    { label: 'My Tasks', target: 'tasks', icon: CheckSquare, bg: 'bg-amber-50/80 hover:bg-amber-100 text-amber-600 border-amber-200/60' },
                    { label: 'Request Transfer', target: 'transfers', icon: Building, bg: 'bg-rose-50/80 hover:bg-rose-100 text-rose-600 border-rose-200/60' },
                  ].map((act, idx) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleNavClick(act.target)}
                        className={`p-4 rounded-3xl border transition-all duration-200 hover:scale-[1.03] flex items-center gap-3 cursor-pointer shadow-2xs ${act.bg}`}
                      >
                        <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-xs shrink-0">
                          <Icon size={18} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 text-left leading-tight">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* THREE-COLUMN WIDGET GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1: DYNAMIC MY ACTIVITY TIMELINE */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">My Activity</h3>
                    <button onClick={() => setActiveSubSection && setActiveSubSection('notifications')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>

                  <div className="space-y-4 relative">
                    <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-slate-100"></div>

                    {activityFeed.length > 0 ? (
                      activityFeed.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-xs relative z-10">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                            <Check size={14} />
                          </div>
                          <div className="flex-1 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-start">
                              <h5 className="font-bold text-slate-900">{item.title}</h5>
                              <span className="text-[10px] text-slate-400 font-medium">{item.timestamp?.split('T')[0] || 'Recent'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">{item.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium">No activity events recorded yet.</div>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: ATTENDANCE OVERVIEW (DONUT CHART & LEGEND) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Attendance Overview (August 2025)</h3>
                    <button onClick={() => setActiveSubSection && setActiveSubSection('attendance')} className="text-xs font-bold text-blue-600 hover:underline">View Calendar</button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path strokeDasharray={`${kpis.attendancePercentage || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3.8" />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-3xl font-black text-slate-900">{kpis.presentDays || 0}</p>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Days Present</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs font-semibold">
                      <div className="flex items-center justify-between gap-8">
                        <span className="flex items-center gap-2 text-slate-600"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Present</span>
                        <span className="font-bold text-slate-900">{kpis.presentDays || 0} Days</span>
                      </div>
                      <div className="flex items-center justify-between gap-8">
                        <span className="flex items-center gap-2 text-slate-600"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Leave</span>
                        <span className="font-bold text-slate-900">{leaveData?.requests?.length || 0} Requests</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: DYNAMIC UPCOMING LEAVE */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Upcoming Leave</h3>
                    <button onClick={() => setActiveSubSection && setActiveSubSection('leave')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>

                  <div className="space-y-3">
                    {upcomingLeaves.length > 0 ? (
                      upcomingLeaves.map((l: any, idx: number) => {
                        const rawSt = (l.status || '').toString().toUpperCase();
                        const isApp = rawSt === 'APPROVED' || rawSt === 'ACCEPT' || rawSt === 'ACCEPTED';
                        const isRej = rawSt === 'REJECTED' || rawSt === 'REJECT' || rawSt === 'CANCELLED' || rawSt === 'CANCEL';
                        const sDate = (l.start_date || l.from_date || l.fromDate || '').toString().split('T')[0];
                        const eDate = (l.end_date || l.to_date || l.toDate || '').toString().split('T')[0];

                        return (
                          <div key={idx} className="p-4 bg-purple-50/60 border border-purple-100 rounded-3xl flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs">
                                <Plane size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900">{l.leave_type || l.leaveType || 'Leave'}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{sDate} to {eDate}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isApp 
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                  : isRej 
                                  ? 'text-rose-700 bg-rose-50 border-rose-200' 
                                  : 'text-amber-700 bg-amber-50 border-amber-200'
                              }`}>
                                {isApp ? 'Approved' : isRej ? (rawSt.includes('CANCEL') ? 'Cancelled' : 'Rejected') : 'Pending Approval'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium">No upcoming leave requests.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* DYNAMIC COMPANY ANNOUNCEMENTS */}
              {dashData?.announcements?.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 p-6 rounded-3xl border border-blue-200/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                      <Megaphone size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">COMPANY ANNOUNCEMENT</span>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">{dashData.announcements[0].title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{dashData.announcements[0].content}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ATTENDANCE */}
          {subSection === 'attendance' && (
            <EmployeeAttendanceView currentEmpId={currentEmpId} onRefresh={fetchAllESSData} />
          )}

          {/* VIEW: LEAVE */}
          {subSection === 'leave' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Apply Leave Request</h3>
                <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Leave Type</label>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Privilege Leave">Privilege Leave</option>
                      <option value="Maternity / Paternity Leave">Maternity / Paternity Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                    <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">End Date</label>
                    <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Reason</label>
                    <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} required rows={3} placeholder="Reason for leave..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <Button variant="primary" size="sm" type="submit" className="w-full">Submit Application</Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">My Leave Applications</h3>
                <div className="space-y-3">
                  {(leaveData?.requests || []).map((l: any, idx: number) => {
                    const rawSt = (l.status || '').toString().toUpperCase();
                    const isApp = rawSt === 'APPROVED' || rawSt === 'ACCEPT' || rawSt === 'ACCEPTED';
                    const isRej = rawSt === 'REJECTED' || rawSt === 'REJECT' || rawSt === 'CANCELLED' || rawSt === 'CANCEL';
                    const sDate = (l.start_date || l.from_date || l.fromDate || '').toString().split('T')[0];
                    const eDate = (l.end_date || l.to_date || l.toDate || '').toString().split('T')[0];

                    return (
                      <div key={idx} className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-600">{l.leave_type || l.leaveType}</span>
                          <Badge variant={isApp ? 'success' : isRej ? 'danger' : 'warning'}>
                            {isApp ? 'Approved (Accepted)' : isRej ? (rawSt.includes('CANCEL') ? 'Cancelled' : 'Rejected') : 'Pending Approval'}
                          </Badge>
                        </div>
                        <p className="text-slate-500 font-mono text-[11px]">{sDate} to {eDate}</p>
                        <p className="text-slate-700">{l.reason}</p>
                        {l.manager_name && (
                          <p className="text-[11px] text-emerald-700 font-semibold italic">Reviewed by {l.manager_name} {l.manager_comment ? `("${l.manager_comment}")` : ''}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PAYROLL & PAYSLIPS - DYNAMIC ENTERPRISE COMPENSATION HUB */}
          {subSection === 'payroll' && (() => {
            const annualSalary = Number(payrollData?.annualSalary || (payrollData?.currentSalary?.grossSalary ? payrollData.currentSalary.grossSalary * 12 : 400000));
            const monthlySalary = Number(payrollData?.monthlySalary || payrollData?.currentSalary?.grossSalary || (annualSalary / 12));

            const currentSalary = payrollData?.currentSalary || {
              annualSalary,
              grossSalary: monthlySalary,
              basicSalary: Math.round(monthlySalary * 0.6),
              hra: Math.round(monthlySalary * 0.24),
              specialAllowance: Math.max(0, monthlySalary - Math.round(monthlySalary * 0.84)),
              effectiveFrom: '2026-01-01'
            };

            const latestPayment = payrollData?.latestPayment || null;
            const payslips = payrollData?.payslips || [];
            const hasSalaryCredited = Boolean(latestPayment?.status === 'PAID' || payslips.some((p: any) => p.payment_status === 'PAID' || p.status === 'PAID'));

            return (
              <div className="space-y-6 animate-fade-in">
                {/* 1. REAL-TIME SALARY CREDITED NOTIFICATION BANNER */}
                {hasSalaryCredited && (
                  <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-400/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
                        <CheckCircle2 size={28} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-white text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                            ✔ SALARY CREDITED
                          </span>
                          <span className="text-xs text-emerald-100 font-medium">
                            {latestPayment?.month ? `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][latestPayment.month]} ${latestPayment.year}` : 'August 2026'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black mt-1">
                          Net Salary of ₹{Number(latestPayment?.amount || payslips[0]?.net_pay || (monthlySalary * 0.88)).toLocaleString(undefined, { minimumFractionDigits: 2 })} Transferred
                        </h3>
                        <p className="text-xs text-emerald-100 font-mono mt-0.5">
                          Bank: {latestPayment?.bankName || 'HDFC Bank'} ({latestPayment?.bankAccountMasked || 'XXXX XXXX 4521'}) • Ref: {latestPayment?.paymentReference || payslips[0]?.payment_reference || 'PAY-202608-009'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {payslips.length > 0 && (
                        <button
                          onClick={() => setSelectedPayslipModal(payslips[0])}
                          className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <Eye size={14} /> View Payslip
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CURRENT SALARY STRUCTURE & COMPENSATION OVERVIEW */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                      <Banknote size={28} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">ANNUAL CTC & SALARY STRUCTURE</span>
                      <div className="flex items-baseline gap-3 mt-0.5">
                        <h2 className="text-2xl font-black text-white">
                          ₹{Number(annualSalary).toLocaleString()} <span className="text-xs font-normal text-slate-300">/ year</span>
                        </h2>
                        <span className="text-emerald-400 text-sm font-bold font-mono">
                          (₹{Number(monthlySalary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month)
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200 mt-1">
                        Annual Salary = Source of Truth • Monthly Gross = Annual ÷ 12 • Direct Deposit to {profileData?.bankAndStatutory?.bankName || 'HDFC Bank'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-10 text-xs">
                    <div>
                      <span className="text-[10px] text-indigo-200 block font-bold">Basic Salary (60%)</span>
                      <p className="font-mono font-bold text-white text-sm mt-0.5">₹{Number(currentSalary.basicSalary || Math.round(monthlySalary * 0.6)).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-200 block font-bold">HRA (40% of Basic)</span>
                      <p className="font-mono font-bold text-white text-sm mt-0.5">₹{Number(currentSalary.hra || Math.round(monthlySalary * 0.24)).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-200 block font-bold">Special Allowance</span>
                      <p className="font-mono font-bold text-white text-sm mt-0.5">₹{Number(currentSalary.specialAllowance || Math.round(monthlySalary * 0.16)).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* 3. STATUTORY TAX & CONTRIBUTION BADGES */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">EPF Contribution</span>
                      <p className="font-extrabold text-slate-900 text-xs mt-0.5">12% (₹1,800 Cap)</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Professional Tax</span>
                      <p className="font-extrabold text-slate-900 text-xs mt-0.5">₹200 / month</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Income Tax Slabs</span>
                      <p className="font-extrabold text-slate-900 text-xs mt-0.5">Sec 115BAC Optimized</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Award size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Gratuity & Life</span>
                      <p className="font-extrabold text-slate-900 text-xs mt-0.5">Covered (Nominee Active)</p>
                    </div>
                  </div>
                </div>

                {/* 3. MONTHLY SALARY CREDIT HISTORY & VERIFICATION HUB */}
                {(() => {
                  const monthlyHistory: any[] = payrollData?.monthlyHistory || [];
                  const selectedYearHistory = monthlyHistory.filter(m => m.year === historyYear);
                  
                  // Filter by status
                  const filteredMonthlyList = selectedYearHistory.filter(m => {
                    if (historyFilterStatus === 'CREDITED') return m.isCredited;
                    if (historyFilterStatus === 'PENDING') return !m.isCredited;
                    return true;
                  });

                  // Current inspected month
                  const targetMonthNum = filteredMonthlyList.some(m => m.month === selectedHistoryMonthNum)
                    ? selectedHistoryMonthNum
                    : (filteredMonthlyList[0]?.month || selectedHistoryMonthNum);

                  const selectedMonthData = selectedYearHistory.find(m => m.month === targetMonthNum) || selectedYearHistory[0] || {
                    month: 8,
                    monthName: 'August',
                    monthShort: 'AUG',
                    year: historyYear,
                    creditStatus: hasSalaryCredited ? 'CREDITED' : 'PENDING',
                    statusLabel: hasSalaryCredited ? 'Salary Credited' : 'Pending Disbursal',
                    isCredited: hasSalaryCredited,
                    grossAmount: monthlySalary,
                    totalDeductions: Math.round(monthlySalary * 0.12),
                    netAmount: latestPayment?.amount || (monthlySalary * 0.88),
                    lopDays: 0,
                    lopDeduction: 0,
                    pfDeduction: Math.round(monthlySalary * 0.6 * 0.12),
                    esiDeduction: 0,
                    ptaxDeduction: 200,
                    tdsDeduction: 0,
                    basicSalary: Math.round(monthlySalary * 0.6),
                    hra: Math.round(monthlySalary * 0.24),
                    specialAllowance: Math.max(0, monthlySalary - Math.round(monthlySalary * 0.84)),
                    paymentReference: latestPayment?.paymentReference || 'PAY-202608-047666',
                    transactionId: latestPayment?.transactionId || 'TXN-202608-047666',
                    paymentDate: latestPayment?.paymentDate || new Date().toISOString(),
                    bankName: latestPayment?.bankName || 'HDFC Bank',
                    bankAccountMasked: latestPayment?.bankAccountMasked || 'XXXX XXXX 2101',
                    ifscCode: latestPayment?.ifscCode || 'HDFC0001234',
                    hasPayslip: payslips.length > 0,
                    payslipId: payslips[0]?.id || null
                  };

                  const creditedCount = selectedYearHistory.filter(m => m.isCredited).length;
                  const pendingCount = selectedYearHistory.filter(m => !m.isCredited).length;

                  return (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                      {/* HEADER & CONTROLS */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                              <span>Monthly Salary Credit History & Verification Hub</span>
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Real-time tracking of salary disbursals, bank transfer references, and credit statuses for every month
                          </p>
                        </div>

                        {/* FILTER & YEAR TOGGLES */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Year Selector */}
                          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                            <button
                              onClick={() => setHistoryYear(2026)}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                historyYear === 2026 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              2026
                            </button>
                            <button
                              onClick={() => setHistoryYear(2025)}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                historyYear === 2025 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              2025
                            </button>
                          </div>

                          {/* Status Filter Buttons */}
                          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                            <button
                              onClick={() => setHistoryFilterStatus('ALL')}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                historyFilterStatus === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              All Months ({selectedYearHistory.length || 12})
                            </button>
                            <button
                              onClick={() => setHistoryFilterStatus('CREDITED')}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                historyFilterStatus === 'CREDITED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
                              }`}
                            >
                              <CheckCircle2 size={12} /> Credited ({creditedCount})
                            </button>
                            <button
                              onClick={() => setHistoryFilterStatus('PENDING')}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                historyFilterStatus === 'PENDING' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-amber-700'
                              }`}
                            >
                              <Clock size={12} /> Pending ({pendingCount})
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 12-MONTH INTERACTIVE GRID / TIMELINE */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={13} className="text-indigo-600" />
                            Monthly Calendar Timeline ({historyYear})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Showing {filteredMonthlyList.length} of {selectedYearHistory.length} months • Click to inspect
                          </span>
                        </div>

                        {filteredMonthlyList.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {filteredMonthlyList.map((m: any) => {
                              const isSelected = m.month === targetMonthNum;
                              const isCredited = m.isCredited;

                              return (
                                <button
                                  key={m.month}
                                  onClick={() => setSelectedHistoryMonthNum(m.month)}
                                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-600 ring-2 ring-indigo-600/30 shadow-md scale-[1.02]'
                                      : isCredited
                                      ? 'bg-emerald-50/40 hover:bg-emerald-50/80 border-emerald-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-sm'
                                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/70'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className={`text-xs font-black uppercase block ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                                        {m.monthShort}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                                        {historyYear}
                                      </span>
                                    </div>
                                    {isCredited ? (
                                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                                        <CheckCircle2 size={12} />
                                      </span>
                                    ) : (
                                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold shrink-0">
                                        <Clock size={11} />
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-slate-200/40">
                                    <span className={`text-[10px] font-extrabold uppercase block tracking-tight ${
                                      isCredited ? 'text-emerald-700' : 'text-slate-400'
                                    }`}>
                                      {isCredited ? '✔ Credited' : m.statusLabel}
                                    </span>
                                    <span className={`font-mono font-black text-xs block mt-0.5 ${
                                      isCredited ? 'text-emerald-950' : 'text-slate-600'
                                    }`}>
                                      ₹{Number(m.netAmount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                            No months match the selected filter for {historyYear}.
                          </div>
                        )}
                      </div>

                      {/* SELECTED MONTH LIVE CREDIT INSPECTOR & BREAKDOWN CARD */}
                      <div className="p-6 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/40 rounded-2xl border-2 border-indigo-100 shadow-xs space-y-5 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-indigo-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                                Inspected Period
                              </span>
                              <h4 className="text-base font-black text-slate-900">
                                {selectedMonthData.monthName} {historyYear} Salary Disbursal Record
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Comprehensive payment confirmation, bank remittance references, and verified deductions
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedMonthData.isCredited ? (
                              <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                SALARY CREDITED & TRANSFERRED
                              </span>
                            ) : (
                              <span className="px-3.5 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs">
                                <Clock size={14} className="text-amber-600" />
                                {selectedMonthData.statusLabel || 'SALARY PENDING DISBURSAL'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* STATUS CALLOUT & BANK REMITTANCE DATA */}
                        {selectedMonthData.isCredited ? (
                          <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Transferred Amount</span>
                              <span className="font-mono font-black text-lg text-emerald-950 block mt-0.5">
                                ₹{Number(selectedMonthData.netAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-medium">Direct Bank Deposit</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Credited To Bank</span>
                              <span className="font-bold text-slate-900 block mt-0.5">
                                {selectedMonthData.bankName} ({selectedMonthData.bankAccountMasked})
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">IFSC: {selectedMonthData.ifscCode}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Payment Reference</span>
                              <span className="font-mono font-bold text-purple-800 block mt-0.5">
                                {selectedMonthData.paymentReference || 'PAY-REF-PROCESSED'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">Txn: {selectedMonthData.transactionId || 'TXN-BANK-SYNC'}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              {selectedMonthData.hasPayslip && selectedMonthData.payslipId && (
                                <button
                                  onClick={() => setSelectedPayslipModal(payslips.find((p: any) => p.id === selectedMonthData.payslipId) || selectedMonthData)}
                                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <Eye size={13} /> View Statement
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center font-bold shrink-0">
                                <Clock size={20} />
                              </div>
                              <div>
                                <h5 className="font-bold text-amber-900">
                                  Salary Disbursal Not Yet Processed for {selectedMonthData.monthName} {historyYear}
                                </h5>
                                <p className="text-[11px] text-amber-700 mt-0.5">
                                  HR & Finance finalize attendance locks and execute direct bank disbursals at the end of each billing period.
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/60 px-3 py-1.5 rounded-xl self-start md:self-auto shrink-0">
                              Estimated Net: ₹{Number(selectedMonthData.netAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        {/* DETAILED TWO-COLUMN SALARY COMPOSITION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* EARNINGS */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5 text-blue-700">
                                <Banknote size={14} /> Earnings for {selectedMonthData.monthShort} {historyYear}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">Calculated from CTC</span>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-slate-600">
                                <span>Basic Salary (60%):</span>
                                <span className="font-mono font-bold text-slate-900">₹{Number(selectedMonthData.basicSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>House Rent Allowance (HRA 40%):</span>
                                <span className="font-mono font-bold text-slate-900">₹{Number(selectedMonthData.hra).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Special Allowance:</span>
                                <span className="font-mono font-bold text-slate-900">₹{Number(selectedMonthData.specialAllowance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              {Number(selectedMonthData.otPay || 0) > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>Overtime Bonus ({selectedMonthData.otHours} hrs):</span>
                                  <span className="font-mono font-bold">+₹{Number(selectedMonthData.otPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {Number(selectedMonthData.reimbursements || 0) > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>Approved Reimbursements:</span>
                                  <span className="font-mono font-bold">+₹{Number(selectedMonthData.reimbursements).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-2 border-t border-slate-100 font-extrabold text-slate-900">
                                <span>Total Gross Earnings:</span>
                                <span className="font-mono text-indigo-700 text-sm">₹{Number(selectedMonthData.grossAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>

                          {/* DEDUCTIONS */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5 text-rose-700">
                                <ShieldCheck size={14} /> Deductions for {selectedMonthData.monthShort} {historyYear}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">Statutory & Attendance</span>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              {Number(selectedMonthData.lopDeduction || 0) > 0 && (
                                <div className="flex justify-between text-rose-600 font-medium">
                                  <span>Attendance Loss of Pay ({selectedMonthData.lopDays}d LOP):</span>
                                  <span className="font-mono font-bold">-₹{Number(selectedMonthData.lopDeduction).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-600">
                                <span>Employee Provident Fund (EPF 12%):</span>
                                <span className="font-mono font-bold text-rose-600">-₹{Number(selectedMonthData.pfDeduction || 1800).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              {Number(selectedMonthData.esiDeduction || 0) > 0 && (
                                <div className="flex justify-between text-slate-600">
                                  <span>ESI Health Insurance:</span>
                                  <span className="font-mono font-bold text-rose-600">-₹{Number(selectedMonthData.esiDeduction).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-600">
                                <span>Professional Tax (P-Tax):</span>
                                <span className="font-mono font-bold text-rose-600">-₹{Number(selectedMonthData.ptaxDeduction || 200).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              {Number(selectedMonthData.loanEMI || 0) > 0 && (
                                <div className="flex justify-between text-rose-600">
                                  <span>Company Loan Recovery EMI:</span>
                                  <span className="font-mono font-bold">-₹{Number(selectedMonthData.loanEMI).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-2 border-t border-slate-100 font-extrabold text-rose-700">
                                <span>Total Deductions:</span>
                                <span className="font-mono text-rose-700 text-sm">-₹{Number(selectedMonthData.totalDeductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NET TAKE HOME STRIP */}
                        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row justify-between items-center gap-3">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">
                              Net Take-Home Salary for {selectedMonthData.monthName} {historyYear}:
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Formula: Gross Earnings (₹{Number(selectedMonthData.grossAmount).toLocaleString()}) − Total Deductions (₹{Number(selectedMonthData.totalDeductions).toLocaleString()})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black font-mono text-emerald-600">
                              ₹{Number(selectedMonthData.netAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. HISTORICAL PAYSLIPS ARCHIVE TABLE */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <FileText size={18} className="text-emerald-600" />
                        <span>Monthly Salary Payslips Archive</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">Official digitally signed salary statements from PostgreSQL database</p>
                    </div>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200">
                      {payslips.length} Statements Available
                    </span>
                  </div>

                  <div className="space-y-3">
                    {payslips.length > 0 ? (
                      payslips.map((ps: any, idx: number) => {
                        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        const monthName = typeof ps.month === 'number' 
                          ? monthNames[ps.month] 
                          : (!isNaN(Number(ps.month)) ? monthNames[Number(ps.month)] : ps.month);
                        const netAmount = Number(ps.net_pay || ps.netPay || 0);
                        const grossAmount = Number(ps.gross_pay || ps.gross_salary || ps.grossSalary || 0);
                        const deductions = Number(ps.total_deductions || (grossAmount - netAmount));
                        const isPaid = ps.payment_status === 'PAID' || ps.status === 'PAID';

                        return (
                          <div
                            key={ps.id || idx}
                            className="p-5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-all shadow-2xs hover:shadow-md"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {String(monthName || 'AUG').slice(0, 3).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-slate-900 text-sm">{monthName} {ps.year}</h4>
                                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-700">
                                    {ps.id || `PS-${ps.year}-${ps.month}`}
                                  </span>
                                  {isPaid ? (
                                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                                      <CheckCircle2 size={11} className="text-emerald-700" /> SALARY CREDITED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                                      {ps.status || 'Ready'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                                  <span>Gross: <strong className="text-slate-800 font-mono">₹{grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                                  <span>•</span>
                                  <span>Deductions: <strong className="text-rose-600 font-mono">-₹{deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                                  <span>•</span>
                                  <span>LOP: <strong className="text-slate-800">{ps.lop_days || 0} days</strong></span>
                                  {ps.payment_reference && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-[10px] text-purple-700 font-bold">Ref: {ps.payment_reference}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 self-end md:self-auto">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Net Take-Home Pay</span>
                                <span className="font-mono font-black text-lg text-emerald-600 block">
                                  ₹{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <button
                                onClick={() => setSelectedPayslipModal(ps)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                              >
                                <Eye size={14} /> View Payslip
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                        <Banknote size={28} className="text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-600 text-xs">No finalized monthly payslips generated yet.</p>
                        <p className="text-[11px] text-slate-400">Payslips are automatically published once HR finalizes and processes the monthly payroll payment.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. PAYSLIP MODAL VIEWER */}
                {selectedPayslipModal && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-black text-slate-900 text-base">
                            Payslip Statement: {selectedPayslipModal.employee_name || userProfile?.name || 'Employee'}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono">Period: {selectedPayslipModal.month}/{selectedPayslipModal.year} | Ref: {selectedPayslipModal.payment_reference || 'PAY-REF'}</p>
                        </div>
                        <button
                          onClick={() => setSelectedPayslipModal(null)}
                          className="text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-1">
                          <p className="font-bold text-blue-900 uppercase text-[10px] tracking-wider">Earnings Breakdown</p>
                          <div className="flex justify-between"><span>Annual Salary (CTC):</span> <strong className="font-mono">₹{Number(selectedPayslipModal.annual_salary || annualSalary).toLocaleString()}</strong></div>
                          <div className="flex justify-between"><span>Basic Salary (60%):</span> <span className="font-bold font-mono">₹{Number(selectedPayslipModal.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between"><span>House Rent Allowance (HRA):</span> <span className="font-bold font-mono">₹{Number(selectedPayslipModal.hra).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between"><span>Special Allowance:</span> <span className="font-bold font-mono">₹{Number(selectedPayslipModal.special_allowance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          {Number(selectedPayslipModal.reimbursement_amount || 0) > 0 && (
                            <div className="flex justify-between text-emerald-700"><span>Approved Reimbursements:</span> <span className="font-bold font-mono">₹{Number(selectedPayslipModal.reimbursement_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-blue-200 font-extrabold text-slate-900">
                            <span>Gross Total Earnings:</span> <span className="font-mono">₹{Number(selectedPayslipModal.gross_salary || selectedPayslipModal.gross_pay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-1">
                          <p className="font-bold text-rose-900 uppercase text-[10px] tracking-wider">Deductions Breakdown</p>
                          {Number(selectedPayslipModal.lop_amount || 0) > 0 && (
                            <div className="flex justify-between text-rose-600"><span>Loss of Pay (LOP {selectedPayslipModal.lop_days}d):</span> <span className="font-bold font-mono">-₹{Number(selectedPayslipModal.lop_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          )}
                          <div className="flex justify-between"><span>Provident Fund (PF 12%):</span> <span className="text-rose-600 font-bold font-mono">-₹{Number(selectedPayslipModal.pf_deduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between"><span>ESI Health Insurance:</span> <span className="text-rose-600 font-bold font-mono">-₹{Number(selectedPayslipModal.esi_deduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between"><span>Professional Tax (P-Tax):</span> <span className="text-rose-600 font-bold font-mono">-₹{Number(selectedPayslipModal.professional_tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between pt-1 border-t border-rose-200 font-extrabold text-rose-700">
                            <span>Total Deductions:</span> <span className="font-mono">-₹{Number(selectedPayslipModal.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex justify-between items-center text-emerald-900">
                          <div>
                            <span className="font-extrabold text-sm">Net Salary Credited:</span>
                            <div className="text-[10px] text-emerald-700 font-mono">Bank: {selectedPayslipModal.bank_name || 'HDFC Bank'} ({selectedPayslipModal.bank_account || 'XXXX 4521'})</div>
                          </div>
                          <span className="font-black text-lg text-emerald-700 font-mono">₹{Number(selectedPayslipModal.net_pay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                        <button
                          onClick={() => window.open(`/api/payroll/payslip/${selectedPayslipModal.id}/pdf`, '_blank')}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download size={14} /> Download PDF Payslip
                        </button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedPayslipModal(null)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VIEW: EXPENSES - DYNAMIC ENTERPRISE REIMBURSEMENT FLOW */}
          {subSection === 'expenses' && (() => {
            const allExpenses = expensesData || [];
            const totalExpAmount = allExpenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
            const approvedExpAmount = allExpenses
              .filter(ex => (ex.status || '').toUpperCase().includes('APPROV') || (ex.status || '').toUpperCase().includes('FINANCE') || (ex.status || '').toUpperCase().includes('REIMBURS'))
              .reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
            const pendingExpAmount = allExpenses
              .filter(ex => !(ex.status || '').toUpperCase().includes('APPROV') && !(ex.status || '').toUpperCase().includes('FINANCE') && !(ex.status || '').toUpperCase().includes('REIMBURS') && !(ex.status || '').toUpperCase().includes('REJECT'))
              .reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);

            const pendingCount = allExpenses.filter(ex => !(ex.status || '').toUpperCase().includes('APPROV') && !(ex.status || '').toUpperCase().includes('FINANCE') && !(ex.status || '').toUpperCase().includes('REIMBURS') && !(ex.status || '').toUpperCase().includes('REJECT')).length;
            const approvedCount = allExpenses.filter(ex => (ex.status || '').toUpperCase().includes('APPROV') || (ex.status || '').toUpperCase().includes('FINANCE')).length;
            const reimbursedCount = allExpenses.filter(ex => (ex.status || '').toUpperCase().includes('REIMBURS') || (ex.status || '').toUpperCase().includes('PAID')).length;
            const rejectedCount = allExpenses.filter(ex => (ex.status || '').toUpperCase().includes('REJECT')).length;

            const filteredExpenses = allExpenses.filter((ex: any) => {
              const s = (ex.status || '').toUpperCase();
              let matchesStatus = true;
              if (expFilterStatus === 'PENDING') {
                matchesStatus = !s.includes('APPROV') && !s.includes('FINANCE') && !s.includes('REIMBURS') && !s.includes('REJECT');
              } else if (expFilterStatus === 'APPROVED') {
                matchesStatus = s.includes('APPROV') || s.includes('FINANCE');
              } else if (expFilterStatus === 'REIMBURSED') {
                matchesStatus = s.includes('REIMBURS') || s.includes('PAID');
              } else if (expFilterStatus === 'REJECTED') {
                matchesStatus = s.includes('REJECT');
              }

              const matchesCategory =
                expFilterCategory === 'ALL' ||
                (ex.category || '').toLowerCase().includes(expFilterCategory.toLowerCase());

              const q = expSearchQuery.trim().toLowerCase();
              const matchesSearch =
                !q ||
                (ex.category || '').toLowerCase().includes(q) ||
                (ex.description || '').toLowerCase().includes(q) ||
                (ex.vendor || '').toLowerCase().includes(q) ||
                (ex.id || '').toLowerCase().includes(q);

              return matchesStatus && matchesCategory && matchesSearch;
            });

            const getCategoryIcon = (category: string) => {
              const cat = (category || '').toLowerCase();
              if (cat.includes('travel') || cat.includes('flight') || cat.includes('cab')) return <Plane size={15} className="text-blue-600" />;
              if (cat.includes('food') || cat.includes('dinner') || cat.includes('meal')) return <Utensils size={15} className="text-amber-600" />;
              if (cat.includes('software') || cat.includes('tool') || cat.includes('license')) return <Laptop size={15} className="text-indigo-600" />;
              if (cat.includes('internet') || cat.includes('mobile') || cat.includes('wifi')) return <Wifi size={15} className="text-emerald-600" />;
              if (cat.includes('office') || cat.includes('supplies')) return <ShoppingBag size={15} className="text-purple-600" />;
              if (cat.includes('hotel') || cat.includes('stay')) return <Building size={15} className="text-rose-600" />;
              if (cat.includes('medical') || cat.includes('health')) return <Heart size={15} className="text-red-600" />;
              if (cat.includes('training') || cat.includes('cert')) return <Award size={15} className="text-teal-600" />;
              return <Receipt size={15} className="text-slate-600" />;
            };

            const getExpenseStatusBadge = (status: string) => {
              const s = (status || '').toUpperCase();
              if (s.includes('APPROV') || s.includes('FINANCE')) {
                return (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 size={11} className="text-emerald-600" /> FINANCE APPROVED
                  </span>
                );
              }
              if (s.includes('REIMBURSED') || s.includes('PAID')) {
                return (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 shadow-2xs">
                    <Banknote size={11} className="text-blue-600" /> REIMBURSED
                  </span>
                );
              }
              if (s.includes('REJECT')) {
                return (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
                    <X size={11} className="text-rose-600" /> REJECTED
                  </span>
                );
              }
              return (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 shadow-2xs">
                  <Clock size={11} className="text-amber-600 animate-pulse" /> PENDING REVIEW
                </span>
              );
            };

            return (
              <div className="space-y-6 animate-fade-in">
                {/* 1. DYNAMIC EXPENSE KPI SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Claimed */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                      <Receipt size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Claims</p>
                      <h4 className="text-xl font-black text-slate-900 mt-0.5">₹{totalExpAmount.toLocaleString()}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{allExpenses.length} Claims Logged</p>
                    </div>
                  </div>

                  {/* Card 2: Approved & Reimbursed */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved / Paid</p>
                      <h4 className="text-xl font-black text-emerald-600 mt-0.5">₹{approvedExpAmount.toLocaleString()}</h4>
                      <p className="text-[11px] text-emerald-700 font-medium">{approvedCount + reimbursedCount} Claims Settled</p>
                    </div>
                  </div>

                  {/* Card 3: Pending Review */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                      <Clock size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
                      <h4 className="text-xl font-black text-amber-600 mt-0.5">₹{pendingExpAmount.toLocaleString()}</h4>
                      <p className="text-[11px] text-amber-700 font-medium">{pendingCount} Awaiting Sign-off</p>
                    </div>
                  </div>

                  {/* Card 4: Monthly Cap & Policy */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reimbursement Cap</p>
                      <h4 className="text-xl font-black text-slate-900 mt-0.5">₹50,000</h4>
                      <p className="text-[11px] text-purple-700 font-medium">Auto-synced with Payroll</p>
                    </div>
                  </div>
                </div>

                {/* Success Notification Alert */}
                {expSuccessMsg && (
                  <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-extrabold flex items-center justify-between shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span>{expSuccessMsg}</span>
                    </div>
                    <button onClick={() => setExpSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* 2. MAIN 2-COLUMN WORKFLOW */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT COLUMN: SUBMIT REIMBURSEMENT CLAIM FORM (5 Cols) */}
                  <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                          <Plus size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Submit Reimbursement Claim</h3>
                          <p className="text-[11px] text-slate-500">Fast-track financial sign-off for corporate expenses</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleApplyExpense} className="space-y-4 text-xs">
                      {/* Category Selection */}
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Expense Category *</label>
                        <select
                          value={expCategory}
                          onChange={e => setExpCategory(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                        >
                          <option value="Travel & Conveyance">✈️ Travel & Conveyance (Flights, Cabs, Fuel)</option>
                          <option value="Food & Client Entertainment">🍽️ Food & Client Entertainment (Meals, Dinners)</option>
                          <option value="Software & Cloud Subscriptions">💻 Software & Subscriptions (AWS, Licenses)</option>
                          <option value="Internet & Home Office">📶 Internet & WFH Utilities (Broadband, Mobile)</option>
                          <option value="Office Supplies & Stationery">📦 Office Supplies & Equipment</option>
                          <option value="Hotel & Accommodation">🏨 Hotel & Lodging</option>
                          <option value="Training & Certifications">🎓 Professional Training & Exams</option>
                          <option value="Medical & Health">🩺 Medical & Health Expenses</option>
                          <option value="Other Business Expense">📋 Other Business Expenses</option>
                        </select>
                      </div>

                      {/* Amount & Date in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">Amount (₹) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={expAmount}
                              onChange={e => setExpAmount(e.target.value)}
                              required
                              min="1"
                              placeholder="2500"
                              className="w-full pl-7 pr-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">Expense Date *</label>
                          <input
                            type="date"
                            value={expDate}
                            onChange={e => setExpDate(e.target.value)}
                            required
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Merchant & Payment Mode */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">Vendor / Merchant</label>
                          <input
                            type="text"
                            value={expVendor}
                            onChange={e => setExpVendor(e.target.value)}
                            placeholder="e.g. Uber, AWS, Starbucks"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-extrabold text-slate-700 block mb-1">Payment Mode</label>
                          <select
                            value={expPaymentMode}
                            onChange={e => setExpPaymentMode(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                          >
                            <option>Personal Credit Card</option>
                            <option>UPI / NetBanking</option>
                            <option>Cash / Personal Debit</option>
                            <option>Corporate Credit Card</option>
                          </select>
                        </div>
                      </div>

                      {/* Business Description / Purpose */}
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Business Purpose & Details *</label>
                        <textarea
                          value={expDescription}
                          onChange={e => setExpDescription(e.target.value)}
                          required
                          rows={3}
                          placeholder="Describe the reason for this expense and business justification..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* Receipt & Proof Attachment Zone */}
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">Proof of Expense / Bill Receipt</label>
                        {expReceiptName ? (
                          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip size={16} className="text-blue-600 shrink-0" />
                              <span className="font-bold text-blue-900 text-xs truncate">{expReceiptName}</span>
                              <span className="text-[10px] text-blue-600 font-mono">(Ready)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setExpReceiptName(null); setExpReceiptUrl(''); }}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Remove Receipt"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-500 rounded-2xl text-center space-y-1.5 transition-colors">
                            <div className="flex justify-center items-center gap-2 text-slate-500">
                              <UploadCloud size={20} className="text-blue-500" />
                              <span className="font-bold text-xs text-slate-700">Upload Receipt / Tax Invoice</span>
                            </div>
                            <p className="text-[11px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
                            <div className="flex justify-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpReceiptName('tax-invoice-receipt.pdf');
                                  setExpReceiptUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80');
                                }}
                                className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors"
                              >
                                + Attach Sample Bill
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingExp}
                        className="w-full py-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isSubmittingExp ? (
                          <>
                            <RefreshCw size={15} className="animate-spin" /> Submitting Claim...
                          </>
                        ) : (
                          <>
                            <Receipt size={15} /> Submit Claim to Finance
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* RIGHT COLUMN: INTERACTIVE EXPENSE CLAIMS REPOSITORY (7 Cols) */}
                  <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col">
                    {/* Header & Filter Controls */}
                    <div className="pb-3 border-b border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">My Expense Claims History</h3>
                          <p className="text-[11px] text-slate-500">Live track approval status and settlement vouchers</p>
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[200px]">
                          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={expSearchQuery}
                            onChange={e => setExpSearchQuery(e.target.value)}
                            placeholder="Search by vendor, purpose, ID..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Status Filter Tabs */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { id: 'ALL', label: `All Claims (${allExpenses.length})` },
                          { id: 'PENDING', label: `Pending (${pendingCount})` },
                          { id: 'APPROVED', label: `Approved (${approvedCount})` },
                          { id: 'REIMBURSED', label: `Reimbursed (${reimbursedCount})` },
                          { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setExpFilterStatus(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              expFilterStatus === tab.id
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Claims List View */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                      {filteredExpenses.length === 0 ? (
                        <div className="p-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <Receipt size={24} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm">No Matching Expense Claims</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {expSearchQuery || expFilterStatus !== 'ALL'
                                ? 'Try adjusting your search query or status filter.'
                                : 'You have not submitted any expense claims yet.'}
                            </p>
                          </div>
                          {(expSearchQuery || expFilterStatus !== 'ALL') && (
                            <button
                              type="button"
                              onClick={() => { setExpSearchQuery(''); setExpFilterStatus('ALL'); }}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer shadow-xs"
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredExpenses.map((ex: any, idx: number) => {
                          const claimId = ex.id || `EXP-${idx + 1001}`;
                          const formattedDate = ex.claim_date || ex.created_at ? (ex.claim_date || ex.created_at).split('T')[0] : '2026-08-24';
                          const vendor = ex.vendor || (ex.category === 'Software' ? 'JetBrains / GitHub' : ex.category === 'Travel' ? 'Uber India' : 'Direct Merchant');
                          const paymentMode = ex.payment_mode || 'Corporate Transfer';

                          return (
                            <div
                              key={ex.id || idx}
                              className="p-4 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-200 rounded-2xl text-xs space-y-3 transition-all hover:shadow-md group"
                            >
                              {/* Claim Header */}
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                                    {getCategoryIcon(ex.category)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-extrabold text-slate-900 text-sm">{ex.category}</h5>
                                      <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                        {claimId}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                      <span>{vendor}</span>
                                      <span>•</span>
                                      <span className="font-mono">{formattedDate}</span>
                                      <span>•</span>
                                      <span>{paymentMode}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="font-mono font-black text-base text-slate-900 block">
                                    ₹{Number(ex.amount || 0).toLocaleString()}
                                  </span>
                                  <div className="mt-1 flex justify-end">
                                    {getExpenseStatusBadge(ex.status)}
                                  </div>
                                </div>
                              </div>

                              {/* Description Text */}
                              <p className="text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-100">
                                {ex.description || 'Corporate expense reimbursement submitted for verification.'}
                              </p>

                              {/* Footer Action Strip */}
                              <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                                    <Paperclip size={11} /> Bill Verified
                                  </span>
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    Processed for EMP-006
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedExpenseForModal(ex)}
                                    className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                                  >
                                    <Eye size={12} /> View Voucher
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. EXPENSE VOUCHER & RECEIPT DETAIL MODAL */}
                {selectedExpenseForModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative p-6 space-y-4">
                      {/* Modal Header */}
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Receipt size={20} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">Expense Reimbursement Voucher</h3>
                            <p className="font-mono text-xs text-slate-500">
                              Voucher #{selectedExpenseForModal.id || 'EXP-2026-006'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedExpenseForModal(null)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Voucher Meta Strip */}
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Employee</span>
                          <p className="font-extrabold text-slate-900">{selectedExpenseForModal.emp_name || userProfile?.name || 'Hps'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">EMP-006 • Engineering</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Expense Category</span>
                          <p className="font-extrabold text-blue-600">{selectedExpenseForModal.category}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Date: {selectedExpenseForModal.claim_date || '2026-08-24'}</p>
                        </div>
                      </div>

                      {/* Itemized Details */}
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">Vendor / Merchant:</span>
                          <span className="font-extrabold text-slate-900">{selectedExpenseForModal.vendor || 'Direct Merchant'}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">Payment Method:</span>
                          <span className="font-extrabold text-slate-900">{selectedExpenseForModal.payment_mode || 'Corporate Account'}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">Approval Status:</span>
                          <div>{getExpenseStatusBadge(selectedExpenseForModal.status)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold block mb-1">Business Purpose Description:</span>
                          <p className="p-3 bg-slate-50 rounded-xl font-medium text-slate-800 leading-relaxed border border-slate-200/60">
                            {selectedExpenseForModal.description}
                          </p>
                        </div>
                      </div>

                      {/* Total Amount Box */}
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Total Net Reimbursement</span>
                          <p className="text-xs text-emerald-700">Approved for payroll direct disbursement</p>
                        </div>
                        <span className="font-mono font-black text-xl text-emerald-950">
                          ₹{Number(selectedExpenseForModal.amount || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Modal Footer Actions */}
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Printer size={14} /> Print Voucher
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedExpenseForModal(null)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VIEW: TRANSFERS */}
          {subSection === 'transfers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Request Transfer</h3>
                <form onSubmit={handleApplyTransfer} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Requested Department</label>
                    <input type="text" value={transDept} onChange={e => setTransDept(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Requested Branch Location</label>
                    <input type="text" value={transBranch} onChange={e => setTransBranch(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Reason</label>
                    <textarea value={transReason} onChange={e => setTransReason(e.target.value)} required rows={3} placeholder="Reason for transfer request..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <Button variant="primary" size="sm" type="submit" className="w-full">Submit Transfer Request</Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">My Transfer Requests</h3>
                <div className="space-y-3">
                  {transfersData.map((tr: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-600">{tr.requested_department} ({tr.requested_branch})</span>
                        <Badge variant={tr.status === 'APPROVED' ? 'success' : 'warning'}>{tr.status}</Badge>
                      </div>
                      <p className="text-slate-600">{tr.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TASKS & ASSIGNMENT HUB */}
          {subSection === 'tasks' && (() => {
            const allTasks = tasksData || [];

            // Compute KPI Metrics
            const totalCount = allTasks.length;
            const assignedCount = allTasks.filter((t: any) => t.status === 'ASSIGNED' || t.status === 'To Do' || t.status === 'Backlog' || t.status === 'Pending' || t.status === 'ACCEPTED').length;
            const inProgressCount = allTasks.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'In Progress' || t.status === 'BLOCKED' || t.status === 'REOPENED').length;
            const submittedCount = allTasks.filter((t: any) => t.status === 'SUBMITTED' || t.status === 'In Review' || t.status === 'QA').length;
            const completedCount = allTasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'Completed' || t.status === 'Done').length;
            const overdueCount = allTasks.filter((t: any) => t.is_overdue || (t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED' && t.status !== 'Completed')).length;
            const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            // Filter logic
            const filteredTasks = allTasks.filter((t: any) => {
              const matchesSearch = !taskSearchQuery || 
                t.title?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                t.project_name?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                t.category?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                t.tags?.toLowerCase().includes(taskSearchQuery.toLowerCase());

              const matchesPriority = taskPriorityFilter === 'ALL' || t.priority?.toUpperCase() === taskPriorityFilter.toUpperCase();
              const matchesCategory = taskCategoryFilter === 'ALL' || t.category === taskCategoryFilter;

              return matchesSearch && matchesPriority && matchesCategory;
            });

            const kanbanColumns = [
              { id: 'ASSIGNED', label: 'Assigned / Pending', count: assignedCount, bg: 'bg-slate-50/90', border: 'border-slate-200', badgeColor: 'bg-slate-100 text-slate-700' },
              { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount, bg: 'bg-blue-50/50', border: 'border-blue-200', badgeColor: 'bg-blue-100 text-blue-800' },
              { id: 'SUBMITTED', label: 'Submitted (Review)', count: submittedCount, bg: 'bg-purple-50/50', border: 'border-purple-200', badgeColor: 'bg-purple-100 text-purple-800' },
              { id: 'COMPLETED', label: 'Completed', count: completedCount, bg: 'bg-emerald-50/50', border: 'border-emerald-200', badgeColor: 'bg-emerald-100 text-emerald-800' }
            ];

            return (
              <div className="space-y-6 animate-fade-in">
                {/* 1. TOP NOTIFICATION TOAST */}
                {taskSuccessMsg && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/40">
                    <div className="flex items-center gap-2.5 font-bold text-xs">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>{taskSuccessMsg}</span>
                    </div>
                    <button onClick={() => setTaskSuccessMsg(null)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
                  </div>
                )}

                {/* 2. HERO KPI METRICS BANNER */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">My Tasks</span>
                    <h4 className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</h4>
                    <span className="text-[10px] font-semibold text-slate-500">Assigned Total</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending</span>
                    <h4 className="text-2xl font-black text-slate-700 mt-0.5">{assignedCount}</h4>
                    <span className="text-[10px] font-semibold text-slate-500">To be started</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/20">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">In Progress</span>
                    <h4 className="text-2xl font-black text-blue-700 mt-0.5">{inProgressCount}</h4>
                    <span className="text-[10px] font-bold text-blue-600">Active Work</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm bg-purple-50/20">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">Under Review</span>
                    <h4 className="text-2xl font-black text-purple-700 mt-0.5">{submittedCount}</h4>
                    <span className="text-[10px] font-bold text-purple-600">Submitted</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Completed</span>
                    <h4 className="text-2xl font-black text-emerald-700 mt-0.5">{completedCount}</h4>
                    <span className="text-[10px] font-bold text-emerald-600">{completionRate}% Done</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/20">
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">Overdue</span>
                    <h4 className="text-2xl font-black text-rose-700 mt-0.5">{overdueCount}</h4>
                    <span className="text-[10px] font-bold text-rose-600">Attention Required</span>
                  </div>
                </div>

                {/* 3. FILTER & SEARCH CONTROLS */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      value={taskSearchQuery}
                      onChange={e => setTaskSearchQuery(e.target.value)}
                      placeholder="Search my tasks by title, project, tags..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <select
                      value={taskPriorityFilter}
                      onChange={e => setTaskPriorityFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="URGENT">URGENT</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>

                    <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                      <button
                        onClick={() => setTaskViewMode('kanban')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${taskViewMode === 'kanban' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                      >
                        Kanban
                      </button>
                      <button
                        onClick={() => setTaskViewMode('list')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${taskViewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                      >
                        List
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. KANBAN VIEW */}
                {taskViewMode === 'kanban' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kanbanColumns.map(col => {
                      const colTasks = filteredTasks.filter((t: any) => {
                        const s = (t.status || '').toUpperCase();
                        if (col.id === 'ASSIGNED') return s === 'ASSIGNED' || s === 'TO DO' || s === 'PENDING' || s === 'ACCEPTED';
                        if (col.id === 'IN_PROGRESS') return s === 'IN_PROGRESS' || s === 'IN PROGRESS' || s === 'BLOCKED' || s === 'REOPENED';
                        if (col.id === 'SUBMITTED') return s === 'SUBMITTED' || s === 'IN REVIEW' || s === 'QA';
                        if (col.id === 'COMPLETED') return s === 'COMPLETED' || s === 'DONE';
                        return s === col.id;
                      });

                      return (
                        <div key={col.id} className={`${col.bg} rounded-2xl p-3.5 border ${col.border} flex flex-col min-h-[480px]`}>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                            <span className="font-extrabold text-xs text-slate-800">{col.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${col.badgeColor}`}>
                              {colTasks.length}
                            </span>
                          </div>

                          <div className="space-y-3 flex-1 overflow-y-auto">
                            {colTasks.length === 0 ? (
                              <div className="h-32 flex items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl text-slate-400 text-[11px]">
                                No tasks in this column
                              </div>
                            ) : (
                              colTasks.map((t: any) => {
                                const isAssigned = (t.status || '').toUpperCase() === 'ASSIGNED' || (t.status || '').toUpperCase() === 'TO DO';
                                const isInProg = (t.status || '').toUpperCase() === 'IN_PROGRESS' || (t.status || '').toUpperCase() === 'IN PROGRESS' || (t.status || '').toUpperCase() === 'REOPENED' || (t.status || '').toUpperCase() === 'BLOCKED';
                                const isSub = (t.status || '').toUpperCase() === 'SUBMITTED' || (t.status || '').toUpperCase() === 'IN REVIEW';
                                const isDone = (t.status || '').toUpperCase() === 'COMPLETED';

                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => setSelectedTaskDetailModal(t)}
                                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{t.id}</span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                        t.priority === 'URGENT' || t.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                        t.priority === 'HIGH' || t.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {t.priority}
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{t.title}</h4>
                                      <p className="text-[10px] text-slate-400 mt-0.5">{t.project_name || 'ERP Suite'}</p>
                                    </div>

                                    {t.reopened_reason && (
                                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-800 font-medium">
                                        <b>Manager Feedback:</b> {t.reopened_reason}
                                      </div>
                                    )}

                                    {/* Progress Bar */}
                                    <div>
                                      <div className="flex justify-between text-[10px] font-bold mb-1">
                                        <span className="text-slate-500">Progress</span>
                                        <span className={(t.progress_percent || 0) >= 50 ? 'text-emerald-600' : 'text-rose-600'}>
                                          {t.progress_percent || 0}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${(t.progress_percent || 0) >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                          style={{ width: `${t.progress_percent || 0}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Footer Details */}
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                      <span className="font-mono">Due: {t.due_date ? String(t.due_date).split('T')[0] : 'Open'}</span>
                                      <span className="text-slate-600 font-medium">By {t.assigned_by || 'Admin'}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-1 flex gap-1.5">
                                      {isAssigned && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartTask(t.id);
                                          }}
                                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                          ▶ Start Task
                                        </button>
                                      )}

                                      {isInProg && (
                                        <div className="grid grid-cols-2 gap-1.5 w-full">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenProgressModal(t);
                                            }}
                                            className="py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            ⚡ Progress
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenSubmitReviewModal(t);
                                            }}
                                            className="py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            📤 Submit
                                          </button>
                                        </div>
                                      )}

                                      {isSub && (
                                        <span className="w-full py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold text-center block">
                                          ⏳ Awaiting Manager Approval
                                        </span>
                                      )}

                                      {isDone && (
                                        <span className="w-full py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold text-center block">
                                          ✓ Approved & Completed
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* 5. LIST VIEW */
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                    <table className="w-full text-left text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Task ID</th>
                          <th className="p-3.5">Title</th>
                          <th className="p-3.5">Project</th>
                          <th className="p-3.5">Priority</th>
                          <th className="p-3.5">Due Date</th>
                          <th className="p-3.5">Progress</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredTasks.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedTaskDetailModal(t)}>
                            <td className="p-3.5 font-mono text-blue-600 font-bold">{t.id}</td>
                            <td className="p-3.5 font-bold text-slate-900">{t.title}</td>
                            <td className="p-3.5 text-slate-500">{t.project_name || 'General'}</td>
                            <td className="p-3.5 font-extrabold text-[10px]">{t.priority}</td>
                            <td className="p-3.5 font-mono text-[11px]">{t.due_date ? String(t.due_date).split('T')[0] : 'Open'}</td>
                            <td className="p-3.5 font-bold">{t.progress_percent || 0}%</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5" onClick={e => e.stopPropagation()}>
                              {((t.status || '').toUpperCase() === 'ASSIGNED' || (t.status || '').toUpperCase() === 'TO DO') && (
                                <button onClick={() => handleStartTask(t.id)} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold">
                                  Start
                                </button>
                              )}
                              {((t.status || '').toUpperCase() === 'IN_PROGRESS' || (t.status || '').toUpperCase() === 'IN PROGRESS') && (
                                <>
                                  <button onClick={() => handleOpenProgressModal(t)} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
                                    Progress
                                  </button>
                                  <button onClick={() => handleOpenSubmitReviewModal(t)} className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold">
                                    Submit
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* MODAL: UPDATE PROGRESS & NOTES */}
                {showProgressModal && progressUpdateTask && (
                  <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {progressUpdateTask.id}
                          </span>
                          <h3 className="font-black text-slate-900 text-sm mt-1">Update Task Progress</h3>
                        </div>
                        <button onClick={() => setShowProgressModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>

                      <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
                        <div>
                          <p className="font-bold text-slate-800 mb-2">{progressUpdateTask.title}</p>
                          <div className="flex justify-between items-center font-bold text-xs text-blue-600 mb-1">
                            <span>Completion Percentage:</span>
                            <span className="text-base font-black">{newProgressValue}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={newProgressValue}
                            onChange={e => setNewProgressValue(parseInt(e.target.value, 10))}
                            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Progress Note / Milestone Update</label>
                          <textarea
                            rows={3}
                            value={newProgressNote}
                            onChange={e => setNewProgressNote(e.target.value)}
                            placeholder="e.g. Payroll API completed. Payment validation remaining..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowProgressModal(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingTaskProgress}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                          >
                            {isSavingTaskProgress ? 'Updating...' : 'Update Progress'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: SUBMIT FOR REVIEW */}
                {showSubmitReviewModal && submitReviewTask && (
                  <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                            {submitReviewTask.id}
                          </span>
                          <h3 className="font-black text-slate-900 text-sm mt-1">Submit Task for Manager Review</h3>
                        </div>
                        <button onClick={() => setShowSubmitReviewModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>

                      <form onSubmit={handleConfirmSubmitReview} className="space-y-4 text-xs">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <p className="font-bold text-purple-950">{submitReviewTask.title}</p>
                          <p className="text-[11px] text-purple-700 mt-0.5">Assigned by {submitReviewTask.assigned_by || 'Admin'}</p>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Actual Hours Spent</label>
                          <input
                            type="number"
                            step="0.5"
                            value={actualHoursInput}
                            onChange={e => setActualHoursInput(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Completion Note / Result Deliverable</label>
                          <textarea
                            rows={3}
                            required
                            value={completionNoteInput}
                            onChange={e => setCompletionNoteInput(e.target.value)}
                            placeholder="Provide summary of work completed, PR link, or test results..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowSubmitReviewModal(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingTaskProgress}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-500/20"
                          >
                            {isSavingTaskProgress ? 'Submitting...' : 'Submit Deliverable'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: TASK DETAIL & TIMELINE */}
                {selectedTaskDetailModal && (
                  <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {selectedTaskDetailModal.id}
                          </span>
                          <h3 className="font-black text-slate-900 text-base mt-1">
                            {selectedTaskDetailModal.title}
                          </h3>
                        </div>
                        <button onClick={() => setSelectedTaskDetailModal(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
                      </div>

                      <div className="space-y-3 text-xs">
                        {/* Project & Module Badge Box */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Project</span>
                            <span className="font-extrabold text-slate-900">{selectedTaskDetailModal.project_name || 'ERP Core Suite'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Module</span>
                            <span className="font-extrabold text-blue-700">{selectedTaskDetailModal.module_name || 'Core Module'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Deliverable</span>
                            <span className="font-bold text-purple-700">{selectedTaskDetailModal.deliverable_type || 'Full-Stack Implementation'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Deadline</span>
                            <span className="font-mono font-bold text-rose-600">{selectedTaskDetailModal.due_date ? String(selectedTaskDetailModal.due_date).split('T')[0] : 'Open'}</span>
                          </div>
                        </div>

                        {/* Task Documents & Attachments */}
                        {selectedTaskDetailModal.attachments && selectedTaskDetailModal.attachments.length > 0 ? (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Task Documents ({selectedTaskDetailModal.attachments.length})</span>
                            {selectedTaskDetailModal.attachments.map((att: any, idx: number) => (
                              <div
                                key={idx}
                                onClick={() =>
                                  setPreviewDocModal({
                                    fileName: att.fileName || att.file_name,
                                    fileUrl: att.fileUrl || att.file_url,
                                    taskTitle: selectedTaskDetailModal.title,
                                    projectName: selectedTaskDetailModal.project_name,
                                    scopeOfWork: selectedTaskDetailModal.description
                                  })
                                }
                                className="flex items-center justify-between p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-2xl text-rose-900 text-xs transition cursor-pointer group shadow-2xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText size={15} className="text-rose-600 shrink-0 group-hover:scale-110 transition" />
                                  <span className="font-bold">Required Spec:</span>
                                  <span className="font-mono truncate">{att.fileName || att.file_name}</span>
                                </div>
                                <span className="px-2.5 py-1 bg-white border border-rose-200 rounded-lg font-bold text-[10px] text-rose-700 shrink-0 flex items-center gap-1 group-hover:bg-rose-600 group-hover:text-white transition shadow-2xs">
                                  <Eye size={11} /> View Spec / PDF Doc
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : selectedTaskDetailModal.pdf_attachment_name ? (
                          <div
                            onClick={() =>
                              setPreviewDocModal({
                                fileName: selectedTaskDetailModal.pdf_attachment_name,
                                fileUrl: selectedTaskDetailModal.pdf_attachment_url,
                                taskTitle: selectedTaskDetailModal.title,
                                projectName: selectedTaskDetailModal.project_name,
                                scopeOfWork: selectedTaskDetailModal.description
                              })
                            }
                            className="flex items-center justify-between p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-2xl text-rose-900 text-xs transition cursor-pointer group shadow-2xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={15} className="text-rose-600 shrink-0 group-hover:scale-110 transition" />
                              <span className="font-bold">Required Spec:</span>
                              <span className="font-mono truncate">{selectedTaskDetailModal.pdf_attachment_name}</span>
                            </div>
                            <span className="px-2.5 py-1 bg-white border border-rose-200 rounded-lg font-bold text-[10px] text-rose-700 shrink-0 flex items-center gap-1 group-hover:bg-rose-600 group-hover:text-white transition shadow-2xs">
                              <Eye size={11} /> View Spec / PDF Doc
                            </span>
                          </div>
                        ) : null}

                        {selectedTaskDetailModal.description && (
                          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-slate-700 space-y-1">
                            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Scope of Work & Requirements</span>
                            <p className="text-xs leading-relaxed">{selectedTaskDetailModal.description}</p>
                          </div>
                        )}

                        {selectedTaskDetailModal.instructions && (
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Instructions & Constraints</span>
                            <p className="text-xs whitespace-pre-line leading-relaxed">{selectedTaskDetailModal.instructions}</p>
                          </div>
                        )}

                        {/* Milestone Checklist */}
                        {selectedTaskDetailModal.checklist && selectedTaskDetailModal.checklist.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Milestone Checklist</span>
                              <span className="text-[10px] font-bold text-blue-600">
                                {selectedTaskDetailModal.checklist.filter((c: any) => c.completed).length} / {selectedTaskDetailModal.checklist.length} Done
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {selectedTaskDetailModal.checklist.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200/80">
                                  <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${item.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {item.completed ? '✓' : (idx + 1)}
                                  </span>
                                  <span className={item.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}>
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedTaskDetailModal.manager_feedback && (
                          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-800">Manager Evaluation & Feedback</span>
                            <p className="text-xs leading-relaxed">{selectedTaskDetailModal.manager_feedback}</p>
                          </div>
                        )}

                        {/* Comments & Collaboration */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <h4 className="font-bold text-slate-900 text-xs">Collaboration & Comments</h4>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={taskCommentInput}
                              onChange={e => setTaskCommentInput(e.target.value)}
                              placeholder="Post a progress update or question..."
                              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTaskComment(selectedTaskDetailModal.id)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-xl font-bold"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedTaskDetailModal(null)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VIEW: EMPLOYEE PERFORMANCE (DYNAMIC DERIVATION) */}
          {subSection === 'performance' && (() => {
            const taskMetrics = performanceData?.taskMetrics || {
              totalAssigned: (tasksData || []).length,
              completed: (tasksData || []).filter((t: any) => t.status === 'COMPLETED' || t.status === 'Completed').length,
              inProgress: (tasksData || []).filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'In Progress').length,
              pending: (tasksData || []).filter((t: any) => t.status === 'ASSIGNED' || t.status === 'To Do').length,
              overdue: (tasksData || []).filter((t: any) => t.is_overdue).length,
              completionRate: (tasksData || []).length > 0 ? Math.round(((tasksData || []).filter((t: any) => t.status === 'COMPLETED' || t.status === 'Completed').length / (tasksData || []).length) * 100) : 0,
              onTimeRate: 88,
              managerRating: performanceData?.manager_rating || 4.8,
              managerFeedback: performanceData?.manager_feedback || 'Consistently delivers reliable output across assigned tasks.'
            };

            const scoringBreakdown = performanceData?.scoringBreakdown || {
              overallScore: Math.min(100, Math.round(taskMetrics.completionRate * 0.4 + taskMetrics.onTimeRate * 0.3 + (taskMetrics.managerRating / 5.0) * 20 + 9)),
              formula: 'Composite weighted model: Completion Rate (40%) + On-Time Rate (30%) + Manager Evaluation (20%) + Complexity (10%).',
              components: [
                { name: 'Task Completion Rate', maxPoints: 40, earnedPoints: Math.round(taskMetrics.completionRate * 0.4), actualValue: `${taskMetrics.completionRate}%` },
                { name: 'On-Time Delivery Rate', maxPoints: 30, earnedPoints: Math.round(taskMetrics.onTimeRate * 0.3), actualValue: `${taskMetrics.onTimeRate}%` },
                { name: 'Manager Review Rating', maxPoints: 20, earnedPoints: Math.round((taskMetrics.managerRating / 5.0) * 20), actualValue: `${taskMetrics.managerRating} / 5.0` },
                { name: 'Task Priority & Complexity', maxPoints: 10, earnedPoints: 9, actualValue: 'High Priority Deliverables' }
              ]
            };

            const trends = performanceData?.monthlyTrends || [
              { month: 'June', year: 2026, assigned: 8, completed: 7, score: 82 },
              { month: 'July', year: 2026, assigned: 12, completed: 11, score: 86 },
              { month: 'August', year: 2026, assigned: taskMetrics.totalAssigned || 15, completed: taskMetrics.completed || 13, score: scoringBreakdown.overallScore }
            ];

            return (
              <div className="space-y-6 animate-fade-in">
                {/* 1. HERO COMPOSITE PERFORMANCE BANNER */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                      <Sparkles size={13} /> Derived from PostgreSQL Task Records
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      My Performance Scorecard & Evaluation
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xl">
                      Transparent scoring derived mathematically from actual task assignments, completion rates, deadline precision, and manager quality sign-offs.
                    </p>
                  </div>

                  <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-3xl text-white text-center shadow-lg shadow-blue-600/25 min-w-[180px]">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 block">Overall Score</span>
                    <h3 className="text-4xl font-black mt-0.5">{scoringBreakdown.overallScore}%</h3>
                    <p className="text-[10px] text-blue-100 font-bold mt-1">Excellent Performance</p>
                  </div>
                </div>

                {/* 2. TASK DERIVED KPI METRICS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Tasks</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{taskMetrics.totalAssigned}</p>
                    <span className="text-[10px] font-bold text-slate-500">Registry Total</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Completed</span>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{taskMetrics.completed}</p>
                    <span className="text-[10px] font-bold text-emerald-600">{taskMetrics.completionRate}% Rate</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">On-Time Rate</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">{taskMetrics.onTimeRate}%</p>
                    <span className="text-[10px] font-bold text-blue-600">SLA Met</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">In Progress</span>
                    <p className="text-2xl font-black text-slate-700 mt-1">{taskMetrics.inProgress}</p>
                    <span className="text-[10px] font-semibold text-slate-500">Active</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">Overdue</span>
                    <p className="text-2xl font-black text-rose-700 mt-1">{taskMetrics.overdue}</p>
                    <span className="text-[10px] font-bold text-rose-600">Delayed</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs bg-purple-50/20">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">Manager Rating</span>
                    <p className="text-2xl font-black text-purple-700 mt-1">{taskMetrics.managerRating} <span className="text-xs text-purple-400 font-normal">/ 5.0</span></p>
                    <span className="text-[10px] font-bold text-purple-600">Quality Score</span>
                  </div>
                </div>

                {/* 3. TRANSPARENT SCORING COMPONENT BREAKDOWN */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Mathematical Score Formula Breakdown</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{scoringBreakdown.formula}</p>
                    </div>
                    <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                      {scoringBreakdown.overallScore} / 100 Points
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {(scoringBreakdown.components || []).map((c: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-extrabold text-slate-700">{c.name}</span>
                          <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md">
                            {c.earnedPoints} / {c.maxPoints} pts
                          </span>
                        </div>
                        <p className="text-base font-black text-slate-900">{c.actualValue}</p>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, (c.earnedPoints / c.maxPoints) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. PERFORMANCE TRENDS & MANAGER REVIEW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Trend Cards */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 size={16} className="text-blue-600" /> Historical Performance Trends
                    </h3>
                    <div className="space-y-3">
                      {trends.map((tr: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">{tr.month} {tr.year}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{tr.assigned} Tasks Assigned • {tr.completed} Completed</p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-blue-600">{tr.score}%</span>
                            <span className="text-[10px] font-bold text-slate-400 block">Performance</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manager Feedback Card */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <UserCheck size={16} className="text-purple-600" /> Manager Evaluation & Sign-off
                    </h3>
                    <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-purple-900">Current Evaluation Rating:</span>
                        <span className="font-black text-sm text-purple-700">{taskMetrics.managerRating} / 5.0 ⭐</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block mb-1">Manager Feedback:</span>
                        <p className="p-3 bg-white rounded-xl text-slate-800 italic leading-relaxed border border-purple-100 font-medium">
                          "{taskMetrics.managerFeedback}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: HR REQUESTS */}
          {subSection === 'hr-requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Submit HR Request</h3>
                <form onSubmit={handleHRRequestSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Request Type</label>
                    <select value={hrReqType} onChange={e => setHrReqType(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <option value="Employment Verification Letter">Employment Verification Letter</option>
                      <option value="Address Change Request">Address Change Request</option>
                      <option value="Bank Account Detail Change">Bank Account Detail Change</option>
                      <option value="ID Card Replacement">ID Card Replacement</option>
                      <option value="HR Query / Help">HR Query / Help</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Description / Details</label>
                    <textarea value={hrReqDesc} onChange={e => setHrReqDesc(e.target.value)} required rows={3} placeholder="Provide details..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <Button variant="primary" size="sm" type="submit" className="w-full">Submit HR Request</Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">My Submitted HR Requests</h3>
                <div className="space-y-3">
                  {hrRequestsData.length > 0 ? (
                    hrRequestsData.map((h: any) => (
                      <div key={h.id} className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-indigo-600 font-mono">{h.id}</span>
                          <Badge variant={h.status === 'COMPLETED' ? 'success' : 'warning'}>{h.status}</Badge>
                        </div>
                        <p className="font-extrabold text-slate-900">{h.request_type}</p>
                        <p className="text-slate-500">{h.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">No HR requests submitted yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MY PROFILE - ENTERPRISE MASTER PROFILE */}
          {subSection === 'profile' && (() => {
            const activeEmpCode = (userProfile?.empCode && userProfile.empCode !== 'usr_1') ? userProfile.empCode : (currentEmpId || 'EMP-006');
            const matchedEmp: any = (employees || []).find((e: any) => 
              (e.empCode && e.empCode.toLowerCase() === activeEmpCode.toLowerCase()) || 
              (e.id && e.id.toLowerCase() === activeEmpCode.toLowerCase()) ||
              (e.email && userProfile?.email && e.email.toLowerCase() === userProfile.email.toLowerCase()) ||
              (e.name && userProfile?.name && e.name.toLowerCase() === userProfile.name.toLowerCase())
            ) || {};

            const resolvedName = profileData?.personal?.name || userProfile?.name || matchedEmp.name || 'Ashok';
            const resolvedEmpCode = profileData?.personal?.empCode || matchedEmp.empCode || matchedEmp.id || activeEmpCode;
            const resolvedEmail = profileData?.personal?.email || userProfile?.email || matchedEmp.email || 'ashok@company.com';
            const resolvedDept = profileData?.organization?.department || userProfile?.department || matchedEmp.department || 'Product Management';
            const resolvedDesignation = profileData?.organization?.designation || userProfile?.roleTitle || matchedEmp.designation || 'Product Manager';
            const resolvedManager = profileData?.organization?.reportingManager || matchedEmp.reportingManagerName || matchedEmp.manager || 'HR Operations Lead';
            const resolvedBranch = profileData?.organization?.branch || userProfile?.branch || matchedEmp.branch || 'Headquarters (HQ) - Bengaluru Tech Hub';
            const resolvedPhone = profileData?.personal?.phone || (userProfile as any)?.phone || matchedEmp.phone || '+91 98765 43210';
            const resolvedGender = profileData?.personal?.gender || matchedEmp.gender || 'Male';
            const resolvedJoiningDate = profileData?.personal?.joiningDate 
              ? profileData.personal.joiningDate.split('T')[0] 
              : (matchedEmp.joiningDate ? matchedEmp.joiningDate.split('T')[0] : '2024-03-15');
            const resolvedEmploymentType = profileData?.personal?.employmentType || matchedEmp.employmentType || 'Full-Time Permanent';
            const resolvedStatus = profileData?.personal?.status || (matchedEmp.status ? `${matchedEmp.status}` : 'Confirmed');

            const resolvedPersonalEmail = resolvedEmail.includes('@') && !resolvedEmail.includes('gmail.com') 
              ? `${resolvedName.toLowerCase().replace(/\s+/g, '.')}@gmail.com` 
              : (resolvedEmail.includes('company.com') ? resolvedEmail.replace('company.com', 'gmail.com') : `${resolvedName.toLowerCase().replace(/\s+/g, '.')}@personal.me`);

            const knownAvatars: Record<string, string> = {
              'EMP-006': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              'EMP-001': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
              'EMP-008': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
              'EMP-005': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
              'EMP-002': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
              'EMP-003': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
              'EMP-004': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
            };

            const resolvedAvatar = (userProfile?.avatar && userProfile.avatar.length > 10) 
              ? userProfile.avatar 
              : (matchedEmp.avatar || knownAvatars[resolvedEmpCode] || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=1e3a8a&color=fff&size=200&bold=true`);

            return (
              <div className="space-y-6">
                {/* 1. HERO PROFILE CARD & COVER */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Decorative Banner Background */}
                  <div className="h-32 sm:h-36 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 relative p-4 sm:p-6 flex items-start justify-between">
                    <div className="flex items-center gap-2 text-white/90 text-xs font-bold bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>Corporate Master Employee Record</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditProfile(
                          resolvedName,
                          resolvedEmail,
                          resolvedPhone,
                          resolvedGender,
                          resolvedAvatar,
                          resolvedDept,
                          resolvedDesignation,
                          resolvedPersonalEmail,
                          profileData?.bankAndStatutory?.bankAccount,
                          profileData?.bankAndStatutory?.ifscCode,
                          profileData?.bankAndStatutory?.panNumber,
                          profileData?.bankAndStatutory?.uanNumber
                        )}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-blue-400/40"
                      >
                        <Pencil size={13} /> Edit Profile
                      </button>
                      <button
                        onClick={() => setShowIdCardModal(true)}
                        className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/20 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <QrCode size={14} /> Digital ID Card
                      </button>
                      <button
                        onClick={() => setShowEditReqModal(true)}
                        className="px-3.5 py-1.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Settings size={14} /> Request Correction
                      </button>
                    </div>
                  </div>

                  {/* Profile Header Details - Cleanly Separated Below Banner */}
                  <div className="px-6 md:px-8 pb-6 pt-0 bg-white relative">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                      {/* Avatar with Negative Margin and Text Beside It in White Canvas */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="relative group shrink-0 -mt-14">
                          <img
                            src={resolvedAvatar}
                            alt={resolvedName}
                            className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white shadow-xl bg-slate-100"
                          />
                          <button
                            onClick={() => {
                              handleOpenEditProfile(
                                resolvedName,
                                resolvedEmail,
                                resolvedPhone,
                                resolvedGender,
                                resolvedAvatar,
                                resolvedDept,
                                resolvedDesignation,
                                resolvedPersonalEmail,
                                profileData?.bankAndStatutory?.bankAccount,
                                profileData?.bankAndStatutory?.ifscCode,
                                profileData?.bankAndStatutory?.panNumber,
                                profileData?.bankAndStatutory?.uanNumber
                              );
                              setEditModalTab('personal');
                            }}
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 ring-2 ring-white flex items-center justify-center text-white cursor-pointer shadow-md transition-transform active:scale-95"
                            title="Change Profile Photo"
                          >
                            <Camera size={13} />
                          </button>
                        </div>

                        {/* Name & Role details cleanly on white background */}
                        <div className="space-y-1.5 pt-2 sm:pt-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{resolvedName}</h2>
                            <button
                              onClick={() => {
                                handleOpenEditProfile(
                                  resolvedName,
                                  resolvedEmail,
                                  resolvedPhone,
                                  resolvedGender,
                                  resolvedAvatar,
                                  resolvedDept,
                                  resolvedDesignation,
                                  resolvedPersonalEmail,
                                  profileData?.bankAndStatutory?.bankAccount,
                                  profileData?.bankAndStatutory?.ifscCode,
                                  profileData?.bankAndStatutory?.panNumber,
                                  profileData?.bankAndStatutory?.uanNumber
                                );
                                setEditModalTab('personal');
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                              title="Edit Basic Info"
                            >
                              <Pencil size={13} />
                            </button>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                              {resolvedStatus}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Sparkles size={10} /> {resolvedEmploymentType}
                            </span>
                          </div>

                          <p className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                            <span>{resolvedDesignation}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[#2563eb]">{resolvedDept}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-0.5">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {resolvedEmpCode}
                              <button
                                onClick={() => copyToClipboard(resolvedEmpCode, 'Emp Code')}
                                className="text-indigo-400 hover:text-indigo-700 ml-1 cursor-pointer"
                                title="Copy Employee Code"
                              >
                                <Copy size={11} />
                              </button>
                            </span>
                            <span className="flex items-center gap-1"><Building2 size={13} className="text-slate-400" /> {resolvedBranch}</span>
                            <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" /> Shift: 09:00 AM - 06:00 PM</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Meta KPI Cards */}
                      <div className="flex flex-wrap gap-2.5 self-start lg:self-center">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 px-4 text-center min-w-[105px]">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</p>
                          <p className="text-xs font-extrabold text-slate-900 mt-0.5">{resolvedJoiningDate}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 px-4 text-center min-w-[105px]">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Balance</p>
                          <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{leaveData?.balance ? `${leaveData.balance} Days` : '18.5 Days'}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 px-4 text-center min-w-[105px]">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Status</p>
                          <p className="text-xs font-extrabold text-blue-600 mt-0.5">Verified</p>
                        </div>
                      </div>
                    </div>

                    {/* Copied notification alert */}
                    {copiedField && (
                      <div className="mt-3 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-emerald-200 w-fit animate-fade-in">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Copied {copiedField} to clipboard!</span>
                      </div>
                    )}

                    {/* Success Save Banner */}
                    {profileSuccessMsg && (
                      <div className="mt-3 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md animate-fade-in">
                        <CheckCircle2 size={16} />
                        <span>{profileSuccessMsg}</span>
                      </div>
                    )}

                    {/* Interactive Profile Tabs */}
                    <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pt-4 scrollbar-none">
                      {[
                        { id: 'overview', label: 'Personal & Contact', icon: User },
                        { id: 'organization', label: 'Organization & Work', icon: Building2 },
                        { id: 'statutory', label: 'Bank & Statutory', icon: CreditCard },
                        { id: 'skills', label: 'Education & Skills', icon: Award },
                        { id: 'assets', label: 'Company Assets & Devices', icon: Laptop },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = profileActiveTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setProfileActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                              isActive
                                ? 'border-[#2563eb] text-[#2563eb] bg-blue-50/50 rounded-t-xl'
                                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            <Icon size={15} className={isActive ? 'text-[#2563eb]' : 'text-slate-400'} />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. TAB VIEW: PERSONAL & CONTACT */}
                {profileActiveTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Primary Contact Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Mail size={16} />
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Contact Information</h4>
                        </div>
                        <button
                          onClick={() => {
                            handleOpenEditProfile(
                              resolvedName,
                              resolvedEmail,
                              resolvedPhone,
                              resolvedGender,
                              resolvedAvatar,
                              resolvedDept,
                              resolvedDesignation,
                              resolvedPersonalEmail,
                              profileData?.bankAndStatutory?.bankAccount,
                              profileData?.bankAndStatutory?.ifscCode,
                              profileData?.bankAndStatutory?.panNumber,
                              profileData?.bankAndStatutory?.uanNumber
                            );
                            setEditModalTab('contact');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Corporate Email:</span>
                          <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5">
                            <span className="truncate">{resolvedEmail}</span>
                            <button onClick={() => copyToClipboard(resolvedEmail, 'Corporate Email')} className="text-slate-400 hover:text-blue-600 cursor-pointer"><Copy size={12} /></button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Personal Email:</span>
                          <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5">
                            <span className="truncate">{resolvedPersonalEmail}</span>
                            <button onClick={() => copyToClipboard(resolvedPersonalEmail, 'Personal Email')} className="text-slate-400 hover:text-blue-600 cursor-pointer"><Copy size={12} /></button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Mobile Phone:</span>
                          <div className="flex items-center justify-between font-bold text-slate-900 mt-0.5">
                            <span>{resolvedPhone}</span>
                            <button onClick={() => copyToClipboard(resolvedPhone, 'Mobile Phone')} className="text-slate-400 hover:text-blue-600 cursor-pointer"><Copy size={12} /></button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Office Extension / Desk VoIP:</span>
                          <p className="font-mono font-bold text-indigo-600 mt-0.5">+1 (555) EXT-4081</p>
                        </div>
                      </div>
                    </div>

                    {/* Demographic & Personal Details */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <User size={16} />
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Personal Demographics</h4>
                        </div>
                        <button
                          onClick={() => {
                            handleOpenEditProfile(
                              resolvedName,
                              resolvedEmail,
                              resolvedPhone,
                              resolvedGender,
                              resolvedAvatar,
                              resolvedDept,
                              resolvedDesignation,
                              resolvedPersonalEmail,
                              profileData?.bankAndStatutory?.bankAccount,
                              profileData?.bankAndStatutory?.ifscCode,
                              profileData?.bankAndStatutory?.panNumber,
                              profileData?.bankAndStatutory?.uanNumber
                            );
                            setEditModalTab('personal');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Gender:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{resolvedGender}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Blood Group:</span>
                          <p className="font-extrabold text-rose-600 mt-0.5 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> O+ (Positive)
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Date of Birth:</span>
                          <p className="font-bold text-slate-900 mt-0.5">1994-08-24 (Age: 31)</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Marital Status:</span>
                          <p className="font-bold text-slate-900 mt-0.5">Married</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block font-bold text-[11px]">Nationality & Residency:</span>
                          <p className="font-bold text-slate-900 mt-0.5">Resident Citizen</p>
                        </div>
                      </div>
                    </div>

                    {/* Address & Emergency Contact */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                            <Heart size={16} />
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Address & Emergency</h4>
                        </div>
                        <button
                          onClick={() => {
                            handleOpenEditProfile(
                              resolvedName,
                              resolvedEmail,
                              resolvedPhone,
                              resolvedGender,
                              resolvedAvatar,
                              resolvedDept,
                              resolvedDesignation,
                              resolvedPersonalEmail,
                              profileData?.bankAndStatutory?.bankAccount,
                              profileData?.bankAndStatutory?.ifscCode,
                              profileData?.bankAndStatutory?.panNumber,
                              profileData?.bankAndStatutory?.uanNumber
                            );
                            setEditModalTab('contact');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Current Residential Address:</span>
                          <p className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                            {profileEditForm.address || '#402, Skyline Residency, Cyber Gateway Road, Bengaluru - 560100'}
                          </p>
                        </div>
                        <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl">
                          <span className="text-rose-800 block font-extrabold text-[11px] uppercase tracking-wide flex items-center gap-1">
                            <HeartHandshake size={13} /> Emergency Primary Contact
                          </span>
                          <p className="font-extrabold text-slate-900 mt-1">{profileEditForm.emergencyContactName || `${resolvedName}'s Family Member`}</p>
                          <p className="font-bold text-rose-700 font-mono mt-0.5">{profileEditForm.emergencyContactPhone || '+91 98450 11223'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TAB VIEW: ORGANIZATION & WORK */}
                {profileActiveTab === 'organization' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Employment Details */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <Briefcase size={16} />
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Employment Specification</h4>
                        </div>
                        <button
                          onClick={() => {
                            handleOpenEditProfile(
                              resolvedName,
                              resolvedEmail,
                              resolvedPhone,
                              resolvedGender,
                              resolvedAvatar,
                              resolvedDept,
                              resolvedDesignation,
                              resolvedPersonalEmail,
                              profileData?.bankAndStatutory?.bankAccount,
                              profileData?.bankAndStatutory?.ifscCode,
                              profileData?.bankAndStatutory?.panNumber,
                              profileData?.bankAndStatutory?.uanNumber
                            );
                            setEditModalTab('organization');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Job Title / Designation:</span>
                          <p className="font-extrabold text-slate-900 mt-0.5">{resolvedDesignation}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Department:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{resolvedDept}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Corporate Job Level:</span>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                            Level 4 (L4 - Senior Lead Specialist)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Employment Type:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{resolvedEmploymentType}</p>
                        </div>
                      </div>
                    </div>

                    {/* Hierarchy & Reporting Line */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <UserCheckIcon size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Hierarchy & Management</h4>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Direct Reporting Manager</span>
                          <p className="font-extrabold text-slate-900 text-sm">{resolvedManager}</p>
                          <p className="text-[11px] text-slate-500">Department Leadership</p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Assigned HR Business Partner (HRBP)</span>
                          <p className="font-extrabold text-slate-900 text-sm">Priya Sharma</p>
                          <p className="text-[11px] text-slate-500">HR Operations Lead (EMP-003)</p>
                        </div>
                      </div>
                    </div>

                    {/* Work Schedule & Shift Details */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <Clock size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Workplace & Schedule</h4>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Primary Office Branch:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{resolvedBranch}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Desk Location & Pod:</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">Floor 4, Engineering Pod C, Desk #412</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Assigned Shift Master:</span>
                          <p className="font-bold text-slate-900 mt-0.5">General Day Shift (09:00 AM - 06:00 PM)</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Work Policy & Notice Period:</span>
                          <p className="font-bold text-slate-900 mt-0.5">Hybrid Work (3 Days On-site) • 60 Days Notice</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. TAB VIEW: BANK & STATUTORY */}
                {profileActiveTab === 'statutory' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Bank Details */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <CreditCard size={16} />
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Payroll Bank Account</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              handleOpenEditProfile(
                                resolvedName,
                                resolvedEmail,
                                resolvedPhone,
                                resolvedGender,
                                resolvedAvatar,
                                resolvedDept,
                                resolvedDesignation,
                                resolvedPersonalEmail,
                                profileData?.bankAndStatutory?.bankAccount,
                                profileData?.bankAndStatutory?.ifscCode,
                                profileData?.bankAndStatutory?.panNumber,
                                profileData?.bankAndStatutory?.uanNumber
                              );
                              setEditModalTab('bank');
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setShowMaskedBank(!showMaskedBank)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                          >
                            {showMaskedBank ? <><Eye size={13} /> Unmask</> : <><EyeOff size={13} /> Mask</>}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Bank Name:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{profileEditForm.bankName || 'HDFC Bank Ltd.'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Account Number:</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">
                            {showMaskedBank ? (profileData?.bankAndStatutory?.bankAccount || 'XXXX-XXXX-2101') : (profileEditForm.bankAccount || '5020008892101')}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">IFSC Code:</span>
                          <p className="font-mono font-bold text-indigo-600 mt-0.5">{profileData?.bankAndStatutory?.ifscCode || profileEditForm.ifscCode || 'HDFC0001234'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Branch:</span>
                          <p className="font-bold text-slate-900 mt-0.5">Koramangala 4th Block Branch</p>
                        </div>
                      </div>
                    </div>

                    {/* Tax & Statutory Identifiers */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <FileText size={16} />
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Tax & Government IDs</h4>
                        </div>
                        <button
                          onClick={() => {
                            handleOpenEditProfile(
                              resolvedName,
                              resolvedEmail,
                              resolvedPhone,
                              resolvedGender,
                              resolvedAvatar,
                              resolvedDept,
                              resolvedDesignation,
                              resolvedPersonalEmail,
                              profileData?.bankAndStatutory?.bankAccount,
                              profileData?.bankAndStatutory?.ifscCode,
                              profileData?.bankAndStatutory?.panNumber,
                              profileData?.bankAndStatutory?.uanNumber
                            );
                            setEditModalTab('bank');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Permanent Account Number (PAN):</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">
                            {showMaskedBank ? (profileData?.bankAndStatutory?.panNumber || 'ABXXXX123F') : (profileEditForm.panNumber || 'ABCDE1234F')}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Aadhaar Number (UIDAI):</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">
                            {showMaskedBank ? 'XXXX-XXXX-8921' : (profileEditForm.aadhaarNumber || '5489-1234-8921')}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Universal Account Number (UAN / EPFO):</span>
                          <p className="font-mono font-bold text-indigo-600 mt-0.5">
                            {showMaskedBank ? (profileData?.bankAndStatutory?.uanNumber || 'XXXX-XXXX-4321') : (profileEditForm.uanNumber || '101234567890')}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">PF Account Number:</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">KN/BNG/0012345/000/004321</p>
                        </div>
                      </div>
                    </div>

                    {/* Insurance & Tax Regime */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                          <ShieldCheck size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Insurance & Tax Regime</h4>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Chosen Income Tax Regime:</span>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            New Tax Regime (Sec 115BAC)
                          </span>
                        </div>
                        <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-purple-800 tracking-wider">Group Medical Cover (GMC)</span>
                          <p className="font-extrabold text-slate-900">ICICI Lombard Corporate Care</p>
                          <p className="text-[11px] text-slate-600 font-mono">Policy: GMC-2025-0042 • Cover: ₹5,00,000</p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Gratuity & Term Life</span>
                          <p className="font-bold text-slate-900">Enrolled (Nominee Registered)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. TAB VIEW: EDUCATION & SKILLS */}
                {profileActiveTab === 'skills' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Education Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <BookOpen size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Educational Qualifications</h4>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded">Post-Graduation (Master's)</span>
                          <h5 className="font-black text-slate-900 text-sm pt-1">Master of Technology (M.Tech) in Computer Science</h5>
                          <p className="text-slate-600 font-bold">National Institute of Technology / Reputed University</p>
                          <p className="text-slate-400 font-mono text-[11px]">2016 – 2018 • Graduated with 8.9 CGPA</p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded">Graduation (Bachelor's)</span>
                          <h5 className="font-black text-slate-900 text-sm pt-1">Bachelor of Technology (B.Tech) in Information Technology</h5>
                          <p className="text-slate-600 font-bold">State Technological University</p>
                          <p className="text-slate-400 font-mono text-[11px]">2012 – 2016 • First Class with Distinction</p>
                        </div>
                      </div>
                    </div>

                    {/* Competencies & Certifications */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Award size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Core Skills & Certifications</h4>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px] mb-2">Verified Professional Skills:</span>
                          <div className="flex flex-wrap gap-2">
                            {['React 18', 'TypeScript', 'Node.js', 'PostgreSQL', 'System Architecture', 'ERP Workflows', 'REST APIs', 'Docker', 'Git / GitHub', 'Tailwind CSS'].map((skill, idx) => (
                              <span key={idx} className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 rounded-xl font-bold border border-slate-200 transition-colors">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 space-y-2">
                          <span className="text-slate-400 block font-bold text-[11px]">Industry Certifications:</span>
                          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="font-extrabold text-slate-900">AWS Certified Solutions Architect</p>
                              <p className="text-[10px] text-emerald-700 font-bold">Issued: Amazon Web Services (Active)</p>
                            </div>
                            <Badge variant="success">Certified</Badge>
                          </div>
                          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="font-extrabold text-slate-900">Certified Scrum Master (CSM)</p>
                              <p className="text-[10px] text-blue-700 font-bold">Issued: Scrum Alliance</p>
                            </div>
                            <Badge variant="info">Certified</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. TAB VIEW: CORPORATE ASSETS */}
                {profileActiveTab === 'assets' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <Laptop size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Primary Workstation</h4>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Laptop</span>
                          <p className="font-extrabold text-slate-900">Apple MacBook Pro 16" (M3 Max)</p>
                          <p className="font-mono text-[11px] text-indigo-600 font-bold">Asset ID: #LAP-2024-006</p>
                          <p className="text-[10px] text-slate-500">Serial: C02G8912MD6R • Warranty Active</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Security Compliance:</span>
                          <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                            <CheckCircle size={14} /> FileVault Encrypted & EDR Monitored
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                          <Key size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Physical Access & Badges</h4>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-purple-700">Corporate NFC Smart Card</span>
                          <p className="font-extrabold text-slate-900">RFID Access Key #NFC-HQ-8821</p>
                          <p className="text-[10px] text-slate-600">Permissions: HQ All Floors & Server Room</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Desk Equipment:</span>
                          <p className="font-medium text-slate-800 mt-0.5">Dell UltraSharp 27" 4K Monitor (Asset #MON-114)</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Shield size={16} />
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Digital Identity & SSO</h4>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">Corporate SSO Identity:</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">{resolvedEmail}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">2-Factor Authentication (2FA):</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                            Enforced (FIDO2 Hardware Key)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[11px]">GitHub Enterprise Account:</span>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">@{resolvedName.toLowerCase().replace(/\s+/g, '-')}-org</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. DIGITAL ID CARD POPUP MODAL */}
                {showIdCardModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-center relative">
                      <button
                        onClick={() => setShowIdCardModal(false)}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer z-10"
                      >
                        <X size={16} />
                      </button>

                      {/* Header of Badge */}
                      <div className="bg-[#1e3a8a] text-white p-6 pb-12 relative">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Hexagon size={20} className="fill-white/20" />
                          <span className="font-extrabold tracking-wider uppercase text-sm">ERP SUITE INC.</span>
                        </div>
                        <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Official Employee Identity Pass</p>
                      </div>

                      {/* Photo on Badge */}
                      <div className="-mt-12 mb-3 relative flex justify-center">
                        <img
                          src={resolvedAvatar}
                          alt={resolvedName}
                          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-xl bg-slate-100"
                        />
                      </div>

                      <div className="px-6 pb-6 space-y-3">
                        <div>
                          <h3 className="text-xl font-black text-slate-900">{resolvedName}</h3>
                          <p className="text-xs font-extrabold text-[#2563eb]">{resolvedDesignation}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{resolvedDept}</p>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex justify-around font-mono">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">EMP ID</span>
                            <span className="font-extrabold text-indigo-700">{resolvedEmpCode}</span>
                          </div>
                          <div className="border-r border-slate-200"></div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">BLOOD GRP</span>
                            <span className="font-extrabold text-rose-600">O+</span>
                          </div>
                          <div className="border-r border-slate-200"></div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold">VALID TILL</span>
                            <span className="font-extrabold text-slate-700">DEC 2028</span>
                          </div>
                        </div>

                        {/* Barcode & Security Hologram Strip */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="h-8 bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_2px,transparent_2px,transparent_4px)] w-48 mx-auto rounded opacity-80 mb-1"></div>
                          <p className="font-mono text-[9px] text-slate-400">AUTH #{resolvedEmpCode}-2026-HQ</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => window.print()}
                            className="flex-1 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                          >
                            <Printer size={14} /> Print Badge
                          </button>
                          <button
                            onClick={() => setShowIdCardModal(false)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. REQUEST PROFILE UPDATE MODAL */}
                {showEditReqModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative p-6 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Settings size={16} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-base">Request Profile Data Correction</h3>
                            <p className="text-[11px] text-slate-500">Official HR ticket submitted to HRBP for verification</p>
                          </div>
                        </div>
                        <button onClick={() => { setShowEditReqModal(false); setEditReqSuccess(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <X size={18} />
                        </button>
                      </div>

                      {editReqSuccess ? (
                        <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                            <Check size={24} strokeWidth={3} />
                          </div>
                          <h4 className="font-extrabold text-emerald-900 text-sm">Request Submitted to HRBP!</h4>
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            Your change request has been recorded under ticket #HR-REQ-{Math.floor(1000 + Math.random() * 9000)}. You will be notified once reviewed.
                          </p>
                          <Button variant="primary" size="sm" onClick={() => { setShowEditReqModal(false); setEditReqSuccess(false); }}>
                            Done
                          </Button>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            setEditReqSuccess(true);
                          }}
                          className="space-y-3.5 text-xs"
                        >
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Select Field Category to Update</label>
                            <select
                              value={editReqField}
                              onChange={(e) => setEditReqField(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                            >
                              <option>Personal Contact / Address Details</option>
                              <option>Bank Account / IFSC Correction</option>
                              <option>Government ID / Tax Regime Correction</option>
                              <option>Emergency Contact Update</option>
                              <option>Education / Skill Certificate Addition</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Describe Requested Changes with Supporting Details</label>
                            <textarea
                              value={editReqNotes}
                              onChange={(e) => setEditReqNotes(e.target.value)}
                              required
                              rows={4}
                              placeholder="Please specify old value vs new value and reason for modification..."
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="submit"
                              className="flex-1 py-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                            >
                              Submit Ticket to HR
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowEditReqModal(false)}
                              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* 9. DIRECT EDIT PROFILE MODAL */}
                {showEditProfileModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
                      {/* Modal Header */}
                      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                            <Pencil size={18} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">Edit Employee Profile</h3>
                            <p className="text-xs text-slate-500 font-medium">Update your employee details, contact info & credentials</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowEditProfileModal(false)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Modal Navigation Tabs */}
                      <div className="flex border-b border-slate-200 px-6 bg-white gap-2 overflow-x-auto scrollbar-none">
                        {[
                          { id: 'personal', label: 'Personal & Photo', icon: User },
                          { id: 'contact', label: 'Contact & Address', icon: Mail },
                          { id: 'organization', label: 'Job & Role', icon: Briefcase },
                          { id: 'bank', label: 'Bank & IDs', icon: CreditCard },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = editModalTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setEditModalTab(tab.id as any)}
                              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                isActive
                                  ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
                                  : 'border-transparent text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              <Icon size={14} />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Modal Body & Form */}
                      <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* TAB 1: PERSONAL & PHOTO */}
                        {editModalTab === 'personal' && (
                          <div className="space-y-4 text-xs">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Full Employee Name *</label>
                              <input
                                type="text"
                                value={profileEditForm.name}
                                onChange={(e) => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                                required
                                placeholder="Enter employee full name"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Profile Photo (Image URL)</label>
                              <div className="flex gap-3 items-center">
                                <img
                                  src={profileEditForm.avatar || resolvedAvatar}
                                  alt="Preview"
                                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/20 bg-slate-100 shrink-0"
                                />
                                <input
                                  type="url"
                                  value={profileEditForm.avatar}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, avatar: e.target.value })}
                                  placeholder="https://images.unsplash.com/... or paste image URL"
                                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none text-xs"
                                />
                              </div>

                              {/* Quick Avatar Presets */}
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-bold">Quick Presets:</span>
                                {[
                                  { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
                                  { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
                                  { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
                                  { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
                                ].map((p, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setProfileEditForm({ ...profileEditForm, avatar: p.url })}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Gender</label>
                                <select
                                  value={profileEditForm.gender}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, gender: e.target.value })}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Non-Binary">Non-Binary</option>
                                  <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                              </div>

                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                                <select
                                  defaultValue="O+ (Positive)"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                                >
                                  <option>O+ (Positive)</option>
                                  <option>O- (Negative)</option>
                                  <option>A+ (Positive)</option>
                                  <option>A- (Negative)</option>
                                  <option>B+ (Positive)</option>
                                  <option>B- (Negative)</option>
                                  <option>AB+ (Positive)</option>
                                  <option>AB- (Negative)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 2: CONTACT & ADDRESS */}
                        {editModalTab === 'contact' && (
                          <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Corporate Email *</label>
                                <input
                                  type="email"
                                  value={profileEditForm.email}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, email: e.target.value })}
                                  required
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Personal Email</label>
                                <input
                                  type="email"
                                  value={profileEditForm.personalEmail}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, personalEmail: e.target.value })}
                                  placeholder="personal@gmail.com"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number *</label>
                              <input
                                type="tel"
                                value={profileEditForm.phone}
                                onChange={(e) => setProfileEditForm({ ...profileEditForm, phone: e.target.value })}
                                required
                                placeholder="+91 98765 43210"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Current Residential Address</label>
                              <textarea
                                rows={2}
                                value={profileEditForm.address}
                                onChange={(e) => setProfileEditForm({ ...profileEditForm, address: e.target.value })}
                                placeholder="House / Flat #, Street, City, State, Pincode"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                              />
                            </div>

                            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                              <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                                <HeartHandshake size={14} /> Emergency Contact Details
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Contact Name & Relation</label>
                                  <input
                                    type="text"
                                    value={profileEditForm.emergencyContactName}
                                    onChange={(e) => setProfileEditForm({ ...profileEditForm, emergencyContactName: e.target.value })}
                                    placeholder="e.g. Ramesh (Father)"
                                    className="w-full p-2 bg-white border border-rose-200 rounded-xl font-medium focus:border-rose-400 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="font-bold text-slate-700 block mb-1">Emergency Phone</label>
                                  <input
                                    type="tel"
                                    value={profileEditForm.emergencyContactPhone}
                                    onChange={(e) => setProfileEditForm({ ...profileEditForm, emergencyContactPhone: e.target.value })}
                                    placeholder="+91 98450 11223"
                                    className="w-full p-2 bg-white border border-rose-200 rounded-xl font-medium focus:border-rose-400 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 3: JOB & ROLE */}
                        {editModalTab === 'organization' && (
                          <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Department</label>
                                <input
                                  type="text"
                                  value={profileEditForm.department}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, department: e.target.value })}
                                  placeholder="e.g. Product Management, Engineering"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Job Title / Designation</label>
                                <input
                                  type="text"
                                  value={profileEditForm.designation}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, designation: e.target.value })}
                                  placeholder="e.g. Senior Full Stack Engineer"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                                />
                              </div>
                            </div>

                            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs space-y-1 text-slate-600">
                              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-blue-600" /> Organization Sync Notice
                              </p>
                              <p className="text-[11px] leading-relaxed">
                                Changes to official corporate grade and reporting line require official HR authorization. Changes saved here will synchronize directly with your ERP employee record.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* TAB 4: BANK & GOVERNMENT IDS */}
                        {editModalTab === 'bank' && (
                          <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                                <input
                                  type="text"
                                  value={profileEditForm.bankName}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, bankName: e.target.value })}
                                  placeholder="HDFC Bank Ltd."
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                                <input
                                  type="text"
                                  value={profileEditForm.bankAccount}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, bankAccount: e.target.value })}
                                  placeholder="5020008892101"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                                <input
                                  type="text"
                                  value={profileEditForm.ifscCode}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, ifscCode: e.target.value })}
                                  placeholder="HDFC0001234"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Permanent Account Number (PAN)</label>
                                <input
                                  type="text"
                                  value={profileEditForm.panNumber}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, panNumber: e.target.value })}
                                  placeholder="ABCDE1234F"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none font-mono uppercase"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Aadhaar Number</label>
                                <input
                                  type="text"
                                  value={profileEditForm.aadhaarNumber}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, aadhaarNumber: e.target.value })}
                                  placeholder="5489-1234-8921"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Universal Account Number (UAN)</label>
                                <input
                                  type="text"
                                  value={profileEditForm.uanNumber}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, uanNumber: e.target.value })}
                                  placeholder="101234567890"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modal Footer Actions */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowEditProfileModal(false)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-extrabold cursor-pointer text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all"
                          >
                            {isSavingProfile ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" /> Saving Changes...
                              </>
                            ) : (
                              <>
                                <Check size={14} /> Save Profile Changes
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VIEW: TIMESHEETS */}
          {subSection === 'timesheets' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Submit Daily Timesheet</h3>
                <form onSubmit={handleTimesheetSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Project Name</label>
                    <input type="text" value={tsProject} onChange={e => setTsProject(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Task Name</label>
                    <input type="text" value={tsTask} onChange={e => setTsTask(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hours Spent</label>
                    <input type="number" value={tsHours} onChange={e => setTsHours(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Description</label>
                    <textarea value={tsDesc} onChange={e => setTsDesc(e.target.value)} required rows={3} placeholder="Work done..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <Button variant="primary" size="sm" type="submit" className="w-full">Submit Timesheet</Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">My Submitted Timesheets</h3>
                <div className="space-y-3">
                  {timesheetsData.map((ts: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{ts.project_name || ts.projectName} - {ts.task_name || ts.taskName}</span>
                        <span className="font-mono font-bold text-blue-600">{ts.hours_spent || ts.hoursSpent} hrs</span>
                      </div>
                      <p className="text-slate-500">{ts.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: NOTIFICATIONS */}
          {subSection === 'notifications' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">ESS Notifications & Feed</h3>
              <div className="space-y-3 text-xs">
                {(dashData?.notifications || []).map((n: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                    <Bell size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {subSection === 'settings' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 max-w-xl">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Portal Settings</h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div>
                    <p className="font-bold text-slate-900">Portal Theme</p>
                    <p className="text-slate-500 text-[11px]">Current: {theme}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle Theme</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div>
                    <p className="font-bold text-slate-900">Account PIN / Password</p>
                    <p className="text-slate-500 text-[11px]">Change security PIN</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => alert('PIN change request submitted to HR.')}>Change PIN</Button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Document / PDF / Image Preview Modal */}
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
