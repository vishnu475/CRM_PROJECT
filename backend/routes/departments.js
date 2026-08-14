import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

// GET /api/departments - List all departments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/departments - Create department
router.post('/', async (req, res) => {
  const { name, code, headEmployeeId } = req.body;
  try {
    const deptId = `DEPT-${Date.now()}`;
    const deptCode = code || name.substring(0, 4).toUpperCase();
    const query = `
      INSERT INTO departments (id, name, code, head_employee_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code, head_employee_id = EXCLUDED.head_employee_id
      RETURNING *
    `;
    const result = await pool.query(query, [deptId, name, deptCode, headEmployeeId || null]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM departments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
