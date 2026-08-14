import { EmployeeLifecycleStatus, EmploymentHistoryRecord } from '../../types';

export type { EmployeeLifecycleStatus, EmploymentHistoryRecord };

export interface EmployeeDoc {
  id: string;
  name: string;
  category: 'ID Proof' | 'Offer Letter' | 'Degree' | 'Statutory';
  uploadDate: string;
  size: string;
}

export interface ExtendedEmployee {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  department: string;
  designation: string;
  salary: number;
  basicSalary?: number;
  allowances?: number;
  probationEndDate?: string;
  status: EmployeeLifecycleStatus;
  joiningDate: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  reportingManagerId?: string;
  reportingManagerName?: string;
  manager?: string;
  branch?: string;
  candidateId?: string;
  panNumber?: string;
  uanNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  avatar?: string;
  documents?: EmployeeDoc[];
  history?: EmploymentHistoryRecord[];
}

export interface HrmsState {
  loaded: boolean;
}
