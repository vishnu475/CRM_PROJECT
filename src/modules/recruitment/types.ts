export type RecruitmentKanbanStage = 
  | 'Applied' 
  | 'Screening' 
  | 'Shortlisted' 
  | 'Interview' 
  | 'Selected' 
  | 'Offer' 
  | 'Hired' 
  | 'Employee';

export type OfferStatusType = 'Draft' | 'Sent' | 'Accepted' | 'Declined';

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  headcount: number;
  hiringManager: string;
  status: 'Active' | 'Closed' | 'Draft';
  createdDate: string;
}

export interface InterviewSchedule {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  roundName: string;
  date: string;
  time: string;
  panelMembers: string[];
  meetingUrl?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  feedbackScore?: number;
  comments?: string;
}

export interface OfferDetails {
  candidateId: string;
  candidateName: string;
  designation: string;
  offeredCtc: number;
  joiningDate: string;
  expiryDate: string;
  status: OfferStatusType;
  letterPdfName: string;
}

export interface ExtendedCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobOpeningId: string;
  jobTitle: string;
  department: string;
  stage: RecruitmentKanbanStage;
  resumeFileName?: string;
  score: number;
  appliedDate: string;
  interviews?: InterviewSchedule[];
  offer?: OfferDetails;
}

export interface RecruitmentState {
  loaded: boolean;
}
