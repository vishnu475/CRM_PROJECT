/**
 * Verification Test Suite for Top-Right Sign Out Button
 */

// Setup DOM and browser mocks before importing React or components
const classListSet = new Set<string>();
const rootAttributes: Record<string, string> = {};
const bodyClassListSet = new Set<string>();
const docListeners: Record<string, Function[]> = {};

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
  dispatchEvent: (event: { type: string; key?: string }) => {
    if (docListeners[event.type]) {
      docListeners[event.type].forEach(fn => fn(event));
    }
  },
};

(globalThis as any).window = {
  innerWidth: 1366,
  innerHeight: 768,
  location: { pathname: '/dashboard', href: 'http://localhost:3000/dashboard' },
  history: { pushState: () => {} },
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
};

(globalThis as any).localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, val: string) { this.store[key] = String(val); },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; }
};

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Header } from '../components/layout/Header';
import { AppProvider } from '../context/AppContext';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('Top-Right Sign Out Button Verification Test Suite');
console.log('======================================================\n');

// 1. Static HTML Render Verification
console.log('--- Section 1: Header Top-Right Sign Out Button Rendering ---');
const headerHTML = ReactDOMServer.renderToString(
  <AppProvider>
    <Header />
  </AppProvider>
);

assert(
  headerHTML.includes('id="header-signout-btn"'),
  'Header renders sign out button with id="header-signout-btn"'
);

assert(
  headerHTML.includes('title="Sign Out"'),
  'Sign out button includes title="Sign Out"'
);

assert(
  headerHTML.includes('aria-label="Sign Out"'),
  'Sign out button includes accessible aria-label="Sign Out"'
);

assert(
  headerHTML.includes('Sign Out</span>'),
  'Sign out button renders "Sign Out" text label'
);

assert(
  headerHTML.includes('hidden sm:inline'),
  'Sign out button label uses responsive "hidden sm:inline" to avoid mobile clutter'
);

assert(
  headerHTML.includes('lucide-log-out') || headerHTML.includes('LogOut') || headerHTML.includes('stroke="currentColor"'),
  'Sign out button renders SVG logout icon'
);

// 2. Theme Compatibility Verification
console.log('\n--- Section 2: Dark Mode & Theme Compatibility ---');
assert(
  headerHTML.includes('dark:bg-rose-950') && headerHTML.includes('dark:text-rose-400'),
  'Sign out button includes dark mode rose theme classes'
);

// 3. Source Code Inspection for Token Clearing and Logout Logic
console.log('\n--- Section 3: Logout Logic & Session Clearing ---');
const headerPath = fs.existsSync(path.resolve('frontend/src/components/layout/Header.tsx'))
  ? path.resolve('frontend/src/components/layout/Header.tsx')
  : path.resolve('src/components/layout/Header.tsx');
const headerSource = fs.readFileSync(headerPath, 'utf-8');

assert(
  headerSource.includes('setIsAuthenticated(false)'),
  'Sign out click handler invokes setIsAuthenticated(false)'
);

assert(
  headerSource.includes('localStorage.removeItem("crm_token")') || headerSource.includes("localStorage.removeItem('crm_token')"),
  'Sign out click handler clears crm_token from localStorage'
);

assert(
  headerSource.includes('localStorage.removeItem("crm_auth")') || headerSource.includes("localStorage.removeItem('crm_auth')"),
  'Sign out click handler clears crm_auth from localStorage'
);

assert(
  headerSource.includes('window.history.pushState({}, "", "/login")') || headerSource.includes("window.history.pushState({}, '', '/login')"),
  'Sign out click handler redirects user to /login route'
);

console.log('\n======================================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('======================================================\n');

if (failed > 0) process.exitCode = 1;
