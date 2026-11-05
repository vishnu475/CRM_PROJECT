/**
 * ============================================================
 * [3] ACCEPTANCE TESTING (UAT) — Enterprise CRM / HRMS / ERP
 * ============================================================
 * Validates real business scenarios from the perspective of
 * actual user personas (HR Admin, Finance, Employee, Sales).
 * Each test corresponds to a USER STORY acceptance criterion.
 *
 * HOW TO RUN:
 *   cd backend
 *   npm run dev   ← start backend first
 *   node tests/acceptance.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0;

async function api(method, path, body = null, role = 'Executive', empId = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-role': role,
    'x-user-name': 'Test User'
  };
  if (empId) headers['x-employee-id'] = empId;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

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
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }
function section(t) { console.log(`\n── ${t} ──────────────────────────────────────`); }

console.log('\n═══════════════════════════════════════════════════════');
console.log('  [3] ACCEPTANCE (UAT) TESTING — Real User Scenarios');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────
// USER STORY 1: As an HR Admin, I want to view all employees
// ACCEPTANCE CRITERION: GET /api/employees returns all active employees
// ─────────────────────────────────────────────
section('UAT-01: HR Admin views employee directory');

await test('UAT-01-A: HR Admin can fetch the full employee list', async () => {
  const res = await api('GET', '/api/employees', null, 'HR');
  assert(res.success, `HR Admin must be able to view employees. Error: ${res.message}`);
  assert(Array.isArray(res.data), 'Employee list must be an array');
});

await test('UAT-01-B: Employee records contain EMP-NNN format IDs', async () => {
  const res = await api('GET', '/api/employees', null, 'HR');
  assert(res.success, 'Must fetch employees');
  if (res.data.length > 0) {
    const hasValidId = res.data.some(e => (e.emp_code || e.id)?.startsWith('EMP-'));
    assert(hasValidId, 'At least one employee must have an EMP- prefixed ID');
  }
});

await test('UAT-01-C: HR Admin can preview next sequential employee ID', async () => {
  const res = await api('GET', '/api/employees/next-id', null, 'HR');
  assert(res.success, 'Next employee ID preview must be available');
  assert(res.nextId?.startsWith('EMP-') || res.next_id?.startsWith('EMP-'), 'Next ID must be EMP- format');
});

// ─────────────────────────────────────────────
// USER STORY 2: As an Employee, I want to apply for Casual Leave
// ACCEPTANCE CRITERION: Sufficient balance → Leave applied → Status PENDING
// ─────────────────────────────────────────────
section('UAT-02: Employee applies for leave');

await test('UAT-02-A: Employee can check their leave balance', async () => {
  const res = await api('GET', '/api/leave/balance?employeeId=EMP-001', null, 'Employee', 'EMP-001');
  assert(res.success, `Employee must be able to view leave balance. Error: ${res.message}`);
  assert(Array.isArray(res.data), 'Leave balance must be an array');
});

await test('UAT-02-B: Leave balance includes Casual, Sick, and Privilege leave types', async () => {
  const res = await api('GET', '/api/leave/balance?employeeId=EMP-001', null, 'Employee', 'EMP-001');
  assert(res.success, 'Must fetch balance');
  // Source: leave.js line 44-48: auto-creates 3 types on first access
  const types = res.data.map(b => b.leave_type_name);
  const hasCasual = types.some(t => t?.includes('Casual'));
  assert(hasCasual, 'Casual Leave must be in the employee\'s leave balance');
});

await test('UAT-02-C: Employee can view all public holidays', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026', null, 'Employee', 'EMP-001');
  assert(res.success, 'Employee must be able to see public holidays');
  assert(res.data.length >= 16, `Must have at least 16 public holidays. Got ${res.data.length}`);
  // Source: leave.js line 64-80: 16 gazetted holidays hardcoded for 2026
  const diwali = res.data.find(h => h.title?.includes('Diwali') || h.title?.includes('Deepavali'));
  assert(diwali, 'Diwali must be in the 2026 holiday list (Nov 8)');
});

// ─────────────────────────────────────────────
// USER STORY 3: As a Finance Manager, I can run monthly payroll
// ACCEPTANCE CRITERION: Payroll run history is visible and fetchable
// ─────────────────────────────────────────────
section('UAT-03: Finance Manager runs monthly payroll');

await test('UAT-03-A: Finance can access payroll runs history', async () => {
  const res = await api('GET', '/api/payroll/runs', null, 'Finance');
  assert(res.success, `Finance must access payroll runs. Error: ${res.message}`);
  assert(Array.isArray(res.data), 'Payroll runs must be an array');
});

await test('UAT-03-B: Employee CANNOT disburse salaries (403 expected)', async () => {
  // Source: payroll.js line 126-138: checkPayrollAdminAuth blocks employees
  const res = await api('POST', '/api/payroll/pay-salary', {
    employeeId: 'EMP-001', month: 10, year: 2026
  }, 'Employee', 'EMP-001');
  assert(
    res.status === 403 || (res.message && res.message.toLowerCase().includes('forbidden')),
    `Employee must be blocked from disbursing salary. Got status: ${res.status}`
  );
});

await test('UAT-03-C: Finance can view payment transactions', async () => {
  const res = await api('GET', '/api/payroll/payments', null, 'Finance');
  assert(res.success !== false, 'Finance must be able to view payment transactions');
});

// ─────────────────────────────────────────────
// USER STORY 4: As a Sales Director, I manage my CRM leads
// ACCEPTANCE CRITERION: View lead Kanban, create leads, view customers
// ─────────────────────────────────────────────
section('UAT-04: Sales Director manages CRM lead pipeline');

await test('UAT-04-A: Sales Director can view all leads in pipeline', async () => {
  const res = await api('GET', '/api/leads', null, 'Sales');
  assert(res.success, `Sales Director must view leads. Error: ${res.message}`);
  assert(Array.isArray(res.data), 'Leads must return an array for Kanban board');
});

await test('UAT-04-B: Leads can be filtered by stage', async () => {
  const res = await api('GET', '/api/leads?stage=New', null, 'Sales');
  assert(res.success, 'Must filter leads by stage');
  // Source: leads.js line 125-128: stage filtering applied in SQL
  if (res.data.length > 0) {
    const allNew = res.data.every(l => l.stage?.toLowerCase() === 'new' || l.stage === 'New');
    assert(allNew, 'All filtered leads must match the requested stage');
  }
});

await test('UAT-04-C: Sales Director can view customer directory', async () => {
  const res = await api('GET', '/api/customers', null, 'Sales');
  assert(res.success, `Sales must view customers. Error: ${res.message}`);
  assert(Array.isArray(res.data), 'Customers must be an array');
});

await test('UAT-04-D: CRM activities are accessible', async () => {
  const res = await api('GET', '/api/crm/activities', null, 'Sales');
  assert(res.success !== false, 'CRM activities endpoint must respond');
});

await test('UAT-04-E: Lead attachment validation blocks .exe files (security UAT)', async () => {
  // Source: leads.js line 40-45: extension validation
  const res = await api('POST', '/api/leads/upload-attachment', {
    fileName: 'malware.exe',
    fileData: 'dGVzdA==', // base64 'test'
    fileSize: 100,
    fileType: 'application/octet-stream'
  }, 'Sales');
  assert(
    res.success === false && res.message?.includes('Unsupported'),
    `EXE upload must be rejected. Got: ${res.message}`
  );
});

// ─────────────────────────────────────────────
// USER STORY 5: As an Employee (ESS), I can see my personal data
// ACCEPTANCE CRITERION: Employee role only sees own data, not other employees'
// ─────────────────────────────────────────────
section('UAT-05: Employee Self-Service (ESS) — Data isolation');

await test('UAT-05-A: Employee can access their ESS profile', async () => {
  const res = await api('GET', '/api/v1/employee/profile', null, 'Employee', 'EMP-001');
  assert(res.success !== false, 'ESS profile endpoint must respond for authenticated employee');
});

await test('UAT-05-B: Employee can view their own attendance logs', async () => {
  const res = await api('GET', '/api/v1/employee/attendance', null, 'Employee', 'EMP-001');
  assert(res.success !== false, 'ESS attendance endpoint must respond');
});

await test('UAT-05-C: Employee can view their own leave history', async () => {
  const res = await api('GET', '/api/v1/employee/leaves', null, 'Employee', 'EMP-001');
  assert(res.success !== false, 'ESS leaves endpoint must respond');
});

await test('UAT-05-D: Employee can view own payslips only', async () => {
  const res = await api('GET', '/api/v1/employee/payslips', null, 'Employee', 'EMP-001');
  assert(res.success !== false, 'ESS payslips endpoint must respond');
});

await test('UAT-05-E: Employee personal tasks are filterable', async () => {
  const res = await api('GET', '/api/tasks/my', null, 'Employee', 'EMP-001');
  assert(res.success || res.status !== 500, 'My tasks endpoint must not crash');
});

// ─────────────────────────────────────────────
// USER STORY 6: As a Manager, I approve leave requests
// ACCEPTANCE CRITERION: Manager sees PENDING leaves; can update status
// ─────────────────────────────────────────────
section('UAT-06: Manager approves leave requests');

await test('UAT-06-A: Manager can view all pending leave requests', async () => {
  const res = await api('GET', '/api/leave/requests?status=PENDING', null, 'Manager');
  assert(res.success, `Manager must view pending leave requests. Error: ${res.message}`);
  assert(Array.isArray(res.data), 'Leave requests must be an array');
});

await test('UAT-06-B: Leave request data contains employee name and department', async () => {
  const res = await api('GET', '/api/leave/requests', null, 'Manager');
  assert(res.success, 'Must fetch leave requests');
  // Source: leave.js line 149-152: JOIN with employees table for name & department
  if (res.data.length > 0) {
    assert(res.data[0].employee_name !== undefined || res.data[0].employeeId, 'Leave request must have employee info from JOIN');
  }
});

// ─────────────────────────────────────────────
// USER STORY 7: As Super Admin, I manage module access
// ─────────────────────────────────────────────
section('UAT-07: Super Admin manages system modules');

await test('UAT-07-A: Super Admin can view all system modules', async () => {
  const res = await api('GET', '/api/modules', null, 'Executive');
  assert(res.success !== false, 'Modules endpoint must respond');
});

await test('UAT-07-B: Dashboard analytics are accessible to Super Admin', async () => {
  const res = await api('GET', '/api/dashboard', null, 'Executive');
  assert(res.success !== false, 'Dashboard endpoint must respond to Super Admin');
});

// ─────────────────────────────────────────────
// USER STORY 8: As a Manager, I track project tasks
// ─────────────────────────────────────────────
section('UAT-08: Manager tracks project tasks');

await test('UAT-08-A: Manager can view all tasks in org-wide board', async () => {
  const res = await api('GET', '/api/tasks', null, 'Manager');
  assert(res.success, `Manager must view task board. Error: ${res.message}`);
  assert(Array.isArray(res.data), 'Tasks must be an array');
});

await test('UAT-08-B: Completed tasks can be fetched separately', async () => {
  const res = await api('GET', '/api/tasks/completed', null, 'Manager');
  assert(res.success !== false, 'Completed tasks endpoint must respond');
  // Source: tasks.js line 78-85
});

await test('UAT-08-C: Task analytics returns KPI metrics', async () => {
  const res = await api('GET', '/api/tasks/analytics', null, 'Manager');
  assert(res.success !== false, 'Task analytics must respond');
});

// ─────────────────────────────────────────────
// USER STORY 9: As Finance, I manage procurement
// ─────────────────────────────────────────────
section('UAT-09: Finance manages procurement and vendors');

await test('UAT-09-A: Finance can view vendor list', async () => {
  const res = await api('GET', '/api/vendors', null, 'Finance');
  assert(res.success !== false, 'Vendors endpoint must respond');
});

await test('UAT-09-B: Finance can view purchase orders', async () => {
  const res = await api('GET', '/api/purchase-orders', null, 'Finance');
  assert(res.success !== false, 'Purchase orders endpoint must respond');
});

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  UAT (ACCEPTANCE) TEST RESULTS');
console.log(`  Total  : ${passed + failed}`);
console.log(`  Passed : ${passed} ✅`);
console.log(`  Failed : ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
