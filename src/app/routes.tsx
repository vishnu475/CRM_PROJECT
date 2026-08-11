import { ModuleId } from '../types';

export interface RouteConfig {
  id: ModuleId;
  path: string;
  label: string;
}

export const MODULE_ROUTES: RouteConfig[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Executive Dashboard' },
  { id: 'crm', path: '/crm', label: 'CRM & Sales Pipeline' },
  { id: 'customers', path: '/customers', label: 'Customers & Account Ledger' },
  { id: 'sales', path: '/sales', label: 'Sales Orders & Invoicing' },
  { id: 'vendors', path: '/vendors', label: 'Vendors & Procurement' },
  { id: 'purchases', path: '/purchases', label: 'Purchase Orders & Bills' },
  { id: 'inventory', path: '/inventory', label: 'Stock & Inventory Management' },
  { id: 'projects', path: '/projects', label: 'Project Management' },
  { id: 'tasks', path: '/tasks', label: 'Tasks & Deliverables' },
  { id: 'helpdesk', path: '/helpdesk', label: 'Support Helpdesk & Tickets' },
  { id: 'administration', path: '/administration', label: 'Administration & System Control' },
  { id: 'hrms', path: '/hrms', label: 'HRMS & Employee Records' },
  { id: 'recruitment', path: '/recruitment', label: 'Recruitment & ATS' },
  { id: 'attendance', path: '/attendance', label: 'Time & Attendance Tracking' },
  { id: 'leave', path: '/leave', label: 'Leave Management' },
  { id: 'payroll', path: '/payroll', label: 'Payroll Processing' },
  { id: 'accounts', path: '/accounts', label: 'Chart of Accounts & GL' },
  { id: 'ledger', path: '/ledger', label: 'General Ledger & Journal' },
  { id: 'banking', path: '/banking', label: 'Banking & Cash Flow' },
  { id: 'expenses', path: '/expenses', label: 'Expense Claims & Reimbursement' },
  { id: 'settings', path: '/settings', label: 'System Settings' }
];
