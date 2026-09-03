import React, { useState } from 'react';
import { Banknote, FileText, CheckCircle2, Play, Download, Eye, Layers, CreditCard, BarChart3, Lock } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

import { SalaryStructureManager } from '../components/SalaryStructureManager';
import { PayrollRegisterView } from '../components/PayrollRegisterView';
import { LoanBonusManagerView } from '../components/LoanBonusManagerView';
import { DeptPayrollReportView } from '../components/DeptPayrollReportView';
import { FullAndFinalSettlementView } from '../components/FullAndFinalSettlementView';
import { ExtendedPayrollRun, PayrollRunStatus } from '../types';
import { UserX } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { activeSubSection, setActiveSubSection } = useApp();
  const validPayrollTabs = ['register', 'structures', 'loans', 'reports', 'fnf'];
  const mainTab = (validPayrollTabs.includes(activeSubSection) ? activeSubSection : 'register') as 'register' | 'structures' | 'loans' | 'reports' | 'fnf';
  const setMainTab = (tab: 'register' | 'structures' | 'loans' | 'reports' | 'fnf') => setActiveSubSection(tab);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Banknote className="text-emerald-600" size={24} />
            <span>Enterprise Central Payroll Engine</span>
            <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold px-2.5 py-1 rounded-full shadow-xs">
              🏛️ PostgreSQL Authorized Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly payroll run, attendance LOP & OT loss, statutory PF/ESI/TDS tax deductions, bank advice disbursal, and GL accounting posting.
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
        <button
          onClick={() => setMainTab('fnf')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'fnf' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserX size={14} /> Full & Final Settlement
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

      {/* TAB: FULL & FINAL SETTLEMENT */}
      {mainTab === 'fnf' && <FullAndFinalSettlementView />}
    </div>
  );
};
