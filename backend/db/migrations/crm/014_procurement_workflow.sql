-- ============================================================
-- STEP 19: PROCUREMENT & PURCHASE ORDER LIFECYCLE MIGRATION
-- Adds line items, receiving workflow, expected delivery, payment status,
-- and goods receipt traceability.
-- ============================================================

-- 1. Upgrade purchase_orders table
ALTER TABLE purchase_orders 
  DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS expected_delivery DATE,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_status TEXT DEFAULT 'Not Received',
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid',
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30 Days',
  ADD COLUMN IF NOT EXISTS delivery_location TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS vendor_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS vendor_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 1;

-- 2. Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                  SERIAL PRIMARY KEY,
  purchase_order_id   TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id          TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name        TEXT NOT NULL,
  quantity            INTEGER DEFAULT 1,
  received_quantity   INTEGER DEFAULT 0,
  unit_price          NUMERIC(15,2) DEFAULT 0,
  tax_rate            NUMERIC(5,2) DEFAULT 18,
  total               NUMERIC(15,2) DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create goods_receipts table
CREATE TABLE IF NOT EXISTS goods_receipts (
  id                    TEXT PRIMARY KEY,
  receipt_number        TEXT UNIQUE NOT NULL,
  purchase_order_id     TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  po_number             TEXT NOT NULL,
  date                  DATE DEFAULT CURRENT_DATE,
  received_by           TEXT,
  delivery_note_number  TEXT,
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE goods_receipts ADD COLUMN IF NOT EXISTS delivery_note_number TEXT;

-- 4. Create goods_receipt_items table
CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id                  SERIAL PRIMARY KEY,
  goods_receipt_id    TEXT REFERENCES goods_receipts(id) ON DELETE CASCADE,
  product_id          TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name        TEXT NOT NULL,
  quantity_received   INTEGER NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add indexes for high performance queries
CREATE INDEX IF NOT EXISTS idx_po_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po_id ON goods_receipts(purchase_order_id);
