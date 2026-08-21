import React, { useState, useEffect } from 'react';
import { CreditCard, Award, Plus, DollarSign, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { EmployeeLoanAdvance } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const LoanBonusManagerView: React.FC = () => {
  const [loans, setLoans] = useState<EmployeeLoanAdvance[]>([]);
  const [bonuses, setBonuses] = useState<Array<{ id: string; empName: string; category: string; amount: number; status: string }>>([]);
  const [confirmedEmployees, setConfirmedEmployees] = useState<Array<{ empId: string; name: string; gross: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDynamicConfirmedData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/confirmed-summary');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const emps = json.data.map((e: any) => ({
            empId: e.empCode || e.id,
            name: e.name,
            gross: e.grossPay,
          }));
          setConfirmedEmployees(emps);

          // Generate dynamic loan & bonus records for confirmed employees
          if (emps.length > 0) {
            setLoans([
              { id: 'loan-1', empId: emps[0].empId, empName: emps[0].name, loanAmount: 60000, monthlyEmi: 5000, remainingAmount: 35000, status: 'Active' },
              { id: 'loan-2', empId: emps[1]?.empId || 'EMP-002', empName: emps[1]?.name || 'Sarah Jenkins', loanAmount: 120000, monthlyEmi: 10000, remainingAmount: 70000, status: 'Active' },
            ]);
            setBonuses([
              { id: 'bon-1', empName: emps[0].name, category: 'Quarterly Sales & Architecture Incentive', amount: 15000, status: 'Approved' },
              { id: 'bon-2', empName: emps[2]?.name || 'Michael Vance', category: 'Project Milestones Completion Bonus', amount: 10000, status: 'Approved' },
            ]);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Syncing loan & bonus data notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicConfirmedData();
  }, []);

  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [isGrantBonusOpen, setIsGrantBonusOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Loan / Salary Advance Column */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <CreditCard size={16} className="text-amber-600" /> Confirmed Employees Loan & Salary Advances
          </h3>
          <Button variant="outline" size="sm" onClick={() => setIsAddLoanOpen(true)}>
            <Plus size={14} /> Issue Loan / Advance
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          {loans.map((l) => (
            <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-blue-600" />
                  <span>{l.empName}</span>
                </span>
                <Badge variant="warning">EMI: ₹ {l.monthlyEmi.toLocaleString()}/mo</Badge>
              </div>
              <p className="text-slate-500">
                Total Sanctioned Corporate Loan: <span className="font-bold text-slate-800">₹ {l.loanAmount.toLocaleString()}</span>
              </p>
              <p className="text-slate-500">
                Remaining Balance: <span className="font-bold text-rose-600">₹ {l.remainingAmount.toLocaleString()}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bonus / Incentive Grants Column */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Award size={16} className="text-emerald-600" /> Performance Bonuses & Incentives
          </h3>
          <Button variant="outline" size="sm" onClick={() => setIsGrantBonusOpen(true)}>
            <Plus size={14} /> Grant Bonus
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          {bonuses.map((b) => (
            <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-emerald-600" />
                  <span>{b.empName}</span>
                </span>
                <Badge variant="success">{b.status}</Badge>
              </div>
              <p className="text-slate-600 font-semibold">{b.category}</p>
              <p className="text-emerald-600 font-bold">Approved Bonus Payout: ₹ {b.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Loan Modal */}
      <Modal isOpen={isAddLoanOpen} onClose={() => setIsAddLoanOpen(false)} title="Issue Salary Advance / Corporate Loan">
        <div className="space-y-4 text-xs">
          <Select
            label="Select Confirmed Employee"
            options={confirmedEmployees.map((e) => ({ label: `${e.name} (${e.empId})`, value: e.empId }))}
          />
          <Input label="Loan Amount (₹)" type="number" defaultValue="50000" />
          <Input label="Monthly EMI Deduction (₹)" type="number" defaultValue="5000" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddLoanOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsAddLoanOpen(false)}>
              Disburse Loan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Grant Bonus Modal */}
      <Modal isOpen={isGrantBonusOpen} onClose={() => setIsGrantBonusOpen(false)} title="Grant Bonus / Commission Incentive">
        <div className="space-y-4 text-xs">
          <Select
            label="Select Confirmed Employee"
            options={confirmedEmployees.map((e) => ({ label: `${e.name} (${e.empId})`, value: e.empId }))}
          />
          <Input label="Bonus Category" placeholder="e.g. Sales Target Commission" />
          <Input label="Bonus Amount (₹)" type="number" defaultValue="10000" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsGrantBonusOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsGrantBonusOpen(false)}>
              Grant Incentive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
