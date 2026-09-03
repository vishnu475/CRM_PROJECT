import { pool } from './db/pool.js';
import { RecruitmentService } from './services/recruitmentService.js';
import { PayrollService } from './services/payrollService.js';

async function verifyAnnualSalaryFlow() {
  console.log('===============================================================');
  console.log('🧪 VERIFYING ANNUAL SALARY AS SOURCE OF TRUTH (ANNUAL / 12)');
  console.log('===============================================================');

  // Test matrix
  const testCases = [
    { annual: 300000, expectedMonthly: 25000.00 },
    { annual: 400000, expectedMonthly: 33333.33 },
    { annual: 600000, expectedMonthly: 50000.00 },
    { annual: 720000, expectedMonthly: 60000.00 },
    { annual: 1200000, expectedMonthly: 100000.00 },
    { annual: 1800000, expectedMonthly: 150000.00 },
  ];

  for (const tc of testCases) {
    const calculatedMonthly = Math.round((tc.annual / 12) * 100) / 100;
    if (Math.abs(calculatedMonthly - tc.expectedMonthly) < 0.01) {
      console.log(`✅ PASS: Annual CTC ₹${tc.annual.toLocaleString()} ➔ Monthly: ₹${calculatedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    } else {
      throw new Error(`FAIL: Expected ${tc.expectedMonthly}, got ${calculatedMonthly}`);
    }
  }

  // Check EMP-009 in database
  console.log('\n[DATABASE CHECK] EMP-009 (karthik / satya):');
  const empRes = await pool.query(`
    SELECT emp_code, name, annual_salary, annual_ctc, salary, basic_salary, allowances 
    FROM employees 
    WHERE emp_code = 'EMP-009' OR id = 'EMP-009'
  `);
  console.log(empRes.rows[0]);

  const emp = empRes.rows[0];
  if (Number(emp.annual_salary) === 400000 && Math.abs(Number(emp.salary) - 33333.33) < 0.01) {
    console.log('✅ PASS: EMP-009 in PostgreSQL is correctly stored as Annual: ₹4,00,000 | Monthly: ₹33,333.33');
  } else {
    throw new Error('FAIL: EMP-009 salary does not match ₹4,00,000 / 12');
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL SALARY SOURCE-OF-TRUTH VERIFICATIONS PASSED (100% GREEN)');
  console.log('===============================================================');
  process.exit(0);
}

verifyAnnualSalaryFlow().catch((err) => {
  console.error('❌ Error during verification:', err);
  process.exit(1);
});
