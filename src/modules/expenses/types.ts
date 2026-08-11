export type ExpenseApprovalStage = 'Submitted' | 'Manager Approved' | 'Finance Approved' | 'Rejected' | 'Reimbursed';

export interface ExpenseCategoryConfig {
  id: string;
  name: string;
  maxClaimLimit: number;
  requiresReceipt: boolean;
  status: 'Active' | 'Inactive';
}

export interface ExtendedExpenseClaim {
  id: string;
  claimNumber: string;
  empId: string;
  empName: string;
  department: string;
  category: string;
  costCenter: string;
  amount: number;
  description: string;
  receiptFileName?: string;
  appliedDate: string;
  stage: ExpenseApprovalStage;
  managerNotes?: string;
  financeNotes?: string;
  reimbursementDate?: string;
}

export interface ExpensesState {
  loaded: boolean;
}
