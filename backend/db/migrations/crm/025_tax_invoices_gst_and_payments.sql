-- ============================================================
-- CRM Migration 025: Tax Invoices GST Fields and Payment Tracking
-- ============================================================

-- 1. Update status check constraint on crm_invoices to allow 'Partially Paid'
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_invoices_status_check'
  ) THEN
    ALTER TABLE crm_invoices DROP CONSTRAINT crm_invoices_status_check;
  END IF;
END $$;

ALTER TABLE crm_invoices ADD CONSTRAINT crm_invoices_status_check
  CHECK (status IN ('Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'));

-- 2. Add GST, Place of Supply, Billing, and Banking columns to crm_invoices
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS place_of_supply TEXT;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS place_of_supply_code TEXT;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS customer_gstin TEXT;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS seller_gstin TEXT DEFAULT '29AABCU9603R1ZM';
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'INTRA_STATE';
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS bank_account_id TEXT;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS bank_details_json JSONB;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Bank Transfer';

-- 3. Invoice Payments table for audit trail & partial payment tracking
CREATE TABLE IF NOT EXISTS crm_invoice_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES crm_invoices(id) ON DELETE CASCADE,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT DEFAULT 'Bank Transfer',
  bank_account_id TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

