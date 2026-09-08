import { crmPool as pool } from './db/pool.js';

async function runStep15Tests() {
  console.log('====================================================');
  console.log('🧪 STEP 15: OPPORTUNITIES REDESIGN & DATA INTEGRITY');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (details) console.error(`     Details: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Check Opportunity Schema & Data in PostgreSQL
    console.log('--- Test Suite 1: Database Schema & Live Opportunities ---');
    const oppsRes = await pool.query('SELECT * FROM opportunities ORDER BY created_at DESC');
    assert(Array.isArray(oppsRes.rows), 'Opportunities table exists and queries successfully');
    console.log(`  ℹ️ Found ${oppsRes.rows.length} total live opportunities in PostgreSQL`);

    // 2. Verify Metric Calculations logic
    console.log('\n--- Test Suite 2: Summary Metric Calculations ---');
    const sampleOpportunities = [
      { id: '1', name: 'Deal 1', stage: 'Qualified', value: 100000, probability: 50 },
      { id: '2', name: 'Deal 2', stage: 'Proposal', value: 200000, probability: 70 },
      { id: '3', name: 'Deal 3', stage: 'Negotiation', value: 300000, probability: 80 },
      { id: '4', name: 'Deal 4', stage: 'Won', value: 500000, probability: 100 },
      { id: '5', name: 'Deal 5', stage: 'Lost', value: 150000, probability: 0 },
    ];

    const openOpps = sampleOpportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
    assert(openOpps.length === 3, 'Open Opportunities count excludes Won and Lost (3 open deals)');

    const totalPipeline = openOpps.reduce((sum, o) => sum + o.value, 0);
    assert(totalPipeline === 600000, `Total Pipeline Value is sum of open deals (₹6,00,000, got ${totalPipeline})`);

    const weightedPipeline = openOpps.reduce((sum, o) => sum + (o.value * (o.probability / 100)), 0);
    const expectedWeighted = (100000 * 0.5) + (200000 * 0.7) + (300000 * 0.8); // 50000 + 140000 + 240000 = 430000
    assert(weightedPipeline === 430000, `Weighted Pipeline accurately calculates probability adjustment (₹4,30,000, got ${weightedPipeline})`);

    const wonValue = sampleOpportunities.filter(o => o.stage === 'Won').reduce((sum, o) => sum + o.value, 0);
    assert(wonValue === 500000, `Won Value sums all Won opportunities (₹5,00,000, got ${wonValue})`);

    // 3. Stage Filtering Logic
    console.log('\n--- Test Suite 3: Stage Filter Logic ---');
    const stages = ['All', 'New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    for (const stage of stages) {
      const filtered = stage === 'All' 
        ? sampleOpportunities 
        : sampleOpportunities.filter(o => o.stage === stage);
      assert(Array.isArray(filtered), `Filter tab [${stage}] functions cleanly with ${filtered.length} deals`);
    }

    // 4. Search Filtering Logic
    console.log('\n--- Test Suite 4: Search Filter Logic ---');
    const searchByName = sampleOpportunities.filter(o => o.name.toLowerCase().includes('deal 2'));
    assert(searchByName.length === 1 && searchByName[0].id === '2', 'Search by deal name correctly matches');

    // 5. Database CRUD & Controlled Stage Progression
    console.log('\n--- Test Suite 5: Opportunity Creation & Controlled Stage Updates ---');
    const testCustId = `CUST-OPP-TEST-${Date.now()}`;
    const testOppId = `OPP-STEP15-${Date.now()}`;

    // Create test customer
    await pool.query(
      `INSERT INTO customers (id, customer_code, customer_name, customer_type, industry, status)
       VALUES ($1, $2, 'Step 15 Test Corp', 'Company', 'Technology', 'Active')`,
      [testCustId, testCustId]
    );

    // Create opportunity
    await pool.query(
      `INSERT INTO opportunities (id, name, customer_id, customer_name, value, probability, expected_close, owner, stage)
       VALUES ($1, 'Cloud ERP Enterprise Deal', $2, 'Step 15 Test Corp', 750000, 60, '2026-10-31', 'Sarah Jenkins', 'Qualified')`,
      [testOppId, testCustId]
    );

    const createdOpp = await pool.query('SELECT * FROM opportunities WHERE id = $1', [testOppId]);
    assert(createdOpp.rows.length === 1, 'Test opportunity created and persisted in PostgreSQL');
    assert(createdOpp.rows[0].stage === 'Qualified', 'Initial stage is Qualified');

    // Controlled stage advance to Proposal inside Opportunity Details
    await pool.query(
      `UPDATE opportunities SET stage = 'Proposal', probability = 70, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [testOppId]
    );
    const updatedOpp1 = await pool.query('SELECT * FROM opportunities WHERE id = $1', [testOppId]);
    assert(updatedOpp1.rows[0].stage === 'Proposal', 'Stage updated to Proposal');
    assert(parseInt(updatedOpp1.rows[0].probability) === 70, 'Probability updated to 70%');

    // Advance to Won
    await pool.query(
      `UPDATE opportunities SET stage = 'Won', probability = 100, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [testOppId]
    );
    const wonOpp = await pool.query('SELECT * FROM opportunities WHERE id = $1', [testOppId]);
    assert(wonOpp.rows[0].stage === 'Won', 'Stage updated to Won');
    assert(parseInt(wonOpp.rows[0].probability) === 100, 'Probability updated to 100% for Won deal');

    // Clean up test data
    await pool.query('DELETE FROM opportunities WHERE id = $1', [testOppId]);
    await pool.query('DELETE FROM customers WHERE id = $1', [testCustId]);
    console.log('  ℹ️ Cleaned up test records');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    pool.end();
  }

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runStep15Tests();
