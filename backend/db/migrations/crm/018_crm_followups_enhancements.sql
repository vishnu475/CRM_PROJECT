-- ============================================================
-- Migration 018: CRM Follow-ups Table Enhancements
-- Adds support for action titles, notes, priority, assignee,
-- relational keys (customer_id, lead_id, contact_id, activity_id),
-- reminder intervals, and completed_at timestamps.
-- ============================================================

ALTER TABLE follow_ups
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS customer_id TEXT,
  ADD COLUMN IF NOT EXISTS lead_id TEXT,
  ADD COLUMN IF NOT EXISTS contact_id TEXT,
  ADD COLUMN IF NOT EXISTS activity_id TEXT,
  ADD COLUMN IF NOT EXISTS reminder TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Drop strict status check constraint to allow standard ERP statuses
ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_status_check;
