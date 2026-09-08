import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, User, BookOpen, Briefcase, Clock, Calendar, CheckSquare,
  FileText, Award, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Plus,
  DollarSign, MapPin, Building, ShieldCheck, Download, Sparkles, UserCheck,
  Star, MessageSquare, AlertTriangle, ArrowRight, Printer
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface InternDetailPageProps {
  internId: string;
  onBack: () => void;
  onNavigateToEmployee?: (empId: string) => void;
}

export const InternDetailPage: React.FC<InternDetailPageProps> = ({
  internId,
  onBack,
  onNavigateToEmployee
}) => {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'personal'
    | 'academic'
    | 'internship'
    | 'attendance'
    | 'leave'
    | 'tasks'
    | 'documents'
    | 'evaluation'
    | 'certificate'
    | 'conversion'
  >('overview');

  // Interactive Task state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // Interactive Attendance state
  const [attStatusSelect, setAttStatusSelect] = useState('Present');

  // Interactive Leave state
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState('Casual Leave');
  const [newLeaveStart, setNewLeaveStart] = useState(new Date().toISOString().split('T')[0]);
  const [newLeaveEnd, setNewLeaveEnd] = useState(new Date().toISOString().split('T')[0]);
  const [newLeaveReason, setNewLeaveReason] = useState('');

  // Evaluation Form state
  const [evalScores, setEvalScores] = useState({
    technicalSkills: 5,
    communication: 4,
    problemSolving: 5,
    teamwork: 5,
    discipline: 4,
    attendance: 5,
    taskCompletion: 5,
    learningAbility: 5,
    overallPerformance: 5,
  });
  const [mentorComments, setMentorComments] = useState('');
  const [managerComments, setManagerComments] = useState('');
  const [hrComments, setHrComments] = useState('');
  const [recommendation, setRecommendation] = useState('Convert to Employee');

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccessMsg, setConversionSuccessMsg] = useState<string | null>(null);

  const fetchInternDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/interns/${internId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReport(json.data);
        if (json.data.evaluation) {
          const ev = json.data.evaluation;
          setEvalScores({
            technicalSkills: ev.technical_skills || 5,
            communication: ev.communication || 4,
            problemSolving: ev.problem_solving || 5,
            teamwork: ev.teamwork || 5,
            discipline: ev.discipline || 4,
            attendance: ev.attendance || ev.attendance_rating || 5,
            taskCompletion: ev.task_completion || 5,
            learningAbility: ev.learning_ability || 5,
            overallPerformance: ev.overall_performance || 5,
          });
          setMentorComments(ev.mentor_comments || '');
          setManagerComments(ev.manager_comments || '');
          setHrComments(ev.hr_comments || '');
          setRecommendation(ev.recommendation || 'Convert to Employee');
        }
      } else {
        setError(json.message || 'Intern record not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading intern profile.');
    } finally {
      setIsLoading(false);
    }
  }, [internId]);

  useEffect(() => {
    fetchInternDetails();
  }, [fetchInternDetails]);

  // Handle Attendance Action (Punch / Mark)
  const handleMarkAttendance = async (actionType?: 'check-in' | 'check-out', customStatus?: string) => {
    try {
      const res = await fetch(`/api/interns/${internId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          status: customStatus || attStatusSelect,
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchInternDetails();
      } else {
        alert(data.message || 'Failed to update attendance');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch(`/api/interns/${internId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          deadline: newTaskDeadline || undefined,
          assignedBy: report?.intern?.mentor_name || 'Mentor',
          mentorName: report?.intern?.mentor_name || 'Mentor',
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle('');
        setNewTaskDesc('');
        setShowAddTaskModal(false);
        await fetchInternDetails();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string, progress: number) => {
    try {
      await fetch(`/api/interns/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, progress })
      });
      await fetchInternDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Apply Leave
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/interns/${internId}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType: newLeaveType,
          startDate: newLeaveStart,
          endDate: newLeaveEnd,
          days: 1.0,
          reason: newLeaveReason || 'College obligation'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowApplyLeaveModal(false);
        setNewLeaveReason('');
        await fetchInternDetails();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Approve/Reject Leave
  const handleReviewLeave = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch(`/api/interns/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewedBy: report?.intern?.mentor_name || 'Mentor / HR',
          comment: status === 'APPROVED' ? 'Approved by Mentor' : 'Not approved due to project deadline'
        })
      });
      await fetchInternDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Save Evaluation
  const handleSaveEvaluation = async () => {
    try {
      const res = await fetch(`/api/interns/${internId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...evalScores,
          mentorComments,
          managerComments,
          hrComments,
          recommendation,
          evaluatedBy: 'Mentor & HR Review Board'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Evaluation successfully saved! Intern status updated to Completed.');
        await fetchInternDetails();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Generate Certificate
  const handleGenerateCertificate = async () => {
    try {
      const res = await fetch(`/api/interns/${internId}/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization: 'Antigravity Enterprise Solutions Pvt. Ltd.' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Certificate generated successfully!');
        await fetchInternDetails();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Convert to Employee
  const handleConvertToEmployee = async () => {
    if (!window.confirm(`Are you sure you want to convert intern ${report?.intern?.name} into a permanent employee?`)) {
      return;
    }
    setIsConverting(true);
    try {
      const res = await fetch(`/api/interns/${internId}/convert-to-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designation: 'Associate Software Engineer',
          annualSalary: 650000
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConversionSuccessMsg(`Successfully converted! Created Employee ID: ${data.data.employeeId}`);
        await fetchInternDetails();
      } else {
        alert(data.message || 'Conversion failed.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="animate-spin text-purple-600" size={32} />
        <p className="text-xs font-semibold text-slate-500">Loading Intern 360° Profile for {internId}...</p>
      </div>
    );
  }

  if (error || !report || !report.intern) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-4">
        <AlertCircle className="mx-auto text-rose-500" size={40} />
        <h3 className="font-bold text-slate-800 text-base">Error Loading Intern Profile</h3>
        <p className="text-xs text-slate-600">{error || `No record found for ID: ${internId}`}</p>
        <Button onClick={onBack} variant="outline" className="text-xs">
          <ArrowLeft size={14} className="mr-1" /> Back to Intern Directory
        </Button>
      </div>
    );
  }

  const { intern, tasks = [], attendance = [], attendanceStats = {}, leaves = [], evaluation, certificate } = report;
  const isConverted = intern.status === 'Converted' || Boolean(intern.converted_employee_id);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Active': return <Badge variant="success">Active</Badge>;
      case 'Onboarding': return <Badge variant="info">Onboarding</Badge>;
      case 'Upcoming': return <Badge variant="neutral">Upcoming</Badge>;
      case 'Completed': return <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200">Completed</span>;
      case 'Converted': return <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-200">🎓 Converted</span>;
      case 'Terminated': return <Badge variant="danger">Terminated</Badge>;
      default: return <Badge variant="neutral">{st}</Badge>;
    }
  };

  const tabs: Array<{ id: typeof activeTab; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'academic', label: 'Academic Information', icon: BookOpen },
    { id: 'internship', label: 'Internship Details', icon: Briefcase },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'tasks', label: 'Tasks & Projects', icon: CheckSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'evaluation', label: 'Evaluation', icon: Award },
    { id: 'certificate', label: 'Certificate', icon: FileText },
    { id: 'conversion', label: 'Conversion', icon: UserCheck },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Intern Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">HRMS / Interns / {intern.intern_code || intern.id}</span>
          <button
            onClick={fetchInternDetails}
            className="p-1.5 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1"
          >
            <RefreshCw size={14} /> Refresh DB
          </button>
        </div>
      </div>

      {/* Header Banner - Matching Employee Profile Aesthetic */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
              {intern.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{intern.name}</h1>
                <span className="px-2.5 py-0.5 bg-white/10 text-purple-200 border border-white/10 rounded-full text-xs font-mono font-bold">
                  {intern.intern_code || intern.id}
                </span>
                {getStatusBadge(intern.status)}
              </div>
              <p className="text-xs text-purple-200/80 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1"><Briefcase size={12} /> {intern.designation}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Building size={12} /> {intern.department}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><User size={12} /> Mentor: {intern.mentor_name || 'Assigned Mentor'}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Duration: {intern.start_date} to {intern.end_date} ({intern.duration || '6 Months'})</span>
                <span>•</span>
                <span>Stipend: ₹{Number(intern.stipend || 0).toLocaleString()} / mo</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons on Header */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {isConverted ? (
              <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Converted to {intern.converted_employee_id}
              </div>
            ) : (
              (evaluation?.recommendation === 'Convert to Employee' || intern.status === 'Completed') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConvertToEmployee}
                  disabled={isConverting}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <UserCheck size={14} />
                  <span>{isConverting ? 'Converting...' : 'Convert to Employee'}</span>
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('evaluation')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <Award size={14} className="mr-1" /> Evaluation
            </Button>
          </div>
        </div>

        {/* Converted Alert Ribbon if applicable */}
        {isConverted && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
              🎉 Permanent employee onboarding complete. Linked Record: <strong>{intern.converted_employee_id}</strong>
            </span>
            {onNavigateToEmployee && (
              <button
                onClick={() => onNavigateToEmployee(intern.converted_employee_id)}
                className="text-purple-300 hover:text-white underline font-bold flex items-center gap-1"
              >
                View Employee Profile <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {conversionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{conversionSuccessMsg}</span>
          </div>
          {onNavigateToEmployee && (
            <button
              onClick={() => onNavigateToEmployee(intern.converted_employee_id)}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Open Employee Master
            </button>
          )}
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Internship Duration</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{intern.duration || '6 Months'}</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-0.5">{intern.start_date} to {intern.end_date}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Attendance Reliability</p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
                {attendanceStats.attendancePercentage || 100}%
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{attendanceStats.presentDays || 0} days recorded present</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mentor Assigned Tasks</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {tasks.filter((t: any) => t.status === 'Completed').length} / {tasks.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Deliverables completed</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Evaluation Recommendation</p>
              <h3 className="text-base font-bold text-purple-700 mt-1 truncate">
                {evaluation?.recommendation || 'Pending Evaluation'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Rating: {evaluation?.overall_performance || 5} / 5 Stars</p>
            </div>
          </div>

          {/* Two-Column Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Profile Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                <User size={16} className="text-purple-600" /> Intern Profile Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">College / University:</span>
                  <p className="font-bold text-slate-800">{intern.college || 'NIT / University'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Degree & Branch:</span>
                  <p className="font-bold text-slate-800">{intern.degree} ({intern.branch_specialization || intern.branch})</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Work Mode:</span>
                  <p className="font-bold text-slate-800">{intern.work_mode || 'Hybrid'} ({intern.location})</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Monthly Stipend:</span>
                  <p className="font-bold text-slate-800">₹{Number(intern.stipend).toLocaleString()} / month</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Reporting Manager:</span>
                  <p className="font-bold text-slate-800">{intern.reporting_manager_name || 'Sarah Jenkins'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Assigned Mentor:</span>
                  <p className="font-bold text-purple-700">{intern.mentor_name || 'Rahul Verma'}</p>
                </div>
              </div>
            </div>

            {/* Active Deliverables / Tasks */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare size={16} className="text-purple-600" /> Active Mentor Tasks
                </h3>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs text-purple-600 font-bold hover:underline"
                >
                  View All Tasks
                </button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No tasks assigned yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {tasks.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{task.title}</p>
                        <p className="text-[11px] text-slate-500">Deadline: {task.deadline} • Progress: {task.progress_percent || task.progress || 0}%</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <User size={16} className="text-purple-600" /> Personal Information & Legal Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Intern ID</span>
              <p className="font-bold text-slate-900 mt-1">{intern.intern_code || intern.id}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Full Legal Name</span>
              <p className="font-bold text-slate-900 mt-1">{intern.name}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Personal Email</span>
              <p className="font-bold text-slate-900 mt-1">{intern.email}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Phone Number</span>
              <p className="font-bold text-slate-900 mt-1">{intern.phone || '+91 98765 00000'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Date of Birth / Gender</span>
              <p className="font-bold text-slate-900 mt-1">{intern.dob} • {intern.gender}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Emergency Contact</span>
              <p className="font-bold text-slate-900 mt-1">{intern.emergency_contact || 'Parent / Guardian'}</p>
            </div>
            <div className="md:col-span-3 p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Permanent / Residential Address</span>
              <p className="font-bold text-slate-900 mt-1">{intern.address || 'Tech Park Enclave, City'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. ACADEMIC INFORMATION */}
      {activeTab === 'academic' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <BookOpen size={16} className="text-purple-600" /> University & Academic Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2 p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">College / University</span>
              <p className="font-bold text-slate-900 mt-1">{intern.college || 'National Institute of Technology'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Degree Program</span>
              <p className="font-bold text-slate-900 mt-1">{intern.degree || 'B.Tech / B.E.'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Branch / Specialization</span>
              <p className="font-bold text-slate-900 mt-1">{intern.branch_specialization || intern.branch || 'Computer Science'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Graduation Year / Batch</span>
              <p className="font-bold text-slate-900 mt-1">{intern.graduation_year || '2025'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Roll / Registration Number</span>
              <p className="font-bold text-slate-900 mt-1">{intern.roll_number || 'CS2021-089'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Academic CGPA / Percentage</span>
              <p className="font-bold text-purple-700 mt-1">{intern.cgpa_percentage || '8.85 CGPA'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Resume Document</span>
              <p className="font-bold text-slate-900 mt-1">{intern.resume_url || 'candidate_resume.pdf'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. INTERNSHIP DETAILS */}
      {activeTab === 'internship' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Briefcase size={16} className="text-purple-600" /> Internship Role, Compensation & IT Provisioning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Internship Track</span>
              <p className="font-bold text-slate-900 mt-1">{intern.internship_type || 'Full Stack'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Department</span>
              <p className="font-bold text-slate-900 mt-1">{intern.department}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Designation</span>
              <p className="font-bold text-slate-900 mt-1">{intern.designation}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Tenure Dates</span>
              <p className="font-bold text-slate-900 mt-1">{intern.start_date} to {intern.end_date}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Stipend</span>
              <p className="font-bold text-emerald-700 mt-1">₹{Number(intern.stipend || 0).toLocaleString()} / month</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Work Mode & Location</span>
              <p className="font-bold text-slate-900 mt-1">{intern.work_mode || 'Hybrid'} • {intern.location}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Corporate Email</span>
              <p className="font-bold text-slate-900 mt-1">{intern.company_email || `${intern.name.toLowerCase().replace(/\s+/g, '.')}@company.com`}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Laptop / Asset</span>
              <p className="font-bold text-slate-900 mt-1">{intern.assigned_device || 'MacBook Air M2'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Reporting Manager</span>
              <p className="font-bold text-slate-900 mt-1">{intern.reporting_manager_name || 'Sarah Jenkins'}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <span className="text-purple-600 font-semibold uppercase text-[10px]">Assigned Mentor</span>
              <p className="font-bold text-purple-900 mt-1">{intern.mentor_name || 'Rahul Verma'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Punch Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Intern Attendance Management</h3>
                <p className="text-xs text-slate-500">Connected to Intern ID: {intern.intern_code || intern.id}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAttendance('check-in')}
                className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                Check In (Punch)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAttendance('check-out')}
                className="text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50"
              >
                Check Out
              </Button>

              <div className="flex items-center gap-1">
                <select
                  value={attStatusSelect}
                  onChange={(e) => setAttStatusSelect(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Late">Late</option>
                  <option value="Work From Home">Work From Home</option>
                  <option value="Permission">Permission</option>
                  <option value="Overtime">Overtime</option>
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMarkAttendance(undefined, attStatusSelect)}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Save Status
                </Button>
              </div>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wide">
              Attendance Records Log
            </div>
            {attendance.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No attendance records logged yet.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Check In</th>
                    <th className="py-2.5 px-4">Check Out</th>
                    <th className="py-2.5 px-4">Work Hours</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{rec.date}</td>
                      <td className="py-2.5 px-4 text-slate-600">{rec.check_in || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{rec.check_out || '-'}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{rec.worked_hours || rec.work_hours || 0} hrs</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          rec.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                          rec.status === 'Work From Home' ? 'bg-blue-100 text-blue-700' :
                          rec.status === 'Half Day' ? 'bg-amber-100 text-amber-700' :
                          rec.status === 'Late' ? 'bg-orange-100 text-orange-700' :
                          rec.status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{rec.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. LEAVE */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-purple-600" /> Intern Leave & Permission Requests
              </h3>
              <p className="text-xs text-slate-500">Supports Leave request, permission, work from home, and mentor approval.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowApplyLeaveModal(true)}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
            >
              <Plus size={14} /> Apply Leave / WFH
            </Button>
          </div>

          {/* Modal to apply leave */}
          {showApplyLeaveModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
                <h3 className="font-bold text-sm text-slate-900">Request Leave / Permission / WFH</h3>
                <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Type</label>
                    <select
                      value={newLeaveType}
                      onChange={(e) => setNewLeaveType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Permission">Permission (Half-Day / Exam)</option>
                      <option value="Work From Home">Work From Home (WFH)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">From</label>
                      <input
                        type="date"
                        value={newLeaveStart}
                        onChange={(e) => setNewLeaveStart(e.target.value)}
                        className="w-full p-2 bg-slate-50 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">To</label>
                      <input
                        type="date"
                        value={newLeaveEnd}
                        onChange={(e) => setNewLeaveEnd(e.target.value)}
                        className="w-full p-2 bg-slate-50 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Reason</label>
                    <textarea
                      rows={2}
                      value={newLeaveReason}
                      onChange={(e) => setNewLeaveReason(e.target.value)}
                      placeholder="e.g. University internal exam / Personal work"
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => setShowApplyLeaveModal(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" type="submit" className="bg-purple-600 text-white">Submit Request</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Leave History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {leaves.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No leave requests recorded.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Leave Type</th>
                    <th className="py-2.5 px-4">Dates</th>
                    <th className="py-2.5 px-4">Days</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.map((lv: any) => (
                    <tr key={lv.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{lv.leave_type}</td>
                      <td className="py-2.5 px-4 text-slate-600">{lv.start_date} to {lv.end_date}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{lv.days}</td>
                      <td className="py-2.5 px-4 text-slate-500">{lv.reason}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          lv.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          lv.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {lv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {lv.status === 'PENDING' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleReviewLeave(lv.id, 'APPROVED')}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewLeave(lv.id, 'REJECTED')}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. TASKS & PROJECTS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare size={16} className="text-purple-600" /> Mentor & Task Management
              </h3>
              <p className="text-xs text-slate-500">Mentor can assign tasks, set deadlines, track progress, and provide feedback.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddTaskModal(true)}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
            >
              <Plus size={14} /> Assign New Task
            </Button>
          </div>

          {/* Add Task Modal */}
          {showAddTaskModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
                <h3 className="font-bold text-sm text-slate-900">Assign Task to {intern.name}</h3>
                <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Task Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Build API integration tests"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Specify deliverables and acceptance criteria..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Deadline</label>
                    <input
                      type="date"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" type="submit" className="bg-purple-600 text-white">Assign Task</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tasks Grid */}
          <div className="space-y-3">
            {tasks.map((task: any) => (
              <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900">{task.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      task.status === 'Review' ? 'bg-purple-100 text-purple-700' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{task.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Assigned By: {task.assigned_by || task.mentor_name}</span>
                    <span>•</span>
                    <span>Deadline: {task.deadline || 'Flexible'}</span>
                    <span>•</span>
                    <span>Progress: {task.progress_percent || task.progress || 0}%</span>
                  </div>
                  {task.feedback && (
                    <div className="p-2 bg-purple-50 rounded-lg text-[11px] text-purple-800 font-medium">
                      💬 Mentor Feedback: {task.feedback}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => {
                      const newSt = e.target.value;
                      const prog = newSt === 'Completed' ? 100 : newSt === 'Review' ? 90 : newSt === 'In Progress' ? 50 : 0;
                      handleUpdateTaskStatus(task.id, newSt, prog);
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <FileText size={16} className="text-purple-600" /> Documents & Verification Artifacts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {['Resume', 'College ID', 'Government ID', 'Offer / Internship Letter', 'Non-Disclosure Agreement'].map((docName, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{docName}</p>
                    <p className="text-[10px] text-slate-500">Verified & Securely Stored</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Downloading ${docName}...`)}
                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                  title="Download File"
                >
                  <Download size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. EVALUATION */}
      {activeTab === 'evaluation' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award size={16} className="text-purple-600" /> Internship Completion Evaluation
              </h3>
              <p className="text-xs text-slate-500">Evaluate across 9 key performance parameters (1–5 scale), comments, and final recommendation.</p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full">
              Scale 1 (Poor) to 5 (Outstanding)
            </span>
          </div>

          {/* 9 Evaluation Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'technicalSkills', label: 'Technical Skills' },
              { key: 'communication', label: 'Communication' },
              { key: 'problemSolving', label: 'Problem Solving' },
              { key: 'teamwork', label: 'Teamwork & Collaboration' },
              { key: 'discipline', label: 'Discipline & Punctuality' },
              { key: 'attendance', label: 'Attendance & Reliability' },
              { key: 'taskCompletion', label: 'Task Completion Speed' },
              { key: 'learningAbility', label: 'Learning Ability & Adaptability' },
              { key: 'overallPerformance', label: 'Overall Performance' },
            ].map((param) => (
              <div key={param.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{param.label}</span>
                  <span className="font-extrabold text-purple-700">{(evalScores as any)[param.key]} / 5</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEvalScores(prev => ({ ...prev, [param.key]: star }))}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={16}
                        className={star <= (evalScores as any)[param.key] ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comments Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mentor Comments</label>
              <textarea
                rows={3}
                value={mentorComments}
                onChange={(e) => setMentorComments(e.target.value)}
                placeholder="Detail technical strengths and contributions..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Manager Comments</label>
              <textarea
                rows={3}
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                placeholder="Team collaboration and delivery feedback..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">HR Comments</label>
              <textarea
                rows={3}
                value={hrComments}
                onChange={(e) => setHrComments(e.target.value)}
                placeholder="Cultural fit, attendance, and conversion notes..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          {/* Final Recommendation */}
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-extrabold text-purple-900 mb-1 uppercase tracking-wide">
                Final Recommendation Decision
              </label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-900"
              >
                <option value="Convert to Employee">Convert to Employee (Recommended)</option>
                <option value="Successfully Completed">Successfully Completed</option>
                <option value="Extend Internship">Extend Internship</option>
                <option value="Do Not Recommend">Do Not Recommend</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveEvaluation}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              Submit & Save Evaluation
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 10. CERTIFICATE */}
      {activeTab === 'certificate' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award size={16} className="text-purple-600" /> Internship Completion Certificate
              </h3>
              <p className="text-xs text-slate-500">Official certificate issued upon completion of tenure.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCertificate}
                className="text-xs text-purple-700 border-purple-300 hover:bg-purple-50 flex items-center gap-1"
              >
                <Sparkles size={14} /> Regenerate Certificate
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
              >
                <Printer size={14} /> Print / Export PDF
              </Button>
            </div>
          </div>

          {/* Certificate Visual Card Preview */}
          <div className="bg-white p-8 rounded-3xl border-4 border-double border-purple-300 shadow-2xl max-w-3xl mx-auto text-center relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-bl-full pointer-events-none opacity-50" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-100 rounded-tr-full pointer-events-none opacity-50" />

            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                <GraduationCap size={32} />
              </div>
              <h2 className="text-2xl font-serif font-black text-slate-900 tracking-wider">CERTIFICATE OF INTERNSHIP</h2>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
                {certificate?.organization || 'Antigravity Enterprise Solutions Pvt. Ltd.'}
              </p>
            </div>

            <p className="text-xs text-slate-600 italic">This is proudly presented to</p>

            <h3 className="text-2xl font-bold text-purple-950 font-serif border-b-2 border-purple-200 pb-2 inline-block px-8">
              {intern.name}
            </h3>

            <p className="text-xs text-slate-700 max-w-xl mx-auto leading-relaxed">
              for successfully completing an internship as <strong>{intern.designation}</strong> in the{' '}
              <strong>{intern.department}</strong> department from <strong>{intern.start_date}</strong> to{' '}
              <strong>{intern.end_date}</strong> (Duration: {intern.duration || '6 Months'}). During this period, their conduct, technical competence, and dedication were exemplary.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-8 text-xs border-t border-slate-100">
              <div>
                <p className="font-mono text-slate-400 text-[10px]">Certificate ID</p>
                <p className="font-bold text-slate-800">{certificate?.certificate_id || `CERT-2026-${intern.id}`}</p>
              </div>
              <div>
                <p className="font-mono text-slate-400 text-[10px]">Issue Date</p>
                <p className="font-bold text-slate-800">{certificate?.issue_date || new Date().toISOString().split('T')[0]}</p>
              </div>
              <div>
                <p className="font-mono text-slate-400 text-[10px]">Authorized Signatory</p>
                <p className="font-bold text-slate-800 font-serif">Sarah Jenkins (VP Eng)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 11. CONVERSION */}
      {activeTab === 'conversion' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={16} className="text-purple-600" /> Intern → Permanent Employee Conversion
            </h3>
            <p className="text-xs text-slate-500">Convert high-performing interns into permanent organization employees with zero duplicate data.</p>
          </div>

          {isConverted ? (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
              <h4 className="font-bold text-emerald-950 text-base">Intern Converted to Employee!</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                {intern.name} is now an active permanent employee (ID: <strong>{intern.converted_employee_id}</strong>). All internship records, evaluation, and certificates have been linked to the employee profile.
              </p>
              {onNavigateToEmployee && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigateToEmployee(intern.converted_employee_id)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  View Employee Master Record
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950 space-y-2">
                <p className="font-bold">Conversion Prerequisites Status:</p>
                <ul className="list-disc pl-5 space-y-1 text-purple-900">
                  <li>Evaluation Completed: {evaluation ? '✅ Completed' : '⚠️ Pending'}</li>
                  <li>Evaluation Recommendation: <strong>{evaluation?.recommendation || 'Convert to Employee'}</strong></li>
                  <li>Certificate Generated: {certificate ? '✅ Issued' : 'ℹ️ Optional'}</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Proposed Permanent Employee Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Designation:</span>
                    <p className="font-bold text-slate-800">Associate Software Engineer</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Department:</span>
                    <p className="font-bold text-slate-800">{intern.department}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Annual CTC / Salary:</span>
                    <p className="font-bold text-emerald-700">₹6,50,000 / annum (Standard Package)</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Reporting Hierarchy:</span>
                    <p className="font-bold text-slate-800">{intern.reporting_manager_name || 'Sarah Jenkins'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConvertToEmployee}
                  disabled={isConverting}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <UserCheck size={14} />
                  <span>{isConverting ? 'Processing Conversion...' : 'Confirm & Convert to Employee'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
