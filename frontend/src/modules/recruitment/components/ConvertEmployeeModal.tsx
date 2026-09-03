import React, { useState } from 'react';
import { UserCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Candidate } from '../types';
import { useApp } from '../../../context/AppContext';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { saveEmployeeToDB } from '../../../services/employeePersistence';

interface ConvertEmployeeModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidateId: string, employeeId: string) => void;
}

export const ConvertEmployeeModal: React.FC<ConvertEmployeeModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addEmployee, employees } = useApp() as any;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextEmpNum = (employees?.length || 0) + 1;
  const defaultEmpCode = `EMP-${String(nextEmpNum).padStart(3, '0')}`;

  const getCandidateAnnualSalary = (c: any) => {
    if (!c) return 400000;
    const raw = c.expectedSalary ?? c.expected_salary ?? c.offeredSalary ?? c.offered_salary ?? c.salary ?? c.currentSalary ?? c.current_salary;
    if (raw !== undefined && raw !== null && Number(raw) > 0) {
      const val = Number(raw);
      return val < 100000 ? Math.round(val * 12) : val;
    }
    return 400000;
  };

  const [form, setForm] = useState({
    empCode: defaultEmpCode,
    department: candidate?.department || 'Engineering',
    designation: candidate?.appliedPosition || 'Senior Software Engineer',
    annualSalary: getCandidateAnnualSalary(candidate),
    reportingManager: 'Sarah Jenkins',
    branch: 'Bengaluru HQ',
    pin: '1234'
  });

  // Re-sync form state whenever candidate or modal opens
  React.useEffect(() => {
    if (candidate && isOpen) {
      const nextNum = (employees?.length || 0) + 1;
      setForm({
        empCode: `EMP-${String(nextNum).padStart(3, '0')}`,
        department: candidate.department || 'Engineering',
        designation: candidate.appliedPosition || 'Senior Software Engineer',
        annualSalary: getCandidateAnnualSalary(candidate),
        reportingManager: 'Sarah Jenkins',
        branch: 'Bengaluru HQ',
        pin: '1234'
      });
      setError(null);
    }
  }, [candidate, isOpen, employees?.length]);

  if (!candidate) return null;

  const calculatedMonthly = Math.round((Number(form.annualSalary) / 12) * 100) / 100;
  const calculatedBasic = Math.round((calculatedMonthly * 0.6) * 100) / 100;
  const calculatedAllowances = Math.round((calculatedMonthly * 0.4) * 100) / 100;

  const handleConvert = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // STEP 1: Save permanently to PostgreSQL database via central service
      const result = await saveEmployeeToDB({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        department: form.department,
        designation: form.designation,
        joiningDate: new Date().toISOString().split('T')[0],
        annualSalary: Number(form.annualSalary),
        annualCtc: Number(form.annualSalary),
        salary: calculatedMonthly,
        basicSalary: calculatedBasic,
        allowances: calculatedAllowances,
        status: 'Joined',
        reportingManagerName: form.reportingManager,
        pin: form.pin,
      });

      const assignedEmpCode = result.empCode || form.empCode;

      // STEP 2: Add to React AppContext so HRMS updates immediately without refresh
      if (addEmployee) {
        addEmployee({
          id: assignedEmpCode,
          empCode: assignedEmpCode,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone || '',
          department: form.department,
          designation: form.designation,
          joiningDate: new Date().toISOString().split('T')[0],
          status: 'Joined',
          annualSalary: Number(form.annualSalary),
          annualCtc: Number(form.annualSalary),
          salary: calculatedMonthly,
          basicSalary: calculatedBasic,
          allowances: calculatedAllowances,
          manager: form.reportingManager,
          reportingManagerName: form.reportingManager,
        });
      }

      // STEP 3: Also try the recruitment convert API (marks candidate as converted in job_candidates table)
      try {
        await fetch('/api/recruitment/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            candidateId: candidate.id, 
            customDetails: { 
              empCode: assignedEmpCode,
              annualSalary: Number(form.annualSalary),
              salary: calculatedMonthly
            } 
          }),
        });
      } catch (_) {
        // Non-fatal
      }

      setIsSubmitting(false);
      onSuccess(candidate.id, assignedEmpCode);
      onClose();
    } catch (err: any) {
      setError('Failed to save employee to database. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert Candidate to HRMS Employee Master">
      <div className="space-y-4 text-xs text-slate-600">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-start gap-3">
          <Sparkles size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-900">Seamless ATS-to-HRMS Onboarding</h4>
            <p className="text-emerald-700 text-[11px] mt-0.5 leading-relaxed">
              Converting <strong>{candidate.name}</strong> will save them permanently to PostgreSQL with status <span className="font-bold text-emerald-600">Joined</span> and they will immediately appear in the HRMS Employee Directory.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Employee Code</label>
            <Input
              value={form.empCode}
              onChange={(e) => setForm({ ...form, empCode: e.target.value })}
              className="font-mono font-bold text-purple-600"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Kiosk Login PIN</label>
            <Input
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value })}
              className="font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
            <Select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              options={[
                { value: 'Engineering', label: 'Engineering' },
                { value: 'Sales', label: 'Sales' },
                { value: 'HR', label: 'HR' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Marketing', label: 'Marketing' },
              ]}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Designation</label>
            <Input
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
              <span>Annual Salary / CTC (₹)</span>
              <span className="text-[9px] text-purple-600 font-mono font-bold">
                Source of Truth
              </span>
            </label>
            <Input
              type="number"
              value={form.annualSalary}
              onChange={(e) => setForm({ ...form, annualSalary: Number(e.target.value) })}
              className="font-mono font-bold text-slate-900"
            />
            <div className="mt-1.5 p-2 bg-emerald-50/80 border border-emerald-200/80 rounded-lg space-y-0.5 text-[10px]">
              <div className="flex justify-between items-center text-emerald-900 font-bold">
                <span>Monthly Gross (÷ 12):</span>
                <span className="font-mono text-xs text-emerald-700">₹{calculatedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <p className="text-slate-500 text-[9px]">
                Basic (60%): <strong className="font-mono text-slate-800">₹{calculatedBasic.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> • Allowances: <strong className="font-mono text-slate-800">₹{calculatedAllowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </p>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Reporting Manager</label>
            <Input
              value={form.reportingManager}
              onChange={(e) => setForm({ ...form, reportingManager: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 mt-1">Direct supervisor for attendance & leave approvals</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleConvert}
            disabled={isSubmitting}
          >
            <UserCheck size={14} /> {isSubmitting ? 'Saving to Database...' : 'Confirm & Convert to Employee'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
