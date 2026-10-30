import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Plus,
  Send,
  FileText,
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
  Clock,
  User,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  Eye,
  Edit3
} from 'lucide-react';
import { TestingReportTemplate } from './TestingReportTemplate';
import { PdfTestDocumentEditor } from '../../attendance/components/PdfTestDocumentEditor';

interface WorkspaceData {
  project: {
    id: string;
    name: string;
    code: string;
    projectManager: string;
    status: string;
  };
  developer: {
    id: string;
    name: string;
    designation: string;
    department: string;
  };
  module: {
    id: string;
    name: string;
    code: string;
  };
  tester: {
    id: string;
    name: string;
  };
  taskProgress: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionPercentage: number;
    tasks: any[];
  };
  testingRequest: {
    id: string;
    testingUrl: string;
    environment: string;
    version: string;
    status: string;
    testingPhase?: number;
    phaseName?: string;
    phaseStatus?: string;
    submittedDate: string;
    testingStartDate?: string;
  };
  testExecution: {
    totalTestCases: number;
    executedTestCases: number;
    passedTestCases: number;
    failedTestCases: number;
    blockedTestCases: number;
    passRate: number;
    finalVerdict: 'PASSED' | 'FAILED' | 'PENDING';
  };
  testCases: any[];
  bugs: any[];
  reports: any[];
}

interface ProjectModuleWorkspaceProps {
  projectId: string;
  employeeId: string;
  moduleId: string;
  onBack: () => void;
  onReportSubmitted?: () => void;
}

export const ProjectModuleWorkspace: React.FC<ProjectModuleWorkspaceProps> = ({
  projectId,
  employeeId,
  moduleId,
  onBack,
  onReportSubmitted
}) => {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Actual result inputs per test case
  const [actualResults, setActualResults] = useState<{ [tcId: string]: string }>({});
  
  // Bug Reporting Modal State
  const [showBugModal, setShowBugModal] = useState(false);
  const [selectedTestCaseForBug, setSelectedTestCaseForBug] = useState<string>('');
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    severity: 'HIGH',
    priority: 'HIGH',
    feature: '',
    browser: 'Chrome',
    device: 'Desktop'
  });

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [blockersNotes, setBlockersNotes] = useState('');
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittedState, setIsSubmittedState] = useState(false);
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);
  const [editorDocData, setEditorDocData] = useState<any>(null);

  // Fetch Workspace Data
  const loadWorkspace = async () => {
    try {
      setIsLoading(true);
      setErrorNotice(null);
      const res = await fetch(`/api/testing/workspace/${projectId}/${employeeId}/${moduleId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load testing workspace.');
      }
      setData(json.data);

      // Initialize actual results
      const initialResults: { [k: string]: string } = {};
      if (json.data.testCases) {
        json.data.testCases.forEach((tc: any) => {
          if (tc.actual_result) initialResults[tc.id] = tc.actual_result;
        });
      }
      setActualResults(initialResults);

      // If report already submitted, initialize blockers notes from report
      if (json.data.reports && json.data.reports.length > 0 && json.data.reports[0].blockers_notes) {
        setBlockersNotes(json.data.reports[0].blockers_notes);
      }
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [projectId, employeeId, moduleId]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Test Case Execution (PASS, FAIL, BLOCKED)
  const handleExecuteTestCase = async (tcId: string, status: 'PASSED' | 'FAILED' | 'BLOCKED') => {
    try {
      const actualResult = actualResults[tcId] || (
        status === 'PASSED' ? 'Verification passed successfully.' :
        status === 'FAILED' ? 'Encountered unexpected behavior during execution.' :
        'Blocked by missing environment dependency.'
      );

      const res = await fetch(`/api/testing/test-cases/${tcId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actualResult,
          testerId: data?.tester.id || 'EMP-004',
          testerName: data?.tester.name || 'Rahul Verma'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update test case.');
      }

      setSuccessNotice(`Test case ${tcId} marked as ${status}`);
      setTimeout(() => setSuccessNotice(null), 3000);
      loadWorkspace();
    } catch (err: any) {
      setErrorNotice(err.message);
    }
  };

  // Submit Bug
  const handleReportBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    try {
      const bugPayload = {
        projectId: data.project.id,
        projectName: data.project.name,
        moduleId: data.module.id,
        moduleName: data.module.name,
        testingRequestId: data.testingRequest.id,
        testCaseId: selectedTestCaseForBug || undefined,
        developerEmployeeId: data.developer.id,
        developerEmployeeName: data.developer.name,
        testerEmployeeId: data.tester.id,
        testerEmployeeName: data.tester.name,
        title: bugForm.title,
        description: bugForm.description,
        stepsToReproduce: bugForm.stepsToReproduce,
        expectedResult: bugForm.expectedResult,
        actualResult: bugForm.actualResult,
        severity: bugForm.severity,
        priority: bugForm.priority,
        feature: bugForm.feature || data.module.name,
        environment: data.testingRequest.environment,
        browser: bugForm.browser,
        device: bugForm.device
      };

      const res = await fetch('/api/testing/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugPayload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit bug.');
      }

      setSuccessNotice(`Bug reported successfully! Auto-linked to ${data.module.name} and ${data.developer.name}`);
      setTimeout(() => setSuccessNotice(null), 4000);
      setShowBugModal(false);
      setBugForm({
        title: '',
        description: '',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: '',
        severity: 'HIGH',
        priority: 'HIGH',
        feature: '',
        browser: 'Chrome',
        device: 'Desktop'
      });
      loadWorkspace();
    } catch (err: any) {
      setErrorNotice(err.message);
    }
  };

  // Submit Testing Report (Locks report and creates testing_documents entry)
  const handleConfirmSubmitReport = async () => {
    if (!data) return;

    try {
      setIsSubmittingReport(true);
      const coverage = (editorDocData?.testScopeCoverage && editorDocData.testScopeCoverage.length > 0)
        ? editorDocData.testScopeCoverage
        : (data.testCases || []).map(tc => ({
            id: tc.id,
            title: tc.feature ? `${tc.feature} - ${tc.test_scenario}` : tc.test_scenario,
            scenario: tc.test_steps,
            expectedResult: tc.expected_result,
            actualResult: actualResults[tc.id] !== undefined ? actualResults[tc.id] : (tc.actual_result || ''),
            status: tc.status
          }));

      const defects = (editorDocData?.defectsAndFailures && editorDocData.defectsAndFailures.length > 0)
        ? editorDocData.defectsAndFailures
        : (data.bugs || []).map(b => ({
            bugId: b.bug_id,
            title: b.title,
            description: b.description,
            severity: b.severity,
            status: b.status
          }));

      const payload = {
        projectId: data.project.id,
        projectName: data.project.name,
        moduleId: data.module.id,
        moduleName: data.module.name,
        developerEmployeeId: data.developer.id,
        developerEmployeeName: data.developer.name,
        testerEmployeeId: data.tester.id,
        testerEmployeeName: data.tester.name,
        testingRequestId: data.testingRequest.id,
        environment: editorDocData?.environment || data.testingRequest.environment,
        version: editorDocData?.version || data.testingRequest.version || '1.0',
        totalExecuted: editorDocData?.totalExecuted || data.testExecution.executedTestCases || data.testExecution.totalTestCases,
        passed: editorDocData?.passed ?? data.testExecution.passedTestCases,
        failed: editorDocData?.failed ?? data.testExecution.failedTestCases,
        blocked: editorDocData?.blocked ?? data.testExecution.blockedTestCases,
        finalVerdict: editorDocData?.finalVerdict || data.testExecution.finalVerdict,
        testScopeCoverage: coverage,
        defectsAndFailures: defects,
        blockersNotes: editorDocData?.blockersNotes || blockersNotes || 'None. All automated quality checks met or reported in defect registry.',
        preparedBy: editorDocData?.preparedBy || data.tester.name,
        testingPhase: data.testingRequest?.testingPhase || (data.taskProgress.completionPercentage >= 100 ? 3 : data.taskProgress.completionPercentage >= 90 ? 2 : 1),
        phaseName: data.testingRequest?.phaseName || (data.taskProgress.completionPercentage >= 100 ? 'Phase 3 - Final Gate (100%)' : data.taskProgress.completionPercentage >= 90 ? 'Phase 2 - Beta Testing (90%)' : 'Phase 1 - Alpha Testing (80%)')
      };

      const res = await fetch('/api/testing/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit testing report.');
      }

      setShowSubmitConfirmModal(false);
      setIsSubmittedState(true);
      setIsEditingUnlocked(false);
      setSuccessNotice('Testing Report submitted successfully! Document has been archived to Project, Employee ESS, and Admin Document vault.');
      setTimeout(() => setSuccessNotice(null), 5000);
      await loadWorkspace();
      if (onReportSubmitted) onReportSubmitted();
    } catch (err: any) {
      setErrorNotice(err.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading Testing Workspace...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle size={32} className="text-rose-500 mx-auto mb-2" />
        <p className="text-slate-800 font-semibold mb-3">Workspace could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
        >
          Back to Quality Gate
        </button>
      </div>
    );
  }

  const activePhase = data.testingRequest?.testingPhase || 
    (data.taskProgress.completionPercentage >= 100 ? 3 : data.taskProgress.completionPercentage >= 90 ? 2 : 1);
  const activePhaseName = data.testingRequest?.phaseName || 
    (activePhase === 3 ? 'Phase 3 - Final Gate (100%)' : activePhase === 2 ? 'Phase 2 - Beta Testing (90%)' : 'Phase 1 - Alpha Testing (80%)');

  // Check if a report was submitted specifically for the active stage
  const currentPhaseReport = (data.reports || []).find(r => 
    (r.testing_phase === activePhase || (!r.testing_phase && activePhase === 1)) && r.report_status === 'SUBMITTED'
  );
  const isSubmitted = (!isEditingUnlocked) && (isSubmittedState || !!currentPhaseReport);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Quality Gate</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{data.project.name}</span>
            <ChevronRight size={12} />
            <span className="text-blue-600 font-semibold">{data.module.name}</span>
          </div>
        </div>

        {/* Global Action Trigger for Report */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
          >
            <FileText size={15} className="text-blue-600" />
            Preview QA Report
          </button>
          {!isSubmitted ? (
            <button
              onClick={() => setShowSubmitConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <Send size={14} />
              Submit {activePhaseName.split(' - ')[0]} Report
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck size={16} />
                {activePhaseName.split(' - ')[0]} Submitted
              </div>
              <button
                onClick={() => setIsEditingUnlocked(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                title="Unlock document to edit, update test cases, or re-test for this stage"
              >
                <Edit3 size={13} />
                Edit Stage {activePhase} Document
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="font-bold ml-2">×</button>
        </div>
      )}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Workspace Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                {data.project.code}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Testing Workspace
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {data.project.name} &bull; {data.module.name} Module
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Milestone Stage</div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                data.testingRequest.testingPhase === 3
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-200'
                  : data.testingRequest.testingPhase === 2
                  ? 'bg-purple-50 text-purple-800 border border-purple-300 dark:bg-purple-950/70 dark:text-purple-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950/70 dark:text-blue-200'
              }`}>
                <ShieldCheck size={13} />
                {data.testingRequest.phaseName || `Phase ${data.testingRequest.testingPhase || 1} Testing`}
              </span>
            </div>
            <div className="h-9 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Testing Status</div>
              <div className="text-sm font-extrabold text-blue-700 dark:text-blue-400">
                {data.testingRequest.status.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="h-9 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Environment</div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {data.testingRequest.environment}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <User size={13} /> Developer
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.developer.name}</div>
            <div className="text-xs text-slate-500">{data.developer.id}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck size={13} /> QA Tester
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{data.tester.name}</div>
            <div className="text-xs text-slate-500">{data.tester.id}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Layers size={13} /> Task Completion
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {data.taskProgress.completedTasks} / {data.taskProgress.totalTasks} Tasks
            </div>
            <div className="text-xs font-semibold text-emerald-600">
              {data.taskProgress.completionPercentage}% Completed
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Clock size={13} /> Quality Gate Trigger
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">&ge; 70% Reached</div>
            <div className="text-xs text-slate-500">Auto-created Request</div>
          </div>
        </div>
      </div>

      {/* 5. TEST URL & TESTING ENVIRONMENT CARD (Strict requirement) */}
      <div className="bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-white dark:from-slate-900 dark:to-slate-900 border-2 border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">
                Testing Environment
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Target Build: v{data.testingRequest.version} ({data.testingRequest.environment})
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Developer: {data.developer.name} &bull; Module: {data.module.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {data.testingRequest.testingUrl}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={data.testingRequest.testingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
            >
              <ExternalLink size={15} />
              Open Testing Application
            </a>
            <button
              onClick={() => handleCopyUrl(data.testingRequest.testingUrl)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
            >
              {copiedUrl ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              {copiedUrl ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Execution Summary Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Test Execution Summary</h3>
            <p className="text-xs text-slate-500">Live progress across test scenarios</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Passed: <strong className="text-emerald-700 dark:text-emerald-400">{data.testExecution.passedTestCases}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Failed: <strong className="text-rose-700 dark:text-rose-400">{data.testExecution.failedTestCases}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Blocked: <strong className="text-amber-700 dark:text-amber-400">{data.testExecution.blockedTestCases}</strong>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
              Pass Rate: <strong className="text-blue-600">{data.testExecution.passRate}%</strong>
            </div>
          </div>
        </div>

        {/* Progress bar visual */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(data.testExecution.passedTestCases / (data.testExecution.totalTestCases || 1)) * 100}%` }}
            className="bg-emerald-500 h-full"
          />
          <div
            style={{ width: `${(data.testExecution.failedTestCases / (data.testExecution.totalTestCases || 1)) * 100}%` }}
            className="bg-rose-500 h-full"
          />
          <div
            style={{ width: `${(data.testExecution.blockedTestCases / (data.testExecution.totalTestCases || 1)) * 100}%` }}
            className="bg-amber-500 h-full"
          />
        </div>
      </div>

      {/* 6. ASSIGNED OFFICIAL DOCUMENT: SOFTWARE TEST REPORT (1-3) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Software Test Report ({activePhase})
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {activePhaseName}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live dynamic testing &amp; compliance report for {activePhaseName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedTestCaseForBug('');
                setShowBugModal(true);
              }}
              disabled={isSubmitted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition disabled:opacity-50"
            >
              <Plus size={13} />
              Report Defect
            </button>
            {isSubmitted ? (
              <button
                onClick={() => setIsEditingUnlocked(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition active:scale-95 cursor-pointer"
                title="Unlock document to edit, update test cases, or re-test for this stage"
              >
                <Edit3 size={13} />
                Edit Stage {activePhase} Document
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirmModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                <Send size={13} />
                Submit Stage {activePhase} Report
              </button>
            )}
          </div>
        </div>

        {/* Embedded Official Document: Software Test Reports in Container */}
        <div className="w-full">
          {(() => {
            const activeReportId = currentPhaseReport?.id || `REP-${(data.module.code || data.module.name || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)}-P${activePhase}-${data.developer.id || 'DEV'}`;
            return (
              <PdfTestDocumentEditor
                initialData={{
                  id: activeReportId,
                  projectName: data.project.name,
                  moduleName: data.module.name,
                  developerName: data.developer.name,
                  testerName: data.tester.name,
                  testDate: new Date().toLocaleDateString('en-GB'),
                  environment: data.testingRequest.environment || 'Pre-Production',
                  version: '1.0',
                  teamLead: 'Sarah Jenkins',
                  projectLead: 'Sarah Jenkins',
                  reportingManager: 'Sarah Jenkins',
                  totalExecuted: data.testExecution.executedTestCases || data.testExecution.totalTestCases,
                  passed: data.testExecution.passedTestCases,
                  failed: data.testExecution.failedTestCases,
                  blocked: data.testExecution.blockedTestCases,
                  passRate: data.testExecution.passRate,
                  finalVerdict: data.testExecution.finalVerdict,
                  testScopeCoverage: (data.testCases || []).map(tc => ({
                    id: tc.id,
                    title: tc.feature ? `${tc.feature} - ${tc.test_scenario}` : tc.test_scenario,
                    scenario: tc.test_steps,
                    expectedResult: tc.expected_result,
                    actualResult: actualResults[tc.id] !== undefined ? actualResults[tc.id] : (tc.actual_result || ''),
                    status: tc.status
                  })),
                  defectsAndFailures: (data.bugs || []).map(b => ({
                    bugId: b.bug_id,
                    title: b.title,
                    description: b.description,
                    severity: b.severity,
                    status: b.status,
                    assignedTo: b.assigned_developer_id || data.developer.id,
                    assignedName: b.assigned_developer_name || data.developer.name
                  })),
                  blockersNotes: blockersNotes,
                  preparedBy: data.tester.name,
                  status: isSubmitted ? 'SUBMITTED' : 'DRAFT'
                }}
                isReadOnly={isSubmitted}
                onChange={(updated) => {
                  setEditorDocData(updated);
                  if (updated.blockersNotes !== undefined) {
                    setBlockersNotes(updated.blockersNotes);
                  }
                }}
                onSaveDraft={async (updated) => {
                  if (updated.blockersNotes !== undefined) {
                    setBlockersNotes(updated.blockersNotes);
                  }
                  const payload = {
                    ...updated,
                    id: activeReportId,
                    projectId: data.project.id,
                    projectName: data.project.name,
                    moduleId: data.module.id,
                    moduleName: data.module.name,
                    developerId: data.developer.id,
                    developerName: data.developer.name,
                    testerId: data.tester.id,
                    testerName: data.tester.name
                  };
                  await fetch(`/api/test-reports/${encodeURIComponent(activeReportId)}/draft`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  setSuccessNotice('Software Test Report draft saved successfully!');
                  setTimeout(() => setSuccessNotice(null), 4000);
                }}
                onSubmitReport={async (updated) => {
                  const payload = {
                    ...updated,
                    id: activeReportId,
                    projectId: data.project.id,
                    projectName: data.project.name,
                    moduleId: data.module.id,
                    moduleName: data.module.name,
                    developerId: data.developer.id,
                    developerName: data.developer.name,
                    testerId: data.tester.id,
                    testerName: data.tester.name
                  };
                  await fetch(`/api/test-reports/${encodeURIComponent(activeReportId)}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  setIsSubmittedState(true);
                  setSuccessNotice('Software Test Report submitted successfully & official PDF generated!');
                  setTimeout(() => setSuccessNotice(null), 4000);
                  await loadWorkspace();
                  if (onReportSubmitted) onReportSubmitted();
                }}
                onDownloadPdf={(id) => {
                  window.open(`/api/test-reports/${id}/download`, '_blank');
                }}
              />
            );
          })()}
        </div>
      </div>

      {/* 8. DEFECTS / BUGS SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Defects &amp; Failures</h2>
            <p className="text-xs text-slate-500">Documented bugs automatically integrate into Testing Report</p>
          </div>
          <button
            onClick={() => {
              setSelectedTestCaseForBug('');
              setShowBugModal(true);
            }}
            disabled={isSubmitted}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
          >
            <Plus size={14} />
            Report Bug
          </button>
        </div>

        {data.bugs && data.bugs.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Bug ID</th>
                  <th className="py-3 px-4">Title &amp; Feature</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Developer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {data.bugs.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{b.bug_id}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{b.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{b.description}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : b.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : b.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {b.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{b.developer_employee_name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {b.status === 'OPEN' && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/testing/bugs/${b.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'FIXED' })
                            });
                            loadWorkspace();
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition mr-2"
                        >
                          Mark Fixed
                        </button>
                      )}
                      {b.status === 'FIXED' && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/testing/bugs/${b.id}/retest`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ outcome: 'PASS', retestNotes: 'Verified resolved.' })
                            });
                            loadWorkspace();
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                        >
                          Retest (PASS)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-500">
            No defects currently reported for this module.
          </div>
        )}
      </div>

      {/* 8. REPORT BUG MODAL */}
      {showBugModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Report Defect &bull; {data.module.name}
              </h3>
              <button
                onClick={() => setShowBugModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReportBugSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Feature / Component</label>
                  <input
                    type="text"
                    value={bugForm.feature}
                    onChange={(e) => setBugForm({ ...bugForm, feature: e.target.value })}
                    placeholder="e.g. Biometric Kiosk Scanner"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Severity</label>
                  <select
                    value={bugForm.severity}
                    onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Bug Title</label>
                <input
                  type="text"
                  value={bugForm.title}
                  onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
                  placeholder="e.g. Camera stream freezes on mobile Safari"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Bug Description</label>
                <textarea
                  rows={2}
                  value={bugForm.description}
                  onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                  placeholder="Detailed explanation of failure..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Steps to Reproduce</label>
                <textarea
                  rows={2}
                  value={bugForm.stepsToReproduce}
                  onChange={(e) => setBugForm({ ...bugForm, stepsToReproduce: e.target.value })}
                  placeholder="1. Open scanner&#10;2. Grant permissions&#10;3. Observe stream stalls"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Expected Result</label>
                  <input
                    type="text"
                    value={bugForm.expectedResult}
                    onChange={(e) => setBugForm({ ...bugForm, expectedResult: e.target.value })}
                    placeholder="Camera should stream continuous 30fps video"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Actual Result</label>
                  <input
                    type="text"
                    value={bugForm.actualResult}
                    onChange={(e) => setBugForm({ ...bugForm, actualResult: e.target.value })}
                    placeholder="Video stalls after 2 seconds"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBugModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Submit Defect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. TESTING REPORT PREVIEW MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto my-auto">
            <TestingReportTemplate
              projectName={data.project.name}
              moduleName={data.module.name}
              developerName={data.developer.name}
              testerName={data.tester.name}
              environment={data.testingRequest.environment}
              totalExecuted={data.testExecution.executedTestCases || data.testExecution.totalTestCases}
              passed={data.testExecution.passedTestCases}
              failed={data.testExecution.failedTestCases}
              blocked={data.testExecution.blockedTestCases}
              passRate={data.testExecution.passRate}
              finalVerdict={data.testExecution.finalVerdict}
              testScopeCoverage={(data.testCases || []).map(tc => ({
                id: tc.id,
                title: tc.feature ? `${tc.feature} - ${tc.test_scenario}` : tc.test_scenario,
                status: tc.status
              }))}
              defectsAndFailures={(data.bugs || []).map(b => ({
                bugId: b.bug_id,
                title: b.title,
                description: b.description,
                severity: b.severity,
                status: b.status
              }))}
              blockersNotes={blockersNotes}
              preparedBy={data.tester.name}
              onClose={() => setShowReportModal(false)}
            />
          </div>
        </div>
      )}

      {/* 12. SUBMIT REPORT CONFIRMATION MODAL */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-base pb-2 border-b border-slate-100 dark:border-slate-800">
              <Send size={18} className="text-blue-600" />
              Submit Testing Report?
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Project:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{data.project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Module:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{data.module.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Developer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.developer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tester:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.tester.name}</span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
              <div className="flex justify-between">
                <span className="text-slate-500">Test Cases:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{data.testExecution.totalTestCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 font-medium">Passed:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{data.testExecution.passedTestCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-600 font-medium">Failed:</span>
                <span className="font-bold text-rose-700 dark:text-rose-400">{data.testExecution.failedTestCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-600 font-medium">Blocked:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{data.testExecution.blockedTestCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Defects / Bugs:</span>
                <span className="font-bold text-rose-700 dark:text-rose-400">{data.bugs.length}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                5. Blockers &amp; Important Notes (Optional):
              </label>
              <textarea
                rows={2}
                value={blockersNotes}
                onChange={(e) => setBlockersNotes(e.target.value)}
                placeholder="List any environmental blockers or notes for engineering..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 rounded-lg text-[11px] leading-relaxed border border-amber-200 dark:border-amber-800">
              <strong>Notice:</strong> Once submitted, the report status will become <strong>SUBMITTED</strong> and locked. The testing document will automatically appear under <strong>Project Testing Documents</strong>, <strong>Employee ESS</strong>, and the <strong>Admin Quality Gate</strong>.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                disabled={isSubmittingReport}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitReport}
                disabled={isSubmittingReport}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {isSubmittingReport ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
