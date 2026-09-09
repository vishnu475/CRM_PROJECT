import React, { useState } from 'react';
import { UserCheck, Star, Calendar, ArrowRight, UserPlus, Eye, CheckCircle2, MessageSquareQuote, X, Sparkles, ThumbsUp, Award } from 'lucide-react';
import { Candidate, CandidateStage } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface ATSKanbanProps {
  candidates: Candidate[];
  onUpdateStage: (candidateId: string, newStage: CandidateStage, notes?: string) => void;
  onOpenDrawer: (candidate: Candidate) => void;
  onOpenConvertModal: (candidate: Candidate) => void;
}

const STAGES: CandidateStage[] = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Employee'];

interface PendingTransition {
  candidate: Candidate;
  fromStage: CandidateStage;
  toStage: CandidateStage;
}

export const ATSKanban: React.FC<ATSKanbanProps> = ({
  candidates,
  onUpdateStage,
  onOpenDrawer,
  onOpenConvertModal
}) => {
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleStageSelect = (cand: Candidate, targetStage: CandidateStage) => {
    if (targetStage === cand.stage) return;

    // Transitions within/into Applied and Screening do not require feedback
    if (cand.stage === 'Applied' || targetStage === 'Applied' || targetStage === 'Screening') {
      onUpdateStage(cand.id, targetStage);
      return;
    }

    // Feedback and evaluation comments are strictly required AFTER screening section (Interview and beyond)
    setPendingTransition({
      candidate: cand,
      fromStage: cand.stage,
      toStage: targetStage
    });

    if (cand.stage === 'Screening' && targetStage === 'Interview') {
      setComment(`Candidate performance is good in screening round. Progressed candidate to Interview stage.`);
    } else {
      setComment(`Candidate evaluated satisfactorily in ${cand.stage}. Progressed to ${targetStage}.`);
    }
    setErrorMsg(null);
  };

  const handleConfirmTransition = () => {
    if (!comment.trim()) {
      setErrorMsg('Please provide a performance evaluation comment before moving the candidate.');
      return;
    }

    if (pendingTransition) {
      onUpdateStage(pendingTransition.candidate.id, pendingTransition.toStage, comment.trim());
      setPendingTransition(null);
      setComment('');
      setErrorMsg(null);
    }
  };

  const handleCancelTransition = () => {
    setPendingTransition(null);
    setComment('');
    setErrorMsg(null);
  };

  const quickTemplates = [
    'Candidate performance is good in screening round. Progressed candidate to Interview stage.',
    'Strong technical capabilities and relevant domain experience. Recommended for next round.',
    'Cleared evaluation satisfactorily. Performance good, moved to next stage.',
    'Communication and problem-solving skills verified. Approved for progression.'
  ];

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
        {STAGES.map(stage => {
          const stageCandidates = candidates.filter(c => c.stage === stage);
          return (
            <div key={stage} className="min-w-[290px] max-w-[290px] bg-slate-50 rounded-xl border border-slate-200 flex flex-col max-h-[calc(100vh-220px)]">
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
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2.5"
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

                      {/* Meta Footer with Formatted Date & Stage Selector */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={11} className="text-slate-400" /> {formatDate(cand.appliedDate)}
                        </span>

                        {/* Stage Selector */}
                        <select
                          value={cand.stage}
                          disabled={cand.stage === 'Employee'}
                          onChange={(e) => handleStageSelect(cand, e.target.value as CandidateStage)}
                          className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 cursor-pointer disabled:opacity-50 hover:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        >
                          {STAGES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Stage Evaluation / Comment Display (Down Section) - Only shown after Screening stage */}
                      {cand.notes && cand.stage !== 'Applied' && cand.stage !== 'Screening' && (
                        <div className="p-2 bg-gradient-to-r from-purple-50/80 to-indigo-50/60 border border-purple-100/90 rounded-lg text-[10px] space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between text-[9px] font-bold text-purple-700">
                            <span className="flex items-center gap-1">
                              <MessageSquareQuote size={11} className="text-purple-600" />
                              <span>Evaluation Feedback</span>
                            </span>
                            <span className="text-[8px] uppercase tracking-wider text-purple-500 font-semibold">{cand.stage}</span>
                          </div>
                          <p className="text-slate-700 font-medium italic leading-relaxed line-clamp-2">
                            "{cand.notes}"
                          </p>
                        </div>
                      )}

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

      {/* Stage Transition Performance Feedback Modal */}
      {pendingTransition && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Candidate Stage Transition Evaluation</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Record manager feedback and reason for moving stages</p>
                </div>
              </div>
              <button
                onClick={handleCancelTransition}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Candidate Banner */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold font-mono text-purple-600 uppercase">{pendingTransition.candidate.candidateNo}</span>
                  <h4 className="text-xs font-extrabold text-slate-900">{pendingTransition.candidate.name}</h4>
                  <p className="text-[11px] text-slate-500">{pendingTransition.candidate.appliedPosition}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <span className="px-2 py-1 bg-white rounded border border-slate-200 text-slate-700">
                    {pendingTransition.fromStage}
                  </span>
                  <ArrowRight size={14} className="text-purple-600 animate-pulse" />
                  <span className="px-2 py-1 bg-purple-100 rounded border border-purple-300 text-purple-900">
                    {pendingTransition.toStage}
                  </span>
                </div>
              </div>

              {/* Quick Comment Templates */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                  <Sparkles size={12} className="text-purple-600" /> Quick Performance Evaluation Templates:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setComment(template)}
                      className="text-[10px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 px-2.5 py-1 rounded-full text-slate-600 font-medium text-left transition-all"
                    >
                      {template.slice(0, 45)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Manager / Recruiter Feedback & Reason for Transition *</span>
                  <span className="text-[10px] text-purple-600 font-normal">Displayed on candidate card</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. Candidate performance is good in screening round. Progressed candidate to Interview stage."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all resize-none shadow-2xs"
                />
                {errorMsg && (
                  <p className="text-[11px] font-bold text-rose-600">{errorMsg}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelTransition}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmTransition}
                className="bg-purple-600 hover:bg-purple-700 text-xs px-4 flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={14} />
                <span>Confirm & Move to {pendingTransition.toStage}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

