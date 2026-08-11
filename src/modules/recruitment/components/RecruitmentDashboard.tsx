import React from 'react';
import { Briefcase, UserPlus, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { ExtendedCandidate, JobOpening } from '../types';

export interface RecruitmentDashboardProps {
  candidates: ExtendedCandidate[];
  openings: JobOpening[];
}

export const RecruitmentDashboard: React.FC<RecruitmentDashboardProps> = ({ candidates, openings }) => {
  const activeOpenings = openings.filter(o => o.status === 'Active').length;
  const inPipeline = candidates.filter(c => c.stage !== 'Hired' && c.stage !== 'Employee').length;
  const offersSent = candidates.filter(c => c.stage === 'Offer' || c.offer?.status === 'Sent').length;
  const hiredCount = candidates.filter(c => c.stage === 'Hired' || c.stage === 'Employee').length;

  return (
    <div className="space-y-4">
      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Job Openings</span>
            <div className="text-xl font-bold text-purple-600">{activeOpenings}</div>
            <span className="text-[10px] text-slate-400">Target Requisitions</span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Briefcase size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidates In Pipeline</span>
            <div className="text-xl font-bold text-blue-600">{inPipeline}</div>
            <span className="text-[10px] text-blue-600 font-medium">8 Stage Funnel</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <UserPlus size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Offers Issued</span>
            <div className="text-xl font-bold text-amber-600">{offersSent}</div>
            <span className="text-[10px] text-amber-600 font-medium">Awaiting Acceptance</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Award size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hired & Converted</span>
            <div className="text-xl font-bold text-emerald-600">{hiredCount}</div>
            <span className="text-[10px] text-emerald-600 font-medium">Converted to Staff</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
