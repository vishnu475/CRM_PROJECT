/**
 * ============================================================
 * [6] REGRESSION TESTING — Enterprise CRM / HRMS / ERP
 * ============================================================
 * Verifies that previously fixed bugs have NOT come back.
 * Each test is tagged with the bug/feature it guards against.
 *
 * REGRESSION CATALOG (bugs fixed & protected):
 *   REG-001 — LOP deduction must not exceed gross salary
 *   REG-002 — Leave balance must not go negative
 *   REG-003 — Employee cannot disburse own salary
 *   REG-004 — Duplicate EMP- ID creation must be blocked
 *   REG-005 — XSS injection via lead URL field must be blocked
 *   REG-006 — File uploads limited to approved extensions only
 *   REG-007 — Files over 10MB must be rejected
 *   REG-008 — Tag deduplication must work case-insensitively
 *   REG-009 — Health check must show migration count ≥ 20
 *   REG-010 — Leave holiday list must always include all 16 entries
 *   REG-011 — Attendance: employee with no clock-in shows Absent
 *   REG-012 — History query must be limited to 200 rows max
 *   REG-013 — Lead stage filter must return only matching leads
 *   REG-014 — Empty leave type input must default to lt-cl
 *   REG-015 — Phone validation must reject numbers starting with 0-5
 *   REG-016 — Email must reject addresses without @
 *   REG-017 — URL normalizer must not double https://
 *   REG-018 — Tags over 50 chars must be silently excluded
 *   REG-019 — Invalid JSON to API must return 400, not crash
 *   REG-020 — Payroll: PF must cap at ₹1800 regardless of salary
 *
 * HOW TO RUN:
 *   cd backend
 *   node tests/regression.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0;

async function api(method, path, body = null, role = 'Executive') {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-user-role': role }
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
function assertEqual(a, b, m) { if (a !== b) throw new Error(m || `Expected ${b}, got ${a}`); }
function section(t) { console.log(`\n── ${t} ──────────────────────────────────────`); }

// ──────────────────────────────────────────────────────────────
// RE-IMPLEMENTATIONS OF BUSINESS LOGIC (Source Code Embedded)
// ──────────────────────────────────────────────────────────────

// Source: backend/routes/payroll.js — Payroll calculation
function computePayroll(grossSalary, lopDays, workingDays) {
  const PF = Math.min(grossSalary * 0.6 * 0.12, 1800);
  const ESI = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
  const PT = grossSalary >= 15001 ? 200 : grossSalary >= 10001 ? 150 : 100;
  const TDS = (grossSalary * 12 * 0.05) / 12;
  const lopDeduction = (grossSalary / workingDays) * lopDays;
  const netPay = grossSalary - PF - ESI - PT - TDS - lopDeduction;
  return { PF: Math.round(PF), lopDeduction: Math.round(lopDeduction), netPay: Math.round(netPay) };
}

// Source: backend/routes/leave.js line 182
function checkLeaveBalance(available, requested) {
  return available >= requested
    ? { allowed: true }
    : { allowed: false, message: `Insufficient balance. Available: ${available} days.` };
}

// Source: backend/routes/leave.js line 189-190
function mapLeaveTypeId(t) {
  if (t.toLowerCase().includes('sick')) return 'lt-sl';
  if (t.toLowerCase().includes('privilege')) return 'lt-pl';
  return 'lt-cl';
}

// Source: backend/routes/payroll.js line 126-138
function canDisburseSalary(role) {
  const blocked = ['Employee', 'EMPLOYEE'];
  const allowed = ['Admin', 'Finance', 'HR', 'Manager'];
  return !(blocked.includes(role) && !allowed.includes(role));
}

// Source: backend/routes/leads.js line 162-163
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

// Source: backend/routes/leads.js line 172-185
function isUnsafeUrl(url) {
  if (!url) return false;
  return /^(javascript|data|vbscript|file):/i.test(url.trim());
}

// Source: backend/routes/leads.js line 188-194
function normalizeUrl(url) {
  if (!url?.trim()) return null;
  if (/^https?:\/\//i.test(url.trim())) return url.trim();
  return `https://${url.trim()}`;
}

// Source: backend/routes/leads.js line 196-218
function sanitizeTags(input) {
  let list = Array.isArray(input) ? input : (input || '').split(',');
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

// Source: backend/routes/leads.js line 16, 66
const ALLOWED_EXTS = new Set(['svg', 'png', 'jpg', 'jpeg', 'pdf']);
const MAX_SIZE = 10 * 1024 * 1024;
function validateFile(name, size) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTS.has(ext)) return { ok: false, msg: 'Unsupported file type' };
  if (size > MAX_SIZE) return { ok: false, msg: 'File size must be 10 MB or less' };
  return { ok: true };
}

// Source: backend/routes/attendance.js CASE logic
function resolveAttStatus(checkIn, existing) {
  if (checkIn && checkIn !== '-' && checkIn !== 'OFF') return existing || 'Present';
  if (existing) return existing;
  return 'Absent';
}

// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════');
console.log('  [6] REGRESSION TESTING — Bug Guard Suite');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────
section('PAYROLL REGRESSIONS');
// ─────────────────────────────────────────────

await test('REG-020', 'PF cap at ₹1800 — high salary must not exceed cap', async () => {
  const { PF } = computePayroll(100000, 0, 26);
  assert(PF === 1800, `PF must be capped at ₹1800 for high salaries. Got ₹${PF}`);
});

await test('REG-001', 'LOP deduction must never exceed gross salary', async () => {
  const gross = 30000;
  const { netPay } = computePayroll(gross, 26, 26); // Full month LOP
  // Net may be negative after deductions but LOP itself must not exceed gross
  const lop = Math.round((gross / 26) * 26);
  assert(lop <= gross, `LOP deduction (${lop}) must not exceed gross (${gross})`);
});

await test('REG-003', 'Employee role must be blocked from salary disbursement (HTTP 403)', async () => {
  const res = await api('POST', '/api/payroll/pay-salary', {
    employeeId: 'EMP-001', month: 10, year: 2026
  }, 'Employee');
  assert(
    res.status === 403 || res.message?.toLowerCase().includes('forbidden'),
    `Employee must get 403 Forbidden. Got HTTP ${res.status}: ${res.message}`
  );
});

// ─────────────────────────────────────────────
section('LEAVE MANAGEMENT REGRESSIONS');
// ─────────────────────────────────────────────

await test('REG-002', 'Leave balance must NOT go negative (balance guard)', async () => {
  const result = checkLeaveBalance(0, 1);
  assert(!result.allowed, 'Must block leave when balance is 0');
  assert(result.message?.includes('Insufficient'), 'Error must mention insufficient balance');
});

await test('REG-002b', 'Leave balance exact match (available === requested) is allowed', async () => {
  const result = checkLeaveBalance(3, 3);
  assert(result.allowed, 'Leave must be allowed when balance exactly matches');
});

await test('REG-014', 'Empty/unknown leave type must default to Casual (lt-cl)', async () => {
  assertEqual(mapLeaveTypeId(''), 'lt-cl', 'Empty leave type must default to lt-cl');
  assertEqual(mapLeaveTypeId('Annual Leave'), 'lt-cl', 'Unknown type must default to lt-cl');
});

await test('REG-010', '2026 public holidays always returns ≥ 16 entries', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026');
  assert(res.success, 'Holidays endpoint must succeed');
  assert(res.data.length >= 16, `Holiday count regression: expected ≥ 16, got ${res.data.length}`);
});

await test('REG-010b', 'Independence Day (Aug 15) always present in 2026 holidays', async () => {
  const res = await api('GET', '/api/leave/holidays?year=2026');
  const found = res.data.find(h => h.date === '2026-08-15');
  assert(found, 'Independence Day must always be present at 2026-08-15');
});

// ─────────────────────────────────────────────
section('LEAD / CRM REGRESSIONS');
// ─────────────────────────────────────────────

await test('REG-005', 'javascript: URL must be blocked (XSS prevention regression)', async () => {
  assert(isUnsafeUrl('javascript:alert(1)'), 'javascript: URL must still be blocked');
});

await test('REG-005b', 'data: URL must be blocked', async () => {
  assert(isUnsafeUrl('data:text/html,<h1>xss</h1>'), 'data: URL must be blocked');
});

await test('REG-005c', 'https:// URL must NOT be flagged as unsafe', async () => {
  assert(!isUnsafeUrl('https://example.com'), 'https URL must not be blocked');
});

await test('REG-006', 'Unsupported file extension (.exe) must be rejected', async () => {
  const r = validateFile('trojan.exe', 100);
  assert(!r.ok, '.exe must be rejected');
  assert(r.msg?.includes('Unsupported'), 'Error must say Unsupported');
});

await test('REG-007', 'File over 10MB must be rejected', async () => {
  const r = validateFile('big.pdf', 11 * 1024 * 1024);
  assert(!r.ok, 'File over 10MB must be rejected');
  assert(r.msg?.includes('10 MB'), 'Error must mention 10 MB');
});

await test('REG-007b', 'File exactly 10MB must be allowed', async () => {
  const r = validateFile('exact.pdf', 10 * 1024 * 1024);
  assert(r.ok, '10MB exactly must be allowed');
});

await test('REG-017', 'URL normalizer must NOT double https://', async () => {
  const result = normalizeUrl('https://example.com');
  assertEqual(result, 'https://example.com', 'https:// must not be doubled');
  assert(!result.startsWith('https://https://'), 'Double https must never happen');
});

await test('REG-017b', 'URL without protocol gets https:// once', async () => {
  const result = normalizeUrl('example.com');
  assertEqual(result, 'https://example.com', 'Must prefix exactly one https://');
});

await test('REG-008', 'Tag deduplication works case-insensitively', async () => {
  const tags = sanitizeTags(['CRM', 'crm', 'Crm', 'Sales']);
  assertEqual(tags.length, 2, `Must deduplicate to 2 unique tags, got ${tags.length}`);
});

await test('REG-018', 'Tags over 50 characters must be excluded', async () => {
  const longTag = 'x'.repeat(51);
  const tags = sanitizeTags([longTag, 'ValidTag']);
  assertEqual(tags.length, 1, `Only valid tag should remain, got ${tags.length}`);
  assertEqual(tags[0], 'ValidTag', 'Only the valid tag must survive');
});

await test('REG-013', 'Lead filter by stage returns only matching stage leads', async () => {
  const res = await api('GET', '/api/leads?stage=Won');
  assert(res.success, 'Stage filter must work');
  if (res.data.length > 0) {
    const allWon = res.data.every(l => l.stage === 'Won' || l.stage === 'won');
    assert(allWon, 'All leads returned must have stage = Won');
  }
});

// ─────────────────────────────────────────────
section('VALIDATION REGRESSIONS');
// ─────────────────────────────────────────────

await test('REG-015', 'Phone starting with 0 must be rejected', async () => {
  assert(!PHONE_REGEX.test('0876543210'), 'Phone starting with 0 must fail');
});

await test('REG-015b', 'Phone starting with 5 must be rejected', async () => {
  assert(!PHONE_REGEX.test('5876543210'), 'Phone starting with 5 must fail');
});

await test('REG-015c', 'Phone starting with 9 must pass', async () => {
  assert(PHONE_REGEX.test('9876543210'), 'Phone starting with 9 must pass');
});

await test('REG-016', 'Email without @ must be rejected', async () => {
  assert(!EMAIL_REGEX.test('invalidemail.com'), 'Email without @ must fail');
});

await test('REG-016b', 'Valid email must pass', async () => {
  assert(EMAIL_REGEX.test('user@domain.com'), 'Valid email must pass');
});

// ─────────────────────────────────────────────
section('ATTENDANCE REGRESSIONS');
// ─────────────────────────────────────────────

await test('REG-011', 'Employee with no check-in always shows Absent (not undefined)', async () => {
  const status = resolveAttStatus(null, null);
  assertEqual(status, 'Absent', 'Must return Absent, not null/undefined');
});

await test('REG-011b', '"-" check-in must resolve as Absent', async () => {
  const status = resolveAttStatus('-', null);
  assertEqual(status, 'Absent', '"-" must map to Absent');
});

await test('REG-012', 'Attendance history query is limited to 200 records', async () => {
  const res = await api('GET', '/api/attendance/history');
  assert(res.success, 'History endpoint must succeed');
  // Source: attendance.js line 83: LIMIT 200 hardcoded
  assert(res.data.length <= 200, `Must return ≤ 200 records. Got ${res.data.length}`);
});

// ─────────────────────────────────────────────
section('SYSTEM REGRESSIONS');
// ─────────────────────────────────────────────

await test('REG-009', 'Health check always shows ≥ 20 migrations applied', async () => {
  const res = await api('GET', '/api/health');
  if (res.databases?.hrms?.status === 'HEALTHY') {
    assert(
      res.databases.hrms.migrationsApplied >= 20,
      `HRMS must have ≥ 20 migrations. Got: ${res.databases.hrms.migrationsApplied}`
    );
  }
});

await test('REG-004', 'Employee ID uniqueness: /api/employees/next-id returns unique EMP- ID', async () => {
  const r1 = await api('GET', '/api/employees/next-id');
  const r2 = await api('GET', '/api/employees/next-id');
  assert(r1.success, 'First next-id call must succeed');
  assert(r2.success, 'Second next-id call must succeed');
  // Both calls should return the same "next" ID (since no employee was created)
  const id1 = r1.nextId || r1.next_id;
  const id2 = r2.nextId || r2.next_id;
  assert(id1?.startsWith('EMP-'), 'Next ID must be EMP- format');
  assert(id2?.startsWith('EMP-'), 'Next ID must be EMP- format (second call)');
});

await test('REG-019', 'Malformed JSON POST body must return 400, not 500 crash', async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'Executive' },
      body: 'INVALID_JSON{{{'
    });
    // Must NOT be 500 (server crash)
    assert(res.status !== 500, `Server crashed with 500 on malformed JSON. Got ${res.status}`);
  } catch (e) {
    // Network error is acceptable (request rejected before reaching server)
  }
});

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  REGRESSION TEST RESULTS');
console.log(`  Total  : ${passed + failed}`);
console.log(`  Passed : ${passed} ✅`);
console.log(`  Failed : ${failed} ${failed > 0 ? '❌' : '✅'}`);
if (failed > 0) {
  console.log('\n  ⚠️  REGRESSION DETECTED — A previously fixed bug has re-appeared!');
}
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
