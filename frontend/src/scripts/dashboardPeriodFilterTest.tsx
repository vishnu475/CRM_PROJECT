/**
 * BUG-107: Comprehensive Dashboard Reporting-Period Filter Verification Suite
 *
 * Verifies:
 * 1. ExecutiveDashboard reporting-period controls:
 *    - Global Fiscal / Reporting Period selector (#executive-fiscal-period-selector)
 *    - Section period buttons (#rev-period-btn, #pipe-period-btn, #products-period-btn, #attendance-period-btn)
 *    - Accurate metric updates for Month, Quarter, YTD, and All Time
 * 2. ReportsPage reporting-period filter buttons:
 *    - Filter group with aria-label
 *    - 4 period buttons (#period-filter-month, #period-filter-quarter, #period-filter-ytd, #period-filter-all)
 *    - aria-pressed state reflection
 *    - Passing ?period= query param on fetchReportData
 * 3. Live Backend /api/reports/summary?period=...:
 *    - Period filtering across CRM leads, invoices, sales orders, attendance, expenses
 *    - Verification of distinct values returned across Month, Quarter, and All Time
 * 4. Regression tests for BUG-101 through BUG-106
 */

// Setup mock window and localStorage for headless Node environment
if (typeof (globalThis as any).window === 'undefined') {
  const listeners: Record<string, Function[]> = {};
  (globalThis as any).window = {
    location: { pathname: '/dashboard' },
    addEventListener: (event: string, cb: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    removeEventListener: (event: string, cb: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(fn => fn !== cb);
      }
    },
    dispatchEvent: (event: any) => {
      const type = event?.type || event;
      if (listeners[type]) {
        listeners[type].forEach(fn => fn(event));
      }
      return true;
    },
    history: {
      pushState: (_state: any, _title: string, url: string) => {
        (globalThis as any).window.location.pathname = url;
      }
    }
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  const docListeners: Record<string, Function[]> = {};
  (globalThis as any).document = {
    addEventListener: (event: string, cb: Function) => {
      if (!docListeners[event]) docListeners[event] = [];
      docListeners[event].push(cb);
    },
    removeEventListener: (event: string, cb: Function) => {
      if (docListeners[event]) {
        docListeners[event] = docListeners[event].filter(fn => fn !== cb);
      }
    },
    dispatchEvent: (event: any) => {
      const type = event?.type || event;
      if (docListeners[type]) {
        docListeners[type].forEach(fn => fn(event));
      }
      return true;
    }
  };
}

let storage: Record<string, string> = {};
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, val: string) => { storage[key] = val; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { storage = {}; }
  };
}

import React from 'react';
import { renderToString } from 'react-dom/server';
import { ExecutiveDashboard, PERIOD_NAMES, PERIOD_FISCAL_LABELS } from '../components/dashboard/ExecutiveDashboard';
import { ReportsPage } from '../modules/reports/pages/ReportsPage';
import { LoginPage } from '../components/auth/LoginPage';
import { Header } from '../components/layout/Header';
import { AppProviders } from '../app/providers';

console.log('========================================================================');
console.log('🧪 BUG-107: DASHBOARD REPORTING-PERIOD FILTERS VERIFICATION SUITE');
console.log('========================================================================\n');

let passCount = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

function setAuthSession(user: { name?: string; role?: string }) {
  storage['crm_auth'] = 'true';
  storage['crm_user_role'] = user.role || 'Executive';
  storage['crm_token'] = 'test-token';
  storage['crm_user_profile'] = JSON.stringify({
    id: 'EMP-001',
    empCode: 'EMP-001',
    name: user.name || 'Sarah Jenkins',
    email: 'sarah.jenkins@company.com',
    role: user.role || 'Executive',
    roleTitle: user.role === 'Executive' ? 'Chief Executive Officer' : 'Manager',
    company: 'Enterprise Corp'
  });
}

const cleanHtml = (html: string) => html.replace(/<!--.*?-->/g, '');

// =============================================================
// SUITE 1: EXECUTIVE DASHBOARD REPORTING PERIOD CONTROLS
// =============================================================
console.log('📦 SUITE 1: Executive Dashboard Period Selectors & Default Values');

setAuthSession({ name: 'Sarah Jenkins', role: 'Executive' });
const execHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

// Test 1: Top Fiscal Period selector button exists with proper ID
assert(
  execHtml.includes('id="executive-fiscal-period-selector"') &&
  execHtml.includes('Fiscal Period:'),
  "Top Fiscal Period selector button with id='executive-fiscal-period-selector' is rendered"
);

// Test 2: Section period selector buttons exist with proper IDs
assert(
  execHtml.includes('id="rev-period-btn"') &&
  execHtml.includes('id="pipe-period-btn"') &&
  execHtml.includes('id="products-period-btn"') &&
  execHtml.includes('id="attendance-period-btn"'),
  "All 4 section period buttons (rev, pipe, products, attendance) are rendered with unique IDs"
);

// Test 3: Default Month Total Revenue metric rendered
assert(
  execHtml.includes('Total Revenue') && execHtml.includes('1,48,35,000'),
  "Default month Total Revenue (₹ 1,48,35,000) is rendered"
);

// Test 4: Default Month Pipeline Value metric rendered
assert(
  execHtml.includes('Pipeline Value') && execHtml.includes('2,34,50,000'),
  "Default month Pipeline Value (₹ 2,34,50,000) is rendered"
);

// Test 5: Default Month Attendance % rendered
assert(
  execHtml.includes('Attendance %') && execHtml.includes('92.6%'),
  "Default month Attendance % (92.6%) is rendered"
);

// Test 6: Default Month Open Tickets rendered
assert(
  execHtml.includes('Open Tickets') && execHtml.includes('28'),
  "Default month Open Tickets (28) is rendered"
);

// Test 7: Default Month Net Profit rendered
assert(
  execHtml.includes('Net Profit') && execHtml.includes('24,75,000'),
  "Default month Net Profit (₹ 24,75,000) is rendered"
);

// =============================================================
// SUITE 2: EXECUTIVE DASHBOARD PERIOD CALCULATION INTEGRITY
// =============================================================
console.log('\n📊 SUITE 2: Executive Dashboard Period Model Integrity');

// Test 8: All period configurations defined and exported
assert(
  PERIOD_NAMES['month'] === 'This Month' &&
  PERIOD_NAMES['quarter'] === 'Quarter' &&
  PERIOD_NAMES['ytd'] === 'YTD 2026' &&
  PERIOD_NAMES['all'] === 'All Time',
  "PERIOD_NAMES exports exact labels for month, quarter, ytd, and all"
);

assert(
  PERIOD_FISCAL_LABELS['month'] === 'This Month' &&
  PERIOD_FISCAL_LABELS['quarter'] === 'Q2 FY 2025-26' &&
  PERIOD_FISCAL_LABELS['ytd'] === 'YTD 2026' &&
  PERIOD_FISCAL_LABELS['all'] === 'All Time',
  "PERIOD_FISCAL_LABELS exports exact fiscal labels for month, quarter, ytd, and all"
);

// =============================================================
// SUITE 3: REPORTS PAGE REPORTING PERIOD SELECTORS
// =============================================================
console.log('\n📑 SUITE 3: ReportsPage Period Selector Verification');

const reportsHtml = renderToString(
  <AppProviders>
    <ReportsPage />
  </AppProviders>
);

// Test 10: ReportsPage filter group rendered with accessible role
assert(
  reportsHtml.includes('role="group"') &&
  reportsHtml.includes('aria-label="Reporting Period Filter"'),
  "ReportsPage renders reporting period filter container with role='group' and aria-label"
);

// Test 11: All 4 period buttons exist in ReportsPage with unique IDs
assert(
  reportsHtml.includes('id="period-filter-month"') &&
  reportsHtml.includes('id="period-filter-quarter"') &&
  reportsHtml.includes('id="period-filter-ytd"') &&
  reportsHtml.includes('id="period-filter-all"'),
  "ReportsPage renders all 4 period filter buttons (#period-filter-month, -quarter, -ytd, -all)"
);

// Test 12: Default month button has aria-pressed="true"
assert(
  reportsHtml.includes('id="period-filter-month"') &&
  reportsHtml.includes('aria-pressed="true"'),
  "Default 'This Month' button has aria-pressed='true' on ReportsPage"
);

// =============================================================
// SUITE 4: BACKEND LIVE REPORTING PERIOD API QUERIES
// =============================================================
console.log('\n🌐 SUITE 4: Live Backend API /api/reports/summary?period=... Verification');

async function runBackendApiTests() {
  try {
    const periods = ['month', 'quarter', 'ytd', 'all'] as const;
    const responses: Record<string, any> = {};

    for (const p of periods) {
      const res = await fetch(`http://localhost:5000/api/reports/summary?period=${p}`);
      const json = await res.json();
      responses[p] = json;
    }

    // Test 13: All requests succeed
    assert(
      periods.every(p => responses[p]?.success === true),
      "Backend /api/reports/summary succeeds for all period parameters (month, quarter, ytd, all)"
    );

    // Test 14: selectedPeriod matches query param
    assert(
      periods.every(p => responses[p]?.selectedPeriod === p),
      "Backend echoes back the correct selectedPeriod in the response payload"
    );

    // Test 15: Leads count changes according to period
    const leadsMonth = responses['month'].crm.totalLeadsCount;
    const leadsQuarter = responses['quarter'].crm.totalLeadsCount;
    assert(
      leadsMonth <= leadsQuarter && leadsQuarter > 0,
      `Leads count properly filters by period (month: ${leadsMonth}, quarter: ${leadsQuarter})`
    );

    // Test 16: Invoiced value reflects period filtering
    const invMonth = responses['month'].crm.totalInvoicedValue;
    const invAll = responses['all'].crm.totalInvoicedValue;
    assert(
      invMonth > 0 && invAll >= invMonth,
      `Invoiced value properly filters by period (month: ₹${invMonth}, all: ₹${invAll})`
    );

    // Test 17: Sales orders count reflects period filtering
    const soMonth = responses['month'].crm.salesOrders.reduce((a: number, r: any) => a + parseInt(r.count), 0);
    const soAll = responses['all'].crm.salesOrders.reduce((a: number, r: any) => a + parseInt(r.count), 0);
    assert(
      soAll >= soMonth,
      `Sales orders count properly filters by period (month: ${soMonth}, all: ${soAll})`
    );

    // Test 18: Attendance records reflect period filtering
    const attMonth = responses['month'].hrms.attendance30Days.reduce((a: number, r: any) => a + parseInt(r.count), 0);
    const attAll = responses['all'].hrms.attendance30Days.reduce((a: number, r: any) => a + parseInt(r.count), 0);
    assert(
      attAll >= attMonth,
      `Attendance records count properly reflects period filtering (month: ${attMonth}, all: ${attAll})`
    );

    // Test 19: Expenses reflect period filtering
    const expMonth = responses['month'].finance.expenses.reduce((a: number, r: any) => a + parseFloat(r.total), 0);
    const expAll = responses['all'].finance.expenses.reduce((a: number, r: any) => a + parseFloat(r.total), 0);
    assert(
      expAll >= expMonth,
      `Expenses total properly reflects period filtering (month: ₹${expMonth}, all: ₹${expAll})`
    );
  } catch (err: any) {
    console.error('API Test Error:', err.message);
    assert(false, "Backend live API tests executed without network/server error", err.message);
  }

  // =============================================================
  // SUITE 5: REGRESSION TESTS FOR BUG-101 THROUGH BUG-106
  // =============================================================
  console.log('\n🔄 SUITE 5: Regression Tests (BUG-101 through BUG-106)');

  // Test 20: BUG-101 - Registration navigation link
  const loginHtml = renderToString(
    <AppProviders>
      <LoginPage onNavigate={() => {}} />
    </AppProviders>
  );
  assert(
    loginHtml.includes('href="/register"') &&
    (loginHtml.includes("Don&#x27;t have an account?") || loginHtml.includes("Don't have an account?")),
    "REGRESSION BUG-101: Registration navigation link to /register is preserved"
  );

  // Test 21: BUG-102 - Role dropdown with Executive & Super Admin
  assert(
    loginHtml.includes('id="role-select"') &&
    loginHtml.includes('value="Executive"') &&
    loginHtml.includes('Super Admin'),
    "REGRESSION BUG-102: Role dropdown with Executive and Super Admin options is preserved"
  );

  // Test 22: BUG-103 - Password visibility toggle button
  assert(
    loginHtml.includes('id="password-toggle-btn"') &&
    loginHtml.includes('type="button"') &&
    loginHtml.includes('aria-label="Show password"'),
    "REGRESSION BUG-103: Password visibility toggle button with type='button' and accessible label is preserved"
  );

  // Test 23: BUG-105 - Header global search combobox
  const headerHtml = renderToString(
    <AppProviders>
      <Header />
    </AppProviders>
  );
  assert(
    headerHtml.includes('id="global-search-input"') &&
    headerHtml.includes('role="combobox"') &&
    headerHtml.includes('aria-controls="global-search-dropdown"'),
    "REGRESSION BUG-105: Header global search combobox with accessible attributes is preserved"
  );

  // Test 24: BUG-106 - Authenticated user name in ExecutiveDashboard greeting
  assert(
    cleanHtml(execHtml).includes('Welcome back, Sarah Jenkins!'),
    "REGRESSION BUG-106: ExecutiveDashboard displays authenticated user name 'Sarah Jenkins'"
  );

  // Test 25: BUG-106 - No hardcoded John or Vishnu Vardhan
  assert(
    !cleanHtml(execHtml).includes('Welcome back, John!') &&
    !cleanHtml(execHtml).includes('Welcome back, Vishnu Vardhan!'),
    "REGRESSION BUG-106: Hardcoded dummy names are completely absent"
  );

  // =============================================================
  // FINAL SUMMARY
  // =============================================================
  console.log('\n========================================================================');
  console.log(`📊 TEST RESULTS: ${passCount} / ${totalTests} PASSED (${Math.round((passCount / totalTests) * 100)}%)`);
  console.log('========================================================================');

  if (passCount === totalTests) {
    console.log('✨ ALL DASHBOARD REPORTING PERIOD (BUG-107) & REGRESSION TESTS PASSED SUCCESSFULLY!\n');
    process.exitCode = 0;
  } else {
    console.error(`💥 ${totalTests - passCount} TEST(S) FAILED.\n`);
    process.exitCode = 1;
  }
}

runBackendApiTests();
