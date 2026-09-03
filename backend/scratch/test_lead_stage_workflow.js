// Test suite for CRM Lead-Stage Workflow Validation (Step 1: New -> Contacted)

function validateLeadStageTransition(lead, targetStage, activities) {
  const currentStage = lead.stage;

  // No change in stage
  if (currentStage === targetStage) {
    return { allowed: true };
  }

  // STEP 1 ONLY: Validation for New -> Contacted
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

  // All other stage transitions are allowed (reserved for future step rules)
  return { allowed: true };
}

console.log('================================================================');
console.log('🧪 RUNNING LEAD-STAGE WORKFLOW VALIDATION TESTS (STEP 1 ONLY)');
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

// Lead Base
const leadNew = { id: 'LD-001', name: 'Rajesh Kumar', stage: 'New', company: 'Tata Tech' };
const leadContacted = { id: 'LD-002', name: 'Anita Sharma', stage: 'Contacted', company: 'Infosys' };

// --- CASE 1: New lead with no activities ---
const case1Res = validateLeadStageTransition(leadNew, 'Contacted', []);
assert(
  case1Res.allowed === false && case1Res.message === 'Please record a completed call, email, or meeting before moving this lead to Contacted.',
  'CASE 1: New lead with no activities -> BLOCKED',
  `Blocked with exact message: "${case1Res.message}"`
);

// --- CASE 2: New lead with an incomplete/pending call ---
const activitiesCase2 = [
  { id: 'ACT-1', title: 'Intro Call', type: 'Call', relatedTo: 'LD-001', status: 'Pending' }
];
const case2Res = validateLeadStageTransition(leadNew, 'Contacted', activitiesCase2);
assert(
  case2Res.allowed === false,
  'CASE 2: New lead with incomplete/pending call -> BLOCKED',
  `Status: Pending -> Allowed: ${case2Res.allowed}`
);

// --- CASE 3: New lead with a completed call ---
const activitiesCase3 = [
  { id: 'ACT-2', title: 'Intro Call', type: 'Call', relatedTo: 'LD-001', status: 'Completed' }
];
const case3Res = validateLeadStageTransition(leadNew, 'Contacted', activitiesCase3);
assert(
  case3Res.allowed === true,
  'CASE 3: New lead with completed call -> ALLOWED',
  `Status: Completed -> Allowed: ${case3Res.allowed}`
);

// --- CASE 4: New lead with a completed email ---
const activitiesCase4 = [
  { id: 'ACT-3', title: 'Introduction Email', type: 'Email', relatedTo: 'LD-001', status: 'Completed' }
];
const case4Res = validateLeadStageTransition(leadNew, 'Contacted', activitiesCase4);
assert(
  case4Res.allowed === true,
  'CASE 4: New lead with completed email -> ALLOWED',
  `Status: Completed -> Allowed: ${case4Res.allowed}`
);

// --- CASE 5: New lead with a completed meeting ---
const activitiesCase5 = [
  { id: 'ACT-4', title: 'Intro Demo Meeting', type: 'Meeting', relatedTo: 'LD-001', status: 'Completed' }
];
const case5Res = validateLeadStageTransition(leadNew, 'Contacted', activitiesCase5);
assert(
  case5Res.allowed === true,
  'CASE 5: New lead with completed meeting -> ALLOWED',
  `Status: Completed -> Allowed: ${case5Res.allowed}`
);

// --- CASE 6: Existing lead already in Contacted ---
const case6Res1 = validateLeadStageTransition(leadContacted, 'Qualified', []);
const case6Res2 = validateLeadStageTransition(leadContacted, 'Proposal', []);
assert(
  case6Res1.allowed === true && case6Res2.allowed === true,
  'CASE 6: Existing lead in Contacted -> Existing behavior preserved',
  `Contacted->Qualified: ${case6Res1.allowed}, Contacted->Proposal: ${case6Res2.allowed}`
);

console.log('\n================================================================');
console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} Cases`);
console.log('================================================================');
