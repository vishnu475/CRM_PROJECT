import { Employee, LeaveRequest } from '../../../types';
import {
  ShiftMasterConfig,
  DetailedAttendanceRecord,
  AttendanceLogStatus,
  AttendanceMonthlySummary,
  AttendanceSummaryMetrics
} from '../types';

/**
 * Parses time string (e.g. "09:00 AM", "06:30 PM", "14:30", "09:00") into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return null;

  const str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');

  const cleanStr = str.replace(/(AM|PM)/g, '').trim();
  const parts = cleanStr.split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into 12-hour "hh:mm AM/PM" string.
 */
export function formatMinutesToTime(totalMins: number | null): string {
  if (totalMins === null || isNaN(totalMins)) return '-';
  
  let mins = totalMins % (24 * 60);
  if (mins < 0) mins += 24 * 60;

  let hours = Math.floor(mins / 60);
  const minutes = Math.floor(mins % 60);
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');

  return `${hh}:${mm} ${period}`;
}

/**
 * Calculate worked hours from check-in and check-out times.
 */
export function calculateWorkedHours(
  checkIn: string,
  checkOut: string,
  breakDurationMins: number = 60
): number {
  const inMins = parseTimeToMinutes(checkIn);
  const outMins = parseTimeToMinutes(checkOut);

  if (inMins === null || outMins === null) return 0;

  let diff = outMins - inMins;
  if (diff < 0) {
    // Overnight shift crossing midnight
    diff += 24 * 60;
  }

  const effectiveMins = Math.max(0, diff - breakDurationMins);
  const hours = effectiveMins / 60;
  return Math.round(hours * 100) / 100;
}

/**
 * Calculate late minutes past shift start time + grace period.
 */
export function calculateLateMinutes(
  checkIn: string,
  shiftStartTime: string = '09:00 AM',
  gracePeriodMins: number = 15
): number {
  const inMins = parseTimeToMinutes(checkIn);
  const startMins = parseTimeToMinutes(shiftStartTime);

  if (inMins === null || startMins === null) return 0;

  const threshold = startMins + gracePeriodMins;
  const late = inMins - threshold;
  return late > 0 ? late : 0;
}

/**
 * Calculate early out minutes before shift end time.
 */
export function calculateEarlyOutMinutes(
  checkOut: string,
  shiftEndTime: string = '06:00 PM'
): number {
  const outMins = parseTimeToMinutes(checkOut);
  const endMins = parseTimeToMinutes(shiftEndTime);

  if (outMins === null || endMins === null) return 0;

  const early = endMins - outMins;
  return early > 0 ? early : 0;
}

/**
 * Calculate overtime hours beyond standard shift hours.
 */
export function calculateOvertimeHours(
  workedHours: number,
  standardWorkHours: number = 9.0
): number {
  if (workedHours > standardWorkHours) {
    return Math.round((workedHours - standardWorkHours) * 100) / 100;
  }
  return 0;
}

/**
 * Standard list of company holidays for calculation.
 */
export const DEFAULT_COMPANY_HOLIDAYS = [
  { name: 'New Year Day', date: '2026-01-01' },
  { name: 'Republic Day', date: '2026-01-26' },
  { name: 'May Day / Labor Day', date: '2026-05-01' },
  { name: 'Independence Day', date: '2026-08-15' },
  { name: 'Gandhi Jayanti', date: '2026-10-02' },
  { name: 'Diwali', date: '2026-11-08' },
  { name: 'Christmas Day', date: '2026-12-25' }
];

/**
 * Check if a date string is a public holiday.
 */
export function isPublicHoliday(
  dateStr: string,
  holidaysList: { name: string; date: string }[] = DEFAULT_COMPANY_HOLIDAYS
): { isHoliday: boolean; holidayName?: string } {
  if (!dateStr) return { isHoliday: false };
  const found = holidaysList.find(h => {
    if (h.date === dateStr) return true;
    // Format comparison if dateStr is YYYY-MM-DD
    const d = new Date(dateStr);
    const hDate = new Date(h.date);
    return d.toISOString().split('T')[0] === hDate.toISOString().split('T')[0];
  });

  return found ? { isHoliday: true, holidayName: found.name } : { isHoliday: false };
}

/**
 * Check if a date is a scheduled weekly off day (e.g. Sunday or Saturday).
 */
export function isScheduledWorkDay(dateStr: string): boolean {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  // Sunday is weekly off by default
  return dayOfWeek !== 0;
}

/**
 * Check if an employee has an approved leave for a date.
 */
export function isEmployeeOnLeave(
  employeeId: string,
  empName: string,
  dateStr: string,
  leaveRequests: LeaveRequest[] = []
): { isOnLeave: boolean; isHalfDay: boolean; leaveType?: string; status?: string } {
  const matchingLeave = leaveRequests.find(lr => {
    const safeLrName = (lr.empName || '').toLowerCase();
    const safeEmpName = (empName || '').toLowerCase();
    const isEmp = (lr.empId && lr.empId === employeeId) || (Boolean(safeLrName) && Boolean(safeEmpName) && safeLrName === safeEmpName);
    if (!isEmp) return false;
    const isApproved = lr.status === 'Approved';
    if (!isApproved) return false;

    const start = new Date(lr.startDate).getTime();
    const end = new Date(lr.endDate).getTime();
    const target = new Date(dateStr).getTime();

    return target >= start && target <= end;
  });

  if (!matchingLeave) {
    return { isOnLeave: false, isHalfDay: false };
  }

  const isHalf = matchingLeave.days <= 0.5 || (matchingLeave as any).isHalfDay === true;
  return {
    isOnLeave: true,
    isHalfDay: isHalf,
    leaveType: matchingLeave.leaveType,
    status: matchingLeave.status
  };
}

/**
 * Evaluates priority status for an attendance log based on rules:
 * 1. Exited/Inactive Employee -> Absent
 * 2. Public Holiday -> Holiday
 * 3. Weekly Off -> Weekly Off
 * 4. Approved Leave -> On Leave / Half Day
 * 5. Punched In -> Present / Late In / Early Out
 * 6. No Punch on Work Day -> Absent
 */
export function calculateAttendanceStatus(params: {
  employeeStatus: string;
  isHoliday: boolean;
  isWorkDay: boolean;
  isOnLeave: boolean;
  isHalfDay: boolean;
  hasCheckIn: boolean;
  hasCheckOut: boolean;
  isLateIn: boolean;
  isEarlyOut: boolean;
}): AttendanceLogStatus {
  const {
    employeeStatus,
    isHoliday,
    isWorkDay,
    isOnLeave,
    isHalfDay,
    hasCheckIn,
    isLateIn,
    isEarlyOut
  } = params;

  if (employeeStatus === 'Exited') return 'Absent';
  if (isHoliday) return 'Holiday';
  if (!isWorkDay) return 'Weekly Off';
  if (isOnLeave) return isHalfDay ? 'Half Day' : 'On Leave';

  if (hasCheckIn) {
    if (isLateIn) return 'Late In';
    if (isEarlyOut) return 'Early Out';
    return 'Present';
  }

  return 'Absent';
}

/**
 * Calculates attendance records dynamically for a list of employees for a selected date.
 * Single source of truth: derives employee attributes from HRMS Employee.
 */
export function calculateDailyAttendance(
  employees: Employee[],
  shifts: ShiftMasterConfig[],
  existingRecords: DetailedAttendanceRecord[],
  leaveRequests: LeaveRequest[] = [],
  holidaysList: { name: string; date: string }[] = DEFAULT_COMPANY_HOLIDAYS,
  selectedDate: string = new Date().toISOString().split('T')[0]
): DetailedAttendanceRecord[] {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeShifts = Array.isArray(shifts) ? shifts : [];
  const safeRecords = Array.isArray(existingRecords) ? existingRecords : [];

  const defaultShift = safeShifts.find(s => s.status === 'Active') || {
    id: 'sh-1',
    code: 'GS-01',
    name: 'General Shift (GS)',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    workHours: 9,
    gracePeriodMins: 15,
    breakDurationMins: 60,
    isNightShift: false,
    status: 'Active'
  };

function isSameDateStr(date1: any, date2: string): boolean {
  if (!date1 || !date2) return false;
  const str1 = String(date1).split('T')[0];
  const str2 = String(date2).split('T')[0];
  if (str1 === str2) return true;
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (e) {
    return false;
  }
}

  return safeEmployees.map((emp) => {
    const empId = emp.empCode || emp.id;
    
    // Find existing logged attendance record for this employee and date
    const logged = safeRecords.find(
      r =>
        ((r as any).employeeId === empId ||
          (r as any).empId === empId ||
          (r as any).employee_id === empId ||
          (r as any).employeeId === emp.id ||
          (r as any).empId === emp.id) &&
        isSameDateStr(r.date, selectedDate)
    );

    // Find shift config
    const empShift = safeShifts.find(s => s.id === (emp as any).shiftId) || defaultShift;

    // Check holiday, weekly off, leave status
    const holidayInfo = isPublicHoliday(selectedDate, holidaysList);
    const isWorkDay = isScheduledWorkDay(selectedDate);
    const leaveInfo = isEmployeeOnLeave(empId, emp.name, selectedDate, leaveRequests);

    const isExited = emp.status === 'Exited';

    let checkIn = '-';
    let checkOut = '-';
    let workHours = 0;
    let lateMinutes = 0;
    let earlyOutMinutes = 0;
    let overtimeHours = 0;
    let isLateIn = false;
    let isEarlyOut = false;
    let location = logged?.location || 'HQ Office';
    let ipAddress = logged?.ipAddress || '192.168.1.50';
    let regStatus = logged?.regularizationStatus || 'NONE';

    const rawCheckIn = (logged as any)?.checkIn || (logged as any)?.check_in;
    const rawCheckOut = (logged as any)?.checkOut || (logged as any)?.check_out;

    if (logged && rawCheckIn && rawCheckIn !== '-' && rawCheckIn !== 'OFF') {
      checkIn = rawCheckIn;
      checkOut = (rawCheckOut && rawCheckOut !== 'OFF') ? rawCheckOut : '-';
      
      if (checkOut !== '-') {
        workHours = calculateWorkedHours(checkIn, checkOut, empShift.breakDurationMins);
      } else {
        workHours = parseFloat((logged as any).workHours || (logged as any).worked_hours) || 0;
      }

      lateMinutes = parseInt((logged as any).lateMinutes || (logged as any).late_minutes, 10) || calculateLateMinutes(checkIn, empShift.startTime, empShift.gracePeriodMins);
      isLateIn = lateMinutes > 0;

      if (checkOut !== '-') {
        earlyOutMinutes = parseInt((logged as any).earlyOutMinutes || (logged as any).early_out_minutes, 10) || calculateEarlyOutMinutes(checkOut, empShift.endTime);
        isEarlyOut = earlyOutMinutes > 0;
      }

      overtimeHours = parseFloat((logged as any).overtimeHours || (logged as any).overtime_hours) || calculateOvertimeHours(workHours, empShift.workHours);
    }

    const hasCheckIn = checkIn !== '-';
    const hasCheckOut = checkOut !== '-';

    const status = calculateAttendanceStatus({
      employeeStatus: emp.status,
      isHoliday: holidayInfo.isHoliday,
      isWorkDay,
      isOnLeave: leaveInfo.isOnLeave,
      isHalfDay: leaveInfo.isHalfDay,
      hasCheckIn,
      hasCheckOut,
      isLateIn,
      isEarlyOut
    });

    return {
      id: logged?.id || `ATT-${empId}-${selectedDate}`,
      employeeId: empId,
      empId: empId,
      empName: emp.name,
      department: emp.department,
      designation: emp.designation,
      manager: emp.manager || emp.reportingManagerName,
      date: selectedDate,
      shiftId: empShift.id,
      shiftName: empShift.name,
      checkIn: isExited ? '-' : checkIn,
      checkOut: isExited ? '-' : checkOut,
      workHours: isExited ? 0 : workHours,
      workedHours: isExited ? 0 : workHours,
      overtimeHours: isExited ? 0 : overtimeHours,
      lateMinutes: isExited ? 0 : lateMinutes,
      earlyOutMinutes: isExited ? 0 : earlyOutMinutes,
      isLateIn: isExited ? false : isLateIn,
      isEarlyOut: isExited ? false : isEarlyOut,
      status: (checkIn !== '-' && status === 'Absent') ? 'Present' : ((logged as any)?.status || status),
      location,
      ipAddress,
      regularizationStatus: regStatus
    };
  });
}

/**
 * Computes monthly summary metrics for an employee for Payroll handoff.
 */
export function calculateMonthlyAttendanceSummary(
  employeeId: string,
  empName: string,
  department: string,
  yearMonth: string, // e.g. "2026-08"
  attendanceRecords: DetailedAttendanceRecord[],
  leaveRequests: LeaveRequest[] = [],
  totalDaysInMonth: number = 31
): AttendanceMonthlySummary {
  const records = attendanceRecords.filter(
    r => (r.employeeId === employeeId || r.empId === employeeId) && r.date.startsWith(yearMonth)
  );

  let presentDays = 0;
  let lateDays = 0;
  let earlyOutDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let halfDays = 0;
  let holidayDays = 0;
  let weeklyOffDays = 0;
  let overtimeHours = 0;
  let totalWorkedHours = 0;
  let totalLateMinutes = 0;
  let totalEarlyOutMinutes = 0;

  records.forEach(r => {
    if (r.status === 'Present' || r.status === 'PRESENT') presentDays++;
    else if (r.status === 'Late In' || r.status === 'LATE_IN') { presentDays++; lateDays++; }
    else if (r.status === 'Early Out' || r.status === 'EARLY_OUT') { presentDays++; earlyOutDays++; }
    else if (r.status === 'Absent' || r.status === 'ABSENT') absentDays++;
    else if (r.status === 'On Leave' || r.status === 'ON_LEAVE') leaveDays++;
    else if (r.status === 'Half Day' || r.status === 'HALF_DAY') { halfDays++; presentDays += 0.5; }
    else if (r.status === 'Holiday' || r.status === 'HOLIDAY') holidayDays++;
    else if (r.status === 'Weekly Off' || r.status === 'WEEKLY_OFF') weeklyOffDays++;

    totalWorkedHours += r.workHours || 0;
    overtimeHours += r.overtimeHours || 0;
    totalLateMinutes += r.lateMinutes || 0;
    totalEarlyOutMinutes += r.earlyOutMinutes || 0;
  });

  return {
    employeeId,
    empName,
    department,
    month: yearMonth,
    totalDays: totalDaysInMonth,
    presentDays,
    lateDays,
    earlyOutDays,
    absentDays,
    leaveDays,
    halfDays,
    holidayDays,
    weeklyOffDays,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
    totalLateMinutes,
    totalEarlyOutMinutes
  };
}
