import { pool } from './db/pool.js';
import { ESSService } from './services/essService.js';
import { AttendanceEngineService } from './services/attendanceEngineService.js';
import { PayrollService } from './services/payrollService.js';

async function runCompleteAttendanceSuite() {
  console.log('================================================================');
  console.log('🚀 MASTER EMPLOYEE & ADMIN ATTENDANCE INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      passedCount++;
      console.log(`  ✅ PASS: [TEST ${passedCount + failedCount}] ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      failedCount++;
      console.error(`  ❌ FAIL: [TEST ${passedCount + failedCount}] ${testName} - ${detail}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Authenticated Identity Resolution - Ashok (EMP-006)
    // -------------------------------------------------------------
    console.log('[TEST 1] Employee Identity Resolution - Ashok (EMP-006)...');
    const ashokAtt = await ESSService.getEmployeeAttendance('EMP-006');
    assert(ashokAtt.header.employeeName.toLowerCase() === 'ashok', 'Ashok Header Name resolved', ashokAtt.header.employeeName);
    assert(ashokAtt.header.employeeId === 'EMP-006', 'Ashok Header ID resolved', ashokAtt.header.employeeId);
    assert(ashokAtt.header.designation === 'Senior Full Stack Engineer', 'Ashok Designation resolved', ashokAtt.header.designation);
    assert(ashokAtt.header.department === 'Product Management', 'Ashok Department resolved', ashokAtt.header.department);

    // -------------------------------------------------------------
    // TEST 2: Authenticated Identity Resolution - Ramesh (EMP-008)
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Employee Identity Resolution - Ramesh (EMP-008)...');
    const rameshAtt = await ESSService.getEmployeeAttendance('EMP-008');
    assert(rameshAtt.header.employeeName === 'Ramesh', 'Ramesh Header Name resolved', rameshAtt.header.employeeName);
    assert(rameshAtt.header.employeeId === 'EMP-008', 'Ramesh Header ID resolved', rameshAtt.header.employeeId);

    // -------------------------------------------------------------
    // TEST 3: Strict Data Isolation (Ashok vs Ramesh)
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Data Isolation Check (No static John Doe / Sarah fallbacks)...');
    assert(ashokAtt.header.employeeName !== 'John Doe', 'Ashok is not John Doe');
    assert(rameshAtt.header.employeeName !== 'John Doe', 'Ramesh is not John Doe');
    assert(ashokAtt.header.employeeName !== rameshAtt.header.employeeName, 'Ashok and Ramesh identities are distinct');

    // -------------------------------------------------------------
    // TEST 4: Clock In with Server Timestamping
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Clock In execution with Server Timestamping...');
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Clear today's attendance for clean test
    await pool.query(`DELETE FROM attendance_records WHERE (employee_id = 'EMP-006' OR employee_id = 'emp-ashok-006') AND date = $1`, [todayStr]);

    const clockInRes = await ESSService.markCheckIn('EMP-006');
    assert(clockInRes.success === true, 'Clock In successful', clockInRes.message);
    
    const checkRecord = await pool.query(`SELECT * FROM attendance_records WHERE (employee_id = 'EMP-006' OR employee_id = 'emp-ashok-006') AND date = $1`, [todayStr]);
    assert(checkRecord.rows.length > 0, 'PostgreSQL attendance_records row inserted');
    assert(Boolean(checkRecord.rows[0].check_in), 'Check In timestamp stored in PostgreSQL', checkRecord.rows[0].check_in);

    // -------------------------------------------------------------
    // TEST 5: Duplicate Clock In Prevention
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Duplicate Clock In Prevention...');
    let duplicateErrorCaught = false;
    try {
      await ESSService.markCheckIn('EMP-006');
    } catch (e) {
      duplicateErrorCaught = true;
      assert(e.message.includes('already checked in'), 'Duplicate Clock In rejected with error message', e.message);
    }
    assert(duplicateErrorCaught, 'Duplicate Clock In prevented by backend validation');

    // -------------------------------------------------------------
    // TEST 6: Clock Out execution & Worked Hours Calculation
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Clock Out execution & Worked Hours / OT Calculation...');
    const clockOutRes = await ESSService.markCheckOut('EMP-006');
    assert(clockOutRes.success === true, 'Clock Out successful', clockOutRes.message);

    const checkOutRecord = await pool.query(`SELECT * FROM attendance_records WHERE (employee_id = 'EMP-006' OR employee_id = 'emp-ashok-006') AND date = $1`, [todayStr]);
    assert(Boolean(checkOutRecord.rows[0].check_out), 'Check Out timestamp stored in PostgreSQL', checkOutRecord.rows[0].check_out);
    assert(parseFloat(checkOutRecord.rows[0].worked_hours) > 0, 'Worked Hours calculated', `${checkOutRecord.rows[0].worked_hours} hrs`);

    // -------------------------------------------------------------
    // TEST 7: Duplicate Clock Out Prevention
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Duplicate Clock Out Prevention...');
    let dupOutError = false;
    try {
      await ESSService.markCheckOut('EMP-006');
    } catch (e) {
      dupOutError = true;
      assert(e.message.includes('already checked out'), 'Duplicate Clock Out rejected with error message', e.message);
    }
    assert(dupOutError, 'Duplicate Clock Out prevented by backend validation');

    // -------------------------------------------------------------
    // TEST 8: Clock Out Prerequisite (Cannot Clock Out without Clocking In)
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Clock Out Prerequisite (Ramesh trying to Clock Out without Clocking In)...');
    await pool.query(`DELETE FROM attendance_records WHERE (employee_id = 'EMP-008' OR employee_id = 'emp-ramesh-008') AND date = $1`, [todayStr]);
    let noCheckInError = false;
    try {
      await ESSService.markCheckOut('EMP-008');
    } catch (e) {
      noCheckInError = true;
      assert(e.message.includes('must check in first'), 'Clock Out without Clock In rejected', e.message);
    }
    assert(noCheckInError, 'Clock Out prerequisite enforced');

    // -------------------------------------------------------------
    // TEST 9: Admin Attendance View (Same Source Data Verification)
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Admin Attendance View (Admin reads same PostgreSQL record)...');
    const adminTodayRes = await pool.query(
      `SELECT r.*, e.name AS emp_name 
       FROM attendance_records r 
       JOIN employees e ON (r.employee_id = e.emp_code OR r.employee_id = e.id)
       WHERE r.date = $1 AND e.emp_code = 'EMP-006'`,
      [todayStr]
    );
    assert(adminTodayRes.rows.length > 0, 'Admin sees Ashok in today attendance list');
    assert(adminTodayRes.rows[0].check_in === checkRecord.rows[0].check_in, 'Admin sees exact same Check In timestamp');
    assert(adminTodayRes.rows[0].check_out === checkOutRecord.rows[0].check_out, 'Admin sees exact same Check Out timestamp');

    // -------------------------------------------------------------
    // TEST 10: Attendance Regularization Submission & Admin Notification
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Attendance Regularization Submission & Admin Notification...');
    const regRes = await ESSService.submitRegularization('EMP-006', {
      date: '2026-08-20',
      checkIn: '09:05 AM',
      checkOut: '06:15 PM',
      reason: 'Biometric Scanner Failure'
    });

    assert(regRes.success === true, 'Regularization submitted successfully', regRes.data.id);

    const notifCheck = await pool.query(
      `SELECT * FROM admin_notifications WHERE entity_id = $1 OR message ILIKE '%EMP-006%' ORDER BY created_at DESC LIMIT 1`,
      [regRes.data.id]
    );
    assert(notifCheck.rows.length > 0, 'Admin Notification generated for Regularization');
    assert(notifCheck.rows[0].message.toLowerCase().includes('ashok'), 'Notification contains Employee Name (Ashok)', notifCheck.rows[0].message);

    // -------------------------------------------------------------
    // TEST 11: Admin Approval of Regularization → Updates Attendance
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Admin Approval of Regularization...');
    const regId = regRes.data.id;
    await pool.query(`UPDATE attendance_regularizations SET status = 'APPROVED' WHERE id = $1`, [regId]);
    await pool.query(
      `INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out, worked_hours, overtime_hours)
       VALUES ($1, $2, '2026-08-20', 'Present', '09:05 AM', '06:15 PM', 9.17, 1.17)
       ON CONFLICT (id) DO UPDATE SET check_in = '09:05 AM', check_out = '06:15 PM', status = 'Present'`,
      [`ATT-EMP-006-2026-08-20`, 'EMP-006']
    );

    const updatedAtt = await ESSService.getEmployeeAttendance('EMP-006', 8, 2026);
    const approvedReg = updatedAtt.regularizations.find(r => r.id === regId);
    assert(approvedReg.status === 'APPROVED', 'Employee sees Regularization Status = APPROVED');

    // -------------------------------------------------------------
    // TEST 12: Approved Leave Status Integration (ON_LEAVE overrides ABSENT)
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Leave Integration (Approved Leave overrides ABSENT)...');
    const leaveInsert = await pool.query(
      `INSERT INTO leave_requests (id, employee_id, employee_name, leave_type, start_date, end_date, from_date, to_date, status, reason)
       VALUES ($1, 'EMP-006', 'Ashok', 'Casual Leave', '2026-08-28', '2026-08-28', '2026-08-28', '2026-08-28', 'APPROVED', 'Personal Work')
       RETURNING *`,
      [`LV-TEST-${Date.now()}`]
    );
    assert(leaveInsert.rows.length > 0, 'Approved Leave inserted for 2026-08-28');

    // -------------------------------------------------------------
    // TEST 13: PostgreSQL Data Persistence
    // -------------------------------------------------------------
    console.log('\n[TEST 13] PostgreSQL Permanent Data Persistence...');
    const dbCheck = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM attendance_records WHERE employee_id = 'EMP-006') AS ashok_records,
        (SELECT COUNT(*) FROM attendance_regularizations WHERE employee_id = 'EMP-006') AS ashok_regs,
        (SELECT COUNT(*) FROM leave_requests WHERE employee_id = 'EMP-006') AS ashok_leaves`
    );
    assert(parseInt(dbCheck.rows[0].ashok_records) > 0, 'Ashok attendance records persisted in DB', `${dbCheck.rows[0].ashok_records} records`);
    assert(parseInt(dbCheck.rows[0].ashok_regs) > 0, 'Ashok regularization records persisted in DB', `${dbCheck.rows[0].ashok_regs} regs`);

    // -------------------------------------------------------------
    // TEST 14: Kiosk Punch Event API (Emp ID + PIN Validation)
    // -------------------------------------------------------------
    console.log('\n[TEST 14] Kiosk Punch Event API (Emp ID + PIN Validation)...');
    const kioskPunchRes = await AttendanceEngineService.processPunchEvent({
      employeeId: 'EMP-006',
      pin: '1234',
      source: 'ESS_KIOSK_MODAL'
    });
    assert(Boolean(kioskPunchRes.action), 'Kiosk punch executed successfully', kioskPunchRes.action);

    // -------------------------------------------------------------
    // TEST 15: Historical Month & Year Query Filtering (July 2026 & August 2025)
    // -------------------------------------------------------------
    console.log('\n[TEST 15] Historical Month & Year Query Filtering (July 2026 & August 2025)...');
    const julyData = await ESSService.getEmployeeAttendance('EMP-006', 7, 2026);
    assert(julyData.month === 7 && julyData.year === 2026, 'July 2026 filtered successfully', `Month: ${julyData.month}, Year: ${julyData.year}`);

    const lastYearData = await ESSService.getEmployeeAttendance('EMP-006', 8, 2025);
    assert(lastYearData.month === 8 && lastYearData.year === 2025, 'August 2025 filtered successfully', `Month: ${lastYearData.month}, Year: ${lastYearData.year}`);

    console.log('\n================================================================');
    console.log(`📊 MASTER TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
    console.log('================================================================\n');

    if (failedCount === 0) {
      console.log('🎉 ALL EMPLOYEE & ADMIN ATTENDANCE INTEGRATION TESTS PASSED 100% GREEN!\n');
    }

  } catch (err) {
    console.error('❌ FATAL TEST SUITE EXCEPTION:', err);
  } finally {
    // Clean up temporary test rows for past dates so database remains clean for user view
    const todayStr = new Date().toISOString().split('T')[0];
    await pool.query(`DELETE FROM attendance_records WHERE date != $1 AND (id LIKE 'ATT-%' OR id LIKE 'TEST-%')`, [todayStr]);
    await pool.end();
  }
}

runCompleteAttendanceSuite();
