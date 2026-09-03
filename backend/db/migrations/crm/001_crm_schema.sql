-- ============================================================
-- CRM Database Schema — Friend 1
-- Tables: leads, customers, contacts, opportunities, activities,
--         follow_ups, notes, products, quotations, sales_orders,
--         invoices, vendors, purchase_orders
-- ============================================================

-- ------------------------------------
-- LEADS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  company      TEXT,
  email        TEXT,
  phone        TEXT,
  value        NUMERIC(15,2) DEFAULT 0,
  stage        TEXT NOT NULL DEFAULT 'New'
                 CHECK (stage IN ('New','Contacted','Qualified','Proposal','Won','Lost')),
  score        INTEGER DEFAULT 50,
  source       TEXT DEFAULT 'Manual/Other',
  assigned_to  TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- CUSTOMERS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id               TEXT PRIMARY KEY,
  customer_code    TEXT UNIQUE,
  customer_name    TEXT NOT NULL,
  customer_type    TEXT DEFAULT 'Company' CHECK (customer_type IN ('Individual','Company')),
  industry         TEXT,
  owner_id         TEXT,
  status           TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive','At Risk')),
  credit_limit     NUMERIC(15,2) DEFAULT 0,
  contact_name     TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  billing_city     TEXT,
  billing_country  TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- CONTACTS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  company      TEXT,
  customer_id  TEXT REFERENCES customers(id) ON DELETE SET NULL,
  lead_id      TEXT REFERENCES leads(id) ON DELETE SET NULL,
  title        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- OPPORTUNITIES
-- ------------------------------------
CREATE TABLE IF NOT EXISTS opportunities (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  customer_id     TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,
  value           NUMERIC(15,2) DEFAULT 0,
  probability     INTEGER DEFAULT 50,
  expected_close  DATE,
  owner           TEXT,
  stage           TEXT DEFAULT 'New'
                    CHECK (stage IN ('New','Qualified','Proposal','Negotiation','Won','Lost')),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- ACTIVITIES (calls, meetings, tasks, emails)
-- ------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  type           TEXT DEFAULT 'Task' CHECK (type IN ('Call','Meeting','Email','Task')),
  related_to     TEXT,
  customer_id    TEXT,
  opportunity_id TEXT,
  assigned_to    TEXT,
  due_date       TEXT,
  priority       TEXT DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  status         TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Cancelled')),
  outcome        TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- FOLLOW-UPS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS follow_ups (
  id              TEXT PRIMARY KEY,
  related_entity  TEXT,
  opportunity_id  TEXT,
  activity_type   TEXT DEFAULT 'Call',
  due_date        TEXT,
  owner           TEXT,
  status          TEXT DEFAULT 'Upcoming' CHECK (status IN ('Overdue','Today','Upcoming','Done')),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- NOTES
-- ------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id           TEXT PRIMARY KEY,
  content      TEXT NOT NULL,
  entity_type  TEXT,   -- 'lead' | 'customer' | 'opportunity' | 'contact'
  entity_id    TEXT,
  author       TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- PRODUCTS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  sku         TEXT UNIQUE,
  name        TEXT NOT NULL,
  category    TEXT,
  price       NUMERIC(15,2) DEFAULT 0,
  stock       INTEGER DEFAULT 0,
  uom         TEXT DEFAULT 'Units',
  hsn_code    TEXT,
  tax_rate    NUMERIC(5,2) DEFAULT 18,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- QUOTATIONS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id             TEXT PRIMARY KEY,
  quote_number   TEXT UNIQUE NOT NULL,
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name  TEXT,
  date           DATE DEFAULT CURRENT_DATE,
  valid_until    DATE,
  amount         NUMERIC(15,2) DEFAULT 0,
  status         TEXT DEFAULT 'Draft'
                   CHECK (status IN ('Draft','Sent','Approved','Rejected','Expired')),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id            SERIAL PRIMARY KEY,
  quotation_id  TEXT REFERENCES quotations(id) ON DELETE CASCADE,
  product_id    TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT,
  quantity      INTEGER DEFAULT 1,
  unit_price    NUMERIC(15,2) DEFAULT 0,
  tax_rate      NUMERIC(5,2) DEFAULT 18,
  total         NUMERIC(15,2) DEFAULT 0
);

-- ------------------------------------
-- SALES ORDERS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS sales_orders (
  id                  TEXT PRIMARY KEY,
  so_number           TEXT UNIQUE NOT NULL,
  quotation_id        TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id         TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name       TEXT,
  date                DATE DEFAULT CURRENT_DATE,
  total_amount        NUMERIC(15,2) DEFAULT 0,
  fulfillment_status  TEXT DEFAULT 'Pending'
                        CHECK (fulfillment_status IN ('Pending','Partial','Fulfilled','Cancelled')),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id              SERIAL PRIMARY KEY,
  sales_order_id  TEXT REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id      TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT,
  quantity        INTEGER DEFAULT 1,
  unit_price      NUMERIC(15,2) DEFAULT 0,
  tax_rate        NUMERIC(5,2) DEFAULT 18,
  total           NUMERIC(15,2) DEFAULT 0
);

-- ------------------------------------
-- INVOICES
-- ------------------------------------
CREATE TABLE IF NOT EXISTS crm_invoices (
  id              TEXT PRIMARY KEY,
  invoice_number  TEXT UNIQUE NOT NULL,
  sales_order_id  TEXT REFERENCES sales_orders(id) ON DELETE SET NULL,
  customer_id     TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,
  date            DATE DEFAULT CURRENT_DATE,
  due_date        DATE,
  amount          NUMERIC(15,2) DEFAULT 0,
  paid_amount     NUMERIC(15,2) DEFAULT 0,
  status          TEXT DEFAULT 'Draft'
                    CHECK (status IN ('Draft','Issued','Paid','Overdue','Cancelled')),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_invoice_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  TEXT REFERENCES crm_invoices(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(15,2) DEFAULT 0,
  tax_rate    NUMERIC(5,2) DEFAULT 18,
  total       NUMERIC(15,2) DEFAULT 0
);

-- ------------------------------------
-- VENDORS (CRM-side: supplier relationships for purchasing)
-- ------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
  id               TEXT PRIMARY KEY,
  code             TEXT UNIQUE,
  name             TEXT NOT NULL,
  contact_person   TEXT,
  email            TEXT,
  phone            TEXT,
  payable_balance  NUMERIC(15,2) DEFAULT 0,
  rating           NUMERIC(3,1) DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- PURCHASE ORDERS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           TEXT PRIMARY KEY,
  po_number    TEXT UNIQUE NOT NULL,
  vendor_id    TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_name  TEXT,
  date         DATE DEFAULT CURRENT_DATE,
  amount       NUMERIC(15,2) DEFAULT 0,
  status       TEXT DEFAULT 'Draft'
                 CHECK (status IN ('Draft','Approved','Received','Cancelled','Completed')),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------
-- UPDATED_AT auto-update trigger (applied to main tables)
-- ------------------------------------
CREATE OR REPLACE FUNCTION crm_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'leads','customers','contacts','opportunities',
    'products','quotations','sales_orders','crm_invoices',
    'vendors','purchase_orders','notes'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || tbl || '_updated_at'
        AND tgrelid = tbl::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION crm_set_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ------------------------------------
-- Seed default products (idempotent)
-- ------------------------------------
INSERT INTO products (id, sku, name, category, price, stock, uom, hsn_code, tax_rate) VALUES
  ('PROD-A', 'SKU-ENT-01', 'Product A - Enterprise CRM Suite',   'Software License', 6540000, 120, 'Licenses', '998313', 18),
  ('PROD-B', 'SKU-ENT-02', 'Product B - HRMS & Payroll System',  'Software License', 4520000, 85,  'Licenses', '998313', 18),
  ('PROD-C', 'SKU-ENT-03', 'Product C - ERP Accounting Module',  'Software License', 3210000, 50,  'Licenses', '998313', 18),
  ('PROD-D', 'SKU-ENT-04', 'Product D - Cloud Hosting Setup',    'Infrastructure',   2875000, 200, 'Units',    '998315', 18)
ON CONFLICT (id) DO NOTHING;
