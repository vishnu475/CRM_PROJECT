import { Lead, Activity, Quotation } from '../../../types';

export interface StageTransitionResult {
  allowed: boolean;
  message?: string;
}

/**
 * Helper to determine if an activity represents a genuine customer negotiation or deal-terms response.
 */
export const isNegotiationInteraction = (act: Activity, lead: Lead): boolean => {
  if (act.status !== 'Completed') return false;

  const isRelated =
    act.relatedTo === lead.id ||
    act.relatedTo === lead.name ||
    (act.relatedTo && act.relatedTo.includes(lead.name)) ||
    (act.relatedTo && act.relatedTo.includes(lead.id));

  if (!isRelated) return false;

  // 1. Explicit purpose set to 'Negotiation'
  if (act.purpose === 'Negotiation') {
    return true;
  }

  // 2. Semantic analysis of title and outcome text
  const combinedText = `${act.title || ''} ${act.outcome || ''}`.toLowerCase().trim();
  if (!combinedText) return false;

  const passivePhrases = [
    'proposal sent',
    'sent proposal',
    'sent quote',
    'quotation sent',
    'will review',
    'we will review',
    'reviewing proposal',
    'acknowledg',
    'received proposal',
  ];

  const isPassive = passivePhrases.some((phrase) => combinedText.includes(phrase));

  const negotiationKeywords = [
    'discount',
    'price reduction',
    'pricing',
    'price negotiation',
    'rates',
    'payment terms',
    'milestone payment',
    'net 30',
    'net 60',
    'additional feature',
    'additional service',
    'customization',
    'scope change',
    'scope revision',
    'implementation timeline',
    'delivery timeline',
    'timeline negotiation',
    'contract change',
    'contract terms',
    'clauses',
    'legal review terms',
    'counter-offer',
    'counter offer',
    'counter proposal',
    'commercial terms',
    'negotiat',
    'budget constraint',
    'concession',
    'deal terms',
  ];

  const hasNegotiationKeyword = negotiationKeywords.some((keyword) => combinedText.includes(keyword));

  if (isPassive && !hasNegotiationKeyword) {
    return false;
  }

  return hasNegotiationKeyword;
};

/**
 * Helper to determine if an activity represents a customer acceptance or deal closure.
 */
export const isDealAcceptedInteraction = (act: Activity, lead: Lead): boolean => {
  if (act.status !== 'Completed') return false;

  const isRelated =
    act.relatedTo === lead.id ||
    act.relatedTo === lead.name ||
    (act.relatedTo && act.relatedTo.includes(lead.name)) ||
    (act.relatedTo && act.relatedTo.includes(lead.id));

  if (!isRelated) return false;

  // 1. Explicit purpose set to 'Customer Acceptance' or 'Deal Closed'
  if (act.purpose === 'Customer Acceptance' || act.purpose === 'Deal Closed') {
    return true;
  }

  // 2. Semantic analysis of title and outcome text
  const combinedText = `${act.title || ''} ${act.outcome || ''}`.toLowerCase().trim();
  if (!combinedText) return false;

  const acceptanceKeywords = [
    'accepted',
    'deal closed',
    'deal won',
    'closed won',
    'contract signed',
    'signed contract',
    'agreement signed',
    'signed agreement',
    'po received',
    'purchase order received',
    'order confirmed',
    'order confirmation',
    'deal agreed',
    'approved proposal',
    'proposal accepted',
    'client confirmed',
    'customer accepted',
    'terms accepted',
    'verbal confirmation',
    'deal finalized',
    'final approval received',
    'deal won confirmation',
    'won deal',
  ];

  return acceptanceKeywords.some((keyword) => combinedText.includes(keyword));
};

/**
 * Validates lead stage transitions according to CRM workflow business rules.
 * 
 * STEP 1 RULE:
 * New -> Contacted requires at least one completed interaction (Call, Email, or Meeting).
 * 
 * STEP 2 RULE:
 * Contacted -> Qualified requires four valid qualification fields:
 * 1. Requirement (meaningful text)
 * 2. Budget (positive monetary value > 0)
 * 3. Decision Maker (identified contact/decision maker)
 * 4. Expected Closing Date (valid date)
 * 
 * STEP 3 RULE:
 * Qualified -> Proposal requires a valid proposal/quotation with:
 * 1. Proposal Amount (> 0)
 * 2. Proposal Date (valid date)
 * 3. Proposal Status ('Sent' - Draft is not allowed)
 * 4. Sent Date (valid date when status is Sent)
 * 
 * STEP 4 RULE:
 * Proposal -> Negotiation requires:
 * 1. Lead is currently in Proposal (no stage skipping).
 * 2. At least one completed interaction that represents an actual customer negotiation/discussion.
 * 
 * STEP 5 RULE:
 * Negotiation -> Won requires:
 * 1. Lead is currently in Negotiation (no stage skipping).
 * 2. Valid positive Final Agreed Amount (> 0).
 * 3. Valid Closed/Won Date.
 * 4. Explicit confirmation that customer accepted the deal (completed Customer Acceptance / Deal Closed activity).
 */
export const validateLeadStageTransition = (
  lead: Lead,
  targetStage: Lead['stage'],
  activities: Activity[] = [],
  quotations: Quotation[] = []
): StageTransitionResult => {
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
    const missingFields: string[] = [];

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
    const linkedQuotation = quotations.find((q) =>
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

  // STEP 4: Validation for Proposal -> Negotiation
  if (targetStage === 'Negotiation') {
    // Prevent stage skipping (e.g. from New/Contacted/Qualified directly to Negotiation)
    if (currentStage !== 'Proposal') {
      return {
        allowed: false,
        message: `Lead must be in "Proposal" stage with a sent proposal before moving to "Negotiation". Current stage is "${currentStage}".`,
      };
    }

    const hasNegotiationActivity = activities.some((act) => isNegotiationInteraction(act, lead));

    if (!hasNegotiationActivity) {
      return {
        allowed: false,
        message: 'Record a completed customer negotiation or response before moving this lead to Negotiation.',
      };
    }
  }

  // STEP 5: Validation for Negotiation -> Won
  if (targetStage === 'Won') {
    // Prevent stage skipping (e.g. from New/Contacted/Qualified/Proposal directly to Won)
    if (currentStage !== 'Negotiation') {
      return {
        allowed: false,
        message: `Lead must be in "Negotiation" stage before moving to "Won". Current stage is "${currentStage}".`,
      };
    }

    const missingWonRequirements: string[] = [];

    // 1. Customer Acceptance Confirmation Activity
    const hasAcceptanceActivity = activities.some((act) => isDealAcceptedInteraction(act, lead));
    if (!hasAcceptanceActivity) {
      missingWonRequirements.push('Customer Acceptance (completed activity confirming deal acceptance/closure)');
    }

    // 2. Final Agreed Amount (> 0)
    const finalAmount =
      lead.finalAgreedAmount !== undefined && Number(lead.finalAgreedAmount) > 0
        ? Number(lead.finalAgreedAmount)
        : lead.value !== undefined && Number(lead.value) > 0
        ? Number(lead.value)
        : lead.budget !== undefined && Number(lead.budget) > 0
        ? Number(lead.budget)
        : 0;

    if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount)) {
      missingWonRequirements.push('Final Agreed Amount (valid positive number)');
    }

    // 3. Closed/Won Date
    const wonDate = (lead.wonDate || lead.expectedCloseDate || '').trim();
    if (!wonDate) {
      missingWonRequirements.push('Closed/Won Date');
    }

    if (missingWonRequirements.length > 0) {
      if (missingWonRequirements.length === 1) {
        if (!hasAcceptanceActivity) {
          return {
            allowed: false,
            message: 'Record a completed customer acceptance or deal closure activity before marking this deal as Won.',
          };
        }
        if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount)) {
          return {
            allowed: false,
            message: 'Please provide a valid positive Final Agreed Amount before marking this deal as Won.',
          };
        }
        if (!wonDate) {
          return {
            allowed: false,
            message: 'Please provide the Closed/Won Date before marking this deal as Won.',
          };
        }
      }

      return {
        allowed: false,
        message: `Complete the following requirements before moving this lead to Won:\n• ${missingWonRequirements.join('\n• ')}`,
      };
    }
  }

  // All other stage transitions are allowed (reserved for future step rules)
  return { allowed: true };
};
