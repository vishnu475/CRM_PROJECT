-- ============================================================
-- CRM Database Migration 011: Projects Table & Lead Association
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id                    TEXT PRIMARY KEY,
  code                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  client                TEXT NOT NULL,
  customer_id           TEXT REFERENCES customers(id) ON DELETE SET NULL,
  source_lead_id        TEXT REFERENCES leads(id) ON DELETE SET NULL,
  source_opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
  project_requirement   TEXT,
  project_notes         TEXT,
  project_manager       TEXT,
  start_date            DATE,
  end_date              DATE,
  budget                NUMERIC(15,2) DEFAULT 0,
  spent                 NUMERIC(15,2) DEFAULT 0,
  progress              INTEGER DEFAULT 0,
  status                TEXT DEFAULT 'Not Started',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add project association fields to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_project_created BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_created_at TIMESTAMP;

-- Seed initial default projects if not present
INSERT INTO projects (id, code, name, client, budget, spent, progress, status, project_requirement, project_notes, project_manager, start_date, end_date)
VALUES
  ('PRJ-101', 'PRJ-101', 'ERP Suite Enterprise Rollout', 'Globex Corporation', 5000000, 2100000, 68, 'In Progress', 'Enterprise rollout of ERP Suite across all 4 subsidiary companies.', 'Phase 1 completed on time.', 'Emma Watson', '2026-06-01', '2026-10-31'),
  ('PRJ-102', 'PRJ-102', 'HRMS Cloud Migration', 'Initech LLC', 1800000, 450000, 35, 'In Progress', 'Migrate on-premise biometric attendance and HR records to cloud HRMS.', 'Awaiting final network configuration.', 'James Smith', '2026-08-01', '2026-12-15')
ON CONFLICT (id) DO NOTHING;
