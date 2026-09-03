import express from 'express';
import { PayrollService } from '../services/payrollService.js';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

const router = express.Router();

// GET /api/payroll/runs — Fetch all payroll runs history
router.get('/runs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payroll_runs ORDER BY year DESC, month DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/runs — Create new Payroll Run
router.post('/runs', async (req, res) => {
  const { month, year, companyId, branchId, createdBy } = req.body;
  try {
    const result = await PayrollService.createPayrollRun({ month, year, companyId, branchId, createdBy });
    if (!result.success) return res.status(409).json(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/runs/:id/calculate — Execute Backend Calculation Engine
router.post('/runs/:id/calculate', async (req, res) => {
  const { id } = req.params;
  const { processedBy = 'HR Admin', skipAttendanceLockCheck = false } = req.body;
  try {
    const result = await PayrollService.calculatePayrollRun(id, processedBy, skipAttendanceLockCheck);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/runs/:id/approve — Approve Payroll Run
router.post('/runs/:id/approve', async (req, res) => {
  const { id } = req.params;
  const approvedBy = req.body.approvedBy || 'HR Director';
  try {
    const result = await PayrollService.approvePayrollRun(id, approvedBy);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/runs/:id/lock — Lock Payroll Run
router.post('/runs/:id/lock', async (req, res) => {
  const { id } = req.params;
  const lockedBy = req.body.lockedBy || 'Finance Controller';
  try {
    const result = await PayrollService.lockPayrollRun(id, lockedBy);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TWO-STAGE ACCOUNTING — EVENT 1: POST PAYROLL ACCRUAL TO GL
router.post('/accrual-gl', async (req, res) => {
  const { month, year, postedBy = 'Accounts Manager' } = req.body;
  try {
    const result = await PayrollService.postPayrollAccrual(month, year, postedBy);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TWO-STAGE ACCOUNTING — EVENT 2: PROCESS SALARY PAYMENT TO BANK GL
router.post('/payment-gl', async (req, res) => {
  const { month, year, paidBy = 'Finance Lead' } = req.body;
  try {
    const result = await PayrollService.processSalaryPayment(month, year, paidBy);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/runs/:id/bank-advice — Generate Bank Disbursal Batch
router.post('/runs/:id/bank-advice', async (req, res) => {
  const { id } = req.params;
  const generatedBy = req.body.generatedBy || 'Finance Manager';
  try {
    const result = await PayrollService.generateBankAdvice(id, generatedBy);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/run — Legacy compatibility for running payroll
router.post('/run', async (req, res) => {
  const { month, year, skipAttendanceLockCheck = false } = req.body;
  const processedBy = req.body.processedBy || 'HR Admin';
  try {
    let runRes = await pool.query('SELECT * FROM payroll_runs WHERE month = $1 AND year = $2', [month, year]);
    let runId;
    if (runRes.rows.length === 0) {
      const createRes = await PayrollService.createPayrollRun({ month, year, createdBy: processedBy });
      if (!createRes.success) return res.status(400).json(createRes);
      runId = createRes.data.id;
    } else {
      runId = runRes.rows[0].id;
    }
    const calcRes = await PayrollService.calculatePayrollRun(runId, processedBy, skipAttendanceLockCheck);
    res.status(201).json(calcRes);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ONE-CLICK SALARY PAYMENT — SINGLE EMPLOYEE
router.post('/employees/:employeeId/pay', async (req, res) => {
  const { employeeId } = req.params;
  const { month, year, processedBy = 'Finance Lead', idempotencyKey } = req.body;
  try {
    const result = await PayrollService.payEmployeeSalary({
      employeeId,
      month: Number(month) || (new Date().getMonth() + 1),
      year: Number(year) || new Date().getFullYear(),
      processedBy,
      idempotencyKey
    });
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/pay-salary', async (req, res) => {
  const { employeeId, month, year, processedBy = 'Finance Lead', idempotencyKey } = req.body;
  try {
    const result = await PayrollService.payEmployeeSalary({
      employeeId,
      month: Number(month) || (new Date().getMonth() + 1),
      year: Number(year) || new Date().getFullYear(),
      processedBy,
      idempotencyKey
    });
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ONE-CLICK BATCH SALARY PAYMENT — ALL ELIGIBLE EMPLOYEES
router.post('/pay-all', async (req, res) => {
  const { month, year, processedBy = 'Finance Lead' } = req.body;
  try {
    const result = await PayrollService.payAllEmployeesSalary({
      month: Number(month) || (new Date().getMonth() + 1),
      year: Number(year) || new Date().getFullYear(),
      processedBy
    });
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/payments — Fetch payment transactions
router.get('/payments', async (req, res) => {
  const { employeeId, month, year, payrollRunId } = req.query;
  try {
    let query = 'SELECT * FROM payment_transactions WHERE 1=1';
    const params = [];
    if (employeeId) { params.push(employeeId); query += ` AND employee_id = $${params.length}`; }
    if (month) { params.push(Number(month)); query += ` AND month = $${params.length}`; }
    if (year) { params.push(Number(year)); query += ` AND year = $${params.length}`; }
    if (payrollRunId) { params.push(payrollRunId); query += ` AND payroll_run_id = $${params.length}`; }
    query += ' ORDER BY processed_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/confirmed-summary — Pre-calculated confirmed payroll register
router.get('/confirmed-summary', async (req, res) => {
  const { month, year } = req.query;
  try {
    const summary = await PayrollService.getConfirmedPayrollSummary(month, year);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/payslips — Fetch all payslips
router.get('/payslips', async (req, res) => {
  const { employeeId, month, year, runId } = req.query;
  try {
    let query = `SELECT ps.*, pr.run_code FROM payslips ps JOIN payroll_runs pr ON ps.payroll_run_id = pr.id WHERE 1=1`;
    const params = [];
    if (employeeId) { params.push(employeeId); query += ` AND (ps.employee_id = $${params.length})`; }
    if (month) { params.push(month); query += ` AND ps.month = $${params.length}`; }
    if (year) { params.push(year); query += ` AND ps.year = $${params.length}`; }
    if (runId) { params.push(runId); query += ` AND ps.payroll_run_id = $${params.length}`; }
    query += ' ORDER BY ps.year DESC, ps.month DESC, ps.employee_name';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/payslip/:id — Fetch single payslip
router.get('/payslip/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const payslip = await PayrollService.getPayslipById(id);
    res.json({ success: true, data: payslip });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/payslip/:id/pdf — Download Server-Side HTML/PDF Payslip Document
router.get('/payslip/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const htmlContent = await PayrollService.generatePayslipPDF(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/post-to-accounts — Backward compatible GL Posting
router.post('/post-to-accounts', async (req, res) => {
  const { month, year, postedBy } = req.body;
  try {
    const result = await PayrollService.postPayrollToAccounts(month, year, postedBy);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET & POST /api/payroll/attendance-lock
router.get('/attendance-lock', async (req, res) => {
  const { month = 8, year = 2026 } = req.query;
  try {
    const result = await PayrollService.checkAttendanceLock(Number(month), Number(year));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/attendance-lock', async (req, res) => {
  const { month = 8, year = 2026, status = 'LOCKED', lockedBy = 'HR Admin' } = req.body;
  try {
    const lockId = `LOCK-${year}-${String(month).padStart(2, '0')}`;
    const result = await pool.query(`
      INSERT INTO attendance_locks (id, month, year, status, locked_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (month, year) DO UPDATE SET status = EXCLUDED.status, locked_by = EXCLUDED.locked_by
      RETURNING *
    `, [lockId, month, year, status, lockedBy]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/structures & POST /api/payroll/structures
router.get('/structures', async (req, res) => {
  try {
    const data = await PayrollService.getSalaryStructures();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/structures', async (req, res) => {
  try {
    const data = await PayrollService.saveSalaryStructure(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/statutory-rules
router.get('/statutory-rules', async (req, res) => {
  try {
    const data = await PayrollService.getStatutoryRules();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/full-and-final & GET /api/payroll/full-and-final
router.get('/full-and-final', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM full_and_final_settlements ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/full-and-final', async (req, res) => {
  try {
    const result = await PayrollService.processFullAndFinalSettlement(req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
