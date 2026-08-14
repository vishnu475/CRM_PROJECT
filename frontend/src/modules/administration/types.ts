export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
  createdDate: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  isSystemDefault?: boolean;
}

export interface CompanyMasterDetails {
  companyName: string;
  legalName: string;
  gstin: string;
  pan: string;
  tan: string;
  registeredAddress: string;
  baseCurrency: string;
  branchesCount: number;
}

export interface BranchMasterDetails {
  code: string;
  name: string;
  city: string;
  state: string;
  gstin: string;
  status: 'Active' | 'Inactive';
  isPrimary: boolean;
}

export interface DepartmentHierarchyNode {
  id: string;
  name: string;
  code: string;
  headName: string;
  parentDept?: string;
}

export interface DesignationHierarchyNode {
  id: string;
  title: string;
  level: number;
  department: string;
  reportingToTitle?: string;
}

export interface AdministrationState {
  loaded: boolean;
}
