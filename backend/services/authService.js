import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { hrmsPool as pool } from '../db/pool.js'; // HRMS DB — Friend 2 (users/employees)

const JWT_SECRET = process.env.JWT_SECRET || 'crm_hrms_super_secret_jwt_key_2026';

export class AuthService {
  static async loginEmployee(employeeId, pin) {
    if (!employeeId || pin === undefined || pin === null || String(pin).trim() === '') {
      const err = new Error('Employee ID and PIN/password are required.');
      err.statusCode = 400;
      throw err;
    }

    const trimmedId = String(employeeId).trim();
    const trimmedPin = String(pin).trim();

    // Support numeric employee IDs (e.g., '7', '8', 'EMP-007', 'EMP-008') as well as exact emp_code, id, email
    const isEmail = trimmedId.includes('@');
    const numericPart = !isEmail ? trimmedId.replace(/\D/g, '') : '';
    const numericVal = numericPart ? parseInt(numericPart, 10) : null;

    // 1. Query database for that Employee ID
    const res = await pool.query(
      `SELECT * FROM employees 
       WHERE LOWER(emp_code) = LOWER($1) 
          OR LOWER(id) = LOWER($1) 
          OR LOWER(email) = LOWER($1)
          OR ($2::bigint IS NOT NULL AND (
               COALESCE(NULLIF(regexp_replace(emp_code, '[^0-9]', '', 'g'), ''), '0')::bigint = $2::bigint
            OR COALESCE(NULLIF(regexp_replace(id, '[^0-9]', '', 'g'), ''), '0')::bigint = $2::bigint
          ))
       LIMIT 1`,
      [trimmedId, numericVal]
    );

    // 2. If employee does not exist in database, reject with explicit error message
    if (res.rows.length === 0) {
      const err = new Error('Employee ID does not exist. Please enter a valid Employee ID.');
      err.statusCode = 401;
      throw err;
    }

    const employee = res.rows[0];

    // 3. Status check: Exited accounts cannot log in
    if (employee.status === 'Exited') {
      const err = new Error('Account inactive / Employee Exited.');
      err.statusCode = 401;
      throw err;
    }

    // 4. Validate credentials against real employee record in database
    let isPinMatch = false;
    if (employee.pin_hash && (employee.pin_hash.startsWith('$2a$') || employee.pin_hash.startsWith('$2b$'))) {
      isPinMatch = await bcrypt.compare(trimmedPin, employee.pin_hash);
    }
    
    // Check stored plain PIN for this employee if bcrypt didn't match or wasn't set
    if (!isPinMatch) {
      if (
        (employee.plain_pin && String(employee.plain_pin).trim() === trimmedPin) ||
        (employee.pin && String(employee.pin).trim() === trimmedPin)
      ) {
        isPinMatch = true;
        // Upgrade employee pin to bcrypt hash automatically in DB
        const newHash = await bcrypt.hash(trimmedPin, 10);
        await pool.query('UPDATE employees SET pin_hash = $1 WHERE id = $2', [newHash, employee.id]);
      }
    }

    if (!isPinMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    // 5. Determine user role & permissions from employee record
    const designation = employee.designation || '';
    const role = (designation.includes('Director') || designation.includes('VP') || designation.includes('Admin')) ? 'Executive' 
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

