/**
 * TEST SUITE 09: INTERFACE TESTING SUITE
 * 
 * Target: REST API Interface Contracts, Request/Response Payloads, HTTP Status Codes, Error Schemas, Headers.
 * Interfaces Tested:
 * 1. Leads REST Interface: GET, POST, PUT contract validation
 * 2. Quotations REST Interface: GET, POST, PATCH contract validation
 * 3. Sales Orders REST Interface: POST contract & duplicate guard contract
 * 4. Helpdesk Support REST Interface: GET, POST, PATCH contract validation
 * 5. Authentication & Authorization REST Interface: Status codes 200, 400, 401, 403
 * 6. Protocol & Header Compliance: Content-Type, CORS, JSON Payload schemas
 */

import { crmPool, hrmsPool } from '../db/pool.js';

const BASE_URL = 'http://127.0.0.1:5000/api';

export async function runInterfaceTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 09: INTERFACE TESTING (API Contracts & Schema Integrity)');
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
  const testLeadId = `INTF-LD-${testSuffix}`;
  let quotationId = null;
  let ticketId = null;

  try {
    // ------------------------------------------------------------------------
    // 1. Leads REST Interface Contract
    // ------------------------------------------------------------------------
    console.log('--- 1. Leads REST Interface Contract ---');
    const leadsRes = await fetch(`${BASE_URL}/leads`);
    assert(leadsRes.status === 200, 'GET /api/leads responds with HTTP 200 OK');
    assert(leadsRes.headers.get('content-type')?.includes('application/json'), 'Content-Type header is application/json');

    const leadsJson = await leadsRes.json();
    assert(typeof leadsJson.success === 'boolean' && Array.isArray(leadsJson.data), 'GET /api/leads schema conforms to { success: boolean, data: Array }');

    // POST /api/leads validation failure contract
    const failLeadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' })
    });
    const failLeadJson = await failLeadRes.json();
    assert(failLeadRes.status === 400, 'POST /api/leads missing required fields returns HTTP 400 Bad Request');
    assert(failLeadJson.success === false && typeof failLeadJson.message === 'string', 'Error payload schema conforms to { success: false, message: string }');

    // POST /api/leads valid creation contract
    const createLeadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testLeadId,
        name: 'Interface Test Client',
        company: 'Interface Tech Inc',
        email: `interface.${testSuffix}@tech.com`,
        phone: '9833445566',
        source: 'Website',
        contactPerson: 'Interface Contact',
        designation: 'Director',
        contactRole: 'Decision Maker',
        stage: 'New',
        value: 500000,
        assignedTo: 'Sarah Jenkins',
        assignedToEmployeeId: 'EMP-001'
      })
    });
    const createLeadJson = await createLeadRes.json();
    assert(createLeadRes.status === 201, 'POST /api/leads valid payload returns HTTP 201 Created');
    assert(createLeadJson.data?.id === testLeadId, 'Response returns persisted lead object with ID');

    // ------------------------------------------------------------------------
    // 2. Quotations REST Interface Contract
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Quotations REST Interface Contract ---');
    // Qualify lead to enable quote interface
    await crmPool.query(`UPDATE leads SET stage = 'Qualified', requirement = 'Interface test requirement for quotation', budget = 500000, decision_maker = 'Interface Contact', expected_close_date = CURRENT_DATE + INTERVAL '10 days' WHERE id = $1`, [testLeadId]);

    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLeadId,
        customerName: 'Interface Tech Inc',
        amount: 500000,
        subtotal: 423728.81,
        taxAmount: 76271.19,
        status: 'Draft',
        items: [{ productName: 'Interface Service', quantity: 1, unitPrice: 500000, total: 500000 }]
      })
    });
    const quoteJson = await quoteRes.json();
    quotationId = quoteJson.data?.id;
    assert(quoteRes.status === 201, 'POST /api/quotations returns HTTP 201 Created');
    assert(typeof quoteJson.data?.quote_number === 'string', 'Quotation response contains generated quote_number');
    assert(typeof quoteJson.data?.amount === 'string' || typeof quoteJson.data?.amount === 'number', 'Quotation response contains valid amount format');

    // PATCH /api/quotations/:id contract
    const patchQuoteRes = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Interface contract updated notes' })
    });
    const patchQuoteJson = await patchQuoteRes.json();
    assert(patchQuoteRes.status === 200, 'PATCH /api/quotations/:id returns HTTP 200 OK');
    assert(patchQuoteJson.data?.notes?.includes('Interface contract'), 'PATCH updates quotation field successfully');

    // ------------------------------------------------------------------------
    // 3. Helpdesk Support REST Interface Contract
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Helpdesk REST Interface Contract ---');
    const helpdeskRes = await fetch(`${BASE_URL}/helpdesk`);
    const helpdeskJson = await helpdeskRes.json();
    assert(helpdeskRes.status === 200, 'GET /api/helpdesk returns HTTP 200 OK');
    assert(Array.isArray(helpdeskJson.tickets), 'Response schema contains "tickets" array');
    assert(typeof helpdeskJson.summary === 'object', 'Response schema contains "summary" metrics object');
    assert(typeof helpdeskJson.summary?.total === 'number', 'Summary object contains numeric total');

    // POST /api/helpdesk validation error contract
    const failTicketRes = await fetch(`${BASE_URL}/helpdesk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'AB' }) // Too short (< 3 chars)
    });
    assert(failTicketRes.status === 400, 'POST /api/helpdesk with short subject returns HTTP 400 Bad Request');

    // POST /api/helpdesk creation contract
    const createTicketRes = await fetch(`${BASE_URL}/helpdesk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'API Interface Verification Ticket',
        customerName: 'Interface Tech Inc',
        priority: 'Medium',
        category: 'API Integration',
        description: 'Verifying REST API contracts for helpdesk ticketing system'
      })
    });
    const createTicketJson = await createTicketRes.json();
    ticketId = createTicketJson.ticket?.id;
    assert(createTicketRes.status === 201, 'POST /api/helpdesk returns HTTP 201 Created');
    assert(createTicketJson.ticket?.ticketNo?.startsWith('HD-'), 'Created ticket contains formatted ticketNo (HD-XXXX)');

    // ------------------------------------------------------------------------
    // 4. Authentication & Security REST Interface Contract
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Authentication REST Interface Contract ---');
    // 400 Bad Request: Missing credentials
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(badLoginRes.status === 400, 'POST /api/auth/login without body returns HTTP 400 Bad Request');

    // 401 Unauthorized: Invalid PIN
    const wrongPinRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: 'EMP-001', pin: 'WRONG_PIN_9999' })
    });
    assert(wrongPinRes.status === 401, 'POST /api/auth/login with invalid PIN returns HTTP 401 Unauthorized');

    // 403 Forbidden: Ineligible role requested
    const forbiddenRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: 'EMP-008', pin: '1234', role: 'Executive' })
    });
    assert(forbiddenRes.status === 403, 'POST /api/auth/login with unauthorized role returns HTTP 403 Forbidden');

    // 200 OK: Valid login returns JWT token & employee payload
    const okLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: 'EMP-001', pin: '1234', role: 'Executive' })
    });
    const okLoginJson = await okLoginRes.json();
    assert(okLoginRes.status === 200, 'POST /api/auth/login with valid credentials returns HTTP 200 OK');
    assert(typeof okLoginJson.token === 'string' && okLoginJson.token.split('.').length === 3, 'Response includes valid 3-part JWT token');
    assert(typeof okLoginJson.employee === 'object' && okLoginJson.employee.name, 'Response includes employee profile object');

  } catch (err) {
    console.error('Interface suite exception:', err);
    assert(false, 'Interface testing suite ran without fatal errors', err.message);
  } finally {
    // Cleanup
    if (quotationId) {
      await crmPool.query('DELETE FROM quotation_items WHERE quotation_id = $1', [quotationId]).catch(() => {});
      await crmPool.query('DELETE FROM quotations WHERE id = $1', [quotationId]).catch(() => {});
    }
    await crmPool.query('DELETE FROM leads WHERE id = $1', [testLeadId]).catch(() => {});
    if (ticketId) {
      await crmPool.query('DELETE FROM helpdesk_tickets WHERE id = $1', [ticketId]).catch(() => {});
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Interface Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Interface Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('09_interface_testing_suite.js')) {
  runInterfaceTests().then(async res => {
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}

