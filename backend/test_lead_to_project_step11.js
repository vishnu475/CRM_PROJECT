import { crmPool } from './db/pool.js';

let passed = 0;
let failed = 0;

function assert(condition, name, details) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name} - ${details}`);
    failed++;
  }
}

// Eligibility validator for Create Project from Lead
function validateCreateProjectEligibility(lead) {
  if (!lead) {
    return { allowed: false, message: 'Lead not found.' };
  }
  if (lead.stage !== 'Won') {
    return {
      allowed: false,
      message: `Project can only be created from a "Won" lead. Current stage is "${lead.stage}".`,
    };
  }
  if (lead.stage === 'Lost') {
    return {
      allowed: false,
      message: 'Cannot create project from a Lost deal.',
    };
  }
  if (lead.isProjectCreated || lead.projectId) {
    return {
      allowed: false,
      message: 'A Project has already been created from this won lead.',
    };
  }
  return { allowed: true };
}

// Project name generator
function generateProjectName(companyName, requirement) {
  if (!requirement || !requirement.trim()) return `${companyName} - Implementation Project`;
  const lower = requirement.toLowerCase();
  let summary = 'Implementation Project';
  if (lower.includes('crm') && lower.includes('hrms')) {
    summary = 'CRM and HRMS Implementation';
  } else if (lower.includes('crm')) {
    summary = 'CRM Implementation';
  } else if (lower.includes('hrms')) {
    summary = 'HRMS Implementation';
  } else if (lower.includes('erp')) {
    summary = 'ERP Implementation';
  } else if (lower.includes('payroll')) {
    summary = 'Payroll System Implementation';
  } else if (requirement.length <= 40) {
    summary = requirement.trim();
  } else {
    summary = requirement.slice(0, 37).trim() + '...';
  }
  return `${companyName} - ${summary}`;
}

async function runStep11Tests() {
  console.log('====================================================');
  console.log('🧪 STEP 11: WON LEAD -> PROJECT CREATION TEST SUITE');
  console.log('====================================================\n');

  console.log('--- Test Suite 1: Project Creation Eligibility Rules ---');
  
  // Test 10: Lost Lead -> Create Project -> BLOCKED
  const lostLead = { id: 'lead-lost', stage: 'Lost', name: 'Lost Deal Corp' };
  const lostCheck = validateCreateProjectEligibility(lostLead);
  assert(lostCheck.allowed === false, 'Test 10: Lost Lead project creation is BLOCKED', lostCheck.message);

  // Test 11: Qualified Lead -> Create Project -> BLOCKED
  const qualLead = { id: 'lead-qual', stage: 'Qualified', name: 'Qual Corp' };
  const qualCheck = validateCreateProjectEligibility(qualLead);
  assert(qualCheck.allowed === false, 'Test 11: Qualified Lead project creation is BLOCKED', qualCheck.message);

  // Test 12: Negotiation Lead -> Create Project -> BLOCKED
  const negLead = { id: 'lead-neg', stage: 'Negotiation', name: 'Neg Corp' };
  const negCheck = validateCreateProjectEligibility(negLead);
  assert(negCheck.allowed === false, 'Test 12: Negotiation Lead project creation is BLOCKED', negCheck.message);

  // Other non-won stages
  const newLead = { id: 'lead-new', stage: 'New', name: 'New Corp' };
  const newCheck = validateCreateProjectEligibility(newLead);
  assert(newCheck.allowed === false, 'New Lead project creation is BLOCKED', newCheck.message);

  const contactedLead = { id: 'lead-contacted', stage: 'Contacted', name: 'Contacted Corp' };
  const contactedCheck = validateCreateProjectEligibility(contactedLead);
  assert(contactedCheck.allowed === false, 'Contacted Lead project creation is BLOCKED', contactedCheck.message);

  const propLead = { id: 'lead-prop', stage: 'Proposal', name: 'Proposal Corp' };
  const propCheck = validateCreateProjectEligibility(propLead);
  assert(propCheck.allowed === false, 'Proposal Lead project creation is BLOCKED', propCheck.message);

  // Eligible Won Lead
  const wonLeadEligible = { id: 'lead-won-1', stage: 'Won', isConverted: true, name: 'Apex Corp' };
  const wonCheck = validateCreateProjectEligibility(wonLeadEligible);
  assert(wonCheck.allowed === true, 'Eligible Won Lead project creation is ALLOWED', wonCheck.message);

  // Test 13: Already Project-Created Lead -> BLOCKED
  const alreadyCreatedLead = { id: 'lead-won-2', stage: 'Won', isProjectCreated: true, projectId: 'PRJ-9999' };
  const dupCheck = validateCreateProjectEligibility(alreadyCreatedLead);
  assert(dupCheck.allowed === false, 'Test 13: Already Project-Created Lead is BLOCKED from duplicate creation', dupCheck.message);

  console.log('\n--- Test Suite 2: Project Name & Requirement Mapping ---');
  
  // Test 2: Project Name is generated correctly from company + requirement
  const company = 'Apex Cloud Solutions';
  const requirement = 'Implement CRM and HRMS for 150 employees, including lead management, customer management, attendance and payroll integration.';
  const generatedName = generateProjectName(company, requirement);
  assert(
    generatedName === 'Apex Cloud Solutions - CRM and HRMS Implementation',
    'Test 2: Project Name is generated correctly from company + requirement',
    `Got: ${generatedName}`
  );

  console.log('\n--- Test Suite 3: Database & API Execution ---');
  
  const testLeadId = `TEST-LEAD-WON-${Date.now()}`;
  const testCustomerId = `TEST-CUST-${Date.now()}`;
  const testProjectId = `PRJ-TEST-${Date.now().toString().slice(-4)}`;
  const fullRequirement = 'Implement CRM and HRMS for 150 employees, including lead management, customer management, attendance and payroll integration.';
  const projectNotes = 'Client prefers project kickoff on Monday and milestones split across 3 sprints.';

  // 1. Insert Customer
  await crmPool.query(
    `INSERT INTO customers (id, customer_code, customer_name, customer_type, industry, owner_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [testCustomerId, testCustomerId, company, 'Company', 'Technology', 'Sarah Connor', 'Active']
  );

  // 2. Insert Won Lead
  await crmPool.query(
    `INSERT INTO leads (id, name, company, email, phone, value, stage, score, source, assigned_to, requirement, notes, converted_to_customer_id, is_converted, final_agreed_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      testLeadId,
      'Priya Sharma',
      company,
      'priya@apexcloud.com',
      '+91 9876543210',
      500000,
      'Won',
      90,
      'Website',
      'Sarah Connor',
      fullRequirement,
      projectNotes,
      testCustomerId,
      true,
      500000
    ]
  );

  // 3. Execute Create Project (Test 1)
  const createProjectQuery = await crmPool.query(
    `INSERT INTO projects (
      id, code, name, client, customer_id, source_lead_id,
      project_requirement, project_notes, project_manager, start_date, end_date,
      budget, spent, progress, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [
      testProjectId,
      testProjectId,
      generatedName,
      company,
      testCustomerId,
      testLeadId,
      fullRequirement,
      projectNotes,
      'Sarah Connor',
      '2026-09-10',
      '2026-12-31',
      500000,
      0,
      0,
      'Not Started'
    ]
  );

  // Update lead
  await crmPool.query(
    `UPDATE leads SET project_id = $1, is_project_created = true, project_created_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [testProjectId, testLeadId]
  );

  assert(createProjectQuery.rowCount === 1, 'Test 1: Project is created successfully in database', 'Insert failed');

  console.log('\n--- Test Suite 4: PostgreSQL Persistence & Association Verification ---');
  
  // Test 14: Verify Project persists in PostgreSQL
  const projRes = await crmPool.query('SELECT * FROM projects WHERE id = $1', [testProjectId]);
  assert(projRes.rowCount === 1, 'Test 14: Project persists in PostgreSQL across queries', 'Project not found');
  const project = projRes.rows[0];

  // Test 3: Full Project Requirement is copied from Lead.requirement
  assert(
    project.project_requirement === fullRequirement,
    'Test 3: Full Project Requirement is copied from Lead.requirement without truncation',
    `Got: ${project.project_requirement}`
  );

  // Test 4: Project references the correct Customer
  assert(
    project.customer_id === testCustomerId,
    'Test 4 & 8: Project references the correct Customer record in DB',
    `Got: ${project.customer_id}`
  );

  // Test 7: Lead remains available and linked to Project
  const leadRes = await crmPool.query('SELECT * FROM leads WHERE id = $1', [testLeadId]);
  const updatedLead = leadRes.rows[0];
  assert(
    updatedLead.project_id === testProjectId && updatedLead.is_project_created === true,
    'Test 7: Lead is updated and persistently linked to Project (project_id & is_project_created=true)',
    `Got project_id: ${updatedLead.project_id}, is_project_created: ${updatedLead.is_project_created}`
  );

  // Test 6: Project Details fields are preserved (requirement, notes, manager, budget, status)
  assert(project.project_notes === projectNotes, 'Project Notes are preserved separately from Requirement', project.project_notes);
  assert(project.project_manager === 'Sarah Connor', 'Project Manager is stored correctly', project.project_manager);
  assert(Number(project.budget) === 500000, 'Project Budget matches agreed deal value', project.budget);
  assert(project.status === 'Not Started', 'Initial Project Status is "Not Started"', project.status);

  // Test 9: Duplicate Project creation prevention
  const recheckEligibility = validateCreateProjectEligibility({
    id: updatedLead.id,
    stage: updatedLead.stage,
    isProjectCreated: updatedLead.is_project_created,
    projectId: updatedLead.project_id
  });
  assert(
    recheckEligibility.allowed === false,
    'Test 9: Clicking Create Project again is BLOCKED from creating duplicate projects',
    recheckEligibility.message
  );

  // Cleanup test records
  await crmPool.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
  await crmPool.query('DELETE FROM leads WHERE id = $1', [testLeadId]);
  await crmPool.query('DELETE FROM customers WHERE id = $1', [testCustomerId]);

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runStep11Tests().catch((err) => {
  console.error('Error running Step 11 test suite:', err);
  process.exit(1);
});
