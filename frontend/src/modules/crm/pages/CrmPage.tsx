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
import { CrmContactsList } from '../components/CrmContactsList';
import { CrmActivitiesList } from '../components/CrmActivitiesList';

const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
  <div>
    <h2 className="text-xl font-semibold text-[#0f172a] mb-2">{title}</h2>
    <p className="text-slate-500">Your CRM workspace will appear here.</p>
  </div>
);

export const CrmPage: React.FC = () => {
  const { activeSubSection, setActiveSubSection } = useApp();
  const validCrmViews: CrmView[] = ['overview', 'add-lead', 'leads', 'lead-details', 'customers', 'add-customer', 'customer-details', 'contacts', 'opportunities', 'activities', 'follow-ups', 'pipeline', 'notes'];
  const activeCrmView: CrmView = (validCrmViews.includes(activeSubSection as CrmView) ? activeSubSection : 'overview') as CrmView;
  const setActiveCrmView = (view: CrmView) => setActiveSubSection(view);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const renderActiveView = () => {
    switch (activeCrmView) {
      case 'overview': return <CrmOverview onViewChange={setActiveCrmView} />;
      case 'add-lead': return <CrmAddLead onViewChange={setActiveCrmView} />;
      case 'leads': return <CrmLeadsList onViewChange={setActiveCrmView} onLeadSelect={(id) => { setSelectedEntityId(id); setActiveCrmView('lead-details'); }} />;
      case 'lead-details': return selectedEntityId ? <CrmLeadDetails leadId={selectedEntityId} onViewChange={setActiveCrmView} /> : <PlaceholderContent title="Lead Not Found" />;
      case 'customers': return <CrmCustomersList onViewChange={setActiveCrmView} onCustomerSelect={(id) => { setSelectedEntityId(id); setActiveCrmView('customer-details'); }} />;
      case 'add-customer': return <CrmAddCustomer onViewChange={setActiveCrmView} />;
      case 'customer-details': return selectedEntityId ? <CrmCustomerDetails customerId={selectedEntityId} onViewChange={setActiveCrmView} /> : <PlaceholderContent title="Customer Not Found" />;
      case 'contacts': return <CrmContactsList onViewChange={setActiveCrmView} />;
      case 'opportunities': return <CrmOpportunities onViewChange={setActiveCrmView} />;
      case 'pipeline': return <CrmOpportunities onViewChange={setActiveCrmView} />;
      case 'activities': return <CrmActivitiesList onViewChange={setActiveCrmView} />;
      case 'follow-ups': return <CrmActivitiesList onViewChange={setActiveCrmView} />;
      case 'notes': return <CrmActivitiesList onViewChange={setActiveCrmView} />;
      default: return <CrmOverview onViewChange={setActiveCrmView} />;
    }
  };

  return (
    <CRMLayout activeView={activeCrmView} onViewChange={setActiveCrmView}>
      {renderActiveView()}
    </CRMLayout>
  );
};
