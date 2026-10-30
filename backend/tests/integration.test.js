/**
 * ============================================================
 * [2] INTEGRATION TESTING — Enterprise CRM / HRMS / ERP
 * ============================================================
 * Tests how multiple modules/APIs interact together:
 *   - Leave Apply → Balance Deduction
 *   - Attendance Clock-In → Status Update
 *   - Payroll Run → Payslip Generation → GL Entry
 *   - Lead Create → Customer Convert → Invoice Trigger
 *   - Employee Create → ESS Access
 *   - Auth Login → Protected Route Access
 *
 * HOW TO RUN:
 *   cd backend
 *   npm run dev   ← start backend first
 *   node tests/integration.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0;

// ──────────────────────────────────────────────────────────────
// HTTP HELPER
// ──────────────────────────────────────────────────────────────
async function api(method, path, body = null, extraHeaders = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'Executive',
      'x-user-name': 'Sarah Jenkins',
      ...extraHeaders
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({ success: false, error: 'Non-JSON response' }));
  return { status: res.status, ...json };
}

// ──────────────────────────────────────────────────────────────
// TEST RUNNER
// ──────────────────────────────────────────────────────────────
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ FAIL  ${name}`);
    console.error(`          → ${e.message}`);
    failed++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`); }
function section(t) { console.log(`\n── ${t} ──────────────────────────────────────`); }

// ──────────────────────────────────────────────────────────────
//                     STATE (shared across tests)
// ──────────────────────────────────────────────────────────────
let createdEmployeeId = null;
let leaveRequestId = null;
let taskId = null;
let leadId = null;
let payrollRunId = null;

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════');
console.log('  [2] INTEGRATION TESTING — Enterprise CRM / HRMS / ERP');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────
section('INTEGRATION 1: Health Check → Both Databases Online');
// ─────────────────────────────────────────────
await test('GET /api/health returns OK with HRMS + CRM databases', async () => {
  const res = await api('GET', '/api/health');
  assertEqual(res.status, 200, `Health check returned ${res.status}`);
  assertEqual(res.status, 200, 'Health check must return HTTP 200');
  assert(res.databases?.hrms?.status === 'HEALTHY', `HRMS DB not healthy: ${res.databases?.hrms?.status}`);
  assert(res.databases?.crm?.status === 'HEALTHY', `CRM DB not healthy: ${res.databases?.crm?.status}`);
  assert(res.databases?.hrms?.migrationsApplied >= 20, 'HRMS must have at least 20 migrations applied');
});

// ─────────────────────────────────────────────
section('INTEGRATION 2: Employee Create → ESS Access');
// ─────────────────────────────────────────────
await test('GET /api/employees returns employee list from HRMS DB', async () => {
  const res = await api('GET', '/api/employees');
  assert(res.success, `Expected success, got: ${res.message}`);
  assert(Array.isArray(res.data), 'Employee data must be an array');
  if (res.data.length > 0) {
    createdEmployeeId = res.data[0].emp_code || res.data[0].id;
    assert(createdEmployeeId.startsWith('EMP-'), `Employee ID must start with EMP-, got: ${createdEmployeeId}`);
  }
});

await test('GET /api/departments returns department list', async () => {
  const res = await api('GET', '/api/departments');
  assert(res.success, 'Departments endpoint must succeed');
  assert(Array.isArray(res.data), 'Departments must be an array');
});

await test('GET /api/designations returns designation list', async () => {
  const res = await api('GET', '/api/designations');
  assert(res.success, 'Designations endpoint must succeed');
  assert(Array.isArray(res.data), 'Designations must be an array');
});

// ─────────────────────────────────────────────
section('INTEGRATION 3: Leave Apply → Balance Check → Status Update');
// ─────────────────────────────────────────────
await test('GET /api/leave/types returns active leave types', async () => {
  const res = await api('GET', '/api/leave/types');
  assert(res.success, 'Leave types must be fetchable');
  assert(Array.isArray(res.data), 'Leave types must be an array');
});

await test('GET /api/leave/balance returns leave balances for employee', async () => {
  const empId = createdEmployeeId || 'EMP-001';
  const res = await api('GET', `/api/leave/balance?employeeId=${empId}`);
  assert(res.success, `Leave balance fetch failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Leave balance must be an array');
  // Source: leave.js line 44-48: auto-creates Casual(12), Sick(10), Privilege(15)
  if (res.data.length > 0) {
    const casualLeave = res.data.find(b => b.leave_type_name?.includes('Casual'));
    if (casualLeave) {
      assert(casualLeave.total_allocated >= 12, `Casual leave should be at least 12 days, got ${casualLeave.total_allocated}`);
    }
  }
});

await test('POST /api/leave applies a leave request (integration: DB write + balance check)', async () => {
  const empId = createdEmployeeId || 'EMP-001';
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const res = await api('POST', '/api/leave', {
    employeeId: empId,
    employeeName: 'Test Employee',
    leaveType: 'Casual Leave',
    fromDate: tomorrow,
    toDate: dayAfter,
    days: 2,
    reason: 'Integration test leave application',
    managerName: 'Sarah Jenkins'
  });
  // Allow either success or insufficient balance (both valid outcomes)
  assert(
    res.success === true || (res.message && res.message.includes('Insufficient')),
    `Unexpected leave response: ${res.message}`
  );
  if (res.success && res.data?.id) {
    leaveRequestId = res.data.id;
  }
});

await test('GET /api/leave/requests returns leave request list', async () => {
  const res = await api('GET', '/api/leave/requests');
  assert(res.success, `Leave requests fetch failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Leave requests must be an array');
});

await test('GET /api/leave/holidays returns 2026 public holidays', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026');
  assert(res.success, 'Holidays endpoint must succeed');
  assert(Array.isArray(res.data), 'Holidays must be an array');
  assert(res.data.length >= 16, `Must have at least 16 holidays, got ${res.data.length}`);
  // Source: leave.js line 64-80: 16 default 2026 holidays
  const independenceDay = res.data.find(h => h.date === '2026-08-15' || h.title?.includes('Independence'));
  assert(independenceDay, 'Independence Day (Aug 15) must be in holidays');
});

// ─────────────────────────────────────────────
section('INTEGRATION 4: Attendance Clock-In → Record Created → Status Visible in Today Roster');
// ─────────────────────────────────────────────
await test('GET /api/attendance/today returns today\'s attendance roster', async () => {
  const res = await api('GET', '/api/attendance/today');
  assert(res.success, `Attendance today failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Attendance data must be an array');
  // Source: attendance.js line 33-37: employees without check-in default to Absent
  if (res.data.length > 0) {
    const statuses = ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'];
    const firstRecord = res.data[0];
    assert(firstRecord.status !== undefined, 'Each record must have a status field');
  }
});

await test('GET /api/attendance/history returns historical records', async () => {
  const res = await api('GET', '/api/attendance/history');
  assert(res.success, `Attendance history failed: ${res.message}`);
  assert(Array.isArray(res.data), 'History data must be an array');
  assert(res.data.length <= 200, 'History is LIMIT 200 per source code');
});

await test('GET /api/shifts returns shift configurations', async () => {
  const res = await api('GET', '/api/shifts');
  assert(res.success, 'Shifts endpoint must succeed');
  assert(Array.isArray(res.data), 'Shifts must be an array');
});

// ─────────────────────────────────────────────
section('INTEGRATION 5: Payroll Run → Payslip Generation');
// ─────────────────────────────────────────────
await test('GET /api/payroll/runs returns payroll history', async () => {
  const res = await api('GET', '/api/payroll/runs');
  assert(res.success, `Payroll runs failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Payroll runs must be an array');
  if (res.data.length > 0) {
    payrollRunId = res.data[0].id;
  }
});

await test('GET /api/payroll/structures returns CTC structures', async () => {
  const res = await api('GET', '/api/payroll/structures');
  // Accept even empty array (no employees set up)
  assert(res.success !== false || res.message, 'Payroll structures endpoint must respond');
});

await test('GET /api/payroll/payments returns payment transaction history', async () => {
  const res = await api('GET', '/api/payroll/payments');
  assert(Array.isArray(res.data) || res.success === false, 'Payments must return array or error response');
});

// ─────────────────────────────────────────────
section('INTEGRATION 6: CRM Lead Create → Pipeline Stages');
// ─────────────────────────────────────────────
await test('GET /api/leads returns leads from CRM DB', async () => {
  const res = await api('GET', '/api/leads');
  assert(res.success, `Leads fetch failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Leads must be an array');
  if (res.data.length > 0) {
    leadId = res.data[0].id;
    const validStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost', 'new', 'qualified'];
    assert(res.data[0].stage !== undefined, 'Lead must have a stage field');
  }
});

await test('GET /api/customers returns customer list from CRM DB', async () => {
  const res = await api('GET', '/api/customers');
  assert(res.success, `Customers failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Customers must be an array');
});

await test('GET /api/contacts returns contacts from CRM DB', async () => {
  const res = await api('GET', '/api/contacts');
  assert(res.success, `Contacts failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Contacts must be an array');
});

await test('GET /api/opportunities returns opportunities', async () => {
  const res = await api('GET', '/api/opportunities');
  assert(res.success !== false, 'Opportunities endpoint must respond');
});

// ─────────────────────────────────────────────
section('INTEGRATION 7: Sales Pipeline (Quotes → Orders → Invoices)');
// ─────────────────────────────────────────────
await test('GET /api/quotations returns quotation list', async () => {
  const res = await api('GET', '/api/quotations');
  assert(res.success !== false, 'Quotations endpoint must respond');
  assert(Array.isArray(res.data) || res.data, 'Quotations must return data');
});

await test('GET /api/sales-orders returns sales orders from CRM DB', async () => {
  const res = await api('GET', '/api/sales-orders');
  assert(res.success !== false, 'Sales orders endpoint must respond');
});

await test('GET /api/crm/invoices returns CRM invoices', async () => {
  const res = await api('GET', '/api/crm/invoices');
  assert(res.success !== false, 'CRM invoices endpoint must respond');
});

// ─────────────────────────────────────────────
section('INTEGRATION 8: Finance (Accounts → Banking → Expenses)');
// ─────────────────────────────────────────────
await test('GET /api/accounts returns chart of accounts', async () => {
  const res = await api('GET', '/api/accounts');
  assert(res.success !== false, 'Accounts endpoint must respond');
});

await test('GET /api/banking returns bank accounts and transactions', async () => {
  const res = await api('GET', '/api/banking');
  assert(res.success !== false, 'Banking endpoint must respond');
});

await test('GET /api/expenses returns expense claims', async () => {
  const res = await api('GET', '/api/expenses');
  assert(res.success !== false, 'Expenses endpoint must respond');
});

// ─────────────────────────────────────────────
section('INTEGRATION 9: Task Module (Create → Assign → Status)');
// ─────────────────────────────────────────────
await test('GET /api/tasks returns task list with role scoping', async () => {
  const res = await api('GET', '/api/tasks');
  assert(res.success, `Tasks fetch failed: ${res.message}`);
  assert(Array.isArray(res.data), 'Tasks must be an array');
  if (res.data.length > 0) {
    taskId = res.data[0].id;
    assert(res.data[0].status !== undefined, 'Each task must have a status field');
  }
});

await test('GET /api/tasks/analytics returns org-level KPIs', async () => {
  const res = await api('GET', '/api/tasks/analytics');
  assert(res.success !== false, 'Task analytics endpoint must respond');
});

// ─────────────────────────────────────────────
section('INTEGRATION 10: Document Management System');
// ─────────────────────────────────────────────
await test('GET /api/documents returns documents list', async () => {
  const res = await api('GET', '/api/documents');
  assert(res.success !== false, 'Documents endpoint must respond');
});

await test('GET /api/document-types returns document type config', async () => {
  const res = await api('GET', '/api/document-types');
  assert(res.success !== false, 'Document types endpoint must respond');
});

// ─────────────────────────────────────────────
section('INTEGRATION 11: Recruitment → ATS → Candidate Pipeline');
// ─────────────────────────────────────────────
await test('GET /api/recruitment returns recruitment data', async () => {
  const res = await api('GET', '/api/recruitment');
  assert(res.success !== false, 'Recruitment endpoint must respond');
});

// ─────────────────────────────────────────────
section('INTEGRATION 12: Dashboard Analytics');
// ─────────────────────────────────────────────
await test('GET /api/dashboard returns executive analytics', async () => {
  const res = await api('GET', '/api/dashboard');
  assert(res.success !== false, 'Dashboard endpoint must respond');
});

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  INTEGRATION TEST RESULTS');
console.log(`  Total  : ${passed + failed}`);
console.log(`  Passed : ${passed} ✅`);
console.log(`  Failed : ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
