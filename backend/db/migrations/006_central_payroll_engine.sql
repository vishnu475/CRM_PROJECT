-- ============================================================
-- Migration 006: Central Payroll Engine Schema & Relationships
-- ============================================================

-- 1. PAYROLL RUNS ENHANCEMENTS
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'COMP-001';
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-HQ';
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'DRAFT';
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS locked_by VARCHAR(100);
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS payment_batch_id VARCHAR(50);
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS posted_to_accounts BOOLEAN DEFAULT FALSE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS journal_entry_ref VARCHAR(50);
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS posted_accrual_ref VARCHAR(50);
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS posted_payment_ref VARCHAR(50);

-- ATTENDANCE PERIOD LOCKS TABLE
CREATE TABLE IF NOT EXISTS attendance_locks (
    id VARCHAR(50) PRIMARY KEY,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'LOCKED',
    locked_by VARCHAR(100) DEFAULT 'HR Admin',
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);
INSERT INTO attendance_locks (id, month, year, status, locked_by)
VALUES ('LOCK-2026-08', 8, 2026, 'LOCKED', 'HR Admin')
ON CONFLICT (month, year) DO NOTHING;

-- 2. PAYSLIPS / PAYROLL ITEMS ENHANCEMENTS
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'COMP-001';
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-HQ';
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ALTER COLUMN allowances SET DEFAULT 0;
ALTER TABLE payslips ALTER COLUMN allowances DROP NOT NULL;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS lop_days NUMERIC(5,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS lop_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS ot_hours NUMERIC(5,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS ot_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS da NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS other_allowances NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS incentive_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS reimbursement_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS loan_emi_deduction NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS other_deductions NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS snapshot_data JSONB;

-- ADD UNIQUE CONSTRAINT ON (payroll_run_id, employee_id) TO PREVENT DUPLICATE PAYROLL ITEMS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_payroll_run_employee'
    ) THEN
        ALTER TABLE payslips ADD CONSTRAINT unique_payroll_run_employee UNIQUE (payroll_run_id, employee_id);
    END IF;
END $$;

-- 3. SALARY STRUCTURES TABLE (EFFECTIVE DATED)
CREATE TABLE IF NOT EXISTS salary_structures (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    basic_salary NUMERIC(12,2) NOT NULL DEFAULT 30000,
    hra NUMERIC(12,2) NOT NULL DEFAULT 12000,
    da NUMERIC(12,2) DEFAULT 0,
    special_allowance NUMERIC(12,2) DEFAULT 8000,
    other_allowances NUMERIC(12,2) DEFAULT 0,
    gross_salary NUMERIC(12,2) NOT NULL DEFAULT 50000,
    effective_from DATE NOT NULL DEFAULT '2026-01-01',
    effective_to DATE,
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active';
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS effective_from DATE DEFAULT '2026-01-01';
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS effective_to DATE;
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS da NUMERIC(12,2) DEFAULT 0;
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS special_allowance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS other_allowances NUMERIC(12,2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_sal_struct_emp ON salary_structures(employee_id);

-- 4. STATUTORY RULES CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS statutory_rules (
    id VARCHAR(50) PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    pf_rate NUMERIC(5,2) DEFAULT 12.00,
    pf_cap NUMERIC(12,2) DEFAULT 1800,
    esi_rate NUMERIC(5,2) DEFAULT 0.75,
    esi_threshold NUMERIC(12,2) DEFAULT 21000,
    ptax_threshold NUMERIC(12,2) DEFAULT 15000,
    ptax_amount NUMERIC(12,2) DEFAULT 200,
    tds_slabs JSONB,
    effective_from DATE DEFAULT '2026-01-01',
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEED DEFAULT STATUTORY RULE IF NONE EXISTS
INSERT INTO statutory_rules (id, rule_name, pf_rate, pf_cap, esi_rate, esi_threshold, ptax_threshold, ptax_amount, effective_from, status)
VALUES ('STAT-INDIA-2026', 'India Standard Statutory Tax Policy 2026', 12.00, 1800.00, 0.75, 21000.00, 15000.00, 200.00, '2026-01-01', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 5. PAYROLL HISTORICAL SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS payroll_snapshots (
    id VARCHAR(50) PRIMARY KEY,
    payroll_run_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    attendance_snapshot JSONB,
    leave_snapshot JSONB,
    salary_snapshot JSONB,
    loan_snapshot JSONB,
    statutory_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payroll_snapshots_run ON payroll_snapshots(payroll_run_id);

-- 6. FULL & FINAL SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS full_and_final_settlements (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    employee_name VARCHAR(150),
    department VARCHAR(100),
    exit_date DATE NOT NULL,
    notice_period_days INTEGER DEFAULT 30,
    served_notice_days INTEGER DEFAULT 30,
    pending_salary NUMERIC(12,2) DEFAULT 0,
    leave_encashment NUMERIC(12,2) DEFAULT 0,
    gratuity_amount NUMERIC(12,2) DEFAULT 0,
    reimbursement_amount NUMERIC(12,2) DEFAULT 0,
    loan_recovery NUMERIC(12,2) DEFAULT 0,
    other_deductions NUMERIC(12,2) DEFAULT 0,
    gross_settlement NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) DEFAULT 0,
    net_settlement_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'DRAFT',
    processed_by VARCHAR(100) DEFAULT 'HR Admin',
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 7. EXPENSE CLAIMS TABLE
CREATE TABLE IF NOT EXISTS expense_claims (
    id VARCHAR(50) PRIMARY KEY,
    claim_number VARCHAR(50),
    employee_id VARCHAR(50),
    emp_name VARCHAR(150),
    category VARCHAR(100),
    amount NUMERIC(12,2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    department VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exp_claims_emp ON expense_claims(employee_id);

-- 9. JOURNAL ENTRIES ENHANCEMENTS
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_number VARCHAR(50);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS voucher_no VARCHAR(50);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS debit_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS credit_total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS total_debit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS total_credit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE journal_entries ALTER COLUMN total_debit SET DEFAULT 0;
ALTER TABLE journal_entries ALTER COLUMN total_credit SET DEFAULT 0;
ALTER TABLE journal_entries ALTER COLUMN total_debit DROP NOT NULL;
ALTER TABLE journal_entries ALTER COLUMN total_credit DROP NOT NULL;

-- 10. LEAVE REQUESTS ENHANCEMENTS
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS is_unpaid BOOLEAN DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150),
    loan_type VARCHAR(50) DEFAULT 'Personal Loan',
    amount NUMERIC(12,2) DEFAULT 0,
    monthly_emi NUMERIC(12,2) DEFAULT 0,
    repaid_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_loans_emp ON loans(employee_id);
