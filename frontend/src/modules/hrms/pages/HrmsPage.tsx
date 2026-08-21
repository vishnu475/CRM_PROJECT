import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Plus, Search, Filter, Phone, Mail, Building, Briefcase, LayoutGrid, List, Network, BarChart2, FileText, Shield, RefreshCw, LogOut, History, CheckCircle2, Award, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';

import { EmployeeDashboard } from '../components/EmployeeDashboard';
import { ReportingHierarchyView } from '../components/ReportingHierarchyView';
import { EmployeeDocumentManager } from '../components/EmployeeDocumentManager';
import { EmployeeTransferModal } from '../components/EmployeeTransferModal';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { ExtendedEmployee, EmployeeLifecycleStatus } from '../types';

import { fetchAllEmployeesFromDB, saveEmployeeToDB, updateEmployeeInDB } from '../../../services/employeePersistence';

export const HrmsPage: React.FC = () => {
  const { employees, addEmployee, updateEmployee, transferEmployee, exitEmployee, confirmEmployee, reloadEmployeesFromDB } = useApp();
  
  const [dbEmployees, setDbEmployees] = useState<ExtendedEmployee[]>([]);
  const [dbLoadCount, setDbLoadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Reload employees from PostgreSQL - called on mount, on new employee added, and on F5
  const refreshFromDB = useCallback(async () => {
    try {
      await reloadEmployeesFromDB();
    } catch (e) {
      console.warn('reloadEmployeesFromDB warning:', e);
    }
    try {
      const data = await fetchAllEmployeesFromDB();
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped: ExtendedEmployee[] = data.map((emp: any, idx: number) => ({
          id: emp.id,
          empCode: emp.empCode || emp.id,
          name: emp.name,
          email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          phone: emp.phone || `+91 98765 ${10000 + idx * 11}`,
          dob: '1995-05-15',
          gender: 'Male' as const,
          address: 'H.No 12, Tech Park Enclave, City',
          department: emp.department || 'Engineering',
          designation: emp.designation || 'Software Engineer',
          salary: emp.salary || 85000,
          basicSalary: emp.basicSalary || Math.round((emp.salary || 85000) * 0.6),
          allowances: emp.allowances || Math.round((emp.salary || 85000) * 0.4),
          status: (emp.status as any) || 'Joined',
          joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
          reportingManagerName: emp.reportingManagerName || 'Sarah Jenkins',
          reportingManagerId: emp.reportingManagerId || 'EMP-001',
          panNumber: emp.panNumber || '',
          uanNumber: emp.uanNumber || '',
          bankAccount: emp.bankAccount || '',
          ifscCode: emp.ifscCode || '',
          history: [],
        }));
        setDbEmployees(mapped);
      }
    } catch (e) {
      console.error('Error fetching employees from DB:', e);
    }
  }, [reloadEmployeesFromDB]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshFromDB();
    setIsRefreshing(false);
    setRefreshMessage('PostgreSQL Employee Master Data Refreshed!');
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  // Load on mount and whenever employees context changes
  useEffect(() => {
    refreshFromDB();
  }, [refreshFromDB, employees]);

  const { activeSubSection, setActiveSubSection } = useApp();
  const mainTab = activeSubSection === 'dashboard' ? 'dashboard' : activeSubSection === 'hierarchy' ? 'hierarchy' : 'employees';
  const setMainTab = (tab: 'dashboard' | 'employees' | 'hierarchy') => {
    if (tab === 'dashboard') setActiveSubSection('dashboard');
    else if (tab === 'hierarchy') setActiveSubSection('hierarchy');
    else setActiveSubSection('joined');
  };
  
  // Sync lifecycle status filter pill with URL sub-section route (/hrms/transferred, /hrms/joined, etc.)
  const selectedStatus: EmployeeLifecycleStatus | 'All' = React.useMemo(() => {
    switch (activeSubSection?.toLowerCase()) {
      case 'all': return 'All';
      case 'joined': return 'Joined';
      case 'probation': return 'Probation';
      case 'confirmed': return 'Confirmed';
      case 'active': return 'Active';
      case 'transferred': return 'Transferred';
      case 'exited': return 'Exited';
      default: return 'Joined';
    }
  }, [activeSubSection]);

  const handleSelectStatus = (st: EmployeeLifecycleStatus | 'All') => {
    const subRoute = st === 'All' ? 'all' : st.toLowerCase();
    setActiveSubSection(subRoute);
  };

  // View Switcher & Filters
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transferTargetEmployee, setTransferTargetEmployee] = useState<ExtendedEmployee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<ExtendedEmployee | null>(null);
  const [activeProfileSubTab, setActiveProfileSubTab] = useState<'info' | 'statutory' | 'salary' | 'history' | 'documents'>('info');

  const [editSalaryEmp, setEditSalaryEmp] = useState<ExtendedEmployee | null>(null);
  const [newSalaryValue, setNewSalaryValue] = useState<number>(0);

  const handleSaveSalaryUpdate = async () => {
    if (!editSalaryEmp || !newSalaryValue) return;
    const basic = Math.round(newSalaryValue * 0.6);
    const allowances = Math.round(newSalaryValue * 0.4);

    try {
      await updateEmployeeInDB(editSalaryEmp.id, {
        salary: newSalaryValue,
        basicSalary: basic,
        allowances
      });
      updateEmployee(editSalaryEmp.id, {
        salary: newSalaryValue,
        basicSalary: basic,
        allowances
      });
      setEditSalaryEmp(null);
      await refreshFromDB();
      alert(`Salary for ${editSalaryEmp.name} updated to ₹${newSalaryValue.toLocaleString()} and saved to Database!`);
    } catch (err: any) {
      alert(`Failed to update salary: ${err.message}`);
    }
  };

  // Map employees to ExtendedEmployee format cleanly with null-safety
  const activeEmployeeList = dbEmployees.length > 0 ? dbEmployees : employees;
  const extendedEmployees: ExtendedEmployee[] = activeEmployeeList.map((emp, idx) => {
    return {
      id: emp.id || emp.empCode || `EMP-${idx}`,
      empCode: emp.empCode || emp.id || `EMP-${idx}`,
      name: emp.name || 'Converted Employee',
      email: emp.email || `${(emp.name || 'emp').toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: emp.phone || `+91 98765 ${10000 + idx * 11}`,
      dob: (emp as any).dob || '1995-05-15',
      gender: (emp as any).gender || 'Male',
      address: (emp as any).address || 'H.No 12, Tech Park Enclave, City',
      department: emp.department || 'Engineering',
      designation: emp.designation || 'Senior Software Engineer',
      salary: Number(emp.salary) || 85000,
      basicSalary: Number(emp.basicSalary) || Math.round((Number(emp.salary) || 85000) * 0.6),
      allowances: Number(emp.allowances) || Math.round((Number(emp.salary) || 85000) * 0.4),
      status: (emp.status as any) || 'Joined',
      joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
      reportingManagerName: emp.reportingManagerName || (emp as any).manager || 'Sarah Jenkins',
      reportingManagerId: (emp as any).reportingManagerId || 'EMP-001',
      candidateId: (emp as any).candidateId,
      panNumber: (emp as any).panNumber || 'ABCDE1234F',
      uanNumber: (emp as any).uanNumber || '100987654321',
      bankAccount: (emp as any).bankAccount || '98765432101',
      ifscCode: (emp as any).ifscCode || 'HDFC0001234',
      history: (emp as any).history || [],
    };
  });

  // Extract unique departments & designations
  const departmentsList = Array.from(new Set(extendedEmployees.map(e => e.department).filter(Boolean)));
  const designations = Array.from(new Set(extendedEmployees.map(e => e.designation).filter(Boolean)));

  // Filtered employees list — 100% crash-proof
  const filteredEmployees = extendedEmployees.filter(emp => {
    const searchLower = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !searchLower || 
      (emp.name && emp.name.toLowerCase().includes(searchLower)) || 
      (emp.designation && emp.designation.toLowerCase().includes(searchLower)) ||
      (emp.id && emp.id.toLowerCase().includes(searchLower)) ||
      (emp.empCode && emp.empCode.toLowerCase().includes(searchLower));

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesDesig = selectedDesig === 'All' || emp.designation === selectedDesig;
    
    const statusLower = (emp.status || 'Joined').toLowerCase();
    const targetStatusLower = (selectedStatus || 'Joined').toLowerCase();
    
    const matchesStatus = 
      selectedStatus === 'All' || 
      statusLower === targetStatusLower ||
      (targetStatusLower === 'joined' && (statusLower === 'joined' || statusLower === 'active'));
    
    return matchesSearch && matchesDept && matchesDesig && matchesStatus;
  });

  const getStatusBadgeVariant = (st: EmployeeLifecycleStatus) => {
    switch(st) {
      case 'Active': case 'Confirmed': case 'Joined': return 'success';
      case 'Probation': return 'warning';
      case 'Transferred': return 'info';
      case 'Exited': return 'danger';
      default: return 'neutral';
    }
  };

  const handleUpdateLifecycleStatus = async (emp: ExtendedEmployee, newStatus: EmployeeLifecycleStatus) => {
    if (emp.status === newStatus) return;
    const oldStatus = emp.status;

    const changeRecord = {
      id: `HIST-${Date.now()}`,
      employeeId: emp.id,
      changeDate: new Date().toISOString().split('T')[0],
      changeType: 'Status Change' as const,
      oldStatus: emp.status,
      newStatus,
      reason: `Lifecycle status updated from ${emp.status} to ${newStatus}`,
    };

    // 1. Save permanently to PostgreSQL database via REST API
    await updateEmployeeInDB(emp.id, { status: newStatus });

    // 2. Update React AppContext
    updateEmployee(emp.id, {
      status: newStatus,
      history: [...(emp.history || []), changeRecord],
    });

    if (selectedEmployee && selectedEmployee.id === emp.id) {
      setSelectedEmployee(prev => prev ? {
        ...prev,
        status: newStatus,
        history: [...(prev.history || []), changeRecord],
      } : null);
    }

    // 3. Reload from PostgreSQL database
    await refreshFromDB();

    // 4. Auto-switch URL route & filter pill to the newly selected status section
    handleSelectStatus(newStatus);
  };

  const handleExecuteTransfer = (transferData: { newDepartment: string; newDesignation?: string; newManagerName?: string; reason?: string }) => {
    if (!transferTargetEmployee) return;
    transferEmployee(transferTargetEmployee.id, transferData);
    setTransferTargetEmployee(null);
    if (selectedEmployee && selectedEmployee.id === transferTargetEmployee.id) {
      setSelectedEmployee(null);
    }
  };

  const handleExecuteExit = (emp: ExtendedEmployee) => {
    if (window.confirm(`Are you sure you want to process exit/resignation for ${emp.name} (${emp.empCode || emp.id})? ID and historical records will be preserved.`)) {
      const reason = prompt('Enter exit reason:', 'Employee Resignation');
      exitEmployee(emp.id, reason || 'Resignation');
      if (selectedEmployee && selectedEmployee.id === emp.id) {
        setSelectedEmployee(null);
      }
    }
  };

  const handleApproveConfirmation = (emp: ExtendedEmployee) => {
    if (window.confirm(`Confirm probation completion for ${emp.name} (${emp.empCode || emp.id})? Status will update to Confirmed.`)) {
      confirmEmployee(emp.id);
      alert(`${emp.name} has been successfully confirmed in Employee Master!`);
      if (selectedEmployee && selectedEmployee.id === emp.id) {
        setSelectedEmployee(null);
      }
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
            Central employee identity store, tabbed onboarding, statutory records, department transfers, and lifecycle management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold animate-pulse">
              <CheckCircle2 size={14} /> {refreshMessage}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-purple-600' : 'text-purple-600'} />
            {isRefreshing ? 'Refreshing DB...' : 'Refresh DB Data'}
          </Button>
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
          <UserCheck size={14} /> Employee Directory & Master
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
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Lifecycle Status:</span>
            {(['All', 'Joined', 'Probation', 'Confirmed', 'Active', 'Transferred', 'Exited'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleSelectStatus(st as any)}
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
                  {departmentsList.map(dept => <option key={dept} value={dept}>{dept}</option>)}
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
                      <span className="font-mono font-bold text-purple-600">{emp.empCode || emp.id}</span>
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
                    <select
                      value={emp.status}
                      onChange={(e) => handleUpdateLifecycleStatus(emp, e.target.value as EmployeeLifecycleStatus)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border outline-none cursor-pointer transition-all ${
                        emp.status === 'Confirmed' || emp.status === 'Active' || emp.status === 'Joined'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : emp.status === 'Probation'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : emp.status === 'Transferred'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Click to Change Lifecycle Status"
                    >
                      <option value="Joined">Joined</option>
                      <option value="Probation">Probation</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Active">Active</option>
                      <option value="Transferred">Transferred</option>
                      <option value="Exited">Exited</option>
                    </select>
                    <div className="flex items-center gap-1">
                      {emp.status !== 'Exited' && (
                        <button 
                          onClick={() => setTransferTargetEmployee(emp)} 
                          title="Department Transfer"
                          className="p-1 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                      <button onClick={() => setSelectedEmployee(emp)} className="text-purple-600 font-bold hover:underline">Profile &rarr;</button>
                    </div>
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
                      <td className="p-3.5 font-mono text-purple-600 font-bold">{emp.empCode || emp.id}</td>
                      <td className="p-3.5 font-bold text-slate-900">{emp.name}</td>
                      <td className="p-3.5">{emp.designation}</td>
                      <td className="p-3.5 font-semibold">{emp.department}</td>
                      <td className="p-3.5 text-slate-500">{emp.reportingManagerName || 'Executive'}</td>
                      <td className="p-3.5 font-bold text-emerald-600">₹ {emp.salary.toLocaleString()}</td>
                      <td className="p-3.5">
                        <select
                          value={emp.status}
                          onChange={(e) => handleUpdateLifecycleStatus(emp, e.target.value as EmployeeLifecycleStatus)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border outline-none cursor-pointer transition-all ${
                            emp.status === 'Confirmed' || emp.status === 'Active' || emp.status === 'Joined'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : emp.status === 'Probation'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : emp.status === 'Transferred'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Click to Change Lifecycle Status"
                        >
                          <option value="Joined">Joined</option>
                          <option value="Probation">Probation</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Active">Active</option>
                          <option value="Transferred">Transferred</option>
                          <option value="Exited">Exited</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {emp.status === 'Probation' && (
                            <button
                              onClick={() => handleApproveConfirmation(emp)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 size={10} /> Confirm
                            </button>
                          )}
                          {emp.status !== 'Exited' && (
                            <button
                              onClick={() => { setEditSalaryEmp(emp); setNewSalaryValue(emp.salary || 85000); }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold flex items-center gap-1 border border-emerald-200"
                              title="Edit Employee Monthly Gross Salary"
                            >
                              <DollarSign size={10} /> Edit Salary
                            </button>
                          )}
                          {emp.status !== 'Exited' && (
                            <button
                              onClick={() => setTransferTargetEmployee(emp)}
                              className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <RefreshCw size={10} /> Transfer
                            </button>
                          )}
                          <button onClick={() => setSelectedEmployee(emp)} className="text-purple-600 font-bold hover:underline">Profile</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4-TAB ADD EMPLOYEE WIZARD MODAL */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async (data) => {
          // Save to PostgreSQL FIRST via central persistence service
          await saveEmployeeToDB({
            name: data.name || '',
            email: data.email,
            phone: data.phone,
            department: data.department || 'General',
            designation: data.designation || 'Staff',
            joiningDate: data.joiningDate,
            salary: data.salary || 50000,
            basicSalary: data.basicSalary,
            allowances: data.allowances,
            status: data.status || 'Joined',
            reportingManagerName: data.reportingManagerName || data.manager,
            panNumber: data.panNumber,
            uanNumber: data.uanNumber,
            bankAccount: data.bankAccount,
            ifscCode: data.ifscCode,
          });
          // Also add to AppContext for immediate UI update
          addEmployee(data);
          // Reload from DB to show the new employee
          await refreshFromDB();
        }}
        departments={departmentsList}
      />

      {/* DEPARTMENT TRANSFER MODAL */}
      <EmployeeTransferModal
        isOpen={!!transferTargetEmployee}
        onClose={() => setTransferTargetEmployee(null)}
        employee={transferTargetEmployee}
        onTransfer={handleExecuteTransfer}
        departments={departmentsList}
      />

      {/* VIEW EMPLOYEE PROFILE MODAL WITH TABS */}
      {selectedEmployee && (
        <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title={`Employee Master Profile: ${selectedEmployee.name}`}>
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
                  <p className="text-slate-400 font-mono text-[10px]">ID: {selectedEmployee.empCode || selectedEmployee.id} • Joined: {selectedEmployee.joiningDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedEmployee.status}
                  onChange={(e) => handleUpdateLifecycleStatus(selectedEmployee, e.target.value as EmployeeLifecycleStatus)}
                  className={`px-2.5 py-1 rounded text-xs font-bold border outline-none cursor-pointer transition-all ${
                    selectedEmployee.status === 'Confirmed' || selectedEmployee.status === 'Active' || selectedEmployee.status === 'Joined'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : selectedEmployee.status === 'Probation'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : selectedEmployee.status === 'Transferred'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                  title="Change Lifecycle Status"
                >
                  <option value="Joined">Joined</option>
                  <option value="Probation">Probation</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Active">Active</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Exited">Exited</option>
                </select>
                {selectedEmployee.status !== 'Exited' && (
                  <button
                    onClick={() => {
                      const empToTransfer = selectedEmployee;
                      setSelectedEmployee(null);
                      setTimeout(() => setTransferTargetEmployee(empToTransfer), 50);
                    }}
                    className="px-2.5 py-1 bg-purple-600 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-purple-700 shadow-sm cursor-pointer"
                  >
                    <RefreshCw size={12} /> Transfer Department
                  </button>
                )}
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex space-x-1 border-b border-slate-200">
              <button
                onClick={() => setActiveProfileSubTab('info')}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeProfileSubTab === 'info' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
                }`}
              >
                Personal & Employment
              </button>
              <button
                onClick={() => setActiveProfileSubTab('salary')}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeProfileSubTab === 'salary' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
                }`}
              >
                Salary Breakdown
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
                onClick={() => setActiveProfileSubTab('history')}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${
                  activeProfileSubTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
                }`}
              >
                <History size={12} /> Employment History ({selectedEmployee.history?.length || 0})
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
                  <p><span className="text-slate-400 block text-[10px]">Employee ID:</span> <span className="font-mono font-bold text-purple-700">{selectedEmployee.empCode || selectedEmployee.id}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Corporate Email:</span> <span className="font-semibold">{selectedEmployee.email}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Phone Number:</span> <span className="font-semibold">{selectedEmployee.phone}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Date of Birth:</span> <span className="font-semibold">{selectedEmployee.dob}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Gender:</span> <span className="font-semibold">{selectedEmployee.gender}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Reporting Manager:</span> <span className="font-semibold text-purple-700">{selectedEmployee.reportingManagerName}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Joining Date:</span> <span className="font-semibold">{selectedEmployee.joiningDate}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Employment Type:</span> <span className="font-semibold">{selectedEmployee.employmentType || 'Full-time'}</span></p>
                  <p className="col-span-2"><span className="text-slate-400 block text-[10px]">Residential Address:</span> <span className="font-semibold">{selectedEmployee.address}</span></p>
                </div>

                {selectedEmployee.status !== 'Exited' && (
                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => handleExecuteExit(selectedEmployee)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <LogOut size={12} /> Process Employee Exit / Resignation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sub Tab: Salary */}
            {activeProfileSubTab === 'salary' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <p><span className="text-slate-400 block text-[10px]">Basic Salary (Monthly):</span> <span className="font-bold text-slate-800">₹ {(selectedEmployee.basicSalary || Math.round(selectedEmployee.salary * 0.6)).toLocaleString()}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">HRA & Allowances:</span> <span className="font-bold text-slate-800">₹ {(selectedEmployee.allowances || Math.round(selectedEmployee.salary * 0.4)).toLocaleString()}</span></p>
                  <p className="col-span-2 pt-2 border-t border-slate-200"><span className="text-slate-400 block text-[10px]">Total Gross Monthly Compensation:</span> <span className="font-bold text-emerald-600 text-sm">₹ {selectedEmployee.salary.toLocaleString()}</span></p>
                </div>
              </div>
            )}

            {/* Sub Tab: Statutory */}
            {activeProfileSubTab === 'statutory' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <p><span className="text-slate-400 block text-[10px]">PAN Number:</span> <span className="font-mono font-bold">{selectedEmployee.panNumber}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">PF UAN Number:</span> <span className="font-mono font-bold">{selectedEmployee.uanNumber}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">Bank Account #:</span> <span className="font-mono font-bold">{selectedEmployee.bankAccount}</span></p>
                  <p><span className="text-slate-400 block text-[10px]">IFSC Code:</span> <span className="font-mono font-bold">{selectedEmployee.ifscCode}</span></p>
                </div>
              </div>
            )}

            {/* Sub Tab: History */}
            {activeProfileSubTab === 'history' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {selectedEmployee.history && selectedEmployee.history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEmployee.history.map((rec, i) => (
                      <div key={i} className="p-2.5 bg-white rounded border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-purple-700">{rec.changeType}</span>
                          <span className="text-[10px] text-slate-400">{rec.changeDate}</span>
                        </div>
                        {rec.oldDepartment && rec.newDepartment && (
                          <p className="text-slate-700">
                            Department: <span className="line-through text-slate-400">{rec.oldDepartment}</span> ➔ <span className="font-bold text-slate-900">{rec.newDepartment}</span>
                          </p>
                        )}
                        {rec.reason && (
                          <p className="text-slate-500 italic text-[11px]">"{rec.reason}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No transfer or lifecycle change records logged yet.</p>
                )}
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

      {/* EDIT SALARY MODAL FOR TRANSFERRED & EXISTING EMPLOYEES */}
      {editSalaryEmp && (
        <Modal isOpen={!!editSalaryEmp} onClose={() => setEditSalaryEmp(null)} title={`Edit Salary: ${editSalaryEmp.name}`}>
          <div className="space-y-4 text-xs text-slate-700">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-1">
              <p className="font-bold text-emerald-900">Update CTC for {editSalaryEmp.name}</p>
              <p className="text-emerald-700 text-[11px]">
                Employee Status: <span className="font-bold">{editSalaryEmp.status}</span> | Dept: <span className="font-bold">{editSalaryEmp.department}</span>
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">New Monthly Gross Salary (₹)</label>
              <input
                type="number"
                value={newSalaryValue}
                onChange={(e) => setNewSalaryValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Calculated Basic Salary (60%):</span>
                <span className="font-bold text-slate-800">₹ {Math.round(newSalaryValue * 0.6).toLocaleString()}</span>
              </div>
              <div className="flex justify-between"><span>Calculated Allowances (40%):</span> <span className="font-bold text-slate-800">₹ {Math.round(newSalaryValue * 0.4).toLocaleString()}</span></div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setEditSalaryEmp(null)}>Cancel</Button>
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveSalaryUpdate}>
                Save Salary to Database
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
