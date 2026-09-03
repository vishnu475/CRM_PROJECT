import express from 'express';
import { AttendanceEngineService } from '../services/attendanceEngineService.js';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

const router = express.Router();

// POST /api/attendance/events - Punch In / Punch Out from Web Kiosk
router.post('/events', async (req, res) => {
  const { employeeId, pin, deviceId, source } = req.body;
  try {
    const result = await AttendanceEngineService.processPunchEvent({ employeeId, pin, deviceId, source });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/today - Fetch today's records joined with employee_master
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(r.id, CONCAT('ATT-', COALESCE(e.emp_code, e.id), '-', CURRENT_DATE::text)) AS id,
        COALESCE(e.emp_code, e.id) AS employee_id,
        COALESCE(e.emp_code, e.id) AS emp_code,
        e.name AS emp_name,
        e.department,
        e.designation,
        COALESCE(TO_CHAR(r.date, 'YYYY-MM-DD'), $1::text) AS date,
        COALESCE(r.check_in, '-') AS check_in,
        COALESCE(r.check_out, '-') AS check_out,
        COALESCE(r.status, 'Absent') AS status,
        COALESCE(r.worked_hours, 0.0) AS work_hours,
        COALESCE(r.worked_hours, 0.0) AS worked_hours,
        COALESCE(r.late_minutes, 0) AS late_minutes,
        COALESCE(s.name, 'General Day Shift') AS shift_name
       FROM employees e
       LEFT JOIN attendance_records r ON (r.employee_id = e.emp_code OR r.employee_id = e.id) AND (r.date = CURRENT_DATE OR TO_CHAR(r.date, 'YYYY-MM-DD') = $1::text)
       LEFT JOIN shifts s ON e.shift_id = s.id
       WHERE e.status != 'Exited'
       ORDER BY 
         CASE WHEN r.check_in IS NOT NULL AND r.check_in != '-' THEN 0 ELSE 1 END,
         e.emp_code ASC`,
      [today]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/history - Attendance log history with filters
router.get('/history', async (req, res) => {
  const { employeeId, department, month, status } = req.query;
  try {
    let query = `
      SELECT r.*, TO_CHAR(r.date, 'YYYY-MM-DD') AS date, e.name as emp_name, e.department, e.designation 
      FROM attendance_records r
      JOIN employees e ON (r.employee_id = e.emp_code OR r.employee_id = e.id)
      WHERE 1=1
    `;
    const params = [];

    if (employeeId) {
      params.push(employeeId);
      query += ` AND r.employee_id = $${params.length}`;
    }
    if (department && department !== 'All') {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }
    if (status && status !== 'All') {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }

    query += ` ORDER BY r.date DESC, r.check_in ASC LIMIT 200`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/live - Real-time activity feed stream
router.get('/live', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ev.*, e.name as emp_name, e.department, e.designation 
       FROM attendance_events ev
       JOIN employees e ON ev.employee_id = e.emp_code
       ORDER BY ev.timestamp DESC LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/regularizations - Request Regularization
router.post('/regularizations', async (req, res) => {
  const { employeeId, date, requestedCheckIn, requestedCheckOut, reason } = req.body;
  try {
    const regId = `REG-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO attendance_regularizations 
       (id, employee_id, date, requested_check_in, requested_check_out, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
      [regId, employeeId, date, requestedCheckIn, requestedCheckOut, reason]
    );

    await pool.query(
      `UPDATE attendance_records SET regularization_status = 'PENDING' WHERE employee_id = $1 AND date = $2`,
      [employeeId, date]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/attendance/regularizations/:id/approve - Approve Regularization
router.patch('/regularizations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const approvedBy = req.user ? req.user.name : 'HR Admin';
  try {
    const regRes = await pool.query('SELECT * FROM attendance_regularizations WHERE id = $1', [id]);
    if (regRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });
    const reg = regRes.rows[0];

    // Approve regularization
    await pool.query(
      `UPDATE attendance_regularizations SET status = 'APPROVED', approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [approvedBy, id]
    );

    // Update effective attendance record
    const workedHours = AttendanceEngineService.calculateHoursDifference(reg.requested_check_in, reg.requested_check_out);
    const otHours = workedHours > 8 ? workedHours - 8 : 0;

    await pool.query(
      `INSERT INTO attendance_records (id, employee_id, date, check_in, check_out, worked_hours, overtime_hours, status, regularization_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Present', 'APPROVED')
       ON CONFLICT (employee_id, date) DO UPDATE 
       SET check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, worked_hours = EXCLUDED.worked_hours, overtime_hours = EXCLUDED.overtime_hours, status = 'Present', regularization_status = 'APPROVED'`,
      [`ATT-${reg.employee_id}-${reg.date}`, reg.employee_id, reg.date, reg.requested_check_in, reg.requested_check_out, workedHours, otHours]
    );

    res.json({ success: true, message: 'Regularization approved and attendance updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/attendance/regularizations/:id/reject - Reject Regularization
router.patch('/regularizations/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query(
      `UPDATE attendance_regularizations SET status = 'REJECTED', rejection_reason = $1 WHERE id = $2`,
      [reason || 'Rejected by Manager', id]
    );
    res.json({ success: true, message: 'Regularization request rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
