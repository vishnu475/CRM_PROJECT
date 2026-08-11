import React, { useState } from 'react';
import { Banknote, FileText, CheckCircle2, Play, Download, Eye, Layers, CreditCard, BarChart3, Lock } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

import { SalaryStructureManager } from '../components/SalaryStructureManager';
import { PayrollRegisterView } from '../components/PayrollRegisterView';
import { LoanBonusManagerView } from '../components/LoanBonusManagerView';
import { DeptPayrollReportView } from '../components/DeptPayrollReportView';
import { ExtendedPayrollRun, PayrollRunStatus } from '../types';

export const PayrollPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<'register' | 'structures' | 'loans' | 'reports'>('register');

  const payrollRuns: ExtendedPayrollRun[] = [
    { id: 'pr-2026-08', month: 'August 2026', totalEmployees: 48, grossAmount: 630000, totalDeductions: 104531, netPay: 525469, status: 'Calculated', runDate: '2026-08-11' },
    { id: 'pr-2026-07', month: 'July 2026', totalEmployees: 46, grossAmount: 590000, totalDeductions: 98000, netPay: 492000, status: 'Locked', runDate: '2026-07-31', approvedBy: 'John Doe (CEO)' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Banknote className="text-emerald-600" size={24} />
            Payroll Processing Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly payroll calculation, PF/ESI/TDS statutory deductions, salary structures, payslips, and bank transfer advice.
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('register')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'register' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} /> Payroll Master Register & Workflow
        </button>
        <button
          onClick={() => setMainTab('structures')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'structures' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers size={14} /> Salary Structures & Rules
        </button>
        <button
          onClick={() => setMainTab('loans')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'loans' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard size={14} /> Loans, Advances & Bonuses
        </button>
        <button
          onClick={() => setMainTab('reports')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'reports' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 size={14} /> Department Cost Reports
        </button>
      </div>

      {/* TAB: PAYROLL REGISTER & WORKFLOW */}
      {mainTab === 'register' && <PayrollRegisterView />}

      {/* TAB: SALARY STRUCTURES */}
      {mainTab === 'structures' && <SalaryStructureManager />}

      {/* TAB: LOANS & BONUSES */}
      {mainTab === 'loans' && <LoanBonusManagerView />}

      {/* TAB: DEPT REPORTS */}
      {mainTab === 'reports' && <DeptPayrollReportView />}
    </div>
  );
};
