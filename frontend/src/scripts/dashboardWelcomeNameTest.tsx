/**
 * Comprehensive Unit and Integration Test Suite for BUG-106:
 * Dashboard Displays the Wrong User Name in the Welcome Message
 *
 * Verifies:
 * 1. The correct authenticated user's name appears in the ExecutiveDashboard greeting.
 * 2. The correct authenticated user's name appears in the RoleDashboardContainer greeting.
 * 3. Different users see their own names when switching accounts (e.g., Sarah Jenkins vs Ashok Kumar).
 * 4. A missing, null, undefined, or whitespace-only name gracefully displays the neutral fallback "there" without crashing.
 * 5. A signed-out or unauthenticated user does not see stale data from the previous account.
 * 6. Hardcoded dummy names ("John", "Vishnu Vardhan") are eliminated from active greetings.
 * 7. Existing dashboard functionality, KPI cards, and fiscal period widgets remain intact.
 * 8. Regression checks for BUG-101, BUG-102, BUG-103, and BUG-105 remain valid.
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
import { ExecutiveDashboard } from '../components/dashboard/ExecutiveDashboard';
import { RoleDashboardContainer } from '../components/dashboard/RoleDashboardContainer';
import { LoginPage } from '../components/auth/LoginPage';
import { Header } from '../components/layout/Header';
import { AppProviders } from '../app/providers';

console.log('========================================================================');
console.log('🧪 BUG-106: DASHBOARD WELCOME MESSAGE USER NAME VERIFICATION SUITE');
console.log('========================================================================\n');

let passCount = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passCount++;
    console.log(`  ✅ TEST ${totalTests} PASSED: ${testName}`);
  } else {
    console.error(`  ❌ TEST ${totalTests} FAILED: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

// -------------------------------------------------------------
// SUITE 1: AUTHENTICATED USER GREETING IN EXECUTIVE DASHBOARD
// -------------------------------------------------------------
console.log('📦 SUITE 1: Executive Dashboard Welcome Message');

// Helper to set mock auth session in localStorage before rendering AppProviders
function setAuthSession(user: { name?: string; role?: string; email?: string } | null, isAuth: boolean = true) {
  if (isAuth && user) {
    storage['crm_auth'] = 'true';
    storage['crm_user_role'] = user.role || 'Executive';
    storage['crm_user_profile'] = JSON.stringify({
      id: 'EMP-001',
      empCode: 'EMP-001',
      name: user.name,
      email: user.email || 'user@company.com',
      role: user.role || 'Executive',
      roleTitle: user.role === 'Executive' ? 'Administrator' : 'Manager',
      company: 'Acme Global Corp'
    });
  } else {
    storage['crm_auth'] = 'false';
    delete storage['crm_user_profile'];
    delete storage['crm_user_role'];
    delete storage['crm_token'];
  }
}

const cleanHtml = (html: string) => html.replace(/<!--.*?-->/g, '');

// Test 1: Authenticated user 'Sarah Jenkins' appears in ExecutiveDashboard
setAuthSession({ name: 'Sarah Jenkins', role: 'Executive' });
let dashboardHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

assert(
  cleanHtml(dashboardHtml).includes('Welcome back, Sarah Jenkins!'),
  "ExecutiveDashboard displays authenticated user name 'Sarah Jenkins'"
);

// Test 2: The hardcoded dummy name 'John' is NOT rendered
assert(
  !cleanHtml(dashboardHtml).includes('Welcome back, John!'),
  "Hardcoded dummy greeting 'Welcome back, John!' has been completely eliminated"
);

// Test 3: The hardcoded demo name 'Vishnu Vardhan' is NOT rendered
assert(
  !cleanHtml(dashboardHtml).includes('Welcome back, Vishnu Vardhan!'),
  "Hardcoded fallback 'Vishnu Vardhan' is NOT rendered for authenticated user"
);

// -------------------------------------------------------------
// SUITE 2: ACCOUNT SWITCHING & MULTI-USER NAME REFLECTION
// -------------------------------------------------------------
console.log('\n🔄 SUITE 2: Account Switching & Dynamic Name Updates');

// Test 4: Switching to Ashok Kumar reflects Ashok Kumar in Executive Dashboard
setAuthSession({ name: 'Ashok Kumar', role: 'Executive' });
dashboardHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

assert(
  cleanHtml(dashboardHtml).includes('Welcome back, Ashok Kumar!'),
  "Switching account to 'Ashok Kumar' immediately updates ExecutiveDashboard greeting"
);

// Test 5: Switching to Priya Sharma reflects Priya Sharma in Executive Dashboard
setAuthSession({ name: 'Priya Sharma', role: 'Executive' });
dashboardHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

assert(
  cleanHtml(dashboardHtml).includes('Welcome back, Priya Sharma!'),
  "Switching account to 'Priya Sharma' immediately updates ExecutiveDashboard greeting"
);

// -------------------------------------------------------------
// SUITE 3: NON-EXECUTIVE ROLE DASHBOARD (RoleDashboardContainer)
// -------------------------------------------------------------
console.log('\n👥 SUITE 3: Role-Specific Dashboard Welcome Banners');

// Test 6: SalesManager account shows SalesManager's name in RoleDashboardContainer
setAuthSession({ name: 'Marcus Vance', role: 'SalesManager' });
let roleDashHtml = renderToString(
  <AppProviders>
    <RoleDashboardContainer />
  </AppProviders>
);

assert(
  cleanHtml(roleDashHtml).includes('Welcome back, Marcus Vance!'),
  "RoleDashboardContainer displays 'Welcome back, Marcus Vance!' for SalesManager"
);

// Test 7: HRAdmin account shows HRAdmin's name in RoleDashboardContainer
setAuthSession({ name: 'Elena Rostova', role: 'HRAdmin' });
roleDashHtml = renderToString(
  <AppProviders>
    <RoleDashboardContainer />
  </AppProviders>
);

assert(
  cleanHtml(roleDashHtml).includes('Welcome back, Elena Rostova!'),
  "RoleDashboardContainer displays 'Welcome back, Elena Rostova!' for HRAdmin"
);

// -------------------------------------------------------------
// SUITE 4: MISSING, EMPTY, AND WHITESPACE NAME FALLBACKS
// -------------------------------------------------------------
console.log('\n🛡️ SUITE 4: Missing & Empty Name Handling Graceful Fallback');

// Test 8: Empty string name falls back to neutral 'there'
setAuthSession({ name: '', role: 'Executive' });
dashboardHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

assert(
  cleanHtml(dashboardHtml).includes('Welcome back, there!'),
  "Empty string user name gracefully falls back to 'Welcome back, there!'"
);

// Test 9: Whitespace-only name falls back to neutral 'there'
setAuthSession({ name: '   ', role: 'Executive' });
dashboardHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

assert(
  cleanHtml(dashboardHtml).includes('Welcome back, there!'),
  "Whitespace-only user name gracefully falls back to 'Welcome back, there!'"
);

// Test 10: Missing name property in RoleDashboardContainer falls back to 'there'
setAuthSession({ name: '', role: 'SalesManager' });
roleDashHtml = renderToString(
  <AppProviders>
    <RoleDashboardContainer />
  </AppProviders>
);

assert(
  cleanHtml(roleDashHtml).includes('Welcome back, there!'),
  "RoleDashboardContainer gracefully falls back to 'Welcome back, there!' when name is empty"
);

// -------------------------------------------------------------
// SUITE 5: SIGNED-OUT & UNAUTHENTICATED STATE PROTECTION
// -------------------------------------------------------------
console.log('\n🔒 SUITE 5: Signed-out & Unauthenticated Stale Data Prevention');

// Test 11: Signed out user does NOT see previous account's name
setAuthSession(null, false);
dashboardHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

assert(
  !cleanHtml(dashboardHtml).includes('Sarah Jenkins') &&
  !cleanHtml(dashboardHtml).includes('Ashok Kumar') &&
  !cleanHtml(dashboardHtml).includes('Marcus Vance') &&
  cleanHtml(dashboardHtml).includes('Welcome back, there!'),
  "Unauthenticated / signed-out state prevents showing stale data from previous account and shows 'Welcome back, there!'"
);

// -------------------------------------------------------------
// SUITE 6: DASHBOARD INTEGRITY & FUNCTIONALITY
// -------------------------------------------------------------
console.log('\n📊 SUITE 6: Dashboard Functional Integrity');

setAuthSession({ name: 'Sarah Jenkins', role: 'Executive' });
dashboardHtml = renderToString(
  <AppProviders>
    <ExecutiveDashboard />
  </AppProviders>
);

// Test 12: Fiscal Period widget intact
assert(
  dashboardHtml.includes('Fiscal Period:'),
  "Fiscal period indicator widget is preserved"
);

// Test 13: KPI card metrics intact
assert(
  dashboardHtml.includes('Total Revenue') && dashboardHtml.includes('1,48,35,000'),
  "Executive Dashboard KPI metrics and structure remain fully intact"
);

// Test 14: Hand wave emoji intact
assert(
  dashboardHtml.includes('👋'),
  "Welcome greeting hand wave emoji is preserved"
);

// -------------------------------------------------------------
// SUITE 7: REGRESSION TESTS FOR PRIOR BUGS (BUG-101 TO BUG-105)
// -------------------------------------------------------------
console.log('\n🔄 SUITE 7: Regression Tests (BUG-101 through BUG-105)');

const loginPageHtml = renderToString(
  <AppProviders>
    <LoginPage onNavigate={() => {}} />
  </AppProviders>
);

// Test 15: BUG-101 - Registration navigation link
assert(
  loginPageHtml.includes('href="/register"') &&
  (loginPageHtml.includes("Don&#x27;t have an account?") || loginPageHtml.includes("Don't have an account?")),
  "REGRESSION BUG-101: Registration navigation link to /register is preserved"
);

// Test 16: BUG-102 - Role dropdown with Executive & Super Admin
assert(
  loginPageHtml.includes('id="role-select"') &&
  loginPageHtml.includes('value="Executive"') &&
  loginPageHtml.includes('Super Admin'),
  "REGRESSION BUG-102: Role dropdown with Executive and Super Admin options is preserved"
);

// Test 17: BUG-103 - Password visibility toggle button
assert(
  loginPageHtml.includes('id="password-toggle-btn"') &&
  loginPageHtml.includes('type="button"') &&
  loginPageHtml.includes('aria-label="Show password"'),
  "REGRESSION BUG-103: Password visibility toggle button with type='button' and accessible label is preserved"
);

// Test 18: BUG-105 - Global search combobox in header
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

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n========================================================================');
console.log(`📊 TEST RESULTS: ${passCount} / ${totalTests} PASSED (${Math.round((passCount / totalTests) * 100)}%)`);
console.log('========================================================================');

if (passCount === totalTests) {
  console.log('✨ ALL DASHBOARD WELCOME NAME (BUG-106) & REGRESSION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error(`💥 ${totalTests - passCount} TEST(S) FAILED.\n`);
  process.exit(1);
}
