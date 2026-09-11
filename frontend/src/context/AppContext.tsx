import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LeadsAPI,
  CustomersAPI,
  ContactsAPI,
  OpportunitiesAPI,
  CRMActivitiesAPI,
  CRMFollowUpsAPI,
  QuotationsAPI,
  SalesOrdersAPI,
  CRMInvoicesAPI,
  CRMProductsAPI,
  VendorsAPI,
  PurchaseOrdersAPI,
  ProjectsAPI,
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
import { findMatchingCustomer, findMatchingContact } from '../modules/crm/utils/duplicateCustomerDetection';

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
  setUserProfile: (profile: Partial<UserProfile>) => void;
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
  convertLead: (
    leadId: string,
    customData?: {
      customerName?: string;
      customerType?: 'Company' | 'Individual';
      industry?: string;
      website?: string;
      contactName?: string;
      contactDesignation?: string;
      contactEmail?: string;
      contactPhone?: string;
      opportunityName?: string;
      opportunityValue?: number;
      expectedCloseDate?: string;
      useExistingCustomerId?: string;
      forceNewCustomer?: boolean;
    }
  ) => Promise<{
    success: boolean;
    customerId?: string;
    contactId?: string;
    opportunityId?: string;
    isExistingCustomerReused?: boolean;
    isExistingContactReused?: boolean;
    message?: string;
  }>;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Customer, 'createdAt' | 'updatedAt'>>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void> | void;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void> | void;
  deleteContact: (id: string) => Promise<void> | void;
  opportunities: Opportunity[];
  addOpportunity: (opp: Omit<Opportunity, 'id'>) => void;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => Promise<void> | void;
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => Promise<void> | void;
  followUps: FollowUp[];
  addFollowUp: (fu: Omit<FollowUp, 'id'>) => void;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => void;
  deleteFollowUp: (id: string) => Promise<void> | void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  products: Product[];
  addProduct: (product: any) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  adjustProductStock: (id: string, adjustment: { adjustmentQuantity: number; reason: string; notes?: string; performedBy?: string; location?: string }) => Promise<{ success: boolean; message?: string }>;
  deleteProduct: (id: string) => Promise<void>;
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id'>) => Promise<Quotation | null>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  salesOrders: SalesOrder[];
  addSalesOrder: (so: Omit<SalesOrder, 'id'>) => Promise<SalesOrder | null>;
  updateSalesOrder: (id: string, updates: Partial<SalesOrder>) => Promise<void>;
  deleteSalesOrder: (id: string) => Promise<void>;
  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, 'id'>) => Promise<Invoice | null>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<Vendor | null>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => Promise<PurchaseOrder | null>;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  receivePurchaseOrderGoods: (id: string, data?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  invoicePurchaseOrder: (id: string, data?: any) => Promise<{ success: boolean; data?: any; invoice_number?: string; error?: string }>;
  recordPurchasePayment: (id: string, data?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  syncFromDatabase: () => Promise<void>;
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
  checkIn: (employeeId: string, location?: string, ipAddress?: string, skipBackendSync?: boolean) => { success: boolean; message: string };
  checkOut: (employeeId: string, skipBackendSync?: boolean) => { success: boolean; message: string };
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
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addProject: (projectData: Omit<Project, 'id' | 'code'> & { id?: string; code?: string }) => Promise<Project | null>;
  createProjectFromLead: (
    leadId: string,
    customData?: {
      name?: string;
      client?: string;
      projectRequirement?: string;
      projectNotes?: string;
      projectManager?: string;
      startDate?: string;
      endDate?: string;
      budget?: number;
      status?: Project['status'];
      priority?: Project['priority'];
    }
  ) => Promise<{ success: boolean; projectId?: string; message?: string }>;
  tasks: Task[];
  helpdeskTickets: HelpdeskTicket[];
  documents: DocumentFile[];
  addDocument: (doc: Omit<DocumentFile, 'id' | 'updatedAt'>) => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
}

const initialUserProfile: UserProfile = {
  id: 'EMP-005',
  empCode: 'EMP-005',
  name: 'Vishnu Vardhan',
  email: 'vishnu.vardhan@democompany.com',
  role: 'Executive',
  roleTitle: 'Lead Backend Architect',
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

const mapProduct = (r: any): Product => ({
  id: r.id,
  sku: r.sku || r.id,
  name: r.name,
  category: r.category || 'General',
  price: parseFloat(r.price) || 0,
  costPrice: parseFloat(r.cost_price !== undefined ? r.cost_price : r.costPrice) || (parseFloat(r.price) * 0.7) || 0,
  cost_price: parseFloat(r.cost_price !== undefined ? r.cost_price : r.costPrice) || (parseFloat(r.price) * 0.7) || 0,
  purchasePrice: parseFloat(r.purchase_price !== undefined ? r.purchase_price : r.purchasePrice) || (parseFloat(r.price) * 0.75) || 0,
  purchase_price: parseFloat(r.purchase_price !== undefined ? r.purchase_price : r.purchasePrice) || (parseFloat(r.price) * 0.75) || 0,
  stock: parseInt(r.stock !== undefined ? r.stock : r.onHandStock) || 0,
  onHandStock: parseInt(r.on_hand_stock !== undefined ? r.on_hand_stock : (r.onHandStock !== undefined ? r.onHandStock : (r.stock !== undefined ? r.stock : 0))) || 0,
  on_hand_stock: parseInt(r.on_hand_stock !== undefined ? r.on_hand_stock : (r.onHandStock !== undefined ? r.onHandStock : (r.stock !== undefined ? r.stock : 0))) || 0,
  reservedStock: parseInt(r.reserved_stock !== undefined ? r.reserved_stock : r.reservedStock) || 0,
  reserved_stock: parseInt(r.reserved_stock !== undefined ? r.reserved_stock : r.reservedStock) || 0,
  availableStock: parseInt(r.available_stock !== undefined ? r.available_stock : (r.availableStock !== undefined ? r.availableStock : (r.stock || 0))) || 0,
  available_stock: parseInt(r.available_stock !== undefined ? r.available_stock : (r.availableStock !== undefined ? r.availableStock : (r.stock || 0))) || 0,
  reorderLevel: parseInt(r.reorder_level !== undefined ? r.reorder_level : r.reorderLevel) || 20,
  reorder_level: parseInt(r.reorder_level !== undefined ? r.reorder_level : r.reorderLevel) || 20,
  reorderQuantity: parseInt(r.reorder_quantity !== undefined ? r.reorder_quantity : r.reorderQuantity) || 50,
  reorder_quantity: parseInt(r.reorder_quantity !== undefined ? r.reorder_quantity : r.reorderQuantity) || 50,
  stockStatus: r.stock_status || r.stockStatus || 'In Stock',
  stock_status: r.stock_status || r.stockStatus || 'In Stock',
  inventoryValue: parseFloat(r.inventory_value !== undefined ? r.inventory_value : r.inventoryValue) || 0,
  inventory_value: parseFloat(r.inventory_value !== undefined ? r.inventory_value : r.inventoryValue) || 0,
  uom: r.uom || 'Units',
  hsnCode: r.hsn_code || r.hsnCode || '',
  hsn_code: r.hsn_code || r.hsnCode || '',
  taxRate: parseFloat(r.tax_rate !== undefined ? r.tax_rate : r.taxRate) || 18,
  tax_rate: parseFloat(r.tax_rate !== undefined ? r.tax_rate : r.taxRate) || 18,
  description: r.description || '',
  warehouseLocation: r.warehouse_location || r.warehouseLocation || 'Main Warehouse - Bay A',
  warehouse_location: r.warehouse_location || r.warehouseLocation || 'Main Warehouse - Bay A',
  primaryVendorId: r.primary_vendor_id || r.primaryVendorId || '',
  primary_vendor_id: r.primary_vendor_id || r.primaryVendorId || '',
  primaryVendorName: r.primary_vendor_name || r.primaryVendorName || '',
  primary_vendor_name: r.primary_vendor_name || r.primaryVendorName || '',
  movementsCount: parseInt(r.movements_count !== undefined ? r.movements_count : r.movementsCount) || 0,
  movements_count: parseInt(r.movements_count !== undefined ? r.movements_count : r.movementsCount) || 0,
  createdAt: r.created_at || r.createdAt || '',
  created_at: r.created_at || r.createdAt || '',
  updatedAt: r.updated_at || r.updatedAt || '',
  updated_at: r.updated_at || r.updatedAt || '',
});

const mapVendor = (r: any): Vendor => ({
  id: r.id,
  code: r.code || r.id,
  name: r.name,
  contactPerson: r.contact_person || r.contactPerson || '',
  contact_person: r.contact_person || r.contactPerson || '',
  email: r.email || '',
  phone: r.phone || '',
  category: r.category || 'General',
  address: r.address || '',
  gstin: r.gstin || '',
  paymentTerms: r.payment_terms || r.paymentTerms || 'Net 30 Days',
  payment_terms: r.payment_terms || r.paymentTerms || 'Net 30 Days',
  status: r.status || 'Active',
  website: r.website || '',
  notes: r.notes || '',
  payableBalance: parseFloat(r.payable_balance !== undefined ? r.payable_balance : r.payableBalance) || 0,
  payable_balance: parseFloat(r.payable_balance !== undefined ? r.payable_balance : r.payableBalance) || 0,
  rating: parseFloat(r.rating) || 5.0,
  totalPurchases: parseFloat(r.total_purchases !== undefined ? r.total_purchases : r.totalPurchases) || 0,
  total_purchases: parseFloat(r.total_purchases !== undefined ? r.total_purchases : r.totalPurchases) || 0,
  totalOrders: parseInt(r.total_orders !== undefined ? r.total_orders : r.totalOrders) || 0,
  total_orders: parseInt(r.total_orders !== undefined ? r.total_orders : r.totalOrders) || 0,
  openOrders: parseInt(r.open_orders !== undefined ? r.open_orders : r.openOrders) || 0,
  open_orders: parseInt(r.open_orders !== undefined ? r.open_orders : r.openOrders) || 0,
  pendingReceipts: parseInt(r.pending_receipts !== undefined ? r.pending_receipts : r.pendingReceipts) || 0,
  pending_receipts: parseInt(r.pending_receipts !== undefined ? r.pending_receipts : r.pendingReceipts) || 0,
  totalPaidAmount: parseFloat(r.total_paid_amount !== undefined ? r.total_paid_amount : r.totalPaidAmount) || 0,
  total_paid_amount: parseFloat(r.total_paid_amount !== undefined ? r.total_paid_amount : r.totalPaidAmount) || 0,
  calculatedAmountDue: parseFloat(r.calculated_amount_due !== undefined ? r.calculated_amount_due : (r.calculatedAmountDue !== undefined ? r.calculatedAmountDue : (r.payable_balance || r.payableBalance))) || 0,
  calculated_amount_due: parseFloat(r.calculated_amount_due !== undefined ? r.calculated_amount_due : (r.calculatedAmountDue !== undefined ? r.calculatedAmountDue : (r.payable_balance || r.payableBalance))) || 0,
  overdueAmount: parseFloat(r.overdue_amount !== undefined ? r.overdue_amount : r.overdueAmount) || 0,
  overdue_amount: parseFloat(r.overdue_amount !== undefined ? r.overdue_amount : r.overdueAmount) || 0,
  purchase_orders: Array.isArray(r.purchase_orders) ? r.purchase_orders : [],
  payments: Array.isArray(r.payments) ? r.payments : [],
  createdAt: r.created_at || r.createdAt || '',
  created_at: r.created_at || r.createdAt || '',
});

const mapPurchaseOrder = (r: any): PurchaseOrder => ({
  id: r.id,
  poNumber: r.poNumber || r.po_number || r.id,
  po_number: r.po_number || r.poNumber || r.id,
  vendorId: r.vendorId || r.vendor_id || '',
  vendor_id: r.vendor_id || r.vendorId || '',
  vendorName: r.vendorName || r.vendor_name || r.vendor_name_resolved || 'Supplier',
  vendor_name: r.vendor_name || r.vendorName || r.vendor_name_resolved || 'Supplier',
  vendorContact: r.vendorContact || r.contact_person || '',
  vendor_contact: r.vendor_contact || r.contact_person || '',
  vendorEmail: r.vendorEmail || r.vendor_email || '',
  vendor_email: r.vendor_email || r.vendor_email || '',
  vendorPhone: r.vendorPhone || r.vendor_phone || '',
  vendor_phone: r.vendor_phone || r.vendor_phone || '',
  date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '',
  order_date: r.order_date || r.date || '',
  expectedDelivery: r.expectedDelivery || (r.expected_delivery ? (typeof r.expected_delivery === 'string' ? r.expected_delivery.split('T')[0] : new Date(r.expected_delivery).toISOString().split('T')[0]) : ''),
  expected_delivery: r.expected_delivery || r.expectedDelivery || '',
  amount: parseFloat(r.amount || r.total_amount) || 0,
  total_amount: parseFloat(r.total_amount || r.amount) || 0,
  subtotal: parseFloat(r.subtotal) || 0,
  taxAmount: parseFloat(r.taxAmount || r.tax_amount) || 0,
  tax_amount: parseFloat(r.tax_amount || r.taxAmount) || 0,
  discountAmount: parseFloat(r.discountAmount || r.discount_amount) || 0,
  discount_amount: parseFloat(r.discount_amount || r.discountAmount) || 0,
  status: r.status || 'Draft',
  receiptStatus: r.receiptStatus || r.receipt_status || 'Not Received',
  receipt_status: r.receipt_status || r.receiptStatus || 'Not Received',
  paymentStatus: r.paymentStatus || r.payment_status || 'Unpaid',
  payment_status: r.payment_status || r.paymentStatus || 'Unpaid',
  paymentTerms: r.paymentTerms || r.payment_terms || 'Net 30 Days',
  payment_terms: r.payment_terms || r.paymentTerms || 'Net 30 Days',
  deliveryLocation: r.deliveryLocation || r.delivery_location || '',
  delivery_location: r.delivery_location || r.deliveryLocation || '',
  notes: r.notes || '',
  vendorInvoiceId: r.vendorInvoiceId || r.vendor_invoice_id || '',
  vendor_invoice_id: r.vendor_invoice_id || r.vendorInvoiceId || '',
  vendorInvoiceNumber: r.vendorInvoiceNumber || r.vendor_invoice_number || '',
  vendor_invoice_number: r.vendor_invoice_number || r.vendorInvoiceNumber || '',
  vendorInvoiceDate: r.vendorInvoiceDate || (r.vendor_invoice_date ? (typeof r.vendor_invoice_date === 'string' ? r.vendor_invoice_date.split('T')[0] : new Date(r.vendor_invoice_date).toISOString().split('T')[0]) : ''),
  vendor_invoice_date: r.vendor_invoice_date || r.vendorInvoiceDate || '',
  vendorInvoiceDueDate: r.vendorInvoiceDueDate || (r.vendor_invoice_due_date ? (typeof r.vendor_invoice_due_date === 'string' ? r.vendor_invoice_due_date.split('T')[0] : new Date(r.vendor_invoice_due_date).toISOString().split('T')[0]) : ''),
  vendor_invoice_due_date: r.vendor_invoice_due_date || r.vendorInvoiceDueDate || '',
  vendorInvoiceAmount: parseFloat(r.vendorInvoiceAmount || r.vendor_invoice_amount) || parseFloat(r.amount || r.total_amount) || 0,
  vendor_invoice_amount: parseFloat(r.vendor_invoice_amount || r.vendorInvoiceAmount) || parseFloat(r.total_amount || r.amount) || 0,
  paidAmount: parseFloat(r.paidAmount || r.paid_amount) || 0,
  paid_amount: parseFloat(r.paid_amount || r.paidAmount) || 0,
  amountDue: parseFloat(r.amountDue !== undefined ? r.amountDue : r.amount_due) || 0,
  amount_due: parseFloat(r.amount_due !== undefined ? r.amount_due : r.amountDue) || 0,
  lastPaymentDate: r.lastPaymentDate || (r.last_payment_date ? (typeof r.last_payment_date === 'string' ? r.last_payment_date.split('T')[0] : new Date(r.last_payment_date).toISOString().split('T')[0]) : ''),
  last_payment_date: r.last_payment_date || r.lastPaymentDate || '',
  lastPaymentReference: r.lastPaymentReference || r.last_payment_reference || '',
  last_payment_reference: r.last_payment_reference || r.lastPaymentReference || '',
  invoiceStatus: r.invoiceStatus || r.invoice_status || (r.vendor_invoice_number ? 'Invoiced' : 'No Invoice'),
  invoice_status: r.invoice_status || r.invoiceStatus || (r.vendor_invoice_number ? 'Invoiced' : 'No Invoice'),
  itemsCount: parseInt(r.itemsCount || r.items_count) || (Array.isArray(r.items) ? r.items.length : 1),
  items_count: parseInt(r.items_count || r.itemsCount) || (Array.isArray(r.items) ? r.items.length : 1),
  items: Array.isArray(r.items) ? r.items : [],
  receipts: Array.isArray(r.receipts) ? r.receipts : [],
  payments: Array.isArray(r.payments) ? r.payments : [],
  createdAt: r.createdAt || r.created_at || '',
  created_at: r.created_at || r.createdAt || '',
  updatedAt: r.updatedAt || r.updated_at || '',
  updated_at: r.updated_at || r.updatedAt || '',
});

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

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const path = window.location.pathname.toLowerCase();
    const isEssPath = (path === '/employee' || path.startsWith('/employee/')) &&
      !path.startsWith('/employee/emp-') &&
      !/^\/employee\/\d+$/.test(path);
    if (isEssPath) return 'Employee';
    const saved = localStorage.getItem('crm_user_role');
    if (saved && saved !== 'Employee') return saved as UserRole;
    return 'Executive';
  });

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

  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('crm_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialUserProfile;
  });

  const setUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfileState((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('crm_user_profile', JSON.stringify(updated));
      return updated;
    });
  };
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
              const idx = merged.findIndex(m => {
                const sameDate = m.date === fr.date;
                const rEmpId = fr.employeeId || fr.empId || (fr as any).empCode;
                const mEmpId = m.employeeId || m.empId || (m as any).empCode;

                const idMatches =
                  Boolean(rEmpId) && Boolean(mEmpId) &&
                  (rEmpId === mEmpId || String(rEmpId).toLowerCase() === String(mEmpId).toLowerCase());

                return sameDate && idMatches;
              });

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
  const syncFromDatabase = useCallback(async () => {
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
            value: parseFloat(r.value) || parseFloat(r.budget) || 0,
            budget: parseFloat(r.budget) || parseFloat(r.value) || 0,
            requirement: r.requirement || '',
            notes: r.notes || '',
            contactPerson: r.contact_person || r.decision_maker || '',
            designation: r.designation || '',
            contactRole: r.contact_role || 'Decision Maker',
            alternatePhone: r.alternate_phone || '',
            website: r.website || '',
            industry: r.industry || '',
            campaign: r.campaign || '',
            decisionMaker: r.decision_maker || r.contact_person || '',
            expectedCloseDate: r.expected_close_date || '',
            proposalAmount: parseFloat(r.proposal_amount) || 0,
            proposalDate: r.proposal_date || '',
            proposalStatus: r.proposal_status || 'Draft',
            proposalSentDate: r.proposal_sent_date || '',
            finalAgreedAmount: parseFloat(r.final_agreed_amount) || 0,
            wonDate: r.won_date || '',
            dealClosedNotes: r.deal_closed_notes || '',
            lostReason: r.lost_reason || '',
            lostReasonDetails: r.lost_reason_details || '',
            lostNotes: r.lost_notes || '',
            lostDate: r.lost_date || '',
            convertedToCustomerId: r.converted_to_customer_id || '',
            convertedToContactId: r.converted_to_contact_id || '',
            convertedToOpportunityId: r.converted_to_opportunity_id || '',
            isConverted: r.is_converted === true || r.is_converted === 'true',
            convertedAt: r.converted_at || '',
            projectId: r.project_id || '',
            isProjectCreated: r.is_project_created === true || r.is_project_created === 'true',
            projectCreatedAt: r.project_created_at || '',
            stage: r.stage || 'New',
            score: parseInt(r.score) || 50,
            source: r.source || 'Manual/Other',
            assignedTo: r.assigned_to || '',
            assignedToEmployeeId: r.assigned_to_employee_id || '',
            attachments: Array.isArray(r.attachments)
              ? r.attachments
              : (typeof r.attachments === 'string' && r.attachments.trim() !== ''
                  ? (() => { try { return JSON.parse(r.attachments); } catch { return []; } })()
                  : []),
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
            healthSummary: r.healthSummary || undefined,
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
            convertedFromLeadId: r.converted_from_lead_id || '',
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
            contactRole: r.contact_role || r.role || 'Other',
            email: r.email || '',
            phone: r.phone || '',
            alternatePhone: r.alternate_phone || '',
            notes: r.notes || '',
            leadId: r.lead_id || '',
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
            customerId: r.customer_id || undefined,
            opportunityId: r.opportunity_id || undefined,
            assignedTo: r.assigned_to || '',
            dueDate: r.due_date || '',
            priority: r.priority || 'Medium',
            purpose: r.purpose || 'General',
            status: r.status || 'Pending',
            outcome: r.outcome || '',
            createdAt: r.created_at || undefined,
          })));
        }

        // 15b. Load Follow-ups from CRM PostgreSQL
        const followUpsRes = await CRMFollowUpsAPI.getAll();
        if (followUpsRes.success && Array.isArray(followUpsRes.data)) {
          setFollowUps(followUpsRes.data.map((r: any) => ({
            id: r.id,
            title: r.title || 'Follow up with customer',
            notes: r.notes || '',
            relatedEntity: r.related_entity || '',
            customerId: r.customer_id || undefined,
            opportunityId: r.opportunity_id || undefined,
            leadId: r.lead_id || undefined,
            contactId: r.contact_id || undefined,
            activityId: r.activity_id || undefined,
            activityType: r.activity_type || 'Call',
            dueDate: r.due_date || '',
            owner: r.owner || r.assigned_to || '',
            assignedTo: r.assigned_to || r.owner || '',
            priority: r.priority || 'Medium',
            status: r.status || 'Pending',
            reminder: r.reminder || 'none',
            createdAt: r.created_at || undefined,
            completedAt: r.completed_at || undefined,
          })));
        }

        // 16. Load Products & Stock Catalog from CRM PostgreSQL
        const productsRes = await CRMProductsAPI.getAll();
        if (productsRes.success && Array.isArray(productsRes.data)) {
          setProducts(productsRes.data.map(mapProduct));
        }

        // 17. Load Quotations from CRM PostgreSQL
        const quotesRes = await QuotationsAPI.getAll();
        if (quotesRes.success && Array.isArray(quotesRes.data)) {
          setQuotations(quotesRes.data.map((r: any) => ({
            id: r.id,
            quoteNumber: r.quote_number || r.id,
            customerId: r.customer_id || '',
            leadId: r.lead_id || '',
            opportunityId: r.opportunity_id || '',
            contactId: r.contact_id || '',
            customerName: r.customer_name || '',
            date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '',
            validUntil: r.valid_until ? (typeof r.valid_until === 'string' ? r.valid_until.split('T')[0] : new Date(r.valid_until).toISOString().split('T')[0]) : '',
            amount: parseFloat(r.amount) || 0,
            subtotal: parseFloat(r.subtotal) || 0,
            taxAmount: parseFloat(r.tax_amount) || 0,
            discountAmount: parseFloat(r.discount_amount) || 0,
            status: r.status || 'Draft',
            sentDate: r.sent_date ? (typeof r.sent_date === 'string' ? r.sent_date.split('T')[0] : new Date(r.sent_date).toISOString().split('T')[0]) : '',
            acceptedDate: r.accepted_date ? (typeof r.accepted_date === 'string' ? r.accepted_date.split('T')[0] : new Date(r.accepted_date).toISOString().split('T')[0]) : '',
            revisionNumber: parseInt(r.revision_number) || 1,
            terms: r.terms || '',
            notes: r.notes || '',
            owner: r.owner || '',
            salesOrderId: r.sales_order_id || '',
            salesOrderNumber: r.sales_order_number || '',
            itemsCount: parseInt(r.items_count) || 1,
          })));
        }

        // 18. Load Sales Orders from CRM PostgreSQL
        const soRes = await SalesOrdersAPI.getAll();
        if (soRes.success && Array.isArray(soRes.data)) {
          setSalesOrders(soRes.data.map((r: any) => ({
            id: r.id,
            soNumber: r.so_number || r.id,
            quotationId: r.quotation_id || '',
            quoteNumber: r.quote_number || '',
            quotationStatus: r.quotation_status || '',
            customerId: r.customer_id || '',
            customerName: r.customer_name || '',
            opportunityId: r.opportunity_id || '',
            contactId: r.contact_id || '',
            date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '',
            totalAmount: parseFloat(r.total_amount) || 0,
            subtotal: parseFloat(r.subtotal) || 0,
            taxAmount: parseFloat(r.tax_amount) || 0,
            discountAmount: parseFloat(r.discount_amount) || 0,
            fulfillmentStatus: r.fulfillment_status || 'Pending',
            status: r.status || 'Confirmed',
            paymentTerms: r.payment_terms || '',
            deliveryNotes: r.delivery_notes || '',
            notes: r.notes || '',
            invoiceId: r.invoice_id || '',
            invoiceNumber: r.invoice_number || '',
            itemsCount: parseInt(r.items_count) || 1,
          })));
        }

        // 19. Load Invoices from CRM PostgreSQL
        const invRes = await CRMInvoicesAPI.getAll();
        if (invRes.success && Array.isArray(invRes.data)) {
          setInvoices(invRes.data.map((r: any) => ({
            id: r.id,
            invoiceNumber: r.invoice_number || r.id,
            salesOrderId: r.sales_order_id || '',
            salesOrderNumber: r.sales_order_number || '',
            quotationId: r.quotation_id || '',
            quoteNumber: r.quote_number || '',
            opportunityId: r.opportunity_id || '',
            customerId: r.customer_id || '',
            customerName: r.customer_name || '',
            date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '',
            dueDate: r.due_date ? (typeof r.due_date === 'string' ? r.due_date.split('T')[0] : new Date(r.due_date).toISOString().split('T')[0]) : '',
            amount: parseFloat(r.amount) || 0,
            subtotal: parseFloat(r.subtotal) || 0,
            taxAmount: parseFloat(r.tax_amount) || 0,
            discountAmount: parseFloat(r.discount_amount) || 0,
            paidAmount: parseFloat(r.paid_amount) || 0,
            status: r.status || 'Draft',
            paymentTerms: r.payment_terms || '',
            notes: r.notes || '',
            itemsCount: parseInt(r.items_count) || 1,
          })));
        }

        // 20. Load Vendors from CRM PostgreSQL
        const vndRes = await VendorsAPI.getAll();
        if (vndRes.success && Array.isArray(vndRes.data)) {
          setVendors(vndRes.data.map(mapVendor));
        }

        // 21. Load Purchase Orders from CRM PostgreSQL
        const poRes = await PurchaseOrdersAPI.getAll();
        if (poRes.success && Array.isArray(poRes.data)) {
          setPurchaseOrders(poRes.data.map(mapPurchaseOrder));
        }

        // 22. Load Projects from CRM PostgreSQL
        const projectsRes = await ProjectsAPI.getAll();
        if (projectsRes.success && Array.isArray(projectsRes.data) && projectsRes.data.length > 0) {
          setProjects(projectsRes.data.map((r: any) => ({
            id: r.id,
            code: r.code || r.id,
            name: r.name,
            client: r.client,
            customerId: r.customer_id || '',
            sourceLeadId: r.source_lead_id || '',
            sourceOpportunityId: r.source_opportunity_id || '',
            projectRequirement: r.project_requirement || '',
            projectNotes: r.project_notes || '',
            projectManager: r.project_manager || '',
            startDate: r.start_date ? (typeof r.start_date === 'string' ? r.start_date.split('T')[0] : new Date(r.start_date).toISOString().split('T')[0]) : '',
            endDate: r.end_date ? (typeof r.end_date === 'string' ? r.end_date.split('T')[0] : new Date(r.end_date).toISOString().split('T')[0]) : '',
            budget: parseFloat(r.budget) || 0,
            spent: parseFloat(r.spent) || 0,
            progress: parseInt(r.progress) || 0,
            status: r.status || 'Not Started',
            createdAt: r.created_at || '',
            updatedAt: r.updated_at || '',
          })));
        }
      } catch (err) {
        console.warn('⚠️ CRM DB sync notice:', err);
      }
  }, [reloadEmployeesFromDB, reloadAttendanceFromDB]);

  useEffect(() => {
    syncFromDatabase();
  }, [syncFromDatabase]);

  const addAttendanceEvent = (evt: AttendanceEvent) => {
    setAttendanceEvents(prev => [evt, ...prev]);
  };

  const checkIn = (employeeId: string, location: string = 'HQ Office', ipAddress: string = '192.168.1.50', skipBackendSync: boolean = false) => {
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

    // POST TO POSTGRESQL BACKEND (SINGLE SOURCE OF TRUTH)
    if (!skipBackendSync) {
      fetch('/api/attendance/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.empCode || emp.id,
          pin: (emp as any).pin || (emp as any).plain_pin || '1234',
          deviceId: 'WEB-ADMIN-PANEL',
          source: 'ADMIN_DESK',
          action: 'CHECK_IN'
        })
      }).then(() => {
        reloadAttendanceFromDB();
      }).catch(err => console.warn('Backend PostgreSQL checkIn sync warning:', err));
    }

    return { success: true, message: `Checked in successfully at ${nowTime}` };
  };

  const checkOut = (employeeId: string, skipBackendSync: boolean = false) => {
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
    if (existing.status !== 'Late In') {
      finalStatus = isEarly ? 'Early Out' : 'Present';
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

    // POST TO POSTGRESQL BACKEND (SINGLE SOURCE OF TRUTH)
    if (!skipBackendSync) {
      fetch('/api/attendance/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.empCode || emp.id,
          pin: (emp as any).pin || (emp as any).plain_pin || '1234',
          deviceId: 'WEB-ADMIN-PANEL',
          source: 'ADMIN_DESK',
          action: 'CHECK_OUT'
        })
      }).then(() => {
        reloadAttendanceFromDB();
      }).catch(err => console.warn('Backend PostgreSQL checkOut sync warning:', err));
    }

    return { success: true, message: `Checked out successfully at ${nowTime}` };
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
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks] = useState<Task[]>(initialTasks);
  const [helpdeskTickets] = useState<HelpdeskTicket[]>(initialHelpdeskTickets);
  const [documents, setDocuments] = useState<DocumentFile[]>(initialDocuments);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Sync user profile when user role changes
  const setUserRole = (role: UserRole) => {
    localStorage.setItem('crm_user_role', role);
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
    setUserProfileState((prev) => ({
      ...prev,
      role,
      name: (prev.name && prev.name !== 'John Doe' && prev.name !== 'James Smith') ? prev.name : (roleTitles[role]?.name || 'John Doe'),
      roleTitle: (prev.roleTitle && prev.roleTitle !== 'Senior Software Eng.') ? prev.roleTitle : (roleTitles[role]?.title || role),
    }));
  };

  // ============================================================
  // CRM Mutations — Optimistic UI update + persist to crm DB
  // ============================================================

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const tempId = `LD-${Date.now()}`;
    const newLead: Lead = { ...leadData, id: tempId, createdAt: 'Just now' };
    setLeads((prev) => [newLead, ...prev]); // Optimistic

    // Auto-create and link Contact if meaningful contact info is present
    const contactPersonName = (leadData.contactPerson || leadData.name || '').trim();
    const contactEmail = (leadData.email || '').trim();

    if (contactPersonName && contactEmail) {
      const contactTempId = `CON-${Date.now()}`;
      const newContact: Contact = {
        id: contactTempId,
        name: contactPersonName,
        customerId: '',
        customerName: (leadData.company || leadData.name || '').trim(),
        designation: leadData.designation || 'Representative',
        contactRole: leadData.contactRole || 'Decision Maker',
        email: contactEmail,
        phone: leadData.phone || '',
        alternatePhone: leadData.alternatePhone || '',
        notes: leadData.notes || '',
        owner: leadData.assignedTo || 'Unassigned',
        lastInteraction: new Date().toISOString().split('T')[0],
        status: 'Active',
        leadId: tempId,
      };

      // Prevent duplicate contacts in state on double submit
      setContacts((prev) => {
        const alreadyExists = prev.some(
          (c) => (c.leadId && c.leadId === tempId) ||
                 (c.email && c.email.toLowerCase() === contactEmail.toLowerCase() && c.leadId === tempId)
        );
        if (alreadyExists) return prev;
        return [newContact, ...prev];
      });

      try {
        await ContactsAPI.create({
          id: contactTempId,
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          company: newContact.customerName,
          customerId: null,
          leadId: tempId,
          title: newContact.designation,
          contactRole: newContact.contactRole,
          alternatePhone: newContact.alternatePhone,
          notes: newContact.notes,
        });
      } catch (cErr) {
        console.warn('⚠️ [CRM] auto-create contact from lead failed:', cErr);
      }
    }

    try {
      const res = await LeadsAPI.create({
        id: tempId,
        name: leadData.name,
        company: leadData.company,
        email: leadData.email,
        phone: leadData.phone,
        value: leadData.value || leadData.budget || 0,
        budget: leadData.budget || leadData.value || 0,
        stage: leadData.stage,
        score: leadData.score,
        source: leadData.source,
        assignedTo: leadData.assignedTo,
        assignedToEmployeeId: leadData.assignedToEmployeeId,
        requirement: leadData.requirement,
        notes: leadData.notes,
        decisionMaker: leadData.decisionMaker || leadData.contactPerson,
        expectedCloseDate: leadData.expectedCloseDate,
        contactPerson: leadData.contactPerson,
        designation: leadData.designation,
        contactRole: leadData.contactRole,
        alternatePhone: leadData.alternatePhone,
        website: leadData.website,
        industry: leadData.industry,
        campaign: leadData.campaign,
        attachments: leadData.attachments || [],
      });
      if (res.success && res.data) {
        setLeads((prev) => prev.map((l) => l.id === tempId ? { ...newLead, id: res.data.id } : l));
      }
    } catch (err) { console.warn('⚠️ [CRM] addLead failed:', err); }
  }, []);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l))); // Optimistic
    try {
      await LeadsAPI.update(id, updates);
    } catch (err) { console.warn('⚠️ [CRM] updateLead failed:', err); }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id)); // Optimistic
    try { await LeadsAPI.delete(id); }
    catch (err) { console.warn('⚠️ [CRM] deleteLead failed:', err); }
  }, []);

  const convertLead = useCallback(async (
    leadId: string,
    customData?: {
      customerName?: string;
      customerType?: 'Company' | 'Individual';
      industry?: string;
      website?: string;
      contactName?: string;
      contactDesignation?: string;
      contactEmail?: string;
      contactPhone?: string;
      opportunityName?: string;
      opportunityValue?: number;
      expectedCloseDate?: string;
      useExistingCustomerId?: string;
      forceNewCustomer?: boolean;
    }
  ): Promise<{
    success: boolean;
    customerId?: string;
    contactId?: string;
    opportunityId?: string;
    isExistingCustomerReused?: boolean;
    isExistingContactReused?: boolean;
    message?: string;
  }> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) {
      return { success: false, message: 'Lead not found.' };
    }

    if (lead.isConverted) {
      return {
        success: false,
        message: 'This lead has already been converted to a Customer, Contact, and Opportunity.',
      };
    }

    if (lead.stage !== 'Won') {
      return {
        success: false,
        message: `Lead cannot be converted from stage "${lead.stage}". Conversion is only available when the Lead is Won.`,
      };
    }

    const timestamp = Date.now();
    const isoTimestamp = new Date().toISOString();
    const today = isoTimestamp.split('T')[0];

    // 1. Check for Duplicate / Existing Customer
    let customerId = '';
    let customerName = '';
    let isExistingCustomerReused = false;
    let newCustomerState: Customer | null = null;
    let newCustomerPayload: any = null;

    if (customData?.useExistingCustomerId) {
      const existing = customers.find((c) => c.id === customData.useExistingCustomerId);
      if (existing) {
        customerId = existing.id;
        customerName = existing.customerName;
        isExistingCustomerReused = true;
      }
    }

    if (!customerId && !customData?.forceNewCustomer) {
      const match = findMatchingCustomer(lead, customers, customData);
      if (match.hasDuplicate && match.matchingCustomer) {
        customerId = match.matchingCustomer.id;
        customerName = match.matchingCustomer.customerName;
        isExistingCustomerReused = true;
      }
    }

    if (!customerId) {
      // Create new customer
      customerId = `CUST-${timestamp}`;
      customerName = customData?.customerName?.trim() || (lead.company?.trim() || lead.name.trim());
      const customerType = customData?.customerType || (lead.company ? 'Company' : 'Individual');
      const industry = customData?.industry || lead.industry || '';
      const website = customData?.website || lead.website || '';
      const contactPersonName = customData?.contactName?.trim() || (lead.decisionMaker || lead.contactPerson || lead.name).trim();
      const designation = customData?.contactDesignation?.trim() || lead.designation || 'Primary Contact';
      const contactEmail = customData?.contactEmail?.trim() || lead.email || '';
      const contactPhone = customData?.contactPhone?.trim() || lead.phone || '';

      newCustomerPayload = {
        id: customerId,
        customerCode: customerId,
        customerName,
        customerType,
        industry,
        ownerId: lead.assignedTo || '',
        status: 'Active' as const,
        creditLimit: 0,
        contactName: contactPersonName,
        contactEmail,
        contactPhone,
        billingCity: (lead as any).city || (lead as any).address || '',
        billingCountry: (lead as any).country || '',
        convertedFromLeadId: lead.id,
      };

      newCustomerState = {
        id: customerId,
        customerCode: customerId,
        customerName,
        customerType,
        industry,
        ownerId: lead.assignedTo || '',
        status: 'Active',
        primaryContact: {
          name: contactPersonName,
          email: contactEmail,
          phone: contactPhone,
          alternatePhone: lead.alternatePhone,
        },
        billingAddress: {
          city: (lead as any).city || (lead as any).address || '',
          country: (lead as any).country || '',
        },
        creditLimit: 0,
        convertedFromLeadId: lead.id,
        createdAt: isoTimestamp,
        updatedAt: isoTimestamp,
      };
    }

    // 2. Prepare Contact Data (Check for existing Contact on the Customer)
    let contactId = '';
    let isExistingContactReused = false;
    let newContactState: Contact | null = null;
    let newContactPayload: any = null;

    const contactPersonName = customData?.contactName?.trim() || (lead.decisionMaker || lead.contactPerson || lead.name).trim();
    const designation = customData?.contactDesignation?.trim() || lead.designation || 'Primary Contact';
    const contactEmail = customData?.contactEmail?.trim() || lead.email || '';
    const contactPhone = customData?.contactPhone?.trim() || lead.phone || '';

    const matchedContact = findMatchingContact(lead, contacts, customerId, customData);
    if (matchedContact) {
      contactId = matchedContact.id;
      isExistingContactReused = true;
    } else {
      contactId = `CON-${timestamp}`;
      newContactPayload = {
        id: contactId,
        name: contactPersonName,
        email: contactEmail,
        phone: contactPhone,
        company: customerName,
        customerId,
        leadId: lead.id,
        title: designation,
      };

      newContactState = {
        id: contactId,
        name: contactPersonName,
        customerId,
        customerName,
        designation,
        email: contactEmail,
        phone: contactPhone,
        owner: lead.assignedTo || '',
        lastInteraction: lead.wonDate || today,
        status: 'Active',
      };
    }

    // 3. Prepare Opportunity Data (Check for existing Opportunity on Customer to avoid duplicates on retry)
    const defaultOppSummary = lead.requirement ? (lead.requirement.length > 40 ? `${lead.requirement.slice(0, 37)}...` : lead.requirement) : 'Deal';
    const oppName = customData?.opportunityName?.trim() || (lead.company ? `${lead.company} - ${defaultOppSummary}` : `${lead.name} Deal`);
    const oppValue = customData?.opportunityValue !== undefined && !isNaN(customData.opportunityValue)
      ? customData.opportunityValue
      : (lead.finalAgreedAmount || lead.value || lead.budget || 0);
    const oppExpectedClose = customData?.expectedCloseDate || lead.wonDate || lead.expectedCloseDate || today;

    let opportunityId = '';
    let newOpportunityState: Opportunity | null = null;
    let newOpportunityPayload: any = null;

    const existingOpp = opportunities.find(
      (o) => o.customerId === customerId && (o.id === lead.convertedToOpportunityId || o.name === oppName)
    );

    if (existingOpp) {
      opportunityId = existingOpp.id;
    } else {
      opportunityId = `OPP-${timestamp}`;
      newOpportunityPayload = {
        id: opportunityId,
        name: oppName,
        customerId,
        customerName,
        value: oppValue,
        probability: 100,
        expectedClose: oppExpectedClose,
        owner: lead.assignedTo || '',
        stage: 'Won',
      };

      newOpportunityState = {
        id: opportunityId,
        name: oppName,
        customerId,
        customerName,
        value: oppValue,
        probability: 100,
        expectedClose: oppExpectedClose,
        owner: lead.assignedTo || '',
        stage: 'Won',
      };
    }

    // 4. Prepare Lead updates
    const leadUpdates: Partial<Lead> = {
      convertedToCustomerId: customerId,
      convertedToContactId: contactId,
      convertedToOpportunityId: opportunityId,
      isConverted: true,
      convertedAt: isoTimestamp,
    };

    try {
      // Step A: Create Customer in PostgreSQL if not reused
      if (!isExistingCustomerReused && newCustomerPayload) {
        const custRes = await CustomersAPI.create(newCustomerPayload);
        if (!custRes.success) {
          throw new Error(custRes.message || 'Failed to create Customer record');
        }
      }

      // Step B: Create Contact in PostgreSQL if not reused, or link existing contact to customer
      if (!isExistingContactReused && newContactPayload) {
        const contRes = await ContactsAPI.create(newContactPayload);
        if (!contRes.success) {
          console.warn('⚠️ Contact creation failed during conversion, proceeding with customer:', contRes.message);
        }
      } else if (isExistingContactReused && matchedContact) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === matchedContact.id
              ? { ...c, customerId, customerName }
              : c
          )
        );
        try {
          await ContactsAPI.update(matchedContact.id, {
            customerId,
            company: customerName,
          });
        } catch (cErr) {
          console.warn('⚠️ Existing contact customer link update failed:', cErr);
        }
      }

      // Step C: Create Opportunity in PostgreSQL if not existing
      if (newOpportunityPayload) {
        const oppRes = await OpportunitiesAPI.create(newOpportunityPayload);
        if (!oppRes.success) {
          console.warn('⚠️ Opportunity creation failed during conversion, proceeding with customer:', oppRes.message);
        }
      }

      // Step D: Update Lead in PostgreSQL
      const leadRes = await LeadsAPI.update(leadId, leadUpdates);
      if (!leadRes.success) {
        console.warn('⚠️ Lead conversion stamp update failed in backend:', leadRes.message);
      }

      // Step E: Update React states
      if (newCustomerState) {
        setCustomers((prev) => [newCustomerState!, ...prev]);
      }
      if (newContactState) {
        setContacts((prev) => [newContactState!, ...prev]);
      }
      if (newOpportunityState) {
        setOpportunities((prev) => [newOpportunityState!, ...prev]);
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, ...leadUpdates } : l))
      );

      return {
        success: true,
        customerId,
        contactId,
        opportunityId,
        isExistingCustomerReused,
        isExistingContactReused,
      };
    } catch (err: any) {
      console.error('❌ Lead conversion failed:', err);
      return {
        success: false,
        message: err.message || 'An unexpected error occurred during lead conversion.',
      };
    }
  }, [leads, customers, contacts, opportunities]);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'code'> & { id?: string; code?: string }) => {
    const projectId = projectData.id || `PRJ-${Date.now().toString().slice(-4)}`;
    const projectCode = projectData.code || projectId;
    const today = new Date().toISOString().split('T')[0];

    const newProject: Project = {
      ...projectData,
      id: projectId,
      code: projectCode,
      createdAt: today,
      updatedAt: today,
    };

    setProjects((prev) => [newProject, ...prev]);

    try {
      const res = await ProjectsAPI.create({
        id: newProject.id,
        code: newProject.code,
        name: newProject.name,
        client: newProject.client,
        customerId: newProject.customerId,
        sourceLeadId: newProject.sourceLeadId,
        sourceOpportunityId: newProject.sourceOpportunityId,
        projectRequirement: newProject.projectRequirement,
        projectNotes: newProject.projectNotes,
        projectManager: newProject.projectManager,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        budget: newProject.budget,
        spent: newProject.spent,
        progress: newProject.progress,
        status: newProject.status,
      });
      if (res.success && res.data) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...newProject, id: res.data.id, code: res.data.code } : p)));
        return res.data;
      }
    } catch (err: any) {
      console.warn('⚠️ [Projects] Failed to persist project:', err.message);
    }
    return newProject;
  }, []);

  const createProjectFromLead = useCallback(async (
    leadId: string,
    customData?: {
      name?: string;
      client?: string;
      projectRequirement?: string;
      projectNotes?: string;
      projectManager?: string;
      startDate?: string;
      endDate?: string;
      budget?: number;
      status?: Project['status'];
      priority?: Project['priority'];
    }
  ): Promise<{ success: boolean; projectId?: string; message?: string }> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) {
      return { success: false, message: 'Lead not found.' };
    }

    if (lead.stage !== 'Won') {
      return {
        success: false,
        message: `Project can only be created from a "Won" lead. Current stage is "${lead.stage}".`,
      };
    }

    if (lead.isProjectCreated || lead.projectId) {
      return {
        success: false,
        projectId: lead.projectId,
        message: 'A Project has already been created from this won lead.',
      };
    }

    // Identify customer
    const customer = customers.find(
      (c) => c.id === lead.convertedToCustomerId || (lead.company && c.customerName.toLowerCase() === lead.company.toLowerCase())
    );
    const clientName = customData?.client || customer?.customerName || lead.company || lead.name;

    // Requirement summary helper for project name
    const reqText = (customData?.projectRequirement || lead.requirement || '').trim();
    let reqSummary = 'Implementation Project';
    if (reqText) {
      const lower = reqText.toLowerCase();
      if (lower.includes('crm') && lower.includes('hrms')) {
        reqSummary = 'CRM and HRMS Implementation';
      } else if (lower.includes('crm')) {
        reqSummary = 'CRM Implementation';
      } else if (lower.includes('hrms')) {
        reqSummary = 'HRMS Implementation';
      } else if (lower.includes('erp')) {
        reqSummary = 'ERP Implementation';
      } else if (lower.includes('payroll')) {
        reqSummary = 'Payroll System Implementation';
      } else if (reqText.length <= 40) {
        reqSummary = reqText;
      } else {
        reqSummary = reqText.slice(0, 37).trim() + '...';
      }
    }

    const defaultProjectName = `${clientName} - ${reqSummary}`;
    const projectId = `PRJ-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];

    const newProject: Project = {
      id: projectId,
      code: projectId,
      name: customData?.name || defaultProjectName,
      client: clientName,
      customerId: lead.convertedToCustomerId || customer?.id || '',
      sourceLeadId: lead.id,
      sourceOpportunityId: lead.convertedToOpportunityId || '',
      projectRequirement: customData?.projectRequirement !== undefined ? customData.projectRequirement : (lead.requirement || ''),
      projectNotes: customData?.projectNotes !== undefined ? customData.projectNotes : (lead.notes || ''),
      projectManager: customData?.projectManager || lead.assignedTo || (employees[0]?.name || 'Emma Watson'),
      startDate: customData?.startDate || today,
      endDate: customData?.endDate || lead.expectedCloseDate || '',
      budget: customData?.budget !== undefined ? customData.budget : (lead.finalAgreedAmount || lead.value || lead.budget || 0),
      spent: 0,
      progress: 0,
      status: customData?.status || 'Not Started',
      priority: customData?.priority || 'Medium',
      createdAt: today,
      updatedAt: today,
    };

    // Optimistic UI updates
    setProjects((prev) => [newProject, ...prev]);
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              projectId: projectId,
              isProjectCreated: true,
              projectCreatedAt: new Date().toISOString(),
              isConverted: true,
              convertedAt: l.convertedAt || new Date().toISOString(),
            }
          : l
      )
    );

    try {
      const res = await ProjectsAPI.create({
        id: newProject.id,
        code: newProject.code,
        name: newProject.name,
        client: newProject.client,
        customerId: newProject.customerId,
        sourceLeadId: newProject.sourceLeadId,
        sourceOpportunityId: newProject.sourceOpportunityId,
        projectRequirement: newProject.projectRequirement,
        projectNotes: newProject.projectNotes,
        projectManager: newProject.projectManager,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        budget: newProject.budget,
        spent: newProject.spent,
        progress: newProject.progress,
        status: newProject.status,
        priority: newProject.priority,
      });

      if (res.success && res.data) {
        const createdProj = res.data;
        const resAny = res as any;
        const resolvedCustId = resAny.customerId || lead.convertedToCustomerId || customer?.id || '';
        const resolvedContId = resAny.contactId || lead.convertedToContactId || '';
        const resolvedOppId = resAny.opportunityId || lead.convertedToOpportunityId || '';

        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  id: createdProj.id,
                  code: createdProj.code,
                  customerId: resolvedCustId,
                  sourceOpportunityId: resolvedOppId,
                }
              : p
          )
        );

        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  projectId: createdProj.id,
                  isProjectCreated: true,
                  convertedToCustomerId: resolvedCustId,
                  convertedToContactId: resolvedContId,
                  convertedToOpportunityId: resolvedOppId,
                  isConverted: true,
                  convertedAt: l.convertedAt || new Date().toISOString(),
                }
              : l
          )
        );

        // Synchronize customer in state if newly created
        if (resolvedCustId && !customers.some((c) => c.id === resolvedCustId)) {
          const newCust: Customer = {
            id: resolvedCustId,
            customerCode: resolvedCustId,
            customerName: clientName,
            customerType: lead.company ? 'Company' : 'Individual',
            industry: lead.industry || '',
            ownerId: lead.assignedTo || '',
            status: 'Active',
            primaryContact: {
              name: lead.contactPerson || lead.decisionMaker || lead.name,
              email: lead.email || '',
              phone: lead.phone || '',
            },
            billingAddress: {
              city: (lead as any).city || (lead as any).address || '',
              country: (lead as any).country || '',
            },
            creditLimit: 0,
            convertedFromLeadId: lead.id,
            createdAt: today,
            updatedAt: today,
          };
          setCustomers((prev) => [newCust, ...prev]);
        }

        // Synchronize contact in state if newly created
        if (resolvedContId && !contacts.some((ct) => ct.id === resolvedContId)) {
          const newCont: Contact = {
            id: resolvedContId,
            name: lead.contactPerson || lead.decisionMaker || lead.name,
            customerId: resolvedCustId,
            customerName: clientName,
            designation: lead.designation || 'Primary Contact',
            email: lead.email || '',
            phone: lead.phone || '',
            owner: lead.assignedTo || '',
            lastInteraction: lead.wonDate || today,
            status: 'Active',
          };
          setContacts((prev) => [newCont, ...prev]);
        }

        // Synchronize opportunity in state if newly created
        if (resolvedOppId && !opportunities.some((o) => o.id === resolvedOppId)) {
          const newOpp: Opportunity = {
            id: resolvedOppId,
            name: `${clientName} - Implementation`,
            customerId: resolvedCustId,
            customerName: clientName,
            value: customData?.budget !== undefined ? customData.budget : (lead.finalAgreedAmount || lead.value || lead.budget || 0),
            probability: 100,
            expectedClose: customData?.startDate || lead.wonDate || today,
            owner: lead.assignedTo || '',
            stage: 'Won',
          };
          setOpportunities((prev) => [newOpp, ...prev]);
        }

        return {
          success: true,
          projectId: createdProj.id,
          message: 'Project created successfully from the won lead.',
        };
      }
    } catch (err: any) {
      console.warn('⚠️ [CRM -> Projects] Failed to persist project:', err.message);
    }

    return { success: true, projectId, message: 'Project created successfully from the won lead.' };
  }, [leads, customers, contacts, opportunities, employees]);

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
    try {
      await ContactsAPI.create({
        id: tempId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.customerName,
        customerId: contact.customerId,
        leadId: contact.leadId,
        title: contact.designation,
      });
    } catch (err) {
      console.warn('⚠️ [CRM] addContact failed:', err);
    }
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c))); // Optimistic
    try {
      await ContactsAPI.update(id, {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        company: updates.customerName,
        customerId: updates.customerId,
        leadId: updates.leadId,
        title: updates.designation,
      });
    } catch (err) {
      console.warn('⚠️ [CRM] updateContact failed:', err);
    }
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id)); // Optimistic
    try {
      await ContactsAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteContact failed:', err);
    }
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

  const deleteOpportunity = useCallback(async (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id)); // Optimistic
    try {
      await OpportunitiesAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteOpportunity failed:', err);
    }
  }, []);

  const addActivity = useCallback(async (activity: Omit<Activity, 'id'>) => {
    const tempId = `ACT-${Date.now()}`;
    setActivities((prev) => [{ ...activity, id: tempId }, ...prev]); // Optimistic
    try {
      await CRMActivitiesAPI.create({
        id: tempId,
        title: activity.title,
        type: activity.type,
        purpose: activity.purpose || 'General',
        relatedTo: activity.relatedTo,
        customerId: activity.customerId,
        opportunityId: activity.opportunityId,
        assignedTo: activity.assignedTo,
        dueDate: activity.dueDate,
        priority: activity.priority,
        status: activity.status,
        outcome: activity.outcome,
      });
    } catch (err) { console.warn('⚠️ [CRM] addActivity failed:', err); }
  }, []);

  const updateActivity = useCallback(async (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, ...updates } : act))
    );
    try {
      await CRMActivitiesAPI.update(id, {
        title: updates.title,
        type: updates.type,
        purpose: updates.purpose,
        relatedTo: updates.relatedTo,
        customerId: updates.customerId,
        opportunityId: updates.opportunityId,
        assignedTo: updates.assignedTo,
        dueDate: updates.dueDate,
        priority: updates.priority,
        status: updates.status,
        outcome: updates.outcome,
      });
    } catch (err) {
      console.warn('⚠️ [CRM] updateActivity failed:', err);
    }
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id)); // Optimistic
    try {
      await CRMActivitiesAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteActivity failed:', err);
    }
  }, []);

  const addFollowUp = useCallback(async (fu: Omit<FollowUp, 'id'>) => {
    const tempId = `FU-${Date.now()}`;
    setFollowUps((prev) => [{ ...fu, id: tempId }, ...prev]); // Optimistic
    try {
      await CRMFollowUpsAPI.create({
        id: tempId,
        title: fu.title,
        notes: fu.notes,
        relatedEntity: fu.relatedEntity,
        customerId: fu.customerId,
        opportunityId: fu.opportunityId,
        leadId: fu.leadId,
        contactId: fu.contactId,
        activityId: fu.activityId,
        activityType: fu.activityType,
        dueDate: fu.dueDate,
        owner: fu.owner || fu.assignedTo,
        assignedTo: fu.assignedTo || fu.owner,
        priority: fu.priority,
        status: fu.status,
        reminder: fu.reminder,
      });
    } catch (err) {
      console.warn('⚠️ [CRM] addFollowUp failed:', err);
    }
  }, []);

  const updateFollowUp = useCallback(async (id: string, updates: Partial<FollowUp>) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    try {
      await CRMFollowUpsAPI.update(id, {
        title: updates.title,
        notes: updates.notes,
        relatedEntity: updates.relatedEntity,
        customerId: updates.customerId,
        opportunityId: updates.opportunityId,
        leadId: updates.leadId,
        contactId: updates.contactId,
        activityId: updates.activityId,
        activityType: updates.activityType,
        dueDate: updates.dueDate,
        owner: updates.owner || updates.assignedTo,
        assignedTo: updates.assignedTo || updates.owner,
        priority: updates.priority,
        status: updates.status,
        reminder: updates.reminder,
        completedAt: updates.completedAt,
      });
    } catch (err) {
      console.warn('⚠️ [CRM] updateFollowUp failed:', err);
    }
  }, []);

  const deleteFollowUp = useCallback(async (id: string) => {
    setFollowUps((prev) => prev.filter((f) => f.id !== id)); // Optimistic
    try {
      await CRMFollowUpsAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteFollowUp failed:', err);
    }
  }, []);

  const addProduct = useCallback(async (product: any): Promise<Product | null> => {
    const tempId = product.id || `PROD-${Date.now()}`;
    const mapped = mapProduct({ ...product, id: tempId });
    setProducts((prev) => [mapped, ...prev]);
    try {
      const res = await CRMProductsAPI.create({ id: tempId, ...product });
      if (res.success && res.data) {
        const saved = mapProduct(res.data);
        setProducts((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
        return saved;
      }
    } catch (err) { console.warn('⚠️ [CRM] addProduct failed:', err); }
    return mapped;
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? mapProduct({ ...p, ...updates }) : p))
    );
    try {
      const res = await CRMProductsAPI.update(id, updates);
      if (res.success && res.data) {
        const updated = mapProduct(res.data);
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    } catch (err) {
      console.warn('⚠️ [CRM] updateProduct failed:', err);
    }
  }, []);

  const adjustProductStock = useCallback(async (id: string, adjustment: { adjustmentQuantity: number; reason: string; notes?: string; performedBy?: string; location?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await CRMProductsAPI.adjustStock(id, adjustment);
      if (res.success && res.data) {
        const updated = mapProduct(res.data);
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Failed to adjust stock' };
    } catch (err: any) {
      console.warn('⚠️ [CRM] adjustProductStock failed:', err);
      return { success: false, message: err.message || 'Stock adjustment failed' };
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await CRMProductsAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteProduct failed:', err);
    }
  }, []);

  const addQuotation = useCallback(async (quotation: Omit<Quotation, 'id'>): Promise<Quotation | null> => {
    const tempId = `QT-${Date.now()}`;
    const newQuote: Quotation = { id: tempId, ...quotation };
    setQuotations((prev) => [newQuote, ...prev]);
    try {
      const res = await QuotationsAPI.create({ id: tempId, ...quotation });
      if (res.success && res.data) {
        const savedQuote: Quotation = {
          ...newQuote,
          id: res.data.id,
          quoteNumber: res.data.quote_number || newQuote.quoteNumber,
        };
        setQuotations((prev) => prev.map((q) => (q.id === tempId ? savedQuote : q)));
        return savedQuote;
      }
    } catch (err) { console.warn('⚠️ [CRM] addQuotation failed:', err); }
    return newQuote;
  }, []);

  const updateQuotation = useCallback(async (id: string, updates: Partial<Quotation>) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    try {
      await QuotationsAPI.update(id, updates);
    } catch (err) {
      console.warn('⚠️ [CRM] updateQuotation failed:', err);
    }
  }, []);

  const deleteQuotation = useCallback(async (id: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    try {
      await QuotationsAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteQuotation failed:', err);
    }
  }, []);

  const addSalesOrder = useCallback(async (so: Omit<SalesOrder, 'id'>): Promise<SalesOrder | null> => {
    const tempId = `SO-${Date.now()}`;
    const newSO: SalesOrder = { id: tempId, ...so };
    setSalesOrders((prev) => [newSO, ...prev]);
    try {
      const res = await SalesOrdersAPI.create({ id: tempId, ...so });
      if (res.success && res.data) {
        const savedSO: SalesOrder = {
          ...newSO,
          id: res.data.id,
          soNumber: res.data.so_number || newSO.soNumber,
        };
        setSalesOrders((prev) => prev.map((s) => (s.id === tempId ? savedSO : s)));
        // Also link the quotation to this sales order in local state
        if (so.quotationId) {
          setQuotations((prev) =>
            prev.map((q) =>
              q.id === so.quotationId
                ? { ...q, salesOrderId: savedSO.id, salesOrderNumber: savedSO.soNumber }
                : q
            )
          );
        }
        return savedSO;
      }
    } catch (err) { console.warn('⚠️ [CRM] addSalesOrder failed:', err); }
    return newSO;
  }, []);

  const updateSalesOrder = useCallback(async (id: string, updates: Partial<SalesOrder>) => {
    setSalesOrders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      await SalesOrdersAPI.update(id, updates);
    } catch (err) {
      console.warn('⚠️ [CRM] updateSalesOrder failed:', err);
    }
  }, []);

  const deleteSalesOrder = useCallback(async (id: string) => {
    setSalesOrders((prev) => prev.filter((s) => s.id !== id));
    try {
      await SalesOrdersAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteSalesOrder failed:', err);
    }
  }, []);

  const addInvoice = useCallback(async (inv: Omit<Invoice, 'id'>): Promise<Invoice | null> => {
    const tempId = `INV-${Date.now()}`;
    const newInv: Invoice = { id: tempId, ...inv };
    setInvoices((prev) => [newInv, ...prev]);
    try {
      const res = await CRMInvoicesAPI.create({ id: tempId, ...inv });
      if (res.success && res.data) {
        const savedInv: Invoice = {
          ...newInv,
          id: res.data.id,
          invoiceNumber: res.data.invoice_number || newInv.invoiceNumber,
        };
        setInvoices((prev) => prev.map((i) => (i.id === tempId ? savedInv : i)));
        // Also link the sales order to this invoice in local state
        if (inv.salesOrderId) {
          setSalesOrders((prev) =>
            prev.map((so) =>
              so.id === inv.salesOrderId
                ? { ...so, invoiceId: savedInv.id, invoiceNumber: savedInv.invoiceNumber }
                : so
            )
          );
        }
        return savedInv;
      }
    } catch (err) { console.warn('⚠️ [CRM] addInvoice failed:', err); }
    return newInv;
  }, []);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
    try {
      await CRMInvoicesAPI.update(id, updates);
    } catch (err) {
      console.warn('⚠️ [CRM] updateInvoice failed:', err);
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    try {
      await CRMInvoicesAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteInvoice failed:', err);
    }
  }, []);

  const addVendor = useCallback(async (vendor: Omit<Vendor, 'id'>): Promise<Vendor | null> => {
    const tempId = `VND-${Date.now()}`;
    const newVendor: Vendor = mapVendor({ id: tempId, ...vendor });
    setVendors((prev) => [newVendor, ...prev]);
    try {
      const res = await VendorsAPI.create({ id: tempId, ...vendor });
      if (res.success && res.data) {
        const savedVendor: Vendor = mapVendor(res.data);
        setVendors((prev) => prev.map((v) => (v.id === tempId ? savedVendor : v)));
        return savedVendor;
      }
    } catch (err) { console.warn('⚠️ [CRM] addVendor failed:', err); }
    return newVendor;
  }, []);

  const updateVendor = useCallback(async (id: string, updates: Partial<Vendor>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    try {
      const res = await VendorsAPI.update(id, updates);
      if (res.success && res.data) {
        const updated = mapVendor(res.data);
        setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
      }
    } catch (err) {
      console.warn('⚠️ [CRM] updateVendor failed:', err);
    }
  }, []);

  const deleteVendor = useCallback(async (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    try {
      await VendorsAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deleteVendor failed:', err);
    }
  }, []);

  const addPurchaseOrder = useCallback(async (po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder | null> => {
    const tempId = `PO-${Date.now()}`;
    const newPO: PurchaseOrder = { id: tempId, ...po };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    try {
      const res = await PurchaseOrdersAPI.create({ id: tempId, ...po });
      if (res.success && res.data) {
        const savedPO: PurchaseOrder = {
          ...newPO,
          id: res.data.id,
          poNumber: res.data.po_number || newPO.poNumber,
        };
        setPurchaseOrders((prev) => prev.map((p) => (p.id === tempId ? savedPO : p)));
        return savedPO;
      }
    } catch (err) { console.warn('⚠️ [CRM] addPurchaseOrder failed:', err); }
    return newPO;
  }, []);

  const updatePurchaseOrder = useCallback(async (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    try {
      await PurchaseOrdersAPI.update(id, updates);
    } catch (err) {
      console.warn('⚠️ [CRM] updatePurchaseOrder failed:', err);
    }
  }, []);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
    try {
      await PurchaseOrdersAPI.delete(id);
    } catch (err) {
      console.warn('⚠️ [CRM] deletePurchaseOrder failed:', err);
    }
  }, []);

  const receivePurchaseOrderGoods = useCallback(async (
    id: string, 
    data?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const res = await PurchaseOrdersAPI.receive(id, data || {});
      if (res.success) {
        // Refresh products and purchase orders from database to reflect updated inventory stock and PO status
        const [poRes, prodRes] = await Promise.all([
          PurchaseOrdersAPI.getAll(),
          CRMProductsAPI.getAll()
        ]);
        if (poRes.success && Array.isArray(poRes.data)) {
          setPurchaseOrders(poRes.data.map(mapPurchaseOrder));
        }
        if (prodRes.success && Array.isArray(prodRes.data)) {
          setProducts(prodRes.data.map((r: any) => ({
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
        return { success: true, data: res.data };
      }
      return { success: false, error: (res as any).error || res.message || 'Failed to process goods receipt' };
    } catch (err: any) {
      console.warn('⚠️ [CRM] receivePurchaseOrderGoods failed:', err);
      return { success: false, error: err.message || 'Error occurred while receiving goods' };
    }
  }, []);

  const invoicePurchaseOrder = useCallback(async (
    id: string, 
    data?: any
  ): Promise<{ success: boolean; data?: any; invoice_number?: string; error?: string }> => {
    try {
      const res = await PurchaseOrdersAPI.invoice(id, data || {});
      if (res.success) {
        const [poRes, vndRes] = await Promise.all([
          PurchaseOrdersAPI.getAll(),
          VendorsAPI.getAll()
        ]);
        if (poRes.success && Array.isArray(poRes.data)) {
          setPurchaseOrders(poRes.data.map(mapPurchaseOrder));
        }
        if (vndRes.success && Array.isArray(vndRes.data)) {
          setVendors(vndRes.data.map(mapVendor));
        }
        return { success: true, data: res.data, invoice_number: res.data?.vendor_invoice_number };
      }
      return { success: false, error: (res as any).error || res.message || 'Failed to create vendor invoice' };
    } catch (err: any) {
      console.warn('⚠️ [CRM] invoicePurchaseOrder failed:', err);
      return { success: false, error: err.message || 'Error occurred while creating vendor invoice' };
    }
  }, []);

  const recordPurchasePayment = useCallback(async (
    id: string, 
    data?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const res = await PurchaseOrdersAPI.recordPayment(id, data || {});
      if (res.success) {
        const [poRes, vndRes, bankRes] = await Promise.all([
          PurchaseOrdersAPI.getAll(),
          VendorsAPI.getAll(),
          BankingAPI.getAccounts()
        ]);
        if (poRes.success && Array.isArray(poRes.data)) {
          setPurchaseOrders(poRes.data.map(mapPurchaseOrder));
        }
        if (vndRes.success && Array.isArray(vndRes.data)) {
          setVendors(vndRes.data.map(mapVendor));
        }
        if (bankRes.success && Array.isArray(bankRes.data)) {
          setBankAccounts(bankRes.data.map((r: any) => ({
            id: r.id,
            accountNumber: r.account_number || r.accountNumber || '',
            bankName: r.bank_name || r.bankName || '',
            accountType: r.account_type || r.accountType || 'Current',
            balance: parseFloat(r.balance) || 0,
            currency: r.currency || 'INR',
          })));
        }
        return { success: true, data: res.data };
      }
      return { success: false, error: (res as any).error || res.message || 'Failed to record purchase payment' };
    } catch (err: any) {
      console.warn('⚠️ [CRM] recordPurchasePayment failed:', err);
      return { success: false, error: err.message || 'Error occurred while recording payment' };
    }
  }, []);

  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: `NOTE-${Date.now()}`,
      createdAt: 'Just now',
      updatedAt: 'Just now',
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const addDocument = (doc: Omit<DocumentFile, 'id' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    setDocuments((prev) => [{ ...doc, id: `DOC-${Date.now()}`, updatedAt: now }, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const approveExpense = (id: string) => {
    setExpenseClaims((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item))
    );
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

  const addEmployee = (empData: Partial<Employee>): Employee => {
    const empCode = empData.empCode || empData.id || 'EMP-001';
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
    setEmployees(prev => {
      const exists = prev.some(e => e.id === empCode || e.empCode === empCode);
      const nextList = exists ? prev.map(e => e.id === empCode || e.empCode === empCode ? { ...e, ...newEmp } : e) : [...prev, newEmp];
      return nextList.sort((a, b) => {
        const numA = parseInt((a.empCode || a.id || '').replace(/\D/g, '') || '0', 10);
        const numB = parseInt((b.empCode || b.id || '').replace(/\D/g, '') || '0', 10);
        return numA - numB;
      });
    });

    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id || emp.empCode === id ? { ...emp, ...updates } : emp));

    // Update permanently in PostgreSQL database via API
    fetch(`/api/employees/${encodeURIComponent(id)}`, {
      method: 'PATCH',
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

    fetch(`/api/employees/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData),
    }).catch(err => console.warn('DB transfer error:', err));
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

    fetch(`/api/employees/${id}/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: exitReason }),
    }).catch(err => console.warn('DB exit error:', err));
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

    // Save permanently to PostgreSQL database
    fetch(`/api/employees/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).catch(err => console.warn('DB confirm error:', err));
  };

  const convertCandidateToEmployee = (candidateId: string, customDetails?: Partial<Employee>): Employee => {
    const candidate = jobCandidates.find(c => c.id === candidateId);
    let empCode = customDetails?.empCode || customDetails?.id;
    if (!empCode || !empCode.startsWith('EMP-')) {
      const maxExistingNum = employees.reduce((max, e) => {
        const num = parseInt((e.empCode || e.id || '').replace(/\D/g, '') || '0', 10);
        return num > max ? num : max;
      }, 10);
      empCode = `EMP-${String(maxExistingNum + 1).padStart(3, '0')}`;
    }

    const targetStatus = customDetails?.status || 'Probation';

    const newEmp: Employee = {
      id: empCode,
      empCode,
      name: candidate ? candidate.name : customDetails?.name || 'New Employee',
      email: candidate ? candidate.email : customDetails?.email || `${empCode.toLowerCase()}@democompany.com`,
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
        setUserProfile,
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
        convertLead,
        customers,
        addCustomer,
        updateCustomer,
        contacts,
        addContact,
        updateContact,
        deleteContact,
        opportunities,
        addOpportunity,
        updateOpportunity,
        deleteOpportunity,
        activities,
        addActivity,
        updateActivity,
        deleteActivity,
        followUps,
        addFollowUp,
        updateFollowUp,
        deleteFollowUp,
        notes,
        addNote,
        products,
        addProduct,
        updateProduct,
        adjustProductStock,
        deleteProduct,
        quotations,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        salesOrders,
        addSalesOrder,
        updateSalesOrder,
        deleteSalesOrder,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        purchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        receivePurchaseOrderGoods,
        invoicePurchaseOrder,
        recordPurchasePayment,
        vendors,
        addVendor,
        updateVendor,
        deleteVendor,
        syncFromDatabase,
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
        projects,
        setProjects,
        addProject,
        createProjectFromLead,
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
