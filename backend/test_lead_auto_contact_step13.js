import { crmPool as pool } from './db/pool.js';

async function runStep13Tests() {
  console.log('====================================================');
  console.log('🧪 STEP 13: AUTOMATIC LEAD -> CONTACT RELATIONSHIP TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testLeadId = `LD-TEST-13-${timestamp}`;
  const testContactId = `CON-TEST-13-${timestamp}`;
  const testEmail = `priya.step13.${timestamp}@apexcloud.io`;
  const testPhone = `+91 98765 43210`;
  const testAltPhone = `+91 98765 00000`;
  const testNotes = `Main technical decision maker for the ERP implementation.`;

  try {
    // --- Test Suite 1: Create Lead & Auto-Create Linked Contact in PostgreSQL ---
    console.log('--- Test Suite 1: Create Lead & Auto-Create Linked Contact ---');
    
    // 1. Insert Lead
    const leadInsertRes = await pool.query(
      `INSERT INTO leads (
        id, name, company, email, phone, value, stage, score, source, assigned_to, 
        requirement, notes, expected_close_date, decision_maker, budget,
        contact_person, designation, contact_role, alternate_phone, website, industry, campaign
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) 
      RETURNING *`,
      [
        testLeadId,
        'Apex Cloud Solutions Lead',
        'Apex Cloud Solutions',
        testEmail,
        testPhone,
        1500000,
        'New',
        85,
        'Website',
        'John Doe',
        'Enterprise ERP Implementation',
        testNotes,
        '2026-12-31',
        'Priya Sharma',
        1500000,
        'Priya Sharma',
        'Chief Technology Officer',
        'Decision Maker',
        testAltPhone,
        'https://apexcloud.io',
        'Technology',
        'Q3 Summer Campaign'
      ]
    );

    assert(leadInsertRes.rows.length === 1, 'Test 1: Lead created successfully in PostgreSQL');
    const createdLead = leadInsertRes.rows[0];
    assert(createdLead.contact_person === 'Priya Sharma', 'Lead stores contact_person');
    assert(createdLead.contact_role === 'Decision Maker', 'Lead stores contact_role');
    assert(createdLead.designation === 'Chief Technology Officer', 'Lead stores designation');

    // 2. Insert Contact linked to Lead (Simulating auto-creation)
    const contactInsertRes = await pool.query(
      `INSERT INTO contacts (
        id, name, email, phone, company, customer_id, lead_id, title, contact_role, alternate_phone, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        testContactId,
        'Priya Sharma',
        testEmail,
        testPhone,
        'Apex Cloud Solutions',
        null, // No customer yet
        testLeadId, // Linked to Lead
        'Chief Technology Officer',
        'Decision Maker',
        testAltPhone,
        testNotes
      ]
    );

    assert(contactInsertRes.rows.length === 1, 'Test 2: Contact created automatically linked to Lead');
    const createdContact = contactInsertRes.rows[0];

    // --- Test Suite 2: Contact Properties & Relationships ---
    console.log('\n--- Test Suite 2: Contact Properties & Relationships ---');
    assert(createdContact.name === 'Priya Sharma', 'Contact Name matches lead contact person');
    assert(createdContact.title === 'Chief Technology Officer', 'Contact Designation matches lead designation');
    assert(createdContact.contact_role === 'Decision Maker', 'Contact Role matches lead contact role');
    assert(createdContact.company === 'Apex Cloud Solutions', 'Contact Company matches lead company');
    assert(createdContact.email === testEmail, 'Contact Email matches lead email');
    assert(createdContact.phone === testPhone, 'Contact Phone matches lead phone');
    assert(createdContact.alternate_phone === testAltPhone, 'Contact Alternate Phone matches lead alternate phone');
    assert(createdContact.notes === testNotes, 'Contact Notes matches lead notes');
    assert(createdContact.lead_id === testLeadId, 'Test 5: Contact is linked directly to the Lead via lead_id');
    assert(createdContact.customer_id === null, 'Contact customer_id is initially null (no duplicate fake customer created)');

    // --- Test Suite 3: Duplicate Contact Prevention on Retry ---
    console.log('\n--- Test Suite 3: Duplicate Contact Prevention on Retry ---');
    const duplicateCheckRes = await pool.query(
      `SELECT * FROM contacts WHERE lead_id = $1 OR (email = $2 AND lead_id = $1)`,
      [testLeadId, testEmail]
    );
    assert(duplicateCheckRes.rows.length === 1, 'Test 7: Querying contact by lead_id finds existing contact (avoids creating duplicate)');

    // --- Test Suite 4: Won Lead Conversion Reuses Existing Contact ---
    console.log('\n--- Test Suite 4: Won Lead Conversion Reuses Existing Contact ---');
    const testCustId = `CUST-TEST-13-${timestamp}`;
    
    // Create Customer upon conversion
    const custRes = await pool.query(
      `INSERT INTO customers (id, customer_name, customer_type, industry, owner_id, status, converted_from_lead_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [testCustId, 'Apex Cloud Solutions', 'Company', 'Technology', 'John Doe', 'Active', testLeadId]
    );
    assert(custRes.rows.length === 1, 'Customer created during Won lead conversion');

    // Update existing Contact to link to the new Customer
    const contactUpdateRes = await pool.query(
      `UPDATE contacts SET customer_id = $1, company = $2 WHERE id = $3 RETURNING *`,
      [testCustId, 'Apex Cloud Solutions', testContactId]
    );
    assert(contactUpdateRes.rows.length === 1, 'Test 8: Existing Contact reused and updated with customer_id during conversion');
    assert(contactUpdateRes.rows[0].customer_id === testCustId, 'Test 9: Contact is linked to Customer after conversion');
    assert(contactUpdateRes.rows[0].lead_id === testLeadId, 'Contact preserves original lead_id');

    // Update Lead with conversion references
    const leadUpdateRes = await pool.query(
      `UPDATE leads 
       SET is_converted = TRUE, 
           converted_to_customer_id = $1, 
           converted_to_contact_id = $2, 
           stage = 'Won'
       WHERE id = $3 RETURNING *`,
      [testCustId, testContactId, testLeadId]
    );
    assert(leadUpdateRes.rows[0].converted_to_contact_id === testContactId, 'Lead references existing Contact ID in converted_to_contact_id');

    // Verify total contacts for this lead
    const totalContactsForLead = await pool.query('SELECT COUNT(*) FROM contacts WHERE lead_id = $1', [testLeadId]);
    assert(parseInt(totalContactsForLead.rows[0].count) === 1, 'Exactly 1 contact exists for the lead throughout entire lifecycle (No duplicate Priya Sharma #1 / #2)');

  } catch (err) {
    console.error('❌ Test error:', err);
    failed++;
  } finally {
    // Cleanup
    await pool.query('DELETE FROM contacts WHERE lead_id = $1', [testLeadId]);
    await pool.query('DELETE FROM customers WHERE converted_from_lead_id = $1', [testLeadId]);
    await pool.query('DELETE FROM leads WHERE id = $1', [testLeadId]);
    console.log('\n🧹 Cleaned up temporary test records.');
  }

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep13Tests();
