import { pool } from './db/pool.js';
import { TaskService } from './services/taskService.js';

async function runTests() {
  console.log('--- STARTING TASK DATABASE PERSISTENCE SUITE ---');

  try {
    // 1. Direct Service Assignment Test
    console.log('\n[1] Testing direct TaskService.createTask persistence to PostgreSQL...');
    const createdByService = await TaskService.createTask({
      title: 'Database Direct Assignment Verification',
      description: 'Verifying that direct service call writes to tasks table.',
      assignedTo: 'EMP-006',
      priority: 'HIGH',
      dueDate: '2026-09-15',
      projectName: 'ERP Core Suite 2.0',
      category: 'Quality Assurance'
    }, { name: 'Super Admin', id: 'ADM-001', role: 'Admin' });

    console.log(`Created Task ID: ${createdByService.id} for employee ${createdByService.assigned_to}`);

    // Verify row in PostgreSQL tasks table
    const dbRow1 = await pool.query('SELECT * FROM tasks WHERE id = $1', [createdByService.id]);
    if (dbRow1.rows.length === 1 && dbRow1.rows[0].assigned_to === 'EMP-006') {
      console.log('✅ PASS: Task record found in PostgreSQL "tasks" table.');
    } else {
      throw new Error('❌ FAIL: Task not found in PostgreSQL tasks table.');
    }

    // Verify row in task_activities table
    const actRow = await pool.query('SELECT * FROM task_activities WHERE task_id = $1', [createdByService.id]);
    if (actRow.rows.length > 0) {
      console.log(`✅ PASS: Audit activity logged (${actRow.rows.length} entries).`);
    } else {
      console.warn('⚠️ Note: No task_activities logged.');
    }

    // Verify notification created
    const notifRow = await pool.query('SELECT * FROM ess_notifications WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1', ['EMP-006']);
    if (notifRow.rows.length > 0) {
      console.log(`✅ PASS: ESS notification generated for assigned employee: "${notifRow.rows[0].title}"`);
    }

    // 2. HTTP POST /api/tasks API Test
    console.log('\n[2] Testing HTTP POST /api/tasks persistence...');
    const resTasks = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'Admin',
        'x-user-name': 'Alex Johnson'
      },
      body: JSON.stringify({
        title: 'API POST /api/tasks Assign to EMP-001',
        description: 'Testing task persistence via main task API',
        assignedTo: 'EMP-001',
        priority: 'URGENT',
        dueDate: '2026-09-20',
        projectName: 'HRMS & Payroll System'
      })
    });
    const jsonTasks = await resTasks.json();
    console.log('Response /api/tasks:', jsonTasks);
    if (!jsonTasks.success || !jsonTasks.data?.id) {
      throw new Error(`❌ FAIL: /api/tasks failed: ${jsonTasks.message}`);
    }

    const dbRow2 = await pool.query('SELECT * FROM tasks WHERE id = $1', [jsonTasks.data.id]);
    if (dbRow2.rows.length === 1 && dbRow2.rows[0].assigned_to === 'EMP-001') {
      console.log('✅ PASS: Task assigned via /api/tasks persisted in PostgreSQL.');
    } else {
      throw new Error('❌ FAIL: Task via /api/tasks not found in database.');
    }

    // 3. HTTP POST /api/hrms/tasks/assign Test (Used in Employee Modal & Attendance)
    console.log('\n[3] Testing HTTP POST /api/hrms/tasks/assign persistence...');
    const resHrms = await fetch('http://localhost:5000/api/hrms/tasks/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'Admin'
      },
      body: JSON.stringify({
        employeeId: 'EMP-008',
        title: 'HRMS Modal Direct Assign to Ramesh',
        description: 'Testing employee detail modal assignment',
        priority: 'Medium',
        dueDate: '2026-09-25',
        project: 'Banking & Financial Ledger',
        assignedBy: 'HR Admin'
      })
    });
    const jsonHrms = await resHrms.json();
    console.log('Response /api/hrms/tasks/assign:', jsonHrms);
    if (!jsonHrms.success || !jsonHrms.data?.id) {
      throw new Error(`❌ FAIL: /api/hrms/tasks/assign failed: ${jsonHrms.message}`);
    }

    const dbRow3 = await pool.query('SELECT * FROM tasks WHERE id = $1', [jsonHrms.data.id]);
    if (dbRow3.rows.length === 1 && dbRow3.rows[0].assigned_to === 'EMP-008') {
      console.log('✅ PASS: Task assigned via /api/hrms/tasks/assign persisted in PostgreSQL.');
    } else {
      throw new Error('❌ FAIL: Task via /api/hrms/tasks/assign not found in database.');
    }

    // 4. HTTP POST /api/v1/employee/me/tasks (ESS Employee Self/Assigned Task)
    console.log('\n[4] Testing HTTP POST /api/v1/employee/me/tasks persistence...');
    const resEss = await fetch('http://localhost:5000/api/v1/employee/me/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': 'EMP-006'
      },
      body: JSON.stringify({
        title: 'ESS Portal Deliverable for Ashok',
        description: 'Task created from employee self-service portal',
        priority: 'High',
        dueDate: '2026-09-18',
        projectName: 'Client Delivery Portal'
      })
    });
    const jsonEss = await resEss.json();
    console.log('Response /api/v1/employee/me/tasks:', jsonEss);
    if (!jsonEss.success || !jsonEss.data?.id) {
      throw new Error(`❌ FAIL: /api/v1/employee/me/tasks failed: ${jsonEss.message}`);
    }

    const dbRow4 = await pool.query('SELECT * FROM tasks WHERE id = $1', [jsonEss.data.id]);
    if (dbRow4.rows.length === 1 && dbRow4.rows[0].assigned_to === 'EMP-006') {
      console.log('✅ PASS: Task assigned via /api/v1/employee/me/tasks persisted in PostgreSQL.');
    } else {
      throw new Error('❌ FAIL: ESS task not found in database.');
    }

    console.log('\n=============================================');
    console.log('🎉 ALL TASK PERSISTENCE TESTS PASSED 100%! 🎉');
    console.log('=============================================');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR IN SUITE:', err);
    await pool.end();
    process.exit(1);
  }
}

runTests();
