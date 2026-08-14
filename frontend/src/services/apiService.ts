/**
 * ============================================================
 * CENTRAL API SERVICE — 100% DB-First ERP
 * ============================================================
 * 
 * Every module calls this service. Never use hardcoded arrays.
 * PostgreSQL is the single source of truth.
 * All data survives F5 refresh.
 */

const BASE_URL = '/api';

async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${path}`, options);
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error(`API ${method} ${path} failed:`, err.message);
    return { success: false, message: err.message };
  }
}

// ────────────────────────────────────────────────────────────
// HRMS — EMPLOYEES
// ────────────────────────────────────────────────────────────
export const EmployeeAPI = {
  getAll: () => request('GET', '/employees'),
  getById: (id: string) => request('GET', `/employees/${id}`),
  create: (data: any) => request('POST', '/employees', data),
  update: (id: string, data: any) => request('PUT', `/employees/${id}`, data),
  transfer: (id: string, data: any) => request('POST', `/employees/${id}/transfer`, data),
  confirm: (id: string) => request('POST', `/employees/${id}/confirm`),
  exit: (id: string, reason?: string) => request('POST', `/employees/${id}/exit`, { reason }),
  getHistory: (id: string) => request('GET', `/employees/${id}/history`),
  getLeaveBalance: (id: string) => request('GET', `/employees/${id}/leave-balance`),
};

// ────────────────────────────────────────────────────────────
// RECRUITMENT — CANDIDATES
// ────────────────────────────────────────────────────────────
export const RecruitmentAPI = {
  getCandidates: () => request('GET', '/recruitment/candidates'),
  addCandidate: (data: any) => request('POST', '/recruitment/candidates', data),
  updateStage: (id: string, stage: string) => request('PUT', `/recruitment/candidates/${id}/stage`, { stage }),
  convert: (candidateId: string, details: any) => request('POST', '/recruitment/convert', { candidateId, customDetails: details }),
};

// ────────────────────────────────────────────────────────────
// ATTENDANCE
// ────────────────────────────────────────────────────────────
export const AttendanceAPI = {
  recordEvent: (employeeId: string, eventType: 'CHECK_IN' | 'CHECK_OUT', location?: string) =>
    request('POST', '/attendance/events', { employeeId, eventType, location }),
  getRecords: (employeeId?: string, month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (employeeId) params.set('employeeId', employeeId);
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return request('GET', `/attendance/records?${params.toString()}`);
  },
  getTodayRecords: () => request('GET', '/attendance/records/today'),
  submitRegularization: (data: any) => request('POST', '/attendance/regularize', data),
  approveRegularization: (id: string, approvedBy: string) =>
    request('PATCH', `/attendance/regularize/${id}/approve`, { approvedBy }),
  rejectRegularization: (id: string, rejectedBy: string, reason: string) =>
    request('PATCH', `/attendance/regularize/${id}/reject`, { rejectedBy, reason }),
  getRegularizations: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request('GET', `/attendance/regularizations${params}`);
  },
};

// ────────────────────────────────────────────────────────────
// LEAVE
// ────────────────────────────────────────────────────────────
export const LeaveAPI = {
  getRequests: (employeeId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (employeeId) params.set('employeeId', employeeId);
    if (status) params.set('status', status);
    return request('GET', `/leave/requests?${params.toString()}`);
  },
  getBalance: (employeeId: string) => request('GET', `/leave/balance?employeeId=${employeeId}`),
  getTypes: () => request('GET', '/leave/types'),
  apply: (data: {
    employeeId: string;
    employeeName: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    days: number;
    reason: string;
    managerName?: string;
  }) => request('POST', '/leave', data),
  approve: (id: string, approvedBy: string, comments?: string) =>
    request('PATCH', `/leave/requests/${id}/approve`, { approvedBy, comments }),
  reject: (id: string, rejectedBy: string, reason: string) =>
    request('PATCH', `/leave/requests/${id}/reject`, { rejectedBy, reason }),
};

// ────────────────────────────────────────────────────────────
// PAYROLL
// ────────────────────────────────────────────────────────────
export const PayrollAPI = {
  runPayroll: (month: number, year: number, processedBy?: string) =>
    request('POST', '/payroll/run', { month, year, processedBy }),
  getRuns: () => request('GET', '/payroll/runs'),
  getPayslips: (filters?: { employeeId?: string; month?: number; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.set('employeeId', filters.employeeId);
    if (filters?.month) params.set('month', String(filters.month));
    if (filters?.year) params.set('year', String(filters.year));
    return request('GET', `/payroll/payslips?${params.toString()}`);
  },
  getPayslip: (id: string) => request('GET', `/payroll/payslip/${id}`),
  getEmployeePayslips: (employeeId: string) => request('GET', `/payroll/employee/${employeeId}`),
};

// ────────────────────────────────────────────────────────────
// ACTIVITY LOGS
// ────────────────────────────────────────────────────────────
export const ActivityAPI = {
  getAll: (module?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (module) params.set('module', module);
    params.set('limit', String(limit));
    return request('GET', `/activity?${params.toString()}`);
  },
};

// ────────────────────────────────────────────────────────────
// HEALTH CHECK
// ────────────────────────────────────────────────────────────
export const HealthAPI = {
  check: () => request('GET', '/health'),
};
