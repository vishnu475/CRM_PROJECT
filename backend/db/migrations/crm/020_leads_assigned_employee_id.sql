-- Migration 020: Add assigned_to_employee_id to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to_employee_id TEXT;
