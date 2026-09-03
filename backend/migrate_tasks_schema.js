import { pool } from './db/pool.js';

async function migrateTasks() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        project_name VARCHAR(150),
        assigned_to VARCHAR(50),
        assigned_by VARCHAR(100) DEFAULT 'Manager',
        priority VARCHAR(50) DEFAULT 'Medium',
        due_date DATE,
        description TEXT,
        status VARCHAR(50) DEFAULT 'To Do',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Feature Development';
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 8;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress_percent INT DEFAULT 0;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]';
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags VARCHAR(255) DEFAULT 'Frontend, Backend';

      -- Seed diverse realistic sample tasks if low
      INSERT INTO tasks (id, title, project_name, assigned_to, assigned_by, priority, due_date, description, status, category, estimated_hours, progress_percent, tags)
      VALUES 
        ('TSK-101', 'Optimize Salary Disbursal API & Provider Latency', 'Payroll Automation', 'EMP-009', 'Engineering Lead', 'High', CURRENT_DATE + INTERVAL '2 days', 'Refactor database connection pool and streamline bank reference generation.', 'In Progress', 'Backend API', 12, 60, 'Payroll, API, Performance'),
        ('TSK-102', 'Design Interactive 12-Month Salary Timeline Hub', 'ERP ESS Portal', 'EMP-009', 'Product Manager', 'High', CURRENT_DATE + INTERVAL '4 days', 'Implement month cards with real-time credit status, breakdown modals, and PDF exports.', 'Completed', 'UI/UX Design', 16, 100, 'Frontend, UI, ESS'),
        ('TSK-103', 'Automate Monthly Attendance Lock Verification', 'HRMS Core', 'EMP-009', 'HR Director', 'Critical', CURRENT_DATE + INTERVAL '1 days', 'Verify LOP count calculations against attendance records before payroll run calculations.', 'In Review', 'Quality Assurance', 8, 85, 'Attendance, LOP, Security'),
        ('TSK-104', 'Multi-Currency GL Disbursal Integration', 'Finance Hub', 'EMP-009', 'Finance Controller', 'Medium', CURRENT_DATE + INTERVAL '7 days', 'Support cross-border multi-currency salary transfers with live conversion rates.', 'To Do', 'Feature Development', 20, 0, 'Accounting, GL, Banking')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Tasks table schema upgraded & seeded successfully in PostgreSQL!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrateTasks();
