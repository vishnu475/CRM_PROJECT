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
  { id: 'sh-1', code: 'GS-01', name: 'General Day Shift (GS)', startTime: '09:00 AM', endTime: '06:00 PM', workHours: 9, gracePeriodMins: 15, breakDurationMins: 60, isNightShift: false, status: 'Active' },
  { id: 'sh-2', code: 'MS-02', name: 'Morning Shift (MS)', startTime: '07:00 AM', endTime: '04:00 PM', workHours: 9, gracePeriodMins: 15, breakDurationMins: 60, isNightShift: false, status: 'Active' },
  { id: 'sh-3', code: 'ES-03', name: 'Evening Shift (ES)', startTime: '02:00 PM', endTime: '11:00 PM', workHours: 9, gracePeriodMins: 15, breakDurationMins: 60, isNightShift: false, status: 'Active' },
  { id: 'sh-4', code: 'NS-04', name: 'Night Shift (NS)', startTime: '09:00 PM', endTime: '06:00 AM', workHours: 9, gracePeriodMins: 30, breakDurationMins: 60, isNightShift: true, status: 'Active' }
];

export const defaultInitialAttendanceRecords: DetailedAttendanceRecord[] = [];

export const defaultInitialAttendanceEvents: AttendanceEvent[] = [];

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
