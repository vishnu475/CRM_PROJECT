-- ============================================================
-- STEP 23: INVENTORY & STOCK MANAGEMENT ENHANCEMENT MIGRATION
-- Adds cost price, reorder level, warehouse location, primary vendor,
-- and dedicated stock_movements ledger table.
-- ============================================================

-- 1. Upgrade products table with stock management columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS warehouse_location TEXT DEFAULT 'Main Warehouse - Bay A',
  ADD COLUMN IF NOT EXISTS primary_vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_vendor_name TEXT;

-- 2. Populate cost_price and reorder levels for existing products if 0
UPDATE products SET 
  cost_price = CASE 
    WHEN cost_price IS NULL OR cost_price = 0 THEN ROUND(price * 0.70, 2) 
    ELSE cost_price 
  END,
  purchase_price = CASE 
    WHEN purchase_price IS NULL OR purchase_price = 0 THEN ROUND(price * 0.75, 2) 
    ELSE purchase_price 
  END,
  reorder_level = CASE 
    WHEN reorder_level IS NULL OR reorder_level = 0 THEN 20 
    ELSE reorder_level 
  END,
  reorder_quantity = CASE 
    WHEN reorder_quantity IS NULL OR reorder_quantity = 0 THEN 50 
    ELSE reorder_quantity 
  END,
  warehouse_location = CASE 
    WHEN warehouse_location IS NULL OR warehouse_location = '' THEN 'Main Warehouse - Bay A' 
    ELSE warehouse_location 
  END
WHERE id IS NOT NULL;

-- 3. Create stock_movements table for complete audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id                    VARCHAR(60) PRIMARY KEY,
  product_id            TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_name          TEXT NOT NULL,
  sku                   TEXT,
  movement_type         VARCHAR(50) NOT NULL, -- 'Purchase Receipt', 'Sales Issue', 'Adjustment', 'Opening Stock', 'Return'
  quantity              INTEGER NOT NULL,     -- positive for stock-in, negative for stock-out
  previous_stock        INTEGER DEFAULT 0,
  new_stock             INTEGER DEFAULT 0,
  reference_type        VARCHAR(50),          -- 'Goods Receipt', 'Sales Order', 'Adjustment', 'Opening Stock'
  reference_id          VARCHAR(100),
  reference_number      VARCHAR(100),
  source_location       TEXT,
  destination_location  TEXT,
  unit_cost             NUMERIC(15,2) DEFAULT 0,
  total_cost            NUMERIC(15,2) DEFAULT 0,
  reason                TEXT,
  performed_by          VARCHAR(100) DEFAULT 'System / Warehouse Staff',
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for high-speed stock queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_id ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 5. Seed initial 'Opening Stock' movements for existing products if no movements exist
INSERT INTO stock_movements (
  id, product_id, product_name, sku, movement_type, quantity, 
  previous_stock, new_stock, reference_type, reference_number, 
  source_location, destination_location, unit_cost, total_cost, reason, performed_by, notes
)
SELECT 
  'SM-INIT-' || p.id,
  p.id,
  p.name,
  p.sku,
  'Opening Stock',
  p.stock,
  0,
  p.stock,
  'Opening Stock',
  'INIT-' || p.sku,
  'Supplier Inbound',
  p.warehouse_location,
  p.cost_price,
  (p.stock * p.cost_price),
  'Initial Warehouse Opening Balance',
  'System Administrator',
  'System initialized inventory master record'
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements sm WHERE sm.product_id = p.id
);
