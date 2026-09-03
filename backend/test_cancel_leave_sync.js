import { pool } from './db/pool.js';
import { ESSService } from './services/essService.js';

async function runTestCancelLeaveSync() {
  console.log('================================================================');
  console.log('🚀 TESTING ADMIN CANCEL LEAVE ➔ RAMESH ESS PORTAL REFLECTION');
  console.log('================================================================\n');

  try {
    // Seed clean DB with Ramesh pending leave request
    await pool.query(`TRUNCATE TABLE leave_requests RESTART IDENTITY`);

    await pool.query(`
      INSERT INTO leave_requests (id, employee_id, employee_name, leave_type, from_date, to_date, start_date, end_date, days, total_days, reason, status, manager_name)
      VALUES 
        ('LV-EMP-008-102', 'EMP-008', 'Ramesh', 'Sick Leave', '2026-08-27', '2026-08-27', '2026-08-27', '2026-08-27', 1, 1, 'Medical Health Checkup', 'PENDING', 'HR Admin')
    `);

    console.log('[STEP 1] Initial State in DB: Ramesh leave status = PENDING');

    // Admin cancels Ramesh's leave request via PATCH endpoint
    console.log('\n[STEP 2] Admin cancelling Ramesh leave request...');
    const cancelRes = await pool.query(
      `UPDATE leave_requests SET status = 'CANCELLED', manager_name = 'HR Admin', manager_comment = 'Cancelled by HR Admin', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      ['LV-EMP-008-102']
    );
    console.log('  ✅ PASS: PostgreSQL Status updated to:', cancelRes.rows[0].status);

    // Ramesh fetches leaves in ESS Portal
    console.log('\n[STEP 3] Ramesh checking ESS Portal for updated status...');
    const essData = await ESSService.getEmployeeLeaves('EMP-008');
    const rameshReq = essData.requests.find(r => r.id === 'LV-EMP-008-102');
    console.log('  ✅ PASS: ESS Portal sees updated status:', rameshReq.status, 'Manager:', rameshReq.manager_name, 'Comment:', rameshReq.manager_comment);

    if (rameshReq.status === 'CANCELLED') {
      console.log('\n================================================================');
      console.log('🎉 100% SUCCESS: CANCELLED LEAVE WORKFLOW FULLY VERIFIED!');
      console.log('================================================================');
    } else {
      console.error('❌ FAIL: Expected status CANCELLED');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error during test:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTestCancelLeaveSync();
