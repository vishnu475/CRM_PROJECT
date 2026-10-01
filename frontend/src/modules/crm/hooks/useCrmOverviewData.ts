import { useApp } from '../../../context/AppContext';

export interface CrmOverviewData {
  stats: {
    totalLeads: number;
    qualifiedLeads: number;
    openOpportunities: number;
    pipelineValue: number;
    followUpsDue: number;
  };
  leadConversion: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  leadConversionSummary: {
    overallConversionRate: number;
    qualifiedToOppRate: number;
  };
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
  const { leads, opportunities, activities, followUps } = useApp();

  const activeLeads = leads.filter(l => l.status !== 'archived');

  // 1. TOP KPI STATS (Sales activity metrics only: Total Leads, Qualified Leads, Open Opps, Pipeline Value, Follow-ups)
  const totalLeads = activeLeads.length;
  const qualifiedLeads = activeLeads.filter(l => l.stage === 'Qualified').length;
  const openOpportunities = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length;
  const pipelineValue = opportunities
    .filter(o => o.stage !== 'Won' && o.stage !== 'Lost')
    .reduce((sum, o) => sum + (Number(o.value) || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingFollowUps = followUps.filter(f => f.status !== 'completed' && f.status !== 'Completed' && f.status !== 'Cancelled');
  const followUpsDue = pendingFollowUps.length;

  // 2. LEAD CONVERSION (Including all 7 stages: New, Contacted, Qualified, Proposal, Negotiation, Won, Lost)
  const leadStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const leadConversion = leadStages.map(stage => {
    const count = activeLeads.filter(l => l.stage === stage).length;
    const percentage = totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0;
    return { stage, count, percentage };
  });

  // 3. LEAD CONVERSION SUMMARY (Overall Conv % and Qual -> Opp %)
  const wonLeadsCount = activeLeads.filter(l => l.stage === 'Won').length;
  const overallConversionRate = totalLeads > 0 ? Number(((wonLeadsCount / totalLeads) * 100).toFixed(1)) : 0;

  const qualifiedPlusLeads = activeLeads.filter(l => ['Qualified', 'Proposal', 'Negotiation', 'Won'].includes(l.stage)).length;
  const convertedToOppLeads = activeLeads.filter(l => ['Proposal', 'Negotiation', 'Won'].includes(l.stage)).length;
  const qualifiedToOppRate = qualifiedPlusLeads > 0 
    ? Number(((convertedToOppLeads / qualifiedPlusLeads) * 100).toFixed(1)) 
    : (qualifiedLeads > 0 ? Number(((opportunities.length / qualifiedLeads) * 100).toFixed(1)) : 0);

  // 4. OPPORTUNITY PIPELINE (New, Qualified, Proposal, Negotiation, Won, Lost)
  const oppStages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const opportunityPipeline = oppStages.map(stage => {
    const stageOpps = opportunities.filter(o => o.stage === stage);
    const count = stageOpps.length;
    const value = stageOpps.reduce((sum, o) => sum + (Number(o.value) || 0), 0);
    return { stage, count, value };
  });

  // 5. LEAD SOURCES
  const sourceMap = activeLeads.reduce((acc, lead) => {
    const src = lead.source || 'Direct / Other';
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

  // 6. RECENT ACTIVITIES (Top 5 most recent)
  const recentActivities = [...activities]
    .sort((a, b) => {
      const timeA = new Date(a.dueDate || 0).getTime();
      const timeB = new Date(b.dueDate || 0).getTime();
      return timeB - timeA;
    })
    .slice(0, 5)
    .map(act => ({
      id: act.id,
      type: act.type || 'Task',
      relatedRecord: act.relatedTo || 'General Record',
      dateTime: act.dueDate || 'N/A',
      owner: act.assignedTo || 'Unassigned',
      description: act.title || 'Activity recorded',
      status: act.status || 'Completed'
    }));

  // 7. FOLLOW-UPS CATEGORIZATION (Overdue, Today, Upcoming)
  const mappedFollowUps = followUps.map(fu => {
    let category: 'Overdue' | 'Today' | 'Upcoming' = 'Upcoming';
    
    if (fu.status === 'Overdue') {
      category = 'Overdue';
    } else if (fu.status === 'Today') {
      category = 'Today';
    } else if (fu.status === 'Upcoming') {
      category = 'Upcoming';
    } else if (fu.dueDate) {
      const fuDateStr = fu.dueDate.split('T')[0].split(' ')[0];
      if (fuDateStr < todayStr) {
        category = 'Overdue';
      } else if (fuDateStr === todayStr) {
        category = 'Today';
      } else {
        category = 'Upcoming';
      }
    }

    return {
      id: fu.id,
      category,
      relatedRecord: fu.relatedEntity || fu.related_entity || fu.title || 'CRM Record',
      relatedOpportunity: fu.opportunityId || fu.opportunity_id,
      activityType: fu.activityType || 'Follow-up',
      dueDateTime: fu.dueDate || 'N/A',
      owner: fu.assignedTo || 'Unassigned',
      priority: fu.priority || 'Medium',
      status: fu.status || 'Pending'
    };
  });

  return {
    stats: {
      totalLeads,
      qualifiedLeads,
      openOpportunities,
      pipelineValue,
      followUpsDue
    },
    leadConversion,
    leadConversionSummary: {
      overallConversionRate,
      qualifiedToOppRate
    },
    opportunityPipeline,
    leadSources,
    recentActivities,
    followUps: mappedFollowUps
  };
};
