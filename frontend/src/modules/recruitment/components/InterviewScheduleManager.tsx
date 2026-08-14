import React, { useState } from 'react';
import { Calendar, Clock, Plus, Video, CheckCircle2, UserCheck, Star } from 'lucide-react';
import { InterviewSchedule } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const InterviewScheduleManager: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([
    { id: 'int-1', candidateId: 'cand-1', candidateName: 'David Miller', jobTitle: 'Senior Software Engineer', roundName: 'Round 1: Technical System Design', date: '2026-08-14', time: '02:00 PM', panelMembers: ['James Smith (VP Eng)', 'Sarah Jenkins (Tech Lead)'], meetingUrl: 'https://meet.google.com/abc-defg-hij', status: 'Scheduled' },
    { id: 'int-2', candidateId: 'cand-2', candidateName: 'Sophia Chen', jobTitle: 'Sales Executive Lead', roundName: 'Round 2: Leadership & Cultural Fit', date: '2026-08-10', time: '11:30 AM', panelMembers: ['Robert Vance (Sales Dir)', 'Emma Watson (HR Lead)'], meetingUrl: 'https://meet.google.com/xyz-uvwx-rst', status: 'Completed', feedbackScore: 4.8, comments: 'Exceptional communication and domain expertise.' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    candidateName: '',
    roundName: 'Round 1: Technical Coding',
    date: '2026-08-15',
    time: '10:00 AM',
    panel: 'James Smith, Emma Watson'
  });

  const handleAddSchedule = () => {
    const created: InterviewSchedule = {
      id: `int-${interviews.length + 1}`,
      candidateId: `cand-${interviews.length + 1}`,
      candidateName: newSchedule.candidateName,
      jobTitle: 'Software Engineer',
      roundName: newSchedule.roundName,
      date: newSchedule.date,
      time: newSchedule.time,
      panelMembers: newSchedule.panel.split(',').map(s => s.trim()),
      meetingUrl: 'https://meet.google.com/new-meeting-room',
      status: 'Scheduled'
    };
    setInterviews([created, ...interviews]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-purple-600" size={18} /> Scheduled Interviews & Evaluation Panels
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Schedule evaluation rounds, assign panel members, and record scorecard feedback.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Schedule Interview
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Candidate</th>
              <th className="p-3.5">Target Position</th>
              <th className="p-3.5">Round Name</th>
              <th className="p-3.5">Date & Time</th>
              <th className="p-3.5">Assigned Panel</th>
              <th className="p-3.5">Scorecard Rating</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {interviews.map(i => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">{i.candidateName}</td>
                <td className="p-3.5">{i.jobTitle}</td>
                <td className="p-3.5 font-semibold text-purple-600">{i.roundName}</td>
                <td className="p-3.5 font-mono text-slate-700">{i.date} @ {i.time}</td>
                <td className="p-3.5 text-slate-500">{(i.panelMembers || []).join(', ')}</td>
                <td className="p-3.5 font-bold text-emerald-600">
                  {i.feedbackScore ? <span className="flex items-center gap-1"><Star size={12} fill="currentColor" /> {i.feedbackScore} / 5</span> : 'Pending Rating'}
                </td>
                <td className="p-3.5">
                  <Badge variant={i.status === 'Completed' ? 'success' : 'warning'}>{i.status}</Badge>
                </td>
                <td className="p-3.5 text-right">
                  <a href={i.meetingUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[10px] font-bold inline-flex items-center gap-1">
                    <Video size={12} /> Join Meet
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Candidate Evaluation Round">
        <div className="space-y-4 text-xs">
          <Input label="Candidate Name" placeholder="e.g. David Miller" value={newSchedule.candidateName} onChange={(e) => setNewSchedule({ ...newSchedule, candidateName: e.target.value })} />
          <Input label="Evaluation Round Name" placeholder="e.g. Round 1: System Design" value={newSchedule.roundName} onChange={(e) => setNewSchedule({ ...newSchedule, roundName: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Interview Date" type="date" value={newSchedule.date} onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })} />
            <Input label="Time Slot" placeholder="02:00 PM" value={newSchedule.time} onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })} />
          </div>
          <Input label="Panel Members (comma-separated)" placeholder="James Smith, Emma Watson" value={newSchedule.panel} onChange={(e) => setNewSchedule({ ...newSchedule, panel: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSchedule}>Confirm Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
