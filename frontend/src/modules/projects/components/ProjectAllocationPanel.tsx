import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Layers, CheckCircle2, Clock, AlertCircle, RefreshCw,
  ChevronRight, FlaskConical, Trash2, UserPlus, Briefcase, X, TrendingUp,
  Send, Shield, CheckCheck, Tag, Building2, Calendar, BarChart3, Zap
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { taskApiService } from '../../tasks/services/taskService';

interface ProjectAllocationPanelProps {
  projectId: string;
  projectName?: string;
}

/**
 * ProjectAllocationPanel — Admin panel for managing project → employee allocations.
 *
 * Shows the team roster (who is allocated to which module), live task progress,
 * and testing status for each allocated employee.
 * Allows admin to add new allocations and view module-level completion.
 */
export const ProjectAllocationPanel: React.FC<ProjectAllocationPanelProps> = ({
  projectId,
  projectName
}) => {
  const { employees = [] } = useApp();

  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add allocation form state
  const [newAlloc, setNewAlloc] = useState({
    employeeId: '',
    moduleId: '',
    role: 'Developer'
  });
  const [modules, setModules] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAllocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskApiService.getProjectAllocations(projectId);
      setAllocations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project allocations');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/modules');
      const json = await res.json();
      if (json.success) setModules(json.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  useEffect(() => {
    if (showAddModal) fetchModules();
  }, [showAddModal]);

  const handleAddAllocation = async () => {
    if (!newAlloc.employeeId || !newAlloc.moduleId) {
      setErrorMsg('Please select an employee and a module.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    const emp = employees.find(e => (e.empCode || e.id) === newAlloc.employeeId);
    const mod = modules.find(m => m.id === newAlloc.moduleId);

    try {
      await taskApiService.createAllocation({
        projectId,
        projectName,
        employeeId: newAlloc.employeeId,
        employeeName: emp?.name,
        moduleId: newAlloc.moduleId,
        moduleName: mod?.name,
        role: newAlloc.role
      });
      setSuccessMsg(`${emp?.name} allocated to ${mod?.name} module!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setShowAddModal(false);
      setNewAlloc({ employeeId: '', moduleId: '', role: 'Developer' });
      await fetchAllocations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create allocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (alloc: any) => {
    const status = alloc.testing_status;
    const pct = parseFloat(alloc.completion_percentage || 0);

    if (status === 'READY_FOR_TESTING') return { label: 'QA Queue', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <FlaskConical size={9} /> };
    if (status === 'TESTING_IN_PROGRESS') return { label: 'In Testing', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <Shield size={9} /> };
    if (status === 'TESTING_PASSED' || status === 'APPROVED') return { label: 'QA Passed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCheck size={9} /> };
    if (status === 'TESTING_FAILED') return { label: 'QA Failed', color: 'bg-red-100 text-red-700 border-red-300', icon: <AlertCircle size={9} /> };
    if (pct === 100) return { label: '100% Done', color: 'bg-teal-100 text-teal-800 border-teal-300', icon: <CheckCircle2 size={9} /> };
    if (pct > 50) return { label: `${Math.round(pct)}% Done`, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <TrendingUp size={9} /> };
    if (pct > 0) return { label: `${Math.round(pct)}%`, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Zap size={9} /> };
    return { label: 'Not Started', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: <Clock size={9} /> };
  };

  const getRingColor = (pct: number, testingStatus?: string) => {
    if (testingStatus === 'READY_FOR_TESTING' || testingStatus === 'TESTING_IN_PROGRESS') return '#f59e0b';
    if (testingStatus === 'TESTING_PASSED' || testingStatus === 'APPROVED') return '#10b981';
    if (testingStatus === 'TESTING_FAILED') return '#ef4444';
    if (pct === 100) return '#10b981';
    if (pct >= 70) return '#3b82f6';
    if (pct >= 40) return '#8b5cf6';
    return '#94a3b8';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <Users size={20} className="text-white" />
          </div>
          <p className="text-xs font-bold text-slate-600">Loading project allocation roster…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <AlertCircle size={24} className="text-red-400 mx-auto" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <button onClick={fetchAllocations} className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer hover:bg-violet-700 transition">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fade-in">
          <CheckCheck size={14} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-fade-in">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Users size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Project Team Roster</p>
            <p className="text-[10px] text-slate-500">{allocations.length} member{allocations.length !== 1 ? 's' : ''} allocated</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllocations}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold hover:from-violet-700 hover:to-indigo-700 transition shadow-sm cursor-pointer"
          >
            <UserPlus size={13} />
            Allocate Employee
          </button>
        </div>
      </div>

      {/* Empty State */}
      {allocations.length === 0 && (
        <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <Users size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-500">No employees allocated yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Allocate Employee" to assign team members to modules</p>
        </div>
      )}

      {/* Allocation Cards */}
      <div className="grid grid-cols-1 gap-3">
        {allocations.map((alloc) => {
          const pct = parseFloat(alloc.completion_percentage || 0);
          const total = parseInt(alloc.total_tasks || 0, 10);
          const completed = parseInt(alloc.completed_tasks || 0, 10);
          const badge = getStatusBadge(alloc);
          const ringColor = getRingColor(pct, alloc.testing_status);
          const circumference = 2 * Math.PI * 22;

          return (
            <div
              key={alloc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Circular Progress */}
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                      <circle
                        cx="28" cy="28" r="22" fill="none"
                        stroke={ringColor} strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - pct / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="font-black text-[11px] text-slate-800 leading-none">{Math.round(pct)}%</span>
                      <span className="text-[8px] text-slate-400 leading-none">done</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-violet-200 shadow-sm shrink-0">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(alloc.employee_name || 'E')}&background=6d28d9&color=fff&size=56&bold=true&rounded=true`}
                              alt={alloc.employee_name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://ui-avatars.com/api/?name=E&background=6d28d9&color=fff&size=56'; }}
                            />
                          </div>
                          <p className="font-extrabold text-sm text-slate-900 truncate">{alloc.employee_name}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">{alloc.employee_id}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${badge.color}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                        <Layers size={9} className="text-indigo-500" />
                        {alloc.module_name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        <Briefcase size={9} />
                        {alloc.role}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={9} className="text-emerald-500" />
                        {completed}/{total} tasks
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: ringColor }}
                      />
                    </div>

                    {/* Testing Status Chip */}
                    {alloc.testing_request_id && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {alloc.testing_status === 'READY_FOR_TESTING' && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                            <FlaskConical size={9} /> Awaiting QA Assignment
                          </span>
                        )}
                        {alloc.testing_status === 'TESTING_IN_PROGRESS' && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Shield size={9} /> QA In Progress
                          </span>
                        )}
                        {(alloc.testing_status === 'TESTING_PASSED' || alloc.testing_status === 'APPROVED') && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCheck size={9} /> QA Approved ✓
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {allocations.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            {
              label: 'Avg Progress',
              value: `${Math.round(allocations.reduce((s, a) => s + parseFloat(a.completion_percentage || 0), 0) / allocations.length)}%`,
              color: 'from-blue-500 to-indigo-600',
              icon: <BarChart3 size={14} />
            },
            {
              label: 'In QA',
              value: allocations.filter(a => ['READY_FOR_TESTING', 'TESTING_IN_PROGRESS'].includes(a.testing_status)).length,
              color: 'from-amber-500 to-orange-500',
              icon: <FlaskConical size={14} />
            },
            {
              label: 'Approved',
              value: allocations.filter(a => ['TESTING_PASSED', 'APPROVED'].includes(a.testing_status)).length,
              color: 'from-emerald-500 to-teal-600',
              icon: <CheckCheck size={14} />
            }
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} p-3 rounded-2xl text-white text-center shadow-sm`}>
              <div className="flex items-center justify-center gap-1 mb-0.5 opacity-80">{stat.icon}</div>
              <p className="text-lg font-black leading-none">{stat.value}</p>
              <p className="text-[9px] font-semibold opacity-80 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Allocation Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => !isSubmitting && setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base">Allocate Employee</h3>
                    <p className="text-xs text-white/80">Assign an employee to a module in {projectName || projectId}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  <AlertCircle size={13} /> {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAlloc.employeeId}
                  onChange={e => setNewAlloc(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="">Select employee…</option>
                  {employees.map(emp => (
                    <option key={emp.empCode || emp.id} value={emp.empCode || emp.id}>
                      {emp.name} ({emp.empCode || emp.id}) — {emp.designation || (emp as any).role || 'Developer'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Module <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAlloc.moduleId}
                  onChange={e => setNewAlloc(prev => ({ ...prev, moduleId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="">Select module…</option>
                  {modules.map(mod => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Role in Project</label>
                <select
                  value={newAlloc.role}
                  onChange={e => setNewAlloc(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  {['Developer', 'Lead Developer', 'Senior Developer', 'QA Engineer', 'Senior QA Engineer', 'Product Manager', 'Tech Lead', 'Frontend Specialist', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAllocation}
                  disabled={isSubmitting || !newAlloc.employeeId || !newAlloc.moduleId}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs hover:from-violet-700 hover:to-indigo-700 transition shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><RefreshCw size={12} className="animate-spin" /> Allocating…</>
                  ) : (
                    <><UserPlus size={12} /> Allocate</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAllocationPanel;
