import React, { useState } from 'react';
import { UserCheck, Plus, Search, Filter, Phone, Mail, Building, Briefcase, LayoutGrid, List, Network, BarChart2, FileText, UserPlus, Shield } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { EmployeeDashboard } from '../components/EmployeeDashboard';
import { ReportingHierarchyView } from '../components/ReportingHierarchyView';
import { EmployeeDocumentManager } from '../components/EmployeeDocumentManager';
import { ExtendedEmployee, EmployeeLifecycleStatus } from '../types';

export const HrmsPage: React.FC = () => {
  const { employees } = useApp();
  
  // Navigation Tabs
  const [mainTab, setMainTab] = useState<'dashboard' | 'employees' | 'hierarchy'>('employees');
  
  // View Switcher & Filters
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<EmployeeLifecycleStatus | 'All'>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<ExtendedEmployee | null>(null);
  const [activeProfileSubTab, setActiveProfileSubTab] = useState<'info' | 'statutory' | 'documents'>('info');

  // Map AppContext employees to ExtendedEmployee with lifecycle status
  const extendedEmployees: ExtendedEmployee[] = employees.map((emp, idx) => {
    const statuses: EmployeeLifecycleStatus[] = ['Active', 'Probation', 'Confirmed', 'Transferred', 'Exited'];
    const status = statuses[idx % statuses.length];
    return {
      ...emp,
      status,
      email: `${emp.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: `+91 98765 ${10000 + idx * 11}`,
      joiningDate: `2024-0${(idx % 9) + 1}-15`,
      reportingManagerName: idx > 0 ? employees[0].name : 'Executive Director',
      reportingManagerId: idx > 0 ? employees[0].id : undefined
    };
  });

  // Extract unique designations
  const designations = Array.from(new Set(employees.map(e => e.designation)));

  // Filtered employees list
  const filteredEmployees = extendedEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesDesig = selectedDesig === 'All' || emp.designation === selectedDesig;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;
    
    return matchesSearch && matchesDept && matchesDesig && matchesStatus;
  });

  const getStatusBadgeVariant = (st: EmployeeLifecycleStatus) => {
    switch(st) {
      case 'Active': case 'Confirmed': return 'success';
      case 'Probation': return 'warning';
      case 'Transferred': return 'info';
      case 'Exited': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
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
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} /> Add Employee
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setMainTab('employees')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'employees' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck size={14} /> Employee List & Directory
        </button>
        <button
          onClick={() => setMainTab('dashboard')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'dashboard' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart2 size={14} /> Employee Dashboard & Analytics
        </button>
        <button
          onClick={() => setMainTab('hierarchy')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'hierarchy' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Network size={14} /> Reporting Hierarchy Org Chart
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {mainTab === 'dashboard' && <EmployeeDashboard employees={extendedEmployees} />}

      {/* TAB CONTENT: HIERARCHY ORG CHART */}
      {mainTab === 'hierarchy' && <ReportingHierarchyView employees={extendedEmployees} />}

      {/* TAB CONTENT: EMPLOYEES DIRECTORY */}
      {mainTab === 'employees' && (
        <div className="space-y-4">
          {/* Lifecycle Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Lifecycle:</span>
            {(['All', 'Active', 'Confirmed', 'Probation', 'Transferred', 'Exited'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedStatus === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Filters Bar & View Switcher */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search by name, ID or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Department Filter */}
              <div className="flex items-center gap-1.5">
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
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              {/* Designation Filter */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedDesig}
                  onChange={(e) => setSelectedDesig(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="All">All Designations</option>
                  {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Card / Table Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto lg:ml-0">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === 'card' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === 'table' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
                  title="Table View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE: CARDS GRID */}
          {viewMode === 'card' && (
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
                    <Badge variant={getStatusBadgeVariant(emp.status)}>{emp.status}</Badge>
                    <button onClick={() => setSelectedEmployee(emp)} className="text-purple-600 font-bold hover:underline">View Profile &rarr;</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE: TABLE */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">EMP ID</th>
                    <th className="p-3.5">Employee Name</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Reporting Manager</th>
                    <th className="p-3.5 font-right">Monthly Salary</th>
                    <th className="p-3.5">Lifecycle Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono text-purple-600 font-bold">{emp.id}</td>
                      <td className="p-3.5 font-bold text-slate-900">{emp.name}</td>
                      <td className="p-3.5">{emp.designation}</td>
                      <td className="p-3.5 font-semibold">{emp.department}</td>
                      <td className="p-3.5 text-slate-500">{emp.reportingManagerName || 'Executive'}</td>
                      <td className="p-3.5 font-bold text-emerald-600">₹ {emp.salary.toLocaleString()}</td>
                      <td className="p-3.5">
                        <Badge variant={getStatusBadgeVariant(emp.status)}>{emp.status}</Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <button onClick={() => setSelectedEmployee(emp)} className="text-purple-600 font-bold hover:underline">Profile &rarr;</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Employee">
        <div className="space-y-4 text-xs">
          <Input label="Full Name" placeholder="e.g. Sarah Connor" />
          <Input label="Designation" placeholder="e.g. Senior Software Engineer" />
          <Select
            label="Department"
            options={[
              { label: 'Engineering', value: 'Engineering' },
              { label: 'Sales', value: 'Sales' },
              { label: 'HR', value: 'HR' },
              { label: 'Finance', value: 'Finance' },
              { label: 'Marketing', value: 'Marketing' }
            ]}
          />
          <Select
            label="Initial Lifecycle Status"
            options={[
              { label: 'Probation', value: 'Probation' },
              { label: 'Active', value: 'Active' },
              { label: 'Confirmed', value: 'Confirmed' }
            ]}
          />
          <Input label="Monthly Base Salary (₹)" type="number" defaultValue="120000" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(false)}>Save Employee</Button>
          </div>
        </div>
      </Modal>

      {/* VIEW EMPLOYEE PROFILE MODAL WITH TABS (Info, Statutory, Documents) */}
      {selectedEmployee && (
        <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title={`Employee Profile: ${selectedEmployee.name}`}>
          <div className="space-y-4 text-xs">
            {/* Header Banner */}
            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedEmployee.name}</h3>
                  <p className="text-purple-700 font-semibold">{selectedEmployee.designation} • {selectedEmployee.department}</p>
                  <p className="text-slate-400 font-mono text-[10px]">ID: {selectedEmployee.id} • Joined: {selectedEmployee.joiningDate}</p>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedEmployee.status)}>{selectedEmployee.status}</Badge>
            </div>

            {/* Sub Tabs */}
            <div className="flex space-x-1 border-b border-slate-200">
              <button
                onClick={() => setActiveProfileSubTab('info')}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeProfileSubTab === 'info' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
                }`}
              >
                Personal & Hierarchy
              </button>
              <button
                onClick={() => setActiveProfileSubTab('statutory')}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeProfileSubTab === 'statutory' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
                }`}
              >
                Bank & Statutory
              </button>
              <button
                onClick={() => setActiveProfileSubTab('documents')}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeProfileSubTab === 'documents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
                }`}
              >
                Documents Vault
              </button>
            </div>

            {/* Sub Tab: Info */}
            {activeProfileSubTab === 'info' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <p><span className="text-slate-400 block text-[10px]">Corporate Email:</span> <span className="font-semibold">{selectedEmployee.email}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Phone Number:</span> <span className="font-semibold">{selectedEmployee.phone}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Reporting Manager:</span> <span className="font-semibold text-purple-700">{selectedEmployee.reportingManagerName}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Monthly Base Salary:</span> <span className="font-bold text-emerald-600">₹ {selectedEmployee.salary.toLocaleString()}</span></p>
                </div>
              </div>
            )}

            {/* Sub Tab: Statutory */}
            {activeProfileSubTab === 'statutory' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <p><span className="text-slate-400 block text-[10px]">PAN Number:</span> <span className="font-mono font-bold">ABCDE1234F</span></p>
                  <p><span className="text-slate-400 block text-[10px]">PF UAN Number:</span> <span className="font-mono font-bold">100987654321</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Bank Account #:</span> <span className="font-mono font-bold">98765432101</span></p>
                  <p><span className="text-slate-400 block text-[10px]">IFSC Code:</span> <span className="font-mono font-bold">HDFC0001234</span></p>
                </div>
              </div>
            )}

            {/* Sub Tab: Documents */}
            {activeProfileSubTab === 'documents' && (
              <EmployeeDocumentManager employeeName={selectedEmployee.name} />
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedEmployee(null)}>Close Profile</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
