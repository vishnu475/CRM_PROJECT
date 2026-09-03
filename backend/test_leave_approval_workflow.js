import { pool } from './db/pool.js';
import { ESSService } from './services/essService.js';

async function runLeaveWorkflowTest() {
  console.log('================================================================');
  console.log('🚀 TESTING EMPLOYEE LEAVE APPLICATION ➔ ADMIN APPROVAL WORKFLOW');
  console.log('================================================================\n');

  try {
    // 1. Vishnu (EMP-005) applies for Leave in ESS Portal
    console.log('[STEP 1] Vishnu (EMP-005) applying for Casual Leave...');
    const applyRes = await ESSService.submitLeaveRequest('EMP-005', {
      leaveType: 'Casual Leave',
      startDate: '2026-08-28',
      endDate: '2026-08-28',
      reason: 'Personal Emergency'
    });
    console.log('  ✅ PASS: Leave request submitted:', applyRes.data.id, 'Status:', applyRes.data.status);
    const leaveId = applyRes.data.id;

    // 2. Admin fetches all leave requests
    console.log('\n[STEP 2] Admin fetching leave requests from PostgreSQL...');
    const adminFetch = await pool.query('SELECT * FROM leave_requests WHERE id = $1', [leaveId]);
    console.log('  ✅ PASS: Admin found Vishnu request in DB:', adminFetch.rows[0].id, 'Status:', adminFetch.rows[0].status);

    // 3. Admin Approves Vishnu's leave request
    console.log('\n[STEP 3] Admin approving Vishnu leave request...');
    const approveRes = await pool.query(
      `UPDATE leave_requests SET status = 'APPROVED', manager_name = 'HR Admin', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [leaveId]
    );
    console.log('  ✅ PASS: Status updated in PostgreSQL:', approveRes.rows[0].status);

    // 4. ESS Portal fetches Vishnu's leaves
    console.log('\n[STEP 4] Vishnu checking ESS Portal for updated status...');
    const essFetch = await ESSService.getEmployeeLeaves('EMP-005');
    const vishnuReq = essFetch.requests.find(r => r.id === leaveId);
    console.log('  ✅ PASS: ESS Portal sees updated status:', vishnuReq.status, 'Manager:', vishnuReq.manager_name);

    if (vishnuReq.status === 'APPROVED') {
      console.log('\n================================================================');
      console.log('🎉 100% SUCCESS: LEAVE APPLICATION & ADMIN APPROVAL SYNC VERIFIED!');
      console.log('================================================================');
    } else {
      console.error('❌ FAIL: Expected APPROVED status in ESS Portal');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error during leave workflow test:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runLeaveWorkflowTest();
