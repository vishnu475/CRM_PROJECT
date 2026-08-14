-- Enterprise Schema Migration Script for CRM, HRMS, Attendance Engine, Payroll, and Finance
-- Database: PostgreSQL 18

-- ====================================================
-- 1. MASTER TABLES
-- ====================================================

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),
    registration_no VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'India',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    head_employee_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designations (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) UNIQUE NOT NULL,
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    level VARCHAR(20) DEFAULT 'L1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(50) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) REFERENCES roles(id),
    employee_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS number_sequences (
    id VARCHAR(50) PRIMARY KEY,
    prefix VARCHAR(20) UNIQUE NOT NULL,
    current_value INTEGER DEFAULT 1,
    padding INTEGER DEFAULT 3,
    description VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================
-- 2. HRMS & EMPLOYEE TABLES
-- ====================================================

-- Master Employees table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    emp_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(30),
    dob DATE,
    gender VARCHAR(10) DEFAULT 'Male',
    address TEXT,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    joining_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Active',
    salary NUMERIC(12,2) DEFAULT 50000.00,
    basic_salary NUMERIC(12,2) DEFAULT 30000.00,
    allowances NUMERIC(12,2) DEFAULT 20000.00,
    reporting_manager_id VARCHAR(50),
    reporting_manager_name VARCHAR(100),
    pan_number VARCHAR(20),
    uan_number VARCHAR(30),
    bank_account VARCHAR(30),
    ifsc_code VARCHAR(20),
    pin_hash VARCHAR(255) DEFAULT '$2b$10$fV3wU.b5tU/uX4O7q0vLxeG/L2A3K.J1N2O3P4Q5R6S7T8U9V0W1X',
    plain_pin VARCHAR(10) DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255) DEFAULT '$2b$10$fV3wU.b5tU/uX4O7q0vLxeG/L2A3K.J1N2O3P4Q5R6S7T8U9V0W1X';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS plain_pin VARCHAR(10) DEFAULT '1234';

CREATE TABLE IF NOT EXISTS employee_bank_details (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_statutory (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    pan_number VARCHAR(20),
    uan_number VARCHAR(30),
    pf_number VARCHAR(30),
    esi_number VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_documents (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_shift_history (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    shift_id VARCHAR(50) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================
-- 3. SHIFT & ATTENDANCE ENGINE TABLES
-- ====================================================

CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    grace_period_mins INTEGER DEFAULT 15,
    half_day_mins INTEGER DEFAULT 240,
    full_day_mins INTEGER DEFAULT 480,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_rosters (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_id VARCHAR(50) REFERENCES shifts(id),
    is_weekly_off BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_devices (
    id VARCHAR(50) PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    device_code VARCHAR(50) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_events (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(20) NOT NULL,
    source VARCHAR(30) DEFAULT 'WEB_KIOSK',
    device_id VARCHAR(50) DEFAULT 'WEB-KIOSK-01',
    is_synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_id VARCHAR(50) REFERENCES shifts(id),
    check_in VARCHAR(20),
    check_out VARCHAR(20),
    worked_hours NUMERIC(5,2) DEFAULT 0.0,
    late_minutes INTEGER DEFAULT 0,
    early_out_minutes INTEGER DEFAULT 0,
    overtime_hours NUMERIC(5,2) DEFAULT 0.0,
    status VARCHAR(30) NOT NULL,
    regularization_status VARCHAR(20) DEFAULT 'NONE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_regularizations (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    date DATE NOT NULL,
    requested_check_in VARCHAR(20) NOT NULL,
    requested_check_out VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_overtime (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(5,2) NOT NULL,
    rate NUMERIC(10,2) DEFAULT 1.5,
    status VARCHAR(20) DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================
-- 4. LEAVE MANAGEMENT TABLES
-- ====================================================

CREATE TABLE IF NOT EXISTS leave_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    annual_allowance INTEGER DEFAULT 12,
    carry_forward BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    leave_type_id VARCHAR(50) REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    allocated INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    balance INTEGER NOT NULL,
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    leave_type_id VARCHAR(50) REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    date DATE UNIQUE NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================
-- 5. PAYROLL TABLES
-- ====================================================

CREATE TABLE IF NOT EXISTS salary_structures (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE REFERENCES employees(emp_code) ON DELETE CASCADE,
    basic_salary NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) DEFAULT 0,
    conveyance NUMERIC(12,2) DEFAULT 0,
    medical_allowance NUMERIC(12,2) DEFAULT 0,
    special_allowance NUMERIC(12,2) DEFAULT 0,
    pf_deduction NUMERIC(12,2) DEFAULT 0,
    esi_deduction NUMERIC(12,2) DEFAULT 0,
    tds_deduction NUMERIC(12,2) DEFAULT 0,
    gross_salary NUMERIC(12,2) NOT NULL,
    net_salary NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id VARCHAR(50) PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    total_employees INTEGER NOT NULL,
    total_gross NUMERIC(14,2) NOT NULL,
    total_deductions NUMERIC(14,2) NOT NULL,
    total_net NUMERIC(14,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PROCESSED',
    processed_by VARCHAR(100),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS payslips (
    id VARCHAR(50) PRIMARY KEY,
    payroll_run_id VARCHAR(50) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) REFERENCES employees(emp_code) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    present_days INTEGER NOT NULL,
    absent_days INTEGER NOT NULL,
    lop_days NUMERIC(4,1) DEFAULT 0,
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    basic_pay NUMERIC(12,2) NOT NULL,
    allowances NUMERIC(12,2) NOT NULL,
    overtime_bonus NUMERIC(12,2) DEFAULT 0,
    gross_pay NUMERIC(12,2) NOT NULL,
    pf_deduction NUMERIC(12,2) DEFAULT 0,
    esi_deduction NUMERIC(12,2) DEFAULT 0,
    tds_deduction NUMERIC(12,2) DEFAULT 0,
    lop_deduction NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) NOT NULL,
    net_pay NUMERIC(12,2) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, month, year)
);

-- ====================================================
-- 6. FINANCE, ACCOUNTS & BANKING TABLES
-- ====================================================

CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    sub_type VARCHAR(50),
    balance NUMERIC(14,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    voucher_no VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    narration TEXT NOT NULL,
    total_debit NUMERIC(14,2) NOT NULL,
    total_credit NUMERIC(14,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'POSTED',
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id VARCHAR(50) PRIMARY KEY,
    journal_entry_id VARCHAR(50) REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id VARCHAR(50) REFERENCES accounts(id),
    debit NUMERIC(14,2) DEFAULT 0.00,
    credit NUMERIC(14,2) DEFAULT 0.00,
    description TEXT
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id VARCHAR(50) PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),
    balance NUMERIC(14,2) DEFAULT 0.00,
    account_type VARCHAR(30) DEFAULT 'Current',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id VARCHAR(50) PRIMARY KEY,
    bank_account_id VARCHAR(50) REFERENCES bank_accounts(id),
    txn_date DATE NOT NULL,
    reference_no VARCHAR(50),
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- DEBIT, CREDIT
    amount NUMERIC(14,2) NOT NULL,
    running_balance NUMERIC(14,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    expense_no VARCHAR(50) UNIQUE NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(emp_code),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    manager_approval VARCHAR(20) DEFAULT 'PENDING',
    finance_approval VARCHAR(20) DEFAULT 'PENDING',
    reimbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================
-- 7. RECRUITMENT TABLES
-- ====================================================

CREATE TABLE IF NOT EXISTS job_openings (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    location VARCHAR(100) DEFAULT 'Bengaluru / Hybrid',
    headcount INTEGER DEFAULT 1,
    hiring_manager VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active',
    created_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS job_candidates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    job_opening_id VARCHAR(50) REFERENCES job_openings(id),
    job_title VARCHAR(100) NOT NULL,
    stage VARCHAR(30) DEFAULT 'Applied',
    score INTEGER DEFAULT 80,
    resume_file_name VARCHAR(255),
    applied_date DATE DEFAULT CURRENT_DATE
);

-- ====================================================
-- SEED INITIAL DATA
-- ====================================================

INSERT INTO number_sequences (id, prefix, current_value, padding, description)
VALUES 
('seq-emp', 'EMP-', 5, 3, 'Employee Code Sequence'),
('seq-inv', 'INV-', 100, 4, 'Invoice Number Sequence'),
('seq-po', 'PO-', 50, 4, 'Purchase Order Sequence'),
('seq-vchr', 'VCHR-', 1000, 5, 'Journal Voucher Sequence')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shifts (id, name, code, start_time, end_time, grace_period_mins, half_day_mins, full_day_mins, status)
VALUES 
('shift-gen', 'General Day Shift', 'GEN-01', '09:00', '18:00', 15, 240, 480, 'Active'),
('shift-morn', 'Morning Shift', 'MORN-01', '07:00', '16:00', 15, 240, 480, 'Active'),
('shift-night', 'Night Shift', 'NIGHT-01', '22:00', '07:00', 15, 240, 480, 'Active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO leave_types (id, name, code, annual_allowance, carry_forward, is_paid)
VALUES 
('lt-cl', 'Casual Leave', 'CL', 12, FALSE, TRUE),
('lt-sl', 'Sick Leave', 'SL', 10, FALSE, TRUE),
('lt-pl', 'Privilege Leave', 'PL', 15, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Default hashed PIN for '1234' is '$2b$10$vN91xYkL93yL2LhW/G1Z8.P9L.5E1a3H3e7Q0bW6f2b/1A1B1C1D1'
INSERT INTO employees (id, emp_code, name, email, phone, dob, gender, address, department, designation, joining_date, status, salary, basic_salary, allowances, reporting_manager_id, reporting_manager_name, pan_number, uan_number, bank_account, ifsc_code, pin_hash, plain_pin)
VALUES 
('EMP-001', 'EMP-001', 'Sarah Jenkins', 'sarah.jenkins@company.com', '+91 98765 10001', '1988-03-12', 'Female', '12 MG Road, Bengaluru', 'Engineering', 'VP of Engineering', '2022-01-10', 'Confirmed', 180000, 108000, 72000, 'EMP-000', 'Board of Directors', 'ABCDE1234F', '100987654321', '98765432101', 'HDFC0001234', '$2b$10$fV3wU.b5tU/uX4O7q0vLxeG/L2A3K.J1N2O3P4Q5R6S7T8U9V0W1X', '1234'),
('EMP-002', 'EMP-002', 'Michael Vance', 'michael.vance@company.com', '+91 98765 10002', '1992-07-22', 'Male', '45 Park Street, Mumbai', 'Sales', 'Sales Director', '2023-04-15', 'Confirmed', 150000, 90000, 60000, 'EMP-000', 'Board of Directors', 'FGHIJ5678K', '100987654322', '98765432102', 'ICIC0005678', '$2b$10$fV3wU.b5tU/uX4O7q0vLxeG/L2A3K.J1N2O3P4Q5R6S7T8U9V0W1X', '1234'),
('EMP-003', 'EMP-003', 'Priya Sharma', 'priya.sharma@company.com', '+91 98765 10003', '1995-11-05', 'Female', '88 Tech Zone, Hyderabad', 'HR', 'HR Operations Lead', '2023-08-01', 'Confirmed', 95000, 57000, 38000, 'EMP-001', 'Sarah Jenkins', 'KLMNO9012P', '100987654323', '98765432103', 'SBIN0009012', '$2b$10$fV3wU.b5tU/uX4O7q0vLxeG/L2A3K.J1N2O3P4Q5R6S7T8U9V0W1X', '1234'),
('EMP-004', 'EMP-004', 'Rahul Verma', 'rahul.verma@company.com', '+91 98765 10004', '1997-02-18', 'Male', '104 Outer Ring Road, Bengaluru', 'Engineering', 'Senior Full Stack Engineer', '2024-02-01', 'Probation', 85000, 51000, 34000, 'EMP-001', 'Sarah Jenkins', 'PQRST3456U', '100987654324', '98765432104', 'UTIB0003456', '$2b$10$fV3wU.b5tU/uX4O7q0vLxeG/L2A3K.J1N2O3P4Q5R6S7T8U9V0W1X', '1234'),
('EMP-005', 'EMP-005', 'Vishnu Vardhan', 'vishnu.vardhan@company.com', '+91 98765 99999', '1996-08-15', 'Male', '100 Tech City Boulevard, Bengaluru', 'Engineering', 'Lead Backend Architect', '2023-01-01', 'Confirmed', 220000, 132000, 88000, 'EMP-000', 'Board of Directors', 'VSHNU1234V', '100987659999', '987654329999', 'HDFC0009999', '$2b$10$fV3wU.b5tU/uX4O7q0vLxeG/L2A3K.J1N2O3P4Q5R6S7T8U9V0W1X', '1234')
ON CONFLICT (id) DO NOTHING;
