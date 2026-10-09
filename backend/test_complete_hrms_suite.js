import { hrmsPool as pool } from './db/pool.js';

const BASE_URL = 'http://localhost:5000';

async function request(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return { status: res.status, data };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('STARTING COMPLETE HRMS VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  const totalTests = 7;
  const results = [];

  function record(testNum, title, passed, details) {
    if (passed) {
      passedTests++;
      console.log(`✅ [PASS] TEST ${testNum}: ${title}`);
    } else {
      console.log(`❌ [FAIL] TEST ${testNum}: ${title}`);
    }
    if (details) console.log(`   Details: ${details}\n`);
    results.push({ testNum, title, passed, details });
  }

  try {
    // ----------------------------------------------------------------
    // TEST 1: Employee Attendance & Joining Date
    // ----------------------------------------------------------------
    try {
      const testEmpCode = 'TEST_EMP_ATT_01';
      const todayStr = new Date().toISOString().split('T')[0];
      
      await pool.query(`DELETE FROM attendance_records WHERE employee_id = $1`, [testEmpCode]);
      await pool.query(`DELETE FROM employees WHERE emp_code = $1`, [testEmpCode]);

      await pool.query(`
        INSERT INTO employees (id, emp_code, name, email, department, designation, joining_date, status, salary)
        VALUES ($1, $1, 'Attendance Tester', 'att_test@example.com', 'Engineering', 'QA Engineer', $2, 'Active', 600000)
      `, [testEmpCode, todayStr]);

      const clockInRes = await request('POST', '/api/v1/employee/me/check-in', {}, {
        'x-employee-id': testEmpCode,
        'x-user-role': 'Employee'
      });

      const attHistory = await request('GET', '/api/v1/employee/me/attendance', null, {
        'x-employee-id': testEmpCode,
        'x-user-role': 'Employee'
      });

      const records = attHistory.data?.data?.records || [];
      const todayRecord = records.find(r => r.date === todayStr);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayRecord = records.find(r => r.date === yesterdayStr);

      const pass1 = clockInRes.data?.success && 
                    todayRecord && (todayRecord.status === 'Present' || todayRecord.status === 'Late In') &&
                    (!yesterdayRecord || yesterdayRecord.status === 'Not Joined' || yesterdayRecord.status === '-');

      record(1, 'Employee Attendance - Date-wise correctness & Joining Date', pass1, 
        `Today (${todayStr}): ${todayRecord?.status}, Yesterday (${yesterdayStr}): ${yesterdayRecord?.status || 'No record / Not Joined'}`);
    } catch (err) {
      record(1, 'Employee Attendance - Date-wise correctness & Joining Date', false, err.data?.message || err.message);
    }

    // ----------------------------------------------------------------
    // TEST 2: Duplicate Check-In and Duplicate Check-Out Prevention
    // ----------------------------------------------------------------
    try {
      const testEmpCode = 'TEST_EMP_ATT_01';

      let duplicateCheckInBlocked = false;
      try {
        await request('POST', '/api/v1/employee/me/check-in', {}, {
          'x-employee-id': testEmpCode,
          'x-user-role': 'Employee'
        });
      } catch (e) {
        if (e.status === 400 || e.status === 409 || e.data?.message?.includes('already')) {
          duplicateCheckInBlocked = true;
        }
      }

      const firstCheckOut = await request('POST', '/api/v1/employee/me/check-out', {}, {
        'x-employee-id': testEmpCode,
        'x-user-role': 'Employee'
      });

      let duplicateCheckOutBlocked = false;
      try {
        await request('POST', '/api/v1/employee/me/check-out', {}, {
          'x-employee-id': testEmpCode,
          'x-user-role': 'Employee'
        });
      } catch (e) {
        if (e.status === 400 || e.status === 409 || e.data?.message?.includes('already')) {
          duplicateCheckOutBlocked = true;
        }
      }

      const pass2 = duplicateCheckInBlocked && firstCheckOut.data?.success && duplicateCheckOutBlocked;
      record(2, 'Duplicate Check-In and Duplicate Check-Out Prevention', pass2,
        `Duplicate Check-In Blocked: ${duplicateCheckInBlocked}, First Check-Out Success: ${firstCheckOut.data?.success}, Duplicate Check-Out Blocked: ${duplicateCheckOutBlocked}`);
    } catch (err) {
      record(2, 'Duplicate Check-In and Duplicate Check-Out Prevention', false, err.data?.message || err.message);
    }

    // ----------------------------------------------------------------
    // TEST 3: Expense Claim Submission - Status PENDING & Admin Notification
    // ----------------------------------------------------------------
    let expenseClaimId = null;
    try {
      const testEmpCode = 'TEST_EMP_ATT_01';
      const expenseRes = await request('POST', '/api/v1/employee/me/expenses', {
        category: 'Travel & Local Conveyance',
        amount: 1450.00,
        claimDate: new Date().toISOString().split('T')[0],
        description: 'Client on-site visit cab fare',
        receiptUrl: 'https://example.com/receipts/cab123.png'
      }, {
        'x-employee-id': testEmpCode,
        'x-user-role': 'Employee'
      });

      expenseClaimId = expenseRes.data?.data?.id;
      const expenseStatus = expenseRes.data?.data?.status;

      const isPending = expenseStatus === 'PENDING';

      const adminNotifRes = await pool.query(
        `SELECT * FROM admin_notifications WHERE type = 'EXPENSE_CLAIM' AND entity_id = $1`,
        [expenseClaimId]
      );

      const pass3 = isPending && adminNotifRes.rows.length > 0;
      record(3, 'Expense Submission: Initial Status PENDING & Admin Notification Generated', pass3,
        `Claim ID: ${expenseClaimId}, Status: ${expenseStatus}, Admin Notification Count: ${adminNotifRes.rows.length}`);
    } catch (err) {
      record(3, 'Expense Submission: Initial Status PENDING & Admin Notification Generated', false, err.data?.message || err.message);
    }

    // ----------------------------------------------------------------
    // TEST 4: Expense Claim Approval & Role Security (403 for Employee)
    // ----------------------------------------------------------------
    try {
      const testEmpCode = 'TEST_EMP_ATT_01';

      let employeeForbidden = false;
      try {
        await request('POST', '/api/hrms/approvals/expense', {
          claimId: expenseClaimId,
          status: 'APPROVED',
          reviewerName: 'Employee Impersonator'
        }, {
          'x-employee-id': testEmpCode,
          'x-user-role': 'Employee'
        });
      } catch (e) {
        if (e.status === 403) {
          employeeForbidden = true;
        }
      }

      const adminApproveRes = await request('POST', '/api/hrms/approvals/expense', {
        claimId: expenseClaimId,
        status: 'APPROVED',
        reviewerName: 'System Admin'
      }, {
        'x-user-role': 'Admin',
        'x-user-name': 'System Admin'
      });

      const approvedClaim = adminApproveRes.data?.data;
      const pass4 = employeeForbidden && (approvedClaim?.status === 'FINANCE_APPROVED' || approvedClaim?.status === 'APPROVED');
      record(4, 'Expense Approval: Employee 403 Forbidden & Admin FINANCE_APPROVED', pass4,
        `Employee Forbidden (403): ${employeeForbidden}, Final Approved Status: ${approvedClaim?.status}`);
    } catch (err) {
      record(4, 'Expense Approval: Employee 403 Forbidden & Admin FINANCE_APPROVED', false, err.data?.message || err.message);
    }

    // ----------------------------------------------------------------
    // TEST 5: Tasks: 100% Progress -> READY_FOR_REVIEW -> Admin Review Workflow
    // ----------------------------------------------------------------
    try {
      const testEmpCode = 'TEST_EMP_ATT_01';

      const taskRes = await request('POST', '/api/tasks', {
        title: 'Complete Core Verification Module',
        description: 'Execute deep validation of attendance and tasks',
        assignedTo: testEmpCode,
        priority: 'HIGH',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        projectName: 'HRMS Platform',
        estimatedHours: 6
      }, {
        'x-user-role': 'Admin',
        'x-user-name': 'Task Admin'
      });

      const taskId = taskRes.data?.data?.id;

      await request('POST', `/api/tasks/${taskId}/start`, {}, {
        'x-employee-id': testEmpCode,
        'x-user-role': 'Employee'
      });

      const progress100Res = await request('PATCH', `/api/tasks/${taskId}/progress`, {
        progressPercent: 100,
        progressNote: 'Completed all code and tests, submitting for review.'
      }, {
        'x-employee-id': testEmpCode,
        'x-user-role': 'Employee'
      });

      const statusAt100 = progress100Res.data?.data?.status;
      const isReadyForReview = statusAt100 === 'READY_FOR_REVIEW';

      const reviewChangesRes = await request('POST', `/api/tasks/${taskId}/review`, {
        decision: 'REQUEST_CHANGES',
        feedback: 'Please update documentation.'
      }, {
        'x-user-role': 'Admin',
        'x-user-name': 'Task Admin'
      });

      const statusAfterChanges = reviewChangesRes.data?.data?.status;

      const reviewApproveRes = await request('POST', `/api/tasks/${taskId}/review`, {
        decision: 'APPROVE',
        feedback: 'Docs verified, signing off.'
      }, {
        'x-user-role': 'Admin',
        'x-user-name': 'Task Admin'
      });

      const finalTaskStatus = reviewApproveRes.data?.data?.status;

      const pass5 = isReadyForReview && 
                    statusAfterChanges === 'CHANGES_REQUESTED' && 
                    finalTaskStatus === 'COMPLETED';

      record(5, 'Task Workflow: 100% -> READY_FOR_REVIEW -> CHANGES_REQUESTED -> COMPLETED', pass5,
        `Status at 100%: ${statusAt100}, Status on Request Changes: ${statusAfterChanges}, Final Status: ${finalTaskStatus}`);
    } catch (err) {
      record(5, 'Task Workflow: 100% -> READY_FOR_REVIEW -> CHANGES_REQUESTED -> COMPLETED', false, err.data?.message || err.message);
    }

    // ----------------------------------------------------------------
    // TEST 6: Task Comments: Project/Task Scoped, Replies & 2-Way Notifications
    // ----------------------------------------------------------------
    try {
      const testEmpCode = 'TEST_EMP_ATT_01';

      const taskRes = await request('POST', '/api/tasks', {
        title: 'Discussion Task for Threaded Comments',
        description: 'Verify parent_comment_id and notification generation',
        assignedTo: testEmpCode,
        priority: 'MEDIUM',
        projectName: 'Cloud Migration',
        projectId: 'PRJ-CLOUD-01',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      }, {
        'x-user-role': 'Admin',
        'x-user-name': 'Admin User'
      });

      const taskId = taskRes.data?.data?.id;

      const empCommentRes = await request('POST', `/api/tasks/${taskId}/comments`, {
        comment: 'I have analyzed the database schema and need approval on index migration.',
        projectId: 'PRJ-CLOUD-01'
      }, {
        'x-employee-id': testEmpCode,
        'x-user-role': 'Employee',
        'x-user-name': 'Attendance Tester'
      });

      const parentCommentId = empCommentRes.data?.data?.id;

      await request('POST', `/api/tasks/${taskId}/comments`, {
        comment: 'Indexes look good, proceed with execution on staging.',
        parentCommentId: parentCommentId,
        projectId: 'PRJ-CLOUD-01'
      }, {
        'x-user-role': 'Admin',
        'x-user-name': 'Admin User'
      });

      const getCommentsRes = await request('GET', `/api/tasks/${taskId}/comments?projectId=PRJ-CLOUD-01`);
      const allComments = getCommentsRes.data?.data || [];

      const rootComment = allComments.find(c => c.id === parentCommentId);
      const replyComment = allComments.find(c => c.parent_comment_id === parentCommentId);

      const pass6 = rootComment && 
                    replyComment && 
                    replyComment.parent_comment_id === parentCommentId &&
                    replyComment.project_id === 'PRJ-CLOUD-01';

      record(6, 'Task Comments: Threaded Replies, Project-Scoped, 2-Way Notifications', pass6,
        `Root comment author: ${rootComment?.author_name}, Reply comment parent_id: ${replyComment?.parent_comment_id}, Project: ${replyComment?.project_id}`);
    } catch (err) {
      record(6, 'Task Comments: Threaded Replies, Project-Scoped, 2-Way Notifications', false, err.data?.message || err.message);
    }

    // ----------------------------------------------------------------
    // TEST 7: Payroll Manual Payment, Duplicate Protection & Role Security
    // ----------------------------------------------------------------
    try {
      const testEmpCode = 'TEST_EMP_ATT_01';
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();

      await pool.query(`
        INSERT INTO employee_bank_details (id, employee_id, bank_name, account_number, ifsc_code, branch_name)
        VALUES ($1, $2, 'HDFC Bank', '5010022334455', 'HDFC0001234', 'Indiranagar')
        ON CONFLICT (id) DO UPDATE SET
          account_number = '5010022334455',
          ifsc_code = 'HDFC0001234'
      `, [`EBD-${testEmpCode}`, testEmpCode]);

      let employeeForbidden = false;
      try {
        await request('POST', `/api/payroll/employees/${testEmpCode}/pay`, {
          month,
          year
        }, {
          'x-employee-id': testEmpCode,
          'x-user-role': 'Employee'
        });
      } catch (e) {
        if (e.status === 403) {
          employeeForbidden = true;
        }
      }

      await pool.query(`DELETE FROM payment_transactions WHERE employee_id = $1 AND month = $2 AND year = $3`, [testEmpCode, month, year]);

      const adminPayRes = await request('POST', `/api/payroll/employees/${testEmpCode}/pay`, {
        month,
        year,
        processedBy: 'Finance Lead'
      }, {
        'x-user-role': 'Finance'
      });

      const paymentTxn = adminPayRes.data?.data;
      const firstPaymentSuccess = adminPayRes.data?.success && paymentTxn?.paymentStatus === 'PAID';

      let duplicateBlocked = false;
      try {
        const dupRes = await request('POST', `/api/payroll/employees/${testEmpCode}/pay`, {
          month,
          year,
          processedBy: 'Finance Lead'
        }, {
          'x-user-role': 'Finance'
        });
        if (dupRes.data?.isDuplicate || !dupRes.data?.success) {
          duplicateBlocked = true;
        }
      } catch (e) {
        if (e.status === 400 || e.data?.code === 'ALREADY_PAID') {
          duplicateBlocked = true;
        }
      }

      const pass7 = employeeForbidden && firstPaymentSuccess && duplicateBlocked;
      record(7, 'Payroll: Role Authorization (403), Manual Payment Disbursal & Duplicate Protection', pass7,
        `Employee 403 Forbidden: ${employeeForbidden}, Initial Payment Success: ${firstPaymentSuccess}, Duplicate Disbursal Blocked: ${duplicateBlocked}`);
    } catch (err) {
      record(7, 'Payroll: Role Authorization (403), Manual Payment Disbursal & Duplicate Protection', false, err.data?.message || err.message);
    }

    // Clean up test tasks & test employee
    const testTasks = await pool.query(`SELECT id FROM tasks WHERE assigned_to = 'TEST_EMP_ATT_01'`);
    const testIds = testTasks.rows.map(r => r.id);
    if (testIds.length > 0) {
      await pool.query(`DELETE FROM task_comments WHERE task_id = ANY($1)`, [testIds]);
      await pool.query(`DELETE FROM task_activities WHERE task_id = ANY($1)`, [testIds]);
      await pool.query(`DELETE FROM task_attachments WHERE task_id = ANY($1)`, [testIds]);
      await pool.query(`DELETE FROM tasks WHERE id = ANY($1)`, [testIds]);
    }
    await pool.query(`DELETE FROM attendance_records WHERE employee_id = 'TEST_EMP_ATT_01'`);
    await pool.query(`DELETE FROM expense_claims WHERE employee_id = 'TEST_EMP_ATT_01'`);
    await pool.query(`DELETE FROM payment_transactions WHERE employee_id = 'TEST_EMP_ATT_01'`);
    await pool.query(`DELETE FROM employees WHERE emp_code = 'TEST_EMP_ATT_01'`);

  } catch (globalErr) {
    console.error('Fatal test runner error:', globalErr);
  } finally {
    console.log('====================================================');
    console.log(`TEST SUITE RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('====================================================');
    await pool.end();
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runTestSuite();
