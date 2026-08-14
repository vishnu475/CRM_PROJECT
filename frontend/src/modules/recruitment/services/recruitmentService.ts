import { Candidate, JobOpening, InterviewSchedule, OfferLetter } from '../types';

export class RecruitmentService {
  // Prepared API endpoints for future production integration
  static async fetchJobs(): Promise<JobOpening[]> {
    try {
      const res = await fetch('/api/recruitment/jobs');
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (e) {
      console.warn('API fetchJobs fallback to local state:', e);
    }
    return [];
  }

  static async saveJob(job: JobOpening): Promise<JobOpening> {
    try {
      const res = await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (e) {
      console.warn('API saveJob fallback:', e);
    }
    return job;
  }

  static async fetchCandidates(): Promise<Candidate[]> {
    try {
      const res = await fetch('/api/recruitment/candidates');
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (e) {
      console.warn('API fetchCandidates fallback:', e);
    }
    return [];
  }

  static async saveCandidate(candidate: Partial<Candidate>): Promise<any> {
    try {
      const res = await fetch('/api/recruitment/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('API saveCandidate fallback:', e);
    }
    return candidate;
  }

  static async updateCandidateStage(candidateId: string, stage: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/recruitment/candidates/${candidateId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });
      if (res.ok) {
        const json = await res.json();
        return json.success;
      }
    } catch (e) {
      console.warn('API updateCandidateStage fallback:', e);
    }
    return true;
  }

  static async convertCandidateToEmployee(candidateId: string, customDetails: any): Promise<any> {
    try {
      const res = await fetch('/api/recruitment/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, customDetails })
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      console.warn('API convertCandidateToEmployee fallback:', e);
    }
    return { success: false };
  }
}
