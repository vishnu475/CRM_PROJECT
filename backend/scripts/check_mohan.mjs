import { hrmsPool } from '../db/pool.js';

async function run() {
  const t = await hrmsPool.query("SELECT id, title, project_id, module_name, assigned_to, assigned_to_employee_id, status, progress_percent, allocation_id FROM tasks WHERE assigned_to = 'EMP-006' OR assigned_to_employee_id = 'EMP-006'");
  console.log('Mohan task in DB:', t.rows);

  const pa = await hrmsPool.query("SELECT * FROM project_allocations WHERE employee_id = 'EMP-006'");
  console.log('Mohan allocation in DB:', pa.rows);

  const allSigmaTasks = await hrmsPool.query("SELECT id, title, assigned_to, status, progress_percent, allocation_id FROM tasks WHERE project_id = 'PRJ-3240'");
  console.log('All Sigma tasks:', allSigmaTasks.rows);

  process.exit(0);
}

run().catch(console.error);
