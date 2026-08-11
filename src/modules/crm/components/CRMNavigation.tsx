import React from 'react';
import { CrmView } from '../../../types';

interface CRMNavigationProps {
  activeView: CrmView;
  onViewChange: (view: CrmView) => void;
}

export const CRMNavigation: React.FC<CRMNavigationProps> = ({ activeView, onViewChange }) => {
  const navItems: { id: CrmView; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'leads', label: 'Leads' },
    { id: 'customers', label: 'Customers' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'activities', label: 'Activities' },
    { id: 'follow-ups', label: 'Follow-ups' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-t-md ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
