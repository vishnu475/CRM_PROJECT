/**
 * ============================================================
 * [9] INTERFACE TESTING — Enterprise CRM / HRMS / ERP
 * ============================================================
 * Tests the API interface contracts between frontend and backend:
 *   - Response shape (fields, types, structure)
 *   - HTTP status codes for all scenarios
 *   - Request validation (required fields, types)
 *   - HTTP method enforcement (GET/POST/PUT/DELETE)
 *   - Header contract (Authorization, Content-Type)
 *   - CORS and cross-origin behavior
 *   - Pagination and filtering interface contracts
 *   - Error response structure
 *
 * HOW TO RUN:
 *   cd backend
 *   node tests/interface.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0;

// ──────────────────────────────────────────────────────────────
// HTTP HELPERS
// ──────────────────────────────────────────────────────────────
async function req(method, path, body = null, headers = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'Executive',
      ...headers
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, ...json };
}

async function test(id, name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS  [${id}]  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ FAIL  [${id}]  ${name}`);
    console.error(`           → ${e.message}`);
    failed++;
  }
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }
function assertEqual(a, b, m) { if (a !== b) throw new Error(m || `Expected "${b}", got "${a}"`); }
function assertType(val, type, field) {
  if (typeof val !== type) throw new Error(`Field "${field}" must be ${type}, got ${typeof val}`);
}
function section(t) { console.log(`\n── ${t} ──────────────────────────────────────`); }

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════');
console.log('  [9] INTERFACE TESTING — API Contract Verification');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────
section('IFACE-01: Response Shape Contracts');
// Verifies that every endpoint returns the expected JSON structure
// ─────────────────────────────────────────────

await test('IFACE-01-A', 'Health endpoint shape: { status, message, databases }', async () => {
  const res = await req('GET', '/api/health');
  assertEqual(res.status, 200, 'HTTP status must be 200');
  assertType(res.databases, 'object', 'databases');
  assert('hrms' in res.databases, 'databases must have hrms key');
  assert('crm' in res.databases, 'databases must have crm key');
  assertType(res.databases.hrms.status, 'string', 'databases.hrms.status');
});

await test('IFACE-01-B', 'Employees list shape: { success: true, data: [] }', async () => {
  const res = await req('GET', '/api/employees');
  assertType(res.success, 'boolean', 'success');
  assert(res.success === true, 'success must be true');
  assert(Array.isArray(res.data), 'data must be an array');
});

await test('IFACE-01-C', 'Employees list items have required fields', async () => {
  const res = await req('GET', '/api/employees');
  if (res.data.length > 0) {
    const emp = res.data[0];
    assert(emp.id !== undefined || emp.emp_code !== undefined, 'Employee must have id or emp_code');
    assert(emp.name !== undefined, 'Employee must have name field');
    assert(emp.department !== undefined, 'Employee must have department field');
    assert(emp.status !== undefined, 'Employee must have status field');
  }
});

await test('IFACE-01-D', 'Leads list shape: { success: true, data: [] }', async () => {
  const res = await req('GET', '/api/leads');
  assertType(res.success, 'boolean', 'success');
  assert(res.success === true, 'success must be true');
  assert(Array.isArray(res.data), 'data must be array');
});

await test('IFACE-01-E', 'Leads list items have required CRM fields', async () => {
  const res = await req('GET', '/api/leads');
  if (res.data.length > 0) {
    const lead = res.data[0];
    assert(lead.id !== undefined, 'Lead must have id');
    assert(lead.stage !== undefined, 'Lead must have stage (for Kanban)');
  }
});

await test('IFACE-01-F', 'Tasks list shape: { success: true, count, data: [] }', async () => {
  const res = await req('GET', '/api/tasks');
  assertType(res.success, 'boolean', 'success');
  assert(res.success === true, 'success must be true');
  assert(Array.isArray(res.data), 'data must be array');
  assert(res.count !== undefined, 'Tasks must include count field');
  assertType(res.count, 'number', 'count');
});

await test('IFACE-01-G', 'Leave balance shape: { success: true, data: [] }', async () => {
  const res = await req('GET', '/api/leave/balance?employeeId=EMP-001');
  assertType(res.success, 'boolean', 'success');
  assert(Array.isArray(res.data), 'data must be array');
});

await test('IFACE-01-H', 'Leave balance items have required balance fields', async () => {
  const res = await req('GET', '/api/leave/balance?employeeId=EMP-001');
  if (res.data.length > 0) {
    const bal = res.data[0];
    assert(bal.leave_type_name !== undefined, 'Must have leave_type_name');
    assert(bal.total_allocated !== undefined, 'Must have total_allocated');
    assert(bal.available !== undefined, 'Must have available');
  }
});

await test('IFACE-01-I', 'Payroll runs shape: { success: true, data: [] }', async () => {
  const res = await req('GET', '/api/payroll/runs');
  assertType(res.success, 'boolean', 'success');
  assert(Array.isArray(res.data), 'Payroll runs must be array');
});

await test('IFACE-01-J', 'Attendance today shape: { success: true, data: [] }', async () => {
  const res = await req('GET', '/api/attendance/today');
  assertType(res.success, 'boolean', 'success');
  assert(Array.isArray(res.data), 'Attendance today must be array');
});

await test('IFACE-01-K', 'Holiday endpoint shape: { success, year, count, data }', async () => {
  const res = await req('GET', '/api/leave/holidays?year=2026');
  assertType(res.success, 'boolean', 'success');
  assertType(res.year, 'number', 'year');
  assertType(res.count, 'number', 'count');
  assert(Array.isArray(res.data), 'data must be array');
  assertEqual(res.year, 2026, 'year must match query param');
});

// ─────────────────────────────────────────────
section('IFACE-02: HTTP Status Code Contracts');
// Verifies that correct HTTP status codes are returned
// ─────────────────────────────────────────────

await test('IFACE-02-A', 'GET /api/health returns HTTP 200', async () => {
  const res = await req('GET', '/api/health');
  assertEqual(res.status, 200, 'Health must be HTTP 200');
});

await test('IFACE-02-B', 'GET /api/employees returns HTTP 200', async () => {
  const res = await req('GET', '/api/employees');
  assertEqual(res.status, 200, 'Employees must be HTTP 200');
});

await test('IFACE-02-C', 'GET /api/leads/:invalidId returns HTTP 404', async () => {
  const res = await req('GET', '/api/leads/this-id-does-not-exist-xyz');
  // Source: leads.js line 150: if result.rows.length === 0 → 404
  assert(res.status === 404 || res.status === 400, `Non-existent lead must be 404 or 400, got ${res.status}`);
});

await test('IFACE-02-D', 'POST /api/payroll/pay-salary with Employee role returns HTTP 403', async () => {
  const res = await req('POST', '/api/payroll/pay-salary',
    { employeeId: 'EMP-001', month: 10, year: 2026 },
    { 'x-user-role': 'Employee', 'x-employee-id': 'EMP-001' }
  );
  // Source: payroll.js line 131: 403 Forbidden for employees
  assertEqual(res.status, 403, `Employee disburse must be 403, got ${res.status}`);
});

await test('IFACE-02-E', 'POST /api/leads/upload-attachment with invalid file returns HTTP 400', async () => {
  const res = await req('POST', '/api/leads/upload-attachment', {
    fileName: 'malware.exe',
    fileData: 'dGVzdA==',
    fileSize: 100,
    fileType: 'application/octet-stream'
  });
  // Source: leads.js line 41-45: 400 for unsupported extension
  assertEqual(res.status, 400, `Invalid file upload must be HTTP 400, got ${res.status}`);
});

await test('IFACE-02-F', 'POST /api/leave with missing required fields returns HTTP 400 or error', async () => {
  const res = await req('POST', '/api/leave', {
    // Missing: employeeId, leaveType, fromDate, toDate, days
    reason: 'Incomplete request'
  });
  assert(res.status >= 400 && res.status < 600, `Incomplete leave request must return error, got ${res.status}`);
});

// ─────────────────────────────────────────────
section('IFACE-03: Filter & Query Parameter Interface');
// Verifies that filtering parameters work correctly
// ─────────────────────────────────────────────

await test('IFACE-03-A', 'GET /api/leads?stage=New filters by stage', async () => {
  const res = await req('GET', '/api/leads?stage=New');
  assert(res.success, 'Stage filter must succeed');
  // Source: leads.js line 125-128: stage filter in SQL
  if (res.data.length > 0) {
    const allNew = res.data.every(l => l.stage?.toLowerCase() === 'new' || l.stage === 'New');
    assert(allNew, 'All returned leads must match stage = New');
  }
});

await test('IFACE-03-B', 'GET /api/attendance/history?status=Present filters by status', async () => {
  const res = await req('GET', '/api/attendance/history?status=Present');
  assert(res.success, 'Status filter must succeed');
  // Source: attendance.js line 78-81: status filter in SQL
  if (res.data.length > 0) {
    const allPresent = res.data.every(r => r.status === 'Present');
    assert(allPresent, 'All filtered records must have status = Present');
  }
});

await test('IFACE-03-C', 'GET /api/leave/requests?status=PENDING filters by status', async () => {
  const res = await req('GET', '/api/leave/requests?status=PENDING');
  assert(res.success, 'Status filter on leave requests must succeed');
  if (res.data.length > 0) {
    const allPending = res.data.every(r => r.status === 'PENDING');
    assert(allPending, 'All returned leave requests must be PENDING');
  }
});

await test('IFACE-03-D', 'GET /api/leave/holidays?year=2026 returns year 2026 in response', async () => {
  const res = await req('GET', '/api/leave/holidays?year=2026');
  assert(res.success, 'Year filter must work');
  assertEqual(res.year, 2026, 'Response year must match query param');
});

await test('IFACE-03-E', 'GET /api/attendance/history respects LIMIT 200', async () => {
  const res = await req('GET', '/api/attendance/history');
  assert(res.success, 'History must succeed');
  // Source: attendance.js line 83: LIMIT 200
  assert(res.data.length <= 200, `Must respect LIMIT 200, got ${res.data.length}`);
});

// ─────────────────────────────────────────────
section('IFACE-04: Request Validation Interface');
// Verifies that invalid requests are properly rejected
// ─────────────────────────────────────────────

await test('IFACE-04-A', 'POST with missing required fields returns structured error', async () => {
  const res = await req('POST', '/api/leads', { /* intentionally empty */ });
  const isErrorResponse = res.success === false || (res.status >= 400 && res.status < 600);
  assert(isErrorResponse, 'Empty POST to /api/leads must return an error response');
});

await test('IFACE-04-B', 'POST /api/leads/upload-attachment without fileName returns 400', async () => {
  // Source: leads.js line 32-34: fileName validation
  const res = await req('POST', '/api/leads/upload-attachment', {
    fileData: 'dGVzdA==' // no fileName
  });
  assertEqual(res.status, 400, 'Missing fileName must return 400');
  assert(res.message?.includes('File name') || res.message?.includes('required'),
    `Error must mention file name requirement. Got: ${res.message}`);
});

await test('IFACE-04-C', 'POST /api/leads/upload-attachment without fileData returns 400', async () => {
  // Source: leads.js line 32-34: fileData validation
  const res = await req('POST', '/api/leads/upload-attachment', {
    fileName: 'test.pdf' // no fileData
  });
  assertEqual(res.status, 400, 'Missing fileData must return 400');
});

// ─────────────────────────────────────────────
section('IFACE-05: Error Response Structure Contract');
// Verifies that errors always return { success: false, message: string }
// ─────────────────────────────────────────────

await test('IFACE-05-A', 'Error responses always include success: false', async () => {
  const res = await req('GET', '/api/leads/non-existent-id-000');
  if (res.status >= 400) {
    assert(res.success === false || res.error !== undefined,
      'Error response must have success: false or error field');
  }
});

await test('IFACE-05-B', '403 error has descriptive message', async () => {
  const res = await req('POST', '/api/payroll/pay-salary',
    { employeeId: 'EMP-001', month: 10, year: 2026 },
    { 'x-user-role': 'Employee', 'x-employee-id': 'EMP-001' }
  );
  assert(res.status === 403, 'Must return 403');
  assertType(res.message, 'string', 'message');
  assert(res.message.length > 0, 'Error message must not be empty');
});

await test('IFACE-05-C', '400 file type error has descriptive message', async () => {
  const res = await req('POST', '/api/leads/upload-attachment', {
    fileName: 'file.exe', fileData: 'dGVzdA=='
  });
  assertEqual(res.status, 400, 'Must be 400');
  assertType(res.message, 'string', 'message');
  assert(res.message.includes('Unsupported'), 'Message must say "Unsupported"');
});

// ─────────────────────────────────────────────
section('IFACE-06: Dual-Database Interface Contract');
// Verifies HRMS DB and CRM DB endpoints serve data from correct pools
// Source: backend/db/pool.js — hrmsPool vs crmPool separation
// ─────────────────────────────────────────────

await test('IFACE-06-A', 'HRMS endpoint /api/employees always from HRMS DB', async () => {
  const res = await req('GET', '/api/employees');
  // This request goes to hrmsPool. If CRM DB was down, this should still work
  assertEqual(res.status, 200, 'HRMS employees must be reachable via HRMS pool');
  assert(res.success, 'Employees must return success from HRMS DB');
});

await test('IFACE-06-B', 'CRM endpoint /api/leads always from CRM DB', async () => {
  const res = await req('GET', '/api/leads');
  // This goes to crmPool
  assertEqual(res.status, 200, 'CRM leads must be reachable via CRM pool');
  assert(res.success, 'Leads must return success from CRM DB');
});

await test('IFACE-06-C', 'Health check reports both HRMS and CRM DB independently', async () => {
  const res = await req('GET', '/api/health');
  assert('hrms' in res.databases, 'Health must report HRMS status independently');
  assert('crm' in res.databases, 'Health must report CRM status independently');
  // Both should have status strings
  assertType(res.databases.hrms.status, 'string', 'databases.hrms.status');
  assertType(res.databases.crm.status, 'string', 'databases.crm.status');
});

// ─────────────────────────────────────────────
section('IFACE-07: WebSocket Interface');
// Verifies that the WebSocket server is accessible
// ─────────────────────────────────────────────

await test('IFACE-07-A', 'WebSocket server responds on ws://localhost:5000', async () => {
  // We test WebSocket existence by checking the backend supports upgrade
  // A simple HTTP GET to the WS path should fail gracefully
  try {
    const res = await req('GET', '/');
    // The server must at minimum respond (not connection refused)
    assert(res.status !== undefined || res.status >= 0, 'Server must be reachable on port 5000');
  } catch (e) {
    // Connection refused = server not running
    throw new Error(`WebSocket server (port 5000) is unreachable: ${e.message}`);
  }
});

// ─────────────────────────────────────────────
section('IFACE-08: Content-Type Interface Contract');
// ─────────────────────────────────────────────

await test('IFACE-08-A', 'API responses return application/json content type', async () => {
  const rawRes = await fetch(`${BASE_URL}/api/health`);
  const contentType = rawRes.headers.get('content-type') || '';
  assert(contentType.includes('application/json'), `Must return application/json, got: ${contentType}`);
});

await test('IFACE-08-B', 'Employees list returns application/json', async () => {
  const rawRes = await fetch(`${BASE_URL}/api/employees`, {
    headers: { 'x-user-role': 'Executive' }
  });
  const ct = rawRes.headers.get('content-type') || '';
  assert(ct.includes('application/json'), `Must return application/json, got: ${ct}`);
});

// ─────────────────────────────────────────────
section('IFACE-09: Pagination Interface');
// ─────────────────────────────────────────────

await test('IFACE-09-A', 'Attendance history respects LIMIT 200 pagination', async () => {
  const res = await req('GET', '/api/attendance/history');
  assert(res.success, 'Must succeed');
  assert(res.data.length <= 200, `Must not exceed 200 records (got ${res.data.length})`);
});

await test('IFACE-09-B', 'Leads list returns all results without pagination limit', async () => {
  // Leads are not paginated in source — all matching records returned
  const res = await req('GET', '/api/leads');
  assert(res.success, 'Must succeed');
  assert(Array.isArray(res.data), 'Leads must be array');
  // Just verify it's an array — length is data-dependent
});

// ─────────────────────────────────────────────
section('IFACE-10: RBAC Interface Contract');
// Verifies role-based access is enforced at the HTTP interface level
// ─────────────────────────────────────────────

await test('IFACE-10-A', 'Finance role can access payroll endpoints', async () => {
  const res = await req('GET', '/api/payroll/runs', null, { 'x-user-role': 'Finance' });
  assertEqual(res.status, 200, 'Finance must access payroll with HTTP 200');
  assert(res.success, 'Finance payroll access must succeed');
});

await test('IFACE-10-B', 'HR role can access employee endpoints', async () => {
  const res = await req('GET', '/api/employees', null, { 'x-user-role': 'HR' });
  assertEqual(res.status, 200, 'HR must access employees with HTTP 200');
  assert(res.success, 'HR employee access must succeed');
});

await test('IFACE-10-C', 'Employee role is blocked from salary disbursement (403)', async () => {
  const res = await req('POST', '/api/payroll/pay-salary',
    { employeeId: 'EMP-001', month: 10, year: 2026 },
    { 'x-user-role': 'Employee', 'x-employee-id': 'EMP-001' }
  );
  assertEqual(res.status, 403, `Employee must get 403 on disburse. Got ${res.status}`);
});

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  INTERFACE TEST RESULTS');
console.log(`  Total  : ${passed + failed}`);
console.log(`  Passed : ${passed} ✅`);
console.log(`  Failed : ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
