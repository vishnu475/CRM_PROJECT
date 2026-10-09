const http = require('http');
const { Pool } = require('pg');

const hrmsPool = new Pool({
  host: process.env.HRMS_DB_HOST || 'localhost',
  port: parseInt(process.env.HRMS_DB_PORT || '5432'),
  user: process.env.HRMS_DB_USER || 'postgres',
  password: process.env.HRMS_DB_PASSWORD || '1234',
  database: process.env.HRMS_DB_NAME || 'HRMS',
});

const crmPool = new Pool({
  host: process.env.CRM_DB_HOST || 'localhost',
  port: parseInt(process.env.CRM_DB_PORT || '5432'),
  user: process.env.CRM_DB_USER || 'postgres',
  password: process.env.CRM_DB_PASSWORD || '1234',
  database: process.env.CRM_DB_NAME || 'crm',
});

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING STEP 31 HRMS EMPLOYEE ASSIGNMENT TESTS ---');

  try {
    // 1. Ensure test HRMS employees exist: 1 Confirmed, 1 Probation, 1 Exited
    const confirmedEmpId = 'TEST-EMP-CONFIRMED-01';
    const probationEmpId = 'TEST-EMP-PROBATION-01';

    await hrmsPool.query(`
      INSERT INTO employees (id, emp_code, name, email, department, designation, status, joining_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, name = EXCLUDED.name, emp_code = EXCLUDED.emp_code
    `, [confirmedEmpId, 'EMP-C01', 'Alice Confirmed', 'alice.conf@test.com', 'Sales', 'Account Executive', 'Confirmed', '2023-01-15']);

    await hrmsPool.query(`
      INSERT INTO employees (id, emp_code, name, email, department, designation, status, joining_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, name = EXCLUDED.name, emp_code = EXCLUDED.emp_code
    `, [probationEmpId, 'EMP-P01', 'Bob Probation', 'bob.prob@test.com', 'Sales', 'Trainee', 'Probation', '2024-05-01']);

    console.log('✓ HRMS test employees prepared.');

    // 2. Test POST /api/leads with Confirmed Employee ID
    console.log('\n[Test 1] POST /api/leads with Confirmed Employee ID...');
    const postRes1 = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      name: 'Lead Alpha - Confirmed Owner',
      company: 'Alpha Corp',
      email: 'alpha@example.com',
      phone: '9876543210',
      assignedToEmployeeId: confirmedEmpId,
      assignedTo: 'Alice Confirmed',
      stage: 'New',
    });

    console.log(`Response status: ${postRes1.status}`);
    if (postRes1.status !== 201) {
      throw new Error(`Expected 201, got ${postRes1.status}: ${JSON.stringify(postRes1.data)}`);
    }
    const createdLead = postRes1.data.data || postRes1.data;
    const createdLeadId = createdLead.id;
    console.log(`Created Lead ID: ${createdLeadId}`);
    if (createdLead.assigned_to !== 'Alice Confirmed' && createdLead.assignedTo !== 'Alice Confirmed') {
      throw new Error(`Mismatch in created lead assigned_to: ${JSON.stringify(createdLead)}`);
    }
    console.log('✓ Test 1 Passed: Confirmed employee assignment succeeded.');

    // 3. Test POST /api/leads with Probation Employee ID (Should fail 400)
    console.log('\n[Test 2] POST /api/leads with Probation Employee ID (Should fail 400)...');
    const postRes2 = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      name: 'Lead Beta - Probation Owner',
      company: 'Beta Corp',
      email: 'beta@example.com',
      assignedToEmployeeId: probationEmpId,
    });

    console.log(`Response status: ${postRes2.status}, message: ${postRes2.data?.message}`);
    if (postRes2.status !== 400) {
      throw new Error(`Expected 400 for probation employee, got ${postRes2.status}`);
    }
    console.log('✓ Test 2 Passed: Non-confirmed employee assignment was properly rejected with 400.');

    // 4. Test POST /api/leads with Non-existent Employee ID (Should fail 400)
    console.log('\n[Test 3] POST /api/leads with Non-existent Employee ID (Should fail 400)...');
    const postRes3 = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      name: 'Lead Gamma - Fake Owner',
      company: 'Gamma Corp',
      email: 'gamma@example.com',
      assignedToEmployeeId: 'NON-EXISTENT-EMP-ID-999',
    });

    console.log(`Response status: ${postRes3.status}, message: ${postRes3.data?.message}`);
    if (postRes3.status !== 400) {
      throw new Error(`Expected 400 for fake employee, got ${postRes3.status}`);
    }
    console.log('✓ Test 3 Passed: Non-existent employee assignment was properly rejected with 400.');

    // 5. Test PUT /api/leads/:id with Confirmed Employee
    console.log('\n[Test 4] PUT /api/leads/:id with Confirmed Employee...');
    const putRes1 = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/leads/${createdLeadId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }, {
      assignedToEmployeeId: confirmedEmpId,
      requirement: 'Updated enterprise qualification',
      budget: 500000,
    });

    console.log(`Response status: ${putRes1.status}`);
    if (putRes1.status !== 200) {
      throw new Error(`Expected 200, got ${putRes1.status}: ${JSON.stringify(putRes1.data)}`);
    }
    console.log('✓ Test 4 Passed: Lead update with Confirmed employee succeeded.');

    // 6. Test PUT /api/leads/:id with Probation Employee (Should fail 400)
    console.log('\n[Test 5] PUT /api/leads/:id with Probation Employee (Should fail 400)...');
    const putRes2 = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/leads/${createdLeadId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }, {
      assignedToEmployeeId: probationEmpId,
    });

    console.log(`Response status: ${putRes2.status}, message: ${putRes2.data?.message}`);
    if (putRes2.status !== 400) {
      throw new Error(`Expected 400 for probation employee on PUT, got ${putRes2.status}`);
    }
    console.log('✓ Test 5 Passed: Lead update with invalid employee was rejected with 400.');

    // 7. Verify Database persistence directly
    console.log('\n[Test 6] Verifying CRM Database persistence...');
    const dbRes = await crmPool.query('SELECT id, name, assigned_to, assigned_to_employee_id FROM leads WHERE id = $1', [createdLeadId]);
    const leadRow = dbRes.rows[0];
    console.log('DB Row:', leadRow);
    if (!leadRow || (leadRow.assigned_to_employee_id !== confirmedEmpId && leadRow.assigned_to_employee_id !== 'EMP-C01') || leadRow.assigned_to !== 'Alice Confirmed') {
      throw new Error(`DB verification failed: ${JSON.stringify(leadRow)}`);
    }
    console.log('✓ Test 6 Passed: Lead correctly persisted in CRM DB with assigned_to_employee_id.');

    // Clean up test data
    await crmPool.query('DELETE FROM leads WHERE id = $1', [createdLeadId]);
    await hrmsPool.query('DELETE FROM employees WHERE id IN ($1, $2)', [confirmedEmpId, probationEmpId]);
    console.log('\n✓ Cleaned up test leads and HRMS test records.');

    console.log('\n========================================');
    console.log('ALL STEP 31 HRMS ASSIGNMENT TESTS PASSED');
    console.log('========================================');
  } catch (err) {
    console.error('TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    await hrmsPool.end();
    await crmPool.end();
  }
}

runTests();
