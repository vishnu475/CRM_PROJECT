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
  console.log('========================================================');
  console.log('🧪 STEP 28 — CONNECT WON LEAD TO PROJECT TEST SUITE');
  console.log('========================================================\n');

  const timestamp = Date.now();

  // 1. Create a Non-Won Lead (Qualified stage)
  console.log('1. Creating a Qualified (non-won) test Lead...');
  const lead1Res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/leads',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: `LD-QUAL-${timestamp}`,
    name: 'Robert Vance',
    company: 'Vance Refrigeration',
    email: `robert.${timestamp}@vancerefrig.com`,
    phone: '9876543210',
    stage: 'Qualified',
    value: 500000,
    requirement: 'Cold storage monitoring ERP solution'
  });

  console.log(`Lead 1 created status: ${lead1Res.status}`);
  if (lead1Res.status !== 201) {
    throw new Error(`Failed to create qualified lead: ${JSON.stringify(lead1Res)}`);
  }

  // 2. Attempt to create project from Qualified Lead -> MUST BE BLOCKED (400)
  console.log('\n2. Testing blocked project creation from Qualified lead (business rule)...');
  const blockedRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Vance Refrigeration - Cold Storage Monitoring',
    client: 'Vance Refrigeration',
    sourceLeadId: `LD-QUAL-${timestamp}`,
    budget: 500000,
  });

  console.log(`Attempt from Qualified lead returned status: ${blockedRes.status}`);
  console.log('Response payload:', blockedRes.data);
  if (blockedRes.status !== 400 || blockedRes.data.success !== false) {
    throw new Error(`Expected 400 rejection for non-won lead, but got ${blockedRes.status}`);
  }
  console.log('✅ Non-won lead correctly blocked from project creation!');

  // 3. Create a Won Lead
  console.log('\n3. Creating a Won test Lead...');
  const leadWonRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/leads',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: `LD-WON-${timestamp}`,
    name: 'Arthur Dent',
    company: 'Magrathea Planetary Systems',
    email: `arthur.${timestamp}@magrathea.com`,
    phone: '9988776655',
    stage: 'Won',
    value: 1250000,
    finalAgreedAmount: 1200000,
    wonDate: '2026-09-08',
    requirement: 'Full ERP & HRMS Cloud Implementation across 3 planets with custom billing',
    notes: 'Approved during final executive review meeting. Kickoff targeted for mid-September.',
    expectedCloseDate: '2026-12-31'
  });

  console.log(`Won Lead created status: ${leadWonRes.status}`);
  if (leadWonRes.status !== 201) {
    throw new Error(`Failed to create won lead: ${JSON.stringify(leadWonRes)}`);
  }

  // 4. Create Project from Won Lead
  console.log('\n4. Creating Project from Won Lead...');
  const projectCreateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Magrathea Planetary Systems - Full ERP and HRMS Cloud Implementation',
    client: 'Magrathea Planetary Systems',
    sourceLeadId: `LD-WON-${timestamp}`,
    projectRequirement: 'Full ERP & HRMS Cloud Implementation across 3 planets with custom billing',
    projectNotes: 'Approved during final executive review meeting. Kickoff targeted for mid-September.',
    projectManager: 'Sarah Jenkins',
    startDate: '2026-09-08',
    endDate: '2026-12-31',
    budget: 1200000,
    priority: 'High',
    status: 'Not Started'
  });

  console.log(`Project created status: ${projectCreateRes.status}`);
  console.log('Created project record:', projectCreateRes.data);
  if (projectCreateRes.status !== 201 || !projectCreateRes.data.data?.id) {
    throw new Error(`Failed to create project from won lead: ${JSON.stringify(projectCreateRes)}`);
  }

  const createdProjectId = projectCreateRes.data.data.id;
  console.log(`✅ Project created with ID: ${createdProjectId}`);

  // 5. Verify Lead was updated and preserved
  console.log('\n5. Verifying Won Lead status and project reference...');
  const leadCheck = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/leads/LD-WON-${timestamp}`,
    method: 'GET'
  });

  console.log('Lead record after project creation:', leadCheck.data);
  const leadData = leadCheck.data.data;
  if (!leadData || leadData.stage !== 'Won') {
    throw new Error('Lead stage was altered or lead missing!');
  }
  if (leadData.project_id !== createdProjectId || leadData.is_project_created !== true) {
    throw new Error(`Lead project reference not updated: project_id=${leadData.project_id}, is_project_created=${leadData.is_project_created}`);
  }
  console.log('✅ Won Lead remains intact with project_id and is_project_created=true!');

  // 6. Verify duplicate project creation on same Won Lead is blocked
  console.log('\n6. Testing duplicate project creation prevention on same Won lead...');
  const duplicateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Magrathea Planetary Systems - Duplicate Attempt',
    client: 'Magrathea Planetary Systems',
    sourceLeadId: `LD-WON-${timestamp}`,
    budget: 1200000,
  });

  console.log(`Duplicate creation attempt status: ${duplicateRes.status}`);
  console.log('Duplicate response:', duplicateRes.data);
  if (duplicateRes.status !== 400 || duplicateRes.data.success !== false) {
    throw new Error(`Expected 400 rejection for duplicate project creation, but got ${duplicateRes.status}`);
  }
  console.log('✅ Duplicate project creation correctly blocked!');

  // 7. Clean up
  console.log('\n7. Cleaning up test data...');
  await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${createdProjectId}`,
    method: 'DELETE'
  });
  await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/leads/LD-QUAL-${timestamp}`,
    method: 'DELETE'
  });
  await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/leads/LD-WON-${timestamp}`,
    method: 'DELETE'
  });

  console.log('\n========================================================');
  console.log('🎉 ALL STEP 28 LEAD TO PROJECT TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
