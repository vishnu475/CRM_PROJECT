import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, change, isPositive, icon: Icon }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {change && (
          <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
        <Icon size={20} />
      </div>
    </div>
  );
};
