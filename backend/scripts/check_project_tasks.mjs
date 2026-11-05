import { hrmsPool, crmPool } from '../db/pool.js';

async function run() {
  const allTasks = await hrmsPool.query('SELECT DISTINCT project_id, project_name FROM tasks');
  console.log('All project IDs in tasks:', allTasks.rows);

  const allocs = await hrmsPool.query("SELECT * FROM project_allocations WHERE project_id IN ('PRJ-3240', 'PRJ-0122')");
  console.log('Real project allocations:', allocs.rows);

  const sigmaTasks = await hrmsPool.query("SELECT * FROM tasks WHERE project_id = 'PRJ-3240'");
  console.log('Sigma tasks:', sigmaTasks.rows);

  process.exit(0);
}

run().catch(console.error);
