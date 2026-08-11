import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DetailedAttendanceRecord } from '../types';

export interface AttendanceCalendarViewProps {
  records: DetailedAttendanceRecord[];
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({ records }) => {
  const [selectedMonth, setSelectedMonth] = useState('August 2026');

  // Days in month grid (31 days for August)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const getStatusForDay = (dayNum: number) => {
    if (dayNum % 7 === 0 || dayNum % 7 === 6) return 'Weekend';
    if (dayNum === 15) return 'Holiday';
    if (dayNum % 5 === 0) return 'Late In';
    if (dayNum % 8 === 0) return 'Early Out';
    return 'Present';
  };

  const getDayColor = (status: string) => {
    switch(status) {
      case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Late In': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Early Out': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Holiday': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Weekend': return 'bg-slate-100 text-slate-400 border-slate-200';
      default: return 'bg-white text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="text-blue-600" size={18} /> Attendance Visual Monthly Calendar ({selectedMonth})
        </h3>
        <div className="flex items-center gap-2 text-xs font-bold">
          <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={16} /></button>
          <span>{selectedMonth}</span>
          <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Present</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Late In</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500 inline-block" /> Early Out</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> Holiday</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300 inline-block" /> Weekend</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 pt-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
        ))}

        {daysInMonth.map((day) => {
          const status = getStatusForDay(day);
          const colorClass = getDayColor(status);
          return (
            <div key={day} className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${colorClass}`}>
              <div>{day}</div>
              <div className="text-[9px] font-normal opacity-80 mt-0.5">{status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
