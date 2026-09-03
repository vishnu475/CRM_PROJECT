import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

/**
 * Helper: Insert into activity_logs
 */
async function logActivity(client, { module, entity, entityId, action, oldValue, newValue, performedBy }) {
  await client.query(
    `INSERT INTO activity_logs (module, entity, entity_id, action, old_value, new_value, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [module, entity, entityId, action, oldValue || null, newValue || null, performedBy || 'system']
  );
}

// ────────────────────────────────────────────────────────────
// GET /api/leave/types — Fetch all leave types
// ────────────────────────────────────────────────────────────
router.get('/types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_types WHERE is_active = TRUE ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/leave/balance — Fetch leave balance for employee
// ────────────────────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  const { employeeId } = req.query;
  const currentYear = new Date().getFullYear();
  try {
    const result = await pool.query(
      `SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 ORDER BY leave_type_name`,
      [employeeId || 'EMP-001', currentYear]
    );
    // If no balance rows, auto-create defaults
    if (result.rows.length === 0 && employeeId) {
      await pool.query(`
        INSERT INTO leave_balances (employee_id, leave_type_name, year, total_allocated, used, pending, available)
        VALUES
          ($1, 'Casual Leave', $2, 12, 0, 0, 12),
          ($1, 'Sick Leave', $2, 10, 0, 0, 10),
          ($1, 'Privilege Leave', $2, 15, 0, 0, 15)
        ON CONFLICT (employee_id, leave_type_name, year) DO NOTHING
      `, [employeeId, currentYear]);
      const created = await pool.query(
        `SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2`, [employeeId, currentYear]
      );
      return res.json({ success: true, data: created.rows });
    }
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/leave/requests — Fetch all leave requests
// ────────────────────────────────────────────────────────────
router.get('/requests', async (req, res) => {
  const { employeeId, status } = req.query;
  try {
    let query = `SELECT lr.*, e.name as employee_name, e.department, e.designation 
                 FROM leave_requests lr
                 LEFT JOIN employees e ON lr.employee_id = e.id
                 WHERE 1=1`;
    const params = [];
    if (employeeId) { params.push(employeeId); query += ` AND lr.employee_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND lr.status = $${params.length}`; }
    query += ' ORDER BY lr.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/leave — Apply for Leave (SQL Transaction)
// ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { employeeId, employeeName, leaveType, fromDate, toDate, days, reason, managerName } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check balance availability
    const currentYear = new Date().getFullYear();
    const balRes = await client.query(
      `SELECT * FROM leave_balances WHERE employee_id = $1 AND (leave_type_name ILIKE $2 || '%' OR leave_type_name = $2) AND year = $3`,
      [employeeId, leaveType, currentYear]
    );
    if (balRes.rows.length > 0) {
      const balance = balRes.rows[0];
      if (balance.available < days) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Insufficient ${leaveType} balance. Available: ${balance.available} days.` });
      }
    }

    const leaveReqId = `LV-${Date.now()}`;
    const leaveTypeId = leaveType.toLowerCase().includes('sick') ? 'lt-sl' :
                        leaveType.toLowerCase().includes('privilege') ? 'lt-pl' : 'lt-cl';
    // Insert leave request
    const reqResult = await client.query(`
      INSERT INTO leave_requests 
        (id, employee_id, employee_name, leave_type, leave_type_id, from_date, to_date, days, start_date, end_date, total_days, reason, status, manager_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $6, $7, $9, $10, 'PENDING', $11)
      RETURNING *
    `, [leaveReqId, employeeId, employeeName || employeeId, leaveType, leaveTypeId, fromDate, toDate, days, Number(days), reason, managerName || 'HR Manager']);

    // Update pending count in leave_balance
    await client.query(`
      UPDATE leave_balances SET pending = pending + $1
      WHERE employee_id = $2 AND (leave_type_name ILIKE $3 || '%' OR leave_type_name = $3) AND year = $4
    `, [days, employeeId, leaveType, currentYear]);

    // Activity log
    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: reqResult.rows[0].id,
      action: 'leave_applied',
      newValue: `${leaveType}: ${fromDate} to ${toDate} (${days} days)`,
      performedBy: employeeName || employeeId
    });

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: reqResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// Helper function to approve leave request
async function approveLeaveHandler(req, res) {
  const { id } = req.params;
  const { approvedBy, comments } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get leave request details
    const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) throw new Error('Leave request not found');
    const leaveReq = reqRes.rows[0];
    const currentStatus = (leaveReq.status || '').toUpperCase();
    if (currentStatus !== 'PENDING') throw new Error(`Cannot approve — status is already ${leaveReq.status}`);

    // Update status to APPROVED
    const updated = await client.query(
      `UPDATE leave_requests SET status = 'APPROVED', manager_name = $1, manager_comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [approvedBy || 'HR Manager', comments || 'Approved', id]
    );

    // Deduct from leave balance + clear pending
    const currentYear = new Date().getFullYear();
    await client.query(`
      UPDATE leave_balances 
      SET used = used + $1, pending = GREATEST(0, pending - $1), available = GREATEST(0, available - $1)
      WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
    `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);

    // Automatically update attendance records for leave date range
    const startDate = leaveReq.from_date || leaveReq.start_date;
    const endDate = leaveReq.to_date || leaveReq.end_date || startDate;
    if (startDate && endDate) {
      await client.query(`
        INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out, worked_hours, work_hours)
        SELECT 
          'ATT-' || $1 || '-' || d::date,
          $1,
          d::date,
          'On Leave',
          'OFF',
          'OFF',
          0,
          0
        FROM generate_series($2::date, $3::date, '1 day'::interval) d
        ON CONFLICT (employee_id, date) DO UPDATE 
        SET status = 'On Leave', check_in = 'OFF', check_out = 'OFF', worked_hours = 0, work_hours = 0
      `, [leaveReq.employee_id, startDate, endDate]);
    }

    // Insert approval record
    await client.query(`
      INSERT INTO leave_approvals (leave_request_id, action, actioned_by, comments)
      VALUES ($1, 'APPROVED', $2, $3)
    `, [id, approvedBy || 'HR Manager', comments || null]);

    // Activity log
    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: id,
      action: 'leave_approved',
      oldValue: 'PENDING',
      newValue: 'APPROVED',
      performedBy: approvedBy || 'HR Manager'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0], message: 'Leave approved, balance deducted, and attendance updated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
}

// ────────────────────────────────────────────────────────────
// PATCH /api/leave/requests/:id/approve & /api/leave/:id/approve — Approve Leave
// ────────────────────────────────────────────────────────────
router.patch('/requests/:id/approve', approveLeaveHandler);
router.patch('/:id/approve', approveLeaveHandler);

// ────────────────────────────────────────────────────────────
// PATCH /api/leave/requests/:id/reject — Reject Leave (SQL Transaction)
// ────────────────────────────────────────────────────────────
router.patch('/requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { rejectedBy, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) throw new Error('Leave request not found');
    const leaveReq = reqRes.rows[0];
    const currentStatus = (leaveReq.status || '').toUpperCase();
    if (currentStatus !== 'PENDING') throw new Error(`Cannot reject — status is already ${leaveReq.status}`);

    const updated = await client.query(
      `UPDATE leave_requests SET status = 'REJECTED', manager_name = $1, manager_comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [rejectedBy || 'HR Manager', reason || 'Rejected', id]
    );

    // Restore pending count
    const currentYear = new Date().getFullYear();
    await client.query(`
      UPDATE leave_balances 
      SET pending = GREATEST(0, pending - $1)
      WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
    `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);

    await client.query(`
      INSERT INTO leave_approvals (leave_request_id, action, actioned_by, comments)
      VALUES ($1, 'REJECTED', $2, $3)
    `, [id, rejectedBy || 'HR Manager', reason || null]);

    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: id,
      action: 'leave_rejected',
      oldValue: 'PENDING',
      newValue: 'REJECTED',
      performedBy: rejectedBy || 'HR Manager'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0], message: 'Leave request rejected.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ────────────────────────────────────────────────────────────
// PATCH /api/leave/requests/:id/cancel & /api/leave/:id/cancel — Cancel Leave
// ────────────────────────────────────────────────────────────
async function cancelLeaveHandler(req, res) {
  const { id } = req.params;
  const { cancelledBy, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) throw new Error('Leave request not found');
    const leaveReq = reqRes.rows[0];

    const updated = await client.query(
      `UPDATE leave_requests SET status = 'CANCELLED', manager_name = $1, manager_comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [cancelledBy || 'HR Manager', reason || 'Cancelled', id]
    );

    // If was APPROVED, restore used balance and available balance
    const currentYear = new Date().getFullYear();
    const prevStatus = (leaveReq.status || '').toUpperCase();
    if (prevStatus === 'APPROVED') {
      await client.query(`
        UPDATE leave_balances 
        SET used = GREATEST(0, used - $1), available = available + $1
        WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
      `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);

      // Remove 'On Leave' attendance records for date range
      const startDate = leaveReq.from_date || leaveReq.start_date;
      const endDate = leaveReq.to_date || leaveReq.end_date || startDate;
      if (startDate && endDate) {
        await client.query(`
          DELETE FROM attendance_records 
          WHERE employee_id = $1 AND date >= $2 AND date <= $3 AND status = 'On Leave'
        `, [leaveReq.employee_id, startDate, endDate]);
      }
    } else if (prevStatus === 'PENDING') {
      await client.query(`
        UPDATE leave_balances 
        SET pending = GREATEST(0, pending - $1)
        WHERE employee_id = $2 AND leave_type_name = $3 AND year = $4
      `, [leaveReq.days, leaveReq.employee_id, leaveReq.leave_type, currentYear]);
    }

    await logActivity(client, {
      module: 'leave',
      entity: 'leave_request',
      entityId: id,
      action: 'leave_cancelled',
      oldValue: leaveReq.status,
      newValue: 'CANCELLED',
      performedBy: cancelledBy || 'HR Manager'
    });

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0], message: 'Leave request cancelled successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
}

router.patch('/requests/:id/cancel', cancelLeaveHandler);
router.patch('/:id/cancel', cancelLeaveHandler);

export default router;
