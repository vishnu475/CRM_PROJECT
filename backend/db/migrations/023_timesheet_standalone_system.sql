-- Migration 023: Completely Standalone Timesheet System
-- Isolated tables for assignments, daily timesheets, work entries, PDF proofs, and audit logs.

-- 1. Timesheet Assignments (created by Admin)
CREATE TABLE IF NOT EXISTS timesheet_assignments (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  expected_hours_per_day NUMERIC(4,2) DEFAULT 8.0,
  proof_required BOOLEAN DEFAULT TRUE,
  allow_multiple_entries BOOLEAN DEFAULT TRUE,
  require_description BOOLEAN DEFAULT TRUE,
  instructions TEXT,
  assigned_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modify existing timesheets table to support standalone daily timesheet model
ALTER TABLE timesheets ALTER COLUMN project_name DROP NOT NULL;
ALTER TABLE timesheets ALTER COLUMN task_description DROP NOT NULL;
ALTER TABLE timesheets ALTER COLUMN task_name DROP NOT NULL;
ALTER TABLE timesheets ALTER COLUMN hours DROP NOT NULL;
ALTER TABLE timesheets ALTER COLUMN hours_spent DROP NOT NULL;

ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS assignment_id VARCHAR(64);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS expected_hours NUMERIC(4,2) DEFAULT 8.0;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS total_hours NUMERIC(4,2) DEFAULT 0.0;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS total_minutes INT DEFAULT 0;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_by VARCHAR(64);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(64);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Clean legacy dummy records from old ESS test run if any so unique constraint can be applied
DELETE FROM timesheets WHERE assignment_id IS NULL AND (total_hours IS NULL OR total_hours = 0.0) AND project_name IS NOT NULL;

-- Unique constraint for daily timesheet per employee
CREATE UNIQUE INDEX IF NOT EXISTS idx_timesheets_emp_date_unique ON timesheets(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(date);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);

-- 3. Timesheet Work Entries (Child of timesheets)
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id VARCHAR(64) PRIMARY KEY,
  timesheet_id VARCHAR(64) NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  duration_minutes INT NOT NULL,
  work_title VARCHAR(255) NOT NULL,
  work_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);

-- 4. Timesheet Proofs (PDF uploads attached to each work entry)
CREATE TABLE IF NOT EXISTS timesheet_proofs (
  id VARCHAR(64) PRIMARY KEY,
  timesheet_entry_id VARCHAR(64) NOT NULL REFERENCES timesheet_entries(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  file_size INT NOT NULL,
  file_hash VARCHAR(64),
  storage_reference TEXT NOT NULL,
  file_data BYTEA,
  uploaded_by VARCHAR(64),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_proofs_entry_id ON timesheet_proofs(timesheet_entry_id);

-- 5. Timesheet Audit Logs
CREATE TABLE IF NOT EXISTS timesheet_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timesheet_id VARCHAR(64),
  user_id VARCHAR(64),
  action VARCHAR(50) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_audit_timesheet_id ON timesheet_audit_logs(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_audit_action ON timesheet_audit_logs(action);
