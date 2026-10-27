import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hrmsPool as pool } from '../db/pool.js';
import { TestReportPdfService } from './testReportPdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
const submittedDir = path.join(uploadsDir, 'test-reports', 'submitted');
const templatesDir = path.join(uploadsDir, 'test-reports', 'templates');

if (!fs.existsSync(submittedDir)) {
  fs.mkdirSync(submittedDir, { recursive: true });
}
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

function parseList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export class TestReportsService {
  /**
   * Helper: Check if user has Admin privileges
   */
  static isAdmin(user) {
    const role = (user?.role || '').toLowerCase();
    return role === 'admin' || role === 'hradmin' || role === 'executive' || role === 'executive director';
  }

  /**
   * Helper: Check if user has Manager privileges
   */
  static isManager(user) {
    const role = (user?.role || '').toLowerCase();
    return this.isAdmin(user) || role.includes('manager') || role === 'lead';
  }

  /**
   * Helper: Verify user access to a specific report
   */
  static async verifyAccess(report, user) {
    if (this.isAdmin(user)) return true;
    const userId = user?.empCode || user?.id;
    if (!userId) return false;

    // Direct tester or developer
    if (report.tester_id === userId || report.employee_id === userId) return true;

    // Manager
    if (report.manager_id === userId) return true;

    // Check reporting hierarchy in employees table
    const empCheck = await pool.query(
      `SELECT reporting_manager_id, reporting_manager_name FROM employees WHERE emp_code = $1 OR id = $1 LIMIT 1`,
      [report.employee_id]
    );
    if (empCheck.rows.length > 0) {
      const mgr = empCheck.rows[0];
      if (mgr.reporting_manager_id === userId || mgr.reporting_manager_name === user?.name) {
        return true;
      }
    }
    return false;
  }

  /**
   * GET /api/test-reports/:id
   */
  static async getReportById(id, user) {
    const res = await pool.query(`SELECT * FROM test_reports WHERE id = $1 LIMIT 1`, [id]);
    if (res.rows.length === 0) {
      // Fallback: check testing_reports for legacy reports
      const legacy = await pool.query(`SELECT * FROM testing_reports WHERE id = $1 LIMIT 1`, [id]);
      if (legacy.rows.length === 0) return null;
      const leg = legacy.rows[0];
      return {
        id: leg.id,
        employee_id: leg.developer_employee_id || leg.generated_by_id,
        tester_id: leg.tester_employee_id || 'EMP-004',
        tester_name: leg.tester_employee_name || 'Rahul Verma',
        manager_id: 'EMP-001',
        manager_name: 'Sarah Jenkins',
        project_id: leg.project_id || 'PRJ-001',
        project_name: leg.project_name || leg.module_name || 'Attendance',
        status: leg.report_status || 'SUBMITTED',
        test_date: leg.created_at ? new Date(leg.created_at).toLocaleDateString('en-GB') : '25/09/2026',
        final_verdict: leg.final_verdict || 'PASSED',
        total_executed: leg.total_executed || leg.total_test_cases || 10,
        passed: leg.passed || leg.passed_test_cases || 9,
        failed: leg.failed || leg.failed_test_cases || 1,
        blocked: leg.blocked || leg.blocked_test_cases || 0,
        pass_rate: leg.pass_rate || 90.00,
        test_scope_coverage: parseList(leg.test_scope_coverage),
        defects_and_failures: parseList(leg.defects_and_failures),
        blockers_notes: leg.blockers_notes || leg.summary_notes || '',
        prepared_by: leg.tester_employee_name || 'Rahul Verma',
        team_lead: 'Sarah Jenkins',
        reporting_manager: 'Sarah Jenkins',
        final_pdf_path: leg.final_pdf_path || null
      };
    }

    const report = res.rows[0];
    const hasAccess = await this.verifyAccess(report, user);
    if (!hasAccess) {
      const err = new Error('Access denied: You do not have permission to view this test report.');
      err.statusCode = 403;
      throw err;
    }

    // Normalize defects_and_failures
    report.defects_and_failures = parseList(report.defects_and_failures);
    if (report.defects_and_failures.length === 0 && report.draft_data) {
      report.defects_and_failures = parseList(report.draft_data.defectsAndFailures || report.draft_data.defects_and_failures);
    }
    // If still empty, check bugs table for Attendance module defects
    if (report.defects_and_failures.length === 0) {
      const bugsRes = await pool.query(
        `SELECT id, bug_id as "bugId", title, description, severity, status, 
                assigned_developer_id as "assignedTo", assigned_developer_name as "assignedName"
         FROM bugs 
         WHERE module_id = 'MOD-ATT' OR project_name ILIKE '%Attendance%'
         ORDER BY created_at ASC`
      );
      if (bugsRes.rows.length > 0) {
        report.defects_and_failures = bugsRes.rows;
      }
    }

    // Normalize test_scope_coverage
    report.test_scope_coverage = parseList(report.test_scope_coverage);
    if (report.test_scope_coverage.length === 0 && report.draft_data) {
      report.test_scope_coverage = parseList(report.draft_data.testScopeCoverage || report.draft_data.test_scope_coverage);
    }

    if (!report.blockers_notes && report.draft_data?.blockersNotes) {
      report.blockers_notes = report.draft_data.blockersNotes;
    }

    return report;
  }

  /**
   * Helper: Sync defects into bugs table so they appear on Employee and QA views
   */
  static async syncDefectsToBugs(defects, reportContext, user) {
    if (!Array.isArray(defects) || defects.length === 0) return;
    const {
      reportId,
      projectId = 'PRJ-001',
      projectName = 'Attendance',
      moduleId = 'MOD-ATT',
      moduleName = 'Attendance',
      testerId = 'EMP-004',
      testerName = 'Rahul Verma',
      defaultEmployeeId = 'EMP-005',
      defaultEmployeeName = 'Vishnu Vardhan'
    } = reportContext;

    for (const defect of defects) {
      if (!defect || (!defect.bugId && !defect.bug_id && !defect.title)) continue;
      const bId = (defect.bugId || defect.bug_id || 'BUG-101').trim();
      const numMatch = bId.match(/\d+/);
      const bugNum = numMatch ? numMatch[0] : String(Date.now()).slice(-3);
      const bugDbId = defect.id || `BUG-ATT-${bugNum}`;

      const assignedDevId = defect.assignedTo || defect.assigned_developer_id || defaultEmployeeId || 'EMP-005';
      const assignedDevName = defect.assignedName || defect.assigned_developer_name || defaultEmployeeName || 'Vishnu Vardhan';
      const sev = (defect.severity || 'HIGH').toUpperCase();
      const st = (defect.status || 'OPEN').toUpperCase();
      const prio = sev === 'CRITICAL' ? 'HIGH' : sev === 'HIGH' ? 'HIGH' : 'MEDIUM';

      try {
        await pool.query(
          `INSERT INTO bugs (
            id, bug_id, module_id, module_name, project_id, project_name,
            developer_employee_id, developer_employee_name,
            tester_employee_id, tester_employee_name,
            title, description, severity, priority, status,
            assigned_developer_id, assigned_developer_name,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8,
            $9, $10,
            $11, $12, $13, $14, $15,
            $7, $8,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            bug_id = EXCLUDED.bug_id,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            severity = EXCLUDED.severity,
            status = EXCLUDED.status,
            assigned_developer_id = EXCLUDED.assigned_developer_id,
            assigned_developer_name = EXCLUDED.assigned_developer_name,
            developer_employee_id = EXCLUDED.developer_employee_id,
            developer_employee_name = EXCLUDED.developer_employee_name,
            updated_at = CURRENT_TIMESTAMP`,
          [
            bugDbId, bId, moduleId, moduleName, projectId, projectName,
            assignedDevId, assignedDevName,
            testerId, testerName,
            defect.title || 'Untitled Defect',
            defect.description || '',
            sev, prio, st
          ]
        );

        // Record bug status history if not existing
        await pool.query(
          `INSERT INTO bug_status_history (id, bug_id, changed_by_id, changed_by_name, changed_by_role, old_status, new_status, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [
            `BSH-${bugDbId}-${Date.now().toString().slice(-4)}`,
            bugDbId,
            testerId,
            testerName,
            'Tester',
            st,
            `Synced from Quality Gate Test Report (${reportId || 'REP-ATT-001'})`
          ]
        ).catch(() => {});
      } catch (err) {
        console.warn('Failed to sync defect to bugs table:', err.message);
      }
    }
  }

  /**
   * GET /api/test-reports/employee/:employeeId
   */
  static async getReportsForEmployee(requestedEmpId, user) {
    const currentUserId = user?.empCode || user?.id;
    // Security: normal employees can only access their own reports
    const targetEmpId = this.isManager(user) || this.isAdmin(user) ? requestedEmpId : currentUserId;

    const res = await pool.query(
      `SELECT * FROM test_reports 
       WHERE employee_id = $1 OR tester_id = $1 
       ORDER BY updated_at DESC`,
      [targetEmpId]
    );

    // If empty and targetEmpId is Rahul Verma or Attendance tester, return default seed
    if (res.rows.length === 0) {
      const fallbackRes = await pool.query(
        `SELECT * FROM test_reports WHERE project_name ILIKE '%Attendance%' ORDER BY updated_at DESC LIMIT 5`
      );
      if (fallbackRes.rows.length > 0) {
        return fallbackRes.rows.map(r => ({
          ...r,
          test_scope_coverage: parseList(r.test_scope_coverage),
          defects_and_failures: parseList(r.defects_and_failures)
        }));
      }
    }

    return res.rows.map(r => ({
      ...r,
      test_scope_coverage: parseList(r.test_scope_coverage),
      defects_and_failures: parseList(r.defects_and_failures)
    }));
  }

  /**
   * GET /api/test-reports/manager/:managerId
   */
  static async getReportsForManager(requestedMgrId, user) {
    if (!this.isManager(user)) {
      const err = new Error('Access denied: Managerial privileges required.');
      err.statusCode = 403;
      throw err;
    }

    const currentUserId = user?.empCode || user?.id;
    const targetMgrId = this.isAdmin(user) ? requestedMgrId : currentUserId;

    const res = await pool.query(
      `SELECT r.*, e.name as employee_name, e.designation as employee_designation, e.department as employee_department
       FROM test_reports r
       LEFT JOIN employees e ON r.employee_id = e.emp_code OR r.employee_id = e.id
       WHERE r.manager_id = $1 
          OR r.employee_id IN (
             SELECT emp_code FROM employees WHERE reporting_manager_id = $1 OR LOWER(reporting_manager_name) = LOWER($2)
          )
          OR r.tester_id IN (
             SELECT emp_code FROM employees WHERE reporting_manager_id = $1 OR LOWER(reporting_manager_name) = LOWER($2)
          )
       ORDER BY r.updated_at DESC`,
      [targetMgrId, user?.name || '']
    );

    if (res.rows.length === 0 && this.isManager(user)) {
      // If manager has no direct scope yet, show company test reports
      const allRes = await pool.query(`SELECT * FROM test_reports ORDER BY updated_at DESC LIMIT 10`);
      return allRes.rows.map(r => ({
        ...r,
        test_scope_coverage: parseList(r.test_scope_coverage),
        defects_and_failures: parseList(r.defects_and_failures)
      }));
    }

    return res.rows.map(r => ({
      ...r,
      test_scope_coverage: parseList(r.test_scope_coverage),
      defects_and_failures: parseList(r.defects_and_failures)
    }));
  }

  /**
   * GET /api/test-reports/admin
   */
  static async getReportsForAdmin(user) {
    if (!this.isAdmin(user) && !this.isManager(user)) {
      const err = new Error('Access denied: Admin privileges required.');
      err.statusCode = 403;
      throw err;
    }

    const res = await pool.query(
      `SELECT r.*, 
              e.name as employee_name, 
              e.department as employee_department,
              t.name as tester_full_name
       FROM test_reports r
       LEFT JOIN employees e ON r.employee_id = e.emp_code OR r.employee_id = e.id
       LEFT JOIN employees t ON r.tester_id = t.emp_code OR r.tester_id = t.id
       ORDER BY r.updated_at DESC`
    );
    return res.rows.map(r => ({
      ...r,
      test_scope_coverage: parseList(r.test_scope_coverage),
      defects_and_failures: parseList(r.defects_and_failures)
    }));
  }

  /**
   * POST /api/test-reports & PATCH /api/test-reports/:id/draft
   * Save Draft with backend persistence and defect sync to bugs table
   */
  static async saveDraft(id, payload, user) {
    const reportId = id || payload.id || `REP-${Date.now()}`;
    const testerId = payload.tester_id || payload.testerId || user?.empCode || user?.id || 'EMP-004';
    const testerName = payload.tester_name || payload.testerName || payload.prepared_by || payload.preparedBy || user?.name || 'Rahul Verma';
    const employeeId = payload.employee_id || payload.developerId || payload.developer_id || 'EMP-006';
    const employeeName = payload.developer_name || payload.developerName || payload.employee_name || 'mohan';
    const managerId = payload.manager_id || payload.managerId || 'EMP-001';
    const managerName = payload.manager_name || payload.managerName || payload.reporting_manager || payload.reportingManager || 'Sarah Jenkins';
    const projectId = payload.project_id || payload.projectId || 'PRJ-3240';
    const projectName = payload.project_name || payload.projectName || 'Sigma Systems - Implementation Project';
    const title = payload.title || 'Software Test Report (1)';
    const testDate = payload.test_date || payload.testDate || new Date().toLocaleDateString('en-GB');
    const environment = payload.environment || 'Pre-Production';
    const version = payload.version || '1.0';

    const totalExecuted = Number(payload.total_executed ?? payload.totalExecuted ?? 10);
    const passed = Number(payload.passed ?? 9);
    const failed = Number(payload.failed ?? 1);
    const blocked = Number(payload.blocked ?? 0);
    const passRate = totalExecuted > 0 ? Number(((passed / totalExecuted) * 100).toFixed(2)) : 0;
    const finalVerdict = payload.final_verdict || payload.finalVerdict || (failed > 0 && passRate < 80 ? 'FAILED' : 'PASSED');

    let testScopeCoverage = parseList(
      payload.test_scope_coverage || payload.testScopeCoverage || payload.draft_data?.testScopeCoverage
    );
    let defectsAndFailures = parseList(
      payload.defects_and_failures || payload.defectsAndFailures || payload.draft_data?.defectsAndFailures
    );
    const blockersNotes = payload.blockers_notes || payload.blockersNotes || payload.draft_data?.blockersNotes || '';
    const preparedBy = payload.prepared_by || payload.preparedBy || testerName;
    const teamLead = payload.team_lead || payload.teamLead || 'Sarah Jenkins';
    const projectLead = payload.project_lead || payload.projectLead || 'Sarah Jenkins';
    const reportingManager = payload.reporting_manager || payload.reportingManager || managerName;

    const draftData = {
      ...(typeof payload.draft_data === 'object' && payload.draft_data !== null ? payload.draft_data : payload),
      testScopeCoverage,
      defectsAndFailures,
      totalExecuted,
      passed,
      failed,
      blocked,
      passRate,
      finalVerdict,
      blockersNotes,
      preparedBy,
      projectName,
      testerName,
      developerName: employeeName
    };

    const moduleId = payload.module_id || payload.moduleId || payload.draft_data?.moduleId || (projectName.toLowerCase().includes('recruitment') ? 'MOD-REC' : 'MOD-ATT');
    const moduleName = payload.module_name || payload.moduleName || payload.draft_data?.moduleName || (projectName.toLowerCase().includes('recruitment') ? 'Recruitment' : projectName);

    // 1. Sync defects to bugs table
    await this.syncDefectsToBugs(
      defectsAndFailures,
      {
        reportId,
        projectId,
        projectName,
        moduleId,
        moduleName,
        testerId,
        testerName,
        defaultEmployeeId: employeeId,
        defaultEmployeeName: employeeName
      },
      user
    );

    // 2. Check if report exists
    const existing = await pool.query(`SELECT id, status FROM test_reports WHERE id = $1`, [reportId]);

    let savedReport;
    if (existing.rows.length === 0) {
      // Insert new draft
      const insertRes = await pool.query(
        `INSERT INTO test_reports (
          id, employee_id, tester_id, tester_name, manager_id, manager_name,
          project_id, project_name, task_id, template_id, title,
          status, test_date, environment, version,
          total_executed, passed, failed, blocked, pass_rate, final_verdict,
          draft_data, test_scope_coverage, defects_and_failures, blockers_notes,
          prepared_by, team_lead, project_lead, reporting_manager,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'DRAFT', $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *`,
        [
          reportId, employeeId, testerId, testerName, managerId, managerName,
          projectId, projectName, payload.task_id || 'TSK-ATT-001', 'TEMPLATE-STR-001', title,
          testDate, environment, version, totalExecuted, passed, failed, blocked, passRate, finalVerdict,
          JSON.stringify(draftData), JSON.stringify(testScopeCoverage), JSON.stringify(defectsAndFailures), blockersNotes,
          preparedBy, teamLead, projectLead, reportingManager
        ]
      );
      savedReport = insertRes.rows[0];
    } else {
      // Update existing draft
      const updateRes = await pool.query(
        `UPDATE test_reports SET
          tester_name = COALESCE($2, tester_name),
          project_name = COALESCE($3, project_name),
          test_date = COALESCE($4, test_date),
          environment = COALESCE($5, environment),
          total_executed = $6,
          passed = $7,
          failed = $8,
          blocked = $9,
          pass_rate = $10,
          final_verdict = $11,
          draft_data = $12,
          test_scope_coverage = $13,
          defects_and_failures = $14,
          blockers_notes = $15,
          prepared_by = COALESCE($16, prepared_by),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *`,
        [
          reportId, testerName, projectName, testDate, environment,
          totalExecuted, passed, failed, blocked, passRate, finalVerdict,
          JSON.stringify(draftData), JSON.stringify(testScopeCoverage), JSON.stringify(defectsAndFailures), blockersNotes,
          preparedBy
        ]
      );
      savedReport = updateRes.rows[0];
    }

    // Sync defects & coverage into matching testing_reports so employee view stays current
    try {
      const defectsJson = JSON.stringify(defectsAndFailures || []);
      const coverageJson = JSON.stringify(testScopeCoverage || []);
      const upRes = await pool.query(
        `UPDATE testing_reports
         SET defects_and_failures = $1::jsonb,
             test_scope_coverage  = $2::jsonb,
             blockers_notes       = COALESCE($3, blockers_notes),
             total_executed       = $4,
             passed               = $5,
             failed               = $6,
             blocked              = $7,
             pass_rate            = $8,
             final_verdict        = $9
         WHERE id = $10
            OR module_id = $11
            OR LOWER(module_name) = LOWER($12)
         RETURNING id`,
        [
          defectsJson, coverageJson, blockersNotes || null,
          totalExecuted, passed, failed, blocked, passRate, finalVerdict,
          reportId, moduleId, moduleName
        ]
      );

      if (upRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO testing_reports (
            id, project_id, project_name, module_id, module_name,
            developer_employee_id, developer_employee_name,
            tester_employee_id, tester_employee_name,
            version, environment, total_test_cases, total_executed,
            passed_test_cases, passed, failed_test_cases, failed,
            blocked_test_cases, blocked, pass_rate, final_verdict,
            report_status, test_scope_coverage, defects_and_failures,
            blockers_notes, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $13, $13, $14, $14, $15, $15, $16, $17, 'DRAFT', $18::jsonb, $19::jsonb, $20, CURRENT_TIMESTAMP
          ) ON CONFLICT (id) DO UPDATE SET
            defects_and_failures = EXCLUDED.defects_and_failures,
            test_scope_coverage = EXCLUDED.test_scope_coverage,
            blockers_notes = EXCLUDED.blockers_notes`,
          [
            reportId, projectId, projectName, moduleId, moduleName,
            employeeId, employeeName, testerId, testerName,
            version, environment, totalExecuted, passed, failed, blocked, passRate, finalVerdict,
            coverageJson, defectsJson, blockersNotes
          ]
        );
      }

      // Also ensure testing_documents has this document entry
      const docId = `DOC-${reportId}`;
      const docName = `${moduleName} - ${testerName} Testing Report`;
      await pool.query(
        `INSERT INTO testing_documents (
          id, project_id, project_name, module_id, module_name,
          developer_employee_id, developer_employee_name,
          tester_employee_id, tester_employee_name,
          testing_report_id, document_name, version, environment,
          status, final_verdict, pass_rate, created_by_id, created_by_name, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'DRAFT', $14, $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO UPDATE SET
          project_name = EXCLUDED.project_name,
          module_name = EXCLUDED.module_name,
          testing_report_id = EXCLUDED.testing_report_id,
          final_verdict = EXCLUDED.final_verdict,
          pass_rate = EXCLUDED.pass_rate,
          updated_at = CURRENT_TIMESTAMP`,
        [
          docId, projectId, projectName, moduleId, moduleName,
          employeeId, employeeName, testerId, testerName,
          reportId, docName, version, environment,
          finalVerdict, passRate, user?.id || testerId, user?.name || testerName
        ]
      );
    } catch (syncErr) {
      console.warn('[TestReportsService.saveDraft] Sync error:', syncErr.message);
    }

    return {
      ...savedReport,
      test_scope_coverage: parseList(savedReport.test_scope_coverage),
      defects_and_failures: parseList(savedReport.defects_and_failures)
    };
  }

  /**
   * POST /api/test-reports/:id/submit
   * Generate final PDF, persist to storage, and mark report as SUBMITTED
   */
  static async submitReport(id, payload, user) {
    const draft = await this.saveDraft(id, payload, user);
    const reportId = draft.id;

    const moduleId = payload.module_id || payload.moduleId || draft.draft_data?.moduleId || (draft.project_name?.toLowerCase().includes('recruitment') ? 'MOD-REC' : 'MOD-ATT');
    const moduleName = payload.module_name || payload.moduleName || draft.draft_data?.moduleName || (draft.project_name?.toLowerCase().includes('recruitment') ? 'Recruitment' : draft.project_name || 'Attendance');

    // Compile complete report data for PDF generation
    const reportDataForPdf = {
      title: draft.title || 'Software Test Report (1)',
      projectName: draft.project_name || 'Attendance',
      moduleName: moduleName,
      testDate: draft.test_date || new Date().toLocaleDateString('en-GB'),
      environment: draft.environment || 'Pre-Production',
      version: draft.version || '1.0',
      testerName: draft.tester_name || user?.name || 'Rahul Verma',
      developerName: 'Vishnu Vardhan',
      teamLead: draft.team_lead || 'Sarah Jenkins',
      reportingManager: draft.reporting_manager || 'Sarah Jenkins',
      totalExecuted: draft.total_executed,
      passed: draft.passed,
      failed: draft.failed,
      blocked: draft.blocked,
      passRate: draft.pass_rate,
      finalVerdict: draft.final_verdict,
      testScopeCoverage: draft.test_scope_coverage,
      defectsAndFailures: draft.defects_and_failures,
      blockersNotes: draft.blockers_notes,
      preparedBy: draft.prepared_by || user?.name || 'Rahul Verma',
      submittedAt: new Date().toISOString()
    };

    // Generate physical PDF document
    const pdfBuffer = await TestReportPdfService.generateReportPdf(reportDataForPdf);
    const filename = `report_${reportId}.pdf`;
    const filePath = path.join(submittedDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    const currentPhase = draft.testing_phase || payload.testing_phase || payload.testingPhase || 1;
    const currentPhaseName = draft.phase_name || payload.phase_name || payload.phaseName || (currentPhase === 3 ? 'Phase 3 - Final Gate (100%)' : currentPhase === 2 ? 'Phase 2 - Beta Testing (90%)' : 'Phase 1 - Alpha Testing (80%)');
    const isPassed = (draft.final_verdict || 'PASSED') === 'PASSED';

    // Mark as SUBMITTED in database
    const submitRes = await pool.query(
      `UPDATE test_reports SET
        status = 'SUBMITTED',
        final_pdf_path = $2,
        testing_phase = COALESCE($4, testing_phase, 1),
        phase_name = COALESCE($5, phase_name, 'Phase 1 - Alpha Testing (80%)'),
        submitted_at = CURRENT_TIMESTAMP,
        submitted_by = $3,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [reportId, relativePdfUrl, user?.name || user?.id || 'Rahul Verma', currentPhase, currentPhaseName]
    );

    // Also sync to testing_documents for project-centric documents tab
    const docId = `DOC-${reportId}`;
    const docName = `${moduleName} (${currentPhaseName}) - ${draft.tester_name || user?.name || 'Rahul Verma'} Testing Report`;
    try {
      await pool.query(
        `INSERT INTO testing_documents (
          id, project_id, project_name, module_id, module_name,
          developer_employee_id, developer_employee_name,
          tester_employee_id, tester_employee_name,
          testing_report_id, document_name, version, environment,
          status, final_verdict, pass_rate,
          testing_phase, phase_name,
          created_by_id, created_by_name, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'SUBMITTED', $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO UPDATE SET
          project_name = EXCLUDED.project_name,
          module_name = EXCLUDED.module_name,
          testing_report_id = EXCLUDED.testing_report_id,
          status = 'SUBMITTED',
          final_verdict = EXCLUDED.final_verdict,
          pass_rate = EXCLUDED.pass_rate,
          testing_phase = EXCLUDED.testing_phase,
          phase_name = EXCLUDED.phase_name,
          updated_at = CURRENT_TIMESTAMP`,
        [
          docId, draft.project_id || 'PRJ-3240', draft.project_name || 'Sigma Systems', moduleId, moduleName,
          draft.employee_id || 'EMP-006', draft.developer_name || 'mohan',
          draft.tester_id || 'EMP-004', draft.tester_name || 'Rahul Verma',
          reportId, docName, draft.version || '1.0', draft.environment || 'Pre-Production',
          draft.final_verdict || 'PASSED', draft.pass_rate || 90.0,
          currentPhase, currentPhaseName,
          user?.id || 'EMP-004', user?.name || 'Rahul Verma'
        ]
      );
    } catch (docErr) {
      console.warn('Could not sync to testing_documents (continuing):', docErr.message);
    }

    // Update testing_requests record
    try {
      await pool.query(`
        UPDATE testing_requests 
        SET status = $1,
            phase_status = $2,
            last_tested_date = CURRENT_TIMESTAMP,
            notes = $3,
            updated_at = CURRENT_TIMESTAMP 
        WHERE (project_id = $4 OR project_name = $5 OR project_id IS NULL)
          AND (module_id = $6 OR LOWER(module_name) = LOWER($7))
          AND (developer_employee_id = $8 OR LOWER(developer_employee_name) = LOWER($9))
      `, [
        isPassed ? (currentPhase === 3 ? 'APPROVED' : 'PASSED') : 'FAILED',
        isPassed ? 'COMPLETED' : 'FAILED',
        `${currentPhaseName} report submitted by ${draft.tester_name || user?.name || 'Tester'}. Verdict: ${draft.final_verdict || 'PASSED'}.`,
        draft.project_id || 'PRJ-3240', draft.project_name || 'Sigma Systems',
        moduleId, moduleName,
        draft.employee_id || 'EMP-006', draft.developer_name || 'mohan'
      ]);
    } catch (trErr) {
      console.warn('Could not update testing_requests from testReportsService:', trErr.message);
    }

    // Sync admin-edited defects & coverage into matching testing_reports rows
    // so the employee's Testing Documents viewer picks up all changes via the JOIN
    try {
      const defectsJson = JSON.stringify(draft.defects_and_failures || []);
      const coverageJson = JSON.stringify(draft.test_scope_coverage || []);
      const blockersVal = draft.blockers_notes || null;
      const upTrRes = await pool.query(
        `UPDATE testing_reports
         SET defects_and_failures = $1::jsonb,
             test_scope_coverage  = $2::jsonb,
             blockers_notes       = COALESCE($3, blockers_notes),
             total_executed       = $4,
             passed               = $5,
             failed               = $6,
             blocked              = $7,
             pass_rate            = $8,
             final_verdict        = $9,
             report_status        = 'SUBMITTED',
             submitted_at         = CURRENT_TIMESTAMP
         WHERE id = $10
            OR module_id = $11
            OR LOWER(module_name) = LOWER($12)
         RETURNING id`,
        [
          defectsJson, coverageJson, blockersVal,
          draft.total_executed || 0, draft.passed || 0, draft.failed || 0, draft.blocked || 0,
          draft.pass_rate || 0, draft.final_verdict || 'PASSED',
          reportId, moduleId, moduleName
        ]
      );

      if (upTrRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO testing_reports (
            id, project_id, project_name, module_id, module_name,
            developer_employee_id, developer_employee_name,
            tester_employee_id, tester_employee_name,
            version, environment, total_test_cases, total_executed,
            passed_test_cases, passed, failed_test_cases, failed,
            blocked_test_cases, blocked, pass_rate, final_verdict,
            report_status, test_scope_coverage, defects_and_failures,
            blockers_notes, submitted_at, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $13, $13, $14, $14, $15, $15, $16, $17, 'SUBMITTED', $18::jsonb, $19::jsonb, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) ON CONFLICT (id) DO UPDATE SET
            defects_and_failures = EXCLUDED.defects_and_failures,
            test_scope_coverage = EXCLUDED.test_scope_coverage,
            blockers_notes = EXCLUDED.blockers_notes,
            report_status = 'SUBMITTED',
            updated_at = CURRENT_TIMESTAMP`,
          [
            reportId, draft.project_id || 'PRJ-001', draft.project_name || 'Attendance',
            moduleId, moduleName,
            draft.employee_id || 'EMP-005', 'Vishnu Vardhan',
            draft.tester_id || 'EMP-004', draft.tester_name || 'Rahul Verma',
            draft.version || '1.0', draft.environment || 'Pre-Production',
            draft.total_executed || 0, draft.passed || 0, draft.failed || 0, draft.blocked || 0,
            draft.pass_rate || 0, draft.final_verdict || 'PASSED',
            coverageJson, defectsJson, blockersVal
          ]
        );
      }
      console.log(`[TestReportsService] Synced ${(draft.defects_and_failures || []).length} defects into matching testing_reports rows.`);
    } catch (syncErr) {
      console.warn('[TestReportsService] Could not sync defects to testing_reports (continuing):', syncErr.message);
    }

    return submitRes.rows[0];
  }

  /**
   * POST /api/test-reports/:id/reopen
   */
  static async reopenReport(id, reason, user) {
    if (!this.isManager(user) && !this.isAdmin(user)) {
      const err = new Error('Access denied: Manager or Admin privileges required to reopen reports.');
      err.statusCode = 403;
      throw err;
    }

    const res = await pool.query(
      `UPDATE test_reports SET
        status = 'REOPENED',
        blockers_notes = CASE 
          WHEN blockers_notes IS NULL OR blockers_notes = '' THEN $2
          ELSE blockers_notes || E'\n[Reopen Note]: ' || $2
        END,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reason || `Reopened by ${user?.name || 'Manager'} for revisions.`]
    );

    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  /**
   * Helper: Get physical PDF path for a report
   */
  static async getPdfFilePath(id, user) {
    const report = await this.getReportById(id, user);
    if (!report) return null;

    if (report.final_pdf_path) {
      const fullPath = path.join(uploadsDir, '..', report.final_pdf_path.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) return fullPath;

      // Check directly in submitted directory
      const altPath = path.join(submittedDir, `report_${id}.pdf`);
      if (fs.existsSync(altPath)) return altPath;
    }

    // If PDF not yet generated on disk, generate dynamically
    const reportDataForPdf = {
      title: report.title || 'Software Test Report (1)',
      projectName: report.project_name || 'Attendance',
      moduleName: report.project_name === 'Attendance' ? 'Attendance & Biometric Kiosk' : report.project_name,
      testDate: report.test_date || new Date().toLocaleDateString('en-GB'),
      environment: report.environment || 'Pre-Production',
      version: report.version || '1.0',
      testerName: report.tester_name || 'Rahul Verma',
      developerName: 'Vishnu Vardhan',
      teamLead: report.team_lead || 'Sarah Jenkins',
      reportingManager: report.reporting_manager || 'Sarah Jenkins',
      totalExecuted: report.total_executed,
      passed: report.passed,
      failed: report.failed,
      blocked: report.blocked,
      passRate: report.pass_rate,
      finalVerdict: report.final_verdict,
      testScopeCoverage: report.test_scope_coverage,
      defectsAndFailures: report.defects_and_failures,
      blockersNotes: report.blockers_notes,
      preparedBy: report.prepared_by || report.tester_name,
      submittedAt: report.submitted_at || new Date().toISOString()
    };

    const pdfBuffer = await TestReportPdfService.generateReportPdf(reportDataForPdf);
    const targetFile = path.join(submittedDir, `report_${id}.pdf`);
    fs.writeFileSync(targetFile, pdfBuffer);
    return targetFile;
  }
}
