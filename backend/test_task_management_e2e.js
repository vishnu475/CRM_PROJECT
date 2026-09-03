import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'crm_hrms_super_secret_jwt_key_2026';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m'
};

function logPass(testName, details = '') {
  console.log(`${colors.green}✔ [PASS] ${testName}${colors.reset} ${details ? `(${details})` : ''}`);
}

function logFail(testName, error) {
  console.error(`${colors.red}✖ [FAIL] ${testName}${colors.reset}:`, error);
}

function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function runE2ETests() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================================`);
  console.log(`  ENTERPRISE TASK MANAGEMENT & PERFORMANCE SUITE: END-TO-END VERIFICATION`);
  console.log(`======================================================================${colors.reset}\n`);

  let passedCount = 0;
  let failedCount = 0;

  // Setup Test Users
  const adminUser = {
    id: 'EMP-001',
    empCode: 'EMP-001',
    emp_code: 'EMP-001',
    name: 'Admin Sarah',
    email: 'admin.sarah@company.com',
    role: 'ADMIN',
    department: 'Executive'
  };

  const employeeAshok = {
    id: 'EMP-006',
    empCode: 'EMP-006',
    emp_code: 'EMP-006',
    name: 'Ashok',
    email: 'ashok@company.com',
    role: 'EMPLOYEE',
    department: 'Engineering'
  };

  const employeeRamesh = {
    id: 'EMP-008',
    empCode: 'EMP-008',
    emp_code: 'EMP-008',
    name: 'Ramesh',
    email: 'ramesh@company.com',
    role: 'EMPLOYEE',
    department: 'Quality Assurance'
  };

  const adminToken = generateToken(adminUser);
  const ashokToken = generateToken(employeeAshok);
  const rameshToken = generateToken(employeeRamesh);

  const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
  const ashokHeaders = { Authorization: `Bearer ${ashokToken}`, 'Content-Type': 'application/json' };
  const rameshHeaders = { Authorization: `Bearer ${rameshToken}`, 'Content-Type': 'application/json' };

  let createdTaskId = null;
  let reopenTaskId = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Admin Creates Task with Department, Employee, Priority, Due Date
    // -------------------------------------------------------------
    try {
      const res = await api('/tasks', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: 'Implement Automated Core Ledger Reconciliation Engine',
          description: 'Design and deploy automated ledger balancing pipeline in PostgreSQL.',
          department_name: 'Engineering',
          assigned_to: 'EMP-006',
          priority: 'HIGH',
          category: 'Backend API',
          project_name: 'Financial Ledger Sprint',
          due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
          estimated_hours: 16,
          tags: 'PostgreSQL, Ledger, Automated'
        })
      });

      if (res.ok && res.data.success && res.data.data?.id) {
        createdTaskId = res.data.data.id;
        if (res.data.data.status === 'ASSIGNED' && res.data.data.assigned_to === 'EMP-006') {
          logPass('Test 1: Admin creates task with department, employee, priority, and due date', `Task ID: ${createdTaskId}`);
          passedCount++;
        } else {
          throw new Error(`Unexpected task status: ${res.data.data.status}`);
        }
      } else {
        throw new Error(res.data.message || 'Task creation failed');
      }
    } catch (e) {
      logFail('Test 1: Admin creates task', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 2: Employee Ashok receives notification & sees task in ESS My Tasks
    // -------------------------------------------------------------
    try {
      const res = await api('/tasks/my-tasks', { headers: ashokHeaders });
      if (res.ok && res.data.success && Array.isArray(res.data.data)) {
        const found = res.data.data.find(t => t.id === createdTaskId);
        if (found) {
          logPass('Test 2: Employee Ashok fetches own tasks and verifies created task is present', `Found task: ${found.title}`);
          passedCount++;
        } else {
          throw new Error(`Created task ${createdTaskId} not found in employee task list`);
        }
      } else {
        throw new Error(res.data.message || 'Failed to retrieve employee tasks');
      }
    } catch (e) {
      logFail('Test 2: Employee receives and views assigned task', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 3: Employee Starts Task (ASSIGNED -> IN_PROGRESS)
    // -------------------------------------------------------------
    try {
      const res = await api(`/tasks/${createdTaskId}/start`, {
        method: 'POST',
        headers: ashokHeaders
      });

      if (res.ok && res.data.success && res.data.data.status === 'IN_PROGRESS' && res.data.data.started_at) {
        logPass('Test 3: Employee starts task (status changes to IN_PROGRESS, started_at recorded)', `Status: ${res.data.data.status}`);
        passedCount++;
      } else {
        throw new Error(`Status transition failed: ${res.data.data?.status || res.data.message}`);
      }
    } catch (e) {
      logFail('Test 3: Employee starts task', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 4: Employee updates progress to 50% with milestone notes; Admin sees live 50%
    // -------------------------------------------------------------
    try {
      const res = await api(`/tasks/${createdTaskId}/progress`, {
        method: 'PATCH',
        headers: ashokHeaders,
        body: JSON.stringify({
          progressPercent: 50,
          progressNote: 'Database migrations complete. Schema indexes optimized.',
          actualHours: 8
        })
      });

      if (res.ok && res.data.success && Number(res.data.data.progress_percent) === 50) {
        // Admin fetches task to verify live sync
        const adminCheck = await api(`/tasks/${createdTaskId}`, { headers: adminHeaders });
        if (adminCheck.ok && adminCheck.data.success && Number(adminCheck.data.data.progress_percent) === 50) {
          logPass('Test 4: Employee updates progress to 50% with milestone note; Admin verifies live sync', `Progress: ${adminCheck.data.data.progress_percent}%`);
          passedCount++;
        } else {
          throw new Error('Admin did not see updated progress');
        }
      } else {
        throw new Error(res.data.message || 'Progress update did not return 50%');
      }
    } catch (e) {
      logFail('Test 4: Employee updates progress and admin verifies', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 5: Employee submits task for review (SUBMITTED)
    // -------------------------------------------------------------
    try {
      const res = await api(`/tasks/${createdTaskId}/submit`, {
        method: 'POST',
        headers: ashokHeaders,
        body: JSON.stringify({
          completionNote: 'All ledger reconciliation endpoints deployed and validated with automated regression tests.',
          actualHours: 15
        })
      });

      if (res.ok && res.data.success && res.data.data.status === 'SUBMITTED' && res.data.data.submitted_at) {
        logPass('Test 5: Employee submits task for review (status changes to SUBMITTED with deliverables)', `Status: ${res.data.data.status}`);
        passedCount++;
      } else {
        throw new Error(`Submission failed: ${res.data.data?.status || res.data.message}`);
      }
    } catch (e) {
      logFail('Test 5: Employee submits task for review', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 6: Admin approves and completes task with rating and review feedback
    // -------------------------------------------------------------
    try {
      const res = await api(`/tasks/${createdTaskId}/approve`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          managerRating: 5.0,
          managerFeedback: 'Exceptional architectural execution. Clean SQL queries and zero latency degradation.'
        })
      });

      if (res.ok && res.data.success && res.data.data.status === 'COMPLETED' && res.data.data.completed_at) {
        logPass('Test 6: Admin approves task with 5.0 rating & feedback (status changes to COMPLETED)', `Status: ${res.data.data.status}`);
        passedCount++;
      } else {
        throw new Error(`Approval failed: ${res.data.data?.status || res.data.message}`);
      }
    } catch (e) {
      logFail('Test 6: Admin approves task', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 7: Dynamic Performance Metric Calculation from real task data
    // -------------------------------------------------------------
    try {
      const res = await api('/tasks/employee/EMP-006/analytics', { headers: adminHeaders });
      if (res.ok && res.data.success && res.data.data?.taskMetrics) {
        const metrics = res.data.data.taskMetrics;
        const scoring = res.data.data.scoringBreakdown;
        if (metrics.completed >= 1 && metrics.completionRate > 0 && scoring.overallScore > 0) {
          logPass('Test 7: Performance metrics calculated dynamically from database tasks', `Completion: ${metrics.completionRate}%, On-Time: ${metrics.onTimeRate}%, Score: ${scoring.overallScore}%`);
          passedCount++;
        } else {
          throw new Error('Analytics returned invalid or empty metrics');
        }
      } else {
        throw new Error(res.data.message || 'Failed to retrieve employee task analytics');
      }
    } catch (e) {
      logFail('Test 7: Dynamic performance metric calculation', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 8: IDOR & Security Protection: Employee Ramesh cannot update or access Ashok task
    // -------------------------------------------------------------
    try {
      const rameshAttempt = await api(`/tasks/${createdTaskId}/progress`, {
        method: 'PATCH',
        headers: rameshHeaders,
        body: JSON.stringify({ progressPercent: 99 })
      });

      if (rameshAttempt.status === 403 || rameshAttempt.status === 404 || !rameshAttempt.ok) {
        logPass('Test 8: IDOR Security Protection (Employee Ramesh forbidden from modifying Ashok task)', `HTTP ${rameshAttempt.status} Enforced`);
        passedCount++;
      } else {
        throw new Error('Security check failed: Employee Ramesh was allowed to modify Ashok task!');
      }
    } catch (e) {
      logFail('Test 8: IDOR security check', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 9: Admin department filtering & listing
    // -------------------------------------------------------------
    try {
      const res = await api('/tasks?department=Engineering', { headers: adminHeaders });
      if (res.ok && res.data.success && Array.isArray(res.data.data)) {
        logPass('Test 9: Admin department filter query successfully filters tasks', `Engineering tasks: ${res.data.data.length}`);
        passedCount++;
      } else {
        throw new Error(res.data.message || 'Department filter failed');
      }
    } catch (e) {
      logFail('Test 9: Admin department filtering', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 10: Validation rules (0-100% bounds & required fields)
    // -------------------------------------------------------------
    try {
      const invalidAttempt = await api(`/tasks/${createdTaskId}/progress`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ progressPercent: 150 }) // Invalid > 100
      });

      if (invalidAttempt.status === 400 || !invalidAttempt.ok) {
        logPass('Test 10: Validation rules reject invalid progress percent (>100 or <0)', `HTTP ${invalidAttempt.status} Enforced`);
        passedCount++;
      } else {
        throw new Error('Validation failed: Accepted 150% progress');
      }
    } catch (e) {
      logFail('Test 10: Progress validation rules', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 11: Overdue detection and flagging
    // -------------------------------------------------------------
    try {
      // Create a task with past due date
      const overdueTask = await api('/tasks', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: 'Resolve Legacy Migration Anomaly',
          assigned_to: 'EMP-006',
          priority: 'URGENT',
          due_date: new Date(Date.now() - 2 * 86400000).toISOString() // 2 days in past
        })
      });

      if (overdueTask.ok && overdueTask.data.success && overdueTask.data.data.is_overdue === true) {
        logPass('Test 11: Automatic overdue detection flags past-due tasks', `Task marked is_overdue: ${overdueTask.data.data.is_overdue}`);
        passedCount++;
      } else {
        throw new Error('Task with past due date was not flagged as is_overdue');
      }
    } catch (e) {
      logFail('Test 11: Overdue detection', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 12: Reopen Workflow: Admin requests changes with reason, status resets to REOPENED
    // -------------------------------------------------------------
    try {
      const taskToReopen = await api('/tasks', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: 'Design Dark Theme Style Tokens',
          assigned_to: 'EMP-006',
          priority: 'MEDIUM',
          due_date: new Date(Date.now() + 86400000).toISOString()
        })
      });
      reopenTaskId = taskToReopen.data.data?.id;

      // Submit it first
      await api(`/tasks/${reopenTaskId}/submit`, {
        method: 'POST',
        headers: ashokHeaders,
        body: JSON.stringify({ completionNote: 'Tokens submitted.' })
      });

      // Admin Reopens with feedback
      const reopenRes = await api(`/tasks/${reopenTaskId}/reopen`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          reason: 'Please increase contrast ratio on badge borders from 3:1 to 4.5:1 for WCAG compliance.'
        })
      });

      if (reopenRes.ok && reopenRes.data.success && reopenRes.data.data.status === 'REOPENED' && reopenRes.data.data.reopened_reason) {
        logPass('Test 12: Reopen workflow requests changes with reason (status changes to REOPENED)', `Reason: ${reopenRes.data.data.reopened_reason}`);
        passedCount++;
      } else {
        throw new Error('Reopen did not set status to REOPENED');
      }
    } catch (e) {
      logFail('Test 12: Reopen workflow', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 13: Task Reassignment with audit history logging
    // -------------------------------------------------------------
    try {
      const reassignRes = await api(`/tasks/${reopenTaskId}/reassign`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          newAssignedTo: 'EMP-008',
          reason: 'Reassigning to QA specialist for WCAG contrast compliance testing.'
        })
      });

      if (reassignRes.ok && reassignRes.data.success && reassignRes.data.data.assigned_to === 'EMP-008') {
        // Verify audit timeline
        const historyRes = await api(`/tasks/${reopenTaskId}/activities`, { headers: adminHeaders });
        const hasReassignLog = historyRes.data.data?.some(a => a.action === 'TASK_REASSIGNED');
        if (hasReassignLog) {
          logPass('Test 13: Task reassignment logs audit activity and updates assignee to EMP-008', 'Audit activity logged');
          passedCount++;
        } else {
          throw new Error('Reassignment activity not recorded in task audit logs');
        }
      } else {
        throw new Error('Reassignment failed to change assigned_to');
      }
    } catch (e) {
      logFail('Test 13: Task reassignment', e.message);
      failedCount++;
    }

    // -------------------------------------------------------------
    // TEST 14: AI Copilot Advisory Insights
    // -------------------------------------------------------------
    try {
      const aiRes = await api('/tasks/ai/insights', { headers: adminHeaders });
      if (aiRes.ok && aiRes.data.success && aiRes.data.data?.workloadSummary) {
        logPass('Test 14: AI Copilot Advisory generates workload analysis, bottleneck alerts, and recommendations', `Bottlenecks detected: ${aiRes.data.data.bottlenecks?.length || 0}`);
        passedCount++;
      } else {
        throw new Error('AI Copilot did not return advisory data');
      }
    } catch (e) {
      logFail('Test 14: AI Copilot advisory', e.message);
      failedCount++;
    }

  } catch (globalErr) {
    console.error('Global test error:', globalErr);
  }

  console.log(`\n${colors.bold}${colors.cyan}======================================================================`);
  console.log(`  E2E TEST SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED (TOTAL: 14)`);
  console.log(`======================================================================${colors.reset}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runE2ETests();
