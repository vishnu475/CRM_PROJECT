import { useApp } from '../../../context/AppContext';

export interface CrmOverviewData {
  stats: {
    totalLeads: number;
    qualifiedLeads: number;
    openOpportunities: number;
    pipelineValue: number;
    activeCustomers: number;
    followUpsDue: number;
  };
  leadConversion: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  opportunityPipeline: {
    stage: string;
    count: number;
    value: number;
  }[];
  leadSources: {
    source: string;
    count: number;
    percentage: number;
  }[];
  recentActivities: {
    id: string;
    type: string;
    relatedRecord: string;
    dateTime: string;
    owner: string;
    description: string;
    status: string;
  }[];
  followUps: {
    id: string;
    category: 'Overdue' | 'Today' | 'Upcoming';
    relatedRecord: string;
    relatedOpportunity?: string;
    activityType: string;
    dueDateTime: string;
    owner: string;
    priority: string;
    status: string;
  }[];
}

export const useCrmOverviewData = (): CrmOverviewData => {
  const { leads, customers, opportunities, activities, followUps } = useApp();

  const activeLeads = leads.filter(l => l.status !== 'archived');

  // --- STATS ---
  const totalLeads = activeLeads.length;
  const qualifiedLeads = activeLeads.filter(l => l.stage === 'Qualified').length;
  const openOpportunities = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length;
  const pipelineValue = opportunities
    .filter(o => o.stage !== 'Won' && o.stage !== 'Lost')
    .reduce((sum, o) => sum + (o.value || 0), 0);
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  
  // Basic categorization for follow-ups (overdue, today, upcoming) based on their status text in mock data
  const followUpsDue = followUps.filter(f => f.status === 'Overdue' || f.status === 'Today').length;

  // --- LEAD CONVERSION ---
  const leadStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
  const leadConversion = leadStages.map(stage => {
    const count = activeLeads.filter(l => l.stage === stage).length;
    const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    return { stage, count, percentage };
  });

  // --- OPPORTUNITY PIPELINE ---
  const oppStages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const opportunityPipeline = oppStages.map(stage => {
    const stageOpps = opportunities.filter(o => o.stage === stage);
    const count = stageOpps.length;
    const value = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);
    return { stage, count, value };
  });

  // --- LEAD SOURCES ---
  const sourceMap = activeLeads.reduce((acc, lead) => {
    const src = lead.source || 'Other';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const leadSources = Object.entries(sourceMap)
    .map(([source, count]) => ({
      source,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // --- RECENT ACTIVITIES ---
  const recentActivities = [...activities].reverse().map(act => ({
    id: act.id,
    type: act.type,
    relatedRecord: act.relatedTo,
    dateTime: act.dueDate,
    owner: act.assignedTo,
    description: act.title,
    status: act.status
  }));

  // --- FOLLOW UPS ---
  const mappedFollowUps = followUps.map(fu => ({
    id: fu.id,
    category: (fu.status === 'Overdue' ? 'Overdue' : fu.status === 'Today' ? 'Today' : 'Upcoming') as 'Overdue' | 'Today' | 'Upcoming',
    relatedRecord: fu.relatedEntity,
    relatedOpportunity: fu.opportunityId,
    activityType: fu.activityType,
    dueDateTime: fu.dueDate,
    owner: fu.owner,
    priority: 'Medium',
    status: fu.status
  }));

  return {
    stats: {
      totalLeads,
      qualifiedLeads,
      openOpportunities,
      pipelineValue,
      activeCustomers,
      followUpsDue
    },
    leadConversion,
    opportunityPipeline,
    leadSources,
    recentActivities,
    followUps: mappedFollowUps
  };
};
