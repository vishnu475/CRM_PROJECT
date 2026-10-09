-- ============================================================
-- STEP 20: VENDOR INVOICES & PURCHASE PAYMENT TRACKING MIGRATION
-- Adds invoice due dates, invoice amounts, paid amounts,
-- payment history tracking, and banking integration.
-- ============================================================

-- 1. Upgrade purchase_orders table with invoice & payment details
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_invoice_date DATE,
  ADD COLUMN IF NOT EXISTS vendor_invoice_due_date DATE,
  ADD COLUMN IF NOT EXISTS vendor_invoice_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS last_payment_reference TEXT;

-- 2. Create purchase_payments table
CREATE TABLE IF NOT EXISTS purchase_payments (
  id                    TEXT PRIMARY KEY,
  purchase_order_id     TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  vendor_id             TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_invoice_number TEXT,
  payment_number        TEXT UNIQUE NOT NULL,
  payment_date          DATE DEFAULT CURRENT_DATE,
  amount                NUMERIC(15,2) NOT NULL,
  payment_method        TEXT DEFAULT 'Bank Transfer',
  bank_account_id       TEXT,
  bank_account_name     TEXT,
  reference_number      TEXT,
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_purchase_payments_po_id ON purchase_payments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_vendor_id ON purchase_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_payment_status ON purchase_orders(payment_status);
