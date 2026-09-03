import { Lead, Activity } from '../../../types';

export interface StageTransitionResult {
  allowed: boolean;
  message?: string;
}

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
 */
export const validateLeadStageTransition = (
  lead: Lead,
  targetStage: Lead['stage'],
  activities: Activity[]
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

  // All other stage transitions are allowed (reserved for future step rules)
  return { allowed: true };
};
