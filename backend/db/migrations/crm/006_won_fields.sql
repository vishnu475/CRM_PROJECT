-- Migration 006: Add Won/Closed deal validation fields to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS final_agreed_amount NUMERIC(15,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_date TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_closed_notes TEXT;
