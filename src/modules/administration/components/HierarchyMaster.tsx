import React from 'react';
import { Network, Layers, GitFork, ShieldCheck } from 'lucide-react';
import { DepartmentHierarchyNode, DesignationHierarchyNode } from '../types';

export const HierarchyMaster: React.FC = () => {
  const departments: DepartmentHierarchyNode[] = [
    { id: 'dept-1', code: 'EXEC-01', name: 'Executive Operations', headName: 'John Doe (CEO)' },
    { id: 'dept-2', code: 'ENG-02', name: 'Software Engineering', headName: 'James Smith (VP Eng)', parentDept: 'Executive Operations' },
    { id: 'dept-3', code: 'SALES-03', name: 'Global Sales & Alliances', headName: 'Robert Vance (Sales Dir)', parentDept: 'Executive Operations' },
    { id: 'dept-4', code: 'HR-04', name: 'Human Resources & Talent', headName: 'Emma Watson (HR Lead)', parentDept: 'Executive Operations' },
    { id: 'dept-5', code: 'FIN-05', name: 'Finance & Accounts', headName: 'Michael Brown (Finance Head)', parentDept: 'Executive Operations' }
  ];

  const designations: DesignationHierarchyNode[] = [
    { id: 'desig-1', title: 'Chief Executive Officer (CEO)', level: 1, department: 'Executive Operations' },
    { id: 'desig-2', title: 'Vice President / Director', level: 2, department: 'Cross-functional', reportingToTitle: 'Chief Executive Officer (CEO)' },
    { id: 'desig-3', title: 'Lead / Senior Manager', level: 3, department: 'Engineering / Sales / HR', reportingToTitle: 'Vice President / Director' },
    { id: 'desig-4', title: 'Senior Engineer / Accountant', level: 4, department: 'Engineering / Finance', reportingToTitle: 'Lead / Senior Manager' },
    { id: 'desig-5', title: 'Junior Associate / Intern', level: 5, department: 'Cross-functional', reportingToTitle: 'Senior Engineer / Accountant' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Department Hierarchy */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitFork className="text-purple-600" size={18} /> Department Hierarchy Tree
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Parent-child organization unit structure.</p>
        </div>

        <div className="space-y-3">
          {departments.map((d) => (
            <div key={d.id} className={`p-3 rounded-lg border text-xs space-y-1 ${d.parentDept ? 'ml-6 bg-slate-50 border-slate-200' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span>{d.name}</span>
                <span className="font-mono text-[10px] text-purple-600">{d.code}</span>
              </div>
              <p className="text-[11px] text-slate-600">Department Head: <span className="font-semibold text-slate-800">{d.headName}</span></p>
              {d.parentDept && <p className="text-[10px] text-slate-400">Parent Unit: {d.parentDept}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Designation Hierarchy */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-purple-600" size={18} /> Designation Hierarchy Levels
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Seniority grades and reporting chains.</p>
        </div>

        <div className="space-y-3">
          {designations.map((des) => (
            <div key={des.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 shadow-sm flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{des.title}</span>
                <p className="text-[10px] text-slate-500">{des.department} • Reports to: {des.reportingToTitle || 'Board of Directors'}</p>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-lg">Level {des.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
