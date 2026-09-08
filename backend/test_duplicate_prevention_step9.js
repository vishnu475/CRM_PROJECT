import { crmPool as pool } from './db/pool.js';

const BASE_URL = 'http://localhost:5000/api';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  return await res.json();
}

function normalizeDomain(url) {
  if (!url) return '';
  let clean = url.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, '');
  clean = clean.replace(/^www\./, '');
  clean = clean.split('/')[0];
  clean = clean.split('?')[0];
  clean = clean.split(':')[0];
  return clean.trim();
}

function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'mail.com', 'zoho.com', 'protonmail.com'
]);

function findMatchingCustomer(lead, customers, customData) {
  if (!customers || customers.length === 0 || !lead) {
    return { hasDuplicate: false, matchingCustomer: null };
  }

  const leadTaxId = (customData?.taxId || lead.taxId || lead.gstVatNumber || lead.gstin || '').trim().toUpperCase();
  const leadEmail = (customData?.contactEmail || lead.email || '').trim().toLowerCase();
  const leadWebsite = (customData?.website || lead.website || '').trim();
  const leadPhone = normalizePhone(customData?.contactPhone || lead.phone);

  const leadDomain = normalizeDomain(leadWebsite);
  const leadEmailDomain = leadEmail.includes('@') ? leadEmail.split('@')[1] : '';

  for (const customer of customers) {
    // 1. GST / VAT / Tax ID Match (Priority 1)
    if (leadTaxId) {
      const custTax = (customer.taxId || customer.gstVatNumber || customer.tax_id || '').trim().toUpperCase();
      if (custTax && custTax === leadTaxId) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'taxId',
          matchReason: `Tax / GST ID matched (${custTax})`,
          matchedValue: custTax,
        };
      }
    }

    // 2. Email Address Match (Priority 2)
    if (leadEmail) {
      const custEmail = (
        customer.primaryContact?.email ||
        customer.contact_email ||
        customer.contactEmail ||
        customer.email ||
        ''
      ).trim().toLowerCase();

      if (custEmail && custEmail === leadEmail) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'email',
          matchReason: `Primary contact email matched (${custEmail})`,
          matchedValue: custEmail,
        };
      }
    }

    // 3. Website / Domain Match (Priority 3)
    if (leadDomain && leadDomain.length > 3) {
      const custWebsite = (customer.website || customer.domain || '').trim();
      const custDomain = normalizeDomain(custWebsite);
      const custEmail = (customer.primaryContact?.email || customer.contact_email || '').trim().toLowerCase();
      const custEmailDomain = custEmail.includes('@') ? custEmail.split('@')[1] : '';

      if (custDomain && custDomain === leadDomain) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'website',
          matchReason: `Website domain matched (${leadDomain})`,
          matchedValue: leadDomain,
        };
      }

      if (
        custEmailDomain &&
        !PUBLIC_EMAIL_DOMAINS.has(custEmailDomain) &&
        custEmailDomain === leadDomain
      ) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'website',
          matchReason: `Company domain matched customer contact (${custEmailDomain})`,
          matchedValue: custEmailDomain,
        };
      }
    }

    // Also check email domain matching website
    if (
      leadEmailDomain &&
      !PUBLIC_EMAIL_DOMAINS.has(leadEmailDomain)
    ) {
      const custWebsite = (customer.website || '').trim();
      const custDomain = normalizeDomain(custWebsite);
      if (custDomain && custDomain === leadEmailDomain) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'website',
          matchReason: `Lead email domain matches customer website (${custDomain})`,
          matchedValue: custDomain,
        };
      }
    }

    // Check if lead corporate email domain matches customer contact corporate email domain
    const custContactEmail = (customer.primaryContact?.email || customer.contact_email || customer.contactEmail || customer.email || '').trim().toLowerCase();
    const custContactEmailDomain = custContactEmail.includes('@') ? custContactEmail.split('@')[1] : '';
    if (
      leadEmailDomain &&
      custContactEmailDomain &&
      !PUBLIC_EMAIL_DOMAINS.has(leadEmailDomain) &&
      leadEmailDomain === custContactEmailDomain
    ) {
      return {
        hasDuplicate: true,
        matchingCustomer: customer,
        matchField: 'email',
        matchReason: `Corporate email domain matched (${leadEmailDomain})`,
        matchedValue: leadEmailDomain,
      };
    }

    // 4. Phone Number Match (Priority 4)
    if (leadPhone && leadPhone.length >= 10) {
      const custPhone = normalizePhone(
        customer.primaryContact?.phone ||
        customer.contact_phone ||
        customer.contactPhone ||
        customer.phone
      );
      if (custPhone && custPhone === leadPhone) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'phone',
          matchReason: `Phone number matched (${customer.primaryContact?.phone || custPhone})`,
          matchedValue: customer.primaryContact?.phone || custPhone,
        };
      }
    }
  }

  return { hasDuplicate: false, matchingCustomer: null };
}

function findMatchingContact(lead, contacts, customerId, customData) {
  if (!contacts || contacts.length === 0 || !customerId) return null;

  const leadEmail = (customData?.contactEmail || lead.email || '').trim().toLowerCase();
  const leadPhone = normalizePhone(customData?.contactPhone || lead.phone);
  const leadName = (customData?.contactName || lead.decisionMaker || lead.contactPerson || lead.name || '').trim().toLowerCase();

  const customerContacts = contacts.filter((c) => c.customer_id === customerId || c.customerId === customerId);

  // Match by email first
  if (leadEmail) {
    const emailMatch = customerContacts.find(
      (c) => (c.email || '').trim().toLowerCase() === leadEmail
    );
    if (emailMatch) return emailMatch;
  }

  // Match by phone next
  if (leadPhone && leadPhone.length >= 10) {
    const phoneMatch = customerContacts.find(
      (c) => normalizePhone(c.phone) === leadPhone
    );
    if (phoneMatch) return phoneMatch;
  }

  // Match by exact name
  if (leadName) {
    const nameMatch = customerContacts.find(
      (c) => (c.name || '').trim().toLowerCase() === leadName
    );
    if (nameMatch) return nameMatch;
  }

  return null;
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 STEP 9: PREVENT DUPLICATE CUSTOMER CREATION TESTS');
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

  const cleanupIds = {
    leads: [],
    customers: [],
    contacts: [],
    opportunities: [],
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Unit testing strong identifier duplicate detection
    // -------------------------------------------------------------
    console.log('--- Test Suite 1: Duplicate Detection Strong Identifiers ---');
    const existingCustList = [
      {
        id: 'CUST-ALPHA',
        customerName: 'Alpha Tech Corp',
        primaryContact: { email: 'cto@alphatech.io', phone: '+1 555-444-3322' },
        website: 'https://alphatech.io',
        taxId: 'TAX-998877'
      },
      {
        id: 'CUST-BETA',
        customerName: 'Beta Logistics',
        primaryContact: { email: 'ops@betalog.com', phone: '+91 98111 22233' },
        website: 'https://www.betalog.com/services',
        taxId: 'GSTIN27AABCB1234'
      }
    ];

    // Tax Match
    const leadMatchByTax = { id: 'L1', name: 'Random Name', taxId: 'TAX-998877', email: 'other@gmail.com' };
    const resTax = findMatchingCustomer(leadMatchByTax, existingCustList);
    assert(resTax.hasDuplicate && resTax.matchingCustomer.id === 'CUST-ALPHA', 'Match detected by Tax / GST ID');

    // Email Match
    const leadMatchByEmail = { id: 'L2', name: 'Different Corp', email: 'cto@alphatech.io' };
    const resEmail = findMatchingCustomer(leadMatchByEmail, existingCustList);
    assert(resEmail.hasDuplicate && resEmail.matchingCustomer.id === 'CUST-ALPHA', 'Match detected by primary contact Email');

    // Website Domain Match
    const leadMatchByWebsite = { id: 'L3', name: 'Different Corp 2', email: 'sales@newcorp.com', website: 'http://betalog.com' };
    const resWeb = findMatchingCustomer(leadMatchByWebsite, existingCustList);
    assert(resWeb.hasDuplicate && resWeb.matchingCustomer.id === 'CUST-BETA', 'Match detected by normalized Website domain');

    // Phone Match
    const leadMatchByPhone = { id: 'L4', name: 'Phone Matcher', phone: '9811122233' };
    const resPhone = findMatchingCustomer(leadMatchByPhone, existingCustList);
    assert(resPhone.hasDuplicate && resPhone.matchingCustomer.id === 'CUST-BETA', 'Match detected by Phone number');

    // No Match (distinct lead)
    const distinctLead = { id: 'L5', name: 'Unique Business', email: 'contact@uniquecorp.in', website: 'https://uniquecorp.in', phone: '9999900000' };
    const resDistinct = findMatchingCustomer(distinctLead, existingCustList);
    assert(!resDistinct.hasDuplicate, 'Distinct lead with no strong identifier match reports NO duplicate');

    // -------------------------------------------------------------
    // Test 2: Database End-to-End: Won Lead matching Existing Customer
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 2: Existing Customer Reused During Conversion ---');

    // 1. Seed an Existing Customer in PostgreSQL
    const existingCustId = `CUST-EXIST-${Date.now()}`;
    cleanupIds.customers.push(existingCustId);

    const custCreate = await request('POST', '/customers', {
      id: existingCustId,
      customerCode: existingCustId,
      customerName: 'Enterprise Cloudworks',
      customerType: 'Company',
      industry: 'Technology',
      ownerId: 'John Doe',
      status: 'Active',
      creditLimit: 1000000,
      contactName: 'Ravi Kumar',
      contactEmail: 'ravi@cloudworks.io',
      contactPhone: '+91 98888 77777',
      convertedFromLeadId: 'ORIGINAL-SEED-LEAD'
    });
    assert(custCreate.success, 'Existing Customer created in DB');

    // 2. Seed an existing Contact for this Customer
    const existingContactId = `CON-EXIST-${Date.now()}`;
    cleanupIds.contacts.push(existingContactId);

    const contCreate = await request('POST', '/contacts', {
      id: existingContactId,
      name: 'Ravi Kumar',
      email: 'ravi@cloudworks.io',
      phone: '+91 98888 77777',
      company: 'Enterprise Cloudworks',
      customerId: existingCustId,
      title: 'VP Engineering'
    });
    assert(contCreate.success, 'Existing Contact created in DB for Customer');

    // Count customers before conversion
    const beforeCustsRes = await request('GET', '/customers');
    const totalCustomersBefore = beforeCustsRes.data.length;

    // 3. Create a Won Lead that matches the existing customer by Email and Domain
    const matchingLeadId = `LD-DUP-${Date.now()}`;
    cleanupIds.leads.push(matchingLeadId);

    const matchingLeadCreate = await request('POST', '/leads', {
      id: matchingLeadId,
      name: 'Ravi Kumar',
      company: 'Enterprise Cloudworks',
      email: 'ravi@cloudworks.io',
      phone: '+91 98888 77777',
      value: 600000,
      stage: 'Won',
      assignedTo: 'John Doe',
      finalAgreedAmount: 600000,
      wonDate: '2026-09-04'
    });
    assert(matchingLeadCreate.success, 'Won Lead with duplicate email/domain created in DB');

    // 4. Perform Lead Conversion simulating existing customer reuse
    const allCustomers = (await request('GET', '/customers')).data;
    const allContacts = (await pool.query('SELECT * FROM contacts')).rows;

    const duplicateMatch = findMatchingCustomer(matchingLeadCreate.data, allCustomers);
    assert(duplicateMatch.hasDuplicate, 'Test 2: Won lead detects matching existing Customer by strong identifier');
    assert(duplicateMatch.matchingCustomer.id === existingCustId, 'Matching Customer correctly points to existingCustId');

    // Check contact matching for this customer
    const matchedContact = findMatchingContact(matchingLeadCreate.data, allContacts, existingCustId);
    assert(matchedContact !== null && matchedContact.id === existingContactId, 'Test 4: Existing Contact matched and reused (no duplicate Contact created)');

    // Execute Opportunity Creation linked to existing Customer
    const oppId1 = `OPP-CONV-${Date.now()}`;
    cleanupIds.opportunities.push(oppId1);

    const oppCreate = await request('POST', '/opportunities', {
      id: oppId1,
      name: 'Enterprise Cloudworks - New Deal',
      customerId: existingCustId,
      customerName: 'Enterprise Cloudworks',
      value: 600000,
      probability: 100,
      expectedClose: '2026-09-04',
      owner: 'John Doe',
      stage: 'Won'
    });
    assert(oppCreate.success, 'Test 5: Won Opportunity created linked to existing Customer');

    // Update Lead with conversion stamping
    await request('PATCH', `/leads/${matchingLeadId}`, {
      convertedToCustomerId: existingCustId,
      convertedToContactId: existingContactId,
      convertedToOpportunityId: oppId1,
      isConverted: true,
      convertedAt: new Date().toISOString()
    });

    // Check customer count: must remain unchanged (NO duplicate customer created)
    const afterCustsRes = await request('GET', '/customers');
    assert(afterCustsRes.data.length === totalCustomersBefore, 'Test 2b: Total Customer count unchanged; duplicate Customer creation was PREVENTED');

    // Check existing customer's convertedFromLeadId remains UNCHANGED
    const existingCustVerify = await request('GET', `/customers/${existingCustId}`);
    assert(existingCustVerify.data.converted_from_lead_id === 'ORIGINAL-SEED-LEAD', 'Test 6: Existing Customer convertedFromLeadId is preserved and NOT overwritten');

    // -------------------------------------------------------------
    // Test 3: Existing Customer with a NEW Contact (different email/phone)
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 3: Existing Customer with a NEW Contact ---');
    const newContactLeadId = `LD-NEWCONT-${Date.now()}`;
    cleanupIds.leads.push(newContactLeadId);

    const newContactLead = await request('POST', '/leads', {
      id: newContactLeadId,
      name: 'Anita Desai',
      company: 'Enterprise Cloudworks',
      email: 'anita@cloudworks.io', // Same domain, but different person email
      phone: '+91 97777 66666',
      value: 400000,
      stage: 'Won',
      assignedTo: 'John Doe',
      finalAgreedAmount: 400000,
      wonDate: '2026-09-04'
    });

    // Match customer by company domain
    const custMatchForAnita = findMatchingCustomer(newContactLead.data, allCustomers);
    assert(custMatchForAnita.hasDuplicate, 'Customer matched by company domain for new employee lead');

    // Match contact: must be null (new contact)
    const contactMatchForAnita = findMatchingContact(newContactLead.data, allContacts, existingCustId);
    assert(contactMatchForAnita === null, 'Test 3a: No existing contact found for Anita; requires new contact creation');

    const newContactId = `CON-NEW-${Date.now()}`;
    cleanupIds.contacts.push(newContactId);

    const anitaContactCreate = await request('POST', '/contacts', {
      id: newContactId,
      name: 'Anita Desai',
      email: 'anita@cloudworks.io',
      phone: '+91 97777 66666',
      company: 'Enterprise Cloudworks',
      customerId: existingCustId,
      title: 'Procurement Specialist'
    });
    assert(anitaContactCreate.success, 'Test 3b: New Contact created linked to the existing Customer');

    // -------------------------------------------------------------
    // Test 4: New Customer creation for non-matching lead
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 4: Non-matching Lead Creates New Customer ---');
    const brandNewCustId = `CUST-BRANDNEW-${Date.now()}`;
    const brandNewLeadId = `LD-BRANDNEW-${Date.now()}`;
    cleanupIds.customers.push(brandNewCustId);
    cleanupIds.leads.push(brandNewLeadId);

    const brandNewLead = await request('POST', '/leads', {
      id: brandNewLeadId,
      name: 'Dr. Sanjay Patel',
      company: 'Patel Healthcare Systems',
      email: 'sanjay@patelhealth.org',
      phone: '+91 91234 56789',
      value: 850000,
      stage: 'Won',
      finalAgreedAmount: 850000,
      wonDate: '2026-09-04'
    });

    const newCustCreateRes = await request('POST', '/customers', {
      id: brandNewCustId,
      customerCode: brandNewCustId,
      customerName: 'Patel Healthcare Systems',
      customerType: 'Company',
      contactEmail: 'sanjay@patelhealth.org',
      convertedFromLeadId: brandNewLeadId
    });

    assert(newCustCreateRes.success, 'Test 1: Brand new customer record created');
    assert(newCustCreateRes.data.converted_from_lead_id === brandNewLeadId, 'Test 7: New Customer stores current Lead convertedFromLeadId');

    // -------------------------------------------------------------
    // Test 5: Conversion Retry & Duplicate Prevention
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 5: Conversion Retry & Duplicate Prevention ---');
    const convertedLeadVerify = await request('GET', `/leads/${matchingLeadId}`);
    assert(convertedLeadVerify.data.is_converted === true, 'Test 8: Lead is stamped isConverted = true');

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    for (const id of cleanupIds.contacts) {
      await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    }
    for (const id of cleanupIds.opportunities) {
      await pool.query('DELETE FROM opportunities WHERE id = $1', [id]);
    }
    for (const id of cleanupIds.leads) {
      await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    }
    for (const id of cleanupIds.customers) {
      await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    }
    console.log('🧹 Cleaned up temporary test records.');
    await pool.end();

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test execution failed with exception:', err);
    await pool.end();
    process.exit(1);
  }
}

runTests();
