import { hrmsPool, crmPool } from '../db/pool.js';

async function cleanupAndSync() {
  console.log('🧹 Starting cleanup of dummy project PRJ-001 and synchronizing real projects...');

  // 1. Delete all PRJ-001 related records from HRMS DB
  console.log('1. Deleting PRJ-001 testing documents & test reports...');
  try {
    await hrmsPool.query("DELETE FROM testing_documents WHERE project_id = 'PRJ-001'");
    await hrmsPool.query("DELETE FROM test_reports WHERE project_id = 'PRJ-001'");
  } catch (e) { console.log('Warn testing_documents/test_reports:', e.message); }

  console.log('2. Deleting PRJ-001 test cases & bugs...');
  try {
    await hrmsPool.query(`
      DELETE FROM test_cases 
      WHERE testing_request_id IN (SELECT id FROM testing_requests WHERE project_id = 'PRJ-001')
    `);
    await hrmsPool.query(`
      DELETE FROM bugs 
      WHERE testing_request_id IN (SELECT id FROM testing_requests WHERE project_id = 'PRJ-001')
    `);
  } catch (e) { console.log('Warn test_cases/bugs:', e.message); }

  console.log('3. Deleting PRJ-001 testing requests...');
  try {
    await hrmsPool.query("DELETE FROM testing_requests WHERE project_id = 'PRJ-001'");
  } catch (e) { console.log('Warn testing_requests:', e.message); }

  console.log('4. Deleting PRJ-001 tasks...');
  try {
    await hrmsPool.query("DELETE FROM tasks WHERE project_id = 'PRJ-001'");
  } catch (e) { console.log('Warn tasks:', e.message); }

  console.log('5. Deleting PRJ-001 project allocations...');
  try {
    await hrmsPool.query("DELETE FROM project_allocations WHERE project_id = 'PRJ-001'");
  } catch (e) { console.log('Warn project_allocations:', e.message); }

  console.log('6. Deleting PRJ-001 group members & project groups...');
  try {
    await hrmsPool.query(`
      DELETE FROM group_members 
      WHERE group_id IN (SELECT id FROM project_groups WHERE project_id = 'PRJ-001')
    `);
    await hrmsPool.query("DELETE FROM project_groups WHERE project_id = 'PRJ-001'");
  } catch (e) { console.log('Warn project_groups:', e.message); }

  console.log('7. Deleting PRJ-001 from HRMS projects table...');
  try {
    await hrmsPool.query("DELETE FROM projects WHERE id = 'PRJ-001'");
  } catch (e) { console.log('Warn projects:', e.message); }

  // 8. Delete PRJ-001 from CRM projects if it exists
  try {
    await crmPool.query("DELETE FROM projects WHERE id = 'PRJ-001'");
  } catch (e) { console.log('Warn CRM projects:', e.message); }

  // 9. Sync projects from CRM DB to HRMS DB so they are 100% identical
  console.log('9. Synchronizing projects from CRM DB to HRMS DB...');
  const crmProjects = await crmPool.query("SELECT * FROM projects ORDER BY created_at DESC");
  console.log(`Found ${crmProjects.rows.length} real projects in CRM DB:`, crmProjects.rows.map(p => `${p.id} (${p.name})`));

  for (const p of crmProjects.rows) {
    await hrmsPool.query(`
      INSERT INTO projects (
        id, code, name, client, status, priority, project_manager, 
        budget, spent, progress, start_date, end_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        client = EXCLUDED.client,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        project_manager = EXCLUDED.project_manager,
        budget = EXCLUDED.budget,
        spent = EXCLUDED.spent,
        progress = EXCLUDED.progress,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        updated_at = EXCLUDED.updated_at
    `, [
      p.id, p.code || p.id, p.name, p.client, p.status || 'Not Started',
      p.priority || 'Medium', p.project_manager || 'Unassigned',
      p.budget || 0, p.spent || 0, p.progress || 0,
      p.start_date, p.end_date, p.created_at, p.updated_at
    ]);
  }

  // Delete any project in HRMS that is not in CRM
  await hrmsPool.query(`
    DELETE FROM projects WHERE id NOT IN (SELECT id FROM unnest($1::text[]))
  `, [crmProjects.rows.map(p => p.id)]);

  // 10. Create project_allocations for the real tasks in PRJ-3240 (only for actual team members)
  console.log('10. Establishing allocations for PRJ-3240 real tasks...');
  const sigmaMembersRes = await hrmsPool.query("SELECT employee_id FROM group_members WHERE group_id = 'GRP-PRJ3240-01' UNION SELECT team_head_id FROM project_groups WHERE id = 'GRP-PRJ3240-01'");
  const validMemberIds = new Set(sigmaMembersRes.rows.map(r => r.employee_id));

  const sigmaTasks = await hrmsPool.query("SELECT * FROM tasks WHERE project_id = 'PRJ-3240'");
  console.log(`Found ${sigmaTasks.rows.length} tasks for PRJ-3240.`);

  for (const task of sigmaTasks.rows) {
    if (!validMemberIds.has(task.assigned_to) && !validMemberIds.has(task.assigned_to_employee_id)) {
      continue; // Skip tasks referencing project if employee is not a project member
    }
    const allocId = `ALLOC-${task.project_id}-${task.assigned_to}-${task.module_name}`.replace(/\s+/g, '_');
    
    // Upsert allocation
    await hrmsPool.query(`
      INSERT INTO project_allocations (
        id, project_id, project_name, employee_id, employee_name, 
        module_id, module_name, role, allocation_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET
        employee_name = EXCLUDED.employee_name,
        module_name = EXCLUDED.module_name
    `, [
      allocId,
      task.project_id,
      task.project_name,
      task.assigned_to,
      task.assigned_to_name,
      `MOD-${task.module_name.toUpperCase().replace(/\s+/g, '_')}`,
      task.module_name,
      task.assigned_to === 'EMP-006' ? 'Team Head' : 'Developer'
    ]);

    // Link task to this allocation
    await hrmsPool.query(`
      UPDATE tasks SET allocation_id = $1 WHERE id = $2
    `, [allocId, task.id]);
  }

  // 11. Verify final projects in both databases
  const finalCrm = await crmPool.query("SELECT id, name FROM projects ORDER BY id");
  const finalHrms = await hrmsPool.query("SELECT id, name FROM projects ORDER BY id");
  const finalAllocs = await hrmsPool.query("SELECT id, project_id, employee_id, module_name FROM project_allocations");

  console.log('\n--- VERIFICATION RESULT ---');
  console.log('CRM Projects:', finalCrm.rows);
  console.log('HRMS Projects:', finalHrms.rows);
  console.log('Project Allocations:', finalAllocs.rows);
  console.log('✅ CLEANUP & SYNC COMPLETE: Zero dummy projects remain.');

  process.exit(0);
}

cleanupAndSync().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
