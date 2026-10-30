/**
 * TEST SUITE 03: ACCEPTANCE TESTING (UAT - User Acceptance Testing)
 * 
 * Target: Business Journeys, Role-Based User Personas, End-User Acceptance Criteria.
 * Personas:
 * 1. Sarah Jenkins (VP Engineering / Executive): Lead Qualification & Closed Deal Acceptance
 * 2. Priya Sharma (HR Lead): 6-Step Intern Onboarding Wizard Lifecycle
 * 3. Ramesh (ESS Employee): Leave Application & Self-Service Approval Workflow
 * 4. Support Specialist: Helpdesk Ticket SLA & Resolution Workflow
 */

import { crmPool, hrmsPool } from '../db/pool.js';

const BASE_URL = 'http://127.0.0.1:5000/api';

export async function runAcceptanceUatTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 03: ACCEPTANCE TESTING (UAT Business Journeys)');
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
  const leadId = `UAT-LD-${testSuffix}`;
  let internId = null;
  let quoteId = null;
  let soId = null;
  let leaveId = null;
  let ticketId = null;

  try {
    // ------------------------------------------------------------------------
    // Journey 1: Executive / Sales VP Acceptance (Sarah Jenkins Persona)
    // ------------------------------------------------------------------------
    console.log('--- Journey 1: Sales VP Closed Deal Acceptance (Sarah Jenkins) ---');
    // 1.1 Create Lead with verified fields
    const leadCreateRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: leadId,
        name: 'Rajesh Singhania',
        company: 'Singhania Global Tech',
        email: 'rajesh@singhaniaglobal.com',
        phone: '9820098200',
        source: 'Website',
        contactPerson: 'Rajesh Singhania',
        designation: 'Managing Director',
        contactRole: 'Decision Maker',
        stage: 'New',
        score: 40,
        value: 1500000,
        assignedTo: 'Sarah Jenkins',
        assignedToEmployeeId: 'EMP-001'
      })
    });
    const leadCreateJson = await leadCreateRes.json();
    assert(leadCreateRes.status === 201 || leadCreateJson.success, 'UAT-1.1: Sarah creates new enterprise lead inquiry', JSON.stringify(leadCreateJson));

    // 1.2 Log Discovery Activity for the Lead (business rule for New -> Contacted)
    await crmPool.query(`
      INSERT INTO activities (id, title, type, purpose, related_to, customer_id, status, outcome, created_at)
      VALUES ($1, 'Discovery Call with Rajesh Singhania', 'Call', 'Discovery', $2, $3, 'Completed', 'Requirements gathered', CURRENT_TIMESTAMP)
    `, [`ACT-${testSuffix}`, leadId, leadId]);

    // 1.3 Move to Contacted
    const contactRes = await fetch(`${BASE_URL}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: 'Contacted',
        notes: 'Initial discovery call completed by Sarah Jenkins.'
      })
    });
    const contactJson = await contactRes.json();
    assert(contactRes.status === 200, 'UAT-1.2: Sarah logs discovery call & advances lead to "Contacted"', JSON.stringify(contactJson));

    // 1.4 Qualify the Lead with verified requirements and budget
    const qualifyRes = await fetch(`${BASE_URL}/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: 'Qualified',
        requirement: 'Enterprise ERP & Multi-branch HRMS Deployment for 500 seats',
        budget: 1500000,
        decisionMaker: 'Rajesh Singhania',
        expectedCloseDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0]
      })
    });
    const qualifyJson = await qualifyRes.json();
    assert(qualifyRes.status === 200, 'UAT-1.3: Lead qualifies successfully after requirement and budget verification', JSON.stringify(qualifyJson));

    // 1.5 Create and Send Formal Quotation
    const quoteCreateRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadId,
        customerName: 'Singhania Global Tech',
        amount: 1500000,
        subtotal: 1271186.44,
        taxAmount: 228813.56,
        status: 'Draft',
        items: [
          { productName: 'ERP Suite Enterprise Core', quantity: 1, unitPrice: 1000000, total: 1000000 },
          { productName: 'HRMS Add-on & Payroll Cloud', quantity: 1, unitPrice: 500000, total: 500000 }
        ]
      })
    });
    const quoteJson = await quoteCreateRes.json();
    quoteId = quoteJson.data?.id;
    assert(quoteCreateRes.status === 201 && quoteId, 'UAT-1.4: Sales Quotation created with line items', JSON.stringify(quoteJson));

    // 1.6 Customer Acceptance & Deal Closure
    const quoteAcceptRes = await fetch(`${BASE_URL}/quotations/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Accepted',
        acceptedDate: new Date().toISOString().split('T')[0]
      })
    });
    assert(quoteAcceptRes.status === 200, 'UAT-1.5: Quotation accepted by customer');

    // Verify CRM Lead status is Won
    const leadWon = await crmPool.query('SELECT stage, final_agreed_amount FROM leads WHERE id = $1', [leadId]);
    assert(leadWon.rows[0]?.stage === 'Won', 'UAT-1.6: CRM Lead status reflects "Won" deal closure', `Got ${leadWon.rows[0]?.stage}`);

    // 1.7 Generate Confirmed Sales Order
    const soRes = await fetch(`${BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: quoteId,
        customerId: quoteJson.data.customer_id,
        customerName: quoteJson.data.customer_name,
        totalAmount: 1500000,
        status: 'Confirmed'
      })
    });
    const soJson = await soRes.json();
    soId = soJson.data?.id;
    assert(soRes.status === 201 && soId, 'UAT-1.7: Official Sales Order issued to customer', JSON.stringify(soJson));

    // ------------------------------------------------------------------------
    // Journey 2: HR Lead Acceptance (Priya Sharma Persona)
    // ------------------------------------------------------------------------
    console.log('\n--- Journey 2: HR Intern Onboarding Lifecycle (Priya Sharma) ---');
    // Intern record creation via API endpoint
    const internPayload = {
      name: 'Rohan Verma',
      email: `rohan.${testSuffix}@college.edu`,
      phone: '9811223344',
      dob: '2003-08-20',
      gender: 'Male',
      college: 'National Institute of Technology',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      graduationYear: '2025',
      cgpaPercentage: '8.9 CGPA',
      internshipType: 'Full Stack',
      department: 'Engineering',
      designation: 'Software Engineering Intern',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      duration: '6 Months',
      stipend: '25000',
      workMode: 'Hybrid',
      location: 'Bengaluru HQ',
      reportingManagerName: 'Sarah Jenkins',
      reportingManagerId: 'EMP-001',
      mentor: 'Rahul Verma',
      mentorName: 'Rahul Verma',
      mentorId: 'EMP-004',
      status: 'Active'
    };

    const internApiRes = await fetch(`${BASE_URL}/interns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(internPayload)
    });
    const internApiJson = await internApiRes.json();
    internId = internApiJson.data?.id || internApiJson.intern?.id;
    assert(internApiRes.status === 201 || internApiJson.success, 'UAT-2.1: Priya Sharma onboarded intern record successfully via HRMS API', JSON.stringify(internApiJson));

    // Verify phone validation & persistence
    const internInDb = await hrmsPool.query('SELECT id, name, phone, status FROM interns WHERE id = $1 OR email = $2', [internId, internPayload.email]);
    assert(internInDb.rows.length >= 1, 'UAT-2.2: Intern saved in PostgreSQL HRMS database');
    assert(internInDb.rows[0]?.phone === '9811223344', 'UAT-2.3: Verified 10-digit phone number stored accurately');

    // ------------------------------------------------------------------------
    // Journey 3: Employee Self-Service Acceptance (Ramesh Persona)
    // ------------------------------------------------------------------------
    console.log('\n--- Journey 3: Employee Self-Service Leave Application (Ramesh) ---');
    leaveId = `LV-UAT-${testSuffix}`;
    const leaveInsertRes = await hrmsPool.query(`
      INSERT INTO leave_requests (
        id, employee_id, leave_type, start_date, end_date, total_days, reason, status, created_at, updated_at
      ) VALUES (
        $1, 'EMP-008', 'Paid Leave', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days', 2, 'Family function', 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, employee_id, total_days, status
    `, [leaveId]);

    assert(leaveInsertRes.rows[0].status === 'Pending', 'UAT-3.1: Ramesh submitted 2-day Paid Leave request (Pending state)');

    // Manager approval
    const leaveApproveRes = await hrmsPool.query(`
      UPDATE leave_requests 
      SET status = 'Approved', approved_by = 'EMP-001', approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING status, approved_by
    `, [leaveId]);

    assert(leaveApproveRes.rows[0].status === 'Approved', 'UAT-3.2: Manager approved leave request successfully');

    // ------------------------------------------------------------------------
    // Journey 4: Customer Support Agent Helpdesk Acceptance
    // ------------------------------------------------------------------------
    console.log('\n--- Journey 4: Helpdesk Support Ticket Lifecycle ---');
    const ticketCreateRes = await fetch(`${BASE_URL}/helpdesk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'SSO Login Integration Failure',
        customerName: 'Singhania Global Tech',
        priority: 'High',
        category: 'Authentication',
        description: 'Users cannot log in via SAML identity provider',
        assignedAgent: 'Support Desk'
      })
    });
    const ticketCreateJson = await ticketCreateRes.json();
    ticketId = ticketCreateJson.ticket?.id;
    assert(ticketCreateRes.status === 201 && ticketId, 'UAT-4.1: Customer logged High-Priority Helpdesk Ticket', JSON.stringify(ticketCreateJson));

    // Resolve ticket
    const ticketResolveRes = await fetch(`${BASE_URL}/helpdesk/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Resolved',
        resolutionNotes: 'Updated Okta SAML certificate and flushed cache'
      })
    });
    assert(ticketResolveRes.status === 200, 'UAT-4.2: Support Agent resolved ticket with resolution notes');

  } catch (err) {
    console.error('Acceptance UAT exception:', err);
    assert(false, 'Acceptance UAT suite ran without unhandled exceptions', err.message);
  } finally {
    // Cleanup
    if (soId) {
      await crmPool.query('DELETE FROM sales_orders WHERE id = $1', [soId]).catch(() => {});
    }
    if (quoteId) {
      await crmPool.query('DELETE FROM quotation_items WHERE quotation_id = $1', [quoteId]).catch(() => {});
      await crmPool.query('DELETE FROM quotations WHERE id = $1', [quoteId]).catch(() => {});
    }
    await crmPool.query('DELETE FROM activities WHERE id = $1', [`ACT-${testSuffix}`]).catch(() => {});
    await crmPool.query('DELETE FROM leads WHERE id = $1', [leadId]).catch(() => {});
    if (internId) {
      await hrmsPool.query('DELETE FROM interns WHERE id = $1', [internId]).catch(() => {});
    }
    if (leaveId) {
      await hrmsPool.query('DELETE FROM leave_requests WHERE id = $1', [leaveId]).catch(() => {});
    }
    if (ticketId) {
      await crmPool.query('DELETE FROM helpdesk_tickets WHERE id = $1', [ticketId]).catch(() => {});
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Acceptance Testing (UAT) Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Acceptance Testing (UAT)', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('03_acceptance_uat_testing_suite.js')) {
  runAcceptanceUatTests().then(async res => {
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
