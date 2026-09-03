import express from 'express';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

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
             COALESCE(o.stage, o.current_stage, e.status, 'Joined') AS onboarding_stage,
             COALESCE(o.current_stage, UPPER(o.stage), 'JOINED') AS current_stage
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

// PATCH /api/hrms/onboarding — Move employee onboarding stage (Joined -> Probation -> Confirmed -> Active -> Transferred -> Exited)
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

    // Fetch current onboarding state
    const currentRes = await client.query(
      `SELECT stage FROM employee_onboarding WHERE employee_id = $1 OR employee_id IN (SELECT emp_code FROM employees WHERE id = $1)`,
      [targetId]
    );
    const oldStage = currentRes.rows[0]?.stage || 'Joined';

    const currentStageUpper = normalizedStage.toUpperCase();

    // Upsert employee_onboarding
    await client.query(`
      INSERT INTO employee_onboarding (employee_id, current_stage, stage, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id) DO UPDATE
      SET current_stage = EXCLUDED.current_stage, stage = EXCLUDED.stage, updated_at = CURRENT_TIMESTAMP
    `, [targetId, currentStageUpper, normalizedStage]);

    // Update employees master status
    await client.query(
      `UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR emp_code = $2`,
      [normalizedStage, targetId]
    );

    // Audit log entry
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

export default router;
