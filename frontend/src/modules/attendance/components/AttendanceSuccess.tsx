import React from 'react';
import { CheckCircle2, Clock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { KioskResult } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export interface AttendanceSuccessProps {
  result: KioskResult;
  onReset: () => void;
  countdown: number;
}

export const AttendanceSuccess: React.FC<AttendanceSuccessProps> = ({
  result,
  onReset,
  countdown
}) => {
  const isCheckIn = result.action === 'CHECK_IN';

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-lg mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300">
      {/* Checkmark Icon Header */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
        <CheckCircle2 size={44} className="animate-bounce" />
      </div>

      <div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider inline-block mb-2 border border-emerald-200">
          {isCheckIn ? 'Check-In Recorded' : 'Check-Out Recorded'}
        </span>
        <h2 className="text-2xl font-black text-slate-900">{result.empName}</h2>
        <p className="text-xs font-mono font-semibold text-slate-500 mt-1">
          ID: {result.employeeId} • {result.department} ({result.designation})
        </p>
      </div>

      {/* Time & Shift Summary Card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-left">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Timestamp</span>
          <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
            <Clock size={14} className="text-blue-600" /> {result.timeString}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Shift</span>
          <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">{result.shiftName || 'General Shift (GS)'}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100 text-xs text-center">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
          <Badge
            variant={
              result.status === 'Late In' || result.status === 'LATE_IN'
                ? 'warning'
                : 'success'
            }
          >
            {result.status || 'Present'}
          </Badge>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Late Mins</span>
          <span className="font-bold text-amber-700">
            {result.lateMinutes && result.lateMinutes > 0 ? `+${result.lateMinutes}m` : '0m'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Device</span>
          <span className="font-mono font-bold text-blue-700">WEB-KIOSK-01</span>
        </div>
      </div>

      {/* Auto Reset Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">
          Auto-resetting kiosk in <strong className="text-slate-700">{countdown}s</strong>...
        </span>
        <Button variant="outline" size="sm" onClick={onReset} className="flex items-center gap-1 font-bold">
          Reset Now <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  );
};
