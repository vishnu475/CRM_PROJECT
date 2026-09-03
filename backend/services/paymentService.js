import { pool } from '../db/pool.js';

export class PaymentService {
  /**
   * Process salary payment through bank/payment provider abstraction
   */
  static async processPayment({
    employeeId,
    employeeName,
    month,
    year,
    amount,
    currency = 'INR',
    bankName,
    accountNumber,
    ifscCode,
    payrollRunId,
    processedBy = 'Finance Lead',
    idempotencyKey
  }, client = pool) {
    if (!employeeId) throw new Error('Employee ID is required for payment processing.');
    if (!amount || Number(amount) <= 0) throw new Error('Payment amount must be greater than 0.');
    if (!accountNumber || accountNumber.length < 5) throw new Error('BANK_DETAILS_REQUIRED: Valid bank account number is required.');
    if (!ifscCode || ifscCode.length < 4) throw new Error('BANK_DETAILS_REQUIRED: Valid IFSC code is required.');

    // 1. Check for duplicate successful payment
    const dupCheck = await client.query(
      `SELECT * FROM payment_transactions 
       WHERE employee_id = $1 AND month = $2 AND year = $3 AND status = 'PAID' LIMIT 1`,
      [employeeId, month, year]
    );

    if (dupCheck.rows.length > 0) {
      const existing = dupCheck.rows[0];
      return {
        success: false,
        isDuplicate: true,
        message: `Salary for period ${month}/${year} has ALREADY been paid to ${employeeName || employeeId}! (Ref: ${existing.payment_reference})`,
        data: existing
      };
    }

    // 2. Generate unique identifiers
    const timestamp = Date.now();
    const paymentId = `PMT-${year}${String(month).padStart(2, '0')}-${employeeId}-${timestamp.toString().slice(-4)}`;
    const paymentRef = `PAY-${year}${String(month).padStart(2, '0')}-${timestamp.toString().slice(-6)}`;
    const providerTxnId = `TXN-${year}${String(month).padStart(2, '0')}-${timestamp.toString().slice(-6)}`;
    const finalIdempotencyKey = idempotencyKey || `IDEM-${paymentId}`;

    const providerName = process.env.PAYMENT_PROVIDER || 'INTERNAL_BANK_ADVICE';

    // 3. Insert payment transaction record
    const insertRes = await client.query(`
      INSERT INTO payment_transactions (
        id, payroll_run_id, employee_id, employee_name, month, year,
        amount, currency, bank_name, account_number, ifsc_code,
        payment_method, provider, provider_transaction_id, payment_reference,
        status, initiated_at, processed_at, processed_by, idempotency_key
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $17, $18)
      ON CONFLICT (idempotency_key) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      paymentId, payrollRunId, employeeId, employeeName, month, year,
      amount, currency, bankName || 'HDFC Bank', accountNumber, ifscCode,
      'DIRECT_BANK_TRANSFER', providerName, providerTxnId, paymentRef,
      'PAID', processedBy, finalIdempotencyKey
    ]);

    const transaction = insertRes.rows[0];

    return {
      success: true,
      paymentId: transaction.id,
      paymentReference: transaction.payment_reference,
      transactionId: transaction.provider_transaction_id,
      status: transaction.status,
      amount: Number(transaction.amount),
      paidAt: transaction.processed_at,
      bankName: transaction.bank_name,
      accountMasked: `XXXX XXXX ${String(accountNumber).slice(-4)}`,
      ifscCode: transaction.ifsc_code,
      provider: transaction.provider,
      data: transaction
    };
  }

  /**
   * Get payment transactions for an employee or payroll run
   */
  static async getPayments({ employeeId, month, year, payrollRunId }) {
    let query = `SELECT * FROM payment_transactions WHERE 1=1`;
    const params = [];
    if (employeeId) { params.push(employeeId); query += ` AND employee_id = $${params.length}`; }
    if (month) { params.push(month); query += ` AND month = $${params.length}`; }
    if (year) { params.push(year); query += ` AND year = $${params.length}`; }
    if (payrollRunId) { params.push(payrollRunId); query += ` AND payroll_run_id = $${params.length}`; }
    query += ` ORDER BY processed_at DESC`;

    const res = await pool.query(query, params);
    return res.rows;
  }
}
