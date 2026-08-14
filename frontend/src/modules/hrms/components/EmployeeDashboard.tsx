import React from 'react';
import { Users, UserCheck, Clock, UserX, ArrowUpRight, Award, Building2, DollarSign, Calendar, Heart } from 'lucide-react';
import { ExtendedEmployee } from '../types';

export interface EmployeeDashboardProps {
  employees: ExtendedEmployee[];
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ employees }) => {
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active' || e.status === 'Confirmed' || e.status === 'Joined').length;
  const probationCount = employees.filter(e => e.status === 'Probation').length;
  const transferredCount = employees.filter(e => e.status === 'Transferred').length;
  const exitedCount = employees.filter(e => e.status === 'Exited').length;

  const totalMonthlyPayroll = employees
    .filter(e => e.status !== 'Exited')
    .reduce((sum, e) => sum + (e.salary || 0), 0);

  const maleCount = employees.filter(e => e.gender === 'Male').length;
  const femaleCount = employees.filter(e => e.gender === 'Female').length;
  const malePct = totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 50;

  const departments = Array.from(new Set(employees.map(e => e.department)));

  // Upcoming probation evaluations
  const probationStaff = employees.filter(e => e.status === 'Probation');

  return (
    <div className="space-y-5">
      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
            <div className="text-xl font-bold text-slate-900">{totalCount}</div>
            <span className="text-[10px] text-slate-400">All staff records</span>
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
            <span className="text-[10px] text-amber-600 font-medium">Under review</span>
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
            <span className="text-[10px] text-rose-600 font-medium">Offboarded</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <UserX size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Payroll</span>
            <div className="text-base font-bold text-purple-700">₹ {(totalMonthlyPayroll / 1000).toFixed(0)}k</div>
            <span className="text-[10px] text-slate-400">Gross Liability</span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* Middle Grid: Department & Diversity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department Breakdown Grid */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-purple-600" /> Department Headcount Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {departments.map((dept) => {
              const count = employees.filter(e => e.department === dept).length;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={dept} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{dept}</span>
                    <span className="text-purple-600">{count} staff ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender & Diversity Metric Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Heart size={16} className="text-rose-500" /> Gender Diversity Ratio
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-blue-600">Male: {maleCount} ({malePct}%)</span>
              <span className="text-rose-600">Female: {femaleCount} ({100 - malePct}%)</span>
            </div>
            <div className="w-full bg-rose-200 h-3 rounded-full overflow-hidden flex">
              <div className="bg-blue-600 h-full" style={{ width: `${malePct}%` }} />
              <div className="bg-rose-500 h-full flex-1" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Probation Reviews Pending ({probationStaff.length})</span>
            {probationStaff.map(staff => (
              <div key={staff.id} className="p-2 bg-amber-50 rounded border border-amber-200 flex justify-between items-center text-[11px]">
                <div>
                  <span className="font-bold text-slate-900">{staff.name}</span>
                  <span className="text-slate-500 block text-[9px]">{staff.designation} • {staff.department}</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-[9px]">Due for Confirm</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
