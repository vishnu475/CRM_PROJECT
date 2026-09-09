-- Migration 016: Enhance vendors table with category, address, gstin, payment_terms, status, website, notes
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS gstin VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'Net 30 Days',
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS website VARCHAR(200),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing vendor records with category and payment terms if null
UPDATE vendors SET category = 'Office Supplies', address = 'Suite 400, Market St, San Francisco, CA', payment_terms = 'Net 30 Days', status = 'Active' WHERE id = 'VND-001' AND (category IS NULL OR category = 'General');
UPDATE vendors SET category = 'Cloud Services', address = '410 Terry Ave N, Seattle, WA', payment_terms = 'Net 30 Days', status = 'Active' WHERE id = 'VND-002' AND (category IS NULL OR category = 'General');
UPDATE vendors SET category = 'Hardware', address = 'Block B, Electronic City, Bengaluru, KA', payment_terms = 'Net 15 Days', status = 'Active' WHERE id = 'VND-003' AND (category IS NULL OR category = 'General');
UPDATE vendors SET category = 'Services', address = 'Sector 62, Noida, UP', payment_terms = 'Net 30 Days', status = 'Active' WHERE id = 'VND-004' AND (category IS NULL OR category = 'General');
