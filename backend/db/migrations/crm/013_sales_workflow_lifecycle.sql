-- ============================================================
-- CRM Migration 013: Sales Workflow Lifecycle & Traceability
-- Tables updated: quotations, sales_orders, crm_invoices
-- ============================================================

-- 1. QUOTATIONS: Update status check constraint & add lifecycle fields
DO $$ 
BEGIN
  -- Drop existing check constraint on quotations.status if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotations_status_check'
  ) THEN
    ALTER TABLE quotations DROP CONSTRAINT quotations_status_check;
  END IF;
END $$;

-- Add updated check constraint allowing full quotation lifecycle
ALTER TABLE quotations ADD CONSTRAINT quotations_status_check 
  CHECK (status IN ('Draft', 'Sent', 'Revision Requested', 'Revised', 'Accepted', 'Approved', 'Rejected', 'Expired'));

-- Add traceability and financial calculation columns to quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS accepted_date TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS owner TEXT;

-- 2. SALES ORDERS: Update lifecycle fields & traceability
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Confirmed';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_status_check'
  ) THEN
    ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check
      CHECK (status IN ('Draft', 'Confirmed', 'Processing', 'Delivered', 'Completed', 'Cancelled'));
  END IF;
END $$;

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. CRM INVOICES: Update traceability & terms
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS opportunity_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE crm_invoices ADD COLUMN IF NOT EXISTS notes TEXT;
