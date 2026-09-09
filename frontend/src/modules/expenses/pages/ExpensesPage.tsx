import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  FileText,
  Upload,
  Filter,
  Search,
  Calendar,
  UserCheck,
  ShieldCheck,
  DollarSign,
  Ban,
  Clock,
  RefreshCw,
  Eye,
  Paperclip,
  Check,
  X,
  Printer,
  Plane,
  Utensils,
  Laptop,
  Wifi,
  ShoppingBag,
  Building,
  Heart,
  Award,
  ArrowRight,
  TrendingUp,
  Banknote
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { ExpenseDashboard } from '../components/ExpenseDashboard';
import { ExpenseCategoryManager } from '../components/ExpenseCategoryManager';
import { ExtendedExpenseClaim, ExpenseApprovalStage } from '../types';
import { DocumentPreviewModal } from '../../../components/common/DocumentPreviewModal';

export const ExpensesPage: React.FC = () => {
  const { employees = [], activeSubSection, setActiveSubSection } = useApp();

  // Navigation Tabs
  const validExpenseTabs = ['claims', 'categories', 'dashboard'];
  const mainTab = (validExpenseTabs.includes(activeSubSection) ? activeSubSection : 'claims') as 'claims' | 'categories' | 'dashboard';
  const setMainTab = (tab: 'claims' | 'categories' | 'dashboard') => setActiveSubSection(tab);

  // Live Database Claims state
  const [claims, setClaims] = useState<ExtendedExpenseClaim[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<ExtendedExpenseClaim | null>(null);
  const [actionNotesInput, setActionNotesInput] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<{ isOpen: boolean; fileUrl?: string; fileName?: string } | null>(null);

  const handleOpenReceipt = (fileUrl?: string, fileName?: string) => {
    if (!fileUrl) {
      alert('No receipt proof was attached to this claim.');
      return;
    }
    setPreviewReceipt({
      isOpen: true,
      fileUrl,
      fileName: fileName || 'Expense_Tax_Invoice.pdf'
    });
  };

  // New Claim Form State
  const [newClaim, setNewClaim] = useState({
    empId: 'EMP-006',
    empName: 'Hps',
    department: 'Engineering',
    category: 'Travel & Conveyance',
    costCenter: 'Engineering Dev',
    amount: 3500,
    description: '',
    vendor: 'Uber India',
    paymentMode: 'Personal Credit Card'
  });
  const [adminReceiptName, setAdminReceiptName] = useState<string | null>(null);
  const [adminReceiptUrl, setAdminReceiptUrl] = useState<string>('');
  const adminFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAdminReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum allowed 10MB.');
      return;
    }

    setAdminReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAdminReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Fetch Live Claims from PostgreSQL
  const fetchClaimsFromDB = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hrms/expense-claims');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mapped: ExtendedExpenseClaim[] = json.data.map((row: any) => {
          const rawStatus = (row.status || '').toUpperCase();
          let stage: ExpenseApprovalStage = 'Submitted';
          if (rawStatus.includes('REIMBURSED') || rawStatus.includes('PAID')) stage = 'Reimbursed';
          else if (rawStatus.includes('FINANCE') || rawStatus === 'APPROVED') stage = 'Finance Approved';
          else if (rawStatus.includes('MANAGER')) stage = 'Manager Approved';
          else if (rawStatus.includes('REJECT')) stage = 'Rejected';

          const rUrl = row.receipt_url || '';
          let rName = row.receipt_file_name;
          if (!rName) {
            if (rUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)/i.test(rUrl)) {
              rName = `${row.claim_number || row.id}_Receipt.jpg`;
            } else {
              rName = `${row.claim_number || row.id}_Tax_Invoice.pdf`;
            }
          }

          return {
            id: row.id,
            claimNumber: row.claim_number || row.id,
            empId: row.employee_id || 'EMP-006',
            empName: row.emp_name || 'Hps',
            department: row.department || 'Engineering',
            category: row.category || 'Travel & Conveyance',
            costCenter: row.cost_center || `${row.department || 'General'} Ops`,
            amount: Number(row.amount || 0),
            description: row.description || `${row.category} expenditure`,
            receiptFileName: rName,
            receiptUrl: rUrl,
            appliedDate: row.claim_date ? row.claim_date.split('T')[0] : (row.created_at ? row.created_at.split('T')[0] : '2026-08-24'),
            stage,
            managerNotes: row.approved_by ? `Reviewed by ${row.approved_by}` : undefined,
            financeNotes: stage === 'Finance Approved' || stage === 'Reimbursed' ? `Finance verified & passed.` : undefined,
            reimbursementDate: stage === 'Reimbursed' ? (row.updated_at ? row.updated_at.split('T')[0] : '2026-08-28') : undefined
          };
        });
        setClaims(mapped);
      } else {
        // Fallback default claims
        setClaims([
          { id: 'exp-1', claimNumber: 'EXP-EMP-006-901', empId: 'EMP-006', empName: 'Hps', department: 'Engineering', category: 'Software Subscriptions', costCenter: 'Tech Dev', amount: 12500, description: 'Dev license annual renewal', receiptFileName: 'JetBrains_Invoice.pdf', appliedDate: '2026-08-24', stage: 'Finance Approved' },
          { id: 'exp-2', claimNumber: 'EXP-EMP-001-902', empId: 'EMP-001', empName: 'Emma Watson', department: 'HR', category: 'Travel & Conveyance', costCenter: 'HR Operations', amount: 4500, description: 'Client meeting cab fare & toll charges', receiptFileName: 'Taxi_Toll_Receipt.pdf', appliedDate: '2026-08-10', stage: 'Submitted' },
          { id: 'exp-3', claimNumber: 'EXP-EMP-002-903', empId: 'EMP-002', empName: 'Robert Vance', department: 'Sales', category: 'Client Entertainment', costCenter: 'Sales Field', amount: 8200, description: 'Executive client dinner at Taj', receiptFileName: 'Client_Dinner_Bill.pdf', appliedDate: '2026-08-08', stage: 'Manager Approved', managerNotes: 'Approved by Sales Director.' }
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch expense claims from DB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaimsFromDB();
  }, [fetchClaimsFromDB]);

  // Submit New Claim from Admin Form
  const handleSubmitClaim = async () => {
    try {
      await fetch('/api/v1/employee/me/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': newClaim.empId
        },
        body: JSON.stringify({
          category: newClaim.category,
          amount: Number(newClaim.amount),
          description: newClaim.description || `${newClaim.category} expense`,
          vendor: newClaim.vendor,
          paymentMode: newClaim.paymentMode,
          claimDate: new Date().toISOString().split('T')[0],
          receiptUrl: adminReceiptUrl || ''
        })
      });

      setIsSubmitModalOpen(false);
      setAdminReceiptName(null);
      setAdminReceiptUrl('');
      setRefreshMessage('New expense claim logged successfully!');
      setTimeout(() => setRefreshMessage(null), 3000);
      fetchClaimsFromDB();
    } catch (e: any) {
      alert(e.message || 'Error submitting claim');
    }
  };

  // Perform Multi-Stage Approval Workflow
  const handleUpdateApprovalStage = async (claimId: string, nextStage: ExpenseApprovalStage, statusText: string) => {
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/hrms/approvals/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          status: statusText,
          reviewerName: 'Admin / Finance Desk'
        })
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Error updating approval');
      }

      setClaims(prev => prev.map(c => c.id === claimId ? {
        ...c,
        stage: nextStage,
        managerNotes: actionNotesInput || c.managerNotes || 'Approved by Manager',
        financeNotes: nextStage === 'Finance Approved' || nextStage === 'Reimbursed' ? (actionNotesInput || 'Finance Approved') : c.financeNotes,
        reimbursementDate: nextStage === 'Reimbursed' ? new Date().toISOString().split('T')[0] : c.reimbursementDate
      } : c));

      setSelectedClaimForAction(null);
      setActionNotesInput('');
      setRefreshMessage(`Claim status updated to ${nextStage}!`);
      setTimeout(() => setRefreshMessage(null), 3000);
      fetchClaimsFromDB();
    } catch (e: any) {
      alert(e.message || 'Error updating approval');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // KPI Calculations
  const totalIncurred = claims.reduce((sum, c) => sum + c.amount, 0);
  const totalPending = claims.filter(c => c.stage === 'Submitted' || c.stage === 'Manager Approved').reduce((sum, c) => sum + c.amount, 0);
  const totalFinanceApproved = claims.filter(c => c.stage === 'Finance Approved').reduce((sum, c) => sum + c.amount, 0);
  const totalReimbursed = claims.filter(c => c.stage === 'Reimbursed').reduce((sum, c) => sum + c.amount, 0);

  const filteredClaims = claims.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = c.empName.toLowerCase().includes(q) || c.claimNumber.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || c.department === deptFilter;
    const matchesStage = stageFilter === 'All' || c.stage === stageFilter;
    const matchesCategory = categoryFilter === 'All' || c.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesDept && matchesStage && matchesCategory;
  });

  const getStageBadgeVariant = (st: ExpenseApprovalStage) => {
    switch(st) {
      case 'Reimbursed': return 'success';
      case 'Finance Approved': return 'success';
      case 'Manager Approved': return 'warning';
      case 'Submitted': return 'neutral';
      case 'Rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('travel') || cat.includes('cab') || cat.includes('flight')) return <Plane size={15} className="text-blue-600" />;
    if (cat.includes('food') || cat.includes('entertainment') || cat.includes('dinner')) return <Utensils size={15} className="text-amber-600" />;
    if (cat.includes('software') || cat.includes('license') || cat.includes('tools')) return <Laptop size={15} className="text-indigo-600" />;
    if (cat.includes('internet') || cat.includes('mobile') || cat.includes('wfh')) return <Wifi size={15} className="text-emerald-600" />;
    if (cat.includes('supplies') || cat.includes('office')) return <ShoppingBag size={15} className="text-purple-600" />;
    return <Receipt size={15} className="text-slate-600" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={24} />
            Enterprise Expense & Claims Approval Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative two-way PostgreSQL workflow: Employee Submission ➔ Receipt Verification ➔ Manager Approval ➔ Finance Approval ➔ Payroll Disbursal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchClaimsFromDB(); setRefreshMessage('Reloaded latest database claims!'); setTimeout(() => setRefreshMessage(null), 2500); }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh DB
          </button>
          <Button variant="primary" size="sm" onClick={() => setIsSubmitModalOpen(true)}>
            <Plus size={14} /> New Expense Claim
          </Button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {refreshMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-extrabold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{refreshMessage}</span>
          </div>
          <button onClick={() => setRefreshMessage(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Summary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Claims</p>
            <h4 className="text-xl font-black text-slate-900 mt-0.5">₹{totalIncurred.toLocaleString()}</h4>
            <p className="text-[11px] text-slate-500">{claims.length} Claims Total</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending L1/L2 Review</p>
            <h4 className="text-xl font-black text-amber-600 mt-0.5">₹{totalPending.toLocaleString()}</h4>
            <p className="text-[11px] text-amber-700 font-medium">{claims.filter(c => c.stage === 'Submitted' || c.stage === 'Manager Approved').length} Requires Action</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Finance Approved</p>
            <h4 className="text-xl font-black text-emerald-600 mt-0.5">₹{totalFinanceApproved.toLocaleString()}</h4>
            <p className="text-[11px] text-emerald-700 font-medium">Ready for Payout</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Banknote size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reimbursed</p>
            <h4 className="text-xl font-black text-purple-700 mt-0.5">₹{totalReimbursed.toLocaleString()}</h4>
            <p className="text-[11px] text-purple-700 font-medium">Disbursed via Payroll</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('claims')}
          className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            mainTab === 'claims' ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt size={14} /> Claims & Approval Desk ({claims.length})
        </button>
        <button
          onClick={() => setMainTab('categories')}
          className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            mainTab === 'categories' ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck size={14} /> Policy Limits & Caps
        </button>
        <button
          onClick={() => setMainTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            mainTab === 'dashboard' ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} /> Analytics & Audit Feed
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search employee, category, claim ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
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
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
              >
                <option value="All">All Approval Stages</option>
                <option value="Submitted">Stage 1: Submitted / Pending L1</option>
                <option value="Manager Approved">Stage 2: Manager Approved</option>
                <option value="Finance Approved">Stage 3: Finance Approved</option>
                <option value="Reimbursed">Stage 4: Reimbursed (Paid)</option>
                <option value="Rejected">Rejected Claims</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Travel">Travel & Conveyance</option>
                <option value="Software">Software & Cloud</option>
                <option value="Entertainment">Client Entertainment</option>
                <option value="Supplies">Office Supplies</option>
              </select>
            </div>
          </div>

          {/* Expense Claims Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5">Claim Number</th>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Applied Date</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Receipt Attachment</th>
                    <th className="p-3.5">Approval Stage</th>
                    <th className="p-3.5 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                        No expense claims found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono text-indigo-600 font-extrabold">{exp.claimNumber}</td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900">{exp.empName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{exp.empId} • {exp.department}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            {getCategoryIcon(exp.category)}
                            <span>{exp.category}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{exp.description}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">{exp.appliedDate}</td>
                        <td className="p-3.5 font-black text-slate-900 font-mono text-sm">
                          ₹{exp.amount.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(exp.receiptUrl, exp.receiptFileName)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors cursor-pointer group shadow-2xs"
                            title="Click to preview real PDF / receipt bill"
                          >
                            <Paperclip size={12} className="text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                            <span className="underline decoration-blue-300 underline-offset-2 max-w-[130px] truncate">{exp.receiptFileName || 'Bill_Receipt.pdf'}</span>
                            <Eye size={11} className="text-blue-500 opacity-80 shrink-0 ml-0.5" />
                          </button>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={getStageBadgeVariant(exp.stage)}>{exp.stage}</Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => { setSelectedClaimForAction(exp); setActionNotesInput(''); }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer transition-all flex items-center gap-1 ml-auto"
                          >
                            <span>Review & Action</span>
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CLAIM MODAL (ADMIN / MANAGER DIRECT ENTRY) */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Log Employee Expense Claim">
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Employee</label>
              <select
                value={newClaim.empId}
                onChange={e => {
                  const emp = employees.find(em => (em.empCode || em.id) === e.target.value);
                  setNewClaim({
                    ...newClaim,
                    empId: e.target.value,
                    empName: emp ? emp.name : 'Hps',
                    department: emp ? emp.department : 'Engineering'
                  });
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.empCode || emp.id}>
                    {emp.name} ({emp.empCode || emp.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Department</label>
              <input
                type="text"
                value={newClaim.department}
                disabled
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600"
              />
            </div>
          </div>

          <Select
            label="Expense Category"
            value={newClaim.category}
            onChange={(e) => setNewClaim({ ...newClaim, category: e.target.value })}
            options={[
              { label: 'Travel & Conveyance', value: 'Travel & Conveyance' },
              { label: 'Food & Client Entertainment', value: 'Food & Client Entertainment' },
              { label: 'Software & Cloud Subscriptions', value: 'Software & Cloud Subscriptions' },
              { label: 'Internet & Home Office', value: 'Internet & Home Office' },
              { label: 'Office Supplies & Stationery', value: 'Office Supplies & Stationery' },
              { label: 'Medical & Health', value: 'Medical & Health' }
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Claim Amount (₹)" type="number" value={newClaim.amount} onChange={(e) => setNewClaim({ ...newClaim, amount: Number(e.target.value) })} />
            <Input label="Vendor / Merchant" placeholder="e.g. Uber, AWS, Starbucks" value={newClaim.vendor} onChange={(e) => setNewClaim({ ...newClaim, vendor: e.target.value })} />
          </div>

          <Input label="Business Purpose / Justification" placeholder="Explain the expense reason..." value={newClaim.description} onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })} />

          <div>
            <label className="font-extrabold text-slate-700 block mb-1 text-xs">Proof of Expense / Bill Receipt</label>
            <input
              type="file"
              ref={adminFileInputRef}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
              className="hidden"
              onChange={handleAdminReceiptChange}
            />
            {adminReceiptName ? (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
                <span className="font-bold flex items-center gap-1.5 truncate">
                  <Paperclip size={14} className="text-blue-600 shrink-0" />
                  <span className="truncate">{adminReceiptName}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => adminFileInputRef.current?.click()}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold px-1.5 py-0.5"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdminReceiptName(null); setAdminReceiptUrl(''); }}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => adminFileInputRef.current?.click()}
                className="p-3.5 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-500 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <Upload size={16} className="text-blue-500" />
                  <span className="font-bold">Choose Receipt or Tax Invoice (PDF, JPG, PNG)</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminReceiptName('Sample_Tax_Invoice.pdf');
                    setAdminReceiptUrl('');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold"
                >
                  + Sample Bill
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmitClaim}>Submit to Expense Registry</Button>
          </div>
        </div>
      </Modal>

      {/* WORKFLOW REVIEW & MULTI-TIER ACTION MODAL */}
      {selectedClaimForAction && (
        <Modal isOpen={!!selectedClaimForAction} onClose={() => setSelectedClaimForAction(null)} title={`Expense Review: ${selectedClaimForAction.claimNumber}`}>
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{selectedClaimForAction.empName} ({selectedClaimForAction.empId})</h4>
                  <p className="text-[11px] text-slate-500">{selectedClaimForAction.department} • Applied: {selectedClaimForAction.appliedDate}</p>
                </div>
                <Badge variant={getStageBadgeVariant(selectedClaimForAction.stage)}>Stage: {selectedClaimForAction.stage}</Badge>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-600">Category: {selectedClaimForAction.category}</span>
                <span className="font-mono font-black text-base text-slate-900">₹{selectedClaimForAction.amount.toLocaleString()}</span>
              </div>

              <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                "{selectedClaimForAction.description}"
              </p>
            </div>

            {/* Attached Proof Box */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileText size={16} className="text-blue-600 shrink-0" />
                <span className="font-bold text-blue-900 truncate">{selectedClaimForAction.receiptFileName}</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenReceipt(selectedClaimForAction.receiptUrl, selectedClaimForAction.receiptFileName)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors shrink-0"
              >
                <Eye size={13} /> View Real PDF / Bill
              </button>
            </div>

            {/* Approver Notes Input */}
            <Input
              label="Manager / Finance Approver Comments"
              placeholder="Add sign-off notes or deduction remarks..."
              value={actionNotesInput}
              onChange={(e) => setActionNotesInput(e.target.value)}
            />

            {/* Action Buttons based on stage */}
            <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-slate-100">
              {(selectedClaimForAction.stage === 'Submitted' || selectedClaimForAction.stage === 'Rejected') && (
                <Button
                  variant="primary"
                  disabled={isProcessingAction}
                  onClick={() => handleUpdateApprovalStage(selectedClaimForAction.id, 'Manager Approved', 'MANAGER_APPROVED')}
                >
                  <Check size={14} /> {selectedClaimForAction.stage === 'Rejected' ? 'Re-Approve (Level 1: Manager)' : 'Level 1: Manager Approve'} &rarr;
                </Button>
              )}

              {(selectedClaimForAction.stage === 'Manager Approved' || selectedClaimForAction.stage === 'Rejected') && (
                <Button
                  variant="primary"
                  disabled={isProcessingAction}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleUpdateApprovalStage(selectedClaimForAction.id, 'Finance Approved', 'FINANCE_APPROVED')}
                >
                  <CheckCircle2 size={14} /> {selectedClaimForAction.stage === 'Rejected' ? 'Direct Finance Approve' : 'Level 2: Finance Final Approve'} &rarr;
                </Button>
              )}

              {selectedClaimForAction.stage === 'Finance Approved' && (
                <Button
                  variant="primary"
                  disabled={isProcessingAction}
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleUpdateApprovalStage(selectedClaimForAction.id, 'Reimbursed', 'REIMBURSED')}
                >
                  <Banknote size={14} /> Disburse Payment (Mark Paid)
                </Button>
              )}

              {selectedClaimForAction.stage !== 'Reimbursed' && selectedClaimForAction.stage !== 'Rejected' && (
                <Button
                  variant="danger"
                  disabled={isProcessingAction}
                  onClick={() => handleUpdateApprovalStage(selectedClaimForAction.id, 'Rejected', 'REJECTED')}
                >
                  <Ban size={14} /> Reject Claim
                </Button>
              )}

              <Button variant="outline" onClick={() => setSelectedClaimForAction(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REAL DOCUMENT PREVIEW MODAL */}
      {previewReceipt?.isOpen && (
        <DocumentPreviewModal
          isOpen={previewReceipt.isOpen}
          onClose={() => setPreviewReceipt(null)}
          fileName={previewReceipt.fileName}
          fileUrl={previewReceipt.fileUrl}
          taskTitle="Expense Receipt & Tax Invoice"
          projectName="HRMS Expenses"
        />
      )}
    </div>
  );
};
