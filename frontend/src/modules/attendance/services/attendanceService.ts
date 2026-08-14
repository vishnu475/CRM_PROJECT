import { storageService } from '../../../services/storage/storageService';
import {
  DetailedAttendanceRecord,
  ShiftMasterConfig,
  AttendanceRegularizationRequest,
  AttendanceEvent
} from '../types';

const STORAGE_KEYS = {
  ATTENDANCE_RECORDS: 'crm_attendance_records',
  SHIFTS: 'crm_attendance_shifts',
  REGULARIZATIONS: 'crm_attendance_regularization_requests',
  EVENTS: 'crm_attendance_raw_events'
};

export const defaultInitialShifts: ShiftMasterConfig[] = [
  { id: 'sh-1', code: 'GS-01', name: 'General Shift (GS)', startTime: '09:00 AM', endTime: '06:00 PM', workHours: 9, gracePeriodMins: 15, breakDurationMins: 60, isNightShift: false, status: 'Active' },
  { id: 'sh-2', code: 'MS-02', name: 'Morning Shift (MS)', startTime: '07:00 AM', endTime: '04:00 PM', workHours: 9, gracePeriodMins: 15, breakDurationMins: 60, isNightShift: false, status: 'Active' },
  { id: 'sh-3', code: 'NS-03', name: 'Night Shift (NS)', startTime: '09:00 PM', endTime: '06:00 AM', workHours: 9, gracePeriodMins: 30, breakDurationMins: 60, isNightShift: true, status: 'Active' },
  { id: 'sh-4', code: 'ES-04', name: 'Evening Shift (ES)', startTime: '02:00 PM', endTime: '11:00 PM', workHours: 9, gracePeriodMins: 15, breakDurationMins: 60, isNightShift: false, status: 'Inactive' }
];

export const defaultInitialAttendanceRecords: DetailedAttendanceRecord[] = [
  {
    id: 'ATT-EMP-003-2026-08-13',
    employeeId: 'EMP-003',
    empId: 'EMP-003',
    empName: 'James Smith',
    department: 'Engineering',
    date: '2026-08-13',
    shiftName: 'General Shift (GS)',
    checkIn: '09:10 AM',
    checkOut: '06:30 PM',
    workHours: 8.33,
    workedHours: 8.33,
    overtimeHours: 0,
    lateMinutes: 0,
    earlyOutMinutes: 0,
    isLateIn: false,
    isEarlyOut: false,
    status: 'Present',
    location: 'HQ Office',
    ipAddress: '192.168.1.50'
  },
  {
    id: 'ATT-EMP-002-2026-08-13',
    employeeId: 'EMP-002',
    empId: 'EMP-002',
    empName: 'Robert Brown',
    department: 'Sales',
    date: '2026-08-13',
    shiftName: 'General Shift (GS)',
    checkIn: '09:45 AM',
    checkOut: '07:15 PM',
    workHours: 8.5,
    workedHours: 8.5,
    overtimeHours: 0,
    lateMinutes: 30,
    earlyOutMinutes: 0,
    isLateIn: true,
    isEarlyOut: false,
    status: 'Late In',
    location: 'HQ Office',
    ipAddress: '192.168.1.52'
  }
];

export const defaultInitialAttendanceEvents: AttendanceEvent[] = [
  {
    eventId: 'EVT-1001',
    employeeId: 'EMP-003',
    empName: 'James Smith',
    eventType: 'CHECK_IN',
    timestamp: '2026-08-13T09:10:00',
    timeString: '09:10:00 AM',
    source: 'WEB_KIOSK',
    deviceId: 'WEB-KIOSK-01',
    statusCalculated: 'Present'
  },
  {
    eventId: 'EVT-1002',
    employeeId: 'EMP-002',
    empName: 'Robert Brown',
    eventType: 'CHECK_IN',
    timestamp: '2026-08-13T09:45:00',
    timeString: '09:45:00 AM',
    source: 'WEB_KIOSK',
    deviceId: 'WEB-KIOSK-01',
    statusCalculated: 'Late In'
  }
];

export const attendanceService = {
  getAttendanceRecords: (): DetailedAttendanceRecord[] => {
    return storageService.getItem<DetailedAttendanceRecord[]>(
      STORAGE_KEYS.ATTENDANCE_RECORDS,
      defaultInitialAttendanceRecords
    );
  },

  saveAttendanceRecords: (records: DetailedAttendanceRecord[]): void => {
    storageService.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, records);
  },

  getShifts: (): ShiftMasterConfig[] => {
    return storageService.getItem<ShiftMasterConfig[]>(
      STORAGE_KEYS.SHIFTS,
      defaultInitialShifts
    );
  },

  saveShifts: (shifts: ShiftMasterConfig[]): void => {
    storageService.setItem(STORAGE_KEYS.SHIFTS, shifts);
  },

  getRegularizationRequests: (): AttendanceRegularizationRequest[] => {
    return storageService.getItem<AttendanceRegularizationRequest[]>(
      STORAGE_KEYS.REGULARIZATIONS,
      []
    );
  },

  saveRegularizationRequests: (requests: AttendanceRegularizationRequest[]): void => {
    storageService.setItem(STORAGE_KEYS.REGULARIZATIONS, requests);
  },

  getAttendanceEvents: (): AttendanceEvent[] => {
    return storageService.getItem<AttendanceEvent[]>(
      STORAGE_KEYS.EVENTS,
      defaultInitialAttendanceEvents
    );
  },

  saveAttendanceEvents: (events: AttendanceEvent[]): void => {
    storageService.setItem(STORAGE_KEYS.EVENTS, events);
  }
};
