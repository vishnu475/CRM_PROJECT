import { pool } from '../db/pool.js';

export const getAttendanceLogs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance_records ORDER BY date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
