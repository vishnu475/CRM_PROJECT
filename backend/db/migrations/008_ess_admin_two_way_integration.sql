-- ============================================================
-- Migration 008: Employee ↔ Admin Two-Way Integration & Audit
-- ============================================================

-- 1. HR REQUESTS TABLE
CREATE TABLE IF NOT EXISTS hr_requests (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    request_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'SUBMITTED',
    assigned_hr VARCHAR(100) DEFAULT 'HR Admin',
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hr_req_emp ON hr_requests(employee_id);

-- 2. TASKS TABLE (If not already created)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    project_name VARCHAR(150) NOT NULL,
    assigned_to VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(100) DEFAULT 'Manager',
    priority VARCHAR(20) DEFAULT 'Medium',
    due_date DATE,
    description TEXT,
    status VARCHAR(30) DEFAULT 'To Do',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(100) DEFAULT 'Manager';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_name VARCHAR(150);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);

-- 3. IMMUTABLE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    employee_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS idx_audit_emp ON audit_logs(employee_id);

-- 4. MULTI-COMPANY AND MULTI-BRANCH DATA SCOPING COLUMNS
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'COMP-01';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-HQ';

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'COMP-01';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-HQ';

ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'COMP-01';
ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-HQ';

ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'COMP-01';
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS hr_approval VARCHAR(30) DEFAULT 'Pending';
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS manager_approval VARCHAR(30) DEFAULT 'Pending';

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS company_id VARCHAR(50) DEFAULT 'COMP-01';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) DEFAULT 'BR-HQ';
