-- ============================================================
-- Migration 010: Enterprise Task Management, Activity & Performance Engine
-- ============================================================

-- 1. UPGRADE TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project_name VARCHAR(150) DEFAULT 'General Operations',
    assigned_to VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(100) DEFAULT 'Manager',
    priority VARCHAR(50) DEFAULT 'Medium',
    due_date DATE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ASSIGNED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add all enterprise columns safely
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_code VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS department_id VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS department_name VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by_id VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6,2) DEFAULT 8.0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(6,2) DEFAULT 0.0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_note TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS manager_feedback TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reopened_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS previous_assignee VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reassigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reassign_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Feature Development';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags VARCHAR(255) DEFAULT 'Core, Enterprise';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Normalize existing task statuses to uppercase standards
UPDATE tasks SET status = 'IN_PROGRESS' WHERE status = 'In Progress';
UPDATE tasks SET status = 'COMPLETED' WHERE status = 'Completed';
UPDATE tasks SET status = 'SUBMITTED' WHERE status = 'In Review' OR status = 'Submitted' OR status = 'QA';
UPDATE tasks SET status = 'ASSIGNED' WHERE status = 'To Do' OR status = 'Backlog' OR status = 'Pending' OR status = 'Assigned';
UPDATE tasks SET priority = UPPER(priority) WHERE priority IS NOT NULL;

-- 2. CREATE TASK ACTIVITIES / AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS task_activities (
    id VARCHAR(60) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    performed_by_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_activities_task ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created ON task_activities(created_at DESC);

-- 3. CREATE TASK COMMENTS TABLE
CREATE TABLE IF NOT EXISTS task_comments (
    id VARCHAR(60) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id VARCHAR(50) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_role VARCHAR(50) DEFAULT 'Employee',
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

-- 4. CREATE PERFORMANCE CONFIG / WEIGHTS TABLE (Configurable by Admin/HR)
CREATE TABLE IF NOT EXISTS performance_config (
    id VARCHAR(50) PRIMARY KEY,
    completion_rate_weight NUMERIC(4,2) DEFAULT 0.40,
    ontime_rate_weight NUMERIC(4,2) DEFAULT 0.30,
    manager_rating_weight NUMERIC(4,2) DEFAULT 0.20,
    complexity_weight NUMERIC(4,2) DEFAULT 0.10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO performance_config (id, completion_rate_weight, ontime_rate_weight, manager_rating_weight, complexity_weight)
VALUES ('DEFAULT_CONFIG', 0.40, 0.30, 0.20, 0.10)
ON CONFLICT (id) DO NOTHING;

-- 5. INDEXES ON TASKS FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- 6. SEED DIVERSE REALISTIC TASKS LINKED TO REAL EMPLOYEES
-- Sync assigned_to_name and department_name from employees table
UPDATE tasks t
SET 
    assigned_to_name = COALESCE(e.name, t.assigned_to),
    department_name = COALESCE(e.department, 'Engineering'),
    department_id = COALESCE(e.department, 'Engineering')
FROM employees e
WHERE t.assigned_to = e.emp_code OR t.assigned_to = e.id;
