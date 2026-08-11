export type PayrollRunStatus = 'Draft' | 'Calculated' | 'Approved' | 'Locked';

export interface SalaryStructureConfig {
  id: string;
  name: string;
  basicPct: number;
  hraPct: number;
  conveyance: number;
  specialAllowance: number;
  pfRate: number;
  esiRate: number;
  ptaxAmount: number;
  status: 'Active' | 'Inactive';
}

export interface EmployeeSalaryMapping {
  empId: string;
  empName: string;
  department: string;
  monthlyCtc: number;
  structureId: string;
  structureName: string;
  basicSalary: number;
  hraAmount: number;
  specialAllowance: number;
  pfAmount: number;
  esiAmount: number;
  ptaxAmount: number;
}

export interface PayrollRegisterRow {
  empId: string;
  empName: string;
  department: string;
  grossPay: number;
  lopDays: number;
  lopDeduction: number;
  otPay: number;
  bonusIncentive: number;
  reimbursements: number;
  loanDeduction: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  ptaxDeduction: number;
  totalDeductions: number;
  netPayable: number;
}

export interface EmployeeLoanAdvance {
  id: string;
  empId: string;
  empName: string;
  loanAmount: number;
  monthlyEmi: number;
  remainingAmount: number;
  status: 'Active' | 'Closed';
}

export interface ExtendedPayrollRun {
  id: string;
  month: string;
  totalEmployees: number;
  grossAmount: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollRunStatus;
  runDate: string;
  approvedBy?: string;
  registerRows?: PayrollRegisterRow[];
}

export interface PayrollState {
  loaded: boolean;
}
