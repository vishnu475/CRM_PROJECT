import React, { useState } from 'react';
import { CrmView } from '../../../types';
import { CRMLayout } from './CRMLayout';
import { CrmOverview } from './CrmOverview';
import { CrmAddLead } from './CrmAddLead';
import { CrmLeadsList } from './CrmLeadsList';
import { CrmLeadDetails } from './CrmLeadDetails';
import { CrmCustomersList } from './CrmCustomersList';
import { CrmAddCustomer } from './CrmAddCustomer';
import { CrmCustomerDetails } from './CrmCustomerDetails';

const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
  <div>
    <h2 className="text-xl font-semibold text-[#0f172a] mb-2">{title}</h2>
    <p className="text-slate-500">Your CRM workspace will appear here.</p>
  </div>
);

export const CrmModule: React.FC = () => {
  const [activeCrmView, setActiveCrmView] = useState<CrmView>('overview');
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
      case 'contacts': return <PlaceholderContent title="Contacts" />;
      case 'opportunities': return <PlaceholderContent title="Opportunities" />;
      case 'activities': return <PlaceholderContent title="Activities" />;
      case 'follow-ups': return <PlaceholderContent title="Follow-ups" />;
      case 'pipeline': return <PlaceholderContent title="Pipeline" />;
      case 'notes': return <PlaceholderContent title="Notes" />;
      default: return <CrmOverview onViewChange={setActiveCrmView} />;
    }
  };

  return (
    <CRMLayout activeView={activeCrmView} onViewChange={setActiveCrmView}>
      {renderActiveView()}
    </CRMLayout>
  );
};
