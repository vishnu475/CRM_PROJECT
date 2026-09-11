-- ====================================================
-- MIGRATION 016: PROJECT GROUPS, MEMBERS & WORKFLOWS
-- ====================================================

-- 1. Ensure project_groups table
CREATE TABLE IF NOT EXISTS project_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    project_id VARCHAR(50) NOT NULL,
    team_head_id VARCHAR(50) NOT NULL,
    team_head_name VARCHAR(100) NOT NULL,
    description TEXT,
    repository_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_groups_project_id ON project_groups (project_id);
CREATE INDEX IF NOT EXISTS idx_project_groups_team_head ON project_groups (team_head_id);

-- 2. Ensure group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'Member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_employee_id ON group_members (employee_id);

-- 3. Ensure task_member_assignments table
CREATE TABLE IF NOT EXISTS task_member_assignments (
    id VARCHAR(50) PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    group_id VARCHAR(50),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100),
    employee_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    employee_progress INT DEFAULT 0,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_member_task ON task_member_assignments (task_id);
CREATE INDEX IF NOT EXISTS idx_task_member_emp ON task_member_assignments (employee_id);

-- 4. Extend tasks table with module and workflow tracking columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'INDIVIDUAL';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_name VARCHAR(150);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS module_name VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_weightage NUMERIC DEFAULT 25.0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repository_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_target_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval_comment TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reference_link TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_employee_id VARCHAR(50);

-- 5. Extend projects table with delivery details
ALTER TABLE projects ADD COLUMN IF NOT EXISTS weightage NUMERIC DEFAULT 100.0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repository_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requirement_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_requirement TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager TEXT;

-- 6. Ensure default projects exist in projects table
INSERT INTO projects (id, code, name, client, project_requirement, project_manager, start_date, end_date, weightage, repository_url, status)
VALUES 
    ('PRJ-CMS', 'CMS', 'CMS Project', 'Media & Publishing Corp', 'Enterprise Headless Content Management System with multi-tenant API, markdown rendering, media management, and role-based publishing workflows.', 'Sarah Jenkins', '2026-09-01', '2026-09-30', 100.0, 'https://github.com/company/cms', 'In Progress'),
    ('PRJ-CRM', 'CRM', 'CRM Project', 'Sales Growth Enterprise', 'Sales pipeline automation, deal tracking, omnichannel leads conversion, and customer 360 analytics.', 'Michael Vance', '2026-08-15', '2026-11-30', 100.0, 'https://github.com/company/crm-suite', 'In Progress'),
    ('PRJ-HPS', 'HPS', 'HPS Project', 'Healthcare Partner Services', 'Hospital Patient Scheduling, electronic medical record sync, and doctor consultation portal.', 'Priya Sharma', '2026-07-01', '2026-12-31', 100.0, 'https://github.com/company/hps-health', 'In Progress')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    repository_url = COALESCE(projects.repository_url, EXCLUDED.repository_url);

-- 7. Ensure default CMS Project Group exists
INSERT INTO project_groups (id, name, project_id, team_head_id, team_head_name, description, repository_url)
VALUES (
    'grp_crm_core_01',
    'CMS Project Development Team',
    'PRJ-CMS',
    'EMP-005',
    'Vishnu Vardhan',
    'Core cross-functional delivery group for CMS Project',
    'https://github.com/company/cms'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    project_id = EXCLUDED.project_id,
    team_head_id = EXCLUDED.team_head_id,
    team_head_name = EXCLUDED.team_head_name,
    repository_url = COALESCE(project_groups.repository_url, EXCLUDED.repository_url);

-- 7. Ensure group members exist for the CMS Project Group
INSERT INTO group_members (id, group_id, employee_id, employee_name, role)
VALUES 
    ('gm_seed_005', 'grp_crm_core_01', 'EMP-005', 'Vishnu Vardhan', 'Team Head'),
    ('gm_seed_003', 'grp_crm_core_01', 'EMP-003', 'Priya Sharma', 'Member'),
    ('gm_seed_004', 'grp_crm_core_01', 'EMP-004', 'Rahul Verma', 'Member'),
    ('gm_seed_008', 'grp_crm_core_01', 'EMP-008', 'Ramesh', 'Member')
ON CONFLICT (id) DO NOTHING;
