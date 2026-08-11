import React from 'react';
import { Network, ChevronDown, UserCheck } from 'lucide-react';
import { ExtendedEmployee } from '../types';

export interface ReportingHierarchyViewProps {
  employees: ExtendedEmployee[];
}

export const ReportingHierarchyView: React.FC<ReportingHierarchyViewProps> = ({ employees }) => {
  const managers = employees.filter(e => e.designation.includes('Lead') || e.designation.includes('Manager') || e.designation.includes('VP') || e.designation.includes('Administrator'));

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Network className="text-purple-600" size={18} /> Organizational Reporting Hierarchy
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Reporting relationships between managers and direct reports.</p>
        </div>
      </div>

      <div className="space-y-6">
        {managers.map(mgr => {
          const directReports = employees.filter(e => e.reportingManagerId === mgr.id || (e.department === mgr.department && e.id !== mgr.id));
          return (
            <div key={mgr.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              {/* Manager Card */}
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-purple-200 shadow-sm w-full md:w-80">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">
                  {mgr.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{mgr.name}</h4>
                  <p className="text-[10px] text-purple-700 font-semibold">{mgr.designation}</p>
                  <p className="text-[9px] text-slate-400 font-mono">ID: {mgr.id} • {mgr.department}</p>
                </div>
              </div>

              {/* Direct Reports */}
              {directReports.length > 0 && (
                <div className="pl-6 border-l-2 border-purple-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Reports ({directReports.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {directReports.map(rep => (
                      <div key={rep.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center space-x-2 text-xs">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">
                          {rep.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate text-[11px]">{rep.name}</p>
                          <p className="text-[9px] text-slate-500 truncate">{rep.designation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
