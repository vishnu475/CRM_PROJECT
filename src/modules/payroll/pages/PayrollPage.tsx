import React, { useState } from 'react';
import { Banknote, FileText, CheckCircle2, Play, Download, Eye } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Select } from '../../../components/common/Select';
import { PayrollRun } from '../../../types';

export const PayrollPage: React.FC = () => {
  const { payrollRuns } = useApp();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

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
        <Button variant="primary" size="sm" onClick={() => setIsRunModalOpen(true)}>
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
              <Button variant="outline" size="sm" onClick={() => setSelectedRun(pr)}>
                <Eye size={14} /> Detailed Payslips
              </Button>
              <Button variant="outline" size="sm">
                <Download size={14} /> Bank Advice
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Run Payroll Modal */}
      <Modal isOpen={isRunModalOpen} onClose={() => setIsRunModalOpen(false)} title="Calculate & Run Monthly Payroll">
        <div className="space-y-4 text-xs">
          <Select
            label="Payroll Month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            options={[
              { label: 'September 2026', value: 'September 2026' },
              { label: 'October 2026', value: 'October 2026' },
              { label: 'November 2026', value: 'November 2026' }
            ]}
          />
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg space-y-1 border border-emerald-100">
            <p className="font-bold">Auto-calculated Inputs for {selectedMonth}:</p>
            <p>• Employees count: 48</p>
            <p>• Total LOP Days deducted: 3 days</p>
            <p>• Est. Gross Salary: ₹ 6,30,000</p>
            <p>• Statutory PF/ESI/TDS: ₹ 54,000</p>
            <p className="font-bold">Est. Net Disbursal: ₹ 5,76,000</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsRunModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsRunModalOpen(false)}>Process & Approve Payroll</Button>
          </div>
        </div>
      </Modal>

      {/* Detailed Payslips Breakdown Modal */}
      {selectedRun && (
        <Modal isOpen={!!selectedRun} onClose={() => setSelectedRun(null)} title={`Payslip Breakdown: ${selectedRun.month}`}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
              <h4 className="font-bold text-slate-900 border-b pb-1">Sample Payslip (John Doe - Senior Dev)</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <p>Basic Salary: <span className="font-bold text-slate-900">₹ 90,000</span></p>
                <p>HRA Allowance: <span className="font-bold text-slate-900">₹ 45,000</span></p>
                <p>Special Allowance: <span className="font-bold text-slate-900">₹ 45,000</span></p>
                <p className="text-rose-600">PF Deduction (12%): <span className="font-bold">-₹ 10,800</span></p>
                <p className="text-rose-600">TDS Deduction: <span className="font-bold">-₹ 12,000</span></p>
                <p className="font-bold text-emerald-600 text-sm col-span-2 border-t pt-1">Net Pay: ₹ 1,57,200</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedRun(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
