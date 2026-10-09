import { crmPool as pool } from './db/pool.js';
import { evaluateCustomerHealth, batchGetCustomersHealth, getCustomerHealth } from './services/customerHealthService.js';

async function runTests() {
  console.log('====================================================');
  console.log('STEP 14: Customer Health Classification Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   Details: ${details}`);
      failed++;
    }
  }

  const now = new Date('2026-09-08T12:00:00Z');

  // --- SECTION 1: UNIT EVALUATION OF CUSTOMER HEALTH RULES ---
  console.log('--- SECTION 1: Unit Evaluation Tests ---');

  // Customer A: Recent activity 5 days ago, active project, no overdue items -> ACTIVE
  const custA = evaluateCustomerHealth({ id: 'A', customer_name: 'Customer A' }, {
    daysSinceLastActivity: 5,
    activeProjects: 1,
    openOpportunities: 0,
    activeSalesOrders: 0,
    overdueFollowUps: 0,
    overdueInvoices: 0
  }, now);
  assert(custA.status === 'Active', 'Customer A should be ACTIVE', `Got ${custA.status}, reasons: ${JSON.stringify(custA.reasons)}`);

  // Customer B: Last activity 45 days ago, active project, one overdue follow-up -> AT RISK
  const custB = evaluateCustomerHealth({ id: 'B', customer_name: 'Customer B' }, {
    daysSinceLastActivity: 45,
    activeProjects: 1,
    openOpportunities: 0,
    activeSalesOrders: 0,
    overdueFollowUps: 1,
    overdueInvoices: 0
  }, now);
  assert(custB.status === 'At Risk', 'Customer B should be AT RISK', `Got ${custB.status}, reasons: ${JSON.stringify(custB.reasons)}`);
  assert(custB.reasons.some(r => r.includes('overdue follow-up')), 'Customer B mentions overdue follow-up in reasons');

  // Customer C: Last activity 150 days ago, no project, no opp, no active order -> INACTIVE
  const custC = evaluateCustomerHealth({ id: 'C', customer_name: 'Customer C' }, {
    daysSinceLastActivity: 150,
    activeProjects: 0,
    openOpportunities: 0,
    activeSalesOrders: 0,
    overdueFollowUps: 0,
    overdueInvoices: 0
  }, now);
  assert(custC.status === 'Inactive', 'Customer C should be INACTIVE', `Got ${custC.status}, reasons: ${JSON.stringify(custC.reasons)}`);

  // Customer D: Last activity 10 days ago, active opportunity, no warnings -> ACTIVE
  const custD = evaluateCustomerHealth({ id: 'D', customer_name: 'Customer D' }, {
    daysSinceLastActivity: 10,
    activeProjects: 0,
    openOpportunities: 1,
    activeSalesOrders: 0,
    overdueFollowUps: 0,
    overdueInvoices: 0
  }, now);
  assert(custD.status === 'Active', 'Customer D should be ACTIVE', `Got ${custD.status}, reasons: ${JSON.stringify(custD.reasons)}`);

  // Customer E: Last activity 20 days ago, overdue invoice, active business relationship -> AT RISK
  const custE = evaluateCustomerHealth({ id: 'E', customer_name: 'Customer E' }, {
    daysSinceLastActivity: 20,
    activeProjects: 1,
    openOpportunities: 0,
    activeSalesOrders: 0,
    overdueFollowUps: 0,
    overdueInvoices: 1
  }, now);
  assert(custE.status === 'At Risk', 'Customer E should be AT RISK', `Got ${custE.status}, reasons: ${JSON.stringify(custE.reasons)}`);
  assert(custE.reasons.some(r => r.includes('overdue invoice')), 'Customer E mentions overdue invoice in reasons');

  // Customer F: No activity for 200 days, no active business -> INACTIVE
  const custF = evaluateCustomerHealth({ id: 'F', customer_name: 'Customer F' }, {
    daysSinceLastActivity: 200,
    activeProjects: 0,
    openOpportunities: 0,
    activeSalesOrders: 0,
    overdueFollowUps: 0,
    overdueInvoices: 0
  }, now);
  assert(custF.status === 'Inactive', 'Customer F should be INACTIVE', `Got ${custF.status}, reasons: ${JSON.stringify(custF.reasons)}`);

  // Edge Case: Archived customer remains Archived
  const custArchived = evaluateCustomerHealth({ id: 'Arch', customer_name: 'Archived Cust', status: 'Archived' }, {
    daysSinceLastActivity: 5,
    activeProjects: 2
  }, now);
  assert(custArchived.status === 'Archived', 'Archived customer remains ARCHIVED', `Got ${custArchived.status}`);

  // Edge Case A: No activity for 120 days but has active project -> AT RISK (NOT Inactive)
  const caseA = evaluateCustomerHealth({ id: 'CaseA', customer_name: 'Case A' }, {
    daysSinceLastActivity: 120,
    activeProjects: 1,
    openOpportunities: 0,
    activeSalesOrders: 0
  }, now);
  assert(caseA.status === 'At Risk', 'Case A (120d no activity + active project) is AT RISK not Inactive', `Got ${caseA.status}`);

  // Edge Case B: Recent activity 2 days ago + overdue invoice -> AT RISK
  const caseB = evaluateCustomerHealth({ id: 'CaseB', customer_name: 'Case B' }, {
    daysSinceLastActivity: 2,
    activeProjects: 0,
    openOpportunities: 1,
    overdueInvoices: 1
  }, now);
  assert(caseB.status === 'At Risk', 'Case B (recent activity + overdue invoice) is AT RISK', `Got ${caseB.status}`);

  // --- SECTION 2: LIVE DATABASE INTEGRATION TESTS ---
  console.log('\n--- SECTION 2: Database Integration Tests ---');

  const testCustId = `CUST-HEALTH-TEST-${Date.now()}`;
  const testCustName = `Health Test Client ${Date.now()}`;

  try {
    // 1. Insert test customer
    await pool.query(`
      INSERT INTO customers (id, customer_code, customer_name, customer_type, industry, status)
      VALUES ($1, $2, $3, 'Company', 'Technology', 'Active')
    `, [testCustId, testCustId, testCustName]);

    // Initial check: No activity, no project, no opp -> should be INACTIVE
    let health = await getCustomerHealth(pool, testCustId, now);
    assert(health.status === 'Inactive', 'Fresh customer with zero activity & zero business is INACTIVE', `Got ${health?.status}`);

    // 2. Add an open opportunity for this customer
    const oppId = `OPP-HTEST-${Date.now()}`;
    await pool.query(`
      INSERT INTO opportunities (id, name, customer_id, customer_name, stage, value)
      VALUES ($1, 'Test Opp', $2, $3, 'Qualified', 500000)
    `, [oppId, testCustId, testCustName]);

    // Now has open opp, but no recent activity recorded -> AT RISK (needs interaction)
    health = await getCustomerHealth(pool, testCustId, now);
    assert(health.status === 'At Risk', 'Customer with open opp but no activity is AT RISK', `Got ${health?.status}`);

    // 3. Add recent activity (2 days before now)
    const actId = `ACT-HTEST-${Date.now()}`;
    await pool.query(`
      INSERT INTO activities (id, title, type, customer_id, related_to, due_date, status)
      VALUES ($1, 'Client Discussion', 'Meeting', $2, $3, '2026-09-06', 'Completed')
    `, [actId, testCustId, testCustName]);

    // Now has recent activity (2 days) and open opp and no overdue items -> ACTIVE
    health = await getCustomerHealth(pool, testCustId, now);
    assert(health.status === 'Active', 'Customer with recent activity + open opp is ACTIVE', `Got ${health?.status}`);
    assert(health.daysSinceLastActivity === 2, 'daysSinceLastActivity correctly computed as 2 days', `Got ${health?.daysSinceLastActivity}`);

    // 4. Add an overdue invoice
    const invId = `INV-HTEST-${Date.now()}`;
    await pool.query(`
      INSERT INTO crm_invoices (id, invoice_number, customer_id, customer_name, due_date, amount, paid_amount, status)
      VALUES ($1, $1, $2, $3, '2026-08-01', 100000, 0, 'Issued')
    `, [invId, testCustId, testCustName]);

    // Now has overdue invoice -> AT RISK
    health = await getCustomerHealth(pool, testCustId, now);
    assert(health.status === 'At Risk', 'Customer with overdue invoice becomes AT RISK', `Got ${health?.status}`);
    assert(health.overdueInvoices === 1, 'overdueInvoices count is 1', `Got ${health?.overdueInvoices}`);

    // 5. Test batch calculation across multiple customers
    const batchMap = await batchGetCustomersHealth(pool, null, now);
    assert(batchMap.size > 0, `Batch calculation returned ${batchMap.size} customer health records`);
    assert(batchMap.has(testCustId), 'Batch map contains our test customer');
    assert(batchMap.get(testCustId).status === 'At Risk', 'Batch map has correct status for test customer');

    // Clean up test data
    await pool.query('DELETE FROM crm_invoices WHERE id = $1', [invId]);
    await pool.query('DELETE FROM activities WHERE id = $1', [actId]);
    await pool.query('DELETE FROM opportunities WHERE id = $1', [oppId]);
    await pool.query('DELETE FROM customers WHERE id = $1', [testCustId]);

    console.log('✅ Cleaned up test data.');

  } catch (err) {
    console.error('Database test failed with error:', err);
    failed++;
  } finally {
    pool.end();
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
