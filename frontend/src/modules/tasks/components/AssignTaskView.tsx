import React, { useState, useMemo, useRef } from 'react';
import {
  ClipboardList,
  UserPlus,
  Search,
  Calendar,
  Clock,
  Paperclip,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { taskApiService } from '../services/taskService';
import { TaskPriority } from '../types';
import { DocumentPreviewModal } from '../../../components/common/DocumentPreviewModal';

interface AssignTaskViewProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

interface SubtaskItem {
  id: string;
  label: string;
  completed: boolean;
}

interface AttachedFileItem {
  name: string;
  file?: File;
  dataUrl?: string;
}

export const AssignTaskView: React.FC<AssignTaskViewProps> = ({ onBack, onSuccess }) => {
  const { employees = [], projects = [] } = useApp();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const [previewModalDoc, setPreviewModalDoc] = useState<{ fileName: string; fileUrl?: string } | null>(null);
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Employee selection states
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // List strictly from live system employees
  const availableEmployeesList = useMemo(() => {
    return employees.map(e => {
      const id = e.empCode || e.id;
      return {
        id: id,
        empCode: e.empCode || e.id,
        name: e.name || 'Employee',
        designation: e.designation || 'Specialist',
        department: e.department || 'Operations',
        avatar:
          (e as any).avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name || 'EM')}&background=1e40af&color=fff`
      };
    });
  }, [employees]);

  // Filtered employees for list search
  const filteredEmployees = useMemo(() => {
    if (!searchEmployeeQuery.trim()) return availableEmployeesList;
    const q = searchEmployeeQuery.toLowerCase();
    return availableEmployeesList.filter(
      emp =>
        emp.name.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.empCode.toLowerCase().includes(q)
    );
  }, [availableEmployeesList, searchEmployeeQuery]);

  // Selected employee objects for preview
  const selectedEmployees = useMemo(() => {
    return availableEmployeesList.filter(e => selectedEmployeeIds.includes(e.id) || selectedEmployeeIds.includes(e.empCode));
  }, [availableEmployeesList, selectedEmployeeIds]);

  // Toggle single employee selection
  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Clear all employee selections
  const handleClearAllEmployees = () => {
    setSelectedEmployeeIds([]);
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: Date.now().toString(), label: newSubtaskText.trim(), completed: false }
    ]);
    setNewSubtaskText('');
    setIsAddingSubtask(false);
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(prev =>
      prev.map(st => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  // AI Copilot Planning
  const handleAiAutoPlan = async () => {
    if (!title.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a Task Title first so AI can draft the project scope & details.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    setIsAiGenerating(true);
    try {
      const plan = await taskApiService.generateAITaskPlan({
        title,
        projectName: selectedProject || 'ERP Core Suite 2.0',
        department: selectedEmployees[0]?.department || 'ALL'
      });

      if (plan.description) setDescription(plan.description);
      if (plan.priority) setPriority(plan.priority as TaskPriority);
      if (plan.estimatedHours) setEstimatedHours(String(plan.estimatedHours));
      if (plan.dueDate) setDueDate(plan.dueDate);
      if (plan.checklist && Array.isArray(plan.checklist)) {
        setSubtasks(
          plan.checklist.map((item: any, idx: number) => ({
            id: String(idx + 1),
            label: typeof item === 'string' ? item : item.label,
            completed: false
          }))
        );
      }

      setStatusMessage({
        type: 'success',
        text: 'AI successfully filled task scope, estimates & subtasks!'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'AI planning encountered an issue. You can fill details manually.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Priority color & style helper
  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return {
          dot: 'bg-rose-600',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Urgent'
        };
      case 'HIGH':
        return {
          dot: 'bg-rose-500',
          badge: 'bg-rose-50 text-rose-600 border-rose-200',
          label: 'High'
        };
      case 'MEDIUM':
        return {
          dot: 'bg-amber-500',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Medium'
        };
      case 'LOW':
        return {
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Low'
        };
      default:
        return {
          dot: 'bg-slate-500',
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
          label: p
        };
    }
  };

  // Department pill badge helper
  const getDepartmentBadgeStyle = (dept: string) => {
    const d = dept?.toLowerCase() || '';
    if (d.includes('design') || d.includes('ui')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (d.includes('dev') || d.includes('eng') || d.includes('software')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (d.includes('qa') || d.includes('test')) {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    if (d.includes('ops') || d.includes('devops')) {
      return 'bg-purple-50 text-purple-600 border-purple-100';
    }
    if (d.includes('product') || d.includes('mgmt')) {
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Format date helper for preview
  const formatPreviewDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const items: AttachedFileItem[] = [];
      for (const file of newFiles) {
        const dataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        items.push({ name: file.name, file, dataUrl });
      }
      setAttachedFiles(prev => [...prev, ...items]);
    }
  };

  // Submit Handler
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Task Title is required.' });
      return;
    }
    if (selectedEmployeeIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one employee to assign the task.' });
      return;
    }
    if (!dueDate) {
      setStatusMessage({ type: 'error', text: 'Task Due Date is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        projectName: selectedProject || 'ERP Core Suite 2.0',
        priority,
        dueDate,
        estimatedHours: Number(estimatedHours) || 8.0,
        assignedTo: selectedEmployeeIds,
        checklist: subtasks,
        pdfAttachmentName: attachedFiles[0]?.name || null,
        pdfAttachmentUrl: attachedFiles[0]?.dataUrl || null
      };

      await taskApiService.createTask(payload);

      setStatusMessage({
        type: 'success',
        text: `Task successfully assigned to ${selectedEmployeeIds.length} employee${selectedEmployeeIds.length === 1 ? '' : 's'}!`
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        else if (onBack) onBack();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to assign task. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPriorityConfig = getPriorityBadge(priority);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-xs animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span
          onClick={onBack}
          className="hover:text-slate-700 cursor-pointer transition"
        >
          Tasks
        </span>
        <span>›</span>
        <span className="text-slate-700 font-semibold">Assign Task</span>
      </div>

      {/* 2. Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Assign Task to Employees
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Create a new task and assign it to one or more employees
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Tasks
          </button>
        </div>
      </div>

      {/* 3. Main Form Grid */}
      <form onSubmit={handleSubmitTask} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Task Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-5">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ClipboardList size={18} />
                </div>
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  Task Details
                </h2>
              </div>

              {/* AI Auto-Plan Action */}
              <button
                type="button"
                onClick={handleAiAutoPlan}
                disabled={isAiGenerating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 flex items-center gap-1.5 transition cursor-pointer"
                title="AI will draft the description, subtasks, and estimates based on the title"
              >
                <Sparkles size={13} className={`text-purple-600 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>{isAiGenerating ? 'AI Planning...' : 'AI Auto-Plan'}</span>
              </button>
            </div>

            {/* Field: Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* Field: Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={e => {
                    if (e.target.value.length <= 500) {
                      setDescription(e.target.value);
                    }
                  }}
                  rows={4}
                  placeholder="Enter task description..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-y"
                  required
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {description.length}/500
                </div>
              </div>
            </div>

            {/* Row: Project & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project
                </label>
                <div className="relative">
                  <select
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none cursor-pointer pr-9"
                  >
                    <option value="">Select project</option>
                    <option value="ERP Core Suite 2.0">ERP Core Suite 2.0</option>
                    <option value="HRMS & Payroll System">HRMS & Payroll System</option>
                    <option value="CRM Sales Pipeline">CRM Sales Pipeline</option>
                    <option value="Banking & Financial Ledger">Banking & Financial Ledger</option>
                    <option value="Inventory & Supply Chain">Inventory & Supply Chain</option>
                    <option value="Client Delivery Portal">Client Delivery Portal</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none cursor-pointer pr-9"
                  >
                    <option value="HIGH">🔴 High</option>
                    <option value="URGENT">🟣 Urgent</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🟢 Low</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Row: Due Date & Estimated Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimated Hours (Optional)
                </label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(e.target.value)}
                    placeholder="Enter estimated hours"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Field: Attachments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attachments (Optional)
              </label>
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-2xs"
                  >
                    <Paperclip size={13} />
                    <span>Choose Files</span>
                  </button>

                  {attachedFiles.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {attachedFiles.map((file, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs"
                        >
                          <span
                            onClick={() =>
                              setPreviewModalDoc({
                                fileName: file.name,
                                fileUrl: file.dataUrl
                              })
                            }
                            className="cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1"
                            title="Click to preview file"
                          >
                            <Eye size={12} className="text-blue-600" />
                            <span className="max-w-[130px] truncate">{file.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-500 p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No file chosen</span>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>

                {attachedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAttachedFiles([])}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold shrink-0 cursor-pointer"
                  >
                    Remove All
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Max file size: 10MB (PDF, DOC, DOCX, JPG, PNG) • Click on attachment to preview
              </p>
            </div>

            {/* Section: Add Subtasks */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Add Subtasks (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(true)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                  <Plus size={13} /> Add Subtask
                </button>
              </div>

              {/* Subtask Input form when adding */}
              {isAddingSubtask && (
                <div className="flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-100 rounded-xl animate-fade-in">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Enter subtask step or item..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSubtask(false);
                      setNewSubtaskText('');
                    }}
                    className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Subtasks Box */}
              <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/40 min-h-[70px]">
                {subtasks.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-400 font-normal">
                    No subtasks added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map(st => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs group"
                      >
                        <div
                          className="flex items-center gap-2.5 flex-1 cursor-pointer"
                          onClick={() => handleToggleSubtask(st.id)}
                        >
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtask(st.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span
                            className={`text-xs ${
                              st.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-700'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 opacity-60 group-hover:opacity-100 transition"
                          title="Remove Subtask"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Assign To & Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD 1: Assign To Employees */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus size={18} />
                </div>
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  Assign To Employees <span className="text-rose-500">*</span>
                </h2>
              </div>
            </div>

            {/* Employee Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchEmployeeQuery}
                onChange={e => setSearchEmployeeQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            {/* Employee Scrollable List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 select-none">
              {filteredEmployees.map(emp => {
                const isSelected = selectedEmployeeIds.includes(emp.id) || selectedEmployeeIds.includes(emp.empCode);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent container click
                        className="w-4 h-4 rounded text-blue-600 focus:ring-0 border-slate-300 cursor-pointer shrink-0"
                      />
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {emp.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {emp.designation}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${getDepartmentBadgeStyle(
                        emp.department
                      )}`}
                    >
                      {emp.department}
                    </span>
                  </div>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No employees matched your search.
                </div>
              )}
            </div>

            {/* Footer of Card 1: Count & Clear All */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-blue-600">
                {selectedEmployeeIds.length} employee{selectedEmployeeIds.length === 1 ? '' : 's'} selected
              </span>
              {selectedEmployeeIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllEmployees}
                  className="font-semibold text-rose-500 hover:text-rose-700 transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* CARD 2: Task Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Eye size={18} />
              </div>
              <h2 className="text-sm md:text-base font-bold text-slate-900">
                Task Preview
              </h2>
            </div>

            {/* Preview List Items */}
            <div className="space-y-3.5 text-xs">
              {/* Task Title */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                  <ClipboardList size={14} className="text-slate-400" />
                  <span>Task Title</span>
                </div>
                <span className="font-semibold text-slate-900 truncate max-w-[200px] text-right">
                  {title.trim() || '-'}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${currentPriorityConfig.dot}`} />
                  <span>Priority</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${currentPriorityConfig.badge}`}
                >
                  {currentPriorityConfig.label}
                </span>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Due Date</span>
                </div>
                <span className="font-semibold text-slate-800">
                  {formatPreviewDate(dueDate)}
                </span>
              </div>

              {/* Assigned To */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                  <UserPlus size={14} className="text-slate-400" />
                  <span>Assigned To</span>
                </div>
                <div className="flex items-center">
                  {selectedEmployees.length === 0 ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {selectedEmployees.slice(0, 3).map(emp => (
                        <img
                          key={emp.id}
                          src={emp.avatar}
                          alt={emp.name}
                          title={emp.name}
                          className="w-6 h-6 rounded-full border-2 border-white object-cover ring-1 ring-slate-200"
                        />
                      ))}
                      {selectedEmployees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600 ring-1 ring-slate-200">
                          +{selectedEmployees.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Hours */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={14} className="text-slate-400" />
                  <span>Estimated Hours</span>
                </div>
                <span className="font-semibold text-slate-800">
                  {estimatedHours ? `${estimatedHours} hrs` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS BAR */}
        <div className="lg:col-span-12 flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <UserPlus size={15} />
            <span>{isSubmitting ? 'Assigning Task...' : 'Assign Task'}</span>
          </button>
        </div>
      </form>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewModalDoc)}
        onClose={() => setPreviewModalDoc(null)}
        fileName={previewModalDoc?.fileName}
        fileUrl={previewModalDoc?.fileUrl}
        taskTitle={title || 'Task Document'}
        projectName={selectedProject || 'ERP Core Suite'}
        scopeOfWork={description}
      />
    </div>
  );
};
