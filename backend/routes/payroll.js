import express from 'express';
import { PayrollService } from '../services/payrollService.js';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

const router = express.Router();

// POST /api/payroll/run — Execute Monthly Payroll Run
router.post('/run', async (req, res) => {
  const { month, year } = req.body;
  const processedBy = req.body.processedBy || 'HR Admin';
  try {
    const result = await PayrollService.runPayroll(month, year, processedBy);
    if (!result.success) return res.status(409).json(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/runs — Fetch all payroll run history
router.get('/runs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payroll_runs ORDER BY year DESC, month DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/payslips — Fetch all payslips (optionally filtered)
router.get('/payslips', async (req, res) => {
  const { employeeId, month, year, runId } = req.query;
  try {
    let query = `SELECT ps.*, pr.run_code FROM payslips ps JOIN payroll_runs pr ON ps.payroll_run_id = pr.id WHERE 1=1`;
    const params = [];
    if (employeeId) { params.push(employeeId); query += ` AND ps.employee_id = $${params.length}`; }
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

// GET /api/payroll/payslip/:id — Fetch single payslip by ID
router.get('/payslip/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const payslip = await PayrollService.getPayslipById(id);
    res.json({ success: true, data: payslip });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// GET /api/payroll/confirmed-summary — Dynamic AI pre-calculated payroll for confirmed employees
router.get('/confirmed-summary', async (req, res) => {
  try {
    const summary = await PayrollService.getConfirmedPayrollSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payroll/post-to-accounts — Post monthly payroll run to Accounts GL
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

export default router;
