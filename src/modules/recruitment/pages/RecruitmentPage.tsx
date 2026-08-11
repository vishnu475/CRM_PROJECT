import React from 'react';
import { UserPlus, Plus, Briefcase, Mail, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const RecruitmentPage: React.FC = () => {
  const { jobCandidates } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="text-purple-600" size={24} />
            Recruitment & Candidate ATS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage job requisitions, candidate evaluation pipelines, interviews, scorecards, and offer letters.
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Add Candidate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobCandidates.map((cand) => (
          <div key={cand.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{cand.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{cand.jobTitle}</p>
              </div>
              <Badge variant="info">{cand.stage}</Badge>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {cand.email}</p>
              <p className="flex items-center gap-1.5"><Briefcase size={12} className="text-slate-400" /> Score: <span className="font-bold text-emerald-600">88/100</span></p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <button className="text-purple-600 font-bold hover:underline flex items-center gap-1">
                <CheckCircle2 size={14} /> Convert to Employee &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
