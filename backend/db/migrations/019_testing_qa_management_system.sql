-- ============================================================
-- MIGRATION 019: TESTING / QA MANAGEMENT SYSTEM
-- ============================================================

-- 1. Ensure modules table has adequate status length and columns
ALTER TABLE modules ALTER COLUMN status TYPE VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS module_id VARCHAR(50);

-- 2. Testing Requests / Module Testing Records
CREATE TABLE IF NOT EXISTS testing_requests (
    id VARCHAR(50) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    developer_employee_id VARCHAR(50) NOT NULL,
    developer_employee_name VARCHAR(100) NOT NULL,
    tester_employee_id VARCHAR(50),
    tester_employee_name VARCHAR(100),
    total_tasks INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    pending_tasks INT DEFAULT 0,
    completion_percentage NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'READY_FOR_TESTING',
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    testing_start_date TIMESTAMP WITH TIME ZONE,
    testing_end_date TIMESTAMP WITH TIME ZONE,
    last_tested_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_module_dev_request UNIQUE (module_id, developer_employee_id)
);

CREATE INDEX IF NOT EXISTS idx_testing_requests_mod ON testing_requests(module_id);
CREATE INDEX IF NOT EXISTS idx_testing_requests_dev ON testing_requests(developer_employee_id);
CREATE INDEX IF NOT EXISTS idx_testing_requests_tester ON testing_requests(tester_employee_id);
CREATE INDEX IF NOT EXISTS idx_testing_requests_status ON testing_requests(status);

-- 3. Test Cases Table
CREATE TABLE IF NOT EXISTS test_cases (
    id VARCHAR(50) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    testing_request_id VARCHAR(50) REFERENCES testing_requests(id) ON DELETE SET NULL,
    feature VARCHAR(150) NOT NULL,
    test_scenario TEXT NOT NULL,
    test_steps TEXT NOT NULL,
    test_data TEXT,
    expected_result TEXT NOT NULL,
    actual_result TEXT,
    status VARCHAR(50) DEFAULT 'NOT_EXECUTED',
    tester_id VARCHAR(50),
    tester_name VARCHAR(100),
    execution_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_cases_mod ON test_cases(module_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_req ON test_cases(testing_request_id);

-- 4. Bugs Table
CREATE TABLE IF NOT EXISTS bugs (
    id VARCHAR(50) PRIMARY KEY,
    bug_id VARCHAR(50) UNIQUE NOT NULL,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    testing_request_id VARCHAR(50) REFERENCES testing_requests(id) ON DELETE SET NULL,
    test_case_id VARCHAR(50) REFERENCES test_cases(id) ON DELETE SET NULL,
    feature VARCHAR(150),
    related_task_id VARCHAR(50) REFERENCES tasks(id) ON DELETE SET NULL,
    developer_employee_id VARCHAR(50) NOT NULL,
    developer_employee_name VARCHAR(100) NOT NULL,
    tester_employee_id VARCHAR(50) NOT NULL,
    tester_employee_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    expected_result TEXT,
    actual_result TEXT,
    severity VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    environment VARCHAR(100) DEFAULT 'Staging',
    browser VARCHAR(100) DEFAULT 'Chrome',
    device VARCHAR(100) DEFAULT 'Desktop',
    screenshot_url TEXT,
    video_url TEXT,
    attachment_url TEXT,
    status VARCHAR(50) DEFAULT 'OPEN',
    assigned_developer_id VARCHAR(50),
    assigned_developer_name VARCHAR(100),
    fixed_date TIMESTAMP WITH TIME ZONE,
    retest_date TIMESTAMP WITH TIME ZONE,
    closed_date TIMESTAMP WITH TIME ZONE,
    developer_notes TEXT,
    retest_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bugs_mod ON bugs(module_id);
CREATE INDEX IF NOT EXISTS idx_bugs_dev ON bugs(developer_employee_id);
CREATE INDEX IF NOT EXISTS idx_bugs_tester ON bugs(tester_employee_id);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_severity ON bugs(severity);
CREATE INDEX IF NOT EXISTS idx_bugs_priority ON bugs(priority);

-- 5. Bug Comments Table
CREATE TABLE IF NOT EXISTS bug_comments (
    id VARCHAR(50) PRIMARY KEY,
    bug_id VARCHAR(50) NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) DEFAULT 'Tester',
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bug_comments_bug ON bug_comments(bug_id);

-- 6. Bug Status History / Workflow Transitions Table
CREATE TABLE IF NOT EXISTS bug_status_history (
    id VARCHAR(50) PRIMARY KEY,
    bug_id VARCHAR(50) NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
    changed_by_id VARCHAR(50) NOT NULL,
    changed_by_name VARCHAR(100) NOT NULL,
    changed_by_role VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bug_status_history_bug ON bug_status_history(bug_id);

-- 7. Testing Reports Table
CREATE TABLE IF NOT EXISTS testing_reports (
    id VARCHAR(50) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    testing_request_id VARCHAR(50) REFERENCES testing_requests(id) ON DELETE SET NULL,
    developer_employee_id VARCHAR(50) NOT NULL,
    developer_employee_name VARCHAR(100) NOT NULL,
    tester_employee_id VARCHAR(50),
    tester_employee_name VARCHAR(100),
    testing_start_date TIMESTAMP WITH TIME ZONE,
    testing_end_date TIMESTAMP WITH TIME ZONE,
    total_test_cases INT DEFAULT 0,
    passed_test_cases INT DEFAULT 0,
    failed_test_cases INT DEFAULT 0,
    blocked_test_cases INT DEFAULT 0,
    total_bugs INT DEFAULT 0,
    critical_bugs INT DEFAULT 0,
    high_bugs INT DEFAULT 0,
    medium_bugs INT DEFAULT 0,
    low_bugs INT DEFAULT 0,
    open_bugs INT DEFAULT 0,
    fixed_bugs INT DEFAULT 0,
    retested_bugs INT DEFAULT 0,
    closed_bugs INT DEFAULT 0,
    final_testing_status VARCHAR(50) DEFAULT 'TESTING_IN_PROGRESS',
    summary_notes TEXT,
    generated_by_id VARCHAR(50),
    generated_by_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_testing_reports_mod ON testing_reports(module_id);

-- 8. Testing Audit Logs Table
CREATE TABLE IF NOT EXISTS testing_audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    module_id VARCHAR(50),
    module_name VARCHAR(100),
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    comment TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_audit_mod ON testing_audit_logs(module_id);
CREATE INDEX IF NOT EXISTS idx_qa_audit_created ON testing_audit_logs(created_at DESC);

-- 9. QA Notifications Table
CREATE TABLE IF NOT EXISTS qa_notifications (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    module_id VARCHAR(50),
    module_name VARCHAR(100),
    entity_id VARCHAR(50),
    recipient_id VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(100),
    recipient_role VARCHAR(50),
    title VARCHAR(255),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_notif_recipient ON qa_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_qa_notif_read ON qa_notifications(read);

-- 10. Seed Realistic QA Data linked to real employees & modules
DO $$
BEGIN
    -- Insert sample testing request for Attendance module if not exists
    INSERT INTO testing_requests (
        id, module_id, module_name, developer_employee_id, developer_employee_name,
        tester_employee_id, tester_employee_name, total_tasks, completed_tasks, pending_tasks,
        completion_percentage, status, submitted_date, testing_start_date
    ) VALUES (
        'TR-ATT-001', 'MOD-ATT', 'Attendance', 'EMP-005', 'Vishnu Vardhan',
        'EMP-004', 'Rahul Verma', 20, 15, 5,
        75.00, 'TESTING_IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day'
    ) ON CONFLICT (module_id, developer_employee_id) DO UPDATE SET
        total_tasks = EXCLUDED.total_tasks,
        completed_tasks = EXCLUDED.completed_tasks,
        completion_percentage = EXCLUDED.completion_percentage,
        status = EXCLUDED.status;

    -- Insert sample test cases for Attendance module
    INSERT INTO test_cases (
        id, module_id, module_name, testing_request_id, feature, test_scenario, test_steps, test_data, expected_result, actual_result, status, tester_id, tester_name, execution_date
    ) VALUES 
    (
        'TC-ATT-001', 'MOD-ATT', 'Attendance', 'TR-ATT-001', 'Employee Check-In',
        'Verify employee can check in with valid PIN',
        '1. Login as employee' || E'\n' || '2. Open Attendance module' || E'\n' || '3. Enter valid PIN (1234)' || E'\n' || '4. Click Check In button',
        'PIN: 1234, Emp: EMP-005',
        'Attendance should be marked successfully with accurate timestamp.',
        'Attendance marked successfully with timestamp.',
        'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        'TC-ATT-002', 'MOD-ATT', 'Attendance', 'TR-ATT-001', 'Biometric Kiosk Scanner',
        'Verify kiosk camera facial verification',
        '1. Access kiosk mode' || E'\n' || '2. Position face before camera' || E'\n' || '3. Verify live recognition match',
        'EmpCode: EMP-005',
        'Biometric check-in verified in under 1.5 seconds.',
        'Camera stream delayed on mobile browsers.',
        'FAILED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '12 hours'
    ),
    (
        'TC-ATT-003', 'MOD-ATT', 'Attendance', 'TR-ATT-001', 'Monthly Attendance Summary',
        'Verify monthly total days, present days, and overtime calculation',
        '1. Navigate to Attendance Reports' || E'\n' || '2. Select Month and Year' || E'\n' || '3. Verify calculated totals',
        'Month: September 2026',
        'Present days, absent days, and overtime hours displayed correctly.',
        'Calculations match HR payroll rules.',
        'PASSED', 'EMP-004', 'Rahul Verma', CURRENT_TIMESTAMP - INTERVAL '6 hours'
    ),
    (
        'TC-ATT-004', 'MOD-ATT', 'Attendance', 'TR-ATT-001', 'Geofencing Validation',
        'Verify check-in prevented outside office boundary',
        '1. Attempt check-in with GPS outside 200m radius' || E'\n' || '2. Inspect validation message',
        'Lat: 12.9716, Lng: 77.5946',
        'System blocks check-in with Geofence Out-of-Bounds warning.',
        'Awaiting GPS test harness mock.',
        'NOT_EXECUTED', 'EMP-004', 'Rahul Verma', NULL
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert sample bugs for Attendance module
    INSERT INTO bugs (
        id, bug_id, module_id, module_name, testing_request_id, test_case_id, feature,
        developer_employee_id, developer_employee_name, tester_employee_id, tester_employee_name,
        title, description, steps_to_reproduce, expected_result, actual_result,
        severity, priority, environment, browser, device, status, assigned_developer_id, assigned_developer_name
    ) VALUES (
        'BUG-ATT-101', 'BUG-101', 'MOD-ATT', 'Attendance', 'TR-ATT-001', 'TC-ATT-002', 'Biometric Kiosk Scanner',
        'EMP-005', 'Vishnu Vardhan', 'EMP-004', 'Rahul Verma',
        'Camera stream freezes on mobile safari during kiosk attendance',
        'When opening kiosk scanner on iOS Safari, video element stream stalls after 2 seconds preventing employee verification.',
        '1. Open /attendance/kiosk on iOS Safari' || E'\n' || '2. Grant camera permissions' || E'\n' || '3. Observe video feed freezes',
        'Video feed should render smooth 30fps frames continuously.',
        'Video feed stalls on frame 1.',
        'HIGH', 'HIGH', 'Staging', 'Safari Mobile', 'iPhone 15 Pro',
        'OPEN', 'EMP-005', 'Vishnu Vardhan'
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert audit log for seed
    INSERT INTO testing_audit_logs (
        id, entity_type, entity_id, module_id, module_name, user_id, user_name, user_role, action, old_status, new_status, comment
    ) VALUES (
        'LOG-INIT-001', 'MODULE', 'MOD-ATT', 'MOD-ATT', 'Attendance', 'EMP-005', 'Vishnu Vardhan', 'Developer',
        'Submitted module for testing (75% tasks completed)', 'IN_PROGRESS', 'READY_FOR_TESTING', 'Reached 15/20 tasks completed (75%)'
    ) ON CONFLICT (id) DO NOTHING;

END $$;
