-- Migration 021: Add attachments JSONB column to leads table for project requirements attachments
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
