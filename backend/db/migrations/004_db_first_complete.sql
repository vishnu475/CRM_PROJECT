-- ============================================================
-- Migration 004: DB-First Additive Schema (Safe / Idempotent)
-- Only adds NEW columns/tables that 002 doesn't have.
-- Uses ALTER TABLE ADD COLUMN IF NOT EXISTS everywhere.
-- ============================================================

-- ============================================================
-- 1. UNIVERSAL AUDIT / ACTIVITY LOG TABLE (NEW)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    performed_by VARCHAR(100) DEFAULT 'system',
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================
-- 2. EMPLOYEE HISTORY TABLE (NEW — tracks transfers, exits)
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_history (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_department VARCHAR(100),
    new_department VARCHAR(100),
    old_designation VARCHAR(100),
    new_designation VARCHAR(100),
    reason TEXT,
    changed_by VARCHAR(100) DEFAULT 'HR Admin',
    change_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_employee_history_emp ON employee_history(employee_id);

-- ============================================================
-- 2B. RECRUITMENT CANDIDATES — Add missing columns to 002 table
-- ============================================================
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS candidate_no VARCHAR(30);
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS applied_position VARCHAR(100);
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS experience_years NUMERIC(4,1) DEFAULT 0;
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS recruiter VARCHAR(100);
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE';
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS education VARCHAR(150);
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- 3. EMPLOYEES — Add missing columns (safe, idempotent)
-- ============================================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30) DEFAULT 'Full-time';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- 4. SHIFTS — Add missing columns to existing 002 schema
-- 002 already has: id, name, code, start_time, end_time, grace_period_mins, status
-- We need to add: work_hours, break_minutes, is_night_shift, is_active
-- ============================================================
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS work_hours NUMERIC(4,2) DEFAULT 9.0;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 60;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS is_night_shift BOOLEAN DEFAULT FALSE;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Seed default shifts (002 has code as UNIQUE NOT NULL, so include it)
INSERT INTO shifts (id, name, code, start_time, end_time, grace_period_mins, work_hours, break_minutes, is_active, status)
VALUES
    ('SHF-GEN', 'General Shift',  'GEN', '09:00', '18:00', 15, 9.0, 60, TRUE, 'Active'),
    ('SHF-MOR', 'Morning Shift',  'MOR', '06:00', '14:00', 15, 8.0, 30, TRUE, 'Active'),
    ('SHF-EVE', 'Evening Shift',  'EVE', '14:00', '22:00', 15, 8.0, 30, TRUE, 'Active'),
    ('SHF-NGT', 'Night Shift',    'NGT', '22:00', '06:00', 15, 8.0, 30, TRUE, 'Active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SHIFT_ROSTERS — 002 has (employee_id, date) roster.
--    Add a separate employee_shift_assignment table for defaults.
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_shift_assignments (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    shift_id VARCHAR(50) REFERENCES shifts(id) ON DELETE SET NULL,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, effective_from)
);

-- Seed default shift assignment for all existing employees
DO $$
DECLARE
    emp RECORD;
BEGIN
    FOR emp IN SELECT emp_code FROM employees LOOP
        INSERT INTO employee_shift_assignments (employee_id, shift_id, effective_from)
        VALUES (emp.emp_code, 'SHF-GEN', CURRENT_DATE)
        ON CONFLICT (employee_id, effective_from) DO NOTHING;
    END LOOP;
END $$;

-- ============================================================
-- 6. ATTENDANCE_RECORDS — Add missing columns to 002 schema
-- 002 already has: id, employee_id, date, shift_id, check_in,
--   check_out, worked_hours, late_minutes, early_out_minutes,
--   overtime_hours, status, regularization_status
-- ============================================================
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS is_regularized BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS work_hours NUMERIC(4,2) DEFAULT 0;

-- Fix column name difference (002 uses worked_hours, we use work_hours in code)
-- Add work_hours as alias: just ensure both exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'attendance_records' AND column_name = 'worked_hours'
    ) THEN
        -- Create work_hours if it doesn't exist yet
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'attendance_records' AND column_name = 'work_hours'
        ) THEN
            ALTER TABLE attendance_records ADD COLUMN work_hours NUMERIC(4,2) DEFAULT 0;
        END IF;
    END IF;
END $$;

-- ============================================================
-- 7. ATTENDANCE_EVENTS — Add missing columns
-- ============================================================
ALTER TABLE attendance_events ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE attendance_events ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);

-- ============================================================
-- 8. LEAVE_TYPES — Add missing columns to 002 schema
-- 002 already has: id, name, code, annual_allowance, carry_forward, is_paid
-- We need: max_days_per_year, encashable, is_active, description
-- ============================================================
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS max_days_per_year INTEGER DEFAULT 12;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS encashable BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS description TEXT;

-- Seed leave types
INSERT INTO leave_types (id, name, code, annual_allowance, max_days_per_year, carry_forward, encashable, is_active)
VALUES
    ('lt-cl',  'Casual Leave',     'CL',  12, 12, FALSE, FALSE, TRUE),
    ('lt-sl',  'Sick Leave',       'SL',  10, 10, FALSE, FALSE, TRUE),
    ('lt-pl',  'Privilege Leave',  'PL',  15, 15, TRUE,  TRUE,  TRUE),
    ('lt-ml',  'Maternity Leave',  'ML',  90, 90, FALSE, FALSE, TRUE),
    ('lt-ptl', 'Paternity Leave',  'PTL',  5,  5, FALSE, FALSE, TRUE),
    ('lt-co',  'Compensatory Off', 'CO',   6,  6, FALSE, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. LEAVE_BALANCES — Add missing columns to 002 schema
-- 002 already has: id, employee_id, leave_type_id, year, allocated, used, balance
-- We need: leave_type_name, pending, available, carried_forward
-- ============================================================
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS leave_type_name VARCHAR(50);
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS pending INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS available INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS carried_forward INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS total_allocated INTEGER DEFAULT 0;

-- ============================================================
-- 10. LEAVE_REQUESTS — Add missing columns to 002 schema
-- 002 already has: id, employee_id, leave_type_id, start_date, end_date,
--   total_days, reason, status, approved_by, approved_at, rejection_reason
-- We need: employee_name, leave_type (text), from_date, to_date, days, manager_name
-- ============================================================
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS from_date DATE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS to_date DATE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days INTEGER DEFAULT 1;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- 11. LEAVE_APPROVALS TABLE (NEW)
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_approvals (
    id BIGSERIAL PRIMARY KEY,
    leave_request_id VARCHAR(50),
    action VARCHAR(30) NOT NULL,
    actioned_by VARCHAR(100) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. PAYROLL_RUNS — Add missing columns to 002 schema
-- 002 already has: id (VARCHAR), month (VARCHAR), year, total_employees,
--   total_gross, total_deductions, total_net, status, processed_by, processed_at
-- We need: run_code, run_date, notes, created_at
-- ============================================================
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS run_code VARCHAR(30);
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS run_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- 13. PAYSLIPS — Add missing columns to 002 schema
-- 002 already has: id (VARCHAR), payroll_run_id, employee_id, month, year,
--   present_days, absent_days, basic_pay, allowances, gross_pay,
--   pf_deduction, esi_deduction, tds_deduction, total_deductions, net_pay
-- We need: employee_name, working_days, days_present, days_absent,
--   basic_salary, hra, special_allowance, professional_tax, status
-- ============================================================
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS working_days INTEGER DEFAULT 26;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS days_present INTEGER DEFAULT 26;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS days_absent INTEGER DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS hra NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS special_allowance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS professional_tax NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Generated';

-- ============================================================
-- 14. SEQUENCE TABLE — Ensure sequences exist
-- ============================================================
INSERT INTO number_sequences (id, prefix, current_value, padding, description)
VALUES
    ('seq-emp',     'EMP', 6,  3, 'Employee Code Sequence'),
    ('seq-can',     'CAN', 3,  3, 'Candidate Number Sequence'),
    ('seq-leave',   'LV',  1,  6, 'Leave Request Sequence'),
    ('seq-payroll', 'PR',  1,  4, 'Payroll Run Sequence')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. SEED LEAVE BALANCES FOR ALL EXISTING EMPLOYEES
--    (using the leave_type_name column for our direct queries)
-- ============================================================
DO $$
DECLARE
    emp RECORD;
    yr INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    FOR emp IN SELECT emp_code FROM employees LOOP
        -- Casual Leave
        INSERT INTO leave_balances
            (id, employee_id, leave_type_id, year, allocated, used, balance, leave_type_name, pending, available, total_allocated)
        VALUES
            (emp.emp_code || '-CL-' || yr, emp.emp_code, 'lt-cl', yr, 12, 0, 12, 'Casual Leave', 0, 12, 12)
        ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

        -- Sick Leave
        INSERT INTO leave_balances
            (id, employee_id, leave_type_id, year, allocated, used, balance, leave_type_name, pending, available, total_allocated)
        VALUES
            (emp.emp_code || '-SL-' || yr, emp.emp_code, 'lt-sl', yr, 10, 0, 10, 'Sick Leave', 0, 10, 10)
        ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

        -- Privilege Leave
        INSERT INTO leave_balances
            (id, employee_id, leave_type_id, year, allocated, used, balance, leave_type_name, pending, available, total_allocated)
        VALUES
            (emp.emp_code || '-PL-' || yr, emp.emp_code, 'lt-pl', yr, 15, 0, 15, 'Privilege Leave', 0, 15, 15)
        ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
    END LOOP;
END $$;

-- ============================================================
-- 16. SEED EMP-006 (vishnu from recruitment, if not already there)
-- ============================================================
INSERT INTO employees (id, emp_code, name, email, phone, department, designation, joining_date, status, salary, basic_salary, allowances, reporting_manager_id, reporting_manager_name, pan_number, uan_number, bank_account, ifsc_code, plain_pin)
VALUES ('EMP-006', 'EMP-006', 'vishnu', 'vishnu@company.com', '+91 98765 00004', 'Engineering', 'Senior Full Stack Engineer', CURRENT_DATE, 'Joined', 85000, 51000, 34000, 'EMP-001', 'Sarah Jenkins', 'ABCDE1234F', '100987654321', '98765432101', 'HDFC0001234', '1234')
ON CONFLICT (id) DO NOTHING;

-- Seed leave balances for EMP-006
DO $$
DECLARE
    yr INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    INSERT INTO leave_balances (id, employee_id, leave_type_id, year, allocated, used, balance, leave_type_name, pending, available, total_allocated)
    VALUES
        ('EMP-006-CL-' || yr, 'EMP-006', 'lt-cl', yr, 12, 0, 12, 'Casual Leave',    0, 12, 12),
        ('EMP-006-SL-' || yr, 'EMP-006', 'lt-sl', yr, 10, 0, 10, 'Sick Leave',      0, 10, 10),
        ('EMP-006-PL-' || yr, 'EMP-006', 'lt-pl', yr, 15, 0, 15, 'Privilege Leave', 0, 15, 15)
    ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
END $$;
