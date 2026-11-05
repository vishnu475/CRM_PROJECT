-- =========================================================================
-- MIGRATION 018: TASK AND PROJECT SCHEMA ALIGNMENT
-- Ensures missing columns on tasks, projects, and task_member_assignments tables exist safely
-- =========================================================================

-- 1. Ensure projects table has project_id column and backfill from id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN project_id VARCHAR(50);
        UPDATE projects SET project_id = id WHERE project_id IS NULL;
    END IF;
END $$;

-- 2. Ensure tasks table has task_id, deliverable_type, attachments, and ai recommendation columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_id VARCHAR(50);
UPDATE tasks SET task_id = id WHERE task_id IS NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deliverable_type VARCHAR(100) DEFAULT 'Code Implementation & Docs';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pdf_attachment_name VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pdf_attachment_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_recommendation_log TEXT;

-- 3. Ensure task_member_assignments has role, is_team_head, and notes
ALTER TABLE task_member_assignments ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member';
ALTER TABLE task_member_assignments ADD COLUMN IF NOT EXISTS is_team_head BOOLEAN DEFAULT FALSE;
ALTER TABLE task_member_assignments ADD COLUMN IF NOT EXISTS notes TEXT;
