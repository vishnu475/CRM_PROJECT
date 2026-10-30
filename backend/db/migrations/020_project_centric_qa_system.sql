-- ============================================================
-- MIGRATION 020: PROJECT-CENTRIC TESTING & QA SYSTEM
-- ============================================================

-- 1. Ensure project PRJ-001 (HRMS ERP) exists
INSERT INTO projects (
    id, name, code, client, status, project_manager, priority, progress, start_date, end_date
) VALUES (
    'PRJ-001', 'HRMS ERP', 'PRJ-001', 'Internal Enterprise', 'In Progress', 'Sarah Jenkins', 'High', 75,
    CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days'
) ON CONFLICT (id) DO UPDATE SET
    name = 'HRMS ERP',
    status = 'In Progress',
    priority = 'High';

-- 2. Link Project Groups & Members for PRJ-001
INSERT INTO project_groups (id, name, project_id, team_head_id, team_head_name, description)
VALUES ('GRP-PRJ001-CORE', 'Core ERP Engineering Team', 'PRJ-001', 'EMP-005', 'Vishnu Vardhan', 'Engineering module group for HRMS ERP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO group_members (id, group_id, employee_id, employee_name, role)
VALUES 
    ('GM-001', 'GRP-PRJ001-CORE', 'EMP-005', 'Vishnu Vardhan', 'Lead Backend Architect / Attendance Lead'),
    ('GM-002', 'GRP-PRJ001-CORE', 'EMP-004', 'Rahul Verma', 'Senior QA Engineer'),
    ('GM-003', 'GRP-PRJ001-CORE', 'EMP-008', 'Ramesh', 'Frontend Specialist / Recruitment Lead'),
    ('GM-004', 'GRP-PRJ001-CORE', 'EMP-003', 'Priya Sharma', 'Product Manager / Leave Lead')
ON CONFLICT (id) DO NOTHING;

-- 3. Enhance testing_requests table with project, testing_url, environment, version
ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);
ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS project_name VARCHAR(100);
ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS testing_url TEXT;
ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'Pre-Production';
ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_testing_requests_prj ON testing_requests(project_id);

-- 4. Enhance testing_reports table with project, pass_rate, verdict, status, scope, blockers
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS project_name VARCHAR(100);
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'Pre-Production';
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS total_executed INT DEFAULT 0;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS passed INT DEFAULT 0;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS failed INT DEFAULT 0;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS blocked INT DEFAULT 0;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS pass_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS final_verdict VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS report_status VARCHAR(50) DEFAULT 'DRAFT';
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS test_scope_coverage JSONB DEFAULT '[]'::jsonb;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS defects_and_failures JSONB DEFAULT '[]'::jsonb;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS blockers_notes TEXT;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS approved_by_id VARCHAR(50);
ALTER TABLE testing_reports ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_testing_reports_prj ON testing_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_testing_reports_status ON testing_reports(report_status);

-- 5. Create testing_documents table (Single Source of Truth for Project, Employee, Admin)
CREATE TABLE IF NOT EXISTS testing_documents (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_name VARCHAR(100) NOT NULL,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    developer_employee_id VARCHAR(50) NOT NULL,
    developer_employee_name VARCHAR(100) NOT NULL,
    tester_employee_id VARCHAR(50),
    tester_employee_name VARCHAR(100),
    testing_request_id VARCHAR(50),
    testing_report_id VARCHAR(50) NOT NULL REFERENCES testing_reports(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    environment VARCHAR(50) DEFAULT 'Pre-Production',
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, APPROVED, REOPENED
    final_verdict VARCHAR(20) DEFAULT 'PASSED',
    pass_rate NUMERIC(5,2) DEFAULT 0.00,
    created_by_id VARCHAR(50),
    created_by_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_testing_docs_prj ON testing_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_testing_docs_mod ON testing_documents(module_id);
CREATE INDEX IF NOT EXISTS idx_testing_docs_dev ON testing_documents(developer_employee_id);
CREATE INDEX IF NOT EXISTS idx_testing_docs_tester ON testing_documents(tester_employee_id);
CREATE INDEX IF NOT EXISTS idx_testing_docs_status ON testing_documents(status);

-- 6. Enhance bugs table with project details
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS project_name VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_bugs_prj ON bugs(project_id);

-- 7. Ensure test tasks for Attendance Module under PRJ-001 (15 completed, 5 in progress = 75%)
DELETE FROM tasks WHERE project_id = 'PRJ-001' AND module_id = 'MOD-ATT';

DO $$
BEGIN
    FOR i IN 1..20 LOOP
        INSERT INTO tasks (
            id, title, project_id, project_name, module_id, module_name,
            assigned_to, assigned_to_employee_id, assigned_to_name,
            status, progress_percent, priority, created_at
        ) VALUES (
            'TSK-ATT-' || LPAD(i::text, 3, '0'),
            CASE 
                WHEN i = 1 THEN 'Employee Check-In with biometric pin'
                WHEN i = 2 THEN 'Biometric Kiosk camera feed pipeline'
                WHEN i = 3 THEN 'Daily Attendance summary aggregation'
                WHEN i = 4 THEN 'Geofencing radius validation check'
                WHEN i = 5 THEN 'Employee Check-Out timestamp ledger'
                WHEN i = 6 THEN 'Break Time and pause logger'
                WHEN i = 7 THEN 'Overtime multiplier formula service'
                WHEN i = 8 THEN 'Leave status reconciliation sync'
                WHEN i = 9 THEN 'Shift rotation scheduler algorithm'
                WHEN i = 10 THEN 'Offline punch cache and batch sync'
                WHEN i = 11 THEN 'Facial recognition model inference integration'
                WHEN i = 12 THEN 'Attendance regularization workflow'
                WHEN i = 13 THEN 'Manager attendance override approval'
                WHEN i = 14 THEN 'Half-day auto-marking threshold'
                WHEN i = 15 THEN 'Monthly attendance export to CSV/PDF'
                WHEN i = 16 THEN 'Late arrival penalty rule engine'
                WHEN i = 17 THEN 'Early departure notification alert'
                WHEN i = 18 THEN 'Holiday calendar exclusion layer'
                WHEN i = 19 THEN 'Audit trail for punch manual adjustments'
                ELSE 'Real-time WebSocket presence broadcaster'
            END,
            'PRJ-001', 'HRMS ERP', 'MOD-ATT', 'Attendance',
            'EMP-005', 'EMP-005', 'Vishnu Vardhan',
            CASE WHEN i <= 15 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            CASE WHEN i <= 15 THEN 100 ELSE 45 END,
            'High',
            CURRENT_TIMESTAMP - (INTERVAL '1 day' * (25 - i))
        );
    END LOOP;
END $$;

-- 8. Seed/Update Acceptance Testing Request for Attendance
DELETE FROM bugs WHERE testing_request_id IN ('TR-ATT-001', 'TR-PRJ001-ATT') OR bug_id IN ('BUG-101', 'BUG-ATT-101');
DELETE FROM test_cases WHERE testing_request_id IN ('TR-ATT-001', 'TR-PRJ001-ATT');
DELETE FROM testing_reports WHERE testing_request_id IN ('TR-ATT-001', 'TR-PRJ001-ATT') OR module_id = 'MOD-ATT';
DELETE FROM testing_requests WHERE module_id = 'MOD-ATT' AND developer_employee_id = 'EMP-005';

INSERT INTO testing_requests (
    id, project_id, project_name, module_id, module_name,
    developer_employee_id, developer_employee_name,
    tester_employee_id, tester_employee_name,
    testing_url, environment, version,
    total_tasks, completed_tasks, pending_tasks, completion_percentage,
    status, submitted_date, testing_start_date, notes
) VALUES (
    'TR-PRJ001-ATT', 'PRJ-001', 'HRMS ERP', 'MOD-ATT', 'Attendance',
    'EMP-005', 'Vishnu Vardhan',
    'EMP-004', 'Rahul Verma',
    'https://hrms-test.example.com/attendance', 'Pre-Production', '1.0',
    20, 15, 5, 75.00,
    'READY_FOR_TESTING', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '12 hours',
    'Automatic quality gate trigger: 15/20 tasks completed (75%). Testing URL verified.'
);

-- 9. Seed 10 realistic Test Cases for Attendance under TR-PRJ001-ATT
DELETE FROM test_cases WHERE id IN ('TC-ATT-001', 'TC-ATT-002', 'TC-ATT-003', 'TC-ATT-004', 'TC-ATT-005', 'TC-ATT-006', 'TC-ATT-007', 'TC-ATT-008', 'TC-ATT-009', 'TC-ATT-010') OR testing_request_id = 'TR-PRJ001-ATT';

INSERT INTO test_cases (
    id, module_id, module_name, testing_request_id, feature, test_scenario, test_steps, test_data, expected_result, actual_result, status, tester_id, tester_name, execution_date
) VALUES 
('TC-ATT-001', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Employee Check-In',
 'Verify employee can check in with valid PIN',
 '1. Login as employee\n2. Open Attendance module\n3. Enter valid PIN (1234)\n4. Click Check In button',
 'PIN: 1234, Emp: EMP-005', 'Attendance should be marked successfully.', 'Attendance marked successfully with timestamp.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '4 hours'),

('TC-ATT-002', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Biometric Kiosk Scanner',
 'Verify kiosk camera live streaming on mobile Safari',
 '1. Access /attendance/kiosk on Safari\n2. Allow camera\n3. Observe preview feed stability',
 'Device: Mobile Safari iOS 17', 'Camera should continue streaming smoothly.', 'Camera stream freezes after 2 seconds.', 'FAILED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '3 hours'),

('TC-ATT-003', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Monthly Attendance Summary',
 'Verify aggregate monthly days count',
 '1. Open Attendance Summary\n2. Select Current Month\n3. Verify total working days calculation',
 'Month: Sept 2026', 'Total days, present, and absent match attendance records accurately.', 'Working days computed accurately.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '3 hours'),

('TC-ATT-004', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Geofencing Validation',
 'Verify geofencing prevents check-in outside 200m perimeter',
 '1. Mock GPS location 500m away\n2. Attempt check-in\n3. Inspect warning banner',
 'Radius: 500m', 'Check-in blocked with boundary warning.', 'Check-in blocked with out-of-perimeter alert.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '2 hours'),

('TC-ATT-005', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Employee Check-Out',
 'Verify check-out records exact logout timestamp',
 '1. Click Check-Out\n2. Verify ledger timestamp',
 'EmpCode: EMP-005', 'Check-out timestamp saved.', 'Check-out saved accurately.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '2 hours'),

('TC-ATT-006', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Break Time Tracking',
 'Verify meal break tracking and pauses',
 '1. Start break\n2. Resume work after 30 mins\n3. Verify effective hours computed',
 'Break: 30 mins', 'Break recorded and subtracted from effective work hours.', 'Effective work hours computed correctly.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '1 hour'),

('TC-ATT-007', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Overtime Calculation',
 'Verify overtime multiplier after standard 8 hours',
 '1. Simulate 10-hour shift\n2. Check calculated overtime',
 'Hours: 10 hrs', 'Overtime marked as 2.0 hours with 1.5x pay multiplier.', 'Overtime calculated correctly.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '1 hour'),

('TC-ATT-008', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Leave Integration Sync',
 'Verify approved leaves display on attendance calendar',
 '1. Check date with approved medical leave\n2. Confirm status',
 'Leave: Casual Leave', 'Day marked as On Leave (Approved).', 'Status synced from Leave module.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),

('TC-ATT-009', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Night Shift Transition',
 'Verify midnight crossing shift attribution',
 '1. Clock in at 22:00\n2. Clock out at 06:00 next day\n3. Verify single shift calculation',
 'Shift: Night Owl', 'Single continuous shift attached to clock-in date.', 'Pending test environment schedule configuration.', 'BLOCKED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),

('TC-ATT-010', 'MOD-ATT', 'Attendance', 'TR-PRJ001-ATT', 'Offline Sync Support',
 'Verify punches stored in IndexedDB sync upon reconnection',
 '1. Go offline\n2. Record punch\n3. Reconnect network\n4. Verify backend receipt',
 'Offline: 5 mins', 'Queued punches flush to server within 5 seconds.', 'All punches synced upon network restore.', 'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '15 minutes');

-- 10. Seed BUG-101 for TC-ATT-002
DELETE FROM bugs WHERE bug_id IN ('BUG-101', 'BUG-ATT-101') OR id = 'BUG-ATT-101';

INSERT INTO bugs (
    id, bug_id, project_id, project_name, module_id, module_name,
    testing_request_id, test_case_id, feature,
    developer_employee_id, developer_employee_name,
    tester_employee_id, tester_employee_name,
    title, description, steps_to_reproduce, expected_result, actual_result,
    severity, priority, environment, browser, device, status,
    assigned_developer_id, assigned_developer_name
) VALUES (
    'BUG-ATT-101', 'BUG-101', 'PRJ-001', 'HRMS ERP', 'MOD-ATT', 'Attendance',
    'TR-PRJ001-ATT', 'TC-ATT-002', 'Biometric Kiosk Scanner',
    'EMP-005', 'Vishnu Vardhan',
    'EMP-004', 'Rahul Verma',
    'Camera stream freezes on mobile Safari',
    'When opening biometric kiosk scanner on iOS mobile Safari, the camera stream stalls and freezes after 2 seconds preventing employee verification.',
    '1. Open /attendance/kiosk on mobile Safari (iOS 17)\n2. Grant camera permissions\n3. Position face before lens\n4. Observe video stream freezes after ~2 seconds',
    'Camera should continue streaming smooth 30fps frames continuously without stalling.',
    'Camera stream freezes on frame 1 after 2 seconds; check-in aborts.',
    'HIGH', 'HIGH', 'Pre-Production', 'Mobile Safari 17', 'iPhone 15 Pro',
    'OPEN', 'EMP-005', 'Vishnu Vardhan'
);
