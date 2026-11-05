import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  FileCheck,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
  ArrowRight
} from 'lucide-react';
import { timesheetApi } from '../services/timesheetApi';

interface Props {
  onAssignedSuccess?: () => void;
}

export const AssignTimesheetView: React.FC<Props> = ({ onAssignedSuccess }) => {
  const [employees, setEmployees] = useState<{
    id: string;
    emp_code: string;
    name: string;
    department: string;
    designation: string;
  }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [expectedHours, setExpectedHours] = useState(8);
  const [proofRequired, setProofRequired] = useState(true);
  const [allowMultipleEntries, setAllowMultipleEntries] = useState(true);
  const [requireDescription, setRequireDescription] = useState(true);
  const [instructions, setInstructions] = useState(
    'Please provide a clear description of your work and attach supporting PDF proof.'
  );

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const list = await timesheetApi.getEmployeesList();
      setEmployees(list);
      // Pre-select Vishnu Vardhan (EMP-005) or first employee if available
      const vishnu = list.find(e => e.emp_code === 'EMP-005' || e.name.toLowerCase().includes('vishnu'));
      if (vishnu) {
        setSelectedEmployeeId(vishnu.emp_code || vishnu.id);
      } else if (list.length > 0) {
        setSelectedEmployeeId(list[0].emp_code || list[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setErrorMessage('Please select an employee.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload = {
        employee_id: selectedEmployeeId,
        start_date: mode === 'single' ? singleDate : startDate,
        end_date: mode === 'single' ? singleDate : endDate,
        expected_hours_per_day: Number(expectedHours),
        proof_required: proofRequired,
        allow_multiple_entries: allowMultipleEntries,
        require_description: requireDescription,
        instructions: instructions.trim()
      };

      const res = await timesheetApi.assignTimesheet(payload);
      setSuccessMessage(res.message || 'Timesheet assigned successfully.');
      
      if (onAssignedSuccess) {
        setTimeout(() => {
          onAssignedSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmpObj = employees.find(
    e => e.emp_code === selectedEmployeeId || e.id === selectedEmployeeId
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-2 border border-blue-100 dark:border-blue-900">
            <Calendar className="w-3.5 h-3.5" />
            <span>Timesheet Allocation Engine</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Assign Timesheet
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Configure expected daily hours, proof requirements, and validation rules for employees.
            Creates real database records for single days or expanded date ranges.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0 self-start md:self-auto border border-slate-200/70 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'single'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Single Day
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'range'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Date Range
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
          <div>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Assignment Created!</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />
          <div>
            <p className="text-xs font-bold text-rose-900 dark:text-rose-200">Assignment Failed</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Assignment Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* Section 1: Employee Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <User size={14} className="text-blue-600" />
            <span>Employee *</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                required
                disabled={loadingEmployees}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loadingEmployees ? (
                  <option>Loading employees from database...</option>
                ) : (
                  employees.map(emp => (
                    <option key={emp.id} value={emp.emp_code || emp.id}>
                      {emp.name} ({emp.emp_code || emp.id}) — {emp.department}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Selected Employee Snapshot Card */}
            {selectedEmpObj && (
              <div className="p-3 bg-blue-50/50 dark:bg-slate-800/60 rounded-2xl border border-blue-100/70 dark:border-slate-700 flex items-center space-x-3 text-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedEmpObj.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{selectedEmpObj.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{selectedEmpObj.designation} • {selectedEmpObj.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Date or Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === 'single' ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span>Date *</span>
              </label>
              <input
                type="date"
                value={singleDate}
                onChange={e => setSingleDate(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CalendarRange size={14} className="text-blue-600" />
                  <span>Start Date *</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CalendarRange size={14} className="text-blue-600" />
                  <span>End Date *</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  min={startDate}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock size={14} className="text-blue-600" />
              <span>Expected Hours *</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={expectedHours}
                onChange={e => setExpectedHours(Number(e.target.value))}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-3 text-xs text-slate-400 font-bold">hours/day</span>
            </div>
          </div>
        </div>

        {/* Section 3: Validation Rules Switches */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 space-y-4">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Timesheet Rules & Enforcement
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Proof Required */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Proof Required *</span>
                <span className="text-[10px] text-slate-500">PDF attachment mandatory</span>
              </div>
              <button
                type="button"
                onClick={() => setProofRequired(!proofRequired)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  proofRequired ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    proofRequired ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Allow Multiple Entries */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Multiple Entries *</span>
                <span className="text-[10px] text-slate-500">Allow multiple work slots</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowMultipleEntries(!allowMultipleEntries)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  allowMultipleEntries ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    allowMultipleEntries ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Require Description */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Require Description *</span>
                <span className="text-[10px] text-slate-500">Detailed work explanation</span>
              </div>
              <button
                type="button"
                onClick={() => setRequireDescription(!requireDescription)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  requireDescription ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    requireDescription ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>
        </div>

        {/* Section 4: Instructions */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FileText size={14} className="text-blue-600" />
            <span>Instructions</span>
          </label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={3}
            placeholder="Please provide a clear description of your work and attach supporting PDF proof."
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || loadingEmployees}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] hover:from-[#1d4ed8] hover:to-[#3b82f6] text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{submitting ? 'Assigning Records...' : 'Assign Timesheet'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
