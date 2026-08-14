import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserCheck,
  KeyRound,
  Play,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useAttendanceKiosk } from '../hooks/useAttendanceKiosk';
import { AttendanceSuccess } from './AttendanceSuccess';
import { Button } from '../../../components/common/Button';

export const AttendanceKiosk: React.FC = () => {
  const {
    kioskStatus,
    kioskResult,
    lockoutTimeLeft,
    resetCountdown,
    processKioskPunch,
    resetKiosk
  } = useAttendanceKiosk();

  const [inputEmpId, setInputEmpId] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTimeStr = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processKioskPunch(inputEmpId, inputPin);
  };

  const handleClear = () => {
    setInputEmpId('');
    setInputPin('');
    resetKiosk();
  };

  // If punch succeeded, show Success Confirmation Screen
  if (kioskStatus === 'SUCCESS' && kioskResult) {
    return (
      <div className="py-6">
        <AttendanceSuccess
          result={kioskResult}
          onReset={() => {
            handleClear();
          }}
          countdown={resetCountdown}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Main Kiosk Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Kiosk Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1 mb-2">
            <Sparkles size={11} /> Self-Service Attendance Kiosk
          </span>
          <h2 className="text-xl font-black tracking-wide uppercase">ATTENDANCE</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{formattedDateStr}</p>

          {/* Live Digital Clock Badge */}
          <div className="mt-4 bg-slate-800/80 border border-slate-700/60 rounded-xl py-3 px-4 inline-block shadow-inner">
            <span className="font-mono text-2xl font-black tracking-wider text-emerald-400 flex items-center justify-center gap-2">
              <Clock size={20} className="animate-pulse text-emerald-400" />
              {formattedTimeStr}
            </span>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {lockoutTimeLeft > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-rose-800 text-xs font-bold flex items-center justify-center gap-2">
            <ShieldAlert size={16} />
            <span>Too many invalid attempts. Kiosk locked for {lockoutTimeLeft}s.</span>
          </div>
        )}

        {/* Error Feedback Message */}
        {kioskStatus === 'ERROR' && kioskResult && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-rose-800 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            <span>{kioskResult.message}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {/* Employee ID Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Employee ID
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="e.g. EMP-004"
                value={inputEmpId}
                onChange={(e) => setInputEmpId(e.target.value)}
                disabled={lockoutTimeLeft > 0}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* PIN Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              PIN Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type={showPin ? 'text' : 'password'}
                placeholder="•••• (Default: 1234)"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                disabled={lockoutTimeLeft > 0}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="w-full py-3 flex items-center justify-center gap-1 font-bold text-xs"
            >
              <RotateCcw size={14} /> CLEAR
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={lockoutTimeLeft > 0 || !inputEmpId || !inputPin}
              className="col-span-2 py-3 flex items-center justify-center gap-2 font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              <Play size={16} /> MARK ATTENDANCE
            </Button>
          </div>
        </form>

        {/* Quick Testing Employee Shortcuts */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-left text-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Quick Prototype Shortcuts (Click to fill):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'EMP-001', name: 'Emma (EMP-001)' },
              { id: 'EMP-002', name: 'Robert (EMP-002)' },
              { id: 'EMP-003', name: 'James (EMP-003)' },
              { id: 'EMP-004', name: 'Michael (EMP-004)' },
              { id: 'EMP-005', name: 'David (EMP-005)' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setInputEmpId(item.id);
                  setInputPin('1234');
                }}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-[11px] font-semibold text-slate-700 shadow-sm transition-all"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
