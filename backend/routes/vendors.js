import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/vendors — Fetch all vendors from CRM database
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendors/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vendors — Create vendor in CRM database
router.post('/', async (req, res) => {
  const { id, code, name, contactPerson, email, phone, payableBalance, rating } = req.body;
  try {
    const vendorId = id || `VND-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO vendors (id, code, name, contact_person, email, phone, payable_balance, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [vendorId, code || vendorId, name, contactPerson, email, phone, payableBalance || 0, rating || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/vendors/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, email, phone, payableBalance, rating } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vendors SET
         name = COALESCE($2, name),
         contact_person = COALESCE($3, contact_person),
         email = COALESCE($4, email),
         phone = COALESCE($5, phone),
         payable_balance = COALESCE($6, payable_balance),
         rating = COALESCE($7, rating),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, name, contactPerson, email, phone, payableBalance, rating]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vendors WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
