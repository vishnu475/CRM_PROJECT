import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  Bug as BugIcon,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectCentricHub } from './components/ProjectCentricHub';
import { ProjectModuleWorkspace } from './components/ProjectModuleWorkspace';
import { TestingDocumentsView } from './components/TestingDocumentsView';

type TestingTab = 'projects' | 'documents' | 'bugs' | 'audit';

export const TestingPage: React.FC = () => {
  const { userProfile, userRole } = useApp();
  const isAdmin = userRole === 'HRAdmin' || userRole === 'Executive' || (userRole as any) === 'Admin' || (userProfile as any)?.role === 'Admin';

  const [activeTab, setActiveTab] = useState<TestingTab>('projects');
  
  // Workspace State
  const [workspaceTarget, setWorkspaceTarget] = useState<{
    projectId: string;
    employeeId: string;
    moduleId: string;
  } | null>(null);

  // Global Bugs tab state
  const [bugs, setBugs] = useState<any[]>([]);
  const [bugSearch, setBugSearch] = useState('');
  const [bugSeverity, setBugSeverity] = useState('ALL');
  const [isBugsLoading, setIsBugsLoading] = useState(false);

  // Global Audit Logs tab state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Deep Link Routing Parser
  useEffect(() => {
    const parsePath = () => {
      const path = window.location.pathname;
      const match = path.match(/\/testing\/project\/([^/]+)\/employee\/([^/]+)\/module\/([^/]+)/i);
      if (match) {
        setWorkspaceTarget({
          projectId: match[1],
          employeeId: match[2],
          moduleId: match[3]
        });
      } else if (path.includes('/testing/documents')) {
        setActiveTab('documents');
        setWorkspaceTarget(null);
      } else {
        setWorkspaceTarget(null);
      }
    };

    parsePath();
    window.addEventListener('popstate', parsePath);
    return () => window.removeEventListener('popstate', parsePath);
  }, []);

  const handleOpenWorkspace = (projectId: string, employeeId: string, moduleId: string) => {
    const newPath = `/testing/project/${projectId}/employee/${employeeId}/module/${moduleId}`;
    window.history.pushState({}, '', newPath);
    setWorkspaceTarget({ projectId, employeeId, moduleId });
  };

  const handleBackToHub = () => {
    window.history.pushState({}, '', '/testing');
    setWorkspaceTarget(null);
  };

  // Fetch bugs for secondary bug management tab
  const fetchBugs = async () => {
    try {
      setIsBugsLoading(true);
      const res = await fetch('/api/testing/bugs');
      const json = await res.json();
      if (json.success) setBugs(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBugsLoading(false);
    }
  };

  // Fetch audit logs for secondary audit tab
  const fetchAuditLogs = async () => {
    try {
      setIsLogsLoading(true);
      const res = await fetch('/api/testing/audit-logs');
      const json = await res.json();
      if (json.success) setAuditLogs(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bugs') fetchBugs();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // If in deep workspace mode, render the Project Module Workspace
  if (workspaceTarget) {
    return (
      <ProjectModuleWorkspace
        projectId={workspaceTarget.projectId}
        employeeId={workspaceTarget.employeeId}
        moduleId={workspaceTarget.moduleId}
        onBack={handleBackToHub}
        onReportSubmitted={() => {
          // Stay or return
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Quality Gate Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('projects');
              window.history.pushState({}, '', '/testing');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            Project Quality Gate
          </button>

          <button
            onClick={() => {
              setActiveTab('documents');
              window.history.pushState({}, '', '/testing/documents');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'documents'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            Testing Documents
          </button>

          <button
            onClick={() => setActiveTab('bugs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'bugs'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BugIcon size={14} />
            Bug Tracker
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock size={14} />
            QA Audit Trail
          </button>
        </div>

        {/* Live System State Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>70% Auto-Quality Gate Active</span>
        </div>
      </div>

      {/* Tab 1: Project-Centric Quality Gate Hub */}
      {activeTab === 'projects' && (
        <ProjectCentricHub onOpenWorkspace={handleOpenWorkspace} />
      )}

      {/* Tab 2: Admin & Global Testing Documents */}
      {activeTab === 'documents' && (
        <TestingDocumentsView
          isAdmin={isAdmin}
          title="Global Testing Documents"
          subtitle="Admin & QA central repository of submitted and approved quality reports"
        />
      )}

      {/* Tab 3: Bug Management */}
      {activeTab === 'bugs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Global Bug Registry</h2>
              <p className="text-xs text-slate-500">Live defects logged across projects and modules</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bugSearch}
                onChange={(e) => setBugSearch(e.target.value)}
                placeholder="Filter bugs..."
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <select
                value={bugSeverity}
                onChange={(e) => setBugSeverity(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {isBugsLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading defects...</div>
          ) : bugs.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Bug ID</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Developer</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {bugs
                    .filter((b) => {
                      if (bugSeverity !== 'ALL' && b.severity !== bugSeverity) return false;
                      if (!bugSearch) return true;
                      const q = bugSearch.toLowerCase();
                      return (
                        b.bug_id.toLowerCase().includes(q) ||
                        b.title.toLowerCase().includes(q) ||
                        b.module_name.toLowerCase().includes(q)
                      );
                    })
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{b.bug_id}</td>
                        <td className="py-3 px-4 font-medium">{b.project_name || 'HRMS ERP'}</td>
                        <td className="py-3 px-4 font-semibold">{b.module_name}</td>
                        <td className="py-3 px-4 font-bold">{b.title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {b.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4">{b.developer_employee_name}</td>
                        <td className="py-3 px-4 font-semibold">{b.status}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No bugs reported.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: QA Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Quality Assurance Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable trace of status changes, reports, and approvals</p>
          </div>

          {isLogsLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading audit history...</div>
          ) : auditLogs.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{log.action}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        {log.module_name}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{log.comment}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    <div>{log.user_name} ({log.user_role})</div>
                    <div>{new Date(log.created_at).toLocaleString('en-GB')}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No audit logs recorded.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default TestingPage;
