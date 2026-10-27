-- 018_sync_projects_schema.sql
-- Align HRMS projects table schema with CRM projects table schema for seamless dual-database mirroring

ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_lead_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_opportunity_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS spent NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
