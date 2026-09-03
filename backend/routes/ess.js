import express from 'express';
import { ESSService } from '../services/essService.js';
import { PayrollService } from '../services/payrollService.js';

const router = express.Router();

/**
 * Middleware: Derive Authenticated Employee Identity
 * Never trusts raw unverified employee ID from client query.
 */
function resolveAuthEmployee(req, res, next) {
  const tokenEmpId = req.user?.empCode || req.user?.id;
  const headerEmpId = req.headers['x-employee-id'];
  const authenticatedEmpId = headerEmpId || tokenEmpId || 'EMP-001';

  // DEV-TOOLS OVERRIDE DEFENSE:
  // If client passes ?employee_id=EMP002 or ?empCode=EMP002 that differs from authenticated identity, block with 403 Forbidden!
  const attemptedEmpId = req.query.employee_id || req.query.empCode;
  if (attemptedEmpId && attemptedEmpId !== authenticatedEmpId) {
    return res.status(403).json({
      success: false,
      message: 'HTTP 403 Forbidden: Cross-employee data access is strictly prohibited.'
    });
  }

  req.employeeId = authenticatedEmpId;
  next();
}

router.use(resolveAuthEmployee);

// GET /api/v1/employee/me/dashboard
router.get('/me/dashboard', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeDashboard(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/employee/me/profile
router.get('/me/profile', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeProfile(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/employee/me/profile
router.put('/me/profile', async (req, res) => {
  try {
    const data = await ESSService.updateEmployeeProfile(req.employeeId, req.body);
    res.json({ success: true, message: 'Profile updated successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/attendance
router.get('/me/attendance', async (req, res) => {
  const { month, year } = req.query;
  try {
    const data = await ESSService.getEmployeeAttendance(req.employeeId, month, year);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/check-in', async (req, res) => {
  try {
    const result = await ESSService.markCheckIn(req.employeeId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/me/check-out', async (req, res) => {
  try {
    const result = await ESSService.markCheckOut(req.employeeId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/me/regularize', async (req, res) => {
  try {
    const result = await ESSService.submitRegularization(req.employeeId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/leave
router.get('/me/leave', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeLeaves(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/leave', async (req, res) => {
  try {
    const result = await ESSService.submitLeaveRequest(req.employeeId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/employee/me/payroll & /payslips
router.get('/me/payroll', async (req, res) => {
  try {
    const data = await ESSService.getEmployeePayroll(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me/payslips', async (req, res) => {
  try {
    const data = await ESSService.getEmployeePayroll(req.employeeId);
    res.json({ success: true, data: data.payslips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me/payslips/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const htmlContent = await PayrollService.generatePayslipPDF(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/expenses
router.get('/me/expenses', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeExpenses(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/expenses', async (req, res) => {
  try {
    const result = await ESSService.submitExpenseClaim(req.employeeId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/employee/me/loans
router.get('/me/loans', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeLoans(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/performance
router.get('/me/performance', async (req, res) => {
  try {
    const data = await ESSService.getEmployeePerformance(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/performance/self-review', async (req, res) => {
  try {
    const result = await ESSService.submitSelfReview(req.employeeId, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/internal-jobs
router.get('/me/internal-jobs', async (req, res) => {
  try {
    const data = await ESSService.getInternalJobs(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/internal-jobs/:id/apply', async (req, res) => {
  const { id } = req.params;
  const { coverLetter } = req.body;
  try {
    const result = await ESSService.applyInternalJob(req.employeeId, id, coverLetter);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/transfers
router.get('/me/transfers', async (req, res) => {
  try {
    const data = await ESSService.getTransferRequests(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/transfers', async (req, res) => {
  try {
    const result = await ESSService.submitTransferRequest(req.employeeId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/employee/me/documents
router.get('/me/documents', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeDocuments(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/timesheets
router.get('/me/timesheets', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeTimesheets(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/timesheets', async (req, res) => {
  try {
    const result = await ESSService.submitTimesheet(req.employeeId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

import { TaskService } from '../services/taskService.js';
import { pool } from '../db/pool.js';

// GET & POST /api/v1/employee/me/tasks
router.get('/me/tasks', async (req, res) => {
  try {
    const tasks = await TaskService.getAllTasks({ employeeId: req.employeeId }, { isEmployeeOnly: true, empCode: req.employeeId });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/tasks/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, progressPercent } = req.body;
  try {
    const updated = await TaskService.updateProgress(id, req.employeeId, {
      status,
      progressPercent: progressPercent !== undefined ? Number(progressPercent) : undefined
    });
    res.json({ success: true, message: 'Task status updated.', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/me/tasks', async (req, res) => {
  try {
    const emp = await TaskService.resolveEmployee(req.employeeId).catch(() => ({ name: 'Employee', emp_code: req.employeeId }));
    const result = await TaskService.createTask({
      ...req.body,
      assignedTo: req.body.assignedTo || req.employeeId
    }, { id: req.employeeId, empCode: req.employeeId, name: emp.name || 'Employee', role: 'Employee' });
    res.status(201).json({ success: true, message: 'Task created and saved to database.', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/me/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET & POST /api/v1/employee/me/hr-requests
router.get('/me/hr-requests', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeHRRequests(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/me/hr-requests', async (req, res) => {
  try {
    const result = await ESSService.submitHRRequest(req.employeeId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/employee/me/activity-feed
router.get('/me/activity-feed', async (req, res) => {
  try {
    const data = await ESSService.getEmployeeActivityFeed(req.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
