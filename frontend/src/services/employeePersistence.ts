/**
 * Central Employee Persistence Service
 * EVERY path that creates an employee must go through this service.
 * Saves directly to PostgreSQL via POST /api/employees.
 * No data is ever lost on page refresh.
 */

export async function saveEmployeeToDB(employeeData: {
  name: string;
  email?: string;
  phone?: string;
  department: string;
  designation: string;
  joiningDate?: string;
  salary: number;
  basicSalary?: number;
  allowances?: number;
  status?: string;
  reportingManagerName?: string;
  reportingManagerId?: string;
  panNumber?: string;
  uanNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  pin?: string;
}): Promise<{ success: boolean; employee: any; empCode: string }> {
  try {
    const payload = {
      name: employeeData.name,
      email: employeeData.email || `${employeeData.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: employeeData.phone || null,
      department: employeeData.department,
      designation: employeeData.designation,
      joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
      salary: employeeData.salary,
      basicSalary: employeeData.basicSalary || Math.round(employeeData.salary * 0.6),
      allowances: employeeData.allowances || Math.round(employeeData.salary * 0.4),
      status: employeeData.status || 'Joined',
      reportingManagerName: employeeData.reportingManagerName || 'Sarah Jenkins',
      reportingManagerId: employeeData.reportingManagerId || 'EMP-001',
      panNumber: employeeData.panNumber || null,
      uanNumber: employeeData.uanNumber || null,
      bankAccount: employeeData.bankAccount || null,
      ifscCode: employeeData.ifscCode || null,
      pin: employeeData.pin || '1234',
    };

    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.success) {
      console.log('✅ Employee saved to PostgreSQL:', json.data?.emp_code, json.data?.name, json.data?.status);
      return { success: true, employee: json.data, empCode: json.data?.emp_code || json.data?.id };
    } else {
      console.error('❌ DB save failed:', json.message);
      return { success: false, employee: null, empCode: '' };
    }
  } catch (err) {
    console.error('❌ DB save error:', err);
    return { success: false, employee: null, empCode: '' };
  }
}

/**
 * Fetch all employees from PostgreSQL database.
 * Used by HRMS page on mount for refresh-proof data loading.
 */
export async function fetchAllEmployeesFromDB(stage?: string): Promise<any[]> {
  try {
    const url = stage ? `/api/hrms/employees?stage=${encodeURIComponent(stage)}` : '/api/hrms/employees';
    const res = await fetch(url);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map((emp: any) => ({
        id: emp.id || emp.emp_code,
        empCode: emp.emp_code || emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone || '',
        department: emp.department,
        designation: emp.designation,
        status: emp.onboarding_stage ? 
          (emp.onboarding_stage.charAt(0).toUpperCase() + emp.onboarding_stage.slice(1).toLowerCase()) : 
          (emp.status ? (emp.status.charAt(0).toUpperCase() + emp.status.slice(1).toLowerCase()) : 'Joined'),
        salary: Number(emp.salary) || 50000,
        basicSalary: Number(emp.basic_salary) || Math.round(Number(emp.salary) * 0.6),
        allowances: Number(emp.allowances) || Math.round(Number(emp.salary) * 0.4),
        reportingManagerId: emp.reporting_manager_id || 'EMP-001',
        reportingManagerName: emp.reporting_manager_name || 'Sarah Jenkins',
        panNumber: emp.pan_number || '',
        uanNumber: emp.uan_number || '',
        bankAccount: emp.bank_account || '',
        ifscCode: emp.ifsc_code || '',
        history: [],
      }));
    }
  } catch (e) {
    console.warn('Failed to fetch employees from DB:', e);
  }
  return [];
}

/**
 * Update employee status or fields in PostgreSQL database.
 */
export async function updateEmployeeInDB(id: string, updates: Record<string, any>): Promise<boolean> {
  try {
    if (updates.status) {
      await updateOnboardingStageInDB(id, updates.status);
    }
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.success === true;
  } catch (e) {
    console.warn('Failed to update employee in DB:', e);
    return false;
  }
}

/**
 * Update HRMS onboarding stage in PostgreSQL via PATCH /api/hrms/onboarding
 */
export async function updateOnboardingStageInDB(employeeId: string, stage: string): Promise<boolean> {
  try {
    const res = await fetch('/api/hrms/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, stage }),
    });
    const json = await res.json();
    return json.success === true;
  } catch (e) {
    console.warn('Failed to update HRMS onboarding stage:', e);
    return false;
  }
}
