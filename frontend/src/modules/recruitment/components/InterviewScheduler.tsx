import React, { useState } from 'react';
import { Calendar, Plus, Video, MapPin, CheckCircle2, Star, Clock } from 'lucide-react';
import { Candidate, InterviewSchedule } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

interface InterviewSchedulerProps {
  candidates: Candidate[];
  interviews: InterviewSchedule[];
  onScheduleInterview: (interview: Partial<InterviewSchedule>) => void;
  onSubmitEvaluation: (interviewId: string, evalData: Partial<InterviewSchedule>) => void;
  selectedCandidateForSchedule?: Candidate | null;
}

export const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  candidates,
  interviews,
  onScheduleInterview,
  onSubmitEvaluation,
  selectedCandidateForSchedule
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedIntId, setSelectedIntId] = useState<string | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    candidateId: candidates[0]?.id || '',
    round: 'Round 2 — Technical' as InterviewSchedule['round'],
    interviewer: 'Sarah Jenkins',
    date: '2026-08-18',
    time: '11:00',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    mode: 'Online' as 'Online' | 'Offline'
  });

  const [evalForm, setEvalForm] = useState({
    scoreTechnical: 90,
    scoreCommunication: 85,
    scoreProblemSolving: 88,
    scoreCultureFit: 92,
    remarks: 'Strong architectural skills and clear communication.',
    result: 'Pass' as 'Pass' | 'Fail'
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = candidates.find(c => c.id === scheduleForm.candidateId) || candidates[0];
    onScheduleInterview({
      ...scheduleForm,
      candidateName: cand ? cand.name : 'Candidate'
    });
    setIsModalOpen(false);
  };

  const handleEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIntId) {
      onSubmitEvaluation(selectedIntId, evalForm);
      setEvalModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Interview Schedules & Evaluation Panels</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage 4-stage interview rounds and interviewer evaluation scorecards.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Schedule New Interview
        </Button>
      </div>

      {/* Schedules List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Candidate</th>
                <th className="p-3">Round</th>
                <th className="p-3">Interviewer</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Result</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.map(int => (
                <tr key={int.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{int.candidateName}</td>
                  <td className="p-3 font-semibold text-purple-600">{int.round}</td>
                  <td className="p-3 text-slate-700">{int.interviewer}</td>
                  <td className="p-3 font-mono text-slate-600">{int.date} at {int.time}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      {int.mode === 'Online' ? <Video size={13} className="text-blue-500" /> : <MapPin size={13} className="text-emerald-500" />}
                      {int.mode}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant={int.result === 'Pass' ? 'success' : int.result === 'Fail' ? 'danger' : 'warning'}>
                      {int.result || 'Pending'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {int.result === 'Pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntId(int.id || null);
                          setEvalModalOpen(true);
                        }}
                      >
                        Submit Scorecard
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Candidate Interview Round">
        <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Candidate</label>
            <Select
              value={scheduleForm.candidateId}
              onChange={(e) => setScheduleForm({ ...scheduleForm, candidateId: e.target.value })}
              options={candidates.map(c => ({ value: c.id, label: `${c.name} (${c.appliedPosition})` }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Round</label>
              <Select
                value={scheduleForm.round}
                onChange={(e) => setScheduleForm({ ...scheduleForm, round: e.target.value as any })}
                options={[
                  { value: 'Round 1 — HR Screening', label: 'Round 1 — HR Screening' },
                  { value: 'Round 2 — Technical', label: 'Round 2 — Technical' },
                  { value: 'Round 3 — Manager', label: 'Round 3 — Manager' },
                  { value: 'Round 4 — Final HR', label: 'Round 4 — Final HR' }
                ]}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Interviewer</label>
              <Input
                value={scheduleForm.interviewer}
                onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Date</label>
              <Input
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Time</label>
              <Input
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Evaluation Scorecard Modal */}
      <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Submit Interviewer Scorecard">
        <form onSubmit={handleEvalSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Technical Score (0-100)</label>
              <Input
                type="number"
                value={evalForm.scoreTechnical}
                onChange={(e) => setEvalForm({ ...evalForm, scoreTechnical: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Communication (0-100)</label>
              <Input
                type="number"
                value={evalForm.scoreCommunication}
                onChange={(e) => setEvalForm({ ...evalForm, scoreCommunication: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Problem Solving (0-100)</label>
              <Input
                type="number"
                value={evalForm.scoreProblemSolving}
                onChange={(e) => setEvalForm({ ...evalForm, scoreProblemSolving: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Culture Fit (0-100)</label>
              <Input
                type="number"
                value={evalForm.scoreCultureFit}
                onChange={(e) => setEvalForm({ ...evalForm, scoreCultureFit: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Remarks & Decision</label>
            <Input
              value={evalForm.remarks}
              onChange={(e) => setEvalForm({ ...evalForm, remarks: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Overall Result</label>
            <Select
              value={evalForm.result}
              onChange={(e) => setEvalForm({ ...evalForm, result: e.target.value as any })}
              options={[
                { value: 'Pass', label: 'Pass (Proceed to Next Round)' },
                { value: 'Fail', label: 'Fail (Reject Candidate)' }
              ]}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEvalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Scorecard & Calculate Score
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
