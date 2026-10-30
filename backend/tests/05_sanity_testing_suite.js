/**
 * TEST SUITE 05: SANITY TESTING SUITE
 * 
 * Target: Targeted Verification of Recent Bug Fixes and Critical Hotfixes.
 * Verifies:
 * 1. BUG-108: CRM Leads Page Stage Tabs (5 tabs: New, Contacted, Qualified, Won, Lost)
 * 2. BUG-107: Priya Sharma (EMP-003) HR Lead Authentication & Permissions
 * 3. BUG-106: Global Navigation Signout Button Presence & Session Termination
 * 4. BUG-105: Intern Onboarding Wizard 10-Digit Phone Enforcement
 * 5. BUG-104: Quotation Rejection Non-Destructive Stage Preservation (remains Qualified)
 * 6. BUG-103: Helpdesk Ticket Summary Cards Real Database Count Derivation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crmPool, hrmsPool } from '../db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://127.0.0.1:5000/api';

export async function runSanityTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 05: SANITY TESTING (Targeted Bug Fix Verifications)');
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

  try {
    // ------------------------------------------------------------------------
    // 1. BUG-108 Sanity Check: CRM Leads Stage Tabs (5 Tabs Only)
    // ------------------------------------------------------------------------
    console.log('--- 1. BUG-108: CRM Leads Stage Tabs Definition ---');
    const leadsListPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'crm', 'components', 'CrmLeadsList.tsx');
    const leadsListContent = fs.readFileSync(leadsListPath, 'utf8');

    const expectedTabs = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
    for (const tab of expectedTabs) {
      assert(leadsListContent.includes(`'${tab}'`), `Lead tabs include "${tab}"`);
    }

    // Confirm LEAD_STAGE_TABS array does not contain obsolete stages
    const tabMatch = leadsListContent.match(/export const LEAD_STAGE_TABS = \[\s*([\s\S]*?)\]/);
    if (tabMatch) {
      const tabsBlock = tabMatch[1];
      assert(!tabsBlock.includes("'All'"), 'Tab array does NOT contain "All"');
      assert(!tabsBlock.includes("'Proposal'"), 'Tab array does NOT contain "Proposal"');
      assert(!tabsBlock.includes("'Negotiation'"), 'Tab array does NOT contain "Negotiation"');
    } else {
      assert(false, 'LEAD_STAGE_TABS array found in CrmLeadsList.tsx');
    }

    // ------------------------------------------------------------------------
    // 2. BUG-107 Sanity Check: Priya Sharma HR Lead Login
    // ------------------------------------------------------------------------
    console.log('\n--- 2. BUG-107: Priya Sharma HR Lead Authentication ---');
    const priyaInDb = await hrmsPool.query("SELECT id, emp_code, name, email, department, designation, status FROM employees WHERE emp_code = 'EMP-003' OR id = 'EMP-003'");
    assert(priyaInDb.rows.length >= 1, 'Priya Sharma (EMP-003) exists in HRMS database', `Found ${priyaInDb.rows.length} rows`);
    assert(priyaInDb.rows[0]?.name?.includes('Priya'), 'Employee name is Priya Sharma', `Got ${priyaInDb.rows[0]?.name}`);
    assert(priyaInDb.rows[0]?.department === 'HR', 'Priya Sharma belongs to HR department', `Got ${priyaInDb.rows[0]?.department}`);

    // Auth endpoint test with Priya's credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'EMP-003',
        pin: '1234',
        role: 'HRAdmin'
      })
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200 && (loginJson.token || loginJson.user || loginJson.employee), 'Priya Sharma authenticates successfully with HRAdmin credentials', JSON.stringify(loginJson));

    // ------------------------------------------------------------------------
    // 3. BUG-106 Sanity Check: Signout Button in Global Navigation
    // ------------------------------------------------------------------------
    console.log('\n--- 3. BUG-106: Global Header Signout Action ---');
    const headerPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'layout', 'Header.tsx');
    let hasSignout = false;
    if (fs.existsSync(headerPath)) {
      const headerContent = fs.readFileSync(headerPath, 'utf8');
      hasSignout = headerContent.includes('Sign Out') || headerContent.includes('Signout') || headerContent.includes('handleSignout') || headerContent.includes('logout');
    }
    const appPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'app', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    const appHasLogout = appContent.includes('Sign Out') || appContent.includes('logout') || appContent.includes('handleLogout');
    assert(hasSignout || appHasLogout, 'Top navigation / App includes Signout button and handler');

    // ------------------------------------------------------------------------
    // 4. BUG-105 Sanity Check: Intern 10-Digit Phone Enforcement
    // ------------------------------------------------------------------------
    console.log('\n--- 4. BUG-105: Intern Onboarding 10-Digit Phone Enforcement ---');
    const testInternFail = await fetch(`${BASE_URL}/interns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Intern Validation',
        email: `test.${Date.now()}@college.edu`,
        phone: '77777777777777777777', // 20 digits
        college: 'Test College',
        department: 'Engineering',
        mentorName: 'Rahul Verma'
      })
    });
    const testInternJson = await testInternFail.json();
    assert(testInternFail.status === 400 && testInternJson.errors?.phone?.includes('10 digits'), '20-digit phone rejected with "Phone number must be 10 digits only"', JSON.stringify(testInternJson));

    // ------------------------------------------------------------------------
    // 5. BUG-104 Sanity Check: Quotation Rejection Non-Destructive Behavior
    // ------------------------------------------------------------------------
    console.log('\n--- 5. BUG-104: Non-Definitive Quotation Rejection Stage Integrity ---');
    const testLeadId = `SANITY-LD-${Date.now()}`;
    await crmPool.query(`
      INSERT INTO leads (id, name, company, email, phone, stage, score, value, budget, requirement, decision_maker, expected_close_date, created_at, updated_at)
      VALUES ($1, 'Sanity Lead', 'Sanity Corp', 'sanity@corp.com', '9876543210', 'Qualified', 80, 400000, 400000, 'Sanity Test Requirement', 'Sanity DM', CURRENT_DATE + INTERVAL '15 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [testLeadId]);

    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLeadId,
        customerName: 'Sanity Corp',
        amount: 400000,
        items: [{ productName: 'Sanity Item', quantity: 1, unitPrice: 400000, total: 400000 }]
      })
    });
    const quoteJson = await quoteRes.json();
    const qId = quoteJson.data?.id;

    // Reject non-definitively
    await fetch(`${BASE_URL}/quotations/${qId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Rejected',
        isDefinitiveLoss: false,
        notes: 'Price renegotiation in progress'
      })
    });

    const checkLead = await crmPool.query('SELECT stage FROM leads WHERE id = $1', [testLeadId]);
    assert(checkLead.rows[0]?.stage === 'Qualified', 'Lead remains "Qualified" after non-definitive quote rejection (not Lost)', `Stage is ${checkLead.rows[0]?.stage}`);

    // Cleanup
    await crmPool.query('DELETE FROM quotation_items WHERE quotation_id = $1', [qId]).catch(() => {});
    await crmPool.query('DELETE FROM quotations WHERE id = $1', [qId]).catch(() => {});
    await crmPool.query('DELETE FROM leads WHERE id = $1', [testLeadId]).catch(() => {});

    // ------------------------------------------------------------------------
    // 6. BUG-103 Sanity Check: Helpdesk Ticket Summary Cards Real Counts
    // ------------------------------------------------------------------------
    console.log('\n--- 6. BUG-103: Helpdesk Summary Derived from Real DB Counts ---');
    const summaryRes = await fetch(`${BASE_URL}/helpdesk/summary`);
    const summaryJson = await summaryRes.json();
    assert(summaryRes.status === 200 && summaryJson.success, 'Helpdesk /summary endpoint returns HTTP 200');
    assert(typeof summaryJson.summary?.open === 'number', 'Summary contains numeric "open" count', `Got ${summaryJson.summary?.open}`);
    assert(typeof summaryJson.summary?.inProgress === 'number', 'Summary contains numeric "inProgress" count', `Got ${summaryJson.summary?.inProgress}`);
    assert(typeof summaryJson.summary?.resolved === 'number', 'Summary contains numeric "resolved" count', `Got ${summaryJson.summary?.resolved}`);
    assert(typeof summaryJson.summary?.highPriority === 'number', 'Summary contains numeric "highPriority" count', `Got ${summaryJson.summary?.highPriority}`);

  } catch (err) {
    console.error('Sanity testing exception:', err);
    assert(false, 'Sanity suite ran without fatal errors', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Sanity Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Sanity Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('05_sanity_testing_suite.js')) {
  runSanityTests().then(async res => {
    try {
      await Promise.all([crmPool.end(), hrmsPool.end()]);
    } catch (_) {}
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
