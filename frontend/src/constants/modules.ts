import { ModuleId } from '../types';

export const MODULE_CATEGORIES = {
  CUSTOMER_FLOW: ['crm', 'customers', 'sales', 'vendors', 'purchases', 'inventory', 'projects', 'tasks', 'helpdesk'],
  EMPLOYEE_FLOW: ['hrms', 'recruitment', 'attendance', 'leave', 'payroll'],
  FINANCE_FLOW: ['accounts', 'ledger', 'banking', 'expenses'],
  GOVERNANCE_FLOW: ['administration', 'settings']
} as const;

export const DEFAULT_MODULE: ModuleId = 'dashboard';
