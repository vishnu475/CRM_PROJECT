import { useApp } from '../context/AppContext';
import { ModuleId } from '../types';

export const usePermission = () => {
  const { userRole } = useApp();

  const canAccessModule = (moduleId: ModuleId): boolean => {
    if (userRole === 'Executive') return true;
    if (userRole === 'SalesManager' || userRole === 'SalesExecutive') {
      return ['dashboard', 'crm', 'sales', 'customers', 'tasks'].includes(moduleId);
    }
    if (userRole === 'HRAdmin') {
      return ['dashboard', 'hrms', 'recruitment', 'attendance', 'leave', 'payroll'].includes(moduleId);
    }
    return true;
  };

  return { userRole, canAccessModule };
};
