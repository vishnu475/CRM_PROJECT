-- ============================================================
-- Migration 005: 100% Dynamic Database ERP Architecture Schema
-- Safe / Idempotent script ensuring all module tables,
-- columns, indexes, foreign keys, and sequences exist.
-- ============================================================

-- 1. CANDIDATE ACTIVITY LOGS (RECRUITMENT)
CREATE TABLE IF NOT EXISTS candidate_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    candidate_id VARCHAR(50) NOT NULL,
    candidate_no VARCHAR(30),
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) DEFAULT 'HR Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candidate_activity_cand ON candidate_activity_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_activity_no ON candidate_activity_logs(candidate_no);

-- 2. EMPLOYEE ONBOARDING PIPELINE (HRMS)
CREATE TABLE IF NOT EXISTS employee_onboarding (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    current_stage VARCHAR(50) NOT NULL DEFAULT 'JOINED',
    stage VARCHAR(50) NOT NULL DEFAULT 'Joined',
    joined_date DATE DEFAULT CURRENT_DATE,
    probation_start_date DATE,
    probation_end_date DATE,
    confirmation_date DATE,
    active_date DATE,
    exit_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE employee_onboarding ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) DEFAULT 'JOINED';
CREATE INDEX IF NOT EXISTS idx_emp_onboarding_emp ON employee_onboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_onboarding_stage ON employee_onboarding(stage);

-- 3. EMPLOYEE TRANSFER HISTORY (HRMS)
CREATE TABLE IF NOT EXISTS employee_transfer_history (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    old_department VARCHAR(100),
    new_department VARCHAR(100),
    old_designation VARCHAR(100),
    new_designation VARCHAR(100),
    old_reporting_manager VARCHAR(100),
    new_reporting_manager VARCHAR(100),
    old_branch VARCHAR(100),
    new_branch VARCHAR(100),
    transfer_date DATE DEFAULT CURRENT_DATE,
    reason TEXT,
    created_by VARCHAR(100) DEFAULT 'HR Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_emp_transfer_emp ON employee_transfer_history(employee_id);

-- 4. JOB REQUISITIONS & OPENINGS (RECRUITMENT)
CREATE TABLE IF NOT EXISTS job_requisitions (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    vacancies INTEGER DEFAULT 1,
    experience_required VARCHAR(50),
    budget NUMERIC(12,2),
    hiring_manager VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ENSURE ALL COLUMNS IN JOB_CANDIDATES
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

-- 6. ENSURE ALL COLUMNS IN EMPLOYEES
ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30) DEFAULT 'Full-time';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS plain_pin VARCHAR(10) DEFAULT '1234';

-- 7. ENSURE ALL COLUMNS IN LEAVE_BALANCES
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS leave_type_name VARCHAR(50);
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS pending INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS available INTEGER DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS total_allocated INTEGER DEFAULT 0;

-- 8. LEAVE APPROVALS TABLE
CREATE TABLE IF NOT EXISTS leave_approvals (
    id BIGSERIAL PRIMARY KEY,
    leave_request_id VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL,
    actioned_by VARCHAR(100) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ENSURE MISSING COLUMNS IN ATTENDANCE_RECORDS AND PAYSLIPS
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS shift_id VARCHAR(50);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS worked_hours NUMERIC(5,2) DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS work_hours NUMERIC(5,2) DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS early_out_minutes INTEGER DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(5,2) DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
-- 11. SEED EMPLOYEE_ONBOARDING FOR ALL EMPLOYEES
INSERT INTO employee_onboarding (employee_id, current_stage, stage, joined_date)
SELECT emp_code, 
       CASE 
         WHEN UPPER(status) IN ('PROBATION', 'CONFIRMED', 'ACTIVE', 'TRANSFERRED', 'EXITED') THEN UPPER(status)
         ELSE 'JOINED' 
       END,
       CASE 
         WHEN UPPER(status) IN ('PROBATION', 'CONFIRMED', 'ACTIVE', 'TRANSFERRED', 'EXITED') THEN status
         ELSE 'Joined' 
       END,
       COALESCE(joining_date, CURRENT_DATE)
FROM employees
ON CONFLICT (employee_id) DO NOTHING;





