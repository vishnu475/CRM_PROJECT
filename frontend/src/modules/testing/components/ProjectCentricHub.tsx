import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Bug,
  RefreshCw,
  FolderGit2,
  FileText,
  X
} from 'lucide-react';
import { TestingDocumentsView } from './TestingDocumentsView';

export interface ProjectHubEmployee {
  employeeId: string;
  employeeName: string;
  role: string;
  moduleId: string;
  moduleName: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  testingRequestId: string | null;
  testingPhase?: number;
  phaseName?: string;
  phaseStatus?: string;
  testingUrl: string;
  environment: string;
  status: string; // 'PHASE 1 TESTING REQUIRED', 'PHASE 2 TESTING REQUIRED', 'FINAL GATE TESTING REQUIRED', etc.
  rawStatus?: string;
  shouldPulse: boolean;
  openBugs: number;
}

export interface ProjectHubCard {
  projectId: string;
  projectCode: string;
  projectName: string;
  client?: string;
  projectManager: string;
  status: string;
  testingStatus: string; // 'IN PROGRESS', 'TESTING REQUIRED', 'COMPLETED', 'DEVELOPMENT'
  modules: string[];
  testingRequestsCount: number;
  bugsCount: number;
  employees: ProjectHubEmployee[];
}

interface ProjectCentricHubProps {
  onOpenWorkspace: (projectId: string, employeeId: string, moduleId: string) => void;
}

export const ProjectCentricHub: React.FC<ProjectCentricHubProps> = ({ onOpenWorkspace }) => {
  const [projects, setProjects] = useState<ProjectHubCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<{ [id: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [empFilters, setEmpFilters] = useState<{ [projectId: string]: 'ALL' | 'TESTING' | 'DEV' }>({});
  const [selectedProjectForDocs, setSelectedProjectForDocs] = useState<{ 
    projectId: string; 
    projectName: string;
    employees: { employeeId: string; employeeName: string; role?: string }[];
  } | null>(null);

  const fetchHubData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/testing/projects-hub');
      const json = await res.json();
      if (json.success) {
        setProjects(json.data || []);
        // Automatically expand the first project or projects with active testing
        const initialExpanded: { [id: string]: boolean } = {};
        (json.data || []).forEach((p: ProjectHubCard, index: number) => {
          initialExpanded[p.projectId] = index === 0 || p.testingRequestsCount > 0;
        });
        setExpandedProjects(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to fetch projects hub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  const toggleExpand = (pId: string) => {
    setExpandedProjects(prev => ({ ...prev, [pId]: !prev[pId] }));
  };

  const filteredProjects = projects.filter(p => {
    if (statusFilter !== 'ALL' && p.testingStatus !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.projectName.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      p.modules.some(m => m.toLowerCase().includes(q)) ||
      p.employees.some(e => e.employeeName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 2. MAIN TESTING PAGE TOP HEADER (Strict prompt requirement) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                <ShieldCheck size={13} />
                Quality Assurance Hub
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Testing &amp; QA
            </h1>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Project Quality Gate
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHubData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search project, module, or developer..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Quality Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value="ALL">All Projects</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="TESTING REQUIRED">Testing Required</option>
              <option value="COMPLETED">Completed</option>
              <option value="DEVELOPMENT">In Development</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. PROJECT CARDS (Expandable single cards per project) */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading project quality gates...
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="space-y-5">
          {filteredProjects.map((prj) => {
            const isExpanded = !!expandedProjects[prj.projectId];
            const isEmpTestingReady = (e: any) =>
              e.shouldPulse ||
              (e.status && (e.status.includes('TESTING') || e.status === 'READY_FOR_TESTING')) ||
              (e.completionPercentage >= 80 && !e.status.includes('CERTIFIED') && !e.status.includes('COMPLETED') && !e.status.includes('PASSED') && !e.status.includes('APPROVED'));

            const hasTestingWaiting = prj.employees.some(isEmpTestingReady);
            const activeFilter = empFilters[prj.projectId] || 'ALL';
            const testingCount = prj.employees.filter(isEmpTestingReady).length;
            const devCount = prj.employees.filter(e => !isEmpTestingReady(e) && !e.status.includes('CERTIFIED') && !e.status.includes('PASSED')).length;
            const displayedEmployees = prj.employees
              .filter(e => {
                if (activeFilter === 'TESTING') return isEmpTestingReady(e);
                if (activeFilter === 'DEV') return !isEmpTestingReady(e) && !e.status.includes('CERTIFIED') && !e.status.includes('PASSED');
                return true;
              })
              .sort((a, b) => {
                const aWait = isEmpTestingReady(a);
                const bWait = isEmpTestingReady(b);
                if (aWait && !bWait) return -1;
                if (!aWait && bWait) return 1;
                if (b.completionPercentage !== a.completionPercentage) {
                  return b.completionPercentage - a.completionPercentage;
                }
                return a.employeeName.localeCompare(b.employeeName);
              });

            return (
              <div
                key={prj.projectId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Expandable Project Card Header */}
                <div
                  onClick={() => toggleExpand(prj.projectId)}
                  className="p-6 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition select-none flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {prj.projectName}
                      </h2>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Project ID: {prj.projectCode || prj.projectId}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Modules:</span>{' '}
                      {prj.modules.join(', ')}
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-xs">
                      <span className="text-slate-500">Testing Requests: </span>
                      <strong className="text-blue-700 dark:text-blue-400 font-black">{prj.testingRequestsCount}</strong>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/60 text-xs">
                      <span className="text-slate-500">Bugs: </span>
                      <strong className="text-rose-700 dark:text-rose-400 font-black">{prj.bugsCount}</strong>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                      Testing Status:{' '}
                      <span className={hasTestingWaiting ? 'text-blue-600 font-black' : 'text-slate-600'}>
                        {prj.testingStatus}
                      </span>
                    </div>

                    <button
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content: Project Employees & Workflows */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                    {/* Section Controls: Order & Filter Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Project Employees &amp; Quality Gates
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                            {displayedEmployees.length} of {prj.employees.length} Engineers
                          </span>
                        </div>

                        {/* Interactive Order & Filter Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Filter Tabs */}
                          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
                            <button
                              onClick={() => setEmpFilters(prev => ({ ...prev, [prj.projectId]: 'ALL' }))}
                              className={`px-3 py-1 rounded-lg transition ${
                                activeFilter === 'ALL'
                                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              All ({prj.employees.length})
                            </button>
                            <button
                              onClick={() => setEmpFilters(prev => ({ ...prev, [prj.projectId]: 'TESTING' }))}
                              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                                activeFilter === 'TESTING'
                                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                  : 'text-blue-700 dark:text-blue-400 hover:text-blue-800'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                              Testing Queue ({testingCount})
                            </button>
                            <button
                              onClick={() => setEmpFilters(prev => ({ ...prev, [prj.projectId]: 'DEV' }))}
                              className={`px-3 py-1 rounded-lg transition ${
                                activeFilter === 'DEV'
                                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              In Dev ({devCount})
                            </button>
                          </div>

                          {/* Project Testing Documents Button */}
                          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setSelectedProjectForDocs({ 
                                projectId: prj.projectId, 
                                projectName: prj.projectName,
                                employees: prj.employees.map(e => ({ employeeId: e.employeeId, employeeName: e.employeeName, role: e.role }))
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs transition shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer group"
                              title={`View all testing documents for ${prj.projectName}`}
                            >
                              <FileText size={14} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                              <span>Testing Documents</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Clean Ordered Table Header */}
                      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs bg-white dark:bg-slate-900">
                        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                          <div className="col-span-1 text-center">Order</div>
                          <div className="col-span-3">Engineer / Developer</div>
                          <div className="col-span-2">Assigned Module</div>
                          <div className="col-span-2">Task Completion</div>
                          <div className="col-span-2 text-center">Testing Status</div>
                          <div className="col-span-2 text-right">Action</div>
                        </div>

                        {/* Employee Rows Table: Strictly Sorted in Priority Order */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {displayedEmployees.map((emp, idx) => {
                            const isTestingReady = emp.shouldPulse || 
                              (emp.status && (emp.status.includes('TESTING') || emp.status === 'READY_FOR_TESTING')) ||
                              (emp.completionPercentage >= 80 && !emp.status.includes('CERTIFIED') && !emp.status.includes('COMPLETED') && !emp.status.includes('PASSED') && !emp.status.includes('APPROVED'));
                            const rankNum = String(idx + 1).padStart(2, '0');

                            return (
                              <div
                                key={emp.employeeId + '-' + emp.moduleId}
                                className={`p-4 lg:px-6 lg:py-4 transition flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:items-center ${
                                  isTestingReady
                                    ? 'bg-blue-50/40 dark:bg-blue-950/25 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                                    : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                {/* 0. Order / Priority Number */}
                                <div className="col-span-1 flex items-center lg:justify-center">
                                  {isTestingReady ? (
                                    <div className="flex flex-col items-center">
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black bg-blue-600 text-white shadow-xs">
                                        #{rankNum}
                                      </span>
                                      <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-tighter">
                                        QA P{idx + 1}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                                      #{rankNum}
                                    </span>
                                  )}
                                </div>

                                {/* 1. Employee Column */}
                                <div className="col-span-3 flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl shrink-0 overflow-hidden border-2 shadow-xs ${
                                    isTestingReady 
                                      ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800' 
                                      : 'border-slate-300 dark:border-slate-700'
                                  }`}>
                                    <img
                                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.employeeName)}&background=${isTestingReady ? '2563eb' : '475569'}&color=fff&size=80&bold=true&rounded=true`}
                                      alt={emp.employeeName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const t = e.currentTarget;
                                        t.onerror = null;
                                        t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.employeeName.charAt(0))}&background=64748b&color=fff&size=80&bold=true`;
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5 flex-wrap">
                                      <span>{emp.employeeName}</span>
                                      {isTestingReady && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white animate-pulse shadow-xs shrink-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                          <span>TESTING</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono truncate">
                                      {emp.employeeId} &bull; {emp.role}
                                    </div>
                                  </div>
                                </div>

                                {/* 2. Module Column */}
                                <div className="col-span-2 flex flex-col justify-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                                    Assigned Module
                                  </span>
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-bold text-xs w-fit">
                                    <FolderGit2 size={13} className="text-blue-600 shrink-0" />
                                    <span>{emp.moduleName}</span>
                                  </div>
                                </div>

                                {/* 3. Task Completion Progress Column */}
                                <div className="col-span-2 space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                      Tasks
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      {emp.completedTasks} / {emp.totalTasks}{' '}
                                      <strong className={`font-extrabold ${
                                        emp.completionPercentage >= 100
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : emp.completionPercentage >= 90
                                          ? 'text-purple-600 dark:text-purple-400'
                                          : emp.completionPercentage >= 80
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-slate-600'
                                      }`}>
                                        ({emp.completionPercentage}%)
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${Math.min(100, emp.completionPercentage)}%` }}
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        emp.completionPercentage === 100
                                          ? 'bg-emerald-500'
                                          : emp.completionPercentage >= 90
                                          ? 'bg-purple-600'
                                          : emp.completionPercentage >= 80
                                          ? 'bg-blue-600'
                                          : 'bg-slate-400 dark:bg-slate-600'
                                      }`}
                                    />
                                  </div>
                                  {/* 3-Milestone Stepper: P1 (80%) -> P2 (90%) -> P3 (100%) */}
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-1">
                                    <span className={`px-1.5 py-0.5 rounded ${emp.completionPercentage >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                      P1 80%
                                    </span>
                                    <span>&rarr;</span>
                                    <span className={`px-1.5 py-0.5 rounded ${emp.completionPercentage >= 90 ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                      P2 90%
                                    </span>
                                    <span>&rarr;</span>
                                    <span className={`px-1.5 py-0.5 rounded ${emp.completionPercentage >= 100 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                      P3 100%
                                    </span>
                                  </div>
                                </div>

                                {/* 4. Testing Status Badge Column */}
                                <div className="col-span-2 flex flex-col items-start lg:items-center justify-center gap-1">
                                  {isTestingReady ? (
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shadow-md transition-all animate-pulse bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-300/50">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                      </span>
                                      <span className="tracking-wide">TESTING</span>
                                      <span className="text-[9px] bg-white/25 px-1.5 py-0.2 rounded font-black uppercase">
                                        {emp.testingPhase === 3 || emp.completionPercentage >= 100
                                          ? 'Phase 3'
                                          : emp.testingPhase === 2 || emp.completionPercentage >= 90
                                          ? 'Phase 2'
                                          : 'Phase 1'}
                                      </span>
                                    </div>
                                  ) : emp.status.includes('CERTIFIED') || emp.status === 'COMPLETED' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 size={13} />
                                      {emp.status}
                                    </span>
                                  ) : emp.status.includes('PASSED') ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                      <CheckCircle2 size={13} />
                                      {emp.status}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                                      DEVELOPMENT
                                    </span>
                                  )}
                                  {emp.phaseName && (
                                    <span className={`text-[10px] font-bold truncate max-w-[170px] ${
                                      isTestingReady ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                                    }`}>
                                      {emp.phaseName}
                                    </span>
                                  )}
                                </div>

                                {/* 5. Action Button Column */}
                                <div className="col-span-2 flex justify-start lg:justify-end">
                                  <button
                                    onClick={() => onOpenWorkspace(prj.projectId, emp.employeeId, emp.moduleId)}
                                    className={`w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer whitespace-nowrap ${
                                      isTestingReady
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span>{isTestingReady ? 'Open Testing Workspace' : 'Inspect Quality'}</span>
                                    <ArrowRight size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Quick Button to Open First Testing Request in Project */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          const targetEmp = prj.employees.find(e => e.shouldPulse) || prj.employees[0];
                          if (targetEmp) {
                            onOpenWorkspace(prj.projectId, targetEmp.employeeId, targetEmp.moduleId);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition"
                      >
                        [ Open Project Testing ]
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
          No projects matching filter criteria.
        </div>
      )}

      {/* Project Testing Documents Modal */}
      {selectedProjectForDocs && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {selectedProjectForDocs.projectName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Project Documents
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Official Quality Gate Reports &amp; Verified Testing Documents for this project
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProjectForDocs(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body with Scoped Project Testing Documents */}
            <div className="p-6 overflow-y-auto flex-1">
              <TestingDocumentsView
                projectId={selectedProjectForDocs.projectId}
                title={`${selectedProjectForDocs.projectName} Testing Documents`}
                subtitle="All submitted, approved, and archived quality gate reports for this project"
                projectEmployees={selectedProjectForDocs.employees}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
