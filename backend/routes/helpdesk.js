import express from 'express';
import { crmPool as pool } from '../db/pool.js';

const router = express.Router();

/**
 * Format DB row to camelCase frontend representation
 */
function formatTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticketNo: row.ticket_no,
    subject: row.subject,
    customerName: row.customer_name,
    customerId: row.customer_id,
    priority: row.priority,
    status: row.status,
    assignedAgent: row.assigned_agent || 'Unassigned',
    category: row.category || 'General',
    description: row.description || '',
    resolutionNotes: row.resolution_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: Array.isArray(row.history) ? row.history : (typeof row.history === 'string' ? JSON.parse(row.history) : []),
  };
}

/**
 * GET /api/helpdesk/summary
 * Returns real-time KPI counts derived strictly from PostgreSQL
 */
router.get('/summary', async (req, res) => {
  try {
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Open') as open_count,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_count,
        COUNT(*) FILTER (WHERE priority IN ('High', 'Urgent') AND status NOT IN ('Resolved', 'Closed')) as high_priority_count
      FROM helpdesk_tickets;
    `;
    const result = await pool.query(summaryQuery);
    const row = result.rows[0];

    return res.json({
      success: true,
      summary: {
        total: parseInt(row.total || 0, 10),
        open: parseInt(row.open_count || 0, 10),
        inProgress: parseInt(row.in_progress_count || 0, 10),
        resolved: parseInt(row.resolved_count || 0, 10),
        highPriority: parseInt(row.high_priority_count || 0, 10),
      }
    });
  } catch (err) {
    console.error('Error fetching helpdesk summary:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ticket summary metrics.' });
  }
});

/**
 * GET /api/helpdesk
 * List tickets with search, filtering, sorting, pagination, and KPI counts
 */
router.get('/', async (req, res) => {
  try {
    const {
      q,
      search,
      status,
      priority,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = req.query;

    const searchTerm = (q || search || '').trim();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      const pIdx = params.length;
      conditions.push(`(
        ticket_no ILIKE $${pIdx} OR 
        subject ILIKE $${pIdx} OR 
        customer_name ILIKE $${pIdx} OR 
        assigned_agent ILIKE $${pIdx} OR 
        category ILIKE $${pIdx} OR 
        description ILIKE $${pIdx}
      )`);
    }

    if (status && status !== 'All') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (priority && priority !== 'All') {
      params.push(priority);
      conditions.push(`priority = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column to avoid SQL injection
    const allowedSortCols = {
      createdAt: 'created_at',
      created_at: 'created_at',
      updatedAt: 'updated_at',
      updated_at: 'updated_at',
      priority: 'priority',
      status: 'status',
      ticketNo: 'ticket_no',
      ticket_no: 'ticket_no',
      subject: 'subject',
      customerName: 'customer_name',
    };
    const orderCol = allowedSortCols[sortBy] || 'created_at';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1. Fetch paginated tickets
    const dataQuery = `
      SELECT * FROM helpdesk_tickets
      ${whereClause}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const dataParams = [...params, limitNum, offset];
    const dataResult = await pool.query(dataQuery, dataParams);

    // 2. Total count of filtered tickets
    const countQuery = `SELECT COUNT(*) FROM helpdesk_tickets ${whereClause};`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // 3. Overall summary metrics (across all tickets, not constrained by filters)
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Open') as open_count,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_count,
        COUNT(*) FILTER (WHERE priority IN ('High', 'Urgent') AND status NOT IN ('Resolved', 'Closed')) as high_priority_count
      FROM helpdesk_tickets;
    `;
    const summaryResult = await pool.query(summaryQuery);
    const sumRow = summaryResult.rows[0];

    const summary = {
      total: parseInt(sumRow.total || 0, 10),
      open: parseInt(sumRow.open_count || 0, 10),
      inProgress: parseInt(sumRow.in_progress_count || 0, 10),
      resolved: parseInt(sumRow.resolved_count || 0, 10),
      highPriority: parseInt(sumRow.high_priority_count || 0, 10),
    };

    return res.json({
      success: true,
      tickets: dataResult.rows.map(formatTicket),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      summary,
    });
  } catch (err) {
    console.error('Error querying tickets:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve support tickets.' });
  }
});

/**
 * GET /api/helpdesk/:id
 * Retrieve a specific ticket by id or ticket_no
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT * FROM helpdesk_tickets
      WHERE id = $1 OR ticket_no = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Ticket "${id}" not found.` });
    }

    return res.json({
      success: true,
      ticket: formatTicket(result.rows[0]),
    });
  } catch (err) {
    console.error('Error fetching ticket details:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ticket details.' });
  }
});

/**
 * POST /api/helpdesk
 * Create a new support ticket with validation and audit history
 */
router.post('/', async (req, res) => {
  try {
    const {
      subject,
      customerName,
      customerId,
      priority = 'Medium',
      status = 'Open',
      assignedAgent = 'Support Desk',
      category = 'General',
      description = '',
    } = req.body;

    // Validation
    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Ticket subject is required and must be at least 3 characters long.',
      });
    }

    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Customer / Company name is required.',
      });
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

    const effectivePriority = validPriorities.includes(priority) ? priority : 'Medium';
    const effectiveStatus = validStatuses.includes(status) ? status : 'Open';

    // Generate unique ID and sequential ticket number
    const id = `TCK-${Date.now()}`;
    const seqResult = await pool.query(`SELECT COUNT(*) as count FROM helpdesk_tickets;`);
    const nextSeq = parseInt(seqResult.rows[0].count, 10) + 8092;
    const ticketNo = `HD-${nextSeq}`;

    const author = req.user?.name || 'Support Staff';
    const initialHistory = [
      {
        id: `ACT-${Date.now()}-1`,
        action: 'Created',
        author,
        timestamp: new Date().toISOString(),
        note: 'Ticket created via Support Helpdesk portal',
      }
    ];

    const insertQuery = `
      INSERT INTO helpdesk_tickets (
        id,
        ticket_no,
        subject,
        customer_name,
        customer_id,
        priority,
        status,
        assigned_agent,
        category,
        description,
        created_at,
        updated_at,
        history
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
      RETURNING *;
    `;

    const values = [
      id,
      ticketNo,
      subject.trim(),
      customerName.trim(),
      customerId || null,
      effectivePriority,
      effectiveStatus,
      assignedAgent ? assignedAgent.trim() : 'Support Desk',
      category ? category.trim() : 'General',
      description ? description.trim() : '',
      JSON.stringify(initialHistory),
    ];

    const result = await pool.query(insertQuery, values);
    const createdTicket = formatTicket(result.rows[0]);

    return res.status(201).json({
      success: true,
      ticket: createdTicket,
      message: `Ticket ${ticketNo} created successfully.`,
    });
  } catch (err) {
    console.error('Error creating ticket:', err);
    return res.status(500).json({ success: false, message: 'Failed to create support ticket.' });
  }
});

/**
 * PATCH /api/helpdesk/:id
 * Update status, priority, assignee, or add resolution notes with audit trail
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedAgent,
      resolutionNotes,
      description,
      note,
    } = req.body;

    const findResult = await pool.query(
      `SELECT * FROM helpdesk_tickets WHERE id = $1 OR ticket_no = $1 LIMIT 1;`,
      [id]
    );

    if (findResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Ticket "${id}" not found.` });
    }

    const current = findResult.rows[0];
    const author = req.user?.name || 'Support Staff';

    const currentHistory = Array.isArray(current.history)
      ? current.history
      : (typeof current.history === 'string' ? JSON.parse(current.history) : []);

    const newHistoryEntries = [];

    if (status && status !== current.status) {
      newHistoryEntries.push({
        id: `ACT-${Date.now()}-status`,
        action: 'Status Changed',
        author,
        timestamp: new Date().toISOString(),
        note: `Status updated from "${current.status}" to "${status}"`,
      });
    }

    if (priority && priority !== current.priority) {
      newHistoryEntries.push({
        id: `ACT-${Date.now()}-priority`,
        action: 'Priority Changed',
        author,
        timestamp: new Date().toISOString(),
        note: `Priority updated from "${current.priority}" to "${priority}"`,
      });
    }

    if (assignedAgent && assignedAgent !== current.assigned_agent) {
      newHistoryEntries.push({
        id: `ACT-${Date.now()}-assigned`,
        action: 'Reassigned',
        author,
        timestamp: new Date().toISOString(),
        note: `Reassigned from "${current.assigned_agent}" to "${assignedAgent}"`,
      });
    }

    if (resolutionNotes && resolutionNotes !== current.resolution_notes) {
      newHistoryEntries.push({
        id: `ACT-${Date.now()}-resolution`,
        action: 'Resolution Updated',
        author,
        timestamp: new Date().toISOString(),
        note: `Resolution notes logged: ${resolutionNotes.slice(0, 100)}...`,
      });
    }

    if (note && newHistoryEntries.length === 0) {
      newHistoryEntries.push({
        id: `ACT-${Date.now()}-note`,
        action: 'Note Added',
        author,
        timestamp: new Date().toISOString(),
        note,
      });
    }

    const updatedHistory = [...currentHistory, ...newHistoryEntries];

    const updateQuery = `
      UPDATE helpdesk_tickets
      SET
        status = COALESCE($1, status),
        priority = COALESCE($2, priority),
        assigned_agent = COALESCE($3, assigned_agent),
        resolution_notes = COALESCE($4, resolution_notes),
        description = COALESCE($5, description),
        updated_at = NOW(),
        history = $6
      WHERE id = $7
      RETURNING *;
    `;

    const updateValues = [
      status || null,
      priority || null,
      assignedAgent || null,
      resolutionNotes !== undefined ? resolutionNotes : null,
      description !== undefined ? description : null,
      JSON.stringify(updatedHistory),
      current.id,
    ];

    const updateResult = await pool.query(updateQuery, updateValues);
    const updatedTicket = formatTicket(updateResult.rows[0]);

    return res.json({
      success: true,
      ticket: updatedTicket,
      message: `Ticket ${current.ticket_no} updated successfully.`,
    });
  } catch (err) {
    console.error('Error updating ticket:', err);
    return res.status(500).json({ success: false, message: 'Failed to update support ticket.' });
  }
});


/**
 * DELETE /api/helpdesk/:id
 * Delete a ticket
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM helpdesk_tickets WHERE id = $1 OR ticket_no = $1 RETURNING *;',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    return res.json({ success: true, message: 'Ticket deleted successfully.' });
  } catch (err) {
    console.error('Error deleting ticket:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete ticket.' });
  }
});

export default router;
