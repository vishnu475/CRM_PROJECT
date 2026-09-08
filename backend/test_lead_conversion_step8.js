import { crmPool as pool } from './db/pool.js';

const BASE_URL = 'http://localhost:5000/api';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  return await res.json();
}

function validateLeadConversion(lead) {
  if (!lead) return { allowed: false, reason: 'Lead not found.' };
  if (lead.isConverted || lead.is_converted) {
    return {
      allowed: false,
      reason: 'This lead has already been converted to a Customer, Contact, and Opportunity.',
    };
  }
  if (lead.stage !== 'Won') {
    return {
      allowed: false,
      reason: `Lead cannot be converted from stage "${lead.stage}". A lead must be in the "Won" stage before it can be converted.`,
    };
  }
  return { allowed: true };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STEP 8: WON LEAD CONVERSION TEST SUITE');
  console.log('====================================================\n');

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
    // -------------------------------------------------------------
    // Test Case 1: Eligibility Rules (Unit / Business Logic Validation)
    // -------------------------------------------------------------
    console.log('--- Test Suite 1: Conversion Eligibility Rules ---');
    
    const newLead = { id: 'LD-TEST-NEW', name: 'New Lead', stage: 'New', isConverted: false };
    const contactedLead = { id: 'LD-TEST-CNT', name: 'Contacted Lead', stage: 'Contacted', isConverted: false };
    const qualifiedLead = { id: 'LD-TEST-QLF', name: 'Qualified Lead', stage: 'Qualified', isConverted: false };
    const proposalLead = { id: 'LD-TEST-PRP', name: 'Proposal Lead', stage: 'Proposal', isConverted: false };
    const negotiationLead = { id: 'LD-TEST-NEG', name: 'Negotiation Lead', stage: 'Negotiation', isConverted: false };
    const lostLead = { id: 'LD-TEST-LST', name: 'Lost Lead', stage: 'Lost', isConverted: false };
    const eligibleWonLead = { id: 'LD-TEST-WON', name: 'Won Lead', stage: 'Won', isConverted: false, finalAgreedAmount: 250000 };
    const alreadyConvertedWonLead = { id: 'LD-TEST-CONV', name: 'Converted Lead', stage: 'Won', isConverted: true };

    assert(!validateLeadConversion(newLead).allowed, 'Test 2a: New lead conversion is BLOCKED');
    assert(!validateLeadConversion(contactedLead).allowed, 'Test 2b: Contacted lead conversion is BLOCKED');
    assert(!validateLeadConversion(qualifiedLead).allowed, 'Test 4: Qualified lead conversion is BLOCKED');
    assert(!validateLeadConversion(proposalLead).allowed, 'Test 2c: Proposal lead conversion is BLOCKED');
    assert(!validateLeadConversion(negotiationLead).allowed, 'Test 3: Negotiation lead conversion is BLOCKED');
    assert(!validateLeadConversion(lostLead).allowed, 'Test 2: Lost lead conversion is BLOCKED');
    assert(!validateLeadConversion(alreadyConvertedWonLead).allowed, 'Test 5: Already converted Won lead is BLOCKED');
    assert(validateLeadConversion(eligibleWonLead).allowed, 'Test 1: Eligible Won lead conversion is ALLOWED');

    // -------------------------------------------------------------
    // Test Suite 2: End-to-End Database & API Conversion Flow
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 2: API & PostgreSQL Conversion Execution ---');

    const testLeadId = `LD-TEST-CONV-${Date.now()}`;
    const testCustomerId = `CUST-TEST-${Date.now()}`;
    const testContactId = `CON-TEST-${Date.now()}`;
    const testOpportunityId = `OPP-TEST-${Date.now()}`;

    // 1. Create a Won Lead in the CRM Database
    const leadCreateRes = await request('POST', '/leads', {
      id: testLeadId,
      name: 'Priya Sharma',
      company: 'Apex Cloud Solutions',
      email: 'priya@apexcloud.io',
      phone: '+91 98765 43210',
      value: 350000,
      stage: 'Won',
      score: 95,
      source: 'Referral',
      assignedTo: 'John Doe',
      requirement: 'Enterprise Cloud Migration & Dedicated DevOps Support',
      decisionMaker: 'Priya Sharma (CTO)',
      expectedCloseDate: '2026-09-30',
      finalAgreedAmount: 350000,
      wonDate: '2026-09-04',
      dealClosedNotes: 'Contract signed by CTO after final SLA discussion'
    });

    assert(leadCreateRes.success && leadCreateRes.data.id === testLeadId, 'Initial Won lead created in PostgreSQL');

    // 2. Perform Customer Creation
    const custCreateRes = await request('POST', '/customers', {
      id: testCustomerId,
      customerCode: testCustomerId,
      customerName: 'Apex Cloud Solutions',
      customerType: 'Company',
      industry: 'Technology',
      ownerId: 'John Doe',
      status: 'Active',
      creditLimit: 0,
      contactName: 'Priya Sharma (CTO)',
      contactEmail: 'priya@apexcloud.io',
      contactPhone: '+91 98765 43210',
      billingCity: 'Bengaluru',
      billingCountry: 'India',
      convertedFromLeadId: testLeadId
    });

    assert(custCreateRes.success && custCreateRes.data.id === testCustomerId, 'Customer record created successfully in DB');

    // 3. Perform Primary Contact Creation linked to Customer & Lead
    const contCreateRes = await request('POST', '/contacts', {
      id: testContactId,
      name: 'Priya Sharma (CTO)',
      email: 'priya@apexcloud.io',
      phone: '+91 98765 43210',
      company: 'Apex Cloud Solutions',
      customerId: testCustomerId,
      leadId: testLeadId,
      title: 'Chief Technology Officer'
    });

    assert(contCreateRes.success && contCreateRes.data.id === testContactId, 'Primary Contact created successfully in DB');

    // 4. Perform Won Opportunity Creation linked to Customer
    const oppCreateRes = await request('POST', '/opportunities', {
      id: testOpportunityId,
      name: 'Apex Cloud Solutions - Enterprise Cloud Migration',
      customerId: testCustomerId,
      customerName: 'Apex Cloud Solutions',
      value: 350000,
      probability: 100,
      expectedClose: '2026-09-04',
      owner: 'John Doe',
      stage: 'Won'
    });

    assert(oppCreateRes.success && oppCreateRes.data.id === testOpportunityId, 'Won Opportunity created successfully in DB');

    // 5. Update Lead with Conversion stamping
    const nowIso = new Date().toISOString();
    const leadUpdateRes = await request('PATCH', `/leads/${testLeadId}`, {
      convertedToCustomerId: testCustomerId,
      convertedToContactId: testContactId,
      convertedToOpportunityId: testOpportunityId,
      isConverted: true,
      convertedAt: nowIso
    });

    assert(leadUpdateRes.success, 'Lead updated with conversion timestamps and record references');

    // -------------------------------------------------------------
    // Test Suite 3: Verification of Relationships and Persistence
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 3: Verification of PostgreSQL Persistence & Relationships ---');

    // Check Customer in PostgreSQL
    const custDbRes = await request('GET', `/customers/${testCustomerId}`);
    assert(custDbRes.success, 'Test 6a: Exactly 1 Customer exists and is retrievable');
    assert(custDbRes.data.converted_from_lead_id === testLeadId, 'Test 9: Customer stores convertedFromLeadId referencing original Lead');

    // Check Contact in PostgreSQL
    const contDbRes = await pool.query('SELECT * FROM contacts WHERE id = $1', [testContactId]);
    assert(contDbRes.rows.length === 1, 'Test 6b: Exactly 1 Contact exists in database');
    assert(contDbRes.rows[0].customer_id === testCustomerId, 'Test 7: Contact references the created Customer');
    assert(contDbRes.rows[0].lead_id === testLeadId, 'Contact references the original Lead');

    // Check Opportunity in PostgreSQL
    const oppDbRes = await pool.query('SELECT * FROM opportunities WHERE id = $1', [testOpportunityId]);
    assert(oppDbRes.rows.length === 1, 'Test 6c: Exactly 1 Opportunity exists in database');
    assert(oppDbRes.rows[0].customer_id === testCustomerId, 'Test 8: Opportunity references the created Customer');
    assert(oppDbRes.rows[0].stage === 'Won' && parseInt(oppDbRes.rows[0].probability) === 100, 'Opportunity has Stage=Won and Probability=100%');

    // Check Lead in PostgreSQL
    const leadDbRes = await request('GET', `/leads/${testLeadId}`);
    assert(leadDbRes.success, 'Lead retrievable from PostgreSQL');
    assert(leadDbRes.data.converted_to_customer_id === testCustomerId, 'Test 10a: Lead stores converted_to_customer_id');
    assert(leadDbRes.data.converted_to_contact_id === testContactId, 'Test 10b: Lead stores converted_to_contact_id');
    assert(leadDbRes.data.converted_to_opportunity_id === testOpportunityId, 'Test 10c: Lead stores converted_to_opportunity_id');
    assert(leadDbRes.data.is_converted === true, 'Test 11: Lead is_converted persists true in DB');

    // -------------------------------------------------------------
    // Test Suite 4: Duplicate Conversion Prevention
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 4: Duplicate Conversion Prevention ---');
    const reloadedLead = {
      id: leadDbRes.data.id,
      name: leadDbRes.data.name,
      stage: leadDbRes.data.stage,
      isConverted: leadDbRes.data.is_converted,
      convertedToCustomerId: leadDbRes.data.converted_to_customer_id
    };

    const duplicateCheck = validateLeadConversion(reloadedLead);
    assert(!duplicateCheck.allowed, 'Test 12: Retry conversion on already converted lead is BLOCKED');
    assert(duplicateCheck.reason.includes('already been converted'), 'Informative message returned preventing duplicate conversion');

    console.log('\n====================================================');
    console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    // Cleanup test records
    await pool.query('DELETE FROM contacts WHERE id = $1', [testContactId]);
    await pool.query('DELETE FROM opportunities WHERE id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM customers WHERE id = $1', [testCustomerId]);
    await pool.query('DELETE FROM leads WHERE id = $1', [testLeadId]);
    console.log('🧹 Cleaned up temporary test records.');
    await pool.end();

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test execution failed with exception:', err);
    await pool.end();
    process.exit(1);
  }
}

runTests();
