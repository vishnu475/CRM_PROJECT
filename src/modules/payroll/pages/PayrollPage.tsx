import React from 'react';
import { Banknote, FileText, CheckCircle2, Play, Download } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const PayrollPage: React.FC = () => {
  const { payrollRuns } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Banknote className="text-emerald-600" size={24} />
            Payroll Processing Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly payroll calculation, PF/ESI/TDS deductions, payslip generation, and bank transfer advice.
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Play size={14} /> Run New Payroll
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {payrollRuns.map((pr) => (
          <div key={pr.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{pr.month}</h3>
                <p className="text-xs text-slate-500">Run ID: {pr.id}</p>
              </div>
              <Badge variant={pr.status === 'Paid' || pr.status === 'Approved' ? 'success' : 'warning'}>{pr.status}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employees</span>
                <span className="font-bold text-slate-900 text-sm">{pr.totalEmployees}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Pay</span>
                <span className="font-bold text-slate-900 text-sm">₹ {pr.grossAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Disbursal</span>
                <span className="font-bold text-emerald-600 text-sm">₹ {pr.netPay.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm">
                <FileText size={14} /> Payslips
              </Button>
              <Button variant="outline" size="sm">
                <Download size={14} /> Bank Advice
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
