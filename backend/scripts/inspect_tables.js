import { hrmsPool, crmPool } from '../db/pool.js';

async function main() {
  const hrmsTables = await hrmsPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('HRMS Tables:', hrmsTables.rows.map(r => r.table_name).sort());
  const crmTables = await crmPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('CRM Tables:', crmTables.rows.map(r => r.table_name).sort());
  
  // Inspect projects schema
  const projCols = await hrmsPool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects'");
  console.log('\nHRMS projects columns:', projCols.rows);

  const projRows = await hrmsPool.query("SELECT * FROM projects LIMIT 5");
  console.log('\nHRMS projects sample rows:', projRows.rows);

  // Inspect employees
  const emps = await hrmsPool.query("SELECT emp_code, name, designation, department, status FROM employees ORDER BY emp_code LIMIT 20");
  console.log('\nHRMS Employees sample:', emps.rows);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
