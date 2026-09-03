import { pool } from './db/pool.js';

async function migrate() {
  console.log('--- Migrating Database for Enterprise Payment Engine ---');
  
  // 1. Ensure payslips table has payment columns
  await pool.query(`
    ALTER TABLE payslips 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
      ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS annual_salary NUMERIC,
      ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC,
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
      ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50);
  `);

  // 2. Create payment_transactions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id VARCHAR(100) PRIMARY KEY,
      payroll_run_id VARCHAR(100) REFERENCES payroll_runs(id) ON DELETE SET NULL,
      employee_id VARCHAR(100) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      employee_name VARCHAR(255),
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      bank_account_id VARCHAR(100),
      bank_name VARCHAR(100),
      account_number VARCHAR(100),
      ifsc_code VARCHAR(50),
      payment_method VARCHAR(50) DEFAULT 'DIRECT_BANK_TRANSFER',
      provider VARCHAR(50) DEFAULT 'INTERNAL_BANK_ADVICE',
      provider_transaction_id VARCHAR(100),
      payment_reference VARCHAR(100) UNIQUE,
      status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
      failure_reason TEXT,
      initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP WITH TIME ZONE,
      processed_by VARCHAR(100) DEFAULT 'Finance Lead',
      idempotency_key VARCHAR(100) UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_payment_employee_month UNIQUE (employee_id, month, year, status)
    );
  `);

  // 3. Ensure Satya / EMP-009 has bank details in employee_bank_details and employees
  await pool.query(`
    INSERT INTO employee_bank_details (id, employee_id, bank_name, account_number, ifsc_code, branch_name)
    VALUES ('BANK-EMP-009', 'EMP-009', 'HDFC Bank', '98765432101', 'HDFC0001234', 'Indiranagar Branch')
    ON CONFLICT (id) DO UPDATE SET bank_name = EXCLUDED.bank_name, account_number = EXCLUDED.account_number, ifsc_code = EXCLUDED.ifsc_code;
  `);

  await pool.query(`
    UPDATE employees 
    SET bank_account = '98765432101', ifsc_code = 'HDFC0001234', annual_salary = 400000, annual_ctc = 400000, salary = 33333.33
    WHERE emp_code = 'EMP-009' OR id = 'EMP-009';
  `);

  console.log('✅ Payment Transactions table & payslips payment columns created successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
