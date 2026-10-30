import { crmPool as pool } from './db/pool.js';

const BASE_URL = 'http://localhost:5000/api';

async function runIntegratedWorkflowTests() {
  console.log('========================================================================');
  console.log('🧪 INTEGRATED CRM LEAD QUALIFICATION & SALES QUOTATION WORKFLOW TEST SUITE');
  console.log('========================================================================\n');

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

  const testId = `TEST-${Date.now()}`;
  const leadNewId = `LD-NEW-${testId}`;
  const leadContactedId = `LD-CON-${testId}`;
  const leadQualifiedId = `LD-QUAL-${testId}`;
  const leadQualified2Id = `LD-QUAL2-${testId}`;
  const leadProposalId = `LD-PROP-${testId}`;

  try {
    // --------------------------------------------------------------------
    // SETUP: Seed test leads in CRM database
    // --------------------------------------------------------------------
    console.log('--- Step 0: Setup Seed Leads ---');
    await pool.query(`
      INSERT INTO leads (id, name, company, email, phone, stage, score, value, budget, requirement, decision_maker, expected_close_date, created_at, updated_at)
      VALUES 
        ($1, 'Alice New', 'New Innovations Inc', 'alice@newinnovations.com', '9876543210', 'New', 30, 200000, 200000, 'Cloud Evaluation', 'Alice New', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ($2, 'Bob Contacted', 'Contacted Logistics', 'bob@contactedlogistics.com', '9876543211', 'Contacted', 45, 350000, 350000, 'ERP Integration', 'Bob Contacted', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ($3, 'Carol Qualified', 'Carol Enterprises Ltd', 'carol@carolent.com', '9876543212', 'Qualified', 85, 800000, 800000, 'Enterprise ERP & HRMS Suite', 'Carol Decision Maker', (CURRENT_DATE + INTERVAL '30 days')::text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ($4, 'Dave DealMaker', 'Dave Solutions Group', 'dave@davesolutions.com', '9876543213', 'Qualified', 90, 1200000, 1200000, 'Custom CRM & Supply Chain', 'Dave Executive', (CURRENT_DATE + INTERVAL '45 days')::text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ($5, 'Legacy Paul', 'Legacy Proposal Corp', 'paul@legacycorp.com', '9876543214', 'Proposal', 75, 500000, 500000, 'Legacy migration test', 'Paul Legacy', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [leadNewId, leadContactedId, leadQualifiedId, leadQualified2Id, leadProposalId]);
    console.log('  ✅ Seed leads created successfully in PostgreSQL CRM database.\n');

    // --------------------------------------------------------------------
    // TEST 1: Qualified Lead Eligibility Enforcement
    // --------------------------------------------------------------------
    console.log('--- Test 1: Lead Stage Eligibility for Quotation Creation ---');
    
    // 1A. Try creating quotation for "New" lead -> Should be blocked (400)
    const newLeadQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadNewId,
        amount: 200000,
        items: [{ productName: 'Initial Trial', quantity: 1, unitPrice: 200000, total: 200000 }]
      })
    });
    const newLeadQuoteData = await newLeadQuoteRes.json();
    assert(newLeadQuoteRes.status === 400, 'Creating quotation for "New" lead is rejected (400)');
    assert(newLeadQuoteData.message.includes('Qualified'), `Helpful error returned: "${newLeadQuoteData.message}"`);

    // 1B. Try creating quotation for "Contacted" lead -> Should be blocked (400)
    const contactedQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadContactedId,
        amount: 350000,
        items: [{ productName: 'Initial Consultation', quantity: 1, unitPrice: 350000, total: 350000 }]
      })
    });
    const contactedQuoteData = await contactedQuoteRes.json();
    assert(contactedQuoteRes.status === 400, 'Creating quotation for "Contacted" lead is rejected (400)');

    // 1C. Try creating quotation with invalid lead ID -> Should be 404
    const invalidLeadQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: 'LD-NON-EXISTENT-99999',
        amount: 100000,
        items: [{ productName: 'Ghost Service', quantity: 1, unitPrice: 100000, total: 100000 }]
      })
    });
    assert(invalidLeadQuoteRes.status === 404, 'Invalid leadId returns 404 Not Found');

    // 1D. Create quotation for "Qualified" lead -> Should succeed (201)
    const qualQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadQualifiedId,
        customerName: 'Carol Enterprises Ltd',
        amount: 800000,
        subtotal: 677966.10,
        taxAmount: 122033.90,
        status: 'Draft',
        items: [
          { productName: 'ERP Enterprise License', quantity: 1, unitPrice: 677966.10, taxRate: 18, total: 800000 }
        ]
      })
    });
    const qualQuoteData = await qualQuoteRes.json();
    assert(qualQuoteRes.status === 201 && qualQuoteData.success, 'Quotation successfully created for Qualified lead');
    const quote1 = qualQuoteData.data;
    assert(quote1.lead_id === leadQualifiedId, `Quotation strictly linked via stable lead_id: ${quote1.lead_id}`);
    assert(quote1.status === 'Draft', 'Quotation starts in Draft status');
    assert(quote1.revision_number === 1, `Initial revision number is 1 (got ${quote1.revision_number})`);

    // Verify lead remains Qualified
    const leadAfterDraft = await pool.query('SELECT stage, converted_to_customer_id FROM leads WHERE id = $1', [leadQualifiedId]);
    assert(leadAfterDraft.rows[0].stage === 'Qualified', 'CRM Lead remains Qualified during Draft quotation creation');
    assert(leadAfterDraft.rows[0].converted_to_customer_id !== null, 'Customer auto-associated to lead without duplicate records');

    // --------------------------------------------------------------------
    // TEST 2: Quotation Dispatch and Open States
    // --------------------------------------------------------------------
    console.log('\n--- Test 2: Quotation Send and Open State Invariant ---');
    const sendQuoteRes = await fetch(`${BASE_URL}/quotations/${quote1.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: 'carol@carolent.com' })
    });
    const sendQuoteData = await sendQuoteRes.json();
    assert(sendQuoteRes.status === 200 && sendQuoteData.success, 'Quotation dispatched via dedicated send endpoint');
    assert(sendQuoteData.data.status === 'Sent', 'Quotation status updated to "Sent"');
    assert(sendQuoteData.data.sent_date !== null, `sent_date recorded: ${sendQuoteData.data.sent_date}`);

    // Verify lead STILL remains Qualified (not prematurely Won or Lost)
    const leadAfterSend = await pool.query('SELECT stage FROM leads WHERE id = $1', [leadQualifiedId]);
    assert(leadAfterSend.rows[0].stage === 'Qualified', 'Lead remains Qualified while quotation is Sent to customer');

    // --------------------------------------------------------------------
    // TEST 3: Revision Requested & New Revision Creation
    // --------------------------------------------------------------------
    console.log('\n--- Test 3: Customer Requests Revision & New Quotation Revision ---');
    
    // Customer requests discount / revision
    const reqRevRes = await fetch(`${BASE_URL}/quotations/${quote1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Revision Requested', notes: 'Client requested 10% volume discount.' })
    });
    const reqRevData = await reqRevRes.json();
    assert(reqRevRes.status === 200 && reqRevData.data.status === 'Revision Requested', 'Quotation status updated to "Revision Requested"');

    // Create Revision 2 for the same lead
    const rev2Res = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadQualifiedId,
        quoteNumber: quote1.quote_number,
        customerId: quote1.customer_id,
        customerName: quote1.customer_name,
        revisionGroupId: quote1.revision_group_id,
        amount: 720000,
        subtotal: 610169.49,
        discountAmount: 80000,
        taxAmount: 109830.51,
        status: 'Draft',
        notes: 'Revised with 10% volume discount',
        items: [
          { productName: 'ERP Enterprise License (Discounted)', quantity: 1, unitPrice: 610169.49, taxRate: 18, total: 720000 }
        ]
      })
    });
    const rev2Data = await rev2Res.json();
    assert(rev2Res.status === 201 && rev2Data.success, 'Quotation Revision 2 created successfully');
    const quote2 = rev2Data.data;
    assert(quote2.revision_number === 2, `Revision number auto-incremented to 2 (got ${quote2.revision_number})`);
    assert(quote2.lead_id === leadQualifiedId, 'Revision 2 retains stable lead_id');

    // Send Revision 2
    const sendRev2Res = await fetch(`${BASE_URL}/quotations/${quote2.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: 'carol@carolent.com' })
    });
    const sendRev2Data = await sendRev2Res.json();
    assert(sendRev2Res.status === 200, 'Revision 2 dispatched to customer');

    // Verify Revision 1 was automatically marked as "Revised"
    const oldQuoteCheck = await pool.query('SELECT status FROM quotations WHERE id = $1', [quote1.id]);
    assert(oldQuoteCheck.rows[0].status === 'Revised', 'Previous version v1 automatically marked as "Revised" in PostgreSQL');

    // --------------------------------------------------------------------
    // TEST 4: Non-Definitive Quotation Rejection vs. Definitive Deal Loss
    // --------------------------------------------------------------------
    console.log('\n--- Test 4: Quotation Rejection without Closing Deal vs. Definitive Loss ---');

    // 4A. Non-definitive Rejection: Customer declines v2 terms, but negotiations are ongoing
    const rejectV2Res = await fetch(`${BASE_URL}/quotations/${quote2.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Rejected',
        isDefinitiveLoss: false,
        notes: 'Customer rejected payment terms of 30 days, requested 60 days.'
      })
    });
    const rejectV2Data = await rejectV2Res.json();
    assert(rejectV2Res.status === 200 && rejectV2Data.data.status === 'Rejected', 'Quotation marked as Rejected');

    // CRITICAL RULE CHECK: The linked CRM lead MUST REMAIN QUALIFIED!
    const leadAfterNonDefReject = await pool.query('SELECT stage FROM leads WHERE id = $1', [leadQualifiedId]);
    assert(
      leadAfterNonDefReject.rows[0].stage === 'Qualified',
      'CRITICAL: Non-definitive quotation rejection keeps CRM lead in "Qualified" stage (NOT prematurely Lost)'
    );

    // 4B. Definitive Loss without reason: MUST BE BLOCKED
    const invalidLostRes = await fetch(`${BASE_URL}/quotations/${quote2.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Rejected',
        isDefinitiveLoss: true,
        lostReason: '',
        lostNotes: ''
      })
    });
    assert(invalidLostRes.status === 400, 'Definitive loss without Lost Reason is rejected (400)');

    // 4C. Definitive Loss with valid reason & notes: Updates lead to "Lost"
    const defLostRes = await fetch(`${BASE_URL}/quotations/${quote2.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Rejected',
        isDefinitiveLoss: true,
        lostReason: 'Customer chose competitor',
        lostReasonDetails: 'Selected SAP due to existing global contract',
        lostNotes: 'Carol Enterprise opted for SAP enterprise agreement.'
      })
    });
    const defLostData = await defLostRes.json();
    assert(defLostRes.status === 200, 'Definitive loss successfully accepted with valid reason & notes');

    // Verify lead transitioned to Lost with details
    const leadAfterDefLost = await pool.query('SELECT stage, lost_reason, lost_notes, lost_date FROM leads WHERE id = $1', [leadQualifiedId]);
    assert(leadAfterDefLost.rows[0].stage === 'Lost', 'CRM Lead transitioned to "Lost" after definitive loss');
    assert(leadAfterDefLost.rows[0].lost_reason === 'Customer chose competitor', `Lost reason recorded: "${leadAfterDefLost.rows[0].lost_reason}"`);
    assert(leadAfterDefLost.rows[0].lost_date !== null, 'Lost date stamped in database');

    // --------------------------------------------------------------------
    // TEST 5: Acceptance Synchronizes CRM Lead to Won & Permits Sales Order
    // --------------------------------------------------------------------
    console.log('\n--- Test 5: Acceptance Synchronizes Lead to "Won" & Enables Sales Order ---');

    // 5A. Create Quotation for Lead 2 (Dave DealMaker)
    const quote3Res = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadQualified2Id,
        customerName: 'Dave Solutions Group',
        amount: 1200000,
        subtotal: 1016949.15,
        taxAmount: 183050.85,
        status: 'Draft',
        items: [
          { productName: 'Custom CRM Enterprise', quantity: 1, unitPrice: 1016949.15, taxRate: 18, total: 1200000 }
        ]
      })
    });
    const quote3Data = await quote3Res.json();
    const quote3 = quote3Data.data;

    // Send quote 3
    await fetch(`${BASE_URL}/quotations/${quote3.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: 'dave@davesolutions.com' })
    });

    // 5B. Customer Accepts Quotation
    const acceptRes = await fetch(`${BASE_URL}/quotations/${quote3.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Accepted',
        acceptedDate: new Date().toISOString().split('T')[0]
      })
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptData.data.status === 'Accepted', 'Quotation marked as "Accepted"');

    // CRITICAL: Linked CRM Lead MUST automatically become "Won" with agreed amount
    const leadWonCheck = await pool.query('SELECT stage, final_agreed_amount, won_date FROM leads WHERE id = $1', [leadQualified2Id]);
    assert(leadWonCheck.rows[0].stage === 'Won', 'CRITICAL: Linked CRM Lead automatically transitioned to "Won"');
    assert(Number(leadWonCheck.rows[0].final_agreed_amount) === 1200000, `final_agreed_amount synced: ₹${leadWonCheck.rows[0].final_agreed_amount}`);
    assert(leadWonCheck.rows[0].won_date !== null, `won_date stamped: ${leadWonCheck.rows[0].won_date}`);

    // --------------------------------------------------------------------
    // TEST 6: Sales Order Conversion & Strict Duplicate Prevention
    // --------------------------------------------------------------------
    console.log('\n--- Test 6: Sales Order Conversion and Duplicate Prevention ---');

    // 6A. Try converting an unaccepted/draft quotation (quote2 is Rejected)
    const rejectSoRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: quote2.id,
        customerId: quote2.customer_id,
        customerName: quote2.customer_name,
        totalAmount: 720000
      })
    });
    assert(rejectSoRes.status === 400, 'Sales Order creation from non-accepted quotation is strictly rejected (400)');

    // 6B. Convert Accepted quote3 to Sales Order -> Should succeed
    const createSoRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: quote3.id,
        customerId: quote3.customer_id,
        customerName: quote3.customer_name,
        totalAmount: 1200000,
        subtotal: 1016949.15,
        taxAmount: 183050.85
      })
    });
    const createSoData = await createSoRes.json();
    assert(createSoRes.status === 201 && createSoData.success, 'Sales Order successfully created from Accepted quotation');
    const createdSo = createSoData.data;
    assert(createdSo.quotation_id === quote3.id, `Sales Order linked to quotation ${quote3.id}`);

    // 6C. Try converting the SAME quotation AGAIN -> MUST BE BLOCKED (duplicate prevention)
    const dupSoRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: quote3.id,
        customerId: quote3.customer_id,
        customerName: quote3.customer_name,
        totalAmount: 1200000
      })
    });
    const dupSoData = await dupSoRes.json();
    assert(dupSoRes.status === 400, 'Duplicate Sales Order creation for the same quotation is blocked (400)');
    assert(dupSoData.message.includes('already exists'), `Duplicate error message returned: "${dupSoData.message}"`);

    // --------------------------------------------------------------------
    // TEST 7: Legacy Proposal/Negotiation Record Accessibility
    // --------------------------------------------------------------------
    console.log('\n--- Test 7: Legacy Proposal & Negotiation Compatibility ---');
    const legacyLeadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [leadProposalId]);
    assert(legacyLeadRes.rows[0].stage === 'Proposal', 'Legacy Proposal record preserved intact');

    // Create quote for legacy Proposal lead
    const legacyQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadProposalId,
        customerName: 'Legacy Proposal Corp',
        amount: 500000,
        status: 'Draft',
        items: [{ productName: 'Legacy Migration Package', quantity: 1, unitPrice: 500000, total: 500000 }]
      })
    });
    assert(legacyQuoteRes.status === 201, 'Legacy Proposal lead is permitted to create quotations in Sales module');

    // --------------------------------------------------------------------
    // TEST 8: Verify Lateral Join Returns Linked Quotation Metadata on /api/leads
    // --------------------------------------------------------------------
    console.log('\n--- Test 8: Lead Listing Includes Latest Quotation Metadata ---');
    const leadsListRes = await fetch(`${BASE_URL}/leads?search=Dave`);
    const leadsListData = await leadsListRes.json();
    assert(leadsListData.success && leadsListData.data.length > 0, 'Fetched lead with search=Dave');
    const daveLead = leadsListData.data.find(l => l.id === leadQualified2Id);
    assert(daveLead !== undefined, 'Dave Lead retrieved from /api/leads');
    assert(daveLead.latest_quotation_id === quote3.id, `latest_quotation_id populated: ${daveLead.latest_quotation_id}`);
    assert(daveLead.latest_quotation_status === 'Accepted', `latest_quotation_status: ${daveLead.latest_quotation_status}`);
    assert(daveLead.linked_sales_order_id === createdSo.id, `linked_sales_order_id populated: ${daveLead.linked_sales_order_id}`);

    // --------------------------------------------------------------------
    // TEARDOWN: Clean up test records
    // --------------------------------------------------------------------
    console.log('\n--- Cleanup: Removing Test Records ---');
    if (createdSo?.id) {
      await pool.query('DELETE FROM sales_order_items WHERE sales_order_id = $1', [createdSo.id]);
      await pool.query('DELETE FROM sales_orders WHERE id = $1', [createdSo.id]);
    }
    const testQuotes = await pool.query('SELECT id, customer_id FROM quotations WHERE lead_id IN ($1, $2, $3, $4, $5)', [leadNewId, leadContactedId, leadQualifiedId, leadQualified2Id, leadProposalId]);
    for (const q of testQuotes.rows) {
      await pool.query('DELETE FROM quotation_items WHERE quotation_id = $1', [q.id]);
      await pool.query('DELETE FROM quotations WHERE id = $1', [q.id]);
    }
    await pool.query('DELETE FROM contacts WHERE lead_id IN ($1, $2, $3, $4, $5)', [leadNewId, leadContactedId, leadQualifiedId, leadQualified2Id, leadProposalId]);
    await pool.query('DELETE FROM customers WHERE converted_from_lead_id IN ($1, $2, $3, $4, $5)', [leadNewId, leadContactedId, leadQualifiedId, leadQualified2Id, leadProposalId]);
    await pool.query('DELETE FROM leads WHERE id IN ($1, $2, $3, $4, $5)', [leadNewId, leadContactedId, leadQualifiedId, leadQualified2Id, leadProposalId]);
    console.log('  ✅ Teardown complete. Test records cleanly removed.');

  } catch (err) {
    console.error('❌ Exception during workflow test execution:', err);
    failed++;
  } finally {
    console.log('\n========================================================================');
    console.log(`📊 FINAL SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runIntegratedWorkflowTests();

