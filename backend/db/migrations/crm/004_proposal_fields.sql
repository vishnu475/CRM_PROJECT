-- Add proposal support fields to quotations and leads tables
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sent_date TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_amount NUMERIC(15,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_date TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_status TEXT DEFAULT 'Draft';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_sent_date TEXT;
