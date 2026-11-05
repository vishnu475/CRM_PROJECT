import { hrmsPool } from '../db/pool.js';

async function testLateral() {
  const query = `
    SELECT 
      pa.id as allocation_id,
      pa.employee_id, pa.employee_name, pa.role,
      pa.module_id, pa.module_name,
      COALESCE(t_stats.total_tasks, 0) as total_tasks,
      COALESCE(t_stats.completed_tasks, 0) as completed_tasks,
      COALESCE(t_stats.avg_progress, 0) as avg_progress,
      tr.id as testing_request_id,
      tr.status as tr_status,
      tr.submitted_for_testing_at
    FROM project_allocations pa
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE UPPER(t.status) = 'COMPLETED' OR COALESCE(t.progress_percent, 0) >= 100) as completed_tasks,
        ROUND(COALESCE(AVG(COALESCE(t.progress_percent, 0)), 0), 1) as avg_progress
      FROM tasks t
      WHERE (
        t.allocation_id = pa.id OR (
          (t.project_id = pa.project_id OR t.project_name = pa.project_name) AND
          (t.assigned_to = pa.employee_id OR t.assigned_to_employee_id = pa.employee_id) AND
          (LOWER(t.module_name) = LOWER(pa.module_name) OR LOWER(t.module_id) = LOWER(pa.module_id))
        )
      )
    ) t_stats ON true
    LEFT JOIN testing_requests tr ON (pa.id = tr.allocation_id OR (tr.project_id = pa.project_id AND tr.module_id = pa.module_id AND tr.developer_employee_id = pa.employee_id))
    WHERE pa.project_id = 'PRJ-3240' AND pa.allocation_status = 'ACTIVE'
    ORDER BY pa.created_at ASC
  `;
  const res = await hrmsPool.query(query);
  console.log('Query result:');
  res.rows.forEach(r => {
    console.log(' ', r.employee_name, '|', r.module_name, '| total:', r.total_tasks, '| completed:', r.completed_tasks, '| avg_progress:', r.avg_progress);
  });
  process.exit(0);
}

testLateral().catch(console.error);
