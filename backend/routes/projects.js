import express from 'express';
import { crmPool as pool } from '../db/pool.js';

const router = express.Router();

// GET /api/projects — Fetch all projects
router.get('/', async (req, res) => {
  try {
    const { status, clientId, customerId, sourceLeadId } = req.query;
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
    if (sourceLeadId) {
      params.push(sourceLeadId);
      query += ` AND source_lead_id = $${params.length}`;
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

// Helper function to create project with business validations & create-or-reuse logic
async function createProjectHandler(req, res) {
  const {
    id,
    code,
    name,
    client: clientParam,
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
    status,
    priority,
  } = req.body;

  const dbClient = await pool.connect();

  try {
    // If originated from a Lead, perform validation and create-or-reuse resolution inside transaction
    if (sourceLeadId) {
      const leadCheck = await dbClient.query('SELECT * FROM leads WHERE id = $1', [sourceLeadId]);
      if (leadCheck.rows.length === 0) {
        dbClient.release();
        return res.status(404).json({ success: false, message: `Originating lead "${sourceLeadId}" not found.` });
      }

      const lead = leadCheck.rows[0];
      if (lead.stage !== 'Won') {
        dbClient.release();
        return res.status(400).json({
          success: false,
          message: 'Only Won Leads can create a Project.'
        });
      }

      if (lead.is_project_created && lead.project_id) {
        // Double check project existence in database
        const pCheck = await dbClient.query('SELECT id, name FROM projects WHERE id = $1', [lead.project_id]);
        if (pCheck.rows.length > 0) {
          dbClient.release();
          return res.status(400).json({
            success: false,
            projectId: lead.project_id,
            message: 'This Won Lead already has a Project.'
          });
        }
      }

      // Begin atomic transaction for create-or-reuse + project creation
      await dbClient.query('BEGIN');

      const timestamp = Date.now();
      const isoToday = new Date().toISOString().split('T')[0];

      // 1. Resolve or Create Customer
      let resolvedCustId = customerId || lead.converted_to_customer_id;
      let resolvedCustName = clientParam || lead.company || lead.name;

      if (resolvedCustId) {
        const custRes = await dbClient.query('SELECT id, customer_name FROM customers WHERE id = $1', [resolvedCustId]);
        if (custRes.rows.length > 0) {
          resolvedCustId = custRes.rows[0].id;
          resolvedCustName = custRes.rows[0].customer_name;
        } else {
          resolvedCustId = null;
        }
      }

      if (!resolvedCustId) {
        const searchName = (lead.company || lead.name || '').trim();
        const searchEmail = (lead.email || '').trim();
        const custMatch = await dbClient.query(
          `SELECT id, customer_name FROM customers 
           WHERE (LOWER(TRIM(customer_name)) = LOWER(TRIM($1)) AND TRIM($1) != '') 
              OR (contact_email IS NOT NULL AND LOWER(TRIM(contact_email)) = LOWER(TRIM($2)) AND TRIM($2) != '')
           LIMIT 1`,
          [searchName, searchEmail]
        );

        if (custMatch.rows.length > 0) {
          resolvedCustId = custMatch.rows[0].id;
          resolvedCustName = custMatch.rows[0].customer_name;
        } else {
          // Create new Customer
          resolvedCustId = `CUST-${timestamp}`;
          resolvedCustName = searchName || `Customer-${timestamp}`;
          await dbClient.query(
            `INSERT INTO customers (
              id, customer_code, customer_name, customer_type, industry, owner_id,
              status, credit_limit, contact_name, contact_email, contact_phone,
              billing_city, billing_country, converted_from_lead_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'Active', 0, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              resolvedCustId,
              resolvedCustId,
              resolvedCustName,
              lead.company ? 'Company' : 'Individual',
              lead.industry || null,
              lead.assigned_to || null,
              lead.contact_person || lead.decision_maker || lead.name,
              lead.email || null,
              lead.phone || null,
              lead.city || null,
              lead.country || null,
              lead.id
            ]
          );
        }
      }

      // 2. Resolve or Create Contact
      let resolvedContId = lead.converted_to_contact_id;
      if (resolvedContId) {
        const contRes = await dbClient.query('SELECT id FROM contacts WHERE id = $1', [resolvedContId]);
        if (contRes.rows.length === 0) {
          resolvedContId = null;
        }
      }

      if (!resolvedContId) {
        const contMatch = await dbClient.query(
          `SELECT id FROM contacts 
           WHERE lead_id = $1 
              OR (customer_id = $2 AND email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM($3)) AND TRIM($3) != '')
           LIMIT 1`,
          [lead.id, resolvedCustId, lead.email || '']
        );

        if (contMatch.rows.length > 0) {
          resolvedContId = contMatch.rows[0].id;
        } else {
          // Create new Contact
          resolvedContId = `CON-${timestamp}`;
          await dbClient.query(
            `INSERT INTO contacts (
              id, name, email, phone, company, customer_id, lead_id, title,
              contact_role, alternate_phone, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              resolvedContId,
              lead.contact_person || lead.decision_maker || lead.name,
              lead.email || null,
              lead.phone || null,
              resolvedCustName,
              resolvedCustId,
              lead.id,
              lead.designation || 'Primary Contact',
              lead.contact_role || 'Decision Maker',
              lead.alternate_phone || null
            ]
          );
        }
      }

      // 3. Resolve or Create Opportunity
      let resolvedOppId = sourceOpportunityId || lead.converted_to_opportunity_id;
      if (resolvedOppId) {
        const oppRes = await dbClient.query('SELECT id FROM opportunities WHERE id = $1', [resolvedOppId]);
        if (oppRes.rows.length === 0) {
          resolvedOppId = null;
        }
      }

      if (!resolvedOppId) {
        const oppMatch = await dbClient.query(
          `SELECT id FROM opportunities WHERE customer_id = $1 AND stage = 'Won' LIMIT 1`,
          [resolvedCustId]
        );

        if (oppMatch.rows.length > 0) {
          resolvedOppId = oppMatch.rows[0].id;
        } else {
          // Create new Opportunity
          resolvedOppId = `OPP-${timestamp}`;
          const oppSummary = lead.requirement
            ? (lead.requirement.length > 40 ? lead.requirement.slice(0, 37).trim() + '...' : lead.requirement.trim())
            : 'Implementation';
          const oppName = lead.company ? `${lead.company} - ${oppSummary}` : `${lead.name} - Implementation`;

          await dbClient.query(
            `INSERT INTO opportunities (
              id, name, customer_id, customer_name, value, probability, expected_close,
              owner, stage, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 100, $6, $7, 'Won', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              resolvedOppId,
              oppName,
              resolvedCustId,
              resolvedCustName,
              parseFloat(budget) || parseFloat(lead.final_agreed_amount) || parseFloat(lead.value) || 0,
              startDate || lead.won_date || lead.expected_close_date || isoToday,
              lead.assigned_to || null
            ]
          );
        }
      }

      // 4. Create Project
      const projectId = id || `PRJ-${Date.now().toString().slice(-4)}`;
      const projectCode = code || projectId;
      const finalProjectName = name || `${resolvedCustName} - Implementation`;

      const projectRes = await dbClient.query(
        `INSERT INTO projects (
          id, code, name, client, customer_id, source_lead_id, source_opportunity_id,
          project_requirement, project_notes, project_manager, start_date, end_date,
          budget, spent, progress, status, priority, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *`,
        [
          projectId,
          projectCode,
          finalProjectName,
          resolvedCustName,
          resolvedCustId,
          lead.id,
          resolvedOppId,
          projectRequirement !== undefined ? projectRequirement : (lead.requirement || null),
          projectNotes !== undefined ? projectNotes : (lead.notes || null),
          projectManager || lead.assigned_to || null,
          startDate || lead.won_date || isoToday,
          endDate || lead.expected_close_date || null,
          budget !== undefined ? budget : (lead.final_agreed_amount || lead.value || 0),
          spent || 0,
          progress || 0,
          status || 'Not Started',
          priority || 'Medium',
        ]
      );

      // 5. Update Lead with Project reference and resolved Customer, Contact, Opportunity
      await dbClient.query(
        `UPDATE leads SET
          converted_to_customer_id = $1,
          converted_to_contact_id = $2,
          converted_to_opportunity_id = $3,
          is_converted = true,
          converted_at = COALESCE(converted_at, CURRENT_TIMESTAMP),
          project_id = $4,
          is_project_created = true,
          project_created_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5`,
        [resolvedCustId, resolvedContId, resolvedOppId, projectId, lead.id]
      );

      await dbClient.query('COMMIT');
      dbClient.release();

      return res.status(201).json({
        success: true,
        data: projectRes.rows[0],
        customerId: resolvedCustId,
        contactId: resolvedContId,
        opportunityId: resolvedOppId,
        leadId: lead.id,
        message: 'Project created successfully.'
      });
    }

    // Standalone project creation without Lead
    const projectId = id || `PRJ-${Date.now().toString().slice(-4)}`;
    const projectCode = code || projectId;

    const result = await dbClient.query(
      `INSERT INTO projects (
        id, code, name, client, customer_id, source_lead_id, source_opportunity_id,
        project_requirement, project_notes, project_manager, start_date, end_date,
        budget, spent, progress, status, priority, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *`,
      [
        projectId,
        projectCode,
        name,
        clientParam,
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
        status || 'Not Started',
        priority || 'Medium',
      ]
    );

    dbClient.release();
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    try {
      await dbClient.query('ROLLBACK');
    } catch (rbErr) {
      // Ignore rollback errors if already closed
    }
    dbClient.release();
    console.error('❌ Error creating project:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to create project.' });
  }
}

// POST /api/projects — Create a new project
router.post('/', createProjectHandler);

// POST /api/projects/from-lead/:leadId — Dedicated creation endpoint
router.post('/from-lead/:leadId', async (req, res) => {
  req.body.sourceLeadId = req.params.leadId;
  return createProjectHandler(req, res);
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
  const { id } = req.params;
  try {
    // If project was linked to a lead, reset the lead's project flags
    await pool.query(
      `UPDATE leads SET project_id = NULL, is_project_created = false, project_created_at = NULL WHERE project_id = $1`,
      [id]
    );

    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
