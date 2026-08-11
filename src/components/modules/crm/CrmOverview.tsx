import React, { useState, useEffect } from 'react';
import { useCrmOverviewData } from './useCrmOverviewData';
import { useApp } from '../../../context/AppContext';
import { 
  Users, UserCheck, Briefcase, IndianRupee, Building2, BellRing, 
  BarChart4, ArrowRight, Phone, Mail, Calendar, CheckSquare, 
  Plus, AlertCircle, ChevronRight
} from 'lucide-react';
import { CrmView } from '../../../types';

interface CrmOverviewProps {
  onViewChange: (view: CrmView) => void;
}

export const CrmOverview: React.FC<CrmOverviewProps> = ({ onViewChange }) => {
  const dynamicData = useCrmOverviewData();
  const { addLead, addCustomer } = useApp();
  const [data, setData] = useState(dynamicData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Keep data in sync with global state
    setData(dynamicData);
  }, [dynamicData]);

  useEffect(() => {
    // Scroll to top to ensure clean viewport load
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800)); 
      } catch (err) {
        setError('Unable to load CRM overview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
        <AlertCircle size={40} className="text-rose-400 mb-3" />
        <h2 className="text-lg font-bold text-[#0f172a] mb-2">{error}</h2>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-28 bg-slate-200 rounded-lg"></div>
            <div className="h-8 w-28 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 shadow-sm"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[300px] bg-white rounded-xl border border-slate-100 shadow-sm"></div>
          <div className="h-[300px] bg-white rounded-xl border border-slate-100 shadow-sm"></div>
        </div>
      </div>
    );
  }

  const handleAddMockLead = () => {
    addLead({
      name: `New Lead ${Math.floor(Math.random() * 1000)}`,
      company: 'Test Corp',
      email: 'test@example.com',
      phone: '555-0000',
      value: 50000,
      stage: 'New',
      score: 85,
      source: 'Website',
      assignedTo: 'Mike Ross'
    });
  };

  const handleAddMockCustomer = () => {
    addCustomer({
      code: `CUST${Math.floor(Math.random() * 1000)}`,
      name: 'New Customer',
      email: 'new@example.com',
      phone: '555-1234',
      companyName: 'New Corp',
      taxId: 'TAX',
      creditLimit: 50000,
      outstanding: 0,
      status: 'Active',
      city: 'NY'
    });
  };

  if (!data || data.stats.totalLeads === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <BarChart4 size={24} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-[#0f172a] mb-2">No CRM activity yet</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          Add your first lead or customer to start building your CRM workspace.
        </p>
        <div className="flex space-x-3">
          <button onClick={() => onViewChange('leads')} className="px-4 py-2 bg-white border border-slate-200 text-[#0f172a] font-semibold text-sm rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            View All Leads
          </button>
          <button onClick={handleAddMockCustomer} className="px-4 py-2 bg-white border border-slate-200 text-[#0f172a] font-semibold text-sm rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Plus size={14} /> Add Customer
          </button>
          <button onClick={() => onViewChange('add-lead')} className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-indigo-500 transition-colors flex items-center gap-2">
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'Call': return <Phone size={12} className="text-emerald-500" />;
      case 'Email': return <Mail size={12} className="text-blue-500" />;
      case 'Meeting': return <Calendar size={12} className="text-purple-500" />;
      case 'Task': return <CheckSquare size={12} className="text-amber-500" />;
      default: return <BellRing size={12} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-1 font-medium">
            <span>CRM</span> <ChevronRight size={12} className="mx-1" /> <span className="text-[#0f172a]">Overview</span>
          </div>
          <h1 className="text-xl font-bold text-[#0f172a]">CRM Overview</h1>
          <p className="text-[11px] text-slate-500">
            Monitor leads, customers, opportunities and sales activities.
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onViewChange('leads')} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#0f172a] rounded-lg text-xs font-semibold shadow-sm transition-all">
            <span>View All Leads</span>
          </button>
          <button onClick={handleAddMockCustomer} className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#0f172a] rounded-lg text-xs font-semibold shadow-sm transition-all">
            <Plus size={14} /> <span>Add Customer</span>
          </button>
          <button onClick={() => onViewChange('add-lead')} className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all">
            <Plus size={14} /> <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col justify-between min-h-[90px]">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-600" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Leads</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0f172a] leading-tight">{data.stats.totalLeads}</div>
            <div className="text-[10px] text-slate-400">Across all stages</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col justify-between min-h-[90px]">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck size={14} className="text-emerald-600" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Qualified Leads</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0f172a] leading-tight">{data.stats.qualifiedLeads}</div>
            <div className="text-[10px] text-emerald-600 font-medium">{(data.stats.qualifiedLeads / data.stats.totalLeads * 100).toFixed(1)}% qualification</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col justify-between min-h-[90px]">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={14} className="text-purple-600" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Open Opps</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0f172a] leading-tight">{data.stats.openOpportunities}</div>
            <div className="text-[10px] text-slate-400">Deals in progress</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col justify-between min-h-[90px]">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee size={14} className="text-indigo-600" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pipeline</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0f172a] leading-tight">₹{(data.stats.pipelineValue / 100000).toFixed(1)}L</div>
            <div className="text-[10px] text-slate-400">Total open value</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col justify-between min-h-[90px]">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={14} className="text-sky-600" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Customers</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0f172a] leading-tight">{data.stats.activeCustomers}</div>
            <div className="text-[10px] text-slate-400">Active accounts</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col justify-between min-h-[90px]">
          <div className="flex items-center gap-2 mb-1">
            <BellRing size={14} className="text-rose-600" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Follow-ups</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0f172a] leading-tight">{data.stats.followUpsDue}</div>
            <div className="text-[10px] text-rose-500 font-medium">Needs attention</div>
          </div>
        </div>
      </div>

      {/* CHART ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEAD CONVERSION */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col max-h-[340px]">
          <h2 className="text-sm font-bold text-[#0f172a] mb-4">Lead Conversion</h2>
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 no-scrollbar">
            {data.leadConversion.map((stage) => {
              const width = `${stage.percentage}%`;
              const isWon = stage.stage === 'Won';
              const isLost = stage.stage === 'Lost';
              
              return (
                <div key={stage.stage} className="text-xs">
                  <div className="flex justify-between items-end mb-0.5 font-medium">
                    <span className="text-slate-600 w-20">{stage.stage}</span>
                    <div className="w-full mx-3 bg-slate-50 rounded h-1.5 self-center border border-slate-100 flex overflow-hidden">
                      <div className={`h-full rounded ${isWon ? 'bg-emerald-500' : isLost ? 'bg-rose-400' : 'bg-indigo-500'}`} style={{ width }}></div>
                    </div>
                    <div className="flex items-center space-x-2 text-right w-16 justify-end">
                      <span className="font-bold text-[#0f172a]">{stage.count}</span>
                      <span className="text-slate-400 text-[10px] w-6">{stage.percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-6">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Overall Conv.</p>
              <p className="text-sm font-bold text-emerald-600">8.5%</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Qual → Opp</p>
              <p className="text-sm font-bold text-indigo-600">51.2%</p>
            </div>
          </div>
        </div>

        {/* PIPELINE */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col max-h-[340px]">
          <h2 className="text-sm font-bold text-[#0f172a] mb-4">Opportunity Pipeline</h2>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 no-scrollbar">
            {data.opportunityPipeline.map((stage) => {
              const maxValue = Math.max(...data.opportunityPipeline.map(s => s.value));
              const width = `${(stage.value / maxValue) * 100}%`;
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between items-baseline mb-0.5 text-xs">
                    <div className="flex items-center gap-2 w-1/3">
                      <span className="font-semibold text-slate-700">{stage.stage}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{stage.count} deals</div>
                    <div className="font-bold text-[#0f172a] text-right w-16">₹{(stage.value / 100000).toFixed(1)}L</div>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-1.5 flex overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECONDARY ROW (Sources & Activities) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEAD SOURCES (col-span-5) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm lg:col-span-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-[#0f172a]">Lead Sources</h2>
          </div>
          <div className="space-y-3 flex-1">
            {data.leadSources.slice(0, 5).map((source, i) => {
              const colors = ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-slate-400'];
              return (
                <div key={source.source} className="text-xs">
                  <div className="flex justify-between font-medium mb-0.5">
                    <span className="text-slate-600">{source.source}</span>
                    <span className="text-slate-500">{source.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded h-1.5 flex overflow-hidden">
                    <div className={`h-full rounded ${colors[i % colors.length]}`} style={{ width: `${source.percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT ACTIVITIES (col-span-7) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm lg:col-span-7 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-[#0f172a]">Recent Activities</h2>
            <button className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700">
              View All &rarr;
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
            {data.recentActivities.slice(0, 4).map(activity => (
              <div key={activity.id} className="flex gap-3 text-xs items-start">
                <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-500 uppercase text-[9px]">{activity.type}</span>
                      <span className="font-bold text-[#0f172a] truncate">{activity.relatedRecord}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 whitespace-nowrap ml-2">{activity.dateTime}</span>
                  </div>
                  <p className="text-slate-600 truncate mb-1">{activity.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase ${activity.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOLLOW-UPS ROW */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-[#0f172a]">Follow-ups</h2>
          <button className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700">
            View All &rarr;
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* OVERDUE */}
          <div>
            <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertCircle size={10} /> Overdue
            </h3>
            <div className="space-y-2">
              {data.followUps.filter(f => f.category === 'Overdue').slice(0,3).map(fu => (
                <div key={fu.id} className="flex justify-between items-start text-xs border-l-2 border-rose-400 pl-2">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#0f172a] truncate">{fu.relatedRecord}</p>
                    <p className="text-[10px] text-slate-500">{fu.activityType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-rose-500">{fu.dueDateTime.split(', ')[1] || fu.dueDateTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TODAY */}
          <div>
            <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar size={10} /> Today
            </h3>
            <div className="space-y-2">
              {data.followUps.filter(f => f.category === 'Today').slice(0,3).map(fu => (
                <div key={fu.id} className="flex justify-between items-start text-xs border-l-2 border-amber-400 pl-2">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#0f172a] truncate">{fu.relatedRecord}</p>
                    <p className="text-[10px] text-slate-500">{fu.activityType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-slate-500">{fu.dueDateTime.split(', ')[1]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UPCOMING */}
          <div>
            <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <BellRing size={10} /> Upcoming
            </h3>
            <div className="space-y-2">
              {data.followUps.filter(f => f.category === 'Upcoming').slice(0,3).map(fu => (
                <div key={fu.id} className="flex justify-between items-start text-xs border-l-2 border-indigo-400 pl-2">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#0f172a] truncate">{fu.relatedRecord}</p>
                    <p className="text-[10px] text-slate-500">{fu.activityType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-slate-500">{fu.dueDateTime.split(', ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
