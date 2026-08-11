import React from 'react';

interface CRMContentProps {
  children: React.ReactNode;
}

export const CRMContent: React.FC<CRMContentProps> = ({ children }) => {
  return (
    <div className="w-full">
      {children}
    </div>
  );
};
