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

  const nextEmpNum = employees.length + 1;
  const defaultEmpCode = `EMP-${String(nextEmpNum).padStart(3, '0')}`;

  const candidateMonthlySalary = candidate?.expectedSalary 
    ? (candidate.expectedSalary > 500000 ? Math.round(candidate.expectedSalary / 12) : candidate.expectedSalary)
    : 95000;

  const [form, setForm] = useState({
    empCode: defaultEmpCode,
    department: candidate?.department || 'Engineering',
    designation: candidate?.appliedPosition || 'Senior Software Engineer',
    salary: candidateMonthlySalary,
    reportingManager: 'Sarah Jenkins',
    branch: 'Bengaluru HQ',
    pin: '1234'
  });

  if (!candidate) return null;

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
        salary: Number(form.salary),
        basicSalary: Math.round(Number(form.salary) * 0.6),
        allowances: Math.round(Number(form.salary) * 0.4),
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
          salary: Number(form.salary),
          basicSalary: Math.round(Number(form.salary) * 0.6),
          allowances: Math.round(Number(form.salary) * 0.4),
          manager: form.reportingManager,
          reportingManagerName: form.reportingManager,
        });
      }

      // STEP 3: Also try the recruitment convert API (marks candidate as converted in job_candidates table)
      try {
        await fetch('/api/recruitment/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id, customDetails: { empCode: assignedEmpCode } }),
        });
      } catch (_) {
        // Non-fatal: candidate stage update is secondary, employee is already saved
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
            <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly Gross Salary (₹)</label>
            <Input
              type="number"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Reporting Manager</label>
            <Input
              value={form.reportingManager}
              onChange={(e) => setForm({ ...form, reportingManager: e.target.value })}
            />
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
