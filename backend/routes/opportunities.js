import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/opportunities
router.get('/', async (req, res) => {
  try {
    const { stage, customerId } = req.query;
    let query = `SELECT * FROM opportunities WHERE 1=1`;
    const params = [];

    if (stage && stage !== 'All') { params.push(stage); query += ` AND stage = $${params.length}`; }
    if (customerId)               { params.push(customerId); query += ` AND customer_id = $${params.length}`; }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/opportunities
router.post('/', async (req, res) => {
  const { id, name, customerId, customerName, value, probability, expectedClose, owner, stage } = req.body;
  try {
    const oppId = id || `OPP-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO opportunities (id, name, customer_id, customer_name, value, probability, expected_close, owner, stage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [oppId, name, customerId, customerName, value || 0, probability || 50, expectedClose, owner, stage || 'New']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/opportunities/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, value, probability, expectedClose, stage, owner } = req.body;
  try {
    const result = await pool.query(
      `UPDATE opportunities SET
         name = COALESCE($2, name),
         value = COALESCE($3, value),
         probability = COALESCE($4, probability),
         expected_close = COALESCE($5, expected_close),
         stage = COALESCE($6, stage),
         owner = COALESCE($7, owner),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, name, value, probability, expectedClose, stage, owner]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Opportunity not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/opportunities/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Opportunity deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
