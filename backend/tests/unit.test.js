/**
 * ============================================================
 * [1] UNIT TESTING — Enterprise CRM / HRMS / ERP Platform
 * ============================================================
 * Tests individual functions and business logic rules
 * in complete isolation from database and HTTP layer.
 *
 * HOW TO RUN:
 *   cd backend
 *   node tests/unit.test.js
 *
 * PREREQUISITE: Backend server does NOT need to be running.
 * ============================================================
 */

// ──────────────────────────────────────────────────────────────
// TEST RUNNER (zero-dependency)
// ──────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ FAIL  ${name}`);
    console.error(`          → ${e.message}`);
    failed++;
  }
}
function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}
function section(title) {
  console.log(`\n── ${title} ──────────────────────────────────────`);
}

// ──────────────────────────────────────────────────────────────
// SOURCE LOGIC RE-IMPLEMENTATIONS (extracted from source code)
// ──────────────────────────────────────────────────────────────

/**
 * PAYROLL ENGINE
 * Source: backend/services/payrollService.js
 * Logic: Net Pay = Gross - Deductions - LOP
 */
function computeNetSalary({ grossSalary, lopDays, workingDays }) {
  const PF = Math.min(grossSalary * 0.6 * 0.12, 1800);       // 12% of Basic, max ₹1800
  const ESI = grossSalary <= 21000 ? grossSalary * 0.0075 : 0; // 0.75% if Gross ≤ ₹21,000
  const PT = grossSalary >= 15001 ? 200 : grossSalary >= 10001 ? 150 : 100; // PT slab
  const TDS = (grossSalary * 12 * 0.05) / 12;                // 5% annual TDS / 12
  const lopDeduction = (grossSalary / workingDays) * lopDays;
  const totalDeductions = PF + ESI + PT + TDS + lopDeduction;
  const netPay = grossSalary - totalDeductions;
  return { PF: Math.round(PF), ESI: Math.round(ESI), PT, TDS: Math.round(TDS), lopDeduction: Math.round(lopDeduction), netPay: Math.round(netPay) };
}

/**
 * LEAVE BALANCE GUARD
 * Source: backend/routes/leave.js (line 182)
 * Logic: Reject if available < requested days
 */
function checkLeaveBalance(available, requested) {
  if (available < requested) {
    return { allowed: false, message: `Insufficient balance. Available: ${available} days.` };
  }
  return { allowed: true };
}

/**
 * LEAVE TYPE ID MAPPER
 * Source: backend/routes/leave.js (line 189-190)
 */
function mapLeaveTypeId(leaveType) {
  if (leaveType.toLowerCase().includes('sick')) return 'lt-sl';
  if (leaveType.toLowerCase().includes('privilege')) return 'lt-pl';
  return 'lt-cl'; // Default to Casual Leave
}

/**
 * FILE EXTENSION VALIDATOR
 * Source: backend/routes/leads.js (line 16-25)
 */
const ALLOWED_EXTENSIONS = new Set(['svg', 'png', 'jpg', 'jpeg', 'pdf']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function validateLeadAttachment(fileName, bufferLength) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, message: 'Unsupported file type. Only SVG, PNG, JPG, JPEG, PDF allowed.' };
  }
  if (bufferLength > MAX_FILE_SIZE_BYTES) {
    return { valid: false, message: 'File size must be 10 MB or less.' };
  }
  return { valid: true };
}

/**
 * URL VALIDATOR
 * Source: backend/routes/leads.js (line 172-185)
 */
function isValidUrl(urlString) {
  if (!urlString) return true;
  const trimmed = urlString.trim();
  if (trimmed.length > 250) return false;
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return false;
  try {
    const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch (e) {
    return false;
  }
}

/**
 * URL NORMALIZER
 * Source: backend/routes/leads.js (line 188-194)
 */
function normalizeUrl(urlString) {
  if (!urlString) return null;
  const trimmed = urlString.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * TAG SANITIZER
 * Source: backend/routes/leads.js (line 196-218)
 */
function sanitizeTags(tagsInput) {
  if (!tagsInput) return [];
  let tagList = Array.isArray(tagsInput) ? tagsInput : tagsInput.split(',');
  const cleanTags = [];
  const seen = new Set();
  for (const t of tagList) {
    if (typeof t !== 'string') continue;
    const cleaned = t.replace(/<[^>]*>?/gm, '').trim();
    if (cleaned.length > 0 && cleaned.length <= 50) {
      const lower = cleaned.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        cleanTags.push(cleaned);
      }
    }
  }
  return cleanTags;
}

/**
 * PHONE VALIDATOR
 * Source: backend/routes/leads.js (line 163)
 * Indian mobile: starts with 6-9, 10 digits
 */
const PHONE_REGEX = /^[6-9]\d{9}$/;
function isValidIndianPhone(phone) {
  return PHONE_REGEX.test(phone);
}

/**
 * EMAIL VALIDATOR
 * Source: backend/routes/leads.js (line 162)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * EMPLOYEE ID PARSER
 * Source: backend/routes/employees.js (line 57)
 * Only 'EMP-' prefixed IDs are valid synced employees
 */
function isValidEmployeeId(id) {
  return typeof id === 'string' && id.startsWith('EMP-');
}

/**
 * TASK AUTH ROLE RESOLVER
 * Source: backend/routes/tasks.js (line 15)
 */
function resolveTaskRole(userRole, headerEmpId) {
  return userRole || (headerEmpId ? 'Employee' : 'Admin');
}

/**
 * PAYROLL ADMIN GUARD
 * Source: backend/routes/payroll.js (line 126-138)
 * Employees cannot disburse salaries
 */
function canDisburseSalary(role) {
  const blocked = ['Employee', 'EMPLOYEE'];
  const allowed = ['Admin', 'Finance', 'HR', 'Manager'];
  if (blocked.includes(role) && !allowed.includes(role)) return false;
  return true;
}

/**
 * ATTENDANCE STATUS RESOLVER
 * Source: backend/routes/attendance.js (line 33-37 SQL CASE)
 */
function resolveAttendanceStatus(checkIn, existingStatus) {
  if (checkIn && checkIn !== '-' && checkIn !== 'OFF') return existingStatus || 'Present';
  if (existingStatus) return existingStatus;
  return 'Absent';
}

// ══════════════════════════════════════════════════════════════
//                      TEST CASES
// ══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════');
console.log('  [1] UNIT TESTING — Enterprise CRM / HRMS / ERP');
console.log('═══════════════════════════════════════════════════════');

// ─────────────────────────────────────────────
section('PAYROLL ENGINE — Net Salary Computation');
// ─────────────────────────────────────────────

test('Standard payroll: Gross ₹30,000, 0 LOP days, 26 working days', () => {
  const { netPay, PF, ESI, PT } = computeNetSalary({ grossSalary: 30000, lopDays: 0, workingDays: 26 });
  assert(PF === 1800, `PF must be capped at ₹1800, got ${PF}`);
  assertEqual(ESI, 0, 'ESI is 0 when gross > ₹21,000');
  assertEqual(PT, 200, 'PT must be ₹200 for gross > ₹15,000');
  assert(netPay > 0, 'Net pay must be positive');
  assert(netPay < 30000, 'Net pay must be less than gross');
});

test('ESI applies when gross ≤ ₹21,000', () => {
  const { ESI } = computeNetSalary({ grossSalary: 20000, lopDays: 0, workingDays: 26 });
  assert(ESI > 0, `ESI must apply for gross ≤ 21000, got ${ESI}`);
  assertEqual(ESI, Math.round(20000 * 0.0075), 'ESI must be 0.75% of gross');
});

test('LOP deduction reduces net pay correctly', () => {
  const { lopDeduction, netPay } = computeNetSalary({ grossSalary: 30000, lopDays: 3, workingDays: 26 });
  const expectedLop = Math.round((30000 / 26) * 3);
  assertEqual(lopDeduction, expectedLop, 'LOP deduction must be (Gross/WorkingDays) × LOP_Days');
  assert(netPay > 0, 'Net pay must remain positive with LOP');
});

test('PT slab: ₹150 for gross between ₹10,001–₹15,000', () => {
  const { PT } = computeNetSalary({ grossSalary: 12000, lopDays: 0, workingDays: 26 });
  assertEqual(PT, 150, 'PT must be ₹150 for ₹10,001–₹15,000 bracket');
});

test('PT slab: ₹100 for gross ≤ ₹10,000', () => {
  const { PT } = computeNetSalary({ grossSalary: 8000, lopDays: 0, workingDays: 26 });
  assertEqual(PT, 100, 'PT must be ₹100 for gross ≤ ₹10,000');
});

test('Zero LOP = zero LOP deduction', () => {
  const { lopDeduction } = computeNetSalary({ grossSalary: 30000, lopDays: 0, workingDays: 26 });
  assertEqual(lopDeduction, 0, 'LOP deduction must be 0 when LOP days = 0');
});

// ─────────────────────────────────────────────
section('LEAVE BALANCE GUARD');
// ─────────────────────────────────────────────

test('Leave allowed when available > requested', () => {
  const result = checkLeaveBalance(10, 3);
  assert(result.allowed === true, 'Leave must be approved when balance is sufficient');
});

test('Leave denied when available < requested', () => {
  const result = checkLeaveBalance(2, 5);
  assert(result.allowed === false, 'Leave must be denied when balance is insufficient');
  assert(result.message.includes('Insufficient'), 'Error message must mention insufficient balance');
});

test('Leave denied when available = 0', () => {
  const result = checkLeaveBalance(0, 1);
  assert(result.allowed === false, 'Leave must be denied with zero balance');
});

test('Leave allowed with exact balance match', () => {
  const result = checkLeaveBalance(5, 5);
  assert(result.allowed === true, 'Leave must be allowed when available === requested');
});

// ─────────────────────────────────────────────
section('LEAVE TYPE ID MAPPER');
// ─────────────────────────────────────────────

test('Sick Leave maps to lt-sl', () => {
  assertEqual(mapLeaveTypeId('Sick Leave'), 'lt-sl', 'Sick Leave must map to lt-sl');
});

test('Privilege Leave maps to lt-pl', () => {
  assertEqual(mapLeaveTypeId('Privilege Leave'), 'lt-pl', 'Privilege Leave must map to lt-pl');
});

test('Casual Leave maps to lt-cl', () => {
  assertEqual(mapLeaveTypeId('Casual Leave'), 'lt-cl', 'Casual Leave must map to lt-cl');
});

test('Unknown type defaults to lt-cl', () => {
  assertEqual(mapLeaveTypeId('Other Leave'), 'lt-cl', 'Unknown leave type must default to lt-cl');
});

// ─────────────────────────────────────────────
section('FILE ATTACHMENT VALIDATOR (Lead Attachments)');
// ─────────────────────────────────────────────

test('Valid PDF attachment is accepted', () => {
  const result = validateLeadAttachment('requirement.pdf', 500 * 1024);
  assert(result.valid === true, 'PDF must be accepted');
});

test('Valid PNG attachment is accepted', () => {
  const result = validateLeadAttachment('logo.png', 2 * 1024 * 1024);
  assert(result.valid === true, 'PNG must be accepted');
});

test('Invalid extension (.exe) is rejected', () => {
  const result = validateLeadAttachment('virus.exe', 1024);
  assert(result.valid === false, '.exe files must be rejected');
  assert(result.message.includes('Unsupported'), 'Must return unsupported message');
});

test('File over 10MB is rejected', () => {
  const result = validateLeadAttachment('large.pdf', 11 * 1024 * 1024);
  assert(result.valid === false, 'Files over 10MB must be rejected');
  assert(result.message.includes('10 MB'), 'Error must mention 10 MB limit');
});

test('Invalid extension (.js) is rejected', () => {
  const result = validateLeadAttachment('script.js', 1024);
  assert(result.valid === false, '.js files must be rejected');
});

// ─────────────────────────────────────────────
section('URL VALIDATOR');
// ─────────────────────────────────────────────

test('Valid https URL is accepted', () => {
  assert(isValidUrl('https://acmecorp.com'), 'https URL must be valid');
});

test('Valid http URL is accepted', () => {
  assert(isValidUrl('http://acmecorp.com'), 'http URL must be valid');
});

test('URL without protocol is accepted (will be prefixed)', () => {
  assert(isValidUrl('acmecorp.com'), 'URL without protocol should be accepted');
});

test('javascript: URL is rejected (XSS prevention)', () => {
  assert(!isValidUrl('javascript:alert(1)'), 'javascript: URLs must be blocked');
});

test('data: URL is rejected', () => {
  assert(!isValidUrl('data:text/html,<h1>xss</h1>'), 'data: URLs must be blocked');
});

test('null/empty URL is valid (optional field)', () => {
  assert(isValidUrl(null), 'null URL should be valid (optional field)');
  assert(isValidUrl(''), 'empty URL should be valid (optional field)');
});

test('URL over 250 chars is rejected', () => {
  assert(!isValidUrl('https://' + 'a'.repeat(250)), 'URLs over 250 chars must be rejected');
});

// ─────────────────────────────────────────────
section('URL NORMALIZER');
// ─────────────────────────────────────────────

test('URL without protocol gets https:// prefixed', () => {
  assertEqual(normalizeUrl('acmecorp.com'), 'https://acmecorp.com', 'Must prefix https://');
});

test('https:// URL stays unchanged', () => {
  assertEqual(normalizeUrl('https://acmecorp.com'), 'https://acmecorp.com', 'https:// must not be doubled');
});

test('null input returns null', () => {
  assertEqual(normalizeUrl(null), null, 'null must return null');
});

// ─────────────────────────────────────────────
section('TAG SANITIZER');
// ─────────────────────────────────────────────

test('HTML tags are stripped from tag input', () => {
  const tags = sanitizeTags(['<b>Important</b>']);
  assertEqual(tags[0], 'Important', 'HTML must be stripped from tags');
});

test('Duplicate tags are removed', () => {
  const tags = sanitizeTags(['crm', 'CRM', 'crm']);
  assertEqual(tags.length, 1, 'Duplicate tags must be removed (case-insensitive)');
});

test('Tags over 50 chars are excluded', () => {
  const longTag = 'a'.repeat(51);
  const tags = sanitizeTags([longTag]);
  assertEqual(tags.length, 0, 'Tags over 50 chars must be excluded');
});

test('Comma-separated string is split into tags', () => {
  const tags = sanitizeTags('enterprise,CRM,sales');
  assert(tags.length === 3, 'Comma-separated tags must be split');
});

test('Empty input returns empty array', () => {
  assertEqual(sanitizeTags(null).length, 0, 'null must return empty array');
  assertEqual(sanitizeTags('').length, 0, 'empty string must return empty array');
});

// ─────────────────────────────────────────────
section('INDIAN PHONE VALIDATOR');
// ─────────────────────────────────────────────

test('Valid 10-digit mobile starting with 9 is accepted', () => {
  assert(isValidIndianPhone('9876543210'), '9876543210 must be valid');
});

test('Valid 10-digit mobile starting with 6 is accepted', () => {
  assert(isValidIndianPhone('6234567890'), '6234567890 must be valid');
});

test('11-digit number is rejected', () => {
  assert(!isValidIndianPhone('98765432100'), '11-digit numbers must be rejected');
});

test('Number starting with 5 is rejected', () => {
  assert(!isValidIndianPhone('5876543210'), 'Numbers starting with 5 must be rejected');
});

test('Number starting with 0 is rejected', () => {
  assert(!isValidIndianPhone('0876543210'), 'Numbers starting with 0 must be rejected');
});

// ─────────────────────────────────────────────
section('EMAIL VALIDATOR');
// ─────────────────────────────────────────────

test('Valid email address passes', () => {
  assert(isValidEmail('john.doe@company.com'), 'Standard email must pass');
});

test('Email without @ fails', () => {
  assert(!isValidEmail('johndoecompany.com'), 'Email without @ must fail');
});

test('Email without domain fails', () => {
  assert(!isValidEmail('john@'), 'Email without domain must fail');
});

// ─────────────────────────────────────────────
section('EMPLOYEE ID VALIDATOR');
// ─────────────────────────────────────────────

test('EMP- prefixed ID is valid', () => {
  assert(isValidEmployeeId('EMP-001'), 'EMP-001 must be valid');
  assert(isValidEmployeeId('EMP-999'), 'EMP-999 must be valid');
});

test('Non EMP- ID is invalid', () => {
  assert(!isValidEmployeeId('EXP-001'), 'EXP-001 must be invalid');
  assert(!isValidEmployeeId('123'), 'Numeric ID must be invalid');
});

// ─────────────────────────────────────────────
section('TASK ROLE RESOLVER');
// ─────────────────────────────────────────────

test('Role from JWT takes precedence', () => {
  assertEqual(resolveTaskRole('HR', 'EMP-001'), 'HR', 'JWT role must take precedence');
});

test('Employee role when no JWT role but has employee header', () => {
  assertEqual(resolveTaskRole(null, 'EMP-001'), 'Employee', 'Must default to Employee when emp ID provided');
});

test('Admin when neither JWT role nor emp ID', () => {
  assertEqual(resolveTaskRole(null, null), 'Admin', 'Must default to Admin when nothing provided');
});

// ─────────────────────────────────────────────
section('PAYROLL DISBURSE GUARD');
// ─────────────────────────────────────────────

test('Finance role can disburse salary', () => {
  assert(canDisburseSalary('Finance'), 'Finance role must be able to disburse');
});

test('HR role can disburse salary', () => {
  assert(canDisburseSalary('HR'), 'HR role must be able to disburse');
});

test('Employee role CANNOT disburse salary', () => {
  assert(!canDisburseSalary('Employee'), 'Employee role must be blocked from disbursing');
});

// ─────────────────────────────────────────────
section('ATTENDANCE STATUS RESOLVER');
// ─────────────────────────────────────────────

test('Employee with check-in time is Present', () => {
  assertEqual(resolveAttendanceStatus('09:00:00', 'Present'), 'Present', 'Clocked-in must be Present');
});

test('Employee with Late check-in is Late', () => {
  assertEqual(resolveAttendanceStatus('10:30:00', 'Late'), 'Late', 'Late clock-in must be Late');
});

test('Employee with no check-in is Absent', () => {
  assertEqual(resolveAttendanceStatus(null, null), 'Absent', 'No check-in must be Absent');
});

test('Employee with - check-in is Absent', () => {
  assertEqual(resolveAttendanceStatus('-', null), 'Absent', '- check-in must be Absent');
});

// ──────────────────────────────────────────────────────────────
// RESULTS SUMMARY
// ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log(`  UNIT TEST RESULTS`);
console.log(`  Total  : ${passed + failed}`);
console.log(`  Passed : ${passed} ✅`);
console.log(`  Failed : ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
