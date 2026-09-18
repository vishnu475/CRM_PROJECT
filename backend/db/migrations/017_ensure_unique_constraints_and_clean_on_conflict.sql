-- =========================================================================
-- MIGRATION 017: ENSURE UNIQUE CONSTRAINTS FOR ON CONFLICT / UPSERT CLAUSES
-- =========================================================================

-- 1. Ensure group_members has UNIQUE (group_id, employee_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'group_members' AND c.conname = 'unique_group_employee'
    ) THEN
        -- Deduplicate if any exact (group_id, employee_id) duplicates exist
        DELETE FROM group_members a USING group_members b
        WHERE a.ctid < b.ctid AND a.group_id = b.group_id AND a.employee_id = b.employee_id;

        ALTER TABLE group_members ADD CONSTRAINT unique_group_employee UNIQUE (group_id, employee_id);
    END IF;
END $$;

-- 2. Ensure task_member_assignments has UNIQUE (task_id, employee_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'task_member_assignments' AND c.conname = 'unique_task_employee'
    ) THEN
        DELETE FROM task_member_assignments a USING task_member_assignments b
        WHERE a.ctid < b.ctid AND a.task_id = b.task_id AND a.employee_id = b.employee_id;

        ALTER TABLE task_member_assignments ADD CONSTRAINT unique_task_employee UNIQUE (task_id, employee_id);
    END IF;
END $$;

-- 3. Ensure employee_bank_details has UNIQUE (employee_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'employee_bank_details' AND c.conname = 'unique_employee_bank'
    ) THEN
        DELETE FROM employee_bank_details a USING employee_bank_details b
        WHERE a.ctid < b.ctid AND a.employee_id = b.employee_id;

        ALTER TABLE employee_bank_details ADD CONSTRAINT unique_employee_bank UNIQUE (employee_id);
    END IF;
END $$;

-- 4. Ensure employee_statutory has UNIQUE (employee_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'employee_statutory' AND c.conname = 'unique_employee_statutory'
    ) THEN
        DELETE FROM employee_statutory a USING employee_statutory b
        WHERE a.ctid < b.ctid AND a.employee_id = b.employee_id;

        ALTER TABLE employee_statutory ADD CONSTRAINT unique_employee_statutory UNIQUE (employee_id);
    END IF;
END $$;

-- 5. Ensure leave_balances has UNIQUE (employee_id, leave_type_name, year)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'leave_balances' AND c.conname = 'unique_emp_leave_name_year'
    ) THEN
        ALTER TABLE leave_balances ADD CONSTRAINT unique_emp_leave_name_year UNIQUE (employee_id, leave_type_name, year);
    END IF;
END $$;
