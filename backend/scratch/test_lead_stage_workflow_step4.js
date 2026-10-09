// Comprehensive test script for CRM Lead-Stage Workflow Validation (Steps 1, 2, 3 & 4)
import { isNegotiationInteraction, validateLeadStageTransition } from './workflowValidationStandalone.js';

// Standalone runner
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

const baseProposalLead = {
  id: 'lead-1',
  name: 'Michelle Robinson',
  company: 'Echo Innovations',
  stage: 'Proposal',
  requirement: 'Enterprise ERP Suite Migration',
  budget: 500000,
  decisionMaker: 'Michelle Robinson',
  expectedCloseDate: '2026-10-31',
  proposalAmount: 500000,
  proposalDate: '2026-09-04',
  proposalStatus: 'Sent',
  proposalSentDate: '2026-09-04',
};

const baseQuotation = {
  id: 'quote-1',
  leadId: 'lead-1',
  customerId: 'lead-1',
  customerName: 'Michelle Robinson',
  amount: 500000,
  date: '2026-09-04',
  status: 'Sent',
  sentDate: '2026-09-04',
};

console.log('================================================================');
console.log('🧪 RUNNING LEAD-STAGE WORKFLOW VALIDATION TESTS (STEP 4 FOCUS)');
console.log('================================================================');

// TEST 1: Proposal lead with No activities -> Proposal → Negotiation BLOCKED
const res1 = validateLeadStageTransition(baseProposalLead, 'Negotiation', [], [baseQuotation]);
assert(res1.allowed === false && res1.message.includes('completed customer negotiation'), 'TEST 1: Proposal lead with no activities is BLOCKED');

// TEST 2: Proposal lead with Only "Proposal Sent" activity -> BLOCKED
const actProposalSent = [{
  id: 'act-1',
  title: 'Proposal sent by email',
  outcome: 'Quotation sent to client for review',
  status: 'Completed',
  type: 'Email',
  purpose: 'General',
  relatedTo: 'lead-1',
}];
const res2 = validateLeadStageTransition(baseProposalLead, 'Negotiation', actProposalSent, [baseQuotation]);
assert(res2.allowed === false, 'TEST 2: Proposal lead with only "Proposal sent" activity is BLOCKED');

// TEST 3: Proposal lead with Completed normal follow-up activity ("Thank you, we will review it") -> BLOCKED
const actPassiveReview = [{
  id: 'act-2',
  title: 'Proposal follow up call',
  outcome: 'Thank you, we will review it and get back.',
  status: 'Completed',
  type: 'Call',
  purpose: 'Follow-up',
  relatedTo: 'lead-1',
}];
const res3 = validateLeadStageTransition(baseProposalLead, 'Negotiation', actPassiveReview, [baseQuotation]);
assert(res3.allowed === false, 'TEST 3: Proposal lead with passive "will review" follow-up is BLOCKED');

// TEST 4: Proposal lead with Completed negotiation activity: "Customer requested price reduction." -> ALLOWED
const actPriceReduction = [{
  id: 'act-3',
  title: 'Discount negotiation call',
  outcome: 'Customer requested price reduction of 10% on annual licenses.',
  status: 'Completed',
  type: 'Call',
  purpose: 'Negotiation',
  relatedTo: 'lead-1',
}];
const res4 = validateLeadStageTransition(baseProposalLead, 'Negotiation', actPriceReduction, [baseQuotation]);
assert(res4.allowed === true, 'TEST 4: Proposal lead with price reduction negotiation is ALLOWED');

// TEST 5: Proposal lead with Completed negotiation activity: "Customer requested different payment terms." -> ALLOWED
const actPaymentTerms = [{
  id: 'act-4',
  title: 'Payment terms discussion',
  outcome: 'Customer requested different payment terms (Net 60 instead of upfront).',
  status: 'Completed',
  type: 'Email',
  purpose: 'General',
  relatedTo: 'lead-1',
}];
const res5 = validateLeadStageTransition(baseProposalLead, 'Negotiation', actPaymentTerms, [baseQuotation]);
assert(res5.allowed === true, 'TEST 5: Proposal lead with payment terms negotiation is ALLOWED');

// TEST 6: Proposal lead with Completed negotiation activity: "Customer requested additional features." -> ALLOWED
const actAdditionalFeatures = [{
  id: 'act-5',
  title: 'Customization scope meeting',
  outcome: 'Customer requested additional features and module integration.',
  status: 'Completed',
  type: 'Meeting',
  purpose: 'Negotiation',
  relatedTo: 'lead-1',
}];
const res6 = validateLeadStageTransition(baseProposalLead, 'Negotiation', actAdditionalFeatures, [baseQuotation]);
assert(res6.allowed === true, 'TEST 6: Proposal lead with additional features request is ALLOWED');

// TEST 7: Lead is still Qualified -> Qualified → Negotiation BLOCKED (no stage skipping)
const qualifiedLead = { ...baseProposalLead, stage: 'Qualified' };
const res7 = validateLeadStageTransition(qualifiedLead, 'Negotiation', actPriceReduction, [baseQuotation]);
assert(res7.allowed === false && res7.message.includes('must be in "Proposal" stage'), 'TEST 7: Qualified lead jumping to Negotiation is BLOCKED');

// TEST 8: Lead already in Negotiation -> No transition block
const negLead = { ...baseProposalLead, stage: 'Negotiation' };
const res8 = validateLeadStageTransition(negLead, 'Negotiation', [], []);
assert(res8.allowed === true, 'TEST 8: Lead already in Negotiation stays in Negotiation (ALLOWED)');

// TEST 9: Step 1 (New -> Contacted requires completed Call/Email/Meeting) is preserved
const newLead = { ...baseProposalLead, stage: 'New' };
const res9NoAct = validateLeadStageTransition(newLead, 'Contacted', [], []);
const res9WithAct = validateLeadStageTransition(newLead, 'Contacted', [{
  id: 'act-0',
  title: 'Intro call',
  type: 'Call',
  status: 'Completed',
  relatedTo: 'lead-1',
}], []);
assert(res9NoAct.allowed === false && res9WithAct.allowed === true, 'TEST 9: Step 1 (New -> Contacted) is fully preserved');

// TEST 10: Step 2 (Contacted -> Qualified requires 4 qualification fields) is preserved
const contactedIncomplete = { ...baseProposalLead, stage: 'Contacted', budget: 0 };
const contactedComplete = { ...baseProposalLead, stage: 'Contacted', budget: 300000 };
const res10Incomplete = validateLeadStageTransition(contactedIncomplete, 'Qualified', [], []);
const res10Complete = validateLeadStageTransition(contactedComplete, 'Qualified', [], []);
assert(res10Incomplete.allowed === false && res10Complete.allowed === true, 'TEST 10: Step 2 (Contacted -> Qualified) is fully preserved');

// TEST 11: Step 3 (Qualified -> Proposal requires a SENT proposal) is preserved
const qualNoQuote = { ...baseProposalLead, stage: 'Qualified', proposalStatus: 'Draft' };
const res11Draft = validateLeadStageTransition(qualNoQuote, 'Proposal', [], [{ ...baseQuotation, status: 'Draft' }]);
const res11Sent = validateLeadStageTransition(qualNoQuote, 'Proposal', [], [baseQuotation]);
assert(res11Draft.allowed === false && res11Sent.allowed === true, 'TEST 11: Step 3 (Qualified -> Proposal) is fully preserved');

console.log('================================================================');
console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} Tests`);
console.log('================================================================');

if (failed > 0) process.exit(1);
