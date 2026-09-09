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
// HRMS — FINANCE / ACCOUNTS
// ────────────────────────────────────────────────────────────
export const AccountsAPI = {
  getCOA: () => request('GET', '/accounts/coa'),
  getJournals: () => request('GET', '/accounts/journals'),
  postJournal: (data: any) => request('POST', '/accounts/journals', data),
  getTrialBalance: () => request('GET', '/accounts/trial-balance'),
};

// ────────────────────────────────────────────────────────────
// HRMS — BANKING
// ────────────────────────────────────────────────────────────
export const BankingAPI = {
  getAccounts: () => request('GET', '/banking/accounts'),
  getTransactions: (bankAccountId?: string) => {
    const params = bankAccountId ? `?bankAccountId=${bankAccountId}` : '';
    return request('GET', `/banking/transactions${params}`);
  },
  transfer: (data: { fromAccountId: string; toAccountId: string; amount: number; description?: string; referenceNo?: string }) =>
    request('POST', '/banking/transfer', data),
};

// ────────────────────────────────────────────────────────────
// HRMS — EXPENSES
// ────────────────────────────────────────────────────────────
export const ExpensesAPI = {
  getAll: () => request('GET', '/expenses'),
  create: (data: any) => request('POST', '/expenses', data),
  approve: (id: string) => request('PATCH', `/expenses/${id}/approve`),
};

// ────────────────────────────────────────────────────────────
// HRMS — MASTER DATA (Departments, Designations, Branches)
// ────────────────────────────────────────────────────────────
export const MasterDataAPI = {
  getDepartments: () => request('GET', '/departments'),
  getDesignations: () => request('GET', '/designations'),
  getBranches: () => request('GET', '/branches'),
};

// ────────────────────────────────────────────────────────────
// HEALTH CHECK
// ────────────────────────────────────────────────────────────
export const HealthAPI = {
  check: () => request('GET', '/health'),
};

// ============================================================
// CRM DATABASE APIs — Friend 1 (crm PostgreSQL database)
// ============================================================

// ────────────────────────────────────────────────────────────
// CRM — LEADS
// ────────────────────────────────────────────────────────────
export const LeadsAPI = {
  getAll: (filters?: { stage?: string; source?: string }) => {
    const params = new URLSearchParams();
    if (filters?.stage)  params.set('stage', filters.stage);
    if (filters?.source) params.set('source', filters.source);
    return request('GET', `/leads?${params.toString()}`);
  },
  getById: (id: string) => request('GET', `/leads/${id}`),
  create:  (data: any)  => request('POST', '/leads', data),
  update:  (id: string, data: any) => request('PATCH', `/leads/${id}`, data),
  delete:  (id: string) => request('DELETE', `/leads/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — CUSTOMERS
// ────────────────────────────────────────────────────────────
export const CustomersAPI = {
  getAll: (filters?: { status?: string; industry?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status)   params.set('status', filters.status);
    if (filters?.industry) params.set('industry', filters.industry);
    return request('GET', `/customers?${params.toString()}`);
  },
  getById: (id: string) => request('GET', `/customers/${id}`),
  getHealth: (id: string) => request('GET', `/customers/${id}/health`),
  create:  (data: any)  => request('POST', '/customers', data),
  update:  (id: string, data: any) => request('PATCH', `/customers/${id}`, data),
  delete:  (id: string) => request('DELETE', `/customers/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — CONTACTS
// ────────────────────────────────────────────────────────────
export const ContactsAPI = {
  getAll:  (filters?: { customerId?: string; leadId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.leadId)     params.set('leadId', filters.leadId);
    return request('GET', `/contacts?${params.toString()}`);
  },
  create: (data: any)  => request('POST', '/contacts', data),
  update: (id: string, data: any) => request('PATCH', `/contacts/${id}`, data),
  delete: (id: string) => request('DELETE', `/contacts/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — OPPORTUNITIES
// ────────────────────────────────────────────────────────────
export const OpportunitiesAPI = {
  getAll: (filters?: { stage?: string; customerId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.stage)      params.set('stage', filters.stage);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    return request('GET', `/opportunities?${params.toString()}`);
  },
  getById: (id: string) => request('GET', `/opportunities/${id}`),
  create: (data: any)  => request('POST', '/opportunities', data),
  update: (id: string, data: any) => request('PATCH', `/opportunities/${id}`, data),
  delete: (id: string) => request('DELETE', `/opportunities/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — ACTIVITIES
// ────────────────────────────────────────────────────────────
export const CRMActivitiesAPI = {
  getAll:  (filters?: { type?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type)   params.set('type', filters.type);
    if (filters?.status) params.set('status', filters.status);
    return request('GET', `/crm/activities?${params.toString()}`);
  },
  create: (data: any)  => request('POST', '/crm/activities', data),
  update: (id: string, data: any) => request('PATCH', `/crm/activities/${id}`, data),
};

// ────────────────────────────────────────────────────────────
// CRM — QUOTATIONS
// ────────────────────────────────────────────────────────────
export const QuotationsAPI = {
  getAll: (filters?: { status?: string; customerId?: string; opportunityId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.opportunityId) params.set('opportunityId', filters.opportunityId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request('GET', `/quotations${query}`);
  },
  getById: (id: string) => request('GET', `/quotations/${id}`),
  create: (data: any) => request('POST', '/quotations', data),
  update: (id: string, data: any) => request('PATCH', `/quotations/${id}`, data),
  delete: (id: string) => request('DELETE', `/quotations/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — SALES ORDERS
// ────────────────────────────────────────────────────────────
export const SalesOrdersAPI = {
  getAll: (filters?: { fulfillmentStatus?: string; status?: string; customerId?: string; quotationId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.fulfillmentStatus) params.set('fulfillmentStatus', filters.fulfillmentStatus);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.quotationId) params.set('quotationId', filters.quotationId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request('GET', `/sales-orders${query}`);
  },
  getById: (id: string) => request('GET', `/sales-orders/${id}`),
  create: (data: any) => request('POST', '/sales-orders', data),
  update: (id: string, data: any) => request('PATCH', `/sales-orders/${id}`, data),
  delete: (id: string) => request('DELETE', `/sales-orders/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — INVOICES
// ────────────────────────────────────────────────────────────
export const CRMInvoicesAPI = {
  getAll: (filters?: { status?: string; customerId?: string; salesOrderId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.salesOrderId) params.set('salesOrderId', filters.salesOrderId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request('GET', `/crm/invoices${query}`);
  },
  getById: (id: string) => request('GET', `/crm/invoices/${id}`),
  create: (data: any) => request('POST', '/crm/invoices', data),
  update: (id: string, data: any) => request('PATCH', `/crm/invoices/${id}`, data),
  delete: (id: string) => request('DELETE', `/crm/invoices/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — PRODUCTS & INVENTORY
// ────────────────────────────────────────────────────────────
export const CRMProductsAPI = {
  getAll: (filters?: { category?: string; stockStatus?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.stockStatus) params.set('stockStatus', filters.stockStatus);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request('GET', `/crm/products${query}`);
  },
  getById: (id: string) => request('GET', `/crm/products/${id}`),
  create: (data: any) => request('POST', '/crm/products', data),
  update: (id: string, data: any) => request('PATCH', `/crm/products/${id}`, data),
  adjustStock: (id: string, data: { adjustmentQuantity: number; reason: string; notes?: string; performedBy?: string; location?: string }) =>
    request('POST', `/crm/products/${id}/adjust`, data),
  delete: (id: string) => request('DELETE', `/crm/products/${id}`),
  getAllMovements: (limit?: number) => request('GET', `/crm/products/movements/all${limit ? `?limit=${limit}` : ''}`),
};

// ────────────────────────────────────────────────────────────
// CRM — VENDORS
// ────────────────────────────────────────────────────────────
export const VendorsAPI = {
  getAll:  () => request('GET', '/vendors'),
  getById: (id: string) => request('GET', `/vendors/${id}`),
  create:  (data: any)  => request('POST', '/vendors', data),
  update:  (id: string, data: any) => request('PATCH', `/vendors/${id}`, data),
  delete:  (id: string) => request('DELETE', `/vendors/${id}`),
};

// ────────────────────────────────────────────────────────────
// CRM — PURCHASE ORDERS
// ────────────────────────────────────────────────────────────
export const PurchaseOrdersAPI = {
  getAll: (filters?: { status?: string; vendorId?: string; search?: string; receiptStatus?: string; paymentStatus?: string; invoiceStatus?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.vendorId) params.set('vendorId', filters.vendorId);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.receiptStatus) params.set('receiptStatus', filters.receiptStatus);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    if (filters?.invoiceStatus) params.set('invoiceStatus', filters.invoiceStatus);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request('GET', `/purchase-orders${query}`);
  },
  getById: (id: string) => request('GET', `/purchase-orders/${id}`),
  create: (data: any) => request('POST', '/purchase-orders', data),
  update: (id: string, data: any) => request('PATCH', `/purchase-orders/${id}`, data),
  receive: (id: string, data: { receipts: { itemId?: number; productId?: string; productName?: string; quantityReceived: number }[]; receivedBy?: string; notes?: string; date?: string }) =>
    request('POST', `/purchase-orders/${id}/receive`, data),
  invoice: (id: string, data: { invoiceNumber?: string; invoiceDate?: string; dueDate?: string; invoiceAmount?: number; taxAmount?: number; notes?: string }) =>
    request('POST', `/purchase-orders/${id}/invoice`, data),
  recordPayment: (id: string, data: { amount: number; paymentDate?: string; paymentMethod?: string; bankAccountId?: string; referenceNumber?: string; notes?: string }) =>
    request('POST', `/purchase-orders/${id}/payment`, data),
  delete: (id: string) => request('DELETE', `/purchase-orders/${id}`),
};

// ────────────────────────────────────────────────────────────
// PROJECTS — CLIENT DELIVERY
// ────────────────────────────────────────────────────────────
export const ProjectsAPI = {
  getAll: (filters?: { status?: string; customerId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request('GET', `/projects${query}`);
  },
  getById: (id: string) => request('GET', `/projects/${id}`),
  create: (data: any) => request('POST', '/projects', data),
  update: (id: string, data: any) => request('PATCH', `/projects/${id}`, data),
  delete: (id: string) => request('DELETE', `/projects/${id}`),
};



