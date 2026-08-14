export type CandidateStage = 
  | 'Applied' 
  | 'Screening' 
  | 'Interview' 
  | 'Selected' 
  | 'Offer' 
  | 'Hired' 
  | 'Employee'
  | 'Shortlisted';

export type JobStatus = 'Draft' | 'Open' | 'On Hold' | 'Closed';
export type OfferStatus = 'Draft' | 'Manager Review' | 'HR Approval' | 'Approved' | 'Sent' | 'Accepted' | 'Rejected' | 'Declined';

export interface InterviewSchedule {
  id?: string;
  candidateId: string;
  candidateName: string;
  jobTitle?: string;
  round?: 'Round 1 — HR Screening' | 'Round 2 — Technical' | 'Round 3 — Manager' | 'Round 4 — Final HR';
  roundName?: string;
  interviewer?: string;
  panelMembers?: string[];
  date: string;
  time: string;
  meetingLink?: string;
  meetingUrl?: string;
  location?: string;
  mode?: 'Online' | 'Offline';
  scoreTechnical?: number;
  scoreCommunication?: number;
  scoreProblemSolving?: number;
  scoreCultureFit?: number;
  feedbackScore?: number;
  remarks?: string;
  comments?: string;
  status?: string;
  result?: 'Pass' | 'Fail' | 'Pending';
}

export interface OfferLetter {
  id?: string;
  candidateId: string;
  candidateName: string;
  position?: string;
  designation?: string;
  salary?: number;
  offeredCtc?: number;
  doj?: string;
  joiningDate?: string;
  expiryDate?: string;
  letterPdfName?: string;
  reportingManager?: string;
  branch?: string;
  benefits?: string;
  notes?: string;
  status: OfferStatus;
  createdDate?: string;
}

export interface Candidate {
  id: string;
  candidateNo: string; // e.g. CAN-001
  name: string;
  email: string;
  phone: string;
  appliedPosition: string;
  jobTitle?: string;
  jobOpeningId?: string;
  department: string;
  recruiter: string;
  stage: CandidateStage;
  score: number;
  appliedDate: string;
  photoUrl?: string;
  resumeUrl?: string;
  education?: string;
  experienceYears?: number;
  skills?: string[];
  notes?: string;
  isConverted?: boolean;
  convertedEmployeeId?: string;
  interviews?: InterviewSchedule[];
  offer?: OfferLetter;
  activityLog?: Array<{ timestamp: string; action: string; author: string }>;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  branch: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract';
  vacancies: number;
  experienceYears: string;
  salaryRange: string;
  hiringManager: string;
  priority: 'High' | 'Medium' | 'Low';
  closingDate: string;
  description: string;
  requiredSkills: string[];
  status: JobStatus;
  postedDate: string;
}

// Backward Compatibility Aliases
export type ExtendedCandidate = Candidate;
export type RecruitmentKanbanStage = CandidateStage;
export type OfferDetails = OfferLetter;
export type OfferStatusType = OfferStatus;
