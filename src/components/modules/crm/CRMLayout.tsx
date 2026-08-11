import React from 'react';
import { CRMHeader } from './CRMHeader';
import { CRMNavigation } from './CRMNavigation';
import { CRMContent } from './CRMContent';
import { CrmView } from '../../../types';

interface CRMLayoutProps {
  activeView: CrmView;
  onViewChange: (view: CrmView) => void;
  children: React.ReactNode;
}

export const CRMLayout: React.FC<CRMLayoutProps> = ({ activeView, onViewChange, children }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <CRMHeader />
      <CRMNavigation activeView={activeView} onViewChange={onViewChange} />
      <CRMContent>
        {children}
      </CRMContent>
    </div>
  );
};
