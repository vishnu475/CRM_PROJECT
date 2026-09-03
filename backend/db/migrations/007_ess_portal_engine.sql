-- ============================================================
-- Migration 007: Employee Self-Service (ESS) Portal Engine
-- ============================================================

-- 1. TRANSFER REQUESTS TABLE
CREATE TABLE IF NOT EXISTS transfer_requests (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    current_department VARCHAR(100),
    requested_department VARCHAR(100) NOT NULL,
    current_branch VARCHAR(100),
    requested_branch VARCHAR(100) NOT NULL,
    preferred_effective_date DATE,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Submitted',
    manager_approval VARCHAR(30) DEFAULT 'Pending',
    hr_approval VARCHAR(30) DEFAULT 'Pending',
    reviewed_by VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transfer_req_emp ON transfer_requests(employee_id);

-- 2. INTERNAL JOB APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS internal_job_applications (
    id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    current_designation VARCHAR(100),
    cover_letter TEXT,
    status VARCHAR(30) DEFAULT 'Applied',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, employee_id)
);
ALTER TABLE internal_job_applications ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE internal_job_applications ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);
ALTER TABLE internal_job_applications ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE internal_job_applications ADD COLUMN IF NOT EXISTS current_designation VARCHAR(100);
ALTER TABLE internal_job_applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE internal_job_applications ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_internal_job_app_emp ON internal_job_applications(employee_id);

-- 3. PERFORMANCE REVIEWS TABLE
CREATE TABLE IF NOT EXISTS performance_reviews (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    review_period VARCHAR(50) NOT NULL,
    goals TEXT,
    kpi_scores JSONB DEFAULT '{}'::jsonb,
    self_rating NUMERIC(3,1),
    self_review_notes TEXT,
    manager_rating NUMERIC(3,1),
    manager_feedback TEXT,
    status VARCHAR(30) DEFAULT 'Self Review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS self_rating NUMERIC(3,1);
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS self_review_notes TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS manager_rating NUMERIC(3,1);
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS manager_feedback TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_perf_reviews_emp ON performance_reviews(employee_id);

-- 4. TIMESHEETS TABLE
CREATE TABLE IF NOT EXISTS timesheets (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    project_name VARCHAR(150) NOT NULL,
    task_name VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    hours_spent NUMERIC(4,2) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'Submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS project_name VARCHAR(150);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS task_name VARCHAR(150);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS hours_spent NUMERIC(4,2) DEFAULT 8.0;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Submitted';
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS task_description TEXT;
ALTER TABLE timesheets ALTER COLUMN task_description DROP NOT NULL;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS hours NUMERIC(4,2) DEFAULT 8.0;
ALTER TABLE timesheets ALTER COLUMN hours DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timesheets_emp ON timesheets(employee_id);

-- 5. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    priority VARCHAR(20) DEFAULT 'Normal',
    target_department VARCHAR(100) DEFAULT 'All',
    created_by VARCHAR(100) DEFAULT 'HR Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Normal';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_department VARCHAR(100) DEFAULT 'All';

-- 6. ESS NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS ess_notifications (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(200),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ess_notif_emp ON ess_notifications(employee_id);

-- SEED SEVERAL SAMPLE ANNOUNCEMENTS & REVIEWS IF NOT EXISTS
INSERT INTO announcements (id, title, content, category, priority, target_department, created_by)
VALUES 
  ('ANN-001', 'Annual Company Townhall 2026', 'Join us for the Annual Strategy & Vision Townhall meeting this Friday at 4 PM.', 'Event', 'High', 'All', 'HR Director'),
  ('ANN-002', 'Q3 Performance Review Cycle Open', 'Self-reviews for Q3 are now open in the Employee Portal. Please complete by month end.', 'Policy', 'High', 'All', 'HR Manager')
ON CONFLICT (id) DO NOTHING;
