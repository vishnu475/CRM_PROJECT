-- Migration 007: Add Lost workflow fields to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lost_reason VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lost_reason_details TEXT,
  ADD COLUMN IF NOT EXISTS lost_notes TEXT,
  ADD COLUMN IF NOT EXISTS lost_date DATE;
