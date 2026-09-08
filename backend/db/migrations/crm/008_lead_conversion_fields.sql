-- Migration 008: Add Lead Conversion fields to leads and customers tables
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS converted_to_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS converted_to_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS converted_to_opportunity_id TEXT,
  ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS converted_from_lead_id TEXT;
