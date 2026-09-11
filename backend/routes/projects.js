import express from 'express';
import { crmPool, hrmsPool } from '../db/pool.js';

const router = express.Router();

// GET /api/projects — Fetch all projects with weightage, repo, and dates
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
    const result = await crmPool.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id — Fetch single project by ID, code, or name
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await crmPool.query(
      `SELECT * FROM projects WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($1) LIMIT 1`,
      [id]
    );
    if (result.rows.length === 0) {
      // Fallback check in HRMS pool
      const hrmsRes = await hrmsPool.query(
        `SELECT * FROM projects WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($1) LIMIT 1`,
        [id]
      );
      if (hrmsRes.rows.length > 0) {
        return res.json({ success: true, data: hrmsRes.rows[0] });
      }
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id/workspace — Complete dynamic project workspace data
router.get('/:id/workspace', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch Project
    let projRes = await crmPool.query(
      `SELECT * FROM projects WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($1) LIMIT 1`,
      [id]
    );
    if (projRes.rows.length === 0) {
      projRes = await hrmsPool.query(
        `SELECT * FROM projects WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($1) LIMIT 1`,
        [id]
      );
    }
    if (projRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const project = projRes.rows[0];

    // 2. Fetch Groups & Members
    const groupsRes = await hrmsPool.query(
      `SELECT 
        g.id,
        g.name,
        g.project_id,
        g.team_head_id,
        g.team_head_name,
        g.description,
        COALESCE(
          json_agg(
            json_build_object(
              'employeeId', gm.employee_id,
              'employeeName', COALESCE(e.name, gm.employee_name),
              'designation', COALESCE(e.designation, 'Specialist'),
              'department', COALESCE(e.department, 'Engineering'),
              'role', gm.role,
              'isTeamHead', (gm.employee_id = g.team_head_id)
            )
          ) FILTER (WHERE gm.id IS NOT NULL), '[]'::json
        ) as members
       FROM project_groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       LEFT JOIN employees e ON (gm.employee_id = e.emp_code OR gm.employee_id = e.id)
       WHERE g.project_id = $1 OR g.project_id = $2
       GROUP BY g.id, g.name, g.project_id, g.team_head_id, g.team_head_name, g.description`,
      [project.id, project.code]
    );

    // 3. Fetch Tasks for this project
    const tasksRes = await hrmsPool.query(
      `SELECT 
        t.*,
        COALESCE(t.task_weightage, 25.0) as task_weightage,
        COALESCE(t.progress_percent, 0) as progress_percent,
        t.assignment_type,
        t.group_id,
        t.group_name
       FROM tasks t
       WHERE t.project_id = $1 OR t.project_id = $2 OR LOWER(t.project_name) = LOWER($3)
       ORDER BY t.created_at DESC`,
      [project.id, project.code, project.name]
    );

    const tasks = tasksRes.rows;

    // 4. Calculate dynamic overall progress using task weightages
    const totalWeightage = tasks.reduce((sum, t) => sum + (Number(t.task_weightage) || 0), 0);
    const weightedProgressSum = tasks.reduce((sum, t) => {
      const weight = Number(t.task_weightage) || 0;
      const prog = Number(t.progress_percent) || (t.status === 'COMPLETED' ? 100 : 0);
      return sum + (prog * (weight / 100));
    }, 0);

    const overallProgress = totalWeightage > 0 
      ? Math.min(100, Math.round((weightedProgressSum / (totalWeightage / 100))))
      : (tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress_percent || 0), 0) / tasks.length) : 0);

    // Task counts by status
    const taskSummary = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length,
      readyForReview: tasks.filter(t => t.status === 'READY_FOR_REVIEW' || t.status === 'SUBMITTED').length,
      changesRequested: tasks.filter(t => t.status === 'CHANGES_REQUESTED' || t.status === 'REOPENED').length
    };

    // 5. Team member progress map
    const memberProgressMap = {};
    for (const t of tasks) {
      const empId = t.assigned_to_employee_id || t.assigned_to;
      const empName = t.assigned_to_name || empId;
      if (empId) {
        if (!memberProgressMap[empId]) {
          memberProgressMap[empId] = { employeeId: empId, name: empName, taskCount: 0, totalProgress: 0 };
        }
        memberProgressMap[empId].taskCount += 1;
        memberProgressMap[empId].totalProgress += Number(t.progress_percent) || (t.status === 'COMPLETED' ? 100 : 0);
      }
    }

    const memberProgressList = Object.values(memberProgressMap).map((m) => ({
      ...m,
      averageProgress: Math.round(m.totalProgress / m.taskCount)
    }));

    res.json({
      success: true,
      data: {
        project: {
          ...project,
          overallProgress,
          weightage: Number(project.weightage) || 100.0,
          repositoryUrl: project.repository_url || 'https://github.com/company/' + (project.code ? project.code.toLowerCase() : 'project')
        },
        groups: groupsRes.rows,
        tasks,
        taskSummary,
        memberProgress: memberProgressList
      }
    });
  } catch (err) {
    console.error('Error fetching project workspace:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects — Create a new project (synced to both CRM and HRMS)
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
    status,
    weightage,
    repositoryUrl
  } = req.body;

  try {
    const projectId = id || `PRJ-${Date.now().toString().slice(-4)}`;
    const projectCode = code || projectId;

    const query = `
      INSERT INTO projects (
        id, code, name, client, customer_id, source_lead_id, source_opportunity_id,
        project_requirement, project_notes, project_manager, start_date, end_date,
        budget, spent, progress, status, weightage, repository_url, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        client = EXCLUDED.client,
        project_requirement = EXCLUDED.project_requirement,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        weightage = EXCLUDED.weightage,
        repository_url = EXCLUDED.repository_url
      RETURNING *
    `;

    const values = [
      projectId,
      projectCode,
      name,
      client || 'Internal Enterprise',
      customerId || null,
      sourceLeadId || null,
      sourceOpportunityId || null,
      projectRequirement || null,
      projectNotes || null,
      projectManager || 'Sarah Jenkins',
      startDate || null,
      endDate || null,
      budget || 0,
      spent || 0,
      progress || 0,
      status || 'In Progress',
      weightage || 100.0,
      repositoryUrl || null
    ];

    const result = await crmPool.query(query, values);
    // Mirror to HRMS pool
    await hrmsPool.query(query, values).catch(e => console.warn('HRMS project sync notice:', e.message));

    if (sourceLeadId) {
      await crmPool.query(
        `UPDATE leads SET project_id = $1, is_project_created = true, project_created_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [projectId, sourceLeadId]
      ).catch(() => {});
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
    const result = await crmPool.query(
      `UPDATE projects SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    
    // Mirror to HRMS pool
    await hrmsPool.query(
      `UPDATE projects SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      values
    ).catch(() => {});

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
    await crmPool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    await hrmsPool.query('DELETE FROM projects WHERE id = $1', [req.params.id]).catch(() => {});
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
