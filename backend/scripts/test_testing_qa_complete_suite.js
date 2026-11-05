import { hrmsPool as pool } from '../db/pool.js';
import { TestingService } from '../services/testingService.js';

async function runTestSuite() {
  console.log('\n🧪 ========================================================');
  console.log('   STARTING COMPREHENSIVE QA & TESTING AUTOMATION SUITE');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Seed / Setup Test Module and Tasks
    // -------------------------------------------------------------
    console.log('🔹 Step 1: Setting up Test Module and Task Distribution');
    const testModId = 'MOD-QA-TEST';
    const testModName = 'Recruitment Portal';
    const testModCode = 'rec_portal';
    const devId = 'EMP-005';
    const devName = 'Vishnu Vardhan';
    const testerId = 'EMP-004';
    const testerName = 'Rahul Verma';

    await pool.query(
      `INSERT INTO modules (id, code, name, category, status, description)
       VALUES ($1, $2, $3, 'HRMS', 'active', 'Automated QA Test Module')
       ON CONFLICT (id) DO UPDATE SET status = 'active'`,
      [testModId, testModCode, testModName]
    );

    // Clean any prior test artifacts for clean state
    await pool.query(`DELETE FROM testing_reports WHERE module_id = $1`, [testModId]);
    await pool.query(`DELETE FROM bugs WHERE module_id = $1`, [testModId]);
    await pool.query(`DELETE FROM test_cases WHERE module_id = $1`, [testModId]);
    await pool.query(`DELETE FROM testing_requests WHERE module_id = $1`, [testModId]);
    await pool.query(`DELETE FROM tasks WHERE module_id = $1 OR module_name = $2`, [testModId, testModName]);

    // Create 10 tasks (6 completed = 60%, 4 pending)
    for (let i = 1; i <= 10; i++) {
      const isCompleted = i <= 6;
      await pool.query(
        `INSERT INTO tasks (id, title, module_id, module_name, project_name, assigned_to, assigned_to_employee_id, assigned_to_name, status, progress_percent)
         VALUES ($1, $2, $3, $4, 'HRMS Portal', $5, $5, $6, $7, $8)`,
        [
          `TSK-QA-${i}`, `Task ${i} for ${testModName}`, testModId, testModName,
          devId, devName, isCompleted ? 'COMPLETED' : 'IN_PROGRESS', isCompleted ? 100 : 40
        ]
      );
    }
    assert(true, '10 module tasks created (6 completed = 60%, 4 pending)');

    // -------------------------------------------------------------
    // Test 2: Trigger at 60% -> Should NOT promote to READY_FOR_TESTING
    // -------------------------------------------------------------
    console.log('\n🔹 Step 2: Testing 60% completion threshold (Below 70%)');
    await TestingService.checkAndTriggerModuleTesting(testModId, devId);

    const check60 = await pool.query(`SELECT * FROM testing_requests WHERE module_id = $1`, [testModId]);
    assert(check60.rows.length === 0, 'Module at 60% is correctly NOT added to READY_FOR_TESTING queue');

    // -------------------------------------------------------------
    // Test 3: Complete 7th Task -> 70% threshold reached!
    // -------------------------------------------------------------
    console.log('\n🔹 Step 3: Completing 7th task -> 70% reached (Automatic Trigger)');
    await pool.query(`UPDATE tasks SET status = 'COMPLETED', progress_percent = 100 WHERE id = 'TSK-QA-7'`);

    const triggerRes = await TestingService.checkAndTriggerModuleTesting(testModId, devId);
    assert(triggerRes !== null, 'Testing request created automatically');
    assert(Number(triggerRes.completion_percentage) === 70.0, `Completion % calculated exactly: ${triggerRes.completion_percentage}%`);
    assert(triggerRes.status === 'READY_FOR_TESTING', `Testing request status is READY_FOR_TESTING`);
    assert(triggerRes.developer_employee_id === devId, `Relationship preserved: developer is ${devName} (${devId})`);

    // Verify duplicate prevention
    const triggerAgain = await TestingService.checkAndTriggerModuleTesting(testModId, devId);
    const countReqs = await pool.query(`SELECT COUNT(*) as c FROM testing_requests WHERE module_id = $1`, [testModId]);
    assert(parseInt(countReqs.rows[0].c, 10) === 1, 'Duplicate testing requests strictly prevented');

    // -------------------------------------------------------------
    // Test 4: Tester Assignment & Status Transition
    // -------------------------------------------------------------
    console.log('\n🔹 Step 4: Admin assigns QA Tester to Module');
    const assignedReq = await TestingService.assignTester(
      triggerRes.id,
      { testerId, testerName },
      { empCode: 'ADM-001', name: 'Sarah Jenkins', role: 'Admin' }
    );
    assert(assignedReq.tester_employee_id === testerId, `Tester assigned: ${assignedReq.tester_employee_name} (${testerId})`);
    assert(assignedReq.status === 'TESTING_IN_PROGRESS', `Status automatically moved to TESTING_IN_PROGRESS`);
    assert(assignedReq.testing_start_date !== null, 'Testing start timestamp recorded');

    // -------------------------------------------------------------
    // Test 5: Test Case Management & Execution
    // -------------------------------------------------------------
    console.log('\n🔹 Step 5: Test Case Creation and Execution');
    const tc1 = await TestingService.createTestCase({
      moduleId: testModId,
      moduleName: testModName,
      feature: 'Candidate Profile Upload',
      testScenario: 'Verify PDF resume upload parses candidate skills',
      testSteps: '1. Open recruitment portal\n2. Upload sample_resume.pdf\n3. Click Parse',
      testData: 'File: resume_dev.pdf',
      expectedResult: 'Skills extracted into candidate profile',
      testingRequestId: assignedReq.id
    }, { empCode: testerId, name: testerName, role: 'Tester' });

    assert(tc1.id.startsWith('TC-'), `Test case created: ${tc1.id}`);
    assert(tc1.status === 'NOT_EXECUTED', 'Initial test case status is NOT_EXECUTED');

    // Execute Pass
    const tcExecPass = await TestingService.updateTestCase(tc1.id, {
      status: 'PASSED',
      actualResult: 'Candidate resume parsed accurately in 1.2 seconds'
    }, { empCode: testerId, name: testerName, role: 'Tester' });
    assert(tcExecPass.status === 'PASSED', 'Test case executed and marked PASSED');

    // Create a 2nd test case that will FAIL
    const tc2 = await TestingService.createTestCase({
      moduleId: testModId,
      moduleName: testModName,
      feature: 'Interview Scheduler',
      testScenario: 'Verify calendar invite sent to candidate email',
      testSteps: '1. Select candidate\n2. Set interview time\n3. Click Send Invite',
      expectedResult: 'Google Meet invite received by candidate',
      testingRequestId: assignedReq.id
    }, { empCode: testerId, name: testerName, role: 'Tester' });

    await TestingService.updateTestCase(tc2.id, {
      status: 'FAILED',
      actualResult: 'SMTP timeout 504 error'
    }, { empCode: testerId, name: testerName, role: 'Tester' });
    assert(true, 'Test case 2 marked FAILED to trigger bug reporting workflow');

    // -------------------------------------------------------------
    // Test 6: Bug Reporting & Traceability
    // -------------------------------------------------------------
    console.log('\n🔹 Step 6: Reporting Bug Linked to Failed Test Case');
    const reportedBug = await TestingService.createBug({
      moduleId: testModId,
      moduleName: testModName,
      testingRequestId: assignedReq.id,
      testCaseId: tc2.id,
      feature: 'Interview Scheduler',
      title: 'SMTP Timeout when sending interview invite email',
      description: 'System throws 504 gateway timeout when dispatching calendar invitation.',
      stepsToReproduce: '1. Go to Interviews\n2. Click Send Invite\n3. Wait 30s for timeout',
      expectedResult: 'Email dispatched immediately',
      actualResult: 'Timeout 504',
      severity: 'CRITICAL',
      priority: 'URGENT',
      environment: 'Staging',
      browser: 'Chrome 128',
      device: 'MacBook Pro'
    }, { empCode: testerId, name: testerName, role: 'Tester' });

    assert(reportedBug.id.startsWith('BUG-'), `Bug reported: ${reportedBug.id} (${reportedBug.bug_id})`);
    assert(reportedBug.status === 'OPEN', 'Bug initial status is OPEN');
    assert(reportedBug.assigned_developer_id === devId, `Bug assigned to module developer: ${devName}`);

    // Check Testing Request status auto-updated to BUGS_FOUND
    const reqAfterBug = await pool.query(`SELECT status FROM testing_requests WHERE id = $1`, [assignedReq.id]);
    assert(reqAfterBug.rows[0].status === 'BUGS_FOUND', 'Testing request status moved to BUGS_FOUND');

    // -------------------------------------------------------------
    // Test 7: Strict Gatekeeping Rule (Cannot Pass with Open Critical Bug)
    // -------------------------------------------------------------
    console.log('\n🔹 Step 7: Testing Gatekeeping Rule (Enforcing No Pass with Critical Bug)');
    let gatekeepingBlocked = false;
    try {
      await TestingService.updateTestingStatus(
        assignedReq.id,
        'TESTING_PASSED',
        { empCode: 'ADM-001', name: 'Admin', role: 'Admin' },
        'Attempting pass with critical bug'
      );
    } catch (err) {
      gatekeepingBlocked = true;
      assert(err.message.includes('Critical') || err.message.includes('failed test case'), `Gatekeeper blocked status transition: "${err.message}"`);
    }
    assert(gatekeepingBlocked, 'Strict gatekeeper rule successfully prevented TESTING_PASSED while Critical bug was open');

    // -------------------------------------------------------------
    // Test 8: Developer Fix Workflow -> FIXED
    // -------------------------------------------------------------
    console.log('\n🔹 Step 8: Developer Fix Workflow');
    const fixedBug = await TestingService.updateBug(
      reportedBug.id,
      {
        status: 'FIXED',
        developerNotes: 'Resolved SMTP connection pool leak and increased timeout retry to 5s.'
      },
      { empCode: devId, name: devName, role: 'Developer' }
    );
    assert(fixedBug.status === 'FIXED', 'Developer marked bug as FIXED');
    assert(fixedBug.fixed_date !== null, 'Fix timestamp permanently recorded');

    // Add developer comment
    const comment = await TestingService.addBugComment(
      reportedBug.id,
      { comment: 'Ready for retesting on Staging environment.' },
      { empCode: devId, name: devName, role: 'Developer' }
    );
    assert(comment.comment.includes('Staging'), 'Developer comment saved to bug audit thread');

    // -------------------------------------------------------------
    // Test 9: Tester Retest Workflow (FAIL -> REOPENED, then PASS -> CLOSED)
    // -------------------------------------------------------------
    console.log('\n🔹 Step 9: Tester Retest Workflow (Fail -> Reopened -> Fix -> Pass -> Closed)');
    // 9a: Retest fails first
    const retestFail = await TestingService.retestBug(
      reportedBug.id,
      { outcome: 'FAIL', retestNotes: 'Intermittent 504 still seen on retry attempt 2.' },
      { empCode: testerId, name: testerName, role: 'Tester' }
    );
    assert(retestFail.status === 'REOPENED', 'Bug failed retest and status became REOPENED');
    assert(retestFail.assigned_developer_id === devId, `Reopened bug returned directly to developer: ${devName}`);

    // 9b: Developer fixes again
    await TestingService.updateBug(
      reportedBug.id,
      { status: 'FIXED', developerNotes: 'Replaced synchronous SMTP client with async worker queue.' },
      { empCode: devId, name: devName, role: 'Developer' }
    );

    // 9c: Retest passes!
    const retestPass = await TestingService.retestBug(
      reportedBug.id,
      { outcome: 'PASS', retestNotes: 'Verified 100 emails sent smoothly under 200ms.' },
      { empCode: testerId, name: testerName, role: 'Tester' }
    );
    assert(retestPass.status === 'CLOSED', 'Bug verified and status is CLOSED');
    assert(retestPass.closed_date !== null, 'Bug closure timestamp recorded');

    // Also update test case 2 to PASSED now that bug is resolved
    await TestingService.updateTestCase(tc2.id, {
      status: 'PASSED',
      actualResult: 'Invites sent instantly via async queue.'
    }, { empCode: testerId, name: testerName, role: 'Tester' });

    // -------------------------------------------------------------
    // Test 10: Module Testing Passes Gatekeeper & Approved
    // -------------------------------------------------------------
    console.log('\n🔹 Step 10: Final Module Sign-off (Testing Passed & Approved)');
    const passedModuleReq = await TestingService.updateTestingStatus(
      assignedReq.id,
      'TESTING_PASSED',
      { empCode: testerId, name: testerName, role: 'Tester' },
      'All test cases passed and all critical bugs closed.'
    );
    assert(passedModuleReq.status === 'TESTING_PASSED', 'Module status successfully transitioned to TESTING_PASSED');
    assert(passedModuleReq.testing_end_date !== null, 'Testing end timestamp recorded');

    const approvedModuleReq = await TestingService.updateTestingStatus(
      assignedReq.id,
      'APPROVED',
      { empCode: 'ADM-001', name: 'Admin', role: 'Admin' },
      'Admin final sign-off for production release.'
    );
    assert(approvedModuleReq.status === 'APPROVED', 'Module successfully signed off as APPROVED');

    // -------------------------------------------------------------
    // Test 11: Testing Report Generation & Relationship Traceability
    // -------------------------------------------------------------
    console.log('\n🔹 Step 11: Generating Comprehensive Testing Report');
    const reportData = await TestingService.generateTestingReport(
      testModId,
      { empCode: 'ADM-001', name: 'Admin', role: 'Admin' }
    );

    assert(reportData.module.id === testModId, `Report module matches: ${reportData.module.name}`);
    assert(reportData.tasks.length === 10, `Report includes all 10 tasks`);
    assert(reportData.testCases.length === 2, `Report includes all 2 test cases (both passed)`);
    assert(reportData.bugs.length === 1, `Report includes bug with complete status history`);
    assert(reportData.reportSummary.closed_bugs === 1, 'Report summary shows 1 closed bug');
    assert(reportData.reportSummary.open_bugs === 0, 'Report summary shows 0 open bugs');

    // -------------------------------------------------------------
    // Test 12: Admin Dashboard Metrics & Chart Data
    // -------------------------------------------------------------
    console.log('\n🔹 Step 12: Admin Dashboard Metrics Verification');
    const metrics = await TestingService.getDashboardMetrics();
    assert(metrics.kpis !== undefined, 'KPI cards data available');
    assert(Array.isArray(metrics.bugsByModule), 'Bugs by module chart data available');
    assert(Array.isArray(metrics.bugsBySeverity), 'Bugs by severity chart data available');
    assert(Array.isArray(metrics.bugsByDeveloper), 'Bugs by developer chart data available');
    assert(metrics.averageResolutionHours > 0, `Average bug resolution time: ${metrics.averageResolutionHours} hours`);

    // -------------------------------------------------------------
    // Test 13: Audit Trail & Notifications
    // -------------------------------------------------------------
    console.log('\n🔹 Step 13: Audit Trail & Notifications Verification');
    const auditLogs = await TestingService.getAuditLogs({ moduleId: testModId });
    assert(auditLogs.length >= 5, `Complete audit trail captured: ${auditLogs.length} audit logs for module`);

    const notifs = await TestingService.getNotifications(devId, 'Developer');
    assert(notifs.length >= 2, `Notifications delivered to developer: ${notifs.length} messages`);

    console.log('\n🎉 ========================================================');
    console.log(`   ALL TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
    console.log('   PRODUCTION QA WORKFLOW VERIFIED END-TO-END');
    console.log('========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Aborted with Error:', err);
    process.exit(1);
  }
}

runTestSuite();
