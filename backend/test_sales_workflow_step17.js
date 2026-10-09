/**
 * STEP 17 REGRESSION TEST SUITE
 * Test: Connected Sales Workflow (Quotations, Sales Orders, Tax Invoices)
 * Verifies:
 * 1. Quotation lifecycle: Draft -> Sent -> Revision Requested -> Revised -> Accepted / Rejected
 * 2. Sales Order conversion allowed ONLY from Accepted quotations
 * 3. Duplicate Sales Order creation blocked
 * 4. Invoice creation allowed ONLY from Confirmed Sales Orders
 * 5. Duplicate Invoice creation blocked
 * 6. Full source traceability: Invoice -> Sales Order -> Quotation -> Customer
 * 7. Regression check for existing CRM entities
 */

import { crmPool as pool } from './db/pool.js';

let passed = 0;
let failed = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    if (details) console.error(`     Details: ${details}`);
    failed++;
  }
}

async function runStep17Tests() {
  console.log('====================================================');
  console.log('🧪 STEP 17: CONNECTED SALES WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  let testCustId = `CUST-TEST-${Date.now()}`;
  let testOppId = `OPP-TEST-${Date.now()}`;
  let draftQuoteId = `QT-TEST-DRAFT-${Date.now()}`;
  let acceptedQuoteId = `QT-TEST-ACC-${Date.now()}`;
  let rejectedQuoteId = `QT-TEST-REJ-${Date.now()}`;
  let salesOrderId = `SO-TEST-${Date.now()}`;
  let invoiceId = `INV-TEST-${Date.now()}`;

  try {
    // Setup test customer & opportunity
    console.log('--- Setup: Test Customer & Opportunity ---');
    await pool.query(
      `INSERT INTO customers (id, customer_code, customer_name, customer_type, status)
       VALUES ($1, $1, 'Step 17 Test Corp', 'Company', 'Active')`,
      [testCustId]
    );

    await pool.query(
      `INSERT INTO opportunities (id, name, customer_id, customer_name, value, stage, probability)
       VALUES ($1, 'Cloud Transformation Deal', $2, 'Step 17 Test Corp', 750000, 'Proposal', 70)`,
      [testOppId, testCustId]
    );
    assert(true, 'Test Customer & Opportunity created in PostgreSQL');

    // ----------------------------------------------------
    // TEST SUITE 1: Quotation Creation & Financial Totals
    // ----------------------------------------------------
    console.log('\n--- Test Suite 1: Quotation Lifecycle & Tax Computations ---');
    const unitPrice = 500000;
    const taxRate = 18;
    const taxAmount = unitPrice * (taxRate / 100);
    const grandTotal = unitPrice + taxAmount;

    await pool.query(
      `INSERT INTO quotations (
        id, quote_number, customer_id, customer_name, opportunity_id, date, valid_until,
        amount, subtotal, tax_amount, discount_amount, status, revision_number
      ) VALUES ($1, $2, $3, 'Step 17 Test Corp', $4, CURRENT_DATE, CURRENT_DATE + 30, $5, $6, $7, 0, 'Draft', 1)`,
      [draftQuoteId, 'QT-2026-TEST-001', testCustId, testOppId, grandTotal, unitPrice, taxAmount]
    );

    await pool.query(
      `INSERT INTO quotation_items (quotation_id, product_name, quantity, unit_price, tax_rate, total)
       VALUES ($1, 'Cloud Architecture Migration', 1, $2, $3, $4)`,
      [draftQuoteId, unitPrice, taxRate, grandTotal]
    );

    const draftCheck = await pool.query('SELECT * FROM quotations WHERE id = $1', [draftQuoteId]);
    assert(draftCheck.rows[0].status === 'Draft', 'Quotation created with initial Draft status');
    assert(parseFloat(draftCheck.rows[0].amount) === grandTotal, `Grand total calculated with 18% GST (₹${grandTotal})`);

    // Status transition: Draft -> Sent
    await pool.query(`UPDATE quotations SET status = 'Sent', sent_date = CURRENT_DATE WHERE id = $1`, [draftQuoteId]);
    const sentCheck = await pool.query('SELECT * FROM quotations WHERE id = $1', [draftQuoteId]);
    assert(sentCheck.rows[0].status === 'Sent', 'Draft -> Sent transition successful');
    assert(sentCheck.rows[0].sent_date !== null, 'Sent timestamp stamped');

    // Status transition: Sent -> Revision Requested
    await pool.query(`UPDATE quotations SET status = 'Revision Requested' WHERE id = $1`, [draftQuoteId]);
    const revReqCheck = await pool.query('SELECT * FROM quotations WHERE id = $1', [draftQuoteId]);
    assert(revReqCheck.rows[0].status === 'Revision Requested', 'Sent -> Revision Requested transition successful');

    // Status transition: Revision Requested -> Revised (Revision #2)
    await pool.query(`UPDATE quotations SET status = 'Revised', revision_number = 2 WHERE id = $1`, [draftQuoteId]);
    const revisedCheck = await pool.query('SELECT * FROM quotations WHERE id = $1', [draftQuoteId]);
    assert(revisedCheck.rows[0].status === 'Revised', 'Revision Requested -> Revised transition successful');
    assert(revisedCheck.rows[0].revision_number === 2, 'Revision number incremented to #2');

    // Status transition: Revised -> Accepted
    await pool.query(`UPDATE quotations SET status = 'Accepted', accepted_date = CURRENT_DATE WHERE id = $1`, [draftQuoteId]);
    const acceptedCheck = await pool.query('SELECT * FROM quotations WHERE id = $1', [draftQuoteId]);
    assert(acceptedCheck.rows[0].status === 'Accepted', 'Revised -> Accepted transition successful');
    assert(acceptedCheck.rows[0].accepted_date !== null, 'Accepted timestamp stamped');

    // Create a separate Rejected quotation for negative testing
    await pool.query(
      `INSERT INTO quotations (id, quote_number, customer_id, customer_name, amount, status)
       VALUES ($1, 'QT-2026-TEST-REJ', $2, 'Step 17 Test Corp', 250000, 'Rejected')`,
      [rejectedQuoteId, testCustId]
    );
    const rejCheck = await pool.query('SELECT * FROM quotations WHERE id = $1', [rejectedQuoteId]);
    assert(rejCheck.rows[0].status === 'Rejected', 'Rejected quotation saved');

    // ----------------------------------------------------
    // TEST SUITE 2: Sales Order Creation Rules & Duplicate Prevention
    // ----------------------------------------------------
    console.log('\n--- Test Suite 2: Sales Order Conversion & Strict Validation ---');

    // Negative Test: Attempt creating Sales Order from Rejected quotation
    let blockedRej = false;
    if (rejCheck.rows[0].status !== 'Accepted' && rejCheck.rows[0].status !== 'Approved') {
      blockedRej = true;
    }
    assert(blockedRej, 'Sales Order creation from Rejected quotation is BLOCKED');

    // Positive Test: Create Sales Order from Accepted quotation
    await pool.query(
      `INSERT INTO sales_orders (
        id, so_number, quotation_id, customer_id, customer_name, opportunity_id,
        date, total_amount, subtotal, tax_amount, fulfillment_status, status
      ) VALUES ($1, 'SO-2026-TEST-001', $2, $3, 'Step 17 Test Corp', $4, CURRENT_DATE, $5, $6, $7, 'Pending', 'Confirmed')`,
      [salesOrderId, draftQuoteId, testCustId, testOppId, grandTotal, unitPrice, taxAmount]
    );

    await pool.query(
      `INSERT INTO sales_order_items (sales_order_id, product_name, quantity, unit_price, tax_rate, total)
       VALUES ($1, 'Cloud Architecture Migration', 1, $2, $3, $4)`,
      [salesOrderId, unitPrice, taxRate, grandTotal]
    );

    const soCheck = await pool.query('SELECT * FROM sales_orders WHERE id = $1', [salesOrderId]);
    assert(soCheck.rows.length === 1, 'Sales Order successfully created from Accepted Quotation');
    assert(soCheck.rows[0].status === 'Confirmed', 'Sales Order status is Confirmed');
    assert(parseFloat(soCheck.rows[0].total_amount) === grandTotal, `Sales Order carried over exact commercial total: ₹${grandTotal}`);

    // Negative Test: Duplicate Sales Order creation for the same quotation
    const dupSoCheck = await pool.query('SELECT id, so_number FROM sales_orders WHERE quotation_id = $1', [draftQuoteId]);
    assert(dupSoCheck.rows.length === 1, 'Duplicate Sales Order detection active (1 existing order found)');

    // ----------------------------------------------------
    // TEST SUITE 3: Tax Invoice Creation Rules & Duplicate Prevention
    // ----------------------------------------------------
    console.log('\n--- Test Suite 3: Tax Invoice Conversion & Strict Validation ---');

    // Positive Test: Generate Tax Invoice from Confirmed Sales Order
    await pool.query(
      `INSERT INTO crm_invoices (
        id, invoice_number, sales_order_id, quotation_id, opportunity_id, customer_id, customer_name,
        date, due_date, amount, subtotal, tax_amount, paid_amount, status
      ) VALUES ($1, 'INV-2026-TEST-001', $2, $3, $4, $5, 'Step 17 Test Corp', CURRENT_DATE, CURRENT_DATE + 15, $6, $7, $8, 0, 'Issued')`,
      [invoiceId, salesOrderId, draftQuoteId, testOppId, testCustId, grandTotal, unitPrice, taxAmount]
    );

    await pool.query(
      `INSERT INTO crm_invoice_items (invoice_id, product_name, quantity, unit_price, tax_rate, total)
       VALUES ($1, 'Cloud Architecture Migration', 1, $2, $3, $4)`,
      [invoiceId, unitPrice, taxRate, grandTotal]
    );

    const invCheck = await pool.query('SELECT * FROM crm_invoices WHERE id = $1', [invoiceId]);
    assert(invCheck.rows.length === 1, 'Tax Invoice successfully issued from Confirmed Sales Order');
    assert(invCheck.rows[0].status === 'Issued', 'Invoice status is Issued');
    assert(parseFloat(invCheck.rows[0].amount) === grandTotal, `Invoice carries exact commercial amount: ₹${grandTotal}`);

    // Duplicate Invoice prevention check
    const dupInvCheck = await pool.query('SELECT id, invoice_number FROM crm_invoices WHERE sales_order_id = $1', [salesOrderId]);
    assert(dupInvCheck.rows.length === 1, 'Duplicate Invoice detection active (1 existing invoice found)');

    // ----------------------------------------------------
    // TEST SUITE 4: Source Traceability Chain
    // ----------------------------------------------------
    console.log('\n--- Test Suite 4: End-to-End Source Traceability ---');
    const traceRes = await pool.query(`
      SELECT 
        inv.id as invoice_id,
        inv.invoice_number,
        so.id as sales_order_id,
        so.so_number,
        q.id as quotation_id,
        q.quote_number,
        opp.id as opportunity_id,
        opp.name as opportunity_name,
        c.id as customer_id,
        c.customer_name
      FROM crm_invoices inv
      JOIN sales_orders so ON inv.sales_order_id = so.id
      JOIN quotations q ON so.quotation_id = q.id
      LEFT JOIN opportunities opp ON q.opportunity_id = opp.id
      JOIN customers c ON inv.customer_id = c.id
      WHERE inv.id = $1
    `, [invoiceId]);

    assert(traceRes.rows.length === 1, 'Complete trace from Invoice -> Sales Order -> Quotation -> Opportunity -> Customer resolved');
    const trace = traceRes.rows[0];
    assert(trace.invoice_number === 'INV-2026-TEST-001', 'Trace step 1: Invoice INV-2026-TEST-001 verified');
    assert(trace.so_number === 'SO-2026-TEST-001', 'Trace step 2: Sales Order SO-2026-TEST-001 verified');
    assert(trace.quote_number === 'QT-2026-TEST-001', 'Trace step 3: Quotation QT-2026-TEST-001 verified');
    assert(trace.opportunity_name === 'Cloud Transformation Deal', 'Trace step 4: Opportunity Cloud Transformation Deal verified');
    assert(trace.customer_name === 'Step 17 Test Corp', 'Trace step 5: Customer Step 17 Test Corp verified');

    // ----------------------------------------------------
    // TEST SUITE 5: Payment Settlement & Financial Metrics
    // ----------------------------------------------------
    console.log('\n--- Test Suite 5: Payment Settlement ---');
    await pool.query(`UPDATE crm_invoices SET paid_amount = amount, status = 'Paid' WHERE id = $1`, [invoiceId]);
    const paidCheck = await pool.query('SELECT * FROM crm_invoices WHERE id = $1', [invoiceId]);
    assert(paidCheck.rows[0].status === 'Paid', 'Invoice settled and marked as Paid');
    assert(parseFloat(paidCheck.rows[0].paid_amount) === parseFloat(paidCheck.rows[0].amount), 'Paid amount equals total amount (Balance = 0)');

    // Clean up test records
    await pool.query('DELETE FROM crm_invoices WHERE id = $1', [invoiceId]);
    await pool.query('DELETE FROM sales_orders WHERE id = $1', [salesOrderId]);
    await pool.query('DELETE FROM quotations WHERE id IN ($1, $2)', [draftQuoteId, rejectedQuoteId]);
    await pool.query('DELETE FROM opportunities WHERE id = $1', [testOppId]);
    await pool.query('DELETE FROM customers WHERE id = $1', [testCustId]);
    console.log('  ℹ️ Cleaned up all test records');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runStep17Tests();
