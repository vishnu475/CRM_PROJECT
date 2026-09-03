import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/contacts
router.get('/', async (req, res) => {
  try {
    const { customerId, leadId } = req.query;
    let query = `SELECT * FROM contacts WHERE 1=1`;
    const params = [];

    if (customerId) { params.push(customerId); query += ` AND customer_id = $${params.length}`; }
    if (leadId)     { params.push(leadId);     query += ` AND lead_id = $${params.length}`; }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/contacts
router.post('/', async (req, res) => {
  const { id, name, email, phone, company, customerId, leadId, title } = req.body;
  try {
    const contactId = id || `CON-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO contacts (id, name, email, phone, company, customer_id, lead_id, title)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [contactId, name, email, phone, company, customerId, leadId, title]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
