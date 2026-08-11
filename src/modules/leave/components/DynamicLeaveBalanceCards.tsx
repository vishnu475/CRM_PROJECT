import React from 'react';
import { Umbrella, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { DynamicLeaveBalance } from '../types';

export interface DynamicLeaveBalanceCardsProps {
  balances: DynamicLeaveBalance[];
  selectedEmpName: string;
}

export const DynamicLeaveBalanceCards: React.FC<DynamicLeaveBalanceCardsProps> = ({ balances, selectedEmpName }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span className="font-bold text-slate-700">Dynamic Leave Balances for: <span className="text-purple-600 font-extrabold">{selectedEmpName}</span></span>
        <span className="text-[10px] font-mono">Formula: Opening - Used - Pending = Available</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {balances.map((b, idx) => {
          const available = b.openingBalance - b.used - b.pending;
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-purple-200 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">{b.leaveType}</span>
                <Umbrella size={18} className="text-purple-600 opacity-80" />
              </div>

              <div>
                <span className="text-2xl font-black text-slate-900">{available} <span className="text-xs font-semibold text-slate-400">days left</span></span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px] pt-2 border-t border-slate-100 text-slate-500">
                <div>
                  <span className="block text-[9px] text-slate-400">Opening</span>
                  <span className="font-bold text-slate-800">{b.openingBalance}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400">Used</span>
                  <span className="font-bold text-rose-600">{b.used}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400">Pending</span>
                  <span className="font-bold text-amber-600">{b.pending}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
