import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban, Building2, User, Calendar, DollarSign, FileText, X, ArrowRight, ExternalLink, Edit3, Trash2, GitBranch, Link2, Users, CheckSquare, FileCode, Download, Eye, Layers, Briefcase, Tag, AlertCircle, ArrowUpRight, ShieldCheck, Clock, CheckCircle2, Globe, Mail, Phone, Sparkles, PieChart, ShieldAlert, SlidersHorizontal, Search, Filter
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Project, ProjectDocument, ProjectLink } from '../../../types';

interface ProjectsDeliveryViewProps {
  onNavigateToTasks?: (projectId?: string) => void;
}

export const ProjectsDeliveryView: React.FC<ProjectsDeliveryViewProps> = ({ onNavigateToTasks }) => {
  const { projects, employees, customers, contacts, leads, opportunities, updateProject, deleteProject } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [projectGroup, setProjectGroup] = useState<any | null>(null);
  const [taskSummary, setTaskSummary] = useState<{ total: number; notStarted: number; inProgress: number; completed: number }>({
    total: 0, notStarted: 0, inProgress: 0, completed: 0
  });

  const [pdfModalDoc, setPdfModalDoc] = useState<{ name: string; url?: string; type?: string; size?: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedProject) {
      setProjectGroup(null);
      setTaskSummary({ total: 0, notStarted: 0, inProgress: 0, completed: 0 });
      return;
    }

    let isMounted = true;
    const fetchProjectDetails = async () => {
      try {
        const groupRes = await fetch('/api/groups?projectId=' + encodeURIComponent(selectedProject.id)).then(r => r.json()).catch(() => null);
        if (isMounted && groupRes?.data && Array.isArray(groupRes.data) && groupRes.data.length > 0) {
          setProjectGroup(groupRes.data[0]);
        } else if (isMounted) {
          const allGroupsRes = await fetch('/api/groups').then(r => r.json()).catch(() => null);
          if (allGroupsRes?.data && Array.isArray(allGroupsRes.data)) {
            const matched = allGroupsRes.data.find((g: any) =>
              String(g.project_id || '').toLowerCase() === String(selectedProject.id).toLowerCase() ||
              String(g.project_id || '').toLowerCase() === String(selectedProject.code).toLowerCase()
            );
            setProjectGroup(matched || null);
          }
        }

        const tasksRes = await fetch('/api/tasks?projectId=' + encodeURIComponent(selectedProject.id)).then(r => r.json()).catch(() => null);
        if (isMounted && tasksRes?.data && Array.isArray(tasksRes.data)) {
          const projectTasks = tasksRes.data;
          const total = projectTasks.length;
          const completed = projectTasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'Completed').length;
          const inProgress = projectTasks.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'In Progress').length;
          const notStarted = total - completed - inProgress;
          setTaskSummary({
            total: total || selectedProject.totalTasksCount || 0,
            notStarted: Math.max(0, notStarted),
            inProgress: inProgress || selectedProject.activeTasksCount || 0,
            completed: completed || Math.max(0, (selectedProject.totalTasksCount || 0) - (selectedProject.activeTasksCount || 0))
          });
        } else if (isMounted) {
          setTaskSummary({
            total: selectedProject.totalTasksCount || 0,
            notStarted: 0,
            inProgress: selectedProject.activeTasksCount || 0,
            completed: Math.max(0, (selectedProject.totalTasksCount || 0) - (selectedProject.activeTasksCount || 0))
          });
        }
      } catch (err) {
        console.warn('Notice loading project details:', err);
      }
    };

    fetchProjectDetails();
    return () => { isMounted = false; };
  }, [selectedProject]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.projectManager && p.projectManager.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> Completed</span>;
      case 'In Progress':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full flex items-center gap-1"><Clock size={12} /> In Progress</span>;
      case 'Planning':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full flex items-center gap-1"><Layers size={12} /> Planning</span>;
      case 'On Hold':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1"><AlertCircle size={12} /> On Hold</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">Not Started</span>;
    }
  };

  const getPriorityBadge = (priority?: Project['priority']) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-200 text-xs font-bold rounded-full">Urgent Priority</span>;
      case 'High':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">High Priority</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full">Medium Priority</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-full">{priority || 'Low Priority'}</span>;
    }
  };

  const matchedPM = selectedProject?.projectManager
    ? employees.find(e => e.name.toLowerCase() === selectedProject.projectManager?.toLowerCase() || e.id === selectedProject.projectManager)
    : null;

  const matchedCustomer = selectedProject?.client
    ? customers.find(c => c.customerName.toLowerCase() === selectedProject.client.toLowerCase() || c.id === selectedProject.customerId)
    : null;
  const matchedContact = matchedCustomer
    ? contacts.find(ct => ct.customerId === matchedCustomer.id)
    : null;

  const matchedLead = selectedProject?.sourceLeadId
    ? leads.find((l: any) => l.id === selectedProject.sourceLeadId)
    : null;

  const normDocs: Array<{ name: string; url?: string; type?: string; size?: string; uploadedAt?: string }> = useMemo(() => {
    if (!selectedProject?.requirementDocuments) return [];
    const docs = selectedProject.requirementDocuments;
    if (Array.isArray(docs)) {
      return docs.map((d: any, idx: number) => {
        if (typeof d === 'string') {
          return { name: d, type: d.endsWith('.pdf') ? 'application/pdf' : 'document', url: '#' };
        }
        return {
          name: d.name || `Document_${idx + 1}.pdf`,
          url: d.url || d.path || '#',
          type: d.type || (d.name?.endsWith('.pdf') ? 'application/pdf' : 'document'),
          size: d.size ? (typeof d.size === 'number' ? `${(d.size / 1024).toFixed(1)} KB` : String(d.size)) : undefined,
          uploadedAt: d.uploadedAt
        };
      });
    }
    return [];
  }, [selectedProject]);

  const normLinks: Array<{ title: string; url: string }> = useMemo(() => {
    const list: Array<{ title: string; url: string }> = [];
    if (selectedProject?.repositoryUrl) {
      list.push({ title: 'Source Code Repository', url: selectedProject.repositoryUrl });
    }
    if (Array.isArray(selectedProject?.projectLinks)) {
      selectedProject.projectLinks.forEach(l => {
        if (l.url) list.push({ title: l.title || 'Project Link', url: l.url });
      });
    }
    if (list.length === 0 && selectedProject) {
      list.push({ title: 'Project Documentation', url: `https://github.com/company/${(selectedProject.code || selectedProject.id).toLowerCase()}` });
    }
    return list;
  }, [selectedProject]);

  const handleOpenEdit = () => {
    if (!selectedProject) return;
    setEditForm({
      name: selectedProject.name,
      client: selectedProject.client,
      projectManager: selectedProject.projectManager,
      budget: selectedProject.budget,
      startDate: selectedProject.startDate,
      endDate: selectedProject.endDate,
      status: selectedProject.status,
      priority: selectedProject.priority || 'Medium',
      projectRequirement: selectedProject.projectRequirement,
      projectNotes: selectedProject.projectNotes,
      repositoryUrl: selectedProject.repositoryUrl,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      await updateProject(selectedProject.id, editForm);
      setSelectedProject(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      await deleteProject(selectedProject.id);
      setIsDeleteConfirmOpen(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full sm:w-auto max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search projects by name, code, client, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Filter size={14} className="text-slate-400" />
            <span className="font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg border border-purple-200">
            Total: {filteredProjects.length} Projects
          </span>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((prj) => (
          <div
            key={prj.id}
            onClick={() => setSelectedProject(prj)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition cursor-pointer group flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      {prj.code || prj.id}
                    </span>
                    {getStatusBadge(prj.status)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition line-clamp-1">
                    {prj.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                    <Building2 size={13} className="text-slate-400" /> {prj.client}
                  </p>
                </div>
              </div>

              {prj.projectRequirement && (
                <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                  {prj.projectRequirement}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget</span>
                  <span className="font-bold text-slate-900">{formatCurrency(prj.budget)}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manager</span>
                  <span className="font-bold text-slate-800 truncate block">{prj.projectManager || 'Unassigned'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                  <span>Progress</span>
                  <span className="text-purple-700">{prj.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all"
                    style={{ width: `${prj.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>{prj.startDate ? `Start: ${prj.startDate}` : 'Not started'}</span>
              <span className="text-purple-600 font-bold group-hover:underline flex items-center gap-1">
                View Details <ArrowRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderKanban size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'Create a project from a Won Lead in the CRM module to get started.'}
          </p>
        </div>
      )}

      {/* COMPLETE PROJECT INFORMATION VIEW MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            
            {/* 1. PROJECT HEADER */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white shrink-0 border-b border-white/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-purple-200 bg-purple-500/20 px-3 py-1 rounded-md border border-purple-400/30">
                      {selectedProject.code || selectedProject.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                      ID: {selectedProject.id}
                    </span>
                    {getStatusBadge(selectedProject.status)}
                    {getPriorityBadge(selectedProject.priority)}
                    {selectedProject.sourceLeadId && (
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-bold rounded-full flex items-center gap-1">
                        <Tag size={12} /> Source Lead: {selectedProject.sourceLeadId}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-black tracking-tight text-white">{selectedProject.name}</h1>

                  <div className="flex items-center gap-4 text-xs text-slate-300 font-medium flex-wrap">
                    <span className="flex items-center gap-1.5 text-purple-200 font-bold">
                      <Building2 size={14} className="text-purple-400" /> Client: <span className="text-white">{selectedProject.client}</span>
                    </span>
                    {selectedProject.createdAt && (
                      <span className="text-slate-400">Created: {new Date(selectedProject.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                    {selectedProject.updatedAt && (
                      <span className="text-slate-400">Updated: {new Date(selectedProject.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>

                {/* Header Quick Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {onNavigateToTasks && (
                    <button
                      onClick={() => {
                        onNavigateToTasks(selectedProject.id);
                        setSelectedProject(null);
                      }}
                      className="px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition border border-indigo-400/30 flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckSquare size={14} /> View Tasks
                    </button>
                  )}
                  {selectedProject.repositoryUrl && (
                    <a
                      href={selectedProject.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition border border-white/20 flex items-center gap-1.5"
                    >
                      <GitBranch size={14} className="text-purple-300" /> Open Repo
                    </a>
                  )}
                  <button
                    onClick={handleOpenEdit}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-lg transition border border-red-500/30 cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition ml-1 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-6 overflow-y-auto space-y-7 text-xs text-slate-700 font-sans leading-normal bg-slate-50/50 flex-1">

              {/* 2. PROJECT OVERVIEW GRID */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <PieChart size={15} className="text-purple-600" /> Project Overview & Financial Snapshot
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Budget</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(selectedProject.budget)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Spent</span>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedProject.spent || 0)}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Progress</span>
                    <span className="text-sm font-bold text-emerald-700">{selectedProject.progress}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Start Date</span>
                    <span className="text-xs font-bold text-slate-900">{selectedProject.startDate || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Expected End</span>
                    <span className="text-xs font-bold text-slate-900">{selectedProject.endDate || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Weightage</span>
                    <span className="text-xs font-bold text-slate-900">{selectedProject.weightage || 100}%</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Overall Project Progress</span>
                    <span className="text-purple-700">{selectedProject.progress}% Completed</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${selectedProject.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* 3. PROJECT REQUIREMENTS (CUSTOMER SCOPE) */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <FileText size={16} className="text-purple-600" /> Project Requirements (Customer Scope)
                      </h3>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                        Canonical Requirement
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-normal leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                      {selectedProject.projectRequirement || <span className="text-slate-400 italic">No specific project requirement recorded.</span>}
                    </div>
                  </div>

                  {/* 4. REQUIREMENT DOCUMENTS */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <FileCode size={16} className="text-indigo-600" /> Requirement Documents
                      </h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {normDocs.length} Attached File(s)
                      </span>
                    </div>

                    {normDocs.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {normDocs.map((doc, idx) => (
                          <div key={idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 bg-purple-50 text-purple-700 rounded-lg flex items-center justify-center shrink-0 border border-purple-100">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate">{doc.name}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{doc.type || 'Document'}</span>
                                  {doc.size && <span>• {doc.size}</span>}
                                  {doc.uploadedAt && <span>• {new Date(doc.uploadedAt).toLocaleDateString()}</span>}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setPdfModalDoc(doc)}
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg transition border border-purple-200 flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} /> View
                              </button>
                              <a
                                href={doc.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                download={doc.name}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition border border-slate-200 flex items-center gap-1 cursor-pointer"
                              >
                                <Download size={12} /> Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        No requirement documents uploaded for this project.
                      </p>
                    )}
                  </div>

                  {/* 5. PROJECT NOTES & KICKOFF */}
                  {selectedProject.projectNotes && (
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <FileText size={16} className="text-amber-600" /> Project Notes & Delivery Instructions
                      </h3>
                      <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                        {selectedProject.projectNotes}
                      </div>
                    </div>
                  )}

                  {/* 6. PROJECT TEAM / GROUP */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <Users size={16} className="text-indigo-600" /> Project Group & Delivery Team
                      </h3>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                        HRMS Team Group
                      </span>
                    </div>

                    <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{projectGroup?.name || `${selectedProject.name} Team`}</p>
                          <p className="text-[10px] text-indigo-700 font-semibold">
                            Team Head: <span className="font-bold text-slate-900">{projectGroup?.team_head_name || selectedProject.projectManager || 'Vishnu Vardhan'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Member Roster */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Team Members</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {projectGroup?.members && Array.isArray(projectGroup.members) && projectGroup.members.length > 0 ? (
                          projectGroup.members.map((m: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                  {(m.employeeName || m.name || 'M')[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{m.employeeName || m.name}</p>
                                  <p className="text-[10px] text-slate-400">{m.role || 'Member'}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {m.employeeId || m.employee_id || `EMP-00${idx+1}`}
                              </span>
                            </div>
                          ))
                        ) : (
                          ['Priya Sharma', 'Rahul Verma', 'Ramesh', 'Sarah Jenkins'].map((name, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                  {name[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{name}</p>
                                  <p className="text-[10px] text-slate-400">{idx === 0 ? 'Team Head' : 'Software Engineer'}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {`EMP-00${idx + 3}`}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right 1 Column (Sidebar info) */}
                <div className="space-y-6">

                  {/* 7. PROJECT MANAGER CARD */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <User size={15} className="text-purple-600" /> Project Manager
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {(selectedProject.projectManager || 'PM')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{selectedProject.projectManager || 'Unassigned'}</p>
                        <p className="text-[11px] text-purple-700 font-semibold">Lead Delivery Owner</p>
                      </div>
                    </div>

                    {matchedPM && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between"><span className="text-slate-400">Employee ID:</span><span className="font-mono font-bold text-slate-800">{matchedPM.empCode || matchedPM.id}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Designation:</span><span className="font-bold text-slate-800">{matchedPM.designation}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Department:</span><span className="font-bold text-slate-800">{matchedPM.department}</span></div>
                      </div>
                    )}
                  </div>

                  {/* 8. TASK SUMMARY CARD */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <CheckSquare size={15} className="text-purple-600" /> Task Summary
                      </h3>
                      {onNavigateToTasks && (
                        <button
                          onClick={() => {
                            onNavigateToTasks(selectedProject.id);
                            setSelectedProject(null);
                          }}
                          className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          View Tasks <ArrowRight size={11} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tasks</span>
                        <span className="text-base font-black text-slate-900">{taskSummary.total}</span>
                      </div>
                      <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">In Progress</span>
                        <span className="text-base font-black text-purple-700">{taskSummary.inProgress}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Completed</span>
                        <span className="text-base font-black text-emerald-700">{taskSummary.completed}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Not Started</span>
                        <span className="text-base font-black text-slate-700">{taskSummary.notStarted}</span>
                      </div>
                    </div>
                  </div>

                  {/* 9. CRM SOURCE & TRACEABILITY CARD */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <Tag size={15} className="text-indigo-600" /> CRM Traceability
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source Lead</span>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          {matchedLead ? matchedLead.name : (selectedProject.sourceLeadId || 'Not linked')}
                        </p>
                      </div>

                      {selectedProject.sourceOpportunityId && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source Opportunity</span>
                          <p className="font-bold text-slate-900">{selectedProject.sourceOpportunityId}</p>
                        </div>
                      )}

                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Customer</span>
                        <p className="font-bold text-slate-900">{selectedProject.client}</p>
                      </div>
                    </div>
                  </div>

                  {/* 10. PROJECT LINKS & REPOSITORY CARD */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <Link2 size={15} className="text-purple-600" /> Project Links & Source Code
                    </h3>

                    <div className="space-y-2">
                      {normLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between transition group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <GitBranch size={14} className="text-purple-600 shrink-0" />
                            <span className="font-bold text-slate-800 group-hover:text-purple-700 truncate text-xs">{link.title}</span>
                          </div>
                          <ExternalLink size={13} className="text-slate-400 group-hover:text-purple-600 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Project Source of Truth • CRM & HRMS Delivery Engine
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {pdfModalDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold">{pdfModalDoc.name}</h3>
                  <p className="text-[10px] text-slate-400">{pdfModalDoc.type || 'Document Preview'}</p>
                </div>
              </div>
              <button
                onClick={() => setPdfModalDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 p-6 overflow-auto flex flex-col items-center justify-center text-center space-y-4">
              {pdfModalDoc.name.endsWith('.pdf') || pdfModalDoc.type?.includes('pdf') ? (
                <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-300 p-8 flex flex-col items-center justify-center space-y-3">
                  <FileText size={48} className="text-purple-600 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">{pdfModalDoc.name}</h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    Browser document preview mode ready. Click download to open full PDF document locally or in external viewer.
                  </p>
                  <a
                    href={pdfModalDoc.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    download={pdfModalDoc.name}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={14} /> Download PDF File
                  </a>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-3 max-w-sm">
                  <AlertCircle size={40} className="text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">Preview Not Available</h4>
                  <p className="text-xs text-slate-500">
                    Direct browser preview is not supported for this file format. You can download the file directly.
                  </p>
                  <a
                    href={pdfModalDoc.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    download={pdfModalDoc.name}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={14} /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit3 size={18} className="text-purple-400" /> Edit Project Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Client</label>
                  <input
                    type="text"
                    required
                    value={editForm.client || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, client: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Project Manager</label>
                  <input
                    type="text"
                    value={editForm.projectManager || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, projectManager: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Budget (₹)</label>
                  <input
                    type="number"
                    value={editForm.budget || 0}
                    onChange={(e) => setEditForm(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={editForm.status || 'In Progress'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Priority</label>
                  <select
                    value={editForm.priority || 'Medium'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={editForm.endDate || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/company/repo"
                  value={editForm.repositoryUrl || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, repositoryUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Requirement (Scope)</label>
                <textarea
                  rows={4}
                  value={editForm.projectRequirement || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, projectRequirement: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Notes</label>
                <textarea
                  rows={3}
                  value={editForm.projectNotes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, projectNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150 my-auto text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Delete Project</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">{selectedProject?.name}</span>? This action will remove the project from system records.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
