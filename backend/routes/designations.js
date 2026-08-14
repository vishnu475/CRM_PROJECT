import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

// GET /api/designations - List all designations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM designations ORDER BY title ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/designations - Create designation
router.post('/', async (req, res) => {
  const { title, departmentId, level } = req.body;
  try {
    const desigId = `DESIG-${Date.now()}`;
    const query = `
      INSERT INTO designations (id, title, department_id, level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (title) DO UPDATE SET level = EXCLUDED.level
      RETURNING *
    `;
    const result = await pool.query(query, [desigId, title, departmentId || null, level || 'L1']);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
