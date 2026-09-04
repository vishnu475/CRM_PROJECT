// Standalone mirror of frontend/src/modules/crm/utils/leadWorkflowValidation.ts for testing

const isNegotiationInteraction = (act, lead) => {
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

const validateLeadStageTransition = (lead, targetStage, activities = [], quotations = []) => {
  const currentStage = lead.stage;

  if (currentStage === targetStage) {
    return { allowed: true };
  }

  // STEP 1: New -> Contacted
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

  // STEP 2: Contacted -> Qualified
  if (currentStage === 'Contacted' && targetStage === 'Qualified') {
    const missingFields = [];

    const requirement = (lead.requirement || '').trim();
    if (!requirement) missingFields.push('Requirement');

    const budgetVal =
      lead.budget !== undefined && Number(lead.budget) > 0
        ? Number(lead.budget)
        : lead.value !== undefined && Number(lead.value) > 0
        ? Number(lead.value)
        : 0;
    if (!budgetVal || budgetVal <= 0 || isNaN(budgetVal)) missingFields.push('Budget');

    const decisionMaker = (lead.decisionMaker || lead.contactPerson || '').trim();
    if (!decisionMaker) missingFields.push('Decision Maker');

    const expectedCloseDate = (lead.expectedCloseDate || '').trim();
    if (!expectedCloseDate) missingFields.push('Expected Closing Date');

    if (missingFields.length > 0) {
      return {
        allowed: false,
        message: `Complete the following qualification details before moving this lead to Qualified:\n• ${missingFields.join('\n• ')}`,
      };
    }
  }

  // STEP 3: Qualified -> Proposal
  if (currentStage === 'Qualified' && targetStage === 'Proposal') {
    const linkedQuotation = quotations.find((q) =>
      q.customerId === lead.id ||
      q.leadId === lead.id ||
      q.customerName === lead.name ||
      (q.customerId && q.customerId.includes(lead.id)) ||
      (q.customerName && lead.name && q.customerName.toLowerCase() === lead.name.toLowerCase())
    );

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

    const proposalStatus = linkedQuotation?.status || lead.proposalStatus || 'Draft';
    const proposalAmount =
      linkedQuotation?.amount !== undefined
        ? Number(linkedQuotation.amount)
        : lead.proposalAmount !== undefined
        ? Number(lead.proposalAmount)
        : 0;
    const proposalDate = (linkedQuotation?.date || lead.proposalDate || '').trim();
    const sentDate = (linkedQuotation?.sentDate || lead.proposalSentDate || '').trim();

    if (!proposalAmount || proposalAmount <= 0 || isNaN(proposalAmount)) {
      return {
        allowed: false,
        message: 'Please provide a valid positive proposal amount before moving this lead to Proposal.',
      };
    }

    if (!proposalDate) {
      return {
        allowed: false,
        message: 'Please provide a valid proposal date before moving this lead to Proposal.',
      };
    }

    if (proposalStatus !== 'Sent') {
      return {
        allowed: false,
        message: 'Please send the proposal before moving this lead to Proposal.',
      };
    }

    if (!sentDate) {
      return {
        allowed: false,
        message: 'Please provide the sent date for the proposal before moving this lead to Proposal.',
      };
    }
  }

  // STEP 4: Proposal -> Negotiation
  if (targetStage === 'Negotiation') {
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

  return { allowed: true };
};

export { isNegotiationInteraction, validateLeadStageTransition };
