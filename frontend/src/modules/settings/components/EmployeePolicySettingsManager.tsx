import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Shield, Clock, Users, CheckCircle2, Save, Calendar, AlertCircle } from 'lucide-react';
import { EmployeePolicySettings } from '../types';

export const EmployeePolicySettingsManager: React.FC = () => {
  const { employees } = useApp();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [policies, setPolicies] = useState<EmployeePolicySettings>(() => {
    const saved = localStorage.getItem('crm_employee_policies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      defaultDailyHours: 8,
      gracePeriodMinutes: 15,
      autoApproveLeavesBelowDays: 1,
      allowAttendanceSelfRegularization: true,
      overtimeMultiplier: 1.5,
      weeklyOffDays: ['Sunday', 'Saturday']
    };
  });

  // Calculate live department breakdown
  const departmentCounts = employees.reduce((acc: Record<string, number>, emp) => {
    const dept = emp.department || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('crm_employee_policies', JSON.stringify(policies));
    setSuccessToast('Employee work & attendance policies saved successfully!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const toggleDay = (day: string) => {
    if (policies.weeklyOffDays.includes(day)) {
      setPolicies({ ...policies, weeklyOffDays: policies.weeklyOffDays.filter(d => d !== day) });
    } else {
      setPolicies({ ...policies, weeklyOffDays: [...policies.weeklyOffDays, day] });
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Employee Work Policies & Shift Rules</h2>
          </div>
          <p className="text-xs text-slate-500 pl-10">
            Configure standard daily work hour thresholds, grace periods, weekly off days, and attendance regularization rules.
          </p>
        </div>
      </div>

      {/* Live Department Staff Distribution Cards */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Personnel Distribution by Department</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {Object.entries(departmentCounts).map(([dept, count]) => (
            <div key={dept} className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block truncate">{dept}</span>
              <div className="text-lg font-bold text-slate-900">{count} Employees</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. WORK HOURS & ATTENDANCE THRESHOLDS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Work Hours, Grace Periods & Overtime</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Default Standard Daily Hours</label>
              <input
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={policies.defaultDailyHours}
                onChange={(e) => setPolicies({ ...policies, defaultDailyHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">Standard expected active shift hours</span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Biometric Grace Period (Minutes)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={policies.gracePeriodMinutes}
                onChange={(e) => setPolicies({ ...policies, gracePeriodMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">Late punch-in grace threshold without penalty</span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Overtime Pay Rate Multiplier</label>
              <select
                value={policies.overtimeMultiplier}
                onChange={(e) => setPolicies({ ...policies, overtimeMultiplier: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={1.0}>1.0x (Standard Hourly Rate)</option>
                <option value={1.5}>1.5x (Time and a Half)</option>
                <option value={2.0}>2.0x (Double Time)</option>
              </select>
              <span className="text-[10px] text-slate-400">Calculated on approved extra hours</span>
            </div>
          </div>
        </div>

        {/* 2. REGULARIZATION & WEEKLY OFF DAYS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Weekly Off Days & Self-Service Regularization</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">Weekly Off Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => {
                  const isOff = policies.weeklyOffDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isOff
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day} {isOff && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={policies.allowAttendanceSelfRegularization}
                  onChange={(e) => setPolicies({ ...policies, allowAttendanceSelfRegularization: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Allow Employees to Submit Self-Service Attendance Regularization Requests
                </span>
              </label>
              <p className="text-[11px] text-slate-400 pl-5 mt-0.5">
                Enables employees in ESS portal to request missed punch corrections with manager review.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save size={14} /> Save Employee Policies
          </button>
        </div>
      </form>
    </div>
  );
};
