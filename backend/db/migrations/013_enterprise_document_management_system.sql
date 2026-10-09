-- ============================================================
-- Migration 013: Enterprise Document Management System (DMS)
-- ============================================================

-- 1. DOCUMENT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS document_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    scope VARCHAR(30) DEFAULT 'both', -- 'company', 'employee', 'both'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DOCUMENT TYPES TABLE
CREATE TABLE IF NOT EXISTS document_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category_id VARCHAR(50) REFERENCES document_categories(id) ON DELETE SET NULL,
    scope VARCHAR(30) DEFAULT 'both', -- 'company', 'employee', 'both'
    approval_required BOOLEAN DEFAULT FALSE,
    expiry_supported BOOLEAN DEFAULT FALSE,
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx'],
    max_file_size_mb INTEGER DEFAULT 25,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CORE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    file_size BIGINT DEFAULT 0,
    storage_path TEXT NOT NULL,
    document_type_id VARCHAR(50) REFERENCES document_types(id) ON DELETE SET NULL,
    category_id VARCHAR(50) REFERENCES document_categories(id) ON DELETE SET NULL,
    department VARCHAR(100),
    owner_id VARCHAR(50), -- Employee Code (e.g. EMP-004) or Department Name
    uploaded_by VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'APPROVED', -- 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED', 'TRASHED'
    visibility VARCHAR(30) DEFAULT 'company', -- 'private', 'department', 'company', 'public'
    expiry_date DATE,
    current_version VARCHAR(20) DEFAULT 'v1.0',
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_dept ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_documents_cat ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at);

-- 4. DOCUMENT VERSIONS TABLE
CREATE TABLE IF NOT EXISTS document_versions (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(50) NOT NULL,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_doc_id ON document_versions(document_id);

-- 5. DOCUMENT APPROVALS TABLE
CREATE TABLE IF NOT EXISTS document_approvals (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(50),
    reviewer_name VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    comments TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_approvals_doc_id ON document_approvals(document_id);

-- 6. DOCUMENT SHARES TABLE
CREATE TABLE IF NOT EXISTS document_shares (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    shared_by VARCHAR(50) NOT NULL,
    share_target_type VARCHAR(30) NOT NULL, -- 'user', 'role', 'department'
    share_target_id VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_shares_doc_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_shares_target ON document_shares(share_target_type, share_target_id);

-- 7. DOCUMENT PERMISSIONS (EXPLICIT OVERRIDES) TABLE
CREATE TABLE IF NOT EXISTS document_permissions (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    role_id VARCHAR(50),
    user_id VARCHAR(50),
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. DOCUMENT AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50),
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- 'UPLOAD', 'VIEW', 'DOWNLOAD', 'EDIT', 'VERSION_CREATED', 'SHARED', 'UNSHARED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED', 'RESTORED', 'DELETED', 'PERMISSION_CHANGED'
    description TEXT NOT NULL,
    ip_address VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_audit_doc_id ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_audit_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_doc_audit_created ON document_audit_logs(created_at DESC);

-- ============================================================
-- SEED INITIAL CATEGORIES & DOCUMENT TYPES
-- ============================================================

INSERT INTO document_categories (id, name, code, description, scope, is_active)
VALUES
    ('CAT-FIN', 'Finance & Accounts', 'FINANCE', 'Corporate financial reports, audits, and fiscal statements', 'company', TRUE),
    ('CAT-LEG', 'Legal & Contracts', 'LEGAL', 'Corporate legal contracts, non-disclosures, and master service agreements', 'company', TRUE),
    ('CAT-HR',  'Human Resources', 'HR', 'HR organizational guidelines, benefits schemes, and policies', 'both', TRUE),
    ('CAT-PRC', 'Procurement & Purchases', 'PROCUREMENT', 'Vendor agreements, purchase contracts, and procurement bills', 'company', TRUE),
    ('CAT-PRJ', 'Projects & Operations', 'PROJECTS', 'Client project specifications, architecture documents, and deliverables', 'company', TRUE),
    ('CAT-CMP', 'Compliance & Statutory', 'COMPLIANCE', 'Statutory compliance filings, certifications, and licenses', 'company', TRUE),
    ('CAT-POL', 'Company Policies', 'POLICIES', 'General company guidelines, code of conduct, and workplace policies', 'company', TRUE),
    ('CAT-ID',  'Identity Proof', 'IDENTITY', 'Government-issued identity cards (PAN, Aadhaar, Passport, Driving License)', 'employee', TRUE),
    ('CAT-ADDR','Address Proof', 'ADDRESS', 'Residential address proof (Utility bills, Rental agreement, Passport)', 'employee', TRUE),
    ('CAT-EDU', 'Education Certificates', 'EDUCATION', 'Degree, Diploma, Transcripts, and Graduation certificates', 'employee', TRUE),
    ('CAT-EXP', 'Experience & Relieving', 'EXPERIENCE', 'Previous employment experience letters, relieving letters, and payslips', 'employee', TRUE),
    ('CAT-BNK', 'Bank Documents', 'BANK', 'Cancelled cheque, bank passbook copy, or statement for payroll processing', 'employee', TRUE),
    ('CAT-CTR', 'Employment Contract', 'CONTRACT', 'Signed offer letter, employment agreements, and confidentiality agreements', 'employee', TRUE),
    ('CAT-OTH', 'Other Documents', 'OTHER', 'Miscellaneous official records, certificates, and publications', 'both', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO document_types (id, name, code, description, category_id, scope, approval_required, expiry_supported, allowed_file_types, max_file_size_mb, is_active)
VALUES
    ('TYPE-FIN-RPT', 'Financial Audit Report', 'FIN_REPORT', 'Quarterly / Annual external or internal audit reports', 'CAT-FIN', 'company', FALSE, FALSE, ARRAY['pdf', 'xlsx'], 30, TRUE),
    ('TYPE-VND-AGR', 'Vendor Service Agreement', 'VENDOR_AGR', 'Service agreements entered into with authorized vendors', 'CAT-PRC', 'company', TRUE, TRUE, ARRAY['pdf', 'docx'], 25, TRUE),
    ('TYPE-CMP-POL', 'Corporate Policy Manual', 'CORP_POLICY', 'Official enterprise policies and handbook documents', 'CAT-POL', 'company', FALSE, FALSE, ARRAY['pdf'], 20, TRUE),
    ('TYPE-PRJ-SPEC', 'Project Technical Specification', 'PRJ_SPEC', 'Software or operational requirements and architecture documentation', 'CAT-PRJ', 'company', FALSE, FALSE, ARRAY['pdf', 'docx'], 40, TRUE),
    ('TYPE-EMP-ID',   'Government Identity Proof', 'EMP_ID_PROOF', 'National identity proof (PAN card, Aadhaar, Passport)', 'CAT-ID', 'employee', TRUE, TRUE, ARRAY['pdf', 'png', 'jpg', 'jpeg'], 10, TRUE),
    ('TYPE-EMP-ADDR', 'Address Verification Document', 'EMP_ADDR_PROOF', 'Current residential address verification document', 'CAT-ADDR', 'employee', TRUE, FALSE, ARRAY['pdf', 'png', 'jpg', 'jpeg'], 10, TRUE),
    ('TYPE-EMP-EDU',  'Education Degree / Certificate', 'EMP_DEGREE', 'Graduation / Post-Graduation degree certificate', 'CAT-EDU', 'employee', TRUE, FALSE, ARRAY['pdf', 'png', 'jpg'], 15, TRUE),
    ('TYPE-EMP-EXP',  'Prior Experience Certificate', 'EMP_EXP_CERT', 'Experience or relieving letter from past employers', 'CAT-EXP', 'employee', TRUE, FALSE, ARRAY['pdf', 'png', 'jpg'], 15, TRUE),
    ('TYPE-EMP-BNK',  'Cancelled Cheque / Bank Statement', 'EMP_BANK_DOC', 'Banking verification document for payroll bank account setup', 'CAT-BNK', 'employee', TRUE, FALSE, ARRAY['pdf', 'png', 'jpg'], 10, TRUE),
    ('TYPE-EMP-CTR',  'Signed Employment Contract', 'EMP_CONTRACT', 'Signed corporate employment terms and conditions', 'CAT-CTR', 'employee', TRUE, TRUE, ARRAY['pdf'], 20, TRUE),
    ('TYPE-CMP-LIC',  'Compliance Certificate / License', 'COMP_LICENSE', 'Government / ISO regulatory compliance certificate', 'CAT-CMP', 'company', TRUE, TRUE, ARRAY['pdf'], 25, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED INITIAL CORPORATE & EMPLOYEE ENTERPRISE DOCUMENTS
-- ============================================================

INSERT INTO documents (
    id, document_name, original_file_name, file_type, mime_type, file_size, storage_path,
    document_type_id, category_id, department, owner_id, uploaded_by, description,
    status, visibility, expiry_date, current_version, tags, created_at, updated_at
)
VALUES
    (
        'DOC-2026-001',
        'Q2 Financial Audit & Fiscal Review.pdf',
        'Q2_Financial_Audit_Report.pdf',
        'pdf',
        'application/pdf',
        4404019,
        'uploads/documents/DOC-2026-001_Q2_Financial_Audit_Report.pdf',
        'TYPE-FIN-RPT',
        'CAT-FIN',
        'Finance & Accounts',
        'Finance & Accounts',
        'EMP-001',
        'Comprehensive Q2 statutory financial audit report conducted by external auditors.',
        'APPROVED',
        'department',
        '2027-03-31',
        'v1.0',
        '["Audit", "Finance", "Q2", "Statutory"]'::jsonb,
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '12 days'
    ),
    (
        'DOC-2026-002',
        'Master Cloud Vendor Service Agreement.pdf',
        'Master_Vendor_Service_Agreement_AWS.pdf',
        'pdf',
        'application/pdf',
        1887436,
        'uploads/documents/DOC-2026-002_Master_Vendor_Service_Agreement_AWS.pdf',
        'TYPE-VND-AGR',
        'CAT-PRC',
        'Engineering',
        'Engineering',
        'EMP-001',
        'Multi-year cloud infrastructure enterprise terms and service level agreements.',
        'APPROVED',
        'company',
        CURRENT_DATE + INTERVAL '18 days', -- Expiring soon!
        'v1.1',
        '["Vendor", "Cloud", "Contract", "AWS"]'::jsonb,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '5 days'
    ),
    (
        'DOC-2026-003',
        'Enterprise Code of Conduct & Information Security Policy.pdf',
        'Enterprise_Code_Of_Conduct_2026.pdf',
        'pdf',
        'application/pdf',
        2359296,
        'uploads/documents/DOC-2026-003_Enterprise_Code_Of_Conduct_2026.pdf',
        'TYPE-CMP-POL',
        'CAT-POL',
        'Human Resources',
        'Human Resources',
        'EMP-003',
        'Company wide acceptable usage policy, cybersecurity protocol, and code of conduct.',
        'APPROVED',
        'public',
        '2028-12-31',
        'v2.0',
        '["Policy", "Security", "Compliance", "Handbook"]'::jsonb,
        NOW() - INTERVAL '60 days',
        NOW() - INTERVAL '20 days'
    ),
    (
        'DOC-2026-004',
        'B.Tech Degree Certificate - Rahul Verma.pdf',
        'Rahul_Verma_BTech_Degree.pdf',
        'pdf',
        'application/pdf',
        1258291,
        'uploads/documents/DOC-2026-004_Rahul_Verma_BTech_Degree.pdf',
        'TYPE-EMP-EDU',
        'CAT-EDU',
        'Engineering',
        'EMP-004',
        'EMP-004',
        'Computer Science & Engineering graduation degree certificate submitted for verification.',
        'APPROVED',
        'private',
        NULL,
        'v1.0',
        '["Education", "Degree", "Rahul Verma"]'::jsonb,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '10 days'
    ),
    (
        'DOC-2026-005',
        'Government Identity (Aadhaar & PAN) - Rahul Verma.pdf',
        'Rahul_Verma_National_ID.pdf',
        'pdf',
        'application/pdf',
        983040,
        'uploads/documents/DOC-2026-005_Rahul_Verma_National_ID.pdf',
        'TYPE-EMP-ID',
        'CAT-ID',
        'Engineering',
        'EMP-004',
        'EMP-004',
        'Identity proof for statutory verification and EPFO registration.',
        'PENDING_REVIEW',
        'private',
        '2032-05-10',
        'v1.0',
        '["Identity", "PAN", "Aadhaar", "Statutory"]'::jsonb,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        'DOC-2026-006',
        'Relieving & Experience Certificate - Michael Vance.pdf',
        'Michael_Vance_Relieving_Letter.pdf',
        'pdf',
        'application/pdf',
        1468006,
        'uploads/documents/DOC-2026-006_Michael_Vance_Relieving_Letter.pdf',
        'TYPE-EMP-EXP',
        'CAT-EXP',
        'Sales',
        'EMP-002',
        'EMP-002',
        'Previous company relieving letter and certificate of employment.',
        'APPROVED',
        'private',
        NULL,
        'v1.0',
        '["Experience", "Sales", "Michael Vance"]'::jsonb,
        NOW() - INTERVAL '40 days',
        NOW() - INTERVAL '35 days'
    ),
    (
        'DOC-2026-007',
        'ISO 27001 Security Compliance Certificate.pdf',
        'ISO_27001_Information_Security_Certificate.pdf',
        'pdf',
        'application/pdf',
        3145728,
        'uploads/documents/DOC-2026-007_ISO_27001_Information_Security_Certificate.pdf',
        'TYPE-CMP-LIC',
        'CAT-CMP',
        'Engineering',
        'Engineering',
        'EMP-001',
        'Annual ISO 27001 compliance audit certificate.',
        'APPROVED',
        'company',
        CURRENT_DATE + INTERVAL '5 days', -- Expiring very soon!
        'v1.0',
        '["ISO", "Security", "Certificate", "Compliance"]'::jsonb,
        NOW() - INTERVAL '90 days',
        NOW() - INTERVAL '90 days'
    ),
    (
        'DOC-2026-008',
        'Cancelled Cheque - Ramesh.pdf',
        'Ramesh_Bank_Cancelled_Cheque.pdf',
        'pdf',
        'application/pdf',
        786432,
        'uploads/documents/DOC-2026-008_Ramesh_Bank_Cancelled_Cheque.pdf',
        'TYPE-EMP-BNK',
        'CAT-BNK',
        'Engineering',
        'EMP-008',
        'EMP-008',
        'Bank account verification proof for salary credit.',
        'REJECTED',
        'private',
        NULL,
        'v1.0',
        '["Bank", "Cheque", "Ramesh"]'::jsonb,
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- Seed version records for initial documents
INSERT INTO document_versions (id, document_id, version_number, file_name, storage_path, file_size, mime_type, uploaded_by, change_description, created_at)
VALUES
    ('VER-001-1', 'DOC-2026-001', 'v1.0', 'Q2_Financial_Audit_Report.pdf', 'uploads/documents/DOC-2026-001_Q2_Financial_Audit_Report.pdf', 4404019, 'application/pdf', 'EMP-001', 'Initial Q2 audit submission from external auditor', NOW() - INTERVAL '12 days'),
    ('VER-002-1', 'DOC-2026-002', 'v1.0', 'Master_Vendor_Service_Agreement_AWS_Draft.pdf', 'uploads/documents/DOC-2026-002_v1.pdf', 1800000, 'application/pdf', 'EMP-001', 'Draft contract terms', NOW() - INTERVAL '30 days'),
    ('VER-002-2', 'DOC-2026-002', 'v1.1', 'Master_Vendor_Service_Agreement_AWS.pdf', 'uploads/documents/DOC-2026-002_Master_Vendor_Service_Agreement_AWS.pdf', 1887436, 'application/pdf', 'EMP-001', 'Final negotiated terms with extended SLA', NOW() - INTERVAL '5 days'),
    ('VER-003-1', 'DOC-2026-003', 'v1.0', 'Enterprise_Code_Of_Conduct_2025.pdf', 'uploads/documents/DOC-2026-003_v1.pdf', 2100000, 'application/pdf', 'EMP-003', 'Initial 2025 guidelines release', NOW() - INTERVAL '60 days'),
    ('VER-003-2', 'DOC-2026-003', 'v2.0', 'Enterprise_Code_Of_Conduct_2026.pdf', 'uploads/documents/DOC-2026-003_Enterprise_Code_Of_Conduct_2026.pdf', 2359296, 'application/pdf', 'EMP-003', '2026 Revised cybersecurity compliance additions', NOW() - INTERVAL '20 days'),
    ('VER-004-1', 'DOC-2026-004', 'v1.0', 'Rahul_Verma_BTech_Degree.pdf', 'uploads/documents/DOC-2026-004_Rahul_Verma_BTech_Degree.pdf', 1258291, 'application/pdf', 'EMP-004', 'Degree copy uploaded during onboarding', NOW() - INTERVAL '15 days'),
    ('VER-005-1', 'DOC-2026-005', 'v1.0', 'Rahul_Verma_National_ID.pdf', 'uploads/documents/DOC-2026-005_Rahul_Verma_National_ID.pdf', 983040, 'application/pdf', 'EMP-004', 'PAN card and Aadhaar card scan uploaded', NOW() - INTERVAL '2 days'),
    ('VER-006-1', 'DOC-2026-006', 'v1.0', 'Michael_Vance_Relieving_Letter.pdf', 'uploads/documents/DOC-2026-006_Michael_Vance_Relieving_Letter.pdf', 1468006, 'application/pdf', 'EMP-002', 'Prior company relieving letter', NOW() - INTERVAL '40 days'),
    ('VER-007-1', 'DOC-2026-007', 'v1.0', 'ISO_27001_Information_Security_Certificate.pdf', 'uploads/documents/DOC-2026-007_ISO_27001_Information_Security_Certificate.pdf', 3145728, 'application/pdf', 'EMP-001', 'ISO audit certification 2025-2026', NOW() - INTERVAL '90 days'),
    ('VER-008-1', 'DOC-2026-008', 'v1.0', 'Ramesh_Bank_Cancelled_Cheque.pdf', 'uploads/documents/DOC-2026-008_Ramesh_Bank_Cancelled_Cheque.pdf', 786432, 'application/pdf', 'EMP-008', 'Bank cheque scan uploaded', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Seed approval records
INSERT INTO document_approvals (id, document_id, reviewer_id, reviewer_name, status, comments, reviewed_at)
VALUES
    ('APP-004', 'DOC-2026-004', 'EMP-003', 'Priya Sharma', 'APPROVED', 'Verified with university credentials database. Approved.', NOW() - INTERVAL '10 days'),
    ('APP-005', 'DOC-2026-005', NULL, NULL, 'PENDING', NULL, NULL),
    ('APP-008', 'DOC-2026-008', 'EMP-003', 'Priya Sharma', 'REJECTED', 'The IFSC code and account number are blurred. Please re-upload a clear high-resolution scanned copy.', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Seed audit logs
INSERT INTO document_audit_logs (id, document_id, user_id, user_name, action, description, ip_address, created_at)
VALUES
    ('LOG-001', 'DOC-2026-001', 'EMP-001', 'Sarah Jenkins', 'UPLOAD', 'Uploaded Q2 Financial Audit & Fiscal Review.pdf', '127.0.0.1', NOW() - INTERVAL '12 days'),
    ('LOG-002', 'DOC-2026-002', 'EMP-001', 'Sarah Jenkins', 'VERSION_CREATED', 'Created new version v1.1 for Master Cloud Vendor Service Agreement.pdf', '127.0.0.1', NOW() - INTERVAL '5 days'),
    ('LOG-003', 'DOC-2026-004', 'EMP-004', 'Rahul Verma', 'SUBMITTED', 'Submitted B.Tech Degree Certificate for verification', '127.0.0.1', NOW() - INTERVAL '15 days'),
    ('LOG-004', 'DOC-2026-004', 'EMP-003', 'Priya Sharma', 'APPROVED', 'Verified and approved B.Tech Degree Certificate', '127.0.0.1', NOW() - INTERVAL '10 days'),
    ('LOG-005', 'DOC-2026-005', 'EMP-004', 'Rahul Verma', 'SUBMITTED', 'Submitted Government Identity (Aadhaar & PAN) for verification', '127.0.0.1', NOW() - INTERVAL '2 days'),
    ('LOG-006', 'DOC-2026-008', 'EMP-008', 'Ramesh', 'SUBMITTED', 'Submitted Cancelled Cheque for payroll bank verification', '127.0.0.1', NOW() - INTERVAL '4 days'),
    ('LOG-007', 'DOC-2026-008', 'EMP-003', 'Priya Sharma', 'REJECTED', 'Rejected Cancelled Cheque: The IFSC code and account number are blurred.', '127.0.0.1', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
