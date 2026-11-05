import express from 'express';
import { TestingService } from '../services/testingService.js';

const router = express.Router();

function getAuthUser(req) {
  const tokenEmpId = req.user?.empCode || req.user?.id;
  const headerEmpId = req.headers['x-employee-id'];
  const queryEmpId = req.query.employeeId || req.query.employee_id;
  const empId = headerEmpId || tokenEmpId || queryEmpId || 'ADM-001';

  const role = req.user?.role || req.headers['x-user-role'] || (headerEmpId ? 'Employee' : 'Admin');
  return {
    id: empId,
    empCode: empId,
    name: req.user?.name || req.headers['x-user-name'] || 'User',
    role: role,
    isEmployeeOnly: role === 'Employee' || role === 'EMPLOYEE'
  };
}

// =========================================================================
// PROJECT-CENTRIC QUALITY GATE ENDPOINTS
// =========================================================================

// 0A. GET /api/testing/projects-hub — Main Project-Centric Quality Gate View
router.get('/projects-hub', async (req, res) => {
  try {
    const hub = await TestingService.getProjectCentricTestingHub();
    res.json({ success: true, count: hub.length, data: hub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 0B. GET /api/testing/workspace/:projectId/:employeeId/:moduleId — Deep workspace
router.get('/workspace/:projectId/:employeeId/:moduleId', async (req, res) => {
  try {
    const { projectId, employeeId, moduleId } = req.params;
    const workspace = await TestingService.getProjectEmployeeModuleWorkspace(projectId, employeeId, moduleId);
    res.json({ success: true, data: workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 0C. PATCH /api/testing/requests/:id/url — Update Testing URL & Environment
router.patch('/requests/:id/url', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const updated = await TestingService.updateTestingUrlAndEnv(req.params.id, req.body, user);
    res.json({ success: true, message: 'Testing URL & environment updated.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 0D. POST /api/testing/reports/submit — Submit Testing Report & save Document
router.post('/reports/submit', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const result = await TestingService.submitTestingReport(req.body, user);
    res.status(201).json({ success: true, message: 'Testing report submitted successfully.', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 0E. GET /api/testing/documents — Unified Testing Documents (Project, Employee, Admin)
router.get('/documents', async (req, res) => {
  try {
    const docs = await TestingService.getTestingDocuments(req.query);
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 0F. POST /api/testing/reports/:id/review — Admin Review (APPROVE / REOPEN)
router.post('/reports/:id/review', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const result = await TestingService.reviewTestingReport(req.params.id, req.body, user);
    res.json({ success: true, message: `Report ${result.status} successfully.`, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 1. GET /api/testing/modules — All modules with task completion, testing status & bug metrics
router.get('/modules', async (req, res) => {
  try {
    const modules = await TestingService.getModulesOverview();
    res.json({ success: true, count: modules.length, data: modules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET /api/testing/modules/ready — Modules >= 70% completion (Testing Queue)
router.get('/modules/ready', async (req, res) => {
  try {
    const queue = await TestingService.getTestingQueue();
    res.json({ success: true, count: queue.length, data: queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. POST /api/testing/requests — Manually or programmatically trigger testing request
router.post('/requests', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { moduleId, moduleName, employeeId, progress } = req.body;
    const request = await TestingService.checkAndTriggerModuleTesting(moduleId || moduleName, employeeId || user.empCode, progress);
    if (!request) {
      return res.status(400).json({ success: false, message: 'Could not create testing request. Ensure module exists and has assigned tasks.' });
    }
    res.status(201).json({ success: true, message: 'Testing request created/updated.', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/testing/requests — List all testing requests
router.get('/requests', async (req, res) => {
  try {
    const queue = await TestingService.getTestingQueue();
    res.json({ success: true, count: queue.length, data: queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. GET /api/testing/requests/:id
router.get('/requests/:id', async (req, res) => {
  try {
    const queue = await TestingService.getTestingQueue();
    const item = queue.find(q => q.testing_request_id === req.params.id || q.module_id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: `Testing request ${req.params.id} not found.` });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. PATCH /api/testing/requests/:id/assign-tester — Assign tester
router.patch('/requests/:id/assign-tester', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { testerId, testerName } = req.body;
    if (!testerId && !testerName) {
      return res.status(400).json({ success: false, message: 'Tester ID or Name is required.' });
    }
    const updated = await TestingService.assignTester(req.params.id, { testerId, testerName }, user);
    res.json({ success: true, message: 'Tester assigned successfully.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. PATCH /api/testing/requests/:id/status — Update status (Enforces gatekeeping rule)
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { status, comments } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }
    const updated = await TestingService.updateTestingStatus(req.params.id, status, user, comments);
    res.json({ success: true, message: `Testing status updated to ${status}.`, data: updated });
  } catch (err) {
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

// 8. POST /api/testing/test-cases — Create Test Case
router.post('/test-cases', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const tc = await TestingService.createTestCase(req.body, user);
    res.status(201).json({ success: true, message: 'Test case created successfully.', data: tc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. GET /api/testing/test-cases/:moduleId (also supports query or params)
router.get('/test-cases/:moduleId', async (req, res) => {
  try {
    const cases = await TestingService.getTestCases(req.params.moduleId);
    res.json({ success: true, count: cases.length, data: cases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/test-cases', async (req, res) => {
  try {
    const moduleId = req.query.moduleId || req.query.module_id;
    if (!moduleId) {
      return res.status(400).json({ success: false, message: 'Module ID is required.' });
    }
    const cases = await TestingService.getTestCases(moduleId);
    res.json({ success: true, count: cases.length, data: cases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. PATCH /api/testing/test-cases/:id — Execute / Update Test Case
router.patch('/test-cases/:id', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const updated = await TestingService.updateTestCase(req.params.id, req.body, user);
    res.json({ success: true, message: 'Test case updated successfully.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 11. POST /api/testing/bugs — Report Bug
router.post('/bugs', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const bug = await TestingService.createBug(req.body, user);
    res.status(201).json({ success: true, message: 'Bug reported successfully.', data: bug });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 12. GET /api/testing/bugs — List Bugs with filters
router.get('/bugs', async (req, res) => {
  try {
    const bugs = await TestingService.getAllBugs(req.query);
    res.json({ success: true, count: bugs.length, data: bugs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 13. GET /api/testing/bugs/:id — Bug details with comments & history
router.get('/bugs/:id', async (req, res) => {
  try {
    const bug = await TestingService.getBugById(req.params.id);
    res.json({ success: true, data: bug });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// 14. PATCH /api/testing/bugs/:id — Developer Fix Bug or update status
router.patch('/bugs/:id', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const updated = await TestingService.updateBug(req.params.id, req.body, user);
    res.json({ success: true, message: 'Bug updated successfully.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 15. POST /api/testing/bugs/:id/comments — Add comment to bug
router.post('/bugs/:id/comments', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const comment = await TestingService.addBugComment(req.params.id, req.body, user);
    res.status(201).json({ success: true, message: 'Comment added.', data: comment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 16. POST /api/testing/bugs/:id/retest — Retest Bug (PASS -> CLOSED, FAIL -> REOPENED)
router.post('/bugs/:id/retest', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { outcome, retestNotes } = req.body;
    if (!outcome) {
      return res.status(400).json({ success: false, message: 'Retest outcome (PASS / FAIL) is required.' });
    }
    const updated = await TestingService.retestBug(req.params.id, { outcome, retestNotes }, user);
    res.json({ success: true, message: `Bug retest complete: ${updated.status}.`, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 17. GET /api/testing/reports/:moduleId — Get comprehensive Testing Report
router.get('/reports/:moduleId', async (req, res) => {
  try {
    const report = await TestingService.getTestingReport(req.params.moduleId);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 18. POST /api/testing/reports/:moduleId/generate — Generate snapshot Testing Report
router.post('/reports/:moduleId/generate', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const report = await TestingService.generateTestingReport(req.params.moduleId, user);
    res.status(201).json({ success: true, message: 'Testing report generated successfully.', data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 19. GET /api/testing/dashboard — Admin Overview Dashboard KPIs & Charts
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await TestingService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 20. GET /api/testing/audit-logs — Complete QA Audit Trail
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await TestingService.getAuditLogs(req.query);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 21. GET & PATCH /api/testing/notifications
router.get('/notifications', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const notifs = await TestingService.getNotifications(user.empCode, user.role);
    res.json({ success: true, count: notifs.length, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await TestingService.markNotificationRead(req.params.id);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 22. GET /api/testing/my-assignments — Current user's QA assignments (as Developer or Tester)
router.get('/my-assignments', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const empId = user.empCode;

    // As developer: Bugs assigned to fix
    const devBugs = await TestingService.getAllBugs({ developerId: empId });
    // As tester: Testing requests assigned to test
    const allQueue = await TestingService.getTestingQueue();
    const testerQueue = allQueue.filter(q => q.tester_employee_id === empId);

    res.json({
      success: true,
      data: {
        asDeveloper: {
          openBugs: devBugs.filter(b => !['CLOSED', 'WONT_FIX', 'DUPLICATE'].includes(b.status)),
          allBugs: devBugs
        },
        asTester: {
          modulesToTest: testerQueue
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
