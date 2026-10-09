const http = require('http');
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api/crm/activities';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runStep25ActivitiesTests() {
  console.log('========================================================');
  console.log('🧪 STEP 25 — CRM ACTIVITIES TEST SUITE');
  console.log('========================================================\n');

  let testActId1 = `ACT-TEST-${Date.now()}-1`;
  let testActId2 = `ACT-TEST-${Date.now()}-2`;
  let testActId3 = `ACT-TEST-${Date.now()}-3`;

  try {
    // Test 1: GET /api/crm/activities
    console.log('Test 1: Fetching initial activities list...');
    const listRes = await request('GET', '/api/crm/activities');
    assert.strictEqual(listRes.status, 200, `Expected 200, got ${listRes.status}`);
    assert.strictEqual(listRes.body.success, true, 'Expected success: true');
    assert(Array.isArray(listRes.body.data), 'Expected data to be an array');
    console.log(`✅ Test 1 Passed: Retrieved ${listRes.body.data.length} activities.\n`);

    // Test 2: POST /api/crm/activities - Create standard Call activity
    console.log('Test 2: Creating a new Call activity...');
    const createRes1 = await request('POST', '/api/crm/activities', {
      id: testActId1,
      title: 'Follow-up Call with Apex Solutions',
      type: 'Call',
      purpose: 'Follow-up',
      relatedTo: 'Apex Cloud Solutions',
      assignedTo: 'Sarah Jenkins',
      dueDate: '2026-09-15',
      priority: 'Medium',
      status: 'Pending',
      outcome: 'Discussed next steps and roadmap',
    });
    assert.strictEqual(createRes1.status, 201, `Expected 201, got ${createRes1.status}`);
    assert.strictEqual(createRes1.body.data.id, testActId1);
    assert.strictEqual(createRes1.body.data.purpose, 'Follow-up');
    console.log('✅ Test 2 Passed: Standard activity created successfully.\n');

    // Test 3: POST /api/crm/activities - Create Negotiation interaction for Lead workflow
    console.log('Test 3: Creating a Negotiation interaction...');
    const createRes2 = await request('POST', '/api/crm/activities', {
      id: testActId2,
      title: 'Proposal Pricing Negotiation',
      type: 'Meeting',
      purpose: 'Negotiation',
      relatedTo: 'Enterprise CRM Rollout',
      assignedTo: 'David Miller',
      dueDate: '2026-09-10',
      priority: 'High',
      status: 'Completed',
      outcome: 'Customer requested a 10% discount on implementation fees',
    });
    assert.strictEqual(createRes2.status, 201, `Expected 201, got ${createRes2.status}`);
    assert.strictEqual(createRes2.body.data.purpose, 'Negotiation');
    assert.strictEqual(createRes2.body.data.status, 'Completed');
    console.log('✅ Test 3 Passed: Negotiation activity created and marked Completed.\n');

    // Test 4: PATCH /api/crm/activities/:id - Update status, outcome, and fields
    console.log('Test 4: Updating activity via PATCH...');
    const updateRes = await request('PATCH', `/api/crm/activities/${testActId1}`, {
      status: 'Completed',
      outcome: 'Client approved the timeline and agreed to sign agreement',
      priority: 'High',
    });
    assert.strictEqual(updateRes.status, 200, `Expected 200, got ${updateRes.status}`);
    assert.strictEqual(updateRes.body.data.status, 'Completed');
    assert.strictEqual(updateRes.body.data.outcome, 'Client approved the timeline and agreed to sign agreement');
    assert.strictEqual(updateRes.body.data.priority, 'High');
    console.log('✅ Test 4 Passed: Activity updated successfully via PATCH.\n');

    // Test 5: POST /api/crm/activities - Create Customer Acceptance activity
    console.log('Test 5: Creating Customer Acceptance activity...');
    const createRes3 = await request('POST', '/api/crm/activities', {
      id: testActId3,
      title: 'Customer Signed Contract Confirmation',
      type: 'Meeting',
      purpose: 'Customer Acceptance',
      relatedTo: 'Apex Cloud Solutions',
      assignedTo: 'Sarah Jenkins',
      dueDate: '2026-09-10',
      priority: 'High',
      status: 'Completed',
      outcome: 'Contract signed and agreement finalized with VP of Engineering',
    });
    assert.strictEqual(createRes3.status, 201, `Expected 201, got ${createRes3.status}`);
    assert.strictEqual(createRes3.body.data.purpose, 'Customer Acceptance');
    console.log('✅ Test 5 Passed: Customer acceptance activity created.\n');

    // Test 6: DELETE /api/crm/activities/:id
    console.log('Test 6: Deleting activity...');
    const delRes1 = await request('DELETE', `/api/crm/activities/${testActId1}`);
    assert.strictEqual(delRes1.status, 200, `Expected 200, got ${delRes1.status}`);
    assert.strictEqual(delRes1.body.success, true);

    const delRes2 = await request('DELETE', `/api/crm/activities/${testActId2}`);
    assert.strictEqual(delRes2.status, 200);

    const delRes3 = await request('DELETE', `/api/crm/activities/${testActId3}`);
    assert.strictEqual(delRes3.status, 200);
    console.log('✅ Test 6 Passed: Activities deleted cleanly.\n');

    console.log('========================================================');
    console.log('🎉 ALL STEP 25 CRM ACTIVITIES TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runStep25ActivitiesTests();
