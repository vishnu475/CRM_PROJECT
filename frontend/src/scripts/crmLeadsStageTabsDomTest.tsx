/**
 * DOM Verification Suite for CRM Leads 5 Stage Tabs
 * Asserts the exact five visible tabs: New, Contacted, Qualified, Won, Lost
 * Confirms removal of All, Proposal, and Negotiation from the tab bar.
 */

// Setup mock window & localStorage before imports
(globalThis as any).window = {
  location: { pathname: '/crm/leads', search: '', href: 'http://localhost:3000/crm/leads' },
  localStorage: {
    getItem: (k: string) => null,
    setItem: () => {},
    removeItem: () => {}
  }
};
(globalThis as any).localStorage = (globalThis as any).window.localStorage;

import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppProvider } from '../context/AppContext';
import { CrmLeadsList, LEAD_STAGE_TABS } from '../modules/crm/components/CrmLeadsList';

async function runDomTest() {
  console.log('========================================================================');
  console.log('🧪 CRM LEADS STAGE TABS DOM & REGRESSION TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. LEAD_STAGE_TABS Array Integrity
  console.log('📦 1. LEAD_STAGE_TABS Configuration Array');
  assert(LEAD_STAGE_TABS.length === 5, 'Contains exactly 5 stage tab definitions');
  assert(LEAD_STAGE_TABS[0] === 'New', 'Tab 1 is "New"');
  assert(LEAD_STAGE_TABS[1] === 'Contacted', 'Tab 2 is "Contacted"');
  assert(LEAD_STAGE_TABS[2] === 'Qualified', 'Tab 3 is "Qualified"');
  assert(LEAD_STAGE_TABS[3] === 'Won', 'Tab 4 is "Won"');
  assert(LEAD_STAGE_TABS[4] === 'Lost', 'Tab 5 is "Lost"');
  assert(!LEAD_STAGE_TABS.includes('All' as any), '"All" is excluded from LEAD_STAGE_TABS');
  assert(!LEAD_STAGE_TABS.includes('Proposal' as any), '"Proposal" is excluded from LEAD_STAGE_TABS');
  assert(!LEAD_STAGE_TABS.includes('Negotiation' as any), '"Negotiation" is excluded from LEAD_STAGE_TABS');

  // 2. Render CrmLeadsList component to HTML
  console.log('\n📦 2. Component DOM Rendering & Tab Bar Inspection');
  const html = renderToString(
    <AppProvider>
      <CrmLeadsList onViewChange={() => {}} />
    </AppProvider>
  );

  // Assert presence of the 5 required tabs by ID
  assert(html.includes('id="lead-stage-tab-new"'), 'Renders button id="lead-stage-tab-new"');
  assert(html.includes('id="lead-stage-tab-contacted"'), 'Renders button id="lead-stage-tab-contacted"');
  assert(html.includes('id="lead-stage-tab-qualified"'), 'Renders button id="lead-stage-tab-qualified"');
  assert(html.includes('id="lead-stage-tab-won"'), 'Renders button id="lead-stage-tab-won"');
  assert(html.includes('id="lead-stage-tab-lost"'), 'Renders button id="lead-stage-tab-lost"');

  // Assert absence of unwanted tabs from the tab navigation
  assert(!html.includes('id="lead-stage-tab-all"'), 'Does NOT render id="lead-stage-tab-all"');
  assert(!html.includes('id="lead-stage-tab-proposal"'), 'Does NOT render id="lead-stage-tab-proposal"');
  assert(!html.includes('id="lead-stage-tab-negotiation"'), 'Does NOT render id="lead-stage-tab-negotiation"');

  // Assert tab order in the rendered HTML
  const posNew = html.indexOf('id="lead-stage-tab-new"');
  const posContacted = html.indexOf('id="lead-stage-tab-contacted"');
  const posQualified = html.indexOf('id="lead-stage-tab-qualified"');
  const posWon = html.indexOf('id="lead-stage-tab-won"');
  const posLost = html.indexOf('id="lead-stage-tab-lost"');

  assert(
    posNew !== -1 &&
    posContacted !== -1 &&
    posQualified !== -1 &&
    posWon !== -1 &&
    posLost !== -1 &&
    posNew < posContacted &&
    posContacted < posQualified &&
    posQualified < posWon &&
    posWon < posLost,
    'Rendered DOM order strictly matches: New -> Contacted -> Qualified -> Won -> Lost'
  );

  // Assert default active tab
  assert(html.includes('aria-selected="true"'), 'An active tab has aria-selected="true"');
  const newButtonSegment = html.substring(posNew, posNew + 300);
  assert(newButtonSegment.includes('aria-selected="true"'), 'Default active tab is "New" with aria-selected="true"');

  // Assert total count of stage tab buttons in the tab bar
  const tabButtonMatches = html.match(/id="lead-stage-tab-[a-z]+"/g) || [];
  assert(tabButtonMatches.length === 5, `Exactly 5 stage tab buttons exist in the DOM (found ${tabButtonMatches.length})`);

  console.log('\n========================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDomTest().catch(err => {
  console.error('DOM Test Error:', err);
  process.exit(1);
});

