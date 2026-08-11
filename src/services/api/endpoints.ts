export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  CRM: {
    LEADS: '/crm/leads',
    CUSTOMERS: '/crm/customers',
    OPPORTUNITIES: '/crm/opportunities'
  },
  HRMS: {
    EMPLOYEES: '/hrms/employees',
    ATTENDANCE: '/hrms/attendance',
    LEAVE: '/hrms/leave'
  }
} as const;
