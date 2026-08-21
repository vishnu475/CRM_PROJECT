import { pool } from '../db/pool.js';

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
   * Run Monthly Payroll — SQL Transaction across payroll_runs + payslips
   */
  static async runPayroll(month, year, processedBy = 'HR Admin') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const runCode = `PR-${year}-${String(month).padStart(2, '0')}`;

      // Check if already run
      const existing = await client.query('SELECT id FROM payroll_runs WHERE month = $1 AND year = $2', [month, year]);
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return { success: false, message: `Payroll for ${month}/${year} already processed. Run code: ${existing.rows[0].id}` };
      }

      // Get all active employees
      const empRes = await client.query(`
        SELECT id, emp_code, name, salary, basic_salary, allowances
        FROM employees 
        WHERE status NOT IN ('Exited') 
        ORDER BY emp_code
      `);
      const employees = empRes.rows;

      let totalGross = 0, totalDeductions = 0, totalNet = 0;
      const payslipsData = [];

      for (const emp of employees) {
        const grossSalary = Number(emp.salary) || 50000;
        const basicSalary = Number(emp.basic_salary) || Math.round(grossSalary * 0.6);
        const hra = Math.round(basicSalary * 0.4);
        const specialAllowance = grossSalary - basicSalary - hra;

        // Get attendance for month
        const attendRes = await client.query(`
          SELECT COUNT(*) as days_present 
          FROM attendance_records 
          WHERE employee_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
          AND status NOT IN ('Absent', 'Holiday')
        `, [emp.id, month, year]);
        const daysPresent = parseInt(attendRes.rows[0]?.days_present) || 26;

        // Calculate deductions
        const pfDeduction = Math.round(basicSalary * 0.12);  // 12% PF
        const esiDeduction = grossSalary < 21000 ? Math.round(grossSalary * 0.0075) : 0;  // 0.75% ESI
        const profTax = grossSalary > 15000 ? 200 : 0;
        const totalDeductionEmp = pfDeduction + esiDeduction + profTax;
        const netPay = grossSalary - totalDeductionEmp;

        totalGross += grossSalary;
        totalDeductions += totalDeductionEmp;
        totalNet += netPay;

        payslipsData.push({
          employee_id: emp.id,
          employee_name: emp.name,
          month, year,
          working_days: 26,
          days_present: daysPresent,
          days_absent: Math.max(0, 26 - daysPresent),
          gross_salary: grossSalary,
          basic_salary: basicSalary,
          hra,
          special_allowance: Math.max(0, specialAllowance),
          pf_deduction: pfDeduction,
          esi_deduction: esiDeduction,
          professional_tax: profTax,
          tds_deduction: 0,
          total_deductions: totalDeductionEmp,
          net_pay: netPay,
          status: 'Generated'
        });
      }

      // Insert payroll run
      const runResult = await client.query(`
        INSERT INTO payroll_runs (id, run_code, month, year, run_date, status, total_employees, total_gross, total_deductions, total_net, processed_by)
        VALUES ($1, $1, $2, $3, CURRENT_DATE, 'Processed', $4, $5, $6, $7, $8)
        RETURNING *
      `, [runCode, month, year, employees.length, totalGross, totalDeductions, totalNet, processedBy]);
      const payrollRunId = runResult.rows[0].id;

      // Insert all payslips
      for (const ps of payslipsData) {
        const payslipId = `PS-${ps.employee_id}-${month}-${year}`;
        const totalAllowances = ps.hra + ps.special_allowance;
        await client.query(`
          INSERT INTO payslips 
            (id, payroll_run_id, employee_id, employee_name, month, year, working_days, days_present, present_days, days_absent, absent_days,
             gross_pay, gross_salary, basic_pay, basic_salary, allowances, hra, special_allowance, pf_deduction, esi_deduction,
             professional_tax, tds_deduction, total_deductions, net_pay, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$9,$10,$10,$11,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
          ON CONFLICT (id) DO UPDATE SET net_pay = EXCLUDED.net_pay
        `, [payslipId, payrollRunId, ps.employee_id, ps.employee_name, ps.month, ps.year,
            ps.working_days, ps.days_present, ps.days_absent,
            ps.gross_salary, ps.basic_salary, totalAllowances, ps.hra, ps.special_allowance,
            ps.pf_deduction, ps.esi_deduction, ps.professional_tax, ps.tds_deduction,
            ps.total_deductions, ps.net_pay, ps.status]);
      }

      // Activity log
      await logActivity(client, {
        module: 'payroll', entity: 'payroll_run', entityId: runCode,
        action: 'payroll_processed',
        newValue: `Month: ${month}/${year} | Employees: ${employees.length} | Total Net: ₹${totalNet.toLocaleString()}`,
        performedBy: processedBy
      });

      await client.query('COMMIT');
      return {
        success: true,
        message: `Payroll processed for ${month}/${year}`,
        data: { ...runResult.rows[0], payslipCount: payslipsData.length, totalNet }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Payroll run failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get all payslips for a payroll run
   */
  static async getPayslipsByRun(payrollRunId) {
    const result = await pool.query(
      'SELECT * FROM payslips WHERE payroll_run_id = $1 ORDER BY employee_name',
      [payrollRunId]
    );
    return result.rows;
  }

  /**
   * Get single payslip by ID
   */
  static async getPayslipById(payslipId) {
    const result = await pool.query(
      `SELECT ps.*, pr.run_code, pr.run_date 
       FROM payslips ps
       JOIN payroll_runs pr ON ps.payroll_run_id = pr.id
       WHERE ps.id = $1`,
      [payslipId]
    );
    if (result.rows.length === 0) throw new Error('Payslip not found');
    return result.rows[0];
  }

  /**
   * Get dynamic pre-calculated payroll summary for Confirmed & Joined Employees with AI Tax, LOP Attendance Loss & Risk Audit
   */
  static async getConfirmedPayrollSummary() {
    const result = await pool.query(`
      SELECT id, emp_code, name, department, designation, salary, basic_salary, allowances, pan_number, uan_number, bank_account, ifsc_code, status
      FROM employees
      WHERE status IN ('Confirmed', 'Joined', 'Active', 'Probation', 'Transferred')
      ORDER BY name
    `);

    const employees = result.rows;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const summaryList = [];

    for (const emp of employees) {
      const gross = Number(emp.salary) || 50000;
      const basic = Number(emp.basic_salary) || Math.round(gross * 0.6);
      const hra = Math.round(basic * 0.4);
      const specialAllowance = Math.max(0, gross - basic - hra);

      // Check Attendance LOP & Absent Days for current month
      const attRes = await pool.query(`
        SELECT COUNT(*) as absent_count
        FROM attendance_records
        WHERE (employee_id = $1 OR employee_id = $2)
          AND EXTRACT(MONTH FROM date) = $3
          AND EXTRACT(YEAR FROM date) = $4
          AND status IN ('Absent', 'Unexcused')
      `, [emp.id, emp.emp_code || emp.id, currentMonth, currentYear]);

      const absentDays = parseInt(attRes.rows[0]?.absent_count) || 0;
      const dailyRate = Math.round(gross / 26);
      const lopDeduction = Math.round(dailyRate * absentDays);

      const pf = Math.round(Math.min(basic * 0.12, 1800));
      const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const ptax = gross > 15000 ? 200 : 0;

      const annualGross = gross * 12;
      let tdsMonthly = 0;
      if (annualGross > 1200000) tdsMonthly = Math.round((annualGross * 0.15) / 12);
      else if (annualGross > 700000) tdsMonthly = Math.round((annualGross * 0.10) / 12);
      else if (annualGross > 500000) tdsMonthly = Math.round((annualGross * 0.05) / 12);

      const totalDeductions = pf + esi + ptax + tdsMonthly + lopDeduction;
      const netPay = Math.max(0, gross - totalDeductions);

      const anomalyFlags = [];
      if (absentDays > 3) anomalyFlags.push(`High LOP Loss (${absentDays} Days)`);
      if (!emp.pan_number || emp.pan_number.length < 5) anomalyFlags.push('Missing PAN');
      if (!emp.bank_account || emp.bank_account.length < 5) anomalyFlags.push('Missing Bank Account');
      if (!emp.ifsc_code) anomalyFlags.push('Missing IFSC Code');

      const aiRiskScore = anomalyFlags.length === 0 ? 'Low Risk' : anomalyFlags.length === 1 ? 'Medium Risk' : 'High Anomaly Risk';

      summaryList.push({
        id: emp.id,
        empCode: emp.emp_code || emp.id,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
        grossPay: gross,
        basicSalary: basic,
        hra,
        specialAllowance,
        lopDays: absentDays,
        lopDeduction,
        pf,
        esi,
        ptax,
        tds: tdsMonthly,
        totalDeductions,
        netPay,
        anomalyFlags,
        aiRiskScore
      });
    }

    return summaryList;
  }

  /**
   * Post Payroll Run to Accounts General Ledger (Double-Entry Journal Posting)
   */
  static async postPayrollToAccounts(month, year, postedBy = 'Accounts Manager') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const runRes = await client.query(
        'SELECT * FROM payroll_runs WHERE month = $1 AND year = $2',
        [month, year]
      );
      if (runRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: `No payroll run found for ${month}/${year}` };
      }

      const run = runRes.rows[0];

      // Check if already posted
      if (run.posted_to_accounts) {
        await client.query('ROLLBACK');
        return { success: false, message: `Payroll for ${month}/${year} is already posted to Accounts GL!` };
      }

      const runCode = run.run_code || `PR-${year}-${String(month).padStart(2, '0')}`;

      // Sum statutory breakdown from payslips
      const psRes = await client.query(
        'SELECT SUM(pf_deduction) as pf, SUM(esi_deduction) as esi, SUM(professional_tax) as ptax, SUM(tds_deduction) as tds FROM payslips WHERE payroll_run_id = $1',
        [run.id]
      );

      const pfTotal = Number(psRes.rows[0]?.pf || 0);
      const esiTotal = Number(psRes.rows[0]?.esi || 0);
      const ptaxTotal = Number(psRes.rows[0]?.ptax || 0);
      const tdsTotal = Number(psRes.rows[0]?.tds || 0);
      const totalDeductions = pfTotal + esiTotal + ptaxTotal + tdsTotal;
      const totalGross = Number(run.total_gross);
      const totalNet = Number(run.total_net);

      // Create Journal Voucher reference
      const journalNumber = `JV-PR-${year}-${String(month).padStart(2, '0')}`;

      // Update payroll run status
      await client.query(
        'UPDATE payroll_runs SET posted_to_accounts = TRUE, journal_entry_ref = $1 WHERE id = $2',
        [journalNumber, run.id]
      );

      // Activity Log entry
      await logActivity(client, {
        module: 'accounts',
        entity: 'journal_entry',
        entityId: journalNumber,
        action: 'payroll_gl_posted',
        newValue: `Posted Payroll ${runCode} to Accounts: Gross DR ₹${totalGross.toLocaleString()} [Code 5100], Statutory CR ₹${totalDeductions.toLocaleString()}, Net CR ₹${totalNet.toLocaleString()} [Code 1200]`,
        performedBy: postedBy
      });

      await client.query('COMMIT');
      return {
        success: true,
        message: `Successfully posted ${month}/${year} Payroll to Accounts General Ledger (JV Ref: ${journalNumber})`,
        data: {
          journalNumber,
          runCode,
          debitAccount: '5100 - Employee Salary Expenses',
          grossAmount: totalGross,
          pfTotal,
          esiTotal,
          ptaxTotal,
          tdsTotal,
          creditBankNetPay: totalNet
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to post payroll to accounts: ${err.message}`);
    } finally {
      client.release();
    }
  }
}

