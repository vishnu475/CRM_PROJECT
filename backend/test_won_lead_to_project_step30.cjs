/**
 * test_won_lead_to_project_step30.cjs
 * Comprehensive test suite for STEP 30 — Won Lead -> Project Flow with Create-or-Reuse Logic
 */

const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => (resData += chunk));
      res.on('end', () => {
        try {
          const json = resData ? JSON.parse(resData) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runStep30Tests() {
  console.log('========================================================');
  console.log('🧪 STEP 30 — WON LEAD TO PROJECT CREATE-OR-REUSE TEST SUITE');
  console.log('========================================================\n');

  const ts = Date.now();

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Non-Won Lead (Blocked)
    // -------------------------------------------------------------
    console.log('1. Testing non-Won lead rejection...');
    const leadQualifiedId = `LD-QUAL-${ts}`;
    await request('POST', '/api/leads', {
      id: leadQualifiedId,
      name: 'Bruce Wayne',
      company: 'Wayne Enterprises',
      email: `bruce.${ts}@wayne.com`,
      phone: '9876543210',
      value: 500000,
      stage: 'Qualified',
      requirement: 'Security and Surveillance Software Implementation',
    });

    const nonWonProj = await request('POST', `/api/projects/from-lead/${leadQualifiedId}`, {
      name: 'Wayne Security Project',
      client: 'Wayne Enterprises',
    });

    if (nonWonProj.status === 400 && nonWonProj.data.message === 'Only Won Leads can create a Project.') {
      console.log('✅ Non-Won lead correctly rejected with status 400.');
    } else {
      throw new Error(`Expected status 400 for non-Won lead, got ${nonWonProj.status}: ${JSON.stringify(nonWonProj.data)}`);
    }

    // -------------------------------------------------------------
    // SCENARIO 2: Won Lead with NO prior Customer / Contact / Opportunity (Full Auto-Creation)
    // -------------------------------------------------------------
    console.log('\n2. Testing Won Lead with No Customer/Contact/Opportunity (Full Auto-Creation)...');
    const leadUnconvertedId = `LD-WON-NEW-${ts}`;
    await request('POST', '/api/leads', {
      id: leadUnconvertedId,
      name: 'Clark Kent',
      company: `Daily Planet Media ${ts}`,
      email: `clark.${ts}@dailyplanet.com`,
      phone: '9876543211',
      value: 750000,
      finalAgreedAmount: 750000,
      stage: 'Won',
      wonDate: '2026-09-08',
      requirement: 'Full Newsroom CMS and Editorial Workflow System',
      assignedTo: 'Sarah Jenkins',
    });

    const createProjRes1 = await request('POST', `/api/projects/from-lead/${leadUnconvertedId}`, {
      name: `Daily Planet Media ${ts} - Newsroom CMS`,
      budget: 750000,
      priority: 'High',
    });

    if (createProjRes1.status !== 201) {
      throw new Error(`Expected 201 from project creation, got ${createProjRes1.status}: ${JSON.stringify(createProjRes1.data)}`);
    }

    const proj1 = createProjRes1.data.data;
    const cust1Id = createProjRes1.data.customerId;
    const cont1Id = createProjRes1.data.contactId;
    const opp1Id = createProjRes1.data.opportunityId;

    if (!cust1Id || !cont1Id || !opp1Id || !proj1.id) {
      throw new Error(`Missing generated IDs in response: ${JSON.stringify(createProjRes1.data)}`);
    }
    console.log(`✅ Project created: ${proj1.id}, Auto-created Customer: ${cust1Id}, Contact: ${cont1Id}, Opportunity: ${opp1Id}`);

    // Verify Lead was updated
    const leadCheck1 = await request('GET', `/api/leads/${leadUnconvertedId}`);
    const updatedLead1 = leadCheck1.data.data;
    if (updatedLead1.is_project_created && updatedLead1.project_id === proj1.id && updatedLead1.is_converted && updatedLead1.converted_to_customer_id === cust1Id) {
      console.log('✅ Lead properly updated with project_id and converted references!');
    } else {
      throw new Error(`Lead update verification failed: ${JSON.stringify(updatedLead1)}`);
    }

    // -------------------------------------------------------------
    // SCENARIO 3: Duplicate Project creation on same lead (Blocked)
    // -------------------------------------------------------------
    console.log('\n3. Testing Duplicate Project creation on same lead...');
    const dupRes = await request('POST', `/api/projects/from-lead/${leadUnconvertedId}`, {
      name: 'Duplicate Daily Planet Project',
    });

    if (dupRes.status === 400 && dupRes.data.message === 'This Won Lead already has a Project.') {
      console.log('✅ Duplicate project creation correctly rejected with status 400.');
    } else {
      throw new Error(`Expected status 400 for duplicate project, got ${dupRes.status}: ${JSON.stringify(dupRes.data)}`);
    }

    // -------------------------------------------------------------
    // SCENARIO 4: Won Lead with EXISTING Customer (Reused without duplication)
    // -------------------------------------------------------------
    console.log('\n4. Testing Won Lead with Existing Customer (Reused without duplicate Customer)...');
    const existingCustId = `CUST-EXIST-${ts}`;
    await request('POST', '/api/customers', {
      id: existingCustId,
      customerName: `LexCorp Industries ${ts}`,
      contactEmail: `lex.${ts}@lexcorp.com`,
      ownerId: 'Sarah Jenkins',
    });

    const leadExistingCustId = `LD-WON-LEX-${ts}`;
    await request('POST', '/api/leads', {
      id: leadExistingCustId,
      name: 'Lex Luthor',
      company: `LexCorp Industries ${ts}`,
      email: `lex.${ts}@lexcorp.com`,
      phone: '9876543212',
      value: 1500000,
      stage: 'Won',
      wonDate: '2026-09-09',
      requirement: 'Defense Systems Cloud Infrastructure',
      assignedTo: 'Sarah Jenkins',
      convertedToCustomerId: existingCustId,
    });

    const createProjRes2 = await request('POST', `/api/projects/from-lead/${leadExistingCustId}`, {
      name: `LexCorp Industries ${ts} - Defense Cloud`,
      budget: 1500000,
    });

    if (createProjRes2.status !== 201) {
      throw new Error(`Expected 201, got ${createProjRes2.status}: ${JSON.stringify(createProjRes2.data)}`);
    }

    if (createProjRes2.data.customerId === existingCustId) {
      console.log(`✅ Existing Customer ${existingCustId} correctly reused!`);
    } else {
      throw new Error(`Customer reuse mismatch: expected ${existingCustId}, got ${createProjRes2.data.customerId}`);
    }

    // Check customer count to guarantee no duplicate
    const allCusts = await request('GET', '/api/customers');
    const matchingCusts = allCusts.data.data.filter(c => c.customer_name === `LexCorp Industries ${ts}`);
    if (matchingCusts.length === 1) {
      console.log('✅ Verified: Exactly 1 Customer record exists for LexCorp (No duplicate created)!');
    } else {
      throw new Error(`Duplicate Customer detected! Count: ${matchingCusts.length}`);
    }

    // -------------------------------------------------------------
    // SCENARIO 5: Clean up test records
    // -------------------------------------------------------------
    console.log('\n5. Cleaning up test data...');
    if (proj1?.id) await request('DELETE', `/api/projects/${proj1.id}`);
    if (createProjRes2.data?.data?.id) await request('DELETE', `/api/projects/${createProjRes2.data.data.id}`);
    await request('DELETE', `/api/leads/${leadQualifiedId}`);
    await request('DELETE', `/api/leads/${leadUnconvertedId}`);
    await request('DELETE', `/api/leads/${leadExistingCustId}`);
    await request('DELETE', `/api/customers/${existingCustId}`);
    if (cust1Id) await request('DELETE', `/api/customers/${cust1Id}`);

    console.log('\n========================================================');
    console.log('🎉 ALL STEP 30 CREATE-OR-REUSE TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Step 30 Test Failed:', err);
    process.exit(1);
  }
}

runStep30Tests();
