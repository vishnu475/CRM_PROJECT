export interface SystemNumberingSequence {
  module: 'Employee' | 'Task' | 'Invoice' | 'Voucher' | 'Purchase' | 'Lead' | 'Project';
  prefix: string;
  nextNumber: number;
  paddingDigits: number;
  separator: string;
  exampleFormatted: string;
  description: string;
}

export interface EmployeeProfileSetting {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  role: string;
  branch: string;
  avatar: string;
  status: string;
  shift: string;
  workHoursDaily: number;
  skills: string[];
  timezone: string;
}

export interface NotificationSettingsConfig {
  emailAlerts: boolean;
  pushNotifications: boolean;
  taskAssignmentAlerts: boolean;
  leaveApprovalAlerts: boolean;
  attendanceReminders: boolean;
  weeklyPerformanceDigest: boolean;
}

export interface OrganizationSystemSettings {
  companyName: string;
  tradeName: string;
  branchName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  registeredAddress: string;
  gstin: string;
  panNumber: string;
  cinNumber: string;
  baseCurrency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
  currencySymbol: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  timezone: string;
  financialYearStart: string;
}

export interface SecurityAndAccessSettings {
  twoFactorAuth: boolean;
  sessionTimeoutMinutes: number;
  enforceStrongPasswords: boolean;
  allowSelfRegistration: boolean;
  ipRestrictionEnabled: boolean;
  allowedIpRanges: string;
}

export interface EmployeePolicySettings {
  defaultDailyHours: number;
  gracePeriodMinutes: number;
  autoApproveLeavesBelowDays: number;
  allowAttendanceSelfRegularization: boolean;
  overtimeMultiplier: number;
  weeklyOffDays: string[];
}
