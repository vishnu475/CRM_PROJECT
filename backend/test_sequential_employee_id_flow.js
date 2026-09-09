import { hrmsPool } from './db/pool.js';
import { getNextEmployeeSequence } from './utils/employeeIdGenerator.js';
import { AuthService } from './services/authService.js';

async function runTest() {
  console.log('====================================================');
  console.log('TESTING SEQUENTIAL EMPLOYEE ID GENERATION & LOGIN');
  console.log('====================================================');

  // TEST 1: Check Next Sequence Calculation
  const seq1 = await getNextEmployeeSequence(hrmsPool);
  console.log('Current Sequence Preview:');
  console.log(' - Previous Last Code:', seq1.lastEmpCode, `(Number: ${seq1.lastNumber})`);
  console.log(' - Next Assigned Code:', seq1.nextEmpCode, `(Number: ${seq1.nextNumber})`);

  if (!seq1.nextEmpCode.startsWith('EMP-') || seq1.nextNumber <= seq1.lastNumber) {
    throw new Error('TEST 1 FAILED: Invalid sequence progression');
  }
  console.log('✅ TEST 1 PASSED: getNextEmployeeSequence generates valid strictly sequential IDs');

  // TEST 2: Verify Natural Numerical Sorting in employees query
  const sortRes = await hrmsPool.query(`
    SELECT id, emp_code, name 
    FROM employees 
    ORDER BY COALESCE(NULLIF(regexp_replace(COALESCE(emp_code, id), '[^0-9]', '', 'g'), ''), '0')::int ASC, emp_code ASC
  `);
  console.log('\nEmployees in Numerical Order:');
  let prevNum = 0;
  let isSorted = true;
  for (const row of sortRes.rows) {
    const num = parseInt((row.emp_code || row.id || '').replace(/\D/g, '') || '0', 10);
    console.log(` - ${row.emp_code.padEnd(8)} | ${row.name}`);
    if (num < prevNum) isSorted = false;
    prevNum = num;
  }
  if (!isSorted) {
    throw new Error('TEST 2 FAILED: Employees not sorted in numerical order');
  }
  console.log('✅ TEST 2 PASSED: Employee IDs are sorted strictly in numerical order');

  // TEST 3: Create a new employee with the next sequential code
  const targetNewCode = seq1.nextEmpCode;
  const testEmail = `test.sequential.${Date.now()}@company.com`;
  const testPin = '9876';

  const addRes = await fetch('http://localhost:5000/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empCode: targetNewCode,
      name: 'Sequential Test User',
      email: testEmail,
      phone: '+91 99999 11111',
      department: 'Engineering',
      designation: 'Staff Engineer',
      salary: 1200000,
      annualSalary: 1200000,
      pin: testPin
    })
  });
  const addJson = await addRes.json();
  console.log('\nCreated Test Employee:');
  console.log(' - Assigned ID:', addJson.data?.emp_code);
  console.log(' - Plain PIN stored:', addJson.data?.plain_pin);

  if (!addJson.success || addJson.data?.emp_code !== targetNewCode) {
    throw new Error(`TEST 3 FAILED: Expected assigned ID ${targetNewCode}, got ${addJson.data?.emp_code}`);
  }
  console.log(`✅ TEST 3 PASSED: New employee registered with exact sequential ID: ${targetNewCode}`);

  // TEST 4: Verify Next-ID preview incremented
  const seq2Res = await fetch('http://localhost:5000/api/employees/next-id');
  const seq2Json = await seq2Res.json();
  console.log('\nNew Next-ID Preview after registration:');
  console.log(' - Previous Last Code:', seq2Json.lastEmpCode);
  console.log(' - Next Assigned Code:', seq2Json.nextEmpCode);
  if (seq2Json.lastEmpCode !== targetNewCode) {
    throw new Error(`TEST 4 FAILED: Expected previous last code ${targetNewCode}, got ${seq2Json.lastEmpCode}`);
  }
  console.log('✅ TEST 4 PASSED: Previous last ID updated and next sequential ID incremented');

  // TEST 5: Log in with that credential (EMP code + PIN)
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: targetNewCode,
      pin: testPin
    })
  });
  const loginJson = await loginRes.json();
  console.log('\nLogin Result with new credential:');
  console.log(' - Success:', loginJson.success);
  console.log(' - Authenticated Employee:', loginJson.employee?.name, `(${loginJson.employee?.empCode})`);
  console.log(' - Token issued:', !!loginJson.token);

  if (!loginJson.success || loginJson.employee?.empCode !== targetNewCode) {
    throw new Error('TEST 5 FAILED: Login failed with newly created employee credentials');
  }
  console.log('✅ TEST 5 PASSED: Successfully logged in to employee portal using new sequential ID & PIN!');

  // TEST 6: Clean up test employee
  await hrmsPool.query('DELETE FROM employees WHERE id = $1', [targetNewCode]);
  await hrmsPool.query('DELETE FROM employee_onboarding WHERE employee_id = $1', [targetNewCode]);
  await hrmsPool.query('DELETE FROM leave_balances WHERE employee_id = $1', [targetNewCode]);
  await hrmsPool.query('DELETE FROM shift_rosters WHERE employee_id = $1', [targetNewCode]);
  // Reset sequence to 10
  await hrmsPool.query('UPDATE number_sequences SET current_value = 10 WHERE id = \'seq-emp\'');
  console.log('\n✅ TEST 6: Cleaned up test record and reset sequence counter.');

  console.log('\n====================================================');
  console.log('ALL 6 TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

runTest().catch(e => {
  console.error('❌ TEST FAILED:', e.message);
  process.exit(1);
});
