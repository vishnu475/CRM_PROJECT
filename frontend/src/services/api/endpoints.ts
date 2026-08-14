export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  HRMS: {
    EMPLOYEES: '/api/employees',
    DEPARTMENTS: '/api/departments',
  },
  ATTENDANCE: {
    RECORDS: '/api/attendance',
    CHECK_IN: '/api/attendance/check-in',
    CHECK_OUT: '/api/attendance/check-out',
    EVENTS: '/api/attendance/events',
    REGULARIZATIONS: '/api/attendance/regularizations',
    SHIFTS: '/api/shifts',
  },
  LEAVE: {
    REQUESTS: '/api/leave',
  },
  PAYROLL: {
    RUNS: '/api/payroll',
  }
};
