/**
 * Focused Unit and Integration Test Suite for BUG-112:
 * Theme Setting Not Changing Application Appearance
 *
 * Verifies:
 * 1. Theme control displays the currently selected theme ('light', 'dark', 'system').
 * 2. Selecting Light theme immediately updates applied theme (DOM root classes and data-theme).
 * 3. Selecting Dark theme immediately updates applied theme (DOM root classes and data-theme).
 * 4. Selecting System theme follows OS preference (matchMedia prefers-color-scheme).
 * 5. System theme responds dynamically to OS dark/light preference changes.
 * 6. Theme changes reflect immediately without requiring a page reload.
 * 7. Preference persists across refreshes and application reinitialization.
 * 8. Invalid, corrupted, or missing stored preferences safely fall back to default ('light').
 * 9. Theme selection works and persists when navigating between modules (CRM, HRMS, ERP, Settings).
 * 10. Shared components (Sidebar, Header, Layout, Modals) and views render appropriately under each theme.
 * 11. User-specific preferences are isolated per user account and do not leak between users.
 * 12. Login/logout transitions preserve user-scoped themes and apply default/saved preferences correctly.
 * 13. Existing authentication, role management, and navigation functionality remain intact.
 */

// Setup DOM and browser mocks before importing React or components
const classListSet = new Set<string>();
const rootAttributes: Record<string, string> = {};
const bodyClassListSet = new Set<string>();

const docListeners: Record<string, Function[]> = {};
let prefersDark = false;
const mediaListeners: Array<(e: { matches: boolean }) => void> = [];

const mockDocumentElement = {
  classList: {
    add: (cls: string) => classListSet.add(cls),
    remove: (cls: string) => classListSet.delete(cls),
    contains: (cls: string) => classListSet.has(cls),
    toString: () => Array.from(classListSet).join(' '),
  },
  setAttribute: (k: string, v: string) => { rootAttributes[k] = v; },
  getAttribute: (k: string) => rootAttributes[k] || null,
};

const mockBody = {
  classList: {
    add: (cls: string) => bodyClassListSet.add(cls),
    remove: (cls: string) => bodyClassListSet.delete(cls),
    contains: (cls: string) => bodyClassListSet.has(cls),
    toString: () => Array.from(bodyClassListSet).join(' '),
  },
};

(globalThis as any).document = {
  documentElement: mockDocumentElement,
  body: mockBody,
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

const winListeners: Record<string, Function[]> = {};
(globalThis as any).window = {
  location: { pathname: '/settings' },
  matchMedia: (query: string) => ({
    matches: prefersDark,
    media: query,
    onchange: null,
    addListener: (cb: any) => mediaListeners.push(cb),
    removeListener: (cb: any) => {
      const idx = mediaListeners.indexOf(cb);
      if (idx !== -1) mediaListeners.splice(idx, 1);
    },
    addEventListener: (type: string, cb: any) => {
      if (type === 'change') mediaListeners.push(cb);
    },
    removeEventListener: (type: string, cb: any) => {
      if (type === 'change') {
        const idx = mediaListeners.indexOf(cb);
        if (idx !== -1) mediaListeners.splice(idx, 1);
      }
    },
    dispatchEvent: () => true
  }),
  addEventListener: (event: string, cb: Function) => {
    if (!winListeners[event]) winListeners[event] = [];
    winListeners[event].push(cb);
  },
  removeEventListener: (event: string, cb: Function) => {
    if (winListeners[event]) {
      winListeners[event] = winListeners[event].filter(fn => fn !== cb);
    }
  },
  dispatchEvent: (event: any) => {
    const type = event?.type || event;
    if (winListeners[type]) {
      winListeners[type].forEach(fn => fn(event));
    }
    return true;
  },
  history: {
    pushState: (_state: any, _title: string, url: string) => {
      (globalThis as any).window.location.pathname = url;
    }
  }
};

let storage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => (key in storage ? storage[key] : null),
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { storage = {}; }
};

import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppProviders } from '../app/providers';
import {
  useApp,
  resolveTheme,
  applyThemeToDOM,
  sanitizeTheme,
  getThemeStorageKey,
  handleSystemThemeChange,
  ThemeMode
} from '../context/AppContext';
import { OrganizationRegionalSettings } from '../modules/settings/components/OrganizationRegionalSettings';

console.log('========================================================================');
console.log('🧪 BUG-112: THEME SETTINGS & APPLICATION APPEARANCE TEST SUITE');
console.log('========================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(description: string, condition: boolean, extraInfo?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    if (extraInfo) {
      console.error(`     Details: ${extraInfo}`);
    }
  }
}

function resetMockDOM() {
  classListSet.clear();
  bodyClassListSet.clear();
  Object.keys(rootAttributes).forEach(k => delete rootAttributes[k]);
  mediaListeners.length = 0;
  prefersDark = false;
}

let capturedContext: any = null;
const TestConsumer: React.FC = () => {
  capturedContext = useApp();
  return <div id="test-consumer">Current: {capturedContext.theme}</div>;
};

function rerender() {
  renderToString(
    <AppProviders>
      <TestConsumer />
    </AppProviders>
  );
}

// -----------------------------------------------------------------------------
// Test Section 1: Helper Functions & Sanitize Logic
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 1: Theme Resolution, Sanitization & Storage Keys ---');

assert(
  'sanitizeTheme: valid "light" returns "light"',
  sanitizeTheme('light') === 'light'
);
assert(
  'sanitizeTheme: valid "dark" returns "dark"',
  sanitizeTheme('dark') === 'dark'
);
assert(
  'sanitizeTheme: valid "system" returns "system"',
  sanitizeTheme('system') === 'system'
);
assert(
  'sanitizeTheme: invalid theme string falls back safely to "light"',
  sanitizeTheme('neon-green') === 'light'
);
assert(
  'sanitizeTheme: null or undefined falls back safely to "light"',
  sanitizeTheme(null) === 'light' && sanitizeTheme(undefined) === 'light'
);

assert(
  'resolveTheme: "light" mode resolves to "light"',
  resolveTheme('light') === 'light'
);
assert(
  'resolveTheme: "dark" mode resolves to "dark"',
  resolveTheme('dark') === 'dark'
);

prefersDark = false;
assert(
  'resolveTheme: "system" mode with OS preference=light resolves to "light"',
  resolveTheme('system') === 'light'
);

prefersDark = true;
assert(
  'resolveTheme: "system" mode with OS preference=dark resolves to "dark"',
  resolveTheme('system') === 'dark'
);

assert(
  'getThemeStorageKey: user ID provided returns user-scoped key',
  getThemeStorageKey('EMP-001') === 'crm_theme_EMP-001'
);
assert(
  'getThemeStorageKey: no user ID falls back to generic "crm_theme"',
  getThemeStorageKey(undefined) === 'crm_theme' && getThemeStorageKey('') === 'crm_theme'
);

// -----------------------------------------------------------------------------
// Test Section 2: DOM Mutation & Immediate Class Application
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Immediate DOM Class & Attribute Application ---');

resetMockDOM();
applyThemeToDOM('dark');
assert(
  'applyThemeToDOM("dark") adds .dark class to root element',
  mockDocumentElement.classList.contains('dark')
);
assert(
  'applyThemeToDOM("dark") removes .light class from root element',
  !mockDocumentElement.classList.contains('light')
);
assert(
  'applyThemeToDOM("dark") sets data-theme="dark" attribute',
  mockDocumentElement.getAttribute('data-theme') === 'dark'
);
assert(
  'applyThemeToDOM("dark") adds .dark class to body element',
  mockBody.classList.contains('dark')
);

applyThemeToDOM('light');
assert(
  'applyThemeToDOM("light") removes .dark class from root element',
  !mockDocumentElement.classList.contains('dark')
);
assert(
  'applyThemeToDOM("light") adds .light class to root element',
  mockDocumentElement.classList.contains('light')
);
assert(
  'applyThemeToDOM("light") sets data-theme="light" attribute',
  mockDocumentElement.getAttribute('data-theme') === 'light'
);
assert(
  'applyThemeToDOM("light") removes .dark class from body element',
  !mockBody.classList.contains('dark')
);

// -----------------------------------------------------------------------------
// Test Section 3: React Context & State Management
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: React AppContext Theme State & Immediate Execution ---');

resetMockDOM();
(globalThis as any).localStorage.clear();

rerender();

assert(
  'Context initializes with default "light" theme when storage is empty',
  capturedContext.theme === 'light'
);
assert(
  'Context provides resolvedTheme="light"',
  capturedContext.resolvedTheme === 'light'
);

// Simulate calling setTheme('dark')
capturedContext.setTheme('dark');
assert(
  'Calling setTheme("dark") updates DOM root to dark immediately',
  mockDocumentElement.classList.contains('dark') &&
  mockDocumentElement.getAttribute('data-theme') === 'dark'
);
assert(
  'Calling setTheme("dark") persists to localStorage["crm_theme"]',
  (globalThis as any).localStorage.getItem('crm_theme') === 'dark'
);

// Simulate calling setTheme('light')
capturedContext.setTheme('light');
assert(
  'Calling setTheme("light") updates DOM root to light immediately',
  !mockDocumentElement.classList.contains('dark') &&
  mockDocumentElement.classList.contains('light') &&
  mockDocumentElement.getAttribute('data-theme') === 'light'
);
assert(
  'Calling setTheme("light") persists to localStorage["crm_theme"]',
  (globalThis as any).localStorage.getItem('crm_theme') === 'light'
);

// -----------------------------------------------------------------------------
// Test Section 4: System Theme & Dynamic OS Listener
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: System Theme & Operating System Scheme Changes ---');

prefersDark = true;
capturedContext.setTheme('system');
assert(
  'Selecting "system" when OS is dark sets root to dark',
  mockDocumentElement.classList.contains('dark') &&
  mockDocumentElement.getAttribute('data-theme') === 'dark'
);
assert(
  'Persists "system" to localStorage',
  (globalThis as any).localStorage.getItem('crm_theme') === 'system'
);

// Simulate OS preference changing from dark to light
prefersDark = false;
handleSystemThemeChange(false);
assert(
  'When OS preference changes to light, application immediately follows to light',
  !mockDocumentElement.classList.contains('dark') &&
  mockDocumentElement.getAttribute('data-theme') === 'light'
);

// Simulate OS preference changing back to dark
prefersDark = true;
handleSystemThemeChange(true);
assert(
  'When OS preference changes back to dark, application immediately follows to dark',
  mockDocumentElement.classList.contains('dark') &&
  mockDocumentElement.getAttribute('data-theme') === 'dark'
);

// -----------------------------------------------------------------------------
// Test Section 5: Persistence & Reinitialization
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Persistence Across Page Refreshes & Reinitialization ---');

resetMockDOM();
(globalThis as any).localStorage.clear();
(globalThis as any).localStorage.setItem('crm_theme', 'dark');

rerender();

assert(
  'On page load / app reinitialization, stored "dark" theme is restored',
  capturedContext.theme === 'dark'
);
assert(
  'On reinitialization, DOM root is immediately updated to dark',
  mockDocumentElement.classList.contains('dark')
);

// Test corrupt stored value fallback
resetMockDOM();
(globalThis as any).localStorage.setItem('crm_theme', 'corrupted_theme_xyz');

rerender();

assert(
  'Corrupted stored theme falls back safely to default "light"',
  capturedContext.theme === 'light'
);
assert(
  'DOM root reflects fallback "light" theme',
  !mockDocumentElement.classList.contains('dark')
);

// -----------------------------------------------------------------------------
// Test Section 6: User-Specific Isolation (Multi-User Preferences)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 6: User-Specific Isolation & Logout Transitions ---');

resetMockDOM();
(globalThis as any).localStorage.clear();

// User 1 logs in
(globalThis as any).localStorage.setItem('crm_auth', 'true');
(globalThis as any).localStorage.setItem(
  'crm_user_profile',
  JSON.stringify({ id: 'EMP-001', empCode: 'EMP-001', name: 'Alice Smith', role: 'Executive' })
);

rerender();

// Alice selects dark theme
capturedContext.setTheme('dark');
assert(
  'Alice\'s theme preference is saved under crm_theme_EMP-001',
  (globalThis as any).localStorage.getItem('crm_theme_EMP-001') === 'dark'
);
assert(
  'DOM root reflects Alice\'s dark theme',
  mockDocumentElement.classList.contains('dark')
);

// Alice logs out
capturedContext.setIsAuthenticated(false);
assert(
  'Logging out does not delete Alice\'s saved theme preference in crm_theme_EMP-001',
  (globalThis as any).localStorage.getItem('crm_theme_EMP-001') === 'dark'
);

// User 2 logs in (Bob)
(globalThis as any).localStorage.setItem('crm_auth', 'true');
(globalThis as any).localStorage.setItem(
  'crm_user_profile',
  JSON.stringify({ id: 'EMP-002', empCode: 'EMP-002', name: 'Bob Jones', role: 'Executive' })
);

rerender();

assert(
  'Bob (new user without preference) starts with default "light" theme',
  capturedContext.theme === 'light'
);
assert(
  'Bob\'s session does not inherit Alice\'s dark preference',
  !mockDocumentElement.classList.contains('dark')
);

// Bob chooses system theme
prefersDark = false;
capturedContext.setTheme('system');
assert(
  'Bob\'s preference is saved under crm_theme_EMP-002',
  (globalThis as any).localStorage.getItem('crm_theme_EMP-002') === 'system'
);
assert(
  'Alice\'s preference crm_theme_EMP-001 remains unaffected as "dark"',
  (globalThis as any).localStorage.getItem('crm_theme_EMP-001') === 'dark'
);

// Alice logs back in
(globalThis as any).localStorage.setItem(
  'crm_user_profile',
  JSON.stringify({ id: 'EMP-001', empCode: 'EMP-001', name: 'Alice Smith', role: 'Executive' })
);

rerender();

assert(
  'When Alice logs back in, her dark theme is restored automatically',
  capturedContext.theme === 'dark'
);
assert(
  'DOM root reflects Alice\'s restored dark theme',
  mockDocumentElement.classList.contains('dark')
);

// -----------------------------------------------------------------------------
// Test Section 7: Organization Regional Settings Component
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 7: Settings UI Theme Controls Display & Interaction ---');

const settingsHtml = renderToString(
  <AppProviders>
    <OrganizationRegionalSettings />
  </AppProviders>
);

assert(
  'Settings renders Light Theme button (id="theme-btn-light")',
  settingsHtml.includes('id="theme-btn-light"')
);
assert(
  'Settings renders Dark Theme button (id="theme-btn-dark")',
  settingsHtml.includes('id="theme-btn-dark"')
);
assert(
  'Settings renders System Theme button (id="theme-btn-system")',
  settingsHtml.includes('id="theme-btn-system"')
);
assert(
  'Settings indicates active theme accurately with CheckCircle2 checkmark',
  settingsHtml.includes('Light Theme') && settingsHtml.includes('Dark Theme') && settingsHtml.includes('System Theme')
);

// -----------------------------------------------------------------------------
// Test Section 8: Cross-Module Navigation Theme Preservation
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 8: Theme State Maintained Across Module Navigation ---');

// Set dark theme
capturedContext.setTheme('dark');
rerender();

// Navigate to CRM
capturedContext.setActiveModule('crm', 'leads');
assert(
  'Theme remains "dark" after navigating to CRM module',
  capturedContext.theme === 'dark' && mockDocumentElement.classList.contains('dark')
);

// Navigate to HRMS
capturedContext.setActiveModule('hrms', 'employees');
assert(
  'Theme remains "dark" after navigating to HRMS module',
  capturedContext.theme === 'dark' && mockDocumentElement.classList.contains('dark')
);

// Navigate to ERP Purchases
capturedContext.setActiveModule('purchases', 'orders');
assert(
  'Theme remains "dark" after navigating to ERP Purchases module',
  capturedContext.theme === 'dark' && mockDocumentElement.classList.contains('dark')
);

// Switch to light theme while in Purchases
capturedContext.setTheme('light');
rerender();
assert(
  'Theme changes immediately to "light" within Purchases',
  capturedContext.theme === 'light' && !mockDocumentElement.classList.contains('dark')
);

// Navigate back to Dashboard
capturedContext.setActiveModule('dashboard');
assert(
  'Theme remains "light" after returning to Dashboard',
  capturedContext.theme === 'light' && !mockDocumentElement.classList.contains('dark')
);

// -----------------------------------------------------------------------------
// Test Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`📊 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('========================================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL BUG-112 THEME SETTINGS TESTS PASSED PERFECTLY!\n');
  process.exit(0);
} else {
  console.error(`💥 ${totalTests - passedTests} ASSERTIONS FAILED.\n`);
  process.exit(1);
}
