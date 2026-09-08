import express from 'express';
import { crmPool as pool } from '../db/pool.js';

const router = express.Router();

// GET /api/projects — Fetch all projects
router.get('/', async (req, res) => {
  try {
    const { status, clientId, customerId } = req.query;
    let query = `SELECT * FROM projects WHERE 1=1`;
    const params = [];

    if (status && status !== 'All') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (customerId) {
      params.push(customerId);
      query += ` AND customer_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id — Fetch single project
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects — Create a new project
router.post('/', async (req, res) => {
  const {
    id,
    code,
    name,
    client,
    customerId,
    sourceLeadId,
    sourceOpportunityId,
    projectRequirement,
    projectNotes,
    projectManager,
    startDate,
    endDate,
    budget,
    spent,
    progress,
    status
  } = req.body;

  try {
    const projectId = id || `PRJ-${Date.now().toString().slice(-4)}`;
    const projectCode = code || projectId;

    const result = await pool.query(
      `INSERT INTO projects (
        id, code, name, client, customer_id, source_lead_id, source_opportunity_id,
        project_requirement, project_notes, project_manager, start_date, end_date,
        budget, spent, progress, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        projectId,
        projectCode,
        name,
        client,
        customerId || null,
        sourceLeadId || null,
        sourceOpportunityId || null,
        projectRequirement || null,
        projectNotes || null,
        projectManager || null,
        startDate || null,
        endDate || null,
        budget || 0,
        spent || 0,
        progress || 0,
        status || 'Not Started'
      ]
    );

    // If originated from a Lead, update the Lead with project reference and is_project_created
    if (sourceLeadId) {
      await pool.query(
        `UPDATE leads SET project_id = $1, is_project_created = true, project_created_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [projectId, sourceLeadId]
      );
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT / PATCH /api/projects/:id — Update project
const updateHandler = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  try {
    const setClauses = Object.keys(fields)
      .map((key, i) => `"${key.replace(/([A-Z])/g, '_$1').toLowerCase()}" = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(fields)];
    const result = await pool.query(
      `UPDATE projects SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

router.put('/:id', updateHandler);
router.patch('/:id', updateHandler);

// DELETE /api/projects/:id — Delete project
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
