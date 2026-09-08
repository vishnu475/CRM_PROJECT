-- Migration 012: Comprehensive Intern Management Module
-- Dual-DB Architecture: HRMS PostgreSQL Database

-- 1. Ensure all columns exist on interns table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'intern_code') THEN
        ALTER TABLE interns ADD COLUMN intern_code VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'branch_specialization') THEN
        ALTER TABLE interns ADD COLUMN branch_specialization VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'profile_photo') THEN
        ALTER TABLE interns ADD COLUMN profile_photo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'converted_at') THEN
        ALTER TABLE interns ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'conversion_date') THEN
        ALTER TABLE interns ADD COLUMN conversion_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'resume_url') THEN
        ALTER TABLE interns ADD COLUMN resume_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'branch') THEN
        ALTER TABLE interns ADD COLUMN branch VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'avatar') THEN
        ALTER TABLE interns ADD COLUMN avatar TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interns' AND column_name = 'documents') THEN
        ALTER TABLE interns ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

UPDATE interns SET 
    intern_code = COALESCE(intern_code, intern_id, id),
    branch_specialization = COALESCE(branch_specialization, branch),
    profile_photo = COALESCE(profile_photo, avatar);

-- 2. Ensure Employees table has reference to converted internship if applicable
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'converted_from_intern_id'
    ) THEN
        ALTER TABLE employees ADD COLUMN converted_from_intern_id VARCHAR(50);
    END IF;
END $$;

-- 3. Ensure columns on intern_tasks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_tasks' AND column_name = 'progress_percent') THEN
        ALTER TABLE intern_tasks ADD COLUMN progress_percent INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_tasks' AND column_name = 'progress') THEN
        ALTER TABLE intern_tasks ADD COLUMN progress INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_tasks' AND column_name = 'updated_at') THEN
        ALTER TABLE intern_tasks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 4. Ensure columns on intern_attendance_records
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_attendance_records' AND column_name = 'work_hours') THEN
        ALTER TABLE intern_attendance_records ADD COLUMN work_hours NUMERIC(5,2) DEFAULT 0.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_attendance_records' AND column_name = 'worked_hours') THEN
        ALTER TABLE intern_attendance_records ADD COLUMN worked_hours NUMERIC(5,2) DEFAULT 0.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_attendance_records' AND column_name = 'overtime_hours') THEN
        ALTER TABLE intern_attendance_records ADD COLUMN overtime_hours NUMERIC(5,2) DEFAULT 0.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_attendance_records' AND column_name = 'late_minutes') THEN
        ALTER TABLE intern_attendance_records ADD COLUMN late_minutes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_attendance_records' AND column_name = 'regularization_status') THEN
        ALTER TABLE intern_attendance_records ADD COLUMN regularization_status VARCHAR(20) DEFAULT 'NONE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_attendance_records' AND column_name = 'updated_at') THEN
        ALTER TABLE intern_attendance_records ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 5. Intern Leave Requests Table / Aliases
CREATE TABLE IF NOT EXISTS intern_leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    intern_id VARCHAR(50) REFERENCES interns(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL DEFAULT 'Casual Leave',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days NUMERIC(4,1) DEFAULT 1.0,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'APPROVED',
    approved_by VARCHAR(100) DEFAULT 'Rahul Verma (Mentor)',
    review_comment TEXT DEFAULT 'Approved as requested.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_leave_requests' AND column_name = 'review_comment') THEN
        ALTER TABLE intern_leave_requests ADD COLUMN review_comment TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_leave_requests' AND column_name = 'reviewed_by') THEN
        ALTER TABLE intern_leave_requests ADD COLUMN reviewed_by VARCHAR(100);
    END IF;
END $$;

-- 6. Intern Evaluations Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_evaluations' AND column_name = 'attendance_rating') THEN
        ALTER TABLE intern_evaluations ADD COLUMN attendance_rating INTEGER DEFAULT 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_evaluations' AND column_name = 'attendance') THEN
        ALTER TABLE intern_evaluations ADD COLUMN attendance INTEGER DEFAULT 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_evaluations' AND column_name = 'evaluated_by') THEN
        ALTER TABLE intern_evaluations ADD COLUMN evaluated_by VARCHAR(100) DEFAULT 'HR Admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intern_evaluations' AND column_name = 'evaluation_date') THEN
        ALTER TABLE intern_evaluations ADD COLUMN evaluation_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 7. Intern Certificates Table
CREATE TABLE IF NOT EXISTS intern_certificates (
    id VARCHAR(50) PRIMARY KEY,
    intern_id VARCHAR(50) REFERENCES interns(id) ON DELETE CASCADE,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    intern_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration VARCHAR(50) NOT NULL,
    organization VARCHAR(150) DEFAULT 'Antigravity Enterprise Solutions Pvt. Ltd.',
    issue_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Number Sequences for Intern IDs
INSERT INTO number_sequences (id, prefix, current_value, padding)
VALUES ('seq-intern', 'INT', 104, 3)
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Realistic Sample Interns
INSERT INTO interns (
    id, intern_id, intern_code, name, email, phone, dob, gender, address, college, degree,
    branch, branch_specialization, graduation_year, roll_number, cgpa_percentage, internship_type,
    department, designation, start_date, end_date, duration, work_mode, location, stipend,
    reporting_manager_id, reporting_manager_name, mentor_id, mentor_name, status,
    company_email, system_access, attendance_access, assigned_device, id_card_issued
) VALUES
(
    'INT-101', 'INT-101', 'INT-101', 'Aarav Mehta', 'aarav.mehta@intern.company.com', '+91 98765 22001',
    '2002-04-12', 'Male', 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    'BMS College of Engineering', 'B.Tech', 'Information Science & Engineering',
    'Information Science & Engineering', '2025', '1BM21IS045', '9.1 CGPA', 'AI / ML',
    'Engineering', 'AI Research & ML Intern',
    CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '90 days', '6 Months',
    'Hybrid', 'Bengaluru HQ', 30000.00, 'EMP-001', 'Sarah Jenkins', 'EMP-004', 'Rahul Verma',
    'Active', 'aarav.mehta@company.com', true, true, 'MacBook Pro M3 (INT-DEV-01)', true
),
(
    'INT-102', 'INT-102', 'INT-102', 'Ananya Deshmukh', 'ananya.deshmukh@intern.company.com', '+91 98765 22002',
    '2003-01-20', 'Female', '304 Orchid Enclave, Powai, Mumbai',
    'VJTI Mumbai', 'B.Tech', 'Computer Engineering', 'Computer Engineering', '2025',
    'VJ21CE102', '8.9 CGPA', 'Full Stack', 'Engineering', 'Full Stack Engineering Intern',
    CURRENT_DATE - INTERVAL '150 days', CURRENT_DATE - INTERVAL '5 days', '6 Months',
    'On-site', 'Mumbai HQ', 28000.00, 'EMP-001', 'Sarah Jenkins', 'EMP-004', 'Rahul Verma',
    'Completed', 'ananya.deshmukh@company.com', true, true, 'Dell XPS 15 (INT-DEV-02)', true
),
(
    'INT-103', 'INT-103', 'INT-103', 'Rohan Kulkarni', 'rohan.kulkarni@intern.company.com', '+91 98765 22003',
    '2002-09-08', 'Male', 'H.No 88, HSR Layout Sector 2, Bengaluru',
    'PES University', 'B.Tech', 'Electronics & Computer Science',
    'Electronics & Computer Science', '2025', 'PES2021-0089', '8.65 CGPA', 'Cloud',
    'Engineering', 'Cloud & DevOps Intern',
    CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '160 days', '6 Months',
    'Remote', 'Bengaluru HQ', 25000.00, 'EMP-001', 'Sarah Jenkins', 'EMP-004', 'Rahul Verma',
    'Active', 'rohan.kulkarni@company.com', true, true, 'ThinkPad T14 (INT-DEV-03)', true
),
(
    'INT-104', 'INT-104', 'INT-104', 'Sneha Pillai', 'sneha.pillai@intern.company.com', '+91 98765 22004',
    '2003-03-14', 'Female', '45 Jubilee Hills, Road No 10, Hyderabad',
    'Osmania University', 'BBA / MBA', 'Human Resources & Talent Management',
    'Human Resources & Talent Management', '2025', 'OU2023HR02', '8.8 CGPA', 'HR',
    'HR', 'HR & Talent Acquisition Intern',
    CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '85 days', '3 Months',
    'On-site', 'Hyderabad Branch', 20000.00, 'EMP-003', 'Priya Sharma', 'EMP-003', 'Priya Sharma',
    'Onboarding', 'sneha.pillai@company.com', true, true, 'HP EliteBook 840 (INT-DEV-04)', true
)
ON CONFLICT (id) DO UPDATE SET
    intern_id = EXCLUDED.intern_id,
    intern_code = EXCLUDED.intern_code,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    status = EXCLUDED.status;

-- Seed Tasks for Aarav & Ananya
INSERT INTO intern_tasks (id, intern_id, title, description, assigned_by, mentor_name, deadline, status, progress_percent, comments, feedback)
VALUES
('TSK-INT-001', 'INT-101', 'Fine-tune GPT Embeddings Pipeline', 'Implement semantic chunking and benchmark recall rate on customer support knowledge base.', 'Rahul Verma', 'Rahul Verma', CURRENT_DATE + INTERVAL '5 days', 'In Progress', 75, '[{"author": "Rahul Verma", "text": "Good progress on chunking logic.", "date": "2026-09-01"}]'::jsonb, 'Excellent grasp of cosine similarity thresholds.'),
('TSK-INT-002', 'INT-101', 'Benchmark Vector Search Query Latency', 'Profile PostgreSQL pgvector index vs HNSW for 50k CRM interactions.', 'Rahul Verma', 'Rahul Verma', CURRENT_DATE + INTERVAL '12 days', 'Not Started', 0, '[]'::jsonb, NULL),
('TSK-INT-003', 'INT-102', 'Build React Form Multi-Step State Engine', 'Create zero-flicker validation state machine for HRMS candidate records.', 'Rahul Verma', 'Rahul Verma', CURRENT_DATE - INTERVAL '10 days', 'Completed', 100, '[{"author": "Rahul Verma", "text": "Shipped ahead of schedule.", "date": "2026-08-28"}]'::jsonb, 'Top notch code quality and unit test coverage.')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    progress_percent = EXCLUDED.progress_percent;

-- Sync progress column with progress_percent
UPDATE intern_tasks SET progress = progress_percent;

-- Seed Attendance records for Aarav
INSERT INTO intern_attendance_records (id, intern_id, date, check_in, check_out, work_hours, worked_hours, status, late_minutes)
VALUES
('ATT-INT-101-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), 'INT-101', CURRENT_DATE, '09:28 AM', '06:32 PM', 8.5, 8.5, 'Present', 0),
('ATT-INT-101-' || TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'), 'INT-101', CURRENT_DATE - INTERVAL '1 day', '09:35 AM', '06:30 PM', 8.0, 8.0, 'Late', 5),
('ATT-INT-101-' || TO_CHAR(CURRENT_DATE - INTERVAL '2 days', 'YYYY-MM-DD'), 'INT-101', CURRENT_DATE - INTERVAL '2 days', '09:15 AM', '06:15 PM', 8.0, 8.0, 'Work From Home', 0),
('ATT-INT-102-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), 'INT-102', CURRENT_DATE, '09:30 AM', '06:30 PM', 8.0, 8.0, 'Present', 0)
ON CONFLICT (id) DO NOTHING;

-- Seed Leave for Aarav
INSERT INTO intern_leave_requests (id, intern_id, leave_type, start_date, end_date, days, reason, status, approved_by, review_comment)
VALUES
('LV-INT-001', 'INT-101', 'Permission', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', 0.5, 'College internal viva presentation', 'APPROVED', 'Rahul Verma', 'Approved. Hope the presentation went well!')
ON CONFLICT (id) DO NOTHING;

-- Seed Evaluation for Ananya (Completed intern ready for conversion)
INSERT INTO intern_evaluations (
    id, intern_id, technical_skills, communication, problem_solving, teamwork, discipline,
    attendance, attendance_rating, task_completion, learning_ability, overall_performance,
    mentor_comments, manager_comments, hr_comments, recommendation, evaluated_by, evaluation_date
) VALUES
(
    'EVAL-INT-102', 'INT-102', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    'Outstanding software engineering skills. Successfully delivered the multi-step form engine and resolved complex edge cases without supervision.',
    'Exceeded expectations for an intern. Highly collaborative and communicates technical constraints effectively.',
    'Candidate has completed all academic prerequisites. Approved for conversion to permanent Associate Software Engineer with standard CTC package.',
    'Convert to Employee', 'Sarah Jenkins (VP Eng) & Rahul Verma (Mentor)', CURRENT_DATE - INTERVAL '2 days'
)
ON CONFLICT (id) DO UPDATE SET
    recommendation = EXCLUDED.recommendation,
    mentor_comments = EXCLUDED.mentor_comments;

-- Seed Certificate for Ananya
INSERT INTO intern_certificates (
    id, intern_id, certificate_id, intern_name, department, role, start_date, end_date, duration, organization, issue_date
) VALUES
(
    'CERT-INT-102', 'INT-102', 'CERT-2026-INT-102', 'Ananya Deshmukh', 'Engineering',
    'Full Stack Engineering Intern', CURRENT_DATE - INTERVAL '150 days', CURRENT_DATE - INTERVAL '5 days',
    '6 Months', 'Antigravity Enterprise Solutions Pvt. Ltd.', CURRENT_DATE - INTERVAL '2 days'
)
ON CONFLICT (id) DO UPDATE SET
    certificate_id = EXCLUDED.certificate_id;
