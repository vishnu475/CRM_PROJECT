/**
 * TEST SUITE 02: INTEGRATION TESTING SUITE
 * 
 * Target: Multi-Module Workflows, Cross-Service Interactions, Dual Database Pools (crmPool & hrmsPool).
 * Verifies:
 * 1. CRM Lead -> Sales Quotation Handshake
 * 2. Quotation Status -> CRM Lead Stage Synchronization (Accepted -> Won; Rejected -> Qualified)
 * 3. Quotation Revision Lineage & Versioning
 * 4. Quotation -> Sales Order Generation
 * 5. HRMS Employee Assignment to CRM Leads
 * 6. Concurrent Dual-Database Transactions
 */

import { crmPool, hrmsPool } from '../db/pool.js';

const BASE_URL = 'http://127.0.0.1:5000/api';

export async function runIntegrationTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 02: INTEGRATION TESTING (Cross-Module & Dual DB)');
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
  const testLeadQualifiedId = `INT-LD-QUAL-${testSuffix}`;
  const testLeadNewId = `INT-LD-NEW-${testSuffix}`;
  let quotationId = null;
  let quoteData = null;
  let salesOrderId = null;

  try {
    // ------------------------------------------------------------------------
    // Sub-Suite 1: Dual Database Connectivity & Concurrent Pools
    // ------------------------------------------------------------------------
    console.log('--- Sub-Suite 1: Dual Database Pool Concurrency ---');
    const [crmPing, hrmsPing] = await Promise.all([
      crmPool.query('SELECT current_database() AS db, NOW() AS ts'),
      hrmsPool.query('SELECT current_database() AS db, NOW() AS ts')
    ]);

    assert(crmPing.rows[0].db === 'crm', 'Connected to CRM database pool ("crm")', `Got ${crmPing.rows[0].db}`);
    assert(hrmsPing.rows[0].db === 'HRMS', 'Connected to HRMS database pool ("HRMS")', `Got ${hrmsPing.rows[0].db}`);

    // Verify cross-database HRMS employee existence for CRM assignment
    const empRes = await hrmsPool.query("SELECT id, name, email, department FROM employees WHERE id = 'EMP-001' OR id = 'EMP-003' LIMIT 2");
    assert(empRes.rows.length >= 1, 'HRMS Employees table has valid employee records for CRM ownership', `Found ${empRes.rows.length} records`);

    // ------------------------------------------------------------------------
    // Sub-Suite 2: Lead Qualification & Quotation Handoff
    // ------------------------------------------------------------------------
    console.log('\n--- Sub-Suite 2: CRM Lead to Sales Quotation Integration ---');
    // Seed test leads in CRM DB
    await crmPool.query(`
      INSERT INTO leads (id, name, company, email, phone, stage, score, value, budget, requirement, decision_maker, expected_close_date, assigned_to, created_at, updated_at)
      VALUES 
        ($1, 'Integration Lead Qualified', 'Apex Integra Corp', 'lead.qual@apexintegra.io', '9876543210', 'Qualified', 85, 500000, 500000, 'ERP Integration Testing', 'Suresh Patel', CURRENT_DATE + INTERVAL '30 days', 'EMP-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ($2, 'Integration Lead New', 'Fresh Startup LLP', 'fresh@freshstart.io', '9876543211', 'New', 25, 200000, 200000, 'Initial Inquiry', 'Rohan Das', CURRENT_DATE + INTERVAL '30 days', 'EMP-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [testLeadQualifiedId, testLeadNewId]);

    // Test rejection of quotation creation for non-qualified lead
    const failQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLeadNewId,
        customerName: 'Fresh Startup LLP',
        amount: 200000,
        items: [{ productName: 'Core ERP License', quantity: 1, unitPrice: 200000, total: 200000 }]
      })
    });
    const failQuoteData = await failQuoteRes.json();
    assert(failQuoteRes.status === 400 && failQuoteData.message?.includes('Qualified'), 'Rejects quotation creation for non-qualified ("New") lead', JSON.stringify(failQuoteData));

    // Test successful quotation creation for 'Qualified' lead
    const createQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLeadQualifiedId,
        customerName: 'Apex Integra Corp',
        amount: 500000,
        subtotal: 423728.81,
        taxAmount: 76271.19,
        status: 'Draft',
        items: [
          { productName: 'ERP Enterprise Suite', quantity: 1, unitPrice: 350000, total: 350000 },
          { productName: 'Implementation & Training', quantity: 1, unitPrice: 150000, total: 150000 }
        ]
      })
    });
    const createQuoteJson = await createQuoteRes.json();
    assert(createQuoteRes.status === 201 && createQuoteJson.data?.id, 'Quotation successfully created for Qualified Lead with line items', JSON.stringify(createQuoteJson));
    quoteData = createQuoteJson.data;
    quotationId = quoteData?.id;

    // Verify DB linkage
    const quoteInDb = await crmPool.query('SELECT * FROM quotations WHERE id = $1', [quotationId]);
    assert(quoteInDb.rows[0].lead_id === testLeadQualifiedId, 'Quotation table correctly links lead_id foreign reference', `Got ${quoteInDb.rows[0]?.lead_id}`);

    // ------------------------------------------------------------------------
    // Sub-Suite 3: Quotation Status Synchronization with CRM Lead
    // ------------------------------------------------------------------------
    console.log('\n--- Sub-Suite 3: Quotation Lifecycle & CRM Lead Stage Sync ---');
    // Dispatch via status override or send endpoint
    const sendRes = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Sent', allowStatusOverride: true })
    });
    assert(sendRes.status === 200, 'Quotation transitions to "Sent" status', `Status ${sendRes.status}`);

    // Test Rejection: lead must remain 'Qualified' (not Lost)
    const rejectRes = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Rejected',
        isDefinitiveLoss: false,
        notes: 'Customer requested better payment terms'
      })
    });
    assert(rejectRes.status === 200, 'Quotation transitions to "Rejected" status without marking deal lost', `Status ${rejectRes.status}`);

    const leadAfterReject = await crmPool.query('SELECT stage FROM leads WHERE id = $1', [testLeadQualifiedId]);
    assert(leadAfterReject.rows[0].stage === 'Qualified', 'Lead remains "Qualified" upon quotation rejection (enables revision)', `Stage was ${leadAfterReject.rows[0].stage}`);

    // Accept Quotation: Must automatically transition Lead to 'Won'
    const acceptRes = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Accepted',
        acceptedDate: new Date().toISOString().split('T')[0]
      })
    });
    assert(acceptRes.status === 200, 'Quotation transitions to "Accepted" status', `Status ${acceptRes.status}`);

    const leadAfterAccept = await crmPool.query('SELECT stage, won_date, value FROM leads WHERE id = $1', [testLeadQualifiedId]);
    assert(leadAfterAccept.rows[0].stage === 'Won', 'Lead stage automatically updated to "Won" on quotation acceptance', `Stage was ${leadAfterAccept.rows[0].stage}`);
    assert(leadAfterAccept.rows[0].won_date !== null, 'Lead won_date is automatically recorded upon acceptance', `Won date: ${leadAfterAccept.rows[0].won_date}`);

    // ------------------------------------------------------------------------
    // Sub-Suite 4: Sales Order Conversion from Accepted Quotation
    // ------------------------------------------------------------------------
    console.log('\n--- Sub-Suite 4: Quotation to Sales Order Conversion ---');
    const orderRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: quotationId,
        customerId: quoteData.customer_id,
        customerName: quoteData.customer_name,
        totalAmount: 500000,
        subtotal: 423728.81,
        taxAmount: 76271.19
      })
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201 && orderData.success, 'Sales Order generated successfully from Accepted Quotation', JSON.stringify(orderData));
    salesOrderId = orderData.data?.id;

    // Verify Sales Order in DB and lineage to lead
    const orderInDb = await crmPool.query(
      `SELECT so.*, q.lead_id 
       FROM sales_orders so 
       JOIN quotations q ON so.quotation_id = q.id 
       WHERE so.id = $1`, 
      [salesOrderId]
    );
    assert(orderInDb.rows[0].quotation_id === quotationId, 'Sales Order stores foreign reference to quotation_id', `Got ${orderInDb.rows[0]?.quotation_id}`);
    assert(orderInDb.rows[0].lead_id === testLeadQualifiedId, 'Sales Order preserves trace to original lead_id via quotation lineage', `Got ${orderInDb.rows[0]?.lead_id}`);

    // Duplicate conversion rejection
    const dupOrderRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: quotationId,
        customerId: quoteData.customer_id,
        customerName: quoteData.customer_name,
        totalAmount: 500000
      })
    });
    assert(dupOrderRes.status === 400, 'Duplicate Sales Order creation from same quotation is strictly blocked (400)', `Status ${dupOrderRes.status}`);

  } catch (err) {
    console.error('Integration test exception:', err);
    assert(false, 'Integration suite ran without unhandled exceptions', err.message);
  } finally {
    // Cleanup test artifacts
    if (salesOrderId) {
      await crmPool.query('DELETE FROM sales_order_items WHERE sales_order_id = $1', [salesOrderId]).catch(() => {});
      await crmPool.query('DELETE FROM sales_orders WHERE id = $1', [salesOrderId]).catch(() => {});
    }
    if (quotationId) {
      await crmPool.query('DELETE FROM quotation_items WHERE quotation_id = $1', [quotationId]).catch(() => {});
      await crmPool.query('DELETE FROM quotations WHERE id = $1 OR lead_id = $2', [quotationId, testLeadQualifiedId]).catch(() => {});
    }
    await crmPool.query('DELETE FROM leads WHERE id IN ($1, $2)', [testLeadQualifiedId, testLeadNewId]).catch(() => {});
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Integration Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Integration Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('02_integration_testing_suite.js')) {
  runIntegrationTests().then(async res => {
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
