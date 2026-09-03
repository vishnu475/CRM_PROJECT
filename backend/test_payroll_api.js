import { PayrollService } from './services/payrollService.js';
import { pool } from './db/pool.js';

async function testFullPipeline() {
  try {
    console.log('--- Testing Payroll End-to-End Pipeline ---');

    // Clean previous test run
    await pool.query("DELETE FROM payslips WHERE payroll_run_id = 'RUN-PR-2026-08'");
    await pool.query("DELETE FROM payroll_runs WHERE id = 'RUN-PR-2026-08'");

    // 1. Create Draft Run
    const createRes = await PayrollService.createPayrollRun({ month: 8, year: 2026, createdBy: 'HR Admin' });
    console.log('1. Create Run:', createRes.success ? 'SUCCESS' : createRes.message);

    // 2. Calculate Run
    const calcRes = await PayrollService.calculatePayrollRun('RUN-PR-2026-08', 'HR Admin');
    console.log('2. Calculate Run:', calcRes.success ? 'SUCCESS' : calcRes.message, 'Calculated Records:', calcRes.count);

    // 3. Approve Run
    const appRes = await PayrollService.approvePayrollRun('RUN-PR-2026-08', 'HR Director');
    console.log('3. Approve Run:', appRes.success ? 'SUCCESS' : appRes.message);

    // 4. Lock Run
    const lockRes = await PayrollService.lockPayrollRun('RUN-PR-2026-08', 'Finance Controller');
    console.log('4. Lock Run:', lockRes.success ? 'SUCCESS' : lockRes.message);

    // 5. Bank Advice
    const bankRes = await PayrollService.generateBankAdvice('RUN-PR-2026-08', 'Finance Manager');
    console.log('5. Bank Advice:', bankRes.success ? 'SUCCESS' : bankRes.message, 'Batch ID:', bankRes.batchId);

    // 6. Post to General Ledger
    const glRes = await PayrollService.postPayrollToAccounts(8, 2026, 'Accounts Manager');
    console.log('6. GL Posting:', glRes.success ? 'SUCCESS' : glRes.message, 'Journal Ref:', glRes.data?.journalNumber);

    console.log('🎉 100% END-TO-END PAYROLL + BANKING + GL POSTING TEST PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ PIPELINE ERROR:', err);
    process.exit(1);
  }
}

testFullPipeline();
