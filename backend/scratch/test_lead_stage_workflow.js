// Comprehensive Test Suite for CRM Lead-Stage Workflow Validation
// Steps Covered:
// Step 1: New -> Contacted (Completed interaction required)
// Step 2: Contacted -> Qualified (4 qualification fields required)
// Step 3: Qualified -> Proposal (Sent proposal with valid amount, date, and sent date required)

function validateLeadStageTransition(lead, targetStage, activities = [], quotations = []) {
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

  // STEP 3: Validation for Qualified -> Proposal
  if (currentStage === 'Qualified' && targetStage === 'Proposal') {
    // Look for associated quotation in quotations array
    const linkedQuotation = (quotations || []).find((q) =>
      q.customerId === lead.id ||
      q.leadId === lead.id ||
      q.customerName === lead.name ||
      (q.customerId && q.customerId.includes(lead.id)) ||
      (q.customerName && lead.name && q.customerName.toLowerCase() === lead.name.toLowerCase())
    );

    // Has a proposal been created (either via Quotations or direct Lead proposal fields)?
    const hasProposal =
      !!linkedQuotation ||
      lead.proposalStatus !== undefined ||
      (lead.proposalAmount !== undefined && lead.proposalAmount > 0) ||
      (lead.proposalDate !== undefined && lead.proposalDate.trim().length > 0);

    if (!hasProposal) {
      return {
        allowed: false,
        message: 'Please create and send a proposal before moving this lead to Proposal.',
      };
    }

    const proposalStatus = (linkedQuotation?.status || lead.proposalStatus || 'Draft');
    const proposalAmount =
      linkedQuotation?.amount !== undefined
        ? Number(linkedQuotation.amount)
        : lead.proposalAmount !== undefined
        ? Number(lead.proposalAmount)
        : 0;
    const proposalDate = (linkedQuotation?.date || lead.proposalDate || '').trim();
    const sentDate = (linkedQuotation?.sentDate || lead.proposalSentDate || '').trim();

    // Check Proposal Amount
    if (!proposalAmount || proposalAmount <= 0 || isNaN(proposalAmount)) {
      return {
        allowed: false,
        message: 'Please provide a valid positive proposal amount before moving this lead to Proposal.',
      };
    }

    // Check Proposal Date
    if (!proposalDate) {
      return {
        allowed: false,
        message: 'Please provide a valid proposal date before moving this lead to Proposal.',
      };
    }

    // Check Proposal Status (must be 'Sent')
    if (proposalStatus !== 'Sent') {
      return {
        allowed: false,
        message: 'Please send the proposal before moving this lead to Proposal.',
      };
    }

    // Check Sent Date (must exist when status is Sent)
    if (!sentDate) {
      return {
        allowed: false,
        message: 'Please provide the sent date for the proposal before moving this lead to Proposal.',
      };
    }
  }

  // All other stage transitions are allowed (reserved for future step rules)
  return { allowed: true };
}

console.log('================================================================');
console.log('🧪 RUNNING LEAD-STAGE WORKFLOW VALIDATION TESTS (STEPS 1, 2 & 3)');
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

// TEST 1: Qualified lead, No proposal
const lead1 = { id: 'LD-201', name: 'Acme Corp', stage: 'Qualified' };
const res1 = validateLeadStageTransition(lead1, 'Proposal', [], []);
assert(
  res1.allowed === false && res1.message === 'Please create and send a proposal before moving this lead to Proposal.',
  'TEST 1: Qualified lead with no proposal -> BLOCKED',
  `Message: "${res1.message}"`
);

// TEST 2: Qualified lead, Proposal exists with Status = Draft
const lead2 = { id: 'LD-202', name: 'Global Tech', stage: 'Qualified' };
const quoteDraft = { id: 'QT-202', customerId: 'LD-202', amount: 300000, date: '2026-09-03', status: 'Draft' };
const res2 = validateLeadStageTransition(lead2, 'Proposal', [], [quoteDraft]);
assert(
  res2.allowed === false && res2.message === 'Please send the proposal before moving this lead to Proposal.',
  'TEST 2: Qualified lead with Draft proposal -> BLOCKED',
  `Message: "${res2.message}"`
);

// TEST 3: Qualified lead, Proposal exists with Status = Sent, valid amount, date, sentDate
const lead3 = { id: 'LD-203', name: 'Nexus Solutions', stage: 'Qualified' };
const quoteSent = { id: 'QT-203', customerId: 'LD-203', amount: 450000, date: '2026-09-01', status: 'Sent', sentDate: '2026-09-02' };
const res3 = validateLeadStageTransition(lead3, 'Proposal', [], [quoteSent]);
assert(
  res3.allowed === true,
  'TEST 3: Qualified lead with Sent proposal (valid amount, date, sentDate) -> ALLOWED',
  `Allowed: ${res3.allowed}`
);

// TEST 4: Proposal amount = 0
const lead4 = { id: 'LD-204', name: 'Zero Amount Inc', stage: 'Qualified' };
const quoteZero = { id: 'QT-204', customerId: 'LD-204', amount: 0, date: '2026-09-03', status: 'Sent', sentDate: '2026-09-03' };
const res4 = validateLeadStageTransition(lead4, 'Proposal', [], [quoteZero]);
assert(
  res4.allowed === false && res4.message === 'Please provide a valid positive proposal amount before moving this lead to Proposal.',
  'TEST 4: Proposal amount = 0 -> BLOCKED',
  `Message: "${res4.message}"`
);

// TEST 5: Proposal amount = negative
const lead5 = { id: 'LD-205', name: 'Negative Amount Ltd', stage: 'Qualified' };
const quoteNeg = { id: 'QT-205', customerId: 'LD-205', amount: -5000, date: '2026-09-03', status: 'Sent', sentDate: '2026-09-03' };
const res5 = validateLeadStageTransition(lead5, 'Proposal', [], [quoteNeg]);
assert(
  res5.allowed === false && res5.message === 'Please provide a valid positive proposal amount before moving this lead to Proposal.',
  'TEST 5: Proposal amount = negative -> BLOCKED',
  `Message: "${res5.message}"`
);

// TEST 6: Status = Sent, Sent Date missing
const lead6 = { id: 'LD-206', name: 'Missing Sent Date Co', stage: 'Qualified' };
const quoteNoSentDate = { id: 'QT-206', customerId: 'LD-206', amount: 200000, date: '2026-09-03', status: 'Sent', sentDate: '' };
const res6 = validateLeadStageTransition(lead6, 'Proposal', [], [quoteNoSentDate]);
assert(
  res6.allowed === false && res6.message === 'Please provide the sent date for the proposal before moving this lead to Proposal.',
  'TEST 6: Status = Sent, Sent Date missing -> BLOCKED',
  `Message: "${res6.message}"`
);

// TEST 7: Create Draft proposal -> Verify lead remains Qualified
const lead7 = { id: 'LD-207', name: 'Draft Test Lead', stage: 'Qualified' };
const quote7Draft = { id: 'QT-207', customerId: 'LD-207', amount: 150000, date: '2026-09-03', status: 'Draft' };
const res7 = validateLeadStageTransition(lead7, 'Proposal', [], [quote7Draft]);
assert(
  lead7.stage === 'Qualified' && res7.allowed === false,
  'TEST 7: Lead with Draft proposal remains in Qualified stage',
  `Lead stage: ${lead7.stage}, Transition allowed: ${res7.allowed}`
);

// TEST 8: Change proposal to Sent -> Verify lead can now move to Proposal
const quote7Sent = { ...quote7Draft, status: 'Sent', sentDate: '2026-09-03' };
const res8 = validateLeadStageTransition(lead7, 'Proposal', [], [quote7Sent]);
assert(
  res8.allowed === true,
  'TEST 8: Once proposal is marked Sent, Qualified -> Proposal transition is ALLOWED',
  `Transition allowed: ${res8.allowed}`
);

// TEST 9: Step 1 still works: New -> Contacted requires completed interaction
const leadNewNoAct = { id: 'LD-100', name: 'Step 1 Lead', stage: 'New' };
const actCallCompleted = { id: 'ACT-1', relatedTo: 'LD-100', type: 'Call', status: 'Completed' };
const actCallPending = { id: 'ACT-2', relatedTo: 'LD-100', type: 'Call', status: 'Pending' };

const res9a = validateLeadStageTransition(leadNewNoAct, 'Contacted', []);
const res9b = validateLeadStageTransition(leadNewNoAct, 'Contacted', [actCallPending]);
const res9c = validateLeadStageTransition(leadNewNoAct, 'Contacted', [actCallCompleted]);

assert(
  res9a.allowed === false && res9b.allowed === false && res9c.allowed === true,
  'TEST 9: Step 1 (New -> Contacted requires completed Call/Email/Meeting) is fully preserved',
  `No Act: ${res9a.allowed}, Pending Act: ${res9b.allowed}, Completed Act: ${res9c.allowed}`
);

// TEST 10: Step 2 still works: Contacted -> Qualified requires all 4 qualification details
const leadContactedIncomplete = { id: 'LD-101', name: 'Step 2 Lead', stage: 'Contacted', requirement: 'ERP' };
const leadContactedComplete = {
  id: 'LD-101',
  name: 'Step 2 Lead',
  stage: 'Contacted',
  requirement: 'Full ERP Implementation',
  budget: 500000,
  decisionMaker: 'Vikas Sharma',
  expectedCloseDate: '2026-11-30',
};

const res10a = validateLeadStageTransition(leadContactedIncomplete, 'Qualified');
const res10b = validateLeadStageTransition(leadContactedComplete, 'Qualified');

assert(
  res10a.allowed === false && res10b.allowed === true,
  'TEST 10: Step 2 (Contacted -> Qualified requires 4 qualification fields) is fully preserved',
  `Incomplete: ${res10a.allowed}, Complete: ${res10b.allowed}`
);

console.log('\n================================================================');
console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} Tests`);
console.log('================================================================');
