import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { CrmView } from '../../../types';
import { CrmCustomersList } from '../../crm/components/CrmCustomersList';
import { CrmAddCustomer } from '../../crm/components/CrmAddCustomer';
import { CrmCustomerDetails } from '../../crm/components/CrmCustomerDetails';

export const CustomersPage: React.FC = () => {
  const { activeSubSection, setActiveSubSection, setActiveModule } = useApp();
  const [currentView, setCurrentView] = useState<'customers' | 'add-customer' | 'customer-details'>('customers');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubSection === 'add-customer') {
      setCurrentView('add-customer');
    } else if (activeSubSection?.startsWith('customer-details/')) {
      const id = activeSubSection.replace('customer-details/', '').trim();
      setSelectedCustomerId(id);
      setCurrentView('customer-details');
    } else if (activeSubSection === 'customers' || !activeSubSection) {
      setCurrentView('customers');
    }
  }, [activeSubSection]);

  const handleViewChange = (view: CrmView) => {
    if (view === 'add-customer') {
      setCurrentView('add-customer');
      if (setActiveSubSection) setActiveSubSection('add-customer');
    } else if (view === 'customers') {
      setCurrentView('customers');
      setSelectedCustomerId(null);
      if (setActiveSubSection) setActiveSubSection('');
    } else if (view === 'customer-details') {
      setCurrentView('customer-details');
    } else {
      // If navigating to other CRM modules (e.g. contacts, opportunities, overview)
      if (setActiveModule) {
        setActiveModule('crm', view);
      }
    }
  };

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    setCurrentView('customer-details');
    if (setActiveSubSection) {
      setActiveSubSection(`customer-details/${id}`);
    }
  };

  if (currentView === 'add-customer') {
    return <CrmAddCustomer onViewChange={handleViewChange} />;
  }

  if (currentView === 'customer-details' && selectedCustomerId) {
    return <CrmCustomerDetails customerId={selectedCustomerId} onViewChange={handleViewChange} />;
  }

  return (
    <CrmCustomersList 
      onViewChange={handleViewChange} 
      onCustomerSelect={handleCustomerSelect} 
    />
  );
};
