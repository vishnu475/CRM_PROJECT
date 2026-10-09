import { hrmsPool, crmPool } from '../db/pool.js';

async function migrate() {
  console.log('--- Starting Task & Project Workflow Database Migration ---');

  // 1. Ensure HRMS project_groups table
  await hrmsPool.query(`
    CREATE TABLE IF NOT EXISTS project_groups (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      project_id VARCHAR(50) NOT NULL,
      team_head_id VARCHAR(50) NOT NULL,
      team_head_name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ project_groups table ready');

  // 2. Ensure HRMS group_members table
  await hrmsPool.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      id VARCHAR(50) PRIMARY KEY,
      group_id VARCHAR(50) NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
      employee_id VARCHAR(50) NOT NULL,
      employee_name VARCHAR(100),
      role VARCHAR(50) DEFAULT 'Member',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ group_members table ready');

  // 3. Ensure HRMS task_member_assignments table
  await hrmsPool.query(`
    CREATE TABLE IF NOT EXISTS task_member_assignments (
      id VARCHAR(50) PRIMARY KEY,
      task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      group_id VARCHAR(50),
      employee_id VARCHAR(50) NOT NULL,
      employee_name VARCHAR(100),
      employee_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
      employee_progress INT DEFAULT 0,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ task_member_assignments table ready');

  // 4. Alter tasks table in HRMS DB
  await hrmsPool.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'INDIVIDUAL';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_name VARCHAR(150);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_weightage NUMERIC DEFAULT 25.0;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repository_url TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_target_date DATE;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval_comment TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS video_url TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reference_link TEXT;
  `);
  console.log('✅ tasks table columns updated');

  // 5. Ensure projects table columns in both HRMS & CRM DB
  for (const p of [hrmsPool, crmPool]) {
    await p.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50),
        name VARCHAR(150) NOT NULL,
        client VARCHAR(150),
        customer_id VARCHAR(50),
        source_lead_id VARCHAR(50),
        source_opportunity_id VARCHAR(50),
        project_requirement TEXT,
        project_notes TEXT,
        project_manager VARCHAR(100),
        start_date DATE,
        end_date DATE,
        budget NUMERIC(15,2) DEFAULT 0,
        spent NUMERIC(15,2) DEFAULT 0,
        progress INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Not Started',
        priority VARCHAR(50) DEFAULT 'Medium',
        weightage NUMERIC DEFAULT 100.0,
        repository_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await p.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS weightage NUMERIC DEFAULT 100.0;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS repository_url TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS requirement_documents JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_links JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_requirement TEXT;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager TEXT;
    `);
  }
  console.log('✅ projects table columns verified in HRMS & CRM');

  // 6. Seed/Ensure Master Projects in CRM & HRMS: CMS, CRM, HPS, E-Commerce, etc.
  const sampleProjects = [
    {
      id: 'PRJ-CMS',
      code: 'CMS',
      name: 'CMS Project',
      client: 'Media & Publishing Corp',
      projectRequirement: 'Enterprise Headless Content Management System with multi-tenant API, markdown rendering, media management, and role-based publishing workflows.',
      projectManager: 'Sarah Jenkins',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      weightage: 100.0,
      repositoryUrl: 'https://github.com/company/cms',
      status: 'In Progress'
    },
    {
      id: 'PRJ-CRM',
      code: 'CRM',
      name: 'CRM Project',
      client: 'Sales Growth Enterprise',
      projectRequirement: 'Sales pipeline automation, deal tracking, omnichannel leads conversion, and customer 360 analytics.',
      projectManager: 'Michael Vance',
      startDate: '2026-08-15',
      endDate: '2026-11-30',
      weightage: 100.0,
      repositoryUrl: 'https://github.com/company/crm-suite',
      status: 'In Progress'
    },
    {
      id: 'PRJ-HPS',
      code: 'HPS',
      name: 'HPS Project',
      client: 'Healthcare Partner Services',
      projectRequirement: 'Hospital Patient Scheduling, electronic medical record sync, and doctor consultation portal.',
      projectManager: 'Priya Sharma',
      startDate: '2026-07-01',
      endDate: '2026-12-31',
      weightage: 100.0,
      repositoryUrl: 'https://github.com/company/hps-health',
      status: 'In Progress'
    },
    {
      id: 'PRJ-ECOM',
      code: 'E-Commerce',
      name: 'E-Commerce Project',
      client: 'Global Retailers Ltd',
      projectRequirement: 'High-throughput inventory catalog, multi-currency checkout, payment gateway integration, and shipping API webhooks.',
      projectManager: 'Emma Watson',
      startDate: '2026-09-10',
      endDate: '2026-12-15',
      weightage: 100.0,
      repositoryUrl: 'https://github.com/company/ecommerce-platform',
      status: 'Planning'
    }
  ];

  for (const prj of sampleProjects) {
    for (const pool of [hrmsPool, crmPool]) {
      await pool.query(
        `INSERT INTO projects (
          id, code, name, client, project_requirement, project_manager, 
          start_date, end_date, weightage, repository_url, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          client = EXCLUDED.client,
          project_requirement = COALESCE(projects.project_requirement, EXCLUDED.project_requirement),
          start_date = COALESCE(projects.start_date, EXCLUDED.start_date),
          end_date = COALESCE(projects.end_date, EXCLUDED.end_date),
          weightage = COALESCE(projects.weightage, EXCLUDED.weightage),
          repository_url = COALESCE(projects.repository_url, EXCLUDED.repository_url)`,
        [
          prj.id, prj.code, prj.name, prj.client, prj.projectRequirement, prj.projectManager,
          prj.startDate, prj.endDate, prj.weightage, prj.repositoryUrl, prj.status
        ]
      );
    }
  }
  console.log('✅ Master projects (CMS, CRM, HPS, E-Commerce) seeded & synchronized in both databases');

  // 7. Seed Group: CMS Development Team
  // Members: EMP-006 (Karthik / Team Head), EMP-007 (Mohan), EMP-008 (Satya), EMP-009 (Ramesh), EMP-010 (Hps)
  const cmsGroupId = 'GRP-CMS-01';
  await hrmsPool.query(`
    INSERT INTO project_groups (id, name, project_id, team_head_id, team_head_name, description, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      project_id = EXCLUDED.project_id,
      team_head_id = EXCLUDED.team_head_id,
      team_head_name = EXCLUDED.team_head_name`,
    [cmsGroupId, 'CMS Development Team', 'PRJ-CMS', 'EMP-006', 'Karthik', 'Primary full-stack development group for CMS platform']
  );

  const members = [
    { empId: 'EMP-006', name: 'Karthik', role: 'Team Head' },
    { empId: 'EMP-007', name: 'Mohan', role: 'Database Architect' },
    { empId: 'EMP-008', name: 'Satya', role: 'Backend Engineer' },
    { empId: 'EMP-009', name: 'Ramesh', role: 'Frontend Engineer' },
    { empId: 'EMP-010', name: 'Hps', role: 'Product QA Specialist' }
  ];

  for (const m of members) {
    const memberId = `${cmsGroupId}_${m.empId}`;
    await hrmsPool.query(`
      INSERT INTO group_members (id, group_id, employee_id, employee_name, role, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        employee_name = EXCLUDED.employee_name,
        role = EXCLUDED.role`,
      [memberId, cmsGroupId, m.empId, m.name, m.role]
    );
  }
  console.log('✅ CMS Development Team and 5 members seeded in project_groups & group_members');

  console.log('--- Migration completed successfully ---');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
