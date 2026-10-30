import express from 'express';
import { crmPool as pool } from '../db/pool.js';

const router = express.Router();

// GET /api/crm/notes
router.get('/', async (req, res) => {
  try {
    const { relatedType, relatedId, entityType, entityId, type, createdBy } = req.query;
    let query = `SELECT * FROM notes WHERE 1=1`;
    const params = [];

    const relType = relatedType || entityType;
    if (relType) {
      params.push(relType);
      query += ` AND (LOWER(COALESCE(related_type, entity_type)) = LOWER($${params.length}))`;
    }

    const relId = relatedId || entityId;
    if (relId) {
      params.push(relId);
      query += ` AND (COALESCE(related_id, entity_id) = $${params.length})`;
    }

    if (type) {
      params.push(type);
      query += ` AND (LOWER(type) = LOWER($${params.length}))`;
    }

    if (createdBy) {
      params.push(createdBy);
      query += ` AND (LOWER(COALESCE(created_by, author)) = LOWER($${params.length}))`;
    }

    query += ` ORDER BY created_at DESC LIMIT 500`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crm/notes/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crm/notes
router.post('/', async (req, res) => {
  const b = req.body || {};
  const id = b.id || `NOTE-${Date.now()}`;
  const title = b.title || 'Untitled Note';
  const type = b.type || 'General';
  const content = b.content || '';
  const relatedType = b.relatedType || b.related_type || b.entityType || b.entity_type || null;
  const relatedId = b.relatedId || b.related_id || b.entityId || b.entity_id || null;
  const createdBy = b.createdBy || b.created_by || b.author || 'Sarah Jenkins';

  try {
    const result = await pool.query(
      `INSERT INTO notes (
        id, title, type, content, related_type, related_id, entity_type, entity_id, created_by, author, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $5, $6, $7, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [id, title, type, content, relatedType, relatedId, createdBy]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/crm/notes/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};

  const title = b.title;
  const type = b.type;
  const content = b.content;
  const relatedType = b.relatedType !== undefined ? b.relatedType : b.related_type;
  const relatedId = b.relatedId !== undefined ? b.relatedId : b.related_id;
  const createdBy = b.createdBy !== undefined ? b.createdBy : b.created_by;

  try {
    const result = await pool.query(
      `UPDATE notes SET
        title = COALESCE($2, title),
        type = COALESCE($3, type),
        content = COALESCE($4, content),
        related_type = COALESCE($5, related_type),
        entity_type = COALESCE($5, entity_type),
        related_id = COALESCE($6, related_id),
        entity_id = COALESCE($6, entity_id),
        created_by = COALESCE($7, created_by),
        author = COALESCE($7, author),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`,
      [
        id,
        title !== undefined ? title : null,
        type !== undefined ? type : null,
        content !== undefined ? content : null,
        relatedType !== undefined ? relatedType : null,
        relatedId !== undefined ? relatedId : null,
        createdBy !== undefined ? createdBy : null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/crm/notes/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted successfully', data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
