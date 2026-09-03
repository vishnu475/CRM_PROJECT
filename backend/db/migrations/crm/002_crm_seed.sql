-- ============================================================
-- CRM Database Seed Data — Friend 1
-- Seeds all initial mock data so the app has real data on first boot
-- All INSERT statements use ON CONFLICT DO NOTHING for idempotency
-- ============================================================

-- ------------------------------------
-- SEED: Products (4 items)
-- ------------------------------------
INSERT INTO products (id, sku, name, category, price, stock, uom, hsn_code, tax_rate) VALUES
  ('PROD-A', 'SKU-ENT-01', 'Product A - Enterprise CRM Suite',   'Software License', 6540000, 120, 'Licenses', '998313', 18),
  ('PROD-B', 'SKU-ENT-02', 'Product B - HRMS & Payroll System',  'Software License', 4520000, 85,  'Licenses', '998313', 18),
  ('PROD-C', 'SKU-ENT-03', 'Product C - ERP Accounting Module',  'Software License', 3210000, 50,  'Licenses', '998313', 18),
  ('PROD-D', 'SKU-ENT-04', 'Product D - Cloud Hosting Setup',    'Infrastructure',   2875000, 200, 'Units',    '998315', 18)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Customers (10 key accounts)
-- ------------------------------------
INSERT INTO customers (id, customer_code, customer_name, customer_type, industry, owner_id, status, credit_limit, contact_name, contact_email, contact_phone, billing_city, billing_country) VALUES
  ('CUST-001', 'C-001', 'Globex Corporation',   'Company',    'Technology',    'John Doe',    'Active',   5000000,  'George Globex', 'george@globex.com',      '+1 555-100-1001', 'New York',     'USA'),
  ('CUST-002', 'C-002', 'Initech LLC',          'Company',    'Manufacturing', 'Sarah Connor','Active',   3000000,  'Bill Lumbergh', 'bill@initech.com',        '+1 555-200-2002', 'Austin',       'USA'),
  ('CUST-003', 'C-003', 'Acme Corp',            'Company',    'Retail',        'Mike Ross',   'Active',   2000000,  'Wile Coyote',   'wile@acme.com',           '+1 555-300-3003', 'Los Angeles',  'USA'),
  ('CUST-004', 'C-004', 'Stark Industries',     'Company',    'Technology',    'John Doe',    'Active',   8000000,  'Tony Stark',    'tony@starkindustries.com', '+1 555-400-4004', 'Malibu',       'USA'),
  ('CUST-005', 'C-005', 'Wayne Enterprises',    'Company',    'Manufacturing', 'Sarah Connor','Active',   6000000,  'Bruce Wayne',   'bruce@wayne.com',         '+1 555-500-5005', 'Gotham City',  'USA'),
  ('CUST-006', 'C-006', 'Pied Piper Inc',       'Company',    'Technology',    'Mike Ross',   'Active',   1500000,  'Richard Hendricks','richard@piedpiper.com', '+1 555-600-6006', 'Palo Alto',    'USA'),
  ('CUST-007', 'C-007', 'Vandelay Industries',  'Company',    'Retail',        'John Doe',    'At Risk',  1000000,  'Art Vandelay',  'art@vandelay.com',        '+1 555-700-7007', 'New York',     'USA'),
  ('CUST-008', 'C-008', 'Dunder Mifflin',       'Company',    'Manufacturing', 'Sarah Connor','Active',   2500000,  'Michael Scott', 'michael@dundermifflin.com','+1 555-800-8008','Scranton',      'USA'),
  ('CUST-009', 'C-009', 'Cyberdyne Systems',    'Company',    'Technology',    'Mike Ross',   'Active',   4000000,  'Miles Dyson',   'miles@cyberdyne.com',     '+1 555-900-9009', 'Los Angeles',  'USA'),
  ('CUST-010', 'C-010', 'Umbrella Corporation', 'Company',    'Healthcare',    'John Doe',    'Inactive', 500000,   'Albert Wesker', 'wesker@umbrella.com',     '+1 555-010-0101', 'Raccoon City', 'USA')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Contacts
-- ------------------------------------
INSERT INTO contacts (id, name, email, phone, company, customer_id, title) VALUES
  ('CON-101', 'George Globex',     'george@globex.com',       '+1 555-100-1001', 'Globex Corporation',   'CUST-001', 'Chief Executive Officer'),
  ('CON-102', 'Bill Lumbergh',     'bill@initech.com',         '+1 555-200-2002', 'Initech LLC',          'CUST-002', 'Vice President'),
  ('CON-103', 'Wile Coyote',       'wile@acme.com',            '+1 555-300-3003', 'Acme Corp',            'CUST-003', 'Procurement Director'),
  ('CON-104', 'Tony Stark',        'tony@starkindustries.com', '+1 555-400-4004', 'Stark Industries',     'CUST-004', 'Chief Technology Officer'),
  ('CON-105', 'Bruce Wayne',       'bruce@wayne.com',          '+1 555-500-5005', 'Wayne Enterprises',    'CUST-005', 'Managing Director'),
  ('CON-106', 'Richard Hendricks', 'richard@piedpiper.com',    '+1 555-600-6006', 'Pied Piper Inc',       'CUST-006', 'Founder & CEO')
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------
-- SEED: Vendors (2 items)
-- ------------------------------------
INSERT INTO vendors (id, code, name, contact_person, email, phone, payable_balance, rating) VALUES
  ('VND-001', 'VND-001', 'Office Supplies Ltd',  'Mark Miller',   'sales@officesupplies.com', '+1 888-555-1212', 85000,  4.6),
  ('VND-002', 'VND-002', 'AWS Cloud Services',   'Cloud Support', 'billing@aws.com',          '+1 800-444-3333', 0,      4.9),
  ('VND-003', 'VND-003', 'TechMart Solutions',   'David Kumar',   'david@techmart.com',       '+91 98000 11111', 45000,  4.3),
  ('VND-004', 'VND-004', 'PrintPro Services',    'Anita Sharma',  'anita@printpro.com',       '+91 98000 22222', 12000,  4.1)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Leads (20 sample leads)
-- ------------------------------------
INSERT INTO leads (id, name, company, email, phone, value, stage, score, source, assigned_to) VALUES
  ('LD-1001', 'James Wilson',    'TechFlow Inc',      'james@techflow.com',      '555-0101', 250000,  'Qualified', 72, 'Website',      'Sarah Connor'),
  ('LD-1002', 'Emma Thompson',   'NexGen Solutions',  'emma@nexgen.com',         '555-0102', 480000,  'Proposal',  88, 'Referral',     'Mike Ross'),
  ('LD-1003', 'Robert Chen',     'DataSync Corp',     'robert@datasync.com',     '555-0103', 180000,  'New',       45, 'Campaign',     'Sarah Connor'),
  ('LD-1004', 'Lisa Patel',      'CloudVault Ltd',    'lisa@cloudvault.com',     '555-0104', 620000,  'Proposal',  91, 'Referral',     'David Miller'),
  ('LD-1005', 'Mark Johnson',    'Alpha Systems',     'mark@alphasystems.com',   '555-0105', 310000,  'Qualified', 65, 'Website',      'Mike Ross'),
  ('LD-1006', 'Sarah Williams',  'Omega Tech',        'sarah@omegatech.com',     '555-0106', 750000,  'Won',       95, 'Referral',     'Sarah Connor'),
  ('LD-1007', 'David Brown',     'Pinnacle Corp',     'david@pinnacle.com',      '555-0107', 90000,   'Contacted', 55, 'Social Media', 'Mike Ross'),
  ('LD-1008', 'Jennifer Davis',  'Summit Analytics',  'jennifer@summit.com',     '555-0108', 430000,  'Proposal',  83, 'Website',      'David Miller'),
  ('LD-1009', 'Michael Garcia',  'Vertex Solutions',  'michael@vertex.com',      '555-0109', 265000,  'Qualified', 71, 'Campaign',     'Sarah Connor'),
  ('LD-1010', 'Patricia Martinez','Horizon Digital',  'patricia@horizon.com',    '555-0110', 125000,  'New',       38, 'Manual/Other', 'Mike Ross'),
  ('LD-1011', 'Thomas Anderson', 'Matrix Systems',    'thomas@matrix.com',       '555-0111', 890000,  'Won',       97, 'Referral',     'Sarah Connor'),
  ('LD-1012', 'Amanda Lee',      'Spectrum Inc',      'amanda@spectrum.com',     '555-0112', 340000,  'Qualified', 69, 'Website',      'David Miller'),
  ('LD-1013', 'Christopher Taylor','Apex Solutions',  'chris@apex.com',          '555-0113', 195000,  'Contacted', 52, 'Campaign',     'Mike Ross'),
  ('LD-1014', 'Jessica White',   'Fusion Tech',       'jessica@fusiontech.com',  '555-0114', 560000,  'Proposal',  86, 'Referral',     'Sarah Connor'),
  ('LD-1015', 'Kevin Harris',    'Delta Corp',        'kevin@delta.com',         '555-0115', 78000,   'Lost',      30, 'Social Media', 'Mike Ross'),
  ('LD-1016', 'Michelle Robinson','Echo Innovations', 'michelle@echo.com',       '555-0116', 420000,  'Qualified', 74, 'Website',      'David Miller'),
  ('LD-1017', 'Daniel Clark',    'Sigma Systems',     'daniel@sigma.com',        '555-0117', 280000,  'New',       42, 'Manual/Other', 'Sarah Connor'),
  ('LD-1018', 'Angela Lewis',    'Zeta Technologies', 'angela@zeta.com',         '555-0118', 710000,  'Proposal',  90, 'Referral',     'Mike Ross'),
  ('LD-1019', 'Ryan Walker',     'Kappa Corp',        'ryan@kappa.com',          '555-0119', 155000,  'Contacted', 58, 'Campaign',     'David Miller'),
  ('LD-1020', 'Stephanie Hall',  'Lambda Solutions',  'stephanie@lambda.com',    '555-0120', 945000,  'Won',       98, 'Referral',     'Sarah Connor')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Opportunities
-- ------------------------------------
INSERT INTO opportunities (id, name, customer_id, customer_name, value, probability, expected_close, owner, stage) VALUES
  ('OPP-001', 'Enterprise CRM Rollout',      'CUST-001', 'Globex Corporation', 4500000, 70, '2025-08-01', 'Sarah Connor',  'Proposal'),
  ('OPP-002', 'Cloud Migration Project',     'CUST-002', 'Initech LLC',        8200000, 50, '2025-09-15', 'Mike Ross',     'Qualified'),
  ('OPP-003', 'HRMS Software License',       'CUST-003', 'Acme Corp',          9800000, 80, '2025-07-20', 'David Miller',  'Negotiation'),
  ('OPP-004', 'ERP Full Suite Implementation','CUST-004','Stark Industries',  15000000, 90, '2025-07-30', 'Sarah Connor',  'Negotiation'),
  ('OPP-005', 'Payroll System Upgrade',      'CUST-005', 'Wayne Enterprises',  3200000, 60, '2025-10-01', 'Mike Ross',     'Proposal')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Activities (calls, meetings)
-- ------------------------------------
INSERT INTO activities (id, title, type, related_to, assigned_to, due_date, priority, status, outcome) VALUES
  ('ACT-001', 'Initial Product Demo',   'Meeting', 'Globex Corporation',  'Sarah Connor', '2025-09-01', 'High',   'Completed', 'Very positive, requested proposal'),
  ('ACT-002', 'Follow-up Call',         'Call',    'Initech LLC',         'Mike Ross',    '2025-09-02', 'Medium', 'Completed', 'Sent proposal document'),
  ('ACT-003', 'Proposal Review Meeting','Meeting', 'Acme Corp',           'David Miller', '2025-09-05', 'High',   'Pending',   NULL),
  ('ACT-004', 'Contract Negotiation',   'Meeting', 'Stark Industries',    'Sarah Connor', '2025-09-08', 'High',   'Pending',   NULL),
  ('ACT-005', 'Technical Assessment',   'Task',    'Wayne Enterprises',   'Mike Ross',    '2025-09-10', 'Medium', 'Pending',   NULL)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Quotations
-- ------------------------------------
INSERT INTO quotations (id, quote_number, customer_id, customer_name, date, valid_until, amount, status) VALUES
  ('QT-2025-001', 'QT-2025-001', 'CUST-001', 'Globex Corporation', '2025-08-18', '2025-09-18', 4500000, 'Approved'),
  ('QT-2025-002', 'QT-2025-002', 'CUST-002', 'Initech LLC',        '2025-08-19', '2025-09-19', 8200000, 'Sent'),
  ('QT-2025-003', 'QT-2025-003', 'CUST-003', 'Acme Corp',          '2025-08-20', '2025-09-20', 9800000, 'Draft'),
  ('QT-2025-004', 'QT-2025-004', 'CUST-004', 'Stark Industries',   '2025-08-21', '2025-09-21', 15000000,'Approved')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quotation_items (quotation_id, product_id, product_name, quantity, unit_price, tax_rate, total) VALUES
  ('QT-2025-001', 'PROD-A', 'Product A - Enterprise CRM Suite',  2, 6540000, 18, 13080000),
  ('QT-2025-001', 'PROD-D', 'Product D - Cloud Hosting Setup',   1, 2875000, 18, 2875000),
  ('QT-2025-002', 'PROD-B', 'Product B - HRMS & Payroll System', 3, 4520000, 18, 13560000),
  ('QT-2025-003', 'PROD-C', 'Product C - ERP Accounting Module', 2, 3210000, 18, 6420000),
  ('QT-2025-004', 'PROD-A', 'Product A - Enterprise CRM Suite',  5, 6540000, 18, 32700000)
ON CONFLICT DO NOTHING;

-- ------------------------------------
-- SEED: Sales Orders
-- ------------------------------------
INSERT INTO sales_orders (id, so_number, quotation_id, customer_id, customer_name, date, total_amount, fulfillment_status) VALUES
  ('SO-2025-001', 'SO-2025-001', 'QT-2025-001', 'CUST-001', 'Globex Corporation', '2025-08-19', 4500000,  'Fulfilled'),
  ('SO-2025-002', 'SO-2025-002', 'QT-2025-004', 'CUST-004', 'Stark Industries',   '2025-08-20', 15000000, 'Partial'),
  ('SO-2025-003', 'SO-2025-003', NULL,           'CUST-005', 'Wayne Enterprises',  '2025-08-22', 3200000,  'Pending')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Invoices
-- ------------------------------------
INSERT INTO crm_invoices (id, invoice_number, sales_order_id, customer_id, customer_name, date, due_date, amount, paid_amount, status) VALUES
  ('INV-2025-1024', 'INV-2025-1024', 'SO-2025-001', 'CUST-001', 'Globex Corporation', '2025-08-20', '2025-09-20', 4500000,  4500000,  'Paid'),
  ('INV-2025-1025', 'INV-2025-1025', 'SO-2025-002', 'CUST-004', 'Stark Industries',   '2025-08-21', '2025-09-21', 15000000, 7500000,  'Issued'),
  ('INV-2025-1026', 'INV-2025-1026', 'SO-2025-003', 'CUST-005', 'Wayne Enterprises',  '2025-08-23', '2025-09-23', 3200000,  0,        'Draft')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Purchase Orders
-- ------------------------------------
INSERT INTO purchase_orders (id, po_number, vendor_id, vendor_name, date, amount, status) VALUES
  ('PO-2025-045', 'PO-2025-045', 'VND-001', 'Office Supplies Ltd', '2025-08-20', 85000,  'Draft'),
  ('PO-2025-044', 'PO-2025-044', 'VND-002', 'AWS Cloud Services',  '2025-08-15', 240000, 'Completed'),
  ('PO-2025-043', 'PO-2025-043', 'VND-003', 'TechMart Solutions',  '2025-08-10', 67000,  'Approved'),
  ('PO-2025-042', 'PO-2025-042', 'VND-004', 'PrintPro Services',   '2025-08-05', 18000,  'Received')
ON CONFLICT (id) DO NOTHING;
