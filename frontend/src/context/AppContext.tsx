import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Generate large mock datasets dynamically for CRM
const generateMockLeads = (): Lead[] => {
  const sources = ['Website', 'Referral', 'Campaign', 'Social Media', 'Manual/Other'];
  const stages: Lead['stage'][] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
  const leads: Lead[] = [];
  for (let i = 1; i <= 248; i++) {
    // Distribution to match mock data
    const stage = i <= 15 ? 'Lost' : i <= 36 ? 'Won' : i <= 81 ? 'Proposal' : i <= 163 ? 'Qualified' : i <= 210 ? 'Contacted' : 'New';
    const source = i % 100 < 40 ? 'Website' : i % 100 < 65 ? 'Referral' : i % 100 < 80 ? 'Campaign' : i % 100 < 90 ? 'Social Media' : 'Manual/Other';
    leads.push({
      id: `LD-${1000 + i}`,
      name: `Lead Person ${i}`,
      company: `Company ${i}`,
      email: `lead${i}@example.com`,
      phone: `555-01${i.toString().padStart(2, '0')}`,
      value: 10000 + (i * 1000),
      stage,
      score: 50 + (i % 50),
      source,
      assignedTo: 'Sarah Connor',
      createdAt: '2025-05-01'
    });
  }
  return leads;
};

const initialLeads: Lead[] = generateMockLeads();
const initialCustomers: Customer[] = Array.from({ length: 128 }).map((_, i) => {
  const now = new Date().toISOString();
  return {
    id: `CUST-${1000 + i}`,
    customerCode: `C${1000 + i}`,
    customerName: `Customer ${i}`,
    customerType: i % 3 === 0 ? 'Individual' : 'Company',
    industry: ['Technology', 'Manufacturing', 'Retail', 'Healthcare'][i % 4],
    ownerId: ['John Doe', 'Sarah Connor', 'Mike Ross'][i % 3],
    status: i % 10 === 0 ? 'Inactive' : (i % 7 === 0 ? 'At Risk' : 'Active'),
    primaryContact: {
      name: `Contact ${i}`,
      email: `cust${i}@example.com`,
      phone: '555-0000'
    },
    billingAddress: {
      city: 'City ' + i,
      country: 'USA'
    },
    creditLimit: 100000,
    createdAt: now,
    updatedAt: now
  };
});
const initialContacts: Contact[] = [];
const initialOpportunities: Opportunity[] = [
  { id: 'OPP-1', name: 'Enterprise Expansion', customerId: 'CUST-1000', customerName: 'Globex', value: 450000, probability: 20, expectedClose: '2025-06-01', owner: 'Mike Ross', stage: 'New' },
  { id: 'OPP-2', name: 'Cloud Migration', customerId: 'CUST-1001', customerName: 'Initech', value: 820000, probability: 50, expectedClose: '2025-06-15', owner: 'Sarah Connor', stage: 'Qualified' },
  { id: 'OPP-3', name: 'Software License', customerId: 'CUST-1002', customerName: 'Acme', value: 980000, probability: 70, expectedClose: '2025-06-20', owner: 'David Miller', stage: 'Proposal' },
  { id: 'OPP-4', name: 'Consulting Retainer', customerId: 'CUST-1003', customerName: 'Stark Ind', value: 750000, probability: 90, expectedClose: '2025-05-30', owner: 'Mike Ross', stage: 'Negotiation' }
];
const initialActivities: Activity[] = [
  { id: 'ACT-1', title: 'Initial Demo', type: 'Meeting', relatedTo: 'Acme Corp', assignedTo: 'Sarah Connor', dueDate: 'Today, 10:30 AM', priority: 'High', status: 'Completed', outcome: 'Positive' },
  { id: 'ACT-2', title: 'Follow-up Call', type: 'Call', relatedTo: 'John Smith', assignedTo: 'Mike Ross', dueDate: 'Today, 09:15 AM', priority: 'Medium', status: 'Completed', outcome: 'Sent proposal' },
  { id: 'ACT-3', title: 'Send MSA', type: 'Email', relatedTo: 'TechFlow Inc', assignedTo: 'Sarah Connor', dueDate: 'Yesterday, 04:45 PM', priority: 'High', status: 'Completed' },
  { id: 'ACT-4', title: 'Prepare Timeline', type: 'Task', relatedTo: 'Global Systems', assignedTo: 'David Miller', dueDate: 'Yesterday, 02:00 PM', priority: 'Medium', status: 'Completed' }
];
const initialFollowUps: FollowUp[] = [
  { id: 'FU-1', relatedEntity: 'Jane Doe', activityType: 'Call', dueDate: 'Yesterday, 05:00 PM', owner: 'Mike Ross', status: 'Overdue' },
  { id: 'FU-2', relatedEntity: 'Innovate LLC', opportunityId: 'Enterprise License', activityType: 'Meeting', dueDate: 'Today, 02:30 PM', owner: 'Sarah Connor', status: 'Today' },
  { id: 'FU-3', relatedEntity: 'Michael Scott', activityType: 'Email', dueDate: 'Today, 04:00 PM', owner: 'David Miller', status: 'Today' },
  { id: 'FU-4', relatedEntity: 'Future Tech', opportunityId: 'Q4 Consulting', activityType: 'Call', dueDate: 'Tomorrow, 10:00 AM', owner: 'Mike Ross', status: 'Upcoming' }
];
const initialNotes: Note[] = [];

const initialProducts: Product[] = [
  { id: 'PROD-A', sku: 'SKU-ENT-01', name: 'Product A - Enterprise CRM Suite', category: 'Software License', price: 6540000, stock: 120, uom: 'Licenses', hsnCode: '998313', taxRate: 18 },
  { id: 'PROD-B', sku: 'SKU-ENT-02', name: 'Product B - HRMS & Payroll System', category: 'Software License', price: 4520000, stock: 85, uom: 'Licenses', hsnCode: '998313', taxRate: 18 },
  { id: 'PROD-C', sku: 'SKU-ENT-03', name: 'Product C - ERP Accounting Module', category: 'Software License', price: 3210000, stock: 50, uom: 'Licenses', hsnCode: '998313', taxRate: 18 },
  { id: 'PROD-D', sku: 'SKU-ENT-04', name: 'Product D - Cloud Hosting Setup', category: 'Infrastructure', price: 2875000, stock: 200, uom: 'Units', hsnCode: '998315', taxRate: 18 },
];

const initialQuotations: Quotation[] = [
  { id: 'QT-2025-01', quoteNumber: 'QT-2025-001', customerId: 'CUST-001', customerName: 'Globex Corporation', date: '2025-05-18', validUntil: '2025-06-18', amount: 850000, status: 'Approved', itemsCount: 3 },
  { id: 'QT-2025-02', quoteNumber: 'QT-2025-002', customerId: 'CUST-002', customerName: 'Initech LLC', date: '2025-05-19', validUntil: '2025-06-19', amount: 420000, status: 'Sent', itemsCount: 2 },
];

const initialSalesOrders: SalesOrder[] = [
  { id: 'SO-2025-01', soNumber: 'SO-2025-001', customerName: 'Globex Corporation', date: '2025-05-19', totalAmount: 850000, fulfillmentStatus: 'Fulfilled' },
  { id: 'SO-2025-02', soNumber: 'SO-2025-002', customerName: 'Stark Industries', date: '2025-05-20', totalAmount: 1200000, fulfillmentStatus: 'Partial' },
];

const initialInvoices: Invoice[] = [
  { id: 'INV-1024', invoiceNumber: 'INV-2025-1024', customerName: 'Globex Corporation', date: '2025-05-20', dueDate: '2025-06-20', amount: 148350, paidAmount: 148350, status: 'Paid' },
  { id: 'INV-1025', invoiceNumber: 'INV-2025-1025', customerName: 'Initech LLC', date: '2025-05-19', dueDate: '2025-06-19', amount: 420000, paidAmount: 0, status: 'Issued' },
];

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

const initialAccounts: AccountCOA[] = [
  { id: 'ACC-1000', code: '1000', name: 'HDFC Bank Primary Operating Account', type: 'Asset', balance: 14835000 },
  { id: 'ACC-1200', code: '1200', name: 'Accounts Receivable (Trade Customers)', type: 'Asset', balance: 23450000 },
  { id: 'ACC-2000', code: '2000', name: 'Accounts Payable (Trade Vendors)', type: 'Liability', balance: 850000 },
  { id: 'ACC-3000', code: '3000', name: 'Retained Earnings / Equity', type: 'Equity', balance: 35000000 },
  { id: 'ACC-4000', code: '4000', name: 'Sales Revenue - Products & Subscriptions', type: 'Income', balance: 14835000 },
  { id: 'ACC-5000', code: '5000', name: 'Payroll & Operating Expenses', type: 'Expense', balance: 2475000 },
];

const initialJournalEntries: JournalEntry[] = [
  { id: 'JE-2025-001', entryNumber: 'JE-2025-001', date: '2025-05-20', narration: 'Sales Invoice INV-2025-1024 settlement from Globex Corp', debitTotal: 148350, creditTotal: 148350, status: 'Posted' },
  { id: 'JE-2025-002', entryNumber: 'JE-2025-002', date: '2025-05-19', narration: 'Vendor Purchase PO-2025-045 Office Supplies', debitTotal: 85000, creditTotal: 85000, status: 'Posted' },
];

const initialBankAccounts: BankAccount[] = [
  { id: 'BNK-01', bankName: 'HDFC Bank', accountNumber: '50200012345678', accountType: 'Current', balance: 14835000, currency: 'INR' },
  { id: 'BNK-02', bankName: 'ICICI Bank', accountNumber: '000405019876', accountType: 'Savings', balance: 4500000, currency: 'INR' },
  { id: 'BNK-03', bankName: 'Petty Cash Box HQ', accountNumber: 'CASH-HQ-01', accountType: 'Petty Cash', balance: 125000, currency: 'INR' },
];

const initialExpenseClaims: ExpenseClaim[] = [
  { id: 'EXP-101', claimNumber: 'EXP-2025-012', empName: 'Robert Brown', category: 'Client Meeting & Travel', amount: 12450, date: '2025-05-19', department: 'Sales', status: 'Pending' },
  { id: 'EXP-102', claimNumber: 'EXP-2025-011', empName: 'James Smith', category: 'Software Subscriptions', amount: 8400, date: '2025-05-15', department: 'Engineering', status: 'Approved' },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  { id: 'PO-2025-045', poNumber: 'PO-2025-045', vendorName: 'Office Supplies Ltd', date: '2025-05-20', amount: 85000, status: 'Draft' },
  { id: 'PO-2025-044', poNumber: 'PO-2025-044', vendorName: 'AWS Cloud Services', date: '2025-05-15', amount: 240000, status: 'Completed' },
];

const initialVendors: Vendor[] = [
  { id: 'VND-001', code: 'VND-001', name: 'Office Supplies Ltd', contactPerson: 'Mark Miller', email: 'sales@officesupplies.com', phone: '+1 888-555-1212', payableBalance: 85000, rating: 4.6 },
  { id: 'VND-002', code: 'VND-002', name: 'AWS Cloud Services', contactPerson: 'Cloud Support', email: 'billing@aws.com', phone: '+1 800-444-3333', payableBalance: 0, rating: 4.9 },
];

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
  const [products] = useState<Product[]>(initialProducts);
  const [quotations] = useState<Quotation[]>(initialQuotations);
  const [salesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [invoices] = useState<Invoice[]>(initialInvoices);
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
  // Refreshing the browser restores exact state from database.
  // ============================================================
  useEffect(() => {
    async function syncFromDatabase() {
      try {
        // 1. Load Employees from PostgreSQL
        await reloadEmployeesFromDB();

        // 2. Load Leave Requests from PostgreSQL
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

        // 3. Load Payroll Runs from PostgreSQL
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

        // 4. Load Shifts from PostgreSQL
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

        // 5. Load Candidates from PostgreSQL
        const canRes = await fetch('/api/recruitment/candidates');
        if (canRes.ok) {
          const canJson = await canRes.json();
          if (canJson.success && Array.isArray(canJson.data)) {
            setJobCandidates(canJson.data);
          }
        }

        // 6. Load Today's Attendance & Live Events from PostgreSQL
        await reloadAttendanceFromDB();
      } catch (err) {
        console.warn('⚠️ DB sync notice (backend may be starting):', err);
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
  const [accounts] = useState<AccountCOA[]>(initialAccounts);
  const [journalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [bankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(initialExpenseClaims);
  const [purchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [vendors] = useState<Vendor[]>(initialVendors);
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

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `LD-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: 'Just now',
    };
    setLeads((prev) => [newLead, ...prev]);
  };
  
  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Customer, 'createdAt' | 'updatedAt'>>) => {
    const now = new Date().toISOString().split('T')[0];
    setCustomers((prev) => [
      {
        createdAt: now,
        updatedAt: now,
        ...customer,
        id: `CUST-${Math.floor(2000 + Math.random() * 900)}`
      },
      ...prev
    ]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const addContact = (contact: Omit<Contact, 'id'>) => {
    setContacts((prev) => [{ ...contact, id: `CONT-${Math.floor(1000 + Math.random() * 900)}` }, ...prev]);
  };

  const addOpportunity = (opp: Omit<Opportunity, 'id'>) => {
    setOpportunities((prev) => [{ ...opp, id: `OPP-${Math.floor(100 + Math.random() * 900)}` }, ...prev]);
  };

  const updateOpportunity = (id: string, updates: Partial<Opportunity>) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    setActivities((prev) => [{ ...activity, id: `ACT-${Math.floor(100 + Math.random() * 900)}` }, ...prev]);
  };

  const addFollowUp = (fu: Omit<FollowUp, 'id'>) => {
    setFollowUps((prev) => [{ ...fu, id: `FU-${Math.floor(100 + Math.random() * 900)}` }, ...prev]);
  };

  const updateFollowUp = (id: string, updates: Partial<FollowUp>) => {
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    setNotes((prev) => [{ ...note, id: `NOTE-${Math.floor(100 + Math.random() * 900)}`, createdAt: now, updatedAt: now }, ...prev]);
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
