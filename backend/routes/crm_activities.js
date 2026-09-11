import express from 'express';
import { crmPool as pool } from '../db/pool.js'; // CRM DB — Friend 1

const router = express.Router();

// GET /api/crm/activities
router.get('/', async (req, res) => {
  try {
    const { type, status, assignedTo } = req.query;
    let query = `SELECT * FROM activities WHERE 1=1`;
    const params = [];

    if (type)       { params.push(type);       query += ` AND type = $${params.length}`; }
    if (status)     { params.push(status);     query += ` AND status = $${params.length}`; }
    if (assignedTo) { params.push(assignedTo); query += ` AND assigned_to = $${params.length}`; }

    query += ` ORDER BY created_at DESC LIMIT 100`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/activities
router.post('/', async (req, res) => {
  const { id, title, type, purpose, relatedTo, customerId, opportunityId, assignedTo, dueDate, priority, status, outcome } = req.body;
  try {
    const actId = id || `ACT-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO activities (id, title, type, purpose, related_to, customer_id, opportunity_id, assigned_to, due_date, priority, status, outcome)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [actId, title, type || 'Task', purpose || 'General', relatedTo, customerId, opportunityId, assignedTo, dueDate, priority || 'Medium', status || 'Pending', outcome]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/crm/activities/:id — Update activity fields
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    type,
    purpose,
    relatedTo,
    customerId,
    opportunityId,
    assignedTo,
    dueDate,
    priority,
    status,
    outcome,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE activities SET
        title = COALESCE($2, title),
        type = COALESCE($3, type),
        purpose = COALESCE($4, purpose),
        related_to = COALESCE($5, related_to),
        customer_id = COALESCE($6, customer_id),
        opportunity_id = COALESCE($7, opportunity_id),
        assigned_to = COALESCE($8, assigned_to),
        due_date = COALESCE($9, due_date),
        priority = COALESCE($10, priority),
        status = COALESCE($11, status),
        outcome = COALESCE($12, outcome)
       WHERE id = $1 RETURNING *`,
      [
        id,
        title,
        type,
        purpose,
        relatedTo,
        customerId,
        opportunityId,
        assignedTo,
        dueDate,
        priority,
        status,
        outcome,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/crm/activities/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM activities WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, message: 'Activity deleted successfully', data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
