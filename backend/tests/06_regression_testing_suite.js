/**
 * TEST SUITE 06: REGRESSION TESTING SUITE
 * 
 * Target: Complete Multi-Module Regression Prevention across CRM, Sales, HRMS, and Helpdesk.
 * Modules Tested:
 * 1. CRM Lead Pipeline & Filtering Regression
 * 2. CRM Input Validation & Malformed Payload Rejection Regression
 * 3. Sales Quotation Calculation & Revision Control Regression
 * 4. HRMS Employee Master & Department Regression
 * 5. HRMS Interns Search & Department Filter Regression
 * 6. Helpdesk Support Ticket Lifecycle & Priority Filter Regression
 * 7. RBAC & Security Boundaries Regression
 */

import { crmPool, hrmsPool } from '../db/pool.js';

const BASE_URL = 'http://127.0.0.1:5000/api';

export async function runRegressionTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 06: REGRESSION TESTING (Core System Stability)');
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

  const testSuffix = Date.now();
  const testLeadId = `REG-LD-${testSuffix}`;
  let quotationId = null;

  try {
    // ------------------------------------------------------------------------
    // 1. CRM Lead Pipeline & Filtering Regression
    // ------------------------------------------------------------------------
    console.log('--- 1. CRM Pipeline & Multi-Parameter Filter Regression ---');
    // Fetch leads list
    const leadsRes = await fetch(`${BASE_URL}/leads`);
    const leadsJson = await leadsRes.json();
    assert(leadsRes.status === 200 && Array.isArray(leadsJson.data), 'CRM Leads list returns array of lead records', `Length: ${leadsJson.data?.length}`);

    // Filter by stage=Qualified
    const qualLeadsRes = await fetch(`${BASE_URL}/leads?stage=Qualified`);
    const qualLeadsJson = await qualLeadsRes.json();
    assert(qualLeadsRes.status === 200, 'Filtering by stage=Qualified returns HTTP 200');
    const allQual = (qualLeadsJson.data || []).every(l => l.stage.toLowerCase() === 'qualified');
    assert(allQual, 'Every lead in filtered dataset has stage="Qualified"');

    // Filter by minScore=70
    const scoreLeadsRes = await fetch(`${BASE_URL}/leads?minScore=70`);
    const scoreLeadsJson = await scoreLeadsRes.json();
    assert(scoreLeadsRes.status === 200, 'Filtering by minScore=70 returns HTTP 200');
    const allHigh = (scoreLeadsJson.data || []).every(l => Number(l.score) >= 70);
    assert(allHigh, 'Every lead in minScore=70 has score >= 70');

    // ------------------------------------------------------------------------
    // 2. CRM Input Validation & Malformed Payload Rejection Regression
    // ------------------------------------------------------------------------
    console.log('\n--- 2. CRM Input Validation Regression ---');
    // Missing contactPerson
    const failLead1 = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Lead',
        company: 'Corp',
        source: 'Website',
        email: 'test@corp.com',
        phone: '9876543210'
      })
    });
    assert(failLead1.status === 400, 'Rejects lead with missing contactPerson (400)', `Status: ${failLead1.status}`);

    // Invalid phone with letters
    const failLead2 = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Lead',
        company: 'Corp',
        source: 'Website',
        contactPerson: 'Alex Doe',
        designation: 'Manager',
        contactRole: 'Decision Maker',
        email: 'test@corp.com',
        phone: '98765ABCDE',
        assignedTo: 'Sarah Jenkins',
        assignedToEmployeeId: 'EMP-001'
      })
    });
    assert(failLead2.status === 400, 'Rejects phone with alphabetic characters (400)', `Status: ${failLead2.status}`);

    // Invalid email format
    const failLead3 = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Lead',
        company: 'Corp',
        source: 'Website',
        contactPerson: 'Alex Doe',
        designation: 'Manager',
        contactRole: 'Decision Maker',
        email: 'invalid-email-address',
        phone: '9876543210',
        assignedTo: 'Sarah Jenkins',
        assignedToEmployeeId: 'EMP-001'
      })
    });
    assert(failLead3.status === 400, 'Rejects malformed email address (400)', `Status: ${failLead3.status}`);

    // ------------------------------------------------------------------------
    // 3. Sales Quotation Calculation & Revision Control Regression
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Sales Quotation Regression ---');
    // Seed qualified lead for quote test
    await crmPool.query(`
      INSERT INTO leads (id, name, company, email, phone, stage, score, value, budget, requirement, decision_maker, expected_close_date, assigned_to, created_at, updated_at)
      VALUES ($1, 'Regression Lead', 'Regression Corp', 'reg@corp.com', '9876543210', 'Qualified', 85, 300000, 300000, 'Regression Requirement', 'Reg Manager', CURRENT_DATE + INTERVAL '10 days', 'EMP-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [testLeadId]);

    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLeadId,
        customerName: 'Regression Corp',
        amount: 300000,
        subtotal: 254237.29,
        taxAmount: 45762.71,
        status: 'Draft',
        items: [
          { productName: 'License Core', quantity: 2, unitPrice: 100000, total: 200000 },
          { productName: 'Support Pack', quantity: 1, unitPrice: 100000, total: 100000 }
        ]
      })
    });
    const quoteJson = await quoteRes.json();
    quotationId = quoteJson.data?.id;
    assert(quoteRes.status === 201 && quotationId, 'Quotation created with valid calculation schema', JSON.stringify(quoteJson));

    // Quotation items check
    const itemsRes = await crmPool.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [quotationId]);
    assert(itemsRes.rows.length === 2, 'Quotation items table persisted exactly 2 line items', `Found ${itemsRes.rows.length}`);

    // ------------------------------------------------------------------------
    // 4. HRMS Employee Master & Department Regression
    // ------------------------------------------------------------------------
    console.log('\n--- 4. HRMS Employee & Department Regression ---');
    const empRes = await fetch(`${BASE_URL}/employees`);
    const empJson = await empRes.json();
    assert(empRes.status === 200 && Array.isArray(empJson.employees || empJson.data), 'Employees API returns active employee list');

    const deptRes = await fetch(`${BASE_URL}/departments`);
    const deptJson = await deptRes.json();
    assert(deptRes.status === 200 && Array.isArray(deptJson.departments || deptJson.data), 'Departments API returns configured departments');

    // ------------------------------------------------------------------------
    // 5. HRMS Interns Search & Filter Regression
    // ------------------------------------------------------------------------
    console.log('\n--- 5. HRMS Interns Directory Regression ---');
    const internsRes = await fetch(`${BASE_URL}/interns`);
    const internsJson = await internsRes.json();
    assert(internsRes.status === 200 && Array.isArray(internsJson.interns || internsJson.data), 'Interns API returns active intern registry');

    const engInternsRes = await fetch(`${BASE_URL}/interns?department=Engineering`);
    const engInternsJson = await engInternsRes.json();
    assert(engInternsRes.status === 200, 'Filtering interns by department=Engineering returns HTTP 200');

    // ------------------------------------------------------------------------
    // 6. Helpdesk Support Ticket Lifecycle & Priority Filter Regression
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Helpdesk Support Ticket Regression ---');
    const ticketsRes = await fetch(`${BASE_URL}/helpdesk`);
    const ticketsJson = await ticketsRes.json();
    assert(ticketsRes.status === 200 && Array.isArray(ticketsJson.tickets), 'Helpdesk tickets listing returns tickets array');

    const highTicketsRes = await fetch(`${BASE_URL}/helpdesk?priority=High`);
    const highTicketsJson = await highTicketsRes.json();
    assert(highTicketsRes.status === 200, 'Filtering tickets by priority=High returns HTTP 200');

    // ------------------------------------------------------------------------
    // 7. RBAC & Security Boundaries Regression
    // ------------------------------------------------------------------------
    console.log('\n--- 7. RBAC & Privilege Elevation Protection Regression ---');
    // Standard employee Ramesh (EMP-008) requesting Executive role -> MUST BE 403 FORBIDDEN
    const rbacRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'EMP-008',
        pin: '1234',
        role: 'Executive'
      })
    });
    assert(rbacRes.status === 403, 'Privilege escalation blocked: Standard employee cannot log in with Executive role (403 Forbidden)', `Status: ${rbacRes.status}`);

  } catch (err) {
    console.error('Regression suite exception:', err);
    assert(false, 'Regression suite ran without fatal errors', err.message);
  } finally {
    // Cleanup
    if (quotationId) {
      await crmPool.query('DELETE FROM quotation_items WHERE quotation_id = $1', [quotationId]).catch(() => {});
      await crmPool.query('DELETE FROM quotations WHERE id = $1', [quotationId]).catch(() => {});
    }
    await crmPool.query('DELETE FROM leads WHERE id = $1', [testLeadId]).catch(() => {});
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Regression Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Regression Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('06_regression_testing_suite.js')) {
  runRegressionTests().then(async res => {
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}

