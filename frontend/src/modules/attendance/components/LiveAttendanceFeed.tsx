import React, { useState } from 'react';
import { Activity, Radio, Cpu, Clock, CheckCircle2, Filter } from 'lucide-react';
import { AttendanceEvent } from '../types';
import { Badge } from '../../../components/common/Badge';

export interface LiveAttendanceFeedProps {
  events: AttendanceEvent[];
}

export const LiveAttendanceFeed: React.FC<LiveAttendanceFeedProps> = ({ events }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CHECK_IN' | 'CHECK_OUT'>('ALL');

  const filteredEvents = events.filter(evt => {
    if (filterType === 'CHECK_IN') return evt.eventType === 'CHECK_IN' || (evt as any).punchType === 'CHECK_IN';
    if (filterType === 'CHECK_OUT') return evt.eventType === 'CHECK_OUT' || (evt as any).punchType === 'CHECK_OUT';
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Stream Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Radio className="text-emerald-500 animate-pulse" size={18} /> Live Attendance Activity Stream
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time raw attendance events captured via Web Kiosk and connected devices.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Event Filter Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                filterType === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setFilterType('CHECK_IN')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                filterType === 'CHECK_IN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Present Check-Ins Only
            </button>
            <button
              onClick={() => setFilterType('CHECK_OUT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                filterType === 'CHECK_OUT' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Check-Outs
            </button>
          </div>
          <Badge variant="info">{filteredEvents.length} Captured</Badge>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No live attendance events matching filter recorded yet today. Use the Attendance Kiosk to record check-in/out events.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Employee</th>
                <th className="p-3">ID</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Calculated Status</th>
                <th className="p-3">Source</th>
                <th className="p-3 text-right">Device ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((evt) => (
                <tr key={evt.eventId || `EVT-${evt.employeeId}-${evt.timeString}`} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock size={13} className="text-emerald-500" />
                    {evt.timeString || '09:00 AM'}
                  </td>
                  <td className="p-3 font-bold text-slate-900">{evt.empName}</td>
                  <td className="p-3 font-mono text-slate-500">{evt.employeeId}</td>
                  <td className="p-3">
                    <Badge variant={evt.eventType === 'CHECK_IN' || (evt as any).punchType === 'CHECK_IN' ? 'success' : 'info'}>
                      {evt.eventType || (evt as any).punchType || 'CHECK_IN'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.statusCalculated === 'Late In' || evt.statusCalculated === 'LATE_IN'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {evt.statusCalculated || 'Present'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-blue-600 uppercase text-[10px]">{evt.source || 'WEB_KIOSK'}</td>
                  <td className="p-3 text-right font-mono text-slate-500">{evt.deviceId || 'WEB-KIOSK-01'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

