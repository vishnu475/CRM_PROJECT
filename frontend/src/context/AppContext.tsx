import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LeadsAPI,
  CustomersAPI,
  ContactsAPI,
  OpportunitiesAPI,
  CRMActivitiesAPI,
  QuotationsAPI,
  SalesOrdersAPI,
  CRMInvoicesAPI,
  CRMProductsAPI,
  VendorsAPI,
  PurchaseOrdersAPI,
  AccountsAPI,
  BankingAPI,
  ExpensesAPI,
} from '../services/apiService';
import { parseRouteFromPath, buildRoutePath } from '../app/routes';
import {
  ModuleId,
  UserRole,
  UserProfile,
  Lead,
  Customer,
  Product,
  Quotation,
  SalesOrder,
  Invoice,
  Employee,
  LeaveRequest,
  PayrollRun,
  JobCandidate,
  AccountCOA,
  JournalEntry,
  BankAccount,
  ExpenseClaim,
  PurchaseOrder,
  Vendor,
  Project,
  Task,
  HelpdeskTicket,
  DocumentFile,
  NotificationItem,
  Contact,
  Opportunity,
  Activity,
  FollowUp,
  Note,
} from '../types';
import {
  DetailedAttendanceRecord,
  ShiftMasterConfig,
  AttendanceRegularizationRequest,
  AttendanceEvent
} from '../modules/attendance/types';
import { attendanceService, defaultInitialAttendanceRecords } from '../modules/attendance/services/attendanceService';
import {
  calculateWorkedHours,
  calculateLateMinutes,
  calculateEarlyOutMinutes,
  calculateOvertimeHours,
  calculateAttendanceStatus
} from '../modules/attendance/utils/attendanceCalculator';

interface AppContextType {
  activeModule: ModuleId;
  activeSubSection: string;
  setActiveModule: (module: ModuleId, subSection?: string) => void;
  setActiveSubSection: (subSection: string) => void;
  setModuleAndSubSection: (module: ModuleId, subSection?: string) => void;
  reloadEmployeesFromDB: () => Promise<void>;
  reloadAttendanceFromDB: () => Promise<void>;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userProfile: UserProfile;
  companyName: string;
  setCompanyName: (company: string) => void;
  branchName: string;
  setBranchName: (branch: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;

  // Domain state & state setters
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Customer, 'createdAt' | 'updatedAt'>>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  opportunities: Opportunity[];
  addOpportunity: (opp: Omit<Opportunity, 'id'>) => void;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  followUps: FollowUp[];
  addFollowUp: (fu: Omit<FollowUp, 'id'>) => void;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  products: Product[];
  quotations: Quotation[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  employees: Employee[];
  addEmployee: (employeeData: Partial<Employee>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  transferEmployee: (id: string, transferData: { newDepartment: string; newDesignation?: string; newManagerName?: string; reason?: string }) => void;
  exitEmployee: (id: string, exitReason?: string) => void;
  confirmEmployee: (id: string, notes?: string) => void;
  convertCandidateToEmployee: (candidateId: string, customDetails?: Partial<Employee>) => Employee;
  attendanceRecords: DetailedAttendanceRecord[];
  shifts: ShiftMasterConfig[];
  regularizationRequests: AttendanceRegularizationRequest[];
  attendanceEvents: AttendanceEvent[];
  addAttendanceEvent: (event: AttendanceEvent) => void;
  checkIn: (employeeId: string, location?: string, ipAddress?: string) => { success: boolean; message: string };
  checkOut: (employeeId: string) => { success: boolean; message: string };
  submitRegularization: (requestData: Omit<AttendanceRegularizationRequest, 'id' | 'appliedDate' | 'status'>) => { success: boolean; message: string };
  approveRegularization: (requestId: string, reviewerName?: string) => { success: boolean; message: string };
  rejectRegularization: (requestId: string, reviewerName?: string) => { success: boolean; message: string };
  saveShiftMaster: (shiftConfig: ShiftMasterConfig) => void;
  toggleShiftStatus: (shiftId: string) => void;
  leaveRequests: LeaveRequest[];
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;
  payrollRuns: PayrollRun[];
  jobCandidates: JobCandidate[];
  accounts: AccountCOA[];
  journalEntries: JournalEntry[];
  bankAccounts: BankAccount[];
  expenseClaims: ExpenseClaim[];
  approveExpense: (id: string) => void;
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  projects: Project[];
  tasks: Task[];
  helpdeskTickets: HelpdeskTicket[];
  documents: DocumentFile[];
  addDocument: (doc: Omit<DocumentFile, 'id' | 'updatedAt'>) => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
}

const initialUserProfile: UserProfile = {
  id: 'usr_1',
  name: 'John Doe',
  email: 'john.doe@democompany.com',
  role: 'Executive',
  roleTitle: 'Administrator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  company: 'Demo Company Pvt. Ltd.',
  branch: 'Headquarters (HQ)',
};

// ============================================================
// CRM DB-FIRST: All CRM entities start EMPTY.
// Loaded from the crm PostgreSQL database via APIs on mount.
// ============================================================
const initialLeads: Lead[] = [];
const initialCustomers: Customer[] = [];
const initialContacts: Contact[] = [];
const initialOpportunities: Opportunity[] = [];
const initialActivities: Activity[] = [];
const initialFollowUps: FollowUp[] = [];
const initialNotes: Note[] = [];

// CRM Sales pipeline modules — also loaded from crm DB
const initialProducts: Product[] = [];
const initialQuotations: Quotation[] = [];
const initialSalesOrders: SalesOrder[] = [];
const initialInvoices: Invoice[] = [];
const initialVendors: Vendor[] = [];
const initialPurchaseOrders: PurchaseOrder[] = [];

// ============================================================
// HRMS DB-FIRST: Finance/Accounts modules loaded from HRMS DB
// ============================================================
const initialAccounts: AccountCOA[] = [];
const initialJournalEntries: JournalEntry[] = [];
const initialBankAccounts: BankAccount[] = [];
const initialExpenseClaims: ExpenseClaim[] = [];



// ============================================================
// DB-FIRST: Employees, Leave, Payroll, Candidates start EMPTY.
// They are loaded from PostgreSQL via GET APIs on mount.
// ============================================================
const initialEmployees: Employee[] = [];

const initialAttendanceRecords: DetailedAttendanceRecord[] = defaultInitialAttendanceRecords;

// Leave requests load from PostgreSQL on mount
const initialLeaveRequests: LeaveRequest[] = [];

// Payroll runs load from PostgreSQL on mount
const initialPayrollRuns: PayrollRun[] = [];

// Job candidates load from PostgreSQL on mount
const initialJobCandidates: JobCandidate[] = [];



const initialProjects: Project[] = [
  { id: 'PRJ-101', code: 'PRJ-101', name: 'ERP Suite Enterprise Rollout', client: 'Globex Corporation', budget: 5000000, spent: 2100000, progress: 68, status: 'In Progress' },
  { id: 'PRJ-102', code: 'PRJ-102', name: 'HRMS Cloud Migration', client: 'Initech LLC', budget: 1800000, spent: 450000, progress: 35, status: 'In Progress' },
];

const initialTasks: Task[] = [
  { id: 'TSK-01', title: 'Setup Chart of Accounts double entry rules', project: 'ERP Suite Enterprise Rollout', assignee: 'James Smith', priority: 'High', status: 'In Progress', dueDate: '2025-05-25' },
  { id: 'TSK-02', title: 'Finalize Attendance to Payroll synchronization', project: 'HRMS Cloud Migration', assignee: 'Emma Watson', priority: 'Medium', status: 'To Do', dueDate: '2025-05-28' },
];

const initialHelpdeskTickets: HelpdeskTicket[] = [
  { id: 'TCK-201', ticketNo: 'HD-8091', subject: 'Invoice PDF download alignment query', customerName: 'Globex Corporation', priority: 'Medium', status: 'Open', assignedAgent: 'Support Desk', createdAt: '1 hour ago' },
  { id: 'TCK-202', ticketNo: 'HD-8088', subject: 'Biometric Attendance sync delay', customerName: 'Initech LLC', priority: 'High', status: 'In Progress', assignedAgent: 'Tech Team', createdAt: '5 hours ago' },
];

const initialDocuments: DocumentFile[] = [
  { id: 'DOC-01', name: 'Q2_Financial_Audit_Report.pdf', category: 'Finance & Audit', linkedEntity: 'Demo Company Pvt. Ltd.', size: '4.2 MB', uploadedBy: 'Michael Brown', updatedAt: '2025-05-18' },
  { id: 'DOC-02', name: 'Master_Service_Agreement_Globex.pdf', category: 'Legal & Contracts', linkedEntity: 'Globex Corporation', size: '1.8 MB', uploadedBy: 'John Doe', updatedAt: '2025-05-19' },
];

const initialNotifications: NotificationItem[] = [
  { id: 'ntf-1', title: 'New Leave Request', message: 'Emma Watson submitted a 2-day leave application', time: '10 min ago', read: false, type: 'info' },
  { id: 'ntf-2', title: 'Payment Received', message: 'Invoice INV-2025-1024 paid ₹1,48,350 by Globex Corp', time: '1 hour ago', read: false, type: 'success' },
  { id: 'ntf-3', title: 'Attendance Alert', message: 'James Smith checked in at 09:15 AM', time: '2 hours ago', read: false, type: 'info' },
  { id: 'ntf-4', title: 'Approval Required', message: 'Purchase Order PO-2025-045 awaiting approval', time: '3 hours ago', read: false, type: 'warning' },
];

function getModuleFromPath(path: string): ModuleId {
  const cleanPath = path.replace(/^\//, '').toLowerCase();
  const validModules: ModuleId[] = [
    'dashboard', 'crm', 'sales', 'customers', 'hrms', 'attendance', 'leave',
    'payroll', 'recruitment', 'accounts', 'ledger', 'banking', 'expenses',
    'purchases', 'vendors', 'inventory', 'projects', 'tasks', 'helpdesk',
    'documents', 'reports', 'automation', 'administration', 'settings'
  ];
  if (validModules.includes(cleanPath as ModuleId)) {
    return cleanPath as ModuleId;
  }
  return 'dashboard';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModuleState] = useState<ModuleId>(() => {
    return parseRouteFromPath(window.location.pathname).module;
  });

  const [activeSubSection, setActiveSubSectionState] = useState<string>(() => {
    return parseRouteFromPath(window.location.pathname).subSection;
  });

  const setModuleAndSubSection = (module: ModuleId, subSection?: string) => {
    const targetPath = buildRoutePath(module, subSection);
    const parsed = parseRouteFromPath(targetPath);
    setActiveModuleState(parsed.module);
    setActiveSubSectionState(parsed.subSection);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ module: parsed.module, subSection: parsed.subSection }, '', targetPath);
    }
  };

  const setActiveModule = (module: ModuleId, subSection?: string) => {
    setModuleAndSubSection(module, subSection);
  };

  const setActiveSubSection = (subSection: string) => {
    setModuleAndSubSection(activeModule, subSection);
  };

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromPath(window.location.pathname);
      setActiveModuleState(parsed.module);
      setActiveSubSectionState(parsed.subSection);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [userRole, setUserRoleState] = useState<UserRole>('Executive');
  const [companyName, setCompanyName] = useState<string>('Demo Company Pvt. Ltd.');
  const [branchName, setBranchName] = useState<string>('Headquarters (HQ)');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    return localStorage.getItem('crm_auth') === 'true';
  });

  const setIsAuthenticated = (auth: boolean) => {
    localStorage.setItem('crm_auth', String(auth));
    setIsAuthenticatedState(auth);
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [attendanceRecords, setAttendanceRecords] = useState<DetailedAttendanceRecord[]>(() =>
    attendanceService.getAttendanceRecords()
  );
  const [shifts, setShifts] = useState<ShiftMasterConfig[]>(() => attendanceService.getShifts());
  const [regularizationRequests, setRegularizationRequests] = useState<AttendanceRegularizationRequest[]>(() =>
    attendanceService.getRegularizationRequests()
  );
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>(() =>
    attendanceService.getAttendanceEvents()
  );

  useEffect(() => {
    attendanceService.saveAttendanceRecords(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    attendanceService.saveShifts(shifts);
  }, [shifts]);

  useEffect(() => {
    attendanceService.saveRegularizationRequests(regularizationRequests);
  }, [regularizationRequests]);

  const reloadEmployeesFromDB = React.useCallback(async () => {
    try {
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        const empJson = await empRes.json();
        if (empJson.success && Array.isArray(empJson.data)) {
          setEmployees(empJson.data.map((e: any) => ({
            id: e.id,
            empCode: e.emp_code || e.id,
            name: e.name,
            email: e.email,
            phone: e.phone || '',
            department: e.department,
            designation: e.designation,
            joiningDate: e.joining_date ? e.joining_date.split('T')[0] : '',
            employmentType: e.employment_type || 'Full-time',
            status: e.onboarding_stage ? 
              (e.onboarding_stage.charAt(0).toUpperCase() + e.onboarding_stage.slice(1).toLowerCase()) : 
              (e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase()) : 'Joined'),
            salary: parseFloat(e.salary) || 50000,
            basicSalary: parseFloat(e.basic_salary) || 30000,
            allowances: parseFloat(e.allowances) || 20000,
            manager: e.reporting_manager_name || 'HR Manager',
            reportingManagerName: e.reporting_manager_name || 'HR Manager',
            pin: e.plain_pin || '1234'
          })));
        }
      }
    } catch (err) {
      console.warn('⚠️ Error reloading employees from DB:', err);
    }
  }, []);

  const reloadAttendanceFromDB = React.useCallback(async () => {
    try {
      // 1. Load Today's Attendance Records from PostgreSQL
      const attRes = await fetch('/api/attendance/today');
      if (attRes.ok) {
        const attJson = await attRes.json();
        if (attJson.success && Array.isArray(attJson.data)) {
          const fetchedRecords: DetailedAttendanceRecord[] = attJson.data.map((r: any) => ({
            id: r.id || `ATT-${r.employee_id}-${r.date}`,
            employeeId: r.employee_id,
            empId: r.employee_id,
            empName: r.emp_name || r.employee_id,
            department: r.department || 'Engineering',
            designation: r.designation || 'Software Engineer',
            date: r.date ? r.date.split('T')[0] : new Date().toISOString().split('T')[0],
            checkIn: r.check_in || '-',
            checkOut: r.check_out || '-',
            workHours: parseFloat(r.worked_hours) || 0,
            workedHours: parseFloat(r.worked_hours) || 0,
            lateMinutes: parseInt(r.late_minutes, 10) || 0,
            earlyOutMinutes: parseInt(r.early_out_minutes, 10) || 0,
            overtimeHours: parseFloat(r.overtime_hours) || 0,
            isLateIn: (parseInt(r.late_minutes, 10) || 0) > 0,
            isEarlyOut: (parseInt(r.early_out_minutes, 10) || 0) > 0,
            status: r.status || 'Present',
            location: 'HQ Kiosk',
            ipAddress: '192.168.1.50',
            regularizationStatus: 'NONE'
          }));

          setAttendanceRecords(prev => {
            const merged = [...prev];
            fetchedRecords.forEach(fr => {
              const idx = merged.findIndex(m => (m.employeeId === fr.employeeId || m.empId === fr.employeeId) && m.date === fr.date);
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...fr };
              } else {
                merged.unshift(fr);
              }
            });
            return merged;
          });
        }
      }

      // 2. Load Real-time Live Stream Events from PostgreSQL
      const liveRes = await fetch('/api/attendance/live');
      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        if (liveJson.success && Array.isArray(liveJson.data)) {
          const fetchedEvents: AttendanceEvent[] = liveJson.data.map((ev: any) => ({
            eventId: ev.id || `EVT-${Date.now()}-${Math.random()}`,
            employeeId: ev.employee_id,
            empName: ev.emp_name || ev.employee_id,
            department: ev.department || 'Engineering',
            eventType: ev.event_type || (ev.punch_type ? ev.punch_type : 'CHECK_IN'),
            timestamp: ev.timestamp,
            timeString: ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '09:00:00 AM',
            source: ev.source || 'WEB_KIOSK',
            deviceId: ev.device_id || 'WEB-KIOSK-01',
            statusCalculated: ev.status || 'Present'
          }));
          setAttendanceEvents(fetchedEvents);
        }
      }
    } catch (err) {
      console.warn('⚠️ Error reloading attendance from DB:', err);
    }
  }, []);

  // ============================================================
  // DB-FIRST: Load ALL business data from PostgreSQL on mount.
  // HRMS data → HRMS database | CRM data → crm database
  // Refreshing the browser restores exact state from database.
  // ============================================================
  useEffect(() => {
    async function syncFromDatabase() {
      // ── HRMS Database Sync (Friend 2) ─────────────────────
      try {
        // 1. Load Employees from HRMS PostgreSQL
        await reloadEmployeesFromDB();

        // 2. Load Leave Requests from HRMS PostgreSQL
        const leaveRes = await fetch('/api/leave/requests');
        if (leaveRes.ok) {
          const leaveJson = await leaveRes.json();
          if (leaveJson.success && Array.isArray(leaveJson.data)) {
            setLeaveRequests(leaveJson.data.map((r: any) => ({
              id: r.id,
              empName: r.employee_name || r.employee_id,
              department: r.department || '',
              leaveType: r.leave_type,
              startDate: r.from_date ? r.from_date.split('T')[0] : '',
              endDate: r.to_date ? r.to_date.split('T')[0] : '',
              days: r.days,
              reason: r.reason || '',
              status: r.status === 'APPROVED' ? 'Approved' : r.status === 'REJECTED' ? 'Rejected' : 'Pending',
              appliedDate: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
            })));
          }
        }

        // 3. Load Payroll Runs from HRMS PostgreSQL
        const payrollRes = await fetch('/api/payroll/runs');
        if (payrollRes.ok) {
          const payrollJson = await payrollRes.json();
          if (payrollJson.success && Array.isArray(payrollJson.data)) {
            setPayrollRuns(payrollJson.data.map((r: any) => ({
              id: r.id,
              month: `${new Date(2020, r.month - 1).toLocaleString('default', { month: 'long' })} ${r.year}`,
              totalEmployees: r.total_employees,
              grossAmount: parseFloat(r.total_gross),
              totalDeductions: parseFloat(r.total_deductions),
              netPay: parseFloat(r.total_net),
              status: r.status
            })));
          }
        }

        // 4. Load Shifts from HRMS PostgreSQL
        const shiftRes = await fetch('/api/shifts');
        if (shiftRes.ok) {
          const shiftJson = await shiftRes.json();
          if (shiftJson.success && Array.isArray(shiftJson.data) && shiftJson.data.length > 0) {
            setShifts(shiftJson.data.map((s: any) => ({
              id: s.id,
              name: s.name,
              code: s.code || s.id,
              startTime: s.start_time,
              endTime: s.end_time,
              gracePeriodMins: s.grace_period_mins || 15,
              workHours: parseFloat(s.work_hours) || 9,
              status: s.is_active ? 'Active' : 'Inactive'
            })));
          }
        }

        // 5. Load Candidates from HRMS PostgreSQL
        const canRes = await fetch('/api/recruitment/candidates');
        if (canRes.ok) {
          const canJson = await canRes.json();
          if (canJson.success && Array.isArray(canJson.data)) {
            setJobCandidates(canJson.data);
          }
        }

        // 6. Load Today's Attendance & Live Events from HRMS PostgreSQL
        await reloadAttendanceFromDB();

        // 7. Load Chart of Accounts (COA) from HRMS PostgreSQL
        const coaRes = await AccountsAPI.getCOA();
        if (coaRes.success && Array.isArray(coaRes.data)) {
          setAccounts(coaRes.data.map((r: any) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            type: r.type || 'Asset',
            balance: parseFloat(r.balance) || 0,
          })));
        }

        // 8. Load Bank Accounts from HRMS PostgreSQL
        const bankRes = await BankingAPI.getAccounts();
        if (bankRes.success && Array.isArray(bankRes.data)) {
          setBankAccounts(bankRes.data.map((r: any) => ({
            id: r.id,
            bankName: r.bank_name,
            accountNumber: r.account_number,
            accountType: r.account_type || 'Current',
            balance: parseFloat(r.balance) || 0,
            currency: 'INR',
          })));
        }

        // 9. Load Journal Entries from HRMS PostgreSQL
        const jrnRes = await AccountsAPI.getJournals();
        if (jrnRes.success && Array.isArray(jrnRes.data)) {
          setJournalEntries(jrnRes.data.map((r: any) => ({
            id: r.id,
            entryNumber: r.voucher_no || r.id,
            date: r.entry_date ? r.entry_date.split('T')[0] : '',
            narration: r.narration || '',
            debitTotal: parseFloat(r.total_debit) || 0,
            creditTotal: parseFloat(r.total_credit) || 0,
            status: r.status === 'POSTED' ? 'Posted' : 'Draft',
          })));
        }

        // 10. Load Expense Claims from HRMS PostgreSQL
        const expRes = await ExpensesAPI.getAll();
        if (expRes.success && Array.isArray(expRes.data)) {
          setExpenseClaims(expRes.data.map((r: any) => ({
            id: r.id,
            claimNumber: r.expense_no || r.id,
            empName: r.employee_id || 'Staff Member',
            category: r.category || 'General',
            amount: parseFloat(r.amount) || 0,
            date: r.expense_date ? r.expense_date.split('T')[0] : '',
            department: r.department || 'Operations',
            status: r.status === 'APPROVED' ? 'Approved' : r.status === 'REIMBURSED' ? 'Reimbursed' : 'Pending',
          })));
        }
      } catch (err) {
        console.warn('⚠️ HRMS DB sync notice:', err);
      }

      // ── CRM Database Sync (Friend 1) ───────────────────────
      try {
        // 11. Load Leads from CRM PostgreSQL
        const leadsRes = await LeadsAPI.getAll();
        if (leadsRes.success && Array.isArray(leadsRes.data)) {
          setLeads(leadsRes.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            company: r.company || '',
            email: r.email || '',
            phone: r.phone || '',
            value: parseFloat(r.value) || 0,
            stage: r.stage || 'New',
            score: parseInt(r.score) || 50,
            source: r.source || 'Manual/Other',
            assignedTo: r.assigned_to || '',
            createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
          })));
        }

        // 12. Load Customers from CRM PostgreSQL
        const custsRes = await CustomersAPI.getAll();
        if (custsRes.success && Array.isArray(custsRes.data)) {
          setCustomers(custsRes.data.map((r: any) => ({
            id: r.id,
            customerCode: r.customer_code || r.id,
            customerName: r.customer_name,
            customerType: r.customer_type || 'Company',
            industry: r.industry || '',
            ownerId: r.owner_id || '',
            status: r.status || 'Active',
            primaryContact: {
              name: r.contact_name || '',
              email: r.contact_email || '',
              phone: r.contact_phone || '',
            },
            billingAddress: {
              city: r.billing_city || '',
              country: r.billing_country || '',
            },
            creditLimit: parseFloat(r.credit_limit) || 0,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString(),
          })));
        }

        // 13. Load Contacts from CRM PostgreSQL
        const contactsRes = await ContactsAPI.getAll();
        if (contactsRes.success && Array.isArray(contactsRes.data)) {
          setContacts(contactsRes.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            customerId: r.customer_id || '',
            customerName: r.company || '',
            designation: r.title || '',
            email: r.email || '',
            phone: r.phone || '',
            owner: '',
            lastInteraction: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
            status: 'Active' as const,
          })));
        }

        // 14. Load Opportunities from CRM PostgreSQL
        const oppsRes = await OpportunitiesAPI.getAll();
        if (oppsRes.success && Array.isArray(oppsRes.data)) {
          setOpportunities(oppsRes.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            customerId: r.customer_id || '',
            customerName: r.customer_name || '',
            value: parseFloat(r.value) || 0,
            probability: parseInt(r.probability) || 50,
            expectedClose: r.expected_close ? r.expected_close.split('T')[0] : '',
            owner: r.owner || '',
            stage: r.stage || 'New',
          })));
        }

        // 15. Load Activities from CRM PostgreSQL
        const activitiesRes = await CRMActivitiesAPI.getAll();
        if (activitiesRes.success && Array.isArray(activitiesRes.data)) {
          setActivities(activitiesRes.data.map((r: any) => ({
            id: r.id,
            title: r.title,
            type: r.type || 'Task',
            relatedTo: r.related_to || '',
            assignedTo: r.assigned_to || '',
            dueDate: r.due_date || '',
            priority: r.priority || 'Medium',
            status: r.status || 'Pending',
            outcome: r.outcome || '',
          })));
        }

        // 16. Load Products Catalog from CRM PostgreSQL
        const productsRes = await CRMProductsAPI.getAll();
        if (productsRes.success && Array.isArray(productsRes.data)) {
          setProducts(productsRes.data.map((r: any) => ({
            id: r.id,
            sku: r.sku || r.id,
            name: r.name,
            category: r.category || 'General',
            price: parseFloat(r.price) || 0,
            stock: parseInt(r.stock) || 0,
            uom: r.uom || 'Units',
            hsnCode: r.hsn_code || '',
            taxRate: parseFloat(r.tax_rate) || 18,
          })));
        }

        // 17. Load Quotations from CRM PostgreSQL
        const quotesRes = await QuotationsAPI.getAll();
        if (quotesRes.success && Array.isArray(quotesRes.data)) {
          setQuotations(quotesRes.data.map((r: any) => ({
            id: r.id,
            quoteNumber: r.quote_number || r.id,
            customerId: r.customer_id || '',
            customerName: r.customer_name || '',
            date: r.date ? r.date.split('T')[0] : '',
            validUntil: r.valid_until ? r.valid_until.split('T')[0] : '',
            amount: parseFloat(r.amount) || 0,
            status: r.status || 'Draft',
            itemsCount: parseInt(r.items_count) || 1,
          })));
        }

        // 18. Load Sales Orders from CRM PostgreSQL
        const soRes = await SalesOrdersAPI.getAll();
        if (soRes.success && Array.isArray(soRes.data)) {
          setSalesOrders(soRes.data.map((r: any) => ({
            id: r.id,
            soNumber: r.so_number || r.id,
            customerName: r.customer_name || '',
            date: r.date ? r.date.split('T')[0] : '',
            totalAmount: parseFloat(r.total_amount) || 0,
            fulfillmentStatus: r.fulfillment_status || 'Pending',
          })));
        }

        // 19. Load Invoices from CRM PostgreSQL
        const invRes = await CRMInvoicesAPI.getAll();
        if (invRes.success && Array.isArray(invRes.data)) {
          setInvoices(invRes.data.map((r: any) => ({
            id: r.id,
            invoiceNumber: r.invoice_number || r.id,
            customerName: r.customer_name || '',
            date: r.date ? r.date.split('T')[0] : '',
            dueDate: r.due_date ? r.due_date.split('T')[0] : '',
            amount: parseFloat(r.amount) || 0,
            paidAmount: parseFloat(r.paid_amount) || 0,
            status: r.status || 'Draft',
          })));
        }

        // 20. Load Vendors from CRM PostgreSQL
        const vndRes = await VendorsAPI.getAll();
        if (vndRes.success && Array.isArray(vndRes.data)) {
          setVendors(vndRes.data.map((r: any) => ({
            id: r.id,
            code: r.code || r.id,
            name: r.name,
            contactPerson: r.contact_person || '',
            email: r.email || '',
            phone: r.phone || '',
            payableBalance: parseFloat(r.payable_balance) || 0,
            rating: parseFloat(r.rating) || 5,
          })));
        }

        // 21. Load Purchase Orders from CRM PostgreSQL
        const poRes = await PurchaseOrdersAPI.getAll();
        if (poRes.success && Array.isArray(poRes.data)) {
          setPurchaseOrders(poRes.data.map((r: any) => ({
            id: r.id,
            poNumber: r.po_number || r.id,
            vendorName: r.vendor_name || r.vendor_name_resolved || '',
            date: r.date ? r.date.split('T')[0] : '',
            amount: parseFloat(r.amount) || 0,
            status: r.status || 'Draft',
          })));
        }
      } catch (err) {
        console.warn('⚠️ CRM DB sync notice:', err);
      }
    }
    syncFromDatabase();
  }, []);

  const addAttendanceEvent = (evt: AttendanceEvent) => {
    setAttendanceEvents(prev => [evt, ...prev]);
  };

  const checkIn = (employeeId: string, location: string = 'HQ Office', ipAddress: string = '192.168.1.50') => {
    const emp = employees.find(e => e.id === employeeId || e.empCode === employeeId);
    if (!emp) {
      return { success: false, message: 'Employee not found.' };
    }
    if (emp.status === 'Exited') {
      return { success: false, message: 'You are not eligible for attendance (Employee Exited/Inactive).' };
    }

    const today = new Date().toISOString().split('T')[0];
    const existingIndex = attendanceRecords.findIndex(
      r => (r.employeeId === employeeId || r.empId === employeeId) && r.date === today
    );

    if (existingIndex >= 0) {
      const existing = attendanceRecords[existingIndex];
      if (existing.checkIn && existing.checkIn !== '-') {
        return { success: false, message: `Already checked in at ${existing.checkIn}` };
      }
    }

    const empShift = shifts.find(s => s.id === (emp as any).shiftId) || shifts[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lateMins = calculateLateMinutes(nowTime, empShift.startTime, empShift.gracePeriodMins);

    const newRecord: DetailedAttendanceRecord = {
      id: `ATT-${emp.empCode || emp.id}-${today}`,
      employeeId: emp.empCode || emp.id,
      empId: emp.empCode || emp.id,
      empName: emp.name,
      department: emp.department,
      designation: emp.designation,
      manager: emp.manager || emp.reportingManagerName,
      date: today,
      shiftId: empShift.id,
      shiftName: empShift.name,
      checkIn: nowTime,
      checkOut: '-',
      workHours: 0,
      workedHours: 0,
      overtimeHours: 0,
      lateMinutes: lateMins,
      earlyOutMinutes: 0,
      isLateIn: lateMins > 0,
      isEarlyOut: false,
      status: lateMins > 0 ? 'Late In' : 'Present',
      location,
      ipAddress,
      regularizationStatus: 'NONE'
    };

    if (existingIndex >= 0) {
      setAttendanceRecords(prev => prev.map((r, idx) => (idx === existingIndex ? { ...r, ...newRecord } : r)));
    } else {
      setAttendanceRecords(prev => [newRecord, ...prev]);
    }

    return { success: true, message: `Checked in successfully at ${nowTime}` };
  };

  const checkOut = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId || e.empCode === employeeId);
    if (!emp) {
      return { success: false, message: 'Employee not found.' };
    }
    if (emp.status === 'Exited') {
      return { success: false, message: 'You are not eligible for attendance (Employee Exited/Inactive).' };
    }

    const today = new Date().toISOString().split('T')[0];
    const existingIndex = attendanceRecords.findIndex(
      r => (r.employeeId === employeeId || r.empId === employeeId) && r.date === today
    );

    if (existingIndex < 0 || !attendanceRecords[existingIndex].checkIn || attendanceRecords[existingIndex].checkIn === '-') {
      return { success: false, message: 'No active check-in found for today. Please check in first.' };
    }

    const existing = attendanceRecords[existingIndex];
    if (existing.checkOut && existing.checkOut !== '-') {
      return { success: false, message: `Already checked out at ${existing.checkOut}` };
    }

    const empShift = shifts.find(s => s.id === existing.shiftId) || shifts[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const workedHours = calculateWorkedHours(existing.checkIn, nowTime, empShift.breakDurationMins);
    const earlyOutMins = calculateEarlyOutMinutes(nowTime, empShift.endTime);
    const otHours = calculateOvertimeHours(workedHours, empShift.workHours);
    const isEarly = earlyOutMins > 0;

    let finalStatus: DetailedAttendanceRecord['status'] = existing.status;
    if (existing.isLateIn) {
      finalStatus = 'Late In';
    } else if (isEarly) {
      finalStatus = 'Early Out';
    } else {
      finalStatus = 'Present';
    }

    const updatedRecord: DetailedAttendanceRecord = {
      ...existing,
      checkOut: nowTime,
      workHours: workedHours,
      workedHours: workedHours,
      overtimeHours: otHours,
      earlyOutMinutes: earlyOutMins,
      isEarlyOut: isEarly,
      status: finalStatus
    };

    setAttendanceRecords(prev => prev.map((r, idx) => (idx === existingIndex ? updatedRecord : r)));
    return { success: true, message: `Checked out successfully at ${nowTime}. Worked: ${workedHours} hrs.` };
  };

  const submitRegularization = (
    reqData: Omit<AttendanceRegularizationRequest, 'id' | 'appliedDate' | 'status'>
  ) => {
    const emp = employees.find(e => e.id === reqData.employeeId || e.empCode === reqData.employeeId);
    const newReq: AttendanceRegularizationRequest = {
      ...reqData,
      id: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
      empName: emp ? emp.name : reqData.empName || reqData.employeeId,
      status: 'PENDING',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    setRegularizationRequests(prev => [newReq, ...prev]);

    setAttendanceRecords(prev =>
      prev.map(r =>
        (r.employeeId === reqData.employeeId || r.empId === reqData.employeeId) && r.date === reqData.date
          ? { ...r, regularizationStatus: 'PENDING' }
          : r
      )
    );

    return { success: true, message: 'Regularization request submitted and pending review.' };
  };

  const approveRegularization = (requestId: string, reviewerName: string = 'HR Admin') => {
    const req = regularizationRequests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    setRegularizationRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'APPROVED', reviewedBy: reviewerName } : r))
    );

    const emp = employees.find(e => e.id === req.employeeId || e.empCode === req.employeeId);
    const empShift = shifts[0];
    const worked = calculateWorkedHours(req.requestedCheckIn, req.requestedCheckOut, empShift.breakDurationMins);
    const late = calculateLateMinutes(req.requestedCheckIn, empShift.startTime, empShift.gracePeriodMins);
    const early = calculateEarlyOutMinutes(req.requestedCheckOut, empShift.endTime);
    const ot = calculateOvertimeHours(worked, empShift.workHours);

    setAttendanceRecords(prev => {
      const exists = prev.some(
        r => (r.employeeId === req.employeeId || r.empId === req.employeeId) && r.date === req.date
      );

      if (exists) {
        return prev.map(r => {
          if ((r.employeeId === req.employeeId || r.empId === req.employeeId) && r.date === req.date) {
            return {
              ...r,
              checkIn: req.requestedCheckIn,
              checkOut: req.requestedCheckOut,
              workHours: worked,
              workedHours: worked,
              lateMinutes: late,
              earlyOutMinutes: early,
              overtimeHours: ot,
              isLateIn: late > 0,
              isEarlyOut: early > 0,
              status: late > 0 ? 'Late In' : early > 0 ? 'Early Out' : 'Present',
              regularizationStatus: 'APPROVED'
            };
          }
          return r;
        });
      } else {
        const newRecord: DetailedAttendanceRecord = {
          id: `ATT-${req.employeeId}-${req.date}`,
          employeeId: req.employeeId,
          empId: req.employeeId,
          empName: emp ? emp.name : req.empName,
          department: emp ? emp.department : 'General',
          date: req.date,
          shiftName: empShift.name,
          checkIn: req.requestedCheckIn,
          checkOut: req.requestedCheckOut,
          workHours: worked,
          workedHours: worked,
          overtimeHours: ot,
          lateMinutes: late,
          earlyOutMinutes: early,
          isLateIn: late > 0,
          isEarlyOut: early > 0,
          status: late > 0 ? 'Late In' : early > 0 ? 'Early Out' : 'Present',
          location: 'HQ Office',
          regularizationStatus: 'APPROVED'
        };
        return [newRecord, ...prev];
      }
    });

    return { success: true, message: 'Regularization request approved and attendance record updated.' };
  };

  const rejectRegularization = (requestId: string, reviewerName: string = 'HR Admin') => {
    setRegularizationRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'REJECTED', reviewedBy: reviewerName } : r))
    );
    return { success: true, message: 'Regularization request rejected.' };
  };

  const saveShiftMaster = (shiftConfig: ShiftMasterConfig) => {
    setShifts(prev => {
      const idx = prev.findIndex(s => s.id === shiftConfig.id);
      if (idx >= 0) {
        return prev.map((s, i) => (i === idx ? { ...s, ...shiftConfig } : s));
      }
      return [...prev, shiftConfig];
    });
  };

  const toggleShiftStatus = (shiftId: string) => {
    setShifts(prev =>
      prev.map(s => (s.id === shiftId ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s))
    );
  };
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(initialPayrollRuns);
  const [jobCandidates, setJobCandidates] = useState<JobCandidate[]>(initialJobCandidates);
  const [accounts, setAccounts] = useState<AccountCOA[]>(initialAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(initialExpenseClaims);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [projects] = useState<Project[]>(initialProjects);
  const [tasks] = useState<Task[]>(initialTasks);
  const [helpdeskTickets] = useState<HelpdeskTicket[]>(initialHelpdeskTickets);
  const [documents, setDocuments] = useState<DocumentFile[]>(initialDocuments);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Sync user profile when user role changes
  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    const roleTitles: Record<UserRole, { name: string; title: string }> = {
      Executive: { name: 'John Doe', title: 'Administrator' },
      SalesManager: { name: 'Robert Vance', title: 'Sales VP / Manager' },
      SalesExecutive: { name: 'Sarah Johnson', title: 'Senior Sales Exec' },
      HRAdmin: { name: 'Emma Watson', title: 'HR Manager' },
      FinanceAccountant: { name: 'Michael Brown', title: 'Chief Accountant' },
      OperationsManager: { name: 'David Wallace', title: 'Operations Lead' },
      Employee: { name: 'James Smith', title: 'Senior Software Eng.' },
      Customer: { name: 'Globex Corp', title: 'Customer Admin' },
      Vendor: { name: 'Office Supplies Ltd', title: 'Vendor Portal' },
    };
    setUserProfile((prev) => ({
      ...prev,
      role,
      name: roleTitles[role]?.name || 'John Doe',
      roleTitle: roleTitles[role]?.title || role,
    }));
  };

  // ============================================================
  // CRM Mutations — Optimistic UI update + persist to crm DB
  // ============================================================

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const tempId = `LD-${Date.now()}`;
    const newLead: Lead = { ...leadData, id: tempId, createdAt: 'Just now' };
    setLeads((prev) => [newLead, ...prev]); // Optimistic
    try {
      const res = await LeadsAPI.create({
        id: tempId,
        name: leadData.name,
        company: leadData.company,
        email: leadData.email,
        phone: leadData.phone,
        value: leadData.value,
        stage: leadData.stage,
        score: leadData.score,
        source: leadData.source,
        assignedTo: leadData.assignedTo,
      });
      if (res.success && res.data) {
        setLeads((prev) => prev.map((l) => l.id === tempId ? { ...newLead, id: res.data.id } : l));
      }
    } catch (err) { console.warn('⚠️ [CRM] addLead failed:', err); }
  }, []);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l))); // Optimistic
    try {
      await LeadsAPI.update(id, {
        stage: updates.stage,
        score: updates.score,
        value: updates.value,
        assigned_to: updates.assignedTo,
      });
    } catch (err) { console.warn('⚠️ [CRM] updateLead failed:', err); }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id)); // Optimistic
    try { await LeadsAPI.delete(id); }
    catch (err) { console.warn('⚠️ [CRM] deleteLead failed:', err); }
  }, []);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Customer, 'createdAt' | 'updatedAt'>>) => {
    const now = new Date().toISOString();
    const tempId = `CUST-${Date.now()}`;
    const newCust: Customer = { createdAt: now, updatedAt: now, ...customer, id: tempId };
    setCustomers((prev) => [newCust, ...prev]); // Optimistic
    try {
      await CustomersAPI.create({
        id: tempId,
        customerCode: (customer as any).customerCode || tempId,
        customerName: customer.customerName,
        customerType: customer.customerType,
        industry: customer.industry,
        ownerId: customer.ownerId,
        status: customer.status,
        creditLimit: customer.creditLimit,
        contactName: customer.primaryContact?.name,
        contactEmail: customer.primaryContact?.email,
        contactPhone: customer.primaryContact?.phone,
        billingCity: customer.billingAddress?.city,
        billingCountry: customer.billingAddress?.country,
      });
    } catch (err) { console.warn('⚠️ [CRM] addCustomer failed:', err); }
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c))); // Optimistic
    try {
      await CustomersAPI.update(id, {
        customerName: updates.customerName,
        customerType: updates.customerType,
        industry: updates.industry,
        status: updates.status,
        creditLimit: updates.creditLimit,
        contactName: updates.primaryContact?.name,
        contactEmail: updates.primaryContact?.email,
        contactPhone: updates.primaryContact?.phone,
        billingCity: updates.billingAddress?.city,
        billingCountry: updates.billingAddress?.country,
      });
    } catch (err) { console.warn('⚠️ [CRM] updateCustomer failed:', err); }
  }, []);

  const addContact = useCallback(async (contact: Omit<Contact, 'id'>) => {
    const tempId = `CON-${Date.now()}`;
    setContacts((prev) => [{ ...contact, id: tempId }, ...prev]); // Optimistic
    try { await ContactsAPI.create({ id: tempId, ...contact }); }
    catch (err) { console.warn('⚠️ [CRM] addContact failed:', err); }
  }, []);

  const addOpportunity = useCallback(async (opp: Omit<Opportunity, 'id'>) => {
    const tempId = `OPP-${Date.now()}`;
    setOpportunities((prev) => [{ ...opp, id: tempId }, ...prev]); // Optimistic
    try {
      await OpportunitiesAPI.create({
        id: tempId,
        name: opp.name,
        customerId: opp.customerId,
        customerName: opp.customerName,
        value: opp.value,
        probability: opp.probability,
        expectedClose: opp.expectedClose,
        owner: opp.owner,
        stage: opp.stage,
      });
    } catch (err) { console.warn('⚠️ [CRM] addOpportunity failed:', err); }
  }, []);

  const updateOpportunity = useCallback(async (id: string, updates: Partial<Opportunity>) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o))); // Optimistic
    try {
      await OpportunitiesAPI.update(id, {
        name: updates.name,
        value: updates.value,
        probability: updates.probability,
        expectedClose: updates.expectedClose,
        stage: updates.stage,
        owner: updates.owner,
      });
    } catch (err) { console.warn('⚠️ [CRM] updateOpportunity failed:', err); }
  }, []);

  const addActivity = useCallback(async (activity: Omit<Activity, 'id'>) => {
    const tempId = `ACT-${Date.now()}`;
    setActivities((prev) => [{ ...activity, id: tempId }, ...prev]); // Optimistic
    try {
      await CRMActivitiesAPI.create({
        id: tempId,
        title: activity.title,
        type: activity.type,
        relatedTo: activity.relatedTo,
        assignedTo: activity.assignedTo,
        dueDate: activity.dueDate,
        priority: activity.priority,
        status: activity.status,
        outcome: activity.outcome,
      });
    } catch (err) { console.warn('⚠️ [CRM] addActivity failed:', err); }
  }, []);

  const addFollowUp = (fu: Omit<FollowUp, 'id'>) => {
    setFollowUps((prev) => [{ ...fu, id: `FU-${Date.now()}` }, ...prev]);
  };

  const updateFollowUp = (id: string, updates: Partial<FollowUp>) => {
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    setNotes((prev) => [{ ...note, id: `NOTE-${Date.now()}`, createdAt: now, updatedAt: now }, ...prev]);
  };

  const addDocument = (doc: Omit<DocumentFile, 'id' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    setDocuments((prev) => [{ ...doc, id: `DOC-${Math.floor(100 + Math.random() * 900)}`, updatedAt: now }, ...prev]);
  };


  const approveLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item))
    );
  };

  const rejectLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Rejected' } : item))
    );
  };

  const approveExpense = (id: string) => {
    setExpenseClaims((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item))
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const addEmployee = (empData: Partial<Employee>): Employee => {
    const nextNum = employees.length + 1;
    const empCode = empData.empCode || empData.id || `EMP-${String(nextNum).padStart(3, '0')}`;
    const newEmp: Employee = {
      id: empCode,
      empCode,
      name: empData.name || 'New Employee',
      email: empData.email || `${empCode.toLowerCase()}@democompany.com`,
      phone: empData.phone || '+91 98765 00000',
      department: empData.department || 'General',
      designation: empData.designation || 'Staff',
      joiningDate: empData.joiningDate || new Date().toISOString().split('T')[0],
      employmentType: empData.employmentType || 'Full-time',
      salary: empData.salary || 80000,
      status: empData.status || 'Joined',
      manager: empData.manager || 'John Doe',
      reportingManagerName: empData.reportingManagerName || empData.manager || 'John Doe',
      history: [
        {
          id: `HIST-${Date.now()}`,
          employeeId: empCode,
          changeDate: new Date().toISOString().split('T')[0],
          changeType: 'Status Change',
          newStatus: empData.status || 'Joined',
          reason: 'Initial employee master creation',
        }
      ]
    };
    setEmployees(prev => [...prev, newEmp]);

    // Save permanently to PostgreSQL database via API
    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmp)
    }).catch(err => console.warn('Database save error:', err));

    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id || emp.empCode === id ? { ...emp, ...updates } : emp));

    // Update permanently in PostgreSQL database via API
    fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.warn('Database update error:', err));
  };

  const transferEmployee = (
    id: string, 
    transferData: { newDepartment: string; newDesignation?: string; newManagerName?: string; reason?: string }
  ) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id && emp.empCode !== id) return emp;

      const changeRecord = {
        id: `HIST-${Date.now()}`,
        employeeId: emp.id,
        changeDate: new Date().toISOString().split('T')[0],
        changeType: 'Transfer' as const,
        oldDepartment: emp.department,
        newDepartment: transferData.newDepartment,
        oldDesignation: emp.designation,
        newDesignation: transferData.newDesignation || emp.designation,
        oldManagerName: emp.manager || emp.reportingManagerName,
        newManagerName: transferData.newManagerName || emp.manager || emp.reportingManagerName,
        oldStatus: emp.status,
        newStatus: 'Transferred' as const,
        reason: transferData.reason || 'Department Transfer',
      };

      return {
        ...emp,
        department: transferData.newDepartment,
        designation: transferData.newDesignation || emp.designation,
        manager: transferData.newManagerName || emp.manager,
        reportingManagerName: transferData.newManagerName || emp.reportingManagerName,
        status: 'Transferred' as const,
        history: [...(emp.history || []), changeRecord],
      };
    }));
  };

  const exitEmployee = (id: string, exitReason?: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id && emp.empCode !== id) return emp;

      const changeRecord = {
        id: `HIST-${Date.now()}`,
        employeeId: emp.id,
        changeDate: new Date().toISOString().split('T')[0],
        changeType: 'Status Change' as const,
        oldStatus: emp.status,
        newStatus: 'Exited' as const,
        reason: exitReason || 'Employee Exit / Resignation',
      };

      return {
        ...emp,
        status: 'Exited' as const,
        history: [...(emp.history || []), changeRecord],
      };
    }));
  };

  const confirmEmployee = (id: string, notes?: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id && emp.empCode !== id) return emp;

      const changeRecord = {
        id: `HIST-${Date.now()}`,
        employeeId: emp.id,
        changeDate: new Date().toISOString().split('T')[0],
        changeType: 'Status Change' as const,
        oldStatus: emp.status,
        newStatus: 'Confirmed' as const,
        reason: notes || 'Probation period successfully completed & confirmed',
      };

      return {
        ...emp,
        status: 'Confirmed' as const,
        history: [...(emp.history || []), changeRecord],
      };
    }));
  };

  const convertCandidateToEmployee = (candidateId: string, customDetails?: Partial<Employee>): Employee => {
    const candidate = jobCandidates.find(c => c.id === candidateId);
    const nextNum = employees.length + 1;
    const empCode = `EMP-${String(nextNum).padStart(3, '0')}`;

    const targetStatus = customDetails?.status || 'Probation';

    const newEmp: Employee = {
      id: empCode,
      empCode,
      name: candidate ? candidate.name : customDetails?.name || 'New Employee',
      email: candidate ? candidate.email : customDetails?.email || `employee${nextNum}@democompany.com`,
      phone: customDetails?.phone || '+91 98765 00000',
      department: customDetails?.department || 'Engineering',
      designation: candidate ? candidate.jobTitle : customDetails?.designation || 'Software Developer',
      joiningDate: customDetails?.joiningDate || new Date().toISOString().split('T')[0],
      employmentType: customDetails?.employmentType || 'Full-time',
      salary: customDetails?.salary || 100000,
      status: targetStatus,
      manager: customDetails?.manager || 'John Doe',
      reportingManagerName: customDetails?.reportingManagerName || 'John Doe',
      candidateId,
      history: [
        {
          id: `HIST-${Date.now()}`,
          employeeId: empCode,
          changeDate: new Date().toISOString().split('T')[0],
          changeType: 'Status Change',
          newStatus: targetStatus,
          reason: candidate ? `Converted from Candidate ${candidate.name} (${candidate.id})` : 'New hire onboarded',
        }
      ]
    };

    setEmployees(prev => [...prev, newEmp]);
    if (candidate) {
      setJobCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: 'Hired' } : c));
    }
    return newEmp;
  };

  return (
    <AppContext.Provider
      value={{
        activeModule,
        activeSubSection,
        setActiveModule,
        setActiveSubSection,
        setModuleAndSubSection,
        reloadEmployeesFromDB,
        reloadAttendanceFromDB,
        userRole,
        setUserRole,
        userProfile,
        companyName,
        setCompanyName,
        branchName,
        setBranchName,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        theme,
        setTheme,
        isAuthenticated,
        setIsAuthenticated,
        leads,
        addLead,
        updateLead,
        deleteLead,
        customers,
        addCustomer,
        updateCustomer,
        contacts,
        addContact,
        opportunities,
        addOpportunity,
        updateOpportunity,
        activities,
        addActivity,
        followUps,
        addFollowUp,
        updateFollowUp,
        notes,
        addNote,
        products,
        quotations,
        salesOrders,
        invoices,
        employees,
        addEmployee,
        updateEmployee,
        transferEmployee,
        exitEmployee,
        confirmEmployee,
        convertCandidateToEmployee,
        attendanceRecords,
        shifts,
        regularizationRequests,
        attendanceEvents,
        addAttendanceEvent,
        checkIn,
        checkOut,
        submitRegularization,
        approveRegularization,
        rejectRegularization,
        saveShiftMaster,
        toggleShiftStatus,
        leaveRequests,
        approveLeave,
        rejectLeave,
        payrollRuns,
        jobCandidates,
        accounts,
        journalEntries,
        bankAccounts,
        expenseClaims,
        approveExpense,
        purchaseOrders,
        vendors,
        projects,
        tasks,
        helpdeskTickets,
        documents,
        addDocument,
        notifications,
        markNotificationRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
