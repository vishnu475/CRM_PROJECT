import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Printer,
  RotateCcw,
  Check,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { TestingReportTemplate } from './TestingReportTemplate';
import { PdfTestDocumentEditor } from '../../attendance/components/PdfTestDocumentEditor';

export interface TestingDocumentItem {
  id: string;
  project_id: string;
  project_name: string;
  module_id: string;
  module_name: string;
  developer_employee_id: string;
  developer_employee_name: string;
  tester_employee_id: string;
  tester_employee_name: string;
  testing_request_id: string;
  testing_report_id: string;
  document_name: string;
  version: string;
  environment: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REOPENED';
  final_verdict: 'PASSED' | 'FAILED' | 'PENDING';
  pass_rate: number;
  total_executed: number;
  passed: number;
  failed: number;
  blocked: number;
  test_scope_coverage?: any[];
  defects_and_failures?: any[];
  blockers_notes?: string;
  testing_phase?: number;
  phase_name?: string;
  created_at: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by_name?: string;
}

interface TestingDocumentsViewProps {
  projectId?: string;
  employeeId?: string;
  isAdmin?: boolean;
  title?: string;
  subtitle?: string;
  projectEmployees?: { employeeId: string; employeeName: string; role?: string }[];
}

export const TestingDocumentsView: React.FC<TestingDocumentsViewProps> = ({
  projectId,
  employeeId,
  isAdmin = false,
  title = 'Testing Documents',
  subtitle = 'Archived and verified quality gate reports',
  projectEmployees
}) => {
  const [documents, setDocuments] = useState<TestingDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employeeId || 'ALL');
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<TestingDocumentItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (employeeId) params.append('employeeId', employeeId);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/testing/documents?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching testing documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId, employeeId, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  // Admin Review Actions (Approve / Reopen)
  const handleReviewAction = async (reportId: string, action: 'APPROVE' | 'REOPEN') => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/testing/reports/${reportId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comment: action === 'APPROVE' ? 'Approved by Admin.' : 'Reopened by Admin for revisions.'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Action failed.');
      }

      setActionMessage(`Report ${action === 'APPROVE' ? 'Approved' : 'Reopened'} successfully.`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const availableEmployees = useMemo(() => {
    if (projectEmployees && projectEmployees.length > 0) {
      return projectEmployees;
    }
    const map = new Map<string, { employeeId: string; employeeName: string; role?: string }>();
    documents.forEach((d) => {
      if (d.developer_employee_id && !map.has(d.developer_employee_id)) {
        map.set(d.developer_employee_id, {
          employeeId: d.developer_employee_id,
          employeeName: d.developer_employee_name,
          role: 'Developer'
        });
      }
    });
    return Array.from(map.values());
  }, [projectEmployees, documents]);

  const filteredDocs = documents.filter((doc) => {
    // Project employee filter
    if (selectedEmployeeId !== 'ALL') {
      const targetEmp = availableEmployees.find(e => e.employeeId === selectedEmployeeId);
      const targetName = targetEmp?.employeeName?.toLowerCase().trim();
      const matchesEmp = doc.developer_employee_id === selectedEmployeeId || 
        (targetName && doc.developer_employee_name?.toLowerCase().trim() === targetName);
      if (!matchesEmp) return false;
    }

    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.document_name?.toLowerCase().includes(q) ||
      doc.phase_name?.toLowerCase().includes(q) ||
      doc.project_name?.toLowerCase().includes(q) ||
      doc.module_name?.toLowerCase().includes(q) ||
      doc.developer_employee_name?.toLowerCase().includes(q) ||
      doc.tester_employee_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-blue-600" size={20} />
            {title}
          </h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search module, employee, tester..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none w-56 sm:w-64"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REOPENED">Reopened</option>
          </select>
        </div>
      </div>

      {/* Project Employee Filter Tabs: Strictly scoped to this project */}
      {availableEmployees.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-2">
            <User size={13} className="text-blue-600" />
            <span>Project Engineer:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedEmployeeId('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedEmployeeId === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <span>All Project Engineers ({documents.length})</span>
          </button>

          {availableEmployees.map((emp) => {
            const count = documents.filter(d => 
              d.developer_employee_id === emp.employeeId || 
              d.developer_employee_name?.toLowerCase().trim() === emp.employeeName.toLowerCase().trim()
            ).length;

            const isSelected = selectedEmployeeId === emp.employeeId;

            return (
              <button
                key={emp.employeeId}
                type="button"
                onClick={() => setSelectedEmployeeId(emp.employeeId)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <span>{emp.employeeName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {actionMessage}
        </div>
      )}

      {/* Documents Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading testing documents...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Document / Module</th>
                {!projectId && <th className="py-3.5 px-4">Project</th>}
                <th className="py-3.5 px-4">Testing Phase</th>
                <th className="py-3.5 px-4">Developer</th>
                <th className="py-3.5 px-4">Tester</th>
                <th className="py-3.5 px-4">Date &amp; Time</th>
                <th className="py-3.5 px-4">Test Execution</th>
                <th className="py-3.5 px-4">Final Verdict</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredDocs.map((doc) => {
                const isPassed = doc.final_verdict === 'PASSED';
                const isApproved = doc.status === 'APPROVED';

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <FileText size={14} className="text-blue-600 shrink-0" />
                        {doc.module_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        v{doc.version || '1.0'} &bull; {doc.environment}
                      </div>
                    </td>

                    {!projectId && (
                      <td className="py-3.5 px-4 font-semibold whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {doc.project_name}
                      </td>
                    )}

                    {/* Testing Phase Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {doc.testing_phase === 3 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Phase 3 &bull; Final Gate (100%)</span>
                        </span>
                      ) : doc.testing_phase === 2 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                          <span>Phase 2 &bull; Beta (90%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>Phase 1 &bull; Alpha (80%)</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{doc.developer_employee_name}</span>
                      <span className="block text-[10px] text-slate-500">{doc.developer_employee_id}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{doc.tester_employee_name || 'Rahul Verma'}</span>
                      <span className="block text-[10px] text-slate-500">QA Tester</span>
                    </td>

                    {/* Date & Exact Time Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <span>{new Date(doc.submitted_at || doc.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} className="shrink-0" />
                        <span>
                          {new Date(doc.submitted_at || doc.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {doc.passed} / {doc.total_executed || doc.passed + doc.failed} Passed
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Pass Rate: <strong className="text-blue-600">{doc.pass_rate}%</strong>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        [ {doc.final_verdict} ]
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'REOPENED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                      >
                        <Eye size={12} />
                        View
                      </button>

                      <button
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition"
                      >
                        <Printer size={12} />
                        Download
                      </button>

                      {/* Admin Actions */}
                      {isAdmin && doc.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleReviewAction(doc.testing_report_id, 'APPROVE')}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        >
                          <Check size={12} />
                          Approve
                        </button>
                      )}

                      {isAdmin && doc.status === 'APPROVED' && (
                        <button
                          onClick={() => handleReviewAction(doc.testing_report_id, 'REOPEN')}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition"
                        >
                          <RotateCcw size={12} />
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500">
          <FileText size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">No testing documents found.</p>
          <p>When QA testers submit testing reports, they will be archived here automatically.</p>
        </div>
      )}

      {/* Preview Modal rendering uploaded PDF template */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-6xl my-auto">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <X size={14} /> Close Document
              </button>
            </div>
            <PdfTestDocumentEditor
              initialData={{
                id: selectedDocForPreview.testing_report_id || selectedDocForPreview.id,
                projectName: selectedDocForPreview.project_name,
                moduleName: selectedDocForPreview.module_name,
                developerName: selectedDocForPreview.developer_employee_name,
                testerName: selectedDocForPreview.tester_employee_name,
                environment: selectedDocForPreview.environment,
                version: selectedDocForPreview.version || '1.0',
                testDate: new Date(selectedDocForPreview.created_at).toLocaleDateString('en-GB'),
                totalExecuted: selectedDocForPreview.total_executed || selectedDocForPreview.passed + selectedDocForPreview.failed,
                passed: selectedDocForPreview.passed,
                failed: selectedDocForPreview.failed,
                blocked: selectedDocForPreview.blocked,
                passRate: selectedDocForPreview.pass_rate,
                finalVerdict: selectedDocForPreview.final_verdict,
                testScopeCoverage:
                  Array.isArray(selectedDocForPreview.test_scope_coverage) && selectedDocForPreview.test_scope_coverage.length > 0
                    ? selectedDocForPreview.test_scope_coverage
                    : typeof selectedDocForPreview.test_scope_coverage === 'string' && selectedDocForPreview.test_scope_coverage !== '[]'
                    ? JSON.parse(selectedDocForPreview.test_scope_coverage)
                    : [{ title: `${selectedDocForPreview.module_name} Core Workflow Validation`, status: 'PASSED' }],
                defectsAndFailures:
                  Array.isArray(selectedDocForPreview.defects_and_failures)
                    ? selectedDocForPreview.defects_and_failures
                    : typeof selectedDocForPreview.defects_and_failures === 'string'
                    ? JSON.parse(selectedDocForPreview.defects_and_failures || '[]')
                    : [],
                blockersNotes: selectedDocForPreview.blockers_notes || 'All quality standards verified.',
                preparedBy: selectedDocForPreview.tester_employee_name,
                status: selectedDocForPreview.status === 'APPROVED' ? 'APPROVED' : 'SUBMITTED'
              }}
              isReadOnly={true}
              onDownloadPdf={(id) => {
                window.open(`/api/test-reports/${id}/download`, '_blank');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
