import React, { useState } from 'react';
import { Receipt, Plus, CheckCircle2, FileText, Upload, Filter, Search, Calendar, UserCheck, ShieldCheck, DollarSign, Ban } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { ExpenseDashboard } from '../components/ExpenseDashboard';
import { ExpenseCategoryManager } from '../components/ExpenseCategoryManager';
import { ExtendedExpenseClaim, ExpenseApprovalStage } from '../types';

export const ExpensesPage: React.FC = () => {
  const { employees } = useApp();

  // Navigation Tabs
  const [mainTab, setMainTab] = useState<'claims' | 'categories' | 'dashboard'>('claims');

  // Extended Expense Claims list with Multi-Stage Approval Workflow
  const [claims, setClaims] = useState<ExtendedExpenseClaim[]>([
    { id: 'exp-1', claimNumber: 'EXP-2026-901', empId: 'EMP-001', empName: 'Emma Watson', department: 'HR', category: 'Travel & Conveyance', costCenter: 'HR Operations', amount: 4500, description: 'Client meeting taxi fare & toll charges', receiptFileName: 'Taxi_Toll_Receipt.pdf', appliedDate: '2026-08-10', stage: 'Submitted' },
    { id: 'exp-2', claimNumber: 'EXP-2026-902', empId: 'EMP-002', empName: 'Robert Vance', department: 'Sales', category: 'Client Entertainment', costCenter: 'Sales Field', amount: 12500, description: 'Executive client dinner at Taj Lands End', receiptFileName: 'Client_Dinner_Bill.pdf', appliedDate: '2026-08-08', stage: 'Manager Approved', managerNotes: 'Approved by Sales Director Vance.' },
    { id: 'exp-3', claimNumber: 'EXP-2026-903', empId: 'EMP-003', empName: 'James Smith', department: 'Engineering', category: 'Software Subscriptions', costCenter: 'Tech Dev', amount: 18000, description: 'GitHub Enterprise annual seat licenses', receiptFileName: 'GitHub_Invoice.pdf', appliedDate: '2026-08-01', stage: 'Reimbursed', managerNotes: 'Approved.', financeNotes: 'Reimbursed via HDFC NetBanking on Aug 5.', reimbursementDate: '2026-08-05' }
  ]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState<string>('All');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<ExtendedExpenseClaim | null>(null);
  const [actionNotesInput, setActionNotesInput] = useState('');

  // New Claim Form State
  const [newClaim, setNewClaim] = useState({
    empName: 'Emma Watson',
    department: 'HR',
    category: 'Travel & Conveyance',
    costCenter: 'HR Operations',
    amount: 3500,
    description: ''
  });

  const handleSubmitClaim = () => {
    const created: ExtendedExpenseClaim = {
      id: `exp-${Date.now().toString().slice(-4)}`,
      claimNumber: `EXP-2026-${Date.now().toString().slice(-3)}`,
      empId: 'EMP-001',
      empName: newClaim.empName,
      department: newClaim.department,
      category: newClaim.category,
      costCenter: newClaim.costCenter,
      amount: Number(newClaim.amount),
      description: newClaim.description || 'Business Expense',
      receiptFileName: 'Receipt_Bill.pdf',
      appliedDate: new Date().toISOString().split('T')[0],
      stage: 'Submitted'
    };
    setClaims([created, ...claims]);
    setIsSubmitModalOpen(false);
  };

  const handleManagerApprove = (id: string) => {
    setClaims(claims.map(c => c.id === id ? { ...c, stage: 'Manager Approved', managerNotes: actionNotesInput || 'Manager Approved' } : c));
    setSelectedClaimForAction(null);
    setActionNotesInput('');
  };

  const handleFinanceApprove = (id: string) => {
    setClaims(claims.map(c => c.id === id ? { ...c, stage: 'Finance Approved', financeNotes: actionNotesInput || 'Finance Approved' } : c));
    setSelectedClaimForAction(null);
    setActionNotesInput('');
  };

  const handleDisburseReimbursement = (id: string) => {
    setClaims(claims.map(c => c.id === id ? { ...c, stage: 'Reimbursed', reimbursementDate: new Date().toISOString().split('T')[0] } : c));
    setSelectedClaimForAction(null);
  };

  const handleRejectClaim = (id: string) => {
    setClaims(claims.map(c => c.id === id ? { ...c, stage: 'Rejected', financeNotes: actionNotesInput || 'Rejected' } : c));
    setSelectedClaimForAction(null);
    setActionNotesInput('');
  };

  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.empName.toLowerCase().includes(searchTerm.toLowerCase()) || c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || c.department === deptFilter;
    const matchesStage = stageFilter === 'All' || c.stage === stageFilter;
    return matchesSearch && matchesDept && matchesStage;
  });

  const getStageBadgeVariant = (st: ExpenseApprovalStage) => {
    switch(st) {
      case 'Reimbursed': return 'success';
      case 'Finance Approved': return 'info';
      case 'Manager Approved': return 'warning';
      case 'Submitted': return 'neutral';
      case 'Rejected': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="text-amber-600" size={24} />
            Expense Reimbursement & Policy Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-stage approval flow: Employee ➔ Expense Claim ➔ Receipt ➔ Manager Approval ➔ Finance Approval ➔ Reimbursement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsSubmitModalOpen(true)}>
            <Plus size={14} /> Submit Expense Claim
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('claims')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'claims' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt size={14} /> Expense Claims & Approval Workflow ({claims.length})
        </button>
        <button
          onClick={() => setMainTab('categories')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'categories' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck size={14} /> Expense Category Policies
        </button>
        <button
          onClick={() => setMainTab('dashboard')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'dashboard' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} /> Expense Analytics Dashboard
        </button>
      </div>

      {/* TAB: DASHBOARD */}
      {mainTab === 'dashboard' && <ExpenseDashboard claims={claims} />}

      {/* TAB: CATEGORY POLICIES */}
      {mainTab === 'categories' && <ExpenseCategoryManager />}

      {/* TAB: CLAIMS & APPROVAL WORKFLOW */}
      {mainTab === 'claims' && (
        <div className="space-y-4">
          {/* Multi-Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search employee or claim #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Engineering">Engineering</option>
                <option value="Finance">Finance</option>
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Approval Stages</option>
                <option value="Submitted">Submitted (Stage 1)</option>
                <option value="Manager Approved">Manager Approved (Stage 2)</option>
                <option value="Finance Approved">Finance Approved (Stage 3)</option>
                <option value="Reimbursed">Reimbursed (Paid)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Expense Claims Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Claim #</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Cost Center</th>
                  <th className="p-3.5 font-bold">Amount</th>
                  <th className="p-3.5">Receipt Attachment</th>
                  <th className="p-3.5">Approval Stage</th>
                  <th className="p-3.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-indigo-600 font-bold">{exp.claimNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{exp.empName}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{exp.category}</td>
                    <td className="p-3.5 font-mono text-slate-500">{exp.costCenter}</td>
                    <td className="p-3.5 font-extrabold text-amber-600">₹ {exp.amount.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <FileText size={12} /> {exp.receiptFileName || 'No Receipt'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={getStageBadgeVariant(exp.stage)}>{exp.stage}</Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => setSelectedClaimForAction(exp)} className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold">
                        Review Workflow &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMIT CLAIM MODAL */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Submit Expense Reimbursement Claim">
        <div className="space-y-4 text-xs">
          <Select
            label="Expense Category"
            value={newClaim.category}
            onChange={(e) => setNewClaim({ ...newClaim, category: e.target.value })}
            options={[
              { label: 'Travel & Local Conveyance', value: 'Travel & Conveyance' },
              { label: 'Client Entertainment / Meals', value: 'Client Entertainment' },
              { label: 'Office Stationery & Supplies', value: 'Office Supplies' },
              { label: 'Software Subscriptions & Tools', value: 'Software Subscriptions' }
            ]}
          />
          <Input label="Cost Center Allocation" placeholder="e.g. Sales Field" value={newClaim.costCenter} onChange={(e) => setNewClaim({ ...newClaim, costCenter: e.target.value })} />
          <Input label="Claim Amount (₹)" type="number" value={newClaim.amount} onChange={(e) => setNewClaim({ ...newClaim, amount: Number(e.target.value) })} />
          <Input label="Business Purpose / Description" placeholder="Explain the expense details..." value={newClaim.description} onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })} />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Attachment</label>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50 text-slate-400 hover:border-amber-400 transition-colors cursor-pointer">
              <Upload size={20} className="mx-auto mb-1 text-amber-600" />
              <span>Attach bill receipt image (PDF, PNG, JPG)</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmitClaim}>Submit Claim</Button>
          </div>
        </div>
      </Modal>

      {/* WORKFLOW REVIEW & DISBURSAL MODAL */}
      {selectedClaimForAction && (
        <Modal isOpen={!!selectedClaimForAction} onClose={() => setSelectedClaimForAction(null)} title={`Expense Review: ${selectedClaimForAction.claimNumber}`}>
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-lg space-y-1">
              <h4 className="font-bold text-slate-900">{selectedClaimForAction.empName} — {selectedClaimForAction.category}</h4>
              <p className="text-amber-800 font-bold text-sm">Amount: ₹ {selectedClaimForAction.amount.toLocaleString()}</p>
              <p className="text-slate-600">Description: "{selectedClaimForAction.description}"</p>
              <p className="text-slate-400 font-mono text-[10px]">Attached Receipt: {selectedClaimForAction.receiptFileName}</p>
              <Badge variant={getStageBadgeVariant(selectedClaimForAction.stage)}>Current Stage: {selectedClaimForAction.stage}</Badge>
            </div>

            <Input
              label="Approver Notes / Disbursal Memo"
              placeholder="Add approver notes..."
              value={actionNotesInput}
              onChange={(e) => setActionNotesInput(e.target.value)}
            />

            <div className="flex flex-wrap gap-2 justify-end pt-2">
              {selectedClaimForAction.stage === 'Submitted' && (
                <Button variant="primary" onClick={() => handleManagerApprove(selectedClaimForAction.id)}>
                  Manager Approval &rarr;
                </Button>
              )}
              {selectedClaimForAction.stage === 'Manager Approved' && (
                <Button variant="primary" onClick={() => handleFinanceApprove(selectedClaimForAction.id)}>
                  Finance Approval &rarr;
                </Button>
              )}
              {selectedClaimForAction.stage === 'Finance Approved' && (
                <Button variant="primary" onClick={() => handleDisburseReimbursement(selectedClaimForAction.id)}>
                  Disburse Reimbursement (Pay)
                </Button>
              )}
              {selectedClaimForAction.stage !== 'Reimbursed' && selectedClaimForAction.stage !== 'Rejected' && (
                <Button variant="danger" onClick={() => handleRejectClaim(selectedClaimForAction.id)}>
                  Reject Claim
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedClaimForAction(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
