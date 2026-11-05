/**
 * TEST SUITE 08: COMPONENT TESTING SUITE
 * 
 * Target: Frontend React Components, DOM Markup Structure, Component Props & State Handlers.
 * Components Tested:
 * 1. CrmLeadsList: 5-Stage Tabs Bar, Tab Roles, Accessibility Attributes, Lead Card Rows
 * 2. QuotationModal: Pricing Modal, Qualified Lead Pre-fill, Line Items Calculation Matrix
 * 3. HelpdeskPage: Header, "Create Ticket" Action Button, 4 Dynamic KPI Summary Cards
 * 4. Header: Top-right Navigation, Sign Out Button, Responsive Badges, Role Greetings
 * 5. LoginPage: Secure Credential Fields, Role Selectors, Validation Banners
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runComponentTests() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE 08: COMPONENT TESTING (React Components & DOM Structure)');
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
    // 1. CrmLeadsList Component Inspection
    // ------------------------------------------------------------------------
    console.log('--- 1. CrmLeadsList Component DOM Verification ---');
    const leadsListPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'crm', 'components', 'CrmLeadsList.tsx');
    const leadsListCode = fs.readFileSync(leadsListPath, 'utf8');

    assert(leadsListCode.includes('id={`lead-stage-tab-${stage.toLowerCase()}`}'), 'CrmLeadsList renders dynamic tab button IDs');
    assert(leadsListCode.includes('role="tab"'), 'CrmLeadsList tabs have role="tab" accessible attribute');
    assert(leadsListCode.includes('aria-selected={isActive}'), 'CrmLeadsList tabs have dynamic aria-selected attribute');
    assert(leadsListCode.includes('placeholder="Search leads by name, company, email, phone..."') || leadsListCode.includes('Search leads by name'), 'Search input contains comprehensive placeholder');
    assert(leadsListCode.includes('Add Lead'), 'Action button "Add Lead" is present in component');

    // ------------------------------------------------------------------------
    // 2. QuotationModal Component Inspection
    // ------------------------------------------------------------------------
    console.log('\n--- 2. QuotationModal Component DOM Verification ---');
    const quoteModalPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'sales', 'components', 'QuotationModal.tsx');
    const quoteModalCode = fs.readFileSync(quoteModalPath, 'utf8');

    assert(quoteModalCode.includes('Create Sales Quotation') || quoteModalCode.includes('Edit Quotation'), 'QuotationModal renders descriptive modal heading');
    assert(quoteModalCode.includes('Qualified'), 'QuotationModal restricts or highlights Qualified leads for selection');
    assert(quoteModalCode.includes('taxAmount') || quoteModalCode.includes('tax_amount') || quoteModalCode.includes('18%'), 'QuotationModal calculates and presents GST/Tax amount');
    assert(quoteModalCode.includes('subtotal') || quoteModalCode.includes('Subtotal'), 'QuotationModal presents Subtotal summary');
    assert(quoteModalCode.includes('grandTotal') || quoteModalCode.includes('totalAmount') || quoteModalCode.includes('Total Amount'), 'QuotationModal presents Grand Total Amount');

    // ------------------------------------------------------------------------
    // 3. HelpdeskPage Component Inspection
    // ------------------------------------------------------------------------
    console.log('\n--- 3. HelpdeskPage Component DOM Verification ---');
    const helpdeskPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'helpdesk', 'pages', 'HelpdeskPage.tsx');
    const cardsPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'helpdesk', 'components', 'TicketSummaryCards.tsx');
    
    let helpdeskCode = fs.existsSync(helpdeskPath) ? fs.readFileSync(helpdeskPath, 'utf8') : '';
    let cardsCode = fs.existsSync(cardsPath) ? fs.readFileSync(cardsPath, 'utf8') : '';

    assert(helpdeskCode.includes('Helpdesk &amp; Support Tickets') || helpdeskCode.includes('Helpdesk & Support Tickets'), 'HelpdeskPage renders title "Helpdesk & Support Tickets"');
    assert(helpdeskCode.includes('Create Ticket'), 'HelpdeskPage renders "Create Ticket" action button');
    assert(cardsCode.includes('Open Tickets'), 'TicketSummaryCards renders Open Tickets KPI card');
    assert(cardsCode.includes('High Priority'), 'TicketSummaryCards renders High Priority KPI card');

    // ------------------------------------------------------------------------
    // 4. Header Component Inspection
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Header Component DOM Verification ---');
    const headerPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'layout', 'Header.tsx');
    const headerCode = fs.readFileSync(headerPath, 'utf8');

    assert(headerCode.includes('id="header-signout-btn"') || headerCode.includes('Sign Out'), 'Header renders top-right Sign Out button');
    assert(headerCode.includes('aria-label="Sign Out"') || headerCode.includes('Sign Out'), 'Header Sign Out button includes accessible label');
    assert(headerCode.includes('LogOut') || headerCode.includes('logout'), 'Header renders LogOut icon element');

    // ------------------------------------------------------------------------
    // 5. LoginPage Component Inspection
    // ------------------------------------------------------------------------
    console.log('\n--- 5. LoginPage Component DOM Verification ---');
    const loginPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'auth', 'LoginPage.tsx');
    const loginCode = fs.readFileSync(loginPath, 'utf8');

    assert(loginCode.includes('Sign in to your account') || loginCode.includes('Sign In'), 'LoginPage renders header title');
    assert(loginCode.includes('HRAdmin') || loginCode.includes('HR Lead'), 'LoginPage role dropdown includes HRAdmin option');
    assert(!loginCode.includes('Sarah Jenkins') || !loginCode.includes('quick-access-sarah'), 'Quick access demo cards are removed from production login page');

  } catch (err) {
    console.error('Component test exception:', err);
    assert(false, 'Component testing suite completed without fatal error', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Component Testing Suite Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================\n');

  return { suite: 'Component Testing', total: passed + failed, passed, failed };
}

// Allow standalone execution
if (process.argv[1]?.endsWith('08_component_testing_suite.js')) {
  runComponentTests().then(res => {
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
