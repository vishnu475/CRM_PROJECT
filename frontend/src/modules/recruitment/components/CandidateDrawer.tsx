import React, { useState } from 'react';
import { X, User, FileText, GraduationCap, Briefcase, Award, Calendar, CheckSquare, Folder, MessageSquare, Clock, Edit3, Save } from 'lucide-react';
import { Candidate } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface CandidateDrawerProps {
  candidate: Candidate | null;
  onClose: () => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({ candidate, onClose }) => {
  const [activeSection, setActiveSection] = useState<'personal' | 'resume' | 'interviews' | 'notes'>('personal');

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={candidate.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=6366f1&color=fff`}
              alt={candidate.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{candidate.name}</h3>
                <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {candidate.candidateNo}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {candidate.appliedPosition} • {candidate.department}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSection('personal')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === 'personal' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={14} /> Personal & Education
          </button>
          <button
            onClick={() => setActiveSection('resume')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === 'resume' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={14} /> Resume & Skills
          </button>
          <button
            onClick={() => setActiveSection('interviews')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === 'interviews' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar size={14} /> Interview Timeline
          </button>
          <button
            onClick={() => setActiveSection('notes')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === 'notes' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare size={14} /> Scorecard & Notes
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-600">
          {activeSection === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Email Address</label>
                  <p className="font-semibold text-slate-900">{candidate.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
                  <p className="font-semibold text-slate-900">{candidate.phone}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Assigned Recruiter</label>
                  <p className="font-semibold text-slate-900">{candidate.recruiter}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Applied Date</label>
                  <p className="font-semibold text-slate-900">{candidate.appliedDate}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <GraduationCap size={15} className="text-purple-600" /> Education & Qualifications
                </h4>
                <p className="text-slate-700">{candidate.education || 'B.Tech Computer Science Engineering'}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Briefcase size={15} className="text-purple-600" /> Relevant Experience
                </h4>
                <p className="text-slate-700">{candidate.experienceYears || 4} Years in Enterprise Software Engineering</p>
              </div>
            </div>
          )}

          {activeSection === 'resume' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Award size={15} className="text-purple-600" /> Key Technical Skills
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(candidate.skills || ['React', 'TypeScript', 'Node.js', 'PostgreSQL']).map(sk => (
                    <span key={sk} className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-3">
                <FileText size={32} className="mx-auto text-purple-600" />
                <p className="font-bold text-slate-900">Candidate Resume Document</p>
                <p className="text-[11px] text-slate-500">PDF / Word document attached during application submission.</p>
                <Button variant="outline" size="sm">
                  Preview Full Resume PDF
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'interviews' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Interview Schedule & Feedback History</h4>
              <div className="border-l-2 border-purple-600 pl-4 space-y-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-purple-600">Round 1 — HR Screening</span>
                  <p className="font-bold text-slate-900">Passed • Score: 90/100</p>
                  <p className="text-[11px] text-slate-500">Interviewer: Priya Sharma • Date: 2026-08-04</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-purple-600">Round 2 — Technical Architecture</span>
                  <p className="font-bold text-slate-900">Passed • Score: 94/100</p>
                  <p className="text-[11px] text-slate-500">Interviewer: Sarah Jenkins • Date: 2026-08-07</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notes' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Recruiter Notes & Observations</h4>
                <p className="text-slate-700 leading-relaxed">
                  {candidate.notes || 'Strong technical foundation in React and PostgreSQL. Excellent communication and problem-solving skills.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
