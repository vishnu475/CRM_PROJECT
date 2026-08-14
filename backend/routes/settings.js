import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

// GET /api/settings/sequences - Fetch Number Sequences
router.get('/sequences', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM number_sequences ORDER BY prefix ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/sequences - Update Number Sequence
router.post('/sequences', async (req, res) => {
  const { id, prefix, padding } = req.body;
  try {
    const result = await pool.query(
      `UPDATE number_sequences SET prefix = $1, padding = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [prefix, padding, id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
