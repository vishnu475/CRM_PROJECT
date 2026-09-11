-- ============================================================
-- CRM Database Migration 019: Project Priority & Traceability Enhancements
-- ============================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
