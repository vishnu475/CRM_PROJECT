export const formatINR = (value: number): string => {
  if (isNaN(value)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const getLeadScoreLevel = (score: number): 'Low' | 'Medium' | 'High' => {
  if (score <= 30) return 'Low';
  if (score <= 70) return 'Medium';
  return 'High';
};

export const getLeadScoreColor = (score: number): string => {
  const level = getLeadScoreLevel(score);
  switch (level) {
    case 'High': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Low': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

/**
 * Standardized CRM Semantic Stage and Status Colors
 * 
 * BLUE  = All normal/active/in-progress CRM stages (New, Contacted, Qualified, Proposal, Negotiation)
 * GREEN = Successful/completed outcomes (Won, Converted, Project Created, Customer Accepted, Completed, Active)
 * RED   = Lost/negative/problem outcomes (Lost, Overdue, Cancelled, At Risk)
 */

export type CrmSemanticColor = 'active' | 'success' | 'danger' | 'neutral';

export const getCrmStageSemantic = (stage?: string): CrmSemanticColor => {
  if (!stage) return 'active';
  const s = stage.trim().toLowerCase();
  if (s === 'won' || s === 'closed won' || s === 'converted' || s === 'completed') {
    return 'success';
  }
  if (s === 'lost' || s === 'closed lost' || s === 'overdue' || s === 'at risk' || s === 'cancelled' || s === 'rejected') {
    return 'danger';
  }
  return 'active';
};

/**
 * Returns Tailwind CSS badge classes for lead/opportunity stages
 */
export const getLeadStageColor = (stage?: string): string => {
  const semantic = getCrmStageSemantic(stage);
  switch (semantic) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'danger':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'active':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

/**
 * Returns solid color class (for charts/progress bars)
 */
export const getCrmStageBarColor = (stage?: string): string => {
  const semantic = getCrmStageSemantic(stage);
  switch (semantic) {
    case 'success':
      return 'bg-emerald-500';
    case 'danger':
      return 'bg-rose-500';
    case 'active':
    default:
      return 'bg-blue-500';
  }
};

/**
 * Customer status badge color helper
 */
export const getCustomerStatusColor = (status?: string): string => {
  if (!status) return 'bg-slate-100 text-slate-700 border-slate-200';
  const s = status.trim().toLowerCase();
  if (s === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'at risk') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (s === 'archived' || s === 'inactive') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};
