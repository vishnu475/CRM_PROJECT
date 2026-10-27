-- ============================================================
-- MIGRATION 021: ATTENDANCE & TEST REPORTS WORKFLOW SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS test_reports (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    tester_id VARCHAR(50) NOT NULL,
    tester_name VARCHAR(100),
    manager_id VARCHAR(50),
    manager_name VARCHAR(100),
    project_id VARCHAR(50) NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    task_id VARCHAR(50),
    template_id VARCHAR(50) DEFAULT 'TEMPLATE-STR-001',
    title VARCHAR(255) DEFAULT 'Software Test Report (1)',
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REOPENED'
    test_date VARCHAR(50),
    environment VARCHAR(50) DEFAULT 'Pre-Production',
    version VARCHAR(20) DEFAULT '1.0',
    total_executed INT DEFAULT 0,
    passed INT DEFAULT 0,
    failed INT DEFAULT 0,
    blocked INT DEFAULT 0,
    pass_rate NUMERIC(5,2) DEFAULT 0.00,
    final_verdict VARCHAR(20) DEFAULT 'PENDING',
    draft_data JSONB DEFAULT '{}'::jsonb,
    test_scope_coverage JSONB DEFAULT '[]'::jsonb,
    defects_and_failures JSONB DEFAULT '[]'::jsonb,
    blockers_notes TEXT,
    prepared_by VARCHAR(100),
    team_lead VARCHAR(100) DEFAULT 'Sarah Jenkins',
    project_lead VARCHAR(100) DEFAULT 'Sarah Jenkins',
    reporting_manager VARCHAR(100) DEFAULT 'Sarah Jenkins',
    final_pdf_path TEXT,
    submitted_by VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by_id VARCHAR(50),
    approved_by_name VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_reports_emp ON test_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_tester ON test_reports(tester_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_manager ON test_reports(manager_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_project ON test_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_status ON test_reports(status);

-- Seed initial default draft for Attendance module under tester Rahul Verma (EMP-004)
INSERT INTO test_reports (
    id, employee_id, tester_id, tester_name, manager_id, manager_name,
    project_id, project_name, task_id, template_id, title,
    status, test_date, environment, version,
    total_executed, passed, failed, blocked, pass_rate, final_verdict,
    draft_data, test_scope_coverage, defects_and_failures,
    blockers_notes, prepared_by, team_lead, project_lead, reporting_manager
) VALUES (
    'REP-ATT-001', 'EMP-005', 'EMP-004', 'Rahul Verma', 'EMP-001', 'Sarah Jenkins',
    'PRJ-001', 'Attendance', 'TSK-ATT-001', 'TEMPLATE-STR-001', 'Software Test Report (1)',
    'DRAFT', '25/09/2026', 'Pre-Production', '1.0',
    10, 9, 1, 0, 90.00, 'PASSED',
    '{"notes": "Initial draft prepared for Attendance testing verification."}'::jsonb,
    '[
        {"id": "TC-ATT-001", "title": "Employee Check-In with valid PIN", "scenario": "1. Open Kiosk\n2. Enter PIN 1234\n3. Click Check-in", "expectedResult": "Attendance checked in successfully", "actualResult": "Attendance recorded instantly with timestamp", "status": "PASSED"},
        {"id": "TC-ATT-002", "title": "Biometric Kiosk mobile camera feed", "scenario": "1. Open Safari on mobile\n2. Stream video", "expectedResult": "Live camera preview streaming smoothly", "actualResult": "Camera feed freezes after 2 seconds on Safari", "status": "FAILED"},
        {"id": "TC-ATT-003", "title": "Daily attendance calculation & status badge", "scenario": "1. View Daily Logs\n2. Validate Present/Late/Absent", "expectedResult": "Badges and late minutes calculated properly", "actualResult": "Late In (+15m) calculated accurately", "status": "PASSED"},
        {"id": "TC-ATT-004", "title": "Overtime threshold calculator (>9 hrs)", "scenario": "1. Work 10.5 hrs\n2. Check OT ledger", "expectedResult": "1.5 hrs Overtime credited", "actualResult": "+1.5 hrs marked in OT column", "status": "PASSED"},
        {"id": "TC-ATT-005", "title": "Missed punch regularization submission", "scenario": "1. Click Regularization\n2. Submit request", "expectedResult": "Request appears on Manager Desk", "actualResult": "Manager Desk shows 1 pending request", "status": "PASSED"},
        {"id": "TC-ATT-006", "title": "Late arrival grace period enforcement", "scenario": "1. Punch in at 09:14 AM\n2. Check badge", "expectedResult": "Within 15m grace = On Time", "actualResult": "On Time marked without deduction", "status": "PASSED"},
        {"id": "TC-ATT-007", "title": "Monthly attendance calendar matrix view", "scenario": "1. Switch to Calendar Tab\n2. View month grid", "expectedResult": "Green/Amber/Red indicators per day", "actualResult": "All dates render correct shift indicators", "status": "PASSED"},
        {"id": "TC-ATT-008", "title": "Export attendance summary to CSV/PDF", "scenario": "1. Click Export\n2. Validate downloaded file", "expectedResult": "Formatted CSV with daily records", "actualResult": "File generated matching DB snapshot", "status": "PASSED"},
        {"id": "TC-ATT-009", "title": "Shift master assignment & roster changes", "scenario": "1. Assign Night Shift to employee", "expectedResult": "Shift bounds adjust from 09:00 to 22:00", "actualResult": "Shift bounds updated successfully", "status": "PASSED"},
        {"id": "TC-ATT-010", "title": "Concurrent check-in duplicate prevention", "scenario": "1. Trigger two simultaneous punches", "expectedResult": "Database lock allows only 1 check-in", "actualResult": "Second punch rejected with 409 Conflict", "status": "PASSED"}
    ]'::jsonb,
    '[
        {"bugId": "BUG-ATT-101", "title": "Mobile Safari Camera Stream Freeze", "description": "Biometric kiosk camera feed freezes on mobile Safari after 2 seconds of playback.", "severity": "HIGH", "status": "OPEN"},
        {"bugId": "BUG-ATT-102", "title": "Overtime Badge text wrap on small mobile screen", "description": "Overtime text wraps slightly on 360px width viewport.", "severity": "LOW", "status": "FIXED"}
    ]'::jsonb,
    '1. PostgreSQL Attendance transactional lock tested under high concurrency.\n2. Biometric PIN authorization performs with sub-50ms latency.\n3. Mobile Safari camera stream issue logged as BUG-ATT-101 for frontend optimization.\n4. Overall test pass rate is 90%, meeting quality gate criteria.',
    'Rahul Verma', 'Sarah Jenkins', 'Sarah Jenkins', 'Sarah Jenkins'
) ON CONFLICT (id) DO NOTHING;
