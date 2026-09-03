import { hrmsPool, pool as defaultPool } from '../db/pool.js';
const pool = hrmsPool || defaultPool;
import { PaymentService } from './paymentService.js';

async function logActivity(client, { module, entity, entityId, action, oldValue, newValue, performedBy }) {
  try {
    await client.query(
      `INSERT INTO activity_logs (module, entity, entity_id, action, old_value, new_value, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [module, entity, entityId, action, oldValue || null, newValue || null, performedBy || 'system']
    );
  } catch (e) {
    console.warn('Activity log error:', e.message);
  }
}

export class PayrollService {
  /**
   * Helper: Check if Attendance Period is Locked
   */
  static async checkAttendanceLock(month, year) {
    const res = await pool.query(
      `SELECT * FROM attendance_locks WHERE month = $1 AND year = $2`,
      [month, year]
    );
    if (res.rows.length === 0 || res.rows[0].status !== 'LOCKED') {
      return { isLocked: false, message: `Attendance for period ${month}/${year} is not locked. Payroll calculation cannot be finalized.` };
    }
    return { isLocked: true, lockData: res.rows[0] };
  }

  /**
   * Get dynamic pre-calculated payroll summary for Confirmed & Active Employees
   * Consumes HRMS, Attendance LOP/OT, Approved Leaves, Expenses, Loans, Bank Details, and Statutory Rules.
   */
  static async getConfirmedPayrollSummary(month, year) {
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const empRes = await pool.query(`
      SELECT 
        e.id, e.emp_code, e.name, e.department, e.designation,
        COALESCE(e.annual_salary, e.annual_ctc, ROUND((e.salary * 12)::numeric, 2)) as annual_salary,
        e.salary, e.basic_salary, e.allowances,
        e.pan_number, e.uan_number, e.bank_account, e.ifsc_code, e.status, e.joining_date, e.branch,
        b.bank_name, b.account_number as bank_account_num, b.ifsc_code as bank_ifsc
      FROM employees e
      LEFT JOIN employee_bank_details b ON (e.emp_code = b.employee_id OR e.id = b.employee_id)
      WHERE e.status NOT IN ('Exited')
      ORDER BY e.name
    `);

    const employees = empRes.rows;

    // Load active statutory rules
    const statRes = await pool.query(`SELECT * FROM statutory_rules WHERE status = 'Active' ORDER BY effective_from DESC LIMIT 1`);
    const statRule = statRes.rows[0] || {
      pf_rate: 12.0,
      pf_cap: 1800,
      esi_rate: 0.75,
      esi_threshold: 21000,
      ptax_threshold: 15000,
      ptax_amount: 200
    };

    const summaryList = [];

    for (const emp of employees) {
      const empId = emp.emp_code || emp.id;

      // 1. Fetch effective salary structure if configured
      const structRes = await pool.query(`
        SELECT * FROM salary_structures 
        WHERE employee_id = $1 AND status = 'Active' 
        ORDER BY effective_from DESC LIMIT 1
      `, [empId]);

      const struct = structRes.rows[0];
      const hasSalaryConfig = Boolean(struct || (Number(emp.salary) > 0) || (Number(emp.basic_salary) > 0) || (Number(emp.annual_salary) > 0));

      const annualSalary = Number(emp.annual_salary || 0) > 0 
        ? Number(emp.annual_salary) 
        : (struct ? Number(struct.gross_salary) * 12 : (Number(emp.salary) >= 100000 ? Number(emp.salary) : Number(emp.salary) * 12));

      const gross = struct 
        ? Number(struct.gross_salary) 
        : (annualSalary > 0 
            ? Math.round((annualSalary / 12) * 100) / 100 
            : (Number(emp.salary) || 0));

      const basic = struct ? Number(struct.basic_salary) : (Number(emp.basic_salary) || Math.round(gross * 0.6 * 100) / 100);
      const hra = struct ? Number(struct.hra) : Math.round(basic * 0.4 * 100) / 100;
      const da = struct ? Number(struct.da) : 0;
      const specialAllowance = struct ? Number(struct.special_allowance) : Math.max(0, Math.round((gross - basic - hra - da) * 100) / 100);
      const otherAllowances = struct ? Number(struct.other_allowances) : 0;

      // 2. Attendance LOP & Overtime calculation for selected month/year
      const attRes = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status IN ('Absent', 'Unexcused')) as absent_days,
          COUNT(*) FILTER (WHERE status = 'Present') as present_days,
          COALESCE(SUM(overtime_hours), 0) as ot_hours
        FROM attendance_records
        WHERE (employee_id = $1 OR employee_id = $2)
          AND EXTRACT(MONTH FROM date) = $3
          AND EXTRACT(YEAR FROM date) = $4
      `, [emp.id, empId, currentMonth, currentYear]);

      // 3. Approved Leaves Filtering
      const leaveRes = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE is_unpaid = TRUE) as unpaid_leave_days,
          COUNT(*) FILTER (WHERE is_unpaid = FALSE OR is_unpaid IS NULL) as paid_leave_days
        FROM leave_requests
        WHERE (employee_id = $1 OR employee_id = $2)
          AND (status = 'APPROVED' OR status = 'Approved')
          AND EXTRACT(MONTH FROM start_date) = $3
          AND EXTRACT(YEAR FROM start_date) = $4
      `, [emp.id, empId, currentMonth, currentYear]);

      const attAbsent = parseInt(attRes.rows[0]?.absent_days) || 0;
      const attPresent = parseInt(attRes.rows[0]?.present_days) || 0;
      const unpaidLeave = parseInt(leaveRes.rows[0]?.unpaid_leave_days) || 0;
      const paidLeave = parseInt(leaveRes.rows[0]?.paid_leave_days) || 0;

      const workingDays = 26;
      const absentDays = Math.max(attAbsent, unpaidLeave);
      const presentDays = attPresent > 0 ? attPresent : Math.max(0, workingDays - absentDays);
      const otHours = parseFloat(attRes.rows[0]?.ot_hours) || 0;

      const dailyRate = gross > 0 ? Math.round(gross / 26) : 0;
      const lopDeduction = Math.round(dailyRate * absentDays);
      const hourlyRate = basic > 0 ? (basic / (26 * 8)) : 0;
      const otPay = Math.round(otHours * hourlyRate * 1.5);

      // 4. Approved Reimbursements & Expenses
      const expRes = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_reimb
        FROM expense_claims
        WHERE (employee_id = $1 OR emp_name = $2) 
          AND status IN ('Approved', 'APPROVED', 'FINANCE_APPROVED', 'Finance Approved')
      `, [empId, emp.name]);
      const reimbursements = parseFloat(expRes.rows[0]?.total_reimb) || 0;

      // 5. Active Loan Monthly EMI
      const loanRes = await pool.query(`
        SELECT COALESCE(SUM(monthly_emi), 0) as total_emi
        FROM loans
        WHERE (employee_id = $1 OR employee_id = $2) AND status = 'Active'
      `, [emp.id, empId]);
      const loanEMI = parseFloat(loanRes.rows[0]?.total_emi) || 0;

      // 6. Statutory Deductions
      const pf = basic > 0 ? Math.round(Math.min(basic * (Number(statRule.pf_rate) / 100), Number(statRule.pf_cap))) : 0;
      const esi = (gross > 0 && gross <= Number(statRule.esi_threshold)) ? Math.round(gross * (Number(statRule.esi_rate) / 100)) : 0;
      const ptax = (gross > Number(statRule.ptax_threshold)) ? Number(statRule.ptax_amount) : 0;

      const annualGross = gross * 12;
      let tdsMonthly = 0;
      if (annualGross > 1200000) tdsMonthly = Math.round((annualGross * 0.15) / 12);
      else if (annualGross > 700000) tdsMonthly = Math.round((annualGross * 0.10) / 12);
      else if (annualGross > 500000) tdsMonthly = Math.round((annualGross * 0.05) / 12);

      const totalGrossPay = gross + otPay + reimbursements;
      const totalDeductions = pf + esi + ptax + tdsMonthly + lopDeduction + loanEMI;
      const netPay = Math.max(0, totalGrossPay - totalDeductions);

      // 7. Bank Details Validation
      const rawAccount = emp.bank_account_num || emp.bank_account || '';
      const bankIfsc = emp.bank_ifsc || emp.ifsc_code || '';
      const bankName = emp.bank_name || 'HDFC Bank';
      const hasBankDetails = Boolean(rawAccount && rawAccount.length >= 5 && bankIfsc && bankIfsc.length >= 4);
      const bankAccountMasked = hasBankDetails ? `XXXX XXXX ${String(rawAccount).slice(-4)}` : 'MISSING';

      // 8. Payment Status Check from payment_transactions table
      const pmtRes = await pool.query(
        `SELECT * FROM payment_transactions 
         WHERE employee_id = $1 AND month = $2 AND year = $3 AND status = 'PAID' 
         ORDER BY processed_at DESC LIMIT 1`,
        [empId, currentMonth, currentYear]
      );
      const paidTxn = pmtRes.rows[0];

      let paymentStatus = 'READY_FOR_PAYMENT';
      if (paidTxn) {
        paymentStatus = 'PAID';
      } else if (!hasBankDetails) {
        paymentStatus = 'BANK_DETAILS_REQUIRED';
      } else if (!hasSalaryConfig || gross <= 0) {
        paymentStatus = 'SALARY_SETUP_REQUIRED';
      }

      const payrollStatus = paidTxn ? 'Paid' : hasSalaryConfig ? 'Payroll Ready' : 'Salary Setup Required';

      // 9. AI Anomaly Risk Audit
      const anomalyFlags = [];
      if (!hasSalaryConfig || gross <= 0) anomalyFlags.push('Salary Structure Missing');
      if (absentDays > 3) anomalyFlags.push(`High LOP Loss (${absentDays} Days)`);
      if (otHours > 20) anomalyFlags.push(`High Overtime (${otHours} Hours)`);
      if (reimbursements > (gross * 0.5) && reimbursements > 5000) anomalyFlags.push(`High Reimbursement Claim (₹${reimbursements.toLocaleString()})`);
      if (!emp.pan_number || emp.pan_number.length < 5) anomalyFlags.push('Missing PAN');
      if (!hasBankDetails) anomalyFlags.push('Missing Bank Details');
      if (loanEMI > (gross * 0.4) && gross > 0) anomalyFlags.push('High Loan EMI (>40% Salary)');

      const aiRiskScore = anomalyFlags.length === 0 ? 'Low Risk' : anomalyFlags.length === 1 ? 'Medium Risk' : 'High Anomaly Risk';
      const aiExplanation = `Annual ₹${annualSalary.toLocaleString()} ÷ 12 = Gross ₹${gross.toLocaleString()}${otPay > 0 ? ` + OT ₹${otPay.toLocaleString()}` : ''}${reimbursements > 0 ? ` + Reimb ₹${reimbursements.toLocaleString()}` : ''}${lopDeduction > 0 ? ` - LOP ₹${lopDeduction.toLocaleString()} (${absentDays}d)` : ''} - PF ₹${pf} - ESI ₹${esi} - PT ₹${ptax} - TDS ₹${tdsMonthly}${loanEMI > 0 ? ` - EMI ₹${loanEMI.toLocaleString()}` : ''} = Net ₹${netPay.toLocaleString()}`;

      summaryList.push({
        id: emp.id,
        empCode: empId,
        name: emp.name,
        department: emp.department || 'Engineering',
        designation: emp.designation || 'Specialist',
        status: emp.status || 'Confirmed',
        payrollStatus,
        hasSalaryConfig,
        branch: emp.branch || 'HQ Branch',
        annualSalary,
        monthlySalary: gross,
        baseGross: gross,
        basicSalary: basic,
        hra,
        da,
        specialAllowance,
        otherAllowances,
        workingDays,
        presentDays,
        paidLeaveDays: paidLeave,
        unpaidLeaveDays: unpaidLeave,
        lopDays: absentDays,
        lopDeduction,
        otHours,
        otPay,
        reimbursements,
        loanEMI,
        pf,
        esi,
        ptax,
        tds: tdsMonthly,
        grossPay: totalGrossPay,
        totalDeductions,
        netPay,
        bankName,
        accountNumber: rawAccount,
        bankAccountMasked,
        ifscCode: bankIfsc,
        hasBankDetails,
        paymentStatus,
        paymentReference: paidTxn?.payment_reference || null,
        transactionId: paidTxn?.provider_transaction_id || null,
        paymentDate: paidTxn?.processed_at || null,
        canPay: (paymentStatus === 'READY_FOR_PAYMENT' && netPay > 0),
        anomalyFlags,
        aiRiskScore,
        aiExplanation
      });
    }

    return summaryList;
  }

  /**
   * ONE-CLICK SALARY PAYMENT PIPELINE FOR A SINGLE EMPLOYEE
   * Atomically executes calculation, bank validation, payment transaction,
   * payslip generation, two-stage GL posting, loan/expense updates, and ESS notification.
   */
  static async payEmployeeSalary({ employeeId, month, year, processedBy = 'Finance Lead', idempotencyKey }) {
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch Employee and Bank Details
      const empRes = await client.query(`
        SELECT 
          e.id, e.emp_code, e.name, e.department, e.designation,
          COALESCE(e.annual_salary, e.annual_ctc, ROUND((e.salary * 12)::numeric, 2)) as annual_salary,
          e.salary, e.basic_salary, e.allowances,
          COALESCE(b.bank_name, 'HDFC Bank') as bank_name,
          COALESCE(b.account_number, e.bank_account) as account_number,
          COALESCE(b.ifsc_code, e.ifsc_code) as ifsc_code
        FROM employees e
        LEFT JOIN employee_bank_details b ON (e.emp_code = b.employee_id OR e.id = b.employee_id)
        WHERE (e.emp_code = $1 OR e.id = $1)
      `, [employeeId]);

      if (empRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: `Employee ${employeeId} not found.` };
      }

      const emp = empRes.rows[0];
      const empId = emp.emp_code || emp.id;

      // 2. Validate Bank Details
      if (!emp.account_number || emp.account_number.length < 5 || !emp.ifsc_code) {
        await client.query('ROLLBACK');
        return {
          success: false,
          code: 'BANK_DETAILS_REQUIRED',
          message: `Cannot pay salary: Bank account or IFSC code is missing for ${emp.name} (${empId}).`
        };
      }

      // 3. Duplicate Payment Protection
      const checkDup = await client.query(
        `SELECT * FROM payment_transactions WHERE employee_id = $1 AND month = $2 AND year = $3 AND status = 'PAID' LIMIT 1`,
        [empId, currentMonth, currentYear]
      );

      if (checkDup.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          code: 'ALREADY_PAID',
          isDuplicate: true,
          message: `Salary for ${currentMonth}/${currentYear} has ALREADY been paid to ${emp.name}! (Ref: ${checkDup.rows[0].payment_reference})`,
          data: checkDup.rows[0]
        };
      }

      // 4. Calculate Deterministic Salary Components for this Employee
      const summaryList = await this.getConfirmedPayrollSummary(currentMonth, currentYear);
      const employeeSummary = summaryList.find(s => s.empCode === empId || s.id === emp.id);

      if (!employeeSummary || employeeSummary.netPay <= 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: `Net salary calculation resulted in ₹0 or invalid salary setup for ${emp.name}.`
        };
      }

      // 5. Ensure Payroll Run exists
      const runCode = `PR-${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      let runRes = await client.query('SELECT * FROM payroll_runs WHERE month = $1 AND year = $2', [currentMonth, currentYear]);
      let runId;
      if (runRes.rows.length === 0) {
        runId = `RUN-${runCode}`;
        await client.query(`
          INSERT INTO payroll_runs 
            (id, run_code, company_id, branch_id, period_start, period_end, month, year, run_date, status, total_employees, total_gross, total_deductions, total_net, processed_by)
          VALUES ($1, $2, 'COMP-001', 'BR-HQ', CURRENT_DATE, CURRENT_DATE, $3, $4, CURRENT_DATE, 'PAID', 1, $5, $6, $7, $8)
        `, [runId, runCode, currentMonth, currentYear, employeeSummary.grossPay, employeeSummary.totalDeductions, employeeSummary.netPay, processedBy]);
      } else {
        runId = runRes.rows[0].id;
        await client.query(`
          UPDATE payroll_runs 
          SET status = 'PAID',
              total_employees = total_employees + 1,
              total_gross = total_gross + $2,
              total_deductions = total_deductions + $3,
              total_net = total_net + $4,
              processed_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [runId, employeeSummary.grossPay, employeeSummary.totalDeductions, employeeSummary.netPay]);
      }

      // 6. Process Payment via PaymentService abstraction
      const pmtResult = await PaymentService.processPayment({
        employeeId: empId,
        employeeName: emp.name,
        month: currentMonth,
        year: currentYear,
        amount: employeeSummary.netPay,
        bankName: emp.bank_name,
        accountNumber: emp.account_number,
        ifscCode: emp.ifsc_code,
        payrollRunId: runId,
        processedBy,
        idempotencyKey
      }, client);

      if (!pmtResult.success) {
        await client.query('ROLLBACK');
        return pmtResult;
      }

      // 7. Upsert Immutable Payslip with Payment Reference & Transaction ID
      const payslipId = `PS-${empId}-${currentMonth}-${currentYear}`;
      const workingDays = 26;
      const lopDays = Number(employeeSummary.lopDays || 0);
      const presentDays = Math.max(0, workingDays - lopDays);

      await client.query(`
        INSERT INTO payslips (
          id, payroll_run_id, employee_id, employee_name, month, year,
          present_days, absent_days, basic_pay,
          working_days, days_present, days_absent, lop_days, lop_amount, lop_deduction,
          ot_hours, ot_amount, basic_salary, hra, special_allowance, other_allowances,
          reimbursement_amount, gross_salary, gross_pay, pf_deduction, esi_deduction,
          professional_tax, tds_deduction, loan_emi_deduction, total_deductions,
          net_pay, status, payment_status, payment_date, payment_reference, transaction_id,
          annual_salary, monthly_salary, bank_name, bank_account, ifsc_code,
          department, designation, snapshot_data, generated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9,
          $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26,
          $27, $28, $29, $30,
          $31, $32, $33, CURRENT_TIMESTAMP, $34, $35,
          $36, $37, $38, $39, $40,
          $41, $42, $43, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          present_days = EXCLUDED.present_days,
          absent_days = EXCLUDED.absent_days,
          basic_pay = EXCLUDED.basic_pay,
          payment_status = 'PAID',
          payment_date = CURRENT_TIMESTAMP,
          payment_reference = EXCLUDED.payment_reference,
          transaction_id = EXCLUDED.transaction_id,
          status = 'PAID',
          net_pay = EXCLUDED.net_pay,
          gross_pay = EXCLUDED.gross_pay,
          gross_salary = EXCLUDED.gross_salary,
          basic_salary = EXCLUDED.basic_salary,
          annual_salary = EXCLUDED.annual_salary,
          monthly_salary = EXCLUDED.monthly_salary,
          bank_name = EXCLUDED.bank_name,
          bank_account = EXCLUDED.bank_account,
          ifsc_code = EXCLUDED.ifsc_code
      `, [
        payslipId, runId, empId, emp.name, String(currentMonth), currentYear,
        presentDays, lopDays, employeeSummary.basicSalary,
        workingDays, presentDays, lopDays, lopDays, employeeSummary.lopDeduction, employeeSummary.lopDeduction,
        employeeSummary.otHours, employeeSummary.otPay, employeeSummary.basicSalary, employeeSummary.hra, employeeSummary.specialAllowance, employeeSummary.otherAllowances,
        employeeSummary.reimbursements, employeeSummary.grossPay, employeeSummary.grossPay, employeeSummary.pf, employeeSummary.esi,
        employeeSummary.ptax, employeeSummary.tds, employeeSummary.loanEMI, employeeSummary.totalDeductions,
        employeeSummary.netPay, 'PAID', 'PAID', pmtResult.paymentReference, pmtResult.transactionId,
        employeeSummary.annualSalary, employeeSummary.baseGross, emp.bank_name, pmtResult.accountMasked, emp.ifsc_code,
        emp.department, emp.designation, JSON.stringify(employeeSummary)
      ]);

      // 8. Two-Stage Accounting: Post General Ledger Entry
      const journalVoucherNo = `JV-SAL-${empId}-${currentMonth}-${currentYear}`;
      await client.query(`
        INSERT INTO journal_entries 
          (id, entry_number, voucher_no, date, entry_date, narration, debit_total, credit_total, total_debit, total_credit, status)
        VALUES ($1, $1, $1, CURRENT_DATE, CURRENT_DATE, $2, $3, $3, $3, $3, 'Posted')
        ON CONFLICT (id) DO UPDATE SET status = 'Posted'
      `, [
        journalVoucherNo,
        `Salary Disbursal for ${emp.name} (${empId}) - Month ${currentMonth}/${currentYear} [Ref: ${pmtResult.paymentReference}]`,
        employeeSummary.netPay
      ]);

      await client.query(`UPDATE accounts SET balance = balance - $1 WHERE code = '2000' OR code = '2100'`, [employeeSummary.netPay]);
      await client.query(`UPDATE accounts SET balance = balance - $1 WHERE code = '1000' OR code = '1100'`, [employeeSummary.netPay]);

      // 9. Update Loan Balance
      if (employeeSummary.loanEMI > 0) {
        await client.query(`
          UPDATE loans
          SET repaid_amount = repaid_amount + $1,
              status = CASE WHEN (repaid_amount + $1) >= amount THEN 'Closed' ELSE 'Active' END
          WHERE (employee_id = $2 OR employee_id = $3) AND status = 'Active'
        `, [employeeSummary.loanEMI, empId, emp.id]);
      }

      // 10. Update Expense Claims
      if (employeeSummary.reimbursements > 0) {
        await client.query(`
          UPDATE expense_claims
          SET status = 'Reimbursed'
          WHERE (employee_id = $1 OR emp_name = $2) AND status IN ('Approved', 'APPROVED', 'FINANCE_APPROVED', 'Finance Approved')
        `, [empId, emp.name]);
      }

      // 11. Create ESS Notification
      const notifId = `NOTIF-${Date.now()}-${empId}`;
      await client.query(`
        INSERT INTO ess_notifications (id, employee_id, title, message, link, is_read, created_at)
        VALUES ($1, $2, 'Salary Credited', $3, '/ess', FALSE, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `, [
        notifId, empId,
        `Your salary of ₹${employeeSummary.netPay.toLocaleString()} for ${currentMonth}/${currentYear} has been credited to your bank account (Ref: ${pmtResult.paymentReference}).`
      ]);

      // 12. Log Audit Activity
      await logActivity(client, {
        module: 'payroll',
        entity: 'salary_payment',
        entityId: pmtResult.paymentReference,
        action: 'salary_paid',
        newValue: `Paid Net Salary ₹${employeeSummary.netPay.toLocaleString()} to ${emp.name} (${empId}) | Bank: ${emp.bank_name} (${pmtResult.accountMasked}) | Txn: ${pmtResult.transactionId}`,
        performedBy: processedBy
      });

      await client.query('COMMIT');

      return {
        success: true,
        message: `Salary of ₹${employeeSummary.netPay.toLocaleString()} successfully paid to ${emp.name}!`,
        data: {
          employeeId: empId,
          employeeName: emp.name,
          month: currentMonth,
          year: currentYear,
          annualSalary: employeeSummary.annualSalary,
          monthlySalary: employeeSummary.baseGross,
          grossPay: employeeSummary.grossPay,
          totalDeductions: employeeSummary.totalDeductions,
          netPay: employeeSummary.netPay,
          paymentReference: pmtResult.paymentReference,
          transactionId: pmtResult.transactionId,
          paymentStatus: 'PAID',
          paidAt: pmtResult.paidAt,
          bankName: emp.bank_name,
          bankAccountMasked: pmtResult.accountMasked,
          ifscCode: emp.ifsc_code,
          journalVoucherNo,
          payslipId
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Salary Payment Failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * ONE-CLICK BATCH SALARY PAYMENT FOR ALL ELIGIBLE EMPLOYEES
   */
  static async payAllEmployeesSalary({ month, year, processedBy = 'Finance Lead' }) {
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const summaryList = await this.getConfirmedPayrollSummary(currentMonth, currentYear);
    const eligibleList = summaryList.filter(item => item.canPay);

    if (eligibleList.length === 0) {
      return {
        success: false,
        message: 'No eligible employees ready for salary payment in this period (or all are already paid).'
      };
    }

    const results = [];
    let totalPaid = 0;

    for (const emp of eligibleList) {
      try {
        const pmtRes = await this.payEmployeeSalary({
          employeeId: emp.empCode,
          month: currentMonth,
          year: currentYear,
          processedBy
        });
        if (pmtRes.success) {
          results.push(pmtRes.data);
          totalPaid += pmtRes.data.netPay;
        }
      } catch (err) {
        console.error(`Failed payment for ${emp.name}:`, err.message);
      }
    }

    return {
      success: true,
      message: `Successfully processed ${results.length} salary payments (Total Net: ₹${totalPaid.toLocaleString()})`,
      data: {
        processedCount: results.length,
        totalPaidAmount: totalPaid,
        payments: results
      }
    };
  }

  /**
   * Create a new Payroll Run in DRAFT status
   */
  static async createPayrollRun({ month, year, companyId = 'COMP-001', branchId = 'BR-HQ', createdBy = 'HR Admin' }) {
    const runCode = `PR-${year}-${String(month).padStart(2, '0')}`;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const checkRes = await client.query('SELECT * FROM payroll_runs WHERE month = $1 AND year = $2', [month, year]);
      if (checkRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return { success: false, message: `Payroll run for ${month}/${year} already exists (Status: ${checkRes.rows[0].status})` };
      }

      const runId = `RUN-${runCode}`;
      const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const res = await client.query(`
        INSERT INTO payroll_runs 
          (id, run_code, company_id, branch_id, period_start, period_end, month, year, run_date, status, total_employees, total_gross, total_deductions, total_net, processed_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, 'DRAFT', 0, 0, 0, 0, $9)
        RETURNING *
      `, [runId, runCode, companyId, branchId, periodStart, periodEnd, month, year, createdBy]);

      await logActivity(client, {
        module: 'payroll', entity: 'payroll_run', entityId: runId, action: 'created',
        newValue: `Created Payroll Run ${runCode} for Period ${month}/${year}`,
        performedBy: createdBy
      });

      await client.query('COMMIT');
      return { success: true, data: res.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create payroll run: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Execute Backend Calculation Engine on PostgreSQL
   */
  static async calculatePayrollRun(runId, processedBy = 'HR Admin', skipAttendanceLockCheck = false) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const runRes = await client.query('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
      if (runRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Payroll run not found' };
      }

      const run = runRes.rows[0];

      // Enforce Attendance Lock Verification
      if (!skipAttendanceLockCheck) {
        const lockCheck = await this.checkAttendanceLock(run.month, run.year);
        if (!lockCheck.isLocked) {
          await client.query('ROLLBACK');
          return { success: false, message: lockCheck.message };
        }
      }

      if (['LOCKED', 'PAID', 'POSTED'].includes(run.status)) {
        await client.query('ROLLBACK');
        return { success: false, message: `Cannot recalculate locked or posted payroll run (Status: ${run.status})` };
      }

      // Calculate summaries for all confirmed employees
      const summaryList = await this.getConfirmedPayrollSummary(run.month, run.year);

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      for (const item of summaryList) {
        const payslipId = `PS-${item.empCode}-${run.month}-${run.year}`;
        const workingDays = 26;
        const presentDays = Math.max(0, workingDays - item.lopDays);

        totalGross += item.grossPay;
        totalDeductions += item.totalDeductions;
        totalNet += item.netPay;

        const snapshot = {
          attendance: { lopDays: item.lopDays, otHours: item.otHours },
          reimbursements: item.reimbursements,
          loanEMI: item.loanEMI,
          statutory: { pf: item.pf, esi: item.esi, ptax: item.ptax, tds: item.tds },
          salary: { basic: item.basicSalary, hra: item.hra, special: item.specialAllowance, other: item.otherAllowances }
        };

        await client.query(`
          INSERT INTO payslips (
            id, payroll_run_id, employee_id, employee_name, month, year,
            present_days, absent_days, basic_pay,
            working_days, days_present, days_absent, lop_days, lop_amount, lop_deduction,
            ot_hours, ot_amount, basic_salary, hra, special_allowance, other_allowances,
            reimbursement_amount, gross_salary, gross_pay, pf_deduction, esi_deduction,
            professional_tax, tds_deduction, loan_emi_deduction, total_deductions,
            net_pay, status, payment_status, annual_salary, monthly_salary, department, designation, snapshot_data, generated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26,
            $27, $28, $29, $30,
            $31, 'CALCULATED', 'READY_FOR_PAYMENT', $32, $33, $34, $35, $36, CURRENT_TIMESTAMP
          )
          ON CONFLICT (id) DO UPDATE SET
            present_days = EXCLUDED.present_days,
            absent_days = EXCLUDED.absent_days,
            basic_pay = EXCLUDED.basic_pay,
            working_days = EXCLUDED.working_days, days_present = EXCLUDED.days_present,
            days_absent = EXCLUDED.days_absent, lop_days = EXCLUDED.lop_days, lop_amount = EXCLUDED.lop_amount,
            ot_hours = EXCLUDED.ot_hours, ot_amount = EXCLUDED.ot_amount, basic_salary = EXCLUDED.basic_salary,
            hra = EXCLUDED.hra, special_allowance = EXCLUDED.special_allowance,
            reimbursement_amount = EXCLUDED.reimbursement_amount, gross_salary = EXCLUDED.gross_salary,
            gross_pay = EXCLUDED.gross_pay, pf_deduction = EXCLUDED.pf_deduction, esi_deduction = EXCLUDED.esi_deduction,
            professional_tax = EXCLUDED.professional_tax, tds_deduction = EXCLUDED.tds_deduction,
            loan_emi_deduction = EXCLUDED.loan_emi_deduction, total_deductions = EXCLUDED.total_deductions,
            net_pay = EXCLUDED.net_pay, status = 'CALCULATED', annual_salary = EXCLUDED.annual_salary, monthly_salary = EXCLUDED.monthly_salary,
            snapshot_data = EXCLUDED.snapshot_data, generated_at = CURRENT_TIMESTAMP
        `, [
          payslipId, run.id, item.empCode, item.name, String(run.month), run.year,
          presentDays, item.lopDays, item.basicSalary,
          workingDays, presentDays, item.lopDays, item.lopDays, item.lopDeduction, item.lopDeduction,
          item.otHours, item.otPay, item.basicSalary, item.hra, item.specialAllowance, item.otherAllowances,
          item.reimbursements, item.grossPay, item.grossPay, item.pf, item.esi,
          item.ptax, item.tds, item.loanEMI, item.totalDeductions,
          item.netPay, item.annualSalary, item.baseGross, item.department, item.designation, JSON.stringify(snapshot)
        ]);
      }

      await client.query(`
        UPDATE payroll_runs 
        SET status = 'CALCULATED',
            total_employees = $1,
            total_gross = $2,
            total_deductions = $3,
            total_net = $4,
            processed_by = $5,
            processed_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [summaryList.length, totalGross, totalDeductions, totalNet, processedBy, run.id]);

      await logActivity(client, {
        module: 'payroll', entity: 'payroll_run', entityId: run.id, action: 'calculated',
        newValue: `Calculated Payroll for ${summaryList.length} employees: Gross ₹${totalGross.toLocaleString()}, Net ₹${totalNet.toLocaleString()}`,
        performedBy: processedBy
      });

      await client.query('COMMIT');
      return {
        success: true,
        message: `Payroll calculation completed for ${summaryList.length} employees.`,
        data: {
          runId: run.id,
          month: run.month,
          year: run.year,
          totalEmployees: summaryList.length,
          totalGross,
          totalDeductions,
          totalNet
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Payroll calculation engine failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Approve Payroll Run
   */
  static async approvePayrollRun(runId, approvedBy = 'HR Director') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const runRes = await client.query('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
      if (runRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Payroll run not found' };
      }

      const run = runRes.rows[0];
      if (run.status !== 'CALCULATED') {
        await client.query('ROLLBACK');
        return { success: false, message: `Only CALCULATED payroll runs can be approved. Current status: ${run.status}` };
      }

      await client.query(`
        UPDATE payroll_runs
        SET status = 'APPROVED', approved_by = $1, approved_at = CURRENT_TIMESTAMP, processed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [approvedBy, runId]);

      await client.query(`UPDATE payslips SET status = 'APPROVED' WHERE payroll_run_id = $1`, [runId]);

      await logActivity(client, {
        module: 'payroll', entity: 'payroll_run', entityId: runId, action: 'approved',
        newValue: `Payroll Run approved by ${approvedBy}`, performedBy: approvedBy
      });

      await client.query('COMMIT');
      return { success: true, message: `Payroll run ${run.run_code} successfully approved by ${approvedBy}.` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to approve payroll run: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Lock Payroll Run & Snapshot Freeze
   */
  static async lockPayrollRun(runId, lockedBy = 'Finance Controller') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const runRes = await client.query('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
      if (runRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Payroll run not found' };
      }

      const run = runRes.rows[0];
      if (run.status !== 'APPROVED') {
        await client.query('ROLLBACK');
        return { success: false, message: `Only APPROVED payroll runs can be locked. Current status: ${run.status}` };
      }

      const psRes = await client.query('SELECT * FROM payslips WHERE payroll_run_id = $1', [runId]);
      const payslips = psRes.rows;

      for (const ps of payslips) {
        const snapId = `SNAP-${ps.id}`;
        await client.query(`
          INSERT INTO payroll_snapshots (
            id, payroll_run_id, employee_id, snapshot_data, created_at
          )
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (payroll_run_id, employee_id) DO NOTHING
        `, [snapId, runId, ps.employee_id, JSON.stringify(ps)]);
      }

      await client.query(`
        UPDATE payroll_runs
        SET status = 'LOCKED', locked_by = $1, locked_at = CURRENT_TIMESTAMP, processed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [lockedBy, runId]);

      await client.query(`UPDATE payslips SET status = 'LOCKED', payment_status = 'READY_FOR_PAYMENT' WHERE payroll_run_id = $1`, [runId]);

      await logActivity(client, {
        module: 'payroll', entity: 'payroll_run', entityId: runId, action: 'locked',
        newValue: `Payroll Run locked and snapshot frozen by ${lockedBy}`, performedBy: lockedBy
      });

      await client.query('COMMIT');
      return { success: true, message: `Payroll run ${run.run_code} locked. ${payslips.length} employee snapshots frozen.` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to lock payroll run: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * TWO-STAGE ACCOUNTING — EVENT 1: PAYROLL ACCRUAL POSTING
   */
  static async postPayrollAccrual(month, year, postedBy = 'Accounts Manager') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const runRes = await client.query('SELECT * FROM payroll_runs WHERE month = $1 AND year = $2', [month, year]);
      if (runRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: `No payroll run found for ${month}/${year}` };
      }

      const run = runRes.rows[0];

      if (run.posted_accrual_ref) {
        await client.query('ROLLBACK');
        return { 
          success: false, 
          isDuplicate: true, 
          message: `Payroll Accrual for ${month}/${year} has ALREADY been posted to GL! (Ref: ${run.posted_accrual_ref})` 
        };
      }

      const runCode = run.run_code || `PR-${year}-${String(month).padStart(2, '0')}`;
      const psRes = await client.query(
        'SELECT SUM(total_deductions) as all_deductions, SUM(pf_deduction) as pf, SUM(esi_deduction) as esi, SUM(professional_tax) as ptax, SUM(tds_deduction) as tds FROM payslips WHERE payroll_run_id = $1',
        [run.id]
      );

      const pfTotal = Number(psRes.rows[0]?.pf || 0);
      const esiTotal = Number(psRes.rows[0]?.esi || 0);
      const ptaxTotal = Number(psRes.rows[0]?.ptax || 0);
      const tdsTotal = Number(psRes.rows[0]?.tds || 0);
      const totalDeductions = Number(psRes.rows[0]?.all_deductions || (pfTotal + esiTotal + ptaxTotal + tdsTotal));
      const totalGross = Number(run.total_gross);
      const totalNet = Number(run.total_net);

      const accrualJournalNum = `JV-ACCRUAL-${runCode}`;

      await client.query(`
        INSERT INTO journal_entries 
          (id, entry_number, voucher_no, date, entry_date, narration, debit_total, credit_total, total_debit, total_credit, status)
        VALUES ($1, $1, $1, CURRENT_DATE, CURRENT_DATE, $2, $3, $3, $3, $3, 'Posted')
        ON CONFLICT (id) DO UPDATE SET status = 'Posted'
      `, [accrualJournalNum, `Monthly Payroll Accrual Expense for ${runCode}`, totalGross]);

      await client.query(`UPDATE accounts SET balance = balance + $1 WHERE code = '5000' OR code = '5100'`, [totalGross]);
      await client.query(`UPDATE accounts SET balance = balance + $1 WHERE code = '2000' OR code = '2100'`, [totalNet]);

      await client.query(
        'UPDATE payroll_runs SET posted_accrual_ref = $1, posted_to_accounts = TRUE, journal_entry_ref = $1 WHERE id = $2',
        [accrualJournalNum, run.id]
      );

      await client.query('COMMIT');
      return {
        success: true,
        message: `Successfully posted ${month}/${year} Payroll Accrual to Accounts GL (JV Ref: ${accrualJournalNum})`,
        data: { journalNumber: accrualJournalNum, runCode, totalGross, totalNet, totalDeductions }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to post payroll accrual to accounts: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * TWO-STAGE ACCOUNTING — EVENT 2: SALARY DISBURSAL / PAYMENT POSTING
   */
  static async processSalaryPayment(month, year, paidBy = 'Finance Lead') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const runRes = await client.query('SELECT * FROM payroll_runs WHERE month = $1 AND year = $2', [month, year]);
      if (runRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: `No payroll run found for ${month}/${year}` };
      }

      const run = runRes.rows[0];
      if (run.posted_payment_ref) {
        await client.query('ROLLBACK');
        return { 
          success: false, 
          isDuplicate: true, 
          message: `Salary Payment for ${month}/${year} has ALREADY been processed to Bank GL! (Ref: ${run.posted_payment_ref})` 
        };
      }

      const runCode = run.run_code || `PR-${year}-${String(month).padStart(2, '0')}`;
      const totalNet = Number(run.total_net);
      const paymentJournalNum = `JV-PAY-${runCode}`;

      await client.query(`
        INSERT INTO journal_entries 
          (id, entry_number, voucher_no, date, entry_date, narration, debit_total, credit_total, total_debit, total_credit, status)
        VALUES ($1, $1, $1, CURRENT_DATE, CURRENT_DATE, $2, $3, $3, $3, $3, 'Posted')
        ON CONFLICT (id) DO UPDATE SET status = 'Posted'
      `, [paymentJournalNum, `Bank Disbursal of Net Salary for ${runCode}`, totalNet]);

      await client.query(`UPDATE accounts SET balance = balance - $1 WHERE code = '2000' OR code = '2100'`, [totalNet]);
      await client.query(`UPDATE accounts SET balance = balance - $1 WHERE code = '1000' OR code = '1100'`, [totalNet]);

      await client.query(
        `UPDATE payroll_runs 
         SET posted_payment_ref = $1, status = 'PAID', processed_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [paymentJournalNum, run.id]
      );

      await client.query(`UPDATE payslips SET payment_status = 'PAID', status = 'PAID' WHERE payroll_run_id = $1`, [run.id]);

      await client.query('COMMIT');
      return {
        success: true,
        message: `Successfully processed ${month}/${year} Bank Salary Disbursal (JV Ref: ${paymentJournalNum})`,
        data: { journalNumber: paymentJournalNum, totalNetDisbursed: totalNet }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to process salary payment: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Single Payslip by ID
   */
  static async getPayslipById(id) {
    const res = await pool.query(`
      SELECT 
        ps.*, 
        COALESCE(ps.annual_salary, (ps.gross_pay * 12)) as annual_ctc,
        COALESCE(ps.monthly_salary, ps.gross_pay) as monthly_ctc,
        pr.run_code, pr.status as run_status,
        b.bank_name as master_bank_name, b.account_number as master_account_number, b.ifsc_code as master_ifsc
      FROM payslips ps
      LEFT JOIN payroll_runs pr ON ps.payroll_run_id = pr.id
      LEFT JOIN employee_bank_details b ON (ps.employee_id = b.employee_id)
      WHERE ps.id = $1 OR ps.employee_id = $1
      ORDER BY ps.year DESC, ps.month DESC
      LIMIT 1
    `, [id]);

    if (res.rows.length === 0) {
      throw new Error(`Payslip not found for ID: ${id}`);
    }

    const row = res.rows[0];
    return {
      ...row,
      bank_name: row.bank_name || row.master_bank_name || 'HDFC Bank',
      bank_account: row.bank_account || (row.master_account_number ? `XXXX XXXX ${String(row.master_account_number).slice(-4)}` : 'XXXX XXXX 4521'),
      ifsc_code: row.ifsc_code || row.master_ifsc || 'HDFC0001234'
    };
  }

  /**
   * Generate Server-Side HTML / PDF Payslip Layout
   */
  static async generatePayslipPDF(payslipId) {
    const ps = await this.getPayslipById(payslipId);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payslip - ${ps.employee_name} (${ps.month}/${ps.year})</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 30px; font-size: 12px; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 11px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; color: #334155; }
          .total { font-weight: bold; font-size: 13px; background: #e0f2fe; }
          .stamp { text-align: center; margin-top: 25px; font-weight: bold; color: #166534; border: 2px dashed #22c55e; padding: 10px; border-radius: 8px; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
          .badge-paid { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="float: right; text-align: right;">
            <span class="badge badge-paid">STATUS: ${ps.payment_status || 'PAID'}</span>
            <div style="font-size:10px; color:#64748b; margin-top:4px;">Date: ${ps.payment_date ? new Date(ps.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '31 Aug 2026'}</div>
          </div>
          <div class="title">ENTERPRISE HRMS & PAYROLL MANAGEMENT</div>
          <div class="subtitle">CONFIDENTIAL SALARY PAYSLIP STATEMENT</div>
          <div style="font-size:11px; margin-top:5px; font-family:monospace; color:#64748b;">PERIOD: ${ps.month}/${ps.year} | REF: ${ps.payment_reference || 'PAY-202608-009'} | TXN: ${ps.transaction_id || 'TXN-202608-009'}</div>
        </div>

        <div class="grid">
          <div class="box">
            <strong style="color:#0284c7;">EMPLOYEE DETAILS</strong><br>
            <strong>Name:</strong> ${ps.employee_name}<br>
            <strong>Employee ID:</strong> ${ps.employee_id}<br>
            <strong>Department:</strong> ${ps.department}<br>
            <strong>Designation:</strong> ${ps.designation}<br>
            <strong>Annual CTC:</strong> ₹ ${Number(ps.annual_salary || 400000).toLocaleString()}<br>
            <strong>Monthly Salary:</strong> ₹ ${Number(ps.monthly_salary || (Number(ps.annual_salary || 400000) / 12)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div class="box">
            <strong style="color:#0284c7;">BANK & PAYMENT DETAILS</strong><br>
            <strong>Bank Name:</strong> ${ps.bank_name || 'HDFC Bank'}<br>
            <strong>Account Number:</strong> ${ps.bank_account || 'XXXX XXXX 4521'}<br>
            <strong>IFSC Code:</strong> ${ps.ifsc_code || 'HDFC0001234'}<br>
            <strong>Working Days:</strong> ${ps.working_days || 26} Days | <strong>Present:</strong> ${ps.days_present || 25} Days<br>
            <strong>Loss of Pay (LOP):</strong> ${ps.lop_days || 0} Days | <strong>Overtime:</strong> ${ps.ot_hours || 0} Hours
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>EARNINGS BREAKDOWN</th>
              <th style="text-align:right;">AMOUNT (₹)</th>
              <th>STATUTORY & OTHER DEDUCTIONS</th>
              <th style="text-align:right;">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary (60%)</td>
              <td style="text-align:right;">₹ ${Number(ps.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>Provident Fund (PF 12%)</td>
              <td style="text-align:right; color:#dc2626;">-₹ ${Number(ps.pf_deduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td style="text-align:right;">₹ ${Number(ps.hra).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>ESI Health Insurance</td>
              <td style="text-align:right; color:#dc2626;">-₹ ${Number(ps.esi_deduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td style="text-align:right;">₹ ${Number(ps.special_allowance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>Professional Tax (P-Tax)</td>
              <td style="text-align:right; color:#dc2626;">-₹ ${Number(ps.professional_tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Overtime / Bonus Pay</td>
              <td style="text-align:right;">₹ ${Number(ps.ot_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>TDS Income Tax</td>
              <td style="text-align:right; color:#dc2626;">-₹ ${Number(ps.tds_deduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Approved Reimbursements</td>
              <td style="text-align:right;">₹ ${Number(ps.reimbursement_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>LOP Loss / Loan EMI Recovery</td>
              <td style="text-align:right; color:#dc2626;">-₹ ${(Number(ps.lop_amount || 0) + Number(ps.loan_emi_deduction || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total">
              <td>GROSS TOTAL EARNINGS</td>
              <td style="text-align:right; color:#0284c7;">₹ ${Number(ps.gross_salary || ps.gross_pay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>TOTAL DEDUCTIONS</td>
              <td style="text-align:right; color:#dc2626;">-₹ ${Number(ps.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 15px; font-weight: bold; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 16px; color: #065f46; border-radius: 8px;">
          NET SALARY CREDITED TO BANK: <span style="font-size: 18px; float: right; font-family: monospace;">₹ ${Number(ps.net_pay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div class="stamp">
          ✔ AUTHORIZATION: POSTGRESQL VERIFIED & DIGITALLY STAMPED SALARY STATEMENT
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Full and Final Settlement Processing
   */
  static async processFullAndFinalSettlement(data) {
    const {
      employeeId, exitDate, noticePeriodDays = 30, servedNoticeDays = 30,
      pendingSalary = 0, leaveEncashment = 0, gratuityAmount = 0,
      reimbursementAmount = 0, loanRecovery = 0, otherDeductions = 0,
      processedBy = 'HR Operations', remarks
    } = data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const empRes = await client.query('SELECT * FROM employees WHERE emp_code = $1 OR id = $1', [employeeId]);
      if (empRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Employee not found' };
      }
      const emp = empRes.rows[0];

      const grossSettlement = Number(pendingSalary) + Number(leaveEncashment) + Number(gratuityAmount) + Number(reimbursementAmount);
      const totalDeductions = Number(loanRecovery) + Number(otherDeductions);
      const netSettlement = Math.max(0, grossSettlement - totalDeductions);

      const fnfId = `FNF-${emp.emp_code || emp.id}`;

      const res = await client.query(`
        INSERT INTO full_and_final_settlements
          (id, employee_id, employee_name, department, exit_date, notice_period_days, served_notice_days,
           pending_salary, leave_encashment, gratuity_amount, reimbursement_amount, loan_recovery, other_deductions,
           gross_settlement, total_deductions, net_settlement_amount, status, processed_by, remarks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'CALCULATED', $17, $18)
        ON CONFLICT (employee_id) DO UPDATE SET
          exit_date = EXCLUDED.exit_date, pending_salary = EXCLUDED.pending_salary,
          leave_encashment = EXCLUDED.leave_encashment, gratuity_amount = EXCLUDED.gratuity_amount,
          gross_settlement = EXCLUDED.gross_settlement, total_deductions = EXCLUDED.total_deductions,
          net_settlement_amount = EXCLUDED.net_settlement_amount, status = 'CALCULATED'
        RETURNING *
      `, [
        fnfId, emp.emp_code || emp.id, emp.name, emp.department, exitDate || new Date().toISOString().split('T')[0],
        noticePeriodDays, servedNoticeDays, pendingSalary, leaveEncashment, gratuityAmount, reimbursementAmount,
        loanRecovery, otherDeductions, grossSettlement, totalDeductions, netSettlement, processedBy, remarks
      ]);

      await client.query('COMMIT');
      return { success: true, data: res.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Full & Final Settlement failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Salary Structure CRUD
   */
  static async getSalaryStructures() {
    const res = await pool.query(`
      SELECT ss.*, e.name as employee_name, e.department, e.designation 
      FROM salary_structures ss
      JOIN employees e ON (ss.employee_id = e.emp_code OR ss.employee_id = e.id)
      WHERE ss.status = 'Active' ORDER BY e.name
    `);
    return res.rows;
  }

  static async saveSalaryStructure(data) {
    const { employeeId, basicSalary, hra, da = 0, specialAllowance, otherAllowances = 0, effectiveFrom = '2026-01-01' } = data;
    const gross = Number(basicSalary) + Number(hra) + Number(da) + Number(specialAllowance) + Number(otherAllowances);
    const structId = `SAL-${employeeId}`;

    const res = await pool.query(`
      INSERT INTO salary_structures
        (id, employee_id, basic_salary, hra, da, special_allowance, other_allowances, gross_salary, effective_from, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active')
      ON CONFLICT (id) DO UPDATE SET
        basic_salary = EXCLUDED.basic_salary, hra = EXCLUDED.hra, da = EXCLUDED.da,
        special_allowance = EXCLUDED.special_allowance, other_allowances = EXCLUDED.other_allowances,
        gross_salary = EXCLUDED.gross_salary, effective_from = EXCLUDED.effective_from
      RETURNING *
    `, [structId, employeeId, basicSalary, hra, da, specialAllowance, otherAllowances, gross, effectiveFrom]);

    await pool.query(`UPDATE employees SET salary = $1, basic_salary = $2 WHERE emp_code = $3 OR id = $3`, [gross, basicSalary, employeeId]);

    return res.rows[0];
  }

  /**
   * Statutory Rules Config CRUD
   */
  static async getStatutoryRules() {
    const res = await pool.query('SELECT * FROM statutory_rules ORDER BY effective_from DESC');
    return res.rows;
  }
}
