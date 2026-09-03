import express from 'express';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2

const router = express.Router();

// GET /api/branches - List all company branches
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/branches - Create branch
router.post('/', async (req, res) => {
  const { name, code, city, state, country } = req.body;
  try {
    const branchId = `BR-${Date.now()}`;
    const branchCode = code || name.substring(0, 3).toUpperCase();
    const query = `
      INSERT INTO branches (id, name, code, city, state, country)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city
      RETURNING *
    `;
    const result = await pool.query(query, [branchId, name, branchCode, city || 'Bengaluru', state || 'Karnataka', country || 'India']);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
