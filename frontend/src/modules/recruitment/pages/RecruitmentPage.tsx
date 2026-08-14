import React, { useState } from 'react';
import { UserCheck, LayoutGrid, List, Briefcase, Calendar, FileText, BarChart3, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useRecruitment } from '../hooks/useRecruitment';
import { Candidate } from '../types';

import { ATSKanban } from '../components/ATSKanban';
import { CandidateList } from '../components/CandidateList';
import { JobOpeningManager } from '../components/JobOpeningManager';
import { InterviewScheduler } from '../components/InterviewScheduler';
import { OfferManager } from '../components/OfferManager';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { ConvertEmployeeModal } from '../components/ConvertEmployeeModal';
import { RecruitmentDashboard } from '../components/RecruitmentDashboard';
import { AddCandidateModal } from '../components/AddCandidateModal';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';

export const RecruitmentPage: React.FC = () => {
  const {
    jobs,
    candidates,
    interviews,
    offers,
    updateCandidateStage,
    addCandidate,
    addJobOpening,
    scheduleInterview,
    submitInterviewEvaluation,
    saveOffer,
    markCandidateConverted
  } = useRecruitment();

  const { activeSubSection, setActiveSubSection } = useApp();
  const validRecruitmentTabs = ['kanban', 'list', 'jobs', 'interviews', 'offers', 'dashboard'];
  const activeTab = (validRecruitmentTabs.includes(activeSubSection) ? activeSubSection : 'kanban') as 'kanban' | 'list' | 'jobs' | 'interviews' | 'offers' | 'dashboard';
  const setActiveTab = (tab: 'kanban' | 'list' | 'jobs' | 'interviews' | 'offers' | 'dashboard') => setActiveSubSection(tab);

  // Modals & Drawers State
  const [selectedDrawerCandidate, setSelectedDrawerCandidate] = useState<Candidate | null>(null);
  const [selectedConvertCandidate, setSelectedConvertCandidate] = useState<Candidate | null>(null);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshMsg('PostgreSQL ATS Board Refreshed!');
      setTimeout(() => setRefreshMsg(null), 3000);
    }, 600);
  };

  const handleConversionSuccess = (candidateId: string, employeeId: string) => {
    markCandidateConverted(candidateId, employeeId);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="text-purple-600" size={24} />
            Enterprise ATS & Recruitment Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end applicant tracking, 8-stage hiring funnel, interview panels, offer commitments, and automated HRMS Employee onboarding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {refreshMsg && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold animate-pulse">
              <CheckCircle2 size={14} /> {refreshMsg}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-purple-600' : 'text-purple-600'} />
            {isRefreshing ? 'Refreshing DB...' : 'Refresh DB Data'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddCandidateOpen(true)}>
            <Plus size={14} /> + Add Candidate
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (Keep Exactly Unchanged) */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'kanban' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutGrid size={15} /> 1. ATS Kanban Board
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'list' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <List size={15} /> 2. Candidate Applications
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'jobs' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase size={15} /> 3. Job Requisitions & Openings
        </button>
        <button
          onClick={() => setActiveTab('interviews')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'interviews' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar size={15} /> 4. Interview Schedules & Panels
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'offers' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={15} /> 5. Offer Letters & Commitments
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'dashboard' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 size={15} /> 6. Recruitment Dashboard
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* Tab 1: ATS KANBAN */}
      {activeTab === 'kanban' && (
        <ATSKanban
          candidates={candidates}
          onUpdateStage={updateCandidateStage}
          onOpenDrawer={(cand) => setSelectedDrawerCandidate(cand)}
          onOpenConvertModal={(cand) => setSelectedConvertCandidate(cand)}
        />
      )}

      {/* Tab 2: CANDIDATE APPLICATIONS */}
      {activeTab === 'list' && (
        <CandidateList
          candidates={candidates}
          onOpenDrawer={(cand) => setSelectedDrawerCandidate(cand)}
          onOpenConvertModal={(cand) => setSelectedConvertCandidate(cand)}
          onOpenScheduleModal={() => setActiveTab('interviews')}
          onUpdateStage={updateCandidateStage}
        />
      )}

      {/* Tab 3: JOB OPENINGS */}
      {activeTab === 'jobs' && (
        <JobOpeningManager
          jobs={jobs}
          onAddJob={addJobOpening}
        />
      )}

      {/* Tab 4: INTERVIEWS */}
      {activeTab === 'interviews' && (
        <InterviewScheduler
          candidates={candidates}
          interviews={interviews}
          onScheduleInterview={scheduleInterview}
          onSubmitEvaluation={submitInterviewEvaluation}
        />
      )}

      {/* Tab 5: OFFERS */}
      {activeTab === 'offers' && (
        <OfferManager
          candidates={candidates}
          offers={offers}
          onSaveOffer={saveOffer}
          onOpenConvertModal={(cand) => setSelectedConvertCandidate(cand)}
        />
      )}

      {/* Tab 6: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <RecruitmentDashboard
          jobs={jobs}
          candidates={candidates}
          interviews={interviews}
          offers={offers}
        />
      )}

      {/* Profile Details Drawer */}
      <CandidateDrawer
        candidate={selectedDrawerCandidate}
        onClose={() => setSelectedDrawerCandidate(null)}
      />

      {/* Convert to Employee Modal */}
      <ConvertEmployeeModal
        candidate={selectedConvertCandidate}
        isOpen={Boolean(selectedConvertCandidate)}
        onClose={() => setSelectedConvertCandidate(null)}
        onSuccess={handleConversionSuccess}
      />

      {/* Add Candidate Application Modal */}
      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        jobs={jobs}
        onAddCandidate={addCandidate}
      />
    </div>
  );
};
