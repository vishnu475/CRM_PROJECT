import { hrmsPool, crmPool } from '../db/pool.js';

async function setupSchema() {
  const hrmsClient = await hrmsPool.connect();
  const crmClient = await crmPool.connect();

  try {
    console.log('--- Step 1: Ensure HRMS projects table exists ---');
    await hrmsClient.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(50) PRIMARY KEY,
        project_id VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        description TEXT,
        client VARCHAR(255),
        status VARCHAR(50) DEFAULT 'In Progress',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('--- Step 2: Seed standardized projects into HRMS & CRM DB ---');
    const standardProjects = [
      { id: 'PROJECT-001', code: 'PRJ-001', name: 'HRMS Cloud Migration', client: 'Enterprise Core' },
      { id: 'PROJECT-002', code: 'PRJ-002', name: 'Payroll Automation', client: 'Finance Team' },
      { id: 'PROJECT-003', code: 'PRJ-003', name: 'Banking & Financial Ledger', client: 'Treasury & Risk' },
      { id: 'PROJECT-004', code: 'PRJ-004', name: 'CRM Revenue Expansion', client: 'Sales Operations' },
      { id: 'PROJECT-005', code: 'PRJ-005', name: 'ERP Core Suite 2.0', client: 'Global Enterprise' }
    ];

    for (const p of standardProjects) {
      // HRMS
      await hrmsClient.query(`
        INSERT INTO projects (id, project_id, name, code, client, status)
        VALUES ($1, $1, $2, $3, $4, 'In Progress')
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, code = EXCLUDED.code, client = EXCLUDED.client, updated_at = CURRENT_TIMESTAMP;
      `, [p.id, p.name, p.code, p.client]);

      // CRM
      await crmClient.query(`
        INSERT INTO projects (id, code, name, client, status)
        VALUES ($1, $2, $3, $4, 'In Progress')
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, code = EXCLUDED.code, client = EXCLUDED.client, updated_at = CURRENT_TIMESTAMP;
      `, [p.id, p.code, p.name, p.client]);
    }

    console.log('--- Step 3: Enhance tasks table in HRMS DB ---');
    await hrmsClient.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_id VARCHAR(50);
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_employee_id VARCHAR(50);
    `);

    // Add indexes for high-speed join & lookups
    await hrmsClient.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_emp ON tasks(assigned_to_employee_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);

    console.log('✅ Schema enhancements and standard project seed completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema setup error:', err);
    process.exit(1);
  } finally {
    hrmsClient.release();
    crmClient.release();
  }
}

setupSchema();
