import assert from 'assert';
import { hrmsPool } from './db/pool.js';
import { getNextEmployeeSequence, syncEmployeeSequence } from './utils/employeeIdGenerator.js';

const BACKEND_URL = 'http://localhost:5000';

async function runAcceptanceTest() {
  console.log('========================================================================');
  console.log('🎯 HRMS EMPLOYEE MASTER ACCEPTANCE TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;
  function check(desc, cond) {
    total++;
    if (cond) {
      console.log(`✅ [Test ${total} Passed]: ${desc}`);
      passed++;
    } else {
      console.error(`❌ [Test ${total} Failed]: ${desc}`);
      throw new Error(`Assertion failed for: ${desc}`);
    }
  }

  // Pre-cleanup in case of previous run
  await hrmsPool.query("DELETE FROM employees WHERE id IN ('EMP-019', 'EMP-020')");
  await hrmsPool.query("DELETE FROM employee_onboarding WHERE employee_id IN ('EMP-019', 'EMP-020')");
  await hrmsPool.query("DELETE FROM leave_balances WHERE employee_id IN ('EMP-019', 'EMP-020')");
  await hrmsPool.query("DELETE FROM shift_rosters WHERE employee_id IN ('EMP-019', 'EMP-020')");
  await hrmsPool.query("UPDATE number_sequences SET current_value = 18 WHERE id = 'seq-emp'");

  // 1. Initial State & Numerical Order
  console.log('--- 1. Testing Current Employees Numerical Ordering & Missing EMP-007 ---');
  const res1 = await fetch(`${BACKEND_URL}/api/employees`);
  const json1 = await res1.json();
  check('GET /api/employees returns success', res1.status === 200 && json1.success);
  
  const employees = json1.data;
  console.log(`Loaded ${employees.length} employees from DB.`);
  
  // Verify strict numerical ordering
  let isSorted = true;
  for (let i = 0; i < employees.length - 1; i++) {
    const a = parseInt((employees[i].emp_code || employees[i].id).replace(/\D/g, ''), 10);
    const b = parseInt((employees[i + 1].emp_code || employees[i + 1].id).replace(/\D/g, ''), 10);
    if (a > b) {
      isSorted = false;
      break;
    }
  }
  check('Employees are sorted strictly in numerical order by ID', isSorted);

  // Verify missing EMP-007 is NOT present
  const hasEmp7 = employees.some(e => e.id === 'EMP-007' || e.emp_code === 'EMP-007');
  check('EMP-007 does NOT exist in the database (strictly preserved gap)', !hasEmp7);

  // 2. Sequential ID Generation (MAX + 1)
  console.log('\n--- 2. Testing Sequential ID Generation (MAX + 1) ---');
  const nextRes = await fetch(`${BACKEND_URL}/api/employees/next-id`);
  const nextJson = await nextRes.json();
  check('GET /api/employees/next-id returns success', nextJson.success);
  
  const expectedNextNum = employees.reduce((max, e) => {
    const num = parseInt((e.emp_code || e.id).replace(/\D/g, ''), 10);
    return num > max ? num : max;
  }, 0) + 1;
  const expectedNextCode = `EMP-${String(expectedNextNum).padStart(3, '0')}`;

  check(`Next ID is strictly MAX + 1: ${expectedNextCode} (Number: ${expectedNextNum})`, nextJson.nextNumber === expectedNextNum && nextJson.nextEmpCode === expectedNextCode);
  check('Sequence preview is idempotent (does not mutate sequence counter)', nextJson.lastNumber === expectedNextNum - 1);

  // 3. New Employee Registration Flow (Default Status: Joined)
  console.log('\n--- 3. Testing New Employee Registration Flow ---');
  const testPin = '9182';
  const createRes = await fetch(`${BACKEND_URL}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dynamic Lifecycle Test Employee',
      email: `lifecycle.test.${Date.now()}@company.com`,
      phone: '+91 99887 76655',
      department: 'Engineering',
      designation: 'Staff Software Architect',
      salary: 1600000,
      annualSalary: 1600000,
      pin: testPin
    })
  });
  const createJson = await createRes.json();
  check('POST /api/employees returns 201 Created', createRes.status === 201 && createJson.success);
  check(`Backend generated and returned sequential ID: ${expectedNextCode}`, createJson.employeeId === expectedNextCode);
  check('Initial lifecycle status is "Joined"', createJson.status === 'Joined');

  // 4. Dynamic Lifecycle Filtering: Joined vs Confirmed
  console.log('\n--- 4. Testing Dynamic Lifecycle Filtering ---');
  const joinedRes = await fetch(`${BACKEND_URL}/api/employees?stage=Joined`);
  const joinedJson = await joinedRes.json();
  const inJoined = joinedJson.data.some(e => e.id === expectedNextCode || e.emp_code === expectedNextCode);
  check(`New employee ${expectedNextCode} appears in "Joined" section`, inJoined);

  const confirmedRes = await fetch(`${BACKEND_URL}/api/employees?stage=Confirmed`);
  const confirmedJson = await confirmedRes.json();
  const inConfirmed = confirmedJson.data.some(e => e.id === expectedNextCode || e.emp_code === expectedNextCode);
  check(`New employee ${expectedNextCode} does NOT appear in "Confirmed" section while in Joined status`, !inConfirmed);

  // 5. In-Place Lifecycle Movement (Joined -> Confirmed)
  console.log('\n--- 5. Testing In-Place Lifecycle Movement (Joined -> Confirmed) ---');
  const patchStatusRes = await fetch(`${BACKEND_URL}/api/employees/${expectedNextCode}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Confirmed', reason: 'Probation period completed successfully' })
  });
  const patchStatusJson = await patchStatusRes.json();
  check('PATCH /api/employees/:id/status returns 200', patchStatusRes.status === 200 && patchStatusJson.success);
  check(`Employee ID remains strictly ${expectedNextCode} after status update`, patchStatusJson.employeeId === expectedNextCode);
  check('Lifecycle status updated to "Confirmed"', patchStatusJson.status === 'Confirmed');

  // Verify filtering reflects status change
  const joinedRes2 = await fetch(`${BACKEND_URL}/api/employees?stage=Joined`);
  const joinedJson2 = await joinedRes2.json();
  const inJoined2 = joinedJson2.data.some(e => e.id === expectedNextCode || e.emp_code === expectedNextCode);
  check(`Employee ${expectedNextCode} no longer appears in "Joined" section`, !inJoined2);

  const confirmedRes2 = await fetch(`${BACKEND_URL}/api/employees?stage=Confirmed`);
  const confirmedJson2 = await confirmedRes2.json();
  const inConfirmed2 = confirmedJson2.data.some(e => e.id === expectedNextCode || e.emp_code === expectedNextCode);
  check(`Employee ${expectedNextCode} now appears in "Confirmed" section`, inConfirmed2);

  // Verify database consistency: NO duplicate records created
  const dbEmpCheck = await hrmsPool.query('SELECT id, emp_code, name, status FROM employees WHERE id = $1 OR emp_code = $1', [expectedNextCode]);
  check(`Database contains exactly ONE record for ${expectedNextCode}`, dbEmpCheck.rows.length === 1 && dbEmpCheck.rows[0].status === 'Confirmed');

  // 6. Creating Next Employee strictly gets MAX + 1
  console.log('\n--- 6. Creating Next Employee (Must assign MAX + 1) ---');
  const createRes2 = await fetch(`${BACKEND_URL}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Second Test Employee',
      email: `second.test.${Date.now()}@company.com`,
      department: 'Engineering',
      designation: 'Backend Developer',
      salary: 1200000,
      annualSalary: 1200000,
      pin: '1234'
    })
  });
  const createJson2 = await createRes2.json();
  const secondExpectedNum = expectedNextNum + 1;
  const secondExpectedCode = `EMP-${String(secondExpectedNum).padStart(3, '0')}`;
  check(`Second new employee assigned exact sequential ID: ${secondExpectedCode}`, createJson2.employeeId === secondExpectedCode);

  // 7. Status Movement to Exited & Login Prohibition
  console.log('\n--- 7. Testing Exited Status & Login Prohibition ---');
  const patchExitRes = await fetch(`${BACKEND_URL}/api/employees/${expectedNextCode}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Exited', reason: 'Resignation' })
  });
  const patchExitJson = await patchExitRes.json();
  check(`Status updated to "Exited" for ${expectedNextCode}`, patchExitJson.status === 'Exited');

  // Attempt login while Exited -> Must fail
  const exitLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: expectedNextCode, pin: testPin })
  });
  const exitLoginJson = await exitLoginRes.json();
  check('Exited employee cannot login (rejected with 401)', exitLoginRes.status === 401 && exitLoginJson.success === false);

  // Re-activate employee to Active
  await fetch(`${BACKEND_URL}/api/employees/${expectedNextCode}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Active' })
  });

  // 8. Authentication & Credentials Validation
  console.log('\n--- 8. Testing Authentication & Credentials Validation ---');
  // Login with correct PIN and formatted code
  const loginGoodCode = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: expectedNextCode, pin: testPin })
  });
  const loginGoodCodeJson = await loginGoodCode.json();
  check(`Login with ${expectedNextCode} + valid PIN succeeds and returns token`, loginGoodCode.status === 200 && loginGoodCodeJson.token);

  // Login with correct PIN and pure numeric ID
  const loginGoodNum = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: String(expectedNextNum), pin: testPin })
  });
  const loginGoodNumJson = await loginGoodNum.json();
  check(`Login with numeric ID "${expectedNextNum}" + valid PIN succeeds`, loginGoodNum.status === 200 && loginGoodNumJson.token);

  // Login via alias endpoint /api/auth/employee/login
  const loginAliasRes = await fetch(`${BACKEND_URL}/api/auth/employee/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: expectedNextCode, pin: testPin })
  });
  const loginAliasJson = await loginAliasRes.json();
  check(`Login via /api/auth/employee/login succeeds`, loginAliasRes.status === 200 && loginAliasJson.token);

  // Login with non-existing EMP-007
  const loginMissing7 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: 'EMP-007', pin: '1234' })
  });
  const loginMissing7Json = await loginMissing7.json();
  check('Login with missing EMP-007 returns 401 "Employee ID does not exist. Please enter a valid Employee ID."',
    loginMissing7.status === 401 && loginMissing7Json.message === 'Employee ID does not exist. Please enter a valid Employee ID.'
  );

  // Login with non-existing numeric 7
  const loginMissingNum7 = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '7', pin: '1234' })
  });
  const loginMissingNum7Json = await loginMissingNum7.json();
  check('Login with missing numeric ID 7 returns 401 "Employee ID does not exist. Please enter a valid Employee ID."',
    loginMissingNum7.status === 401 && loginMissingNum7Json.message === 'Employee ID does not exist. Please enter a valid Employee ID.'
  );

  // Login with wrong PIN
  const loginWrongPin = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: expectedNextCode, pin: '000000' })
  });
  const loginWrongPinJson = await loginWrongPin.json();
  check('Login with wrong PIN returns 401 "Invalid credentials"',
    loginWrongPin.status === 401 && loginWrongPinJson.message === 'Invalid credentials'
  );

  // 9. Single Employee Lookup & Profile Routing APIs
  console.log('\n--- 9. Testing Profile & Single Employee Lookup APIs ---');
  const getByIdRes = await fetch(`${BACKEND_URL}/api/employees/${expectedNextCode}`);
  const getByIdJson = await getByIdRes.json();
  check(`GET /api/employees/${expectedNextCode} returns employee profile`, getByIdRes.status === 200 && getByIdJson.data?.emp_code === expectedNextCode);

  const getByNumRes = await fetch(`${BACKEND_URL}/api/employees/${expectedNextNum}`);
  const getByNumJson = await getByNumRes.json();
  check(`GET /api/employees/${expectedNextNum} returns employee profile`, getByNumRes.status === 200 && (getByNumJson.data?.emp_code === expectedNextCode || getByNumJson.data?.id === expectedNextCode));

  const fullReportRes = await fetch(`${BACKEND_URL}/api/hrms/employees/${expectedNextCode}/full-report`);
  const fullReportJson = await fullReportRes.json();
  if (!fullReportJson.success) {
    console.error('fullReport failed:', fullReportRes.status, fullReportJson);
  }
  check(`GET /api/hrms/employees/${expectedNextCode}/full-report returns complete data`, fullReportRes.status === 200 && fullReportJson.success);

  const fullReportNumRes = await fetch(`${BACKEND_URL}/api/hrms/employees/${expectedNextNum}/full-report`);
  const fullReportNumJson = await fullReportNumRes.json();
  check(`GET /api/hrms/employees/${expectedNextNum}/full-report returns complete data`, fullReportNumRes.status === 200 && fullReportNumJson.success);

  // 10. Cleanup Test Records
  console.log('\n--- 10. Cleaning Up Test Employee Records ---');
  await hrmsPool.query('DELETE FROM employees WHERE id IN ($1, $2)', [expectedNextCode, secondExpectedCode]);
  await hrmsPool.query('DELETE FROM employee_onboarding WHERE employee_id IN ($1, $2)', [expectedNextCode, secondExpectedCode]);
  await hrmsPool.query('DELETE FROM leave_balances WHERE employee_id IN ($1, $2)', [expectedNextCode, secondExpectedCode]);
  await hrmsPool.query('DELETE FROM shift_rosters WHERE employee_id IN ($1, $2)', [expectedNextCode, secondExpectedCode]);
  await hrmsPool.query("UPDATE number_sequences SET current_value = $1 WHERE id = 'seq-emp'", [expectedNextNum - 1]);
  console.log(`Cleaned up test records ${expectedNextCode}, ${secondExpectedCode} and reset sequence tracker to ${expectedNextNum - 1}.`);

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passed}/${total} ACCEPTANCE TESTS PASSED SUCCESSFULLY!`);
  console.log('========================================================================\n');
  process.exit(0);
}

runAcceptanceTest().catch(err => {
  console.error('\n❌ ACCEPTANCE TEST SUITE FAILED:', err);
  process.exit(1);
});
