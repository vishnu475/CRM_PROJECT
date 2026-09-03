import { ModuleId } from '../types';

export interface SubSectionRoute {
  id: string;
  path: string;
  label: string;
}

export interface RouteConfig {
  id: ModuleId;
  path: string;
  label: string;
  defaultSubSection?: string;
  subSections?: SubSectionRoute[];
}

export const MODULE_ROUTES: RouteConfig[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Executive Dashboard' },
  {
    id: 'crm',
    path: '/crm',
    label: 'CRM & Sales Pipeline',
    defaultSubSection: 'overview',
    subSections: [
      { id: 'overview', path: '/crm/overview', label: 'CRM Overview' },
      { id: 'leads', path: '/crm/leads', label: 'Leads' },
      { id: 'add-lead', path: '/crm/add-lead', label: 'Add Lead' },
      { id: 'lead-details', path: '/crm/lead-details', label: 'Lead Details' },
      { id: 'customers', path: '/crm/customers', label: 'Customers' },
      { id: 'add-customer', path: '/crm/add-customer', label: 'Add Customer' },
      { id: 'customer-details', path: '/crm/customer-details', label: 'Customer Details' },
      { id: 'contacts', path: '/crm/contacts', label: 'Contacts' },
      { id: 'opportunities', path: '/crm/opportunities', label: 'Opportunities' },
      { id: 'activities', path: '/crm/activities', label: 'Activities' },
      { id: 'follow-ups', path: '/crm/follow-ups', label: 'Follow-ups' },
      { id: 'pipeline', path: '/crm/pipeline', label: 'Deal Pipeline' },
      { id: 'notes', path: '/crm/notes', label: 'Notes' },
    ]
  },
  { id: 'customers', path: '/customers', label: 'Customers & Account Ledger' },
  { id: 'sales', path: '/sales', label: 'Sales Orders & Invoicing' },
  { id: 'vendors', path: '/vendors', label: 'Vendors & Procurement' },
  { id: 'purchases', path: '/purchases', label: 'Purchase Orders & Bills' },
  { id: 'inventory', path: '/inventory', label: 'Stock & Inventory Management' },
  { id: 'projects', path: '/projects', label: 'Project Management' },
  { id: 'tasks', path: '/tasks', label: 'Tasks & Deliverables' },
  { id: 'helpdesk', path: '/helpdesk', label: 'Support Helpdesk & Tickets' },
  {
    id: 'administration',
    path: '/administration',
    label: 'Administration & System Control',
    defaultSubSection: 'users',
    subSections: [
      { id: 'users', path: '/administration/users', label: 'User Directory' },
      { id: 'roles', path: '/administration/roles', label: 'Roles & Permissions' },
      { id: 'company', path: '/administration/company', label: 'Company & Branches' },
      { id: 'hierarchy', path: '/administration/hierarchy', label: 'Org Hierarchy' },
      { id: 'audit', path: '/administration/audit', label: 'Audit Trail' },
    ]
  },
  {
    id: 'hrms',
    path: '/hrms',
    label: 'HRMS & Employee Records',
    defaultSubSection: 'employees',
    subSections: [
      { id: 'directory', path: '/hrms/directory', label: 'Employee Directory' },
      { id: 'employees', path: '/hrms/employees', label: 'Employee Directory' },
      { id: 'all', path: '/hrms/all', label: 'All Employees' },
      { id: 'joined', path: '/hrms/joined', label: 'Joined Employees' },
      { id: 'probation', path: '/hrms/probation', label: 'Employees on Probation' },
      { id: 'confirmed', path: '/hrms/confirmed', label: 'Confirmed Employees' },
      { id: 'active', path: '/hrms/active', label: 'Active Employees' },
      { id: 'transferred', path: '/hrms/transferred', label: 'Transferred Employees' },
      { id: 'exited', path: '/hrms/exited', label: 'Exited Employees' },
      { id: 'dashboard', path: '/hrms/dashboard', label: 'Employee Analytics' },
      { id: 'hierarchy', path: '/hrms/hierarchy', label: 'Reporting Org Chart' },
    ]
  },
  {
    id: 'recruitment',
    path: '/recruitment',
    label: 'Recruitment & ATS',
    defaultSubSection: 'kanban',
    subSections: [
      { id: 'kanban', path: '/recruitment/kanban', label: 'ATS Kanban' },
      { id: 'list', path: '/recruitment/list', label: 'Candidates List' },
      { id: 'jobs', path: '/recruitment/jobs', label: 'Job Openings' },
      { id: 'interviews', path: '/recruitment/interviews', label: 'Interviews' },
      { id: 'offers', path: '/recruitment/offers', label: 'Offers' },
      { id: 'dashboard', path: '/recruitment/dashboard', label: 'Recruitment Analytics' },
    ]
  },
  {
    id: 'attendance',
    path: '/attendance',
    label: 'Time & Attendance Tracking',
    defaultSubSection: 'daily',
    subSections: [
      { id: 'daily', path: '/attendance/daily', label: 'Daily Logs' },
      { id: 'live', path: '/attendance/live', label: 'Live Kiosk Feed' },
      { id: 'regularizations', path: '/attendance/regularizations', label: 'Regularizations' },
      { id: 'calendar', path: '/attendance/calendar', label: 'Attendance Calendar' },
      { id: 'overtime', path: '/attendance/overtime', label: 'Overtime Manager' },
    ]
  },
  {
    id: 'leave',
    path: '/leave',
    label: 'Leave Management',
    defaultSubSection: 'requests',
    subSections: [
      { id: 'requests', path: '/leave/requests', label: 'Leave Requests' },
      { id: 'master', path: '/leave/master', label: 'Leave Master Config' },
      { id: 'encashment', path: '/leave/encashment', label: 'Encashment & Comp-Off' },
      { id: 'holidays', path: '/leave/holidays', label: 'Holiday Calendar' },
    ]
  },
  {
    id: 'payroll',
    path: '/payroll',
    label: 'Payroll Processing',
    defaultSubSection: 'register',
    subSections: [
      { id: 'register', path: '/payroll/register', label: 'Payroll Register' },
      { id: 'structures', path: '/payroll/structures', label: 'Salary Structures' },
      { id: 'loans', path: '/payroll/loans', label: 'Loans & Advances' },
      { id: 'reports', path: '/payroll/reports', label: 'Department Reports' },
      { id: 'fnf', path: '/payroll/fnf', label: 'Full & Final Settlement' },
    ]
  },
  {
    id: 'accounts',
    path: '/accounts',
    label: 'Chart of Accounts & GL',
    defaultSubSection: 'coa',
    subSections: [
      { id: 'coa', path: '/accounts/coa', label: 'Chart of Accounts' },
      { id: 'vouchers', path: '/accounts/vouchers', label: 'Accounting Vouchers' },
      { id: 'ar_ap', path: '/accounts/ar_ap', label: 'AR & AP Control' },
    ]
  },
  {
    id: 'ledger',
    path: '/ledger',
    label: 'General Ledger & Journal',
    defaultSubSection: 'journals',
    subSections: [
      { id: 'journals', path: '/ledger/journals', label: 'Journal Entries' },
      { id: 'lines', path: '/ledger/lines', label: 'Journal Lines' },
      { id: 'account_ledger', path: '/ledger/account_ledger', label: 'Account Ledger' },
      { id: 'trial_balance', path: '/ledger/trial_balance', label: 'Trial Balance' },
      { id: 'reports', path: '/ledger/reports', label: 'Financial Statements' },
    ]
  },
  {
    id: 'banking',
    path: '/banking',
    label: 'Banking & Cash Flow',
    defaultSubSection: 'accounts',
    subSections: [
      { id: 'accounts', path: '/banking/accounts', label: 'Bank Accounts' },
      { id: 'transactions', path: '/banking/transactions', label: 'Transactions' },
      { id: 'reconciliation', path: '/banking/reconciliation', label: 'Bank Reconciliation' },
    ]
  },
  {
    id: 'expenses',
    path: '/expenses',
    label: 'Expense Claims & Reimbursement',
    defaultSubSection: 'claims',
    subSections: [
      { id: 'claims', path: '/expenses/claims', label: 'Expense Claims' },
      { id: 'categories', path: '/expenses/categories', label: 'Categories' },
      { id: 'dashboard', path: '/expenses/dashboard', label: 'Expense Analytics' },
    ]
  },
  { id: 'documents', path: '/documents', label: 'Documents Vault' },
  { id: 'reports', path: '/reports', label: 'Reports & Analytics' },
  { id: 'automation', path: '/automation', label: 'Workflows & Automation' },
  {
    id: 'settings',
    path: '/settings',
    label: 'System Settings',
    defaultSubSection: 'numbering',
    subSections: [
      { id: 'numbering', path: '/settings/numbering', label: 'Document Numbering' },
      { id: 'general', path: '/settings/general', label: 'General & Profile Settings' },
    ]
  },
  {
    id: 'employee',
    path: '/employee',
    label: 'Employee Self-Service (ESS)',
    defaultSubSection: 'dashboard',
    subSections: [
      { id: 'dashboard', path: '/employee/dashboard', label: 'ESS Dashboard' },
      { id: 'profile', path: '/employee/profile', label: 'My Profile' },
      { id: 'attendance', path: '/employee/attendance', label: 'My Attendance' },
      { id: 'leave', path: '/employee/leave', label: 'My Leave' },
      { id: 'payroll', path: '/employee/payroll', label: 'My Salary' },
      { id: 'payslips', path: '/employee/payslips', label: 'My Payslips' },
      { id: 'performance', path: '/employee/performance', label: 'My Performance' },
      { id: 'expenses', path: '/employee/expenses', label: 'My Expenses' },
      { id: 'loans', path: '/employee/loans', label: 'My Loans' },
      { id: 'transfers', path: '/employee/transfers', label: 'My Transfer Requests' },
      { id: 'tasks', path: '/employee/tasks', label: 'My Tasks & Work Orders' },
      { id: 'hr-requests', path: '/employee/hr-requests', label: 'My HR Requests' },
      { id: 'documents', path: '/employee/documents', label: 'My Documents' },
      { id: 'timesheets', path: '/employee/timesheets', label: 'My Timesheets' },
      { id: 'notifications', path: '/employee/notifications', label: 'Notifications & Announcements' },
      { id: 'settings', path: '/employee/settings', label: 'Settings & Security' },
    ]
  }
];

export function parseRouteFromPath(pathname: string): { module: ModuleId; subSection: string } {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) {
    return { module: 'dashboard', subSection: '' };
  }
  const moduleSlug = parts[0].toLowerCase();
  const subSlug = parts[1] ? parts[1].toLowerCase() : '';

  // Special check for dynamic employee detail route: /hrms/employees/EMP-006 or /hrms/employee/EMP-006
  if (moduleSlug === 'hrms' && parts.length >= 3 && (subSlug === 'employees' || subSlug === 'employee')) {
    return { module: 'hrms', subSection: `employees/${parts[2]}` };
  }

  const routeConfig = MODULE_ROUTES.find(r => r.id === moduleSlug || r.path === `/${moduleSlug}`);
  if (!routeConfig) {
    return { module: 'dashboard', subSection: '' };
  }

  if (routeConfig.subSections && routeConfig.subSections.length > 0) {
    const matchedSub = routeConfig.subSections.find(s => s.id === subSlug || s.path === `/${moduleSlug}/${subSlug}`);
    if (matchedSub) {
      return { module: routeConfig.id, subSection: matchedSub.id };
    }
    return { module: routeConfig.id, subSection: routeConfig.defaultSubSection || routeConfig.subSections[0].id };
  }

  return { module: routeConfig.id, subSection: subSlug };
}

export function buildRoutePath(module: ModuleId, subSection?: string): string {
  const routeConfig = MODULE_ROUTES.find(r => r.id === module);
  if (!routeConfig) return `/${module}`;
  if (subSection) {
    return `/${module}/${subSection}`;
  }
  if (routeConfig.defaultSubSection) {
    return `/${module}/${routeConfig.defaultSubSection}`;
  }
  return `/${module}`;
}

