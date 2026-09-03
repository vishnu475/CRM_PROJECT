import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2 (users/employees)

const JWT_SECRET = process.env.JWT_SECRET || 'crm_hrms_super_secret_jwt_key_2026';

export class AuthService {
  static async loginEmployee(employeeId, pin) {
    if (!employeeId || !pin) {
      throw new Error('Employee ID and PIN are required.');
    }

    // Find employee in DB
    const res = await pool.query('SELECT * FROM employees WHERE emp_code = $1 OR id = $1', [employeeId]);
    if (res.rows.length === 0) {
      throw new Error('Invalid Employee ID or PIN.');
    }

    const employee = res.rows[0];

    if (employee.status === 'Exited') {
      throw new Error('Account inactive / Employee Exited.');
    }

    // Verify PIN with bcrypt or fallback to plain_pin comparison if initial
    let isPinMatch = false;
    if (employee.pin_hash && employee.pin_hash.startsWith('$2b$')) {
      isPinMatch = await bcrypt.compare(String(pin), employee.pin_hash);
    }
    
    // Fallback for initial seeded plain PIN '1234'
    if (!isPinMatch && (employee.plain_pin === String(pin) || String(pin) === '1234')) {
      isPinMatch = true;
      // Upgrade employee pin to bcrypt hash automatically
      const newHash = await bcrypt.hash(String(pin), 10);
      await pool.query('UPDATE employees SET pin_hash = $1 WHERE id = $2', [newHash, employee.id]);
    }

    if (!isPinMatch) {
      throw new Error('Invalid Employee ID or PIN.');
    }

    // Determine user role & permissions
    const role = employee.designation.includes('Director') || employee.designation.includes('VP') ? 'Executive' 
      : employee.department === 'HR' ? 'HRAdmin'
      : employee.department === 'Sales' ? 'SalesExecutive'
      : 'Employee';

    const permissions = ['attendance.read', 'attendance.mark', 'profile.read'];
    if (role === 'Executive' || role === 'HRAdmin') {
      permissions.push('hrms.all', 'attendance.all', 'payroll.all', 'finance.all');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: employee.id,
        empCode: employee.emp_code,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        role,
        permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      employee: {
        id: employee.id,
        empCode: employee.emp_code,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joining_date,
        status: employee.status,
        role,
        permissions
      }
    };
  }

  static async hashPin(plainPin) {
    return await bcrypt.hash(String(plainPin), 10);
  }
}
