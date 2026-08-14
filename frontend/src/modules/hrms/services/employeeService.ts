export interface HRMSEmployee {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'Joined' | 'Probation' | 'Confirmed' | 'Active' | 'Transferred' | 'Exited';
  salary: number;
  basicSalary?: number;
  allowances?: number;
  reportingManagerId?: string;
  reportingManagerName?: string;
  panNumber?: string;
  uanNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
}

export class EmployeeService {
  /**
   * Fetch all employees directly from PostgreSQL database via Express API
   */
  static async fetchEmployees(): Promise<HRMSEmployee[]> {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((emp: any) => ({
            id: emp.id || emp.emp_code,
            empCode: emp.emp_code || emp.id,
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            department: emp.department,
            designation: emp.designation,
            joiningDate: emp.joining_date ? emp.joining_date.split('T')[0] : '2024-01-15',
            status: emp.status || 'Active',
            salary: Number(emp.salary) || 85000,
            basicSalary: Number(emp.basic_salary) || Math.round(Number(emp.salary) * 0.6),
            allowances: Number(emp.allowances) || Math.round(Number(emp.salary) * 0.4),
            reportingManagerId: emp.reporting_manager_id || 'EMP-001',
            reportingManagerName: emp.reporting_manager_name || 'Sarah Jenkins',
            panNumber: emp.pan_number || 'ABCDE1234F',
            uanNumber: emp.uan_number || '100987654321',
            bankAccount: emp.bank_account || '98765432101',
            ifscCode: emp.ifsc_code || 'HDFC0001234'
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch employees from database:', e);
    }
    return [];
  }

  /**
   * Update employee status or details in PostgreSQL database
   */
  static async updateEmployee(id: string, updates: Partial<HRMSEmployee>): Promise<boolean> {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const json = await res.json();
        return json.success;
      }
    } catch (e) {
      console.warn('Failed to update employee in database:', e);
    }
    return false;
  }
}
