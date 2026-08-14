import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 py-2">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight size={12} className="text-slate-400" />}
          {item.href ? (
            <a href={item.href} className="hover:text-slate-900 transition-colors">{item.label}</a>
          ) : (
            <span className="font-semibold text-slate-900">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
