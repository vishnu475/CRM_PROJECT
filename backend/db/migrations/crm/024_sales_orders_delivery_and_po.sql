-- ============================================================
-- CRM Migration 024: Sales Orders Delivery & Customer PO Fields
-- Adds expected_delivery_date, delivery_address, customer_po_number
-- ============================================================

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_po_number TEXT;

