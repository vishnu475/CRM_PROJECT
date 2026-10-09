const BASE_URL = 'http://localhost:5000/api/tasks';

async function runFinalVerification() {
  console.log('====================================================');
  console.log('STARTING FINAL SPECIFICATION TESTS (TEST 1 to 5)');
  console.log('====================================================\n');

  // Pre-clean temporary test task keys
  const { pool } = await import('../db/pool.js');
  await pool.query("DELETE FROM tasks WHERE id IN ('TASK-TEST-001', 'TASK-TEST-002')");

  // TEST 1: Admin assigns Project: HRMS Cloud Migration -> Employee: EMP-014
  console.log('--- TEST 1: Admin Assigns Task to EMP-014 ---');
  const t1Res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'TASK-TEST-001',
      title: 'HRMS Cloud Migration Architecture Review',
      description: 'End-to-end architecture review for migration.',
      projectId: 'PROJECT-001',
      projectName: 'HRMS Cloud Migration',
      assignedTo: 'EMP-014',
      priority: 'HIGH',
      dueDate: '2026-09-28'
    })
  });
  const t1Json = await t1Res.json();
  if (!t1Json.success) throw new Error(`TEST 1 create failed: ${t1Json.message}`);
  console.log(`Saved task: ${t1Json.data.id} -> ${t1Json.data.project_name} -> ${t1Json.data.assigned_to_name} (${t1Json.data.assigned_to})`);

  // Check Admin All Tasks:
  const allTasksRes1 = await fetch(`${BASE_URL}`);
  const allTasks1 = await allTasksRes1.json();
  const foundInAll = allTasks1.data.find(t => t.id === 'TASK-TEST-001');
  console.log(`Admin All Tasks: Task found = ${Boolean(foundInAll)}, Employee = ${foundInAll?.employeeId} - ${foundInAll?.employeeName}, Project = ${foundInAll?.projectName}`);
  if (!foundInAll || foundInAll.employeeId !== 'EMP-014') throw new Error('TEST 1: Admin All Tasks check failed');

  // Check EMP-014 My Tasks:
  const myTasks14Res = await fetch(`${BASE_URL}/my`, { headers: { 'x-employee-id': 'EMP-014' } });
  const myTasks14 = await myTasks14Res.json();
  const visibleTo14 = myTasks14.data.some(t => t.id === 'TASK-TEST-001');
  console.log(`EMP-014 My Tasks: HRMS Cloud Migration visible = ${visibleTo14}`);
  if (!visibleTo14) throw new Error('TEST 1: Task must be visible in EMP-014 My Tasks');

  // Check EMP-015 My Tasks:
  const myTasks15Res = await fetch(`${BASE_URL}/my`, { headers: { 'x-employee-id': 'EMP-015' } });
  const myTasks15 = await myTasks15Res.json();
  const visibleTo15 = myTasks15.data.some(t => t.id === 'TASK-TEST-001');
  console.log(`EMP-015 My Tasks: HRMS Cloud Migration visible = ${visibleTo15} (MUST BE FALSE)`);
  if (visibleTo15) throw new Error('TEST 1: Task must NOT be visible in EMP-015 My Tasks');
  console.log('✅ TEST 1 PASSED!\n');

  // TEST 2: Admin assigns another task to EMP-015
  console.log('--- TEST 2: Admin Assigns Another Task to EMP-015 ---');
  const t2Res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'TASK-TEST-002',
      title: 'Payroll Tax Automation 2026',
      description: 'Implement new bracket calculations.',
      projectId: 'PROJECT-002',
      projectName: 'Payroll Automation',
      assignedTo: 'EMP-015',
      priority: 'MEDIUM',
      dueDate: '2026-09-29'
    })
  });
  const t2Json = await t2Res.json();
  if (!t2Json.success) throw new Error(`TEST 2 create failed: ${t2Json.message}`);
  console.log(`Saved task: ${t2Json.data.id} -> ${t2Json.data.project_name} -> ${t2Json.data.assigned_to_name} (${t2Json.data.assigned_to})`);

  // Verify EMP-014 only sees EMP-014 tasks, EMP-015 only sees EMP-015 tasks
  const check14 = (await (await fetch(`${BASE_URL}/my`, { headers: { 'x-employee-id': 'EMP-014' } })).json()).data;
  const check15 = (await (await fetch(`${BASE_URL}/my`, { headers: { 'x-employee-id': 'EMP-015' } })).json()).data;

  console.log(`EMP-014 task list: ${check14.map(t => `${t.id} (${t.employeeId})`).join(', ')}`);
  console.log(`EMP-015 task list: ${check15.map(t => `${t.id} (${t.employeeId})`).join(', ')}`);

  if (check14.some(t => t.employeeId !== 'EMP-014')) throw new Error('TEST 2: EMP-014 sees tasks not assigned to EMP-014');
  if (check15.some(t => t.employeeId !== 'EMP-015')) throw new Error('TEST 2: EMP-015 sees tasks not assigned to EMP-015');
  console.log('✅ TEST 2 PASSED!\n');

  // TEST 3: EMP-014 completes work -> Submit for Review
  console.log('--- TEST 3: EMP-014 Submits Work for Review ---');
  const submitRes = await fetch(`${BASE_URL}/TASK-TEST-001/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-014' },
    body: JSON.stringify({ completionNote: 'Migration architecture design completed 100%.' })
  });
  const submitJson = await submitRes.json();
  if (!submitJson.success) throw new Error(`TEST 3 submit failed: ${submitJson.message}`);
  console.log(`Submitted status: ${submitJson.data.status}`);

  // Check EMP-014 My Tasks: status = READY_FOR_REVIEW
  const myTasks14AfterSubmit = (await (await fetch(`${BASE_URL}/my`, { headers: { 'x-employee-id': 'EMP-014' } })).json()).data;
  const taskIn14 = myTasks14AfterSubmit.find(t => t.id === 'TASK-TEST-001');
  console.log(`EMP-014 My Tasks status = ${taskIn14?.status}`);
  if (taskIn14?.status !== 'READY_FOR_REVIEW') throw new Error('TEST 3: Task status should be READY_FOR_REVIEW in EMP-014 My Tasks');

  // Admin Ready for Review / Review Queue: task appears
  const reviewTasks = (await (await fetch(`${BASE_URL}/review`)).json()).data;
  const inReviewQueue = reviewTasks.some(t => t.id === 'TASK-TEST-001');
  console.log(`Admin Review queue: Task appears = ${inReviewQueue}`);
  if (!inReviewQueue) throw new Error('TEST 3: Task must appear in Admin Review queue');
  console.log('✅ TEST 3 PASSED!\n');

  // TEST 4: Admin approves
  console.log('--- TEST 4: Admin Approves Task ---');
  const approveRes = await fetch(`${BASE_URL}/TASK-TEST-001/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerFeedback: 'Flawless architecture, approved!' })
  });
  const approveJson = await approveRes.json();
  if (!approveJson.success) throw new Error(`TEST 4 approve failed: ${approveJson.message}`);
  console.log(`Approved task status: ${approveJson.data.status}`);

  // Check:
  // Review -> task removed
  const reviewTasksAfterApprove = (await (await fetch(`${BASE_URL}/review`)).json()).data;
  const inReviewAfter = reviewTasksAfterApprove.some(t => t.id === 'TASK-TEST-001');
  console.log(`Review queue contains task: ${inReviewAfter} (MUST BE FALSE)`);
  if (inReviewAfter) throw new Error('TEST 4: Task must be removed from Review');

  // Completed -> task appears
  const completedTasks = (await (await fetch(`${BASE_URL}/completed`)).json()).data;
  const inCompleted = completedTasks.some(t => t.id === 'TASK-TEST-001');
  console.log(`Completed section contains task: ${inCompleted}`);
  if (!inCompleted) throw new Error('TEST 4: Task must appear in Completed section');

  // EMP-014 My Tasks -> status = COMPLETED
  const myTasks14AfterApprove = (await (await fetch(`${BASE_URL}/my`, { headers: { 'x-employee-id': 'EMP-014' } })).json()).data;
  const taskIn14Approved = myTasks14AfterApprove.find(t => t.id === 'TASK-TEST-001');
  console.log(`EMP-014 My Tasks status = ${taskIn14Approved?.status}`);
  if (taskIn14Approved?.status !== 'COMPLETED') throw new Error('TEST 4: Task must be COMPLETED in EMP-014 My Tasks');
  console.log('✅ TEST 4 PASSED!\n');

  // TEST 5: Admin requests changes
  console.log('--- TEST 5: Admin Requests Changes on TASK-TEST-002 ---');
  // First EMP-015 submits it
  await fetch(`${BASE_URL}/TASK-TEST-002/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-015' },
    body: JSON.stringify({ completionNote: 'Draft calculations ready.' })
  });

  // Admin requests changes
  const reopenRes = await fetch(`${BASE_URL}/TASK-TEST-002/reopen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managerFeedback: 'Please align with 2026 federal bracket updates.' })
  });
  const reopenJson = await reopenRes.json();
  if (!reopenJson.success) throw new Error(`TEST 5 reopen failed: ${reopenJson.message}`);
  console.log(`Task status after change request: ${reopenJson.data.status}`);

  // Review -> task removed
  const reviewAfterReopen = (await (await fetch(`${BASE_URL}/review`)).json()).data;
  const inReviewReopen = reviewAfterReopen.some(t => t.id === 'TASK-TEST-002');
  console.log(`Review queue contains task: ${inReviewReopen} (MUST BE FALSE)`);
  if (inReviewReopen) throw new Error('TEST 5: Task must be removed from Review');

  // Employee My Tasks -> CHANGES_REQUESTED
  const myTasks15AfterReopen = (await (await fetch(`${BASE_URL}/my`, { headers: { 'x-employee-id': 'EMP-015' } })).json()).data;
  const taskIn15Reopened = myTasks15AfterReopen.find(t => t.id === 'TASK-TEST-002');
  console.log(`EMP-015 My Tasks status = ${taskIn15Reopened?.status}, Feedback: "${taskIn15Reopened?.manager_feedback}"`);
  if (taskIn15Reopened?.status !== 'CHANGES_REQUESTED') throw new Error('TEST 5: Status must be CHANGES_REQUESTED in EMP-015 My Tasks');

  // Employee fixes -> submits again
  console.log('Employee fixes task and resubmits:');
  const resubmitRes = await fetch(`${BASE_URL}/TASK-TEST-002/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-employee-id': 'EMP-015' },
    body: JSON.stringify({ completionNote: 'Recalculated with 2026 federal brackets.' })
  });
  const resubmitJson = await resubmitRes.json();
  console.log(`Status after resubmission: ${resubmitJson.data.status}`);

  // Review -> task appears again
  const reviewAfterResubmit = (await (await fetch(`${BASE_URL}/review`)).json()).data;
  const inReviewResubmitted = reviewAfterResubmit.some(t => t.id === 'TASK-TEST-002');
  console.log(`Review queue contains task again: ${inReviewResubmitted}`);
  if (!inReviewResubmitted) throw new Error('TEST 5: Task must reappear in Review queue after resubmit');
  console.log('✅ TEST 5 PASSED!\n');

  console.log('====================================================');
  console.log('🎉 ALL 5 MANDATORY TESTS PASSED WITH 100% SUCCESS! 🎉');
  console.log('====================================================');

  // Clean up temporary test tasks and restore clean standard 5 tasks
  await fetch(`${BASE_URL}/${t1Json.data.id}/delete`, { method: 'DELETE' }).catch(() => {});
  await fetch(`${BASE_URL}/${t2Json.data.id}/delete`, { method: 'DELETE' }).catch(() => {});

  process.exit(0);
}

runFinalVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
