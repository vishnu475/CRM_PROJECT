/**
 * Project Allocations API Route
 * Handles proper Project → Employee → Module allocation management
 */
import express from 'express';
import { hrmsPool as pool } from '../db/pool.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/allocations?projectId=&employeeId=
// Returns allocations filtered by project and/or employee
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { projectId, employeeId, status } = req.query;

    let query = `
      SELECT 
        pa.*,
        p.client,
        p.start_date,
        p.end_date,
        p.status as project_status,
        p.project_manager,
        m.description as module_description,
        -- Live task stats from tasks table
        COALESCE(tc.total_tasks, 0) as total_tasks,
        COALESCE(tc.completed_tasks, 0) as completed_tasks,
        COALESCE(tc.inprogress_tasks, 0) as inprogress_tasks,
        COALESCE(tc.avg_progress, 0) as completion_percentage,
        -- Testing request info
        tr.id as testing_request_id,
        tr.status as testing_status,
        tr.submitted_for_testing_at
      FROM project_allocations pa
      LEFT JOIN projects p ON pa.project_id = p.id
      LEFT JOIN modules m ON pa.module_id = m.id
      LEFT JOIN (
        SELECT 
          allocation_id,
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' OR COALESCE(progress_percent, 0) >= 100) as completed_tasks,
          COUNT(*) FILTER (WHERE UPPER(status) = 'IN_PROGRESS' AND COALESCE(progress_percent, 0) < 100) as inprogress_tasks,
          ROUND(COALESCE(AVG(COALESCE(progress_percent, 0)), 0), 1) as avg_progress
        FROM tasks
        WHERE allocation_id IS NOT NULL
        GROUP BY allocation_id
      ) tc ON pa.id = tc.allocation_id
      LEFT JOIN testing_requests tr ON pa.id = tr.allocation_id
      WHERE 1=1
    `;

    const params = [];
    if (projectId) { params.push(projectId); query += ` AND pa.project_id = $${params.length}`; }
    if (employeeId) { params.push(employeeId); query += ` AND pa.employee_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND pa.allocation_status = $${params.length}`; }

    query += ' ORDER BY pa.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching allocations:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/allocations/employee/:employeeId
// Returns all projects/modules allocated to a specific employee (for My Tasks view)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(`
      SELECT 
        pa.*,
        p.client,
        p.start_date,
        p.end_date,
        p.status as project_status,
        p.project_manager,
        p.priority as project_priority,
        m.description as module_description,
        -- Live task stats
        COALESCE(tc.total_tasks, 0) as total_tasks,
        COALESCE(tc.completed_tasks, 0) as completed_tasks,
        COALESCE(tc.inprogress_tasks, 0) as inprogress_tasks,
        COALESCE(tc.todo_tasks, 0) as todo_tasks,
        COALESCE(tc.avg_progress, 0) as completion_percentage,
        -- Testing request info
        tr.id as testing_request_id,
        tr.status as testing_status,
        tr.submitted_for_testing_at,
        -- Testing document info
        td.id as testing_document_id,
        td.document_name as testing_document_name,
        td.final_verdict as testing_document_verdict,
        td.report_status as testing_document_status,
        td.tester_employee_name as testing_document_tester
      FROM project_allocations pa
      LEFT JOIN projects p ON pa.project_id = p.id
      LEFT JOIN modules m ON pa.module_id = m.id
      LEFT JOIN (
        SELECT 
          allocation_id,
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' OR COALESCE(progress_percent, 0) >= 100) as completed_tasks,
          COUNT(*) FILTER (WHERE UPPER(status) = 'IN_PROGRESS' AND COALESCE(progress_percent, 0) < 100) as inprogress_tasks,
          COUNT(*) FILTER (WHERE UPPER(status) = 'TODO') as todo_tasks,
          ROUND(COALESCE(AVG(COALESCE(progress_percent, 0)), 0), 1) as avg_progress
        FROM tasks
        WHERE allocation_id IS NOT NULL
        GROUP BY allocation_id
      ) tc ON pa.id = tc.allocation_id
      LEFT JOIN testing_requests tr ON pa.id = tr.allocation_id
      LEFT JOIN testing_documents td ON tr.id = td.testing_request_id AND td.report_status = 'SUBMITTED'
      WHERE pa.employee_id = $1 AND pa.allocation_status = 'ACTIVE'
      ORDER BY pa.created_at DESC
    `, [employeeId]);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching employee allocations:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/allocations/project/:projectId
// Returns all employees/modules allocated to a project (for Team Roster)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(`
      SELECT 
        pa.*,
        p.client,
        p.start_date,
        p.end_date,
        p.status as project_status,
        p.project_manager,
        m.description as module_description,
        COALESCE(tc.total_tasks, 0) as total_tasks,
        COALESCE(tc.completed_tasks, 0) as completed_tasks,
        COALESCE(tc.inprogress_tasks, 0) as inprogress_tasks,
        COALESCE(tc.avg_progress, 0) as completion_percentage,
        tr.id as testing_request_id,
        tr.status as testing_status,
        tr.submitted_for_testing_at
      FROM project_allocations pa
      LEFT JOIN projects p ON pa.project_id = p.id
      LEFT JOIN modules m ON pa.module_id = m.id
      LEFT JOIN (
        SELECT 
          allocation_id,
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' OR COALESCE(progress_percent, 0) >= 100) as completed_tasks,
          COUNT(*) FILTER (WHERE UPPER(status) = 'IN_PROGRESS' AND COALESCE(progress_percent, 0) < 100) as inprogress_tasks,
          ROUND(COALESCE(AVG(COALESCE(progress_percent, 0)), 0), 1) as avg_progress
        FROM tasks
        WHERE allocation_id IS NOT NULL
        GROUP BY allocation_id
      ) tc ON pa.id = tc.allocation_id
      LEFT JOIN testing_requests tr ON pa.id = tr.allocation_id
      WHERE pa.project_id = $1 AND pa.allocation_status = 'ACTIVE'
      ORDER BY pa.created_at ASC
    `, [projectId]);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching project allocations:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/allocations/:id
// Returns a single allocation with tasks and testing request
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const allocResult = await pool.query(`
      SELECT pa.*, p.client, p.start_date, p.end_date, p.project_manager,
        m.description as module_description
      FROM project_allocations pa
      LEFT JOIN projects p ON pa.project_id = p.id
      LEFT JOIN modules m ON pa.module_id = m.id
      WHERE pa.id = $1
    `, [id]);

    if (allocResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const allocation = allocResult.rows[0];

    // Fetch tasks for this allocation
    const tasksResult = await pool.query(`
      SELECT * FROM tasks WHERE allocation_id = $1 ORDER BY created_at ASC
    `, [id]);

    const tasks = tasksResult.rows;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Fetch testing request
    const trResult = await pool.query(`
      SELECT * FROM testing_requests WHERE allocation_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [id]);

    // Fetch testing document if exists
    let testingDocument = null;
    if (trResult.rows[0]) {
      const tdResult = await pool.query(`
        SELECT * FROM testing_documents WHERE testing_request_id = $1 ORDER BY created_at DESC LIMIT 1
      `, [trResult.rows[0].id]);
      testingDocument = tdResult.rows[0] || null;
    }

    res.json({
      success: true,
      data: {
        allocation,
        tasks,
        totalTasks,
        completedTasks,
        completionPercentage: completionPct,
        testingRequest: trResult.rows[0] || null,
        testingDocument
      }
    });
  } catch (err) {
    console.error('Error fetching allocation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/allocations
// Create a new project allocation (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      projectId, projectName, employeeId, employeeName,
      moduleId, moduleName, role, tasks: taskList
    } = req.body;

    if (!projectId || !employeeId || !moduleId) {
      return res.status(400).json({ success: false, message: 'projectId, employeeId, and moduleId are required' });
    }

    // Verify project exists
    const projCheck = await pool.query('SELECT id, name FROM projects WHERE id = $1', [projectId]);
    if (projCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Project ${projectId} not found` });
    }

    const project = projCheck.rows[0];

    // Verify employee exists
    const empCheck = await pool.query(
      'SELECT emp_code, id, name FROM employees WHERE emp_code = $1 OR id = $1 LIMIT 1',
      [employeeId]
    );
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Employee ${employeeId} not found` });
    }
    const emp = empCheck.rows[0];

    // Verify module exists
    const modCheck = await pool.query('SELECT id, name FROM modules WHERE id = $1 LIMIT 1', [moduleId]);
    if (modCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Module ${moduleId} not found` });
    }
    const mod = modCheck.rows[0];

    const allocId = `ALLOC-${projectId}-${emp.emp_code || emp.id}-${moduleId}`;
    const resolvedEmpId = emp.emp_code || emp.id;

    // Create allocation
    const allocResult = await pool.query(`
      INSERT INTO project_allocations (
        id, project_id, project_name, employee_id, employee_name,
        module_id, module_name, role, allocation_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (project_id, employee_id, module_id) DO UPDATE SET
        role = EXCLUDED.role,
        allocation_status = 'ACTIVE',
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      allocId, projectId, projectName || project.name,
      resolvedEmpId, employeeName || emp.name,
      moduleId, moduleName || mod.name,
      role || 'Developer'
    ]);

    const allocation = allocResult.rows[0];

    // Create tasks if provided
    const createdTasks = [];
    if (taskList && Array.isArray(taskList)) {
      for (let i = 0; i < taskList.length; i++) {
        const task = taskList[i];
        const taskId = `TSK-${moduleId.replace('MOD-', '')}-${Date.now()}-${i}`;
        const taskRes = await pool.query(`
          INSERT INTO tasks (
            id, title, description, project_id, project_name, module_id, module_name,
            assigned_to, assigned_to_employee_id, assigned_to_name,
            status, progress_percent, priority, allocation_id, employee_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, 'TODO', 0, $10, $11, $8, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
          RETURNING *
        `, [
          taskId, task.title, task.description || null,
          projectId, projectName || project.name,
          moduleId, moduleName || mod.name,
          resolvedEmpId, employeeName || emp.name,
          task.priority || 'Medium',
          allocId
        ]);
        if (taskRes.rows[0]) createdTasks.push(taskRes.rows[0]);
      }
    }

    res.status(201).json({
      success: true,
      message: `Employee allocated to ${moduleName || mod.name} module in ${projectName || project.name}`,
      data: { allocation, tasksCreated: createdTasks.length, tasks: createdTasks }
    });
  } catch (err) {
    console.error('Error creating allocation:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/allocations/:id
// Update allocation (role, status)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, allocationStatus } = req.body;

    const result = await pool.query(`
      UPDATE project_allocations SET
        role = COALESCE($1, role),
        allocation_status = COALESCE($2, allocation_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [role, allocationStatus, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/allocations/:id
// Remove an allocation (also removes employee's tasks if specified)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { removeTasksToo } = req.query;

    const allocResult = await pool.query('SELECT * FROM project_allocations WHERE id = $1', [id]);
    if (allocResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const alloc = allocResult.rows[0];

    if (removeTasksToo === 'true') {
      await pool.query('DELETE FROM tasks WHERE allocation_id = $1', [id]);
    }

    // Soft delete: set to REMOVED
    await pool.query(`
      UPDATE project_allocations SET allocation_status = 'REMOVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: `${alloc.employee_name} removed from ${alloc.module_name} in ${alloc.project_name}`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/allocations/:id/submit-for-testing
// Employee submits module for testing (only when 100% complete)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/submit-for-testing', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, requestedTesterId } = req.body;

    // Get allocation
    const allocResult = await pool.query('SELECT * FROM project_allocations WHERE id = $1', [id]);
    if (allocResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }
    const alloc = allocResult.rows[0];

    // Calculate live completion from tasks
    const taskStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED') as completed
      FROM tasks WHERE allocation_id = $1
    `, [id]);

    const total = parseInt(taskStats.rows[0]?.total, 10) || 0;
    const completed = parseInt(taskStats.rows[0]?.completed, 10) || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (total === 0) {
      return res.status(400).json({ success: false, message: 'No tasks assigned to this allocation. Cannot submit for testing.' });
    }

    if (pct < 100) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit for testing. Progress is ${pct}% (${completed}/${total} tasks completed). All tasks must be completed (100%) before submitting for testing.`
      });
    }

    // Check if testing request already exists
    const existingTr = await pool.query(
      'SELECT * FROM testing_requests WHERE allocation_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    if (existingTr.rows[0] && ['READY_FOR_TESTING', 'TESTING_IN_PROGRESS', 'TESTING_PASSED', 'APPROVED'].includes(existingTr.rows[0].status)) {
      return res.status(400).json({
        success: false,
        message: `Testing request already exists (${existingTr.rows[0].id}) with status: ${existingTr.rows[0].status}`,
        data: existingTr.rows[0]
      });
    }

    // Create testing request
    const trId = `TR-${alloc.project_id}-${alloc.module_id.replace('MOD-', '')}-${Date.now().toString().slice(-4)}`;

    const trResult = await pool.query(`
      INSERT INTO testing_requests (
        id, project_id, project_name, module_id, module_name,
        developer_employee_id, developer_employee_name,
        tester_employee_id, tester_employee_name,
        allocation_id, trigger_type,
        total_tasks, completed_tasks, pending_tasks, completion_percentage,
        status, submitted_date, submitted_for_testing_at, submit_note,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7,
        $8, $9,
        $10, 'MANUAL',
        $11, $12, 0, 100.00,
        'READY_FOR_TESTING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $13,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [
      trId, alloc.project_id, alloc.project_name,
      alloc.module_id, alloc.module_name,
      alloc.employee_id, alloc.employee_name,
      requestedTesterId || null, null,
      id,
      total, completed,
      note || `${alloc.employee_name} submitted ${alloc.module_name} for QA testing (${completed}/${total} tasks completed)`
    ]);

    const testingRequest = trResult.rows[0];
    if (!testingRequest) {
      return res.status(400).json({ success: false, message: 'Testing request already exists for this allocation' });
    }

    // Update module status
    await pool.query(
      "UPDATE modules SET status = 'READY_FOR_TESTING', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [alloc.module_id]
    );

    res.status(201).json({
      success: true,
      message: `${alloc.module_name} module submitted for testing successfully!`,
      data: testingRequest
    });
  } catch (err) {
    console.error('Error submitting for testing:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/allocations/:id/tasks
// Returns all tasks for a specific allocation
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;

    const tasks = await pool.query(`
      SELECT * FROM tasks WHERE allocation_id = $1 ORDER BY created_at ASC
    `, [id]);

    const total = tasks.rows.length;
    const completed = tasks.rows.filter(t => t.status === 'COMPLETED').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      count: total,
      completedCount: completed,
      completionPercentage: pct,
      data: tasks.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
