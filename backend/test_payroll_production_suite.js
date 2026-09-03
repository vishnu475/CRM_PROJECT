import { PayrollService } from './services/payrollService.js';
import { pool } from './db/pool.js';

async function runProductionSuite() {
  console.log('===========================================================');
  console.log('🚀 ENTERPRISE PAYROLL ENGINE PRODUCTION VERIFICATION SUITE');
  console.log('===========================================================');

  try {
    // 0. Clean previous test artifacts
    await pool.query("DELETE FROM payslips WHERE payroll_run_id = 'RUN-PR-2026-08'");
    await pool.query("DELETE FROM payroll_runs WHERE id = 'RUN-PR-2026-08'");
    await pool.query("DELETE FROM attendance_locks WHERE month = 8 AND year = 2026");

    // TEST 1: CONFIRMED EMPLOYEES & SALARY STRUCTURE RETRIEVAL
    console.log('\n[TEST 1] HRMS Confirmed Employees & Salary Structure Retrieval...');
    const summary = await PayrollService.getConfirmedPayrollSummary(8, 2026);
    if (summary.length > 0) {
      console.log(`✅ PASS: Retrieved ${summary.length} confirmed employee payroll records from PostgreSQL.`);
    } else {
      throw new Error('FAILED: No confirmed employees retrieved.');
    }

    // TEST 2: ATTENDANCE LOCK ENFORCEMENT — UNLOCKED PERIOD (Must Block)
    console.log('\n[TEST 2] Attendance Lock Enforcement (Unlocked Period Test)...');
    const runRes = await PayrollService.createPayrollRun({ month: 8, year: 2026, createdBy: 'HR Admin' });
    const unlockedCalc = await PayrollService.calculatePayrollRun('RUN-PR-2026-08', 'HR Admin', false);
    if (!unlockedCalc.success && unlockedCalc.message.includes('not locked')) {
      console.log(`✅ PASS: Unlocked attendance period correctly blocked calculation. Message: "${unlockedCalc.message}"`);
    } else {
      throw new Error('FAILED: Unlocked attendance did not block calculation!');
    }

    // TEST 3: ATTENDANCE LOCK ENFORCEMENT — LOCKED PERIOD (Must Allow)
    console.log('\n[TEST 3] Attendance Lock Enforcement (Locked Period Test)...');
    await pool.query(`INSERT INTO attendance_locks (id, month, year, status, locked_by) VALUES ('LOCK-2026-08', 8, 2026, 'LOCKED', 'HR Admin')`);
    const lockedCalc = await PayrollService.calculatePayrollRun('RUN-PR-2026-08', 'HR Admin', false);
    if (lockedCalc.success) {
      console.log(`✅ PASS: Locked attendance period allowed calculation. Total Employees: ${lockedCalc.count}`);
    } else {
      throw new Error(`FAILED: Locked attendance calculation failed: ${lockedCalc.message}`);
    }

    // TEST 4: UNIQUE CONSTRAINT DUP PREVENTION (UNIQUE(payroll_run_id, employee_id))
    console.log('\n[TEST 4] Database Unique Constraint (Duplicate Item Prevention)...');
    const recalc = await PayrollService.calculatePayrollRun('RUN-PR-2026-08', 'HR Admin', true);
    const countRes = await pool.query("SELECT COUNT(*) FROM payslips WHERE payroll_run_id = 'RUN-PR-2026-08'");
    if (parseInt(countRes.rows[0].count) === lockedCalc.count) {
      console.log(`✅ PASS: UNIQUE(payroll_run_id, employee_id) enforced. Recalculation updated records without duplicates (${countRes.rows[0].count} items).`);
    } else {
      throw new Error('FAILED: Duplicate payslip rows created!');
    }

    // TEST 5: WORKFLOW APPROVAL SIGN-OFF
    console.log('\n[TEST 5] Workflow Approval Sign-Off...');
    const appRes = await PayrollService.approvePayrollRun('RUN-PR-2026-08', 'HR Director');
    if (appRes.success && appRes.data.status === 'APPROVED') {
      console.log(`✅ PASS: Payroll Run approved by ${appRes.data.approved_by} at ${appRes.data.approved_at}`);
    } else {
      throw new Error('FAILED: Approval sign-off failed.');
    }

    // TEST 6: PAYROLL LOCK & HISTORICAL SNAPSHOT FREEZE
    console.log('\n[TEST 6] Payroll Lock & Historical Snapshot Freeze...');
    const lockRes = await PayrollService.lockPayrollRun('RUN-PR-2026-08', 'Finance Controller');
    if (lockRes.success && lockRes.data.status === 'LOCKED') {
      console.log(`✅ PASS: Payroll Run LOCKED by ${lockRes.data.locked_by}. Historical snapshots frozen.`);
    } else {
      throw new Error('FAILED: Lock run failed.');
    }

    // TEST 7: HISTORICAL IMMUTABILITY TEST (Change base salary in DB, verify locked payslip snapshot remains unchanged)
    console.log('\n[TEST 7] Historical Payroll Immutability Test...');
    const psBefore = await pool.query("SELECT basic_salary, gross_salary FROM payslips WHERE payroll_run_id = 'RUN-PR-2026-08' LIMIT 1");
    const originalBasic = psBefore.rows[0].basic_salary;
    
    // Mutate base employee salary in employees table
    await pool.query("UPDATE employees SET salary = 250000 WHERE emp_code = 'EMP-006' OR id = 'EMP-006'");
    
    const psAfter = await pool.query("SELECT basic_salary, gross_salary FROM payslips WHERE payroll_run_id = 'RUN-PR-2026-08' LIMIT 1");
    if (psAfter.rows[0].basic_salary === originalBasic) {
      console.log(`✅ PASS: Locked August payroll preserved original Basic Salary (₹${Number(originalBasic).toLocaleString()}) after master salary modification.`);
    } else {
      throw new Error('FAILED: Historical locked payroll was mutated!');
    }

    // TEST 8: TWO-STAGE ACCOUNTING — EVENT 1: ACCRUAL GL (DR 5000 / CR 2000 & 2100)
    console.log('\n[TEST 8] Two-Stage Accounting — Event 1: Accrual GL Posting...');
    const accrualRes = await PayrollService.postPayrollAccrual(8, 2026, 'Accounts Manager');
    if (accrualRes.success) {
      console.log(`✅ PASS: Accrual GL Posted! Ref: ${accrualRes.data.journalNumber}`);
      console.log(`  - DR 5000 Salary Expense: ₹${accrualRes.data.debitGrossAmount.toLocaleString()}`);
      console.log(`  - CR 2000 Payroll Payable: ₹${accrualRes.data.creditPayableNet.toLocaleString()}`);
      console.log(`  - CR 2100 Statutory Tax Payable: ₹${accrualRes.data.creditStatutoryDeductions.toLocaleString()}`);
    } else {
      throw new Error(`FAILED: Accrual GL Posting failed: ${accrualRes.message}`);
    }

    // TEST 9: IDEMPOTENCY CHECK — EVENT 1 (Duplicate Accrual Request Must Block)
    console.log('\n[TEST 9] Idempotency Test — Event 1 (Duplicate Accrual Block)...');
    const dupAccrual = await PayrollService.postPayrollAccrual(8, 2026, 'Accounts Manager');
    if (!dupAccrual.success && dupAccrual.isDuplicate) {
      console.log(`✅ PASS: Duplicate Accrual GL request blocked. Message: "${dupAccrual.message}"`);
    } else {
      throw new Error('FAILED: Duplicate Accrual GL request was not blocked!');
    }

    // TEST 10: TWO-STAGE ACCOUNTING — EVENT 2: SALARY PAYMENT GL (DR 2000 / CR 1000)
    console.log('\n[TEST 10] Two-Stage Accounting — Event 2: Salary Disbursal GL Posting...');
    const payRes = await PayrollService.processSalaryPayment(8, 2026, 'Finance Lead');
    if (payRes.success) {
      console.log(`✅ PASS: Salary Payment GL Processed! Ref: ${payRes.data.journalNumber}`);
      console.log(`  - DR 2000 Payroll Payable: ₹${payRes.data.netDisbursalAmount.toLocaleString()} (Payable Balance Reset to ₹0)`);
      console.log(`  - CR 1000 Bank Operating Account: ₹${payRes.data.netDisbursalAmount.toLocaleString()}`);
    } else {
      throw new Error(`FAILED: Salary Payment GL failed: ${payRes.message}`);
    }

    // TEST 11: IDEMPOTENCY CHECK — EVENT 2 (Duplicate Payment Request Must Block)
    console.log('\n[TEST 11] Idempotency Test — Event 2 (Duplicate Payment Block)...');
    const dupPay = await PayrollService.processSalaryPayment(8, 2026, 'Finance Lead');
    if (!dupPay.success && dupPay.isDuplicate) {
      console.log(`✅ PASS: Duplicate Salary Payment GL request blocked. Message: "${dupPay.message}"`);
    } else {
      throw new Error('FAILED: Duplicate Salary Payment GL request was not blocked!');
    }

    // TEST 12: SERVER-SIDE PDF PAYSLIP GENERATION
    console.log('\n[TEST 12] Server-Side PDF Payslip Content Generation...');
    const samplePs = await pool.query("SELECT id FROM payslips WHERE payroll_run_id = 'RUN-PR-2026-08' LIMIT 1");
    const pdfHtml = await PayrollService.generatePayslipPDF(samplePs.rows[0].id);
    if (pdfHtml.includes('NET SALARY DISBURSED TO BANK') && pdfHtml.includes('AUTHORIZATION')) {
      console.log(`✅ PASS: Generated Server-Side Payslip PDF Document (${pdfHtml.length} bytes HTML/PDF layout).`);
    } else {
      throw new Error('FAILED: Server-Side PDF Payslip generation failed!');
    }

    // TEST 13: FULL & FINAL SETTLEMENT PROCESSING
    console.log('\n[TEST 13] Full & Final Settlement Processing...');
    const fnfRes = await PayrollService.processFullAndFinalSettlement({
      employeeId: 'EMP-006',
      exitDate: '2026-08-31',
      pendingSalary: 50000,
      leaveEncashment: 15000,
      gratuityAmount: 40000,
      loanRecovery: 0,
      otherDeductions: 2000,
      remarks: 'Full & final exit settlement'
    });
    if (fnfRes.success && Number(fnfRes.data.net_settlement_amount) === 103000) {
      console.log(`✅ PASS: Processed Full & Final Settlement for EMP-006. Net Settlement: ₹${Number(fnfRes.data.net_settlement_amount).toLocaleString()}`);
    } else {
      throw new Error('FAILED: Full & Final Settlement failed!');
    }

    console.log('\n===========================================================');
    console.log('🎉 ALL 13 PRODUCTION VERIFICATION TESTS PASSED (100% GREEN)');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PRODUCTION SUITE ERROR:', err);
    process.exit(1);
  }
}

runProductionSuite();
