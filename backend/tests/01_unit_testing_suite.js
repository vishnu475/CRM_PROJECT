/**
 * TEST SUITE 01: UNIT TESTING SUITE
 * 
 * Target: Pure Functions, Business Logic Calculators, Validation Rules, Formatting Engines.
 * Isolation: Standalone execution without external network or database dependencies.
 */

// ============================================================================
// 1. Quotation & Financial Calculation Unit
// ============================================================================
export function calculateLineItemTotal(quantity, unitPrice, discountPercent = 0) {
  const q = Number(quantity) || 0;
  const p = Number(unitPrice) || 0;
  const d = Number(discountPercent) || 0;
  const rawSubtotal = q * p;
  const discountAmount = rawSubtotal * (d / 100);
  return Math.round((rawSubtotal - discountAmount) * 100) / 100;
}

export function calculateQuotationSummary(items = [], globalDiscountPercent = 0, taxRatePercent = 18) {
  const lineItems = items.map(item => {
    const total = calculateLineItemTotal(item.quantity, item.unitPrice, item.discountPercent);
    return { ...item, total };
  });

  const subtotal = lineItems.reduce((acc, it) => acc + it.total, 0);
  const discountAmount = Math.round(subtotal * (globalDiscountPercent / 100) * 100) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * (taxRatePercent / 100) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    lineItems,
    subtotal,
    discountAmount,
    taxableAmount,
    taxRatePercent,
    taxAmount,
    grandTotal
  };
}

// ============================================================================
// 2. Lead Qualification & Workflow Validation Unit
// ============================================================================
export const MEANINGLESS_PLACEHOLDERS = new Set([
  'yes', 'ok', 'test', 'abc', '123', 'none', 'n/a', 'na', 'no', 'null', 'undefined', 'xyz'
]);

export function validateQualificationRequirement(val) {
  if (!val) return { isValid: false, message: 'Enter meaningful customer requirements.' };
  const trimmed = String(val).trim();
  if (!trimmed || trimmed.length < 10) return { isValid: false, message: 'Enter meaningful customer requirements.' };
  if (trimmed.length > 5000) return { isValid: false, message: 'Requirement text cannot exceed 5000 characters.' };
  if (MEANINGLESS_PLACEHOLDERS.has(trimmed.toLowerCase())) {
    return { isValid: false, message: 'Enter meaningful customer requirements.' };
  }
  return { isValid: true };
}

export function validateQualificationBudget(val) {
  if (val === undefined || val === null || val === '') {
    return { isValid: false, message: 'Enter a valid budget greater than ₹0.' };
  }
  const str = String(val).trim();
  if (!/^[0-9]+(\.[0-9]+)?$/.test(str)) {
    return { isValid: false, message: 'Enter a valid budget greater than ₹0.' };
  }
  const num = Number(str);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, message: 'Enter a valid budget greater than ₹0.' };
  }
  return { isValid: true };
}

export function validateQualificationDecisionMaker(val) {
  if (!val) return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  const trimmed = String(val).trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  }
  if (/^[0-9]+$/.test(trimmed) || !/^[a-zA-Z\s'\-\.]+$/.test(trimmed)) {
    return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  }
  return { isValid: true };
}

export function validateQualificationExpectedCloseDate(val) {
  if (!val) return { isValid: false, message: 'Select today or a future expected close date.' };
  const trimmed = String(val).trim();
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return { isValid: false, message: 'Select today or a future expected close date.' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = trimmed.split('-');
  let inputDate;
  if (parts.length === 3) {
    inputDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    inputDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  if (inputDate.getTime() < today.getTime()) {
    return { isValid: false, message: 'Select today or a future expected close date.' };
  }
  return { isValid: true };
}

export function validateLeadStageTransition(currentStage, targetStage, form = {}) {
  const normCurrent = String(currentStage || '').trim();
  const normTarget = String(targetStage || '').trim();

  if (normCurrent === normTarget) {
    return { allowed: true };
  }

  // Transitions to Qualified require full validation
  if (normTarget === 'Qualified') {
    const req = validateQualificationRequirement(form.requirement);
    if (!req.isValid) return { allowed: false, message: req.message };

    const bud = validateQualificationBudget(form.budget);
    if (!bud.isValid) return { allowed: false, message: bud.message };

    const dm = validateQualificationDecisionMaker(form.decisionMaker);
    if (!dm.isValid) return { allowed: false, message: dm.message };

    const dt = validateQualificationExpectedCloseDate(form.expectedCloseDate);
    if (!dt.isValid) return { allowed: false, message: dt.message };

    return { allowed: true };
  }

  // Allowed generic transitions
  const allowedMap = {
    'New': ['Contacted', 'Qualified', 'Lost'],
    'Contacted': ['New', 'Qualified', 'Lost'],
    'Qualified': ['Won', 'Lost', 'Contacted'],
    'Won': [],
    'Lost': ['New', 'Contacted', 'Qualified']
  };

  const allowedNext = allowedMap[normCurrent] || [];
  if (allowedNext.includes(normTarget)) {
    return { allowed: true };
  }

  return { allowed: false, message: `Transition from ${normCurrent} to ${normTarget} is not permitted.` };
}

// ============================================================================
// 3. Intern Onboarding Field Validators
// ============================================================================
export function validatePhone(phone) {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return null; // optional or handled by required check
  if (/[^0-9+\s\-]/.test(trimmed)) {
    return 'Phone number must be 10 digits only.';
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length !== 10) {
    return 'Phone number must be 10 digits only.';
  }
  return null; // Valid
}

export function validateDob(dobString) {
  if (!dobString) return 'Date of Birth is required.';
  const d = new Date(dobString);
  if (isNaN(d.getTime())) return 'Invalid Date of Birth.';
  const today = new Date();
  if (d > today) return 'Date of Birth cannot be in the future.';
  const ageYears = (today.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 16) return 'Intern must be at least 16 years old.';
  if (ageYears > 60) return 'Please verify Date of Birth.';
  return null;
}

export function validateCgpa(cgpa) {
  const trimmed = String(cgpa || '').trim();
  if (!trimmed) return 'CGPA or Percentage is required.';
  const numMatch = trimmed.match(/^([0-9]+(\.[0-9]+)?)/);
  if (!numMatch) return 'Enter a valid CGPA (e.g. 8.5) or Percentage (e.g. 85%).';
  const val = parseFloat(numMatch[1]);
  if (trimmed.includes('%') || val > 10) {
    if (val < 35 || val > 100) return 'Percentage must be between 35% and 100%.';
  } else {
    if (val < 1.0 || val > 10.0) return 'CGPA must be between 1.0 and 10.0.';
  }
  return null;
}

// ============================================================================
// 4. Currency and Formatting Unit
// ============================================================================
export function formatINR(value) {
  const num = Number(value);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function getLeadScoreLevel(score) {
  const s = Number(score) || 0;
  if (s <= 30) return 'Low';
  if (s <= 70) return 'Medium';
  return 'High';
}

// ============================================================================
// 5. Attendance & Overtime Calculator Unit
// ============================================================================
export function calculateAttendanceHours(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) {
    return { totalHours: 0, isHalfDay: false, isLate: false, overtimeHours: 0 };
  }
  const [inH, inM] = checkInTime.split(':').map(Number);
  const [outH, outM] = checkOutTime.split(':').map(Number);

  const inMinutes = inH * 60 + inM;
  const outMinutes = outH * 60 + outM;

  const durationMinutes = Math.max(0, outMinutes - inMinutes);
  const totalHours = Math.round((durationMinutes / 60) * 100) / 100;

  // Expected 9:00 AM check-in, 15 min grace period
  const isLate = inMinutes > (9 * 60 + 15);
  // Half day if less than 4.5 hours worked
  const isHalfDay = totalHours < 4.5;
  // Overtime if worked more than 8.0 hours
  const overtimeHours = totalHours > 8.0 ? Math.round((totalHours - 8.0) * 100) / 100 : 0;

  return { totalHours, isHalfDay, isLate, overtimeHours };
}

// ============================================================================
// 6. Helpdesk SLA Unit Calculator
// ============================================================================
export function calculateTicketSLA(priority, createdAt = new Date()) {
  const priorityHours = {
    'Urgent': 4,
    'High': 8,
    'Medium': 24,
    'Low': 48
  };
  const hours = priorityHours[priority] || 24;
  const dueDate = new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000);
  return {
    priority,
    slaHours: hours,
    dueDate: dueDate.toISOString()
  };
}

// ============================================================================
// TEST RUNNER
// ============================================================================
export async function runUnitTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 01: UNIT TESTING (Pure Logic & Calculation Units)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} -> ${details}`);
      failed++;
    }
  }

  // --- 1. Quotation & Financial Calculations ---
  console.log('--- Sub-Suite 1: Quotation & Financial Calculations ---');
  const line1 = calculateLineItemTotal(2, 50000, 10);
  assert(line1 === 90000, 'Line Item Total with 10% discount: 2 * 50,000 - 10% = 90,000', `Got ${line1}`);

  const line2 = calculateLineItemTotal(1, 100000, 0);
  assert(line2 === 100000, 'Line Item Total with 0% discount: 1 * 100,000 = 100,000', `Got ${line2}`);

  const summary = calculateQuotationSummary([
    { quantity: 2, unitPrice: 50000, discountPercent: 10 }, // 90,000
    { quantity: 1, unitPrice: 100000, discountPercent: 0 }  // 100,000
  ], 5, 18); // Subtotal: 190,000. 5% global discount: 9,500. Taxable: 180,500. 18% GST: 32,490. Grand: 212,990.

  assert(summary.subtotal === 190000, 'Quotation Subtotal is ₹1,90,000', `Got ${summary.subtotal}`);
  assert(summary.discountAmount === 9500, 'Quotation 5% Global Discount is ₹9,500', `Got ${summary.discountAmount}`);
  assert(summary.taxableAmount === 180500, 'Taxable Amount is ₹1,80,500', `Got ${summary.taxableAmount}`);
  assert(summary.taxAmount === 32490, '18% GST is ₹32,490', `Got ${summary.taxAmount}`);
  assert(summary.grandTotal === 212990, 'Grand Total is ₹2,12,990', `Got ${summary.grandTotal}`);

  // --- 2. Lead Qualification Validators ---
  console.log('\n--- Sub-Suite 2: Lead Qualification Validation ---');
  assert(!validateQualificationRequirement('abc').isValid, 'Rejects short requirement ("abc")', 'Failed to reject');
  assert(!validateQualificationRequirement('n/a').isValid, 'Rejects placeholder requirement ("n/a")', 'Failed to reject');
  assert(validateQualificationRequirement('Enterprise Cloud ERP migration for 250 users').isValid, 'Accepts valid requirement', 'Failed to accept');

  assert(!validateQualificationBudget('0').isValid, 'Rejects zero budget', 'Failed to reject 0');
  assert(!validateQualificationBudget('-5000').isValid, 'Rejects negative budget', 'Failed to reject negative');
  assert(!validateQualificationBudget('abc').isValid, 'Rejects non-numeric budget', 'Failed to reject string');
  assert(validateQualificationBudget('750000').isValid, 'Accepts valid positive budget "750000"', 'Failed to accept');

  assert(!validateQualificationDecisionMaker('12345').isValid, 'Rejects numeric decision maker', 'Failed to reject');
  assert(validateQualificationDecisionMaker('Vikram Malhotra').isValid, 'Accepts valid decision maker "Vikram Malhotra"', 'Failed to accept');

  const futureDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const pastDate = '2020-01-01';
  assert(validateQualificationExpectedCloseDate(futureDate).isValid, 'Accepts future expected close date', 'Failed to accept');
  assert(!validateQualificationExpectedCloseDate(pastDate).isValid, 'Rejects past expected close date', 'Failed to reject');

  // --- 3. Intern Onboarding Phone & Academics ---
  console.log('\n--- Sub-Suite 3: Intern Onboarding Field Validators ---');
  assert(validatePhone('9876543210') === null, 'Accepts exact 10-digit phone "9876543210"', 'Failed on 10 digits');
  assert(validatePhone('77777777777777777777') !== null, 'Rejects 20-digit phone number', 'Accepted overly long phone');
  assert(validatePhone('98765') !== null, 'Rejects 5-digit short phone', 'Accepted 5 digits');
  assert(validatePhone('987654321A') !== null, 'Rejects phone with letters', 'Accepted alphanumeric phone');

  assert(validateDob('2003-05-15') === null, 'Accepts valid DOB for adult intern (2003)', 'Rejected valid DOB');
  assert(validateDob('2025-01-01') !== null, 'Rejects intern younger than 16 years', 'Accepted infant/future DOB');

  assert(validateCgpa('8.5 CGPA') === null, 'Accepts valid CGPA "8.5 CGPA"', 'Rejected valid CGPA');
  assert(validateCgpa('85%') === null, 'Accepts valid percentage "85%"', 'Rejected percentage');
  assert(validateCgpa('15.5') !== null, 'Rejects out-of-range CGPA 15.5', 'Accepted 15.5');

  // --- 4. Currency and Formatting Unit ---
  console.log('\n--- Sub-Suite 4: Currency & Formatting ---');
  const inrFormatted = formatINR(14835000);
  assert(inrFormatted.includes('1,48,35,000') || inrFormatted.includes('14,835,000'), 'Formats ₹1,48,35,000 in Indian numbering format', `Got ${inrFormatted}`);
  assert(getLeadScoreLevel(25) === 'Low', 'Score 25 classified as Low', `Got ${getLeadScoreLevel(25)}`);
  assert(getLeadScoreLevel(55) === 'Medium', 'Score 55 classified as Medium', `Got ${getLeadScoreLevel(55)}`);
  assert(getLeadScoreLevel(85) === 'High', 'Score 85 classified as High', `Got ${getLeadScoreLevel(85)}`);

  // --- 5. Attendance & Overtime Calculator Unit ---
  console.log('\n--- Sub-Suite 5: Attendance & Overtime Calculations ---');
  const standardDay = calculateAttendanceHours('09:00', '18:00'); // 9 hours
  assert(standardDay.totalHours === 9, 'Standard workday: 9 hours worked', `Got ${standardDay.totalHours}`);
  assert(!standardDay.isLate, '9:00 AM check-in is not late', `Marked late`);
  assert(!standardDay.isHalfDay, '9 hours is not half day', `Marked half day`);
  assert(standardDay.overtimeHours === 1, '9 hours = 1 hour overtime (> 8h)', `Got ${standardDay.overtimeHours}`);

  const lateDay = calculateAttendanceHours('09:30', '18:00');
  assert(lateDay.isLate, '9:30 AM check-in is marked as Late (> 9:15 AM)', `Not marked late`);

  const halfDay = calculateAttendanceHours('09:00', '12:30'); // 3.5 hours
  assert(halfDay.isHalfDay, '3.5 hours worked is marked as Half Day (< 4.5h)', `Not marked half day`);

  // --- 6. Helpdesk SLA Unit Calculator ---
  console.log('\n--- Sub-Suite 6: Helpdesk SLA Calculations ---');
  const urgentSla = calculateTicketSLA('Urgent', new Date('2026-10-30T10:00:00Z'));
  assert(urgentSla.slaHours === 4, 'Urgent ticket SLA is 4 hours', `Got ${urgentSla.slaHours}`);
  assert(urgentSla.dueDate.includes('14:00:00'), 'Urgent ticket due 4 hours later (14:00:00Z)', `Got ${urgentSla.dueDate}`);

  const lowSla = calculateTicketSLA('Low', new Date('2026-10-30T10:00:00Z'));
  assert(lowSla.slaHours === 48, 'Low ticket SLA is 48 hours', `Got ${lowSla.slaHours}`);

  console.log('\n----------------------------------------------------------------');
  console.log(`Unit Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Unit Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('01_unit_testing_suite.js')) {
  runUnitTests().then(res => {
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}

