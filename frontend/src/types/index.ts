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
  | 'settings'
  | 'employee';

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
  phone?: string;
  role: UserRole;
  roleTitle: string;
  avatar?: string;
  company?: string;
  branch?: string;
  empCode?: string;
  department?: string;
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
  contactRole?: string;
  alternatePhone?: string;
  website?: string;
  expectedCloseDate?: string;
  requirement?: string;
  decisionMaker?: string;
  budget?: number;
  proposalAmount?: number;
  proposalDate?: string;
  proposalStatus?: 'Draft' | 'Sent';
  proposalSentDate?: string;
  finalAgreedAmount?: number;
  wonDate?: string;
  dealClosedNotes?: string;
  lostReason?: string;
  lostReasonDetails?: string;
  lostNotes?: string;
  lostDate?: string;
  convertedToCustomerId?: string;
  convertedToContactId?: string;
  convertedToOpportunityId?: string;
  isConverted?: boolean;
  convertedAt?: string;
  projectId?: string;
  isProjectCreated?: boolean;
  projectCreatedAt?: string;
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

export interface CustomerHealthSummary {
  customerId?: string;
  customerName?: string;
  status: 'Active' | 'At Risk' | 'Inactive' | 'Archived';
  daysSinceLastActivity: number | null;
  lastActivityDate: string | null;
  activeProjects: number;
  openOpportunities: number;
  activeSalesOrders: number;
  overdueFollowUps: number;
  overdueInvoices: number;
  delayedProjects: number;
  reasons: string[];
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
  healthSummary?: CustomerHealthSummary;
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

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface StockMovement {
  id: string;
  productId: string;
  product_id?: string;
  productName: string;
  product_name?: string;
  sku: string;
  movementType: 'Purchase Receipt' | 'Sales Issue' | 'Adjustment' | 'Opening Stock' | 'Return';
  movement_type?: string;
  quantity: number;
  previousStock: number;
  previous_stock?: number;
  newStock: number;
  new_stock?: number;
  referenceType?: string;
  reference_type?: string;
  referenceId?: string;
  reference_id?: string;
  referenceNumber?: string;
  reference_number?: string;
  sourceLocation?: string;
  source_location?: string;
  destinationLocation?: string;
  destination_location?: string;
  unitCost: number;
  unit_cost?: number;
  totalCost: number;
  total_cost?: number;
  reason?: string;
  performedBy?: string;
  performed_by?: string;
  notes?: string;
  createdAt: string;
  created_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  cost_price?: number;
  purchasePrice?: number;
  purchase_price?: number;
  stock: number;
  onHandStock?: number;
  on_hand_stock?: number;
  reservedStock?: number;
  reserved_stock?: number;
  availableStock?: number;
  available_stock?: number;
  reorderLevel?: number;
  reorder_level?: number;
  reorderQuantity?: number;
  reorder_quantity?: number;
  stockStatus?: StockStatus;
  stock_status?: StockStatus;
  inventoryValue?: number;
  inventory_value?: number;
  uom: string;
  hsnCode: string;
  hsn_code?: string;
  taxRate: number;
  tax_rate?: number;
  description?: string;
  warehouseLocation?: string;
  warehouse_location?: string;
  primaryVendorId?: string;
  primary_vendor_id?: string;
  primaryVendorName?: string;
  primary_vendor_name?: string;
  movementsCount?: number;
  movements_count?: number;
  movements?: StockMovement[];
  purchaseOrders?: any[];
  salesOrders?: any[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface QuotationItem {
  id?: number | string;
  quotationId?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Revision Requested' | 'Revised' | 'Accepted' | 'Approved' | 'Rejected' | 'Expired';

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  validUntil: string;
  amount: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  status: QuotationStatus;
  itemsCount: number;
  sentDate?: string;
  acceptedDate?: string;
  leadId?: string;
  opportunityId?: string;
  contactId?: string;
  revisionNumber?: number;
  terms?: string;
  notes?: string;
  owner?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  items?: QuotationItem[];
}

export interface SalesOrderItem {
  id?: number | string;
  salesOrderId?: string;
  sales_order_id?: string;
  productId?: string;
  product_id?: string;
  productName: string;
  product_name?: string;
  quantity: number;
  unitPrice: number;
  unit_price?: number;
  taxRate: number;
  tax_rate?: number;
  total: number;
}

export type SalesOrderStatus = 'Draft' | 'Confirmed' | 'Processing' | 'Delivered' | 'Completed' | 'Cancelled';

export interface SalesOrder {
  id: string;
  soNumber: string;
  so_number?: string;
  quotationId?: string;
  quoteNumber?: string;
  quotationStatus?: string;
  customerId?: string;
  customerName: string;
  customer_name?: string;
  opportunityId?: string;
  contactId?: string;
  date: string;
  totalAmount: number;
  total_amount?: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  fulfillmentStatus?: 'Pending' | 'Partial' | 'Fulfilled' | 'Cancelled';
  fulfillment_status?: 'Pending' | 'Partial' | 'Fulfilled' | 'Cancelled' | string;
  status?: SalesOrderStatus | string;
  paymentTerms?: string;
  deliveryNotes?: string;
  notes?: string;
  itemsCount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  items?: SalesOrderItem[];
}

export interface InvoiceItem {
  id?: number | string;
  invoiceId?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  quotationId?: string;
  quoteNumber?: string;
  opportunityId?: string;
  customerId?: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentTerms?: string;
  notes?: string;
  itemsCount?: number;
  items?: InvoiceItem[];
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
  annualSalary?: number;
  annualCtc?: number;
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

export interface PurchaseOrderItem {
  id?: number | string;
  purchaseOrderId?: string;
  purchase_order_id?: string;
  productId?: string;
  product_id?: string;
  productName?: string;
  item_name?: string;
  sku?: string;
  quantity: number;
  receivedQuantity?: number;
  received_quantity?: number;
  unitPrice?: number;
  unit_price?: number;
  taxRate?: number;
  tax_rate?: number;
  discountPercent?: number;
  discount_percent?: number;
  total?: number;
  total_amount?: number;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber?: string;
  receipt_number?: string;
  purchaseOrderId?: string;
  purchase_order_id?: string;
  poNumber?: string;
  po_number?: string;
  date?: string;
  received_date?: string;
  receivedBy?: string;
  received_by?: string;
  deliveryNoteNumber?: string;
  delivery_note_number?: string;
  notes?: string;
  items?: {
    id?: number | string;
    productId?: string;
    product_id?: string;
    productName?: string;
    item_name?: string;
    quantityReceived?: number;
    received_quantity?: number;
  }[];
}

export type PurchaseOrderStatus = 
  | 'Draft' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Ordered' 
  | 'Partially Received' 
  | 'Received' 
  | 'Completed' 
  | 'Cancelled';

export interface PurchasePayment {
  id: string;
  purchaseOrderId?: string;
  purchase_order_id?: string;
  vendorId?: string;
  vendor_id?: string;
  vendorInvoiceNumber?: string;
  vendor_invoice_number?: string;
  paymentNumber?: string;
  payment_number?: string;
  paymentDate: string;
  payment_date?: string;
  amount: number;
  paymentMethod: string;
  payment_method?: string;
  bankAccountId?: string;
  bank_account_id?: string;
  bankAccountName?: string;
  bank_account_name?: string;
  referenceNumber?: string;
  reference_number?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber?: string;
  po_number?: string;
  vendorId?: string;
  vendor_id?: string;
  vendorName?: string;
  vendor_name?: string;
  vendorContact?: string;
  vendor_contact?: string;
  vendorEmail?: string;
  vendor_email?: string;
  vendorPhone?: string;
  vendor_phone?: string;
  date?: string;
  order_date?: string;
  expectedDelivery?: string;
  expected_delivery?: string;
  amount?: number;
  total_amount?: number;
  subtotal?: number;
  taxAmount?: number;
  tax_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  status: PurchaseOrderStatus;
  receiptStatus?: 'Not Received' | 'Partially Received' | 'Fully Received';
  receipt_status?: 'Not Received' | 'Partially Received' | 'Fully Received';
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  payment_status?: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  paymentTerms?: string;
  payment_terms?: string;
  deliveryLocation?: string;
  delivery_location?: string;
  notes?: string;
  itemsCount?: number;
  items_count?: number;
  items?: PurchaseOrderItem[];
  receipts?: GoodsReceipt[];
  vendorInvoiceId?: string;
  vendor_invoice_id?: string;
  vendorInvoiceNumber?: string;
  vendor_invoice_number?: string;
  vendorInvoiceDate?: string;
  vendor_invoice_date?: string;
  vendorInvoiceDueDate?: string;
  vendor_invoice_due_date?: string;
  vendorInvoiceAmount?: number;
  vendor_invoice_amount?: number;
  paidAmount?: number;
  paid_amount?: number;
  amountDue?: number;
  amount_due?: number;
  lastPaymentDate?: string;
  last_payment_date?: string;
  lastPaymentReference?: string;
  last_payment_reference?: string;
  invoiceStatus?: 'No Invoice' | 'Invoice Pending' | 'Invoiced' | 'Overdue';
  invoice_status?: 'No Invoice' | 'Invoice Pending' | 'Invoiced' | 'Overdue';
  payments?: PurchasePayment[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface Vendor {
  id: string;
  code?: string;
  name: string;
  contactPerson: string;
  contact_person?: string;
  email: string;
  phone: string;
  category?: string;
  address?: string;
  gstin?: string;
  paymentTerms?: string;
  payment_terms?: string;
  status?: 'Active' | 'Inactive' | 'Suspended' | 'Archived';
  website?: string;
  notes?: string;
  payableBalance: number;
  payable_balance?: number;
  rating: number;
  totalPurchases?: number;
  total_purchases?: number;
  totalOrders?: number;
  total_orders?: number;
  openOrders?: number;
  open_orders?: number;
  pendingReceipts?: number;
  pending_receipts?: number;
  totalPaidAmount?: number;
  total_paid_amount?: number;
  calculatedAmountDue?: number;
  calculated_amount_due?: number;
  overdueAmount?: number;
  overdue_amount?: number;
  purchase_orders?: PurchaseOrder[];
  payments?: PurchasePayment[];
  createdAt?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  customerId?: string;
  sourceLeadId?: string;
  sourceOpportunityId?: string;
  projectRequirement?: string;
  projectNotes?: string;
  projectManager?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Planning';
  createdAt?: string;
  updatedAt?: string;
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

export type CrmView = 'overview' | 'leads' | 'add-lead' | 'lead-details' | 'customers' | 'add-customer' | 'customer-details' | 'contacts' | 'opportunities' | 'opportunity-details' | 'activities' | 'follow-ups' | 'pipeline' | 'notes';

export interface Contact {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  designation: string;
  contactRole?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  notes?: string;
  owner?: string;
  lastInteraction?: string;
  status?: 'Active' | 'Inactive' | string;
  department?: string;
  leadId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  purpose?: 'General' | 'Follow-up' | 'Negotiation' | 'Customer Acceptance' | 'Deal Closed';
  relatedTo: string;
  customerId?: string;
  opportunityId?: string;
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
