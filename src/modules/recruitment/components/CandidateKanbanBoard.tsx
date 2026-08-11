import React, { useState } from 'react';
import { UserPlus, Briefcase, Mail, CheckCircle2, ChevronRight, Upload } from 'lucide-react';
import { ExtendedCandidate, RecruitmentKanbanStage } from '../types';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';

export interface CandidateKanbanBoardProps {
  candidates: ExtendedCandidate[];
  onSelectCandidate: (candidate: ExtendedCandidate) => void;
}

export const CandidateKanbanBoard: React.FC<CandidateKanbanBoardProps> = ({ candidates, onSelectCandidate }) => {
  // Full 8 Kanban Stages
  const stages: RecruitmentKanbanStage[] = [
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview',
    'Selected',
    'Offer',
    'Hired',
    'Employee'
  ];

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex space-x-3 min-w-[1200px]">
        {stages.map((stage) => {
          const stageCandidates = candidates.filter(c => c.stage === stage);
          return (
            <div key={stage} className="w-64 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0 space-y-3">
              {/* Stage Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h4 className="font-bold text-[11px] uppercase text-slate-700 tracking-wider flex items-center gap-1">
                  <span>{stage}</span>
                </h4>
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[300px]">
                {stageCandidates.map(cand => (
                  <div
                    key={cand.id}
                    onClick={() => onSelectCandidate(cand)}
                    className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-2 hover:border-purple-300 transition-all cursor-pointer"
                  >
                    <h5 className="font-bold text-slate-900 text-xs truncate">{cand.name}</h5>
                    <p className="text-[10px] text-purple-700 font-semibold truncate">{cand.jobTitle}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-1.5">
                      <span>Score: <span className="font-bold text-emerald-600">{cand.score}/100</span></span>
                      <span className="text-purple-600 font-bold hover:underline flex items-center">
                        Details &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
