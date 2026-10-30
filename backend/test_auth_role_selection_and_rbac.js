/**
 * Focused Backend RBAC & Role Selection Test Suite for BUG-102
 * Validates:
 * 1. Valid Executive login with role: 'Executive'
 * 2. Valid Executive login with role: 'Super Admin'
 * 3. Valid Employee login with role: 'Employee'
 * 4. Executive login selecting 'Employee' for ESS mode
 * 5. Rejection of unauthorized privilege escalation (Employee -> Executive)
 * 6. Rejection of unauthorized privilege escalation (Employee -> Super Admin)
 * 7. Backward compatibility for login requests without role property
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

let totalTests = 0;
let passCount = 0;

function assert(condition, testName, detail) {
  totalTests++;
  if (condition) {
    passCount++;
    console.log(`  ✅ TEST ${totalTests} PASSED: ${testName}`);
  } else {
    console.error(`  ❌ TEST ${totalTests} FAILED: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

async function runRbacTestSuite() {
  console.log('========================================================================');
  console.log('🧪 BUG-102: BACKEND RBAC ROLE SELECTION & PRIVILEGE ESCALATION SUITE');
  console.log('========================================================================\n');

  // Test 1: Executive login with role: 'Executive'
  console.log('📦 GROUP 1: Authorized Executive & Super Admin Login');
  const res1 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'admin@company.com', pin: 'admin@123', role: 'Executive' })
  });
  const data1 = await res1.json();
  assert(
    res1.status === 200 && data1.success === true && data1.employee?.role === 'Executive',
    "Executive account authenticates with role 'Executive'",
    `Status: ${res1.status}, data: ${JSON.stringify(data1)}`
  );

  // Test 2: Executive login with role: 'Super Admin'
  const res2 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'admin@company.com', pin: 'admin@123', role: 'Super Admin' })
  });
  const data2 = await res2.json();
  assert(
    res2.status === 200 && data2.success === true && data2.employee?.role === 'Executive',
    "Executive account authenticates with role 'Super Admin'",
    `Status: ${res2.status}, data: ${JSON.stringify(data2)}`
  );

  // Test 3: Employee login with role: 'Employee'
  console.log('\n📦 GROUP 2: Authorized Employee Self-Service Login');
  const res3 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '8', pin: '1234', role: 'Employee' })
  });
  const data3 = await res3.json();
  assert(
    res3.status === 200 && data3.success === true && data3.employee?.role === 'Employee',
    "Employee account authenticates with role 'Employee'",
    `Status: ${res3.status}, data: ${JSON.stringify(data3)}`
  );

  // Test 4: Executive login selecting 'Employee' for ESS mode
  const res4 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'admin@company.com', pin: 'admin@123', role: 'Employee' })
  });
  const data4 = await res4.json();
  assert(
    res4.status === 200 && data4.success === true && data4.employee?.role === 'Employee',
    "Executive account can access ESS mode by selecting 'Employee'",
    `Status: ${res4.status}, data: ${JSON.stringify(data4)}`
  );

  // Test 5: Rejection of unauthorized privilege escalation: Employee -> Executive
  console.log('\n📦 GROUP 3: Unauthorized Privilege Escalation Prevention');
  const res5 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '8', pin: '1234', role: 'Executive' })
  });
  const data5 = await res5.json();
  assert(
    res5.status === 403 && data5.success === false && data5.message?.includes('Executive / Super Admin privileges'),
    "Employee requesting 'Executive' role is rejected with 403 Forbidden",
    `Status: ${res5.status}, message: ${data5.message}`
  );

  // Test 6: Rejection of unauthorized privilege escalation: Employee -> Super Admin
  const res6 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-008', pin: '1234', role: 'Super Admin' })
  });
  const data6 = await res6.json();
  assert(
    res6.status === 403 && data6.success === false && data6.message?.includes('Executive / Super Admin privileges'),
    "Employee requesting 'Super Admin' role is rejected with 403 Forbidden",
    `Status: ${res6.status}, message: ${data6.message}`
  );

  // Test 7: Backward compatibility: login request without role property
  console.log('\n📦 GROUP 4: Backward Compatibility');
  const res7 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '8', pin: '1234' })
  });
  const data7 = await res7.json();
  assert(
    res7.status === 200 && data7.success === true && data7.employee?.empCode === 'EMP-008',
    "Legacy login without 'role' property continues to succeed seamlessly",
    `Status: ${res7.status}, data: ${JSON.stringify(data7)}`
  );

  console.log('\n========================================================================');
  console.log(`🎉 TEST SUMMARY: ${passCount} / ${totalTests} TESTS PASSED (${Math.round((passCount / totalTests) * 100)}% SUCCESS RATE)`);
  console.log('========================================================================\n');

  if (passCount !== totalTests) {
    process.exit(1);
  }
}

runRbacTestSuite().catch(err => {
  console.error('Fatal error running RBAC test suite:', err);
  process.exit(1);
});
