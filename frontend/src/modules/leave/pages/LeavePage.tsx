import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Plus, Calendar as CalendarIcon, Umbrella, DollarSign, Award, Ban, Filter, Search, Clock, Check, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { DynamicLeaveBalanceCards } from '../components/DynamicLeaveBalanceCards';
import { LeaveTypeMasterManager } from '../components/LeaveTypeMasterManager';
import { EncashmentCompOffView } from '../components/EncashmentCompOffView';
import { ExtendedLeaveRequest, DynamicLeaveBalance, LeaveRequestStatus, LeaveTypeCategory } from '../types';

export const LeavePage: React.FC = () => {
  const { employees, activeSubSection, setActiveSubSection } = useApp();
  
  // Navigation Tabs
  const validLeaveTabs = ['requests', 'master', 'encashment', 'holidays'];
  const mainTab = (validLeaveTabs.includes(activeSubSection) ? activeSubSection : 'requests') as 'requests' | 'master' | 'encashment' | 'holidays';
  const setMainTab = (tab: 'requests' | 'master' | 'encashment' | 'holidays') => setActiveSubSection(tab);
  const [requestSubTab, setRequestSubTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Selected Employee for Dynamic Leave Balance calculation (Default to ALL for manager view, or specific employee)
  const [selectedEmpId, setSelectedEmpId] = useState('ALL');
  const selectedEmpObj = employees.find(e => e.id === selectedEmpId || e.empCode === selectedEmpId) || { id: 'ALL', name: 'All Employees (Manager Overview)', empCode: 'ALL' };

  // DYNAMIC LEAVE BALANCES (Formula: Opening - Used - Pending = Available)
  const [dynamicBalances, setDynamicBalances] = useState<DynamicLeaveBalance[]>([
    { empId: 'EMP-001', empName: 'Emma Watson', leaveType: 'Casual Leave (CL)', openingBalance: 12, used: 2, pending: 1, available: 9 },
    { empId: 'EMP-001', empName: 'Emma Watson', leaveType: 'Sick Leave (SL)', openingBalance: 10, used: 1, pending: 0, available: 9 },
    { empId: 'EMP-001', empName: 'Emma Watson', leaveType: 'Earned Leave (EL)', openingBalance: 15, used: 3, pending: 0, available: 12 },
    { empId: 'EMP-001', empName: 'Emma Watson', leaveType: 'Comp-Off', openingBalance: 4, used: 1, pending: 0, available: 3 }
  ]);

  // LEAVE REQUESTS STATE
  const [leaveRequests, setLeaveRequests] = useState<ExtendedLeaveRequest[]>([
    { id: 'lv-3513', empId: 'EMP-006', empName: 'vishnu', leaveType: 'Sick Leave (SL)', startDate: '2026-08-20', endDate: '2026-08-20', days: 0.5, isHalfDay: true, halfDaySession: 'First Half', reason: 'FEVER', status: 'Approved', appliedDate: '2026-08-13' },
    { id: 'lv-101', empId: 'EMP-001', empName: 'Emma Watson', leaveType: 'Casual Leave (CL)', startDate: '2026-08-15', endDate: '2026-08-16', days: 2, isHalfDay: false, reason: 'Family Function in native place', status: 'Pending', appliedDate: '2026-08-10' },
    { id: 'lv-102', empId: 'EMP-002', empName: 'Robert Vance', leaveType: 'Sick Leave (SL)', startDate: '2026-08-05', endDate: '2026-08-05', days: 0.5, isHalfDay: true, halfDaySession: 'Second Half', reason: 'Medical Checkup & Blood Test', status: 'Approved', appliedDate: '2026-08-04', managerComment: 'Approved. Get well soon!' },
    { id: 'lv-103', empId: 'EMP-003', empName: 'James Smith', leaveType: 'Earned Leave (EL)', startDate: '2026-07-20', endDate: '2026-07-25', days: 5, isHalfDay: false, reason: 'Annual Family Vacation', status: 'Approved', appliedDate: '2026-07-10' }
  ]);

  // Filters State
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [empFilter, setEmpFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedReqForAction, setSelectedReqForAction] = useState<ExtendedLeaveRequest | null>(null);
  const [managerCommentInput, setManagerCommentInput] = useState('');

  // Compute active balances for selected employee
  const currentBalances = React.useMemo(() => {
    if (selectedEmpId === 'ALL') {
      return dynamicBalances;
    }
    const empName = selectedEmpObj.name;
    const empReqs = leaveRequests.filter(r => r.empId === selectedEmpId || r.empName.toLowerCase() === empName.toLowerCase());
    
    const clUsed = empReqs.filter(r => r.leaveType.includes('Casual') && r.status === 'Approved').reduce((s, r) => s + r.days, 0);
    const clPending = empReqs.filter(r => r.leaveType.includes('Casual') && r.status === 'Pending').reduce((s, r) => s + r.days, 0);
    
    const slUsed = empReqs.filter(r => r.leaveType.includes('Sick') && r.status === 'Approved').reduce((s, r) => s + r.days, 0);
    const slPending = empReqs.filter(r => r.leaveType.includes('Sick') && r.status === 'Pending').reduce((s, r) => s + r.days, 0);

    const elUsed = empReqs.filter(r => r.leaveType.includes('Earned') && r.status === 'Approved').reduce((s, r) => s + r.days, 0);
    const elPending = empReqs.filter(r => r.leaveType.includes('Earned') && r.status === 'Pending').reduce((s, r) => s + r.days, 0);

    return [
      { empId: selectedEmpId, empName, leaveType: 'Casual Leave (CL)' as LeaveTypeCategory, openingBalance: 12, used: clUsed, pending: clPending, available: 12 - clUsed - clPending },
      { empId: selectedEmpId, empName, leaveType: 'Sick Leave (SL)' as LeaveTypeCategory, openingBalance: 10, used: slUsed, pending: slPending, available: 10 - slUsed - slPending },
      { empId: selectedEmpId, empName, leaveType: 'Earned Leave (EL)' as LeaveTypeCategory, openingBalance: 15, used: elUsed, pending: elPending, available: 15 - elUsed - elPending },
      { empId: selectedEmpId, empName, leaveType: 'Comp-Off' as LeaveTypeCategory, openingBalance: 4, used: 0, pending: 0, available: 4 }
    ];
  }, [selectedEmpId, selectedEmpObj, leaveRequests, dynamicBalances]);

  // Filtered requests list (incorporates selected employee dropdown)
  const filteredRequests = leaveRequests.filter(r => {
    const matchesEmpDropdown = selectedEmpId === 'ALL' || 
                              r.empId === selectedEmpId || 
                              r.empName.toLowerCase() === selectedEmpObj.name.toLowerCase();

    const matchesSubTab = 
      requestSubTab === 'all' ||
      (requestSubTab === 'pending' && r.status === 'Pending') ||
      (requestSubTab === 'approved' && r.status === 'Approved') ||
      (requestSubTab === 'rejected' && (r.status === 'Rejected' || r.status === 'Cancelled'));

    const matchesType = typeFilter === 'All' || r.leaveType === typeFilter;
    const matchesEmpFilter = empFilter === 'All' || r.empName.toLowerCase().includes(empFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;

    return matchesEmpDropdown && matchesSubTab && matchesType && matchesEmpFilter && matchesStatus;
  });

  // Form State for Apply Leave
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Casual Leave (CL)' as LeaveTypeCategory,
    startDate: '2026-08-20',
    endDate: '2026-08-20',
    days: 1,
    isHalfDay: false,
    halfDaySession: 'First Half' as 'First Half' | 'Second Half',
    reason: ''
  });

  const handleApplyLeave = async () => {
    const daysVal = applyForm.isHalfDay ? 0.5 : Number(applyForm.days);
    const newReq: ExtendedLeaveRequest = {
      id: `lv-${Date.now().toString().slice(-4)}`,
      empId: selectedEmpObj.id,
      empName: selectedEmpObj.name,
      leaveType: applyForm.leaveType,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      days: daysVal,
      isHalfDay: applyForm.isHalfDay,
      halfDaySession: applyForm.isHalfDay ? applyForm.halfDaySession : undefined,
      reason: applyForm.reason || 'Personal Leave',
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    try {
      await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmpObj.id,
          startDate: applyForm.startDate,
          endDate: applyForm.endDate,
          totalDays: daysVal,
          reason: applyForm.reason || 'Personal Leave'
        })
      });
    } catch (e) {
      console.warn('Backend API note:', e);
    }

    setLeaveRequests([newReq, ...leaveRequests]);
    
    // Update pending count in dynamic balance
    setDynamicBalances(dynamicBalances.map(b => 
      b.leaveType === applyForm.leaveType 
        ? { ...b, pending: b.pending + daysVal }
        : b
    ));

    setIsApplyModalOpen(false);
  };

  const handleApproveLeave = async (reqId: string) => {
    try {
      await fetch(`/api/leave/requests/${reqId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.warn('Backend API note:', e);
    }
    setLeaveRequests(leaveRequests.map(r => r.id === reqId ? { ...r, status: 'Approved', managerComment: managerCommentInput || 'Approved' } : r));
    setSelectedReqForAction(null);
    setManagerCommentInput('');
  };

  const handleRejectLeave = async (reqId: string) => {
    try {
      await fetch(`/api/leave/requests/${reqId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: managerCommentInput || 'Rejected' })
      });
    } catch (e) {
      console.warn('Backend API note:', e);
    }
    setLeaveRequests(leaveRequests.map(r => r.id === reqId ? { ...r, status: 'Rejected', managerComment: managerCommentInput || 'Rejected' } : r));
    setSelectedReqForAction(null);
    setManagerCommentInput('');
  };

  const handleCancelLeave = (reqId: string) => {
    setLeaveRequests(leaveRequests.map(r => r.id === reqId ? { ...r, status: 'Cancelled' } : r));
  };

  const holidays = [
    { name: 'Independence Day', date: '15 Aug 2026', day: 'Saturday', type: 'Gazetted' },
    { name: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', type: 'Gazetted' },
    { name: 'Diwali', date: '08 Nov 2026', day: 'Sunday', type: 'Gazetted' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="text-amber-600" size={24} />
            Leave & Absence Management Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic leave balances, half-day leaves, manager approvals, encashment, and comp-off credits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <span>Select Employee:</span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="text-xs bg-white border border-slate-300 font-bold text-slate-800 rounded-lg px-2.5 py-1.5 shadow-sm focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Employees (Manager Overview)</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.empCode || e.id})</option>
              ))}
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsApplyModalOpen(true)}>
            <Plus size={14} /> Apply for Leave
          </Button>
        </div>
      </div>

      {/* DYNAMIC LEAVE BALANCES CARDS SECTION */}
      <DynamicLeaveBalanceCards balances={currentBalances} selectedEmpName={selectedEmpObj.name} />

      {/* Main Tab Navigation */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('requests')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'requests' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarDays size={14} /> Leave Requests Portal
        </button>
        <button
          onClick={() => setMainTab('master')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'master' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Umbrella size={14} /> Leave Type Master
        </button>
        <button
          onClick={() => setMainTab('encashment')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'encashment' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign size={14} /> Encashment & Comp-Off
        </button>
        <button
          onClick={() => setMainTab('holidays')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'holidays' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarIcon size={14} /> Public Holidays 2026
        </button>
      </div>

      {/* TAB: LEAVE TYPE MASTER */}
      {mainTab === 'master' && <LeaveTypeMasterManager />}

      {/* TAB: ENCASHMENT & COMP-OFF */}
      {mainTab === 'encashment' && <EncashmentCompOffView />}

      {/* TAB: PUBLIC HOLIDAYS */}
      {mainTab === 'holidays' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {holidays.map((h, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">{h.name}</span>
                <Badge variant="neutral">{h.type}</Badge>
              </div>
              <p className="text-xs text-amber-600 font-bold">{h.date} ({h.day})</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB: LEAVE REQUESTS PORTAL */}
      {mainTab === 'requests' && (
        <div className="space-y-4">
          {/* Sub Tabs: All, Pending Approval, Approved, Rejected */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex space-x-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRequestSubTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                    requestSubTab === tab
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'All Requests' : tab === 'pending' ? 'Pending Approval' : tab === 'approved' ? 'Approved History' : 'Rejected / Cancelled'}
                </button>
              ))}
            </div>
          </div>

          {/* Leave Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search employee name..."
                value={empFilter === 'All' ? '' : empFilter}
                onChange={(e) => setEmpFilter(e.target.value || 'All')}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="All">All Leave Types</option>
                <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                <option value="Comp-Off">Comp-Off</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Req #</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Leave Type</th>
                  <th className="p-3.5">Dates / Session</th>
                  <th className="p-3.5">Days</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Manager Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((lv) => (
                  <tr key={lv.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-amber-600 font-bold">{lv.id}</td>
                    <td className="p-3.5 font-bold text-slate-900">{lv.empName}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{lv.leaveType}</td>
                    <td className="p-3.5 text-slate-500">
                      {lv.startDate} to {lv.endDate}
                      {lv.isHalfDay && <span className="block text-[10px] font-bold text-amber-600">Half-Day ({lv.halfDaySession})</span>}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{lv.days}</td>
                    <td className="p-3.5 max-w-xs truncate">{lv.reason}</td>
                    <td className="p-3.5">
                      <Badge variant={lv.status === 'Approved' ? 'success' : lv.status === 'Rejected' ? 'danger' : lv.status === 'Cancelled' ? 'neutral' : 'warning'}>
                        {lv.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {lv.status === 'Pending' && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelectedReqForAction(lv)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] flex items-center gap-0.5"
                          >
                            <Check size={12} /> Approve / Reject
                          </button>
                          <button
                            onClick={() => handleCancelLeave(lv.id)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold text-[10px]"
                            title="Cancel Leave"
                          >
                            <Ban size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLY FOR LEAVE MODAL WITH HALF-DAY TOGGLE */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Apply for Leave">
        <div className="space-y-4 text-xs">
          <Select
            label="Leave Type"
            value={applyForm.leaveType}
            onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value as LeaveTypeCategory })}
            options={[
              { label: 'Casual Leave (CL)', value: 'Casual Leave (CL)' },
              { label: 'Sick Leave (SL)', value: 'Sick Leave (SL)' },
              { label: 'Earned Leave (EL)', value: 'Earned Leave (EL)' },
              { label: 'Comp-Off', value: 'Comp-Off' }
            ]}
          />

          <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <input
              type="checkbox"
              id="halfday"
              checked={applyForm.isHalfDay}
              onChange={(e) => setApplyForm({ ...applyForm, isHalfDay: e.target.checked })}
            />
            <label htmlFor="halfday" className="font-bold text-slate-800 cursor-pointer">Apply as Half-Day Leave</label>
          </div>

          {applyForm.isHalfDay && (
            <Select
              label="Half-Day Session"
              value={applyForm.halfDaySession}
              onChange={(e) => setApplyForm({ ...applyForm, halfDaySession: e.target.value as any })}
              options={[
                { label: 'First Half (Morning)', value: 'First Half' },
                { label: 'Second Half (Afternoon)', value: 'Second Half' }
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Date" type="date" value={applyForm.startDate} onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={applyForm.endDate} onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })} />
          </div>

          <Input label="Reason for Leave" placeholder="Enter business or personal reason..." value={applyForm.reason} onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleApplyLeave}>Submit Application</Button>
          </div>
        </div>
      </Modal>

      {/* MANAGER APPROVAL / REJECTION DIALOG */}
      {selectedReqForAction && (
        <Modal isOpen={!!selectedReqForAction} onClose={() => setSelectedReqForAction(null)} title={`Manager Review: ${selectedReqForAction.empName}`}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-200">
              <p><span className="text-slate-400">Leave Type:</span> <span className="font-bold text-slate-900">{selectedReqForAction.leaveType}</span></p>
              <p><span className="text-slate-400">Duration:</span> <span className="font-bold text-slate-900">{selectedReqForAction.startDate} to {selectedReqForAction.endDate} ({selectedReqForAction.days} Days)</span></p>
              <p><span className="text-slate-400">Reason:</span> <span className="italic text-slate-700">"{selectedReqForAction.reason}"</span></p>
            </div>

            <Input
              label="Manager Approver Comment / Notes"
              placeholder="Add optional notes for the employee..."
              value={managerCommentInput}
              onChange={(e) => setManagerCommentInput(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" onClick={() => handleRejectLeave(selectedReqForAction.id)}>
                <X size={14} /> Reject Request
              </Button>
              <Button variant="primary" onClick={() => handleApproveLeave(selectedReqForAction.id)}>
                <Check size={14} /> Approve Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
