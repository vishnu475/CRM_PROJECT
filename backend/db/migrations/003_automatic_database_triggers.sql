-- Automatic PostgreSQL Triggers & Stored Functions for Cascade Table-to-Table Updates

-- ====================================================
-- 1. FUNCTION: Auto Onboard New Employee (Bank, Statutory, Leave Balances, Shift History)
-- ====================================================
CREATE OR REPLACE FUNCTION fn_auto_onboard_employee()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Auto Create Bank Details if missing
    INSERT INTO employee_bank_details (id, employee_id, bank_name, account_number, ifsc_code)
    VALUES (
        'BANK-' || NEW.emp_code,
        NEW.emp_code,
        'HDFC Bank',
        COALESCE(NEW.bank_account, '98765432101'),
        COALESCE(NEW.ifsc_code, 'HDFC0001234')
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Auto Create Statutory Details if missing
    INSERT INTO employee_statutory (id, employee_id, pan_number, uan_number)
    VALUES (
        'STAT-' || NEW.emp_code,
        NEW.emp_code,
        COALESCE(NEW.pan_number, 'ABCDE1234F'),
        COALESCE(NEW.uan_number, '100987654321')
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Auto Allocate Annual Leave Balances (CL: 12, SL: 10, PL: 15)
    INSERT INTO leave_balances (id, employee_id, leave_type_id, year, allocated, used, balance)
    VALUES 
    ('LB-CL-' || NEW.emp_code, NEW.emp_code, 'lt-cl', EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 12, 0, 12),
    ('LB-SL-' || NEW.emp_code, NEW.emp_code, 'lt-sl', EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 10, 0, 10),
    ('LB-PL-' || NEW.emp_code, NEW.emp_code, 'lt-pl', EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 15, 0, 15)
    ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

    -- 4. Auto Assign Default General Shift History
    INSERT INTO employee_shift_history (id, employee_id, shift_id, effective_from)
    VALUES ('SHIST-' || NEW.emp_code || '-' || CURRENT_DATE, NEW.emp_code, 'shift-gen', CURRENT_DATE)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_onboard_employee ON employees;
CREATE TRIGGER trg_auto_onboard_employee
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION fn_auto_onboard_employee();


-- ====================================================
-- 2. FUNCTION: Auto Log Department Transfer Audit History
-- ====================================================
CREATE OR REPLACE FUNCTION fn_auto_log_employee_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Detect Department or Designation changes
    IF (OLD.department IS DISTINCT FROM NEW.department) OR (OLD.designation IS DISTINCT FROM NEW.designation) THEN
        INSERT INTO employee_shift_history (id, employee_id, shift_id, effective_from)
        VALUES (
            'TRF-' || NEW.emp_code || '-' || Date_Part('epoch', NOW())::BIGINT,
            NEW.emp_code,
            'shift-gen',
            CURRENT_DATE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_log_employee_transfer ON employees;
CREATE TRIGGER trg_auto_log_employee_transfer
AFTER UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION fn_auto_log_employee_transfer();


-- ====================================================
-- 3. FUNCTION: Auto Deactivate Exited Employee Permissions
-- ====================================================
CREATE OR REPLACE FUNCTION fn_auto_handle_employee_exit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Exited' AND OLD.status != 'Exited' THEN
        -- Zero out active leave balance
        UPDATE leave_balances SET balance = 0 WHERE employee_id = NEW.emp_code;
        -- Deactivate associated user account if exists
        UPDATE users SET is_active = FALSE WHERE employee_id = NEW.emp_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_handle_employee_exit ON employees;
CREATE TRIGGER trg_auto_handle_employee_exit
AFTER UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION fn_auto_handle_employee_exit();
