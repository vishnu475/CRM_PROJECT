-- Add qualification fields to leads table if not already present
ALTER TABLE leads ADD COLUMN IF NOT EXISTS requirement TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS decision_maker TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget NUMERIC(15,2);
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_stage_check CHECK (stage IN ('New','Contacted','Qualified','Proposal','Negotiation','Won','Lost'));
