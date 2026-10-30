import { Lead, Activity, Quotation } from '../../../types';

export interface StageTransitionResult {
  allowed: boolean;
  message?: string;
  reason?: string;
}

export const MEANINGLESS_PLACEHOLDERS = new Set([
  'yes', 'ok', 'test', 'abc', '123', 'none', 'n/a', 'na', 'no', 'null', 'undefined', 'xyz'
]);

export function validateQualificationRequirement(val: string | undefined | null): { isValid: boolean; message?: string } {
  if (!val) return { isValid: false, message: 'Enter meaningful customer requirements.' };
  const trimmed = val.trim();
  if (!trimmed) return { isValid: false, message: 'Enter meaningful customer requirements.' };
  if (trimmed.length < 10) return { isValid: false, message: 'Enter meaningful customer requirements.' };
  if (trimmed.length > 5000) return { isValid: false, message: 'Requirement text cannot exceed 5000 characters.' };

  const lower = trimmed.toLowerCase();
  if (MEANINGLESS_PLACEHOLDERS.has(lower)) {
    return { isValid: false, message: 'Enter meaningful customer requirements.' };
  }

  return { isValid: true };
}

export function validateQualificationBudget(val: string | number | undefined | null): { isValid: boolean; message?: string } {
  if (val === undefined || val === null || val === '') {
    return { isValid: false, message: 'Enter a valid budget greater than ₹0.' };
  }
  const str = String(val).trim();
  if (!str) return { isValid: false, message: 'Enter a valid budget greater than ₹0.' };
  
  if (!/^[0-9]+(\.[0-9]+)?$/.test(str)) {
    return { isValid: false, message: 'Enter a valid budget greater than ₹0.' };
  }
  
  const num = Number(str);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, message: 'Enter a valid budget greater than ₹0.' };
  }
  return { isValid: true };
}

export function validateQualificationDecisionMaker(val: string | undefined | null): { isValid: boolean; message?: string } {
  if (!val) return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  const trimmed = val.trim();
  if (!trimmed) return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  if (trimmed.length < 2) return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  if (trimmed.length > 100) return { isValid: false, message: 'Decision Maker name cannot exceed 100 characters.' };

  if (/^[0-9]+$/.test(trimmed)) {
    return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  }

  if (!/^[a-zA-Z\s'\-\.]+$/.test(trimmed)) {
    return { isValid: false, message: 'Enter the name of the customer decision maker.' };
  }

  return { isValid: true };
}

export function validateQualificationExpectedCloseDate(val: string | undefined | null): { isValid: boolean; message?: string } {
  if (!val) return { isValid: false, message: 'Select today or a future expected close date.' };
  const trimmed = val.trim();
  if (!trimmed) return { isValid: false, message: 'Select today or a future expected close date.' };

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return { isValid: false, message: 'Select today or a future expected close date.' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = trimmed.split('-');
  let inputDate: Date;
  if (parts.length === 3) {
    inputDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    inputDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  if (inputDate.getTime() < today.getTime()) {
    return { isValid: false, message: 'Select today or a future expected close date.' };
  }

  return { isValid: true };
}

export function validateAllQualificationFields(form: {
  requirement?: string;
  budget?: string | number;
  decisionMaker?: string;
  expectedCloseDate?: string;
}): {
  isValid: boolean;
  errors: {
    requirement?: string;
    budget?: string;
    decisionMaker?: string;
    expectedCloseDate?: string;
  };
} {
  const reqRes = validateQualificationRequirement(form.requirement);
  const budgetRes = validateQualificationBudget(form.budget);
  const dmRes = validateQualificationDecisionMaker(form.decisionMaker);
  const dateRes = validateQualificationExpectedCloseDate(form.expectedCloseDate);

  const errors: {
    requirement?: string;
    budget?: string;
    decisionMaker?: string;
    expectedCloseDate?: string;
  } = {};

  if (!reqRes.isValid) errors.requirement = reqRes.message;
  if (!budgetRes.isValid) errors.budget = budgetRes.message;
  if (!dmRes.isValid) errors.decisionMaker = dmRes.message;
  if (!dateRes.isValid) errors.expectedCloseDate = dateRes.message;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

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

export const CRM_LOST_REASONS = [
  'Budget too high',
  'Customer chose competitor',
  'No requirement',
  'Customer not interested',
  'Timing issue',
  'Duplicate lead',
  'Unable to contact',
  'Other',
] as const;

export type CrmLostReason = (typeof CRM_LOST_REASONS)[number];

/**
 * Validates whether a lead is eligible for conversion to Customer, Contact, and Opportunity.
 * 
 * Conversion Eligibility Rules:
 * 1. lead.stage === "Won"
 * 2. lead.isConverted !== true
 */
export const validateLeadConversion = (lead: Lead): StageTransitionResult => {
  if (!lead) {
    return {
      allowed: false,
      message: 'Lead not found.',
      reason: 'Lead not found.',
    };
  }

  if (lead.isConverted) {
    return {
      allowed: false,
      message: 'This lead has already been converted into a Customer, Contact, and Opportunity.',
      reason: 'This lead has already been converted into a Customer, Contact, and Opportunity.',
    };
  }

  if (lead.stage !== 'Won') {
    return {
      allowed: false,
      message: `Only "Won" leads can be converted into Customers, Contacts, and Opportunities. Current stage is "${lead.stage}".`,
      reason: `Only "Won" leads can be converted into Customers, Contacts, and Opportunities. Current stage is "${lead.stage}".`,
    };
  }

  return { allowed: true };
};

/**
 * Validates lead stage transitions according to CRM workflow business rules.
 * 
 * CRM LEAD STAGES: New -> Contacted -> Qualified -> (Sales Quotation / Outcome: Won / Lost)
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
 * Qualified leads become eligible for quotation management in the Sales module.
 * Direct manual stage transitions to Won or Lost are prevented.
 * Stage skipping and backward transitions are blocked.
 */
export const validateLeadStageTransition = (
  lead: Lead,
  targetStage: Lead['stage'],
  activities: Activity[] = [],
  _quotations: Quotation[] = []
): StageTransitionResult => {
  const currentStage = lead.stage;

  // 1. No change in stage
  if (currentStage === targetStage) {
    return { allowed: true };
  }

  // 2. Once a lead is Lost or Won, it cannot be transitioned to active stages
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

  // 3. Direct transition to Won in CRM is blocked (Won is an outcome state reached via Sales/Quotation workflow)
  if (targetStage === 'Won') {
    return {
      allowed: false,
      message: 'Lead stage cannot be manually changed to Won. Won is an outcome reached when the linked quotation in Sales is accepted.',
    };
  }

  // 4. Moving a lead to Lost (Outcome state)
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

  // 5. Reject obsolete/unsupported Lead stages (e.g. Proposal, Negotiation)
  const validLeadStages = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
  if (!validLeadStages.includes(targetStage)) {
    return {
      allowed: false,
      message: `"${targetStage}" is not a valid CRM lead stage.`,
    };
  }

  // 6. Check for backward stage transitions
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

    // 7. Check for stage skipping (e.g., New -> Qualified)
    if (targetIndex > currentIndex + 1) {
      return {
        allowed: false,
        message: `Stage skipping is not allowed. Lead must move from "${currentStage}" to "${stageOrder[currentIndex + 1]}" first.`,
      };
    }
  }

  // 8. Stage-specific prerequisites
  // New -> Contacted: requires at least one completed interaction (Call, Email, or Meeting)
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

  // Contacted -> Qualified: requires requirement, positive budget > 0, decision maker, expected close date
  if (currentStage === 'Contacted' && targetStage === 'Qualified') {
    const valResult = validateAllQualificationFields({
      requirement: lead.requirement,
      budget: lead.budget !== undefined ? lead.budget : lead.value,
      decisionMaker: lead.decisionMaker || lead.contactPerson,
      expectedCloseDate: lead.expectedCloseDate,
    });

    if (!valResult.isValid) {
      const errorMsgs = Object.values(valResult.errors).filter(Boolean);
      return {
        allowed: false,
        message: 'Complete all 4 qualification details before moving this lead to Qualified:\n• ' + errorMsgs.join('\n• '),
      };
    }

    return { allowed: true };
  }

  return { allowed: true };
};
