import { hrmsPool, crmPool } from '../db/pool.js';

async function check() {
  const crmPrjs = await crmPool.query("SELECT id, code, name, client FROM projects");
  console.log('CRM Projects:', crmPrjs.rows);

  const hrmsPrjs = await hrmsPool.query("SELECT id, code, name, client FROM projects");
  console.log('HRMS Projects:', hrmsPrjs.rows);

  const tasks = await hrmsPool.query("SELECT id, title, project_id, project_name, module_name, assigned_to, assigned_to_name, status FROM tasks WHERE project_id IN ('PRJ-0122', 'PRJ-3240')");
  console.log('Tasks for PRJ-0122 and PRJ-3240:', tasks.rows.length);
  tasks.rows.forEach(t => console.log('  Task:', t.id, t.title, '| Prj:', t.project_id, '| Mod:', t.module_name, '| Assigned:', t.assigned_to, t.assigned_to_name, '| Status:', t.status));

  const trs = await hrmsPool.query("SELECT * FROM testing_requests WHERE project_id IN ('PRJ-0122', 'PRJ-3240')");
  console.log('Testing Requests for PRJ-0122 & PRJ-3240:', trs.rows.length);

  const prj001Tasks = await hrmsPool.query("SELECT count(*) FROM tasks WHERE project_id = 'PRJ-001'");
  console.log('Tasks with PRJ-001:', prj001Tasks.rows[0].count);

  process.exit(0);
}

check().catch(console.error);
