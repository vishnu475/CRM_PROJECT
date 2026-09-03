import React, { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  CheckCircle2,
  Play,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Bot,
  Filter,
  RefreshCw,
  Eye,
  Check,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { PayrollRegisterRow, PayrollRunStatus } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { ConfirmedEmployeePayrollCard } from './ConfirmedEmployeePayrollCard';
import { AIPayrollAssistantModal } from './AIPayrollAssistantModal';
import { useApp } from '../../../context/AppContext';

export interface ExtendedRegisterRow extends PayrollRegisterRow {
  status?: string;
  annualSalary?: number;
  monthlySalary?: number;
  basicSalary?: number;
  hra?: number;
  specialAllowance?: number;
  workingDays?: number;
  presentDays?: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  bankName?: string;
  accountNumber?: string;
  bankAccountMasked?: string;
  ifscCode?: string;
  hasBankDetails?: boolean;
  paymentStatus?: string;
  paymentReference?: string;
  transactionId?: string;
  paymentDate?: string;
  canPay?: boolean;
  aiRiskScore?: string;
  anomalyFlags?: string[];
  aiExplanation?: string;
}

export const PayrollRegisterView: React.FC = () => {
  const { employees = [] } = useApp() || {};
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [currentStatus, setCurrentStatus] = useState<PayrollRunStatus>('Calculated');
  const [filterMode, setFilterMode] = useState<'confirmed' | 'all'>('confirmed');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ExtendedRegisterRow | null>(null);

  // One-Click Pay Salary Modal & State
  const [payModalEmployee, setPayModalEmployee] = useState<ExtendedRegisterRow | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState<string>('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [registerRows, setRegisterRows] = useState<ExtendedRegisterRow[]>([]);

  // Load Confirmed Employees Payroll data dynamically from backend API / Database
  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll/confirmed-summary?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped: ExtendedRegisterRow[] = json.data.map((item: any) => ({
            empId: item.empCode || item.id,
            empName: item.name,
            department: item.department || 'Engineering',
            status: item.payrollStatus || (item.hasSalaryConfig ? 'Payroll Ready' : 'Salary Setup Required'),
            annualSalary: Number(item.annualSalary || ((item.baseGross || item.grossPay || 0) * 12)),
            monthlySalary: Number(item.monthlySalary || item.baseGross || (item.grossPay || 0)),
            grossPay: Number(item.grossPay || 0),
            basicSalary: Number(item.basicSalary || Math.round((item.baseGross || item.grossPay || 0) * 0.6)),
            hra: Number(item.hra || Math.round((item.basicSalary || 0) * 0.4)),
            specialAllowance: Number(item.specialAllowance || 0),
            workingDays: Number(item.workingDays || 26),
            presentDays: Number(item.presentDays || (26 - (item.lopDays || 0))),
            paidLeaveDays: Number(item.paidLeaveDays || 0),
            unpaidLeaveDays: Number(item.unpaidLeaveDays || item.lopDays || 0),
            lopDays: Number(item.lopDays || 0),
            lopDeduction: Number(item.lopDeduction || 0),
            otPay: Number(item.otPay || 0),
            bonusIncentive: 0,
            reimbursements: Number(item.reimbursements || 0),
            loanDeduction: Number(item.loanEMI || 0),
            pfDeduction: Number(item.pf || 0),
            esiDeduction: Number(item.esi || 0),
            tdsDeduction: Number(item.tds || 0),
            ptaxDeduction: Number(item.ptax || 0),
            totalDeductions: Number(item.totalDeductions || (item.pf + item.esi + item.ptax + item.tds + item.lopDeduction + item.loanEMI)),
            netPayable: Number(item.netPay || (item.grossPay - item.totalDeductions)),
            bankName: item.bankName || 'HDFC Bank',
            accountNumber: item.accountNumber || '',
            bankAccountMasked: item.bankAccountMasked || 'XXXX XXXX 4521',
            ifscCode: item.ifscCode || 'HDFC0001234',
            hasBankDetails: Boolean(item.hasBankDetails),
            paymentStatus: item.paymentStatus || 'READY_FOR_PAYMENT',
            paymentReference: item.paymentReference || null,
            transactionId: item.transactionId || null,
            paymentDate: item.paymentDate || null,
            canPay: Boolean(item.canPay),
            aiRiskScore: item.aiRiskScore || 'Low Risk',
            anomalyFlags: item.anomalyFlags || [],
            aiExplanation: item.aiExplanation || ''
          }));
          setRegisterRows(mapped);
        }
      }
    } catch (err) {
      console.warn('⚠️ Syncing fallback employee list for payroll:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  // Filter rows based on Confirmed Employees selection
  const filteredRows = registerRows.filter((r) => {
    if (filterMode === 'confirmed') {
      return (
        r.status?.toLowerCase() === 'confirmed' ||
        r.status?.toLowerCase() === 'joined' ||
        r.status?.toLowerCase() === 'active' ||
        r.status?.toLowerCase() === 'paid' ||
        r.status?.toLowerCase() === 'payroll ready' ||
        r.status?.toLowerCase() === 'salary setup required'
      );
    }
    return true;
  });

  const totalGross = filteredRows.reduce((sum, r) => sum + r.grossPay, 0);
  const totalDeductions = filteredRows.reduce((sum, r) => sum + r.totalDeductions, 0);
  const totalNet = filteredRows.reduce((sum, r) => sum + r.netPayable, 0);
  const anomalyCount = filteredRows.filter((r) => r.anomalyFlags && r.anomalyFlags.length > 0).length;
  const paidCount = filteredRows.filter((r) => r.paymentStatus === 'PAID').length;
  const readyCount = filteredRows.filter((r) => r.paymentStatus === 'READY_FOR_PAYMENT').length;

  const getStatusBadgeVariant = (st: PayrollRunStatus) => {
    switch (st) {
      case 'Draft':
        return 'neutral';
      case 'Calculated':
        return 'warning';
      case 'Approved':
        return 'info';
      case 'Locked':
      case 'Paid':
      case 'Posted':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const runCode = `RUN-PR-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ONE-CLICK CONFIRM & PAY HANDLER
  const handleExecutePayment = async () => {
    if (!payModalEmployee) return;
    setIsPaying(true);
    setPaymentError(null);
    setPaymentStepText('Validating bank account & active IFSC code...');

    try {
      await new Promise(r => setTimeout(r, 400));
      setPaymentStepText('Executing bank disbursal transaction...');

      const res = await fetch(`/api/payroll/employees/${payModalEmployee.empId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          processedBy: 'Finance Lead'
        })
      });

      const json = await res.json();
      if (json.success) {
        setPaymentStepText('Generating immutable payslip & posting GL...');
        await new Promise(r => setTimeout(r, 300));
        setPaymentSuccessData(json.data);
        await fetchPayrollData();
      } else {
        setPaymentError(json.message || 'Payment processing failed.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment transaction failed.');
    } finally {
      setIsPaying(false);
    }
  };

  // ONE-CLICK BATCH PAY ALL ELIGIBLE EMPLOYEES
  const handlePayAllEligible = async () => {
    const confirmAll = window.confirm(`Process salary payment for all ${readyCount} eligible employees for ${monthNames[selectedMonth]} ${selectedYear}?`);
    if (!confirmAll) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/pay-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, processedBy: 'Finance Lead' })
      });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 Successfully processed ${data.data.processedCount} salary payments (Total: ₹${data.data.totalPaidAmount.toLocaleString()})!`);
        await fetchPayrollData();
      } else {
        alert(`Notice: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Batch Payment Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunPayrollEngine = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, processedBy: 'HR Admin' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Payroll Engine calculated for ${data.data.totalEmployees} employees! Total Net: ₹${Number(data.data.totalNet).toLocaleString()}`);
        setCurrentStatus('Calculated');
        await fetchPayrollData();
      } else {
        alert(`Calculation Notice: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Calculation Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePayroll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll/runs/${runCode}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'HR Director' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Payroll Run (${runCode}) APPROVED by HR Director!`);
        setCurrentStatus('Approved');
      } else {
        alert(`Notice: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Approval Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLockPayroll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll/runs/${runCode}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockedBy: 'Finance Controller' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Payroll Run (${runCode}) LOCKED & Frozen! Historical snapshots created in PostgreSQL.`);
        setCurrentStatus('Locked');
      } else {
        alert(`Notice: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostAccrualGL = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/accrual-gl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, postedBy: 'Accounts Manager' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Stage 1 Accrual GL Posted! Ref: ${data.data.journalNumber}. DR: 5000 Salary Expense (₹${Number(data.data.debitGrossAmount).toLocaleString()}), CR: 2000 Payroll Payable (₹${Number(data.data.creditPayableNet).toLocaleString()}).`);
        setCurrentStatus('Calculated');
      } else {
        alert(`Notice: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Accrual GL Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPaymentGL = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/payment-gl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear, paidBy: 'Finance Lead' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Stage 2 Bank Disbursal GL Processed! Ref: ${data.data.journalNumber}. DR: 2000 Payroll Payable (Balance reset to ₹0), CR: 1000 HDFC Bank (₹${Number(data.data.netDisbursalAmount).toLocaleString()}).`);
        setCurrentStatus('Posted');
      } else {
        alert(`Notice: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Disbursal Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBankAdvice = () => {
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Bank Name', 'Bank Account', 'IFSC Code', 'Net Pay Amount (INR)', 'Payment Status', 'Narration'];
    const rows = filteredRows.map(r => [
      r.empId,
      `"${r.empName}"`,
      `"${r.department}"`,
      `"${r.bankName || 'HDFC Bank'}"`,
      `"${r.accountNumber || '98765432101'}"`,
      `"${r.ifscCode || 'HDFC0001234'}"`,
      r.netPayable,
      `"${r.paymentStatus || 'READY_FOR_PAYMENT'}"`,
      `"Salary for ${monthNames[selectedMonth]} ${selectedYear}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bank_Advice_Disbursal_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Confirmed Employees AI Summary Cards */}
      <ConfirmedEmployeePayrollCard
        confirmedCount={filteredRows.length}
        totalGross={totalGross}
        totalDeductions={totalDeductions}
        totalNet={totalNet}
        anomalyCount={anomalyCount}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
      />

      {/* Workflow Controls Header & Employee Status Filter */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" />
              <span>Master Payroll Register:</span>
            </h3>

            {/* Month & Year Selectors */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none"
              >
                {monthNames.slice(1).map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none border-l border-slate-300 pl-1.5"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <Badge variant={getStatusBadgeVariant(currentStatus)}>Status: {currentStatus}</Badge>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Paid: {paidCount} / {filteredRows.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Annual Salary is Source of Truth (Annual ÷ 12 = Monthly). Real-time attendance, leaves, LOP, OT, loans, and one-click bank payment.
          </p>
        </div>

        {/* Filter Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Confirmed / All Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterMode('confirmed')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterMode === 'confirmed'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck size={14} /> Confirmed Only ({registerRows.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterMode === 'all'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter size={14} /> All Employees
            </button>
          </div>

          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={14} className="text-amber-300" /> AI Copilot
          </button>

          <Button variant="outline" size="sm" onClick={fetchPayrollData} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh DB
          </Button>

          {readyCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePayAllEligible}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CreditCard size={14} /> Pay All ({readyCount})
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExportBankAdvice} disabled={isLoading || filteredRows.length === 0}>
            <Download size={14} /> Bank Advice CSV
          </Button>
        </div>
      </div>

      {/* Pay Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">EMP ID</th>
                <th className="p-3">Employee Name</th>
                <th className="p-3">Annual CTC</th>
                <th className="p-3">Monthly Gross</th>
                <th className="p-3 text-rose-600 font-bold">LOP Loss</th>
                <th className="p-3 text-rose-600">PF (12%)</th>
                <th className="p-3 text-rose-600">ESI</th>
                <th className="p-3 text-rose-600">TDS / PT</th>
                <th className="p-3 font-bold text-rose-700">Total Deductions</th>
                <th className="p-3 text-right font-black text-emerald-600">Net Salary</th>
                <th className="p-3">Bank Account</th>
                <th className="p-3 text-center">Payment Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((r) => (
                <tr key={r.empId} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-600">{r.empId}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{r.empName}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{r.department}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">
                    ₹ {Number(r.annualSalary || (r.grossPay * 12)).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-700">
                    ₹ {Number(r.monthlySalary || r.grossPay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 font-bold text-rose-600">
                    {r.lopDeduction && r.lopDeduction > 0 ? `-₹ ${r.lopDeduction.toLocaleString()} (${r.lopDays}d)` : '₹ 0 (0d)'}
                  </td>
                  <td className="p-3 text-rose-600">-₹ {r.pfDeduction.toLocaleString()}</td>
                  <td className="p-3 text-rose-600">-₹ {r.esiDeduction.toLocaleString()}</td>
                  <td className="p-3 text-rose-600">-₹ {(r.tdsDeduction + r.ptaxDeduction).toLocaleString()}</td>
                  <td className="p-3 font-bold text-rose-700">-₹ {r.totalDeductions.toLocaleString()}</td>
                  <td className="p-3 text-right font-black text-emerald-600 text-xs font-mono">
                    ₹ {r.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3">
                    <div className="text-[10px] font-bold text-slate-800">{r.bankName || 'HDFC Bank'}</div>
                    <div className="text-[9px] font-mono text-slate-400">{r.bankAccountMasked}</div>
                  </td>
                  <td className="p-3 text-center">
                    {r.paymentStatus === 'PAID' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle size={11} className="text-emerald-700" /> PAID
                      </span>
                    ) : r.paymentStatus === 'BANK_DETAILS_REQUIRED' ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold">
                        Bank Details Missing
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[9px] font-bold">
                        Ready For Payment
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {r.paymentStatus === 'PAID' ? (
                        <button
                          onClick={() => setSelectedRow(r)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                        >
                          <Eye size={12} /> View Payslip
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setPayModalEmployee(r);
                            setPaymentSuccessData(null);
                            setPaymentError(null);
                          }}
                          disabled={!r.hasBankDetails}
                          className={`px-3 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs ${
                            r.hasBankDetails
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <CreditCard size={12} /> Pay Salary
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedRow(r)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="View Full Breakdown"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 text-xs border-t border-slate-200">
              <tr>
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider">
                  Total Disbursal Summary ({filteredRows.length} Employees):
                </td>
                <td className="p-3">₹ {totalGross.toLocaleString()}</td>
                <td colSpan={3} className="p-3"></td>
                <td className="p-3 text-rose-700">-₹ {totalDeductions.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-700 text-sm font-black font-mono">
                  ₹ {totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ONE-CLICK PAY SALARY CONFIRMATION MODAL */}
      {payModalEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {paymentSuccessData ? 'Salary Payment Confirmed' : 'Authorize Salary Payment'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Period: {monthNames[selectedMonth]} {selectedYear}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPayModalEmployee(null);
                  setPaymentSuccessData(null);
                  setPaymentError(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {paymentSuccessData ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1.5">
                  <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                  <h4 className="font-black text-emerald-900 text-sm">Payment Processed Successfully!</h4>
                  <p className="text-emerald-700 text-[11px]">
                    Net salary of <strong>₹{paymentSuccessData.netPay?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> has been credited to {paymentSuccessData.employeeName}'s bank account.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-600"><span>Employee:</span> <strong className="text-slate-900">{paymentSuccessData.employeeName} ({paymentSuccessData.employeeId})</strong></div>
                  <div className="flex justify-between text-slate-600"><span>Payment Ref:</span> <strong className="text-purple-700">{paymentSuccessData.paymentReference}</strong></div>
                  <div className="flex justify-between text-slate-600"><span>Transaction ID:</span> <strong className="text-blue-700">{paymentSuccessData.transactionId}</strong></div>
                  <div className="flex justify-between text-slate-600"><span>Bank Account:</span> <strong className="text-slate-900">{paymentSuccessData.bankName} ({paymentSuccessData.bankAccountMasked})</strong></div>
                  <div className="flex justify-between text-slate-600"><span>Status:</span> <strong className="text-emerald-600 font-black">PAID</strong></div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPayModalEmployee(null);
                      setPaymentSuccessData(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Employee Name:</span>
                    <strong className="text-slate-900 text-xs">{payModalEmployee.empName} ({payModalEmployee.empId})</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Annual Salary / CTC:</span>
                    <span className="font-mono font-bold text-slate-900">₹ {payModalEmployee.annualSalary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Monthly Gross (÷ 12):</span>
                    <span className="font-mono font-bold text-slate-800">₹ {payModalEmployee.monthlySalary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Total Deductions:</span>
                    <span className="font-mono font-bold text-rose-600">-₹ {payModalEmployee.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center bg-emerald-50/60 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                    <span className="font-extrabold text-emerald-950">NET SALARY TO PAY:</span>
                    <span className="font-black text-sm text-emerald-700 font-mono">₹ {payModalEmployee.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                  <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                    <Building size={11} /> Registered Bank Account
                  </p>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Bank:</span>
                    <strong className="text-slate-800">{payModalEmployee.bankName}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Account:</span>
                    <strong className="font-mono text-slate-800">{payModalEmployee.bankAccountMasked}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">IFSC:</span>
                    <strong className="font-mono text-slate-800">{payModalEmployee.ifscCode}</strong>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {isPaying && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center space-y-1 animate-pulse">
                    <Loader2 size={20} className="animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs font-bold text-indigo-900">{paymentStepText}</p>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPaying}
                    onClick={() => setPayModalEmployee(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isPaying}
                    onClick={handleExecutePayment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                  >
                    {isPaying ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                    <span>Confirm & Pay Salary</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual Employee Payslip Inspection Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Payslip Breakdown: {selectedRow.empName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedRow.empId} | Dept: {selectedRow.department}</p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-1">
                <p className="font-bold text-blue-900 uppercase text-[10px] tracking-wider">Salary & Earnings Breakdown</p>
                <div className="flex justify-between"><span>Annual Salary (Source of Truth):</span> <strong className="font-mono">₹ {selectedRow.annualSalary?.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span>Basic Salary (60%):</span> <span className="font-bold">₹ {selectedRow.basicSalary?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>HRA (House Rent Allowance):</span> <span className="font-bold">₹ {selectedRow.hra?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Special Allowance:</span> <span className="font-bold">₹ {selectedRow.specialAllowance?.toLocaleString()}</span></div>
                {selectedRow.reimbursements > 0 && (
                  <div className="flex justify-between text-emerald-700"><span>Approved Reimbursements:</span> <span className="font-bold">₹ {selectedRow.reimbursements.toLocaleString()}</span></div>
                )}
                {selectedRow.otPay > 0 && (
                  <div className="flex justify-between text-emerald-700"><span>Overtime Pay:</span> <span className="font-bold">₹ {selectedRow.otPay.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between pt-1 border-t border-blue-200 font-extrabold text-slate-900">
                  <span>Gross Monthly Salary:</span> <span>₹ {selectedRow.grossPay.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-1">
                <p className="font-bold text-rose-900 uppercase text-[10px] tracking-wider">Deductions Breakdown</p>
                {selectedRow.lopDeduction > 0 && (
                  <div className="flex justify-between text-rose-600"><span>Loss of Pay (LOP {selectedRow.lopDays}d):</span> <span className="font-bold">-₹ {selectedRow.lopDeduction.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between"><span>Provident Fund (PF 12%):</span> <span className="text-rose-600 font-bold">-₹ {selectedRow.pfDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>ESI Health Insurance:</span> <span className="text-rose-600 font-bold">-₹ {selectedRow.esiDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>TDS Income Tax:</span> <span className="text-rose-600 font-bold">-₹ {selectedRow.tdsDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Professional Tax (P-Tax):</span> <span className="text-rose-600 font-bold">-₹ {selectedRow.ptaxDeduction.toLocaleString()}</span></div>
                {selectedRow.loanDeduction > 0 && (
                  <div className="flex justify-between text-rose-600"><span>Active Loan EMI Deduction:</span> <span className="font-bold">-₹ {selectedRow.loanDeduction.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between pt-1 border-t border-rose-200 font-extrabold text-rose-700">
                  <span>Total Deductions:</span> <span>-₹ {selectedRow.totalDeductions.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex justify-between items-center text-emerald-900">
                <div>
                  <span className="font-extrabold text-sm">Net Payable Disbursal:</span>
                  <div className="text-[10px] text-emerald-700 font-mono">Bank: {selectedRow.bankName} ({selectedRow.bankAccountMasked})</div>
                </div>
                <span className="font-black text-lg text-emerald-700 font-mono">₹ {selectedRow.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => window.open(`/api/payroll/payslip/PS-${selectedRow.empId}-${selectedMonth}-${selectedYear}/pdf`, '_blank')}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={14} /> Download PDF Payslip
              </button>
              <Button variant="outline" size="sm" onClick={() => setSelectedRow(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      <AIPayrollAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        confirmedCount={filteredRows.length}
        totalNetBudget={totalNet}
      />
    </div>
  );
};
