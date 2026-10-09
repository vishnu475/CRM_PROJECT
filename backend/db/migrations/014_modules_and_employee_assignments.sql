-- ====================================================
-- MIGRATION 014: SYSTEM MODULES & EMPLOYEE MODULE ASSIGNMENTS
-- ====================================================

-- 1. Master Modules Table
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Core',
    status VARCHAR(20) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for instant searchable module queries
CREATE INDEX IF NOT EXISTS idx_modules_search ON modules (LOWER(name), LOWER(code));
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules (status);

-- 2. Employee Assigned Modules Relationship Table
CREATE TABLE IF NOT EXISTS employee_assigned_modules (
    id VARCHAR(60) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    team_id VARCHAR(100),
    role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_module UNIQUE (employee_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_emp_modules_emp_id ON employee_assigned_modules (employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_modules_team_id ON employee_assigned_modules (team_id);
CREATE INDEX IF NOT EXISTS idx_emp_modules_mod_id ON employee_assigned_modules (module_id);

-- 3. Seed Master Modules Data (Single Source of Truth)
INSERT INTO modules (id, code, name, category, status, description) VALUES
    ('MOD-HRMS', 'hrms', 'HRMS', 'Human Resources', 'active', 'Core Human Resource Management System'),
    ('MOD-ATT', 'attendance', 'Attendance', 'Human Resources', 'active', 'Biometric & Live Attendance Tracking'),
    ('MOD-LEV', 'leave', 'Leave', 'Human Resources', 'active', 'Leave Management & Approvals Engine'),
    ('MOD-PAY', 'payroll', 'Payroll', 'Human Resources', 'active', 'Salary Structures, Payslips & Processing'),
    ('MOD-REC', 'recruitment', 'Recruitment', 'Human Resources', 'active', 'Job Postings, ATS & Candidate Pipeline'),
    ('MOD-DOC', 'documents', 'Documents', 'Governance', 'active', 'Enterprise Document Management System'),
    ('MOD-TSK', 'tasks', 'Tasks', 'Project Delivery', 'active', 'Task Management, Progress & Deliverables'),
    ('MOD-PRJ', 'projects', 'Projects', 'Project Delivery', 'active', 'Project Lifecycle & Milestones'),
    ('MOD-CRM', 'crm', 'CRM', 'Sales & Customers', 'active', 'Customer Relationship Management Engine'),
    ('MOD-CUST', 'customers', 'Customers', 'Sales & Customers', 'active', 'Client Master Directory & Accounts'),
    ('MOD-LEAD', 'leads', 'Leads', 'Sales & Customers', 'active', 'Lead Capture & Pipeline Management'),
    ('MOD-OPP', 'opportunities', 'Opportunities', 'Sales & Customers', 'active', 'Deal Pipeline & Opportunity Tracking'),
    ('MOD-SALES', 'sales_orders', 'Sales Orders', 'Sales & Customers', 'active', 'Sales Order Workflow & Invoicing'),
    ('MOD-QUOT', 'quotations', 'Quotations', 'Sales & Customers', 'active', 'Price Quotations & Proposals'),
    ('MOD-INV', 'inventory', 'Inventory', 'Procurement', 'active', 'Stock Levels & Warehouse Management'),
    ('MOD-PUR', 'purchases', 'Purchases', 'Procurement', 'active', 'Purchase Orders & Procurement'),
    ('MOD-VEND', 'vendors', 'Vendors', 'Procurement', 'active', 'Supplier Directory & Payments'),
    ('MOD-ACC', 'accounts', 'Accounts', 'Finance', 'active', 'Chart of Accounts & Invoicing'),
    ('MOD-LEDG', 'ledger', 'Ledger', 'Finance', 'active', 'General Ledger & Journal Entries'),
    ('MOD-BNK', 'banking', 'Banking', 'Finance', 'active', 'Bank Accounts & Reconciliation'),
    ('MOD-EXP', 'expenses', 'Expenses', 'Finance', 'active', 'Expense Claims & Reimbursements'),
    ('MOD-REP', 'reports', 'Reports', 'Analytics', 'active', 'Enterprise Reports & BI Analytics'),
    ('MOD-SET', 'settings', 'Settings', 'Governance', 'active', 'System Configurations & Sequences'),
    ('MOD-ADM', 'administration', 'Administration', 'Governance', 'active', 'Admin Control Center & Security')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    description = EXCLUDED.description;
