import React, { useState, useEffect } from 'react';
import { UserX, Calculator, CheckCircle2, ShieldAlert, FileText, RefreshCw, DollarSign, Award, CreditCard } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { useApp } from '../../../context/AppContext';

export const FullAndFinalSettlementView: React.FC = () => {
  const { employees = [] } = useApp() || {};
  const [exitedEmployees, setExitedEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    noticePeriodDays: 30,
    servedNoticeDays: 30,
    pendingSalary: 45000,
    leaveEncashment: 12000,
    gratuityAmount: 35000,
    reimbursementAmount: 4500,
    loanRecovery: 0,
    otherDeductions: 1000,
    remarks: 'Full & final settlement calculated as per company exit policy.'
  });

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/full-and-final');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSettlements(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load settlement history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleCalculateSettlement = async () => {
    if (!selectedEmp) {
      alert('Please select an employee for Full & Final Settlement');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/full-and-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp,
          ...form
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Full & Final Settlement calculated successfully! Net Settlement: ₹${Number(data.data.net_settlement_amount).toLocaleString()}`);
        fetchSettlements();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Settlement error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const grossSettlement = Number(form.pendingSalary) + Number(form.leaveEncashment) + Number(form.gratuityAmount) + Number(form.reimbursementAmount);
  const totalDeductions = Number(form.loanRecovery) + Number(form.otherDeductions);
  const netSettlement = Math.max(0, grossSettlement - totalDeductions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserX className="text-rose-600" size={18} />
            <span>Full & Final (F&F) Settlement Processing Engine</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Calculate exit pay, leave encashment, gratuity, pending salary, and recover outstanding loan EMIs for exiting staff.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettlements} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculation Panel */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Calculator size={16} className="text-blue-600" /> New Settlement Entry
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Exiting / Resigned Employee</label>
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.empCode || emp.id}>
                    {emp.name} ({emp.empCode || emp.id}) - {emp.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Exit Date</label>
                <input
                  type="date"
                  value={form.exitDate}
                  onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Notice Period (Days)</label>
                <input
                  type="number"
                  value={form.noticePeriodDays}
                  onChange={(e) => setForm({ ...form, noticePeriodDays: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-2">
              <span className="font-bold text-emerald-800 text-[11px] block">Settlement Additions (Earnings)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Pending Days Salary</label>
                  <input
                    type="number"
                    value={form.pendingSalary}
                    onChange={(e) => setForm({ ...form, pendingSalary: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Leave Encashment</label>
                  <input
                    type="number"
                    value={form.leaveEncashment}
                    onChange={(e) => setForm({ ...form, leaveEncashment: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Gratuity Amount</label>
                  <input
                    type="number"
                    value={form.gratuityAmount}
                    onChange={(e) => setForm({ ...form, gratuityAmount: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Approved Reimb.</label>
                  <input
                    type="number"
                    value={form.reimbursementAmount}
                    onChange={(e) => setForm({ ...form, reimbursementAmount: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-2">
              <span className="font-bold text-rose-800 text-[11px] block">Settlement Deductions</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Outstanding Loan Recovery</label>
                  <input
                    type="number"
                    value={form.loanRecovery}
                    onChange={(e) => setForm({ ...form, loanRecovery: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Notice Pay / Other Deductions</label>
                  <input
                    type="number"
                    value={form.otherDeductions}
                    onChange={(e) => setForm({ ...form, otherDeductions: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold text-rose-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex justify-between text-slate-600 text-[11px]"><span>Gross Settlement:</span> <span className="font-bold">₹ {grossSettlement.toLocaleString()}</span></div>
              <div className="flex justify-between text-rose-600 text-[11px]"><span>Total Deductions:</span> <span className="font-bold">-₹ {totalDeductions.toLocaleString()}</span></div>
              <div className="flex justify-between text-emerald-900 font-extrabold text-xs pt-1 border-t border-emerald-200">
                <span>Net Settlement Payable:</span>
                <span className="font-black text-sm text-emerald-700">₹ {netSettlement.toLocaleString()}</span>
              </div>
            </div>

            <Button variant="primary" size="md" className="w-full justify-center" onClick={handleCalculateSettlement} disabled={isLoading}>
              <CheckCircle2 size={16} /> Save & Process F&F Settlement
            </Button>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <FileText size={16} className="text-emerald-600" /> Settled Employee Register
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">EMP ID</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Exit Date</th>
                  <th className="p-3 text-emerald-600">Gross Settlement</th>
                  <th className="p-3 text-rose-600">Deductions</th>
                  <th className="p-3 text-right font-bold text-emerald-700">Net Payable</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                      No Full & Final settlements recorded yet. Use the calculation panel to process employee exit.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{s.employee_id}</td>
                      <td className="p-3 font-bold text-slate-900">{s.employee_name}</td>
                      <td className="p-3 font-mono">{s.exit_date ? s.exit_date.split('T')[0] : 'N/A'}</td>
                      <td className="p-3 font-bold text-emerald-600">₹ {Number(s.gross_settlement || 0).toLocaleString()}</td>
                      <td className="p-3 font-bold text-rose-600">-₹ {Number(s.total_deductions || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-emerald-700 text-xs">
                        ₹ {Number(s.net_settlement_amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="success">{s.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
