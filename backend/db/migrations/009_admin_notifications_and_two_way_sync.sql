-- ============================================================
-- Migration 009: Admin Notifications & Complete 2-Way Sync Engine
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50),
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Normal',
    target_role VARCHAR(50) DEFAULT 'HRManager',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_emp ON admin_notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_admin_notif_role ON admin_notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_admin_notif_created ON admin_notifications(created_at DESC);

-- Ensure employees table has indexes for performance
CREATE INDEX IF NOT EXISTS idx_emp_code ON employees(emp_code);
