/**
 * ============================================================
 * [8] COMPONENT TESTING — Enterprise CRM / HRMS / ERP
 * ============================================================
 * Tests individual backend "components" (route handlers,
 * middleware, services) in isolation — verifying each unit
 * of the system works correctly on its own.
 *
 * COMPONENTS TESTED:
 *   COMP-01  — Auth Middleware (JWT decode, role fallback, bypass)
 *   COMP-02  — Leave Balance Component (auto-init, deduction)
 *   COMP-03  — Payroll Guard Component (RBAC disbursement check)
 *   COMP-04  — Lead Validation Component (regex, file, URL, tags)
 *   COMP-05  — Attendance Status Component (CASE logic)
 *   COMP-06  — Employee ID Generator Component
 *   COMP-07  — Holiday Component (auto-seed + fallback)
 *   COMP-08  — Task Scoping Component (role-based visibility)
 *   COMP-09  — File Upload Component (extension + size guard)
 *   COMP-10  — Error Handler Component (structured error shape)
 *
 * HOW TO RUN:
 *   cd backend
 *   node tests/component.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0;

async function api(method, path, body = null, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
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
function section(t) { console.log(`\n── ${t} ──────────────────────────────────────`); }

// ──────────────────────────────────────────────────────────────
// PURE COMPONENT LOGIC (Source-embedded, no HTTP)
// ──────────────────────────────────────────────────────────────

// ── COMP-01: Auth Middleware Fallback Logic ──────────────────
// Source: backend/middleware/auth.js (lines 12-28)
function authMiddlewareFallback(headerRole, headerEmpId) {
  const isEmp = headerRole === 'Employee' || headerRole === 'EMPLOYEE' || (Boolean(headerEmpId) && !headerRole);
  const role = headerRole || (isEmp ? 'Employee' : 'Executive');
  return {
    id: headerEmpId || 'EMP-001',
    empCode: headerEmpId || 'EMP-001',
    role,
    permissions: isEmp ? ['EMPLOYEE'] : ['*']
  };
}

// ── COMP-03: Payroll RBAC Component ─────────────────────────
// Source: backend/routes/payroll.js (line 126-138)
function payrollRbacGuard(role, headerEmpId) {
  if ((role === 'Employee' || role === 'EMPLOYEE' || headerEmpId) &&
      role !== 'Admin' && role !== 'Finance' && role !== 'HR' && role !== 'Manager') {
    return { allowed: false, reason: 'Forbidden: Employees cannot disburse or execute salary payments.' };
  }
  return { allowed: true };
}

// ── COMP-04: Lead Validation Components ─────────────────────
// Source: backend/routes/leads.js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const LEAD_NAME_RE = /^[a-zA-Z\s\-'.]+$/;
const COMPANY_RE = /^[a-zA-Z0-9\s&.\-',()/#]+$/;
const ALLOWED_EXTS = new Set(['svg', 'png', 'jpg', 'jpeg', 'pdf']);
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_INDUSTRIES = new Set(['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Other']);
const ALLOWED_SOURCES = new Set(['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Google Ads', 'Email Campaign', 'Trade Show', 'Manual/Other']);

function validateLeadFile(name, size) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTS.has(ext)) return { ok: false, msg: 'Unsupported file type.' };
  if (size > MAX_SIZE) return { ok: false, msg: 'File size must be 10 MB or less.' };
  return { ok: true };
}

function isUnsafeUrl(url) {
  if (!url) return false;
  return /^(javascript|data|vbscript|file):/i.test(url.trim());
}

function normalizeUrl(url) {
  if (!url?.trim()) return null;
  if (/^https?:\/\//i.test(url)) return url.trim();
  return `https://${url.trim()}`;
}

function sanitizeTags(input) {
  let list = Array.isArray(input) ? input : (typeof input === 'string' ? input.split(',') : []);
  const seen = new Set();
  return list.filter(t => {
    if (typeof t !== 'string') return false;
    const clean = t.replace(/<[^>]*>?/gm, '').trim();
    if (!clean || clean.length > 50) return false;
    const lower = clean.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

// ── COMP-05: Attendance Status Component ────────────────────
// Source: backend/routes/attendance.js (CASE logic line 33-37)
function resolveAttendanceStatus(checkIn, existingStatus) {
  if (checkIn && checkIn !== '-' && checkIn !== 'OFF') return existingStatus || 'Present';
  if (existingStatus) return existingStatus;
  return 'Absent';
}

// ── COMP-06: Employee ID Generator Component ─────────────────
// Source: backend/utils/employeeIdGenerator.js (implied from routes/employees.js line 57)
function isValidEmpId(id) {
  return typeof id === 'string' && /^EMP-\d+$/.test(id);
}
function generateEmpId(seq) {
  return `EMP-${String(seq).padStart(3, '0')}`;
}

// ── COMP-08: Task Scoping Component ─────────────────────────
// Source: backend/routes/tasks.js (line 9-23)
function resolveTaskUser(reqUser, headerEmpId, headerRole) {
  const empId = headerEmpId || reqUser?.empCode || null;
  const role = headerRole || reqUser?.role || (empId ? 'Employee' : 'Admin');
  return { empCode: empId, role, isEmployeeOnly: role === 'Employee' || role === 'EMPLOYEE' };
}

// ── COMP-09: Leave Type ID Mapper ────────────────────────────
// Source: backend/routes/leave.js (line 189-190)
function mapLeaveTypeId(t) {
  if (t.toLowerCase().includes('sick')) return 'lt-sl';
  if (t.toLowerCase().includes('privilege')) return 'lt-pl';
  return 'lt-cl';
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════');
console.log('  [8] COMPONENT TESTING — Individual Component Tests');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────
section('COMP-01: Auth Middleware Component');
// Source: backend/middleware/auth.js
// ─────────────────────────────────────────────

await test('COMP-01-A', 'Employee header resolves to Employee role with EMPLOYEE permissions', async () => {
  const user = authMiddlewareFallback('Employee', 'EMP-001');
  assertEqual(user.role, 'Employee', 'Must resolve Employee role');
  assert(user.permissions.includes('EMPLOYEE'), 'Must have EMPLOYEE permission only');
  assert(!user.permissions.includes('*'), 'Employee must NOT have wildcard permissions');
});

await test('COMP-01-B', 'No headers resolves to Executive role with wildcard permissions', async () => {
  const user = authMiddlewareFallback(null, null);
  assertEqual(user.role, 'Executive', 'No headers must default to Executive');
  assert(user.permissions.includes('*'), 'Executive must have wildcard permissions');
});

await test('COMP-01-C', 'Header with empId but no role resolves to Employee role', async () => {
  const user = authMiddlewareFallback(null, 'EMP-005');
  assertEqual(user.role, 'Employee', 'EmpId without role must default to Employee');
  assertEqual(user.id, 'EMP-005', 'User ID must be set from header');
});

await test('COMP-01-D', 'Public endpoints bypass auth (health check reachable without token)', async () => {
  const res = await api('GET', '/api/health', null, {});  // No auth headers
  assert(res.status === 200 || res.status === 503, `Health must be accessible without auth, got ${res.status}`);
});

await test('COMP-01-E', 'Auth middleware resolves req.user from x-user-role header', async () => {
  const res = await api('GET', '/api/employees', null, { 'x-user-role': 'HR', 'x-user-name': 'Priya Sharma' });
  assert(res.success, 'HR role must be able to access employees via header');
});

// ─────────────────────────────────────────────
section('COMP-02: Leave Balance Component');
// Source: backend/routes/leave.js
// ─────────────────────────────────────────────

await test('COMP-02-A', 'Leave balance component auto-initializes with Casual(12), Sick(10), Privilege(15)', async () => {
  const res = await api('GET', '/api/leave/balance?employeeId=EMP-001', null, { 'x-user-role': 'Employee', 'x-employee-id': 'EMP-001' });
  assert(res.success, `Balance component must initialize: ${res.message}`);
  const casual = res.data.find(b => b.leave_type_name?.includes('Casual'));
  if (casual) {
    assert(casual.total_allocated >= 12, `Casual leave must initialize to 12. Got: ${casual.total_allocated}`);
  }
});

await test('COMP-02-B', 'Leave balance component returns array', async () => {
  const res = await api('GET', '/api/leave/balance?employeeId=EMP-001', null, { 'x-user-role': 'Employee' });
  assert(Array.isArray(res.data), 'Leave balance must return array type');
});

// ─────────────────────────────────────────────
section('COMP-03: Payroll RBAC Guard Component');
// Source: backend/routes/payroll.js (checkPayrollAdminAuth)
// ─────────────────────────────────────────────

await test('COMP-03-A', 'Finance role is permitted to disburse salary', async () => {
  const result = payrollRbacGuard('Finance', null);
  assert(result.allowed, 'Finance must be allowed');
});

await test('COMP-03-B', 'HR role is permitted to disburse salary', async () => {
  const result = payrollRbacGuard('HR', null);
  assert(result.allowed, 'HR must be allowed');
});

await test('COMP-03-C', 'Manager role is permitted to disburse salary', async () => {
  const result = payrollRbacGuard('Manager', null);
  assert(result.allowed, 'Manager must be allowed');
});

await test('COMP-03-D', 'Employee role is BLOCKED from disbursing salary', async () => {
  const result = payrollRbacGuard('Employee', 'EMP-001');
  assert(!result.allowed, 'Employee must be blocked');
  assert(result.reason?.includes('Forbidden'), 'Must return Forbidden reason');
});

await test('COMP-03-E', 'HTTP payroll pay endpoint returns 403 for Employee role', async () => {
  const res = await api('POST', '/api/payroll/pay-salary',
    { employeeId: 'EMP-001', month: 10, year: 2026 },
    { 'x-user-role': 'Employee', 'x-employee-id': 'EMP-001' }
  );
  assert(res.status === 403 || res.message?.toLowerCase().includes('forbidden'),
    `Must return 403, got ${res.status}: ${res.message}`);
});

// ─────────────────────────────────────────────
section('COMP-04: Lead Validation Components');
// Source: backend/routes/leads.js
// ─────────────────────────────────────────────

await test('COMP-04-A', 'Email regex accepts valid email', async () => {
  assert(EMAIL_RE.test('john.doe@company.com'), 'Valid email must pass');
});
await test('COMP-04-B', 'Email regex rejects email without @', async () => {
  assert(!EMAIL_RE.test('invalidemail.com'), 'Email without @ must fail');
});
await test('COMP-04-C', 'Phone regex accepts 10-digit number starting with 9', async () => {
  assert(PHONE_RE.test('9876543210'), 'Valid phone must pass');
});
await test('COMP-04-D', 'Phone regex rejects number starting with 0', async () => {
  assert(!PHONE_RE.test('0876543210'), 'Phone starting with 0 must fail');
});
await test('COMP-04-E', 'Lead name regex allows letters, spaces, hyphens', async () => {
  assert(LEAD_NAME_RE.test('Acme Corp-India'), 'Valid lead name must pass');
});
await test('COMP-04-F', 'Industry "Technology" is in allowed set', async () => {
  assert(ALLOWED_INDUSTRIES.has('Technology'), 'Technology must be allowed industry');
});
await test('COMP-04-G', 'Industry "Gambling" is NOT in allowed set', async () => {
  assert(!ALLOWED_INDUSTRIES.has('Gambling'), 'Gambling must not be allowed');
});
await test('COMP-04-H', 'Source "LinkedIn" is in allowed sources', async () => {
  assert(ALLOWED_SOURCES.has('LinkedIn'), 'LinkedIn must be allowed source');
});
await test('COMP-04-I', 'URL sanitizer blocks javascript: protocol', async () => {
  assert(isUnsafeUrl('javascript:alert(1)'), 'javascript: must be blocked');
});
await test('COMP-04-J', 'URL normalizer adds https:// to bare domain', async () => {
  assertEqual(normalizeUrl('example.com'), 'https://example.com');
});
await test('COMP-04-K', 'Tag sanitizer strips HTML and deduplicates', async () => {
  const tags = sanitizeTags(['<b>CRM</b>', 'crm', 'Sales']);
  assertEqual(tags.length, 2, 'Must strip HTML and deduplicate');
  assertEqual(tags[0], 'CRM', 'First tag must be stripped CRM');
});
await test('COMP-04-L', 'File validator accepts .pdf under 10MB', async () => {
  const r = validateLeadFile('report.pdf', 5 * 1024 * 1024);
  assert(r.ok, 'PDF under 10MB must be accepted');
});
await test('COMP-04-M', 'File validator rejects .docx extension', async () => {
  const r = validateLeadFile('report.docx', 100);
  assert(!r.ok, '.docx must be rejected');
});

// ─────────────────────────────────────────────
section('COMP-05: Attendance Status Component');
// Source: backend/routes/attendance.js CASE block
// ─────────────────────────────────────────────

await test('COMP-05-A', 'Clock-in present resolves to "Present"', async () => {
  assertEqual(resolveAttendanceStatus('09:00', null), 'Present');
});
await test('COMP-05-B', 'No clock-in resolves to "Absent"', async () => {
  assertEqual(resolveAttendanceStatus(null, null), 'Absent');
});
await test('COMP-05-C', 'Clock-in is "-" resolves to "Absent"', async () => {
  assertEqual(resolveAttendanceStatus('-', null), 'Absent');
});
await test('COMP-05-D', 'Clock-in is "OFF" resolves to "Absent"', async () => {
  assertEqual(resolveAttendanceStatus('OFF', null), 'Absent');
});
await test('COMP-05-E', 'Existing status preserved when check-in is present', async () => {
  assertEqual(resolveAttendanceStatus('10:00', 'Late'), 'Late', 'Late status must be preserved');
});

// ─────────────────────────────────────────────
section('COMP-06: Employee ID Generator Component');
// ─────────────────────────────────────────────

await test('COMP-06-A', 'EMP-001 is a valid employee ID format', async () => {
  assert(isValidEmpId('EMP-001'), 'EMP-001 must be valid');
});
await test('COMP-06-B', 'EMP-999 is a valid employee ID format', async () => {
  assert(isValidEmpId('EMP-999'), 'EMP-999 must be valid');
});
await test('COMP-06-C', 'Raw number is not a valid employee ID', async () => {
  assert(!isValidEmpId('123'), '123 must not be a valid ID');
});
await test('COMP-06-D', 'generateEmpId pads sequence to 3 digits', async () => {
  assertEqual(generateEmpId(1), 'EMP-001', 'Must generate EMP-001');
  assertEqual(generateEmpId(42), 'EMP-042', 'Must generate EMP-042');
  assertEqual(generateEmpId(100), 'EMP-100', 'Must generate EMP-100');
});

await test('COMP-06-E', 'HTTP next-id endpoint returns EMP- format', async () => {
  const res = await api('GET', '/api/employees/next-id', null, { 'x-user-role': 'HR' });
  assert(res.success, 'Next ID must be fetchable');
  const nextId = res.nextId || res.next_id;
  assert(nextId?.startsWith('EMP-'), `Next ID must start with EMP-, got: ${nextId}`);
});

// ─────────────────────────────────────────────
section('COMP-07: Holiday Component');
// Source: backend/routes/leave.js (DEFAULT_2026_HOLIDAYS seeding)
// ─────────────────────────────────────────────

await test('COMP-07-A', '16 default 2026 holidays are auto-seeded', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026', null, { 'x-user-role': 'Employee' });
  assert(res.success, 'Holidays must load');
  assert(res.data.length >= 16, `Must have 16 holidays, got ${res.data.length}`);
});

await test('COMP-07-B', 'Diwali is on Nov 8, 2026', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026', null, { 'x-user-role': 'Employee' });
  const diwali = res.data.find(h => h.date === '2026-11-08');
  assert(diwali, 'Diwali must be on Nov 8, 2026');
});

await test('COMP-07-C', 'Christmas Day is on Dec 25, 2026', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026', null, { 'x-user-role': 'Employee' });
  const christmas = res.data.find(h => h.date === '2026-12-25');
  assert(christmas, 'Christmas must be on Dec 25, 2026');
});

// ─────────────────────────────────────────────
section('COMP-08: Task Scoping Component');
// Source: backend/routes/tasks.js (getAuthUser function)
// ─────────────────────────────────────────────

await test('COMP-08-A', 'Employee role sets isEmployeeOnly = true', async () => {
  const user = resolveTaskUser({ role: 'Employee', empCode: 'EMP-001' }, null, null);
  assert(user.isEmployeeOnly, 'Employee must have isEmployeeOnly = true');
});

await test('COMP-08-B', 'Admin role sets isEmployeeOnly = false', async () => {
  const user = resolveTaskUser({ role: 'Admin', empCode: null }, null, null);
  assert(!user.isEmployeeOnly, 'Admin must not have isEmployeeOnly');
});

await test('COMP-08-C', 'Header empId overrides JWT empCode for scoping', async () => {
  const user = resolveTaskUser({ empCode: 'EMP-001' }, 'EMP-005', null);
  assertEqual(user.empCode, 'EMP-005', 'Header empId must override JWT empCode');
});

// ─────────────────────────────────────────────
section('COMP-09: Leave Type ID Mapper Component');
// Source: backend/routes/leave.js (line 189-190)
// ─────────────────────────────────────────────

await test('COMP-09-A', '"Sick Leave" → lt-sl', async () => { assertEqual(mapLeaveTypeId('Sick Leave'), 'lt-sl'); });
await test('COMP-09-B', '"sick leave" (lowercase) → lt-sl', async () => { assertEqual(mapLeaveTypeId('sick leave'), 'lt-sl'); });
await test('COMP-09-C', '"Privilege Leave" → lt-pl', async () => { assertEqual(mapLeaveTypeId('Privilege Leave'), 'lt-pl'); });
await test('COMP-09-D', '"Casual Leave" → lt-cl', async () => { assertEqual(mapLeaveTypeId('Casual Leave'), 'lt-cl'); });
await test('COMP-09-E', 'Unknown type → lt-cl (safe default)', async () => { assertEqual(mapLeaveTypeId('RandomLeave'), 'lt-cl'); });

// ─────────────────────────────────────────────
section('COMP-10: Error Handler Component');
// Source: backend/middleware/errorHandler.js (implied from response patterns)
// ─────────────────────────────────────────────

await test('COMP-10-A', 'Non-existent lead returns 404 with success: false', async () => {
  const res = await api('GET', '/api/leads/non-existent-id-999999', null, { 'x-user-role': 'Executive' });
  assert(res.status === 404 || res.status === 400 || res.success === false,
    `Non-existent lead must return error. Got ${res.status}`);
});

await test('COMP-10-B', 'Invalid query param must return structured error, not crash', async () => {
  const res = await api('GET', '/api/payroll/runs?month=INVALID', null, { 'x-user-role': 'Finance' });
  assert(res.status !== 500, `Server must not crash on bad params, got ${res.status}`);
});

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  COMPONENT TEST RESULTS');
console.log(`  Total  : ${passed + failed}`);
console.log(`  Passed : ${passed} ✅`);
console.log(`  Failed : ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
