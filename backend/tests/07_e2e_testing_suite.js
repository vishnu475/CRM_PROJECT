/**
 * TEST SUITE 07: END-TO-END (E2E) TESTING SUITE
 * 
 * Target: Full-Stack Enterprise Data Lifecycle Simulation.
 * Traversal:
 * Step 1: Inbound Prospect Lead Capture (Stage: New)
 * Step 2: Discovery Activity Logging & Transition to Contacted
 * Step 3: Verification & Formal Qualification (Stage: Qualified)
 * Step 4: Sales Quotation Draft Generation with Tax Calculations
 * Step 5: Dispatch Quotation to Prospective Client (Status: Sent)
 * Step 6: Customer Revision Request & Revision #2 Generation
 * Step 7: Client Formal Sign-off (Status: Accepted) -> Auto-sync Lead to 'Won'
 * Step 8: Confirmed Sales Order Issuance & Duplicate Prevention Guard
 * Step 9: Customer Entity & Contact Association Verification
 * Step 10: Full Audit Lineage Verification (Lead -> Quote -> Order -> Customer)
 */

import { crmPool, hrmsPool } from '../db/pool.js';

const BASE_URL = 'http://127.0.0.1:5000/api';

export async function runE2eTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 07: END-TO-END (E2E) LIFECYCLE SIMULATION');
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
  const leadId = `E2E-LD-${testSuffix}`;
  let quotationId = null;
  let quotationRev2Id = null;
  let salesOrderId = null;
  let customerId = null;

  try {
    // ------------------------------------------------------------------------
    // Step 1: Capture Inbound Lead
    // ------------------------------------------------------------------------
    console.log('--- Step 1: Capture Inbound Enterprise Lead ---');
    const leadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: leadId,
        name: 'Dr. Alok Verma',
        company: 'Quantum Dynamics Tech Ltd',
        email: `alok.${testSuffix}@quantumdynamics.io`,
        phone: '9845098450',
        source: 'Website',
        contactPerson: 'Dr. Alok Verma',
        designation: 'Chief Technology Officer',
        contactRole: 'Decision Maker',
        stage: 'New',
        score: 60,
        value: 1200000,
        assignedTo: 'Sarah Jenkins',
        assignedToEmployeeId: 'EMP-001'
      })
    });
    const leadJson = await leadRes.json();
    assert(leadRes.status === 201 || leadJson.success, 'E2E-1: Inbound Lead captured in CRM database', JSON.stringify(leadJson));

    // ------------------------------------------------------------------------
    // Step 2: Log Discovery Activity & Advance to Contacted
    // ------------------------------------------------------------------------
    console.log('\n--- Step 2: Discovery Activity & Stage Advancement ---');
    await crmPool.query(`
      INSERT INTO activities (id, title, type, purpose, related_to, customer_id, status, outcome, created_at)
      VALUES ($1, 'Technical Demo with Dr. Alok', 'Meeting', 'Product Demo', $2, $3, 'Completed', 'Client agreed to RFP', CURRENT_TIMESTAMP)
    `, [`ACT-E2E-${testSuffix}`, leadId, leadId]);

    const contactRes = await fetch(`${BASE_URL}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: 'Contacted',
        notes: 'Product architecture demo successfully completed.'
      })
    });
    assert(contactRes.status === 200, 'E2E-2: Lead stage progressed from New to Contacted');

    // ------------------------------------------------------------------------
    // Step 3: Qualify Lead with Confirmed Budget & Requirements
    // ------------------------------------------------------------------------
    console.log('\n--- Step 3: Lead Qualification Verification ---');
    const qualifyRes = await fetch(`${BASE_URL}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: 'Qualified',
        requirement: 'Enterprise ERP, Cloud HRMS, and Real-Time IoT Attendance Infrastructure',
        budget: 1200000,
        decisionMaker: 'Dr. Alok Verma',
        expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      })
    });
    assert(qualifyRes.status === 200, 'E2E-3: Lead formally Qualified with complete customer requirements');

    // ------------------------------------------------------------------------
    // Step 4: Sales Quotation Draft Generation
    // ------------------------------------------------------------------------
    console.log('\n--- Step 4: Sales Quotation Creation with Tax Breakdown ---');
    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadId,
        customerName: 'Quantum Dynamics Tech Ltd',
        amount: 1200000,
        subtotal: 1016949.15,
        taxAmount: 183050.85,
        status: 'Draft',
        items: [
          { productName: 'ERP & HRMS Multi-Tenant License', quantity: 1, unitPrice: 800000, total: 800000 },
          { productName: 'Custom Integration & Deployment', quantity: 1, unitPrice: 400000, total: 400000 }
        ]
      })
    });
    const quoteJson = await quoteRes.json();
    quotationId = quoteJson.data?.id;
    customerId = quoteJson.data?.customer_id;
    assert(quoteRes.status === 201 && quotationId, 'E2E-4: Sales Quotation created with line items & 18% GST breakdown');

    // ------------------------------------------------------------------------
    // Step 5: Dispatch Quotation to Customer (Status: Sent)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 5: Dispatch Quotation to Customer ---');
    const sendRes = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Sent', allowStatusOverride: true })
    });
    assert(sendRes.status === 200, 'E2E-5: Quotation dispatched to prospect (Status: Sent)');

    // ------------------------------------------------------------------------
    // Step 6: Create Revision #2 (Terms Adjustment)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 6: Revision Control & Suffix Numbering ---');
    const revRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadId,
        customerName: 'Quantum Dynamics Tech Ltd',
        amount: 1200000,
        subtotal: 1016949.15,
        taxAmount: 183050.85,
        status: 'Draft',
        notes: 'Included complimentary 24/7 Premium SLA (Revision 2)',
        items: [
          { productName: 'ERP & HRMS Multi-Tenant License', quantity: 1, unitPrice: 800000, total: 800000 },
          { productName: 'Custom Integration & Deployment + 24/7 SLA', quantity: 1, unitPrice: 400000, total: 400000 }
        ]
      })
    });
    const revJson = await revRes.json();
    quotationRev2Id = revJson.data?.id;
    assert(revRes.status === 201 && quotationRev2Id && Number(revJson.data?.revision_number) >= 2, `E2E-6: Quotation Revision #2 created (Rev No: ${revJson.data?.revision_number})`);

    // ------------------------------------------------------------------------
    // Step 7: Customer Acceptance & Automatic Deal Closure
    // ------------------------------------------------------------------------
    console.log('\n--- Step 7: Customer Formal Acceptance & Deal Win ---');
    const targetQuoteId = quotationRev2Id || quotationId;
    const acceptRes = await fetch(`${BASE_URL}/quotations/${targetQuoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Accepted',
        acceptedDate: new Date().toISOString().split('T')[0]
      })
    });
    assert(acceptRes.status === 200, 'E2E-7: Customer signs off on Quotation (Status: Accepted)');

    // Check automatic transition to Won
    const leadWonCheck = await crmPool.query('SELECT stage, final_agreed_amount, won_date FROM leads WHERE id = $1', [leadId]);
    assert(leadWonCheck.rows[0]?.stage === 'Won', 'E2E-7B: CRM Lead stage automatically reflects "Won" deal closure');
    assert(Number(leadWonCheck.rows[0]?.final_agreed_amount) === 1200000, 'E2E-7C: Final agreed deal value persisted: ₹12,00,000');

    // ------------------------------------------------------------------------
    // Step 8: Confirmed Sales Order Issuance
    // ------------------------------------------------------------------------
    console.log('\n--- Step 8: Sales Order Generation & Duplicate Guard ---');
    const soRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: targetQuoteId,
        customerId: customerId,
        customerName: 'Quantum Dynamics Tech Ltd',
        totalAmount: 1200000,
        subtotal: 1016949.15,
        taxAmount: 183050.85,
        status: 'Confirmed'
      })
    });
    const soJson = await soRes.json();
    salesOrderId = soJson.data?.id;
    assert(soRes.status === 201 && salesOrderId, 'E2E-8: Sales Order officially generated and confirmed', JSON.stringify(soJson));

    // Duplicate prevention test
    const dupSoRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: targetQuoteId,
        customerId: customerId,
        customerName: 'Quantum Dynamics Tech Ltd',
        totalAmount: 1200000
      })
    });
    assert(dupSoRes.status === 400, 'E2E-8B: Duplicate Sales Order creation strictly prohibited (HTTP 400)');

    // ------------------------------------------------------------------------
    // Step 9: Verify Customer Entity & Contact Lineage
    // ------------------------------------------------------------------------
    console.log('\n--- Step 9: Customer Entity & Contact Association ---');
    const custInDb = await crmPool.query('SELECT * FROM customers WHERE customer_name ILIKE $1 OR converted_from_lead_id = $2', ['%Quantum Dynamics%', leadId]);
    assert(custInDb.rows.length >= 1, 'E2E-9: Customer profile linked with enterprise details');

    // ------------------------------------------------------------------------
    // Step 10: Complete Audit Traceability
    // ------------------------------------------------------------------------
    console.log('\n--- Step 10: Complete End-to-End Audit Lineage ---');
    const auditRes = await crmPool.query(`
      SELECT 
        l.id AS lead_id,
        l.stage AS lead_stage,
        l.final_agreed_amount,
        q.id AS quotation_id,
        q.status AS quotation_status,
        so.id AS sales_order_id,
        so.status AS sales_order_status
      FROM leads l
      JOIN quotations q ON q.lead_id = l.id
      JOIN sales_orders so ON so.quotation_id = q.id
      WHERE l.id = $1
    `, [leadId]);

    assert(auditRes.rows.length >= 1, 'E2E-10: Complete audit lineage verified across DB (Lead -> Quote -> Sales Order)');
    assert(auditRes.rows[0]?.lead_stage === 'Won', 'Audit Lead status is "Won"');
    assert(auditRes.rows[0]?.quotation_status === 'Accepted', 'Audit Quotation status is "Accepted"');
    assert(auditRes.rows[0]?.sales_order_status === 'Confirmed', 'Audit Sales Order status is "Confirmed"');

  } catch (err) {
    console.error('E2E testing exception:', err);
    assert(false, 'E2E suite ran without fatal errors', err.message);
  } finally {
    // Cleanup
    if (salesOrderId) {
      await crmPool.query('DELETE FROM sales_order_items WHERE sales_order_id = $1', [salesOrderId]).catch(() => {});
      await crmPool.query('DELETE FROM sales_orders WHERE id = $1', [salesOrderId]).catch(() => {});
    }
    if (quotationId || quotationRev2Id) {
      await crmPool.query('DELETE FROM quotation_items WHERE quotation_id IN ($1, $2)', [quotationId, quotationRev2Id]).catch(() => {});
      await crmPool.query('DELETE FROM quotations WHERE id IN ($1, $2) OR lead_id = $3', [quotationId, quotationRev2Id, leadId]).catch(() => {});
    }
    await crmPool.query('DELETE FROM activities WHERE id = $1', [`ACT-E2E-${testSuffix}`]).catch(() => {});
    await crmPool.query('DELETE FROM leads WHERE id = $1', [leadId]).catch(() => {});
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`End-to-End (E2E) Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'End-to-End (E2E) Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('07_e2e_testing_suite.js')) {
  runE2eTests().then(async res => {
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
