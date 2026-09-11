import express from 'express';
import { hrmsPool as pool } from '../db/pool.js';

const router = express.Router();

/**
 * GET /api/modules
 * Dynamic search query for modules from HRMS DB master data.
 * Does not return modules if search is empty unless explicitly requested with all=true.
 */
router.get('/', async (req, res) => {
  try {
    const { search, all } = req.query;

    if (!search && all !== 'true') {
      return res.json({ success: true, data: [] });
    }

    let query = `
      SELECT id, code, name, category, status, description, created_at
      FROM modules
      WHERE status = 'active'
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR category ILIKE $${params.length})`;
    }

    query += ` ORDER BY name ASC LIMIT 20`;

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/modules/employee/:employeeId
 * Fetch all modules currently assigned to an employee.
 */
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    // Resolve normalized emp_code
    const empRes = await pool.query(
      `SELECT emp_code, id, name FROM employees WHERE emp_code = $1 OR id = $1 LIMIT 1`,
      [employeeId]
    );
    const resolvedEmpId = empRes.rows[0]?.emp_code || empRes.rows[0]?.id || employeeId;

    const query = `
      SELECT 
        eam.id as assignment_id,
        eam.employee_id,
        eam.module_id as id,
        m.code,
        m.name,
        m.category,
        m.status,
        eam.created_at
      FROM employee_assigned_modules eam
      JOIN modules m ON eam.module_id = m.id
      WHERE (eam.employee_id = $1 OR eam.employee_id = $2)
        AND m.status = 'active'
      ORDER BY m.name ASC
    `;
    const result = await pool.query(query, [resolvedEmpId, employeeId]);

    res.json({
      success: true,
      employeeId: resolvedEmpId,
      employeeName: empRes.rows[0]?.name || '',
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching employee modules:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/modules
 * Create or ensure a module in the database by name/code.
 * Example: entering "ui page" creates/registers MOD-UI_PAGE in DB.
 */
router.post('/', async (req, res) => {
  try {
    const { name, code, category = 'Custom' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Module name is required.' });
    }
    const cleanName = name.trim();
    const cleanCode = (code || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'mod';

    // Check if module already exists by name, code, or ID
    const existing = await pool.query(
      `SELECT id, code, name, category, status FROM modules WHERE LOWER(name) = LOWER($1) OR code = $2 OR id = $3 LIMIT 1`,
      [cleanName, cleanCode, cleanName]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, data: existing.rows[0], message: 'Module already exists.' });
    }

    const newId = `MOD-${cleanCode.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const result = await pool.query(
      `INSERT INTO modules (id, code, name, category, status, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, code, name, category, status`,
      [newId, cleanCode, cleanName, category, `Module: ${cleanName}`]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Module registered successfully.' });
  } catch (err) {
    console.error('Error creating module:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/modules/employee/:employeeId
 * Assign selected module IDs against an employee ID.
 * Saves module IDs directly. If a custom module name (e.g. "ui page") is entered, it auto-registers it in modules table.
 */
router.post('/employee/:employeeId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { employeeId } = req.params;
    const { moduleIds = [], modules = [], teamId, team_id, role, employeeRole } = req.body;
    const targetTeamId = teamId || team_id || null;
    const targetRole = role || employeeRole || 'Member';

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    // Resolve employee code
    const empRes = await client.query(
      `SELECT emp_code, id, name, designation, department FROM employees WHERE emp_code = $1 OR id = $1 LIMIT 1`,
      [employeeId]
    );
    const resolvedEmpId = empRes.rows[0]?.emp_code || empRes.rows[0]?.id || employeeId;
    const employeeName = empRes.rows[0]?.name || resolvedEmpId;

    await client.query('BEGIN');

    // Remove existing assignments for this employee (or for this employee in this team if teamId given)
    await client.query(
      `DELETE FROM employee_assigned_modules WHERE employee_id = $1 OR employee_id = $2`,
      [resolvedEmpId, employeeId]
    );

    const insertedModules = [];

    // Deduplicate module items (combining moduleIds and any module objects)
    const rawList = [
      ...moduleIds,
      ...modules.map(m => (typeof m === 'string' ? m : m.id || m.name))
    ];
    const uniqueModuleEntries = Array.from(new Set(rawList.filter(Boolean)));

    for (let i = 0; i < uniqueModuleEntries.length; i++) {
      const entry = String(uniqueModuleEntries[i]).trim();
      if (!entry) continue;

      // 1. Try to find module by ID, code, or exact name
      let modRes = await client.query(
        `SELECT id, code, name FROM modules 
         WHERE id = $1 OR code = $1 OR LOWER(name) = LOWER($1) 
         LIMIT 1`,
        [entry]
      );

      let mod = modRes.rows[0];

      // 2. If not found, auto-create it in database so whatever module name entered is allocated!
      if (!mod) {
        const cleanName = entry;
        const cleanCode = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom_mod';
        const newModId = `MOD-${cleanCode.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

        const insertMod = await client.query(
          `INSERT INTO modules (id, code, name, category, status, description, created_at, updated_at)
           VALUES ($1, $2, $3, 'Custom', 'active', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (code) DO UPDATE SET status = 'active'
           RETURNING id, code, name`,
          [newModId, cleanCode, cleanName, `Module: ${cleanName}`]
        );
        mod = insertMod.rows[0];
      }

      if (mod) {
        const assignmentId = `EAM-${Date.now().toString(36).toUpperCase()}-${resolvedEmpId.replace(/[^a-zA-Z0-9]/g, '')}-${i}`;

        await client.query(
          `INSERT INTO employee_assigned_modules (id, employee_id, module_id, module_name, team_id, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (employee_id, module_id) DO UPDATE SET 
             module_name = EXCLUDED.module_name,
             team_id = EXCLUDED.team_id,
             role = EXCLUDED.role,
             updated_at = CURRENT_TIMESTAMP`,
          [assignmentId, resolvedEmpId, mod.id, mod.name, targetTeamId, targetRole]
        );

        insertedModules.push({
          id: mod.id,
          code: mod.code,
          name: mod.name
        });
      }
    }

    // Sync with group_members table if teamId is provided and valid in project_groups
    if (targetTeamId) {
      const grpCheck = await client.query('SELECT id FROM project_groups WHERE id = $1 LIMIT 1', [targetTeamId]);
      if (grpCheck.rows.length > 0) {
        const gmId = `GM-${targetTeamId}-${resolvedEmpId.replace(/[^a-zA-Z0-9]/g, '')}`;
        await client.query(
          `INSERT INTO group_members (id, group_id, employee_id, employee_name, role, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (group_id, employee_id) DO UPDATE SET 
             role = EXCLUDED.role,
             employee_name = EXCLUDED.employee_name`,
          [gmId, targetTeamId, resolvedEmpId, employeeName, targetRole]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Assigned ${insertedModules.length} module(s) to employee ${employeeName} (${resolvedEmpId}).`,
      employeeId: resolvedEmpId,
      assignedCount: insertedModules.length,
      data: insertedModules
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error assigning modules to employee:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/modules/group/:groupId
 * Fetch all assigned modules grouped by employee for all members of a group.
 */
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const query = `
      SELECT 
        gm.employee_id,
        eam.module_id as id,
        m.code,
        m.name,
        m.category
      FROM group_members gm
      JOIN employee_assigned_modules eam ON (gm.employee_id = eam.employee_id)
      JOIN modules m ON (eam.module_id = m.id)
      WHERE gm.group_id = $1 AND m.status = 'active'
      ORDER BY gm.employee_id, m.name ASC
    `;
    const result = await pool.query(query, [groupId]);

    const moduleMap = {};
    result.rows.forEach(row => {
      if (!moduleMap[row.employee_id]) {
        moduleMap[row.employee_id] = [];
      }
      moduleMap[row.employee_id].push({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category
      });
    });

    res.json({ success: true, data: moduleMap });
  } catch (err) {
    console.error('Error fetching group modules:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
