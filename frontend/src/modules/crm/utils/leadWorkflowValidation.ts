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
};
