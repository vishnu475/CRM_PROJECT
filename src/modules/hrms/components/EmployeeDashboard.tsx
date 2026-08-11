import React from 'react';
import { Users, UserCheck, Clock, UserX, ArrowUpRight, Award, Building2 } from 'lucide-react';
import { ExtendedEmployee } from '../types';

export interface EmployeeDashboardProps {
  employees: ExtendedEmployee[];
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ employees }) => {
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active' || e.status === 'Confirmed').length;
  const probationCount = employees.filter(e => e.status === 'Probation').length;
  const transferredCount = employees.filter(e => e.status === 'Transferred').length;
  const exitedCount = employees.filter(e => e.status === 'Exited').length;

  const departments = Array.from(new Set(employees.map(e => e.department)));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
            <div className="text-xl font-bold text-slate-900">{totalCount}</div>
            <span className="text-[10px] text-slate-400">All lifecycle states</span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirmed Staff</span>
            <div className="text-xl font-bold text-emerald-600">{activeCount}</div>
            <span className="text-[10px] text-emerald-600 font-medium">Regular employees</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">On Probation</span>
            <div className="text-xl font-bold text-amber-600">{probationCount}</div>
            <span className="text-[10px] text-amber-600 font-medium">Under evaluation</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transferred</span>
            <div className="text-xl font-bold text-blue-600">{transferredCount}</div>
            <span className="text-[10px] text-blue-600 font-medium">Branch transfers</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exited Staff</span>
            <div className="text-xl font-bold text-rose-600">{exitedCount}</div>
            <span className="text-[10px] text-rose-600 font-medium">Resigned / Exited</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <UserX size={18} />
          </div>
        </div>
      </div>

      {/* Department Breakdown Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Building2 size={16} className="text-purple-600" /> Department Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {departments.map((dept) => {
            const count = employees.filter(e => e.department === dept).length;
            const pct = Math.round((count / totalCount) * 100);
            return (
              <div key={dept} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{dept}</span>
                  <span className="text-purple-600">{count} staff</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
