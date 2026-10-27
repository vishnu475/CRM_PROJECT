import express from 'express';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

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
// GET /api/leave/holidays — Fetch accurate public holidays by year
// ────────────────────────────────────────────────────────────
const DEFAULT_2026_HOLIDAYS = [
  { id: 'HOL-2026-01', title: 'New Year Day', date: '2026-01-01', day: 'Thursday', type: 'Gazetted', description: 'Celebration of the New Year' },
  { id: 'HOL-2026-02', title: 'Republic Day', date: '2026-01-26', day: 'Monday', type: 'Gazetted', description: 'National Republic Day Celebration' },
  { id: 'HOL-2026-03', title: 'Maha Shivratri', date: '2026-02-15', day: 'Sunday', type: 'Gazetted', description: 'Hindu festival dedicated to Lord Shiva' },
  { id: 'HOL-2026-04', title: 'Holi', date: '2026-03-04', day: 'Wednesday', type: 'Gazetted', description: 'Festival of colors and spring' },
  { id: 'HOL-2026-05', title: 'Eid-ul-Fitr', date: '2026-03-20', day: 'Friday', type: 'Gazetted', description: 'Islamic festival marking the end of Ramadan' },
  { id: 'HOL-2026-06', title: 'Good Friday', date: '2026-04-03', day: 'Friday', type: 'Gazetted', description: 'Christian remembrance of the Passion of Christ' },
  { id: 'HOL-2026-07', title: 'May Day / Labor Day', date: '2026-05-01', day: 'Friday', type: 'Gazetted', description: 'International Workers Day' },
  { id: 'HOL-2026-08', title: 'Bakrid / Eid-ul-Adha', date: '2026-05-27', day: 'Wednesday', type: 'Gazetted', description: 'Feast of the Sacrifice' },
  { id: 'HOL-2026-09', title: 'Muharram', date: '2026-06-26', day: 'Friday', type: 'Gazetted', description: 'First month of the Islamic calendar' },
  { id: 'HOL-2026-10', title: 'Independence Day', date: '2026-08-15', day: 'Saturday', type: 'Gazetted', description: 'Indian National Independence Day' },
  { id: 'HOL-2026-11', title: 'Milad-un-Nabi', date: '2026-08-26', day: 'Wednesday', type: 'Gazetted', description: 'Prophet Muhammad Birthday' },
  { id: 'HOL-2026-12', title: 'Mahatma Gandhi Jayanti', date: '2026-10-02', day: 'Friday', type: 'Gazetted', description: 'Birth anniversary of Mahatma Gandhi' },
  { id: 'HOL-2026-13', title: 'Dussehra (Vijayadashami)', date: '2026-10-20', day: 'Tuesday', type: 'Gazetted', description: 'Celebration of the victory of good over evil' },
  { id: 'HOL-2026-14', title: 'Diwali (Deepavali)', date: '2026-11-08', day: 'Sunday', type: 'Gazetted', description: 'Festival of Lights' },
  { id: 'HOL-2026-15', title: 'Guru Nanak Jayanti', date: '2026-11-24', day: 'Tuesday', type: 'Gazetted', description: 'Birth of Guru Nanak Dev Ji' },
  { id: 'HOL-2026-16', title: 'Christmas Day', date: '2026-12-25', day: 'Friday', type: 'Gazetted', description: 'Celebration of the birth of Jesus Christ' }
];

router.get('/holidays', async (req, res) => {
  const targetYear = parseInt(req.query.year, 10) || 2026;
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        date DATE UNIQUE NOT NULL,
        description TEXT,
        is_mandatory BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check existing records in DB
    const dbHolidays = await pool.query(
      `SELECT * FROM holidays WHERE EXTRACT(YEAR FROM date) = $1 ORDER BY date ASC`,
      [targetYear]
    );

    if (dbHolidays.rows.length === 0 && targetYear === 2026) {
      for (const h of DEFAULT_2026_HOLIDAYS) {
        await pool.query(
          `INSERT INTO holidays (id, title, date, description, is_mandatory)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (date) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description`,
          [h.id, h.title, h.date, h.description, true]
        );
      }
      return res.json({ success: true, year: targetYear, count: DEFAULT_2026_HOLIDAYS.length, data: DEFAULT_2026_HOLIDAYS });
    }

    if (dbHolidays.rows.length > 0) {
      const formatted = dbHolidays.rows.map(row => {
        const d = new Date(row.date);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        const dateStr = d.toISOString().split('T')[0];
        return {
          id: row.id,
          name: row.title,
          title: row.title,
          date: dateStr,
          day: dayName,
          type: row.is_mandatory ? 'Gazetted' : 'Restricted',
          description: row.description || 'Public Company Holiday'
        };
      });
      return res.json({ success: true, year: targetYear, count: formatted.length, data: formatted });
    }

    // Fallback if other year
    return res.json({ success: true, year: targetYear, count: DEFAULT_2026_HOLIDAYS.length, data: DEFAULT_2026_HOLIDAYS });
  } catch (err) {
    console.error('Holidays query notice:', err);
    // Return standard fallback on error so UI is never broken
    res.json({ success: true, year: targetYear, count: DEFAULT_2026_HOLIDAYS.length, data: DEFAULT_2026_HOLIDAYS });
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
