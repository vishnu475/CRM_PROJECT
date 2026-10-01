import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CrmView } from '../../../types';
import { CRMLayout } from '../components/CRMLayout';
import { CrmOverview } from '../components/CrmOverview';
import { CrmAddLead } from '../components/CrmAddLead';
import { CrmLeadsList } from '../components/CrmLeadsList';
import { CrmLeadDetails } from '../components/CrmLeadDetails';
import { CrmCustomersList } from '../components/CrmCustomersList';
import { CrmAddCustomer } from '../components/CrmAddCustomer';
import { CrmCustomerDetails } from '../components/CrmCustomerDetails';

import { CrmOpportunities } from '../components/CrmOpportunities';
import { CrmOpportunityDetails } from '../components/CrmOpportunityDetails';
import { CrmContactsList } from '../components/CrmContactsList';
import { CrmActivitiesList } from '../components/CrmActivitiesList';
import { CrmFollowUpsList } from '../components/CrmFollowUpsList';
import { CrmNotesList } from '../components/CrmNotesList';

const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
    <h2 className="text-xl font-semibold text-[#0f172a] mb-2">{title}</h2>
    <p className="text-slate-500 text-sm">Your CRM workspace will appear here.</p>
  </div>
);

export const CrmPage: React.FC = () => {
  const { activeSubSection, setActiveSubSection } = useApp();
  const validCrmViews: CrmView[] = ['overview', 'add-lead', 'leads', 'lead-details', 'customers', 'add-customer', 'customer-details', 'contacts', 'opportunities', 'opportunity-details', 'activities', 'follow-ups', 'notes'];

  const subSectionStr = activeSubSection || 'overview';
  let activeCrmView: CrmView = 'overview';
  let routeOppId: string | null = null;
  let routeLeadId: string | null = null;
  let routeCustomerId: string | null = null;

  if (subSectionStr.startsWith('opportunities/')) {
    activeCrmView = 'opportunity-details';
    routeOppId = subSectionStr.replace('opportunities/', '').trim();
  } else if (subSectionStr.startsWith('opportunity-details/')) {
    activeCrmView = 'opportunity-details';
    routeOppId = subSectionStr.replace('opportunity-details/', '').trim();
  } else if (subSectionStr.startsWith('lead-details/')) {
    activeCrmView = 'lead-details';
    routeLeadId = subSectionStr.replace('lead-details/', '').trim();
  } else if (subSectionStr.startsWith('customer-details/')) {
    activeCrmView = 'customer-details';
    routeCustomerId = subSectionStr.replace('customer-details/', '').trim();
  } else if (validCrmViews.includes(subSectionStr as CrmView)) {
    activeCrmView = subSectionStr as CrmView;
  }

  const setActiveCrmView = (view: CrmView) => setActiveSubSection(view);
  
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(() => {
    return localStorage.getItem('crm_selected_opp_id') || null;
  });

  const handleSelectOpp = (id: string) => {
    if (!id) return;
    setSelectedEntityId(id);
    localStorage.setItem('crm_selected_opp_id', id);
    setActiveSubSection(`opportunities/${id}`);
  };

  const handleSelectLead = (id: string) => {
    if (!id) return;
    setSelectedEntityId(id);
    localStorage.setItem('crm_selected_lead_id', id);
    setActiveCrmView('lead-details');
  };

  const handleSelectCustomer = (id: string) => {
    if (!id) return;
    setSelectedEntityId(id);
    localStorage.setItem('crm_selected_customer_id', id);
    setActiveCrmView('customer-details');
  };

  const renderActiveView = () => {
    switch (activeCrmView) {
      case 'overview': return <CrmOverview onViewChange={setActiveCrmView} />;
      case 'add-lead': return <CrmAddLead onViewChange={setActiveCrmView} />;
      case 'leads': return <CrmLeadsList onViewChange={setActiveCrmView} onLeadSelect={handleSelectLead} />;
      case 'lead-details': {
        const targetId = selectedEntityId || localStorage.getItem('crm_selected_lead_id');
        return targetId ? <CrmLeadDetails leadId={targetId} onViewChange={setActiveCrmView} /> : <PlaceholderContent title="Lead Not Found" />;
      }
      case 'customers': return <CrmCustomersList onViewChange={setActiveCrmView} onCustomerSelect={handleSelectCustomer} />;
      case 'add-customer': return <CrmAddCustomer onViewChange={setActiveCrmView} />;
      case 'customer-details': {
        const targetId = selectedEntityId || localStorage.getItem('crm_selected_customer_id');
        return targetId ? <CrmCustomerDetails customerId={targetId} onViewChange={setActiveCrmView} /> : <PlaceholderContent title="Customer Not Found" />;
      }
      case 'contacts': return <CrmContactsList onViewChange={setActiveCrmView} />;
      case 'opportunities': return (
        <CrmOpportunities 
          onViewChange={setActiveCrmView} 
          onOpportunitySelect={handleSelectOpp} 
          onCustomerSelect={handleSelectCustomer}
        />
      );
      case 'opportunity-details': {
        const targetId = routeOppId || selectedEntityId || localStorage.getItem('crm_selected_opp_id') || '';
        return (
          <CrmOpportunityDetails 
            opportunityId={targetId} 
            onViewChange={setActiveCrmView} 
            onCustomerSelect={handleSelectCustomer}
          />
        );
      }
      case 'activities': return (
        <CrmActivitiesList
          onViewChange={setActiveCrmView}
          onLeadSelect={handleSelectLead}
          onCustomerSelect={handleSelectCustomer}
          onOpportunitySelect={handleSelectOpp}
        />
      );
      case 'follow-ups': return (
        <CrmFollowUpsList
          onViewChange={setActiveCrmView}
          onLeadSelect={handleSelectLead}
          onCustomerSelect={handleSelectCustomer}
          onOpportunitySelect={handleSelectOpp}
        />
      );
      case 'notes': return (
        <CrmNotesList
          onViewChange={setActiveCrmView}
          onLeadSelect={handleSelectLead}
          onCustomerSelect={handleSelectCustomer}
          onOpportunitySelect={handleSelectOpp}
        />
      );
      default: return <CrmOverview onViewChange={setActiveCrmView} />;
    }
  };

  return (
    <CRMLayout activeView={activeCrmView} onViewChange={setActiveCrmView}>
      {renderActiveView()}
    </CRMLayout>
  );
};
