import { pool } from '../db/pool.js';

async function findAshok() {
  const empRes = await pool.query("SELECT * FROM employees WHERE name ILIKE '%ashok%'");
  console.log('--- EMPLOYEE MASTER ---');
  console.log(empRes.rows);

  const psRes = await pool.query("SELECT * FROM payslips WHERE employee_name ILIKE '%ashok%' OR employee_id IN (SELECT emp_code FROM employees WHERE name ILIKE '%ashok%')");
  console.log('\n--- PAYSLIP RECORD ---');
  console.log(psRes.rows);

  process.exit(0);
}

findAshok();
