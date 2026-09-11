import express from 'express';
import { crmPool as pool } from '../db/pool.js';

const router = express.Router();

// GET /api/crm/followups
router.get('/', async (req, res) => {
  try {
    const { status, assignedTo, customerId, opportunityId, leadId } = req.query;
    let query = `SELECT * FROM follow_ups WHERE 1=1`;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND (LOWER(status) = LOWER($${params.length}))`;
    }
    if (assignedTo) {
      params.push(assignedTo);
      query += ` AND (assigned_to = $${params.length} OR owner = $${params.length})`;
    }
    if (customerId) {
      params.push(customerId);
      query += ` AND (customer_id = $${params.length} OR related_entity = $${params.length})`;
    }
    if (opportunityId) {
      params.push(opportunityId);
      query += ` AND opportunity_id = $${params.length}`;
    }
    if (leadId) {
      params.push(leadId);
      query += ` AND (lead_id = $${params.length} OR related_entity = $${params.length})`;
    }

    query += ` ORDER BY due_date ASC, created_at DESC LIMIT 200`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/followups
router.post('/', async (req, res) => {
  const b = req.body || {};
  const id = b.id;
  const title = b.title || b.action;
  const notes = b.notes;
  const relatedEntity = b.relatedEntity || b.related_entity;
  const opportunityId = b.opportunityId || b.opportunity_id;
  const customerId = b.customerId || b.customer_id;
  const leadId = b.leadId || b.lead_id;
  const contactId = b.contactId || b.contact_id;
  const activityId = b.activityId || b.activity_id;
  const activityType = b.activityType || b.activity_type;
  const dueDate = b.dueDate || b.due_date;
  const dueTime = b.dueTime || b.due_time;
  const owner = b.owner;
  const assignedTo = b.assignedTo || b.assigned_to;
  const priority = b.priority;
  const status = b.status;
  const reminder = b.reminder;

  try {
    const fuId = id || `FU-${Date.now()}`;
    const assignee = assignedTo || owner || 'Sarah Jenkins';
    const actionTitle = title || 'Follow up with customer';
    const fuPriority = priority || 'Medium';
    const fuStatus = status || 'Scheduled';
    const cleanDueDate = dueDate ? dueDate.split('T')[0] : new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO follow_ups (
        id, title, notes, related_entity, opportunity_id, customer_id,
        lead_id, contact_id, activity_id, activity_type, due_date,
        owner, assigned_to, priority, status, reminder
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        fuId,
        actionTitle,
        notes || '',
        relatedEntity || 'General Account',
        opportunityId || null,
        customerId || null,
        leadId || null,
        contactId || null,
        activityId || null,
        activityType || 'Call',
        cleanDueDate,
        assignee,
        assignee,
        fuPriority,
        fuStatus,
        reminder || 'none',
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/crm/followups/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  const title = b.title !== undefined ? b.title : b.action;
  const notes = b.notes;
  const relatedEntity = b.relatedEntity !== undefined ? b.relatedEntity : b.related_entity;
  const opportunityId = b.opportunityId !== undefined ? b.opportunityId : b.opportunity_id;
  const customerId = b.customerId !== undefined ? b.customerId : b.customer_id;
  const leadId = b.leadId !== undefined ? b.leadId : b.lead_id;
  const contactId = b.contactId !== undefined ? b.contactId : b.contact_id;
  const activityId = b.activityId !== undefined ? b.activityId : b.activity_id;
  const activityType = b.activityType !== undefined ? b.activityType : b.activity_type;
  const dueDate = b.dueDate !== undefined ? (b.dueDate ? b.dueDate.split('T')[0] : null) : (b.due_date ? b.due_date.split('T')[0] : undefined);
  const owner = b.owner;
  const assignedTo = b.assignedTo !== undefined ? b.assignedTo : b.assigned_to;
  const priority = b.priority;
  const status = b.status;
  const reminder = b.reminder;
  const completedAt = b.completedAt !== undefined ? b.completedAt : b.completed_at;

  try {
    const isComp = status && ['completed', 'done'].includes(status.toLowerCase());
    const finalCompletedAt = isComp ? (completedAt || new Date().toISOString()) : null;

    const result = await pool.query(
      `UPDATE follow_ups SET
        title = COALESCE($2, title),
        notes = COALESCE($3, notes),
        related_entity = COALESCE($4, related_entity),
        opportunity_id = COALESCE($5, opportunity_id),
        customer_id = COALESCE($6, customer_id),
        lead_id = COALESCE($7, lead_id),
        contact_id = COALESCE($8, contact_id),
        activity_id = COALESCE($9, activity_id),
        activity_type = COALESCE($10, activity_type),
        due_date = COALESCE($11, due_date),
        owner = COALESCE($12, owner),
        assigned_to = COALESCE($13, assigned_to),
        priority = COALESCE($14, priority),
        status = COALESCE($15, status),
        reminder = COALESCE($16, reminder),
        completed_at = CASE
          WHEN LOWER(COALESCE($15, status)) IN ('completed', 'done') THEN COALESCE($17::timestamp, completed_at, CURRENT_TIMESTAMP)
          ELSE NULL
        END
      WHERE id = $1
      RETURNING *`,
      [
        id,
        title !== undefined ? title : null,
        notes !== undefined ? notes : null,
        relatedEntity !== undefined ? relatedEntity : null,
        opportunityId !== undefined ? opportunityId : null,
        customerId !== undefined ? customerId : null,
        leadId !== undefined ? leadId : null,
        contactId !== undefined ? contactId : null,
        activityId !== undefined ? activityId : null,
        activityType !== undefined ? activityType : null,
        dueDate !== undefined ? dueDate : null,
        (owner || assignedTo) !== undefined ? (owner || assignedTo) : null,
        (assignedTo || owner) !== undefined ? (assignedTo || owner) : null,
        priority !== undefined ? priority : null,
        status !== undefined ? status : null,
        reminder !== undefined ? reminder : null,
        finalCompletedAt,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/crm/followups/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM follow_ups WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.json({ success: true, message: 'Follow-up deleted successfully', data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
