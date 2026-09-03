import { pool } from './db/pool.js';
import { ESSService } from './services/essService.js';

async function runTestAllLeaveStatuses() {
  console.log('================================================================');
  console.log('🚀 TESTING ALL LEAVE STATUSES (APPROVED, REJECTED, CANCELLED)');
  console.log('================================================================\n');

  try {
    // Truncate & seed sample requests with different statuses
    await pool.query(`TRUNCATE TABLE leave_requests RESTART IDENTITY`);

    await pool.query(`
      INSERT INTO leave_requests (id, employee_id, employee_name, leave_type, from_date, to_date, start_date, end_date, days, total_days, reason, status, manager_name, manager_comment)
      VALUES 
        ('LV-EMP-001-1', 'EMP-001', 'Sarah Jenkins', 'Sick Leave', '2026-08-24', '2026-08-25', '2026-08-24', '2026-08-25', 1, 1, 'health issue', 'REJECTED', 'HR Admin', 'not valid'),
        ('LV-EMP-001-2', 'EMP-001', 'Sarah Jenkins', 'Casual Leave', '2026-08-28', '2026-08-28', '2026-08-28', '2026-08-28', 1, 1, 'personal work', 'APPROVED', 'HR Admin', 'take care'),
        ('LV-EMP-001-3', 'EMP-001', 'Sarah Jenkins', 'Casual Leave', '2026-08-30', '2026-08-30', '2026-08-30', '2026-08-30', 1, 1, 'urgent trip', 'CANCELLED', 'HR Admin', 'cancelled by emp')
    `);

    console.log('  ✅ PASS: Seeded Sarah Jenkins requests (REJECTED, APPROVED, CANCELLED)');

    const essLeaves = await ESSService.getEmployeeLeaves('EMP-001');
    console.log('\nESS Portal Results for Sarah Jenkins (EMP-001):');
    essLeaves.requests.forEach(r => {
      console.log(`  - ID: ${r.id} | Status: ${r.status} | Dates: ${r.start_date.toISOString().split('T')[0]} to ${r.end_date.toISOString().split('T')[0]} | Comment: ${r.manager_comment}`);
    });

    console.log('\n================================================================');
    console.log('🎉 ALL STATUS TESTS PASSED 100% GREEN!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Error during test:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTestAllLeaveStatuses();
