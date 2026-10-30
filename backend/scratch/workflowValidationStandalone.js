// Standalone runner for testing Step 4 CRM Lead Stage transition rules
import assert from 'assert';

const validateLeadStageTransition = (lead, targetStage, activities = [], quotations = []) => {
  const currentStage = lead.stage;

  if (currentStage === targetStage) {
    return { allowed: true };
  }

  if (currentStage === 'Lost') {
    return {
      allowed: false,
      message: `Cannot move lead from "Lost" to "${targetStage}". Deals marked as Lost cannot be transitioned to active stages.`,
    };
  }
  if (currentStage === 'Won') {
    return {
      allowed: false,
      message: `Cannot move lead from "Won" to "${targetStage}". Deals marked as Won are closed and finalized.`,
    };
  }

  if (targetStage === 'Won') {
    return {
      allowed: false,
      message: 'Lead stage cannot be manually changed to Won. Won is an outcome reached when the linked quotation in Sales is accepted.',
    };
  }

  if (targetStage === 'Lost') {
    const lostReason = (lead.lostReason || '').trim();
    if (!lostReason) {
      return {
        allowed: false,
        message: 'Please provide a valid Lost Reason before marking this lead as Lost.',
      };
    }

    if (lostReason.toLowerCase() === 'other') {
      const otherDetails = (lead.lostReasonDetails || '').trim();
      const lostNotes = (lead.lostNotes || '').trim();
      if (!otherDetails && !lostNotes) {
        return {
          allowed: false,
          message: 'Please provide a custom explanation when selecting "Other" as the Lost Reason.',
        };
      }
    }

    const lostNotes = (lead.lostNotes || '').trim();
    if (!lostNotes) {
      return {
        allowed: false,
        message: 'Please provide Lost Notes/Comments explaining why this deal was lost.',
      };
    }

    return { allowed: true };
  }

  const validLeadStages = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
  if (!validLeadStages.includes(targetStage)) {
    return {
      allowed: false,
      message: `"${targetStage}" is not a valid CRM lead stage.`,
    };
  }

  const stageOrder = ['New', 'Contacted', 'Qualified'];
  const currentIndex = stageOrder.indexOf(currentStage);
  const targetIndex = stageOrder.indexOf(targetStage);

  if (currentIndex !== -1 && targetIndex !== -1) {
    if (targetIndex < currentIndex) {
      return {
        allowed: false,
        message: `Backward stage transition from "${currentStage}" to "${targetStage}" is not allowed.`,
      };
    }

    if (targetIndex > currentIndex + 1) {
      return {
        allowed: false,
        message: `Stage skipping is not allowed. Lead must move from "${currentStage}" to "${stageOrder[currentIndex + 1]}" first.`,
      };
    }
  }

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

    return { allowed: true };
  }

  if (currentStage === 'Contacted' && targetStage === 'Qualified') {
    const req = (lead.requirement || '').trim();
    const budget = Number(lead.budget || lead.value || 0);
    const dm = (lead.decisionMaker || lead.contactPerson || '').trim();
    const date = (lead.expectedCloseDate || '').trim();

    if (!req || req.length < 10 || budget <= 0 || !dm || !date) {
      return {
        allowed: false,
        message: 'Complete all 4 qualification details before moving this lead to Qualified.',
      };
    }

    return { allowed: true };
  }

  return { allowed: true };
};

console.log('=== RUNNING STANDALONE CRM STAGE RULE TESTS (STEP 4) ===\n');

const baseLead = {
  id: 'LD-001',
  name: 'Acme Corp Lead',
  stage: 'New',
  requirement: 'Enterprise ERP software implementation.',
  budget: 250000,
  decisionMaker: 'Jane Doe',
  expectedCloseDate: '2026-12-31',
};

// 1. New -> Contacted with/without activity
assert.strictEqual(validateLeadStageTransition(baseLead, 'Contacted', []).allowed, false);
assert.strictEqual(
  validateLeadStageTransition(baseLead, 'Contacted', [
    { relatedTo: 'LD-001', type: 'Call', status: 'Completed' },
  ]).allowed,
  true
);
console.log('✔ Test 1 Passed: New -> Contacted requires activity');

// 2. Stage Skipping (New -> Qualified directly)
assert.strictEqual(validateLeadStageTransition(baseLead, 'Qualified', []).allowed, false);
console.log('✔ Test 2 Passed: Stage skipping (New -> Qualified) blocked');

// 3. Contacted -> Qualified requires qualification fields
const contactedLead = { ...baseLead, stage: 'Contacted' };
assert.strictEqual(validateLeadStageTransition(contactedLead, 'Qualified').allowed, true);
assert.strictEqual(
  validateLeadStageTransition({ ...contactedLead, requirement: 'Short' }, 'Qualified').allowed,
  false
);
console.log('✔ Test 3 Passed: Contacted -> Qualified qualification validation enforced');

// 4. Backward stage transitions
const qualifiedLead = { ...baseLead, stage: 'Qualified' };
assert.strictEqual(validateLeadStageTransition(qualifiedLead, 'Contacted').allowed, false);
assert.strictEqual(validateLeadStageTransition(contactedLead, 'New').allowed, false);
console.log('✔ Test 4 Passed: Backward transitions blocked');

// 5. Direct manual Won blocked
assert.strictEqual(validateLeadStageTransition(qualifiedLead, 'Won').allowed, false);
console.log('✔ Test 5 Passed: Direct manual Won transition blocked');

// 6. Lost requires reason and notes
assert.strictEqual(validateLeadStageTransition(qualifiedLead, 'Lost').allowed, false);
assert.strictEqual(
  validateLeadStageTransition(
    { ...qualifiedLead, lostReason: 'Budget too high', lostNotes: 'Client budget constraints' },
    'Lost'
  ).allowed,
  true
);
console.log('✔ Test 6 Passed: Lost workflow validation enforced');

// 7. Reactivation of Lost / Won blocked
const lostLead = { ...baseLead, stage: 'Lost', lostReason: 'Budget too high', lostNotes: 'Notes' };
assert.strictEqual(validateLeadStageTransition(lostLead, 'Contacted').allowed, false);
const wonLead = { ...baseLead, stage: 'Won' };
assert.strictEqual(validateLeadStageTransition(wonLead, 'Qualified').allowed, false);
console.log('✔ Test 7 Passed: Reactivation of Lost/Won leads blocked');

// 8. Obsolete stages (Proposal / Negotiation) blocked
assert.strictEqual(validateLeadStageTransition(qualifiedLead, 'Proposal').allowed, false);
assert.strictEqual(validateLeadStageTransition(qualifiedLead, 'Negotiation').allowed, false);
console.log('✔ Test 8 Passed: Obsolete Proposal/Negotiation stages blocked');

console.log('\n=== RUNNING STEP 5 QUOTATION DECISION & CRM LEAD SYNC TESTS ===\n');

// Simulated DB Transaction Runner for Quotation decisions
function simulateQuotationDecision(quotation, lead, decisionPayload) {
  const { status, lostReason, lostReasonDetails, lostNotes } = decisionPayload;
  
  if (status === 'Accepted') {
    if (lead && lead.stage === 'Lost') {
      return { success: false, message: 'Cannot accept quotation: linked CRM lead is marked as Lost.' };
    }
    const updatedQuotation = { ...quotation, status: 'Accepted', acceptedDate: '2026-10-09' };
    const updatedLead = lead
      ? {
          ...lead,
          stage: 'Won',
          finalAgreedAmount: quotation.amount,
          wonDate: '2026-10-09',
        }
      : null;
    return { success: true, quotation: updatedQuotation, lead: updatedLead };
  }

  if (status === 'Rejected') {
    if (lead && lead.stage === 'Won') {
      return { success: false, message: 'Cannot reject quotation: linked CRM lead is already marked as Won.' };
    }
    if (lead) {
      const reason = (lostReason || lead.lostReason || '').trim();
      const notes = (lostNotes || lead.lostNotes || '').trim();
      if (!reason) {
        return { success: false, message: 'Please provide a valid Lost Reason before rejecting the quotation.' };
      }
      if (reason.toLowerCase() === 'other' && !(lostReasonDetails || '').trim() && !notes) {
        return { success: false, message: 'Please provide a custom explanation when selecting "Other" as the Lost Reason.' };
      }
      if (!notes) {
        return { success: false, message: 'Please provide Lost Notes/Comments explaining why this deal was lost.' };
      }

      const updatedQuotation = { ...quotation, status: 'Rejected' };
      const updatedLead = {
        ...lead,
        stage: 'Lost',
        lostReason: reason,
        lostReasonDetails: lostReasonDetails || null,
        lostNotes: notes,
        lostDate: '2026-10-09',
      };
      return { success: true, quotation: updatedQuotation, lead: updatedLead };
    } else {
      // Quotation not linked to lead
      const updatedQuotation = { ...quotation, status: 'Rejected' };
      return { success: true, quotation: updatedQuotation, lead: null };
    }
  }

  return { success: false, message: 'Invalid status' };
}

// Test Step 5.1: Accept quotation updates linked lead to Won
const testQuote1 = { id: 'QT-101', quoteNumber: 'QT-2026-001', leadId: 'LD-001', amount: 50000, status: 'Sent' };
const res1 = simulateQuotationDecision(testQuote1, { ...baseLead, stage: 'Qualified' }, { status: 'Accepted' });
assert.strictEqual(res1.success, true);
assert.strictEqual(res1.quotation.status, 'Accepted');
assert.strictEqual(res1.lead.stage, 'Won');
assert.strictEqual(res1.lead.finalAgreedAmount, 50000);
console.log('✔ Test 9 Passed: Accepting quotation updates linked lead to Won with amount & wonDate');

// Test Step 5.2: Reject quotation without lost reason/notes is rejected
const res2 = simulateQuotationDecision(testQuote1, { ...baseLead, stage: 'Qualified' }, { status: 'Rejected' });
assert.strictEqual(res2.success, false);
assert.match(res2.message, /Lost Reason/);
console.log('✔ Test 10 Passed: Rejecting linked quotation without Lost Reason & Notes is rejected');

// Test Step 5.3: Reject quotation with lost reason/notes updates lead to Lost atomically
const res3 = simulateQuotationDecision(
  testQuote1, 
  { ...baseLead, stage: 'Qualified' }, 
  { status: 'Rejected', lostReason: 'Price / Budget Constraints', lostNotes: 'Customer opted for cheaper alternative' }
);
assert.strictEqual(res3.success, true);
assert.strictEqual(res3.quotation.status, 'Rejected');
assert.strictEqual(res3.lead.stage, 'Lost');
assert.strictEqual(res3.lead.lostReason, 'Price / Budget Constraints');
console.log('✔ Test 11 Passed: Rejecting linked quotation with valid Lost Reason & Notes updates lead to Lost');

// Test Step 5.4: Unlinked quotation rejection does not modify unrelated leads
const unlinkedQuote = { id: 'QT-999', quoteNumber: 'QT-2026-999', leadId: null, amount: 12000, status: 'Sent' };
const res4 = simulateQuotationDecision(unlinkedQuote, null, { status: 'Rejected' });
assert.strictEqual(res4.success, true);
assert.strictEqual(res4.quotation.status, 'Rejected');
assert.strictEqual(res4.lead, null);
console.log('✔ Test 12 Passed: Unlinked quotation modification does not affect any CRM lead');

// Test Step 5.5: Rejecting quotation when lead is already Won is blocked
const res5 = simulateQuotationDecision(testQuote1, { ...baseLead, stage: 'Won' }, { status: 'Rejected', lostReason: 'Price', lostNotes: 'Notes' });
assert.strictEqual(res5.success, false);
assert.match(res5.message, /already marked as Won/);
console.log('✔ Test 13 Passed: Cannot reject quotation if linked lead is already Won');

console.log('\n=== ALL WORKFLOW & STEP 5 SYNCHRONIZATION TESTS PASSED SUCCESSFULLY! ===');
