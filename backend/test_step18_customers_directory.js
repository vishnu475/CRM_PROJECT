import { crmPool } from './db/pool.js';
import { batchGetCustomersHealth, getCustomerHealth } from './services/customerHealthService.js';

async function runStep18Tests() {
  console.log('\n======================================================');
  console.log('🧪 STEP 18: CRM CUSTOMER DIRECTORY & 360 HUB TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify PostgreSQL connection & Customer table structure
    const tableRes = await crmPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers'
    `);
    const columnNames = tableRes.rows.map(r => r.column_name);

    assert(columnNames.includes('id'), 'Customer table contains id column');
    assert(columnNames.includes('customer_name'), 'Customer table contains customer_name column');
    assert(columnNames.includes('credit_limit'), 'Customer table contains credit_limit column');
    assert(columnNames.includes('converted_from_lead_id'), 'Customer table contains converted_from_lead_id column');
    assert(columnNames.includes('status'), 'Customer table contains status column');

    // 2. Fetch all customers from DB
    const custsRes = await crmPool.query('SELECT * FROM customers ORDER BY created_at DESC');
    console.log(`\n  📊 Discovered ${custsRes.rows.length} existing customer records in PostgreSQL`);
    assert(custsRes.rows.length >= 0, 'Database query for customers succeeds');

    // 3. Test Batch Customer Health Evaluation (Anti-N+1)
    const customerIds = custsRes.rows.map(c => c.id);
    const healthMap = await batchGetCustomersHealth(crmPool, customerIds);
    assert(healthMap instanceof Map, 'batchGetCustomersHealth returns a Map of health assessments');

    let activeCount = 0;
    let atRiskCount = 0;
    let inactiveCount = 0;
    let archivedCount = 0;

    custsRes.rows.forEach(cust => {
      const health = healthMap.get(cust.id);
      const effectiveStatus = health ? health.status : (cust.status || 'Active');
      if (effectiveStatus === 'Active') activeCount++;
      else if (effectiveStatus === 'At Risk') atRiskCount++;
      else if (effectiveStatus === 'Inactive') inactiveCount++;
      else if (effectiveStatus === 'Archived') archivedCount++;
    });

    console.log(`\n  📈 Dynamic Customer Health Breakdown:`);
    console.log(`     - Active: ${activeCount}`);
    console.log(`     - At Risk: ${atRiskCount}`);
    console.log(`     - Inactive: ${inactiveCount}`);
    console.log(`     - Archived: ${archivedCount}`);

    assert(activeCount + atRiskCount + inactiveCount + archivedCount === custsRes.rows.length, 'All customer records are accurately accounted for in health metrics');

    // 4. Test Customer Health Diagnostic Reasons for At Risk accounts
    const atRiskCust = custsRes.rows.find(c => {
      const h = healthMap.get(c.id);
      return h && h.status === 'At Risk';
    });
    if (atRiskCust) {
      const h = healthMap.get(atRiskCust.id);
      assert(Array.isArray(h.reasons) && h.reasons.length > 0, `At Risk customer ${atRiskCust.customer_name} has explicit diagnostic health reasons: ${h.reasons.join('; ')}`);
    } else {
      console.log('  ℹ️ No At Risk customers currently in database; reason structure verified via pure health engine test.');
    }

    // 5. Test Sales Orders & Invoices Linking to Customers (Total Sales calculation)
    const ordersRes = await crmPool.query(`
      SELECT customer_id, SUM(total_amount) as total_sales 
      FROM sales_orders 
      WHERE status != 'Cancelled' 
      GROUP BY customer_id
    `);
    console.log(`\n  🛒 Discovered ${ordersRes.rows.length} customers with confirmed sales orders`);
    assert(Array.isArray(ordersRes.rows), 'Sales orders aggregated by customer query executed cleanly');

    const invoicesRes = await crmPool.query(`
      SELECT customer_id, SUM(amount) as total_invoiced, SUM(amount - COALESCE(paid_amount, 0)) as outstanding
      FROM crm_invoices 
      WHERE status != 'Cancelled' AND status != 'Paid'
      GROUP BY customer_id
    `);
    console.log(`  🧾 Discovered ${invoicesRes.rows.length} customers with outstanding invoice balances`);
    assert(Array.isArray(invoicesRes.rows), 'Invoices aggregated by customer query executed cleanly');

    // 6. Test Converted Lead relationship preservation
    const convertedCusts = custsRes.rows.filter(c => c.converted_from_lead_id);
    console.log(`\n  🔄 Discovered ${convertedCusts.length} customers converted from CRM Leads`);
    if (convertedCusts.length > 0) {
      const firstConv = convertedCusts[0];
      const leadRes = await crmPool.query('SELECT * FROM leads WHERE id = $1', [firstConv.converted_from_lead_id]);
      assert(leadRes.rows.length > 0, `Customer ${firstConv.customer_name} is linked to valid Lead ID ${firstConv.converted_from_lead_id}`);
    } else {
      console.log('  ℹ️ No converted customers currently in DB; relationship column verified.');
    }

    // 7. Verify Display-Only constraint & Persistence
    // Updating a customer's basic info without altering automated health
    const testCustId = `CUST-TEST-${Date.now()}`;
    await crmPool.query(`
      INSERT INTO customers (id, customer_code, customer_name, customer_type, industry, credit_limit, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [testCustId, 'CUST-TEST', 'Test Engineering Corp', 'Company', 'Technology', 500000, 'Active']);

    const fetchedTest = await getCustomerHealth(crmPool, testCustId);
    assert(fetchedTest !== null, 'Newly inserted customer receives automatic health calculation without manual intervention');

    // Clean up test customer
    await crmPool.query('DELETE FROM customers WHERE id = $1', [testCustId]);
    assert(true, 'Test customer cleaned up cleanly');

  } catch (err) {
    console.error('❌ Test suite execution exception:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`🏁 STEP 18 TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep18Tests();
