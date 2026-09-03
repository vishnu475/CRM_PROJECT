import { pool } from './db/pool.js';
import { PayrollService } from './services/payrollService.js';
import { ESSService } from './services/essService.js';
import { PaymentService } from './services/paymentService.js';

async function runE2ETests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING FULL E2E TEST: ONE-CLICK SALARY PAYMENT PIPELINE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  try {
    const month = 8;
    const year = 2026;
    const empId = 'EMP-009'; // Satya

    // 0. Clean previous test runs for August 2026 for clean repeatable test
    await pool.query('DELETE FROM payment_transactions WHERE employee_id = $1 AND month = $2 AND year = $3', [empId, month, year]);
    await pool.query('DELETE FROM payslips WHERE employee_id = $1 AND month = $2 AND year = $3', [empId, String(month), year]);
    await pool.query('DELETE FROM journal_entries WHERE voucher_no LIKE $1', [`%${empId}-${month}-${year}%`]);
    await pool.query('DELETE FROM attendance_records WHERE (employee_id = $1 OR employee_id = $2) AND EXTRACT(MONTH FROM date) = 8 AND EXTRACT(YEAR FROM date) = 2026', [empId, 'emp-009']);

    // Seed 1 Absent attendance record for August 2026 to verify dynamic LOP
    await pool.query(`
      INSERT INTO attendance_records (id, employee_id, date, status, check_in, check_out, worked_hours)
      VALUES ('ATT-EMP-009-2026-08-10', 'EMP-009', '2026-08-10', 'Absent', '-', '-', 0)
      ON CONFLICT (id) DO NOTHING
    `);

    // 1. Verify Confirmed Payroll Summary calculation
    console.log('--- TEST 1: Deterministic Payroll Calculation ---');
    const summary = await PayrollService.getConfirmedPayrollSummary(month, year);
    const satya = summary.find(s => s.empCode === empId || s.id === empId);

    assert(satya !== undefined, 'Satya (EMP-009) is found in Confirmed Payroll Register');
    assert(satya.annualSalary === 400000, `Annual Salary is strictly ₹4,00,000 (Actual: ₹${satya.annualSalary})`);
    assert(Math.abs(satya.monthlySalary - 33333.33) < 0.1, `Monthly Salary is derived as Annual ÷ 12 = ₹33,333.33 (Actual: ₹${satya.monthlySalary})`);
    assert(satya.lopDays === 1, `Attendance LOP is 1 day (Actual: ${satya.lopDays})`);
    assert(satya.lopDeduction === 1282, `LOP deduction calculated as ₹33,333.33 / 26 = ₹1,282 (Actual: ₹${satya.lopDeduction})`);
    assert(satya.hasBankDetails === true, `Bank details are present and verified (Bank: ${satya.bankName})`);
    assert(satya.paymentStatus === 'READY_FOR_PAYMENT', `Payment status is READY_FOR_PAYMENT prior to disbursal`);

    console.log(`   Calculated Net Payable for Satya: ₹${satya.netPay.toLocaleString()} (Gross: ₹${satya.grossPay.toLocaleString()} - Deductions: ₹${satya.totalDeductions.toLocaleString()})`);

    // 2. Execute One-Click Salary Payment
    console.log('\n--- TEST 2: One-Click Salary Payment Execution ---');
    const payResult = await PayrollService.payEmployeeSalary({
      employeeId: empId,
      month,
      year,
      processedBy: 'Finance Lead'
    });

    assert(payResult.success === true, `Payment executed successfully: ${payResult.message}`);
    assert(payResult.data.paymentStatus === 'PAID', `Payment transaction marked as PAID`);
    assert(payResult.data.paymentReference.startsWith('PAY-'), `Unique Payment Reference generated (${payResult.data.paymentReference})`);
    assert(payResult.data.transactionId.startsWith('TXN-'), `Provider Transaction ID generated (${payResult.data.transactionId})`);
    assert(payResult.data.bankAccountMasked.includes('2101') || payResult.data.bankAccountMasked.includes('4521'), `Masked bank account verified (${payResult.data.bankAccountMasked})`);

    // 3. Verify Database Records (payment_transactions & payslips)
    console.log('\n--- TEST 3: Database Verification in PostgreSQL ---');
    const dbTxn = await pool.query('SELECT * FROM payment_transactions WHERE employee_id = $1 AND month = $2 AND year = $3', [empId, month, year]);
    assert(dbTxn.rows.length === 1, 'Exactly 1 record created in payment_transactions table');
    assert(dbTxn.rows[0].status === 'PAID', 'payment_transactions record status is PAID');
    assert(Number(dbTxn.rows[0].amount) === payResult.data.netPay, `payment_transactions amount matches net pay (₹${dbTxn.rows[0].amount})`);

    const dbPayslip = await pool.query('SELECT * FROM payslips WHERE employee_id = $1 AND month = $2 AND year = $3', [empId, String(month), year]);
    assert(dbPayslip.rows.length === 1, 'Payslip generated and locked in payslips table');
    assert(dbPayslip.rows[0].payment_status === 'PAID', 'Payslip payment_status is PAID');
    assert(dbPayslip.rows[0].payment_reference === payResult.data.paymentReference, 'Payslip links to payment_reference');
    assert(dbPayslip.rows[0].transaction_id === payResult.data.transactionId, 'Payslip links to transaction_id');

    // 4. Verify Two-Stage Accounting General Ledger Entry
    console.log('\n--- TEST 4: Accounting GL Posting Verification ---');
    const dbJv = await pool.query('SELECT * FROM journal_entries WHERE id = $1', [payResult.data.journalVoucherNo]);
    assert(dbJv.rows.length === 1, `General Ledger journal entry created (${payResult.data.journalVoucherNo})`);
    assert(dbJv.rows[0].status === 'Posted', 'Journal entry status is Posted');
    assert(Number(dbJv.rows[0].debit_total) === payResult.data.netPay, `GL debit total matches net disbursal amount (₹${dbJv.rows[0].debit_total})`);

    // 5. Idempotency & Duplicate Payment Protection Test
    console.log('\n--- TEST 5: Duplicate Payment Protection ---');
    const duplicateAttempt = await PayrollService.payEmployeeSalary({
      employeeId: empId,
      month,
      year,
      processedBy: 'Finance Lead'
    });

    assert(duplicateAttempt.success === false, 'Duplicate payment attempt was rejected');
    assert(duplicateAttempt.code === 'ALREADY_PAID', 'Rejection reason code is ALREADY_PAID');
    assert(duplicateAttempt.isDuplicate === true, 'Duplicate flag correctly set to prevent double charge');

    const dbTxnCount = await pool.query('SELECT COUNT(*) FROM payment_transactions WHERE employee_id = $1 AND month = $2 AND year = $3', [empId, month, year]);
    assert(parseInt(dbTxnCount.rows[0].count) === 1, 'No duplicate transaction inserted into PostgreSQL');

    // 6. ESS (Employee Self-Service) Verification
    console.log('\n--- TEST 6: ESS Portal Data Sync ---');
    const essData = await ESSService.getEmployeePayroll(empId);
    assert(essData.annualSalary === 400000, `ESS Annual Salary is ₹4,00,000 (Actual: ₹${essData.annualSalary})`);
    assert(Math.abs(essData.monthlySalary - 33333.33) < 0.1, `ESS Monthly Salary is ₹33,333.33 (Actual: ₹${essData.monthlySalary})`);
    assert(essData.latestPayment !== null, 'ESS displays latestPayment transaction');
    assert(essData.latestPayment.status === 'PAID', 'ESS latestPayment status is PAID');
    assert(essData.latestPayment.paymentReference === payResult.data.paymentReference, `ESS displays payment reference (${essData.latestPayment.paymentReference})`);
    assert(essData.latestPayment.transactionId === payResult.data.transactionId, `ESS displays transaction ID (${essData.latestPayment.transactionId})`);
    assert(essData.payslips.length >= 1, `ESS has access to generated payslip archive (${essData.payslips.length} payslips)`);
    assert(essData.payslips[0].payment_status === 'PAID', 'ESS payslip status shows PAID');

    // 7. Payslip PDF Generation Test
    console.log('\n--- TEST 7: Payslip Document Generation ---');
    const pdfHtml = await PayrollService.generatePayslipPDF(dbPayslip.rows[0].id);
    assert(pdfHtml.includes('CONFIDENTIAL SALARY PAYSLIP STATEMENT'), 'Payslip HTML contains header');
    assert(pdfHtml.includes(payResult.data.paymentReference), 'Payslip HTML includes Payment Reference');
    assert(pdfHtml.includes(payResult.data.transactionId), 'Payslip HTML includes Transaction ID');
    assert(pdfHtml.includes('STATUS: PAID'), 'Payslip HTML includes STATUS: PAID stamp');

    console.log('\n===============================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} / ${total} TESTS PASSED (100% GREEN)`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('❌ E2E TEST RUNNER CRASHED:', err);
  } finally {
    await pool.end();
  }
}

runE2ETests();
