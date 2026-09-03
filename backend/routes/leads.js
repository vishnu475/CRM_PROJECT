import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/leads — Fetch all leads from CRM database
router.get('/', async (req, res) => {
  try {
    const { stage, source, assignedTo } = req.query;
    let query = `SELECT * FROM leads WHERE 1=1`;
    const params = [];

    if (stage && stage !== 'All') {
      params.push(stage);
      query += ` AND stage = $${params.length}`;
    }
    if (source && source !== 'All') {
      params.push(source);
      query += ` AND source = $${params.length}`;
    }
    if (assignedTo) {
      params.push(assignedTo);
      query += ` AND assigned_to = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/leads/:id — Fetch single lead
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/leads — Create new lead in CRM database
router.post('/', async (req, res) => {
  const { id, name, company, email, phone, value, stage, score, source, assignedTo } = req.body;
  try {
    const leadId = id || `LD-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO leads (id, name, company, email, phone, value, stage, score, source, assigned_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [leadId, name, company, email, phone, value || 0, stage || 'New', score || 50, source || 'Manual/Other', assignedTo]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/leads/:id — Update lead stage or details
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  try {
    const setClauses = Object.keys(fields)
      .map((key, i) => `"${key.replace(/([A-Z])/g, '_$1').toLowerCase()}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(fields)];
    const result = await pool.query(
      `UPDATE leads SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/leads/:id — Delete lead
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
