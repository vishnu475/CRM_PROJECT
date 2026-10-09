import { hrmsPool } from './db/pool.js';
import { getNextEmployeeSequence } from './utils/employeeIdGenerator.js';
import { AuthService } from './services/authService.js';

const BACKEND_URL = 'http://localhost:5000';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('🎯 COMPREHENSIVE TEST SUITE: EMPLOYEE LOGIN & SEQUENTIAL ID GENERATION');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(message);
    }
    passedTests++;
    console.log(`✅ PASSED [Test ${totalTests}]: ${message}`);
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: REJECTION OF NON-EXISTING EMPLOYEE IDS
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Non-Existing Employee Login (Must reject with exact error message) ---');

  // Case 1A: Numeric '7' (which does NOT exist in the database)
  const res1A = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '7', pin: '1234' })
  });
  const json1A = await res1A.json();
  assert(
    res1A.status === 401 && json1A.success === false && json1A.message === 'Employee ID does not exist. Please enter a valid Employee ID.',
    `Login with Employee ID 7 returns 401 and "Employee ID does not exist. Please enter a valid Employee ID." (Got: ${res1A.status}, "${json1A.message}")`
  );

  // Case 1B: Formatted 'EMP-007'
  const res1B = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-007', pin: '1234' })
  });
  const json1B = await res1B.json();
  assert(
    res1B.status === 401 && json1B.success === false && json1B.message === 'Employee ID does not exist. Please enter a valid Employee ID.',
    `Login with EMP-007 returns 401 and "Employee ID does not exist. Please enter a valid Employee ID."`
  );

  // Case 1C: Random Non-existing ID '9999'
  const res1C = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '9999', pin: '1234' })
  });
  const json1C = await res1C.json();
  assert(
    res1C.status === 401 && json1C.success === false && json1C.message === 'Employee ID does not exist. Please enter a valid Employee ID.',
    `Login with Employee ID 9999 returns 401 and "Employee ID does not exist. Please enter a valid Employee ID."`
  );

  // -------------------------------------------------------------
  // TEST GROUP 2: CREDENTIAL VALIDATION FOR REAL EMPLOYEES
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Credentials Validation For Real Database Employees ---');

  // Case 2A: Existing Employee ID '8' (Ramesh) with WRONG PIN
  const res2A = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '8', pin: 'wrongpin99' })
  });
  const json2A = await res2A.json();
  assert(
    res2A.status === 401 && json2A.success === false && json2A.message === 'Invalid credentials',
    `Login with existing ID 8 and wrong PIN returns 401 and "Invalid credentials"`
  );

  // Case 2B: Existing Employee ID 'EMP-008' with WRONG PIN
  const res2B = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-008', pin: 'badcred' })
  });
  const json2B = await res2B.json();
  assert(
    res2B.status === 401 && json2B.success === false && json2B.message === 'Invalid credentials',
    `Login with existing EMP-008 and wrong PIN returns 401 and "Invalid credentials"`
  );

  // Case 2C: Existing Employee ID '8' with CORRECT PIN
  const res2C = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '8', pin: '1234' })
  });
  const json2C = await res2C.json();
  assert(
    res2C.status === 200 && json2C.success === true && json2C.employee?.empCode === 'EMP-008' && !!json2C.token,
    `Login with numeric ID 8 and correct PIN succeeds, returns token and employee EMP-008 (${json2C.employee?.name})`
  );

  // Case 2D: Existing Employee ID 'EMP-008' with CORRECT PIN
  const res2D = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-008', pin: '1234' })
  });
  const json2D = await res2D.json();
  assert(
    res2D.status === 200 && json2D.success === true && json2D.employee?.empCode === 'EMP-008' && !!json2D.token,
    `Login with formatted ID EMP-008 and correct PIN succeeds`
  );

  // -------------------------------------------------------------
  // TEST GROUP 3: SEQUENTIAL ID GENERATION LOGIC (MAX + 1)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Sequential ID Generation Logic (MAX + 1) ---');

  // Preview next sequence
  const seqPreview1 = await getNextEmployeeSequence(hrmsPool);
  const currentMax = seqPreview1.lastNumber;
  const expectedNext = currentMax + 1;
  const expectedNextCode = `EMP-${String(expectedNext).padStart(3, '0')}`;
  console.log(`Current DB highest ID: ${seqPreview1.lastEmpCode} (${seqPreview1.lastNumber}), Next sequential ID: ${seqPreview1.nextEmpCode} (${seqPreview1.nextNumber})`);
  
  assert(
    seqPreview1.lastNumber === currentMax && seqPreview1.nextNumber === expectedNext && seqPreview1.nextEmpCode === expectedNextCode,
    `Sequential generator correctly identifies highest ID as ${currentMax} and next as ${expectedNext} (${expectedNextCode}), skipping missing 7 without reusing it`
  );

  // Calling preview multiple times must NOT advance the counter
  const seqPreview2 = await getNextEmployeeSequence(hrmsPool);
  const seqPreview3 = await getNextEmployeeSequence(hrmsPool);
  assert(
    seqPreview2.nextNumber === expectedNext && seqPreview3.nextNumber === expectedNext,
    `Calling preview multiple times is idempotent and does not artificially inflate the sequence counter`
  );

  // -------------------------------------------------------------
  // TEST GROUP 4: NEW EMPLOYEE REGISTRATION -> LOGIN FLOW
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Registration -> Login Flow ---');

  const newEmpCode = seqPreview1.nextEmpCode;
  const newEmpPin = '7890';
  const newEmpEmail = `test.emp.${Date.now()}@company.com`;

  // Step 4A: Create employee record
  const createRes = await fetch(`${BACKEND_URL}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empCode: newEmpCode,
      name: 'Dynamic Sequential Test Employee',
      email: newEmpEmail,
      phone: '+91 91234 56789',
      department: 'Engineering',
      designation: 'Staff Software Engineer',
      salary: 1500000,
      annualSalary: 1500000,
      pin: newEmpPin
    })
  });
  const createJson = await createRes.json();
  assert(
    createRes.status === 201 && createJson.success === true && createJson.data?.emp_code === newEmpCode,
    `New employee registered with auto-assigned sequential ID: ${newEmpCode}`
  );

  // Step 4B: Verify next-id preview incremented
  const seqAfterCreate = await getNextEmployeeSequence(hrmsPool);
  const afterNext = expectedNext + 1;
  const afterNextCode = `EMP-${String(afterNext).padStart(3, '0')}`;
  assert(
    seqAfterCreate.lastNumber === expectedNext && seqAfterCreate.nextNumber === afterNext && seqAfterCreate.nextEmpCode === afterNextCode,
    `Next ID preview updated: Last is now ${expectedNext} (${newEmpCode}), Next is ${afterNext} (${afterNextCode})`
  );

  // Step 4C: Log in with newly registered employee credentials using pure number
  const numericId = String(expectedNext);
  const loginNewNumRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: numericId, pin: newEmpPin })
  });
  const loginNewNumJson = await loginNewNumRes.json();
  assert(
    loginNewNumRes.status === 200 && loginNewNumJson.success === true && loginNewNumJson.employee?.empCode === newEmpCode,
    `Newly created employee can log in immediately using numeric ID ${numericId} and assigned PIN`
  );

  // Step 4D: Log in with newly registered employee credentials using formatted code
  const loginNewCodeRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: newEmpCode, pin: newEmpPin })
  });
  const loginNewCodeJson = await loginNewCodeRes.json();
  assert(
    loginNewCodeRes.status === 200 && loginNewCodeJson.success === true && loginNewCodeJson.employee?.empCode === newEmpCode,
    `Newly created employee can log in immediately using ${newEmpCode} and assigned PIN`
  );

  // Step 4E: Wrong PIN for newly created employee must be rejected
  const loginNewWrongPin = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: newEmpCode, pin: '0000' })
  });
  const loginNewWrongJson = await loginNewWrongPin.json();
  assert(
    loginNewWrongPin.status === 401 && loginNewWrongJson.message === 'Invalid credentials',
    `Newly created employee login with wrong PIN is rejected with 401 "Invalid credentials"`
  );

  // -------------------------------------------------------------
  // TEST GROUP 5: CLEANUP & SEQUENCE RESET
  // -------------------------------------------------------------
  console.log('\n--- 5. Cleanup Test Employee Record ---');
  await hrmsPool.query('DELETE FROM employees WHERE id = $1', [newEmpCode]);
  await hrmsPool.query('DELETE FROM employee_onboarding WHERE employee_id = $1', [newEmpCode]);
  await hrmsPool.query('DELETE FROM leave_balances WHERE employee_id = $1', [newEmpCode]);
  await hrmsPool.query('DELETE FROM shift_rosters WHERE employee_id = $1', [newEmpCode]);
  await hrmsPool.query("UPDATE number_sequences SET current_value = $1 WHERE id = 'seq-emp'", [currentMax]);
  console.log(`✅ Cleaned up ${newEmpCode} and reset sequence counter to ${currentMax}.`);

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('========================================================================\n');
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED WITH EXCEPTION:', err);
  process.exit(1);
});
