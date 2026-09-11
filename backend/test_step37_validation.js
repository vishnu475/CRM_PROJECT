import { crmPool, hrmsPool } from './db/pool.js';

async function runStep37Tests() {
  console.log('=== STEP 37 VALIDATION TEST SUITE ===\n');

  let confirmedEmpCode = '';
  let exitedEmpCode = '';

  // 1. Fetch sample HRMS confirmed and non-confirmed employees
  try {
    const confRes = await hrmsPool.query("SELECT emp_code, name FROM employees WHERE status = 'Confirmed' LIMIT 1");
    if (confRes.rows.length > 0) {
      confirmedEmpCode = confRes.rows[0].emp_code;
      console.log(`✅ Found Confirmed HRMS employee: ${confRes.rows[0].name} (${confirmedEmpCode})`);
    }

    const exitedRes = await hrmsPool.query("SELECT emp_code, name FROM employees WHERE status <> 'Confirmed' LIMIT 1");
    if (exitedRes.rows.length > 0) {
      exitedEmpCode = exitedRes.rows[0].emp_code;
      console.log(`ℹ️ Found non-confirmed HRMS employee for test: ${exitedRes.rows[0].name} (${exitedEmpCode})`);
    }
  } catch (e) {
    console.error('Error fetching HRMS employees:', e.message);
  }

  const BASE_URL = 'http://localhost:5000/api/leads';

  const baseLead = {
    name: 'Priya Sharma',
    company: '3M India',
    industry: 'Technology',
    source: 'Website',
    campaign: 'Q3 Growth Campaign',
    contactPerson: 'Priya Sharma',
    designation: 'VP - Engineering',
    contactRole: 'Decision Maker',
    email: 'priya@3mindia.com',
    phone: '9848454737',
    alternatePhone: '9876543210',
    website: 'https://3mindia.com',
    stage: 'New',
    score: 75,
    value: 350000.50,
    expectedCloseDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    assignedToEmployeeId: confirmedEmpCode,
    address: '12-4-55, MVP Colony',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    country: 'India',
    postalCode: '530001',
    requirement: 'Customer needs CRM + HRMS integration with 3 APIs and 2 reporting dashboards.',
    notes: 'Internal review scheduled for next Monday.',
    tags: 'ERP, CRM, Priority',
    attachments: [{ id: 'att_1', name: 'proposal.pdf', url: '/uploads/leads/proposal.pdf', size: 102400 }]
  };

  const testCases = [
    // 1. Valid Complete Lead
    { name: 'Complete Valid Lead', payload: { ...baseLead }, expectedPass: true },

    // 2. Lead Name tests
    { name: 'Lead Name: Sunny (Valid)', payload: { ...baseLead, name: 'Sunny' }, expectedPass: true },
    { name: 'Lead Name: Sunny123 (Invalid with digits)', payload: { ...baseLead, name: 'Sunny123' }, expectedPass: false },
    { name: 'Lead Name: 12345 (Invalid numeric only)', payload: { ...baseLead, name: '12345' }, expectedPass: false },
    { name: 'Lead Name: @@@123 (Invalid special char)', payload: { ...baseLead, name: '@@@123' }, expectedPass: false },

    // 3. Contact Person tests
    { name: "Contact Person: John D'Souza (Valid)", payload: { ...baseLead, contactPerson: "John D'Souza" }, expectedPass: true },
    { name: 'Contact Person: Priya123 (Invalid digits)', payload: { ...baseLead, contactPerson: 'Priya123' }, expectedPass: false },

    // 4. Designation tests
    { name: 'Designation: Chief Technology Officer (Valid)', payload: { ...baseLead, designation: 'Chief Technology Officer' }, expectedPass: true },
    { name: 'Designation: 12345 (Invalid numeric only)', payload: { ...baseLead, designation: '12345' }, expectedPass: false },

    // 5. Phone tests (India 10-digit mobile: 6/7/8/9 + 9 digits)
    { name: 'Phone: 9848454737 (Valid)', payload: { ...baseLead, phone: '9848454737', alternatePhone: '9876543210' }, expectedPass: true },
    { name: 'Phone: 984845473 (Invalid 9 digits)', payload: { ...baseLead, phone: '984845473', alternatePhone: '' }, expectedPass: false },
    { name: 'Phone: 98484547377 (Invalid 11 digits)', payload: { ...baseLead, phone: '98484547377', alternatePhone: '' }, expectedPass: false },
    { name: 'Phone: 5123456789 (Invalid starts with 5)', payload: { ...baseLead, phone: '5123456789', alternatePhone: '' }, expectedPass: false },
    { name: 'Phone: 98484abc37 (Invalid contains letters)', payload: { ...baseLead, phone: '98484abc37', alternatePhone: '' }, expectedPass: false },

    // 6. Alternate Phone tests
    { name: 'Alternate Phone: Same as Phone (Invalid)', payload: { ...baseLead, phone: '9848454737', alternatePhone: '9848454737' }, expectedPass: false },
    { name: 'Alternate Phone: Different 10-digit (Valid)', payload: { ...baseLead, phone: '9848454737', alternatePhone: '8765432109' }, expectedPass: true },

    // 7. Email tests
    { name: 'Email: sunny@gmail.com (Valid)', payload: { ...baseLead, email: 'sunny@gmail.com' }, expectedPass: true },
    { name: 'Email: sunny@ (Invalid)', payload: { ...baseLead, email: 'sunny@' }, expectedPass: false },
    { name: 'Email: sunny gmail.com (Invalid space)', payload: { ...baseLead, email: 'sunny gmail.com' }, expectedPass: false },
    { name: 'Email: sunny@@gmail.com (Invalid double @)', payload: { ...baseLead, email: 'sunny@@gmail.com' }, expectedPass: false },

    // 8. Website tests
    { name: 'Website: https://example.com (Valid)', payload: { ...baseLead, website: 'https://example.com' }, expectedPass: true },
    { name: 'Website: example (Invalid)', payload: { ...baseLead, website: 'example' }, expectedPass: false },
    { name: 'Website: javascript:alert(1) (Invalid dangerous scheme)', payload: { ...baseLead, website: 'javascript:alert(1)' }, expectedPass: false },

    // 9. Stage tests
    { name: 'Stage: New (Valid)', payload: { ...baseLead, stage: 'New' }, expectedPass: true },
    { name: 'Stage: Won on creation (Invalid)', payload: { ...baseLead, stage: 'Won' }, expectedPass: false },

    // 10. Lead Score tests
    { name: 'Score: 0 (Valid min)', payload: { ...baseLead, score: 0 }, expectedPass: true },
    { name: 'Score: 100 (Valid max)', payload: { ...baseLead, score: 100 }, expectedPass: true },
    { name: 'Score: 101 (Invalid > 100)', payload: { ...baseLead, score: 101 }, expectedPass: false },
    { name: 'Score: -1 (Invalid < 0)', payload: { ...baseLead, score: -1 }, expectedPass: false },
    { name: 'Score: 50.5 (Invalid float)', payload: { ...baseLead, score: 50.5 }, expectedPass: false },

    // 11. Deal Value tests
    { name: 'Deal Value: 350000.50 (Valid decimal)', payload: { ...baseLead, value: 350000.50 }, expectedPass: true },
    { name: 'Deal Value: -500 (Invalid negative)', payload: { ...baseLead, value: -500 }, expectedPass: false },

    // 12. Expected Close Date tests
    { name: 'Close Date: Today (Valid)', payload: { ...baseLead, expectedCloseDate: new Date().toISOString().split('T')[0] }, expectedPass: true },
    { name: 'Close Date: Yesterday (Invalid past date)', payload: { ...baseLead, expectedCloseDate: '2020-01-01' }, expectedPass: false },

    // 13. Assigned To tests
    { name: 'Assigned To: Invalid employee ID (Invalid)', payload: { ...baseLead, assignedToEmployeeId: 'NON_EXISTENT_EMP_999', assignedTo: '' }, expectedPass: false },

    // 14. City, State, Country, Postal Code
    { name: 'City: Visakhapatnam (Valid)', payload: { ...baseLead, city: 'Visakhapatnam' }, expectedPass: true },
    { name: 'City: 12345 (Invalid numeric)', payload: { ...baseLead, city: '12345' }, expectedPass: false },
    { name: 'Postal Code: 530001 (Valid 6-digit India)', payload: { ...baseLead, postalCode: '530001' }, expectedPass: true },
    { name: 'Postal Code: @@#$ (Invalid characters)', payload: { ...baseLead, postalCode: '@@#$' }, expectedPass: false },

    // 15. Attachment security tests
    { name: 'Attachment: Valid PDF (Valid)', payload: { ...baseLead, attachments: [{ id: 'a1', name: 'doc.pdf', size: 1000 }] }, expectedPass: true },
    { name: 'Attachment: Disallowed EXE file (Invalid)', payload: { ...baseLead, attachments: [{ id: 'a2', name: 'malware.exe', size: 1000 }] }, expectedPass: false },
    { name: 'Attachment: Exceeds 10MB (Invalid)', payload: { ...baseLead, attachments: [{ id: 'a3', name: 'large.pdf', size: 12 * 1024 * 1024 }] }, expectedPass: false },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const t of testCases) {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t.payload)
      });
      const data = await res.json();

      const actuallyPassed = res.ok && data.success;
      if (actuallyPassed === t.expectedPass) {
        console.log(`  ✅ [PASS] ${t.name} -> Responded with status ${res.status} (${actuallyPassed ? 'Created' : data.message})`);
        passedTests++;
      } else {
        console.error(`  ❌ [FAIL] ${t.name} -> Expected pass: ${t.expectedPass}, Got HTTP ${res.status}: ${JSON.stringify(data)}`);
        failedTests++;
      }
    } catch (err) {
      console.error(`  ❌ [ERROR] ${t.name} -> Request failed:`, err.message);
      failedTests++;
    }
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passedTests} passed, ${failedTests} failed out of ${testCases.length} tests.`);
  console.log(`========================================\n`);

  process.exit(failedTests > 0 ? 1 : 0);
}

runStep37Tests();
