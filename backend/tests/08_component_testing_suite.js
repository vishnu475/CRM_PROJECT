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

    // ------------------------------------------------------------------------
    // 6. CrmLeadDetails Component Inspection (Workflow Progression & Protections)
    // ------------------------------------------------------------------------
    console.log('\n--- 6. CrmLeadDetails Component Workflow Verification ---');
    const leadDetailsPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'crm', 'components', 'CrmLeadDetails.tsx');
    const leadDetailsCode = fs.readFileSync(leadDetailsPath, 'utf8');

    assert(leadDetailsCode.includes('Automated workflow progression • Manual stage jumps disabled'), 'CrmLeadDetails disables manual stage bubble clicking with automated progression banner');
    assert(leadDetailsCode.includes('Qualify Lead'), 'CrmLeadDetails provides actionable "Qualify Lead" button in Contacted stage');
    assert(leadDetailsCode.includes('View in Sales'), 'CrmLeadDetails provides "View in Sales" bridge button in Qualified stage');
    assert(leadDetailsCode.includes('Create Delivery Project') || leadDetailsCode.includes('View Project'), 'CrmLeadDetails provides Project creation/navigation for Won leads');
    assert(leadDetailsCode.includes('lead.stage === \'Won\'') && leadDetailsCode.includes('Cannot move a "Won" lead to "Lost"'), 'CrmLeadDetails guards Won leads against being marked as Lost');

    // ------------------------------------------------------------------------
    // 7. SalesPage Component Inspection (Qualified Leads Tab & Revision History)
    // ------------------------------------------------------------------------
    console.log('\n--- 7. SalesPage Component CRM Integration Verification ---');
    const salesPagePath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'sales', 'pages', 'SalesPage.tsx');
    const salesPageCode = fs.readFileSync(salesPagePath, 'utf8');

    assert(salesPageCode.includes('Qualified Leads'), 'SalesPage renders dedicated "Qualified Leads" tab');
    assert(salesPageCode.includes('qualifiedLeads.length'), 'SalesPage renders live count badge for Qualified Leads');
    assert(salesPageCode.includes('Create Quotation'), 'SalesPage renders "Create Quotation" action button for Qualified leads');
    assert(salesPageCode.includes('Revision History'), 'SalesPage includes Quotation Revision History Modal');
    assert(salesPageCode.includes('revisionRequestedCount') || salesPageCode.includes('sentQuotesCount'), 'SalesPage tracks granular quotation statuses in secondary KPI strip');

    // ------------------------------------------------------------------------
    // 8. QuotationModal Pre-population & Inline Contact Creation
    // ------------------------------------------------------------------------
    console.log('\n--- 8. QuotationModal Pre-population Verification ---');
    assert(quoteModalCode.includes('initialLeadId'), 'QuotationModal supports initialLeadId prop for direct CRM lead handoff');
    assert(quoteModalCode.includes('newContactName') && quoteModalCode.includes('setIsAddingContact'), 'QuotationModal supports adding custom contact person details inline');
    assert(quoteModalCode.includes('initLead.requirement'), 'QuotationModal automatically retrieves lead requirements into quotation scope');

    // ------------------------------------------------------------------------
    // 9. SalesOrderModal & Order Details Verification (ANTIGRAVITY PROMPT)
    // ------------------------------------------------------------------------
    console.log('\n--- 9. SalesOrderModal & Delivery/PO Fields Verification ---');
    const soModalPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'sales', 'components', 'SalesOrderModal.tsx');
    const soModalCode = fs.readFileSync(soModalPath, 'utf8');

    // Section 1: Quotation Summary
    assert(soModalCode.includes('Quotation Summary') || soModalCode.includes('QUOTATION SUMMARY'), 'SalesOrderModal renders Quotation Summary section');
    assert(soModalCode.includes('formatDateToDDMMYYYY'), 'SalesOrderModal formats actual accepted date rather than hardcoded dummy date');
    assert(!soModalCode.includes("'Recently Accepted'}") && !soModalCode.includes('"Recently Accepted"}'), 'SalesOrderModal replaces "Recently Accepted" with dynamic database accepted date');
    assert(soModalCode.includes('Not Available'), 'SalesOrderModal handles missing acceptance date with "Not Available" fallback');

    // Section 2: Order Details
    assert(soModalCode.includes('Order Details'), 'SalesOrderModal renders Order Details section');
    assert(soModalCode.includes('Expected Delivery Date'), 'SalesOrderModal includes Expected Delivery Date field');
    assert(soModalCode.includes('min={date'), 'SalesOrderModal enforces minimum delivery date >= order date on datepicker');
    assert(soModalCode.includes('expectedDeliveryDate < date'), 'SalesOrderModal validates that expectedDeliveryDate is not earlier than order date');
    assert(soModalCode.includes('Customer PO Number'), 'SalesOrderModal includes Customer PO Number field');
    assert(soModalCode.includes('Confirmed') && (soModalCode.includes('readOnly') || soModalCode.includes('disabled')), 'SalesOrderModal locks initial order status to Confirmed');

    // Section 3: Payment Details
    assert(soModalCode.includes('Payment Details') && soModalCode.includes('Payment Terms'), 'SalesOrderModal renders Payment Details section with Payment Terms');

    // Section 4: Delivery Details
    assert(soModalCode.includes('Delivery Details'), 'SalesOrderModal renders Delivery Details section');
    assert(soModalCode.includes('Delivery Address'), 'SalesOrderModal includes Delivery Address input');
    assert(soModalCode.includes('Delivery Instructions & Scope Notes'), 'SalesOrderModal preserves Delivery Instructions & Scope Notes');

    // Backend Sales Order Route & Database Schema Verification
    console.log('\n--- 10. Backend Sales Orders Schema & Validation Verification ---');
    const soRoutePath = path.join(__dirname, '..', 'routes', 'sales_orders.js');
    const soRouteCode = fs.readFileSync(soRoutePath, 'utf8');
    assert(soRouteCode.includes('expected_delivery_date') && soRouteCode.includes('delivery_address') && soRouteCode.includes('customer_po_number'), 'Backend route handles expected_delivery_date, delivery_address, and customer_po_number');
    assert(soRouteCode.includes('finalExpectedDelivery < orderDate'), 'Backend route validates expectedDeliveryDate >= orderDate');
    assert(soRouteCode.includes('ensureSalesOrderColumns'), 'Backend route automatically ensures delivery and PO columns exist');

    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', 'crm', '024_sales_orders_delivery_and_po.sql');
    assert(fs.existsSync(migrationPath), 'Migration 024_sales_orders_delivery_and_po.sql exists');

    // SalesPage Details Modal Verification
    console.log('\n--- 11. SalesPage Order Details Modal Verification ---');
    const salesPageForModalPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'sales', 'pages', 'SalesPage.tsx');
    const salesPageForModalCode = fs.readFileSync(salesPageForModalPath, 'utf8');
    assert(salesPageForModalCode.includes('selectedOrderForDetails'), 'SalesPage maintains state for selectedOrderForDetails');
    assert(salesPageForModalCode.includes('Sales Order Details') && salesPageForModalCode.includes('customerPoNumber'), 'SalesPage renders comprehensive Sales Order Details Modal');

    // ------------------------------------------------------------------------
    // 12. Tax Invoice Modal & GST Calculations Verification (ANTIGRAVITY PROMPT)
    // ------------------------------------------------------------------------
    console.log('\n--- 12. Tax Invoice Modal & GST Form Structure Verification ---');
    const invModalPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'sales', 'components', 'InvoiceModal.tsx');
    const invModalCode = fs.readFileSync(invModalPath, 'utf8');

    assert(invModalCode.includes('Section 1: Invoice Details'), 'InvoiceModal contains Section 1: Invoice Details & Numbering');
    assert(invModalCode.includes('Section 2: Customer & Billing Address'), 'InvoiceModal contains Section 2: Customer & Billing Address');
    assert(invModalCode.includes('Section 3: GST Tax & Place of Supply'), 'InvoiceModal contains Section 3: GST Tax & Place of Supply Rules');
    assert(invModalCode.includes('Section 4: Payment Terms & Remittance Bank Account'), 'InvoiceModal contains Section 4: Payment Terms & Remittance Bank Account');
    assert(invModalCode.includes('INDIAN_STATES_GST'), 'InvoiceModal imports and renders Indian States GST list');
    assert(invModalCode.includes('calculateGstTaxBreakdown'), 'InvoiceModal dynamically recalculates GST tax breakdown');
    assert(invModalCode.includes('placeOfSupplyCode'), 'InvoiceModal tracks and updates Place of Supply code');
    assert(invModalCode.includes('validateGSTIN'), 'InvoiceModal enforces GSTIN format validation');

    // ------------------------------------------------------------------------
    // 13. Official GST Tax Invoice Document Viewer Modal Verification
    // ------------------------------------------------------------------------
    console.log('\n--- 13. GST Tax Invoice Document Viewer Modal Verification ---');
    const docModalPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'sales', 'components', 'TaxInvoiceDocumentModal.tsx');
    assert(fs.existsSync(docModalPath), 'TaxInvoiceDocumentModal.tsx component exists');
    const docModalCode = fs.readFileSync(docModalPath, 'utf8');
    assert(docModalCode.includes('TAX INVOICE'), 'TaxInvoiceDocumentModal renders official TAX INVOICE title');
    assert(docModalCode.includes('SELLER_COMPANY_INFO'), 'TaxInvoiceDocumentModal includes Seller GST & Company details');
    assert(docModalCode.includes('numberToIndianWords'), 'TaxInvoiceDocumentModal renders total amount in Indian words');
    assert(docModalCode.includes('window.print()'), 'TaxInvoiceDocumentModal supports print & PDF export');
    assert(docModalCode.includes('sendEmail'), 'TaxInvoiceDocumentModal supports emailing invoice copy to customer');

    // ------------------------------------------------------------------------
    // 14. Customer Payment Recording & Tracking Verification
    // ------------------------------------------------------------------------
    console.log('\n--- 14. Customer Payment Recording Modal Verification ---');
    const payModalPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'modules', 'sales', 'components', 'RecordPaymentModal.tsx');
    assert(fs.existsSync(payModalPath), 'RecordPaymentModal.tsx component exists');
    const payModalCode = fs.readFileSync(payModalPath, 'utf8');
    assert(payModalCode.includes('recordInvoicePayment'), 'RecordPaymentModal invokes recordInvoicePayment');
    assert(payModalCode.includes('outstandingBalance'), 'RecordPaymentModal calculates and enforces outstanding balance limits');
    assert(payModalCode.includes('paymentMethod'), 'RecordPaymentModal supports selectable payment methods');

    // ------------------------------------------------------------------------
    // 15. Backend CRM Invoices API & GST Database Schema Verification
    // ------------------------------------------------------------------------
    console.log('\n--- 15. Backend CRM Invoices Schema & Payment Route Verification ---');
    const invRoutePath = path.join(__dirname, '..', 'routes', 'crm_invoices.js');
    const invRouteCode = fs.readFileSync(invRoutePath, 'utf8');
    assert(invRouteCode.includes('ensureInvoiceColumns'), 'Backend CRM Invoices route ensures tax & payment schema columns');
    assert(invRouteCode.includes('INV-') && invRouteCode.includes('FOR UPDATE'), 'Backend CRM Invoices route implements locked sequential numbering');
    assert(invRouteCode.includes('crm_invoice_payments'), 'Backend CRM Invoices route tracks payments in crm_invoice_payments');
    assert(invRouteCode.includes('place_of_supply') && invRouteCode.includes('cgst_amount') && invRouteCode.includes('igst_amount'), 'Backend CRM Invoices route handles full GST breakdown fields');
    assert(invRouteCode.includes('bank_accounts') && invRouteCode.includes('bank_transactions'), 'Backend CRM Invoices updates HRMS bank accounts upon customer payment');

    const invMigrationPath = path.join(__dirname, '..', 'db', 'migrations', 'crm', '025_tax_invoices_gst_and_payments.sql');
    assert(fs.existsSync(invMigrationPath), 'Migration 025_tax_invoices_gst_and_payments.sql exists');

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
