// Test suite for CRM Lead-Stage Workflow Validation
// Covers: Step 1 (New -> Contacted) AND Step 2 (Contacted -> Qualified)

function validateLeadStageTransition(lead, targetStage, activities = []) {
  const currentStage = lead.stage;

  // No change in stage
  if (currentStage === targetStage) {
    return { allowed: true };
  }

  // STEP 1: Validation for New -> Contacted
  if (currentStage === 'New' && targetStage === 'Contacted') {
    const hasCompletedInteraction = activities.some((act) => {
      const isRelated =
        act.relatedTo === lead.id ||
        act.relatedTo === lead.name ||
        (act.relatedTo && act.relatedTo.includes(lead.name)) ||
        (act.relatedTo && act.relatedTo.includes(lead.id));

      const isInteractionType =
        act.type === 'Call' || act.type === 'Email' || act.type === 'Meeting';

      const isCompleted = act.status === 'Completed';

      return isRelated && isInteractionType && isCompleted;
    });

    if (!hasCompletedInteraction) {
      return {
        allowed: false,
        message: 'Please record a completed call, email, or meeting before moving this lead to Contacted.',
      };
    }
  }

  // STEP 2: Validation for Contacted -> Qualified
  if (currentStage === 'Contacted' && targetStage === 'Qualified') {
    const missingFields = [];

    // 1. Requirement (meaningful text, not empty or whitespace-only)
    const requirement = (lead.requirement || '').trim();
    if (!requirement) {
      missingFields.push('Requirement');
    }

    // 2. Budget (valid positive monetary value > 0)
    const budgetVal =
      lead.budget !== undefined && Number(lead.budget) > 0
        ? Number(lead.budget)
        : lead.value !== undefined && Number(lead.value) > 0
        ? Number(lead.value)
        : 0;

    if (!budgetVal || budgetVal <= 0 || isNaN(budgetVal)) {
      missingFields.push('Budget');
    }

    // 3. Decision Maker (identified purchasing authority)
    const decisionMaker = (lead.decisionMaker || lead.contactPerson || '').trim();
    if (!decisionMaker) {
      missingFields.push('Decision Maker');
    }

    // 4. Expected Closing Date (valid date)
    const expectedCloseDate = (lead.expectedCloseDate || '').trim();
    if (!expectedCloseDate) {
      missingFields.push('Expected Closing Date');
    }

    if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        return {
          allowed: false,
          message: `Please provide the ${missingFields[0]} before qualifying this lead.`,
        };
      }
      return {
        allowed: false,
        message: `Complete the following qualification details before moving this lead to Qualified:\n• ${missingFields.join('\n• ')}`,
      };
    }
  }

  // All other stage transitions are allowed (reserved for future step rules)
  return { allowed: true };
}

console.log('================================================================');
console.log('🧪 RUNNING LEAD-STAGE WORKFLOW VALIDATION TESTS (STEPS 1 & 2)');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, extraInfo = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName} ${extraInfo ? '| ' + extraInfo : ''}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${extraInfo ? '| ' + extraInfo : ''}`);
    failed++;
  }
}

// STEP 2 CASES (Contacted -> Qualified)

// CASE 1: Contacted lead with all four qualification fields empty
const leadCase1 = { id: 'LD-101', name: 'Alpha Tech', stage: 'Contacted' };
const res1 = validateLeadStageTransition(leadCase1, 'Qualified');
assert(
  res1.allowed === false && res1.message.includes('Requirement') && res1.message.includes('Budget') && res1.message.includes('Decision Maker') && res1.message.includes('Expected Closing Date'),
  'CASE 1: All 4 qualification fields empty -> BLOCKED',
  `Blocked with: "${res1.message.replace(/\n/g, ' ')}"`
);

// CASE 2: Requirement exists, but Budget is missing
const leadCase2 = { id: 'LD-102', name: 'Beta Corp', stage: 'Contacted', requirement: 'Enterprise ERP Suite', decisionMaker: 'Sunil Verma', expectedCloseDate: '2026-10-15', budget: 0, value: 0 };
const res2 = validateLeadStageTransition(leadCase2, 'Qualified');
assert(
  res2.allowed === false && res2.message === 'Please provide the Budget before qualifying this lead.',
  'CASE 2: Requirement exists, but Budget is missing -> BLOCKED',
  `Message: "${res2.message}"`
);

// CASE 3: Requirement + Budget exist, but Decision Maker is missing
const leadCase3 = { id: 'LD-103', name: 'Gamma Ltd', stage: 'Contacted', requirement: 'CRM Implementation', budget: 350000, expectedCloseDate: '2026-11-01' };
const res3 = validateLeadStageTransition(leadCase3, 'Qualified');
assert(
  res3.allowed === false && res3.message === 'Please provide the Decision Maker before qualifying this lead.',
  'CASE 3: Requirement + Budget exist, Decision Maker missing -> BLOCKED',
  `Message: "${res3.message}"`
);

// CASE 4: Requirement + Budget + Decision Maker exist, but Expected Closing Date is missing
const leadCase4 = { id: 'LD-104', name: 'Delta Systems', stage: 'Contacted', requirement: 'HRMS Cloud Module', budget: 500000, decisionMaker: 'Priya Nair', expectedCloseDate: '' };
const res4 = validateLeadStageTransition(leadCase4, 'Qualified');
assert(
  res4.allowed === false && res4.message === 'Please provide the Expected Closing Date before qualifying this lead.',
  'CASE 4: Req + Budget + Decision Maker exist, Close Date missing -> BLOCKED',
  `Message: "${res4.message}"`
);

// CASE 5: All four fields are valid
const leadCase5 = { id: 'LD-105', name: 'Omega Global', stage: 'Contacted', requirement: 'Complete ERP & CRM Solution', budget: 750000, decisionMaker: 'Vikram Mehta (VP Tech)', expectedCloseDate: '2026-12-31' };
const res5 = validateLeadStageTransition(leadCase5, 'Qualified');
assert(
  res5.allowed === true,
  'CASE 5: All 4 qualification fields valid -> ALLOWED',
  `Stage transition to Qualified permitted: ${res5.allowed}`
);

// STEP 1 REGRESSION CASES

// CASE 6: Existing New -> Contacted workflow from Step 1
const leadNewNoAct = { id: 'LD-001', name: 'New Lead', stage: 'New' };
const leadNewWithAct = { id: 'LD-001', name: 'New Lead', stage: 'New' };
const acts = [{ id: 'A1', type: 'Call', status: 'Completed', relatedTo: 'LD-001' }];

const res6a = validateLeadStageTransition(leadNewNoAct, 'Contacted', []);
const res6b = validateLeadStageTransition(leadNewWithAct, 'Contacted', acts);
assert(
  res6a.allowed === false && res6b.allowed === true,
  'CASE 6: Step 1 (New -> Contacted) still works exactly as before',
  `No Act: ${res6a.allowed} (Blocked), With Completed Act: ${res6b.allowed} (Allowed)`
);

// CASE 7: Existing leads already in Qualified/Proposal/Negotiation/Won/Lost
const leadQualified = { id: 'LD-007', name: 'Qualified Lead', stage: 'Qualified' };
const leadProposal = { id: 'LD-008', name: 'Proposal Lead', stage: 'Proposal' };
const res7a = validateLeadStageTransition(leadQualified, 'Proposal');
const res7b = validateLeadStageTransition(leadProposal, 'Negotiation');
assert(
  res7a.allowed === true && res7b.allowed === true,
  'CASE 7: Existing leads in other stages continue to work without disruption',
  `Qualified->Proposal: ${res7a.allowed}, Proposal->Negotiation: ${res7b.allowed}`
);

console.log('\n================================================================');
console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} Cases`);
console.log('================================================================');
