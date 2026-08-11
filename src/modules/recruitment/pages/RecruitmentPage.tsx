import React, { useState } from 'react';
import { UserPlus, Plus, Briefcase, Mail, CheckCircle2, LayoutGrid, List, Calendar, Award, BarChart2, Search, Filter, Upload, FileText, Star, UserCheck } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { RecruitmentDashboard } from '../components/RecruitmentDashboard';
import { JobOpeningManager } from '../components/JobOpeningManager';
import { InterviewScheduleManager } from '../components/InterviewScheduleManager';
import { OfferLetterManager } from '../components/OfferLetterManager';
import { CandidateKanbanBoard } from '../components/CandidateKanbanBoard';
import { ExtendedCandidate, JobOpening, RecruitmentKanbanStage } from '../types';

export const RecruitmentPage: React.FC = () => {
  const { jobCandidates } = useApp();

  // Navigation Tabs
  const [mainTab, setMainTab] = useState<'kanban' | 'list' | 'openings' | 'interviews' | 'offers' | 'dashboard'>('kanban');

  // Job Openings list
  const [openings] = useState<JobOpening[]>([
    { id: 'job-1', title: 'Senior Software Engineer', department: 'Engineering', location: 'Bengaluru / Hybrid', headcount: 3, hiringManager: 'James Smith', status: 'Active', createdDate: '2026-08-01' },
    { id: 'job-2', title: 'Sales Executive Lead', department: 'Sales', location: 'Mumbai HQ', headcount: 2, hiringManager: 'Robert Vance', status: 'Active', createdDate: '2026-08-03' }
  ]);

  // Extended Candidates list with 8-stage progression
  const [candidates, setCandidates] = useState<ExtendedCandidate[]>([
    { id: 'cand-1', name: 'David Miller', email: 'david.m@example.com', phone: '+91 98765 43210', jobOpeningId: 'job-1', jobTitle: 'Senior Software Engineer', department: 'Engineering', stage: 'Interview', resumeFileName: 'David_Miller_Resume.pdf', score: 88, appliedDate: '2026-08-05' },
    { id: 'cand-2', name: 'Sophia Chen', email: 'sophia.c@example.com', phone: '+91 98765 12345', jobOpeningId: 'job-2', jobTitle: 'Sales Executive Lead', department: 'Sales', stage: 'Offer', resumeFileName: 'Sophia_Chen_CV.pdf', score: 92, appliedDate: '2026-08-02' },
    { id: 'cand-3', name: 'Lucas Scott', email: 'lucas.s@example.com', phone: '+91 98765 99887', jobOpeningId: 'job-1', jobTitle: 'Senior Software Engineer', department: 'Engineering', stage: 'Applied', resumeFileName: 'Lucas_Resume.pdf', score: 75, appliedDate: '2026-08-10' },
    { id: 'cand-4', name: 'Olivia Taylor', email: 'olivia.t@example.com', phone: '+91 98765 55443', jobOpeningId: 'job-1', jobTitle: 'Senior Software Engineer', department: 'Engineering', stage: 'Shortlisted', resumeFileName: 'Olivia_CV.pdf', score: 85, appliedDate: '2026-08-08' },
    { id: 'cand-5', name: 'Alex Morgan', email: 'alex.m@example.com', phone: '+91 98765 11223', jobOpeningId: 'job-1', jobTitle: 'Senior Software Engineer', department: 'Engineering', stage: 'Hired', resumeFileName: 'Alex_Morgan_Resume.pdf', score: 95, appliedDate: '2026-07-28' }
  ]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');

  // Modals state
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ExtendedCandidate | null>(null);

  // Form State for Add Candidate
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: 'Senior Software Engineer',
    stage: 'Applied' as RecruitmentKanbanStage
  });

  const handleAddCandidate = () => {
    const created: ExtendedCandidate = {
      id: `cand-${candidates.length + 1}`,
      name: newCandidate.name,
      email: newCandidate.email,
      phone: newCandidate.phone,
      jobOpeningId: 'job-1',
      jobTitle: newCandidate.jobTitle,
      department: 'Engineering',
      stage: newCandidate.stage,
      resumeFileName: `${newCandidate.name.replace(/\s+/g, '_')}_CV.pdf`,
      score: 80,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    setCandidates([created, ...candidates]);
    setIsAddCandidateOpen(false);
  };

  const handleAdvanceStage = (candId: string, nextStage: RecruitmentKanbanStage) => {
    setCandidates(candidates.map(c => c.id === candId ? { ...c, stage: nextStage } : c));
    if (selectedCandidate && selectedCandidate.id === candId) {
      setSelectedCandidate({ ...selectedCandidate, stage: nextStage });
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStageFilter === 'All' || c.stage === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="text-purple-600" size={24} />
            Recruitment & Candidate ATS Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Job requisitions, 8-stage ATS Kanban funnel, interview panels, scorecards, offer letters, and employee conversion.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setIsAddCandidateOpen(true)}>
            <Plus size={14} /> Add Candidate
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setMainTab('kanban')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'kanban' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutGrid size={14} /> 8-Stage ATS Kanban Board
        </button>
        <button
          onClick={() => setMainTab('list')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'list' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <List size={14} /> Candidate Applications List ({candidates.length})
        </button>
        <button
          onClick={() => setMainTab('openings')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'openings' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase size={14} /> Job Requisitions & Openings
        </button>
        <button
          onClick={() => setMainTab('interviews')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'interviews' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar size={14} /> Interview Schedules & Panels
        </button>
        <button
          onClick={() => setMainTab('offers')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'offers' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award size={14} /> Offer Letters & Commitments
        </button>
        <button
          onClick={() => setMainTab('dashboard')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            mainTab === 'dashboard' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart2 size={14} /> Recruitment Dashboard
        </button>
      </div>

      {/* TAB: DASHBOARD */}
      {mainTab === 'dashboard' && <RecruitmentDashboard candidates={candidates} openings={openings} />}

      {/* TAB: JOB OPENINGS */}
      {mainTab === 'openings' && <JobOpeningManager />}

      {/* TAB: INTERVIEWS */}
      {mainTab === 'interviews' && <InterviewScheduleManager />}

      {/* TAB: OFFERS */}
      {mainTab === 'offers' && <OfferLetterManager />}

      {/* TAB: KANBAN BOARD */}
      {mainTab === 'kanban' && (
        <CandidateKanbanBoard candidates={candidates} onSelectCandidate={(c) => setSelectedCandidate(c)} />
      )}

      {/* TAB: CANDIDATE APPLICATIONS LIST */}
      {mainTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search candidates or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Funnel Stages</option>
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Selected">Selected</option>
                <option value="Offer">Offer</option>
                <option value="Hired">Hired</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Candidate Name</th>
                  <th className="p-3.5">Email / Phone</th>
                  <th className="p-3.5">Target Position</th>
                  <th className="p-3.5">Funnel Stage</th>
                  <th className="p-3.5">Scorecard</th>
                  <th className="p-3.5">Applied Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map(cand => (
                  <tr key={cand.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{cand.name}</td>
                    <td className="p-3.5 text-slate-500">{cand.email}</td>
                    <td className="p-3.5 font-semibold text-purple-600">{cand.jobTitle}</td>
                    <td className="p-3.5"><Badge variant="info">{cand.stage}</Badge></td>
                    <td className="p-3.5 font-bold text-emerald-600">{cand.score} / 100</td>
                    <td className="p-3.5 text-slate-400">{cand.appliedDate}</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => setSelectedCandidate(cand)} className="text-purple-600 font-bold hover:underline">
                        Profile & Scorecard &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      <Modal isOpen={isAddCandidateOpen} onClose={() => setIsAddCandidateOpen(false)} title="Add Candidate to Pipeline">
        <div className="space-y-4 text-xs">
          <Input label="Full Name" placeholder="e.g. David Miller" value={newCandidate.name} onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })} />
          <Input label="Email" placeholder="david@example.com" value={newCandidate.email} onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })} />
          <Input label="Phone" placeholder="+91 98765 43210" value={newCandidate.phone} onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })} />
          <Select
            label="Initial ATS Funnel Stage"
            value={newCandidate.stage}
            onChange={(e) => setNewCandidate({ ...newCandidate, stage: e.target.value as RecruitmentKanbanStage })}
            options={[
              { label: 'Applied', value: 'Applied' },
              { label: 'Screening', value: 'Screening' },
              { label: 'Shortlisted', value: 'Shortlisted' },
              { label: 'Interview', value: 'Interview' }
            ]}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resume File Upload</label>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50 text-slate-400 hover:border-purple-400 transition-colors cursor-pointer">
              <Upload size={20} className="mx-auto mb-1 text-purple-600" />
              <span>Attach candidate resume (PDF / DOCX)</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddCandidateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddCandidate}>Save Candidate</Button>
          </div>
        </div>
      </Modal>

      {/* CANDIDATE PROFILE & SCORECARD MODAL */}
      {selectedCandidate && (
        <Modal isOpen={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} title={`Candidate Profile: ${selectedCandidate.name}`}>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedCandidate.name}</h3>
                <p className="text-purple-700 font-semibold">{selectedCandidate.jobTitle} • {selectedCandidate.email}</p>
                <p className="text-slate-400 font-mono text-[10px]">Applied: {selectedCandidate.appliedDate}</p>
              </div>
              <Badge variant="info">Stage: {selectedCandidate.stage}</Badge>
            </div>

            {/* Scorecard & Resume Details */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-700 text-[10px] uppercase">Interview Scorecard</h4>
              <p>• Technical Rating: <span className="font-bold text-emerald-600">4.8 / 5</span></p>
              <p>• Culture Fit: <span className="font-bold text-emerald-600">5.0 / 5</span></p>
              <p>• Overall Evaluation Score: <span className="font-bold text-purple-700">{selectedCandidate.score} / 100</span></p>
              <p className="text-slate-500 font-mono pt-1 text-[10px] flex items-center gap-1"><FileText size={12} /> Resume: {selectedCandidate.resumeFileName}</p>
            </div>

            {/* Stage Advancement Action */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-2">
              <span className="font-bold text-slate-900 block text-[11px]">Advance Candidate Funnel Stage:</span>
              <div className="flex flex-wrap gap-1.5">
                {(['Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Offer', 'Hired', 'Employee'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handleAdvanceStage(selectedCandidate.id, s)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold ${selectedCandidate.stage === s ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="primary" onClick={() => { handleAdvanceStage(selectedCandidate.id, 'Employee'); setSelectedCandidate(null); }}>
                <UserCheck size={14} /> Convert to Permanent Employee
              </Button>
              <Button variant="outline" onClick={() => setSelectedCandidate(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
