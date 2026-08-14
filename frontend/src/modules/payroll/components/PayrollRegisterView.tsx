import React, { useState } from 'react';
import { FileText, Lock, CheckCircle2, Play, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { PayrollRegisterRow, PayrollRunStatus } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const PayrollRegisterView: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState<PayrollRunStatus>('Calculated');

  const [registerRows, setRegisterRows] = useState<PayrollRegisterRow[]>([
    { empId: 'EMP-001', empName: 'Emma Watson', department: 'HR', grossPay: 120000, lopDays: 0, lopDeduction: 0, otPay: 1800, bonusIncentive: 5000, reimbursements: 2500, loanDeduction: 0, pfDeduction: 7200, esiDeduction: 900, tdsDeduction: 6000, ptaxDeduction: 200, totalDeductions: 14300, netPayable: 115000 },
    { empId: 'EMP-002', empName: 'Robert Vance', department: 'Sales', grossPay: 140000, lopDays: 1, lopDeduction: 4666, otPay: 0, bonusIncentive: 15000, reimbursements: 4200, loanDeduction: 5000, pfDeduction: 8400, esiDeduction: 1050, tdsDeduction: 8500, ptaxDeduction: 200, totalDeductions: 27816, netPayable: 126718 },
    { empId: 'EMP-003', empName: 'James Smith', department: 'Engineering', grossPay: 180000, lopDays: 0, lopDeduction: 0, otPay: 4500, bonusIncentive: 10000, reimbursements: 0, loanDeduction: 0, pfDeduction: 8640, esiDeduction: 1350, tdsDeduction: 14000, ptaxDeduction: 200, totalDeductions: 24190, netPayable: 170310 },
    { empId: 'EMP-004', empName: 'Michael Brown', department: 'Finance', grossPay: 190000, lopDays: 0, lopDeduction: 0, otPay: 0, bonusIncentive: 0, reimbursements: 1200, loanDeduction: 10000, pfDeduction: 11400, esiDeduction: 1425, tdsDeduction: 16000, ptaxDeduction: 200, totalDeductions: 39025, netPayable: 152175 }
  ]);

  const totalGross = registerRows.reduce((sum, r) => sum + r.grossPay, 0);
  const totalDeductions = registerRows.reduce((sum, r) => sum + r.totalDeductions, 0);
  const totalNet = registerRows.reduce((sum, r) => sum + r.netPayable, 0);

  const getStatusBadgeVariant = (st: PayrollRunStatus) => {
    switch(st) {
      case 'Draft': return 'neutral';
      case 'Calculated': return 'warning';
      case 'Approved': return 'info';
      case 'Locked': return 'success';
      default: return 'neutral';
    }
  };

  const handleRunPayrollEngine = async () => {
    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: 'AUGUST', year: 2026 })
      });
      const data = await res.json();
      if (data.success && data.payrollRun && data.payrollRun.payslips) {
        const mapped = data.payrollRun.payslips.map((p: any) => ({
          empId: p.employeeId,
          empName: p.employeeId,
          department: 'Engineering',
          grossPay: parseFloat(p.grossPay || 85000),
          lopDays: p.lopDays || 0,
          lopDeduction: parseFloat(p.lopDeduction || 0),
          otPay: parseFloat(p.overtimeBonus || 0),
          bonusIncentive: 0,
          reimbursements: 0,
          loanDeduction: 0,
          pfDeduction: parseFloat(p.pfDeduction || 0),
          esiDeduction: parseFloat(p.esiDeduction || 0),
          tdsDeduction: parseFloat(p.tdsDeduction || 0),
          ptaxDeduction: 200,
          totalDeductions: parseFloat(p.totalDeductions || 0),
          netPayable: parseFloat(p.netPay || 0)
        }));
        setRegisterRows(mapped);
      }
    } catch (err) {
      console.warn('Backend API note:', err);
    }
    setCurrentStatus('Calculated');
  };

  return (
    <div className="space-y-4">
      {/* Workflow Controls Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Master Payroll Register Sheet (August 2026)</h3>
            <Badge variant={getStatusBadgeVariant(currentStatus)}>Status: {currentStatus}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">Detailed employee pay register. Backend statutory engine delegation ready.</p>
        </div>

        <div className="flex items-center gap-2">
          {currentStatus === 'Draft' && (
            <Button variant="primary" size="sm" onClick={handleRunPayrollEngine}>
              <Play size={14} /> Run Calculation Engine
            </Button>
          )}
          {currentStatus === 'Calculated' && (
            <Button variant="primary" size="sm" onClick={() => setCurrentStatus('Approved')}>
              <CheckCircle2 size={14} /> Approve Payroll
            </Button>
          )}
          {currentStatus === 'Approved' && (
            <Button variant="danger" size="sm" onClick={() => setCurrentStatus('Locked')}>
              <Lock size={14} /> Lock & Disburse Payroll
            </Button>
          )}
          <Button variant="outline" size="sm">
            <FileSpreadsheet size={14} /> Export Register CSV
          </Button>
        </div>
      </div>

      {/* Pay Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold">
              <tr>
                <th className="p-3">EMP ID</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Dept</th>
                <th className="p-3">Gross Pay</th>
                <th className="p-3 text-rose-600">LOP Loss</th>
                <th className="p-3 text-purple-600">OT Pay</th>
                <th className="p-3 text-emerald-600">Bonus</th>
                <th className="p-3 text-blue-600">Reimburse</th>
                <th className="p-3 text-amber-600">Loan EMI</th>
                <th className="p-3 text-rose-600">PF 12%</th>
                <th className="p-3 text-rose-600">ESI</th>
                <th className="p-3 text-rose-600">TDS Tax</th>
                <th className="p-3 font-bold text-rose-700">Total Deduct</th>
                <th className="p-3 text-right font-black text-emerald-600">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registerRows.map((r) => (
                <tr key={r.empId} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-purple-600">{r.empId}</td>
                  <td className="p-3 font-bold text-slate-900">{r.empName}</td>
                  <td className="p-3 font-semibold">{r.department}</td>
                  <td className="p-3 font-bold text-slate-800">₹ {r.grossPay.toLocaleString()}</td>
                  <td className="p-3 text-rose-600">₹ {r.lopDeduction.toLocaleString()}</td>
                  <td className="p-3 font-bold text-purple-600">+₹ {r.otPay.toLocaleString()}</td>
                  <td className="p-3 font-bold text-emerald-600">+₹ {r.bonusIncentive.toLocaleString()}</td>
                  <td className="p-3 font-bold text-blue-600">+₹ {r.reimbursements.toLocaleString()}</td>
                  <td className="p-3 text-amber-600">-₹ {r.loanDeduction.toLocaleString()}</td>
                  <td className="p-3 text-rose-600">-₹ {r.pfDeduction.toLocaleString()}</td>
                  <td className="p-3 text-rose-600">-₹ {r.esiDeduction.toLocaleString()}</td>
                  <td className="p-3 text-rose-600">-₹ {r.tdsDeduction.toLocaleString()}</td>
                  <td className="p-3 font-bold text-rose-700">-₹ {r.totalDeductions.toLocaleString()}</td>
                  <td className="p-3 text-right font-black text-emerald-600 text-xs">₹ {r.netPayable.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={3} className="p-3 text-right uppercase tracking-wider">Total Disbursal Summary:</td>
                <td className="p-3">₹ {totalGross.toLocaleString()}</td>
                <td colSpan={8} className="p-3"></td>
                <td className="p-3 text-rose-700">-₹ {totalDeductions.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-700 text-sm">₹ {totalNet.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
