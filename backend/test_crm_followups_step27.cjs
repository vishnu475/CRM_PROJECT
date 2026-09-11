const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- RUNNING CRM FOLLOW-UPS STEP 27 TESTS ---');

  // 1. GET follow-ups list
  console.log('1. Testing GET /api/crm/followups...');
  const listRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/crm/followups',
    method: 'GET'
  });
  console.log(`GET /api/crm/followups returned status ${listRes.status}, count: ${Array.isArray(listRes.data) ? listRes.data.length : 'invalid'}`);
  if (listRes.status !== 200) {
    throw new Error(`Expected 200, got ${listRes.status}`);
  }

  // 2. CREATE a new follow-up
  console.log('\n2. Testing POST /api/crm/followups...');
  const newFollowUp = {
    title: 'Test Step 27 Follow-up Action',
    action: 'Test Step 27 Follow-up Action',
    related_entity: 'lead',
    due_date: '2026-09-15',
    due_time: '14:30',
    priority: 'high',
    assigned_to: 'Sarah Jenkins',
    reminder: '1_hour_before',
    notes: 'Discuss enterprise contract terms and SLA pricing tiers.',
    status: 'scheduled'
  };

  const createRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/crm/followups',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, newFollowUp);

  console.log(`POST /api/crm/followups returned status ${createRes.status}`);
  const createdRecord = createRes.data?.data || createRes.data;
  console.log('Created record:', createdRecord);
  if (createRes.status !== 201 || !createdRecord || !createdRecord.id) {
    throw new Error(`Failed to create follow-up: ${JSON.stringify(createRes)}`);
  }

  const createdId = createdRecord.id;

  // 3. UPDATE / RESCHEDULE follow-up
  console.log('\n3. Testing PATCH /api/crm/followups/:id (Reschedule)...');
  const updateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/crm/followups/${createdId}`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, {
    due_date: '2026-09-18',
    due_time: '16:00',
    priority: 'urgent',
    notes: 'Rescheduled: Decision maker requested Friday afternoon slot.'
  });

  console.log(`PATCH /api/crm/followups/${createdId} returned status ${updateRes.status}`);
  const updatedRecord = updateRes.data?.data || updateRes.data;
  console.log('Updated record:', updatedRecord);
  if (updateRes.status !== 200 || updatedRecord.due_date !== '2026-09-18' || updatedRecord.priority !== 'urgent') {
    throw new Error(`Failed to update follow-up: ${JSON.stringify(updateRes)}`);
  }

  // 4. MARK COMPLETED
  console.log('\n4. Testing PATCH /api/crm/followups/:id (Mark Completed)...');
  const completeRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/crm/followups/${createdId}`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, {
    status: 'completed',
    completed_at: new Date().toISOString()
  });

  console.log(`PATCH status to completed returned status ${completeRes.status}`);
  const completedRecord = completeRes.data?.data || completeRes.data;
  console.log('Completed record:', completedRecord);
  if (completeRes.status !== 200 || completedRecord.status !== 'completed') {
    throw new Error(`Failed to mark follow-up completed: ${JSON.stringify(completeRes)}`);
  }

  // 5. DELETE follow-up
  console.log('\n5. Testing DELETE /api/crm/followups/:id...');
  const deleteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/crm/followups/${createdId}`,
    method: 'DELETE'
  });

  console.log(`DELETE /api/crm/followups/${createdId} returned status ${deleteRes.status}`);
  if (deleteRes.status !== 200) {
    throw new Error(`Failed to delete follow-up: ${JSON.stringify(deleteRes)}`);
  }

  console.log('\n--- ALL STEP 27 CRM FOLLOW-UPS TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
