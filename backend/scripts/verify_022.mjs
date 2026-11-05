import { hrmsPool } from '../db/pool.js';

async function run() {
  // Test the allocations
  const allocs = await hrmsPool.query("SELECT * FROM project_allocations WHERE project_id = 'PRJ-001' ORDER BY employee_id");
  console.log('Allocations count:', allocs.rows.length);
  allocs.rows.forEach(a => console.log(`  ${a.employee_id} -> ${a.module_name} | ${a.role}`));

  const tasks = await hrmsPool.query(`
    SELECT assigned_to_employee_id, module_name, status, COUNT(*) as c 
    FROM tasks WHERE project_id = 'PRJ-001' 
    GROUP BY assigned_to_employee_id, module_name, status 
    ORDER BY assigned_to_employee_id
  `);
  console.log('\nTask counts:');
  tasks.rows.forEach(t => console.log(`  ${t.assigned_to_employee_id} ${t.module_name} ${t.status}: ${t.c}`));

  const trs = await hrmsPool.query(`
    SELECT id, module_name, developer_employee_id, status, completion_percentage 
    FROM testing_requests WHERE project_id = 'PRJ-001' ORDER BY id
  `);
  console.log('\nTesting requests:');
  trs.rows.forEach(r => console.log(`  ${r.id} | ${r.module_name} | ${r.developer_employee_id} | ${r.status} | ${r.completion_percentage}%`));

  // Test the allocation API query
  const apiQuery = await hrmsPool.query(`
    SELECT 
      pa.*,
      p.client,
      p.start_date,
      p.end_date,
      p.project_manager,
      COALESCE(tc.total_tasks, 0) as total_tasks,
      COALESCE(tc.completed_tasks, 0) as completed_tasks,
      ROUND(
        CASE WHEN COALESCE(tc.total_tasks, 0) > 0 
        THEN (COALESCE(tc.completed_tasks, 0)::numeric / tc.total_tasks::numeric) * 100
        ELSE 0 END, 1
      ) as completion_percentage,
      tr.id as testing_request_id,
      tr.status as testing_status
    FROM project_allocations pa
    LEFT JOIN projects p ON pa.project_id = p.id
    LEFT JOIN (
      SELECT 
        allocation_id,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED') as completed_tasks
      FROM tasks WHERE allocation_id IS NOT NULL GROUP BY allocation_id
    ) tc ON pa.id = tc.allocation_id
    LEFT JOIN testing_requests tr ON pa.id = tr.allocation_id
    WHERE pa.project_id = 'PRJ-001' AND pa.allocation_status = 'ACTIVE'
    ORDER BY pa.created_at ASC
  `);
  console.log('\nFull API response:');
  apiQuery.rows.forEach(r => console.log(`  ${r.employee_name} -> ${r.module_name}: ${r.completion_percentage}% | testing: ${r.testing_status || 'none'} | tasks: ${r.total_tasks}`));

  await hrmsPool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
