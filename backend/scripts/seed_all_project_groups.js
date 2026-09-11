import { hrmsPool, crmPool } from '../db/pool.js';

async function seedAllProjectGroups() {
  console.log('--- Seeding Project Groups for All Projects ---');

  // 1. Get all projects from CRM and HRMS
  const projectsRes = await crmPool.query('SELECT id, code, name FROM projects');
  const projects = projectsRes.rows;
  console.log(`Found ${projects.length} projects.`);

  // 2. Get active employees
  const empRes = await hrmsPool.query('SELECT id, emp_code, name, designation, department FROM employees');
  const employees = empRes.rows;
  console.log(`Found ${employees.length} employees.`);

  if (employees.length === 0) {
    console.error('No employees found to assign to groups!');
    process.exit(1);
  }

  // Pre-defined member distributions to give variety to each group
  for (let pIdx = 0; pIdx < projects.length; pIdx++) {
    const proj = projects[pIdx];
    const cleanCode = (proj.code || proj.id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const groupId = `GRP-${cleanCode}-01`;
    const groupName = `${proj.name} Development Team`;

    // Rotate team heads among senior employees
    const teamHeadIdx = pIdx % employees.length;
    const teamHead = employees[teamHeadIdx];

    console.log(`Configuring Group: ${groupName} (${groupId}) for project ${proj.id}...`);

    // Insert or update project_groups
    await hrmsPool.query(`
      INSERT INTO project_groups (id, name, project_id, team_head_id, team_head_name, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name,
          project_id = EXCLUDED.project_id,
          team_head_id = EXCLUDED.team_head_id,
          team_head_name = EXCLUDED.team_head_name,
          description = EXCLUDED.description
    `, [
      groupId,
      groupName,
      proj.id,
      teamHead.emp_code || teamHead.id,
      teamHead.name,
      `Core cross-functional delivery group for ${proj.name}`
    ]);

    // Select 4-5 members for this team
    const teamMembers = [];
    teamMembers.push({ ...teamHead, role: 'Team Head', isHead: true });

    for (let mIdx = 1; mIdx <= 4; mIdx++) {
      const emp = employees[(teamHeadIdx + mIdx) % employees.length];
      if (!teamMembers.some(tm => (tm.emp_code || tm.id) === (emp.emp_code || emp.id))) {
        const roles = ['Frontend Lead', 'Backend Engineer', 'Database Architect', 'QA Specialist', 'Full-Stack Developer'];
        teamMembers.push({ ...emp, role: roles[mIdx - 1], isHead: false });
      }
    }

    // Insert group members
    for (const member of teamMembers) {
      const gmId = `GM-${groupId}-${member.emp_code || member.id}`;
      await hrmsPool.query(`
        INSERT INTO group_members (id, group_id, employee_id, employee_name, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
        SET role = EXCLUDED.role,
            employee_name = EXCLUDED.employee_name
      `, [
        gmId,
        groupId,
        member.emp_code || member.id,
        member.name,
        member.role
      ]);
    }

    console.log(`  ✅ Group ${groupId} ready with ${teamMembers.length} members (Head: ${teamHead.name})`);
  }

  console.log('\n--- ALL PROJECT GROUPS SUCCESSFULLY SEEDED ---');
  process.exit(0);
}

seedAllProjectGroups().catch(e => {
  console.error('Failed to seed project groups:', e);
  process.exit(1);
});
