export type AttendanceLogStatus =
  | 'Present'
  | 'Late In'
  | 'Early Out'
  | 'Absent'
  | 'On Leave'
  | 'Half Day'
  | 'Holiday'
  | 'Weekly Off'
  | 'PRESENT'
  | 'LATE_IN'
  | 'EARLY_OUT'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'HALF_DAY'
  | 'HOLIDAY'
  | 'WEEKLY_OFF';

export type AttendanceSource = 'WEB_KIOSK' | 'BIOMETRIC' | 'RFID' | 'FACE' | 'QR' | 'MOBILE';
export type AttendanceEventType = 'CHECK_IN' | 'CHECK_OUT';

export interface AttendanceEvent {
  eventId: string;
  employeeId: string;
  empName?: string;
  department?: string;
  eventType: AttendanceEventType;
  timestamp: string; // ISO string e.g. "2026-08-13T09:02:31"
  timeString: string; // e.g. "09:02:31 AM"
  source: AttendanceSource;
  deviceId: string;
  statusCalculated?: AttendanceLogStatus;
  lateMinutes?: number;
  earlyOutMinutes?: number;
}

export interface AttendanceDevice {
  deviceId: string;
  deviceName: string;
  deviceType: AttendanceSource;
  location: string;
  status: 'ACTIVE' | 'OFFLINE' | 'MAINTENANCE';
  lastSyncAt: string;
}

export type KioskStatus =
  | 'IDLE'
  | 'IDENTIFYING'
  | 'VERIFYING'
  | 'CHECKING_IN'
  | 'CHECKING_OUT'
  | 'SUCCESS'
  | 'ERROR'
  | 'LOCKED';

export interface KioskResult {
  success: boolean;
  employeeId?: string;
  empName?: string;
  department?: string;
  designation?: string;
  action?: AttendanceEventType;
  timestamp?: string;
  timeString?: string;
  shiftName?: string;
  status?: AttendanceLogStatus;
  workedHours?: number;
  lateMinutes?: number;
  earlyOutMinutes?: number;
  overtimeHours?: number;
  message: string;
}

export interface ShiftMasterConfig {
  id: string;
  code: string;
  name: string;
  startTime: string; // e.g. "09:00 AM" or "09:00"
  endTime: string;   // e.g. "06:00 PM" or "18:00"
  workHours: number; // standard work hours e.g. 9.0
  gracePeriodMins: number; // e.g. 15
  breakDurationMins: number; // e.g. 60
  isNightShift: boolean;
  status: 'Active' | 'Inactive';
}

export interface DetailedAttendanceRecord {
  id: string;
  employeeId: string;
  empId: string; // compatibility alias
  empName: string; // derived from HRMS Employee
  department: string; // derived from HRMS Employee
  designation?: string; // derived from HRMS Employee
  manager?: string; // derived from HRMS Employee
  date: string; // "YYYY-MM-DD"
  shiftId?: string;
  shiftName: string;
  checkIn: string; // "09:00 AM" or "-"
  checkOut: string; // "06:00 PM" or "-"
  workHours: number;
  workedHours: number; // alias
  overtimeHours: number;
  lateMinutes: number;
  earlyOutMinutes: number;
  isLateIn: boolean;
  isEarlyOut: boolean;
  status: AttendanceLogStatus;
  location: string;
  ipAddress?: string;
  regularizationStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export type AttendanceRecord = DetailedAttendanceRecord;

export interface AttendanceRegularizationRequest {
  id: string;
  employeeId: string;
  empName: string;
  attendanceId?: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestType: 'in' | 'out' | 'onduty' | 'both';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export interface AttendanceSummaryMetrics {
  totalEmployees: number;
  presentCount: number;
  lateInCount: number;
  earlyOutCount: number;
  absentCount: number;
  onLeaveCount: number;
  holidayCount: number;
  weeklyOffCount: number;
  totalOvertimeHours: number;
}

export interface AttendanceMonthlySummary {
  employeeId: string;
  empName: string;
  department: string;
  month: string; // "YYYY-MM" or "August 2026"
  totalDays: number;
  presentDays: number;
  lateDays: number;
  earlyOutDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  overtimeHours: number;
  totalWorkedHours: number;
  totalLateMinutes: number;
  totalEarlyOutMinutes: number;
}

export interface AttendanceState {
  loaded: boolean;
}
