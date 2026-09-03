-- Schema compatibility column additions
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_id VARCHAR(50) DEFAULT 'SHF-GEN';
ALTER TABLE job_candidates ADD COLUMN IF NOT EXISTS expected_salary NUMERIC(12,2) DEFAULT 1800000;

-- ------------------------------------
-- SEED: Companies & Branches
-- ------------------------------------
INSERT INTO companies (id, name, tax_id, registration_no, email, phone, address) VALUES
  ('COMP-001', 'Demo Company Pvt. Ltd.', '29AAAAA0000A1Z5', 'U72200KA2020PTC123456', 'contact@democompany.com', '+91 80 4000 5000', '100 Feet Road, Indiranagar, Bengaluru, Karnataka, 560038')
ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, company_id, name, code, city, state, country) VALUES
  ('BR-01', 'COMP-001', 'Headquarters (HQ)', 'HQ-BLR',  'Bengaluru', 'Karnataka',   'India'),
  ('BR-02', 'COMP-001', 'Mumbai Regional',  'MUM-RO',   'Mumbai',    'Maharashtra', 'India'),
  ('BR-03', 'COMP-001', 'Delhi NCR Office', 'DEL-NO',   'Noida',     'Uttar Pradesh','India')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Departments & Designations
-- ------------------------------------
INSERT INTO departments (id, name, code, head_employee_id) VALUES
  ('DEP-01', 'Executive Leadership', 'EXEC', 'EMP-001'),
  ('DEP-02', 'Engineering',          'ENG',  'EMP-002'),
  ('DEP-03', 'Human Resources',      'HR',   'EMP-003'),
  ('DEP-04', 'Sales & Marketing',    'SALES','EMP-004'),
  ('DEP-05', 'Finance & Accounts',   'FIN',  'EMP-005'),
  ('DEP-06', 'Operations',           'OPS',  'EMP-006')
ON CONFLICT (id) DO NOTHING;

INSERT INTO designations (id, title, department_id, level) VALUES
  ('DES-01', 'Chief Executive Officer', 'DEP-01', 'L5'),
  ('DES-02', 'Engineering Manager',     'DEP-02', 'L4'),
  ('DES-03', 'Senior Software Engineer','DEP-02', 'L3'),
  ('DES-04', 'HR Director',             'DEP-03', 'L4'),
  ('DES-05', 'Sales Director',          'DEP-04', 'L4'),
  ('DES-06', 'Senior Accountant',       'DEP-05', 'L3')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Chart of Accounts (COA)
-- ------------------------------------
INSERT INTO accounts (id, code, name, type, balance) VALUES
  ('ACC-1000', '1000', 'HDFC Bank Primary Operating Account',     'Asset',    14835000),
  ('ACC-1200', '1200', 'Accounts Receivable (Trade Customers)',    'Asset',    23450000),
  ('ACC-1300', '1300', 'Inventory & Stock in Trade',               'Asset',    3200000),
  ('ACC-1400', '1400', 'Prepaid Expenses & Advances',              'Asset',    850000),
  ('ACC-2000', '2000', 'Accounts Payable (Trade Vendors)',         'Liability',850000),
  ('ACC-2100', '2100', 'Employee Salaries Payable',                'Liability',2475000),
  ('ACC-2200', '2200', 'GST Tax Payable',                          'Liability',680000),
  ('ACC-3000', '3000', 'Retained Earnings / Equity',               'Equity',   35000000),
  ('ACC-4000', '4000', 'Sales Revenue - Products & Subscriptions', 'Income',   14835000),
  ('ACC-4100', '4100', 'Service Revenue - Implementation',         'Income',   6500000),
  ('ACC-5000', '5000', 'Payroll & Operating Expenses',             'Expense',  2475000),
  ('ACC-5100', '5100', 'Office & Admin Expenses',                  'Expense',  420000),
  ('ACC-5200', '5200', 'Travel & Entertainment Expenses',          'Expense',  185000),
  ('ACC-5300', '5300', 'Software Subscriptions & Licenses',        'Expense',  310000)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Bank Accounts
-- ------------------------------------
INSERT INTO bank_accounts (id, bank_name, account_number, ifsc_code, branch_name, account_type, balance) VALUES
  ('BNK-01', 'HDFC Bank',           '50200012345678', 'HDFC0001234', 'Main Branch', 'Current',    14835000),
  ('BNK-02', 'ICICI Bank',          '000405019876',   'ICIC0000004', 'Tech Park',   'Savings',    4500000),
  ('BNK-03', 'Petty Cash Box HQ',   'CASH-HQ-01',     'CASH0000001', 'HQ Office',   'Petty Cash', 125000)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------
-- SEED: Journal Entries
-- ------------------------------------
INSERT INTO journal_entries (id, voucher_no, entry_date, narration, total_debit, total_credit, status) VALUES
  ('JE-2025-001', 'JE-2025-001', '2025-08-20', 'Sales Invoice INV-2025-1024 settlement from Globex Corp', 4500000, 4500000, 'POSTED'),
  ('JE-2025-002', 'JE-2025-002', '2025-08-19', 'Vendor Purchase PO-2025-044 AWS Cloud Services',          240000,  240000,  'POSTED'),
  ('JE-2025-003', 'JE-2025-003', '2025-08-18', 'Employee Payroll August 2025 disbursement',               2475000, 2475000, 'POSTED'),
  ('JE-2025-004', 'JE-2025-004', '2025-08-15', 'Office Supplies Purchase PO-2025-045',                    85000,   85000,   'DRAFT')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Expense Claims
-- ------------------------------------
INSERT INTO expenses (id, expense_no, employee_id, category, amount, expense_date, description, status) VALUES
  ('EXP-101', 'EXP-2025-012', 'EMP-001', 'Client Meeting & Travel', 12450, '2025-08-19', 'Client visit to Globex Corporation HQ', 'PENDING'),
  ('EXP-102', 'EXP-2025-011', 'EMP-002', 'Software Subscriptions',  8400,  '2025-08-15', 'Annual GitHub Enterprise license renewal',  'APPROVED'),
  ('EXP-103', 'EXP-2025-013', 'EMP-003', 'Travel & Accommodation',  18200, '2025-08-22', 'HR Summit conference in Mumbai',            'PENDING'),
  ('EXP-104', 'EXP-2025-014', 'EMP-004', 'Client Entertainment',    6800,  '2025-08-20', 'Business lunch with Stark Industries team', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Leave Requests
-- ------------------------------------
INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by) VALUES
  ('LR-101', 'EMP-001', 'lt-cl', '2025-08-25', '2025-08-26', 2.0, 'Family emergency & personal commitments', 'APPROVED', 'HR Admin'),
  ('LR-102', 'EMP-002', 'lt-sl', '2025-08-28', '2025-08-28', 1.0, 'Doctor appointment & medical checkup',     'APPROVED', 'HR Admin'),
  ('LR-103', 'EMP-003', 'lt-pl', '2025-09-01', '2025-09-05', 5.0, 'Annual planned vacation with family',      'PENDING',  NULL),
  ('LR-104', 'EMP-004', 'lt-cl', '2025-09-02', '2025-09-02', 1.0, 'Attending family function in hometown',    'PENDING',  NULL)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------
-- SEED: Payroll Runs
-- ------------------------------------
INSERT INTO payroll_runs (id, month, year, total_employees, total_gross, total_deductions, total_net, status, processed_by) VALUES
  ('PR-2025-08', 'August',    2025, 6, 480000.00, 48000.00, 432000.00, 'PAID',       'Finance Admin'),
  ('PR-2025-07', 'July',      2025, 6, 480000.00, 48000.00, 432000.00, 'PAID',       'Finance Admin'),
  ('PR-2025-06', 'June',      2025, 5, 400000.00, 40000.00, 360000.00, 'PAID',       'Finance Admin'),
  ('PR-2025-09', 'September', 2025, 6, 480000.00, 48000.00, 432000.00, 'PROCESSED',  'Finance Admin')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------
-- SEED: Job Openings & Candidates
-- ------------------------------------
INSERT INTO job_openings (id, title, department, location, headcount, hiring_manager, status) VALUES
  ('JOB-01', 'Senior Full Stack Engineer', 'Engineering', 'Bengaluru / Hybrid', 2, 'Emma Watson', 'Active'),
  ('JOB-02', 'Enterprise Sales Lead',       'Sales',       'Mumbai / Onsite',    1, 'Robert Vance','Active'),
  ('JOB-03', 'HR Generalist',              'HR',          'Bengaluru / Hybrid', 1, 'Emma Watson', 'Active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_candidates (id, name, email, phone, job_opening_id, job_title, stage, score, applied_date) VALUES
  ('CAN-101', 'Aarav Patel',    'aarav.patel@gmail.com',    '+91 98765 43210', 'JOB-01', 'Senior Full Stack Engineer', 'Interview',  92, '2025-08-15'),
  ('CAN-102', 'Priya Sharma',   'priya.sharma@yahoo.com',   '+91 98765 43211', 'JOB-01', 'Senior Full Stack Engineer', 'Offer Sent', 96, '2025-08-12'),
  ('CAN-103', 'Rohan Gupta',    'rohan.gupta@outlook.com',  '+91 98765 43212', 'JOB-02', 'Enterprise Sales Lead',       'Screening',  78, '2025-08-20'),
  ('CAN-104', 'Ananya Deshmukh','ananya.deshmukh@gmail.com','+91 98765 43213', 'JOB-03', 'HR Generalist',              'Sourced',    85, '2025-08-22')
ON CONFLICT (id) DO NOTHING;


