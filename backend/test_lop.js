import { pool } from './db/pool.js';
import { PayrollService } from './services/payrollService.js';

async function testLOP() {
  await pool.query(`
    INSERT INTO attendance_records (id, employee_id, date, status, work_hours) 
    VALUES ('ATT-TEST-003-1', 'EMP-003', '2026-08-20', 'Absent', 0) 
    ON CONFLICT (employee_id, date) DO UPDATE SET status = 'Absent'
  `);

  const summary = await PayrollService.getConfirmedPayrollSummary();
  const priya = summary.find(s => s.empCode === 'EMP-003');
  console.log('Priya Sharma Dynamic LOP Result:');
  console.log('  Gross Salary:', priya.grossPay);
  console.log('  LOP Days:', priya.lopDays);
  console.log('  LOP Loss Deduction (Gross / 26 * LOP Days):', priya.lopDeduction);
  console.log('  Total Deductions (PF + ESI + TDS + LOP):', priya.totalDeductions);
  console.log('  Net Payable Salary:', priya.netPay);
  process.exit(0);
}

testLOP();
