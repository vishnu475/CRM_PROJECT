import React from 'react';
import { Briefcase, Users, Calendar, Send, CheckCircle2, Clock, TrendingUp, Award } from 'lucide-react';
import { Candidate, JobOpening, InterviewSchedule, OfferLetter } from '../types';

interface RecruitmentDashboardProps {
  jobs: JobOpening[];
  candidates: Candidate[];
  interviews: InterviewSchedule[];
  offers: OfferLetter[];
}

export const RecruitmentDashboard: React.FC<RecruitmentDashboardProps> = ({
  jobs,
  candidates,
  interviews,
  offers
}) => {
  const openPositionsCount = jobs.filter(j => j.status === 'Open').reduce((sum, j) => sum + j.vacancies, 0);
  const activeCandidatesCount = candidates.filter(c => c.stage !== 'Employee').length;
  const interviewsCount = interviews.length;
  const offersSentCount = offers.filter(o => o.status === 'Sent' || o.status === 'Accepted').length;
  const hiredCount = candidates.filter(c => c.stage === 'Hired' || c.stage === 'Employee').length;

  return (
    <div className="space-y-6">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Briefcase size={12} className="text-purple-600" /> Open Positions
          </span>
          <p className="text-xl font-extrabold text-slate-900">{openPositionsCount}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Active Requisitions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Users size={12} className="text-blue-600" /> Active Applicants
          </span>
          <p className="text-xl font-extrabold text-slate-900">{activeCandidatesCount}</p>
          <span className="text-[10px] text-blue-600 font-semibold">In Hiring Funnel</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Calendar size={12} className="text-amber-600" /> Scheduled Rounds
          </span>
          <p className="text-xl font-extrabold text-slate-900">{interviewsCount}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Panels Assigned</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Send size={12} className="text-indigo-600" /> Offers Issued
          </span>
          <p className="text-xl font-extrabold text-slate-900">{offersSentCount}</p>
          <span className="text-[10px] text-indigo-600 font-semibold">Commitments Sent</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" /> Total Hired
          </span>
          <p className="text-xl font-extrabold text-emerald-600">{hiredCount}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Ready for Onboarding</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <Clock size={12} className="text-rose-600" /> Avg Time-to-Hire
          </span>
          <p className="text-xl font-extrabold text-slate-900">18 Days</p>
          <span className="text-[10px] text-slate-500 font-semibold">Industry Benchmark</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Candidate Stage Funnel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <TrendingUp size={15} className="text-purple-600" /> Candidate Hiring Funnel
          </h4>

          <div className="space-y-2 text-xs">
            {['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map(stg => {
              const count = candidates.filter(c => c.stage === stg).length;
              const pct = candidates.length > 0 ? Math.round((count / candidates.length) * 100) : 0;
              return (
                <div key={stg} className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700 text-[11px]">
                    <span>{stg}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recruiter Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Award size={15} className="text-purple-600" /> Recruiter Efficiency Breakdown
          </h4>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Priya Sharma</p>
                <p className="text-[10px] text-slate-500">Lead Talent Acquisition</p>
              </div>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                12 Candidates Managed
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Sarah Jenkins</p>
                <p className="text-[10px] text-slate-500">VP of Engineering (Hiring Lead)</p>
              </div>
              <span className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                6 Interviews Evaluated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
