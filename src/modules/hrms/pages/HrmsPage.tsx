import React, { useState } from 'react';
import { UserCheck, Plus, Search, Filter, Phone, Mail, Building, Briefcase, IndianRupee } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const HrmsPage: React.FC = () => {
  const { employees } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="text-purple-600" size={24} />
            HRMS Employee Master
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central employee repository, statutory records, department hierarchies, and lifecycle management.
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search employees or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Executive">Executive</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white shadow-sm border border-slate-200 p-4 rounded-xl space-y-3 hover:border-purple-200 transition-all">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{emp.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{emp.designation}</p>
              </div>
            </div>
            
            <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">EMP ID:</span>
                <span className="font-mono font-bold text-purple-600">{emp.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-800">{emp.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Monthly Salary:</span>
                <span className="font-bold text-emerald-600">₹ {emp.salary.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100 text-[10px]">
              <Badge variant="success">Active</Badge>
              <button className="text-purple-600 font-bold hover:underline">View Profile &rarr;</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
