import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Project } from '../../../types';
import { 
  FolderKanban, Search, Filter, Calendar, User, DollarSign, 
  CheckCircle2, Clock, FileText, X, ArrowRight, Building2, 
  Sparkles, ShieldCheck, ChevronRight
} from 'lucide-react';

export const ProjectsDeliveryView: React.FC = () => {
  const { projects } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter((prj) => {
    const matchesSearch =
      prj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prj.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prj.projectRequirement && prj.projectRequirement.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || prj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'In Progress':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full">In Progress</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">Completed</span>;
      case 'On Hold':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">On Hold</span>;
      case 'Planning':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full">Planning</span>;
      case 'Not Started':
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">Not Started</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center text-xs text-slate-500 mb-1 font-medium">
            <span>Enterprise Suite</span>
            <ChevronRight size={12} className="mx-1" />
            <span className="text-[#0f172a] font-bold">Projects</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <FolderKanban className="text-purple-600" size={26} />
            Projects & Client Delivery
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active client deliveries, project scopes, team assignments, and milestone progress.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs text-xs">
            <span className="text-slate-500">Total Projects: </span>
            <span className="font-bold text-slate-900">{projects.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs text-xs">
            <span className="text-indigo-600 font-semibold">In Progress: </span>
            <span className="font-bold text-slate-900">{projects.filter(p => p.status === 'In Progress').length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, clients, requirements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'Not Started', 'In Progress', 'Planning', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                statusFilter === status
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((prj) => (
          <div
            key={prj.id}
            onClick={() => setSelectedProject(prj)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {prj.code || prj.id}
                </span>
                {getStatusBadge(prj.status)}
              </div>

              <div>
                <h3 className="font-bold text-[#0f172a] text-sm group-hover:text-purple-600 transition-colors line-clamp-2">
                  {prj.name}
                </h3>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  <Building2 size={13} className="mr-1 text-slate-400" />
                  <span className="font-semibold text-slate-700">{prj.client}</span>
                </div>
              </div>

              {/* Requirement Snippet */}
              {prj.projectRequirement && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 line-clamp-2 font-sans">
                  <span className="font-bold text-slate-700 text-[10px] uppercase block mb-0.5">Project Scope:</span>
                  {prj.projectRequirement}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              {/* Manager & Budget info */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center text-slate-500">
                  <User size={13} className="mr-1 text-purple-500" />
                  <span className="font-medium text-slate-700">{prj.projectManager || 'Unassigned'}</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(prj.budget)}</span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-bold text-purple-700">{prj.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all"
                    style={{ width: `${prj.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                <span>{prj.startDate ? `Started: ${prj.startDate}` : 'Not started'}</span>
                <span className="text-purple-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  View Details <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderKanban size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'Create a project from a Won Lead in the CRM module to get started.'}
          </p>
        </div>
      )}

      {/* PROJECT DETAILS MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 p-6 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-purple-200 bg-white/10 px-2.5 py-0.5 rounded">
                    {selectedProject.code || selectedProject.id}
                  </span>
                  {getStatusBadge(selectedProject.status)}
                </div>
                <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                <div className="flex items-center gap-2 text-xs text-purple-100 mt-1">
                  <Building2 size={13} /> Client: <span className="font-bold text-white">{selectedProject.client}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Project Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Budget</span>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(selectedProject.budget)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Progress</span>
                  <span className="text-sm font-bold text-purple-700">{selectedProject.progress}%</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Start Date</span>
                  <span className="text-xs font-bold text-slate-800">{selectedProject.startDate || '—'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Expected End</span>
                  <span className="text-xs font-bold text-slate-800">{selectedProject.endDate || '—'}</span>
                </div>
              </div>

              {/* Project Manager */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Project Manager</span>
                    <span className="text-xs font-bold text-slate-900">{selectedProject.projectManager || 'Unassigned'}</span>
                  </div>
                </div>
                <span className="text-[11px] text-indigo-700 font-semibold bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                  Lead Delivery Owner
                </span>
              </div>

              {/* Project Requirement */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <FileText size={14} className="text-purple-600" />
                    Project Requirement (Customer Scope)
                  </label>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Canonical Requirement
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-normal leading-relaxed whitespace-pre-wrap">
                  {selectedProject.projectRequirement || <span className="text-slate-400 italic">No specific project requirement recorded.</span>}
                </div>
              </div>

              {/* Project Notes */}
              {selectedProject.projectNotes && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-xs">
                    Project Notes & Kick-off Details
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedProject.projectNotes}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
