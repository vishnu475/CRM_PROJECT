import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Save,
  Download,
  Eye,
  RefreshCw,
  ShieldCheck,
  User,
  Layers,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Edit3
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { PdfTestDocumentEditor, TestDocumentData } from './PdfTestDocumentEditor';

export const AttendanceTestReportsTab: React.FC = () => {
  const { userProfile, userRole } = useApp();

  const currentUserId = (userProfile as any)?.empCode || (userProfile as any)?.id || 'EMP-004';
  const currentUserName = userProfile?.name || 'Rahul Verma';

  const roleStr = String(userRole || '');
  const isAdmin = (userRole as string) === 'HRAdmin' || (userRole as string) === 'Executive' || roleStr.toLowerCase().includes('admin');
  const isManager = isAdmin || (userRole as string) === 'SalesManager' || (userRole as string) === 'OperationsManager' || roleStr.toLowerCase().includes('manager');

  // Currently active report loaded into the PDF editor
  const [activeReport, setActiveReport] = useState<TestDocumentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // List of reports
  const [myReports, setMyReports] = useState<any[]>([]);
  const [managerReports, setManagerReports] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [activeListTab, setActiveListTab] = useState<'my' | 'manager' | 'admin'>('my');

  // Load report data on mount
  const loadReports = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch current Attendance test report or default draft
      const singleRes = await fetch(`/api/test-reports/REP-ATT-001`, {
        headers: {
          'x-employee-id': currentUserId,
          'x-user-role': userRole || 'Employee',
          'x-user-name': currentUserName
        }
      });
      const singleJson = await singleRes.json();
      if (singleJson.success && singleJson.data) {
        const d = singleJson.data;
        setActiveReport({
          id: d.id,
          projectName: d.project_name || 'Attendance',
          moduleName: d.module_name || 'Attendance & Biometric Kiosk',
          testerName: d.tester_name || currentUserName,
          developerName: d.developer_name || 'Vishnu Vardhan',
          testDate: d.test_date || new Date().toLocaleDateString('en-GB'),
          environment: d.environment || 'Pre-Production',
          version: d.version || '1.0',
          teamLead: d.team_lead || 'Sarah Jenkins',
          projectLead: d.project_lead || 'Sarah Jenkins',
          reportingManager: d.reporting_manager || 'Sarah Jenkins',
          totalExecuted: d.total_executed || 10,
          passed: d.passed || 9,
          failed: d.failed || 1,
          blocked: d.blocked || 0,
          passRate: Number(d.pass_rate) || 90.0,
          finalVerdict: d.final_verdict || 'PASSED',
          testScopeCoverage: d.test_scope_coverage || [],
          defectsAndFailures: d.defects_and_failures || [],
          blockersNotes: d.blockers_notes || '',
          preparedBy: d.prepared_by || d.tester_name || currentUserName,
          status: d.status || 'DRAFT',
          submittedAt: d.submitted_at,
          finalPdfPath: d.final_pdf_path
        });
      }

      // 2. Fetch Employee's own reports ("My Test Reports")
      const empRes = await fetch(`/api/test-reports/employee/${encodeURIComponent(currentUserId)}`, {
        headers: {
          'x-employee-id': currentUserId,
          'x-user-role': userRole || 'Employee',
          'x-user-name': currentUserName
        }
      });
      const empJson = await empRes.json();
      if (empJson.success) {
        setMyReports(empJson.data || []);
      }

      // 3. If Manager, fetch Team reports
      if (isManager) {
        const mgrRes = await fetch(`/api/test-reports/manager/${encodeURIComponent(currentUserId)}`, {
          headers: {
            'x-employee-id': currentUserId,
            'x-user-role': userRole || 'Manager',
            'x-user-name': currentUserName
          }
        });
        const mgrJson = await mgrRes.json();
        if (mgrJson.success) {
          setManagerReports(mgrJson.data || []);
        }
      }

      // 4. If Admin, fetch all reports
      if (isAdmin) {
        const adminRes = await fetch(`/api/test-reports/admin`, {
          headers: {
            'x-employee-id': currentUserId,
            'x-user-role': userRole || 'Admin',
            'x-user-name': currentUserName
          }
        });
        const adminJson = await adminRes.json();
        if (adminJson.success) {
          setAdminReports(adminJson.data || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to load test reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUserId, userRole]);

  // Handle Save Draft
  const handleSaveDraft = async (updatedData: TestDocumentData) => {
    const payload = {
      id: updatedData.id || 'REP-ATT-001',
      employee_id: 'EMP-005',
      tester_id: currentUserId,
      tester_name: updatedData.testerName,
      project_id: (updatedData as any).projectId || 'PRJ-3240',
      project_name: updatedData.projectName,
      test_date: updatedData.testDate,
      environment: updatedData.environment,
      total_executed: updatedData.totalExecuted,
      passed: updatedData.passed,
      failed: updatedData.failed,
      blocked: updatedData.blocked,
      pass_rate: updatedData.passRate,
      final_verdict: updatedData.finalVerdict,
      test_scope_coverage: updatedData.testScopeCoverage,
      defects_and_failures: updatedData.defectsAndFailures,
      blockers_notes: updatedData.blockersNotes,
      prepared_by: updatedData.preparedBy,
      status: 'DRAFT',
      draft_data: updatedData
    };

    const res = await fetch(`/api/test-reports/${encodeURIComponent(payload.id)}/draft`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': currentUserId,
        'x-user-role': userRole || 'Employee',
        'x-user-name': currentUserName
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Draft save error');
    setStatusNotice({ type: 'success', message: 'Draft saved in PostgreSQL backend! You can leave and continue later.' });
    setTimeout(() => setStatusNotice(null), 4000);
    loadReports();
  };

  // Handle Submit Report
  const handleSubmitReport = async (updatedData: TestDocumentData) => {
    const payload = {
      id: updatedData.id || 'REP-ATT-001',
      employee_id: 'EMP-005',
      tester_id: currentUserId,
      tester_name: updatedData.testerName,
      project_id: (updatedData as any).projectId || 'PRJ-3240',
      project_name: updatedData.projectName,
      test_date: updatedData.testDate,
      environment: updatedData.environment,
      total_executed: updatedData.totalExecuted,
      passed: updatedData.passed,
      failed: updatedData.failed,
      blocked: updatedData.blocked,
      pass_rate: updatedData.passRate,
      final_verdict: updatedData.finalVerdict,
      test_scope_coverage: updatedData.testScopeCoverage,
      defects_and_failures: updatedData.defectsAndFailures,
      blockers_notes: updatedData.blockersNotes,
      prepared_by: updatedData.preparedBy,
      status: 'SUBMITTED'
    };

    const res = await fetch(`/api/test-reports/${encodeURIComponent(payload.id)}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': currentUserId,
        'x-user-role': userRole || 'Employee',
        'x-user-name': currentUserName
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Submission error');
    setStatusNotice({ type: 'success', message: 'Test Report submitted and official PDF generated successfully!' });
    setTimeout(() => setStatusNotice(null), 5000);
    loadReports();
  };

  // Handle Download PDF
  const handleDownloadPdf = (reportId: string) => {
    window.open(`/api/test-reports/${encodeURIComponent(reportId)}/download`, '_blank');
  };

  // Select Report to View in Editor
  const handleSelectReport = (rep: any) => {
    setActiveReport({
      id: rep.id,
      projectName: rep.project_name || 'Attendance',
      moduleName: rep.project_name === 'Attendance' ? 'Attendance & Biometric Kiosk' : rep.project_name,
      testerName: rep.tester_name || rep.tester_full_name || 'Rahul Verma',
      developerName: rep.employee_name || 'Vishnu Vardhan',
      testDate: rep.test_date || '25/09/2026',
      environment: rep.environment || 'Pre-Production',
      version: rep.version || '1.0',
      teamLead: rep.team_lead || 'Sarah Jenkins',
      projectLead: rep.project_lead || 'Sarah Jenkins',
      reportingManager: rep.reporting_manager || rep.manager_name || 'Sarah Jenkins',
      totalExecuted: rep.total_executed || 10,
      passed: rep.passed || 9,
      failed: rep.failed || 1,
      blocked: rep.blocked || 0,
      passRate: Number(rep.pass_rate) || 90.0,
      finalVerdict: rep.final_verdict || 'PASSED',
      testScopeCoverage: rep.test_scope_coverage || [],
      defectsAndFailures: rep.defects_and_failures || [],
      blockersNotes: rep.blockers_notes || '',
      preparedBy: rep.prepared_by || rep.tester_name || 'Rahul Verma',
      status: rep.status || 'DRAFT',
      submittedAt: rep.submitted_at,
      finalPdfPath: rep.final_pdf_path
    });

    // Scroll smoothly to top document container
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* ─── A. TOP CONTEXT HEADER ────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-xs shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Attendance Test Document &amp; Compliance Workflow
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Official QA Template (Software Test Reports 1)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live document editor inside fixed container. Edit verification metrics, save backend drafts, and generate final certified PDFs.
            </p>
          </div>
        </div>

        {/* Quick Context Details Card */}
        {activeReport && (
          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Project</span>
              <span className="font-bold text-slate-800">{activeReport.projectName}</span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tester</span>
              <span className="font-bold text-slate-800">{activeReport.testerName}</span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Test Date</span>
              <span className="font-bold text-slate-800">{activeReport.testDate}</span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
              <span
                className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-md inline-block ${
                  activeReport.status === 'SUBMITTED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {activeReport.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold shadow-sm ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* ─── B. LARGE FIXED-HEIGHT TEST DOCUMENT CONTAINER (750px) ────────── */}
      {activeReport ? (
        <div className="space-y-2">
          <PdfTestDocumentEditor
            initialData={activeReport}
            isReadOnly={activeReport.status === 'SUBMITTED' && !isAdmin}
            onSaveDraft={handleSaveDraft}
            onSubmitReport={handleSubmitReport}
            onDownloadPdf={handleDownloadPdf}
            onReopen={async (id) => {
              if (!confirm('Are you sure you want to reopen this report for edits?')) return;
              const res = await fetch(`/api/test-reports/${encodeURIComponent(id)}/reopen`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-employee-id': currentUserId,
                  'x-user-role': userRole || 'Manager'
                },
                body: JSON.stringify({ reason: 'Reopened by manager for adjustments.' })
              });
              const json = await res.json();
              if (json.success) {
                setStatusNotice({ type: 'success', message: 'Report reopened successfully!' });
                loadReports();
              }
            }}
          />
        </div>
      ) : (
        <div className="w-full h-[750px] bg-slate-900 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-white space-y-3">
          <RefreshCw className="animate-spin text-blue-400" size={32} />
          <p className="text-xs text-slate-300 font-medium">Loading Attendance Test Document Template...</p>
        </div>
      )}

      {/* ─── C. TEST REPORTS DIRECTORY TABLES (EMPLOYEE, MANAGER, ADMIN) ──── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="text-blue-600" size={16} /> Test Reports &amp; Verification History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanent authoritative record of quality gate documents across projects and team reporting hierarchy.
            </p>
          </div>

          {/* Directory Tabs Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center text-xs">
            <button
              onClick={() => setActiveListTab('my')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeListTab === 'my' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Test Reports ({myReports.length})
            </button>

            {isManager && (
              <button
                onClick={() => setActiveListTab('manager')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeListTab === 'manager' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Employee Reports ({managerReports.length})
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveListTab('admin')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeListTab === 'admin' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin All ({adminReports.length})
              </button>
            )}
          </div>
        </div>

        {/* 1. MY TEST REPORTS (EMPLOYEE / TESTER VIEW) */}
        {activeListTab === 'my' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Project</th>
                  <th className="p-3">Document Title</th>
                  <th className="p-3">Tester</th>
                  <th className="p-3">Test Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Final Verdict</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                      No submitted or draft test reports recorded for your user ID.
                    </td>
                  </tr>
                ) : (
                  myReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{rep.project_name || 'Attendance'}</td>
                      <td className="p-3 text-slate-700 font-medium">Software Test Report (1)</td>
                      <td className="p-3 font-medium text-slate-600">{rep.tester_name || 'Rahul Verma'}</td>
                      <td className="p-3 text-slate-500">{rep.test_date || '25/09/2026'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                            rep.status === 'SUBMITTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold text-[11px] ${
                            rep.final_verdict === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {rep.final_verdict || 'PASSED'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {rep.status === 'DRAFT' ? (
                          <button
                            onClick={() => handleSelectReport(rep)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                          >
                            <Edit3 size={12} /> Continue Editing
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectReport(rep)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold transition"
                          >
                            <Eye size={12} /> View Report
                          </button>
                        )}
                        {rep.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleDownloadPdf(rep.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
                            title="Download PDF"
                          >
                            <Download size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. EMPLOYEE TEST REPORTS (MANAGER VIEW) */}
        {activeListTab === 'manager' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Test Document</th>
                  <th className="p-3">Tester</th>
                  <th className="p-3">Test Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Final Verdict</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {managerReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                      No team reports found under your managerial hierarchy.
                    </td>
                  </tr>
                ) : (
                  managerReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{rep.employee_name || 'Vishnu Vardhan'}</td>
                      <td className="p-3 font-mono text-slate-500">{rep.employee_id || 'EMP-005'}</td>
                      <td className="p-3 font-semibold text-slate-800">{rep.project_name || 'Attendance'}</td>
                      <td className="p-3 text-slate-600">Software Test Report (1)</td>
                      <td className="p-3 font-medium text-slate-700">{rep.tester_name || 'Rahul Verma'}</td>
                      <td className="p-3 text-slate-500">{rep.test_date || '25/09/2026'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                            rep.status === 'SUBMITTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">{rep.final_verdict || 'PASSED'}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleSelectReport(rep)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          <Eye size={12} /> View Report
                        </button>
                        {rep.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleDownloadPdf(rep.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition"
                            title="Download PDF"
                          >
                            <Download size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. ADMIN VIEW (ALL TEST REPORTS) */}
        {activeListTab === 'admin' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Tester</th>
                  <th className="p-3">Test Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Final Verdict</th>
                  <th className="p-3">Submitted Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                      No quality reports submitted yet.
                    </td>
                  </tr>
                ) : (
                  adminReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{rep.employee_name || 'Vishnu Vardhan'}</td>
                      <td className="p-3 font-semibold text-slate-800">{rep.project_name || 'Attendance'}</td>
                      <td className="p-3 font-medium text-slate-700">{rep.tester_name || 'Rahul Verma'}</td>
                      <td className="p-3 text-slate-500">{rep.test_date || '25/09/2026'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                            rep.status === 'SUBMITTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600">{rep.final_verdict || 'PASSED'}</td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {rep.submitted_at ? new Date(rep.submitted_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleSelectReport(rep)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          <Eye size={12} /> View Report
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(rep.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                        >
                          <Download size={12} /> Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
