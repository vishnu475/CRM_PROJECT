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
  const { 
    id, name, email, phone, company, customerId, leadId, title, 
    contactRole, alternatePhone, notes 
  } = req.body;

  try {
    // Duplicate prevention: If a contact already exists for this leadId, reuse it
    if (leadId) {
      const existing = await pool.query(
        `SELECT * FROM contacts WHERE lead_id = $1 OR (email = $2 AND lead_id IS NOT NULL AND lead_id = $1)`,
        [leadId, email || '']
      );
      if (existing.rows.length > 0) {
        return res.status(200).json({ 
          success: true, 
          data: existing.rows[0], 
          message: 'Existing contact reused for lead' 
        });
      }
    }

    const contactId = id || `CON-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO contacts (id, name, email, phone, company, customer_id, lead_id, title, contact_role, alternate_phone, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        contactId, 
        name, 
        email || null, 
        phone || null, 
        company || null, 
        customerId || null, 
        leadId || null, 
        title || null,
        contactRole || null,
        alternatePhone || null,
        notes || null
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/contacts/:id
router.patch('/:id', async (req, res) => {
  const { 
    name, email, phone, company, customerId, leadId, title, 
    contactRole, alternatePhone, notes 
  } = req.body;

  try {
    const fields = [];
    const params = [];
    if (name !== undefined) { params.push(name); fields.push(`name = $${params.length}`); }
    if (email !== undefined) { params.push(email); fields.push(`email = $${params.length}`); }
    if (phone !== undefined) { params.push(phone); fields.push(`phone = $${params.length}`); }
    if (company !== undefined) { params.push(company); fields.push(`company = $${params.length}`); }
    if (customerId !== undefined) { params.push(customerId); fields.push(`customer_id = $${params.length}`); }
    if (leadId !== undefined) { params.push(leadId); fields.push(`lead_id = $${params.length}`); }
    if (title !== undefined) { params.push(title); fields.push(`title = $${params.length}`); }
    if (contactRole !== undefined) { params.push(contactRole); fields.push(`contact_role = $${params.length}`); }
    if (alternatePhone !== undefined) { params.push(alternatePhone); fields.push(`alternate_phone = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); fields.push(`notes = $${params.length}`); }

    if (fields.length === 0) {
      return res.json({ success: true, message: 'No fields to update' });
    }

    params.push(req.params.id);
    const query = `UPDATE contacts SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`;
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
