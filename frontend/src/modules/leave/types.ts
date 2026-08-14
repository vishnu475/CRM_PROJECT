export type LeaveTypeCategory = 'Casual Leave (CL)' | 'Sick Leave (SL)' | 'Earned Leave (EL)' | 'Comp-Off' | 'Maternity Leave' | 'Paternity Leave';
export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface DynamicLeaveBalance {
  empId: string;
  empName: string;
  leaveType: LeaveTypeCategory;
  openingBalance: number;
  used: number;
  pending: number;
  available: number;
}

export interface LeaveTypeMasterConfig {
  id: string;
  code: string;
  name: LeaveTypeCategory;
  annualQuota: number;
  isEncashable: boolean;
  carryForwardMax: number;
  status: 'Active' | 'Inactive';
}

export interface ExtendedLeaveRequest {
  id: string;
  empId: string;
  empName: string;
  leaveType: LeaveTypeCategory;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay: boolean;
  halfDaySession?: 'First Half' | 'Second Half';
  reason: string;
  status: LeaveRequestStatus;
  appliedDate: string;
  managerComment?: string;
}

export interface LeaveEncashmentRequest {
  id: string;
  empId: string;
  empName: string;
  leaveType: 'Earned Leave (EL)';
  encashDays: number;
  estimatedAmount: number;
  status: 'Pending' | 'Approved' | 'Paid';
  appliedDate: string;
}

export interface CompOffGrantRequest {
  id: string;
  empId: string;
  empName: string;
  workedDate: string;
  reason: string;
  grantedDays: number;
  status: 'Pending' | 'Approved';
}

export interface LeaveState {
  loaded: boolean;
}
