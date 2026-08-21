import React from 'react';
import { UserCheck, ShieldAlert, Sparkles, TrendingUp, CheckCircle2, DollarSign, PieChart } from 'lucide-react';

interface ConfirmedEmployeePayrollCardProps {
  confirmedCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  anomalyCount: number;
  onOpenAIAssistant: () => void;
}

export const ConfirmedEmployeePayrollCard: React.FC<ConfirmedEmployeePayrollCardProps> = ({
  confirmedCount,
  totalGross,
  totalDeductions,
  totalNet,
  anomalyCount,
  onOpenAIAssistant,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Card 1: Confirmed Employees Pool */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Confirmed Employees Pool
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{confirmedCount}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <UserCheck size={20} />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} /> 100% Eligible
          </span>
          <span className="text-slate-400 font-medium">Filtered Status</span>
        </div>
      </div>

      {/* Card 2: Total Gross Payroll */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Monthly Gross Earnings
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">₹ {totalGross.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-bold">Basic + HRA + Special</span>
          <span className="text-emerald-600 font-bold">Gross Total</span>
        </div>
      </div>

      {/* Card 3: Statutory Deductions & Tax */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Statutory Tax & PF/ESI
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">-₹ {totalDeductions.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <PieChart size={20} />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-rose-600 font-bold">PF 12% + ESI + TDS</span>
          <span className="text-slate-400 font-medium">Compliance</span>
        </div>
      </div>

      {/* Card 4: Net Disbursal & AI Assistant Trigger */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4 rounded-xl shadow-md text-white relative overflow-hidden flex flex-col justify-between border border-blue-800/50">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400 animate-pulse" />
              Net Disbursal Budget
            </p>
            <h3 className="text-xl font-black text-white mt-1">₹ {totalNet.toLocaleString()}</h3>
          </div>
          {anomalyCount > 0 ? (
            <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
              <ShieldAlert size={12} /> {anomalyCount} Anomaly
            </span>
          ) : (
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
              <CheckCircle2 size={12} /> Verified
            </span>
          )}
        </div>
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-slate-300 font-medium">Direct Bank Disbursal</span>
          <button
            onClick={onOpenAIAssistant}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-sm flex items-center gap-1 transition-all"
          >
            <Sparkles size={12} /> Ask AI Copilot
          </button>
        </div>
      </div>
    </div>
  );
};
