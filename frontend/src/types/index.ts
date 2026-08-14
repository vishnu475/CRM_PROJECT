export * from './common';
export * from './api';

export type ModuleId =
  | 'dashboard'
  | 'crm'
  | 'sales'
  | 'customers'
  | 'recruitment'
  | 'hrms'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'expenses'
  | 'accounts'
  | 'ledger'
  | 'banking'
  | 'vendors'
  | 'purchases'
  | 'inventory'
  | 'projects'
  | 'tasks'
  | 'helpdesk'
  | 'documents'
  | 'reports'
  | 'automation'
  | 'administration'
  | 'settings';

export type FlowCategory =
  | 'main'
  | 'customer_flow'
  | 'employee_flow'
  | 'finance_flow'
  | 'purchase_flow'
  | 'operations_flow'
  | 'governance_flow';

export interface ModuleNavGroup {
  category: FlowCategory;
  title: string;
  items: {
    id: ModuleId;
    label: string;
    description: string;
    getsDataFrom: string;
    sendsDataTo: string;
  }[];
}

export type UserRole =
  | 'Executive'
  | 'SalesManager'
  | 'SalesExecutive'
  | 'HRAdmin'
  | 'FinanceAccountant'
  | 'OperationsManager'
  | 'Employee'
  | 'Customer'
  | 'Vendor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatar: string;
  company: string;
  branch: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost' | 'Negotiation';
  score: number;
  source: string;
  assignedTo: string;
  createdAt: string;
  industry?: string;
  campaign?: string;
  contactPerson?: string;
  designation?: string;
  alternatePhone?: string;
  website?: string;
  expectedCloseDate?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  tags?: string[];
  notes?: string;
  attachments?: any[];
  status?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  customerCode?: string;
  customerName: string;
  customerType: 'Company' | 'Individual';
  industry?: string;
  website?: string;
  ownerId: string;
  status: 'Active' | 'At Risk' | 'Inactive' | 'Archived';
  primaryContact: {
    name: string;
    designation?: string;
    email: string;
    phone: string;
    alternatePhone?: string;
  };
  billingAddress?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  shippingAddress?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  taxId?: string;
  gstVatNumber?: string;
  kycStatus?: 'Pending' | 'Verified' | 'Rejected';
  creditLimit?: number;
  paymentTerms?: string;
  currency?: string;
  tags?: string[];
  notes?: string;
  attachments?: any[];
  source?: string;
  convertedFromLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  uom: string;
  hsnCode: string;
  taxRate: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  validUntil: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Converted';
  itemsCount: number;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  date: string;
  totalAmount: number;
  fulfillmentStatus: 'Pending' | 'Partial' | 'Fulfilled' | 'Cancelled';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Overdue';
}

export type EmployeeLifecycleStatus = 'Joined' | 'Probation' | 'Confirmed' | 'Active' | 'Transferred' | 'Exited';

export interface EmploymentHistoryRecord {
  id: string;
  employeeId: string;
  changeDate: string;
  changeType: 'Transfer' | 'Promotion' | 'Manager Change' | 'Status Change';
  oldDepartment?: string;
  newDepartment?: string;
  oldDesignation?: string;
  newDesignation?: string;
  oldManagerName?: string;
  newManagerName?: string;
  oldStatus?: EmployeeLifecycleStatus;
  newStatus?: EmployeeLifecycleStatus;
  reason?: string;
  recordedBy?: string;
}

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  department: string;
  designation: string;
  joiningDate: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  salary: number;
  basicSalary?: number;
  allowances?: number;
  probationEndDate?: string;
  status: EmployeeLifecycleStatus;
  manager?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  branch?: string;
  candidateId?: string;
  panNumber?: string;
  uanNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  history?: EmploymentHistoryRecord[];
}

export interface AttendanceRecord {
  id: string;
  empId: string;
  empName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Half Day' | 'Absent';
  workHours: number;
}

export interface LeaveRequest {
  id: string;
  empId?: string;
  empName: string;
  department: string;
  leaveType: 'Casual' | 'Sick' | 'Earned' | 'Comp-off';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
}

export interface PayrollRun {
  id: string;
  month: string;
  totalEmployees: number;
  grossAmount: number;
  totalDeductions: number;
  netPay: number;
  status: 'Draft' | 'Calculated' | 'Approved' | 'Paid';
}

export interface JobCandidate {
  id: string;
  name: string;
  jobTitle: string;
  email: string;
  stage: 'Sourced' | 'Screening' | 'Interview' | 'Offer Sent' | 'Hired';
  rating: number;
  appliedDate: string;
}

export interface AccountCOA {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  balance: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  narration: string;
  debitTotal: number;
  creditTotal: number;
  status: 'Posted' | 'Draft';
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'Current' | 'Savings' | 'Petty Cash';
  balance: number;
  currency: string;
}

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  empName: string;
  category: string;
  amount: number;
  date: string;
  department: string;
  status: 'Pending' | 'Approved' | 'Reimbursed' | 'Rejected';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  date: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Billed' | 'Completed';
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  payableBalance: number;
  rating: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  budget: number;
  spent: number;
  progress: number;
  status: 'In Progress' | 'On Hold' | 'Completed';
}

export interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  dueDate: string;
}

export interface HelpdeskTicket {
  id: string;
  ticketNo: string;
  subject: string;
  customerName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedAgent: string;
  createdAt: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  category: string;
  linkedEntity: string;
  size: string;
  uploadedBy: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
}

export type CrmView = 'overview' | 'leads' | 'add-lead' | 'lead-details' | 'customers' | 'add-customer' | 'customer-details' | 'contacts' | 'opportunities' | 'activities' | 'follow-ups' | 'pipeline' | 'notes';

export interface Contact {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  designation: string;
  email: string;
  phone: string;
  owner: string;
  lastInteraction: string;
  status: 'Active' | 'Inactive';
}

export interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  value: number;
  probability: number;
  expectedClose: string;
  owner: string;
  stage: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
}

export interface Activity {
  id: string;
  title: string;
  type: 'Call' | 'Meeting' | 'Email' | 'Task' | 'Reminder';
  relatedTo: string;
  assignedTo: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed' | 'Overdue';
  outcome?: string;
}

export interface FollowUp {
  id: string;
  relatedEntity: string; // e.g., Lead Name or Customer Name
  opportunityId?: string;
  activityType: 'Call' | 'Email' | 'Meeting';
  dueDate: string;
  owner: string;
  value?: number;
  status: 'Overdue' | 'Today' | 'Upcoming';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  relatedRecord: string; // e.g., 'Lead: John Doe'
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  visibility: 'Public' | 'Private';
}
