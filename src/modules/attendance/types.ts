export type AttendanceLogStatus = 'Present' | 'Late In' | 'Early Out' | 'Absent' | 'On Leave' | 'Half Day';

export interface ShiftMasterConfig {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  workHours: number;
  gracePeriodMins: number;
  breakDurationMins: number;
  isNightShift: boolean;
  status: 'Active' | 'Inactive';
}

export interface DetailedAttendanceRecord {
  id: string;
  empId: string;
  empName: string;
  department: string;
  date: string;
  shiftName: string;
  checkIn: string;
  checkOut: string;
  workHours: number;
  overtimeHours: number;
  isLateIn: boolean;
  isEarlyOut: boolean;
  status: AttendanceLogStatus;
  location: string;
}

export interface AttendanceSummaryMetrics {
  totalEmployees: number;
  presentCount: number;
  lateInCount: number;
  earlyOutCount: number;
  absentCount: number;
  totalOvertimeHours: number;
}

export interface AttendanceState {
  loaded: boolean;
}
