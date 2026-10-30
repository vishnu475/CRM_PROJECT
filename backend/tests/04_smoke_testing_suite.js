/**
 * TEST SUITE 04: SMOKE TESTING SUITE
 * 
 * Target: Baseline System Health, Service Availability, Port Listeners, Core Route Smoke Tests.
 * Checks:
 * 1. Backend API Server /api/health responding HTTP 200 OK
 * 2. Frontend Web Server responding HTTP 200 OK at port 3000
 * 3. CRM PostgreSQL DB pool connectivity & schema ping
 * 4. HRMS PostgreSQL DB pool connectivity & schema ping
 * 5. High-level responsiveness of 8 primary application REST endpoints
 * 6. Auth gateway responsiveness
 * 7. Verification that core production tables exist
 */

import { crmPool, hrmsPool } from '../db/pool.js';

const BACKEND_URL = 'http://127.0.0.1:5000';
const FRONTEND_URL = 'http://127.0.0.1:3000';

export async function runSmokeTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 04: SMOKE TESTING (Service Health & Core Readiness)');
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

  try {
    // ------------------------------------------------------------------------
    // 1. Service Port & HTTP Availability
    // ------------------------------------------------------------------------
    console.log('--- 1. Service Availability Smoke Checks ---');
    
    // Backend health endpoint
    const healthRes = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET' });
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'Backend API health check returns HTTP 200', `Status: ${healthRes.status}`);
    assert(healthJson.status === 'OK', 'Backend reports status "OK"', `Got ${healthJson.status}`);
    assert(healthJson.databases?.crm?.status === 'HEALTHY', 'CRM database status is "HEALTHY"', `Got ${healthJson.databases?.crm?.status}`);
    assert(healthJson.databases?.hrms?.status === 'HEALTHY', 'HRMS database status is "HEALTHY"', `Got ${healthJson.databases?.hrms?.status}`);

    // Frontend server check
    const feRes = await fetch(FRONTEND_URL, { method: 'GET' });
    const feText = await feRes.text();
    assert(feRes.status === 200, 'Frontend Vite server is running at port 3000 (HTTP 200)', `Status: ${feRes.status}`);
    assert(feText.includes('<html') || feText.includes('<!DOCTYPE html>'), 'Frontend returns valid HTML bundle', 'Did not find html markup');

    // ------------------------------------------------------------------------
    // 2. Database Engine & Query Smoke Checks
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Database Connectivity Smoke Checks ---');
    const crmQuery = await crmPool.query('SELECT 1 AS ping, current_database() AS db');
    assert(crmQuery.rows[0]?.ping === 1 && crmQuery.rows[0]?.db === 'crm', 'CRM PostgreSQL database responds to ping', JSON.stringify(crmQuery.rows[0]));

    const hrmsQuery = await hrmsPool.query('SELECT 1 AS ping, current_database() AS db');
    assert(hrmsQuery.rows[0]?.ping === 1 && hrmsQuery.rows[0]?.db === 'HRMS', 'HRMS PostgreSQL database responds to ping', JSON.stringify(hrmsQuery.rows[0]));

    // ------------------------------------------------------------------------
    // 3. Core REST API Endpoints Smoke Checks
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Core REST Endpoints Smoke Checks ---');
    const endpoints = [
      { path: '/api/leads', name: 'CRM Leads Collection' },
      { path: '/api/quotations', name: 'Sales Quotations Collection' },
      { path: '/api/sales-orders', name: 'Sales Orders Collection' },
      { path: '/api/customers', name: 'Customers Directory' },
      { path: '/api/employees', name: 'HRMS Employees Master' },
      { path: '/api/interns', name: 'HRMS Interns Directory' },
      { path: '/api/helpdesk/summary', name: 'Helpdesk Summary Metrics' },
      { path: '/api/departments', name: 'HRMS Departments Directory' }
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(`${BACKEND_URL}${ep.path}`, { method: 'GET' });
        assert(res.status === 200 || res.status === 304, `Endpoint ${ep.name} (${ep.path}) responds HTTP ${res.status}`, `Got status ${res.status}`);
      } catch (e) {
        assert(false, `Endpoint ${ep.name} (${ep.path}) reachable`, e.message);
      }
    }

    // ------------------------------------------------------------------------
    // 4. Security Gateway Smoke Check
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Authentication Gateway Smoke Check ---');
    const authRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(authRes.status === 400 || authRes.status === 401, 'Auth Gateway active: rejects empty login payload with 400/401', `Status: ${authRes.status}`);

    // ------------------------------------------------------------------------
    // 5. Schema Integrity Smoke Check
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Critical Tables Existence Smoke Check ---');
    const crmTables = await crmPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('leads', 'quotations', 'sales_orders', 'customers', 'contacts', 'helpdesk_tickets')
    `);
    const crmFound = crmTables.rows.map(r => r.table_name);
    assert(crmFound.includes('leads') && crmFound.includes('quotations') && crmFound.includes('sales_orders'), 'Core CRM tables exist (leads, quotations, sales_orders)', crmFound.join(', '));

    const hrmsTables = await hrmsPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('employees', 'interns', 'attendance_records', 'leave_requests')
    `);
    const hrmsFound = hrmsTables.rows.map(r => r.table_name);
    assert(hrmsFound.includes('employees') && hrmsFound.includes('interns') && hrmsFound.includes('attendance_records'), 'Core HRMS tables exist (employees, interns, attendance_records)', hrmsFound.join(', '));

  } catch (err) {
    console.error('Smoke test exception:', err);
    assert(false, 'Smoke suite completed without fatal error', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Smoke Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Smoke Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('04_smoke_testing_suite.js')) {
  runSmokeTests().then(async res => {
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
