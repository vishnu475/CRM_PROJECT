import React, { createContext, useContext, useState, useEffect } from 'react';
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
  AttendanceRecord,
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

interface AppContextType {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
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
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
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
  attendanceRecords: AttendanceRecord[];
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

const initialEmployees: Employee[] = [
  { id: 'EMP-001', empCode: 'EMP-001', name: 'Emma Watson', email: 'emma@democompany.com', department: 'Marketing', designation: 'Marketing Lead', joiningDate: '2022-03-15', salary: 120000, status: 'Active', manager: 'John Doe' },
  { id: 'EMP-002', empCode: 'EMP-002', name: 'Robert Brown', email: 'robert@democompany.com', department: 'Sales', designation: 'Senior Account Exec', joiningDate: '2021-06-10', salary: 140000, status: 'Active', manager: 'John Doe' },
  { id: 'EMP-003', empCode: 'EMP-003', name: 'James Smith', email: 'james@democompany.com', department: 'Engineering', designation: 'Senior Developer', joiningDate: '2020-01-20', salary: 180000, status: 'Active', manager: 'John Doe' },
  { id: 'EMP-004', empCode: 'EMP-004', name: 'Michael Brown', email: 'michael@democompany.com', department: 'Finance', designation: 'Finance Manager', joiningDate: '2019-11-01', salary: 190000, status: 'Active', manager: 'John Doe' },
];

const initialAttendanceRecords: AttendanceRecord[] = [
  { id: 'ATT-1', empId: 'EMP-003', empName: 'James Smith', date: '2025-05-20', checkIn: '09:15 AM', checkOut: '06:30 PM', status: 'Present', workHours: 9.25 },
  { id: 'ATT-2', empId: 'EMP-002', empName: 'Robert Brown', date: '2025-05-20', checkIn: '09:45 AM', checkOut: '06:45 PM', status: 'Late', workHours: 9.0 },
  { id: 'ATT-3', empId: 'EMP-001', empName: 'Emma Watson', date: '2025-05-20', checkIn: '-', checkOut: '-', status: 'Absent', workHours: 0 },
];

const initialLeaveRequests: LeaveRequest[] = [
  { id: 'LV-101', empName: 'Emma Watson', department: 'Marketing', leaveType: 'Casual', startDate: '2025-05-22', endDate: '2025-05-24', days: 2, reason: 'Personal family event', status: 'Pending', appliedDate: '2 Days ago' },
  { id: 'LV-102', empName: 'James Smith', department: 'Engineering', leaveType: 'Earned', startDate: '2025-06-01', endDate: '2025-06-05', days: 5, reason: 'Annual Vacation', status: 'Approved', appliedDate: '5 Days ago' },
];

const initialPayrollRuns: PayrollRun[] = [
  { id: 'PAY-2025-04', month: 'April 2025', totalEmployees: 42, grossAmount: 4850000, totalDeductions: 620000, netPay: 4230000, status: 'Paid' },
  { id: 'PAY-2025-05', month: 'May 2025', totalEmployees: 45, grossAmount: 5120000, totalDeductions: 650000, netPay: 4470000, status: 'Calculated' },
];

const initialJobCandidates: JobCandidate[] = [
  { id: 'CAND-01', name: 'Alex Turner', jobTitle: 'UI/UX Designer', email: 'alex@design.io', stage: 'Interview', rating: 4.8, appliedDate: '3 Days ago' },
  { id: 'CAND-02', name: 'Sophia Chen', jobTitle: 'Fullstack Engineer', email: 'sophia@tech.com', stage: 'Offer Sent', rating: 4.9, appliedDate: '1 Week ago' },
];

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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [userRole, setUserRoleState] = useState<UserRole>('Executive');
  const [companyName, setCompanyName] = useState<string>('Demo Company Pvt. Ltd.');
  const [branchName, setBranchName] = useState<string>('Headquarters (HQ)');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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
  const [employees] = useState<Employee[]>(initialEmployees);
  const [attendanceRecords] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [payrollRuns] = useState<PayrollRun[]>(initialPayrollRuns);
  const [jobCandidates] = useState<JobCandidate[]>(initialJobCandidates);
  const [accounts] = useState<AccountCOA[]>(initialAccounts);
  const [journalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [bankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(initialExpenseClaims);
  const [purchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [vendors] = useState<Vendor[]>(initialVendors);
  const [projects] = useState<Project[]>(initialProjects);
  const [tasks] = useState<Task[]>(initialTasks);
  const [helpdeskTickets] = useState<HelpdeskTicket[]>(initialHelpdeskTickets);
  const [documents] = useState<DocumentFile[]>(initialDocuments);
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

  const addCustomer = (customer: Omit<Customer, 'id'>) => {
    setCustomers((prev) => [{ ...customer, id: `CUST-${Math.floor(2000 + Math.random() * 900)}` }, ...prev]);
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

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
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
        attendanceRecords,
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
