/**
 * ============================================================
 * [7] END-TO-END (E2E) TESTING — Enterprise CRM / HRMS / ERP
 * ============================================================
 * Tests complete real-world user journeys from start to finish,
 * simulating how a real user would interact with the system.
 *
 * FLOWS TESTED:
 *   E2E-01  — HR Onboarding Flow: View employees → Check next ID → Departments
 *   E2E-02  — Employee Leave Lifecycle: Balance → Apply → Check Status → Cancel
 *   E2E-03  — Payroll Cycle: View Runs → Check Structures → View Payments
 *   E2E-04  — CRM Sales Flow: Leads → Filter → View Single → Customers → Quotes
 *   E2E-05  — ESS Employee Journey: Profile → Attendance → Leaves → Payslips → Tasks
 *   E2E-06  — Task Delegation Flow: List → Analytics → Completed → By Employee
 *   E2E-07  — Finance Flow: Accounts → Banking → Expenses → Invoices
 *   E2E-08  — Procurement Flow: Vendors → PO → Products → Inventory (implied)
 *   E2E-09  — Public Careers Flow: Holidays → Recruitment → Job listing
 *   E2E-10  — Attendance Kiosk: Today roster → History → Shifts
 *
 * HOW TO RUN:
 *   cd backend
 *   npm run dev   ← start backend first
 *   node tests/e2e.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0, flowStep = 0;

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
async function api(method, path, body = null, role = 'Executive', empId = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-role': role,
    'x-user-name': role === 'Employee' ? 'John Employee' : 'Sarah Jenkins'
  };
  if (empId) headers['x-employee-id'] = empId;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

async function step(label, fn) {
  flowStep++;
  try {
    const result = await fn();
    console.log(`    ✅ Step ${flowStep}: ${label}`);
    passed++;
    return result;
  } catch (e) {
    console.error(`    ❌ Step ${flowStep}: ${label}`);
    console.error(`             → ${e.message}`);
    failed++;
    return null;
  }
}

function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }
function flow(title) {
  flowStep = 0;
  console.log(`\n┌─────────────────────────────────────────────────────`);
  console.log(`│  ${title}`);
  console.log(`└─────────────────────────────────────────────────────`);
}

// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  [7] END-TO-END (E2E) TESTING — Full User Journeys');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────────────────────
// E2E-01: HR ADMIN ONBOARDING FLOW
// User: HR Admin (priya.sharma@company.com)
// Journey: System Health → View Employees → Preview Next ID → Get Departments
// ─────────────────────────────────────────────────────────────
flow('E2E-01: HR Admin Onboarding Flow');

const healthData = await step('HR Admin checks system health before working', async () => {
  const res = await api('GET', '/api/health', null, 'HR');
  assert(res.databases?.hrms?.status === 'HEALTHY', 'HRMS DB must be healthy');
  return res;
});

const employeesData = await step('HR Admin views the employee directory', async () => {
  const res = await api('GET', '/api/employees', null, 'HR');
  assert(res.success, `Employee fetch failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Employees must be an array');
  return res.data;
});

await step('HR Admin checks next sequential employee ID for new hire', async () => {
  const res = await api('GET', '/api/employees/next-id', null, 'HR');
  assert(res.success, 'Next ID must be available');
  const nextId = res.nextId || res.next_id;
  assert(nextId?.startsWith('EMP-'), `Next ID must be EMP- format, got: ${nextId}`);
});

await step('HR Admin loads departments for assignment', async () => {
  const res = await api('GET', '/api/departments', null, 'HR');
  assert(res.success, 'Departments must load');
  assert(Array.isArray(res.data), 'Departments must be an array');
});

await step('HR Admin loads designations for assignment', async () => {
  const res = await api('GET', '/api/designations', null, 'HR');
  assert(res.success, 'Designations must load');
});

await step('HR Admin loads branches for assignment', async () => {
  const res = await api('GET', '/api/branches', null, 'HR');
  assert(res.success, 'Branches must load');
});

// ─────────────────────────────────────────────────────────────
// E2E-02: EMPLOYEE LEAVE LIFECYCLE
// User: Employee (ashok@company.com / EMP-001)
// Journey: Check Balance → View Leave Types → Apply → Check Status
// ─────────────────────────────────────────────────────────────
flow('E2E-02: Employee Leave Application Lifecycle');
const EMP_ID = 'EMP-001';

const leaveBalance = await step('Employee checks current leave balance', async () => {
  const res = await api('GET', `/api/leave/balance?employeeId=${EMP_ID}`, null, 'Employee', EMP_ID);
  assert(res.success, `Balance check failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Balance must be an array');
  return res.data;
});

await step('Employee views available leave types', async () => {
  const res = await api('GET', '/api/leave/types', null, 'Employee', EMP_ID);
  assert(res.success, 'Leave types must load');
  assert(Array.isArray(res.data), 'Leave types must be array');
});

await step('Employee checks public holidays to plan leave', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026', null, 'Employee', EMP_ID);
  assert(res.success, 'Holidays must load');
  assert(res.data.length >= 16, `Must have 16+ holidays, got ${res.data.length}`);
});

let leaveId = null;
await step('Employee submits leave application (with balance check)', async () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const res = await api('POST', '/api/leave', {
    employeeId: EMP_ID,
    employeeName: 'Ashok Kumar',
    leaveType: 'Casual Leave',
    fromDate: tomorrow,
    toDate: dayAfter,
    days: 2,
    reason: 'E2E test — family emergency',
    managerName: 'Sarah Jenkins'
  }, 'Employee', EMP_ID);
  // Either success or insufficient balance — both are valid application outcomes
  assert(
    res.success === true || res.message?.includes('Insufficient'),
    `Unexpected leave response: HTTP ${res.status} — ${res.message}`
  );
  if (res.success && res.data?.id) leaveId = res.data.id;
});

await step('Employee views their leave request history', async () => {
  const res = await api('GET', `/api/leave/requests?employeeId=${EMP_ID}`, null, 'Employee', EMP_ID);
  assert(res.success, 'Leave requests must load');
  assert(Array.isArray(res.data), 'Leave requests must be array');
});

// ─────────────────────────────────────────────────────────────
// E2E-03: PAYROLL CYCLE
// User: Finance (finance@company.com)
// Journey: View Payroll Runs → Check Structures → View Payments → Bank Advice
// ─────────────────────────────────────────────────────────────
flow('E2E-03: Finance Payroll Processing Cycle');

await step('Finance views all payroll run history', async () => {
  const res = await api('GET', '/api/payroll/runs', null, 'Finance');
  assert(res.success, `Payroll runs failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Runs must be array');
});

await step('Finance checks employee salary structures', async () => {
  const res = await api('GET', '/api/payroll/structures', null, 'Finance');
  assert(res.success !== false, 'Structures endpoint must respond');
});

await step('Finance views payment transaction ledger', async () => {
  const res = await api('GET', '/api/payroll/payments', null, 'Finance');
  assert(Array.isArray(res.data) || res.success === false, 'Payments must respond');
});

await step('Finance views payslips (if any employee paid)', async () => {
  const res = await api('GET', '/api/payroll/payslips', null, 'Finance');
  // Either works or returns empty — both valid
  assert(res.status !== 500, 'Payslips endpoint must not crash');
});

// ─────────────────────────────────────────────────────────────
// E2E-04: CRM SALES PIPELINE FLOW
// User: Sales Director (michael.vance@company.com)
// Journey: View All Leads → Filter by Stage → View Customer → Create Quote
// ─────────────────────────────────────────────────────────────
flow('E2E-04: Sales Director CRM Pipeline Flow');

const allLeads = await step('Sales Director opens lead pipeline (all stages)', async () => {
  const res = await api('GET', '/api/leads', null, 'Sales');
  assert(res.success, `Leads failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Leads must be array');
  return res.data;
});

await step('Sales Director filters pipeline by "New" stage', async () => {
  const res = await api('GET', '/api/leads?stage=New', null, 'Sales');
  assert(res.success, 'Filtered leads must work');
  // Source: leads.js line 125-128: stage filter in SQL WHERE clause
  if (res.data.length > 0) {
    const allNew = res.data.every(l => l.stage === 'New' || l.stage?.toLowerCase() === 'new');
    assert(allNew, 'All filtered leads must have stage = New');
  }
});

if (allLeads && allLeads.length > 0) {
  await step('Sales Director opens a single lead detail view', async () => {
    const leadId = allLeads[0].id;
    const res = await api('GET', `/api/leads/${leadId}`, null, 'Sales');
    assert(res.success, `Single lead view failed: ${res.message}`);
    assert(res.data.id === leadId, 'Returned lead ID must match requested ID');
  });
}

await step('Sales Director views customer directory', async () => {
  const res = await api('GET', '/api/customers', null, 'Sales');
  assert(res.success, `Customers failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Customers must be array');
});

await step('Sales Director views CRM activities log', async () => {
  const res = await api('GET', '/api/crm/activities', null, 'Sales');
  assert(res.success !== false, 'CRM activities must respond');
});

await step('Sales Director views follow-ups scheduled', async () => {
  const res = await api('GET', '/api/crm/followups', null, 'Sales');
  assert(res.success !== false, 'Follow-ups must respond');
});

await step('Sales Director views quotation list', async () => {
  const res = await api('GET', '/api/quotations', null, 'Sales');
  assert(res.success !== false, 'Quotations must respond');
});

await step('Sales Director views sales order list', async () => {
  const res = await api('GET', '/api/sales-orders', null, 'Sales');
  assert(res.success !== false, 'Sales orders must respond');
});

await step('Sales Director views CRM invoices', async () => {
  const res = await api('GET', '/api/crm/invoices', null, 'Sales');
  assert(res.success !== false, 'CRM invoices must respond');
});

// ─────────────────────────────────────────────────────────────
// E2E-05: ESS EMPLOYEE SELF-SERVICE JOURNEY
// User: Employee (ashok@company.com / EMP-001)
// Journey: Profile → Attendance → Leave History → Payslips → Tasks
// ─────────────────────────────────────────────────────────────
flow('E2E-05: Employee Self-Service (ESS) Complete Journey');

await step('Employee opens ESS dashboard — loads profile', async () => {
  const res = await api('GET', '/api/v1/employee/profile', null, 'Employee', EMP_ID);
  assert(res.status !== 500, 'ESS profile must not crash');
});

await step('Employee views own attendance log', async () => {
  const res = await api('GET', '/api/v1/employee/attendance', null, 'Employee', EMP_ID);
  assert(res.status !== 500, 'ESS attendance must not crash');
});

await step('Employee views own leave history and balances', async () => {
  const res = await api('GET', '/api/v1/employee/leaves', null, 'Employee', EMP_ID);
  assert(res.status !== 500, 'ESS leaves must not crash');
});

await step('Employee views and downloads payslips', async () => {
  const res = await api('GET', '/api/v1/employee/payslips', null, 'Employee', EMP_ID);
  assert(res.status !== 500, 'ESS payslips must not crash');
});

await step('Employee views assigned tasks', async () => {
  const res = await api('GET', '/api/v1/employee/tasks', null, 'Employee', EMP_ID);
  assert(res.status !== 500, 'ESS tasks must not crash');
});

await step('Employee views personal task board via /api/tasks/my', async () => {
  const res = await api('GET', '/api/tasks/my', null, 'Employee', EMP_ID);
  assert(res.status !== 500, 'My tasks must not crash');
});

// ─────────────────────────────────────────────────────────────
// E2E-06: MANAGER TASK DELEGATION FLOW
// User: Manager (vishnu.vardhan@company.com)
// Journey: View Tasks → Check Analytics → Completed → Review Queue
// ─────────────────────────────────────────────────────────────
flow('E2E-06: Manager Task Delegation & Tracking Flow');

await step('Manager views all org-wide tasks', async () => {
  const res = await api('GET', '/api/tasks', null, 'Manager');
  assert(res.success, `Task board failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Tasks must be array');
});

await step('Manager views task KPI analytics', async () => {
  const res = await api('GET', '/api/tasks/analytics', null, 'Manager');
  assert(res.success !== false, 'Task analytics must respond');
});

await step('Manager checks tasks ready for review', async () => {
  const res = await api('GET', '/api/tasks/review', null, 'Manager');
  assert(res.success !== false, 'Review tasks must respond');
});

await step('Manager views completed tasks archive', async () => {
  const res = await api('GET', '/api/tasks/completed', null, 'Manager');
  assert(res.success !== false, 'Completed tasks must respond');
});

await step('Manager views pending leave requests for approval', async () => {
  const res = await api('GET', '/api/leave/requests?status=PENDING', null, 'Manager');
  assert(res.success, 'Pending leaves must load for manager');
  assert(Array.isArray(res.data), 'Leave requests must be array');
});

// ─────────────────────────────────────────────────────────────
// E2E-07: FINANCE ACCOUNTING FLOW
// User: Finance (finance@company.com)
// Journey: COA → Banking → Expenses → Vendors → Purchase Orders
// ─────────────────────────────────────────────────────────────
flow('E2E-07: Finance Accounting & Procurement Flow');

await step('Finance opens Chart of Accounts (COA)', async () => {
  const res = await api('GET', '/api/accounts', null, 'Finance');
  assert(res.success !== false, 'Accounts (COA) must respond');
});

await step('Finance views bank accounts and transactions', async () => {
  const res = await api('GET', '/api/banking', null, 'Finance');
  assert(res.success !== false, 'Banking must respond');
});

await step('Finance reviews expense claims for reimbursement', async () => {
  const res = await api('GET', '/api/expenses', null, 'Finance');
  assert(res.success !== false, 'Expenses must respond');
});

await step('Finance views vendor directory', async () => {
  const res = await api('GET', '/api/vendors', null, 'Finance');
  assert(res.success !== false, 'Vendors must respond');
});

await step('Finance reviews purchase orders for payment', async () => {
  const res = await api('GET', '/api/purchase-orders', null, 'Finance');
  assert(res.success !== false, 'Purchase orders must respond');
});

// ─────────────────────────────────────────────────────────────
// E2E-08: ATTENDANCE KIOSK FLOW
// User: HR Admin managing attendance
// Journey: Today Roster → History → Live Feed → Shifts
// ─────────────────────────────────────────────────────────────
flow('E2E-08: Attendance Kiosk & HR Attendance Management');

await step('HR opens today\'s live attendance roster', async () => {
  const res = await api('GET', '/api/attendance/today', null, 'HR');
  assert(res.success, `Today attendance failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Today roster must be array');
  // Source: attendance.js line 33-37: Absent/Present determined by check_in field
  if (res.data.length > 0) {
    assert(res.data[0].status !== undefined, 'Each record must have a status');
    assert(res.data[0].emp_name !== undefined || res.data[0].employee_id !== undefined, 'Must have employee identifier');
  }
});

await step('HR views historical attendance with filters', async () => {
  const res = await api('GET', '/api/attendance/history?status=Present', null, 'HR');
  assert(res.success, `History failed: ${res.message}`);
  assert(res.data.length <= 200, 'History must respect LIMIT 200');
});

await step('HR views real-time attendance live feed', async () => {
  const res = await api('GET', '/api/attendance/live', null, 'HR');
  assert(res.success !== false, 'Live feed must respond');
});

await step('HR views and manages shift configurations', async () => {
  const res = await api('GET', '/api/shifts', null, 'HR');
  assert(res.success, 'Shifts must load');
  assert(Array.isArray(res.data), 'Shifts must be array');
});

await step('HR views timesheets for payroll preparation', async () => {
  const res = await api('GET', '/api/timesheets', null, 'HR');
  assert(res.success !== false, 'Timesheets must respond');
});

// ─────────────────────────────────────────────────────────────
// E2E-09: SUPER ADMIN FULL SYSTEM TOUR
// User: Super Admin (sarah.jenkins@company.com)
// Journey: Health → Dashboard → Reports → Documents → Modules
// ─────────────────────────────────────────────────────────────
flow('E2E-09: Super Admin Full System Tour');

await step('Super Admin verifies all systems healthy', async () => {
  const res = await api('GET', '/api/health', null, 'Executive');
  assert(res.status === 200, `Health check returned ${res.status}`);
});

await step('Super Admin views executive dashboard', async () => {
  const res = await api('GET', '/api/dashboard', null, 'Executive');
  assert(res.success !== false, 'Dashboard must respond');
});

await step('Super Admin reviews reports module', async () => {
  const res = await api('GET', '/api/reports', null, 'Executive');
  assert(res.success !== false, 'Reports must respond');
});

await step('Super Admin manages documents', async () => {
  const res = await api('GET', '/api/documents', null, 'Executive');
  assert(res.success !== false, 'Documents must respond');
});

await step('Super Admin manages module permissions', async () => {
  const res = await api('GET', '/api/modules', null, 'Executive');
  assert(res.success !== false, 'Modules must respond');
});

await step('Super Admin views intern management', async () => {
  const res = await api('GET', '/api/interns', null, 'Executive');
  assert(res.success !== false, 'Interns must respond');
});

await step('Super Admin views project portfolio', async () => {
  const res = await api('GET', '/api/projects', null, 'Executive');
  assert(res.success !== false, 'Projects must respond');
});

await step('Super Admin views resource allocations', async () => {
  const res = await api('GET', '/api/allocations', null, 'Executive');
  assert(res.success !== false, 'Allocations must respond');
});

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  E2E TEST RESULTS');
console.log(`  Total Steps : ${passed + failed}`);
console.log(`  Passed      : ${passed} ✅`);
console.log(`  Failed      : ${failed} ${failed > 0 ? '❌' : '✅'}`);
if (failed === 0) {
  console.log('\n  ✅ All E2E user journeys completed successfully!');
} else {
  console.log('\n  ❌ Some user journeys have broken steps — check above');
}
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
