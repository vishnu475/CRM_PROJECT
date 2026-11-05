import { Employee, LeaveRequest } from '../../../types';
import {
  ShiftMasterConfig,
  DetailedAttendanceRecord,
  AttendanceLogStatus,
  AttendanceMonthlySummary,
  AttendanceSummaryMetrics,
  AttendanceEvent
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
  shiftStartTime: string = '10:00 AM',
  gracePeriodMins: number = 0
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
  shiftEndTime: string = '05:00 PM'
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
 * Holiday Record Interface
 */
export interface HolidayRecord {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day: string;
  type: 'Gazetted' | 'Restricted' | 'Company';
  isMandatory: boolean;
  description: string;
}

/**
 * Timezone-safe extraction of calendar date (YYYY-MM-DD) from string or timestamp.
 * Avoids UTC timezone conversion shifts (+05:30 IST or -08:00 PST).
 */
export function extractCalendarDate(input: string): string {
  if (!input) return '';
  const match = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get weekday name for a date string in YYYY-MM-DD format deterministically.
 */
export function getDayOfWeekForDate(dateStr: string): string {
  const cal = extractCalendarDate(dateStr);
  if (!cal) return '';
  const [y, m, d] = cal.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format date into 'DD Mon YYYY' format without timezone shifts.
 */
export function formatHolidayDisplayDate(dateStr: string): string {
  const cal = extractCalendarDate(dateStr);
  if (!cal) return dateStr;
  const [y, m, d] = cal.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = String(d).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month} ${y}`;
}

/**
 * Standard list of official central government gazetted, restricted, and company holidays.
 */
export const DEFAULT_COMPANY_HOLIDAYS: HolidayRecord[] = [
  // 2025
  { id: 'HOL-2025-01', name: "New Year's Day", date: '2025-01-01', day: 'Wednesday', type: 'Restricted', isMandatory: false, description: 'Celebration of the first day of the Gregorian year' },
  { id: 'HOL-2025-02', name: 'Republic Day', date: '2025-01-26', day: 'Sunday', type: 'Gazetted', isMandatory: true, description: 'National holiday marking the adoption of the Constitution of India' },
  { id: 'HOL-2025-03', name: 'Holi', date: '2025-03-14', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Festival of colors and arrival of spring' },
  { id: 'HOL-2025-04', name: 'Id-ul-Fitr', date: '2025-03-31', day: 'Monday', type: 'Gazetted', isMandatory: true, description: 'Islamic festival marking the culmination of Ramadan' },
  { id: 'HOL-2025-05', name: 'Good Friday', date: '2025-04-18', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Christian holiday commemorating the crucifixion of Jesus Christ' },
  { id: 'HOL-2025-06', name: 'May Day / Labor Day', date: '2025-05-01', day: 'Thursday', type: 'Company', isMandatory: true, description: 'International workers day and company holiday' },
  { id: 'HOL-2025-07', name: 'Independence Day', date: '2025-08-15', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'National holiday commemorating Indian Independence from British rule in 1947' },
  { id: 'HOL-2025-08', name: "Mahatma Gandhi's Birthday / Dussehra", date: '2025-10-02', day: 'Thursday', type: 'Gazetted', isMandatory: true, description: 'Mahatma Gandhi Jayanti and Dussehra (Vijayadashami)' },
  { id: 'HOL-2025-10', name: 'Diwali (Deepavali)', date: '2025-10-20', day: 'Monday', type: 'Gazetted', isMandatory: true, description: 'Hindu festival of lights celebrating prosperity and victory of light over darkness' },
  { id: 'HOL-2025-11', name: 'Christmas Day', date: '2025-12-25', day: 'Thursday', type: 'Gazetted', isMandatory: true, description: 'Celebration of the birth of Jesus Christ' },

  // 2026 (Official Central Government Gazetted & Corporate Calendar)
  { id: 'HOL-2026-01', name: "New Year's Day", date: '2026-01-01', day: 'Thursday', type: 'Restricted', isMandatory: false, description: 'Celebration of the first day of the new Gregorian calendar year' },
  { id: 'HOL-2026-02', name: 'Makar Sankranti / Pongal', date: '2026-01-14', day: 'Wednesday', type: 'Restricted', isMandatory: false, description: 'Traditional solar harvest festival observed across India' },
  { id: 'HOL-2026-03', name: 'Republic Day', date: '2026-01-26', day: 'Monday', type: 'Gazetted', isMandatory: true, description: 'National holiday marking the formal enactment of the Constitution of India in 1950' },
  { id: 'HOL-2026-04', name: 'Maha Shivratri', date: '2026-02-15', day: 'Sunday', type: 'Restricted', isMandatory: false, description: 'Great night of Lord Shiva observed in solemn prayer and fasting' },
  { id: 'HOL-2026-05', name: 'Holi', date: '2026-03-04', day: 'Wednesday', type: 'Gazetted', isMandatory: true, description: 'National festival of colors, brotherhood, and joy celebrating spring harvest' },
  { id: 'HOL-2026-06', name: 'Id-ul-Fitr (Ramzan Id)', date: '2026-03-21', day: 'Saturday', type: 'Gazetted', isMandatory: true, description: 'Major Islamic festival marking the end of the holy month of Ramadan' },
  { id: 'HOL-2026-07', name: 'Ram Navami', date: '2026-03-26', day: 'Thursday', type: 'Gazetted', isMandatory: true, description: 'Spring Hindu festival celebrating the birth of Lord Rama' },
  { id: 'HOL-2026-08', name: 'Mahavir Jayanti', date: '2026-03-31', day: 'Tuesday', type: 'Gazetted', isMandatory: true, description: 'Birth anniversary of Bhagwan Mahavira, 24th Tirthankara of Jainism' },
  { id: 'HOL-2026-09', name: 'Good Friday', date: '2026-04-03', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Christian solemn observance of the passion and crucifixion of Jesus Christ' },
  { id: 'HOL-2026-10', name: 'Buddha Purnima / May Day', date: '2026-05-01', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Buddha Purnima and International Workers Rights Day' },
  { id: 'HOL-2026-12', name: 'Id-ul-Zuha (Bakrid)', date: '2026-05-27', day: 'Wednesday', type: 'Gazetted', isMandatory: true, description: 'Feast of the Sacrifice honoring Ibrahim readiness to sacrifice his son' },
  { id: 'HOL-2026-13', name: 'Muharram', date: '2026-06-26', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Sacred first month of the Islamic calendar and day of Ashura remembrance' },
  { id: 'HOL-2026-14', name: 'Independence Day', date: '2026-08-15', day: 'Saturday', type: 'Gazetted', isMandatory: true, description: 'National holiday commemorating 79 years of Indian Independence (1947)' },
  { id: 'HOL-2026-15', name: 'Milad-un-Nabi (Id-e-Milad)', date: '2026-08-26', day: 'Wednesday', type: 'Gazetted', isMandatory: true, description: 'Observance of the birthday of the Prophet Muhammad' },
  { id: 'HOL-2026-16', name: 'Raksha Bandhan', date: '2026-08-28', day: 'Friday', type: 'Restricted', isMandatory: false, description: 'Traditional celebration of the bond between brothers and sisters' },
  { id: 'HOL-2026-17', name: 'Janmashtami (Vaishnava)', date: '2026-09-04', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Celebration of the birth of Lord Krishna with devotional singing and fasting' },
  { id: 'HOL-2026-18', name: "Mahatma Gandhi's Birthday (Gandhi Jayanti)", date: '2026-10-02', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'National holiday honoring Mahatma Gandhi apostle of non-violence and Father of the Nation' },
  { id: 'HOL-2026-19', name: 'Company Annual Foundation Day', date: '2026-10-15', day: 'Thursday', type: 'Company', isMandatory: true, description: 'Corporate celebration of organization inception and employee milestone recognition' },
  { id: 'HOL-2026-20', name: 'Dussehra (Vijayadashami)', date: '2026-10-20', day: 'Tuesday', type: 'Gazetted', isMandatory: true, description: 'National festival celebrating the triumph of good over evil (Lord Rama over Ravana)' },
  { id: 'HOL-2026-21', name: 'Diwali (Deepavali)', date: '2026-11-08', day: 'Sunday', type: 'Gazetted', isMandatory: true, description: 'Festival of lights commemorating spiritual victory of righteousness and prosperity' },
  { id: 'HOL-2026-22', name: "Guru Nanak's Birthday", date: '2026-11-24', day: 'Tuesday', type: 'Gazetted', isMandatory: true, description: 'Gurpurab celebrating the birth anniversary of Guru Nanak Dev Ji, founder of Sikhism' },
  { id: 'HOL-2026-23', name: 'Christmas Day', date: '2026-12-25', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Celebration of the birth of Jesus Christ observed globally with peace and joy' },

  // 2027
  { id: 'HOL-2027-01', name: "New Year's Day", date: '2027-01-01', day: 'Friday', type: 'Restricted', isMandatory: false, description: 'Celebration of the first day of the Gregorian year 2027' },
  { id: 'HOL-2027-02', name: 'Republic Day', date: '2027-01-26', day: 'Tuesday', type: 'Gazetted', isMandatory: true, description: 'National holiday marking the adoption of the Constitution of India' },
  { id: 'HOL-2027-03', name: 'Id-ul-Fitr', date: '2027-03-10', day: 'Wednesday', type: 'Gazetted', isMandatory: true, description: 'Islamic festival marking the end of Ramadan' },
  { id: 'HOL-2027-04', name: 'Holi', date: '2027-03-22', day: 'Monday', type: 'Gazetted', isMandatory: true, description: 'National festival of colors and spring joy' },
  { id: 'HOL-2027-05', name: 'Good Friday', date: '2027-03-26', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Christian observance of the crucifixion of Jesus Christ' },
  { id: 'HOL-2027-06', name: 'May Day / Labor Day', date: '2027-05-01', day: 'Saturday', type: 'Company', isMandatory: true, description: 'International workers day and company holiday' },
  { id: 'HOL-2027-07', name: 'Independence Day', date: '2027-08-15', day: 'Sunday', type: 'Gazetted', isMandatory: true, description: 'National holiday commemorating 80 years of Indian Independence' },
  { id: 'HOL-2027-08', name: "Mahatma Gandhi's Birthday (Gandhi Jayanti)", date: '2027-10-02', day: 'Saturday', type: 'Gazetted', isMandatory: true, description: 'National holiday commemorating Mahatma Gandhi' },
  { id: 'HOL-2027-09', name: 'Dussehra (Vijayadashami)', date: '2027-10-10', day: 'Sunday', type: 'Gazetted', isMandatory: true, description: 'Celebration of the victory of good over evil' },
  { id: 'HOL-2027-10', name: 'Diwali (Deepavali)', date: '2027-10-29', day: 'Friday', type: 'Gazetted', isMandatory: true, description: 'Festival of lights celebrating prosperity and righteousness' },
  { id: 'HOL-2027-11', name: 'Christmas Day', date: '2027-12-25', day: 'Saturday', type: 'Gazetted', isMandatory: true, description: 'Celebration of the birth of Jesus Christ' }
];

/**
 * Filter holidays by year and category type.
 */
export function getOfficialHolidays(year?: number | string, type?: string): HolidayRecord[] {
  const targetYear = parseInt(String(year || 2026), 10) || 2026;
  let list = DEFAULT_COMPANY_HOLIDAYS.filter(h => h.date.startsWith(`${targetYear}-`));
  if (type && type !== 'All') {
    if (type === 'Gazetted') {
      list = list.filter(h => h.type === 'Gazetted' || h.isMandatory === true);
    } else if (type === 'Optional' || type === 'Restricted') {
      list = list.filter(h => h.type === 'Restricted' || h.isMandatory === false);
    } else if (type === 'Company') {
      list = list.filter(h => h.type === 'Company');
    }
  }
  return list;
}

/**
 * Check if a date string is a public or company holiday (timezone-safe).
 */
export function isPublicHoliday(
  dateStr: string,
  holidaysList: { name: string; date: string; type?: string; isMandatory?: boolean }[] = DEFAULT_COMPANY_HOLIDAYS
): { isHoliday: boolean; holidayName?: string; holidayType?: string; isMandatory?: boolean } {
  if (!dateStr) return { isHoliday: false };
  const targetCalendarDate = extractCalendarDate(dateStr);
  if (!targetCalendarDate) return { isHoliday: false };

  const found = holidaysList.find(h => {
    const hCalendarDate = extractCalendarDate(h.date);
    return hCalendarDate === targetCalendarDate;
  });

  return found
    ? { isHoliday: true, holidayName: found.name, holidayType: found.type || 'Gazetted', isMandatory: found.isMandatory !== false }
    : { isHoliday: false };
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
    const isEmp = Boolean(lr.empId && (lr.empId === employeeId || lr.empId.toLowerCase() === employeeId.toLowerCase()));
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
  selectedDate: string = new Date().toISOString().split('T')[0],
  attendanceEvents: AttendanceEvent[] = []
): DetailedAttendanceRecord[] {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeShifts = Array.isArray(shifts) ? shifts : [];
  const safeRecords = Array.isArray(existingRecords) ? existingRecords : [];
  const safeEvents = Array.isArray(attendanceEvents) ? attendanceEvents : [];

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
      r => {
        const rEmpId = (r as any).employee_id || (r as any).employeeId || (r as any).empId || (r as any).emp_code;
        const rEmpName = (r as any).emp_name || (r as any).empName || (r as any).name;

        const idMatches =
          Boolean(rEmpId) &&
          (rEmpId === empId ||
           rEmpId === emp.id ||
           rEmpId === emp.empCode ||
           String(rEmpId).toLowerCase() === String(empId).toLowerCase() ||
           String(rEmpId).toLowerCase() === String(emp.id).toLowerCase() ||
           String(rEmpId).toLowerCase() === String(emp.empCode).toLowerCase());

        const dateMatches = isSameDateStr(r.date, selectedDate);

        return idMatches && dateMatches;
      }
    );

    // Find shift config
    const empShift = safeShifts.find(s => s.id === (emp as any).shiftId) || defaultShift;

    // Check holiday, weekly off, leave status
    const holidayInfo = isPublicHoliday(selectedDate, holidaysList);
    const isWorkDay = isScheduledWorkDay(selectedDate);
    const leaveInfo = isEmployeeOnLeave(empId, emp.name, selectedDate, leaveRequests);

    const isExited = emp.status === 'Exited';
    const todayDateStr = new Date().toISOString().split('T')[0];
    const empJoiningDate = emp.joiningDate || (emp as any).joining_date;
    const empJoiningDateStr = empJoiningDate ? String(empJoiningDate).split('T')[0] : '';
    const isBeforeJoining = Boolean(empJoiningDateStr && selectedDate < empJoiningDateStr);
    const isFutureDate = Boolean(selectedDate > todayDateStr);

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
    let regStatus = logged?.regularizationStatus || (logged as any)?.regularization_status || 'NONE';

    const rawCheckIn = (logged as any)?.checkIn || (logged as any)?.check_in;
    const rawCheckOut = (logged as any)?.checkOut || (logged as any)?.check_out;

    if (!isBeforeJoining && !isFutureDate) {
      if (logged && rawCheckIn && rawCheckIn !== '-' && rawCheckIn !== 'OFF') {
        checkIn = rawCheckIn;
        checkOut = (rawCheckOut && rawCheckOut !== 'OFF') ? rawCheckOut : '-';
      }

      // Fallback to Live Attendance Events if checkIn is still '-'
      if (checkIn === '-' && safeEvents.length > 0) {
        const empEvents = safeEvents.filter(evt => {
          const matchesEmp = Boolean(evt.employeeId) && (
            evt.employeeId === empId || 
            evt.employeeId === emp.id || 
            evt.employeeId === emp.empCode ||
            String(evt.employeeId).toLowerCase() === String(empId).toLowerCase() ||
            String(evt.employeeId).toLowerCase() === String(emp.empCode).toLowerCase()
          );
          const eventDateStr = evt.timestamp ? evt.timestamp.split('T')[0] : '';
          return matchesEmp && eventDateStr && isSameDateStr(eventDateStr, selectedDate);
        });

        const inEvent = empEvents.find(e => e.eventType === 'CHECK_IN' || (e as any).punchType === 'CHECK_IN');
        if (inEvent && inEvent.timeString) {
          checkIn = inEvent.timeString;
        }

        const outEvents = empEvents.filter(e => e.eventType === 'CHECK_OUT' || (e as any).punchType === 'CHECK_OUT');
        if (outEvents.length > 0 && outEvents[outEvents.length - 1].timeString) {
          checkOut = outEvents[outEvents.length - 1].timeString;
        }
      }

      if (checkIn !== '-') {
        if (checkOut !== '-') {
          workHours = calculateWorkedHours(checkIn, checkOut, empShift.breakDurationMins);
        } else {
          workHours = parseFloat((logged as any)?.workHours || (logged as any)?.worked_hours) || 0;
        }

        lateMinutes = calculateLateMinutes(checkIn, empShift.startTime, empShift.gracePeriodMins);
        isLateIn = lateMinutes > 0;

        if (checkOut !== '-') {
          earlyOutMinutes = calculateEarlyOutMinutes(checkOut, empShift.endTime);
          isEarlyOut = earlyOutMinutes > 0;
        }

        overtimeHours = parseFloat((logged as any)?.overtimeHours || (logged as any)?.overtime_hours) || calculateOvertimeHours(workHours, empShift.workHours);
      }
    }

    const hasCheckIn = checkIn !== '-';
    const hasCheckOut = checkOut !== '-';

    let derivedStatus = calculateAttendanceStatus({
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

    if (isBeforeJoining) {
      derivedStatus = 'Not Joined' as any;
    } else if (isFutureDate) {
      derivedStatus = '-' as any;
    } else if (hasCheckIn && !leaveInfo.isOnLeave && !holidayInfo.isHoliday && isWorkDay) {
      if (isLateIn) {
        derivedStatus = 'Late In';
      } else if (hasCheckOut && isEarlyOut) {
        derivedStatus = 'Early Out';
      } else {
        derivedStatus = 'Present';
      }
    }

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
      checkIn: isExited || isBeforeJoining || isFutureDate ? '-' : checkIn,
      checkOut: isExited || isBeforeJoining || isFutureDate ? '-' : checkOut,
      workHours: isExited || isBeforeJoining || isFutureDate ? 0 : workHours,
      workedHours: isExited || isBeforeJoining || isFutureDate ? 0 : workHours,
      overtimeHours: isExited || isBeforeJoining || isFutureDate ? 0 : overtimeHours,
      lateMinutes: isExited || isBeforeJoining || isFutureDate ? 0 : lateMinutes,
      earlyOutMinutes: isExited || isBeforeJoining || isFutureDate ? 0 : earlyOutMinutes,
      isLateIn: isExited || isBeforeJoining || isFutureDate ? false : isLateIn,
      isEarlyOut: isExited || isBeforeJoining || isFutureDate ? false : isEarlyOut,
      status: isExited ? 'Absent' : derivedStatus,
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
