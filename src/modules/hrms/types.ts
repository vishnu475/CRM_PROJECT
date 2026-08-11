export type EmployeeLifecycleStatus = 'Active' | 'Probation' | 'Confirmed' | 'Transferred' | 'Exited';

export interface EmployeeDoc {
  id: string;
  name: string;
  category: 'ID Proof' | 'Offer Letter' | 'Degree' | 'Statutory';
  uploadDate: string;
  size: string;
}

export interface ExtendedEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  status: EmployeeLifecycleStatus;
  joiningDate: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  avatar?: string;
  documents?: EmployeeDoc[];
}

export interface HrmsState {
  loaded: boolean;
}
