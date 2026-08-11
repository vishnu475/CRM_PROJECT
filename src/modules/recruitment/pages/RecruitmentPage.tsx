import React, { useState } from 'react';
import { UserPlus, Plus, Briefcase, Mail, CheckCircle2, LayoutGrid, List } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { JobCandidate } from '../../../types';

export const RecruitmentPage: React.FC = () => {
  const { jobCandidates } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidate | null>(null);

  const stages = ['Screening', 'Interview', 'Offer', 'Hired'];

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
        <div className="flex gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === 'kanban' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold ${viewMode === 'list' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
            >
              <List size={14} />
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} /> Add Candidate
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageCandidates = jobCandidates.filter(c => c.stage === stage || (stage === 'Screening' && !stages.includes(c.stage)));
            return (
              <div key={stage} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-xs uppercase text-slate-700 tracking-wider">{stage}</h3>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                    {stageCandidates.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {stageCandidates.map(cand => (
                    <div key={cand.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2 hover:border-purple-200 transition-all cursor-pointer" onClick={() => setSelectedCandidate(cand)}>
                      <h4 className="font-bold text-slate-900 text-xs">{cand.name}</h4>
                      <p className="text-[11px] text-purple-700 font-semibold">{cand.jobTitle}</p>
                      <p className="text-[10px] text-slate-400">{cand.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <button onClick={() => setSelectedCandidate(cand)} className="text-purple-600 font-bold hover:underline flex items-center gap-1">
                  Scorecard & Convert &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Candidate Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Candidate to Pipeline">
        <div className="space-y-4 text-xs">
          <Input label="Full Name" placeholder="e.g. David Miller" />
          <Input label="Target Position" placeholder="e.g. Product Manager" />
          <Input label="Email" placeholder="david@example.com" />
          <Select
            label="Initial Pipeline Stage"
            options={[
              { label: 'Screening', value: 'Screening' },
              { label: 'Interview', value: 'Interview' },
              { label: 'Offer', value: 'Offer' }
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(false)}>Save Candidate</Button>
          </div>
        </div>
      </Modal>

      {/* Candidate Scorecard & Convert Modal */}
      {selectedCandidate && (
        <Modal isOpen={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} title={`Evaluation & Scorecard: ${selectedCandidate.name}`}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-lg space-y-1 border border-purple-100">
              <h4 className="font-bold text-slate-900">{selectedCandidate.name} — {selectedCandidate.jobTitle}</h4>
              <p className="text-purple-700">Stage: {selectedCandidate.stage}</p>
            </div>
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-700 text-[10px] uppercase">Interview Feedback</h4>
              <p>• Technical Skills: <span className="font-bold text-emerald-600">4.8 / 5</span></p>
              <p>• Communication: <span className="font-bold text-emerald-600">4.5 / 5</span></p>
              <p>• Culture Fit: <span className="font-bold text-emerald-600">5.0 / 5</span></p>
            </div>
            <div className="flex justify-between items-center pt-2">
              <Button variant="primary" onClick={() => setSelectedCandidate(null)}>
                <CheckCircle2 size={14} /> Convert Candidate to Employee
              </Button>
              <Button variant="outline" onClick={() => setSelectedCandidate(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
