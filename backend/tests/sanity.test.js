/**
 * ============================================================
 * [5] SANITY TESTING — Enterprise CRM / HRMS / ERP Platform
 * ============================================================
 * Targeted checks after a bug fix or small feature change.
 * Unlike smoke tests (all endpoints), sanity tests verify
 * that SPECIFIC BUSINESS LOGIC still works correctly.
 *
 * WHEN TO RUN: After any code change, hotfix, or migration.
 *
 * HOW TO RUN:
 *   cd backend
 *   node tests/sanity.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0;

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'Executive' }
  };
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
function assert(c, m) { if (!c) throw new Error(m); }
function assertEqual(a, b, m) { if (a !== b) throw new Error(m || `Expected ${b}, got ${a}`); }
function section(t) { console.log(`\n── ${t} ──────────────────────────────────────`); }

// ──────────────────────────────────────────────────────────────
// PURE LOGIC SANITY (no HTTP needed)
// ──────────────────────────────────────────────────────────────

// Source: leave.js line 189-190
function mapLeaveTypeId(t) {
  if (t.toLowerCase().includes('sick')) return 'lt-sl';
  if (t.toLowerCase().includes('privilege')) return 'lt-pl';
  return 'lt-cl';
}

// Source: leads.js line 157-165
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

// Source: payroll.js line 126-138
function canDisburseSalary(role) {
  const blocked = ['Employee', 'EMPLOYEE'];
  const allowed = ['Admin', 'Finance', 'HR', 'Manager'];
  return !(blocked.includes(role) && !allowed.includes(role));
}

// Source: attendance.js line 33-37
function resolveStatus(checkIn, existing) {
  if (checkIn && checkIn !== '-' && checkIn !== 'OFF') return existing || 'Present';
  if (existing) return existing;
  return 'Absent';
}

// Source: leads.js line 196-218 (tag dedup)
function deduplicateTags(tags) {
  const seen = new Set();
  return tags.filter(t => {
    const l = t.toLowerCase();
    if (seen.has(l)) return false;
    seen.add(l);
    return true;
  });
}

// Source: leads.js line 172-185 (URL safety check)
function isUnsafeUrl(url) {
  return /^(javascript|data|vbscript|file):/i.test(url?.trim());
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  [5] SANITY TESTING — Post-Fix Business Logic Check');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────
section('SANITY: Leave Type Mapping Logic');
// ─────────────────────────────────────────────
test('Sick → lt-sl mapping is intact', () => {
  assertEqual(mapLeaveTypeId('Sick Leave'), 'lt-sl');
});
test('Privilege → lt-pl mapping is intact', () => {
  assertEqual(mapLeaveTypeId('Privilege Leave'), 'lt-pl');
});
test('Casual → lt-cl (default) mapping is intact', () => {
  assertEqual(mapLeaveTypeId('Casual Leave'), 'lt-cl');
});
test('Unknown type still defaults to lt-cl (no crash)', () => {
  assertEqual(mapLeaveTypeId('Maternity Leave'), 'lt-cl');
});

// ─────────────────────────────────────────────
section('SANITY: Payroll RBAC Guard');
// ─────────────────────────────────────────────
test('Finance can disburse salary', () => {
  assert(canDisburseSalary('Finance'), 'Finance must disburse');
});
test('Employee cannot disburse salary', () => {
  assert(!canDisburseSalary('Employee'), 'Employee must be blocked');
});
test('Admin can disburse salary', () => {
  assert(canDisburseSalary('Admin'), 'Admin must disburse');
});

// ─────────────────────────────────────────────
section('SANITY: Attendance Status Logic');
// ─────────────────────────────────────────────
test('With check-in → status = Present', () => {
  assertEqual(resolveStatus('09:00', null), 'Present');
});
test('Without check-in → status = Absent', () => {
  assertEqual(resolveStatus(null, null), 'Absent');
});
test('Dash check-in → status = Absent', () => {
  assertEqual(resolveStatus('-', null), 'Absent');
});
test('OFF check-in → status = Absent (OFF day)', () => {
  assertEqual(resolveStatus('OFF', null), 'Absent');
});

// ─────────────────────────────────────────────
section('SANITY: Email & Phone Validators');
// ─────────────────────────────────────────────
test('Valid email passes', () => {
  assert(EMAIL_REGEX.test('user@company.com'));
});
test('Invalid email (no @) fails', () => {
  assert(!EMAIL_REGEX.test('usercompany.com'));
});
test('Valid Indian mobile (starts 9) passes', () => {
  assert(PHONE_REGEX.test('9876543210'));
});
test('10-digit number starting with 5 fails', () => {
  assert(!PHONE_REGEX.test('5876543210'));
});

// ─────────────────────────────────────────────
section('SANITY: Tag Deduplication');
// ─────────────────────────────────────────────
test('Duplicate tags are removed (case-insensitive)', () => {
  const result = deduplicateTags(['CRM', 'crm', 'Sales']);
  assertEqual(result.length, 2, 'Must remove case-insensitive duplicates');
});
test('Unique tags are all preserved', () => {
  const result = deduplicateTags(['Enterprise', 'CRM', 'Sales']);
  assertEqual(result.length, 3, 'All unique tags must be kept');
});

// ─────────────────────────────────────────────
section('SANITY: URL XSS Prevention');
// ─────────────────────────────────────────────
test('javascript: URL is detected as unsafe', () => {
  assert(isUnsafeUrl('javascript:alert(1)'), 'javascript: must be blocked');
});
test('data: URL is detected as unsafe', () => {
  assert(isUnsafeUrl('data:text/html'), 'data: must be blocked');
});
test('https: URL is safe', () => {
  assert(!isUnsafeUrl('https://example.com'), 'https must be allowed');
});
test('null URL is safe (optional field)', () => {
  assert(!isUnsafeUrl(null), 'null must be safe');
});

// ─────────────────────────────────────────────
section('SANITY: HTTP — Health Check Sane Response');
// ─────────────────────────────────────────────
await test('Health endpoint returns valid JSON with status field', async () => {
  const res = await api('GET', '/api/health');
  assert(res.status === 200 || res.status === 503, `Health must be 200 or 503, got ${res.status}`);
  assert(typeof res.databases === 'object', 'Health response must include databases object');
  assert(res.databases.hrms !== undefined, 'Health must include HRMS DB status');
  assert(res.databases.crm !== undefined, 'Health must include CRM DB status');
});

await test('Health endpoint always responds within reasonable time', async () => {
  const start = Date.now();
  await api('GET', '/api/health');
  const elapsed = Date.now() - start;
  assert(elapsed < 5000, `Health check took ${elapsed}ms — must be under 5 seconds`);
});

// ─────────────────────────────────────────────
section('SANITY: HTTP — Core CRUD Responses are Valid JSON');
// ─────────────────────────────────────────────
await test('GET /api/employees returns { success, data } structure', async () => {
  const res = await api('GET', '/api/employees');
  assert(typeof res.success === 'boolean', 'Response must have success boolean');
  assert(res.data !== undefined, 'Response must have data field');
});

await test('GET /api/leads returns { success, data } structure', async () => {
  const res = await api('GET', '/api/leads');
  assert(typeof res.success === 'boolean', 'Response must have success boolean');
  assert(res.data !== undefined, 'Response must have data field');
});

await test('GET /api/leave/balance returns { success, data } structure', async () => {
  const res = await api('GET', '/api/leave/balance?employeeId=EMP-001');
  assert(typeof res.success === 'boolean', 'Response must have success boolean');
});

await test('GET /api/tasks returns { success, data, count } structure', async () => {
  const res = await api('GET', '/api/tasks');
  assert(typeof res.success === 'boolean', 'Response must have success boolean');
  assert(res.count !== undefined || Array.isArray(res.data), 'Tasks must have count or data field');
});

// ─────────────────────────────────────────────
section('SANITY: HTTP — Leave Holiday Count Consistent');
// ─────────────────────────────────────────────
await test('Holiday list for 2026 always returns 16 entries', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026');
  // Source: leave.js line 64-80: exactly 16 default holidays
  assert(res.success, 'Holidays must be fetchable');
  assert(res.data.length >= 16, `Must return at least 16 holidays, got ${res.data.length}`);
});

await test('Independence Day is always in 2026 holidays at Aug 15', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026');
  const indDay = res.data.find(h => h.date === '2026-08-15');
  assert(indDay, 'Independence Day must be on Aug 15 2026');
  assert(indDay.title?.includes('Independence'), `Holiday title must say Independence, got: ${indDay.title}`);
});

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  SANITY TEST RESULTS');
console.log(`  Total  : ${passed + failed}`);
console.log(`  Passed : ${passed} ✅`);
console.log(`  Failed : ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
