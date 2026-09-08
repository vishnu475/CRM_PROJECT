-- Migration 009: Add Re-open workflow fields to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reopen_count INTEGER DEFAULT 0;
