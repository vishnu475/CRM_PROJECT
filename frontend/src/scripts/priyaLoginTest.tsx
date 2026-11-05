/**
 * Verification Suite for Priya Sharma's Login Fix
 */

// Setup mock window and localStorage for headless Node environment
if (typeof (globalThis as any).window === 'undefined') {
  const listeners: Record<string, Function[]> = {};
  (globalThis as any).window = {
    location: { pathname: '/login' },
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

if (typeof (globalThis as any).localStorage === 'undefined') {
  const storage: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, val: string) => { storage[key] = val; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };
}

import React from 'react';
import { renderToString } from 'react-dom/server';
import { LoginPage } from '../components/auth/LoginPage';
import { AppProviders } from '../app/providers';

const BASE_URL = 'http://localhost:5000/api';

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
console.log('Priya Sharma (EMP-003) Login & RBAC Verification Suite');
console.log('======================================================\n');

// Suite 1: Frontend Role Dropdown & Quick Access Rendering
console.log('--- Suite 1: Frontend Dropdown & Quick Access Button ---');
const html = renderToString(
  <AppProviders>
    <LoginPage onNavigate={() => {}} />
  </AppProviders>
);

assert(
  html.includes('value="HRAdmin"') && html.includes('>HR Lead / HR Admin<'),
  'Role dropdown contains "HR Lead / HR Admin" option'
);

assert(
  !html.includes('Priya Sharma') && !html.includes('Sarah Jenkins'),
  'Sarah Jenkins and Priya Sharma quick access cards are removed from login page'
);

// Suite 2: Live Backend Authentication for Priya Sharma
async function runLiveAuthTests() {
  console.log('\n--- Suite 2: Live Backend Authentication Tests ---');

  // Test 1: Priya Sharma login with role 'HRAdmin'
  const res1 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-003', pin: '1234', role: 'HRAdmin' }),
  });
  const data1 = await res1.json();
  assert(
    res1.status === 200 && data1.success === true && data1.employee?.role === 'HRAdmin',
    'Priya Sharma authenticates successfully with role "HRAdmin"',
    `Status: ${res1.status}, msg: ${data1.message}`
  );
  assert(
    data1.employee?.name === 'Priya Sharma' && data1.employee?.department === 'HR',
    'Priya Sharma employee profile returned accurately from PostgreSQL'
  );

  // Test 2: Priya Sharma login with role 'Executive' (should not fail with 403)
  const res2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-003', pin: '1234', role: 'Executive' }),
  });
  const data2 = await res2.json();
  assert(
    res2.status === 200 && data2.success === true && data2.employee?.role === 'HRAdmin',
    'Priya Sharma authenticates without 403 error even if "Executive" role was selected in dropdown',
    `Status: ${res2.status}, msg: ${data2.message}`
  );

  // Test 3: Priya Sharma login with email instead of employee ID
  const res3 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'priya.sharma@company.com', pin: '1234', role: 'HRAdmin' }),
  });
  const data3 = await res3.json();
  assert(
    res3.status === 200 && data3.success === true,
    'Priya Sharma authenticates with corporate email address'
  );

  // Test 4: Regular Employee cannot escalate to Executive (privilege escalation blocked)
  const res4 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-008', pin: '1234', role: 'Executive' }),
  });
  assert(
    res4.status === 403,
    'Regular employee (EMP-008) is still strictly blocked from escalating to Executive (HTTP 403)'
  );

  // Test 5: Regular Employee cannot escalate to HRAdmin
  const res5 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-008', pin: '1234', role: 'HRAdmin' }),
  });
  assert(
    res5.status === 403,
    'Regular employee (EMP-008) is strictly blocked from escalating to HRAdmin (HTTP 403)'
  );

  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');
  if (failed > 0) process.exitCode = 1;
}

runLiveAuthTests();
