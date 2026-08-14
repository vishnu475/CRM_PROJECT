import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

async function logActivity(client_or_pool, { module, entity, entityId, action, oldValue, newValue, performedBy }) {
  await client_or_pool.query(
    `INSERT INTO activity_logs (module, entity, entity_id, action, old_value, new_value, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [module, entity, entityId, action, oldValue || null, newValue || null, performedBy || 'system']
  );
}

// GET /api/employees — Fetch all HRMS employees from PostgreSQL
router.get('/', async (req, res) => {
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

    // 2. Query employees joined with employee_onboarding
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

// GET /api/employees/:id — Fetch single employee
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1 OR emp_code = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/employees — Add new employee (DB transaction + activity log)
router.post('/', async (req, res) => {
  const { name, email, phone, department, designation, joiningDate, salary, basicSalary, allowances,
          pin, panNumber, uanNumber, bankAccount, ifscCode, reportingManagerId, reportingManagerName,
          status, branch, employmentType } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get next employee code from sequence
    const seqRes = await client.query(
      `UPDATE number_sequences SET current_value = current_value + 1 WHERE id = 'seq-emp' RETURNING current_value, prefix`
    );
    const nextVal = seqRes.rows[0]?.current_value || Math.floor(Math.random() * 900) + 100;
    const prefix = seqRes.rows[0]?.prefix || 'EMP';
    const empCode = `${prefix}-${String(nextVal).padStart(3, '0')}`;

    const result = await client.query(`
      INSERT INTO employees 
        (id, emp_code, name, email, phone, department, designation, joining_date,
         status, salary, basic_salary, allowances, reporting_manager_id, reporting_manager_name,
         pan_number, uan_number, bank_account, ifsc_code, plain_pin, branch, employment_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `, [
      empCode, empCode, name, email, phone || null, department, designation,
      joiningDate || new Date().toISOString().split('T')[0],
      status || 'Joined',
      salary || 50000,
      basicSalary || Math.round((salary || 50000) * 0.6),
      allowances || Math.round((salary || 50000) * 0.4),
      reportingManagerId || 'EMP-001',
      reportingManagerName || 'Sarah Jenkins',
      panNumber || null, uanNumber || null, bankAccount || null, ifscCode || null,
      pin || '1234',
      branch || null,
      employmentType || 'Full-time'
    ]);

    // Insert into employee_onboarding pipeline table
    await client.query(`
      INSERT INTO employee_onboarding (employee_id, current_stage, stage, joined_date)
      VALUES ($1, 'JOINED', 'Joined', CURRENT_DATE)
      ON CONFLICT (employee_id) DO UPDATE SET current_stage = 'JOINED', stage = 'Joined', updated_at = CURRENT_TIMESTAMP
    `, [empCode]);

    // Auto-create leave balances for new employee
    const currentYear = new Date().getFullYear();
    await client.query(`
      INSERT INTO leave_balances (employee_id, leave_type_name, year, total_allocated, used, pending, available)
      VALUES
        ($1, 'Casual Leave', $2, 12, 0, 0, 12),
        ($1, 'Sick Leave', $2, 10, 0, 0, 10),
        ($1, 'Privilege Leave', $2, 15, 0, 0, 15)
      ON CONFLICT (employee_id, leave_type_name, year) DO NOTHING
    `, [empCode, currentYear]);

    // Assign default shift roster
    await client.query(`
      INSERT INTO shift_rosters (employee_id, shift_id, effective_from)
      VALUES ($1, 'SHF-GEN', CURRENT_DATE)
      ON CONFLICT DO NOTHING
    `, [empCode]);

    // Activity log
    await logActivity(client, {
      module: 'hrms', entity: 'employee', entityId: empCode,
      action: 'employee_created', newValue: `${name} | ${department} | ${designation}`,
      performedBy: reportingManagerName || 'HR Admin'
    });

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] || { id: empCode, emp_code: empCode, name } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/employees/:id — Update employee fields
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get old employee for activity log
    const oldEmp = await client.query('SELECT * FROM employees WHERE id = $1 OR emp_code = $1', [id]);
    const old = oldEmp.rows[0] || {};

    const colMap = {
      empCode: 'emp_code', joiningDate: 'joining_date', basicSalary: 'basic_salary',
      reportingManagerId: 'reporting_manager_id', reportingManagerName: 'reporting_manager_name',
      panNumber: 'pan_number', uanNumber: 'uan_number', bankAccount: 'bank_account',
      ifscCode: 'ifsc_code', employmentType: 'employment_type'
    };

    const updates = [];
    const values = [];
    let idx = 1;
    for (const [key, val] of Object.entries(fields)) {
      const col = colMap[key] || key;
      updates.push(`${col} = $${idx}`);
      values.push(val);
      idx++;
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const result = await client.query(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = $${idx} OR emp_code = $${idx} RETURNING *`,
      values
    );

    if (fields.status) {
      await client.query(`
        INSERT INTO employee_onboarding (employee_id, stage, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (employee_id) DO UPDATE SET stage = EXCLUDED.stage, updated_at = CURRENT_TIMESTAMP
      `, [id, fields.status]);
    }

    await logActivity(client, {
      module: 'hrms', entity: 'employee', entityId: id,
      action: 'employee_updated',
      oldValue: JSON.stringify({ status: old.status, department: old.department }),
      newValue: JSON.stringify(fields),
      performedBy: 'HR Admin'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/employees/:id/transfer — Department Transfer (SQL Transaction)
router.post('/:id/transfer', async (req, res) => {
  const { id } = req.params;
  const { newDepartment, newDesignation, newManagerName, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldEmp = await client.query('SELECT * FROM employees WHERE id = $1 OR emp_code = $1', [id]);
    const old = oldEmp.rows[0];

    const result = await client.query(`
      UPDATE employees 
      SET department = $1, designation = COALESCE($2, designation), 
          reporting_manager_name = COALESCE($3, reporting_manager_name), 
          status = 'Transferred', updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 OR emp_code = $4 RETURNING *
    `, [newDepartment, newDesignation, newManagerName, id]);

    // Insert into employee_onboarding
    await client.query(`
      INSERT INTO employee_onboarding (employee_id, stage, updated_at)
      VALUES ($1, 'Transferred', CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id) DO UPDATE SET stage = 'Transferred', updated_at = CURRENT_TIMESTAMP
    `, [old?.emp_code || old?.id || id]);

    // Insert into employee_transfer_history
    await client.query(`
      INSERT INTO employee_transfer_history (employee_id, old_department, new_department, old_designation, new_designation, old_reporting_manager, new_reporting_manager, reason, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'HR Admin')
    `, [old?.emp_code || old?.id || id, old?.department, newDepartment, old?.designation, newDesignation || old?.designation, old?.reporting_manager_name, newManagerName || old?.reporting_manager_name, reason]);

    // Insert into employee_history
    await client.query(`
      INSERT INTO employee_history (employee_id, change_type, old_department, new_department, old_designation, new_designation, reason, changed_by)
      VALUES ($1, 'Transfer', $2, $3, $4, $5, $6, $7)
    `, [old?.emp_code || old?.id || id, old?.department, newDepartment, old?.designation, newDesignation || old?.designation, reason, 'HR Admin']);

    await logActivity(client, {
      module: 'hrms', entity: 'employee', entityId: id,
      action: 'department_transfer',
      oldValue: old?.department,
      newValue: newDepartment,
      performedBy: 'HR Admin'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/employees/:id/confirm — Confirm from Probation
router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE employees SET status = 'Confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 OR emp_code = $1 RETURNING *`, [id]
    );
    await logActivity(client, { module: 'hrms', entity: 'employee', entityId: id, action: 'probation_confirmed', oldValue: 'Probation', newValue: 'Confirmed', performedBy: 'HR Admin' });
    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/employees/:id/exit — Process Employee Exit
router.post('/:id/exit', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE employees SET status = 'Exited', updated_at = CURRENT_TIMESTAMP WHERE id = $1 OR emp_code = $1 RETURNING *`, [id]
    );
    await logActivity(client, { module: 'hrms', entity: 'employee', entityId: id, action: 'employee_exited', newValue: reason || 'Resigned', performedBy: 'HR Admin' });
    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET /api/employees/:id/history — Employee audit history
router.get('/:id/history', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM employee_history WHERE employee_id = $1 ORDER BY created_at DESC`, [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/employees/:id/leave-balance — Employee leave balance
router.get('/:id/leave-balance', async (req, res) => {
  const { id } = req.params;
  const currentYear = new Date().getFullYear();
  try {
    const result = await pool.query(
      `SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 ORDER BY leave_type_name`, [id, currentYear]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
