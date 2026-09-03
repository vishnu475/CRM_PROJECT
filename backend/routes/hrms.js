import express from 'express';
import { pool } from '../db/pool.js';
import { ESSService } from '../services/essService.js';

const router = express.Router();

async function logActivity(client_or_pool, { module, entity, entityId, action, oldValue, newValue, performedBy }) {
  await client_or_pool.query(
    `INSERT INTO activity_logs (module, entity, entity_id, action, old_value, new_value, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [module, entity, entityId, action, oldValue || null, newValue || null, performedBy || 'system']
  );
}

// GET /api/hrms/employees — Fetch HRMS employees from PostgreSQL with optional ?stage= filter
router.get('/employees', async (req, res) => {
  try {
    const { stage } = req.query;

    // 1. Auto-sync candidates in Recruitment 'Employee' stage into employees master
    await pool.query(`
      INSERT INTO employees (
        id, emp_code, name, email, phone, department, designation, joining_date, status, salary, basic_salary, allowances, reporting_manager_name
      )
      SELECT 
        COALESCE(c.employee_id, c.candidate_no, c.id),
        COALESCE(c.employee_id, c.candidate_no, c.id),
        c.name,
        CONCAT(LOWER(REPLACE(c.name, ' ', '.')), '.', LOWER(COALESCE(c.candidate_no, c.id)), '@company.com'),
        COALESCE(c.phone, '+91 98765 00000'),
        COALESCE(c.department, 'Engineering'),
        COALESCE(c.applied_position, c.job_title, 'Senior Software Engineer'),
        CURRENT_DATE,
        'Active',
        85000,
        51000,
        34000,
        COALESCE(c.recruiter, 'Sarah Jenkins')
      FROM job_candidates c
      WHERE (c.stage = 'Employee' OR c.stage = 'Hired' OR c.status = 'CONVERTED')
        AND NOT EXISTS (
          SELECT 1 FROM employees e 
          WHERE e.id = COALESCE(c.employee_id, c.candidate_no, c.id) 
             OR e.emp_code = COALESCE(c.employee_id, c.candidate_no, c.id)
        )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        designation = EXCLUDED.designation,
        reporting_manager_name = EXCLUDED.reporting_manager_name,
        status = 'Active'
    `);

    await pool.query(`
      INSERT INTO employee_onboarding (employee_id, current_stage, stage, joined_date)
      SELECT 
        COALESCE(c.employee_id, c.candidate_no, c.id),
        'JOINED',
        'Joined',
        CURRENT_DATE
      FROM job_candidates c
      WHERE (c.stage = 'Employee' OR c.stage = 'Hired' OR c.status = 'CONVERTED')
      ON CONFLICT (employee_id) DO NOTHING
    `);

    let queryStr = `
      SELECT e.id, e.emp_code, e.name, e.email, e.phone, e.dob, e.gender, e.address,
             e.department, e.designation, e.joining_date, e.status, e.salary,
             e.basic_salary, e.allowances, e.reporting_manager_id, e.reporting_manager_name,
             e.pan_number, e.uan_number, e.bank_account, e.ifsc_code, e.plain_pin,
             e.branch, e.employment_type, e.created_at,
             COALESCE(e.status, o.stage, o.current_stage, 'Joined') AS onboarding_stage,
             COALESCE(UPPER(e.status), o.current_stage, UPPER(o.stage), 'JOINED') AS current_stage
      FROM employees e
      LEFT JOIN employee_onboarding o ON (e.emp_code = o.employee_id OR e.id = o.employee_id)
    `;

    const params = [];
    if (stage) {
      queryStr += ` WHERE (LOWER(o.stage) = LOWER($1) OR LOWER(e.status) = LOWER($1) OR (LOWER($1) = 'joined' AND (LOWER(e.status) = 'active' OR LOWER(e.status) = 'joined')))`;
      params.push(stage);
    }
    queryStr += ` ORDER BY e.created_at DESC, e.emp_code ASC`;

    const result = await pool.query(queryStr, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/hrms/onboarding — Fetch onboarding pipeline stages from PostgreSQL
router.get('/onboarding', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, e.name as employee_name, e.department, e.designation, e.email, e.phone
      FROM employee_onboarding o
      JOIN employees e ON o.employee_id = e.emp_code OR o.employee_id = e.id
      ORDER BY o.updated_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/hrms/onboarding — Move employee onboarding stage
router.patch('/onboarding', async (req, res) => {
  const { employeeId, empCode, id, stage } = req.body;
  const targetId = employeeId || empCode || id;

  if (!targetId || !stage) {
    return res.status(400).json({ success: false, message: 'Employee ID and target stage are required.' });
  }

  const normalizedStage = stage.toUpperCase() === 'PROBATION' ? 'Probation' :
                          stage.toUpperCase() === 'CONFIRMED' ? 'Confirmed' :
                          stage.toUpperCase() === 'ACTIVE' ? 'Active' :
                          stage.toUpperCase() === 'TRANSFERRED' ? 'Transferred' :
                          stage.toUpperCase() === 'EXITED' ? 'Exited' : stage;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentRes = await client.query(
      `SELECT stage FROM employee_onboarding WHERE employee_id = $1 OR employee_id IN (SELECT emp_code FROM employees WHERE id = $1)`,
      [targetId]
    );
    const oldStage = currentRes.rows[0]?.stage || 'Joined';
    const currentStageUpper = normalizedStage.toUpperCase();

    await client.query(`
      INSERT INTO employee_onboarding (employee_id, current_stage, stage, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id) DO UPDATE
      SET current_stage = EXCLUDED.current_stage, stage = EXCLUDED.stage, updated_at = CURRENT_TIMESTAMP
    `, [targetId, currentStageUpper, normalizedStage]);

    await client.query(
      `UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR emp_code = $2`,
      [normalizedStage, targetId]
    );

    await logActivity(client, {
      module: 'hrms',
      entity: 'employee_onboarding',
      entityId: targetId,
      action: 'onboarding_stage_updated',
      oldValue: oldStage,
      newValue: normalizedStage,
      performedBy: 'HR Admin'
    });

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Employee ${targetId} onboarding stage updated to ${normalizedStage}`,
      data: { employeeId: targetId, stage: normalizedStage }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/hrms/transfers — Fetch department transfer history
router.get('/transfers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT th.*, e.name as employee_name 
      FROM employee_transfer_history th
      JOIN employees e ON th.employee_id = e.emp_code OR th.employee_id = e.id
      ORDER BY th.transfer_date DESC, th.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/hrms/notifications — Fetch Admin Notifications
router.get('/notifications', async (req, res) => {
  const { role } = req.query;
  try {
    const data = await ESSService.getAdminNotifications(role || 'All');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/hrms/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await ESSService.markAdminNotificationRead(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/hrms/employees/:employeeId/full-report — 100% Complete Dynamic Employee Report
router.get('/employees/:employeeId/full-report', async (req, res) => {
  const { employeeId } = req.params;
  try {
    const data = await ESSService.getFullEmployeeReport(employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/hrms/activity — Fetch Activity feed for specific employee
router.get('/activity', async (req, res) => {
  const { employeeId } = req.query;
  try {
    if (!employeeId) {
      const logs = await pool.query(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50`);
      return res.json({ success: true, data: logs.rows });
    }
    const data = await ESSService.getEmployeeActivityFeed(employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// ADMIN TWO-WAY APPROVAL ENDPOINTS
// ────────────────────────────────────────────────────────────

// POST /api/hrms/approvals/leave
router.post('/approvals/leave', async (req, res) => {
  const { requestId, status, reviewerName } = req.body;
  try {
    const updated = await pool.query(
      `UPDATE leave_requests SET status = $1, manager_name = $2 WHERE id = $3 RETURNING *`,
      [status, reviewerName || 'HR Admin', requestId]
    );
    if (updated.rows.length === 0) return res.status(404).json({ success: false, message: 'Leave request not found' });
    const reqItem = updated.rows[0];

    if (status.toUpperCase() === 'APPROVED') {
      await pool.query(
        `UPDATE leave_balances SET used = used + 1, available = GREATEST(0, available - 1) WHERE employee_id = $1`,
        [reqItem.employee_id]
      );
    }

    await ESSService.createNotification(
      reqItem.employee_id,
      `Leave Request ${status}`,
      `Your Leave Request (${reqItem.leave_type}) from ${reqItem.start_date} to ${reqItem.end_date} has been ${status.toLowerCase()}.`,
      '/employee/leave'
    );

    await ESSService.logAuditEvent({
      userId: reviewerName || 'HR Admin',
      employeeId: reqItem.employee_id,
      action: `LEAVE_${status.toUpperCase()}`,
      entity: 'leave_requests',
      entityId: requestId,
      afterState: { status }
    });

    res.json({ success: true, message: `Leave request ${status.toLowerCase()} successfully.`, data: reqItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/hrms/approvals/regularization
router.post('/approvals/regularization', async (req, res) => {
  const { requestId, status, reviewerName } = req.body;
  try {
    const updated = await pool.query(
      `UPDATE attendance_regularizations SET status = $1, reviewed_by = $2 WHERE id = $3 RETURNING *`,
      [status, reviewerName || 'Manager', requestId]
    );
    if (updated.rows.length === 0) return res.status(404).json({ success: false, message: 'Regularization request not found' });
    const reg = updated.rows[0];

    if (status.toUpperCase() === 'APPROVED') {
      const recId = `ATT-${reg.employee_id}-${reg.date}`;
      await pool.query(
        `INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out)
         VALUES ($1, $2, $3, 'Present', $4, $5)
         ON CONFLICT (id) DO UPDATE SET check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, status = 'Present'`,
        [recId, reg.employee_id, reg.date, reg.requested_check_in, reg.requested_check_out]
      );
    }

    await ESSService.createNotification(
      reg.employee_id,
      `Attendance Regularization ${status}`,
      `Your Attendance Regularization for ${reg.date} has been ${status.toLowerCase()}.`,
      '/employee/attendance'
    );

    res.json({ success: true, message: `Regularization ${status.toLowerCase()} successfully.`, data: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/hrms/expense-claims - Fetch All Employee Claims for Admin/Finance
router.get('/expense-claims', async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS vendor VARCHAR(150);
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(100);
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS receipt_url TEXT;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS claim_date DATE;
      ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS description TEXT;
    `).catch(() => {});

    const result = await pool.query(
      `SELECT * FROM expense_claims ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/hrms/approvals/expense
router.post('/approvals/expense', async (req, res) => {
  const { claimId, status, reviewerName } = req.body;
  try {
    const updated = await pool.query(
      `UPDATE expense_claims SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *`,
      [status, reviewerName || 'Finance Manager', claimId]
    );
    if (updated.rows.length === 0) return res.status(404).json({ success: false, message: 'Expense claim not found' });
    const exp = updated.rows[0];

    await ESSService.createNotification(
      exp.employee_id,
      `Expense Claim ${status}`,
      `Your Expense Claim of ₹${exp.amount} (${exp.category}) has been ${status.toLowerCase()}.`,
      '/employee/expenses'
    );

    res.json({ success: true, message: `Expense claim ${status.toLowerCase()} successfully.`, data: exp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/hrms/approvals/transfer
router.post('/approvals/transfer', async (req, res) => {
  const { requestId, status, reviewerComments } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const trRes = await client.query(`SELECT * FROM transfer_requests WHERE id = $1`, [requestId]);
    if (trRes.rows.length === 0) throw new Error('Transfer request not found');
    const tr = trRes.rows[0];

    await client.query(
      `UPDATE transfer_requests 
       SET status = $1, hr_approval = $1, comments = $2, reviewed_by = 'HR Admin', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [status, reviewerComments || 'Approved by HR', requestId]
    );

    // CRITICAL REQUIREMENT: Only update Employee Master after final HR approval!
    if (status.toUpperCase() === 'APPROVED' || status.toUpperCase() === 'CONFIRMED') {
      await client.query(
        `UPDATE employees 
         SET department = $1, branch = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE emp_code = $3 OR id = $3`,
        [tr.requested_department, tr.requested_branch, tr.employee_id]
      );

      await client.query(
        `INSERT INTO employee_transfer_history (id, employee_id, old_department, new_department, old_branch, new_branch, transfer_date, reason)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
         ON CONFLICT (id) DO NOTHING`,
        [`TH-${Date.now()}`, tr.employee_id, tr.current_department, tr.requested_department, tr.current_branch, tr.requested_branch, tr.reason]
      );
    }

    await ESSService.createNotification(
      tr.employee_id,
      `Transfer Request ${status}`,
      `Your Transfer Request to ${tr.requested_department} has been ${status.toLowerCase()}.`,
      '/employee/transfers'
    );

    await ESSService.logAuditEvent({
      userId: 'HR Admin',
      employeeId: tr.employee_id,
      action: `TRANSFER_REQUEST_${status.toUpperCase()}`,
      entity: 'transfer_requests',
      entityId: requestId,
      afterState: { status, department: tr.requested_department }
    });

    await client.query('COMMIT');
    res.json({ success: true, message: `Transfer request ${status.toLowerCase()} successfully.` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

import { TaskService } from '../services/taskService.js';

// POST /api/hrms/tasks/assign - Assign new task to employee and save to database
router.post('/tasks/assign', async (req, res) => {
  const { employeeId, assignedTo, title, description, instructions, priority, dueDate, project, projectName, assignedBy, department, category, checklist } = req.body;
  try {
    const creatorName = assignedBy || req.user?.name || req.headers['x-user-name'] || 'HR Admin';
    const result = await TaskService.createTask({
      assignedTo: employeeId || assignedTo,
      title,
      description: description || instructions || '',
      instructions: instructions || '',
      priority: priority || 'MEDIUM',
      dueDate,
      projectName: project || projectName || 'ERP Operations',
      assignedBy: creatorName,
      department,
      category: category || 'General Operations',
      checklist
    }, { name: creatorName, id: req.user?.id || 'ADM-001', role: 'Admin' });
    res.status(201).json({ success: true, message: 'Task assigned and saved to database successfully.', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

