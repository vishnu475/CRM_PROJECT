import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

// GET /api/shifts - Fetch all shift master rules
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shifts ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/shifts - Add or update shift
router.post('/', async (req, res) => {
  const { id, name, code, startTime, endTime, gracePeriodMins, status } = req.body;
  try {
    const shiftId = id || `shift-${Date.now()}`;
    const query = `
      INSERT INTO shifts (id, name, code, start_time, end_time, grace_period_mins, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name, code = EXCLUDED.code, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, grace_period_mins = EXCLUDED.grace_period_mins, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [shiftId, name, code || 'SHIFT-01', startTime, endTime, gracePeriodMins || 15, status || 'Active']);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/shifts/roster/:employeeId - Fetch roster for employee
router.get('/roster/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    const result = await pool.query(
      `SELECT sr.*, s.name as shift_name, s.start_time, s.end_time 
       FROM shift_rosters sr
       JOIN shifts s ON sr.shift_id = s.id
       WHERE sr.employee_id = $1 ORDER BY sr.date DESC LIMIT 31`,
      [employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/shifts/roster - Save or Assign Shift Roster
router.post('/roster', async (req, res) => {
  const { employeeId, date, shiftId, isWeeklyOff } = req.body;
  try {
    const rosterId = `RST-${employeeId}-${date}`;
    const query = `
      INSERT INTO shift_rosters (id, employee_id, date, shift_id, is_weekly_off)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id, date) DO UPDATE 
      SET shift_id = EXCLUDED.shift_id, is_weekly_off = EXCLUDED.is_weekly_off
      RETURNING *
    `;
    const result = await pool.query(query, [rosterId, employeeId, date, shiftId || 'shift-gen', isWeeklyOff || false]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
