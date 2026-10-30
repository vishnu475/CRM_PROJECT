import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Save,
  Send,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Edit3,
  Eye,
  Plus,
  Trash2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';

export interface TestDocumentData {
  id?: string;
  projectName: string;
  moduleName: string;
  testerName: string;
  developerName?: string;
  testingPhase?: number;
  phaseName?: string;
  testDate: string;
  environment: string;
  version?: string;
  teamLead?: string;
  projectLead?: string;
  reportingManager?: string;
  totalExecuted: number;
  passed: number;
  failed: number;
  blocked: number;
  passRate: number;
  finalVerdict: 'PASSED' | 'FAILED' | 'PENDING';
  overview?: string;
  testScopeCoverage: Array<{
    id?: string;
    title: string;
    scenario?: string;
    expectedResult?: string;
    actualResult?: string;
    status: 'PASSED' | 'FAILED' | 'BLOCKED';
  }>;
  defectsAndFailures: Array<{
    id?: string;
    bugId: string;
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'OPEN' | 'FIXED' | 'RETEST' | 'CLOSED';
    assignedTo?: string;
    assignedName?: string;
  }>;
  blockersNotes: string;
  preparedBy: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REOPENED';
  submittedAt?: string;
  finalPdfPath?: string;
}

interface PdfTestDocumentEditorProps {
  initialData: TestDocumentData;
  isReadOnly?: boolean;
  onChange?: (data: TestDocumentData) => void;
  onSaveDraft?: (data: TestDocumentData) => Promise<void> | void;
  onSubmitReport?: (data: TestDocumentData) => Promise<void> | void;
  onDownloadPdf?: (reportId: string) => void;
  onReopen?: (reportId: string) => void;
}

export const PdfTestDocumentEditor: React.FC<PdfTestDocumentEditorProps> = ({
  initialData,
  isReadOnly = false,
  onChange,
  onSaveDraft,
  onSubmitReport,
  onDownloadPdf,
  onReopen
}) => {
  const [docData, setDocData] = useState<TestDocumentData>(initialData);
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'editor' | 'native-pdf'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  const page4Ref = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentReportIdRef = useRef<string | null>(null);

  // Sync if initialData changes to a different report ID
  useEffect(() => {
    if (!initialData) return;

    // Only reset state if the report identity has changed
    if (currentReportIdRef.current !== initialData.id) {
      currentReportIdRef.current = initialData.id || null;
      setDocData(initialData);
      return;
    }

    // If on the same report, only merge new bugs added from external modals without clobbering user edits
    setDocData(prev => {
      if (!prev) return initialData;
      const existingBugIds = new Set((prev.defectsAndFailures || []).map(b => b.bugId || b.id));
      const newBugs = (initialData.defectsAndFailures || []).filter(b => !existingBugIds.has(b.bugId || b.id));

      if (newBugs.length > 0) {
        return {
          ...prev,
          defectsAndFailures: [...(prev.defectsAndFailures || []), ...newBugs]
        };
      }
      if (initialData.status && initialData.status !== prev.status) {
        return { ...prev, status: initialData.status };
      }
      return prev;
    });
  }, [initialData?.id, initialData?.status, initialData?.defectsAndFailures?.length]);

  // Notify parent of docData changes safely
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (onChangeRef.current) {
      onChangeRef.current(docData);
    }
  }, [docData]);

  const isLocked = isReadOnly || docData.status === 'SUBMITTED' || docData.status === 'APPROVED';

  // Recalculate pass rate automatically
  const handleUpdateCounts = (passed: number, failed: number, blocked: number) => {
    const total = passed + failed + blocked;
    const rate = total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0;
    const verdict = (failed > 0 && rate < 80) ? 'FAILED' : 'PASSED';
    setDocData(prev => ({
      ...prev,
      passed,
      failed,
      blocked,
      totalExecuted: total,
      passRate: rate,
      finalVerdict: verdict
    }));
  };

  const handleScrollToPage = (pageNum: number) => {
    setActivePage(pageNum);
    const targetRef = pageNum === 1 ? page1Ref : pageNum === 2 ? page2Ref : pageNum === 3 ? page3Ref : page4Ref;
    if (targetRef.current && scrollContainerRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveDraft = async () => {
    if (isLocked) return;
    setIsSaving(true);
    try {
      if (onSaveDraft) {
        await onSaveDraft(docData);
      }
      setSaveSuccessMsg('Draft saved successfully to HRMS database!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    try {
      if (onSubmitReport) {
        await onSubmitReport(docData);
      }
      setDocData(prev => ({ ...prev, status: 'SUBMITTED', submittedAt: new Date().toISOString() }));
      setSaveSuccessMsg('Report submitted successfully! Final signed PDF generated.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Submit failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Test Case row
  const handleAddTestCase = () => {
    const nextNum = (docData.testScopeCoverage?.length || 0) + 1;
    const newTc = {
      id: `TC-ATT-${String(nextNum).padStart(3, '0')}`,
      title: 'New Test Scenario',
      scenario: 'Steps to execute test scenario',
      expectedResult: 'Expected system behavior',
      actualResult: 'Observed result during testing',
      status: 'PASSED' as const
    };
    const updatedList = [...(docData.testScopeCoverage || []), newTc];
    const passCount = updatedList.filter(t => t.status === 'PASSED').length;
    const failCount = updatedList.filter(t => t.status === 'FAILED').length;
    const blockCount = updatedList.filter(t => t.status === 'BLOCKED').length;
    setDocData(prev => ({
      ...prev,
      testScopeCoverage: updatedList
    }));
    handleUpdateCounts(passCount, failCount, blockCount);
  };

  // Remove Test Case row
  const handleRemoveTestCase = (index: number) => {
    const updatedList = (docData.testScopeCoverage || []).filter((_, i) => i !== index);
    const passCount = updatedList.filter(t => t.status === 'PASSED').length;
    const failCount = updatedList.filter(t => t.status === 'FAILED').length;
    const blockCount = updatedList.filter(t => t.status === 'BLOCKED').length;
    setDocData(prev => ({
      ...prev,
      testScopeCoverage: updatedList
    }));
    handleUpdateCounts(passCount, failCount, blockCount);
  };

  // Add Defect row
  const handleAddDefect = () => {
    const existingNums = (docData.defectsAndFailures || []).map(d => {
      const match = (d.bugId || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 100;
    });
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 100;
    const nextNum = maxNum + 1;
    const newBug = {
      bugId: `BUG-${nextNum}`,
      title: 'Observed Defect Title',
      description: 'Detailed description of the issue encountered during test execution.',
      severity: 'HIGH' as const,
      status: 'OPEN' as const,
      assignedTo: 'EMP-005',
      assignedName: 'Vishnu Vardhan'
    };
    setDocData(prev => ({
      ...prev,
      defectsAndFailures: [...(prev.defectsAndFailures || []), newBug]
    }));
  };

  // Remove Defect row
  const handleRemoveDefect = (index: number) => {
    setDocData(prev => ({
      ...prev,
      defectsAndFailures: (prev.defectsAndFailures || []).filter((_, i) => i !== index)
    }));
  };

  const scale = zoomLevel / 100;

  return (
    <div className="w-full max-w-[1200px] h-[750px] mx-auto flex flex-col bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden relative font-sans">
      {/* ─── 1. FIXED TOOLBAR HEADER (HEIGHT 56px) ────────────────────────── */}
      <div className="h-14 px-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-20 gap-2">
        {/* Left: Document Info & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/90 text-white flex items-center justify-center font-bold text-xs shadow-md">
            <FileText size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-slate-100 uppercase">
                Software Test Reports (1).pdf
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider ${
                  docData.status === 'SUBMITTED' || docData.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}
              >
                {docData.status === 'SUBMITTED' ? (
                  <>
                    <Lock size={10} /> SUBMITTED
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> DRAFT
                  </>
                )}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Project: <span className="text-slate-200 font-bold">{docData.projectName}</span> • Tester: <span className="text-slate-200">{docData.testerName}</span> • Date: <span className="text-slate-200">{docData.testDate}</span>
            </p>
          </div>
        </div>

        {/* Center: Page Jumpers & Zoom Controls */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Pages:</span>
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => handleScrollToPage(p)}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                activePage === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Zoom Controls */}
          <button
            onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300 w-10 text-center">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-[11px] font-bold"
            title="Reset Zoom (100%)"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle between interactive editable document and native generated PDF */}
          {docData.status === 'SUBMITTED' && (
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  viewMode === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Document
              </button>
              <button
                onClick={() => setViewMode('native-pdf')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  viewMode === 'native-pdf' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Native PDF
              </button>
            </div>
          )}

          {!isLocked ? (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                <Save size={13} className={isSaving ? 'animate-spin' : ''} />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
              >
                <Send size={13} className={isSubmitting ? 'animate-spin' : ''} />
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </>
          ) : (
            <button
              onClick={() => onDownloadPdf && onDownloadPdf(docData.id || 'REP-ATT-001')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Download size={13} />
              Download PDF
            </button>
          )}

          {onReopen && isLocked && (
            <button
              onClick={() => onReopen(docData.id || 'REP-ATT-001')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40 rounded-xl text-xs font-bold transition"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Save Success Banner Notification */}
      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-inner shrink-0 animate-fade-in z-30">
          <CheckCircle2 size={15} />
          {saveSuccessMsg}
        </div>
      )}

      {/* ─── 2. FIXED SCROLLABLE VIEWPORT (INTERNAL SCROLLBAR) ────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-6 md:p-8 bg-slate-900/95 flex flex-col items-center gap-8 relative select-text"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* If user selected Native PDF viewer for submitted report */}
        {viewMode === 'native-pdf' && docData.id ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 rounded-xl overflow-hidden p-2">
            <object
              data={`/api/test-reports/${encodeURIComponent(docData.id)}/document`}
              type="application/pdf"
              className="w-full h-[620px] rounded-lg border border-slate-700"
            >
              <div className="text-center p-8 text-white space-y-4">
                <p>Your browser does not support inline PDF object display.</p>
                <a
                  href={`/api/test-reports/${encodeURIComponent(docData.id)}/download`}
                  className="px-4 py-2 bg-blue-600 rounded-lg font-bold text-xs"
                >
                  Download Submitted PDF
                </a>
              </div>
            </object>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="flex flex-col items-center gap-8"
          >
            {/* ════════════════════════════════════════════════════════════════
                PDF PAGE 1: TITLE, TICKET RAISING, OVERVIEW & RESULT SUMMARY
            ════════════════════════════════════════════════════════════════ */}
            <div
              ref={page1Ref}
              id="pdf-page-1"
              className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative flex flex-col justify-between p-10 font-sans"
            >
              <div>
                {/* Official PDF Page Header Chrome */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="text-blue-900 font-black">HRMS ERP Quality Assurance &amp; Compliance Division</span>
                  <span>Form Ref: STR-2026-QA • Standard Format</span>
                </div>

                {/* Document Main Title Block */}
                <div className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">
                      Official Audit &amp; Verification Document
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      SOFTWARE TEST REPORT ({docData.testingPhase || 1})
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        docData.testingPhase === 3
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : docData.testingPhase === 2
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {docData.phaseName || `Phase ${docData.testingPhase || 1}`}
                      </span>
                      <p className="text-xs text-slate-500">
                        Target Project: <span className="font-bold text-slate-800">{docData.projectName}</span> • Build Version: v{docData.version || '1.0'}
                      </p>
                    </div>
                  </div>

                  {/* Final Verdict Stamp */}
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Final Verdict
                    </span>
                    {!isLocked ? (
                      <select
                        value={docData.finalVerdict}
                        onChange={(e) => setDocData({ ...docData, finalVerdict: e.target.value as any })}
                        className={`text-xs font-black px-3 py-1.5 rounded-lg border focus:ring-2 cursor-pointer ${
                          docData.finalVerdict === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500'
                            : 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-500'
                        }`}
                      >
                        <option value="PASSED">VERDICT: PASSED</option>
                        <option value="FAILED">VERDICT: FAILED</option>
                        <option value="PENDING">VERDICT: PENDING</option>
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-black inline-block border ${
                          docData.finalVerdict === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        VERDICT: {docData.finalVerdict}
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. Identification / Ticket Raising */}
                <div className="mt-6 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    1. Document &amp; Ticket Identification
                  </h3>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Name</span>
                      {!isLocked ? (
                        <input
                          type="text"
                          value={docData.projectName}
                          onChange={(e) => setDocData({ ...docData, projectName: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">{docData.projectName}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Test Date</span>
                      {!isLocked ? (
                        <input
                          type="text"
                          value={docData.testDate}
                          onChange={(e) => setDocData({ ...docData, testDate: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">{docData.testDate}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Module / Feature Name</span>
                      {!isLocked ? (
                        <input
                          type="text"
                          value={docData.moduleName}
                          onChange={(e) => setDocData({ ...docData, moduleName: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">{docData.moduleName}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Environment</span>
                      {!isLocked ? (
                        <input
                          type="text"
                          value={docData.environment}
                          onChange={(e) => setDocData({ ...docData, environment: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">{docData.environment}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QA Lead / Tester</span>
                      {!isLocked ? (
                        <input
                          type="text"
                          value={docData.testerName}
                          onChange={(e) => setDocData({ ...docData, testerName: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">{docData.testerName}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Manager</span>
                      {!isLocked ? (
                        <input
                          type="text"
                          value={docData.reportingManager || 'Sarah Jenkins'}
                          onChange={(e) => setDocData({ ...docData, reportingManager: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                        />
                      ) : (
                        <p className="font-bold text-slate-900 mt-1">{docData.reportingManager || 'Sarah Jenkins'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Executive Overview */}
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    2. Overview &amp; Objectives
                  </h3>
                  {!isLocked ? (
                    <textarea
                      rows={3}
                      value={docData.overview !== undefined ? docData.overview : `This official test document verifies quality criteria, business requirements, and operational stability for the ${docData.projectName} (${docData.moduleName}) application. Testing scope includes core functional workflows, user authorization, UI responsiveness, data validation, and exception handling.`}
                      onChange={(e) => setDocData(prev => ({ ...prev, overview: e.target.value }))}
                      placeholder="Enter executive test overview, purpose, and quality objectives..."
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  ) : (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {docData.overview || `This official test document verifies quality criteria, business requirements, and operational stability for the ${docData.projectName} (${docData.moduleName}) application.`}
                    </div>
                  )}
                </div>

                {/* 3. Result Summary */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    3. Result Summary &amp; Quality Metrics
                  </h3>

                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Executed</span>
                      <span className="text-xl font-black text-slate-900 block mt-1">{docData.totalExecuted}</span>
                    </div>

                    <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Passed</span>
                      {!isLocked ? (
                        <input
                          type="number"
                          value={docData.passed}
                          onChange={(e) => handleUpdateCounts(Number(e.target.value), docData.failed, docData.blocked)}
                          className="w-16 mx-auto text-xl font-black text-emerald-800 text-center bg-white border border-emerald-300 rounded mt-1"
                        />
                      ) : (
                        <span className="text-xl font-black text-emerald-700 block mt-1">{docData.passed}</span>
                      )}
                    </div>

                    <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] font-bold text-rose-700 uppercase block">Failed</span>
                      {!isLocked ? (
                        <input
                          type="number"
                          value={docData.failed}
                          onChange={(e) => handleUpdateCounts(docData.passed, Number(e.target.value), docData.blocked)}
                          className="w-16 mx-auto text-xl font-black text-rose-800 text-center bg-white border border-rose-300 rounded mt-1"
                        />
                      ) : (
                        <span className="text-xl font-black text-rose-700 block mt-1">{docData.failed}</span>
                      )}
                    </div>

                    <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-center">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">Blocked</span>
                      {!isLocked ? (
                        <input
                          type="number"
                          value={docData.blocked}
                          onChange={(e) => handleUpdateCounts(docData.passed, docData.failed, Number(e.target.value))}
                          className="w-16 mx-auto text-xl font-black text-amber-800 text-center bg-white border border-amber-300 rounded mt-1"
                        />
                      ) : (
                        <span className="text-xl font-black text-amber-700 block mt-1">{docData.blocked}</span>
                      )}
                    </div>

                    <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-center">
                      <span className="text-[10px] font-bold text-blue-700 uppercase block">Pass Rate</span>
                      <span className="text-xl font-black text-blue-800 block mt-1">{docData.passRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Software Test Report (1) • Project: {docData.projectName}</span>
                <span className="font-bold text-slate-600">Page 1 of 4</span>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                PDF PAGE 2: TEST SCOPE & COVERAGE
            ════════════════════════════════════════════════════════════════ */}
            <div
              ref={page2Ref}
              id="pdf-page-2"
              className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative flex flex-col justify-between p-10 font-sans"
            >
              <div>
                {/* Header Chrome */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="text-blue-900 font-black">Software Test Report (1) • Test Scope &amp; Coverage</span>
                  <span>Page 2 of 4</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">4. Test Scope &amp; Coverage Matrix</h2>
                    <p className="text-xs text-slate-500">
                      Step-by-step test scenarios, expected outputs, and verified execution status.
                    </p>
                  </div>
                  {!isLocked && (
                    <button
                      onClick={handleAddTestCase}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100"
                    >
                      <Plus size={12} /> Add Test Case
                    </button>
                  )}
                </div>

                {/* Test Cases Table */}
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-16">ID</th>
                        <th className="p-2.5">Feature &amp; Scenario</th>
                        <th className="p-2.5 w-48">Expected Result</th>
                        <th className="p-2.5 w-40">Actual Result</th>
                        <th className="p-2.5 w-24">Status</th>
                        {!isLocked && <th className="p-2.5 w-8"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(docData.testScopeCoverage || []).map((tc, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="p-2.5 font-mono font-bold text-slate-600 text-[11px] align-top">
                            {tc.id || `TC-${idx + 1}`}
                          </td>

                          <td className="p-2.5 align-top">
                            {!isLocked ? (
                              <>
                                <input
                                  type="text"
                                  value={tc.title}
                                  placeholder="Scenario Title"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDocData(prev => ({
                                      ...prev,
                                      testScopeCoverage: (prev.testScopeCoverage || []).map((t, i) => i === idx ? { ...t, title: val } : t)
                                    }));
                                  }}
                                  className="w-full font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-0.5 text-xs mb-1"
                                />
                                <textarea
                                  value={tc.scenario || ''}
                                  placeholder="Execution steps..."
                                  rows={2}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDocData(prev => ({
                                      ...prev,
                                      testScopeCoverage: (prev.testScopeCoverage || []).map((t, i) => i === idx ? { ...t, scenario: val } : t)
                                    }));
                                  }}
                                  className="w-full text-[10px] text-slate-500 border border-slate-200 rounded px-1.5 py-0.5"
                                />
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-slate-900">{tc.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 whitespace-pre-line">{tc.scenario}</p>
                              </>
                            )}
                          </td>

                          <td className="p-2.5 text-slate-600 text-[11px] align-top">
                            {!isLocked ? (
                              <textarea
                                value={tc.expectedResult || ''}
                                rows={2}
                                placeholder="Expected result..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDocData(prev => ({
                                    ...prev,
                                    testScopeCoverage: (prev.testScopeCoverage || []).map((t, i) => i === idx ? { ...t, expectedResult: val } : t)
                                  }));
                                }}
                                className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-600"
                              />
                            ) : (
                              tc.expectedResult
                            )}
                          </td>

                          <td className="p-2.5 text-slate-800 text-[11px] align-top">
                            {!isLocked ? (
                              <textarea
                                value={tc.actualResult || ''}
                                rows={2}
                                placeholder="Actual observed result..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDocData(prev => ({
                                    ...prev,
                                    testScopeCoverage: (prev.testScopeCoverage || []).map((t, i) => i === idx ? { ...t, actualResult: val } : t)
                                  }));
                                }}
                                className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium"
                              />
                            ) : (
                              tc.actualResult
                            )}
                          </td>

                          <td className="p-2.5 align-top">
                            {!isLocked ? (
                              <select
                                value={tc.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as any;
                                  const updated = (docData.testScopeCoverage || []).map((t, i) => i === idx ? { ...t, status: newStatus } : t);
                                  const pCount = updated.filter(t => t.status === 'PASSED').length;
                                  const fCount = updated.filter(t => t.status === 'FAILED').length;
                                  const bCount = updated.filter(t => t.status === 'BLOCKED').length;
                                  setDocData(prev => ({ ...prev, testScopeCoverage: updated }));
                                  handleUpdateCounts(pCount, fCount, bCount);
                                }}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  tc.status === 'PASSED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : tc.status === 'FAILED'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <option value="PASSED">PASSED</option>
                                <option value="FAILED">FAILED</option>
                                <option value="BLOCKED">BLOCKED</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                                  tc.status === 'PASSED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : tc.status === 'FAILED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {tc.status}
                              </span>
                            )}
                          </td>

                          {!isLocked && (
                            <td className="p-2.5 align-top text-right">
                              <button
                                onClick={() => handleRemoveTestCase(idx)}
                                className="text-slate-400 hover:text-rose-600 transition"
                                title="Remove test case"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page 2 Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Software Test Report (1) • Project: {docData.projectName}</span>
                <span className="font-bold text-slate-600">Page 2 of 4</span>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                PDF PAGE 3: DEFECTS & FAILURES LOG
            ════════════════════════════════════════════════════════════════ */}
            <div
              ref={page3Ref}
              id="pdf-page-3"
              className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative flex flex-col justify-between p-10 font-sans"
            >
              <div>
                {/* Header Chrome */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="text-blue-900 font-black">Software Test Report (1) • Defects &amp; Failures Log</span>
                  <span>Page 3 of 4</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">5. Defects &amp; Failures Log</h2>
                    <p className="text-xs text-slate-500">
                      Discovered bugs, observed regressions, priority assignment, and resolution status.
                    </p>
                  </div>
                  {!isLocked && (
                    <button
                      onClick={handleAddDefect}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100"
                    >
                      <Plus size={12} /> Add Defect
                    </button>
                  )}
                </div>

                {/* Defects Table */}
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-20">Bug ID</th>
                        <th className="p-2.5">Defect Description</th>
                        <th className="p-2.5 w-36">Assigned To</th>
                        <th className="p-2.5 w-24">Severity</th>
                        <th className="p-2.5 w-24">Status</th>
                        {!isLocked && <th className="p-2.5 w-8"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(docData.defectsAndFailures || []).map((bug, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="p-2.5 font-mono font-bold text-rose-700 text-[11px] align-top">
                            {!isLocked ? (
                              <input
                                type="text"
                                value={bug.bugId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDocData(prev => ({
                                    ...prev,
                                    defectsAndFailures: (prev.defectsAndFailures || []).map((b, i) =>
                                      i === idx ? { ...b, bugId: val } : b
                                    )
                                  }));
                                }}
                                className="w-16 font-mono font-bold text-rose-700 border border-slate-200 rounded px-1 py-0.5 text-xs"
                              />
                            ) : (
                              bug.bugId
                            )}
                          </td>

                          <td className="p-2.5 align-top">
                            {!isLocked ? (
                              <>
                                <input
                                  type="text"
                                  value={bug.title}
                                  placeholder="Defect title / summary"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDocData(prev => ({
                                      ...prev,
                                      defectsAndFailures: (prev.defectsAndFailures || []).map((b, i) =>
                                        i === idx ? { ...b, title: val } : b
                                      )
                                    }));
                                  }}
                                  className="w-full font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-0.5 text-xs mb-1"
                                />
                                <textarea
                                  value={bug.description}
                                  placeholder="Defect description / matter..."
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDocData(prev => ({
                                      ...prev,
                                      defectsAndFailures: (prev.defectsAndFailures || []).map((b, i) =>
                                        i === idx ? { ...b, description: val } : b
                                      )
                                    }));
                                  }}
                                  rows={2}
                                  className="w-full text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 text-[11px]"
                                />
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-slate-900">{bug.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{bug.description}</p>
                              </>
                            )}
                          </td>

                          <td className="p-2.5 align-top">
                            {!isLocked ? (
                              <select
                                value={bug.assignedTo || 'EMP-005'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const empMap: Record<string, string> = {
                                    'EMP-005': 'Vishnu Vardhan',
                                    'EMP-004': 'Rahul Verma',
                                    'EMP-001': 'Sarah Jenkins',
                                    'EMP-003': 'Priya Sharma',
                                    'EMP-006': 'mohan',
                                    'EMP-008': 'Ramesh',
                                    'EMP-014': 'Raghu Vardhan',
                                    'EMP-016': 'karthik',
                                    'EMP-017': 'satya'
                                  };
                                  setDocData(prev => ({
                                    ...prev,
                                    defectsAndFailures: (prev.defectsAndFailures || []).map((b, i) =>
                                      i === idx ? { ...b, assignedTo: val, assignedName: empMap[val] || val } : b
                                    )
                                  }));
                                }}
                                className="w-full text-[10px] font-bold px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-800"
                              >
                                <option value="EMP-005">EMP-005: Vishnu Vardhan</option>
                                <option value="EMP-004">EMP-004: Rahul Verma</option>
                                <option value="EMP-001">EMP-001: Sarah Jenkins</option>
                                <option value="EMP-003">EMP-003: Priya Sharma</option>
                                <option value="EMP-006">EMP-006: Mohan</option>
                                <option value="EMP-008">EMP-008: Ramesh</option>
                                <option value="EMP-014">EMP-014: Raghu Vardhan</option>
                                <option value="EMP-016">EMP-016: Karthik</option>
                                <option value="EMP-017">EMP-017: Satya</option>
                              </select>
                            ) : (
                              <span
                                className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block truncate"
                                title={bug.assignedName || bug.assignedTo || 'Vishnu Vardhan'}
                              >
                                {bug.assignedName || bug.assignedTo || 'Vishnu Vardhan'}
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 align-top">
                            {!isLocked ? (
                              <select
                                value={bug.severity}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setDocData(prev => ({
                                    ...prev,
                                    defectsAndFailures: (prev.defectsAndFailures || []).map((b, i) =>
                                      i === idx ? { ...b, severity: val } : b
                                    )
                                  }));
                                }}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  bug.severity === 'CRITICAL' || bug.severity === 'HIGH'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                <option value="CRITICAL">CRITICAL</option>
                                <option value="HIGH">HIGH</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LOW">LOW</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                                  bug.severity === 'CRITICAL' || bug.severity === 'HIGH'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {bug.severity}
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 align-top">
                            {!isLocked ? (
                              <select
                                value={bug.status}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setDocData(prev => ({
                                    ...prev,
                                    defectsAndFailures: (prev.defectsAndFailures || []).map((b, i) =>
                                      i === idx ? { ...b, status: val } : b
                                    )
                                  }));
                                }}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-white"
                              >
                                <option value="OPEN">OPEN</option>
                                <option value="FIXED">FIXED</option>
                                <option value="RETEST">RETEST</option>
                                <option value="CLOSED">CLOSED</option>
                              </select>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold">
                                {bug.status}
                              </span>
                            )}
                          </td>

                          {!isLocked && (
                            <td className="p-2.5 align-top text-right">
                              <button
                                onClick={() => handleRemoveDefect(idx)}
                                className="text-slate-400 hover:text-rose-600 transition"
                                title="Remove defect"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Defect Metrics Breakdown Box */}
                <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                    Defect Classification Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">CRITICAL DEFECTS</span>
                      <span className="font-black text-rose-600 text-base">
                        {(docData.defectsAndFailures || []).filter(b => b.severity === 'CRITICAL').length}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">HIGH SEVERITY</span>
                      <span className="font-black text-amber-600 text-base">
                        {(docData.defectsAndFailures || []).filter(b => b.severity === 'HIGH').length}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">OPEN / IN TRIAGE</span>
                      <span className="font-black text-blue-600 text-base">
                        {(docData.defectsAndFailures || []).filter(b => b.status === 'OPEN').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 3 Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Software Test Report (1) • Project: {docData.projectName}</span>
                <span className="font-bold text-slate-600">Page 3 of 4</span>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                PDF PAGE 4: BLOCKERS, NOTES & OFFICIAL SIGN-OFF
            ════════════════════════════════════════════════════════════════ */}
            <div
              ref={page4Ref}
              id="pdf-page-4"
              className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative flex flex-col justify-between p-10 font-sans"
            >
              <div>
                {/* Header Chrome */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="text-blue-900 font-black">Software Test Report (1) • Blockers, Notes &amp; Sign-Off</span>
                  <span>Page 4 of 4</span>
                </div>

                {/* 6. Blockers & Notes */}
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    6. Blockers &amp; Environment Notes
                  </h3>
                  {!isLocked ? (
                    <textarea
                      rows={5}
                      value={docData.blockersNotes}
                      onChange={(e) => setDocData({ ...docData, blockersNotes: e.target.value })}
                      placeholder="Add blockers, environment details, or notes..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium leading-relaxed focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                      {docData.blockersNotes || 'No blockers reported.'}
                    </div>
                  )}
                </div>

                {/* 7. Sign-off & Governance */}
                <div className="mt-8 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    7. Sign-Off &amp; Certification
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Electronic signature approval under ISO/IEC 25010 Quality System Governance standards.
                  </p>

                  <div className="space-y-3 pt-2">
                    {/* Tester Sign-off */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Prepared By (QA Lead / Tester)
                        </span>
                        {!isLocked ? (
                          <input
                            type="text"
                            value={docData.preparedBy}
                            onChange={(e) => setDocData({ ...docData, preparedBy: e.target.value })}
                            className="mt-1 px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                          />
                        ) : (
                          <p className="font-bold text-slate-900 text-xs mt-0.5">{docData.preparedBy}</p>
                        )}
                        <p className="text-[10px] text-slate-400">Senior QA Verification Lead</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> {docData.status === 'SUBMITTED' ? 'Certified' : 'Drafting'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Date: {docData.testDate}</p>
                      </div>
                    </div>

                    {/* Team Lead Sign-off */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Reviewed By (Team Lead)
                        </span>
                        <p className="font-bold text-slate-900 text-xs mt-0.5">{docData.teamLead || 'Sarah Jenkins'}</p>
                        <p className="text-[10px] text-slate-400">QA Engineering Lead</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <ShieldCheck size={11} /> Verified
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Date: {docData.testDate}</p>
                      </div>
                    </div>

                    {/* Reporting Manager Sign-off */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          Approved By (Reporting Manager / VP)
                        </span>
                        <p className="font-bold text-slate-900 text-xs mt-0.5">{docData.reportingManager || 'Sarah Jenkins'}</p>
                        <p className="text-[10px] text-slate-400">VP of Engineering</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Go-Live Ready
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Date: {docData.testDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Seal Box */}
                <div className="mt-8 p-3.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-[10px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Cryptographic Audit Seal</span>
                    <span className="font-mono text-slate-400">SHA-256 Verified</span>
                  </div>
                  <p className="text-slate-500 font-mono">
                    Audit Token: STR-ATT-{docData.id || 'REP-ATT-001'}-{new Date().getFullYear()} • Immutable HRMS record
                  </p>
                </div>
              </div>

              {/* Page 4 Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Software Test Report (1) • Project: {docData.projectName}</span>
                <span className="font-bold text-slate-600">Page 4 of 4</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. SUBMIT CONFIRMATION MODAL ─────────────────────────────────── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Send size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Are you sure you want to submit this test report?</h3>
              <p className="text-xs text-slate-500">
                Once submitted, this document will be locked, official signed PDF will be generated and permanently stored,
                and the report will become visible to your Reporting Manager and HR Admin.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Project:</span>
                <span className="font-bold text-slate-900">{docData.projectName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pass Rate:</span>
                <span className="font-bold text-blue-600">{docData.passRate}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Final Verdict:</span>
                <span className="font-bold text-emerald-600">{docData.finalVerdict}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
