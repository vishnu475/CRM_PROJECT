import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Candidate, JobOpening, InterviewSchedule, OfferLetter, CandidateStage } from '../types';
import { RecruitmentService } from '../services/recruitmentService';

const initialJobs: JobOpening[] = [
  {
    id: 'job-101',
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    branch: 'Bengaluru HQ',
    employmentType: 'Full-Time',
    vacancies: 3,
    experienceYears: '4-6 Years',
    salaryRange: '₹18,00,000 - ₹24,00,000 PA',
    hiringManager: 'Sarah Jenkins',
    priority: 'High',
    closingDate: '2026-08-30',
    description: 'Looking for a Senior React + Node.js Architect with PostgreSQL expertise.',
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Express'],
    status: 'Open',
    postedDate: '2026-08-01'
  },
  {
    id: 'job-102',
    title: 'Sales Operations Manager',
    department: 'Sales',
    branch: 'Mumbai Branch',
    employmentType: 'Full-Time',
    vacancies: 2,
    experienceYears: '3-5 Years',
    salaryRange: '₹12,00,000 - ₹16,00,000 PA',
    hiringManager: 'Michael Vance',
    priority: 'Medium',
    closingDate: '2026-09-15',
    description: 'Lead enterprise B2B sales operations, CRM tracking, and account closures.',
    requiredSkills: ['B2B Sales', 'CRM', 'Negotiation', 'Account Management'],
    status: 'Open',
    postedDate: '2026-08-05'
  }
];

const fallbackCandidates: Candidate[] = [
  {
    id: 'can-101',
    candidateNo: 'CAN-001',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phone: '+91 98765 43210',
    appliedPosition: 'Senior Full Stack Engineer',
    jobOpeningId: 'job-101',
    department: 'Engineering',
    recruiter: 'Priya Sharma',
    stage: 'Hired',
    score: 92,
    appliedDate: '2026-08-02',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    education: 'B.Tech Computer Science, IIT Bombay (2020)',
    experienceYears: 5,
    skills: ['React', 'TypeScript', 'PostgreSQL', 'Node.js'],
    notes: 'Exceptional system design skills during Round 2 Technical interview.',
    isConverted: false
  },
  {
    id: 'can-102',
    candidateNo: 'CAN-002',
    name: 'Vikram Seth',
    email: 'vikram.seth@example.com',
    phone: '+91 98765 11223',
    appliedPosition: 'Sales Operations Manager',
    jobOpeningId: 'job-102',
    department: 'Sales',
    recruiter: 'Priya Sharma',
    stage: 'Offer',
    score: 88,
    appliedDate: '2026-08-06',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    education: 'MBA Marketing, IIM Ahmedabad (2021)',
    experienceYears: 4,
    skills: ['B2B Sales', 'CRM', 'Pipeline Management'],
    isConverted: false
  },
  {
    id: 'can-103',
    candidateNo: 'CAN-003',
    name: 'Ananya Roy',
    email: 'ananya.roy@example.com',
    phone: '+91 98765 88990',
    appliedPosition: 'Senior Full Stack Engineer',
    jobOpeningId: 'job-101',
    department: 'Engineering',
    recruiter: 'Priya Sharma',
    stage: 'Interview',
    score: 85,
    appliedDate: '2026-08-08',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    education: 'M.Tech Software Engineering, NIT Trichy',
    experienceYears: 4,
    skills: ['Node.js', 'Express', 'Docker', 'AWS'],
    isConverted: false
  }
];

export function useRecruitment() {
  const { reloadEmployeesFromDB } = useApp();
  const [jobs, setJobs] = useState<JobOpening[]>(initialJobs);
  const [candidates, setCandidates] = useState<Candidate[]>(fallbackCandidates);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([
    {
      id: 'int-101',
      candidateId: 'can-103',
      candidateName: 'Ananya Roy',
      round: 'Round 2 — Technical',
      interviewer: 'Sarah Jenkins',
      date: '2026-08-14',
      time: '14:30',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      mode: 'Online',
      result: 'Pending'
    }
  ]);
  const [offers, setOffers] = useState<OfferLetter[]>([
    {
      id: 'off-101',
      candidateId: 'can-102',
      candidateName: 'Vikram Seth',
      position: 'Sales Operations Manager',
      salary: 1400000,
      doj: '2026-09-01',
      reportingManager: 'Michael Vance',
      branch: 'Mumbai Branch',
      status: 'Sent',
      createdDate: '2026-08-10'
    }
  ]);

  // Load candidates from PostgreSQL API on mount
  const reloadCandidatesFromDB = useCallback(async () => {
    const data = await RecruitmentService.fetchCandidates();
    if (data && data.length > 0) {
      setCandidates(data);
    }
  }, []);

  useEffect(() => {
    reloadCandidatesFromDB();
  }, [reloadCandidatesFromDB]);

  // Update candidate stage in PostgreSQL & React state
  const updateCandidateStage = useCallback(async (candidateId: string, newStage: CandidateStage) => {
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId || c.candidateNo === candidateId ? { ...c, stage: newStage } : c))
    );
    await RecruitmentService.updateCandidateStage(candidateId, newStage);
    await reloadCandidatesFromDB();
    if (newStage === 'Employee' || newStage === 'Hired') {
      await reloadEmployeesFromDB();
    }
  }, [reloadCandidatesFromDB, reloadEmployeesFromDB]);

  // Add new Candidate to PostgreSQL & React state
  const addCandidate = useCallback(async (candidate: Partial<Candidate>) => {
    const saved = await RecruitmentService.saveCandidate({
      name: candidate.name || 'New Candidate',
      email: candidate.email || '',
      phone: candidate.phone || '',
      appliedPosition: candidate.appliedPosition || 'Developer',
      department: candidate.department || 'Engineering',
      recruiter: candidate.recruiter || 'Priya Sharma',
      expectedSalary: candidate.expectedSalary || 1800000,
      stage: 'Applied',
      score: candidate.score || 80,
      education: candidate.education || '',
      experienceYears: candidate.experienceYears || 2,
      skills: candidate.skills || ['React', 'TypeScript']
    });

    if (saved) {
      await reloadCandidatesFromDB();
    } else {
      const nextNum = candidates.length + 1;
      const localCand: Candidate = {
        id: `can-${Date.now()}`,
        candidateNo: `CAN-${String(nextNum).padStart(3, '0')}`,
        name: candidate.name || 'New Candidate',
        email: candidate.email || '',
        phone: candidate.phone || '',
        appliedPosition: candidate.appliedPosition || 'Developer',
        department: candidate.department || 'Engineering',
        recruiter: candidate.recruiter || 'Priya Sharma',
        stage: 'Applied',
        score: candidate.score || 80,
        appliedDate: new Date().toISOString().split('T')[0],
        education: candidate.education,
        experienceYears: candidate.experienceYears || 2,
        skills: candidate.skills || ['JavaScript'],
        isConverted: false
      };
      setCandidates(prev => [localCand, ...prev]);
    }
  }, [candidates, reloadCandidatesFromDB]);

  // Add Job Opening
  const addJobOpening = useCallback((job: Partial<JobOpening>) => {
    const newJob: JobOpening = {
      id: `job-${Date.now()}`,
      title: job.title || 'New Opening',
      department: job.department || 'Engineering',
      branch: job.branch || 'Bengaluru HQ',
      employmentType: job.employmentType || 'Full-Time',
      vacancies: Number(job.vacancies) || 1,
      experienceYears: job.experienceYears || '1-3 Years',
      salaryRange: job.salaryRange || '₹6,00,000 - ₹10,00,000 PA',
      hiringManager: job.hiringManager || 'Hiring Lead',
      priority: job.priority || 'Medium',
      closingDate: job.closingDate || '2026-09-30',
      description: job.description || 'Job description',
      requiredSkills: job.requiredSkills || [],
      status: job.status || 'Open',
      postedDate: new Date().toISOString().split('T')[0]
    };
    setJobs(prev => [newJob, ...prev]);
    RecruitmentService.saveJob(newJob);
  }, []);

  // Add Interview Schedule
  const scheduleInterview = useCallback((interview: Partial<InterviewSchedule>) => {
    const newInt: InterviewSchedule = {
      id: `int-${Date.now()}`,
      candidateId: interview.candidateId || '',
      candidateName: interview.candidateName || 'Candidate',
      round: interview.round || 'Round 1 — HR Screening',
      interviewer: interview.interviewer || 'HR Manager',
      date: interview.date || new Date().toISOString().split('T')[0],
      time: interview.time || '10:00',
      meetingLink: interview.meetingLink,
      mode: interview.mode || 'Online',
      result: 'Pending'
    };
    setInterviews(prev => [newInt, ...prev]);
  }, []);

  // Submit Interview Evaluation Scorecard
  const submitInterviewEvaluation = useCallback((interviewId: string, evaluation: Partial<InterviewSchedule>) => {
    setInterviews(prev =>
      prev.map(i => {
        if (i.id === interviewId) {
          const tech = evaluation.scoreTechnical || 0;
          const comm = evaluation.scoreCommunication || 0;
          const prob = evaluation.scoreProblemSolving || 0;
          const cult = evaluation.scoreCultureFit || 0;
          const avgScore = Math.round((tech + comm + prob + cult) / 4);

          setCandidates(cList =>
            cList.map(c => (c.id === i.candidateId ? { ...c, score: avgScore } : c))
          );

          return { ...i, ...evaluation, result: evaluation.result || 'Pass' };
        }
        return i;
      })
    );
  }, []);

  // Add/Update Offer Letter
  const saveOffer = useCallback((offer: Partial<OfferLetter>) => {
    const newOffer: OfferLetter = {
      id: `off-${Date.now()}`,
      candidateId: offer.candidateId || '',
      candidateName: offer.candidateName || 'Candidate',
      position: offer.position || 'Software Developer',
      salary: Number(offer.salary) || 1200000,
      doj: offer.doj || '2026-09-01',
      reportingManager: offer.reportingManager || 'Manager',
      branch: offer.branch || 'Bengaluru HQ',
      status: offer.status || 'Sent',
      createdDate: new Date().toISOString().split('T')[0]
    };
    setOffers(prev => [newOffer, ...prev]);

    if (offer.status === 'Accepted') {
      updateCandidateStage(offer.candidateId || '', 'Hired');
    }
  }, [updateCandidateStage]);

  // Mark Candidate as Converted to Employee Master
  const markCandidateConverted = useCallback((candidateId: string, employeeId: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId || c.candidateNo === candidateId) {
          return { ...c, stage: 'Employee', isConverted: true, convertedEmployeeId: employeeId };
        }
        return c;
      })
    );
  }, []);

  return {
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
  };
}
