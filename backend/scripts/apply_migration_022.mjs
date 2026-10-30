// Migration 022: Project Allocation System
import { hrmsPool } from '../db/pool.js';

async function run() {
  const client = await hrmsPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create project_allocations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_allocations (
        id VARCHAR(60) PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL,
        project_name VARCHAR(100) NOT NULL,
        employee_id VARCHAR(50) NOT NULL,
        employee_name VARCHAR(100) NOT NULL,
        module_id VARCHAR(50) NOT NULL,
        module_name VARCHAR(100) NOT NULL,
        role VARCHAR(100) DEFAULT 'Developer',
        allocation_status VARCHAR(50) DEFAULT 'ACTIVE',
        allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_project_emp_module UNIQUE (project_id, employee_id, module_id)
      )
    `);
    console.log('OK: project_allocations table');

    await client.query('CREATE INDEX IF NOT EXISTS idx_proj_alloc_project ON project_allocations(project_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_proj_alloc_emp ON project_allocations(employee_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_proj_alloc_module ON project_allocations(module_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_proj_alloc_emp_proj ON project_allocations(employee_id, project_id)');
    console.log('OK: project_allocations indexes');

    await client.query('ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS allocation_id VARCHAR(60)');
    await client.query('ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS submitted_for_testing_at TIMESTAMP WITH TIME ZONE');
    await client.query("ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS submit_note TEXT");
    await client.query("ALTER TABLE testing_requests ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(30) DEFAULT 'MANUAL'");
    console.log('OK: testing_requests new columns');

    await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS allocation_id VARCHAR(60)');
    await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50)');
    console.log('OK: tasks new columns');

    await client.query("ALTER TABLE testing_documents ADD COLUMN IF NOT EXISTS report_status VARCHAR(50) DEFAULT 'DRAFT'");
    await client.query('ALTER TABLE testing_documents ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE');
    await client.query('ALTER TABLE testing_documents ADD COLUMN IF NOT EXISTS developer_viewed BOOLEAN DEFAULT FALSE');
    console.log('OK: testing_documents new columns');

    // Ensure PRJ-001 exists
    await client.query(`
      INSERT INTO projects (id, code, name, client, status, project_manager, priority, progress, start_date, end_date, created_at, updated_at)
      VALUES ('PRJ-001', 'PRJ-001', 'HRMS ERP', 'Internal Enterprise', 'In Progress', 'Sarah Jenkins', 'High', 0,
        CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET name = 'HRMS ERP', status = 'In Progress'
    `);
    console.log('OK: PRJ-001 project');

    // Create General module
    await client.query(`
      INSERT INTO modules (id, code, name, category, status, description)
      VALUES ('MOD-GEN', 'gen_hr', 'General', 'Human Resources', 'active', 'General HR module')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('OK: MOD-GEN module');

    // Seed allocations
    await client.query(`
      INSERT INTO project_allocations (id, project_id, project_name, employee_id, employee_name, module_id, module_name, role, allocation_status)
      VALUES
        ('ALLOC-PRJ001-EMP005-ATT', 'PRJ-001', 'HRMS ERP', 'EMP-005', 'Vishnu Vardhan', 'MOD-ATT', 'Attendance', 'Lead Backend Architect', 'ACTIVE'),
        ('ALLOC-PRJ001-EMP004-REC', 'PRJ-001', 'HRMS ERP', 'EMP-004', 'Rahul Verma', 'MOD-REC', 'Recruitment', 'Senior QA Engineer', 'ACTIVE'),
        ('ALLOC-PRJ001-EMP003-PAY', 'PRJ-001', 'HRMS ERP', 'EMP-003', 'Priya Sharma', 'MOD-PAY', 'Payroll', 'Product Manager', 'ACTIVE'),
        ('ALLOC-PRJ001-EMP008-GEN', 'PRJ-001', 'HRMS ERP', 'EMP-008', 'Ramesh', 'MOD-GEN', 'General', 'Frontend Specialist', 'ACTIVE')
      ON CONFLICT (project_id, employee_id, module_id) DO UPDATE SET
        role = EXCLUDED.role,
        allocation_status = EXCLUDED.allocation_status,
        updated_at = CURRENT_TIMESTAMP
    `);
    console.log('OK: project_allocations seeded');

    // Link existing Vishnu tasks to allocation
    await client.query(`
      UPDATE tasks SET allocation_id = 'ALLOC-PRJ001-EMP005-ATT', employee_id = 'EMP-005'
      WHERE project_id = 'PRJ-001' AND (assigned_to = 'EMP-005' OR assigned_to_employee_id = 'EMP-005')
    `);
    console.log('OK: Vishnu tasks linked');

    // Link testing_requests
    await client.query(`
      UPDATE testing_requests SET allocation_id = 'ALLOC-PRJ001-EMP005-ATT', trigger_type = 'MANUAL'
      WHERE project_id = 'PRJ-001' AND developer_employee_id = 'EMP-005' AND module_id = 'MOD-ATT'
    `);
    console.log('OK: testing_requests linked');

    // Seed Ramesh tasks (0% complete)
    await client.query(`DELETE FROM tasks WHERE project_id = 'PRJ-001' AND (assigned_to_employee_id = 'EMP-008' OR assigned_to = 'EMP-008')`);
    await client.query(`
      INSERT INTO tasks (id, title, project_id, project_name, module_id, module_name, assigned_to, assigned_to_employee_id, assigned_to_name, status, progress_percent, priority, allocation_id, created_at)
      VALUES
        ('TSK-GEN-001', 'Dashboard UI layout design', 'PRJ-001', 'HRMS ERP', 'MOD-GEN', 'General', 'EMP-008', 'EMP-008', 'Ramesh', 'TODO', 0, 'Medium', 'ALLOC-PRJ001-EMP008-GEN', CURRENT_TIMESTAMP),
        ('TSK-GEN-002', 'Employee profile frontend component', 'PRJ-001', 'HRMS ERP', 'MOD-GEN', 'General', 'EMP-008', 'EMP-008', 'Ramesh', 'TODO', 0, 'Medium', 'ALLOC-PRJ001-EMP008-GEN', CURRENT_TIMESTAMP),
        ('TSK-GEN-003', 'Navigation sidebar implementation', 'PRJ-001', 'HRMS ERP', 'MOD-GEN', 'General', 'EMP-008', 'EMP-008', 'Ramesh', 'TODO', 0, 'Low', 'ALLOC-PRJ001-EMP008-GEN', CURRENT_TIMESTAMP),
        ('TSK-GEN-004', 'Mobile responsive layout', 'PRJ-001', 'HRMS ERP', 'MOD-GEN', 'General', 'EMP-008', 'EMP-008', 'Ramesh', 'TODO', 0, 'Medium', 'ALLOC-PRJ001-EMP008-GEN', CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('OK: Ramesh tasks (0%)');

    // Seed Priya tasks (3/8 = 37.5%)
    await client.query(`DELETE FROM tasks WHERE project_id = 'PRJ-001' AND (assigned_to_employee_id = 'EMP-003' OR assigned_to = 'EMP-003')`);
    await client.query(`
      INSERT INTO tasks (id, title, project_id, project_name, module_id, module_name, assigned_to, assigned_to_employee_id, assigned_to_name, status, progress_percent, priority, allocation_id, created_at)
      VALUES
        ('TSK-PAY-001', 'Salary structure configuration', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'COMPLETED', 100, 'High', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP - INTERVAL '5 days'),
        ('TSK-PAY-002', 'Payroll calculation engine', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'COMPLETED', 100, 'High', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP - INTERVAL '4 days'),
        ('TSK-PAY-003', 'Payslip PDF generation', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'COMPLETED', 100, 'High', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP - INTERVAL '3 days'),
        ('TSK-PAY-004', 'Tax deduction rules engine', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'IN_PROGRESS', 50, 'Medium', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP - INTERVAL '2 days'),
        ('TSK-PAY-005', 'Payroll approval workflow', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'TODO', 0, 'Medium', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP - INTERVAL '1 day'),
        ('TSK-PAY-006', 'Bulk salary disbursement', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'TODO', 0, 'Low', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP),
        ('TSK-PAY-007', 'Employee tax declaration form', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'TODO', 0, 'Low', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP),
        ('TSK-PAY-008', 'Integration with attendance module', 'PRJ-001', 'HRMS ERP', 'MOD-PAY', 'Payroll', 'EMP-003', 'EMP-003', 'Priya Sharma', 'TODO', 0, 'Medium', 'ALLOC-PRJ001-EMP003-PAY', CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('OK: Priya tasks (37.5%)');

    // Seed Rahul tasks (4/4 = 100%)
    await client.query(`DELETE FROM tasks WHERE project_id = 'PRJ-001' AND (assigned_to_employee_id = 'EMP-004' OR assigned_to = 'EMP-004')`);
    await client.query(`
      INSERT INTO tasks (id, title, project_id, project_name, module_id, module_name, assigned_to, assigned_to_employee_id, assigned_to_name, status, progress_percent, priority, allocation_id, created_at)
      VALUES
        ('TSK-REC-001', 'Job posting management UI', 'PRJ-001', 'HRMS ERP', 'MOD-REC', 'Recruitment', 'EMP-004', 'EMP-004', 'Rahul Verma', 'COMPLETED', 100, 'High', 'ALLOC-PRJ001-EMP004-REC', CURRENT_TIMESTAMP - INTERVAL '10 days'),
        ('TSK-REC-002', 'ATS candidate pipeline', 'PRJ-001', 'HRMS ERP', 'MOD-REC', 'Recruitment', 'EMP-004', 'EMP-004', 'Rahul Verma', 'COMPLETED', 100, 'High', 'ALLOC-PRJ001-EMP004-REC', CURRENT_TIMESTAMP - INTERVAL '9 days'),
        ('TSK-REC-003', 'Interview scheduling system', 'PRJ-001', 'HRMS ERP', 'MOD-REC', 'Recruitment', 'EMP-004', 'EMP-004', 'Rahul Verma', 'COMPLETED', 100, 'Medium', 'ALLOC-PRJ001-EMP004-REC', CURRENT_TIMESTAMP - INTERVAL '8 days'),
        ('TSK-REC-004', 'Candidate assessment forms', 'PRJ-001', 'HRMS ERP', 'MOD-REC', 'Recruitment', 'EMP-004', 'EMP-004', 'Rahul Verma', 'COMPLETED', 100, 'Medium', 'ALLOC-PRJ001-EMP004-REC', CURRENT_TIMESTAMP - INTERVAL '7 days')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('OK: Rahul tasks (100%)');

    // Testing request for Rahul Recruitment (100% done)
    await client.query(`
      INSERT INTO testing_requests (id, project_id, project_name, module_id, module_name,
          developer_employee_id, developer_employee_name, allocation_id, trigger_type,
          total_tasks, completed_tasks, pending_tasks, completion_percentage,
          status, submitted_date, submitted_for_testing_at)
        VALUES ('TR-PRJ001-REC', 'PRJ-001', 'HRMS ERP', 'MOD-REC', 'Recruitment',
          'EMP-004', 'Rahul Verma', 'ALLOC-PRJ001-EMP004-REC', 'MANUAL',
          4, 4, 0, 100.00, 'READY_FOR_TESTING', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days')
        ON CONFLICT DO NOTHING
    `);
    console.log('OK: TR-PRJ001-REC testing request');

    await client.query('COMMIT');
    console.log('\nMigration 022 COMMITTED successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await hrmsPool.end();
  }
}

run();
