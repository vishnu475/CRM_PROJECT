import {
  Timesheet,
  TimesheetWorkEntry,
  TimesheetProof,
  TimesheetSummaryReport,
  TimesheetEmployeeReport
} from '../types';

function getAuthHeaders(overrideEmpId?: string): HeadersInit {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  let role = localStorage.getItem('crm_user_role') || 'Executive';
  let empId = overrideEmpId || localStorage.getItem('crm_employee_id');
  let userName = localStorage.getItem('crm_user_name');

  const savedProfile = localStorage.getItem('crm_user_profile');
  if (savedProfile) {
    try {
      const p = JSON.parse(savedProfile);
      if (!empId && (p.empCode || p.id)) empId = p.empCode || p.id;
      if (!userName && p.name) userName = p.name;
      if (p.role) role = p.role;
    } catch (e) {}
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': role,
    'x-employee-id': empId || '',
    'x-user-name': userName || '',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export const timesheetApi = {
  // ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────
  
  async assignTimesheet(data: {
    employee_id: string;
    start_date: string;
    end_date?: string;
    expected_hours_per_day?: number;
    proof_required?: boolean;
    allow_multiple_entries?: boolean;
    require_description?: boolean;
    instructions?: string;
  }) {
    const res = await fetch('/api/timesheets/assign', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to assign timesheet.');
    }
    return json;
  },

  async getAdminTimesheets(filters: {
    date?: string;
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    department?: string;
    status?: string;
    search?: string;
  } = {}): Promise<Timesheet[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });

    const res = await fetch(`/api/timesheets/admin?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load employee timesheets.');
    }
    return json.data || [];
  },

  async getAdminTimesheetDetail(id: string): Promise<Timesheet> {
    const res = await fetch(`/api/timesheets/admin/${id}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load timesheet details.');
    }
    return json.data;
  },

  async approveTimesheet(id: string) {
    const res = await fetch(`/api/timesheets/admin/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to approve timesheet.');
    }
    return json;
  },

  async rejectTimesheet(id: string, rejection_reason: string) {
    const res = await fetch(`/api/timesheets/admin/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejection_reason }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to reject timesheet.');
    }
    return json;
  },

  async adminUpdateTimesheet(id: string, data: {
    status?: string;
    expected_hours?: number;
    date?: string;
    rejection_reason?: string;
  }): Promise<Timesheet> {
    const res = await fetch(`/api/timesheets/admin/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update timesheet.');
    }
    return json.data;
  },

  async adminDeleteTimesheet(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/timesheets/admin/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete timesheet.');
    }
    return json;
  },

  // ─── EMPLOYEE ENDPOINTS ───────────────────────────────────────────────────────

  async getCurrentTimesheet(overrideEmpId?: string, date?: string): Promise<Timesheet | null> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const res = await fetch(`/api/timesheets/current?${params.toString()}`, {
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load current timesheet.');
    }
    return json.data || null;
  },

  async getOrCreateDraftTimesheet(date: string, overrideEmpId?: string, expected_hours = 8.0): Promise<Timesheet> {
    const res = await fetch('/api/timesheets', {
      method: 'POST',
      headers: getAuthHeaders(overrideEmpId),
      body: JSON.stringify({ date, expected_hours }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to initialize draft timesheet.');
    }
    return json.data;
  },

  async saveDraft(timesheetId: string, overrideEmpId?: string) {
    const res = await fetch(`/api/timesheets/${timesheetId}/save-draft`, {
      method: 'POST',
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to save draft.');
    }
    return json;
  },

  async getTimesheetHistory(filters: { date?: string; month?: string; status?: string } = {}, overrideEmpId?: string): Promise<Timesheet[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });

    const res = await fetch(`/api/timesheets/history?${params.toString()}`, {
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load timesheet history.');
    }
    return json.data || [];
  },

  async getTimesheetHistoryDetail(id: string, overrideEmpId?: string): Promise<Timesheet> {
    const res = await fetch(`/api/timesheets/history/${id}`, {
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load historical timesheet details.');
    }
    return json.data;
  },

  async getMyTimesheets(filters: { date?: string; month?: string; status?: string } = {}, overrideEmpId?: string): Promise<Timesheet[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });

    const res = await fetch(`/api/timesheets/my?${params.toString()}`, {
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load your timesheets.');
    }
    return json.data || [];
  },

  async getMyTimesheetDetail(id: string, overrideEmpId?: string): Promise<Timesheet> {
    const res = await fetch(`/api/timesheets/my/${id}`, {
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load timesheet.');
    }
    return json.data;
  },

  async addWorkEntry(timesheetId: string, entry: {
    start_time: string;
    end_time: string;
    work_title: string;
    work_description?: string;
  }, overrideEmpId?: string): Promise<TimesheetWorkEntry> {
    const res = await fetch(`/api/timesheets/${timesheetId}/entries`, {
      method: 'POST',
      headers: getAuthHeaders(overrideEmpId),
      body: JSON.stringify(entry),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to add work entry.');
    }
    return json.data;
  },

  async updateWorkEntry(timesheetId: string, entryId: string, entry: {
    start_time?: string;
    end_time?: string;
    work_title?: string;
    work_description?: string;
  }, overrideEmpId?: string): Promise<TimesheetWorkEntry> {
    const res = await fetch(`/api/timesheets/${timesheetId}/entries/${entryId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(overrideEmpId),
      body: JSON.stringify(entry),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update work entry.');
    }
    return json.data;
  },

  async deleteWorkEntry(timesheetId: string, entryId: string, overrideEmpId?: string) {
    const res = await fetch(`/api/timesheets/${timesheetId}/entries/${entryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete work entry.');
    }
    return json;
  },

  async uploadProof(timesheetId: string, entryId: string, file: File, overrideEmpId?: string): Promise<TimesheetProof> {
    const formData = new FormData();
    formData.append('file', file);

    const baseHeaders = getAuthHeaders(overrideEmpId) as Record<string, string>;
    const headers: Record<string, string> = {};
    if (baseHeaders['x-user-role']) headers['x-user-role'] = baseHeaders['x-user-role'];
    if (baseHeaders['x-employee-id']) headers['x-employee-id'] = baseHeaders['x-employee-id'];
    if (baseHeaders['x-user-name']) headers['x-user-name'] = baseHeaders['x-user-name'];
    if (baseHeaders['Authorization']) headers['Authorization'] = baseHeaders['Authorization'];

    const res = await fetch(`/api/timesheets/${timesheetId}/entries/${entryId}/proof`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to upload PDF proof.');
    }
    return json.data;
  },

  async deleteProof(timesheetId: string, entryId: string, overrideEmpId?: string) {
    const res = await fetch(`/api/timesheets/${timesheetId}/entries/${entryId}/proof`, {
      method: 'DELETE',
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete proof.');
    }
    return json;
  },

  async submitTimesheet(timesheetId: string, overrideEmpId?: string) {
    const res = await fetch(`/api/timesheets/${timesheetId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Timesheet submission failed.');
    }
    return json;
  },

  async reworkTimesheet(timesheetId: string, overrideEmpId?: string) {
    const res = await fetch(`/api/timesheets/${timesheetId}/rework`, {
      method: 'POST',
      headers: getAuthHeaders(overrideEmpId),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to assign rework.');
    }
    return json;
  },

  // ─── REPORTS ENDPOINTS ────────────────────────────────────────────────────────

  async getReportsSummary(filters: { month?: string; employeeId?: string; status?: string } = {}): Promise<TimesheetSummaryReport> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });

    const res = await fetch(`/api/timesheets/reports/summary?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load report summary.');
    }
    return json.data;
  },

  async getEmployeeReports(filters: { month?: string; department?: string; employeeId?: string } = {}): Promise<TimesheetEmployeeReport[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });

    const res = await fetch(`/api/timesheets/reports/employee?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load employee reports.');
    }
    return json.data || [];
  },

  // Fetch real employee list for Assignment dropdown
  async getEmployeesList(): Promise<{ id: string; emp_code: string; name: string; department: string; designation: string }[]> {
    const res = await fetch('/api/employees', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.employees)) return json.employees;
    return [];
  }
};
