/**
 * ============================================================
 * [4] SMOKE TESTING — Enterprise CRM / HRMS / ERP Platform
 * ============================================================
 * Quick "is the system alive?" check across all major endpoints.
 * Run this FIRST after every deployment to verify basic function.
 * If ANY smoke test fails, the deployment should be ROLLED BACK.
 *
 * HOW TO RUN:
 *   cd backend
 *   node tests/smoke.test.js
 *
 * PREREQUISITE: Backend must be running on localhost:5000
 * TIME TO RUN: ~5–10 seconds
 * ============================================================
 */

const BASE_URL = 'http://localhost:5000';
let passed = 0, failed = 0;

async function smoke(name, path, method = 'GET', body = null) {
  try {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'Executive',
        'x-user-name': 'Smoke Tester'
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const isOk = res.status >= 200 && res.status < 500; // 5xx = server crash
    if (isOk) {
      console.log(`  ✅ PASS  [${res.status}]  ${method} ${path}`);
      passed++;
    } else {
      throw new Error(`HTTP ${res.status} — Server-side failure`);
    }
  } catch (e) {
    console.error(`  ❌ FAIL  ${method} ${path}`);
    console.error(`          → ${e.message}`);
    failed++;
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  [4] SMOKE TESTING — System Availability Check');
console.log('  All critical endpoints must return HTTP 2xx or 4xx.');
console.log('  HTTP 5xx = Server crashed = deployment must be rolled back.');
console.log('═══════════════════════════════════════════════════════\n');

// ─────────────────────────────────────────────────
console.log('── CORE SYSTEM ─────────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Health Check',                          '/api/health');
await smoke('Auth Route',                            '/api/auth/session');

// ─────────────────────────────────────────────────
console.log('\n── HRMS MODULE ─────────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Employees List',                        '/api/employees');
await smoke('Employee Next ID',                      '/api/employees/next-id');
await smoke('Departments',                           '/api/departments');
await smoke('Designations',                          '/api/designations');
await smoke('Branches',                              '/api/branches');

// ─────────────────────────────────────────────────
console.log('\n── ATTENDANCE & SHIFTS ──────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Attendance Today',                      '/api/attendance/today');
await smoke('Attendance History',                    '/api/attendance/history');
await smoke('Attendance Live Feed',                  '/api/attendance/live');
await smoke('Shifts List',                           '/api/shifts');
await smoke('Timesheets',                            '/api/timesheets');

// ─────────────────────────────────────────────────
console.log('\n── LEAVE MANAGEMENT ─────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Leave Types',                           '/api/leave/types');
await smoke('Leave Balance',                         '/api/leave/balance?employeeId=EMP-001');
await smoke('Leave Requests',                        '/api/leave/requests');
await smoke('Public Holidays 2026',                  '/api/leave/holidays?year=2026');

// ─────────────────────────────────────────────────
console.log('\n── PAYROLL ENGINE ───────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Payroll Runs',                          '/api/payroll/runs');
await smoke('Payroll Structures',                    '/api/payroll/structures');
await smoke('Payment Transactions',                  '/api/payroll/payments');

// ─────────────────────────────────────────────────
console.log('\n── ESS PORTAL ───────────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('ESS Profile',                           '/api/v1/employee/profile',     'GET');
await smoke('ESS Attendance',                        '/api/v1/employee/attendance',  'GET');
await smoke('ESS Leaves',                            '/api/v1/employee/leaves',      'GET');
await smoke('ESS Payslips',                          '/api/v1/employee/payslips',    'GET');
await smoke('ESS Tasks',                             '/api/v1/employee/tasks',       'GET');

// ─────────────────────────────────────────────────
console.log('\n── CRM MODULE ───────────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Leads',                                 '/api/leads');
await smoke('Customers',                             '/api/customers');
await smoke('Contacts',                              '/api/contacts');
await smoke('Opportunities',                         '/api/opportunities');
await smoke('CRM Activities',                        '/api/crm/activities');
await smoke('CRM Follow-Ups',                        '/api/crm/followups');

// ─────────────────────────────────────────────────
console.log('\n── SALES & FINANCE ──────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Quotations',                            '/api/quotations');
await smoke('Sales Orders',                          '/api/sales-orders');
await smoke('CRM Invoices',                          '/api/crm/invoices');
await smoke('CRM Products',                          '/api/crm/products');
await smoke('Accounts (COA)',                        '/api/accounts');
await smoke('Banking',                               '/api/banking');
await smoke('Expenses',                              '/api/expenses');

// ─────────────────────────────────────────────────
console.log('\n── PROCUREMENT & INVENTORY ──────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Vendors',                               '/api/vendors');
await smoke('Purchase Orders',                       '/api/purchase-orders');

// ─────────────────────────────────────────────────
console.log('\n── PROJECTS & TASKS ─────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Projects',                              '/api/projects');
await smoke('Groups',                                '/api/groups');
await smoke('Tasks',                                 '/api/tasks');
await smoke('Task Analytics',                        '/api/tasks/analytics');
await smoke('Completed Tasks',                       '/api/tasks/completed');
await smoke('Tasks for Review',                      '/api/tasks/review');
await smoke('Allocations',                           '/api/allocations');

// ─────────────────────────────────────────────────
console.log('\n── DOCUMENTS & REPORTS ──────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Documents',                             '/api/documents');
await smoke('Document Types',                        '/api/document-types');
await smoke('Document Categories',                   '/api/document-categories');
await smoke('Reports',                               '/api/reports');
await smoke('Test Reports',                          '/api/test-reports');

// ─────────────────────────────────────────────────
console.log('\n── RECRUITMENT ──────────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Recruitment',                           '/api/recruitment');
await smoke('HRMS Interns',                          '/api/interns');

// ─────────────────────────────────────────────────
console.log('\n── ADMIN & SETTINGS ─────────────────────────────────');
// ─────────────────────────────────────────────────
await smoke('Modules',                               '/api/modules');
await smoke('Dashboard',                             '/api/dashboard');

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
const total = passed + failed;
const rate = ((passed / total) * 100).toFixed(0);

console.log('\n═══════════════════════════════════════════════════════');
console.log('  SMOKE TEST RESULTS');
console.log(`  Total    : ${total} endpoints`);
console.log(`  Online   : ${passed} ✅`);
console.log(`  Failed   : ${failed} ${failed > 0 ? '❌' : '✅'}`);
console.log(`  Coverage : ${rate}%`);
if (failed > 0) {
  console.log('\n  ⚠️  SMOKE TEST FAILED — DO NOT PROCEED TO PRODUCTION');
} else {
  console.log('\n  ✅ ALL SYSTEMS ONLINE — Safe to proceed');
}
console.log('═══════════════════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
