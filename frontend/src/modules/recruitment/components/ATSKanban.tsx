import React from 'react';
import { UserCheck, Star, Calendar, ArrowRight, UserPlus, Eye, CheckCircle2 } from 'lucide-react';
import { Candidate, CandidateStage } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface ATSKanbanProps {
  candidates: Candidate[];
  onUpdateStage: (candidateId: string, newStage: CandidateStage) => void;
  onOpenDrawer: (candidate: Candidate) => void;
  onOpenConvertModal: (candidate: Candidate) => void;
}

const STAGES: CandidateStage[] = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Employee'];

export const ATSKanban: React.FC<ATSKanbanProps> = ({
  candidates,
  onUpdateStage,
  onOpenDrawer,
  onOpenConvertModal
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
      {STAGES.map(stage => {
        const stageCandidates = candidates.filter(c => c.stage === stage);
        return (
          <div key={stage} className="min-w-[280px] max-w-[280px] bg-slate-50 rounded-xl border border-slate-200 flex flex-col max-h-[calc(100vh-220px)]">
            {/* Column Header */}
            <div className="p-3 bg-white border-b border-slate-200 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  stage === 'Hired' ? 'bg-emerald-500' :
                  stage === 'Employee' ? 'bg-purple-600' :
                  stage === 'Offer' ? 'bg-blue-500' : 'bg-amber-500'
                }`} />
                <h4 className="text-xs font-bold text-slate-800">{stage}</h4>
              </div>
              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {stageCandidates.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="p-2 space-y-3 overflow-y-auto flex-1">
              {stageCandidates.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-medium">No Candidates</p>
                </div>
              ) : (
                stageCandidates.map(cand => (
                  <div
                    key={cand.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={cand.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}&background=6366f1&color=fff`}
                          alt={cand.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 leading-tight">{cand.name}</h5>
                          <span className="text-[10px] font-mono text-purple-600 font-bold">{cand.candidateNo}</span>
                        </div>
                      </div>
                      <Badge variant={cand.score >= 85 ? 'success' : 'warning'} className="text-[9px] px-1.5 py-0">
                        ⭐ {cand.score}/100
                      </Badge>
                    </div>

                    {/* Applied Position */}
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700">{cand.appliedPosition}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{cand.department} • Recruiter: {cand.recruiter}</p>
                    </div>

                    {/* Meta Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {cand.appliedDate}
                      </span>

                      {/* Stage Selector */}
                      <select
                        value={cand.stage}
                        disabled={cand.stage === 'Employee'}
                        onChange={(e) => onUpdateStage(cand.id, e.target.value as CandidateStage)}
                        className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenDrawer(cand)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Eye size={12} /> Details
                      </button>

                      {cand.stage === 'Hired' && !cand.isConverted && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-[10px] py-1 px-2 flex items-center gap-1"
                          onClick={() => onOpenConvertModal(cand)}
                        >
                          <UserPlus size={11} /> Convert to Employee
                        </Button>
                      )}

                      {cand.stage === 'Employee' && (
                        <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          <CheckCircle2 size={11} /> Converted
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
