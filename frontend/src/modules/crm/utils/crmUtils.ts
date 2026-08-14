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
