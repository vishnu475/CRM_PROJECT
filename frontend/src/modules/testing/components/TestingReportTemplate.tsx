import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Plus,
  Send,
  FileCheck2,
  Lock,
  Edit3,
  Save,
  RotateCcw,
  Trash2
} from 'lucide-react';

export interface TestingReportTemplateProps {
  projectName: string;
  moduleName: string;
  developerName: string;
  testerName: string;
  testDate?: string;
  environment?: string;
  teamLead?: string;
  projectLead?: string;
  reportingManager?: string;
  totalExecuted: number;
  passed: number;
  failed: number;
  blocked: number;
  passRate: number;
  finalVerdict: 'PASSED' | 'FAILED' | 'PENDING';
  testScopeCoverage: Array<{
    id?: string;
    title: string;
    scenario?: string;
    expectedResult?: string;
    actualResult?: string;
    status?: string;
  }>;
  defectsAndFailures: Array<{
    bugId: string;
    description: string;
    severity: string;
    status?: string;
    title?: string;
  }>;
  blockersNotes?: string;
  preparedBy?: string;
  onPrint?: () => void;
  onClose?: () => void;
  hideActions?: boolean;
  onExecuteTestCase?: (tcId: string, status: 'PASSED' | 'FAILED' | 'BLOCKED') => void;
  onLogDefect?: (tcId?: string) => void;
  onSubmitReport?: () => void;
  isSubmitted?: boolean;
  onBlockersChange?: (notes: string) => void;
  onSaveReport?: (updatedData: any) => void;
}

export const TestingReportTemplate: React.FC<TestingReportTemplateProps> = ({
  projectName,
  moduleName,
  developerName,
  testerName,
  testDate = '21/09/2026',
  environment = 'Pre production',
  teamLead = 'Sarah Jenkins',
  projectLead = 'Sarah Jenkins',
  reportingManager = 'Sarah Jenkins',
  totalExecuted,
  passed,
  failed,
  blocked,
  passRate,
  finalVerdict,
  testScopeCoverage,
  defectsAndFailures,
  blockersNotes = '',
  preparedBy,
  onPrint,
  onClose,
  hideActions = false,
  onExecuteTestCase,
  onLogDefect,
  onSubmitReport,
  isSubmitted = false,
  onBlockersChange,
  onSaveReport
}) => {
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const [formData, setFormData] = useState({
    projectName,
    moduleName,
    developerName,
    testerName,
    testDate,
    environment,
    teamLead,
    projectLead,
    reportingManager,
    finalVerdict,
    blockersNotes,
    preparedBy: preparedBy || testerName,
    testScopeCoverage: [...(testScopeCoverage || [])],
    defectsAndFailures: [...(defectsAndFailures || [])]
  });

  // Sync state if props change when not editing
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        projectName,
        moduleName,
        developerName,
        testerName,
        testDate,
        environment,
        teamLead,
        projectLead,
        reportingManager,
        finalVerdict,
        blockersNotes,
        preparedBy: preparedBy || testerName,
        testScopeCoverage: [...(testScopeCoverage || [])],
        defectsAndFailures: [...(defectsAndFailures || [])]
      });
    }
  }, [
    projectName,
    moduleName,
    developerName,
    testerName,
    testDate,
    environment,
    teamLead,
    projectLead,
    reportingManager,
    finalVerdict,
    blockersNotes,
    preparedBy,
    testScopeCoverage,
    defectsAndFailures,
    isEditing
  ]);

  // Derived metrics from current test scope items
  const curScope = formData.testScopeCoverage || [];
  const hasScopeItems = curScope.length > 0;
  const curPassed = hasScopeItems ? curScope.filter(s => s.status === 'PASSED').length : (passed || 0);
  const curFailed = hasScopeItems ? curScope.filter(s => s.status === 'FAILED').length : (failed || 0);
  const curBlocked = hasScopeItems ? curScope.filter(s => s.status === 'BLOCKED').length : (blocked || 0);
  const curExecuted = hasScopeItems 
    ? (curScope.filter(s => s.status && s.status !== 'NOT_EXECUTED').length || curScope.length) 
    : (totalExecuted || 0);
  const curPassRate = curExecuted > 0 ? Math.round((curPassed / curExecuted) * 100) : (passRate || 0);

  const hasUnresolvedHighDefects = (formData.defectsAndFailures || []).some(d =>
    (d.severity === 'CRITICAL' || d.severity === 'HIGH') && d.status !== 'CLOSED' && d.status !== 'RESOLVED'
  );

  const curVerdict = (curFailed > 0 || hasUnresolvedHighDefects)
    ? 'FAILED'
    : (curExecuted > 0 && curPassed === curExecuted ? 'PASSED' : (formData.finalVerdict || finalVerdict || 'PENDING'));

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
    if (onSaveReport) {
      onSaveReport({
        ...formData,
        passed: curPassed,
        failed: curFailed,
        blocked: curBlocked,
        totalExecuted: curExecuted,
        passRate: curPassRate,
        finalVerdict: curVerdict
      });
    }
    if (onBlockersChange) {
      onBlockersChange(formData.blockersNotes);
    }
  };

  const handleReset = () => {
    setFormData({
      projectName,
      moduleName,
      developerName,
      testerName,
      testDate,
      environment,
      teamLead,
      projectLead,
      reportingManager,
      finalVerdict,
      blockersNotes,
      preparedBy: preparedBy || testerName,
      testScopeCoverage: [...(testScopeCoverage || [])],
      defectsAndFailures: [...(defectsAndFailures || [])]
    });
    setIsEditing(false);
  };

  const handleAddScenario = () => {
    const nextNum = formData.testScopeCoverage.length + 1;
    const newId = `TC-${(formData.moduleName || 'MOD').slice(0, 3).toUpperCase()}-${String(nextNum).padStart(3, '0')}`;
    setFormData(prev => ({
      ...prev,
      testScopeCoverage: [
        ...prev.testScopeCoverage,
        {
          id: newId,
          title: `New Test Scenario ${nextNum}`,
          scenario: '1. Navigate to module\n2. Perform operation\n3. Verify result',
          expectedResult: 'System functions according to specification',
          actualResult: '',
          status: 'NOT_EXECUTED'
        }
      ]
    }));
  };

  const handleRemoveScenario = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testScopeCoverage: prev.testScopeCoverage.filter((_, i) => i !== index)
    }));
  };

  const handleAddDefect = () => {
    const nextNum = formData.defectsAndFailures.length + 1;
    setFormData(prev => ({
      ...prev,
      defectsAndFailures: [
        ...prev.defectsAndFailures,
        {
          bugId: `BUG-${100 + nextNum}`,
          title: 'New Reported Defect',
          description: 'Description of observed failure or unexpected behavior...',
          severity: 'HIGH',
          status: 'OPEN'
        }
      ]
    }));
  };

  const handleRemoveDefect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      defectsAndFailures: prev.defectsAndFailures.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white text-slate-900 font-sans shadow-xl border border-slate-200 rounded-2xl max-w-5xl mx-auto overflow-hidden print:shadow-none print:border-none print:max-w-full">
      {/* Action Header for Screen View */}
      {!hideActions && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <FileCheck2 size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Software Test Report (1)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Standard QA Template
                </span>
                {isSubmitted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Lock size={10} /> Locked &amp; Submitted
                  </span>
                ) : isEditing ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 animate-pulse">
                    <Edit3 size={10} /> Edit Mode Active
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Live compliance document &bull; Project: {formData.projectName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Option Toggle */}
            {!isSubmitted && (
              isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                  >
                    <Save size={13} />
                    Save Changes
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
                  >
                    <RotateCcw size={13} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition shadow-2xs"
                >
                  <Edit3 size={13} />
                  Edit Report
                </button>
              )
            )}

            {onLogDefect && !isSubmitted && !isEditing && (
              <button
                onClick={() => onLogDefect()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
              >
                <Plus size={13} />
                Log Defect
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-2xs"
            >
              <Printer size={13} />
              Print / Save PDF
            </button>

            {onSubmitReport && !isSubmitted && !isEditing && (
              <button
                onClick={onSubmitReport}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
              >
                <Send size={13} />
                Submit Final Report
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="bg-emerald-500 text-white px-6 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 print:hidden animate-fade-in">
          <CheckCircle size={14} />
          Report changes successfully saved and applied to official document!
        </div>
      )}

      {/* Printable Document Body */}
      <div className="p-8 md:p-12 space-y-8 bg-white print:p-6" id="printable-testing-report">
        {/* Top Decorative Header Accent */}
        <div className="h-3 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 rounded-full mb-6 print:h-2" />

        {/* Title Header */}
        <div className="text-center space-y-2 pb-6 border-b border-slate-100">
          {isEditing ? (
            <div className="max-w-md mx-auto space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Module / Feature Title
              </label>
              <input
                type="text"
                value={formData.moduleName}
                onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                className="text-2xl font-black text-center w-full px-3 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-500">Project:</span>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="text-xs font-bold text-center px-2 py-1 border border-slate-300 rounded"
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 font-serif">
                {formData.moduleName || 'Ticket Raising'}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Project: {formData.projectName}
              </p>
            </>
          )}
        </div>

        {/* Sub-Header Metadata */}
        <div className="space-y-1 text-sm text-slate-700 font-medium">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Team Lead</label>
                <input
                  type="text"
                  value={formData.teamLead}
                  onChange={(e) => setFormData({ ...formData, teamLead: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Lead</label>
                <input
                  type="text"
                  value={formData.projectLead}
                  onChange={(e) => setFormData({ ...formData, projectLead: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reporting Manager</label>
                <input
                  type="text"
                  value={formData.reportingManager}
                  onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          ) : (
            <>
              <div><span className="font-semibold text-slate-900">Team Lead:</span> {formData.teamLead}</div>
              <div><span className="font-semibold text-slate-900">Project Lead:</span> {formData.projectLead}</div>
              <div><span className="font-semibold text-slate-900">Reporting Manager:</span> {formData.reportingManager}</div>
            </>
          )}
        </div>

        {/* 1. Overview */}
        <div className="space-y-3">
          <div className="border-l-4 border-blue-600 pl-3 py-0.5 bg-blue-50/60 rounded-r">
            <h2 className="text-lg font-bold text-slate-900">1. Overview</h2>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 w-1/2">Parameter</th>
                  <th className="py-2.5 px-4 w-1/2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="py-2.5 px-4 font-medium">Project / Feature Name</td>
                  <td className="py-2.5 px-4 font-semibold">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.moduleName}
                        onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    ) : (
                      formData.moduleName
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Test Date</td>
                  <td className="py-2.5 px-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.testDate}
                        onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    ) : (
                      formData.testDate
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">QA Lead / Tester</td>
                  <td className="py-2.5 px-4 font-medium">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.testerName}
                        onChange={(e) => setFormData({ ...formData, testerName: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    ) : (
                      formData.testerName || formData.preparedBy || 'QA Tester'
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Environment</td>
                  <td className="py-2.5 px-4">
                    {isEditing ? (
                      <select
                        value={formData.environment}
                        onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="Pre production">Pre production</option>
                        <option value="Staging">Staging</option>
                        <option value="Production">Production</option>
                        <option value="QA Environment">QA Environment</option>
                      </select>
                    ) : (
                      formData.environment
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Assigned Developer</td>
                  <td className="py-2.5 px-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.developerName}
                        onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      />
                    ) : (
                      formData.developerName
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Result Summary */}
        <div className="space-y-3">
          <div className="border-l-4 border-blue-600 pl-3 py-0.5 bg-blue-50/60 rounded-r">
            <h2 className="text-lg font-bold text-slate-900">2. Result Summary</h2>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-center">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Total Executed</th>
                  <th className="py-2.5 px-3">Passed</th>
                  <th className="py-2.5 px-3">Failed</th>
                  <th className="py-2.5 px-3">Blocked</th>
                  <th className="py-2.5 px-3">Pass Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                <tr>
                  <td className="py-3 px-3">[{curExecuted}]</td>
                  <td className="py-3 px-3 text-emerald-700">[{curPassed}]</td>
                  <td className="py-3 px-3 text-rose-700">[{curFailed}]</td>
                  <td className="py-3 px-3 text-amber-700">[{curBlocked}]</td>
                  <td className="py-3 px-3 text-blue-700">[{curPassRate}%]</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Final Verdict:</span>
            {isEditing ? (
              <select
                value={formData.finalVerdict}
                onChange={(e) => setFormData({ ...formData, finalVerdict: e.target.value as any })}
                className="text-xs font-bold px-3 py-1 border border-slate-300 rounded bg-white"
              >
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
                <option value="PENDING">PENDING</option>
              </select>
            ) : (
              <span
                className={`inline-block px-3 py-1 rounded text-xs uppercase tracking-wider font-extrabold ${
                  curVerdict === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                [ {curVerdict} ]
              </span>
            )}
          </div>
        </div>

        {/* 3. Test Scope & Coverage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-l-4 border-blue-600 pl-3 py-0.5 bg-blue-50/60 rounded-r">
            <h2 className="text-lg font-bold text-slate-900">3. Test Scope &amp; Coverage</h2>
            <div className="flex items-center gap-2 pr-2 print:hidden">
              <span className="text-xs font-semibold text-slate-500">
                {formData.testScopeCoverage.length} Test Scenarios
              </span>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddScenario}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shadow-2xs"
                >
                  <Plus size={12} /> Add Scenario
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2.5 text-sm text-slate-800 pl-1">
            {formData.testScopeCoverage && formData.testScopeCoverage.length > 0 ? (
              formData.testScopeCoverage.map((tc, idx) => {
                const isPassed = tc.status === 'PASSED';
                const isFailed = tc.status === 'FAILED';
                const isBlocked = tc.status === 'BLOCKED';

                return (
                  <div
                    key={tc.id || idx}
                    className="p-3 rounded-xl border border-slate-200/90 hover:border-slate-300 transition bg-slate-50/40 print:border-none print:p-1 print:bg-transparent"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={tc.id || ''}
                              onChange={(e) => {
                                const newScope = [...formData.testScopeCoverage];
                                newScope[idx].id = e.target.value;
                                setFormData({ ...formData, testScopeCoverage: newScope });
                              }}
                              placeholder="TC ID"
                              className="w-24 text-xs font-mono font-bold px-2 py-1 bg-white border border-slate-300 rounded"
                            />
                            <input
                              type="text"
                              value={tc.title}
                              onChange={(e) => {
                                const newScope = [...formData.testScopeCoverage];
                                newScope[idx].title = e.target.value;
                                setFormData({ ...formData, testScopeCoverage: newScope });
                              }}
                              placeholder="Test scenario title"
                              className="flex-1 text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={tc.status || 'NOT_EXECUTED'}
                              onChange={(e) => {
                                const newScope = [...formData.testScopeCoverage];
                                newScope[idx].status = e.target.value;
                                setFormData({ ...formData, testScopeCoverage: newScope });
                              }}
                              className="text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded"
                            >
                              <option value="PASSED">PASSED</option>
                              <option value="FAILED">FAILED</option>
                              <option value="BLOCKED">BLOCKED</option>
                              <option value="NOT_EXECUTED">NOT_EXECUTED</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveScenario(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                              title="Delete Scenario"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={tc.scenario || ''}
                          onChange={(e) => {
                            const newScope = [...formData.testScopeCoverage];
                            newScope[idx].scenario = e.target.value;
                            setFormData({ ...formData, testScopeCoverage: newScope });
                          }}
                          placeholder="Test steps / instructions..."
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span className="font-mono text-sm shrink-0 pt-0.5">
                            {isPassed ? (
                              <span className="text-emerald-600 font-black">● [✓]</span>
                            ) : isFailed ? (
                              <span className="text-rose-600 font-black">● [✕]</span>
                            ) : isBlocked ? (
                              <span className="text-amber-600 font-black">● [⊘]</span>
                            ) : (
                              <span className="text-slate-400 font-black">● [ ]</span>
                            )}
                          </span>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {tc.id && (
                                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 shrink-0">
                                  {tc.id}
                                </span>
                              )}
                              <span className="font-bold text-slate-900">
                                {tc.title || tc.scenario || `Test Scenario ${idx + 1}`}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.2 rounded uppercase tracking-wider ${
                                  isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isFailed
                                    ? 'bg-rose-100 text-rose-800'
                                    : isBlocked
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {tc.status || 'NOT_EXECUTED'}
                              </span>
                            </div>

                            {tc.scenario && (
                              <p className="text-xs text-slate-600 leading-relaxed print:text-slate-700">
                                <span className="font-semibold text-slate-700">Steps: </span>
                                {tc.scenario}
                              </p>
                            )}

                            {tc.actualResult && (
                              <p className="text-xs text-blue-800 dark:text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md font-medium">
                                <span className="font-bold">Actual Result: </span>
                                {tc.actualResult}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Interactive Execution Buttons (Screen view only) */}
                        {onExecuteTestCase && tc.id && !isSubmitted && (
                          <div className="flex items-center gap-1.5 shrink-0 print:hidden self-end sm:self-start">
                            <button
                              onClick={() => onExecuteTestCase(tc.id!, 'PASSED')}
                              title="Mark as Passed"
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                                isPassed
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200'
                              }`}
                            >
                              <CheckCircle size={12} />
                              PASS
                            </button>

                            <button
                              onClick={() => onExecuteTestCase(tc.id!, 'FAILED')}
                              title="Mark as Failed"
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                                isFailed
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-slate-200'
                              }`}
                            >
                              <XCircle size={12} />
                              FAIL
                            </button>

                            <button
                              onClick={() => onExecuteTestCase(tc.id!, 'BLOCKED')}
                              title="Mark as Blocked"
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                                isBlocked
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-white hover:bg-amber-50 text-amber-700 border border-slate-200'
                              }`}
                            >
                              <MinusCircle size={12} />
                              BLOCKED
                            </button>

                            {isFailed && onLogDefect && (
                              <button
                                onClick={() => onLogDefect(tc.id)}
                                className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline ml-1"
                              >
                                Log Bug
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 italic text-xs">No specific test scope items recorded.</p>
            )}
          </div>
        </div>

        {/* 4. Defects & Failures */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-l-4 border-blue-600 pl-3 py-0.5 bg-blue-50/60 rounded-r">
            <h2 className="text-lg font-bold text-slate-900">4. Defects &amp; Failures</h2>
            <div className="flex items-center gap-2 pr-2 print:hidden">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleAddDefect}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-rose-600 text-white hover:bg-rose-700 transition shadow-2xs"
                >
                  <Plus size={12} /> Add Defect
                </button>
              ) : onLogDefect && !isSubmitted ? (
                <button
                  onClick={() => onLogDefect()}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 mr-2 flex items-center gap-1"
                >
                  <Plus size={12} /> Log Defect
                </button>
              ) : null}
            </div>
          </div>

          {formData.defectsAndFailures && formData.defectsAndFailures.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 w-1/5">Bug ID / Link</th>
                    <th className="py-2.5 px-4 w-3/5">Description</th>
                    <th className="py-2.5 px-4 w-1/5">Severity</th>
                    {isEditing && <th className="py-2.5 px-2 w-12 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {formData.defectsAndFailures.map((bug, idx) => (
                    <tr key={idx} className="align-top hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 text-xs whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={bug.bugId}
                            onChange={(e) => {
                              const newBugs = [...formData.defectsAndFailures];
                              newBugs[idx].bugId = e.target.value;
                              setFormData({ ...formData, defectsAndFailures: newBugs });
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        ) : (
                          bug.bugId
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs leading-relaxed text-slate-700">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={bug.title || ''}
                              onChange={(e) => {
                                const newBugs = [...formData.defectsAndFailures];
                                newBugs[idx].title = e.target.value;
                                setFormData({ ...formData, defectsAndFailures: newBugs });
                              }}
                              placeholder="Defect Title"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                            />
                            <textarea
                              rows={2}
                              value={bug.description}
                              onChange={(e) => {
                                const newBugs = [...formData.defectsAndFailures];
                                newBugs[idx].description = e.target.value;
                                setFormData({ ...formData, defectsAndFailures: newBugs });
                              }}
                              placeholder="Defect description..."
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>
                        ) : (
                          <>
                            {bug.title && <strong className="block text-slate-900 mb-0.5">{bug.title}</strong>}
                            {bug.description}
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={bug.severity}
                            onChange={(e) => {
                              const newBugs = [...formData.defectsAndFailures];
                              newBugs[idx].severity = e.target.value;
                              setFormData({ ...formData, defectsAndFailures: newBugs });
                            }}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                          >
                            <option value="CRITICAL">CRITICAL</option>
                            <option value="HIGH">HIGH</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="LOW">LOW</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              bug.severity === 'CRITICAL' || bug.severity === 'Critical'
                                ? 'bg-red-100 text-red-800'
                                : bug.severity === 'HIGH' || bug.severity === 'High'
                                ? 'bg-rose-100 text-rose-800'
                                : bug.severity === 'MEDIUM' || bug.severity === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {bug.severity}
                          </span>
                        )}
                      </td>
                      {isEditing && (
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDefect(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Delete Defect"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center text-xs text-slate-500">
              No defects or failures recorded during this testing run.
            </div>
          )}
        </div>

        {/* 5. Blockers & Notes */}
        <div className="space-y-3">
          <div className="border-l-4 border-blue-600 pl-3 py-0.5 bg-blue-50/60 rounded-r">
            <h2 className="text-lg font-bold text-slate-900">5. Blockers &amp; Notes</h2>
          </div>

          {isEditing || (onBlockersChange && !isSubmitted) ? (
            <div className="space-y-1.5 print:hidden">
              <textarea
                value={formData.blockersNotes}
                onChange={(e) => {
                  setFormData({ ...formData, blockersNotes: e.target.value });
                  if (onBlockersChange) onBlockersChange(e.target.value);
                }}
                placeholder="List any issues that prevented testing, or critical context for the engineering team here..."
                rows={3}
                className="w-full text-xs text-slate-800 bg-slate-50/80 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 italic">
                Notes typed here automatically save to the final submitted report.
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-600 italic bg-slate-50/60 p-4 rounded-lg border border-slate-200/80 leading-relaxed min-h-[60px]">
              {formData.blockersNotes ||
                '[List any issues that prevented testing, or critical context for the engineering team here. Leave blank if none.]'}
            </div>
          )}
        </div>

        {/* Signature & Sign-Off */}
        <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
          <div className="text-xs text-slate-500">
            <p>Verified against Project Acceptance Criteria</p>
            <p>Generated: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-slate-500">Prepared by,</p>
            {isEditing ? (
              <input
                type="text"
                value={formData.preparedBy}
                onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                className="text-right font-bold text-xs px-2 py-1 border border-slate-300 rounded"
              />
            ) : (
              <p className="text-sm font-bold text-slate-950">{formData.preparedBy || 'QA Tester'}</p>
            )}
            <p className="text-xs text-slate-600 font-medium">QA Tester</p>
          </div>
        </div>

        {/* Save Bar at the bottom in Edit Mode */}
        {isEditing && (
          <div className="pt-6 border-t border-slate-200 flex justify-end gap-3 print:hidden">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Save size={14} />
              Save &amp; Apply Report Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

